import * as StellarSdk from '@stellar/stellar-sdk';

// Stellar RPC endpoints
const MAINNET_RPC = 'https://mainnet.sorobanrpc.com';

/**
 * Get the contract ID for Native XLM SAC token
 * This is dynamically generated based on the network passphrase
 *
 * For mainnet, this will return the correct Native XLM SAC contract address
 * Example: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC (mainnet)
 */
function getNativeContractId(networkPassphrase: string): string {
  // Native XLM asset
  const nativeAsset = StellarSdk.Asset.native();
  // Get the contract ID for this asset on the specified network
  // This uses the standard SAC (Stellar Asset Contract) address derivation
  return nativeAsset.contractId(networkPassphrase) as string;
}

/**
 * Build a real Soroban contract invocation and get auth entries via simulation
 *
 * This demonstrates the complete flow:
 * 1. Build a transaction with contract invocation
 * 2. Simulate it via RPC to get auth entries
 * 3. Return the auth entries for wallet signing
 */
export async function buildRealAuthEntry(params: {
  sourceAddress: string;
  networkPassphrase: string;
}): Promise<{
  authEntries: string[];
  transactionXdr: string;
  simulationResult: any;
}> {
  const { sourceAddress, networkPassphrase } = params;

  // Create RPC server instance
  const server = new StellarSdk.SorobanRpc.Server(MAINNET_RPC);

  // Create source account (sequence number will be fetched)
  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);

  // Fetch account to get sequence number
  const account = await server.getAccount(sourceAddress);

  // Build a simple contract invocation
  // We'll call the 'balance' function which is a read-only operation
  // This won't actually execute, but will generate auth entries for testing
  const contractId = getNativeContractId(networkPassphrase);
  const contract = new StellarSdk.Contract(contractId);

  // Build the operation - calling 'balance' function with the user's address
  const operation = contract.call(
    'balance',
    // Args: address to check balance for
    StellarSdk.nativeToScVal(sourceAddress, { type: 'address' })
  );

  // Build the transaction
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  // Simulate the transaction to get auth entries
  const simulation = await server.simulateTransaction(transaction);

  // Check for errors
  if (StellarSdk.SorobanRpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  // Extract auth entries from simulation
  const authEntries: string[] = [];
  if (simulation.result?.auth) {
    authEntries.push(...simulation.result.auth.map((entry) => entry.toXDR('base64')));
  }

  return {
    authEntries,
    transactionXdr: transaction.toXDR(),
    simulationResult: {
      cost: simulation.cost,
      latestLedger: simulation.latestLedger,
      minResourceFee: simulation.minResourceFee,
      resultCount: simulation.result?.auth?.length || 0,
    },
  };
}

/**
 * Alternative: Build auth entry for token transfer operation
 * This is more likely to require authorization
 */
export async function buildTokenTransferAuthEntry(params: {
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  networkPassphrase: string;
}): Promise<{
  authEntries: string[];
  transactionXdr: string;
  simulationResult: any;
}> {
  const { sourceAddress, destinationAddress, amount, networkPassphrase } = params;

  const server = new StellarSdk.SorobanRpc.Server(MAINNET_RPC);
  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = await server.getAccount(sourceAddress);

  // Create contract instance for Native XLM
  const contractId = getNativeContractId(networkPassphrase);
  const contract = new StellarSdk.Contract(contractId);

  // Build transfer operation
  // transfer(from: Address, to: Address, amount: i128)
  const operation = contract.call(
    'transfer',
    StellarSdk.nativeToScVal(sourceAddress, { type: 'address' }),
    StellarSdk.nativeToScVal(destinationAddress, { type: 'address' }),
    StellarSdk.nativeToScVal(BigInt(amount), { type: 'i128' })
  );

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  const simulation = await server.simulateTransaction(transaction);

  if (StellarSdk.SorobanRpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  const authEntries: string[] = [];
  if (simulation.result?.auth) {
    authEntries.push(...simulation.result.auth.map((entry) => entry.toXDR('base64')));
  }

  return {
    authEntries,
    transactionXdr: transaction.toXDR(),
    simulationResult: {
      cost: simulation.cost,
      latestLedger: simulation.latestLedger,
      minResourceFee: simulation.minResourceFee,
      resultCount: simulation.result?.auth?.length || 0,
    },
  };
}

/**
 * Get network passphrase for mainnet
 */
export const MAINNET_NETWORK_PASSPHRASE = StellarSdk.Networks.PUBLIC;

/**
 * Check if address exists on mainnet
 */
export async function checkAccountExists(address: string): Promise<boolean> {
  const server = new StellarSdk.SorobanRpc.Server(MAINNET_RPC);
  try {
    await server.getAccount(address);
    return true;
  } catch (error) {
    return false;
  }
}
