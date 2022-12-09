/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useState, useEffect, useCallback } from 'react'
import { ProviderCardano } from '@onekeyfe/onekey-cardano-provider'

declare global {
	interface Window {
		// @ts-expect-error
		cardano: {
			onekey: ProviderCardano
		} 
	}
}

const useProvider = () => {
	const [provider, setProvider] = useState<ProviderCardano>()

	useEffect(() => {
		const injectedProvider = window.cardano as ProviderCardano;
		const cardanoProvider = injectedProvider || new ProviderCardano({})
		setProvider(cardanoProvider)	
	}, [])

	return provider
}

export default function CardanoExample() {
	const provider = useProvider()
	const [connected, setConnected] = useState<boolean>(false);
	const [API, setAPI] = useState<any | null>(null)
	const [networkId, setNetworkId] = useState<number | null>(null)
	const [utxos, setUtxos] = useState<string[]>([])
	const [usedAddresses, setUsedAddresses] = useState<string[]>([])
	const [unusedAddresses, setUnusedAddresses] = useState<string[]>([])
	const [changeAddress, setChangeAddress] = useState<string>('')
	const [rewardAddresses, setRewardAddresses] = useState<string[]>([])
	const [balance, setBalance] = useState<string>('')

	const getWalletInfo = useCallback(async () => {
		const api = await provider.onekey.enable()
		try {
			void api.getNetworkId().then((id: number) => setNetworkId(id))
			void api.getUtxos().then((utxos: string[]) => setUtxos(utxos))
			void api.getBalance().then((balance: string) => setBalance(balance))
			void api.getUsedAddresses().then((addresses: string[]) => setUsedAddresses(addresses))
			void api.getUnusedAddresses().then((addresses: string[]) => setUnusedAddresses(addresses))
			void api.getRewardAddresses().then((addresses: string[]) => setRewardAddresses(addresses))
			void api.getChangeAddress().then((address: string) => setChangeAddress(address))
		} catch {
			// ignore
		}
	}, [provider])


	useEffect(() => {
		if (!provider) return
		try {
			provider.on('connect', (address: string) => {
        console.log(`cardanoWallet.on [connect] ${address}`);
				getWalletInfo().catch(e => console.error(e))
			})
		}	catch (e) {
			console.error(e)
			// ignore
		}
		try {
      provider.on('accountChanged', (address: string) => {
        console.log(`cardanoWallet.on [accountChange] ${address}`);
				getWalletInfo().catch(e => console.error(e))
      });
    } catch (e) {
			console.error(e)
      // ignore
    }
		return () => {
			// 
		}
	}, [provider, getWalletInfo])

	const connectWallet = async () => {
		try {
			const api = await provider.onekey.enable()
			setAPI(api)
			setConnected(true)
		} catch(e) {
			console.error(e)
			setAPI(null)
			setConnected(false)
		}
	}

	const signTransaction = async () => {
		const txHex = '84a300818258200528ed5dd2134534df4d999c9cd712e8b47441a0363cc972bf5d5c72635c3e5100018282583901cd5aa28518568615ed6bd4ad40e6cecd65734373bf578489b02830e38d6dc22f3b6dfd333cf6495e8fb3fffbc2936cc010827b32d92eca1b1a000f424082583901922941c2e490c9f9f8706c66f7f46b5abec243fcb663f02817fb9b83aa618af8973bc5f1fdb9c9db97d1c55f0d4d4a1e633bbb14ab43b4fc1a001449d5021a00029075a0f5f6'
		const witness = await API.signTx(txHex, true)
		console.log(witness)
	}

	const signData = async () => {
		const signature = await API.signData(usedAddresses?.[0], Buffer.from('hello world', 'utf8').toString('hex'))
		console.log(signature)
	}

	return (
		<div>
			<div style={{padding: '20px'}} >Cardano 返回数据格式大部分为 CBOR 的包装格式，需要对应 SDK 解析。由于本项目不引入第三方 SDK, 所以示例项目直接展示原始字符串</div>
			{!provider && (
				<a target="_blank" href={'https://www.onekey.so/download/'}>
					Install OneKey Extension →
				</a>
			)}
			<main>
				{provider && connected ? (
					<div>
						<ul>walletName: <img src={provider.onekey.icon} style={{height: '24px', width: '24px'}} /> {provider.onekey.name}</ul>
						<ul>apiVersion: {provider.onekey.apiVersion}</ul>
						<ul>networkId: {networkId}</ul>
						<ul style={{width: '80%'}}>Utxos: {utxos.map(u => (<li style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} key={u}>{u}</li>))}</ul>
						<ul>balance: {balance}</ul>
						<ul style={{width: '80%'}}>UsedAddresses: {usedAddresses.map(addr => (<li style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} key={addr}>{addr}</li>))}</ul>
						<ul style={{width: '80%'}}>UnusedAddresses: {unusedAddresses.map(addr => (<li style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} key={addr}>{addr}</li>))}</ul>
						<ul style={{width: '80%'}}>rewardAddresses: {rewardAddresses.map(addr => (<li style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} key={addr}>{addr}</li>))}</ul>
						<ul>changeAddress: {changeAddress}</ul>
						<button onClick={() => signTransaction()}>SignTransaction</button>
						<button onClick={() => signData()}>SignData</button>
					</div>
				) : (
					<button onClick={() => connectWallet()}>Connect Wallet</button>
				)}
			</main>
		</div>
	)
}
