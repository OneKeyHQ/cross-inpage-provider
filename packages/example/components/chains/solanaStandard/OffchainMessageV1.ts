import bs58 from 'bs58';

/**
 * Version 1 of the Solana offchain message specification.
 * https://github.com/solana-foundation/SRFCs/discussions/3
 *
 * Layout:
 *   signingDomain   16 bytes  0xFF || "solana offchain"
 *   version          1 byte   always 1
 *   signerCount      1 byte   1..255, must not be zero
 *   signers         32 bytes each, lexicographically sorted and unique
 *   content         the remainder of the buffer, UTF-8, no length prefix
 *
 * Compared with version 0 this drops the message format enum, the u16 content length prefix
 * and the spoofable 32 byte application domain, and it constrains the signer list to be
 * unique and ordered.
 */

export const SIGNING_DOMAIN = Uint8Array.from([
  0xff,
  ...Array.from('solana offchain', (char) => char.charCodeAt(0)),
]);

export const OFFCHAIN_MESSAGE_VERSION_V1 = 1;
const SIGNER_LENGTH = 32;

export type RequiredSigner = string | Uint8Array;

function toBytes(signer: RequiredSigner): Uint8Array {
  const bytes = typeof signer === 'string' ? bs58.decode(signer) : signer;
  if (bytes.length !== SIGNER_LENGTH) {
    throw new Error(
      `required signer must be ${SIGNER_LENGTH} bytes, got ${bytes.length}`,
    );
  }
  return Uint8Array.from(bytes);
}

/** Byte-wise lexicographic order, matching `@solana/offchain-messages`. */
function compareSigners(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) {
    return a.length < b.length ? -1 : 1;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Builds the exact bytes a wallet is expected to sign for a version 1 offchain message.
 * Use it to verify a `solana:signOffchainMessage` result against the input the dapp supplied.
 */
export function serializeOffchainMessageV1({
  message,
  requiredSigners,
}: {
  message: string;
  requiredSigners: readonly RequiredSigner[];
}): Uint8Array {
  if (message.length === 0) {
    throw new Error('offchain message content must not be empty');
  }
  if (!requiredSigners.length) {
    throw new Error('offchain message must have at least one required signer');
  }
  if (requiredSigners.length > 255) {
    throw new Error('offchain message must have at most 255 required signers');
  }

  const signers = requiredSigners.map(toBytes).sort(compareSigners);
  for (let i = 1; i < signers.length; i++) {
    if (compareSigners(signers[i - 1], signers[i]) === 0) {
      throw new Error('offchain message required signers must be unique');
    }
  }

  const content = new TextEncoder().encode(message);
  const out = new Uint8Array(
    SIGNING_DOMAIN.length + 1 + 1 + signers.length * SIGNER_LENGTH + content.length,
  );

  let offset = 0;
  out.set(SIGNING_DOMAIN, offset);
  offset += SIGNING_DOMAIN.length;
  out[offset++] = OFFCHAIN_MESSAGE_VERSION_V1;
  out[offset++] = signers.length;
  for (const signer of signers) {
    out.set(signer, offset);
    offset += SIGNER_LENGTH;
  }
  out.set(content, offset);

  return out;
}
