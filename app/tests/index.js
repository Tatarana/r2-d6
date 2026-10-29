// Permite `node --test E:\dev\r2-d6\app\tests\` (o Node 22 nao aceita diretorio): carrega os *.test.mjs.
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
for (const f of readdirSync(__dirname).filter((n) => n.endsWith('.test.mjs'))) {
  import(require('node:url').pathToFileURL(join(__dirname, f)).href);
}
