/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '../../ui/card';
import { Switch } from '../../ui/switch';
import { InputWithSave } from '../../InputWithSave';
import { get } from 'lodash';

export function LoopEvmSignMessage() {
  const [account, setAccount] = useState<string>();
  const [callInterval, setCallInterval] = useState<number>(1000);
  const [switchChecked, setSwitchChecked] = useState<boolean>(false);
  const countRef = useRef(0);

  const connectWallet = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const [address] = await window?.ethereum?.request({
      'method': 'eth_requestAccounts',
      'params': [],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setAccount(address);
  };

  const handleSignMessage = async (count: number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const res = await window?.ethereum?.request({
        'method': 'personal_sign',
        'params': [`call ${count}`, account],
      });
      console.log(`personal_sign ${count} result`, res);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log(`personal_sign ${count} error`, get(error, 'message', ''));
    }
  };

  const handleBatchSignMessage = async (count: number) => {
    console.log(`Batch sign message start ===>`);
    const promises = Array.from({ length: count }, (_, i) => {
      return handleSignMessage(i);
    });

    await Promise.all(promises);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (switchChecked) {
      if (!account) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        connectWallet();
      }

      timer = setInterval(() => {
        countRef.current += 1;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        handleSignMessage(countRef.current);
      }, callInterval);
    } else {
      clearInterval(timer);
    }

    return () => {
      clearInterval(timer);
    };
  }, [account, callInterval, switchChecked]);

  return (
    <Card>
      <CardHeader className="text-xl font-medium">调用 EVM Persional</CardHeader>
      <CardDescription>用于测试无限循环调用</CardDescription>

      <CardContent>
        <div className="flex flex-col gap-5">
          <Button onClick={connectWallet}>连接钱包</Button>

          {account && <div className="text-sm text-gray-500">当前账号：{account}</div>}

          <div>
            <p>循环调用间隔时间 (ms)</p>
            <InputWithSave
              type="number"
              storageKey="loop-call-interval"
              defaultValue="1000"
              onChange={(value) => {
                setCallInterval(Number(value));
              }}
            />
          </div>
          <Button onClick={() => handleBatchSignMessage(10)}>连续调用 10 次</Button>

          <div>
            <p>循环调用开关</p>
            <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
