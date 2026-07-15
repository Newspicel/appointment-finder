# appointment-finder

Find a time that works for everyone. Create a session, share the link, and each person marks the days (optionally with times) they are available. Days where everyone has time are highlighted.

Live at [appointment.newspicel.dev](https://appointment.newspicel.dev).

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, Vite)
- Cloudflare Workers with one SQLite-backed Durable Object per session ([Drizzle ORM](https://orm.drizzle.team))
- Tailwind CSS 4 + shadcn/ui
- No accounts: identity is a cookie, sessions are UUID links

## Development

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm check        # tsgo, biome, oxlint, vitest
pnpm lint:react   # react-doctor
```

## Deploy

Deployed to Cloudflare Workers from this repository. The Durable Object needs no manual provisioning; `wrangler.jsonc` declares the binding, migration, and the custom domain route.

```bash
pnpm deploy
```

After changing `src/db/schema.ts`, run `pnpm drizzle-kit generate` to regenerate the bundled migrations.
