import { defaultAbiCoder } from '@ethersproject/abi';

export function encodeTokenTransferPayload({ address, amount }: { address: string; amount: string }) {
  const method = '0xa9059cbb';
  const params = defaultAbiCoder.encode(['address', 'uint256'], [`0x${address.slice(2)}`, amount]);
  return `${method}${params.slice(2)}`;
}
