const TOKEN_LIST = [
  {
    symbol: 'USDT',
    tokenMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6
  },
  {
    symbol: 'USDC',
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6
  },
  // {
  //   symbol: 'RNDR',
  //   tokenMint: '7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1',
  //   decimals: 8
  // },
];
export default {
  signMessage: [
    {
      id: 'signMessage',
      name: 'signMessage',
      value: 'Hello OneKey',
    },
  ],
  // Offchain message v1 encodes the body as UTF-8 with no format enum and no length prefix, and
  // requires the signer list to be unique and lexicographically sorted. One case per property
  // worth breaking; anything already covered by another case is left out.
  // https://github.com/solana-foundation/SRFCs/discussions/3
  signOffchainMessageV1: (publicKey: string) => {
    // 32 zero bytes, so it always sorts before any real key.
    const CO_SIGNER_FIRST = '11111111111111111111111111111111';
    // Wrapped SOL mint; a real key that sorts after most others.
    const CO_SIGNER_LAST = 'So11111111111111111111111111111111111111112';
    const only = (message: string) =>
      JSON.stringify({ message, requiredSigners: [publicKey] });

    return [
      {
        id: 'ocm_v1_ascii',
        name: 'ASCII',
        description: '基线：短 ASCII 正文，单签名者',
        value: only('Hello OneKey'),
      },
      {
        id: 'ocm_v1_utf8',
        name: 'UTF-8 混合',
        description:
          '3 字节中文 + 4 字节 emoji + 换行制表。v1 取消 messageFormat，正文一律 UTF-8 且不得被规范化',
        value: only('你好 OneKey 🔑 offchain ✅\n  第二行\t制表'),
      },
      {
        id: 'ocm_v1_over_65535',
        name: '70000 字节',
        description:
          '超出 v0 的 u16 长度前缀上限，v0 无法表达。v1 取消长度前缀，正文为缓冲区剩余部分',
        value: only('D'.repeat(70_000)),
      },
      {
        id: 'ocm_v1_three_signers',
        name: '三签名者 (乱序传入)',
        description:
          '协同签名者分别排在本账户之前和之后，且传入顺序打乱，钱包必须按字典序重排',
        value: JSON.stringify({
          message: 'Hello OneKey',
          requiredSigners: [CO_SIGNER_LAST, publicKey, CO_SIGNER_FIRST],
        }),
      },
      {
        id: 'ocm_v1_duplicate_signer',
        name: '重复签名者 (应被拒绝)',
        description: 'SRFC-3 v1 的唯一性约束（v0 没有），钱包应报错而不是签名',
        value: JSON.stringify({
          message: 'Hello OneKey',
          requiredSigners: [publicKey, publicKey],
          expectRejection: true,
        }),
      },
      {
        id: 'ocm_v1_without_own_account',
        name: '不含本账户 (应被拒绝)',
        description: 'wallet-standard 的要求（非 SRFC-3）：requiredSigners 必须包含签名账户',
        value: JSON.stringify({
          message: 'Hello OneKey',
          requiredSigners: [CO_SIGNER_FIRST],
          expectRejection: true,
        }),
      },
    ];
  },
  signAndSendTransaction: (publicKey: string) => [
    {
      id: 'signAndSendTransaction',
      name: 'Normal Transaction',
      value: JSON.stringify({
        toPubkey: publicKey,
        amount: 100,
      }),
    },
  ],
  signAndSendTokenTransaction: (publicKey: string) => 
    TOKEN_LIST.map(token => ({
      id: `signAndSendTokenTransaction_${token.symbol}`,
      name: `Send ${token.symbol} Token`,
      value: JSON.stringify({
        tokenMint: token.tokenMint,
        toPubkey: publicKey,
        amount: 0.000001,
        decimals: token.decimals
      }),
    })),
  signMultipleTransaction: (publicKey: string) => [
    {
      id: 'signMultipleTransaction',
      name: 'Sign Multiple Transaction',
      value: JSON.stringify([
        {
          toPubkey: publicKey,
          amount: 100,
        },
        {
          toPubkey: publicKey,
          amount: 100,
        },
      ]),
    },
  ],
  signRawTransaction: [
    {
      id: 'sign raw tx Transaction',
      name: 'stake io',
      value: JSON.stringify({
        message:
          '78NZKdHqXG3dk1M3BzEuRStNSqZs7R7HpJqDC4XseXJdjvXCyY637Gpod7K2qSccnHkBiNoNLbjtDp5CAXzZNhY35qhfdW6imBpT8UwJJArJukctXz9uGFezAMpmHC8qyeUKeeW9DL9UpVLPrjRcq8UXxv4NaoGLsTenuziN76voXyd5Lo44EsLysFNBGELtHKzGXGznAhmabQnqnBJn64HadjRfZvjprcNiy6nbcrvjQQEZnDEXZ4WunuR7zfCZZPk1TUW2KFDymfyLYcY44cJvYi9L5VZdxvG1ifHRrxXefagfwAjL5a1wTRConmZTcVx5ayZ2SYDGxVdkrGDqLaFonGHxrzJmk1gs1mrLjqiQvQn79EQdxyvZyUDgUEMzV18yjm6nya57VXQfvei93zPDesRQTYs3yQzD1aYSjy2up3cgFNhRPt9vYZFHNBFnd9v1kPzffGbyMeNbeK8M3TPBbCxP6NEgzxmDsihB2s9bajKb3tpgaVUKQQrJiK8c5AvXWcewVFfSWBk6R7whTunRfUVXotR4d9VRfCoYgVUFZoUpSHGh111kKd4aygt4q9vh2MzoNkyoPJU32WtA899rXZ1baNKrkoeLmS7FxaSBa6jJLr1F3BHMLCnzWvPG2EE3y1afpjwkKz7Hf59rfSQFMghkHYc9DJPkbLiE4DcZiBf4q1gAva32ZZaSBruzFwLMjkm5roBx7CsmQ5tFnBtcYrF5eTke9TNNRxSLeZwU6ht1yMBsScKogN9Kmgq5uXFyAQ8BXnero7UaV7CYxeYjzeCSvsv3R',
      }),
    },
  ],
};
