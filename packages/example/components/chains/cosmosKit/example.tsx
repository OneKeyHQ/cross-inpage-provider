/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { assetLists, chains } from "chain-registry";
import {
  BaseWallet,
  EthereumWallet,
  isMobile,
  MultiChainWallet,
  SolanaWallet,
  WCWallet,
} from "@interchain-kit/core";
import '@interchain-kit/react/styles.css';
import {
  ChainProvider,
  InterchainWalletModal,
  useChainWallet,
  useWalletManager,
  useWalletModal,
} from "@interchain-kit/react";
import { walletConnect } from "@interchain-kit/core";
import { keplrWallet } from "@interchain-kit/keplr-extension";
import { onekeyWallet } from "@interchain-kit/onekey-extension";
import { onekeyMobile } from "@interchain-kit/onekey-mobile";
import { leapMobile } from "@interchain-kit/leap-mobile";
import { useRef, useState } from "react";
import { Chain, AssetList } from "@chain-registry/types";
import { coins } from "@cosmjs/amino";
import { getBalance } from "interchainjs/cosmos/bank/v1beta1/query.rpc.func";
import QRCode from "react-qr-code";
import { send } from "interchainjs/cosmos/bank/v1beta1/tx.rpc.func";
import { ethers } from "ethers";

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { MsgSend } from "interchainjs/cosmos/bank/v1beta1/tx";
import { ChainWalletStore, WalletStore } from "@interchain-kit/store";

type BalanceProps = {
  address: string;
  wallet: ChainWalletStore;
  chainName: string;
  chainId: string;
  chain: Chain;
  assetList: AssetList;
};

const BalanceTd = ({ address, wallet, chain, assetList }: BalanceProps) => {
  const { rpcEndpoint } = useChainWallet(
    chain.chainName,
    wallet.info.name
  );

  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<any>();

  const handleBalanceQuery = async () => {
    let balance;

    setIsLoading(true);

    if (chain.chainType === "cosmos") {
      balance = await getBalance(rpcEndpoint as string, {
        address,
        denom:
          (chain.staking?.stakingTokens[0].denom ) ||
          assetList.assets[0].base,
      });
    }
    if (chain.chainType === "eip155") {
      // @ts-ignore
      const provider = await wallet.getProvider(chain.chainId);
      // provider = new ethers.providers.JsonRpcProvider(rpcEndpoint as string);

      const ethProvider = new ethers.providers.Web3Provider(provider);
      const result = await ethProvider.getBalance(address);

      balance = { balance: { amount: result.toString() } };
    }
    if (chain.chainType === "solana") {
      const connection = new Connection(rpcEndpoint as string, "confirmed");
      const result = await connection.getBalance(new PublicKey(address));
      balance = { balance: { amount: result.toString() } };
    }

    setBalance(balance);
    setIsLoading(false);
  };

  return (
    <td>
      <div>
        <button className="bg-blue-100 p-1 m-1" onClick={handleBalanceQuery}>
          refresh balance
        </button>
      </div>
      <div>
        <span>balance: </span>
        <span>{balance?.balance?.amount}</span>
      </div>
    </td>
  );
};

type SendTokenProps = {
  wallet: ChainWalletStore;
  address: string;
  chain: Chain;
};
const SendTokenTd = ({ wallet, address, chain }: SendTokenProps) => {
  const toAddressRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const { assetList, signingClient, isSigningClientLoading, rpcEndpoint } =
    useChainWallet(chain.chainName, wallet.info?.name );
  if (
    chain.chainType === "cosmos" &&
    (isSigningClientLoading || !signingClient)
  ) {
    return <td>loading...</td>;
  }

  const handleSendToken = async () => {
    if (!toAddressRef.current || !amountRef.current) {
      return;
    }

    if (chain.chainType === "cosmos") {
      const recipientAddress = toAddressRef.current.value;
      const denom =
        (chain.staking?.stakingTokens[0].denom ) ||
        assetList.assets[0].base;

      const fee = {
        amount: coins(25000, denom),
        gas: "100000",
      };

      const token = {
        amount: amountRef.current?.value ,
        denom,
      };

      const msgSend = MsgSend.fromPartial({
        fromAddress: address,
        toAddress: recipientAddress,
        amount: [token],
      });

      try {
        const tx = await send(
          signingClient ,
          address,
          msgSend,
          fee,
          "test"
        );
        console.log(tx);
      } catch (error) {
        console.error(error);
      }
    }

    if (chain.chainType === "eip155") {
      const transaction = {
        from: address,
        to: toAddressRef.current.value,
        value: `0x${parseInt(amountRef.current.value).toString(16)}`,
        // data: "0x",
      };

      let provider;
      if (wallet instanceof WCWallet) {
        provider = wallet.getProvider();
      }
      if (wallet instanceof EthereumWallet) {
        provider = wallet.getProvider(chain.chainId );
      }
      if (wallet instanceof MultiChainWallet) {
        const ethWallet = wallet.getWalletByChainType("eip155");
        provider = ethWallet.getProvider(chain.chainId );
      }
      provider = new ethers.providers.JsonRpcProvider(rpcEndpoint as string);
      // @ts-ignore
      const ethProvider = new ethers.providers.Web3Provider(provider);
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const signer = await ethProvider.getSigner();
      try {
        console.log(transaction);
        // await wallet.switchChain(chain.chainId as string);
        const tx = await signer.sendTransaction(transaction);
        console.log(tx);
        const txReceipt = await tx.wait();
        // @ts-ignore
        console.log("Transaction hash:", txReceipt?.hash);
        // @ts-ignore
        console.log(txResponse);
      } catch (error) {
        console.log(error);
      }
    }

    if (chain.chainType === "solana") {
      const connection = new Connection(rpcEndpoint as string, "confirmed");

      // 1. 构建转账指令
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(address), // Phantom 注入的用户地址
          toPubkey: new PublicKey(toAddressRef.current.value),
          lamports: Number(amountRef.current.value), // 0.1 SOL
        })
      );

      // 2. 获取最新区块哈希
      transaction.feePayer = new PublicKey(address);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      // const client = await wallet.getProvider(chain.chainId as string);
      //3. Phantom 签名
      // const signed = await client.signTransaction(transaction);
      // console.log(signed);

      const solanaWallet = wallet.getWalletOfType(SolanaWallet);

      const signed = await solanaWallet.signTransaction(transaction);

      // 4. 发送交易
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);
      console.log("交易已发送:", signature);
    }
  };

  return (
    <td>
      <div>
        <button className="bg-blue-100 p-1 m-1" onClick={handleSendToken}>
          Send Token to:
        </button>
        <input
          className="border-red-300 border-2 rounded-sm"
          ref={toAddressRef}
        />
      </div>
      <div>
        amount:{" "}
        <input className="border-red-300 border-2 rounded-sm" ref={amountRef} />
      </div>
    </td>
  );
};

const RpcTd = ({ wallet, address, chain }: SendTokenProps) => {
  const { rpcEndpoint, getRpcEndpoint } = useChainWallet(
    chain.chainName,
    wallet.info?.name
  );

  return (
    <td>
      <p>{rpcEndpoint as string}</p>
      <button className="bg-blue-100 p-1 m-1" onClick={getRpcEndpoint}>get rpc</button>
    </td>
  );
};

const AddressTd = ({ wallet, chain }: SendTokenProps) => {
  const { address, wallet: walletHandler } = useChainWallet(
    chain.chainName,
    wallet.info?.name
  );
  return (
    <td>
      <p>{address}</p>
      {/* @ts-ignore */}
      <button className="bg-blue-100 p-1 m-1" onClick={() => walletHandler.getAccount(chain.chainId)}>
        get account
      </button>
    </td>
  );
};

const ChainRow = ({
  chain,
  wallet,
}: {
  chain: Chain;
  wallet: ChainWalletStore;
}) => {
  const {
    address,
    rpcEndpoint,
    connect,
    disconnect,
    status,
    assetList,
    message,
  } = useChainWallet(chain.chainName, wallet.info?.name );
  return (
    <tr>
      <td>
        <button className="bg-blue-100 p-1 m-1" onClick={connect}>connect by chain</button>
        <button className="bg-blue-100 p-1 m-1" onClick={disconnect}>disconnect by chain</button>
      </td>
      <td>{chain.chainName}</td>
      <td>{chain.chainId}</td>
      <td>
        {status}:{message}
      </td>
      <RpcTd address={address} wallet={wallet} chain={chain} />
      <AddressTd address={address} wallet={wallet} chain={chain} />
      <BalanceTd
        address={address}
        chainId={chain.chainId }
        chainName={chain.chainName}
        wallet={wallet}
        chain={chain}
        assetList={assetList}
      />
      <SendTokenTd address={address} wallet={wallet} chain={chain} />
    </tr>
  );
};

const WalletConnectTd = ({ wallet }: { wallet: WalletStore }) => {
  const walletManager = useWalletManager();

  const chainIds = walletManager.chains.map((c) => c.chainId);

  const currentWallet = walletManager.wallets.find(
    (w: BaseWallet) => w.info?.name === wallet.info?.name
  );

  const connect = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    walletManager.connect(wallet.info?.name , "osmosis");
  };

  const disconnect = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    walletManager.disconnect(wallet.info?.name , "osmosis");
  };

  const uri = walletManager.walletConnectQRCodeUri;

  return (
    <td>
      <button className="bg-blue-100 p-1 m-1" onClick={connect}>
        connect
      </button>
      <button className="bg-blue-100 p-1 m-1" onClick={disconnect}>
        disconnect
      </button>
      {currentWallet instanceof WCWallet && uri && <QRCode value={uri} />}
      {wallet.errorMessage}
    </td>
  );
};

const E2ETest = () => {
  const walletManager = useWalletManager();
  const { open } = useWalletModal();

  return (
    <div>
      <table className="simple-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Pretty Name</th>
            <th>Connect</th>
            <th>State</th>
            <th>Chain</th>
          </tr>
        </thead>
        <tbody>
          {walletManager.wallets.map((wallet) => {
            return (
              <tr key={wallet.info?.name}>
                <td>{wallet.info?.name}</td>
                <td>{wallet.info?.prettyName}</td>
                <WalletConnectTd wallet={wallet} />
                <td>{wallet.walletState}</td>
                <td>
                  <table>
                    <thead>
                      <tr>
                        <th>connect</th>
                        <th>name</th>
                        <th>chainId</th>
                        <th>state</th>
                        <th>rpc</th>
                        <th>address</th>
                        <th>faucet</th>
                        <th>send token</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletManager.chains.map((chain) => {
                        return (
                          <ChainRow
                            chain={chain}
                            // @ts-ignore
                            wallet={wallet}
                            key={chain.chainId}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="bg-blue-100 p-1 m-1" onClick={open}>
        open modal
      </button>
      <div className="flex flex-col gap-2">
        <text>isMobile: {JSON.stringify(isMobile())}</text>
        <text>navigator.userAgent: {navigator.userAgent}</text>
      </div>
    </div>
  );
};


const chainNames: string[] = [
  "osmosis",
  "juno",
  "cosmoshub",
];

export default function CosmosKitExample() {
  const _chains = chains.filter((a) => chainNames.includes(a.chainName));
  const _assetLists = assetLists.filter((a) => chainNames.includes(a.chainName));

  return (
  <ChainProvider
      chains={_chains}
      wallets={[keplrWallet, onekeyWallet, onekeyMobile, leapMobile, walletConnect]}
      assetLists={_assetLists}
      walletModal={() => (
        <InterchainWalletModal
          modalThemeProviderProps={{ defaultTheme: 'light' }}
        />
      )}
      signerOptions={{}}
      endpointOptions={{}}
    >
        <E2ETest />
    </ChainProvider>
  );
}