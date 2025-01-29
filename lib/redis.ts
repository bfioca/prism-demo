import { Redis } from 'ioredis';

// Create Redis client
const getRedisClient = () => {
  const client = new Redis(process.env.REDIS_URL!);
  return client;
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

    // Close Redis connection
    await client.quit();

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
    await client.quit();
    // If Redis fails, allow the request but log the error
    return {
      isAllowed: true,
      remaining: 0,
      reset: now + windowSize,
    };
  }
}
