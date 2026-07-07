# Forge

Pre-launch marketing site for **Forge** by **Forged In Life** — a values-first dating platform.

- **Product:** Forge
- **Company:** Forged In Life
- **Domain:** [forgedinlife.com](https://forgedinlife.com)

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can also use the local helper script:

```bash
./start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- Supabase (waitlist and feedback data)
- Resend (transactional email)

## Required environment variables

Set these in your local `.env` file or deployment environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
