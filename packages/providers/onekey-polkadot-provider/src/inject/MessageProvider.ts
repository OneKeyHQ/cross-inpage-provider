/* eslint-disable tsdoc/syntax */
import type {
  InjectedProvider,
  ProviderList,
  ProviderMeta,
} from '@polkadot/extension-inject/types';
import type {
  ProviderInterfaceEmitCb,
  ProviderInterfaceEmitted,
} from '@polkadot/rpc-provider/types';
import { EventEmitter } from 'eventemitter3';
import { ProviderPolkadot } from '../OnekeyPolkadotProvider';

type CallbackHandler = (error?: null | Error, value?: unknown) => void;

type AnyFunction = (...args: any[]) => any;

// Same as https://github.com/polkadot-js/api/blob/57ca9a9c3204339e1e1f693fcacc33039868dc27/packages/rpc-provider/src/ws/Provider.ts#L17
interface SubscriptionHandler {
  callback: CallbackHandler;
  type: string;
}

function isUndefined(value?: unknown): value is undefined {
  return value === undefined;
}

export default class MessageProvider implements InjectedProvider {
  readonly _eventemitter: EventEmitter;

  // Whether or not the actual extension background provider is connected
  _isConnected = false;

  // Subscription IDs are (historically) not guaranteed to be globally unique;
  // only unique for a given subscription method; which is why we identify
  // the subscriptions based on subscription id + type
  readonly _subscriptions: Record<string, AnyFunction> = {};

  public constructor(private provider: ProviderPolkadot) {
    this._eventemitter = new EventEmitter();
  }

  public get isClonable(): boolean {
    return true;
  }

  public clone(): MessageProvider {
    return new MessageProvider(this.provider);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async connect(): Promise<void> {
    // FIXME This should see if the extension's state's provider can disconnect
    console.error('PostMessageProvider.disconnect() is not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async disconnect(): Promise<void> {
    // FIXME This should see if the extension's state's provider can disconnect
    console.error('PostMessageProvider.disconnect() is not implemented.');
  }

  public get hasSubscriptions(): boolean {
    // FIXME This should see if the extension's state's provider has subscriptions
    return true;
  }

  /**
   * @summary Whether the node is connected or not.
   * @return {boolean} true if connected
   */
  public get isConnected(): boolean {
    return this._isConnected;
  }

  public listProviders(): Promise<ProviderList> {
    return this.provider.web3RpcListProviders();
  }

  /**
   * @summary Listens on events after having subscribed using the [[subscribe]] function.
   * @param  {ProviderInterfaceEmitted} type Event
   * @param  {ProviderInterfaceEmitCb}  sub  Callback
   * @return unsubscribe function
   */
  public on(type: ProviderInterfaceEmitted, sub: ProviderInterfaceEmitCb): () => void {
    this._eventemitter.on(type, sub);

    return (): void => {
      this._eventemitter.removeListener(type, sub);
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async send(
    method: string,
    params: unknown[],
    _?: boolean,
    subscription?: SubscriptionHandler,
  ): Promise<any> {
    if (subscription) {
      const { callback, type } = subscription;

      const id = await this.provider.web3RpcSubscribe({ method, params, type }, (res): void => {
        subscription.callback(null, res);
      });
      // const id = await sendRequest('pub(rpc.subscribe)', { method, params, type }, (res): void => {
      //   subscription.callback(null, res);
      // });

      this._subscriptions[`${type}::${id}`] = callback;

      return id;
    }

    return this.provider.web3RpcSend({ method, params });
  }

  /**
   * @summary Spawn a provider on the extension background.
   */
  public async startProvider(key: string): Promise<ProviderMeta> {
    // Disconnect from the previous provider
    this._isConnected = false;
    this._eventemitter.emit('disconnected');

    // const meta = await sendRequest('pub(rpc.startProvider)', key);
    const meta = await this.provider.web3RpcStartProvider(key);

    this.provider.web3RpcSubscribeConnected((connected) => {
      this._isConnected = connected;

      if (connected) {
        this._eventemitter.emit('connected');
      } else {
        this._eventemitter.emit('disconnected');
      }

      return true;
    });

    return meta;
  }

  public subscribe(
    type: string,
    method: string,
    params: unknown[],
    callback: AnyFunction,
  ): Promise<number> {
    return this.send(method, params, false, { callback, type }) as Promise<number>;
  }

  /**
   * @summary Allows unsubscribing to subscriptions made with [[subscribe]].
   */
  public async unsubscribe(type: string, method: string, id: number): Promise<boolean> {
    const subscription = `${type}::${id}`;

    // FIXME This now could happen with re-subscriptions. The issue is that with a re-sub
    // the assigned id now does not match what the API user originally received. It has
    // a slight complication in solving - since we cannot rely on the send id, but rather
    // need to find the actual subscription id to map it
    if (isUndefined(this._subscriptions[subscription])) {
      console.debug(`Unable to find active subscription=${subscription}`);

      return false;
    }

    delete this._subscriptions[subscription];
    await this.provider.web3RpcUnSubscribe();

    return this.send(method, [id]) as Promise<boolean>;
  }
}
