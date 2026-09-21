const fs = require("fs");
const path = require("path");
const readline = require("readline");

const genres = require("../src/_data/genres.js");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

(async () => {
  console.log("=== New Article: The Humanist Thoughts ===\n");

  const title = (await ask("Title: ")).trim();
  if (!title) {
    console.log("Title cannot be empty.");
    process.exit(1);
  }

  console.log(`Genres available: ${genres.join(", ")}`);
  let genre = (await ask("Genre (must match one above, or leave blank): ")).trim();
  if (genre && !genres.includes(genre)) {
    console.log(`Warning: "${genre}" is not in the genres list. It will not appear under any sidebar filter.`);
  }

  const summary = (await ask("Short summary (one or two sentences, shown on homepage): ")).trim();

  rl.close();

  const slug = slugify(title);
  const filePath = path.join(__dirname, "..", "src", "articles", `${slug}.md`);

  if (fs.existsSync(filePath)) {
    console.log(`An article with the slug "${slug}" already exists at ${filePath}`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);

  const frontMatter = [
    "---",
    `title: ${title}`,
    genre ? `genre: ${genre}` : "genre:",
    `summary: ${summary}`,
    `date: ${today}`,
    "---",
    "",
    "Write your article here.",
    ""
  ].join("\n");

  fs.writeFileSync(filePath, frontMatter);
  console.log(`\nCreated: ${filePath}`);
  console.log("Open that file, write your article in Markdown, then run:");
  console.log("  npm run build");
  console.log("  git add . && git commit -m \"Add article: " + title + "\" && git push");
})();
