# Zuzify Web Ecosystem

Official monorepo for **zuzify.xyz** and **zuzify.lol**.

## Applications

- `apps/xyz`: Zuzify home, complete searchable product catalog, project pages, about, developers, privacy and terms.
- `apps/lol`: experimental community site with visual playground.
- `packages/ui`: shared React components, motion settings, keyboard command menu and accessibility.
- `packages/catalog`: structured project data.

## Development

Requires Node.js 22+ and npm.

```bash
npm install
npm run dev:xyz
npm run dev:lol
npm run build
npm run validate
```

## Deployment

Create **two Vercel projects** connected to the same GitHub repository.
Set root directory to `apps/xyz` for the main site, and `apps/lol` for the community site.
Both are Vite deployments. Assign `zuzify.xyz` and `zuzify.lol` respectively. More in `docs/DEPLOYMENT.md`.

## Adding projects

Edit `packages/catalog/src/products.ts`. External URLs should be verified and public. Unreleased products can have no external URL.

Zuzify is an independent user project. Project statuses in the catalog are curated labels, not live uptime signals.
