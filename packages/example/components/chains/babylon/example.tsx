/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import ConnectButton from '../../connect/ConnectButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing';
import { get, isEmpty } from 'lodash-es';

import {
  TomoContextProvider,
  useTomoModalControl,
  useTomoProviders,
  useTomoWalletConnect,
  useTomoWalletState,
  useWalletList,
} from '@tomo-inc/wallet-connect-sdk';

import * as bitcoin from 'bitcoinjs-lib';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import Long from 'long';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { PubKey } from 'cosmjs-types/cosmos/crypto/ed25519/keys';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { AuthInfo, Fee, SignerInfo, Tx, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../connect/WalletContext';
import type { IKnownWallet } from '../../connect/types';
import DappList from '../../DAppList';
import InfoLayout from '../../InfoLayout';
import paramsCosmos from '../cosmosBabylon/params';
import paramsBtc from '../btcBabylon/params';
import { toast } from '../../ui/use-toast';
import { Button } from '../../ui/button';

import '@tomo-inc/wallet-connect-sdk/style.css';
import { verifyMessage } from '@unisat/wallet-utils';
import { Verifier } from 'bip322-js';
import { Input } from '../../ui/input';
import { createPSBT } from '../btc/utils';

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

function Example() {
  const tomoModal = useTomoModalControl();
  const tomoWalletConnect = useTomoWalletConnect();

  // Check wallet connection status
  const tomowalletState = useTomoWalletState();
  const connected = tomowalletState.isConnected;

  // Check all the supported wallets
  const supportedWallets = useWalletList();

  // Get provider
  const providers = useTomoProviders();
  console.log('providers', providers);
  const providerBitcoin = providers.bitcoinProvider ?? undefined;
  const providerCosmos = providers.cosmosProvider ?? undefined;

  console.log('providerBitcoin', providerBitcoin);
  console.log('providerCosmos', providerCosmos);

  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'bitcoin',
      name: 'BTC',
      inject: 'bitcoin',
    },
    {
      uuid: 'cosmos',
      name: 'Cosmos',
      inject: 'cosmos',
    },
  ]);

  const { setProvider, setAccount, account } = useWallet<'bitcoin' | 'cosmos'>();

  const onConnectWallet = useCallback(
    async (selectedWallet: IKnownWallet) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
      if (!providerDetail) {
        return Promise.reject('Wallet not found');
      }

      const result = await tomoModal.open(providerDetail.inject as 'bitcoin' | 'cosmos');
      console.log('xxxx', result);

      const connected = result.walletState.isConnected;
      let address = undefined;
      if (result.walletState.cosmos.connected) {
        address = result.walletState.cosmos.address;
      }
      if (result.walletState.bitcoin.connected) {
        address = result.walletState.bitcoin.address;
      }

      if (connected && !address) {
        toast({
          title: 'Wallet not found',
          description: 'Please install the wallet extension',
        });
        return;
      }

      return {
        provider: providerDetail.inject,
        address: address ?? '',
      };
    },
    [tomoModal],
  );

  useEffect(() => {
    if (tomowalletState?.cosmos?.connected) {
      setProvider('cosmos');
      setAccount({
        address: tomowalletState.cosmos.address,
        chainId: tomowalletState.cosmos.chainId.toString(),
      });
    }
    if (tomowalletState?.bitcoin?.connected) {
      setProvider('bitcoin');
      setAccount({
        address: tomowalletState.bitcoin.address,
        chainId: tomowalletState.bitcoin.chainId.toString(),
      });
    }
  }, [setAccount, setProvider, tomowalletState]);

  return (
    <>
      <InfoLayout title="Base Info">
        <div>
          <p>btc network: {tomowalletState?.bitcoin?.network}</p>
          <p>btc address: {tomowalletState?.bitcoin?.address}</p>
          <p>btc chainId: {tomowalletState?.bitcoin?.chainId}</p>
          <p>btc chainType: {tomowalletState?.bitcoin?.chainType}</p>
          <p>btc walletId: {tomowalletState?.bitcoin?.walletId}</p>
          <br />
          <p>cosmos network: {tomowalletState?.cosmos?.network}</p>
          <p>cosmos address: {tomowalletState?.cosmos?.address}</p>
          <p>cosmos chainId: {tomowalletState?.cosmos?.chainId}</p>
          <p>cosmos chainType: {tomowalletState?.cosmos?.chainType}</p>
          <p>cosmos walletId: {tomowalletState?.cosmos?.walletId}</p>
        </div>
      </InfoLayout>

      <ConnectButton
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
        onDisconnect={tomoWalletConnect.disconnect}
      />
      <ApiGroup title="BTC Basics">
        <ApiPayload
          title="connectWallet"
          description="connectWallet"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (_request: string) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await providerBitcoin?.connectWallet();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getKey"
          description="获取账户权限"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (_request: string) => {
            return await providerBitcoin?.getPublicKeyHex();
          }}
        />
        <ApiPayload
          title="getAddress"
          description="获取账户地址"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (_request: string) => {
            return await providerBitcoin?.getAddress();
          }}
        />
        <ApiPayload
          title="getNetwork"
          description="获取账户网络"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (_request: string) => {
            return await providerBitcoin?.getNetwork();
          }}
        />
        <ApiPayload
          title="getNetworkFees"
          description="获取网络费用"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (_request: string) => {
            return await providerBitcoin?.getNetworkFees();
          }}
        />
        <ApiPayload
          title="getWalletProviderName"
          description="获取钱包提供者名称"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (_request: string) => {
            return await providerBitcoin?.getWalletProviderName();
          }}
        />
        <ApiPayload
          title="getWalletProviderIcon"
          description="获取钱包提供者图标"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (_request: string) => {
            return await providerBitcoin?.getWalletProviderIcon();
          }}
        />
      </ApiGroup>

      <ApiGroup title="Cosmos Basics">
        <ApiPayload
          title="connectWallet"
          description="connectWallet"
          allowCallWithoutProvider={!!providerCosmos}
          onExecute={async (_request: string) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await providerCosmos?.connectWallet();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getKey"
          description="获取账户权限"
          allowCallWithoutProvider={!!providerCosmos}
          onExecute={async (_request: string) => {
            return await providerCosmos?.getPublicKeyHex();
          }}
        />
        <ApiPayload
          title="getAddress"
          description="获取账户地址"
          allowCallWithoutProvider={!!providerCosmos}
          onExecute={async (_request: string) => {
            return await providerCosmos?.getAddress();
          }}
        />
        <ApiPayload
          title="getNetwork"
          description="获取账户网络"
          allowCallWithoutProvider={!!providerCosmos}
          onExecute={async (_request: string) => {
            return await providerCosmos?.getNetwork();
          }}
        />
        <ApiPayload
          title="getWalletProviderName"
          description="获取钱包提供者名称"
          allowCallWithoutProvider={!!providerCosmos}
          onExecute={async (_request: string) => {
            return await providerCosmos?.getWalletProviderName();
          }}
        />
        <ApiPayload
          title="getWalletProviderIcon"
          description="获取钱包提供者图标"
          allowCallWithoutProvider={!!providerCosmos}
          onExecute={async (_request: string) => {
            return await providerCosmos?.getWalletProviderIcon();
          }}
        />
      </ApiGroup>

      <ApiGroup title="BTC Sign Message">
        <ApiPayload
          title="SignMessage"
          description="签名消息"
          presupposeParams={paramsBtc.signMessage}
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as { msg: string; type: 'ecdsa' | 'bip322-simple' };
            const res = await providerBitcoin?.signMessage(obj.msg, obj.type);
            return res;
          }}
          onValidate={async (request: string, response: string) => {
            const obj = JSON.parse(request) as { msg: string; type: string | undefined };
            const publicKey = await providerBitcoin?.getPublicKeyHex();

            if (!obj.type || obj.type === 'ecdsa') {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return verifyMessage(publicKey, obj.msg, response);
            }

            if (obj.type === 'bip322-simple') {
              return Verifier.verifySignature(account.address, obj.msg, response);
            }
            return 'Dapp Example: 不支持的类型签字的验证';
          }}
        />
        <ApiPayload
          title="SignMessageBIP322"
          description="签名消息 BIP322"
          presupposeParams={paramsBtc.signMessageBip322}
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (request: string) => {
            const res = await providerBitcoin?.signMessageBIP322(request);
            return res;
          }}
          onValidate={async (request: string, response: string) => {
            return Promise.resolve(Verifier.verifySignature(account.address, request, response));
          }}
        />
      </ApiGroup>

      <ApiGroup title="BTC Transaction">
        <ApiPayload
          title="SendBitcoin"
          description="发送交易"
          allowCallWithoutProvider={!!providerBitcoin}
          presupposeParams={paramsBtc.sendBitcoin(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as { toAddress: string; satoshis: number };
            const res = await providerBitcoin?.sendBitcoin(obj.toAddress, obj.satoshis);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="pushTx"
          description="广播交易"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (request: string) => {
            if (!request || isEmpty(request)) {
              toast({
                title: 'Error',
                description: '请填写需要广播的交易信息',
              });
              throw new Error('request is empty');
            }

            const res = await providerBitcoin?.pushTx(request);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signPsbt"
          description="signPsbt"
          presupposeParams={paramsBtc.signPsbt}
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (request: string) => {
            const { psbtHex, options } = JSON.parse(request) as {
              psbtHex: string;
              options?: any;
            };
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await providerBitcoin?.signPsbt(psbtHex);

            const psbt = bitcoin.Psbt.fromHex(res);
            if (!options?.autoFinalized) {
              psbt.finalizeAllInputs();
            }
            return psbt.toHex();
          }}
          generateRequestFrom={() => {
            return (
              <>
                <Input
                  label="收款地址"
                  type="text"
                  name="toAddress"
                  defaultValue={account?.address ?? ''}
                />
                <Input label="转账金额" type="number" name="amount" defaultValue="1000" />
                <Input label="手续费 sat/vB" type="number" name="gasPrice" defaultValue="20" />
              </>
            );
          }}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const toAddress = fromData['toAddress'] as string;
            const amount = parseInt(fromData['amount'] as string);
            const gasPrice = parseInt((fromData['gasPrice'] as string) ?? '20');

            if (!toAddress || !amount) {
              throw new Error('toAddress or amount is required');
            }

            const network = await providerBitcoin?.getNetwork();

            const psbt = createPSBT(
              account?.address ?? '',
              toAddress,
              amount,
              gasPrice,
              network === 'testnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
            );

            return Promise.resolve(psbt);
          }}
          onValidate={async (_request: string, response: string) => {
            const res = await providerBitcoin?.pushTx(response);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signPsbts"
          description="signPsbts"
          presupposeParams={paramsBtc.signPsbts}
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (request: string) => {
            const { psbtHexs, options } = JSON.parse(request) as {
              psbtHexs: string[];
              options?: any[];
            };
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await providerBitcoin?.signPsbts(psbtHexs);

            const result: string[] = [];
            res.forEach((psbt, index) => {
              const psbtObj = bitcoin.Psbt.fromHex(psbt);
              if (!options?.[index]?.autoFinalized) {
                psbtObj.finalizeAllInputs();
              }
              result.push(psbtObj.toHex());
            });

            return JSON.stringify(result);
          }}
          generateRequestFrom={() => {
            return (
              <>
                <Input
                  label="收款地址"
                  type="text"
                  name="toAddress"
                  defaultValue={account?.address ?? ''}
                />
                <Input label="转账金额" type="number" name="amount" defaultValue="1000" />
                <Input label="手续费 sat/vB" type="number" name="gasPrice" defaultValue="20" />
              </>
            );
          }}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const toAddress = fromData['toAddress'] as string;
            const amount = parseInt(fromData['amount'] as string);
            const gasPrice = parseInt((fromData['gasPrice'] as string) ?? '20');

            if (!toAddress || !amount) {
              throw new Error('toAddress or amount is required');
            }

            const network = await providerBitcoin?.getNetwork();

            const psbt = await createPSBT(
              account?.address ?? '',
              toAddress,
              amount,
              gasPrice,
              network === 'testnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
            );

            const pabtObj = JSON.parse(psbt);

            return Promise.resolve(
              JSON.stringify({
                psbtHexs: [pabtObj.psbtHex],
                options: [pabtObj.options],
              }),
            );
          }}
          onValidate={async (_request: string, response: string) => {
            const [psbtHexs] = JSON.parse(response);
            return await providerBitcoin?.pushTx(psbtHexs);
          }}
        />
        <ApiPayload
          title="pushPsbt"
          description="pushPsbt"
          allowCallWithoutProvider={!!providerBitcoin}
          onExecute={async (request: string) => {
            if (!request || isEmpty(request)) {
              toast({
                title: 'Error',
                description: '请填写需要广播的交易信息',
              });
              throw new Error('request is empty');
            }
            const res = await providerBitcoin?.pushTx(request);
            return res;
          }}
        />
      </ApiGroup>

      <ApiGroup title="Cosmos Transfer">
        <ApiPayload
          title="signAmino"
          description="signAmino"
          presupposeParams={paramsCosmos.signAmino(account?.address, account?.address, 'ubbn')}
          allowCallWithoutProvider={!!providerCosmos}
          onExecute={async (request: string) => {
            if (!account) return JSON.stringify({ error: 'account is null' });

            const network = await providerCosmos?.createSigningStargateClient();
            const accountInfo = await network.getAccount(account?.address);
            const chainId = await network.getChainId();

            const obj = JSON.parse(request);

            const requestObj = {
              chain_id: chainId,
              account_number: accountInfo?.accountNumber,
              sequence: accountInfo?.sequence,
              fee: obj.fee,
              memo: obj.memo,
              msgs: obj.msgs,
            };
            const signer = await providerCosmos?.getOfflineSigner();
            return await signer.signAmino(account.address, requestObj);
          }}
        />
        <ApiPayload
          title="signDirect"
          description="signDirect"
          presupposeParams={paramsCosmos.signDirect(account?.address, account?.address, 'ubbn')}
          allowCallWithoutProvider={!!providerCosmos}
          onExecute={async (request: string) => {
            const network = await providerCosmos?.createSigningStargateClient();

            const sequence = await network.getSequence(account?.address);
            const chainId = await network.getChainId();

            const obj = JSON.parse(request);

            const signer = await providerCosmos?.getOfflineSigner();
            const res = await signer.signDirect(account.address, {
              bodyBytes: Buffer.from(obj.signDoc.bodyBytes, 'hex'),
              authInfoBytes: Buffer.from(obj.signDoc.authInfoBytes, 'hex'),
              chainId: chainId,
              accountNumber: Long.fromNumber(sequence?.accountNumber),
            });
            return res;
          }}
          onValidate={async (_request: string, response: string) => {
            const tx = hexToBytes(response);
            const res = await providerCosmos?.broadcastTx(tx);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

// await tomoWalletConnect.disconnect();
export function ChildComponent() {
  const tomoModal = useTomoModalControl();
  const tomoWalletConnect = useTomoWalletConnect();

  return (
    <div style={{ textAlign: 'right' }}>
      <Button
        onClick={async () => {
          await tomoModal.open('cosmos');
        }}
      >
        Connect Wallet
      </Button>
      <Button
        onClick={async () => {
          await tomoWalletConnect.disconnect();
        }}
      >
        Disconnect Wallet
      </Button>
    </div>
  );
}

export default function Demo() {
  return (
    <TomoContextProvider
      chainTypes={['cosmos', 'bitcoin']}
      cosmosChains={[
        {
          id: 1,
          name: 'Babylon Main',
          type: 'cosmos',
          network: 'bbn-1',
          backendUrls: { rpcUrl: 'https://babylon.nodes.guru' },
        },
        {
          id: 2,
          name: 'Babylon Test',
          type: 'cosmos',
          network: 'bbn-test-5',
          backendUrls: { rpcUrl: 'https://babylon-testnet-rpc.nodes.guru' },
        },
      ]}
      style={{
        rounded: 'medium',
        theme: 'light',
        primaryColor: '#FF7C2A',
      }}
    >
      <Example />
      <ChildComponent />
    </TomoContextProvider>
  );
}
