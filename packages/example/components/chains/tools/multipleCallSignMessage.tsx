/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '../../ui/card';
import { get } from 'lodash';

const SignMessageMap = {
  evm: async () => {
    const [address] = await window?.ethereum?.request({
      'method': 'eth_requestAccounts',
      'params': [],
    });

    const res = await window?.ethereum?.request({
      'method': 'personal_sign',
      'params': [`call sign message`, address],
    });

    return JSON.stringify(res);
  },
  cfx: async () => {
    const [address] = await window?.conflux?.request({
      'method': 'cfx_requestAccounts',
      'params': [],
    });

    const res = await window?.conflux?.request({
      'method': 'personal_sign',
      'params': [`call sign message`, address],
    });

    return JSON.stringify(res);
  },
  btc: async () => {
    // @ts-expect-error
    const res = await window?.unisat?.signMessage('Hello');
    return JSON.stringify(res);
  },
  aptos: async () => {
    const res = await window?.aptos?.signMessage({
      address: false,
      application: true,
      chainId: true,
      message: 'This is a sample message',
      nonce: 12345,
    });
    return JSON.stringify(res);
  },
};

export function MultipleCallSignMessage() {
  const connectWallet = () => {
    console.log(`Call wallet Sign Message start ===>`);
    Object.keys(SignMessageMap).forEach(async (key) => {
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      SignMessageMap[key]()
        .then((address: string) => {
          console.log(`Call wallet Sign Message ${key} address`, address);
        })
        .catch((error: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          console.log(`Call wallet Sign Message ${key} error`, get(error, 'message', ''));
        });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });
  };

  return (
    <Card>
      <CardHeader className="text-xl font-medium">
        调用 EVM、CFX、APTOS、BTC Sign Message
      </CardHeader>
      <CardDescription>用于测试并发多链签署 sign message, 请先调用批量连接钱包。</CardDescription>

      <CardContent>
        <div className="flex flex-col gap-5">
          <Button onClick={connectWallet}>批量 sign message</Button>
        </div>
      </CardContent>
    </Card>
  );
}
