/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import ConnectButton from '../../connect/ConnectButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing';
import { get } from 'lodash-es';

import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import Long from 'long';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { PubKey } from 'cosmjs-types/cosmos/crypto/ed25519/keys';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { AuthInfo, Fee, SignerInfo, Tx, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../connect/WalletContext';
import type { IKnownWallet } from '../../connect/types';
import DappList from '../../DAppList';
import InfoLayout from '../../InfoLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import params, { networks } from './params';
import { CosmosNodeClient } from './rpc';
import { toast } from '../../ui/use-toast';

function removeNull(obj: any): any {
  if (obj !== null && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Object.entries(obj)
      .filter(([, v]) => v != null)
      .reduce(
        (acc, [k, v]) => ({
          ...acc,
          [k]: v === Object(v) && !Array.isArray(v) ? removeNull(v) : v,
        }),
        {},
      );
  }

  return obj;
}

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'bbnwallet',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.bbnwallet',
    },
  ]);

  const { provider, account } = useWallet<IProviderApi>();
  const [nodeClient, setNodeClient] = useState<CosmosNodeClient | null>(null);

  const [network, setNetwork] = useState<{
    name: string;
    id: string;
    rest: string;
    denom: string;
  }>(networks[0]);

  useEffect(() => {
    if (network?.rest === '') return;
    setNodeClient(new CosmosNodeClient(network.rest));
  }, [network?.rest]);

  const onConnectWallet = useCallback(
    async (selectedWallet: IKnownWallet) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
      if (!providerDetail) {
        return Promise.reject('Wallet not found');
      }

      const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

      if (!provider) {
        toast({
          title: 'Wallet not found',
          description: 'Please install the wallet extension',
        });
        return;
      }

      console.log('connect network', network.id);

      await provider?.connectWallet();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
      const pubKey = await provider?.getPublicKeyHex();
      const address = await provider?.getAddress();

      return {
        provider,
        address: address,
        publicKey: pubKey,
      };
    },
    [network.id],
  );

  return (
    <>
      <InfoLayout title="Base Info">
        <Select
          defaultValue={network.id}
          onValueChange={(id) => {
            const net = networks.find((item) => item.id === id);
            if (net) setNetwork(net);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue className="text-base font-medium" placeholder="选择参数" />
          </SelectTrigger>
          <SelectContent>
            {networks.map((item) => {
              return (
                <SelectItem key={item.id} value={item.id} className="text-base font-medium">
                  {item.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </InfoLayout>

      <ConnectButton<IProviderApi>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.uuid,
                name: wallet.inject ? wallet.name : `${wallet.name}`,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="connectWallet"
          description="connectWallet"
          onExecute={async (request: string) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await provider?.connectWallet();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getKey"
          description="获取账户权限"
          onExecute={async (request: string) => {
            return await provider?.getPublicKeyHex();
          }}
        />
        <ApiPayload
          title="getAddress"
          description="获取账户地址"
          onExecute={async (request: string) => {
            return await provider?.getAddress();
          }}
        />
        <ApiPayload
          title="getWalletProviderName"
          description="获取钱包提供者名称"
          onExecute={async (request: string) => {
            return await provider?.getWalletProviderName();
          }}
        />
        <ApiPayload
          title="getWalletProviderIcon"
          description="获取钱包提供者图标"
          onExecute={async (request: string) => {
            return await provider?.getWalletProviderIcon();
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transfer">
        <ApiPayload
          title="signAmino"
          description="signAmino"
          presupposeParams={params.signAmino(account?.address, account?.address, network.denom)}
          onExecute={async (request: string) => {
            if (!nodeClient) return JSON.stringify({ error: 'nodeClient is null' });
            if (!account) return JSON.stringify({ error: 'account is null' });

            const accountInfo = await nodeClient.getAccountInfo(account?.address);

            const obj = JSON.parse(request);

            const requestObj = {
              chain_id: network.id,
              account_number: accountInfo?.account_number,
              sequence: accountInfo?.sequence,
              fee: obj.fee,
              memo: obj.memo,
              msgs: obj.msgs,
            };
            const signer = await provider?.getOfflineSigner();
            console.log('======>>>>>> ', account.address, requestObj);
            return await signer.signAmino(account.address, requestObj);
          }}
          onValidate={async (request: string, response: string) => {
            return await nodeClient.encodeAmino(response);
          }}
        />
        <ApiPayload
          title="signDirect"
          description="signDirect"
          presupposeParams={params.signDirect(account?.address, account?.address, network.denom)}
          onExecute={async (request: string) => {
            const accountInfo = await nodeClient.getAccountInfo(account?.address);

            const obj = JSON.parse(request);

            const pubKeyAny = Any.fromPartial({
              typeUrl: '/cosmos.crypto.secp256k1.PubKey',
              value: Uint8Array.from(
                PubKey.encode(
                  PubKey.fromPartial({
                    key: hexToBytes(account.publicKey),
                  }),
                ).finish(),
              ),
            });

            const msgs:
              | {
                  typeUrl: string;
                  value: Uint8Array;
                }[]
              | undefined = obj.msgs?.map((msg: { type: string; value: any }) => {
              const value = msg.value;
              if (msg.type === '/cosmos.bank.v1beta1.MsgSend') {
                return {
                  typeUrl: '/cosmos.bank.v1beta1.MsgSend',
                  value: MsgSend.encode(
                    MsgSend.fromPartial({
                      fromAddress: value.from_address,
                      toAddress: value.to_address,
                      amount: value.amount?.map((amount: any) => ({
                        amount: amount.amount,
                        denom: amount.denom,
                      })),
                    }),
                  ).finish(),
                };
              } else if (msg.type === '/cosmwasm.wasm.v1.MsgExecuteContract') {
                return {
                  typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
                  value: MsgExecuteContract.encode(
                    MsgExecuteContract.fromPartial({
                      sender: value.sender,
                      contract: value.contract,
                      msg: Buffer.from(JSON.stringify(removeNull(value.msg))),
                      funds: value.funds?.map((amount: any) => ({
                        amount: amount.amount,
                        denom: amount.denom,
                      })),
                    }),
                  ).finish(),
                };
              }
            });

            if (!msgs) return JSON.stringify({ error: 'msgs is null' });

            const bodyBytes = TxBody.encode(
              TxBody.fromPartial({
                messages: msgs?.map((msg) => ({
                  typeUrl: msg.typeUrl,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  value: msg.value,
                })),
                memo: obj.memo,
              }),
            ).finish();

            console.log('bodyBytes', bodyBytes);
            const authInfoBytes = AuthInfo.encode({
              signerInfos: [
                SignerInfo.fromPartial({
                  publicKey: pubKeyAny,
                  modeInfo: {
                    single: {
                      mode: SignMode.SIGN_MODE_DIRECT,
                    },
                  },
                  sequence: BigInt(accountInfo?.sequence),
                }),
              ],
              fee: Fee.fromPartial({
                amount: obj.fee.amount.map((amount: any) => ({
                  amount: amount.amount,
                  denom: amount.denom,
                })),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                gasLimit: BigInt(get<string>(obj, 'fee.gas', '0')),
              }),
            }).finish();

            console.log('authInfoBytes', authInfoBytes);

            const signer = await provider?.getOfflineSigner();
            console.log('======>>>>>> ', account.address, {
              bodyBytes: bodyBytes,
              authInfoBytes: authInfoBytes,
              chainId: network.id,
              accountNumber: Long.fromString(accountInfo?.account_number),
            });
            const res = await signer.signDirect(account.address, {
              bodyBytes: bodyBytes,
              authInfoBytes: authInfoBytes,
              chainId: network.id,
              accountNumber: Long.fromString(accountInfo?.account_number),
            });
            return res;
          }}
          onValidate={async (request: string, response: string) => {
            const tx = hexToBytes(response);
            // @ts-expect-error
            const res = await provider?.sendTx(network.id, tx, 'Sync');
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
