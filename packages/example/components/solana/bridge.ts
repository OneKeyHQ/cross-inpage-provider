import { JsBridgeSimple } from '@onekeyfe/cross-inpage-provider-core';
import { IJsBridgeConfig, IJsBridgeMessagePayload } from '@onekeyfe/cross-inpage-provider-types';
import { JsBridgeRequest } from '@onekeyfe/onekey-solana-provider';
import { Keypair, Transaction, Message, Connection, clusterApiUrl } from '@solana/web3.js';
import base58 from 'bs58';
import nacl from 'tweetnacl';

function fixGlobalShim() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.global = window.global || window || window.globalThis;
}

fixGlobalShim();

type RequestParams<T extends keyof JsBridgeRequest> = {
  method: T;
  params: Parameters<JsBridgeRequest[T]>[0];
};

function matchRequest<T extends keyof JsBridgeRequest>(
  method: T,
  payloadData: unknown,
): payloadData is RequestParams<T> {
  if (typeof payloadData !== 'object') {
    return false;
  }
  return (payloadData as RequestParams<T>).method === method;
}

const SECRET_KEY =
  'hYygyhd4s18Pg6GS26q4VWYU39vyAh9aTK22p7vmVZyygoPKQTLgTn29SniEf9aK75yN61xuSyAUoDy9b71i7En';

class RemoteClient extends JsBridgeSimple {
  private _keyPair: Keypair;

  constructor(config?: IJsBridgeConfig) {
    super(config);
    this._keyPair = Keypair.fromSecretKey(base58.decode(SECRET_KEY));
    this.setupEventListeners();
  }

  get publicKey() {
    return this._keyPair.publicKey;
  }

  private setupEventListeners() {
    this.on('message', (payload: IJsBridgeMessagePayload) => {
      const payloadData = payload.data;

      if (matchRequest('connect', payloadData)) {
        const result = this.handleConnect();
        return this.sendResponse(payload, result);
      }

      if (matchRequest('disconnect', payloadData)) {
        const result = this.handleDisconnect();
        return this.sendResponse(payload, result);
      }

      if (matchRequest('signMessage', payloadData)) {
        const result = this.handleSignMessage(payloadData.params);
        return this.sendResponse(payload, result);
      }

      if (matchRequest('signTransaction', payloadData)) {
        const result = this.handleSignTransaction(payloadData.params);
        return this.sendResponse(payload, result);
      }

      if (matchRequest('signAllTransactions', payloadData)) {
        const result = this.handleSignAllTransaction(payloadData.params);
        return this.sendResponse(payload, result);
      }

      if (matchRequest('signAndSendTransaction', payloadData)) {
        void this.handleSignAndSendTransaction(payloadData.params).then((result) =>
          this.sendResponse(payload, result),
        );
        return;
      }
    });

    this.on('error', (...args) => {
      console.warn('on error', args);
    });
  }

  private sendResponse(payload: IJsBridgeMessagePayload, data: unknown) {
    this.response({
      ...payload,
      id: payload.id ?? 0,
      data: {
        result: data,
      },
    });
  }

  private handleConnect() {
    console.log('connecting: ');
    return {
      providerState: {
        publicKey: this.publicKey.toBase58(),
      },
    };
  }

  private handleDisconnect() {
    // todo
    return;
  }

  private handleSignMessage(params: RequestParams<'signMessage'>['params']) {
    const { message } = params;
    const signature = base58.encode(
      nacl.sign.detached(base58.decode(message), this._keyPair.secretKey),
    );
    return {
      signature,
      publicKey: this.publicKey.toBase58(),
    };
  }

  private _signTransaction(message: string): Transaction {
    const messageBinary = base58.decode(message);
    const signature = base58.encode(nacl.sign.detached(messageBinary, this._keyPair.secretKey));
    return Transaction.populate(Message.from(messageBinary), [signature]);
  }

  private handleSignTransaction(params: RequestParams<'signTransaction'>['params']) {
    const { message } = params;
    const transaction = this._signTransaction(message);
    return base58.encode(transaction.serialize());
  }

  private handleSignAllTransaction(params: RequestParams<'signAllTransactions'>['params']) {
    const { message } = params;
    return message.map((m) => this._signTransaction(m)).map((t) => base58.encode(t.serialize()));
  }

  private async handleSignAndSendTransaction(
    params: RequestParams<'signAndSendTransaction'>['params'],
  ) {
    const { message, options } = params;
    const transaction = this._signTransaction(message);

    const connection = new Connection(clusterApiUrl('devnet'));
    const transactionSignature = await connection.sendRawTransaction(
      transaction.serialize(),
      options,
    );
    return {
      signature: transactionSignature,
      publicKey: this.publicKey.toString(),
    };
  }
}

class CustomBridge extends JsBridgeSimple {
  constructor(config?: IJsBridgeConfig) {
    super(config);

    const remote = new RemoteClient();
    this.setRemote(remote);
    remote.setRemote(this);
  }
}

export { CustomBridge };
