/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/ban-ts-comment,  @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
 */
// @ts-ignore
import EventEmitterBase from '@onekeyfe/cross-inpage-provider-events';
import type { EventEmitter as INodeEventEmitter } from 'events';

type Handler = (...args: any[]) => void;
interface EventMap {
  [k: string]: Handler | Handler[] | undefined;
}

function safeApply<T, A extends any[]>(
  handler: (this: T, ...args: A) => void,
  context: T,
  args: A,
): void {
  try {
    Reflect.apply(handler, context, args);
  } catch (err) {
    // Throw error after timeout so as not to interrupt the stack
    setTimeout(() => {
      throw err;
    });
  }
}

function arrayClone<T>(arr: T[]): T[] {
  const n = arr.length;
  const copy = new Array(n);
  for (let i = 0; i < n; i += 1) {
    copy[i] = arr[i];
  }
  return copy;
}

class EventEmitterProxy extends EventEmitterBase implements INodeEventEmitter {
  emit(eventName: string | symbol, ...args: any[]): boolean {
    return super.emit(eventName, ...args);
  }
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
    super.addListener(eventName, listener);
    return this;
  }
  on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    super.on(eventName, listener);
    return this;
  }
  once(eventName: string | symbol, listener: (...args: any[]) => void): this {
    super.once(eventName, listener);
    return this;
  }
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
    super.removeListener(eventName, listener);
    return this;
  }
  off(eventName: string | symbol, listener: (...args: any[]) => void): this {
    super.off(eventName, listener);
    return this;
  }
  removeAllListeners(event?: string | symbol): this {
    super.removeAllListeners(event);
    return this;
  }
  setMaxListeners(n: number): this {
    super.setMaxListeners(n);
    return this;
  }
  getMaxListeners(): number {
    return super.getMaxListeners();
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  listeners(eventName: string | symbol): Function[] {
    return super.listeners(eventName);
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  rawListeners(eventName: string | symbol): Function[] {
    return super.rawListeners(eventName);
  }
  listenerCount(eventName: string | symbol): number {
    return super.listenerCount(eventName);
  }
  prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
    super.prependListener(eventName, listener);
    return this;
  }
  prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
    super.prependOnceListener(eventName, listener);
    return this;
  }
  eventNames(): (string | symbol)[] {
    return super.eventNames();
  }
}

class CrossEventEmitter extends EventEmitterProxy {
  emit(type: string, ...args: any[]): boolean {
    let doError = type === 'error';

    const events: EventMap = (this as any)._events;
    if (events !== undefined) {
      doError = doError && events.error === undefined;
    } else if (!doError) {
      return false;
    }

    // If there is no 'error' event listener then throw.
    if (doError) {
      let er;
      if (args.length > 0) {
        [er] = args;
      }
      if (er instanceof Error) {
        // Note: The comments on the `throw` lines are intentional, they show
        // up in Node's output if this results in an unhandled exception.
        throw er; // Unhandled 'error' event
      }
      // At least give some kind of context to the user
      const err = new Error(`Unhandled error.${er ? ` (${er.message as string})` : ''}`);
      (err as any).context = er;
      throw err; // Unhandled 'error' event
    }

    const handler = events[type];

    if (handler === undefined) {
      return false;
    }

    if (typeof handler === 'function') {
      safeApply(handler, this, args);
    } else {
      const len = handler.length;
      const listeners = arrayClone(handler);
      for (let i = 0; i < len; i += 1) {
        safeApply(listeners[i], this, args);
      }
    }

    return true;
  }
}
export { CrossEventEmitter };
