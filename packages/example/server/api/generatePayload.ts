import { HttpResponseResolver } from 'msw';
import { TonProofService } from '../services/tonProofService';
import { badRequest, ok } from '../utils/httpUtils';
import { createPayloadToken } from '../utils/jwt';

/**
 * Generates a payload for ton proof.
 *
 * POST /api/generate_payload
 */
export const generatePayload: HttpResponseResolver = async () => {
  try {
    const service = new TonProofService();

    const payload = service.generatePayload();
    const payloadToken = await createPayloadToken({ payload: payload });

    return ok({ payload: payloadToken });
  } catch (e) {
    return badRequest({ error: 'Invalid request', trace: e });
  }
};
