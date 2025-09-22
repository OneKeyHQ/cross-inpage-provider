import { http } from 'msw';
import { checkProof } from './api/checkProof';
import { generatePayload } from './api/generatePayload';
import { getAccountInfo } from './api/getAccountInfo';
import { merkleProof } from './api/merkleProof';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const handlers = (baseUrl: string) => [
  http.post(`${baseUrl}/api/generate_payload`, generatePayload),
  http.post(`${baseUrl}/api/check_proof`, checkProof),
  http.get(`${baseUrl}/api/get_account_info`, getAccountInfo),
  http.get(`${baseUrl}/api/merkle_proof`, merkleProof),
];
