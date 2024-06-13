/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ApiGroup } from '../../ApiActuator';
import { LoopEvmSignMessage } from './loopEvmSignMessage';
import { LoopEvmSignTx } from './loopEvmSignTx';
import { MultipleCallConnectWallet } from './multipleCallConnectWallet';
import { MultipleCallSignMessage } from './multipleCallSignMessage';
import { MultipleCallSignTx } from './multipleCallSignTx';

export default function BTCExample() {
  return (
    <>
      <ApiGroup title="单链循环调用">
        <LoopEvmSignMessage />
        <LoopEvmSignTx />
      </ApiGroup>

      <ApiGroup title="多链复杂调用">
        <MultipleCallConnectWallet />
        <MultipleCallSignMessage />
        <MultipleCallSignTx />
      </ApiGroup>
    </>
  );
}
