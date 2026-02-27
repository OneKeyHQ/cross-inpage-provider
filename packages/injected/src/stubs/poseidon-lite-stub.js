// Stub for poseidon-lite — not needed in injected context.
// The real poseidon-lite (~608 KB) is a transitive dependency of @aptos-labs/ts-sdk,
// only used for Keyless Account ZK hashing which never runs in the provider layer.

const noop = () => {
  throw new Error('poseidon-lite is not available in injected context');
};

module.exports = {
  poseidon1: noop,
  poseidon2: noop,
  poseidon3: noop,
  poseidon4: noop,
  poseidon5: noop,
  poseidon6: noop,
  poseidon7: noop,
  poseidon8: noop,
  poseidon9: noop,
  poseidon10: noop,
  poseidon11: noop,
  poseidon12: noop,
  poseidon13: noop,
  poseidon14: noop,
  poseidon15: noop,
  poseidon16: noop,
};
