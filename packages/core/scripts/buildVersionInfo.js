import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.writeFileSync(
  path.resolve(__dirname, '../src/versionInfo.ts'),
  `
const version = '${process.env.npm_package_version}';
const versionBuild = '2020-0101-1';

export default {
  version,
  versionBuild,
};

`,
  {
    encoding: 'utf8',
  },
);
