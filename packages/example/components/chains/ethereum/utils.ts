function parseChainId(chainId: string | undefined): number {
  return parseInt(chainId?.startsWith('0x') ? chainId ?? '0' : `0x${chainId}`, 16);
}
export function isEqChainId(chainId: string | undefined, chainIdToCompare: string): boolean {
  const parsedChainId = parseChainId(chainId);
  const parsedChainIdToCompare = parseChainId(chainIdToCompare);

  return parsedChainId === parsedChainIdToCompare;
}
