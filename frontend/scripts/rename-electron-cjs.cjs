const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "dist-electron");

fs.readdirSync(dir)
  .filter((f) => f.endsWith(".js"))
  .forEach((f) => {
    fs.renameSync(
      path.join(dir, f),
      path.join(dir, f.replace(/\.js$/, ".cjs")),
    );
  });
