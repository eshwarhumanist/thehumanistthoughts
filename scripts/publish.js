const { execSync } = require("child_process");

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
}

(async () => {
  console.log("=== Publishing The Humanist Thoughts ===");

  try {
    run("npx @11ty/eleventy");
  } catch (err) {
    console.log("\nBuild failed. Fix the error above before publishing.");
    process.exit(1);
  }

  let status;
  try {
    status = require("child_process").execSync("git status --porcelain -- src public").toString().trim();
  } catch (err) {
    console.log("\nCould not check git status.");
    process.exit(1);
  }

  if (!status) {
    console.log("\nNo new or changed articles to publish. Nothing to do.");
    process.exit(0);
  }

  console.log("\nChanges to publish:");
  console.log(status);

  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");

  try {
    run("git add src public");
    run(`git commit -m "Publish update - ${timestamp}"`);
    run("git push");
  } catch (err) {
    console.log("\nPublish failed at the git step. See the error above.");
    process.exit(1);
  }

  console.log("\nPublished. The live site will update in a minute or two:");
  console.log("https://serenedissent.github.io/thehumanistthoughts/");
})();
