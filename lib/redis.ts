import { Redis } from 'ioredis';

// Maintain a single Redis client instance so we don\'t create a new
// connection for every request. Configure a short connection timeout so that
// requests fail fast instead of hanging for many seconds when Redis is
// unreachable (which was causing noticeable UI delays).
let redisClient: Redis | null = null;

const getRedisClient = () => {
  if (redisClient) return redisClient;

  // A 1 second connect timeout keeps the UX snappy even if Redis is down.
  redisClient = new Redis(process.env.REDIS_URL!, {
    connectTimeout: 1000, // fail fast if Redis can\'t be reached
    maxRetriesPerRequest: 1, // don\'t keep retrying each command
    enableOfflineQueue: false, // immediately error commands when not connected
  });

  // Log connection errors to help with debugging, but don\'t crash the app.
  redisClient.on('error', (err) => {
    console.error('[redis] connection error:', err);
  });

  return redisClient;
};

// Rate limiting functions
export async function checkRateLimit(userId: string, ip: string): Promise<{
  isAllowed: boolean;
  remaining: number;
  reset: number;
}> {
  const client = getRedisClient();
  const now = Date.now();
  const windowSize = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const maxRequests = 100; // Maximum requests per day

  if (client.status !== 'ready') {
    console.warn('[redis] client not ready, skipping rate-limit check');
    return {
      isAllowed: true,
      remaining: 0,
      reset: now + windowSize,
    };
  }

  try {
    // Use Redis transaction to ensure atomicity
    const multi = client.multi();

    // Check user-based limit
    const userKey = `ratelimit:user:${userId}`;
    multi.zremrangebyscore(userKey, 0, now - windowSize); // Remove old entries
    multi.zcard(userKey); // Get current count
    multi.zadd(userKey, now, now.toString()); // Add current request
    multi.pexpire(userKey, windowSize); // Set expiry

    // Check IP-based limit
    const ipKey = `ratelimit:ip:${ip}`;
    multi.zremrangebyscore(ipKey, 0, now - windowSize);
    multi.zcard(ipKey);
    multi.zadd(ipKey, now, now.toString());
    multi.pexpire(ipKey, windowSize);

    const results = await multi.exec();
    if (!results) throw new Error('Redis transaction failed');

    // Get counts from results (index 1 and 5 contain the zcards)
    const userCount = (results[1][1] as number) + 1; // Add 1 for current request
    const ipCount = (results[5][1] as number) + 1;

    // Use the higher of the two counts
    const count = Math.max(userCount, ipCount);
    const remaining = Math.max(0, maxRequests - count);
    const reset = now + windowSize;

    return {
      isAllowed: count <= maxRequests,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Do not close the shared Redis connection – keep it around for future
    // requests to avoid reconnect overhead.
    return {
      isAllowed: true,
      remaining: 0,
      reset: now + windowSize,
    };
  }
}
