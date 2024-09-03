import { HttpResponseResolver } from 'msw';
import { CheckProofRequest } from '../dto/checkProofRequestDto';
import { TonApiService } from '../services/tonApiService';
import { TonProofService } from '../services/tonProofService';
import { badRequest, ok } from '../utils/httpUtils';
import { createAuthToken, verifyToken } from '../utils/jwt';

/**
 * Checks the proof and returns an access token.
 *
 * POST /api/check_proof
 */
export const checkProof: HttpResponseResolver = async ({ request }) => {
  try {
    const body = CheckProofRequest.parse(await request.json());

    const client = TonApiService.create(body.network);
    const service = new TonProofService();

    const isValid = await service.checkProof(body, (address) => client.getWalletPublicKey(address));
    if (!isValid) {
      return badRequest({ error: 'Invalid proof' });
    }

    const payloadToken = body.proof.payload;
    if (!(await verifyToken(payloadToken))) {
      return badRequest({ error: 'Invalid token' });
    }

    const token = await createAuthToken({ address: body.address, network: body.network });

    return ok({ token: token });
  } catch (e) {
    return badRequest({ error: 'Invalid request', trace: e });
  }
};
