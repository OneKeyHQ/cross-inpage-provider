// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import type {
  SuiSignPersonalMessageInput,
  SuiSignPersonalMessageOutput,
} from '@mysten/wallet-standard';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

type UseSignMessageArgs = Partial<SuiSignPersonalMessageInput>;

type UseSignMessageResult = SuiSignPersonalMessageOutput;

type UseSignMessageError = Error;

type UseSignMessageMutationOptions = Omit<
  UseMutationOptions<UseSignMessageResult, UseSignMessageError, UseSignMessageArgs, unknown>,
  'mutationFn'
>;

/**
 * Mutation hook for prompting the user to sign a message.
 */
export function useSignMessage({
  mutationKey,
  ...mutationOptions
}: UseSignMessageMutationOptions = {}): UseMutationResult<
  UseSignMessageResult,
  UseSignMessageError,
  UseSignMessageArgs
> {
  const { currentWallet } = useCurrentWallet();
  const currentAccount = useCurrentAccount();

  return useMutation({
    mutationKey: ['wallet', 'sign-message'],
    mutationFn: async (signMessageArgs) => {
      if (!currentWallet) {
        throw new Error('No wallet is connected.');
      }

      const signerAccount = signMessageArgs.account ?? currentAccount;
      if (!signerAccount) {
        throw new Error('No wallet account is selected to sign the personal message with.');
      }

      // TODO: Remove this once we officially discontinue sui:signMessage in the wallet standard
      const signMessageFeature = currentWallet.features['sui:signMessage'];
      if (signMessageFeature) {
        console.warn(
          "This wallet doesn't support the `signPersonalMessage` feature... falling back to `signMessage`.",
        );

        // @ts-expect-error
        const { messageBytes, signature } = await signMessageFeature.signMessage({
          ...signMessageArgs,
          account: signerAccount,
        });
        return { bytes: messageBytes, signature };
      }

      throw new Error("This wallet doesn't support the `signPersonalMessage` feature.");
    },
    ...mutationOptions,
  });
}
