import pkg from "../package.json";
import { write } from "bun";

const Exports = ["validation", "routing"];

const main = async () => {
  const _pkg = { ...pkg };
  const pkgFiles = new Set(pkg.files);

  for (const name of Exports) {
    _pkg.exports[`./${name}`] = {
      types: `./${name}.d.ts`,
      require: `./${name}.js`,
      import: `./dist/${name}.mjs`,
    };

    pkgFiles.add(`${name}.js`);
    pkgFiles.add(`${name}.d.ts`);
  }

  _pkg.files = Array.from(pkgFiles);

  await write("./package.json", JSON.stringify(_pkg, null, 2));
};

main();
