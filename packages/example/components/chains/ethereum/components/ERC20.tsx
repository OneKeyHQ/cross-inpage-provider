/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiForm, ApiComboboxRef, ComboboxOption } from '../../../ApiForm';
import { IEthereumProvider } from '../types';
import { useWallet } from '../../../../components/connect/WalletContext';
import { useRef } from 'react';

import TokenList from '@uniswap/default-token-list';
import { parseChainId } from '../utils';
import BigNumber from 'bignumber.js';
import {
  checkSupportNetwork,
  getSupportNetworkNames,
  NETWORKS_BY_CHAIN_ID,
  WRAPPED_NATIVE_TOKEN,
} from '../case/contract/SampleContracts';

type ITokenOption = {
  type: string;
  options: {
    address: string;
    symbol: string;
    decimals: number;
    image: string;
  };
};

const getTokens = (chainId: string) => {
  const tokens = TokenList.tokens.filter((token) => parseChainId(chainId) === token.chainId);
  const tokenOptions: ComboboxOption<ITokenOption>[] = tokens.map((token) => ({
    value: token.address,
    label: `${token.name} - ${token.address}`,
    extra: {
      type: 'ERC20',
      options: {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        image: token.logoURI,
      },
    },
  }));
  // 排序 USDC、USDT、DAI、WETH 优先
  tokenOptions.sort((a, b) => {
    const aName = a.extra.options.symbol;
    const bName = b.extra.options.symbol;
    const aPriority = ['USDC', 'USDT', 'WETH'].includes(aName) ? 0 : 1;
    const bPriority = ['USDC', 'USDT', 'WETH'].includes(bName) ? 0 : 1;
    return aPriority - bPriority;
  });
  return tokenOptions;
};

export const WalletWatchAsset = ({ chainId }: { chainId: string | undefined }) => {
  const { provider, account } = useWallet<IEthereumProvider>();
  const tokenSelectorRef = useRef<ApiComboboxRef<ITokenOption>>(null);

  return (
    <ApiForm title="ERC20" description="ERC20 Token Send, Approve, Revoke 相关操作">
      <ApiForm.Combobox<ITokenOption>
        id="tokenSelector"
        ref={tokenSelectorRef}
        label="选择 ERC 20 Token 预设参数"
        placeholder="请选择 ERC20 Token"
        requestOptionsKey={chainId}
        onRequestOptions={async () => {
          return Promise.resolve(getTokens(chainId));
        }}
        onOptionChange={(option, formRef) => {
          formRef?.setJsonValue('request', option?.extra);
        }}
      />

      <ApiForm.Text id="watchButtonTitle" value="测试添加资产到钱包" size="lg" />
      <ApiForm.JsonEdit id="request" label="请求(可以手动编辑)" required />

      <ApiForm.Button
        id="watchButton"
        label="Wallet_WatchAsset 添加资产到钱包"
        onClick={async (formRef) => {
          const res = await provider?.request({
            'method': 'wallet_watchAsset',
            'params': JSON.parse(formRef?.getValue('request') ?? ''),
          });
          formRef?.setValue('response', JSON.stringify(res, null, 2));
        }}
        validation={{
          fields: ['request'],
          validator: (values) => {
            if (!values.request) {
              return '请选择 ERC20 Token';
            }
          },
        }}
      />

      <ApiForm.AutoHeightTextArea id="response" label="执行结果" />
      <ApiForm.Separator />
      <ApiForm.Text id="transferTitle" value="测试转账 Transfer" size="lg" />
      <ApiForm.Field id="transferAmount" type="number" label="转账数量" defaultValue="0.001" />
      <ApiForm.Field id="transferTo" type="text" label="转账地址" defaultValue={account?.address} />
      <ApiForm.Button
        id="transferButton"
        label="转账"
        availableDependencyFields={[
          { fieldIds: ['tokenSelector', 'transferAmount', 'transferTo'] },
        ]}
        onClick={async (formRef) => {
          const transferAmount = formRef?.getValue<number>('transferAmount') ?? 0;
          const transferTo = formRef?.getValue<string>('transferTo') ?? '';

          const tokenSelectorOption = tokenSelectorRef.current?.getCurrentOption();
          const from = account?.address ?? '';
          const tokenAddress = tokenSelectorOption?.extra?.options.address;

          const decimals = tokenSelectorOption?.extra?.options.decimals;
          const transferAmountBigInt = new BigNumber(transferAmount).shiftedBy(decimals);

          const params = JSON.stringify({
            from: from,
            to: tokenAddress,
            data: `0xa9059cbb${transferTo.substring(2).padStart(64, '0')}${transferAmountBigInt
              .toString(16)
              .padStart(64, '0')}`,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          });

          const res = await provider?.request({
            'method': 'eth_sendTransaction',
            'params': [JSON.parse(params)],
          });

          formRef?.setJsonValue('transferResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="transferResponse" label="执行结果" />
      <ApiForm.Separator />
      <ApiForm.Text id="approveTitle" value="测试授权 Approve、Revoke" size="lg" />
      <ApiForm.Field
        id="approveContractAddress"
        type="text"
        label="授权地址"
        defaultValue={account?.address}
      />
      <ApiForm.Field
        id="approveAmount"
        type="number"
        label="授权数量（0 表示取消授权）"
        defaultValue="100"
      />
      <ApiForm.Checkbox id="approveTokenUnlimited" label="无限授权" />
      <ApiForm.Checkbox id="approveTokenMockUniSwap" label="模拟 UniSwap（不传 Value)" />
      <ApiForm.Button
        id="approveButton"
        label="授权 Approve、Revoke"
        availableDependencyFields={[{ fieldIds: ['tokenSelector', 'approveContractAddress'] }]}
        onClick={async (formRef) => {
          const approveAmount = formRef?.getValue<number>('approveAmount');
          const approveContractAddress = formRef?.getValue<string>('approveContractAddress');
          const approveTokenUnlimited = formRef?.getValue<boolean>('approveTokenUnlimited');
          const approveTokenMockUniSwap = formRef?.getValue<boolean>('approveTokenMockUniSwap');

          const tokenSelectorOption = tokenSelectorRef.current?.getCurrentOption();
          const from = account?.address ?? '';
          const tokenAddress = tokenSelectorOption?.extra?.options.address;

          const revoke = approveAmount === 0;

          let approveAmountArg;
          // maxApprove
          if (approveTokenUnlimited) {
            // 使用最大值 2^256 - 1 表示无限额度
            approveAmountArg = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
          } else if (revoke) {
            approveAmountArg = BigInt(0).toString(16).padStart(64, '0');
          } else if (approveAmount) {
            // approveAmount是 小数 如何用 BigInt
            const decimals = tokenSelectorOption?.extra?.options.decimals;
            approveAmountArg = new BigNumber(approveAmount)
              .shiftedBy(decimals)
              .toString(16)
              .padStart(64, '0');
          } else {
            throw new Error('请输入授权数量');
          }

          const data = `0x095ea7b3${approveContractAddress
            .substring(2)
            .padStart(64, '0')}${approveAmountArg}`;

          const approveParams = {
            from: from,
            to: tokenAddress,
            data,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          };

          if (approveTokenMockUniSwap) {
            delete approveParams.value;
          }

          const approveParamsStr = JSON.stringify(approveParams);
          const res = await provider?.request({
            'method': 'eth_sendTransaction',
            'params': [JSON.parse(approveParamsStr)],
          });

          formRef?.setJsonValue('approveResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="approveResponse" label="执行结果" />
    </ApiForm>
  );
};

export const WrapAssets = ({ chainId }: { chainId: string | undefined }) => {
  const { provider, account } = useWallet<IEthereumProvider>();

  return (
    <ApiForm title="Wrap Assets" description="Wrap Assets 相关操作">
      <ApiForm.Text id="depositWrapAssetsTitle" value="测试存入 Wrap Assets" size="lg" />
      <ApiForm.Field
        id="depositWrapAssetsAmount"
        type="number"
        label="存入数量(链上最小单位)"
        defaultValue="10000"
      />
      <ApiForm.Button
        id="depositWrapAssetsButton"
        label="存入 Wrap Assets"
        availableDependencyFields={[
          {
            fieldIds: ['depositWrapAssetsAmount'],
            required: () => {
              if (chainId && !checkSupportNetwork(parseChainId(chainId))) {
                return {
                  errorMessage: `请选择支持的网络,${getSupportNetworkNames().join(',')}`,
                };
              }
            },
          },
        ]}
        onClick={async (formRef) => {
          const depositWrapAssetsAmount = formRef?.getValue<number>('depositWrapAssetsAmount');

          const chainIdNumber = parseChainId(chainId);
          const network = NETWORKS_BY_CHAIN_ID[chainIdNumber as keyof typeof NETWORKS_BY_CHAIN_ID];
          const tokenContractAddress =
            WRAPPED_NATIVE_TOKEN[network as keyof typeof WRAPPED_NATIVE_TOKEN];

          const approveParams = {
            from: account?.address,
            to: tokenContractAddress,
            data: '0xd0e30db0',
            value: `0x${new BigNumber(depositWrapAssetsAmount).toString(16)}`,
          };

          const res = await provider?.request({
            'method': 'eth_sendTransaction',
            'params': [approveParams],
          });

          formRef?.setJsonValue('approveResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="approveResponse" label="执行结果" />

      <ApiForm.Text id="withdrawWrapAssetsTitle" value="测试提现 Wrap Assets" size="lg" />
      <ApiForm.Field
        id="withdrawWrapAssetsAmount"
        type="number"
        label="提现数量(链上最小单位)"
        defaultValue="10000"
      />
      <ApiForm.Button
        id="withdrawWrapAssetsButton"
        label="提现 Wrap Assets"
        availableDependencyFields={[{ fieldIds: ['withdrawWrapAssetsAmount'] }]}
        onClick={async (formRef) => {
          const withdrawWrapAssetsAmount = formRef?.getValue<number>(
            'withdrawWrapAssetsAmount',
          );

          const chainIdNumber = parseChainId(chainId);
          const network = NETWORKS_BY_CHAIN_ID[chainIdNumber as keyof typeof NETWORKS_BY_CHAIN_ID];
          const tokenContractAddress =
            WRAPPED_NATIVE_TOKEN[network as keyof typeof WRAPPED_NATIVE_TOKEN];

          const data = `0x2e1a7d4d${new BigNumber(withdrawWrapAssetsAmount).toString(16).padStart(64, '0')}`;
          const withdrawParams = {
            from: account?.address,
            to: tokenContractAddress,
            data,
          };

          const res = await provider?.request({
            'method': 'eth_sendTransaction',
            'params': [withdrawParams],
          });

          formRef?.setJsonValue('withdrawResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="withdrawResponse" label="执行结果" />
    </ApiForm>
  );
};
