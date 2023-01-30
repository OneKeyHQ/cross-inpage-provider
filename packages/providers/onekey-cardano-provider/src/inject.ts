/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export function defineWindowCardanoProperty(property: string, provider: unknown) {
  const proxyProvider = new Proxy(provider as object, {
    defineProperty(target, property, attributes) {
      if (property !== 'nami') {
        return Reflect.defineProperty(target, property, attributes);
      }
      // skip define Prevent overwriting
      console.log('skip define Prevent overwriting')
      return true;
    },
  });

  Object.keys(provider as object).forEach((key) => {
    ((window as any)[property] ?? {})[key] = (proxyProvider as any)[key];
  });

  Object.defineProperty(window, property, {
    configurable: false, // prevent redefined
    get() {
      return proxyProvider;
    },
    set(val) {
      // skip set
    },
  });
}
