import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceStatic = path.join(root, ".next/static");
const sourcePublic = path.join(root, "public");
const standaloneRoot = path.join(root, ".next/standalone");
const targetStatic = path.join(standaloneRoot, ".next/static");
const targetPublic = path.join(standaloneRoot, "public");

await mkdir(path.dirname(targetStatic), { recursive: true });
await cp(sourceStatic, targetStatic, { recursive: true, force: true });

try {
  await cp(sourcePublic, targetPublic, { recursive: true, force: true });
} catch {
  // Some builds may not have a public directory yet; that's fine.
}
