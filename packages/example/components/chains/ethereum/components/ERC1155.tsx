/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const { erc1155Abi, erc1155Bytecode } = Contract1155;
import { useRef } from 'react';
import Contract1155 from '../case/contract/contract1155.json';
import { IEthereumProvider } from '../types';
import { useWallet } from '../../../connect/WalletContext';
import { ethers } from 'ethers';
import { ApiForm, ApiFormRef } from '../../../ApiForm';
import TabCard from '../../../TabCard';
import { get } from 'lodash';

export const WalletWatchAssetERC1155 = ({ chainId }: { chainId: string | undefined }) => {
  const apiFromRef = useRef<ApiFormRef>(null);

  const { provider, account } = useWallet<IEthereumProvider>();

  let erc1155Contract: ethers.Contract;
  let erc1155Factory: ethers.ContractFactory;

  return (
    <ApiForm
      title="wallet_watchAsset ERC1155"
      description="添加 ERC1155 资产 尽量使用手续费低的链"
      ref={apiFromRef}
    >
      <TabCard
        tabs={[
          {
            label: '部署合约',
            value: 'deploy',
            title: '部署 ERC1155 合约',
            description:
              '部署 ERC1155 合约，用于测试 wallet_watchAsset ERC1155，尽量使用手续费低的链',
            content: (
              <>
                <ApiForm.Button
                  id="deployButton"
                  label="部署 ERC1155 合约"
                  onClick={async () => {
                    try {
                      const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');

                      erc1155Factory = new ethers.ContractFactory(
                        erc1155Abi,
                        erc1155Bytecode,
                        ethersProvider.getSigner(),
                      );

                      erc1155Contract = await erc1155Factory.deploy();
                      await erc1155Contract.deployTransaction.wait();
                    } catch (error) {
                      const reason = get(error, 'reason', undefined);
                      const message = get(error, 'message', undefined);
                      apiFromRef.current?.setJsonValue('deployResponse', reason || message);
                      throw error;
                    }

                    if (erc1155Contract.address === undefined) {
                      return;
                    }

                    console.log(
                      `Contract mined! address: ${erc1155Contract.address} transactionHash: ${erc1155Contract.deployTransaction.hash}`,
                    );

                    apiFromRef.current?.setValue('deployResponse', erc1155Contract.address);
                  }}
                />

                <ApiForm.TextArea id="deployResponse" label="部署结果" />

                <ApiForm.Separator />

                <ApiForm.Field
                  id="mintTokenId"
                  label="铸造的 Token IDs"
                  defaultValue="1, 2, 3"
                  required
                />

                <ApiForm.Field
                  id="mintAmount"
                  label="Token IDs 对应铸造数量"
                  defaultValue="1, 10, 100"
                  required
                />

                <ApiForm.Button
                  id="mintButton"
                  label="铸造"
                  onClick={async () => {
                    const mintTokenIds = apiFromRef.current?.getValue('mintTokenId');
                    const mintAmounts = apiFromRef.current?.getValue('mintAmount');
                    try {
                      const params = [
                        account?.address,
                        mintTokenIds.split(',').map(Number),
                        mintAmounts.split(',').map(Number),
                        '0x',
                      ];
                      let result = await erc1155Contract.mintBatch(...params);
                      result = await result.wait();

                      console.log('mint success', result);
                    } catch (error) {
                      const reason = get(error, 'reason', undefined);
                      const message = get(error, 'message', undefined);
                      apiFromRef.current?.setJsonValue('mintResponse', reason || message);
                      throw error;
                    }

                    if (erc1155Contract.address === undefined) {
                      return;
                    }

                    apiFromRef.current?.setValue('mintResponse', erc1155Contract.address);
                  }}
                  availableDependencyFields={[{ fieldIds: ['mintTokenId', 'mintAmount'] }]}
                  validation={{
                    fields: ['mintTokenId', 'mintAmount'],
                    validator: (values) => {
                      if (!values.mintTokenId.value) {
                        return '请输入铸造的 Token IDs';
                      }
                      if (!values.mintAmount.value) {
                        return '请输入铸造数量';
                      }

                      if (
                        values.mintTokenId.value.split(',').length !==
                        values.mintAmount.value.split(',').length
                      ) {
                        return '铸造的 Token IDs 和铸造数量数量不一致';
                      }

                      if (!account) {
                        return '请连接钱包';
                      }
                      if (!erc1155Contract) {
                        return '请部署 ERC1155 合约';
                      }
                    },
                  }}
                />

                <ApiForm.TextArea id="mintResponse" label="铸造结果" />
              </>
            ),
          },
          {
            label: '使用 ERC1155 合约',
            value: 'use',
            title: '使用 ERC1155 合约',
            description:
              '使用当前帐户已经部署的 ERC1155 合约，测试 wallet_watchAsset ERC1155，在区块浏览器中查找 Owner 为当前帐户的 ERC1155 资产，填写 Contract Address 和 TokenId 进行观察',
            content: (
              <ApiForm.Field id="watchContractAddress" label="已经部署的 ERC1155 合约地址" />
            ),
          },
        ]}
      />

      <ApiForm.Separator />
      <ApiForm.Text id="watchTokenIdTitle" value="测试观察 TokenId" size="lg" />
      <ApiForm.Field
        id="watchTokenId"
        label="观察 TokenId"
        defaultValue="1"
        type="number"
        required
      />

      <ApiForm.Button
        id="watchButton"
        label="观察 Asset"
        onClick={async () => {
          const watchContractAddress = apiFromRef.current?.getValue('watchContractAddress');
          const nftsContractAddress = erc1155Contract?.address ?? watchContractAddress;

          const watchTokenId = apiFromRef.current?.getValue('watchTokenId');
          let watchNftsResult;
          try {
            watchNftsResult = await provider?.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC1155',
                options: {
                  address: nftsContractAddress,
                  tokenId: watchTokenId,
                },
              },
            });
          } catch (error) {
            console.error(error);
          }

          apiFromRef.current?.setValue('watchResponse', JSON.stringify(watchNftsResult, null, 2));
        }}
        availableDependencyFields={[{ fieldIds: ['watchTokenId'] }]}
        validation={{
          fields: ['watchTokenId', 'watchContractAddress'],
          validator: (values) => {
            if (!values.watchTokenId.value) {
              return '请输入观察 TokenId';
            }
            if (!account) {
              return '请连接钱包';
            }
            if (!erc1155Contract && !values.watchContractAddress?.value) {
              return '请部署 ERC1155 合约 或 填写已经部署的 ERC1155 合约地址';
            }
          },
        }}
      />

      <ApiForm.TextArea id="watchResponse" label="观察结果" />

      <ApiForm.Separator />
      {/* ERC1155 转账示例 */}
      <ApiForm.Text id="transferTokenIdTitle" value="测试转账 TokenId" size="lg" />
      <ApiForm.Field
        id="transferTo"
        label="转账接收地址"
        defaultValue={account?.address}
        required
      />
      <ApiForm.Field
        id="transferTokenId"
        label="转账 TokenId"
        defaultValue="1"
        type="number"
        required
      />
      <ApiForm.Field id="transferAmount" label="转账数量" defaultValue="1" type="number" required />

      <ApiForm.Button
        id="transferButton"
        label="转账"
        onClick={async () => {
          const transferTo = apiFromRef.current?.getValue<string>('transferTo');
          const transferTokenId = apiFromRef.current?.getValue<number>('transferTokenId');
          const transferAmount = apiFromRef.current?.getValue<number>('transferAmount');

          const watchContractAddress = apiFromRef.current?.getValue<string>('watchContractAddress');
          const nftsContractAddress = erc1155Contract?.address ?? watchContractAddress;

          if (!transferTo) {
            apiFromRef.current?.setJsonValue('transferResponse', '请输入转账接收地址');
            return;
          }

          /*
            拼接 ERC1155 safeTransferFrom 调用数据：
            函数定义：safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)
            函数选择器：0xf242432a
            参数编码：
              - address 参数：去掉 0x 后，左侧填充 0 至 64 位
              - uint256 参数使用十六进制表示，左侧填充 0 至 64 位
              - bytes 参数采用动态类型编码，若为空 bytes 则：
                静态部分存放 offset (固定为 0x80，即 128，填充至 64 位)；
                动态部分先写入 bytes 长度 (此处为 0)，再跟后面空数据。
            最终数据 = selector + from + to + tokenId + amount + offset + 动态部分 (长度为 0)
          */
          const functionSelector = '0xf242432a';
          const fromPadded = account?.address?.substring(2).toLowerCase().padStart(64, '0');
          const toPadded = transferTo?.substring(2).toLowerCase().padStart(64, '0');
          const tokenIdHex = BigInt(transferTokenId).toString(16).padStart(64, '0');
          const amountHex = BigInt(transferAmount).toString(16).padStart(64, '0');
          // 动态参数 offset 固定为 0x80（128 的十六进制，填充到 32 字节）
          const offset = '0000000000000000000000000000000000000000000000000000000000000080';
          // 动态部分：bytes 参数的长度（0）填充 32 字节
          const emptyBytesLength =
            '0000000000000000000000000000000000000000000000000000000000000000';
          const callData =
            functionSelector +
            fromPadded +
            toPadded +
            tokenIdHex +
            amountHex +
            offset +
            emptyBytesLength;

          const txParams = {
            from: account?.address,
            to: nftsContractAddress,
            data: callData,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          };

          const tx = await provider?.request({
            method: 'eth_sendTransaction',
            params: [txParams],
          });

          apiFromRef.current?.setValue('transferResponse', tx);
        }}
      />

      <ApiForm.TextArea id="transferResponse" label="转账结果" />

      <ApiForm.Separator />
      <ApiForm.Text id="approveTokenIdTitle" value="测试授权 Token 给其他地址" size="lg" />
      <ApiForm.Field id="approveTo" label="授权接收地址" defaultValue={account?.address} required />

      <ApiForm.Button
        id="approveButton"
        label="授权"
        availableDependencyFields={[
          {
            fieldIds: ['approveTo', 'watchContractAddress'],
            required: () => {
              if (account) {
                return {
                  errorMessage: '请连接钱包',
                };
              }
              return {
                errorMessage: '请填写已经部署的 ERC1155 合约地址',
              };
            },
          },
          {
            fieldIds: ['approveTo'],
            required: () => {
              if (account) {
                return {
                  errorMessage: '请连接钱包',
                };
              }
              if (!erc1155Contract) {
                return {
                  errorMessage: '请部署 ERC1155 合约',
                };
              }
              return {
                errorMessage: '请输入授权接收地址',
              };
            },
          },
        ]}
        onClick={async (apiForm) => {
          const approveTo = apiForm?.getValue<string>('approveTo');
          const contractAddress =
            erc1155Contract?.address || apiForm?.getValue<string>('watchContractAddress');
          if (!contractAddress) {
            apiForm?.setJsonValue('approvalResponse', '请先部署 ERC1155 合约或填写合约地址');
            return;
          }

          // 拼接 setApprovalForAll(address operator, bool approved)
          const data = [
            '0xa22cb465', // approve 方法签名
            approveTo.substring(2).padStart(64, '0'),
            BigInt(1).toString(16).padStart(64, '0'),
          ].join('');

          const txParams = {
            from: account?.address,
            to: contractAddress,
            data: data,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          };

          const tx = await provider?.request({
            method: 'eth_sendTransaction',
            params: [txParams],
          });

          apiForm?.setValue('approvalResponse', tx);
        }}
      />

      <ApiForm.TextArea id="approvalResponse" label="授权结果" />

      <ApiForm.Separator />
      <ApiForm.Text id="balanceTokenIdTitle" value="测试取消授权 Token" size="lg" />
      <ApiForm.Field
        id="unapproveAddress"
        label="取消授权地址"
        defaultValue={account?.address}
        required
      />

      <ApiForm.Button
        id="unapproveButton"
        label="取消授权"
        onClick={async (apiForm) => {
          const unapproveAddress = apiForm?.getValue<string>('unapproveAddress');
          const contractAddress =
            erc1155Contract?.address || apiForm?.getValue<string>('watchContractAddress');
          if (!contractAddress) {
            apiForm?.setJsonValue('unapprovalResponse', '请先部署 ERC1155 合约或填写合约地址');
            return;
          }

          // 拼接 setApprovalForAll(address operator, bool approved)
          const data = [
            '0xa22cb465', // approve 方法签名
            unapproveAddress?.substring(2).padStart(64, '0'),
            BigInt(0).toString(16).padStart(64, '0'),
          ].join('');
          const txParams = {
            from: account?.address,
            to: contractAddress,
            data: data,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          };

          const tx = await provider?.request({
            method: 'eth_sendTransaction',
            params: [txParams],
          });

          apiForm?.setValue('unapprovalResponse', tx);
        }}
      />

      <ApiForm.TextArea id="unapprovalResponse" label="取消授权结果" />
    </ApiForm>
  );
};
