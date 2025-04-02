import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BlockBook, IBtcUTXO } from './blockbook';

bitcoin.initEccLib(ecc);

function estimateTransactionFee(numInputs: number, numOutputs: number, feePerByte: number) {
  const inputSize = 148; // 非 SegWit，SegWit 输入更小
  const outputSize = 34;
  const txSize = numInputs * inputSize + numOutputs * outputSize; // 简化估算
  return txSize * feePerByte;
}

function checkWitnessType(address: string, scriptHex: string) {
  const isBech32 = address.startsWith('bc1') || address.startsWith('tb1'); // Checks for both mainnet and testnet Bech32 addresses
  const isP2SH = address.startsWith('3') || address.startsWith('2'); // Mainnet and testnet P2SH addresses

  if (isBech32) {
    return true;
  } else if (isP2SH) {
    // P2SH could be either, check script to determine if it is SegWit
    if (scriptHex.startsWith('0014') || scriptHex.startsWith('0020')) {
      // Scripts that indicate P2WPKH or P2WSH wrapped in P2SH
      return true;
    }
  }

  return false;
}

async function addInputsAndOutputs(
  psbt: bitcoin.Psbt,
  utxos: IBtcUTXO[],
  fromAddress: string,
  toAddress: string,
  amount: number,
  gasPrice: number,
  blockbook: BlockBook,
) {
  let totalInput = 0;
  let totalFee = 0;
  const selectedUtxos: IBtcUTXO[] = [];
  for (const utxo of utxos) {
    const txDetails = await blockbook.getTransaction(utxo.txid);
    const txHex = txDetails.hex;
    const tx = bitcoin.Transaction.fromHex(txHex);
    const output = tx.outs[utxo.vout];
    const scriptHex = output.script.toString('hex');

    selectedUtxos.push(utxo);
    totalInput += parseInt(utxo.value);

    const input = {
      hash: utxo.txid,
      index: utxo.vout,
      sequence: 0xffffffff,
    };

    console.log('scriptHex', scriptHex);

    if (checkWitnessType(fromAddress, scriptHex)) {
      // SegWit
      // @ts-expect-error
      input.witnessUtxo = {
        script: Buffer.from(scriptHex, 'hex'),
        value: parseInt(utxo.value),
      };
    } else {
      // Non-SegWit
      // @ts-expect-error
      input.nonWitnessUtxo = Buffer.from(txHex, 'hex');
    }

    psbt.addInput(input);

    const estimatedFee = estimateTransactionFee(selectedUtxos.length, 2, gasPrice);
    const needed = amount + estimatedFee;
    if (totalInput >= needed) {
      totalFee = estimatedFee;
      break; // Stop once we have enough funds
    }
  }

  psbt.addOutput({
    address: toAddress,
    value: amount,
  });

  // Calculate and add change output if necessary
  const change = totalInput - amount - totalFee;
  if (change > 0) {
    psbt.addOutput({
      address: fromAddress, // Change goes back to your address
      value: change,
    });
  }

  return selectedUtxos;
}

export async function createPSBT(
  senderAddress: string,
  toAddress: string,
  amount: number,
  gasPrice: number,
  network: bitcoin.Network,
) {
  if (!toAddress || !amount) {
    throw new Error('toAddress or amount is required');
  }

  let url: string;
  if (network === bitcoin.networks.bitcoin) {
    // url = 'https://btc1.trezor.io';
    url = 'https://go.getblock.io/80f0e77bd1b04080a0d20ef4702be1ba';
  } else if (network === bitcoin.networks.testnet) {
    // url = 'https://tbtc1.trezor.io';
    url = 'https://go.getblock.io/e15e85170a3940419ebf13d3b82f78ab';
  }
  if (!url) {
    throw new Error('unsupported network');
  }
  const blockbook = new BlockBook(url);

  const psbt = new bitcoin.Psbt({ network });
  psbt.setVersion(2);
  psbt.setLocktime(0);

  const utxos = await blockbook.getUTXOs(senderAddress);
  if (utxos.length === 0) {
    throw new Error('当前地址没有在 Blockbook 找到 UTXO');
  }

  const selectedUtxo = await addInputsAndOutputs(
    psbt,
    utxos,
    senderAddress,
    toAddress,
    amount,
    gasPrice,
    blockbook,
  );

  return JSON.stringify({
    psbtHex: psbt.toHex(),
    options: {
      autoFinalized: false,
      toSignInputs: selectedUtxo.map((utxo, index) => ({
        index,
        address: senderAddress,
      })),
    },
  });
}
