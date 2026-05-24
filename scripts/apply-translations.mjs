import { promises as fs } from "node:fs";
import path from "node:path";
import {
  replaceJsStringLiterals,
  countReplaceableJsStringLiterals,
} from "./translation-utils.mjs";

const TRANSLATION_MEMORY = path.resolve("translate/translation-memory.json");
const CHUNKS_DIR = path.resolve("site/202604testtes004v6/_next/static/chunks");

async function listChunkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

async function main() {
  const translations = JSON.parse(await fs.readFile(TRANSLATION_MEMORY, "utf8"));
  const files = await listChunkFiles(CHUNKS_DIR);
  let total = 0;

  for (const file of files) {
    const input = await fs.readFile(file, "utf8");
    const count = countReplaceableJsStringLiterals(input, translations);
    if (count === 0) continue;

    const output = replaceJsStringLiterals(input, translations);
    await fs.writeFile(file, output);
    total += count;

    console.log(`${path.relative(process.cwd(), file)}: ${count}`);
  }

  console.log(`Applied ${total} replacements from ${translations.length} translations.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
