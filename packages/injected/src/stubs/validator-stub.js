// Stub for 'validator' (~221 KB): tronweb only uses validator.isURL()
module.exports = {
  isURL: function (url, options) {
    if (typeof url !== 'string') return false;
    try {
      var u = new URL(url);
      var protocols = (options && options.protocols) || ['http', 'https'];
      return protocols.some(function (p) { return u.protocol === p + ':'; });
    } catch (e) {
      return false;
    }
  },
};
