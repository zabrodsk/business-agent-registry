import { build } from 'esbuild';
await build({
  entryPoints: ['src/registry-cli.ts'], outfile: 'dist/registry.mjs',
  bundle: true, platform: 'node', format: 'esm', target: 'node18',
  banner: { js: '#!/usr/bin/env node' }, logLevel: 'warning',
});
