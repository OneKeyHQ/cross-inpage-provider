import React from 'react';
import { useState, useEffect, useMemo } from 'react';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';
import { JsonRpcProvider, LocalTxnDataSerializer, Base64DataBuffer } from '@mysten/sui.js';
import { WalletProvider, useWallet } from "@mysten/wallet-adapter-react";
import { WalletStandardAdapterProvider } from "@mysten/wallet-adapter-all-wallets";
import { buildTransfer, buildTransferPay } from '../sui/utils';
import { Box, Modal, Text, Image, Pressable, VStack } from 'native-base';


function DappTest() {
  const [network, setNetwork] = useState<string>('TestNet');
  const [address, setAddress] = useState<string>();

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { connected, getAccounts, signAndExecuteTransaction: signAndSendTransaction, disconnect } = useWallet();

  useEffect(() => {
    void getAccounts().then(accounts => {
      const [address] = accounts || [];
      if (address) setAddress(address);
    }).catch(() => {
      // ignore
    })
  }, [getAccounts])

  const rpcProvider = useMemo(() => {
    if (network.toLowerCase() === 'testnet') {
      return new JsonRpcProvider('https://fullnode.testnet.sui.io', {
        faucetURL: 'https://faucet.testnet.sui.io/gas',
      });
    } else {
      return new JsonRpcProvider('https://fullnode.devnet.sui.io', {
        faucetURL: 'https://faucet.devnet.sui.io/gas',
      });
    }
  }, [network])

  const requestSuiFromFaucet = async () => {
    try {
      const [address] = await getAccounts();
      const faucet = await rpcProvider.requestSuiFromFaucet(address);
      console.log('[requestSuiFromFaucet] faucet success:', faucet);
    } catch (err) {
      console.warn(err);
      console.log(`[error] requestSuiFromFaucet: ${JSON.stringify(err)}`);
    }
  }

  const _getAccounts = async () => {
    try {
      const accounts = await getAccounts();
      console.log('[getAccounts] accounts:', accounts);
    } catch (err) {
      console.warn(err);
      console.log(`[error] getAccounts: ${JSON.stringify(err)}`);
    }
  }

  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.warn(err);
      console.log(`[error] disconnect: ${JSON.stringify(err)}`);
    }
  };


  const signAndExecuteTransaction = async (hasBytes = false) => {
    try {
      const [address] = await getAccounts();
      const transfer = hasBytes ? (await buildTransferPay(rpcProvider, address, address, '100000')) : (await buildTransfer(rpcProvider, address, address, '100000'));

      let res: unknown = null
      if (hasBytes) {
        const serializer = new LocalTxnDataSerializer(rpcProvider)

        let tnx: Base64DataBuffer = null
        if (transfer.kind === 'paySui') {
          tnx = await serializer.newPaySui(address, transfer.data)
        } else if (transfer.kind === 'pay') {
          tnx = await serializer.newPay(address, transfer.data)
        }

        if (!tnx) throw new Error('tnx is null')

        res = await signAndSendTransaction({
          kind: 'bytes',
          data: tnx.getData()
        });
      } else {
        res = await signAndSendTransaction(transfer);
      }

      console.log('[signAndExecuteTransaction]', res);
    } catch (err) {
      console.warn(err);
      console.log(`[error] signAndExecuteTransaction: ${JSON.stringify(err)}`);
    }
  };

  return (
    <div>
      <DAppList dapps={dapps} />

      {connected &&
        <>
          <div>
            <pre>Network: <select value={network} onChange={(e) => setNetwork(e.target.value)}>
              <option value="TestNet">TestNet</option>
              <option value="DevNet">DevNet</option>
            </select></pre>
            <pre>Connected as: {address}</pre>
            <button onClick={requestSuiFromFaucet}>Faucet SUI</button>
          </div >

          <br />
          <button onClick={_getAccounts}>Get Accounts</button>
          <button onClick={async () => await signAndExecuteTransaction()}>Sign & Execute Transaction</button>
          <button onClick={async () => await signAndExecuteTransaction(true)}>Sign & Execute Transaction (Bytes)</button>
          <button onClick={() => disconnectWallet()}>Disconnect</button>
        </>
      }
    </div >


  );
}

function ConnectWalletModal() {
  const { connected } = useWallet();

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };


  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { wallets, wallet, select, connecting } = useWallet();

  const handleConnect = (walletName: string) => {
    select(walletName);
  };

  useEffect(() => {
    if (connected && !connecting) {
      setOpen(false);
    }
  }, [connecting, connected])

  return (
    <>
      {!connected && (
        <>
          <button onClick={handleClickOpen}>
            Connect To Wallet
          </button>
          <Modal isOpen={open} onClose={handleClose}>
            <Modal.Content marginBottom="auto"
              marginTop={0}>
              <Modal.CloseButton />
              <Modal.Header>Select Wallet</Modal.Header>
              <Modal.Body>
                <>
                  {!connecting && (
                    <Box >
                      <VStack space={2}>
                        {wallets.map((wallet) => (
                          <Pressable onPress={() => handleConnect(wallet.name)}>
                            <Box flexDirection='row' justifyContent='space-between' alignItems='center' bg="green.100" borderRadius={20} px={4} minH={60}>
                              <Text>{wallet.name}</Text>
                              <Image size='10' source={{
                                uri: wallet.icon
                              }} />
                            </Box>
                          </Pressable>
                        ))}
                      </VStack>
                    </Box>
                  )}
                  {connecting && (
                    <Box>
                      <Text
                      >
                        Connecting to {wallet ? wallet.name : "Wallet"}
                      </Text>
                      <progress />
                    </Box>
                  )}
                </>
              </Modal.Body>
            </Modal.Content>
          </Modal>
        </>
      )}
    </>
  );
}

export default function App() {
  const walletAdapters = useMemo(
    () => [new WalletStandardAdapterProvider()], []
  );

  return (
    <WalletProvider adapters={walletAdapters}>
      <DappTest />
      <ConnectWalletModal />
    </WalletProvider >
  )
}