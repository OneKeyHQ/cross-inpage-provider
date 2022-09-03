import React from 'react';
import Head from 'next/head';

import { useExecutor } from './executor';

import styles from './styles.module.scss';

export default function STCExample() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  useExecutor();

  return (
    <main className={`${styles.main} container-fluid`}>
      <Head>
        <title>Starcoin E2E Test Dapp</title>

        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header>
      <div id="logo-container">
        <img src="/starcoin-logo.svg" />
        <h1 id="logo-text" className="text-center">
        Starcoin E2E Test Dapp
        </h1>
      </div>
    </header>
    <section>
      <h3 className="card-title">
        Status
      </h3>

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
            SelectedAccount: <span id="accounts" />
          </p>
        </div>
      </div>
    </section>

    <section>
      <div className="row d-flex justify-content-center">
        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">
                Basic Actions
              </h4>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="connectButton" disabled>
                Connect
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="getAccounts" disabled>
                Get Selected Account
              </button>

              <p className="info-text alert alert-secondary">
                SelectedAccount: <span id="getAccountsResult" />
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
              <h4 className="card-title">
                Permissions Actions
              </h4>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="requestPermissions" disabled>
                Request Permissions
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="getPermissions" disabled>
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
        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4 className="card-title">
                Send STC
              </h4>
              <h5 className="card-title">
                To
              </h5>
              <div className="form-outline mb-3">
                <input id="toAccountInput" type="text" className="form-control form-control-lg"
                  defaultValue="0x46ecE7c1e39fb6943059565E2621b312" />
              </div>

              <h5 className="card-title">
                Amount of STC
              </h5>
              <div className="form-outline mb-3">
                <input id="amountInput" type="text" className="form-control form-control-lg" defaultValue="0.001" />
              </div>

              <h5 className="card-title">
                Transaction Expired Seconds(default 30 minutes)
              </h5>
              <div className="form-outline mb-3">
                <input id="expiredSecsInput" type="text" className="form-control form-control-lg" defaultValue="1800" />
              </div>
              <button className="btn btn-primary btn-lg btn-block mb-3" id="sendButton" disabled>
                Send
              </button>
              <hr />
              <h4 className="card-title">
                Contract Function
              </h4>
              <button className="btn btn-primary btn-lg btn-block mb-3" id="callContractButton" disabled>
                0x1::TransferScripts::peer_to_peer_v2
              </button>

              <p className="info-text alert alert-secondary">
                Contract Status: <span id="contractStatus2">Not clicked</span>
              </p>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4 className="card-title">
                Contract blob hex
              </h4>
              <div className="form-outline mb-3">
                <textarea id="contractPayloadhex" className="form-control" rows={5} placeholder="search `payloadInHex` in index.js, generate your payloadInHex and paste it here" />
              </div>
              <button className="btn btn-primary btn-lg btn-block mb-3" id="deployButton" disabled>
                Deploy Contract using blob hex
              </button>
              <hr />
              <h4 className="card-title">
                Contract Function
              </h4>
              <button className="btn btn-primary btn-lg btn-block mb-3" id="tokenAddressButton" disabled>
                address::ABC::token_address
              </button>

              <p className="info-text alert alert-secondary">
                Contract Status: <span id="contractStatus">Not clicked</span>
              </p>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4 className="card-title">
                Call Contract function
              </h4>
              <h5 className="card-title">
                Module ID/Function ID
              </h5>
              <div className="form-outline mb-3">
                <input id="moduleIdInput" type="text" className="form-control form-control-lg"
                  defaultValue="0x1::NFTGalleryScripts" />
              </div>
              <button className="btn btn-primary btn-lg btn-block mb-3" id="resolveModuleButton">
                Resolve Functions
              </button>

              <h4 className="card-title">
                Module Functions:
              </h4>

              <p id="resolveResultView" className="info-text alert alert-warning">
                Result: <span className="tips" />
              </p>

              <div id="moduleFunctionsDiv" className="list-group" />

            </div>
          </div>
        </div>

      </div>
    </section>
    <section>
      <div className="row">
        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4>
                Personal Sign
              </h4>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="personalSign" disabled>
                Sign
              </button>

              <p className="info-text alert alert-warning">
                Result: <span id="personalSignResult" />
              </p>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="personalSignVerify" disabled>
                Verify
              </button>

              <p className="info-text alert alert-warning">
                @starcoin/starcoin recovery result:
                <span id="personalSignRecoverResult" />
              </p>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4 className="card-title">
                Encrypt / Decrypt
              </h4>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="getEncryptionKeyButton" disabled>
                Get Encryption Key
              </button>

              <hr />

              <div id="encrypt-message-form">
                <input className="form-control" type="text" placeholder="Message to encrypt" id="encryptMessageInput" />

                <button className="btn btn-primary btn-lg btn-block mb-3" id="encryptButton" disabled>
                  Encrypt
                </button>
              </div>

              <hr />

              <button className="btn btn-primary btn-lg btn-block mb-3" id="decryptButton" disabled>
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

        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4>
                Cross Chain
              </h4>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="crossChainLockWithSTC">
                Lock With STC
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="crossChainGetLockTreasury">
                Get Lock Treasury
              </button>

              <p className="info-text alert alert-warning">
                Result: <span id="crossChainResult" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section>
      <div className="row">
        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4>
                Airdrop
              </h4>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="claimAirdrop">
                Claim
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="checkClaimedAirdrop">
                Check Claimed
              </button>

              <p className="info-text alert alert-warning">
                Result: <span id="claimAirdropResult" />
              </p>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4>
                NFT
              </h4>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="mintWithImage">
                mint with image
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="mintWithImageData">
                mint with image data
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="isAcceptNFT">
                check is accept NFT
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="acceptNFT">
                accept NFT
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="transferNFT">
                transfer NFT
              </button>

              <p className="info-text alert alert-warning">
                Result: <span id="nftResult" />
              </p>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12 d-flex align-items-stretch">
          <div className="card full-width">
            <div className="card-body">
              <h4>
                AutoAcceptToken
              </h4>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="isAutoAcceptToken">
                Check Status
              </button>

              <h5 className="card-title">
                AddGasBufferMultiplier(default 1.5)
              </h5>
              <div className="form-outline mb-3">
                <input id="addGasBufferMultiplier" type="text" className="form-control form-control-lg" defaultValue="1.5" />
              </div>
              <button className="btn btn-primary btn-lg btn-block mb-3" id="autoAcceptTokenOn">
                Turn On
              </button>

              <button className="btn btn-primary btn-lg btn-block mb-3" id="autoAcceptTokenOff">
                Turn Offf
              </button>

              <p className="info-text alert alert-warning">
                Result: <span id="autoAcceptTokenResult" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    </main>
  );
}
