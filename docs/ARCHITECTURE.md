# Architecture

This repository uses npm workspaces to share React UI and a curated content catalog between two separately deployed Vite applications.

- `apps/xyz`: product home and directory with lightweight client-side routing.
- `apps/lol`: independent experimental destination, same visual system.
- `packages/catalog`: typed product catalog, categories, flags and verified links.
- `packages/ui`: composable site shell, cards, directory, snow canvas, command palette, hooks and styles.

The websites contain no private keys, account databases or authentication. Links go to public repositories or domains when confirmed. Status labels indicate product maturity rather than live service availability. All effects are optional, respect reduced-motion and are lightweight.
