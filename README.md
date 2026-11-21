# Zuzify

The official Zuzify web ecosystem: two sites, one monorepo.

- `apps/xyz`: primary home for Zuzify and Zuzu products.
- `apps/lol`: experimental community playground.
- `packages/ui`: reusable monochrome design system.
- `packages/catalog`: single source of truth for product links.

Develop locally with `npm install` then `npm run dev:xyz` or `npm run dev:lol`.

Deploy each app as its own Vercel project (`apps/xyz` or `apps/lol` root directory).