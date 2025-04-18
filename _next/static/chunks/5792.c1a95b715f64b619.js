"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5792],{6793:function(e,t,a){var n=a(85893);a(67294);var s=a(41664),i=a.n(s),o=a(51731);t.Z=e=>{let{dapps:t}=e;return(0,n.jsxs)(o.Zb,{children:[(0,n.jsx)(o.ll,{className:"text-xl",children:"Dapp Bookmarks"}),(0,n.jsx)(o.aY,{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",children:t.map((e,t)=>(0,n.jsx)("div",{className:"border p-2 rounded-lg shadow-sm hover:shadow-md",children:(0,n.jsx)(i(),{href:e.url,legacyBehavior:!0,children:(0,n.jsxs)("a",{className:"text-blue-500 hover:underline text-lg block",children:[e.name," →"]})})},t))})]})}},50615:function(e,t,a){a.d(t,{Z:function(){return InfoLayout}});var n=a(85893),s=a(51731);function InfoLayout(e){let{title:t,children:a}=e;return(0,n.jsxs)(s.Zb,{children:[t&&(0,n.jsx)(s.Ol,{className:"font-medium",children:t}),(0,n.jsx)(s.aY,{className:"flex flex-col flex-wrap gap-3 break-all",children:a})]})}},25792:function(e,t,a){a.r(t),a.d(t,{Example:function(){return Example},default:function(){return App}});var n=a(85893);let s=[{name:"Ton 官方 Demo",url:"https://ton-connect.github.io/demo-dapp-with-react-ui/"},{name:"TonStakers",url:"https://app.tonstakers.com"},{name:"GetGems",url:"https://getgems.io"},{name:"Ston Swap",url:"https://app.ston.fi"}];var i=a(99710),o=a(6793),r=a(82959),l=a(50615);let{Address:d,beginCell:c}=a(76104),{TonClient:A,JettonMaster:u}=a(93491),m=new A({endpoint:"https://toncenter.com/api/v2/jsonRPC"});async function getJettonWalletAddress(e,t){try{let a=d.parse(e),n=d.parse(t),s=m.open(u.create(a)),i=await s.getWalletAddress(n);if(!i)throw Error("Wallet address is empty");return console.log("Wallet Address:",i.toString()),i.toString()}catch(e){return console.error("Error in getJettonWalletAddress:",e),null}}var v={sendTransaction:e=>{let t="",a="",n="";try{let s=d.parse(null!=e?e:"");t=s.toString({bounceable:!0}),a=s.toString({bounceable:!1}),n=s.toRawString()}catch(e){}return[{id:"sendTransaction-native",name:"Native",value:JSON.stringify({messages:[{address:e,amount:"20000000"}]})},{id:"sendTransaction-native-two",name:"Native 2 Message",value:JSON.stringify({messages:[{address:e,amount:"20000000"},{address:e,amount:"20000000"}]})},{id:"sendTransaction-native-four",name:"Native 4 Message",value:JSON.stringify({messages:[{address:e,amount:"20000000"},{address:e,amount:"20000000"},{address:e,amount:"20000000"},{address:e,amount:"20000000"}]})},{id:"sendTransaction-native-validUntil-less-5-minutes",name:"Native validUntil less 5 minutes",value:JSON.stringify({validUntil:Math.floor(Date.now()/1e3)+180,messages:[{address:e,amount:"20000000"}]})},{id:"sendTransaction-native-validUntil-more-5-minutes",name:"Native validUntil more than 5 minutes",value:JSON.stringify({validUntil:Math.floor(Date.now()/1e3)+600,messages:[{address:e,amount:"20000000"}]})},{id:"sendTransaction-native-bounceable-address-type",name:"Native bounceable address type",value:JSON.stringify({messages:[{to:t,amount:"20000000"}]})},{id:"sendTransaction-native-non-bounceable-address-type",name:"Native non-bounceable address type",value:JSON.stringify({messages:[{to:a,amount:"20000000"}]})},{id:"sendTransaction-native-with-stateInit",name:"Native with stateInit",value:JSON.stringify({messages:[{address:e,amount:"20000000",stateInit:"te6cckEBBAEAOgACATQCAQAAART/APSkE/S88sgLAwBI0wHQ0wMBcbCRW+D6QDBwgBDIywVYzxYh+gLLagHPFsmAQPsAlxCarA=="}]})},{id:"sendTransaction-native-with-payload",name:"Native with payload",value:JSON.stringify({messages:[{address:e,amount:"20000000",payload:"te6ccsEBAQEADAAMABQAAAAASGVsbG8hCaTc/g=="}]})},{id:"sendTransaction-native-with-payload-and-stateInit",name:"Native with payload and stateInit",value:JSON.stringify({messages:[{address:e,amount:"5000000",stateInit:"te6cckEBBAEAOgACATQCAQAAART/APSkE/S88sgLAwBI0wHQ0wMBcbCRW+D6QDBwgBDIywVYzxYh+gLLagHPFsmAQPsAlxCarA==",payload:"te6ccsEBAQEADAAMABQAAAAASGVsbG8hCaTc/g=="}]})},{id:"sendTransaction-native-with-network",name:"Native with network",value:JSON.stringify({messages:[{address:e,amount:"20000000"}],network:"-239"})},{id:"sendTransaction-native-with-from-bounceable-address",name:"Native with from bounceable address",value:JSON.stringify({messages:[{address:e,amount:"20000000"}],from:t})},{id:"sendTransaction-native-with-from-non-bounceable-address",name:"Native with from non-bounceable address",value:JSON.stringify({messages:[{address:e,amount:"20000000"}],from:a})},{id:"sendTransaction-native-with-from-raw-address",name:"Native with from raw address",value:JSON.stringify({messages:[{address:e,amount:"20000000"}],from:n})}]},sendTransactionWithError:e=>{let t="";try{let a=d.parse(e);a.toString({bounceable:!0}),a.toString({bounceable:!1}),t=a.toRawString()}catch(e){}return[{id:"sendTransaction-native",name:"Empty Message",value:JSON.stringify({messages:[]})},{id:"sendTransaction-native-invalid-message-1",name:"1 message is valid and 1 is invalid",value:JSON.stringify({messages:[{address:e,amount:"20000000"},{address:e,amount:"50000000000000000000"}]})},{id:"sendTransaction-native-validUntil-outdated",name:"Native validUntil outdated",value:JSON.stringify({validUntil:Math.floor(Date.now()/1e3)-10,messages:[{address:e,amount:"20000000"}]})},{id:"sendTransaction-native-validUntil-NaN",name:"Native validUntil NaN",value:JSON.stringify({validUntil:NaN,messages:[{address:e,amount:"20000000"}]})},{id:"sendTransaction-native-validUntil-null",name:"Native validUntil null",value:JSON.stringify({validUntil:null,messages:[{address:e,amount:"20000000"}]})},{id:"sendTransaction-native-without-address",name:"Native without address",value:JSON.stringify({validUntil:null,messages:[{amount:"20000000"}]})},{id:"sendTransaction-native-raw-address-type",name:"Native raw address type",value:JSON.stringify({messages:[{address:t,amount:"20000000"}]})},{id:"sendTransaction-native-invalid-address",name:"Native invalid address",value:JSON.stringify({messages:[{address:null==e?void 0:e.replace("UQC","UC"),amount:"20000000"}]})},{id:"sendTransaction-native-max-amount",name:"Native invalid address",value:JSON.stringify({messages:[{address:e,amount:"500000000000000"}]})},{id:"sendTransaction-native-without-amount",name:"Native without amount",value:JSON.stringify({messages:[{address:e}]})},{id:"sendTransaction-native-amount-integer",name:"Native without amount",value:JSON.stringify({messages:[{address:e,amount:2e4}]})},{id:"sendTransaction-native-with-stateInit-error",name:"Native with stateInit error",value:JSON.stringify({messages:[{address:e,amount:"20000000",stateInit:"te7cckEBBAEAOgACATQCAQAAART/APSkE/S88sgLAwBI0wHQ0wMBcbCRW+D6QDBwgBDIywVYzxYh+gLLagHPFsmAQPsAlxCarA=="}]})},{id:"sendTransaction-native-with-payload-error",name:"Native with payload error",value:JSON.stringify({messages:[{address:e,amount:"20000000",payload:"te7ccsEBAQEADAAMABQAAAAASGVsbG8hCaTc/g=="}]})},{id:"sendTransaction-native-with-network-error",name:"Native with network error",value:JSON.stringify({messages:[{address:e,amount:"20000000"}],network:"-3"})},{id:"sendTransaction-native-with-network-integer-error",name:"Native with network integer error",value:JSON.stringify({messages:[{address:e,amount:"20000000"}],network:-239})},{id:"sendTransaction-native-with-from-address-error",name:"Native with from bounceable address error",value:JSON.stringify({messages:[{address:e,amount:"20000000"}],from:null==e?void 0:e.replace("UQC","UC")})},{id:"sendTransaction-native-with-from-address-not-match",name:"Native with from address not match",value:JSON.stringify({messages:[{address:e,amount:"20000000"}],from:"EQCKWpx7cNMpvmcN5ObM5lLUZHZRFKqYA4xmw9jOry0ZsF9M"})}]},sendTokenTransaction:async e=>{let t={SCALE:"EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",USDT:"EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"},a=await getJettonWalletAddress(t.SCALE,e),n=await getJettonWalletAddress(t.USDT,e);if(!a||!n)throw Error("无法获取代币钱包地址");return[{id:"sendToken-scale",name:"Send SCALE Token",value:JSON.stringify({validUntil:Math.floor(Date.now()/1e3)+360,messages:[{address:a,amount:"150000000",payload:c().storeUint(260734629,32).storeUint(0,64).storeCoins(1e10).storeAddress(d.parse(e)).storeAddress(d.parse(e)).storeCoins(0).storeBit(0).storeBit(0).storeRef(c().endCell()).endCell().toBoc().toString("base64"),stateInit:null}]})},{id:"sendToken-usdt",name:"Send USDT Token",value:JSON.stringify({validUntil:Math.floor(Date.now()/1e3)+360,messages:[{address:n,amount:"150000000",payload:c().storeUint(260734629,32).storeUint(0,64).storeCoins(1e5).storeAddress(d.parse(e)).storeAddress(d.parse(e)).storeCoins(0).storeBit(0).storeBit(0).storeRef(c().endCell()).endCell().toBoc().toString("base64"),stateInit:null}]})}]}};let g="".concat(window.location.pathname.replace(/\/+$/,""),":"),p=localStorage.setItem;localStorage.constructor.prototype.setItem=(e,t)=>p.apply(localStorage,[g+e,t]),localStorage.setItem=(e,t)=>p.apply(localStorage,[g+e,t]);let h=localStorage.getItem;localStorage.constructor.prototype.getItem=e=>h.apply(localStorage,[g+e]),localStorage.getItem=e=>h.apply(localStorage,[g+e]);let f=localStorage.removeItem;localStorage.constructor.prototype.removeItem=e=>f.apply(localStorage,[g+e]),localStorage.removeItem=e=>f.apply(localStorage,[g+e]);let y=new class{async generatePayload(){try{let e=await (await fetch("".concat(this.host,"/api/generate_payload"),{method:"POST"})).json();return{tonProof:e.payload}}catch(e){return null}}async checkProof(e,t){try{let a={address:t.address,network:t.chain,public_key:t.publicKey,proof:{...e,state_init:t.walletStateInit}},n=await (await fetch("".concat(this.host,"/api/check_proof"),{method:"POST",body:JSON.stringify(a)})).json();if(null==n?void 0:n.token)return localStorage.setItem(this.localStorageKey,n.token),this.accessToken=n.token,!0;return!1}catch(e){throw console.log("checkProof error:",e),e}}async getAccountInfo(e){let t=await (await fetch("".concat(this.host,"/api/get_account_info"),{headers:{Authorization:"Bearer ".concat(this.accessToken),"Content-Type":"application/json"}})).json();return t}reset(){this.accessToken=null,localStorage.removeItem(this.localStorageKey),this.generatePayload()}constructor(){this.localStorageKey="demo-api-access-token",this.host=window.location.origin,this.accessToken=null,this.refreshIntervalMs=54e4,this.accessToken=localStorage.getItem(this.localStorageKey),this.accessToken||this.generatePayload()}};var S=a(29791),w=a(96544),N=a(67294);let T="ton_scam_dapp_enable";function Example(){var e,t,a,d,c,A,u,m;let g=(0,r.MW)(),p=(0,r.MW)(!1),h=(0,r.EK)(),[f,x]=(0,r.dG)(),{toast:k}=(0,w.pm)(),[O,J]=(0,N.useState)([]);(0,N.useEffect)(()=>{!async function(){if(g){let e=await v.sendTokenTransaction(g);J(e)}}()},[g]);let E=localStorage.getItem(T);return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.P6,{}),(0,n.jsxs)(l.Z,{title:"Base Info",children:[(0,n.jsxs)("div",{children:[(0,n.jsx)("p",{children:"伪装欺诈模式"}),(0,n.jsx)(S.r,{checked:!!E,onCheckedChange:async e=>{f.connected&&(await (null==f?void 0:f.disconnect()),y.reset()),e?localStorage.setItem(T,"true"):localStorage.removeItem(T),window.location.reload()}})]}),g&&(0,n.jsxs)("p",{children:["userFriendlyAddress: ",g]}),p&&(0,n.jsxs)("p",{children:["rawAddress: ",p]}),(null==h?void 0:h.account)&&(0,n.jsxs)("p",{children:["Wallet Account PublicKey: ",null==h?void 0:h.account.publicKey]}),(null==h?void 0:h.account)&&(0,n.jsxs)("p",{children:["Wallet Account Chain: ",null==h?void 0:h.account.chain]}),(null==h?void 0:h.account)&&(0,n.jsxs)("p",{children:["Wallet Account WalletStateInit: ",null==h?void 0:h.account.walletStateInit]}),(null==h?void 0:null===(e=h.device)||void 0===e?void 0:e.appName)&&(0,n.jsxs)("p",{children:["Wallet AppName: ",null==h?void 0:null===(t=h.device)||void 0===t?void 0:t.appName]}),(null==h?void 0:null===(a=h.device)||void 0===a?void 0:a.appVersion)&&(0,n.jsxs)("p",{children:["Wallet appVersion: ",null==h?void 0:null===(d=h.device)||void 0===d?void 0:d.appVersion]}),(null==h?void 0:null===(c=h.device)||void 0===c?void 0:c.platform)&&(0,n.jsxs)("p",{children:["Wallet platform: ",null==h?void 0:null===(A=h.device)||void 0===A?void 0:A.platform]}),(null==h?void 0:null===(u=h.device)||void 0===u?void 0:u.features)&&(0,n.jsxs)("p",{children:["Wallet features: ",JSON.stringify(null==h?void 0:null===(m=h.device)||void 0===m?void 0:m.features)]})]}),(0,n.jsxs)(i.s,{title:"Sign Proof 按步骤作",children:[(0,n.jsx)(i.u,{title:"步骤1: Loading Proof Data",description:"步骤1: 断开连接，生成 Proof Payload",allowCallWithoutProvider:!0,onExecute:async e=>{f.connected&&(await (null==f?void 0:f.disconnect()),y.reset()),f.setConnectRequestParameters({state:"loading"});let t=await y.generatePayload();return t?f.setConnectRequestParameters({state:"ready",value:t}):f.setConnectRequestParameters(null),t}}),(0,n.jsx)(i.u,{title:"步骤2: 连接 Wallet",description:"步骤2: 连接 Wallet",allowCallWithoutProvider:!0,onExecute:async e=>(f.openModal(),Promise.resolve("success")),onValidate:async(e,t)=>{var a;if((null===(a=h.connectItems)||void 0===a?void 0:a.tonProof)&&"proof"in h.connectItems.tonProof)try{let e=await y.checkProof(h.connectItems.tonProof.proof,h.account);return e||k({variant:"destructive",title:"Proof 签名验证失败"}),e&&E&&k({title:"当前处于伪装欺诈模式，不应该成功连接账户",variant:"destructive"}),JSON.stringify({success:e,proof:h.connectItems.tonProof.proof})}catch(e){return JSON.stringify({success:!1,errorMessage:null==e?void 0:e.message,proof:null})}return Promise.resolve("error")}}),(0,n.jsx)(i.u,{title:"步骤3: 测试获取 Account Info",description:"步骤3: 测试获取 Account Info",allowCallWithoutProvider:!!h,onExecute:async e=>{let t=await y.getAccountInfo(h.account);return t}})]}),(0,n.jsxs)(i.s,{title:"Send Transaction",children:[(0,n.jsx)(i.u,{title:"sendTransaction",description:"转账普通 Native",allowCallWithoutProvider:!!g,presupposeParams:v.sendTransaction(g||""),onExecute:async e=>{let t=await (null==f?void 0:f.sendTransaction(JSON.parse(e)));return JSON.stringify(t)}}),(0,n.jsx)(i.u,{title:"sendTransaction",description:"错误例子测试，这个用例所有请求都应该报错",allowCallWithoutProvider:!!g,presupposeParams:v.sendTransactionWithError(g||""),onExecute:async e=>{let t=await (null==f?void 0:f.sendTransaction(JSON.parse(e)));return JSON.stringify(t)}})]}),(0,n.jsx)(i.s,{title:"Send Transaction",children:(0,n.jsx)(i.u,{title:"Send Jetton",description:"代币转账",allowCallWithoutProvider:!!g,presupposeParams:O,onExecute:async e=>{let t=await (null==f?void 0:f.sendTransaction(JSON.parse(e)));return JSON.stringify(t)}})}),(0,n.jsxs)(i.s,{title:"Exotic Cell Transactions",children:[(0,n.jsx)(i.u,{title:"Merkle Proof Transaction",allowCallWithoutProvider:!!g,presupposeParams:[{id:"merkleProof",name:"Merkle Proof Transaction",value:JSON.stringify({validUntil:Date.now()+9e5,messages:[{address:g||"",amount:"100000",payload:{type:"merkle-proof",hash:"te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",depth:32,merkleProof:"te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="}}]})},{id:"overstringCell",name:"Overstring Cell Transaction",value:JSON.stringify({validUntil:Date.now()+9e5,messages:[{address:g||"",amount:"100000",payload:{type:"overstring",data:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."}}]})}],onExecute:async e=>{try{let t=await (null==f?void 0:f.sendTransaction(JSON.parse(e)));if(!t)return JSON.stringify({success:!0,message:"Transaction sent successfully"});return JSON.stringify(t)}catch(e){var t;if(null==e?void 0:null===(t=e.message)||void 0===t?void 0:t.includes("[object Object]"))return JSON.stringify({success:!0,message:"Transaction likely succeeded"});return JSON.stringify({error:e.message})}}}),(0,n.jsx)(i.u,{title:"Merkle Update Transaction",allowCallWithoutProvider:!!g,presupposeParams:[{id:"merkleUpdate",name:"Merkle Update Transaction",value:JSON.stringify({validUntil:Date.now()+9e5,messages:[{address:g||"",amount:"100000",payload:{type:"merkle-update",oldHash:"te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",newHash:"te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",depth:32}}]})},{id:"dictionaryCell",name:"Dictionary Cell Transaction",value:JSON.stringify({validUntil:Date.now()+9e5,messages:[{address:g||"",amount:"100000",payload:{type:"dictionary",keySize:256,data:{0:"te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",1:"te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="}}}]})}],onExecute:async e=>{try{let t=await (null==f?void 0:f.sendTransaction(JSON.parse(e)));return JSON.stringify(t)}catch(e){return JSON.stringify({error:e.message})}}})]}),(0,n.jsx)(o.Z,{dapps:s})]})}function App(){let e=localStorage.getItem(T);return(0,n.jsx)(n.Fragment,{children:(0,n.jsx)(r.LD,{manifestUrl:e?"https://dapp-example.onekeytest.com/scam-tonconnect-manifest.json":"https://dapp-example.onekeytest.com/tonconnect-manifest.json",walletsListConfiguration:{includeWallets:[{appName:"onekey",name:"OneKey",imageUrl:"https://uni.onekey-asset.com/static/logo/onekey-x288.png",aboutUrl:"https://onekey.so",jsBridgeKey:"onekeyTonWallet",platforms:["chrome"]}]},children:(0,n.jsx)(Example,{})})})}}}]);
//# sourceMappingURL=5792.c1a95b715f64b619.js.map