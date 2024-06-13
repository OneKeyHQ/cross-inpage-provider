export function stringifyWithCircularReferences(obj: any) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (seen.has(value)) {
        // Duplicate reference found, skip it
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      seen.add(value);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  });
}
