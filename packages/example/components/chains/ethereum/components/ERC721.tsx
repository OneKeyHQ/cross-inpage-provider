/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ethers } from 'ethers';
import { useWallet } from '../../../connect/WalletContext';
import { IEthereumProvider } from '../types';
import { ApiForm } from '../../../ApiForm';
import TabCard from '../../../TabCard';

import Contract721 from '../case/contract/contract721.json';
import { get } from 'lodash';
const { nftsAbi, nftsBytecode } = Contract721;

export const WalletWatchAssetERC721 = ({ chainId }: { chainId: string | undefined }) => {
  const { provider, account } = useWallet<IEthereumProvider>();

  let nftsContract: ethers.Contract;
  let nftsFactory: ethers.ContractFactory;

  return (
    <ApiForm title="wallet_watchAsset ERC721" description="添加 ERC721 资产">
      <TabCard
        tabs={[
          {
            label: '部署合约',
            value: 'deploy',
            title: '部署 ERC721 合约',
            description:
              '部署 ERC721 合约，用于测试 wallet_watchAsset ERC721，尽量使用手续费低的链',
            content: (
              <>
                <ApiForm.Button
                  id="deployButton"
                  label="部署 ERC721 合约"
                  onClick={async (apiFrom) => {
                    try {
                      const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');

                      nftsFactory = new ethers.ContractFactory(
                        nftsAbi,
                        nftsBytecode,
                        ethersProvider.getSigner(),
                      );

                      nftsContract = await nftsFactory.deploy();
                      await nftsContract.deployTransaction.wait();
                    } catch (error) {
                      const reason = get(error, 'reason', undefined);
                      const message = get(error, 'message', undefined);
                      apiFrom?.setJsonValue('deployResponse', reason || message);
                      throw error;
                    }

                    if (nftsContract.address === undefined) {
                      return;
                    }

                    console.log(
                      `Contract mined! address: ${nftsContract.address} transactionHash: ${nftsContract.deployTransaction.hash}`,
                    );

                    apiFrom?.setValue('deployResponse', nftsContract.address);
                  }}
                />

                <ApiForm.TextArea id="deployResponse" label="部署结果" />

                <ApiForm.Separator />

                <ApiForm.Field
                  id="mintAmount"
                  label="铸造数量"
                  defaultValue="3"
                  type="number"
                  required
                />

                <ApiForm.Button
                  id="mintButton"
                  label="铸造"
                  onClick={async (apiFrom) => {
                    const mintAmount = apiFrom?.getValue('mintAmount');
                    try {
                      let result = await nftsContract.mintNFTs(mintAmount, {
                        from: account?.address,
                      });
                      result = await result.wait();
                    } catch (error) {
                      apiFrom?.setJsonValue('mintResponse', error);
                      throw error;
                    }

                    if (nftsContract.address === undefined) {
                      return;
                    }

                    apiFrom?.setValue('mintResponse', nftsContract.address);
                  }}
                  availableDependencyFields={[{ fieldIds: ['mintAmount'] }]}
                  validation={{
                    fields: ['mintAmount'],
                    validator: (values) => {
                      if (!values.mintAmount.value) {
                        return '请输入铸造数量';
                      }
                      if (!account) {
                        return '请连接钱包';
                      }
                      if (!nftsContract) {
                        return '请部署 ERC721 合约';
                      }
                    },
                  }}
                />

                <ApiForm.TextArea id="mintResponse" label="铸造结果" />
              </>
            ),
          },
          {
            label: '使用 ERC721 合约',
            value: 'use',
            title: '使用 ERC721 合约',
            description:
              '使用当前帐户已经部署的 ERC721 合约，测试 wallet_watchAsset ERC721，在区块浏览器中查找 Owner 为当前帐户的 ERC721 资产，填写 Contract Address 和 TokenId 进行观察',
            content: <ApiForm.Field id="watchContractAddress" label="已经部署的 ERC721 合约地址" />,
          },
        ]}
      />

      <ApiForm.Text id="watchButtonTitle" value="测试添加资产到钱包" size="lg" />
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
        onClick={async (apiFrom) => {
          const watchTokenId = apiFrom?.getValue('watchTokenId');
          const watchContractAddress = apiFrom?.getValue('watchContractAddress');
          const nftsContractAddress = nftsContract?.address ?? watchContractAddress;

          let watchNftsResult;
          try {
            watchNftsResult = await provider?.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC721',
                options: {
                  address: nftsContractAddress,
                  tokenId: watchTokenId,
                },
              },
            });
          } catch (error) {
            console.error(error);
          }

          apiFrom?.setValue('watchResponse', JSON.stringify(watchNftsResult, null, 2));
        }}
        availableDependencyFields={[
          {
            fieldIds: ['watchTokenId'],
            required: () => {
              if (!account) {
                return {
                  errorMessage: '请连接钱包',
                };
              }
              if (!nftsContract) {
                return {
                  errorMessage: '请部署 ERC721 合约',
                };
              }
            },
          },
          {
            fieldIds: ['watchTokenId', 'watchContractAddress'],
            required: () => {
              if (!account) {
                return {
                  errorMessage: '请连接钱包',
                };
              }
            },
          },
        ]}
      />

      <ApiForm.TextArea id="watchResponse" label="观察结果" />
      <ApiForm.Separator />
      {/* 转账功能 */}
      <ApiForm.Text id="transferTitle" value="测试转账 Transfer" size="lg" />
      <ApiForm.Field id="transferTokenId" type="number" label="转账 Token ID" defaultValue="1" />
      <ApiForm.Field id="transferTo" type="text" label="转账地址" defaultValue={account?.address} />
      <ApiForm.Checkbox id="safeTransfer" label="是否安全转账"/>
      <ApiForm.Button
        id="transferButton"
        label="转账"
        validation={{
          fields: ['transferTo', 'transferTokenId'],
        }}
        onClick={async (apiFrom) => {
          const safeTransfer = apiFrom?.getValue<boolean>('safeTransfer');

          const toAddress = apiFrom?.getValue<string>('transferTo');
          const tokenId = apiFrom?.getValue<number>('transferTokenId');
          const watchContractAddress = apiFrom?.getValue<string>('watchContractAddress');
          const contractAddress = nftsContract?.address ?? watchContractAddress;

          if (!contractAddress) {
            apiFrom?.setJsonValue('transferResponse', '请先部署 ERC721 合约');
            return;
          }

          const data = [
            safeTransfer ? '0x42842e0e' : '0x23b872dd', // safeTransferFrom 方法签名
            account?.address?.substring(2).padStart(64, '0'),
            toAddress.substring(2).padStart(64, '0'),
            BigInt(tokenId).toString(16).padStart(64, '0'),
          ].join('');

          const params = JSON.stringify({
            from: account?.address,
            to: contractAddress,
            data,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          });

          const res = await provider?.request({
            method: 'eth_sendTransaction',
            params: [JSON.parse(params)],
          });
          apiFrom?.setJsonValue('transferResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="transferResponse" label="转账结果" />

      <ApiForm.Separator />
      <ApiForm.Text id="approveTitle" value="测试授权 Approve、Revoke" size="lg" />
      <ApiForm.Field id="approveTokenId" type="number" label="要授权的 Token ID" defaultValue="1" />
      <ApiForm.Field id="approveTo" type="text" label="授权地址" defaultValue={account?.address} />
      <ApiForm.Button
        id="approveButton"
        label="授权"
        onClick={async (formRef) => {
          const approveAddress = formRef?.getValue<string>('approveTo');
          const tokenId = formRef?.getValue<number>('approveTokenId');
          const watchContractAddress = formRef?.getValue<string>('watchContractAddress');
          const contractAddress = nftsContract?.address ?? watchContractAddress;

          if (!contractAddress) {
            formRef?.setJsonValue('approveResponse', '请先部署 ERC721 合约');
            return;
          }

          const data = [
            '0x095ea7b3', // approve 方法签名
            approveAddress.substring(2).padStart(64, '0'),
            BigInt(tokenId).toString(16).padStart(64, '0'),
          ].join('');

          const params = JSON.stringify({
            from: account?.address,
            to: contractAddress,
            data,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          });

          const res = await provider?.request({
            method: 'eth_sendTransaction',
            params: [JSON.parse(params)],
          });
          formRef?.setJsonValue('approveResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="approveResponse" label="授权结果" />

      <ApiForm.Separator />
      <ApiForm.Text id="revokeTitle" value="测试撤销 Revoke" size="lg" />
      <ApiForm.Field id="revokeTokenId" type="number" label="撤销 TokenId" defaultValue="1" />
      <ApiForm.Button
        id="revokeButton"
        label="撤销"
        onClick={async (formRef) => {
          const tokenId = formRef?.getValue<number>('revokeTokenId');
          const watchContractAddress = formRef?.getValue<string>('watchContractAddress');
          const contractAddress = nftsContract?.address ?? watchContractAddress;

          if (!contractAddress) {
            formRef?.setJsonValue('revokeResponse', '请先部署 ERC721 合约');
            return;
          }

          const data = [
            '0x095ea7b3', // approve 方法签名
            '0'.padStart(64, '0'),
            BigInt(tokenId).toString(16).padStart(64, '0'),
          ].join('');

          const params = JSON.stringify({
            from: account?.address,
            to: contractAddress,
            data,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          });

          const res = await provider?.request({
            method: 'eth_sendTransaction',
            params: [JSON.parse(params)],
          });
          formRef?.setJsonValue('revokeResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="revokeResponse" label="撤销结果" />

      <ApiForm.Separator />
      <ApiForm.Text id="approveAllTitle" value="测试授权 All" size="lg" />
      <ApiForm.Field id="approveAllTo" label="授权地址" defaultValue={account?.address} required />
      <ApiForm.Button
        id="approveAllButton"
        label="授权 All"
        onClick={async (formRef) => {
          const approveAllTo = formRef?.getValue<string>('approveAllTo');
          const watchContractAddress = formRef?.getValue<string>('watchContractAddress');
          const contractAddress = nftsContract?.address ?? watchContractAddress;

          if (!contractAddress) {
            formRef?.setJsonValue('approveAllResponse', '请先部署 ERC721 合约');
            return;
          }

          const data = [
            '0xa22cb465', // approve 方法签名
            approveAllTo?.padStart(64, '0'),
            BigInt(1).toString(16).padStart(64, '0'),
          ].join('');

          const params = JSON.stringify({
            from: account?.address,
            to: contractAddress,
            data,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          });

          const res = await provider?.request({
            method: 'eth_sendTransaction',
            params: [JSON.parse(params)],
          });
          formRef?.setJsonValue('approveAllResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="approveAllResponse" label="授权 All 结果" />

      <ApiForm.Separator />
      <ApiForm.Text id="revokeAllTitle" value="测试撤销 All 授权" size="lg" />
      <ApiForm.Field id="revokeAllTo" label="撤销地址" defaultValue={account?.address} required />
      <ApiForm.Button
        id="revokeAllButton"
        label="撤销 All"
        onClick={async (formRef) => {
          const revokeAllTo = formRef?.getValue<string>('revokeAllTo');
          const watchContractAddress = formRef?.getValue<string>('watchContractAddress');
          const contractAddress = nftsContract?.address ?? watchContractAddress;

          if (!contractAddress) {
            formRef?.setJsonValue('revokeAllResponse', '请先部署 ERC721 合约');
            return;
          }

          const data = [
            '0xa22cb465', // approve 方法签名
            revokeAllTo?.padStart(64, '0'),
            BigInt(0).toString(16).padStart(64, '0'),
          ].join('');

          const params = JSON.stringify({
            from: account?.address,
            to: contractAddress,
            data,
            value: '0x0',
            gasLimit: '0x186a0',
            gasPrice: '0xbebc200',
          });

          const res = await provider?.request({
            method: 'eth_sendTransaction',
            params: [JSON.parse(params)],
          });
          formRef?.setJsonValue('revokeAllResponse', res);
        }}
      />
      <ApiForm.AutoHeightTextArea id="revokeAllResponse" label="撤销 All 授权结果" />
    </ApiForm>
  );
};
