import { decodeToken } from '@olistic/jsontokens';
import { ProviderBtc } from './ProviderBtc';
import type {
  BitcoinProvider,
  CreateInscriptionResponse,
  GetAddressResponse,
  GetCapabilitiesResponse,
  SignTransactionResponse,
} from 'sats-connect';
import { AddressPurpose } from 'sats-connect';

export class ProviderBtcSatsConnect implements BitcoinProvider {
  readonly _provider: ProviderBtc;

  constructor(provider: ProviderBtc) {
    this._provider = provider;
  }

  async connect(request: string): Promise<GetAddressResponse> {
    console.log('=====>>>>> connect accounts', request);
    if (!request) {
      throw new Error('Invalid request.');
    }

    const { payload } = decodeToken(request);
    if (typeof payload === 'string') {
      throw new Error('Invalid request.');
    }

    const { purposes } = payload as {
      purposes?: AddressPurpose[];
    };

    const accounts = await this._provider.requestAccountsSatsConnect(purposes);

    if (!accounts) {
      throw new Error('No accounts found.');
    }

    console.log('=====>>>>> accounts', accounts);

    return {
      addresses: accounts.map((account) => ({
        address: account.address,
        publicKey: account.pubkey,
        purpose: account.purpose === 'payment' ? AddressPurpose.Payment : AddressPurpose.Ordinals,
      })),
    };
  }

  isTaprootAddress(address: string): boolean {
    return address.startsWith('bc1p');
  }

  async signMessage(request: string): Promise<string> {
    console.log('=====>>>>> connect signMessage', request);
    if (!request) {
      throw new Error('Invalid request.');
    }

    const { payload } = decodeToken(request);
    if (typeof payload === 'string') {
      throw new Error('Invalid request.');
    }

    const { address, message } = payload as {
      address: string;
      message: string;
    };

    const signType = this.isTaprootAddress(address) ? 'bip322-simple' : 'ecdsa';
    const signature = await this._provider._signMessageSatsConnect(message, address, signType);

    console.log('=====>>>>> connect signMessage signature', signature);
    return signature;
  }

  async signTransaction(request: string): Promise<SignTransactionResponse> {
    console.log('=====>>>>> connect signTransaction', request);
    if (!request) {
      throw new Error('Invalid request.');
    }

    const { payload } = decodeToken(request);
    if (typeof payload === 'string') {
      throw new Error('Invalid request.');
    }

    console.log('=====>>>>> connect signTransaction payload', payload);

    const { psbtBase64, broadcast, inputsToSign } = payload as {
      psbtBase64: string;
      broadcast?: boolean;
      inputsToSign: {
        address: string;
        signingIndexes: number[];
        sigHash?: number;
      }[];
    };

    const toSignInputs = [];
    for (const input of inputsToSign) {
      if (input.signingIndexes && input.signingIndexes.length > 0) {
        for (const index of input.signingIndexes) {
          toSignInputs.push({
            index,
            address: input.address,
            sighashTypes: input.sigHash ? [input.sigHash] : undefined,
          });
        }
      }
    }

    console.log('=====>>>>> connect signTransaction toSignInputs', toSignInputs);

    const signature = await this._provider.signPsbt(
      Buffer.from(psbtBase64, 'base64').toString('hex'),
      {
        autoFinalized: true,
        toSignInputs,
      },
    );

    let txId: string | undefined = undefined;
    if (broadcast) {
      txId = await this._provider.pushPsbt(signature);
    }

    console.log('=====>>>>> connect signTransaction signature', signature, txId);

    return {
      psbtBase64: Buffer.from(signature, 'hex').toString('base64'),
      txId,
    };
  }

  async sendBtcTransaction(request: string): Promise<string> {
    console.log('=====>>>>> connect sendBtcTransaction', request);
    if (!request) {
      throw new Error('Invalid request.');
    }

    const { payload } = decodeToken(request);
    if (typeof payload === 'string') {
      throw new Error('Invalid request.');
    }

    const { senderAddress, recipients } = payload as {
      senderAddress: string;
      recipients: {
        address: string;
        amountSats: number;
      }[];
    };

    if (recipients.length !== 1) {
      throw new Error('Invalid request.');
    }

    const result = await this._provider.sendBitcoin(
      recipients[0].address,
      recipients[0].amountSats,
    );

    console.log('=====>>>>> connect sendBtcTransaction result', result);
    return result;
  }

  createInscription(request: string): Promise<CreateInscriptionResponse> {
    throw new Error('Method not implemented.');
  }

  call(request: string): Promise<Record<string, any>> {
    throw new Error('Method not implemented.');
  }
}
