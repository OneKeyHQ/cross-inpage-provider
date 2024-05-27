import { ProviderAlgoBase } from './ProviderAlgoBase';
import {
  BaseHTTPClient,
  EnableOpts,
  EnableResult,
  IProviderAlgo,
  PostTxnsResult,
  SignTxnsResult,
  WalletTransaction,
} from './types';

class ProviderAlgo extends ProviderAlgoBase implements IProviderAlgo {
  enable(opts?: EnableOpts) {
    return this.request<EnableResult>({ method: 'algo_requestAccounts', params: opts });
  }

  signTxns(transactions: WalletTransaction[]) {
    return this.request<SignTxnsResult>({ method: 'algo_signTxns', params: transactions });
  }

  postTxns(transactions: string[]) {
    return this.request<PostTxnsResult>({ method: 'algo_postTxns', params: transactions });
  }

  signAndPostTxns(transactions: WalletTransaction[]) {
    return this.request<PostTxnsResult>({ method: 'algo_signAndPostTxns', params: transactions });
  }

  getAlgodv2Client() {
    return this.request<BaseHTTPClient>({ method: 'algo_getAlgodv2Client' });
  }

  getIndexerClient() {
    return this.request<BaseHTTPClient>({ method: 'algo_getIndexerClient' });
  }
}

export { ProviderAlgo };
