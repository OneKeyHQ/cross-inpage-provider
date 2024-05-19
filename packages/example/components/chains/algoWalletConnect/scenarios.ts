import algosdk from 'algosdk';
import { apiGetTxnParams, ChainType } from './api';

const testAccounts = [
  algosdk.mnemonicToSecretKey(
    'cannon scatter chest item way pulp seminar diesel width tooth enforce fire rug mushroom tube sustain glide apple radar chronic ask plastic brown ability badge',
  ),
  algosdk.mnemonicToSecretKey(
    'person congress dragon morning road sweet horror famous bomb engine eager silent home slam civil type melt field dry daring wheel monitor custom above term',
  ),
  algosdk.mnemonicToSecretKey(
    'faint protect home drink journey humble tube clinic game rough conduct sell violin discover limit lottery anger baby leaf mountain peasant rude scene abstract casual',
  ),
];

export function signTxnWithTestAccount(txn: algosdk.Transaction): Uint8Array {
  const sender = algosdk.encodeAddress(txn.from.publicKey);

  for (const testAccount of testAccounts) {
    if (testAccount.addr === sender) {
      return txn.signTxn(testAccount.sk);
    }
  }

  throw new Error(`Cannot sign transaction from unknown test account: ${sender}`);
}

export interface IScenarioTxn {
  txn: algosdk.Transaction;
  signers?: string[];
  authAddr?: string;
  message?: string;
}

export type ScenarioReturnType = IScenarioTxn[][];

export type Scenario = (chain: ChainType, address: string) => Promise<ScenarioReturnType>;

function getAssetIndex(chain: ChainType): number {
  if (chain === ChainType.MainNet) {
    // MainNet USDC
    return 31566704;
  }

  if (chain === ChainType.TestNet) {
    // TestNet USDC
    return 10458941;
  }

  throw new Error(`Asset not defined for chain ${chain as string}`);
}

function getAssetReserve(chain: ChainType): string {
  if (chain === ChainType.MainNet) {
    return '2UEQTE5QDNXPI7M3TU44G6SYKLFWLPQO7EBZM7K7MHMQQMFI4QJPLHQFHM';
  }

  if (chain === ChainType.TestNet) {
    return 'UJBZPEMXLD6KZOLUBUDSZ3DXECXYDADZZLBH6O7CMYXHE2PLTCW44VK5T4';
  }

  throw new Error(`Asset reserve not defined for chain ${chain as string}`);
}

function getAppIndex(chain: ChainType): number {
  if (chain === ChainType.MainNet) {
    return 305162725;
  }

  if (chain === ChainType.TestNet) {
    return 22314999;
  }

  throw new Error(`App not defined for chain ${chain as string}`);
}

const singlePayTxn: Scenario = async (
  chain: ChainType,
  address: string,
): Promise<ScenarioReturnType> => {
  const suggestedParams = await apiGetTxnParams(chain);

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 100000,
    note: new Uint8Array(Buffer.from('example note value')),
    suggestedParams,
  });

  const txnsToSign = [
    {
      txn,
      message: 'This is a payment transaction that sends 0.1 Algos to yourself.',
    },
  ];
  return [txnsToSign];
};

const singleAssetOptInTxn: Scenario = async (
  chain: ChainType,
  address: string,
): Promise<ScenarioReturnType> => {
  const suggestedParams = await apiGetTxnParams(chain);
  const assetIndex = getAssetIndex(chain);

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex,
    note: new Uint8Array(Buffer.from('example note value')),
    suggestedParams,
  });

  const txnsToSign = [
    {
      txn,
      message: 'This transaction opts you into the USDC asset if you have not already opted in.',
    },
  ];
  return [txnsToSign];
};

const singleAssetTransferTxn: Scenario = async (
  chain: ChainType,
  address: string,
): Promise<ScenarioReturnType> => {
  const suggestedParams = await apiGetTxnParams(chain);
  const assetIndex = getAssetIndex(chain);

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 1000000,
    assetIndex,
    note: new Uint8Array(Buffer.from('example note value')),
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: 'This transaction will send 1 USDC to yourself.' }];
  return [txnsToSign];
};

const singleAssetCloseTxn: Scenario = async (
  chain: ChainType,
  address: string,
): Promise<ScenarioReturnType> => {
  const suggestedParams = await apiGetTxnParams(chain);
  const assetIndex = getAssetIndex(chain);

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: getAssetReserve(chain),
    amount: 0,
    assetIndex,
    note: new Uint8Array(Buffer.from('example note value')),
    closeRemainderTo: testAccounts[1].addr,
    suggestedParams,
  });

  const txnsToSign = [
    {
      txn,
      message:
        'This transaction will opt you out of the USDC asset. DO NOT submit this to MainNet if you have more than 0 USDC.',
    },
  ];
  return [txnsToSign];
};

const singleAppOptIn: Scenario = async (
  chain: ChainType,
  address: string,
): Promise<ScenarioReturnType> => {
  const suggestedParams = await apiGetTxnParams(chain);

  const appIndex = getAppIndex(chain);

  const txn = algosdk.makeApplicationOptInTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from('example note value')),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: 'This transaction will opt you into a test app.' }];
  return [txnsToSign];
};

const singleAppCall: Scenario = async (
  chain: ChainType,
  address: string,
): Promise<ScenarioReturnType> => {
  const suggestedParams = await apiGetTxnParams(chain);

  const appIndex = getAppIndex(chain);

  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from('example note value')),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: 'This transaction will invoke an app call on a test app.' }];
  return [txnsToSign];
};

const singleAppCloseOut: Scenario = async (
  chain: ChainType,
  address: string,
): Promise<ScenarioReturnType> => {
  const suggestedParams = await apiGetTxnParams(chain);

  const appIndex = getAppIndex(chain);

  const txn = algosdk.makeApplicationCloseOutTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from('example note value')),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: 'This transaction will opt you out of the test app.' }];
  return [txnsToSign];
};

const singleAppClearState: Scenario = async (
  chain: ChainType,
  address: string,
): Promise<ScenarioReturnType> => {
  const suggestedParams = await apiGetTxnParams(chain);

  const appIndex = getAppIndex(chain);

  const txn = algosdk.makeApplicationClearStateTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from('example note value')),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [
    { txn, message: 'This transaction will forcibly opt you out of the test app.' },
  ];
  return [txnsToSign];
};

export const scenarios: Array<{ name: string; scenario: Scenario }> = [
  {
    name: '1. Sign pay txn',
    scenario: singlePayTxn,
  },
  {
    name: '2. Sign asset opt-in txn',
    scenario: singleAssetOptInTxn,
  },
  {
    name: '3. Sign asset transfer txn',
    scenario: singleAssetTransferTxn,
  },
  {
    name: '4. Sign asset close out txn',
    scenario: singleAssetCloseTxn,
  },
  {
    name: '5. Sign app opt-in txn',
    scenario: singleAppOptIn,
  },
  {
    name: '6. Sign app call txn',
    scenario: singleAppCall,
  },
  {
    name: '7. Sign app close out txn',
    scenario: singleAppCloseOut,
  },
  {
    name: '8. Sign app clear state txn',
    scenario: singleAppClearState,
  },
];
