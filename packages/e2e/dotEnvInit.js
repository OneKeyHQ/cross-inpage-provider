import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

function setupDotEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const results = [
    dotenv.config({
      path: path.resolve(__dirname, '../../.env'),
    }),
  ];
  const errorResult = results.find((result) => result.error);

  if (errorResult) {
    throw errorResult.error;
  }
}
setupDotEnv();
