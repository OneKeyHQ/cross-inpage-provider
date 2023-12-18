import type { IdentifierString } from '@wallet-standard/base';

import type { BitcoinSignTransactionInput } from './signTransaction.js';

/** Name of the feature. */
export const BitcoinSignAndSendTransaction = 'bitcoin:signAndSendTransaction';

/**
 * `bitcoin:signAndSendTransaction` is a {@link "@wallet-standard/base".Wallet.features | feature} that may be
 * implemented by a {@link "@wallet-standard/base".Wallet} to allow the app to request to sign transactions with the
 * specified {@link "@wallet-standard/base".Wallet.accounts} and send them to the
 * {@link "@wallet-standard/base".Wallet.chains | chain}.
 *
 * @group SignAndSendTransaction
 */
export type BitcoinSignAndSendTransactionFeature = {
    /** Name of the feature. */
    readonly [BitcoinSignAndSendTransaction]: {
        /** Version of the feature implemented by the Wallet. */
        readonly version: BitcoinSignAndSendTransactionVersion;

        /** Method to call to use the feature. */
        readonly signAndSendTransaction: BitcoinSignAndSendTransactionMethod;
    };
};

/**
 * Version of the {@link BitcoinSignAndSendTransactionFeature} implemented by a {@link "@wallet-standard/base".Wallet}.
 *
 * @group SignAndSendTransaction
 */
export type BitcoinSignAndSendTransactionVersion = '1.0.0';

/**
 * Method to call to use the {@link BitcoinSignAndSendTransactionFeature}.
 *
 * @group SignAndSendTransaction
 */
export type BitcoinSignAndSendTransactionMethod = (
    ...inputs: readonly BitcoinSignAndSendTransactionInput[]
) => Promise<readonly BitcoinSignAndSendTransactionOutput[]>;

/**
 * Input for the {@link BitcoinSignAndSendTransactionMethod}.
 *
 * @group SignAndSendTransaction
 */
export interface BitcoinSignAndSendTransactionInput extends BitcoinSignTransactionInput {
    /** Chain to use. */
    readonly chain: IdentifierString;
}

/**
 * Output of the {@link BitcoinSignAndSendTransactionMethod}.
 *
 * @group SignAndSendTransaction
 */
export interface BitcoinSignAndSendTransactionOutput {
    /** Transaction ID (transaction hash). */
    readonly txId: string;
}
