// Stub for @alephium/web3 (~584 KB)
// OnekeyAlphProvider extends InteractiveSignerProvider but overrides all methods
// via bridge. Only the class hierarchy is needed so `extends` works at runtime.
//
// @alephium/get-extension-wallet also extends InteractiveSignerProvider and
// calls super.enable(), which normally calls this.unsafeEnable() + validateAccount().
// Since the App-side provider already validates accounts, we skip the heavy
// address validation (which pulls in crypto/blakejs/etc).

class SignerProvider {
  async getSelectedAccount() {
    return this.unsafeGetSelectedAccount();
  }
}

class InteractiveSignerProvider extends SignerProvider {
  async enable(opt) {
    return this.unsafeEnable(opt);
  }
}

module.exports = { SignerProvider, InteractiveSignerProvider };
