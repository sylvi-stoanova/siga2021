import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("package uses native Next.js without Cloudflare or Vinext build dependencies", async () => {
  const pkg = JSON.parse(await read("package.json"));
  const packages = { ...pkg.dependencies, ...pkg.devDependencies };

  assert.equal(pkg.scripts.build, "next build");
  assert.equal(packages.next, "16.2.6");

  for (const dependency of [
    "@cloudflare/vite-plugin",
    "@openai/sites-vite-plugin",
    "drizzle-kit",
    "drizzle-orm",
    "vinext",
    "vite",
    "wrangler",
  ]) {
    assert.equal(packages[dependency], undefined, `${dependency} must not be installed`);
  }
});

test("n8n webhook remains server-only", async () => {
  const page = await read("app/page.tsx");
  const route = await read("app/api/contact/route.ts");
  const example = await read(".env.example");

  assert.match(page, /fetch\("\/api\/contact"/);
  assert.doesNotMatch(page, /NEXT_PUBLIC_N8N|process\.env/);
  assert.match(route, /process\.env\.N8N_WEBHOOK_URL/);
  assert.match(example, /^N8N_WEBHOOK_URL=$/m);
  assert.doesNotMatch(example, /https?:\/\//);
});

test("required visual assets and translations are present", async () => {
  const frames = (await readdir(new URL("public/frames/main/", root))).filter((name) => name.endsWith(".jpg"));

  assert.equal(frames.length, 100);
  assert.equal(frames[0], "frame-000.jpg");
  assert.equal(frames.at(-1), "frame-099.jpg");

  for (const language of ["de", "en", "bg"]) {
    const locale = JSON.parse(await read(`locales/${language}.json`));
    assert.ok(locale.hero);
    assert.ok(locale.film);
  }

  await access(new URL("public/assets/siga2021-master-clean.png", root));
});

test("obsolete Cloudflare runtime entry points are absent", async () => {
  for (const path of [
    "vite.config.ts",
    "drizzle.config.ts",
    ".openai/hosting.json",
    "worker/index.ts",
    "db/index.ts",
  ]) {
    await assert.rejects(access(new URL(path, root)));
  }
});
