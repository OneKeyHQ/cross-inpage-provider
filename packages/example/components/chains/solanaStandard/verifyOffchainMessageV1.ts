import { getOffchainMessageV1Encoder } from '@solana/offchain-messages';
import bs58 from 'bs58';

type IOffchainMessageV1 = Parameters<
  ReturnType<typeof getOffchainMessageV1Encoder>['encode']
>[0];
type IRequiredSignatory = IOffchainMessageV1['requiredSignatories'][number];

const SIGNING_DOMAIN_LENGTH = 16;
const SIGNER_LENGTH = 32;

/**
 * Rebuilds the bytes a version 1 offchain message must serialize to, using the reference
 * implementation from `@solana/offchain-messages` rather than our own encoder.
 *
 * This is deliberate. The wallet builds the preamble with OneKey's encoder, so verifying with
 * a second copy of that same logic would only prove the two copies agree, not that either one
 * follows the spec. Encoding here with the official codec makes the check independent: a shared
 * misreading of the spec now fails instead of passing on both sides.
 *
 * https://github.com/solana-foundation/SRFCs/discussions/3
 */
export function encodeOffchainMessageV1WithReference({
  message,
  requiredSigners,
}: {
  message: string;
  /** Base58 encoded 32-byte public keys, in whatever order the dapp supplied them. */
  requiredSigners: string[];
}): Uint8Array {
  const signatories = requiredSigners.map((signer) => {
    if (bs58.decode(signer).length !== SIGNER_LENGTH) {
      throw new Error(`required signer is not a ${SIGNER_LENGTH}-byte key: ${signer}`);
    }
    // The address type is branded for compile time only; two copies of @solana/addresses
    // resolve here, so derive the shape from the encoder itself instead of importing either.
    return { address: signer } as IRequiredSignatory;
  });

  const encoded = getOffchainMessageV1Encoder().encode({
    version: 1,
    content: message,
    // The codec sorts and de-duplicates these itself, which is the behaviour under test.
    requiredSignatories: signatories,
  });

  // `encode` is typed as ReadonlyUint8Array but returns a plain Uint8Array at runtime. Two
  // copies of @solana/codecs-core resolve in this app (2.1.0 hoisted, 7.0.0 nested under
  // @solana/offchain-messages) and their readonly types are not mutually assignable, so read
  // the result back through the concrete type.
  return Uint8Array.from(encoded as unknown as Uint8Array);
}

/** Reads back the signer list the wallet actually encoded, straight from the signed bytes. */
export function readSignersFromSignedMessage(signedBytes: Uint8Array): string[] {
  const signerCount = signedBytes[SIGNING_DOMAIN_LENGTH + 1];
  const signers: string[] = [];
  let offset = SIGNING_DOMAIN_LENGTH + 2;
  for (let i = 0; i < signerCount; i += 1) {
    signers.push(bs58.encode(signedBytes.slice(offset, offset + SIGNER_LENGTH)));
    offset += SIGNER_LENGTH;
  }
  return signers;
}
