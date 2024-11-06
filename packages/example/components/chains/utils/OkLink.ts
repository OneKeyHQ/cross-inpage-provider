/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import axios, { AxiosInstance } from 'axios';

type PageInfo<T> = {
  page: number;
  limit: number;
  totalPage: number;
  chainFullName: string;
  chainShortName: string;
  tokenList: T[];
};

type BaseResponse<T> = {
  code: number;
  msg: string;
  data: PageInfo<T>[];
};

export type OkLinkTokenInfo = {
  tokenFullName: string;
  token: string;
  precision: string;
  tokenContractAddress: string;
  protocolType: string;
  logoUrl: string;
};

class OKLinkRequest {
  private axiosInstance: AxiosInstance;
  private cache: Record<string, any> = {};

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://www.oklink.com/api/v5/explorer',
      headers: {
        'Content-Type': 'application/json',
        'Ok-Access-Key': process.env.NEXT_PUBLIC_OKLINK_API_KEY,
      },
    });
  }

  async getTokenList(
    chainName: 'TRON',
    tokenType: 'TRC20' | undefined,
  ): Promise<OkLinkTokenInfo[]> {
    const cacheKey = `${chainName}-${tokenType}`;
    if (this.cache[cacheKey]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return this.cache[cacheKey];
    }

    const res = await this.axiosInstance
      .get<BaseResponse<OkLinkTokenInfo>>(`/token/token-list?chainShortName=${chainName}&limit=50`)
      .catch((err) => {
        console.error(err);
        return { data: { data: [] } };
      });

    const tokenList =
      res.data?.data?.[0]?.tokenList?.filter((token: { protocolType: string }) => {
        if (tokenType) {
          return token.protocolType === tokenType;
        }
        return true;
      }) ?? [];

    this.cache[cacheKey] = tokenList;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return tokenList;
  }
}

export const okLinkRequest = new OKLinkRequest();
