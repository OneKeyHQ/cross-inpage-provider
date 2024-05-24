import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
} from '@solana/web3.js';

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

export const createVersionedTransaction = (
  publicKey: PublicKey,
  receiverPublicKey: string,
  recentBlockhash: string,
  amount: number,
) => {
  const receiver = new PublicKey(receiverPublicKey);

  const instructions = [
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: receiver,
      lamports: amount,
    }),
  ];

  const messageV0 = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: recentBlockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  return transaction;
};
