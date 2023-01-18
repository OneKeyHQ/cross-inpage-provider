import React from 'react';
import { useState, useEffect } from 'react';
import { Key, ProviderCosmos } from '@onekeyfe/onekey-cosmos-provider';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';

declare global {
  interface Window {
    // @ts-expect-error
    keplr: ProviderCosmos;
  }
}

const useProvider = () => {
  const [provider, setProvider] = useState<ProviderCosmos>();

  useEffect(() => {
    const injectedProvider = window.keplr as ProviderCosmos;
    const cosmosProvider =
      injectedProvider ||
      new ProviderCosmos({
        // use mock api provider bridge for development
        // bridge: new CustomBridge(),
      });
    setProvider(cosmosProvider);
  }, []);

  return provider;
};

export default function App() {
  const provider = useProvider();

  const [network, setNetwork] = useState<string>('cosmoshub-4');
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);

  // useEffect(() => {
  //   if (!provider) return;
  //   provider.on('connect', (address: Key) => {
  //     setConnected(true);
  //     setAddress(bytesToHex(address.address));
  //     console.log(`cosmoshub.on [connect] ${bytesToHex(address.address)}`);
  //   });
  //   provider.on('disconnect', () => {
  //     setAddress(null);
  //     setConnected(false);
  //     console.log('cosmoshub.on [disconnect] 👋');
  //   });
  //   provider.on('keplr_keystorechange', () => {
  //     console.log(`cosmoshub.on [keplr_keystorechange] `);
  //   });
  //   return () => {
  //     void provider.disconnect();
  //   };
  // }, [provider]);

  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const connectWallet = async () => {
    try {
      await provider.enable(network);
      const account = await provider.getKey(network);

      setAddress(account.bech32Address);
      setConnected(true);

      console.log('[connectWallet] enable', account, network);
    } catch (err) {
      console.warn(err);
      console.log(`[error] enable: ${JSON.stringify(err)}`);
    }
  };

  const getKey = async () => {
    try {
      const account = await provider.getKey(network);

      setAddress(account.bech32Address);
      setConnected(true);

      console.log('[connectWallet] getKey', account, network);
    } catch (err) {
      console.warn(err);
      console.log(`[error] getKey: ${JSON.stringify(err)}`);
    }
  };

  const disconnectWallet = async () => {
    try {
      await provider.disconnect();
      setAddress(null);
      setConnected(false);

    } catch (err) {
      console.warn(err);
      console.log(`[error] disconnect: ${JSON.stringify(err)}`);
    }
  };

  const signAmino = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await provider.signAmino(network,
      address,
      {
        "chain_id": "cosmoshub-4",
        "account_number": "882469",
        "sequence": "12",
        "fee": {
          "amount": [
            {
              "amount": "1",
              "denom": "uatom"
            }
          ],
          "gas": "0"
        },
        "msgs": [
          {
            "type": "cosmos-sdk/MsgSend",
            "value": {
              "from_address": "cosmos1l8va6sd7caxkgk4vsnazaxavqn644ayqcn9sst",
              "to_address": "cosmos19c2m35cfae5lj89x9025plknhjlhe6raj3ma9t",
              "amount": [
                {
                  "amount": "1000",
                  "denom": "uatom"
                }
              ]
            }
          }
        ],
        "memo": ""
      }
    );
    console.log('[signAmino]', res);
  };

  const signOfflineSignerAmino = async () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const res = await window.getOfflineSignerOnlyAmino(network).signAmino(
      address,
      {
        "chain_id": "cosmoshub-4",
        "account_number": "882469",
        "sequence": "12",
        "fee": {
          "amount": [
            {
              "amount": "1",
              "denom": "uatom"
            }
          ],
          "gas": "0"
        },
        "msgs": [
          {
            "type": "cosmos-sdk/MsgSend",
            "value": {
              "from_address": "cosmos1l8va6sd7caxkgk4vsnazaxavqn644ayqcn9sst",
              "to_address": "cosmos19c2m35cfae5lj89x9025plknhjlhe6raj3ma9t",
              "amount": [
                {
                  "amount": "1000",
                  "denom": "uatom"
                }
              ]
            }
          }
        ],
        "memo": ""
      }
    )
    console.log('[signOfflineSignerAmino]', res);
  }

  const signDirect = async () => {
    const res = await provider.signDirect(network,
      address, {
      /** SignDoc bodyBytes */
      bodyBytes: hexToBytes("0a8d010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126d0a2d636f736d6f73316c387661367364376361786b676b3476736e617a61786176716e363434617971636e39737374122d636f736d6f73313963326d333563666165356c6a38397839303235706c6b6e686a6c68653672616a336d6139741a0d0a057561746f6d120431303030"),
      /** SignDoc authInfoBytes */
      authInfoBytes: hexToBytes("0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2103added80a6a2bb6010bf77a4cd1df4527b49a03d509386bf4a1c11a74f0cde42d12040a02087f180c120c0a0a0a057561746f6d120131"),
      /** SignDoc chainId */
      chainId: network,
      /** SignDoc accountNumber */
      // @ts-expect-error
      accountNumber: 13
    });
    console.log('[signMessage]', res);
  };

  const sendTx = async () => {

    const res = await provider.sendTx(network,
      hexToBytes(
        Buffer.from('EmAKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQOt3tgKaiu2AQv3ekzR30UntJoD1Qk4a/ShwRp08M3kLRIECgIIfxgMEgwKCgoFdWF0b20SATAaQE6369HQfZrI+XP3OHePAkXV7cfWS3wLp0xi4hSSoJ+iDOuzEuYs1c0ZxMDOyvLirieQc/wW7R0KyscHKmrjF0M=', 'base64').toString('hex')),
      // @ts-expect-error
      'async');
    console.log('[signDirect]', res);
  };

  const signArbitrary = async () => {

    const res = await provider.signArbitrary(network,
      address,
      '010203');
    console.log('[signArbitrary]', res);
  };

  const verifyArbitrary = async () => {

    const res = await provider.verifyArbitrary(network,
      address,
      '010203',
      { "pub_key": { "type": "tendermint/PubKeySecp256k1", "value": "A63e2ApqK7YBC/d6TNHfRSe0mgPVCThr9KHBGnTwzeQt" }, "signature": "8OcxjZMg0rpuGGjFtDGsV5unJpm8If8rHRbt0JXWUMdu1qQpLXzXAOCfM36fLI4z6ZlVhT/ZoEGIQOOjHDjAHA==" }
    );
    console.log('[verifyArbitrary]', res);
  };

  return (
    <div>
      <DAppList dapps={dapps} />
      {!provider && (
        <a target="_blank" href={'https://www.onekey.so/download/'}>
          Install OneKey Extension →
        </a>
      )}
      <main>
        {provider && connected ? (
          <>
            <div>
              <pre>Network: <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                <option value="cosmoshub-4">Cosmos</option>
                <option value="juno-1">Juno</option>
                <option value="osmosis-1">Osmosis</option>
                <option value="injective-1">Injective</option>
                <option value="fetchhub-4">Fetch.ai</option>
                <option value="secret-4">Secret Network</option>
              </select></pre>
              <pre>Connected as: {address}</pre>
            </div>
            <button onClick={getKey}>Get Key</button>
            <button onClick={signAmino}>Sign Amino </button>
            <button onClick={signDirect}>Sign Direct</button>
            <button onClick={sendTx}>Send Tx</button>
            <button onClick={signArbitrary}>Sign Arbitrary</button>
            <button onClick={verifyArbitrary}>Verify Arbitrary</button>
            <button onClick={signOfflineSignerAmino}>Sign Offline Signer Amino</button>
            <button onClick={() => disconnectWallet()}>Disconnect</button>
          </>
        ) : (
          <>
            <button onClick={() => connectWallet()}>Connect Wallet</button>
          </>
        )}
      </main>
    </div>
  );
}
