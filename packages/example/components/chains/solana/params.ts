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
