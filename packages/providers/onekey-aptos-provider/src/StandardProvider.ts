import {
  Account,
  AccountAuthenticator,
  AnyRawTransaction,
  Ed25519PublicKey,
  Network,
  SigningScheme,
} from '@aptos-labs/ts-sdk';
import {
  APTOS_CHAINS,
  AccountInfo,
  AptosConnectMethod,
  AptosDisconnectMethod,
  AptosGetAccountMethod,
  AptosGetNetworkMethod,
  AptosOnAccountChangeMethod,
  AptosSignMessageInput,
  AptosSignMessageMethod,
  AptosSignMessageOutput,
  AptosSignTransactionMethod,
  AptosWallet,
  IdentifierArray,
  NetworkInfo,
  UserResponse,
  registerWallet,
  AptosWalletAccount,
  AptosOnNetworkChangeMethod,
  AptosFeatures,
  UserResponseStatus,
  WalletIcon,
} from '@aptos-labs/wallet-standard';
import { ProviderAptosBase } from './ProviderAptosBase';
import { ProviderAptos } from './OnekeyAptosProvider';
import { WalletInfo } from './types';

/**
 * This class is a template you can modify to implement an AIP-62 Wallet.
 *
 * Sections of the code which need to be revised will be marked with a "REVISION" comment.
 * We recommend using the REVISION comments like a checklist and deleting them as you go.
 * Ex. REVISION - Update this section.
 *
 * Function implementations are for DEMONSTRATION PURPOSES ONLY. Please ensure you rewrite all features
 * to use your Wallet as the method of communicating on-chain.
 *
 * For a working implementation of this example, see the next-js example app here: https://github.com/aptos-labs/aptos-wallet-adapter/tree/main/apps/nextjs-example
 * (And more specifically, see https://github.com/aptos-labs/aptos-wallet-adapter/blob/main/apps/nextjs-example/src/utils/standardWallet.ts)
 */
export class WalletAccount implements AptosWalletAccount {
  /** Address of the account, corresponding with a public key. */
  address: string;

  /** Public key of the account, corresponding with a secret key to use. */
  publicKey: Uint8Array;

  /**
   * Chains supported by the account.
   *
   * This must be a subset of ["aptos:devnet", "aptos:testnet", "aptos:localnet", "aptos:mainnet"].
   *
   * It is recommended to support at least ["aptos:devnet", "aptos:testnet", and "aptos:mainnet"].
   */
  chains: IdentifierArray = APTOS_CHAINS;

  /**
   * Function names of features that are supported for this Wallet's account object.
   */
  features: IdentifierArray = [];

  /** The signing scheme used for the private key of the address. Ex. SigningScheme.Ed25519 */
  signingScheme: SigningScheme;

  /** Optional user-friendly descriptive label or name for the account. This may be displayed by the app. */
  label?: string;

  /**
   * Optional user-friendly icon for the account. This may be displayed by the app.
   */
  icon?: WalletIcon | undefined;

  // REVISION - Update this constructor to use values your wallet supports.
  constructor(account: Account) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.address = account.accountAddress.toString();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.publicKey = account.publicKey.toUint8Array();
    // REVISION - Choose which chains your wallet supports. This may only be subset of all Aptos networks.
    this.chains = APTOS_CHAINS; // ["aptos:devnet", "aptos:testnet", "aptos:localnet", "aptos:mainnet"]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.signingScheme = account.signingScheme;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
export const registerAptosWallet = (aptos: AptosStandardProvider) => registerWallet(aptos);

/**
 * REVISION - This class needs to be extensively customized to match the details of your wallet.
 *
 * 1. MyWallet should be renamed to be the name of your wallet. Ex. For Petra, MyWallet should be named "PetraWallet". (Be sure to also update references to "MyWallet" in this file.)
 * 2. Update the values of this class to match your Wallet's deatils.
 * 3. Implement each of the features below. (Including adding implementations for any additional required features that you can find here in the "AptosFeatures" type: https://github.com/aptos-labs/wallet-standard/blob/main/src/features/index.ts)
 */
export class AptosStandardProvider implements AptosWallet {
  readonly url: string = 'https://aptos.dev';

  readonly options?: WalletInfo;

  readonly version = '1.0.0';

  readonly name: string = 'OneKey';

  readonly icon =
    'data:image/png;base64,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';

  readonly provider: ProviderAptos;

  constructor(provider: ProviderAptos, options?: WalletInfo) {
    this.provider = provider;
    this.name = options?.name ?? 'OneKey';

    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.icon = options?.logo ?? '';

    // this._events = mitt();
    // this._account = null;
    // this.subscribeEventFromBackend();
  }

  chains = APTOS_CHAINS;

  accounts: WalletAccount[] = [];

  get features(): AptosFeatures {
    return {
      'aptos:account': {
        version: '1.0.0',
        account: this.account,
      },
      'aptos:connect': {
        version: '1.0.0',
        connect: this.connect,
      },
      'aptos:disconnect': {
        version: '1.0.0',
        disconnect: this.disconnect,
      },
      'aptos:network': {
        version: '1.0.0',
        network: this.network,
      },
      'aptos:signTransaction': {
        version: '1.0.0',
        signTransaction: this.signTransaction,
      },
      'aptos:signMessage': {
        version: '1.0.0',
        signMessage: this.signMessage,
      },
      'aptos:onAccountChange': {
        version: '1.0.0',
        onAccountChange: this.onAccountChange,
      },
      'aptos:onNetworkChange': {
        version: '1.0.0',
        onNetworkChange: this.onNetworkChange,
      },
    };
  }

  account: AptosGetAccountMethod = async (): Promise<AccountInfo> => {
    const address = await this.provider.account();
    const account = new AccountInfo({
      address: address.address,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      publicKey: new Ed25519PublicKey(address.publicKey),
    });
    return account;
  };

  connect: AptosConnectMethod = async (): Promise<UserResponse<AccountInfo>> => {
    try {
      const address = await this.provider.connect();

      const account = new AccountInfo({
        address: address.address,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        publicKey: new Ed25519PublicKey(address.publicKey),
      });

      return {
        status: UserResponseStatus.APPROVED,
        args: account,
      };
    } catch (e) {
      return {
        status: UserResponseStatus.REJECTED,
      };
    }
  };

  /**
   * REVISION - Implement this function using your Wallet.
   *
   * Return the name, chainId, and url of the network connection your wallet is using to connect to the Aptos chain.
   *
   * @returns Which network the connected Wallet is pointing to.
   */
  network: AptosGetNetworkMethod = async (): Promise<NetworkInfo> => {
    const network = await this.provider.getNetwork();
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      name: network.chainId === 1 ? Network.MAINNET : Network.DEVNET,
      chainId: network.chainId,
      url: network.url,
    };
  };

  disconnect: AptosDisconnectMethod = async (): Promise<void> => {
    return await this.provider.disconnect();
  };

  /**
   * REVISION - Implement this function using your Wallet.
   *
   * @param transaction - A transaction that the user should have the ability to sign if they choose to.
   * @param asFeePayer - Optionally, another this signature is acting as a fee-payer for the transaction being signed.
   * @returns The result of whether the user chose to sign the transaction or not.
   */
  signTransaction: AptosSignTransactionMethod = async (
    transaction: AnyRawTransaction,
    asFeePayer?: boolean,
  ): Promise<UserResponse<AccountAuthenticator>> => {
    // const signature = await this.provider.signTransaction(transaction, asFeePayer);

    // // THIS LOGIC SHOULD BE REPLACED. IT IS FOR EXAMPLE PURPOSES ONLY.
    // if (asFeePayer) {
    //   const senderAuthenticator = this.aptos.transaction.signAsFeePayer({
    //     signer: this.signer,
    //     transaction,
    //   });

    //   return Promise.resolve({
    //     status: UserResponseStatus.APPROVED,
    //     args: senderAuthenticator,
    //   });
    // }
    // const senderAuthenticator = this.aptos.transaction.sign({
    //   signer: this.signer,
    //   transaction,
    // });

    //@ts-expect-error
    return Promise.resolve({
      status: UserResponseStatus.APPROVED,
      args: {},
    });
  };

  /**
   * REVISION - Implement this function using your Wallet.
   *
   * @param input - A message to sign with the private key of the connected account.
   * @returns A user response either with a signed message, or the user rejecting to sign.
   */
  signMessage: AptosSignMessageMethod = async (
    input: AptosSignMessageInput,
  ): Promise<UserResponse<AptosSignMessageOutput>> => {
    // THIS LOGIC SHOULD BE REPLACED. IT IS FOR EXAMPLE PURPOSES ONLY.
    // 'Aptos' + application + address + nonce + chainId + message
    // const messageToSign = `Aptos
    //   demoAdapter
    //   ${this.signer.accountAddress.toString()}
    //   ${input.nonce}
    //   ${input.chainId ?? (await this.network()).chainId}
    //   ${input.message}`;

    // const encodedMessageToSign = new TextEncoder().encode(messageToSign);

    // const signature = this.signer.sign(encodedMessageToSign);

    // return Promise.resolve({
    //   status: UserResponseStatus.APPROVED,
    //   args: {
    //     address: this.signer.accountAddress.toString(),
    //     fullMessage: messageToSign,
    //     message: input.message,
    //     nonce: input.nonce,
    //     prefix: 'APTOS',
    //     signature: signature,
    //   },
    // });

    //@ts-expect-error
    return Promise.resolve({
      status: UserResponseStatus.APPROVED,
      args: {
        address: '',
        fullMessage: '',
        message: input.message,
        nonce: input.nonce,
        prefix: 'APTOS',
        signature: '',
      },
    });
  };

  /**
   * REVISION - Implement this function using your Wallet.
   *
   * An event which will be triggered anytime an Account changes.
   *
   * @returns when the logic is resolved.
   */
  onAccountChange: AptosOnAccountChangeMethod = async (): Promise<void> => {
    // THIS LOGIC SHOULD BE REPLACED. IT IS FOR EXAMPLE PURPOSES ONLY.
    return Promise.resolve();
  };

  /**
   * REVISION - Implement this function using your Wallet.
   *
   * When users indicate a Network change should occur, update your Wallet accordingly.
   *
   * @returns when the logic is resolved.
   */
  onNetworkChange: AptosOnNetworkChangeMethod = async (): Promise<void> => {
    // THIS LOGIC SHOULD BE REPLACED. IT IS FOR EXAMPLE PURPOSES ONLY.
    return Promise.resolve();
  };
}
