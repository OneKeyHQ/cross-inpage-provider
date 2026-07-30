export function parseArgs(argv = process.argv.slice(2)) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      result._.push(value);
      continue;
    }
    const equalIndex = value.indexOf('=');
    if (equalIndex >= 0) {
      result[value.slice(2, equalIndex)] = value.slice(equalIndex + 1);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      result[key] = next;
      index += 1;
    } else {
      result[key] = true;
    }
  }
  return result;
}

export function numberArg(args, key, fallback, { min = 0, max = Infinity } = {}) {
  const parsed = args[key] === undefined ? fallback : Number(args[key]);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`--${key} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

export function requiredArg(args, key) {
  const value = args[key];
  if (typeof value !== 'string' || !value) {
    throw new Error(`--${key} is required`);
  }
  return value;
}
