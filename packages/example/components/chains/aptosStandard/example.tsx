/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef, useCallback, useState } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { SignMessageResponse } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import nacl from 'tweetnacl';
import { stripHexPrefix } from 'ethereumjs-util';
import {
  createSignInMessage,
  createSignInSigningMessage,
} from '@aptos-labs/siwa';
import {
  Network,
  Aptos,
  AptosConfig,
  parseTypeTag,
  TypeTagAddress,
  TypeTagU64,
  SimpleTransaction,
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  AccountAuthenticatorEd25519,
  AccountAddress,
  U64,
  Ed25519Account,
  AnyRawTransaction,
  AccountAuthenticator,
  Account,
} from '@aptos-labs/ts-sdk';
import {
  WalletReadyState,
  AptosStandardSupportedWallet,
  AptosSignMessageInput,
  AptosSignInInput,
  AdapterWallet,
  AptosSignInOutput,
} from '@aptos-labs/wallet-adapter-core';
import { useWallet as useStandardWallet } from '@aptos-labs/wallet-adapter-react';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import InfoLayout from '../../InfoLayout';
import { jsonToUint8Array } from '../../../lib/uint8array';
import { get } from 'lodash';
import { ApiForm, ApiFormRef } from '../../ApiForm';
import { aptosClient } from './utils';
import { stringifyWithSpecialType } from '../../../lib/jsonUtils';


const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const MaxGasAMount = 10000;
const TRANSFER_SCRIPT =
  "0xa11ceb0b0700000a0601000203020605080d071525083a40107a1f010200030201000104060c060c05030003060c0503083c53454c463e5f30046d61696e0d6170746f735f6163636f756e74087472616e73666572ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000114636f6d70696c6174696f6e5f6d65746164617461090003322e3003322e31000001070b000b01010b020b03110002";

function MultiAgentTransactionFlow() {
  const { account, network, signTransaction, submitTransaction } = useStandardWallet();

  const [secondarySignerAccount, setSecondarySignerAccount] = useState<Ed25519Account>();
  const [transactionToSubmit, setTransactionToSubmit] = useState<AnyRawTransaction | null>(null);

  const [senderAuthenticator, setSenderAuthenticator] = useState<AccountAuthenticator>();
  const [secondarySignerAuthenticator, setSecondarySignerAuthenticator] =
    useState<AccountAuthenticator>();

  const apiFromRef = useRef<ApiFormRef>(null);

  const generateTransaction = async (): Promise<AnyRawTransaction> => {
    if (!account) {
      throw new Error("no account");
    }

    if (!network) {
      throw new Error("no network");
    }

    const secondarySigner = Account.generate();
    setSecondarySignerAccount(secondarySigner);
    apiFromRef.current?.setJsonValue('secondarySignerInfoResponse', {
      "此为自动生成，请勿修改，否则会导致交易失败": "",
      "Address": secondarySigner.accountAddress.toString(),
      "Private Key": secondarySigner.privateKey.toString(),
      "Public Key": secondarySigner.publicKey.toString(),
    });

    const transactionToSign = await aptosClient(
      network,
    ).transaction.build.multiAgent({
      sender: account.address,
      secondarySignerAddresses: [secondarySigner.accountAddress],
      data: {
        bytecode: TRANSFER_SCRIPT,
        typeArguments: [],
        functionArguments: [account.address, new U64(1)],
      },
      options:{
        expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 5,
      }
    });

    console.log('=== DEBUG: Transaction generation ===');
    console.log('Sender address:', account.address);
    console.log('Secondary signer address:', secondarySigner.accountAddress.toString());
    console.log('Transaction to sign:', transactionToSign);

    return transactionToSign;
  };

  const onSenderSignTransaction = async () => {
    const transaction = await generateTransaction();
    setTransactionToSubmit(transaction);
    try {
      const response = await signTransaction({
        transactionOrPayload: transaction,
      });

      console.log('=== DEBUG: Sender signing ===');
      console.log('Sender sign response:', response);

      const senderAuth = response.authenticator;
      console.log('===== senderAuth ===== ', `isEd25519: ${senderAuth.isEd25519()? 'true' : 'false'}, isMultiEd25519: ${senderAuth.isMultiEd25519()? 'true' : 'false'}, isSingleKey: ${senderAuth.isSingleKey()? 'true' : 'false'}, isMultiKey: ${senderAuth.isMultiKey()? 'true' : 'false'}`);
      setSenderAuthenticator(senderAuth);
      apiFromRef.current?.setJsonValue('senderSignResponse', response.authenticator);
    } catch (error) {
      console.error('Sender signing error:', error);
    }
  };

  const onSecondarySignerSignTransaction = async () => {
    if (!transactionToSubmit) {
      throw new Error("No Transaction to sign");
    }
    if (!secondarySignerAccount) {
      throw new Error("No secondarySignerAccount");
    }
    try {
      console.log('=== DEBUG: Secondary signer signing ===');
      console.log('Secondary signer account:', secondarySignerAccount.accountAddress.toString());

      const authenticator = aptosClient(network).sign({
        signer: secondarySignerAccount,
        transaction: transactionToSubmit,
      });

      console.log('Secondary signer authenticator:', authenticator);

      setSecondarySignerAuthenticator(authenticator);
      console.log('===== secondaryAuth ===== ', `isEd25519: ${authenticator.isEd25519()? 'true' : 'false'}, isMultiEd25519: ${authenticator.isMultiEd25519()? 'true' : 'false'}, isSingleKey: ${authenticator.isSingleKey()? 'true' : 'false'}, isMultiKey: ${authenticator.isMultiKey()? 'true' : 'false'}`);
      apiFromRef.current?.setJsonValue('secondarySignerSignResponse', authenticator);
      return Promise.resolve();
    } catch (error) {
      console.error('Secondary signer signing error:', error);
    }
  };

  const onSubmitTransaction = async () => {
    try {
      if (!transactionToSubmit) {
        throw new Error("No Transaction to sign");
      }
      if (!senderAuthenticator) {
        throw new Error("No senderAuthenticator");
      }
      if (!secondarySignerAuthenticator) {
        throw new Error("No secondarySignerAuthenticator");
      }

      console.log('=== DEBUG: Transaction submission ===');
      console.log('Transaction to submit:', transactionToSubmit);
      console.log('Sender authenticator:', senderAuthenticator);
      console.log('Secondary authenticator:', secondarySignerAuthenticator);

      const response = await submitTransaction({
        transaction: transactionToSubmit,
        senderAuthenticator: senderAuthenticator,
        additionalSignersAuthenticators: [secondarySignerAuthenticator],
      });

      apiFromRef.current?.setJsonValue('submitTransactionResponse', response);
      if(window && window.open && response.hash) {
        window.open(`https://explorer.aptoslabs.com/txn/${response.hash}`, '_blank');
      }
    } catch (error) {
      apiFromRef.current?.setJsonValue('submitTransactionResponse', {
        "error": error,
      });
      console.error('Submit transaction error:', error);
    }
  };

  return (
    <ApiForm
      title="MultiAgent Transaction Flow"
      description="通过第二个账户签字实现第一个账户给第一个账户转账。 需要两个账户，一个作为发送者，一个作为第二签名账户, 发送者账户需要先签名，然后第二签名账户再签名，最后一起提交。"
      ref={apiFromRef}
    >
      <ApiForm.TextArea id="secondarySignerInfoResponse" label="第二签名账户信息" />
      <ApiForm.Button id="onSenderSignTransaction" label="1. Sign as sender & generate secondary account" onClick={onSenderSignTransaction} />
      <ApiForm.TextArea id="senderSignResponse" label="执行结果" />

      <ApiForm.Button id="onSecondarySignerSignTransaction"
        label="2. Sign as secondary signer"
        onClick={onSecondarySignerSignTransaction}
        disabled={!secondarySignerAccount}
      />
      <ApiForm.TextArea id="secondarySignerSignResponse" label="执行结果" />

      <ApiForm.Button
        id="submitTransaction"
        label="3. Submit transaction"
        onClick={onSubmitTransaction}
        disabled={!senderAuthenticator || !secondarySignerAuthenticator}
      />
      <ApiForm.JsonEdit id="submitTransactionResponse" label="执行结果" />
    </ApiForm>
  );
}

function SponsorTransactionFlow() {
  const { account, network, signTransaction, submitTransaction } = useStandardWallet();

  const [transactionToSubmit, setTransactionToSubmit] = useState<AnyRawTransaction | null>(null);
  const [senderAccount, setSenderAccount] = useState<Account | null>();

  const [senderAuthenticator, setSenderAuthenticator] = useState<AccountAuthenticator>();
  const [feepayerAuthenticator, setFeepayerAuthenticator] =
    useState<AccountAuthenticator>();

  const apiFromRef = useRef<ApiFormRef>(null);

  const generateTransaction = async (sender: Account): Promise<AnyRawTransaction> => {
    if (!account) {
      throw new Error("no account");
    }

    if (!network) {
      throw new Error("no network");
    }

    console.log('===  01, generateTransaction ===');

    const transactionToSign = await aptosClient(
      network
    ).transaction.build.simple({
      sender: sender.accountAddress,
      withFeePayer: true,
      data: {
        function: "0x1::resource_account::create_resource_account",
        typeArguments: [],
        functionArguments: [
          account.address.toString(),
          AccountAddress.from("0x0").toUint8Array(),
        ],
      },
      options:{
        expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 5,
      }
    });
    console.log('===  02, transactionToSign ===', transactionToSign);
    transactionToSign.feePayerAddress = account.address;
    return transactionToSign;
  };

  const onSignTransaction = async () => {
    const sender = Account.generate();
    setSenderAccount(sender);
    apiFromRef.current?.setJsonValue('senderInfoResponse', {
      "此为自动生成，请勿修改，否则会导致交易失败": "",
      "Address": sender.accountAddress.toString(),
      "Private Key": sender.privateKey.toString(),
      "Public Key": sender.publicKey.toString(),
    });

    console.log('=== DEBUG: Transaction generation ===');
    console.log('Sender address:', sender.accountAddress.toString());

    const transaction = await generateTransaction(sender);
    setTransactionToSubmit(transaction);

    console.log('=== DEBUG: Transaction generation ===');
    console.log('Transaction to sign:', transaction);

    try {
      const authenticator = aptosClient(network).sign({
        signer: sender,
        transaction: transaction,
      });
      setSenderAuthenticator(authenticator);
      apiFromRef.current?.setJsonValue('senderSignResponse', authenticator);
    } catch (error) {
      console.error(error);
    }
  };

  const onSignTransactionAsSponsor = async () => {
    if (!transactionToSubmit) {
      throw new Error("No Transaction to sign");
    }
    try {
      const response = await signTransaction({
        transactionOrPayload: transactionToSubmit,
        asFeePayer: true,
      });
      setFeepayerAuthenticator(response.authenticator);
      apiFromRef.current?.setJsonValue('sponsorSignResponse', response.authenticator);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmitTransaction = async () => {
    if (!transactionToSubmit) {
      throw new Error("No Transaction to sign");
    }
    if (!senderAuthenticator) {
      throw new Error("No senderAuthenticator");
    }
    if (!feepayerAuthenticator) {
      throw new Error("No feepayerAuthenticator");
    }
    try {
      const response = await submitTransaction({
        transaction: transactionToSubmit,
        senderAuthenticator: senderAuthenticator,
        feePayerAuthenticator: feepayerAuthenticator,
      });
      apiFromRef.current?.setJsonValue('submitTransactionResponse', response);
      if(window && window.open && response.hash) {
        window.open(`https://explorer.aptoslabs.com/txn/${response.hash}`, '_blank');
      }
    } catch (error) {
      apiFromRef.current?.setJsonValue('submitTransactionResponse', {
        "error": error,
      });
      console.error(error);
    }
  };

  return (
    <ApiForm
      title="Sponsor Transaction Flow"
      description="第一个用户发起一个创建账户的交易，第二个用户作为赞助者，支付交易费用"
      ref={apiFromRef}
    >
      <ApiForm.TextArea id="senderInfoResponse" label="交易发送者信息" />
      <ApiForm.Button id="onSignTransaction" label="1. Sign as sender" onClick={onSignTransaction} />
      <ApiForm.TextArea id="senderSignResponse" label="执行结果" />

      <ApiForm.Button id="onSignTransactionAsSponsor"
        label="2. Sign as sponsor, 帮助发送者支付交易费用"
        onClick={onSignTransactionAsSponsor}
        disabled={!senderAccount || !transactionToSubmit}
      />
      <ApiForm.TextArea id="sponsorSignResponse" label="执行结果" />

      <ApiForm.Button
        id="submitTransaction"
        label="3. Submit transaction"
        onClick={onSubmitTransaction}
        disabled={!senderAuthenticator || !feepayerAuthenticator}
      />
      <ApiForm.JsonEdit id="submitTransactionResponse" label="执行结果" />
    </ApiForm>
  );
}

function Example() {
  const {
    connected,
    account,
    network,
    signAndSubmitTransaction,
    signMessageAndVerify,
    signMessage,
    signTransaction,
    submitTransaction,
    signIn,
  } = useStandardWallet();

  const aptosClient = new Aptos(
    new AptosConfig({
      network: Network.MAINNET,
    }),
  );

  return (
    <>
      <ApiGroup title="Basics">
        <ApiPayload
          title="getNetwork"
          description="getNetwork"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            return Promise.resolve(network);
          }}
        />
        <ApiPayload
          title="isConnected"
          description="isConnected"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            return Promise.resolve(connected);
          }}
        />
        <ApiPayload
          title="account"
          description="当前账户"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            return Promise.resolve(account);
          }}
        />
        <ApiPayload
          title="network"
          description="当前网络"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            return Promise.resolve(network);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transfer">
        <ApiPayload
          title="signMessage"
          description="signMessage"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as AptosSignMessageInput;
            const result = await signMessage(obj);
            return stringifyWithSpecialType(result).replace(/\\n/g, '\\\\n')
              .replace(/\\r/g, '\\\\r')
              .replace(/\\t/g, '\\\\t');
          }}
          onValidate={(request: string, result: string) => {
            const { fullMessage, signature } = JSON.parse(result) as SignMessageResponse;

            const signatureU8 = jsonToUint8Array(get(signature, 'data.data'));

            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(fullMessage),
              signatureU8,
              hexToBytes(stripHexPrefix(account?.publicKey.toString() ?? '')),
            );

            return Promise.resolve(isValidSignature.toString());
          }}
        />
        <ApiPayload
          title="signMessageAndVerify"
          description="signMessageAndVerify"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as AptosSignMessageInput;
            return signMessageAndVerify(obj);
          }}
        />
        <ApiPayload
          title="signIn"
          description="signIn"
          presupposeParams={[{
            id: 'signIn',
            name: 'signIn',
            value: JSON.stringify({
              walletName: 'OneKey',
              input: {
                domain: "localhost:3000",
                nonce: Math.random().toString(16),
                statement: "Signing into demo application",
                notBefore: new Date().toISOString(),
                expirationTime: new Date(
                  Date.now() + 1000 * 60 * 60 * 24
                ).toISOString(),
                issuedAt: new Date().toISOString(),
                requestId: "abc",
                resources: ["resource.1", "resource.2"],
              },
            }),
          }]}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as {
              walletName: string;
              input: AptosSignInInput;
            };
            return signIn(obj);
          }}
          onValidate={async (request: string, result: string) => {
            const { account, input, signature } = JSON.parse(result) as AptosSignInOutput;

            const publicKeyU8 = jsonToUint8Array(get(account, 'publicKey.key.data'));
            const signatureU8 = jsonToUint8Array(get(signature, 'data.data'));

            const message = createSignInSigningMessage(createSignInMessage(input));

            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(message),
              signatureU8,
              publicKeyU8,
            );
            return Promise.resolve(isValidSignature.toString());
          }}
        />
         <ApiPayload
          title="openIn"
          description="signMessageAndVerify"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as AptosSignMessageInput;
            return signMessageAndVerify(obj);
          }}
        />
        <ApiPayload
          title="signTransaction"
          description="signTransaction"
          presupposeParams={params.signTransaction(account?.address.toString() ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const { data, asFeePayer, options } = obj;
            const res = await signTransaction({
              transactionOrPayload: {
                data,
                options: options ? options : undefined,
              },
              asFeePayer,
            });
            return res;
          }}
        />
        <ApiPayload
          title="signAndSubmitTransaction"
          description="signAndSubmitTransaction"
          presupposeParams={params.signAndSubmitTransaction(account?.address.toString() ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await signAndSubmitTransaction(obj);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="SDK Build Transaction">
        <ApiPayload
          title="signTransaction-SDK-build transaction"
          description="使用 SDK 构造 Coin 转账"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address.toString() ?? '',
                amount: 100000,
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount } = JSON.parse(request);
            const res = await aptosClient.coin.transferCoinTransaction({
              sender: account?.address.toString() ?? '',
              recipient,
              amount,
            });

            return {
              txn: res.bcsToHex().toStringWithoutPrefix(),
              result: await signTransaction({
                transactionOrPayload:res
              }),
            };
          }}
          onValidate={async (request: string, result: string) => {
            const { txn, result: signedTxn } = JSON.parse(result);
            const publicKey = jsonToUint8Array(get(signedTxn, 'authenticator.public_key.key.data'));
            const signature = jsonToUint8Array(get(signedTxn, 'authenticator.signature.data.data'));

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const simpleTxn = SimpleTransaction.deserialize(new Deserializer(hexToBytes(txn)));

            const res = await submitTransaction({
              transaction: simpleTxn,
              senderAuthenticator: new AccountAuthenticatorEd25519(
                new Ed25519PublicKey(publicKey),
                new Ed25519Signature(signature),
              ),
            });

            return Promise.resolve(JSON.stringify(res));
          }}
        />

        <ApiPayload
          title="signTransaction-SDK-build transaction"
          description="使用 SDK 构造 Legacy Token 转账"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address.toString() ?? '',
                amount: 100000,
                coinType:
                  '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount, coinType } = JSON.parse(request);
            const res = await aptosClient.coin.transferCoinTransaction({
              sender: account?.address.toString() ?? '',
              recipient,
              amount,
              coinType,
            });

            return {
              txn: res.bcsToHex().toStringWithoutPrefix(),
              result: await signTransaction({
                transactionOrPayload:res
              }),
            };
          }}
          onValidate={async (request: string, result: string) => {
            const { txn, result: signedTxn } = JSON.parse(result);
            const publicKey = jsonToUint8Array(get(signedTxn, 'authenticator.public_key.key.data'));
            const signature = jsonToUint8Array(get(signedTxn, 'authenticator.signature.data.data'));

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const simpleTxn = SimpleTransaction.deserialize(new Deserializer(hexToBytes(txn)));

            const res = await submitTransaction({
              transaction: simpleTxn,
              senderAuthenticator: new AccountAuthenticatorEd25519(
                new Ed25519PublicKey(publicKey),
                new Ed25519Signature(signature),
              ),
            });

            return Promise.resolve(JSON.stringify(res));
          }}
        />

        <ApiPayload
          title="signTransaction-SDK-build transaction"
          description="使用 SDK 构造 Token 转账"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address ?? '',
                amount: 100000,
                coinType: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount, coinType } = JSON.parse(request);
            try {
              const res = await aptosClient.transaction.build.simple({
                sender: account?.address ?? '',
                data: {
                  function: '0x1::primary_fungible_store::transfer',
                  typeArguments: ['0x1::fungible_asset::Metadata'],
                  functionArguments: [coinType, recipient, amount],
                  abi: {
                    typeParameters: [{ constraints: [] }],
                    parameters: [
                      parseTypeTag('0x1::object::Object'),
                      new TypeTagAddress(),
                      new TypeTagU64(),
                    ],
                  },
                },
              });
              return {
                txn: res.bcsToHex().toStringWithoutPrefix(),
                result: await signTransaction({
                  transactionOrPayload: res
                }),
              };
            } catch (error) {
              console.log(error);
            }
          }}
          onValidate={async (request: string, result: string) => {
            const { txn, result: signedTxn } = JSON.parse(result);
            const publicKey = jsonToUint8Array(get(signedTxn, 'authenticator.public_key.key.data'));
            const signature = jsonToUint8Array(get(signedTxn, 'authenticator.signature.data.data'));

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const simpleTxn = SimpleTransaction.deserialize(new Deserializer(hexToBytes(txn)));

            const res = await submitTransaction({
              transaction: simpleTxn,
              senderAuthenticator: new AccountAuthenticatorEd25519(
                new Ed25519PublicKey(publicKey),
                new Ed25519Signature(signature),
              ),
            });

            return Promise.resolve(JSON.stringify(res));
          }}
        />
      </ApiGroup>

      <ApiGroup title="SignAndSubmitTransaction Test">
        <ApiPayload
          title="signAndSubmitTransaction Normal Argument"
          description="Normal Argument 测试"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address.toString() ?? '',
                amount: 100000,
                coinType: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount, coinType } = JSON.parse(request);
            return {
              result: await signAndSubmitTransaction({
                sender: account?.address.toString() ?? '',
                data: {
                  function: '0x1::primary_fungible_store::transfer',
                  typeArguments: ['0x1::fungible_asset::Metadata'],
                  functionArguments: [coinType, recipient as string, amount as number],
                },
              }),
            };
          }}
        />

        <ApiPayload
          title="signAndSubmitTransaction Encode Argument"
          description="Encode Argument 测试 (OneKey、OKX、MizuWallet 等都不支持)"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address.toString() ?? '',
                amount: 100000,
                coinType: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount, coinType } = JSON.parse(request);
            return {
              result: await signAndSubmitTransaction({
                sender: account?.address.toString() ?? '',
                data: {
                  function: '0x1::primary_fungible_store::transfer',
                  typeArguments: ['0x1::fungible_asset::Metadata'],
                  functionArguments: [
                    coinType,
                    AccountAddress.from(recipient as string),
                    new U64(amount as number),
                  ],
                },
              }),
            };
          }}
        />

        <ApiPayload
          title="signAndSubmitTransaction Script"
          description="Script 测试"
          presupposeParams={[
            {
              id: 'sign with script payload',
              name: 'with script payload',
              value: '',
            },
          ]}
          onExecute={async (request: string) => {
            return {
              result: await signAndSubmitTransaction({
                sender: account?.address.toString() ?? '',
                data: {
                  bytecode:
                    'a11ceb0b060000000701000402040a030e0c041a04051e20073e30086e2000000001010204010001000308000104030401000105050601000002010203060c0305010b0001080101080102060c03010b0001090002050b00010900000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177076465706f7369740000000000000000000000000000000000000000000000000000000000000001000001080b000b0138000c030b020b03380102',
                  functionArguments: [
                    new U64(1),
                    AccountAddress.from(account?.address.toString() ?? ('' as string)),
                  ],
                },
              }),
            };
          }}
        />
         <ApiPayload
          title="signAndSubmitTransaction test set gas"
          description="测试设置 gas"
          presupposeParams={[
            {
              id: 'sign with options',
              name: 'with options',
              value: '',
            },
          ]}
          onExecute={async (request: string) => {
              const commitedTransaction = await signAndSubmitTransaction({
                sender: account?.address.toString() ?? '',
                data: {
                  function: "0x1::coin::transfer",
                  typeArguments: [APTOS_COIN],
                  functionArguments: [account.address.toString(), 1], // 1 is in Octas
                },
                options: { maxGasAmount: MaxGasAMount },
              })

              const executedTransaction = await aptosClient.waitForTransaction({
                transactionHash: commitedTransaction.hash,
              });

              if ((executedTransaction as any).max_gas_amount == MaxGasAMount) {
                return Promise.resolve({
                  title: "Success",
                  description: `transaction ${executedTransaction.hash} executed with a max gas amount of ${MaxGasAMount}`,
                });
              } else {
                return Promise.resolve({
                  variant: "destructive",
                  title: "Error",
                  description: `transaction ${executedTransaction.hash} executed with a max gas amount of ${get(executedTransaction,"max_gas_amount")}`,
                });
              }
          }}
        />
      </ApiGroup>

      <ApiGroup title="Advanced Transaction Flow">
        <MultiAgentTransactionFlow />
        <SponsorTransactionFlow />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

function AptosConnectButton() {
  const { connected, wallets, account, network, connect, disconnect } = useStandardWallet();

  const { setProvider } = useWallet();

  const walletsRef = useRef<(AdapterWallet | AptosStandardSupportedWallet)[]>([]);
  walletsRef.current = wallets.filter((wallet) => wallet.readyState === WalletReadyState.Installed);

  useEffect(() => {
    console.log('Aptos Standard Wallets:', wallets);
  }, [wallets]);

  const onConnectWallet = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (selectedWallet: IKnownWallet) => {
      const wallet = walletsRef.current.find((w) => w.name === selectedWallet.id);
      if (!wallet) {
        return Promise.reject('Wallet not found');
      }

      connect(wallet.name);

      return {
        provider: undefined,
      };
    },
    [connect],
  );

  useEffect(() => {
    console.log('account changed', account);
    setProvider(account);
  }, [account, setProvider]);
  useEffect(() => {
    console.log('network changed', network);
  }, [network]);

  return (
    <>
      <ConnectButton<any>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.name,
                name: wallet.name,
                tags: [get(wallet,'isAIP62Standard') ? 'AIP62' : '', get(wallet,'isAptosNativeWallet') ? 'Aptos Native' : ''],
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
        onDisconnect={() => void disconnect()}
      />

      <InfoLayout title="Base Info">
        {account && <p>Account:{account?.address?.toString() ?? ''}</p>}
        {account && <p>PubKey:{account?.publicKey?.toString() ?? ''}</p>}
        {account && <p>ansName:{account?.ansName?.toString() ?? ''}</p>}
        {network && <p>chainId:{network?.chainId ?? ''}</p>}
        {network && <p>networkName:{network?.name?.toString() ?? ''}</p>}
        {network && <p>networkUrl:{network?.url?.toString() ?? ''}</p>}
        {account && <p>Status :{connected ? 'Connected' : 'Disconnected'}</p>}
      </InfoLayout>
    </>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={true}
        dappConfig={{
          network: Network.MAINNET,
        }}
        // @ts-expect-error
        optInWallets={['Petra', 'OneKey', 'OKX Wallet', 'Nightly', 'Mizu Wallet', 'Pontem Wallet']}
        onError={(error) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          console.log('error', error);
        }}
      >
        <AptosConnectButton />
        <Example />
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
