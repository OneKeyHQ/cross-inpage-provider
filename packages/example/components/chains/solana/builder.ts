import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

export const createTransferTransaction = (
  publicKey: PublicKey,
  receiverPublicKey: string,
  recentBlockhash: string,
  amount: number,
) => {
  const receiver = new PublicKey(receiverPublicKey);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: receiver,
      lamports: amount,
    }),
  );
  transaction.feePayer = publicKey;

  transaction.recentBlockhash = recentBlockhash;
  return transaction;
};
