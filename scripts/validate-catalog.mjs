import { readFileSync } from "node:fs";
import { join } from "node:path";

const content = readFileSync(join(process.cwd(), "packages/catalog/src/products.ts"), "utf8");
const slugs = [...content.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
const duplicates = slugs.filter((slug, idx) => slugs.indexOf(slug) !== idx);
if (!slugs.length || duplicates.length) {
  console.error("Catalog must contain unique project slugs.", duplicates);
  process.exit(1);
}
console.log("Catalog validates:", slugs.length, "unique products");
