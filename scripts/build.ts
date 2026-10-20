// Builds the two scripts OpenChamber loads: the service (Node ESM) and the
// docked panel (a classic IIFE, because the panel iframe cannot load modules).
// Run with Bun: `bun scripts/build.ts`. The SDK is bundled in, so the installed
// extension needs no node_modules.
import { writeFile } from 'node:fs/promises';

const build = async (entry: string, outfile: string, node: boolean): Promise<void> => {
  const result = await Bun.build({
    entrypoints: [entry],
    format: node ? 'esm' : 'iife',
    target: node ? 'node' : 'browser',
    minify: !node,
    write: false,
  });
  if (!result.success) {
    console.error(result.logs.map((log) => log.message).join('\n'));
    process.exit(1);
  }
  const header = node ? '// Built from service/*.ts by scripts/build.ts. Edit the sources, not this file.\n' : '';
  await writeFile(outfile, header + await result.outputs[0].text());
  console.log(`built ${outfile}`);
};

await build('service/main.ts', 'service/main.js', true);
await build('panel/main.ts', 'panel/main.js', false);
