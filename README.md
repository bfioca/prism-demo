# PRISM Demo

A demonstration implementation of the PRISM (Perspective Reasoning for Integrated Synthesis and Mediation) framework, showcasing how multiple moral perspectives can be integrated into AI systems for better alignment with human values.

This project is built on top of [Vercel's AI Chatbot template](https://vercel.com/templates/next.js/nextjs-ai-chatbot), extending it with PRISM's multi-perspective reasoning capabilities. We thank the Vercel team for providing this excellent foundation for AI applications.

## About PRISM

PRISM is a multiple-perspective framework for addressing persistent challenges in AI alignment such as conflicting human values and specification gaming. The framework is grounded in cognitive science and moral psychology, organizing moral concerns into seven "basis worldviews" that capture distinct dimensions of human moral cognition.

Key aspects of PRISM demonstrated in this project:
- 🧠 Seven basis worldviews from survival-focused to integrative perspectives
- ⚖️ Pareto-inspired optimization for balancing competing priorities
- 🔄 Structured workflow for viewpoint elicitation and synthesis
- 🤝 Transparent conflict mediation process
- 🎯 Context validation for robust real-world application

Learn more about the PRISM framework at [prismframework.ai](https://prismframework.ai)

## Features

### Core PRISM Features
- 🤖 Multi-perspective AI chat interface implementing PRISM's worldview analysis
- 🎭 Dynamic perspective switching and synthesis
- 📊 Transparent reasoning and trade-off documentation
- 🔄 Real-time updates and streaming responses
- 📄 Document processing and analysis

### PRISM Implementation Details
The core PRISM implementation can be found in the `lib/ai/prism` directory:

- `lib/ai/prism/index.ts` - Main PRISM response processing logic
- `lib/ai/prism/prompts/` - Contains all prompt templates:
  - `worldviews.ts` - The seven basis worldviews definitions
  - `perspective.ts` - Prompts for generating perspective-specific responses
  - `synthesize.ts` - Prompts for multi-perspective synthesis
  - `conflict.ts` - Prompts for identifying conflicts between perspectives
  - `mediations.ts` - Prompts for mediating between conflicting viewpoints

The PRISM workflow follows these steps:
1. Generate responses from each worldview perspective
2. Create a baseline response and initial synthesis
3. Evaluate potential conflicts between perspectives
4. Mediate between conflicting viewpoints
5. Generate final synthesized response

Each step streams its progress and intermediate results to the UI for full transparency.

### Technical Features
- 🔐 Secure authentication with Google OAuth and email/password
- 💾 PostgreSQL database for persistent storage
- 🚀 Redis caching for performance
- 📱 Responsive design with Tailwind CSS
- 🌙 Dark mode support
- 🎨 Modern UI with Radix UI components

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Caching
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [Radix UI](https://www.radix-ui.com/) - UI components

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- PostgreSQL database
- Redis instance
- Google OAuth credentials (optional, for Google sign-in)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/PioneerSquareLabs/prism-demo
cd prism-demo
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration.

4. Run database migrations:
```bash
pnpm db:migrate
```

5. Start the development server:
```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.example` for required environment variables.

## Database Management

Available database commands:
```bash
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:studio     # Open Drizzle Studio
pnpm db:push       # Push schema changes
pnpm db:pull       # Pull schema changes
```

## License and Attribution

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

This project is built on top of the [Next.js AI Chatbot template](https://vercel.com/templates/next.js/nextjs-ai-chatbot) created by Vercel. The original template is Copyright 2024 Vercel, Inc. and is also licensed under the Apache License 2.0. We are grateful to the Vercel team for providing this excellent foundation for AI applications.

Our modifications and additions, particularly the PRISM framework implementation, are Copyright 2024 Pioneer Square Labs.

## Run

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

