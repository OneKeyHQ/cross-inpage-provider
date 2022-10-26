export function isWalletEventMethodMatch(method: string, name: string) {
  return method === `wallet_events_${name}`;
}
