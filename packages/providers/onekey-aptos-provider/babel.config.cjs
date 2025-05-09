module.exports = {
  presets: [['@babel/preset-typescript', { allowDeclareFields: true }]],
  plugins: [
    [
      'transform-imports',
      {
        '@aptos-labs/ts-sdk': {
          // 根据导入成员返回对应深路径文件，默认走 dist/esm 根目录
          transform(importName) {
            // 加密相关
            const CRYPTO = ['Ed25519PublicKey', 'Ed25519Signature'];
            if (CRYPTO.includes(importName)) {
              return `@aptos-labs/ts-sdk/dist/esm/core/crypto/ed25519.mjs`;
            }

            // 账户相关
            if (importName === 'AccountAddress') {
              return '@aptos-labs/ts-sdk/dist/esm/core/accountAddress.mjs';
            }

            // 交易相关
            const TX_AUTH = ['AccountAuthenticatorEd25519'];
            if (TX_AUTH.includes(importName)) {
              return '@aptos-labs/ts-sdk/dist/esm/transactions/authenticator/account.mjs';
            }

            // SimpleTransaction
            if (importName === 'SimpleTransaction') {
              return '@aptos-labs/ts-sdk/dist/esm/transactions/instances/simpleTransaction.mjs';
            }

            // TypeTag
            if (importName === 'TypeTag') {
              return '@aptos-labs/ts-sdk/dist/esm/transactions/typeTag/index.mjs';
            }

            // 网络相关
            if (importName === 'Network') {
              return '@aptos-labs/ts-sdk/dist/esm/utils/apiEndpoints.mjs';
            }

            // standardizeTypeTags
            if (importName === 'standardizeTypeTags') {
              return '@aptos-labs/ts-sdk/dist/esm/transactions/transactionBuilder/remoteAbi.mjs';
            }

            // BCS 序列化相关
            const BCS_TYPES = [
              'Serializer', 'Deserializer', 'MoveVector', 'MoveOption', 'U8', 'U16',
              'U32', 'U64', 'U128', 'U256', 'Bool', 'Serialized', 'MoveString', 'FixedBytes'
            ];
            if (BCS_TYPES.includes(importName)) {
              return '@aptos-labs/ts-sdk/dist/esm/bcs/index.mjs';
            }
            // 其余默认：@aptos-labs/ts-sdk/dist/esm/<member>.mjs
            return `@aptos-labs/ts-sdk/dist/esm/${importName}.mjs`;
          },
          // 禁止顶层整包导入
          preventFullImport: true,
        },
      },
    ],
  ],
};
