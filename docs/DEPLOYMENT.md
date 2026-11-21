# Vercel deployment

1. Connect `taithedev/Zuzify` as two Vercel projects in the **same Vercel team that owns the domains**.
2. Project `zuzify-xyz`: root directory `apps/xyz`, framework Vite, build command `npm run build`, output `dist`.
3. Project `zuzify-lol`: root directory `apps/lol`, framework Vite, build command `npm run build`, output `dist`.
4. Enable files outside root directory for both, because shared workspaces are in `packages/`.
5. Bind `zuzify.xyz` to `zuzify-xyz` and `zuzify.lol` to `zuzify-lol`.
6. Confirm each project has a READY production deployment and both domains show Valid Configuration.
7. Optional: redirect `www.zuzify.xyz` to `zuzify.xyz`.
8. Do not claim `zuzuos.lol` is connected unless separately purchased and configured.

A GitHub push to main triggers deployment for both sites after integration.
