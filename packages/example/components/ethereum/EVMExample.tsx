import React from 'react';
import Head from 'next/head';

import { useExecutor } from './executor';

import styles from './styles.module.scss';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';

export default function EVMExample() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  useExecutor();

  return (
    <main className={`${styles.main} container-fluid`}>
      <Head>
        <title>Ethereum E2E Test Dapp</title>

        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header>
        <div id="logo-container">
          <img id="logo" src="/logo.png" />
          <h1 id="logo-text" className="text-center">
            Ethereum E2E Test Dapp
          </h1>
        </div>
      </header>
      <section>
        <h3 className="card-title">Status</h3>

        <div id="warning" className="row justify-content-center error-div">
          <div
            className="
            error-message
            justify-content-center
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
          "
          >
            <div className="error-message-text">You are on the Ethereum Mainnet.</div>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <p className="info-text alert alert-primary">
              Network: <span id="network" />
            </p>
          </div>

          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <p className="info-text alert alert-secondary">
              ChainId: <span id="chainId" />
            </p>
          </div>

          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <p className="info-text alert alert-success">
              Accounts: <span id="accounts" />
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="row d-flex justify-content-center">
          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Basic Actions</h4>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="connectButton"
                  disabled
                >
                  Connect
                </button>

                <button className="btn btn-primary btn-lg btn-block mb-3" id="getAccounts">
                  eth_accounts
                </button>

                <p className="info-text alert alert-secondary">
                  eth_accounts result: <span id="getAccountsResult" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="row d-flex justify-content-center">
          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Permissions Actions</h4>

                <button className="btn btn-primary btn-lg btn-block mb-3" id="requestPermissions">
                  Request Permissions
                </button>

                <button className="btn btn-primary btn-lg btn-block mb-3" id="getPermissions">
                  Get Permissions
                </button>

                <p className="info-text alert alert-secondary">
                  Permissions result: <span id="permissionsResult" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="row">
          <div
            className="
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
            d-flex
            align-items-stretch
          "
          >
            <div className="card full-width">
              <div className="card-body">
                <h4 className="card-title">Send Eth</h4>

                <button className="btn btn-primary btn-lg btn-block mb-3" id="sendButton" disabled>
                  Send
                </button>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="sendEIP1559Button"
                  disabled
                  hidden
                >
                  Send EIP 1559 Transaction
                </button>
                <hr />
                <h4 className="card-title">Contract</h4>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="deployButton"
                  disabled
                >
                  Deploy Contract
                </button>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="depositButton"
                  disabled
                >
                  Deposit
                </button>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="withdrawButton"
                  disabled
                >
                  Withdraw
                </button>

                <p className="info-text alert alert-secondary">
                  Contract Status: <span id="contractStatus">Not clicked</span>
                </p>
                <hr />
                <h4 className="card-title">Failing contract</h4>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="deployFailingButton"
                  disabled
                >
                  Deploy Failing Contract
                </button>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="sendFailingButton"
                  disabled
                >
                  Send Failing Transaction
                </button>

                <p className="info-text alert alert-secondary">
                  Failing Contract Status:
                  <span id="failingContractStatus">Not clicked</span>
                </p>
              </div>
            </div>
          </div>

          <div
            className="
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
            d-flex
            align-items-stretch
          "
          >
            <div className="card full-width">
              <div className="card-body">
                <h4 className="card-title">Send Tokens</h4>

                <p className="info-text alert alert-success">
                  Token: <span id="tokenAddress" />
                </p>

                <button className="btn btn-primary btn-lg btn-block mb-3" id="createToken" disabled>
                  Create Token
                </button>

                <button className="btn btn-primary btn-lg btn-block mb-3" id="watchAsset" disabled>
                  Add Token to Wallet
                </button>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="transferTokens"
                  disabled
                >
                  Transfer Tokens
                </button>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="approveTokens"
                  disabled
                >
                  Approve Tokens
                </button>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="transferTokensWithoutGas"
                  disabled
                >
                  Transfer Tokens Without Gas
                </button>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="approveTokensWithoutGas"
                  disabled
                >
                  Approve Tokens Without Gas
                </button>
              </div>
            </div>
          </div>
          <div
            className="
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
            d-flex
            align-items-stretch
          "
          >
            <div className="card full-width">
              <div className="card-body">
                <h4 className="card-title">Collectibles</h4>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="deployCollectiblesButton"
                  disabled
                >
                  Deploy
                </button>

                <div className="form-group">
                  <label>Amount</label>
                  <input
                    className="form-control"
                    type="number"
                    id="mintAmountInput"
                    defaultValue="1"
                  />
                </div>

                <div className="form-group">
                  <button
                    className="btn btn-primary btn-lg btn-block mb-3"
                    id="mintButton"
                    disabled
                  >
                    Mint
                  </button>
                </div>

                <p className="info-text alert alert-secondary">
                  Collectibles: <span id="collectiblesStatus" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="row d-flex justify-content-center">
          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Encrypt / Decrypt</h4>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="getEncryptionKeyButton"
                  disabled
                >
                  Get Encryption Key
                </button>

                <hr />

                <div id="encrypt-message-form">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Message to encrypt"
                    id="encryptMessageInput"
                  />

                  <button
                    className="btn btn-primary btn-lg btn-block mb-3"
                    id="encryptButton"
                    disabled
                  >
                    Encrypt
                  </button>
                </div>

                <hr />

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="decryptButton"
                  disabled
                >
                  Decrypt
                </button>

                <p className="info-text alert alert-secondary">
                  Encryption key: <span id="encryptionKeyDisplay" />
                </p>

                <p className="info-text text-truncate alert alert-secondary">
                  Ciphertext: <span id="ciphertextDisplay" />
                </p>

                <p className="info-text alert alert-secondary">
                  Cleartext: <span id="cleartextDisplay" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="row">
          <div
            className="
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
            d-flex
            align-items-stretch
          "
          >
            <div className="card full-width">
              <div className="card-body">
                <h4>Eth Sign</h4>

                <button className="btn btn-primary btn-lg btn-block mb-3" id="ethSign" disabled>
                  Sign
                </button>

                <p className="info-text alert alert-warning">
                  Result: <span id="ethSignResult" />
                </p>
              </div>
            </div>
          </div>
          <div
            className="
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
            d-flex
            align-items-stretch
          "
          >
            <div className="card full-width">
              <div className="card-body">
                <h4>Personal Sign</h4>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="personalSign"
                  disabled
                >
                  Sign
                </button>

                <p className="info-text alert alert-warning">
                  Result: <span id="personalSignResult" />
                </p>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="personalSignVerify"
                  disabled
                >
                  Verify
                </button>

                <p className="info-text alert alert-warning">
                  eth-sig-util recovery result:
                  <span id="personalSignVerifySigUtilResult" />
                </p>
                <p className="info-text alert alert-warning">
                  personal_ecRecover result:
                  <span id="personalSignVerifyECRecoverResult" />
                </p>
              </div>
            </div>
          </div>
          <div
            className="
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
            d-flex
            align-items-stretch
          "
          >
            <div className="card full-width">
              <div className="card-body">
                <h4>Sign Typed Data</h4>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="signTypedData"
                  disabled
                >
                  Sign
                </button>

                <p className="info-text alert alert-warning">
                  Result: <span id="signTypedDataResult" />
                </p>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="signTypedDataVerify"
                  disabled
                >
                  Verify
                </button>

                <p className="info-text alert alert-warning">
                  Recovery result:
                  <span id="signTypedDataVerifyResult" />
                </p>
              </div>
            </div>
          </div>
          <div
            className="
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
            d-flex
            align-items-stretch
          "
          >
            <div className="card full-width">
              <div className="card-body">
                <h4>Sign Typed Data V3</h4>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="signTypedDataV3"
                  disabled
                >
                  Sign
                </button>

                <p className="info-text alert alert-warning">
                  Result:
                  <span id="signTypedDataV3Result" />
                </p>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="signTypedDataV3Verify"
                  disabled
                >
                  Verify
                </button>

                <p className="info-text alert alert-warning">
                  Recovery result:
                  <span id="signTypedDataV3VerifyResult" />
                </p>
              </div>
            </div>
          </div>
          <div
            className="
            col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12
            d-flex
            align-items-stretch
          "
          >
            <div className="card full-width">
              <div className="card-body">
                <h4>Sign Typed Data V4</h4>

                <div className="form-group">
                  <label>Chain ID</label>
                  <input className="form-control" type="text" id="signTypedDataV4ChainId" />
                </div>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="signTypedDataV4"
                  disabled
                >
                  Sign
                </button>

                <p className="info-text alert alert-warning">
                  Result:
                  <span id="signTypedDataV4Result" />
                </p>

                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="signTypedDataV4Verify"
                  disabled
                >
                  Verify
                </button>

                <p className="info-text alert alert-warning">
                  Recovery result:
                  <span id="signTypedDataV4VerifyResult" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="row d-flex justify-content-center">
          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Ethereum Chain Interactions</h4>
                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="addEthereumChain"
                  disabled
                >
                  Add xDAI Chain
                </button>
                <button
                  className="btn btn-primary btn-lg btn-block mb-3"
                  id="switchEthereumChain"
                  disabled
                >
                  Switch to xDAI Chain
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="row d-flex justify-content-center">
          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Send form</h4>
                <div className="form-group">
                  <label>From</label>
                  <input className="form-control" type="text" id="fromInput" />
                </div>
                <div className="form-group">
                  <label>To</label>
                  <input className="form-control" type="text" id="toInput" />
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input className="form-control" type="text" id="amountInput" />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="browser-default custom-select" id="typeInput">
                    <option value="0x0">0x0</option>
                    <option value="0x2">0x2</option>
                  </select>
                </div>
                <div className="form-group" id="gasPriceDiv">
                  <label>Gas Price</label>
                  <input className="form-control" type="text" id="gasInput" />
                </div>
                <div className="form-group" id="maxFeeDiv">
                  <label>Max Fee</label>
                  <input className="form-control" type="text" id="maxFeeInput" />
                </div>
                <div className="form-group" id="maxPriorityDiv">
                  <label>Max Priority Fee</label>
                  <input className="form-control" type="text" id="maxPriorityFeeInput" />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input className="form-control" type="text" id="dataInput" />
                </div>
                <button className="btn btn-primary btn-lg btn-block mb-3" id="submitForm">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <DAppList dapps={dapps} />
    </main>
  );
}
