import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '../../ui/card';
import { get } from 'lodash';

const connectWalletMap = {
  evm: async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const [address] = await window?.ethereum?.request({
      'method': 'eth_requestAccounts',
      'params': [],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return
    return address;
  },
  cfx: async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const [address] = await window?.conflux?.request({
      'method': 'cfx_requestAccounts',
      'params': [],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return
    return address;
  },
  btc: async () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const [address] = await window?.unisat?.requestAccounts();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return
    return address;
  },
  aptos: async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const { address } = await window?.aptos?.connect();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return
    return address;
  },
};

export function MultipleCallConnectWallet() {
  const connectWallet = () => {
    console.log(`Connect wallet start ===>`);
    Object.keys(connectWalletMap).forEach(async (key) => {
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      connectWalletMap[key]()
        .then((address: string) => {
          console.log(`Connect wallet ${key} address`, address);
        })
        .catch((error: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          console.log(`Connect wallet ${key} error`, get(error, 'message', ''));
        });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });
  };

  return (
    <Card>
      <CardHeader className="text-xl font-medium">连接 EVM、CFX、APTOS、BTC 账户</CardHeader>
      <CardDescription>用于测试并发多链连接 wallet</CardDescription>

      <CardContent>
        <div className="flex flex-col gap-5">
          <Button onClick={connectWallet}>批量连接钱包</Button>
        </div>
      </CardContent>
    </Card>
  );
}
