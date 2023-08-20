export function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}
