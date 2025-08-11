enum EHyperLiquidApiEndpoint {
  EXCHANGE = '/exchange',
}

function isUrlMatchEndpoint({
  url,
  endpoint,
}: {
  url: string | undefined;
  endpoint: EHyperLiquidApiEndpoint;
}) {
  if (!url) {
    return false;
  }
  return url.includes(endpoint);
}

function isApiJsonBodyValid(jsonBody: unknown) {
  return typeof jsonBody === 'object' && jsonBody !== null && !Array.isArray(jsonBody);
}

function convertToTypedApiPayload({
  jsonBody,
  url,
  endpoint,
}: {
  jsonBody: unknown;
  url: string | undefined;
  endpoint: EHyperLiquidApiEndpoint;
}) {
  if (!isUrlMatchEndpoint({ url, endpoint })) {
    return undefined;
  }
  const placeOrderActionJsonBody = jsonBody as
    | {
        action: {
          type: 'cancel' | 'order';
          builder?: {
            b: string;
            f: number;
          };
        };
        signature: string;
        nonce: string;
      }
    | undefined;

  const hasSignature = !!placeOrderActionJsonBody?.signature;
  const hasNonce = !!placeOrderActionJsonBody?.nonce;
  const hasAction = !!placeOrderActionJsonBody?.action;

  if (hasSignature && hasNonce && hasAction) {
    return placeOrderActionJsonBody;
  }
  return undefined;
}

function isPlaceOrderRequest({ jsonBody, url }: { jsonBody: unknown; url: string | undefined }) {
  const placeOrderActionJsonBody = convertToTypedApiPayload({
    endpoint: EHyperLiquidApiEndpoint.EXCHANGE,
    jsonBody,
    url,
  });
  return !!(placeOrderActionJsonBody && placeOrderActionJsonBody?.action?.type === 'order');
}

function isCancelOrderRequest({ jsonBody, url }: { jsonBody: unknown; url: string | undefined }) {
  const placeOrderActionJsonBody = convertToTypedApiPayload({
    endpoint: EHyperLiquidApiEndpoint.EXCHANGE,
    jsonBody,
    url,
  });
  return !!(placeOrderActionJsonBody && placeOrderActionJsonBody?.action?.type === 'cancel');
}

export default {
  isApiJsonBodyValid,
  isUrlMatchEndpoint,
  convertToTypedApiPayload,
  isPlaceOrderRequest,
  isCancelOrderRequest,
};
