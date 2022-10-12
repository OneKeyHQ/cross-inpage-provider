import { DeprecatedType } from './types';

export function deprecated(type: DeprecatedType, message: string) {
  console.warn(`%cDEPRECATED ${type}: ${message}`, 'color: red');
}

export function isWalletEventMethodMatch(method: string, name: string) {
  return method === `wallet_events_${name}`;
}
