const messages = {
  errors: {
    disconnected: () =>
      'StarMask: Disconnected from chain. Attempting to connect.',
    permanentlyDisconnected: () =>
      'StarMask: Disconnected from StarMask background. Page reload required.',
    sendSiteMetadata: () =>
      `StarMask: Failed to send site metadata. This is an internal error, please report this bug.`,
    unsupportedSync: (method: string) =>
      `StarMask: The StarMask Starcoin provider does not support synchronous methods like ${ method } without a callback parameter.`,
    invalidDuplexStream: () => 'Must provide a Node.js-style duplex stream.',
    invalidRequestArgs: () => `Expected a single, non-array, object argument.`,
    invalidRequestMethod: () => `'args.method' must be a non-empty string.`,
    invalidRequestParams: () =>
      `'args.params' must be an object or array if provided.`,
    invalidLoggerObject: () => `'args.logger' must be an object if provided.`,
    invalidLoggerMethod: (method: string) =>
      `'args.logger' must include required method '${ method }'.`,
  },
  info: {
    connected: (chainId: string) =>
      `StarMask: Connected to chain with ID "${ chainId }".`,
  },
  warnings: {
    // deprecated methods
    enableDeprecation: `StarMask: 'starcoin.enable()' is deprecated and may be removed in the future. Please use the 'stc_requestAccounts' RPC method instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1102`,
    sendDeprecation: `StarMask: 'starcoin.send(...)' is deprecated and may be removed in the future. Please use 'starcoin.sendAsync(...)' or 'starcoin.request(...)' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193`,
    // deprecated events
    events: {
      close: `StarMask: The event 'close' is deprecated and may be removed in the future. Please use 'disconnect' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193#disconnect`,
      data: `StarMask: The event 'data' is deprecated and will be removed in the future. Use 'message' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193#message`,
      networkChanged: `StarMask: The event 'networkChanged' is deprecated and may be removed in the future. Use 'chainChanged' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193#chainchanged`,
      notification: `StarMask: The event 'notification' is deprecated and may be removed in the future. Use 'message' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193#message`,
    },
    // misc
    experimentalMethods: `StarMask: 'starcoin._starmask' exposes non-standard, experimental methods. They may be removed or changed without warning.`,
  },
};
export default messages;
