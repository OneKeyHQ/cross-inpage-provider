export type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

export type FormattedConsoleItem = {
  preview: string;
  detail?: string;
  isExpandable: boolean;
};

export type ConsoleLogEntry = {
  id: string;
  method: ConsoleMethod;
  timestamp: string;
  items: FormattedConsoleItem[];
};

const HOOKED_METHODS: readonly ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];

let nextEntryId = 1;

function createSafeReplacer(): (key: string, value: unknown) => unknown {
  const seen = new WeakSet<object>();

  return (_key: string, value: unknown): unknown => {
    if (typeof value === 'bigint') {
      return `${value.toString()}n`;
    }
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    if (typeof value === 'symbol') {
      return value.toString();
    }
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        ...(value.stack ? { stack: value.stack } : {}),
      };
    }
    if (value instanceof Map) {
      return Object.fromEntries(Array.from(value.entries()));
    }
    if (value instanceof Set) {
      return Array.from(value.values());
    }
    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

export function safeStringify(value: unknown, space?: number): string {
  try {
    const serialized = JSON.stringify(value, createSafeReplacer(), space);
    if (serialized !== undefined) {
      return serialized;
    }
    return String(value);
  } catch {
    return 'LogsContainer: JSON.stringify error';
  }
}

export function formatConsoleValue(value: unknown): FormattedConsoleItem {
  if (typeof value === 'string') {
    return { preview: value, isExpandable: false };
  }
  if (
    value === null ||
    value === undefined ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return { preview: String(value), isExpandable: false };
  }
  if (typeof value === 'bigint') {
    return { preview: `${value.toString()}n`, isExpandable: false };
  }
  if (typeof value === 'symbol') {
    return { preview: value.toString(), isExpandable: false };
  }
  if (typeof value === 'function') {
    return { preview: `[Function: ${value.name || 'anonymous'}]`, isExpandable: false };
  }

  const compact = safeStringify(value);
  const pretty = safeStringify(value, 2);
  const isExpandable = pretty.includes('\n');
  const preview = compact.length > 160 ? `${compact.slice(0, 157)}...` : compact;

  return {
    preview,
    detail: isExpandable ? pretty : undefined,
    isExpandable,
  };
}

export function createConsoleLogEntry(method: ConsoleMethod, args: unknown[]): ConsoleLogEntry {
  const items = args.map((arg, index) => {
    if (index > 0 && typeof arg !== 'string') {
      return {
        preview: safeStringify(arg),
        isExpandable: false,
      };
    }
    return formatConsoleValue(arg);
  });

  const now = new Date();
  const timestamp = now.toTimeString().slice(0, 8);

  return {
    id: `${Date.now()}-${nextEntryId++}`,
    method,
    timestamp,
    items,
  };
}

export function hookConsole(
  targetConsole: Pick<Console, ConsoleMethod>,
  onLog: (entry: ConsoleLogEntry) => void,
): () => void {
  const originals = new Map<ConsoleMethod, (...args: unknown[]) => void>();

  for (const method of HOOKED_METHODS) {
    const original = targetConsole[method];
    if (typeof original !== 'function') {
      continue;
    }
    const boundOriginal = original.bind(targetConsole);
    originals.set(method, original);

    targetConsole[method] = (...args: unknown[]) => {
      boundOriginal(...args);
      try {
        onLog(createConsoleLogEntry(method, args));
      } catch {
        // Keep host console resilient if log capture fails.
      }
    };
  }

  return () => {
    originals.forEach((original, method) => {
      targetConsole[method] = original;
    });
  };
}
