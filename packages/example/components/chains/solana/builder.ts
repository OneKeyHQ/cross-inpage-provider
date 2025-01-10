import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
  Connection,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

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

export const hasVersionedTx = (tx: Transaction | VersionedTransaction) => {
  return 'version' in tx;
};

export const createVersionedLegacyTransaction = (
  publicKey: PublicKey,
  receiverPublicKey: string,
  recentBlockhash: string,
  amount: number,
) => {
  const receiver = new PublicKey(receiverPublicKey);

  const instructions = [
    SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: receiver,
      lamports: amount,
      space: 0,
      programId: SystemProgram.programId,
    }),
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
  }).compileToLegacyMessage();

  const transaction = new VersionedTransaction(messageV0);
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

// 将 async function 改为箭头函数形式的导出
export const createTokenTransferTransaction = async (
  connection: Connection,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  tokenMint: PublicKey,
  recentBlockhash: string,
  amount: number,
  decimals: number
): Promise<Transaction> => {
  const transaction = new Transaction();

  const fromTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    fromPubkey
  );

  const toTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    toPubkey
  );

  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      BigInt(amount * Math.pow(10, decimals)),
    )
  );

  transaction.feePayer = fromPubkey;
  transaction.recentBlockhash = recentBlockhash;

  return transaction;
};
