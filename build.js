const globby = require('globby');
const mri = require('mri');
const fs = require('fs');
const { promisify } = require('util');

const read = promisify(fs.readFile);
const write = promisify(fs.writeFile);

const prog = mri(process.argv.slice(2), {
  boolean: ['watch'],
});

const dotEnvPlugin = (entryFile) => ({
  name: 'dotenv',
  setup: (build) => {
    build.onEnd(async (result) => {
      const configLine = `require('dotenv').config();`;
      const originalFile = (await read(entryFile)).toString();
      const fileJoin = build.initialOptions.minify ? `` : '\n';
      await write(entryFile, [configLine, originalFile].join(fileJoin));
    });
  },
});

(async () =>
  require('esbuild').build({
    entryPoints: (await globby(['src/**/*'])).filter((t) => !t.endsWith('.d.ts')),
    bundle: false,
    outdir: 'dist',
    platform: 'node',
    format: 'cjs',
    minify: true,
    watch: prog.watch,
    plugins: [dotEnvPlugin('dist/index.js')],
  }))();
