/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '../../ui/card';
import { get } from 'lodash';

const SignTxMap = {
  evm: async () => {
    const [address] = await window?.ethereum?.request({
      'method': 'eth_requestAccounts',
      'params': [],
    });

    const res = await window?.ethereum?.request({
      'method': 'eth_sendTransaction',
      'params': [
        {
          from: address,
          to: address,
          value: `0x1`,
          gasLimit: '0x5028',
          gasPrice: '0xbebc200',
        },
      ],
    });

    return JSON.stringify(res);
  },
  cfx: async () => {
    const [address] = await window?.conflux?.request({
      'method': 'cfx_requestAccounts',
      'params': [],
    });

    const res = await window?.conflux?.request({
      'method': 'cfx_sendTransaction',
      'params': [
        {
          from: address,
          to: address,
          value: `0x1`,
          gasLimit: '0x5028',
          gasPrice: '0xbebc200',
        },
      ],
    });

    return JSON.stringify(res);
  },
  btc: async () => {
    // @ts-expect-error
    const [address] = await window?.unisat?.requestAccounts();
    // @ts-expect-error
    const res = await window?.unisat?.sendBitcoin(address, 1000);
    return JSON.stringify(res);
  },
  aptos: async () => {
    const { address } = await window?.aptos?.connect();
    const res = await window?.aptos?.signTransaction({
      arguments: [address, '10000'],
      function: '0x1::coin::transfer',
      type: 'entry_function_payload',
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
    });
    return JSON.stringify(res);
  },
};

export function MultipleCallSignTx() {
  const connectWallet = () => {
    console.log(`Call wallet Sign Tx start ===>`);
    Object.keys(SignTxMap).forEach(async (key) => {
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      SignTxMap[key]()
        .then((address: string) => {
          console.log(`Call wallet Sign Tx ${key} address`, address);
        })
        .catch((error: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          console.log(`Call wallet Sign Tx ${key} error`, get(error, 'message', ''));
        });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });
  };

  return (
    <Card>
      <CardHeader className="text-xl font-medium">调用 EVM、CFX、APTOS、BTC Sign Tx</CardHeader>
      <CardDescription>用于测试并发多链签署 sign tx, 请先调用批量连接钱包。</CardDescription>

      <CardContent>
        <div className="flex flex-col gap-5">
          <Button onClick={connectWallet}>批量 sign tx</Button>
        </div>
      </CardContent>
    </Card>
  );
}
