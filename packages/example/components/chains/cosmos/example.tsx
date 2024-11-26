/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
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
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import InfoLayout from '../../../components/InfoLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import params, { networks } from './params';
import { CosmosNodeClient } from './rpc';
import { toast } from '../../ui/use-toast';
import { Textarea } from '../../ui/textarea';

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
      inject: 'keplr',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.cosmos',
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

      await provider?.enable(network.id);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
      const { bech32Address, pubKey } = await provider?.getKey(network.id);

      return {
        provider,
        address: bech32Address,
        publicKey: bytesToHex(pubKey),
      };
    },
    [network.id],
  );

  const onDisconnectWallet = useCallback(async () => {
    if (provider) {
      await provider?.disconnect();
    }
  }, [provider]);

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
                name: wallet.inject ? wallet.name : `${wallet.name} (EIP6963)`,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
        onDisconnect={onDisconnectWallet}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="enable"
          description="enable"
          presupposeParams={params.enable}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await provider?.enable(obj);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getKey"
          description="获取账户权限"
          presupposeParams={[
            {
              id: 'getKey',
              name: 'getKey',
              value: network.id,
            },
          ]}
          onExecute={async (request: string) => {
            return await provider?.getKey(network.id);
          }}
        />
        <ApiPayload
          title="experimentalSuggestChain"
          description="获取账户权限"
          presupposeParams={[
            {
              id: 'experimentalSuggestChain',
              name: 'experimentalSuggestChain',
              value: network.id,
            },
          ]}
          onExecute={async (request: string) => {
            const res = await provider?.experimentalSuggestChain(network.id);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Sign Message">
        <ApiPayload
          title="signArbitrary"
          description="signArbitrary"
          presupposeParams={params.signArbitrary}
          onExecute={async (request: string) => {
            const res = await provider?.signArbitrary(network.id, account.address, request);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="verifyArbitrary"
          description="verifyArbitrary"
          presupposeParams={params.signArbitrary}
          onExecute={async (request: string) => {
            const res = await provider?.signArbitrary(network.id, account.address, request);
            const verifyRes = await provider?.verifyArbitrary(
              network.id,
              account.address,
              request,
              res,
            );
            return JSON.stringify(verifyRes);
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

            return await provider?.signAmino(network.id, account.address, requestObj);
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

            const res = await provider?.signDirect(network.id, account.address, {
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
        <ApiPayload
          title="sendTx"
          description="sendTx"
          generateRequestFrom={() => {
            return <Textarea name="tx" placeholder="将 signDirect 的执行结果复制粘贴到这里" />;
          }}
          // eslint-disable-next-line @typescript-eslint/require-await
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const requestTx = JSON.parse(fromData?.['tx'] as string);

            let encodeTx = '';
            if (requestTx?.signed?.bodyBytes && requestTx?.signed?.authInfoBytes) {
              // Direct sign
              const bodyBytes = new Uint8Array(Buffer.from(requestTx?.signed?.bodyBytes));
              const authInfoBytes = new Uint8Array(Buffer.from(requestTx?.signed?.authInfoBytes));
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              const signatures = [Buffer.from(requestTx?.signature?.signature ?? '', 'base64')];

              const txRaw = TxRaw.encode(
                TxRaw.fromPartial({
                  bodyBytes: bodyBytes,
                  authInfoBytes: authInfoBytes,
                  signatures,
                }),
              ).finish();
              encodeTx = Buffer.from(txRaw).toString('hex');
            } else {
              // Amino sign
              throw new Error('Not support generate amino Tx');
            }

            return encodeTx;
          }}
          onExecute={async (request: string) => {
            const tx = hexToBytes(request);
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
