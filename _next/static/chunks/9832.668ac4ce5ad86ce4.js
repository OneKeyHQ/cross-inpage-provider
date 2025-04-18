(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9832],{6793:function(e,t,n){"use strict";var a=n(85893);n(67294);var s=n(41664),o=n.n(s),r=n(51731);t.Z=e=>{let{dapps:t}=e;return(0,a.jsxs)(r.Zb,{children:[(0,a.jsx)(r.ll,{className:"text-xl",children:"Dapp Bookmarks"}),(0,a.jsx)(r.aY,{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",children:t.map((e,t)=>(0,a.jsx)("div",{className:"border p-2 rounded-lg shadow-sm hover:shadow-md",children:(0,a.jsx)(o(),{href:e.url,legacyBehavior:!0,children:(0,a.jsxs)("a",{className:"text-blue-500 hover:underline text-lg block",children:[e.name," →"]})})},t))})]})}},75122:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return Example}});var a=n(85893);let s=[{name:"Scdo Demo",url:"https://demo.scdo.org/"}];var o=n(6912),r=n(67294),i=n(27361),l=n.n(i),c=n(99710),d=n(23225),u=n(6793),m={signTransaction:(e,t)=>[{id:"signTransaction",name:"signTransaction",value:JSON.stringify({accountNonce:0,amount:10,from:e,gasLimit:21e3,gasPrice:1,payload:"",to:t})}],sendTransaction:(e,t)=>[{id:"sendTransaction-native",name:"Native",value:JSON.stringify({amount:10,from:e,to:t})},{id:"sendTransaction-erc20-contract",name:"ERC20 Token",value:JSON.stringify({from:e,payload:"0xa9059cbb0000000000000000000000000118a02f993fc7a4348fd36b7f7a596948f02b310000000000000000000000000000000000000000000000000000000000002710",to:"1S015daca201b66f96f74b4230916f9db8db0c0002"})},{id:"sendTransaction-big-payload",name:"Big Payload",value:JSON.stringify({from:e,payload:"0x".concat("010203040506070809".repeat(600)),to:e})}],estimateGas:(e,t)=>[{id:"sendTransaction-native",name:"Native",value:JSON.stringify({accountNonce:0,amount:98e8,from:e,gasLimit:21e3,gasPrice:1,payload:"",signature:{Sig:"CCQnmyI2Bf85eqFHJ8uFGiZFk2DVH9W5R3Q2GXJ648RcVrtIt4guxZ/Z7c4sm5tWjKp5jqw2K9DdnOiTRXPkTgE="},to:t})}]},p=n(40293),g=n(87066);let ScdoNodeClient=class ScdoNodeClient{getUrl(e){var t;let n=+e.slice(0,1)-1;return null!==(t=["https://mainnet.scdo.org:8137","https://mainnet.scdo.org:8138","https://mainnet.scdo.org:8139","https://mainnet.scdo.org:8136"][n])&&void 0!==t?t:"https://mainnet.scdo.org:8137"}async getNonce(e){var t;let n=await this.axios.post(this.getUrl(e),{jsonrpc:"2.0",method:"scdo_getAccountNonce",params:[e,"",-1],id:1},{headers:{"Content-Type":"application/json"}});return 404===n.status?null:null!==(t=n.data.result)&&void 0!==t?t:0}async pushTransaction(e,t){try{let n=await fetch(this.getUrl(e),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"scdo_addTx",params:[t],id:1})});if(!n.ok)return console.error("RPC 请求失败:",n.status,n.statusText),!1;let a=await n.json();console.log("RPC 响应:",a);let{error:s}=a;if(s){if(-32e3===s.code&&"Tx already exists"===s.message)return console.log("交易已存在于网络中"),!0;return console.error("RPC 错误:",s),!1}return!0}catch(e){return console.error("推送交易失败:",e),!1}}constructor(e="https://mainnet.scdo.org:8137"){this.rpcUrl=e,this.axios=g.default.create({timeout:3e4})}};var f=n(70794),x=n(96544),h=n(84243);function Example(){var e,t,n,i,g,v,j,y;let N=(0,r.useRef)([{uuid:"injected",name:"Injected Wallet",inject:"scdo"},{uuid:"injected-onekey",name:"Injected OneKey",inject:"$onekey.scdo"}]),w=new ScdoNodeClient,{account:T,provider:b}=(0,d.O)(),{toast:k}=(0,x.pm)(),onConnectWallet=async e=>{var t;let n=null===(t=N.current)||void 0===t?void 0:t.find(t=>t.uuid===e.id);if(!n)return Promise.reject("Wallet not found");let a=l()(window,n.inject),[s]=await (null==a?void 0:a.request({method:"scdo_requestAccounts"}));return{provider:a,address:s}},getTokenTransferFrom=function(e){var t;let n=arguments.length>1&&void 0!==arguments[1]&&arguments[1],s=[];return s.push({name:" SCDO TEST0",address:"1S01f0daaf7a59fb5eb90256112bf5d080ff290022"}),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(p.I,{label:"收款地址",type:"text",name:"toAddress",defaultValue:null!==(t=null==T?void 0:T.address)&&void 0!==t?t:""}),(0,a.jsx)(p.I,{label:"金额",type:"number",name:"amount",defaultValue:"10000"}),n&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("input",{id:"max_approve",name:"maxApprove",type:"checkbox"}),(0,a.jsx)("label",{htmlFor:"max_approve",children:"无限授权"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("input",{id:"mock_uniswap",name:"mockUniSwap",type:"checkbox"}),(0,a.jsx)("label",{htmlFor:"mock_uniswap",children:"模拟 UniSwap（不传 Value）"})]})]}),(0,a.jsxs)("select",{name:"tokenAddress",className:"select",children:[(0,a.jsx)("option",{selected:!0,value:void 0,children:"选择 Token"}),s.map(e=>(0,a.jsx)("option",{value:e.address,children:e.name}))]})]})},tokenTransferFromToTx=async e=>{var t,n;let a=null!==(t=null==T?void 0:T.address)&&void 0!==t?t:"",s=null!==(n=e.toAddress)&&void 0!==n?n:a,o=e.amount,r=e.tokenAddress;if(!o)return"Amount is required";let i=await w.getNonce(a);if(null===i)throw Error("获取 nonce 失败");if(console.log("使用 nonce:",i),r&&"SCDO"!==r){let e=function(e){let{address:t,amount:n}=e,a=h.$.encode(["address","uint256"],["0x".concat(t.slice(2)),n]);return"".concat("0xa9059cbb").concat(a.slice(2))}({address:s,amount:o});return JSON.stringify({accountNonce:i,from:a,to:r,amount:0,gasLimit:1e5,gasPrice:1,payload:e})}return JSON.stringify({accountNonce:i,from:a,to:s,amount:new f.Z(o).toNumber(),gasLimit:21e3,gasPrice:1,payload:""})};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(o.Z,{fetchWallets:()=>Promise.resolve(N.current.map(e=>({id:e.uuid,name:e.name}))),onConnect:onConnectWallet,onDisconnect:async()=>{await (null==b?void 0:b.request({method:"scdo_disconnect"}))}}),(0,a.jsxs)(c.s,{title:"Basics",children:[(0,a.jsx)(c.u,{title:"scdo_requestAccounts",description:"请求链接账户",onExecute:async e=>await (null==b?void 0:b.request({method:"scdo_requestAccounts"}))}),(0,a.jsx)(c.u,{title:"scdo_getAccounts",description:"获取账户",onExecute:async e=>await (null==b?void 0:b.request({method:"scdo_getAccounts"}))}),(0,a.jsx)(c.u,{title:"scdo_getBalance",description:"获取账户余额",presupposeParams:[{id:"scdo_getBalance",name:"getBalance",value:null==T?void 0:T.address}],onExecute:async e=>{let t=await (null==b?void 0:b.request({method:"scdo_getBalance",params:[null!=e?e:"","",-1]}));return console.log("scdo_getBalance",t),t}})]}),(0,a.jsx)(c.s,{title:"Sign Message",children:(0,a.jsx)(c.u,{title:"scdo_signMessage",description:"签署消息",onExecute:async e=>await (null==b?void 0:b.request({method:"scdo_signMessage",params:[e]})),onValidate:async(e,t)=>await (null==b?void 0:b.request({method:"scdo_ecRecover",params:[e,t]}))})}),(0,a.jsxs)(c.s,{title:"Sign Transaction",children:[(0,a.jsx)(c.u,{title:"scdo_estimateGas",description:"估算交易费用",presupposeParams:m.signTransaction(null!==(e=null==T?void 0:T.address)&&void 0!==e?e:"",null!==(t=null==T?void 0:T.address)&&void 0!==t?t:""),generateRequestFrom:()=>getTokenTransferFrom(null==T?void 0:T.chainId),onGenerateRequest:tokenTransferFromToTx,onExecute:async e=>{let t=JSON.parse(e);return await (null==b?void 0:b.request({method:"scdo_signTransaction",params:[t]}))},onValidate:async(e,t)=>{try{console.log("签名交易请求:",e),console.log("签名交易响应:",t);let n=JSON.parse(t);return await (null==b?void 0:b.request({method:"scdo_estimateGas",params:[{accountNonce:n.Data.AccountNonce,amount:n.Data.Amount,from:n.Data.From,to:n.Data.To,gasLimit:n.Data.GasLimit,gasPrice:n.Data.GasPrice,hash:n.Hash,payload:n.Data.Payload,signature:{Sig:n.Signature.Sig}}]}))}catch(e){return console.error("估算 Gas 失败:",e),k({title:"估算 Gas 失败",description:e instanceof Error?e.message:"未知错误",variant:"destructive"}),!1}}}),(0,a.jsx)(c.u,{title:"scdo_signTransaction",description:"签署交易",presupposeParams:m.signTransaction(null!==(n=null==T?void 0:T.address)&&void 0!==n?n:"",null!==(i=null==T?void 0:T.address)&&void 0!==i?i:""),onExecute:async e=>{let t=JSON.parse(e);return await (null==b?void 0:b.request({method:"scdo_signTransaction",params:[t]}))},onValidate:async(e,t)=>{try{var n;console.log("签名交易请求:",e),console.log("签名交易响应:",t);let a=JSON.parse(t);if(console.log("解析后的交易数据:",a),!a.Data||!a.Hash||!(null===(n=a.Signature)||void 0===n?void 0:n.Sig))throw Error("交易数据格式不正确");for(let e of["From","To","Amount","AccountNonce","GasPrice","GasLimit"])if(void 0===a.Data[e])throw Error("缺少必要字段: ".concat(e));let s=await w.getNonce(a.Data.From);if(console.log("当前 nonce:",s,"交易 nonce:",a.Data.AccountNonce),a.Data.AccountNonce<s)throw Error("Nonce 值过低，当前 nonce: ".concat(s));let o=await w.pushTransaction(a.Data.From,a);if(console.log("广播交易结果:",o),!o)throw Error("交易广播失败，请检查：\n1. 账户余额是否充足\n2. Gas 费用是否足够\n3. Nonce 值是否正确");return k({title:"交易广播成功",description:"交易哈希: ".concat(l()(a,"Hash",""))}),!0}catch(e){return console.error("验证交易失败:",e),k({title:"验证交易失败",description:e instanceof Error?e.message:"未知错误",variant:"destructive"}),!1}},generateRequestFrom:()=>getTokenTransferFrom(null==T?void 0:T.chainId),onGenerateRequest:tokenTransferFromToTx}),(0,a.jsx)(c.u,{title:"scdo_sendTransaction",description:"发送交易，动态生成",presupposeParams:m.signTransaction(null!==(g=null==T?void 0:T.address)&&void 0!==g?g:"",null!==(v=null==T?void 0:T.address)&&void 0!==v?v:""),generateRequestFrom:()=>getTokenTransferFrom(null==T?void 0:T.chainId),onGenerateRequest:tokenTransferFromToTx,onExecute:async e=>{let t=JSON.parse(e);return await (null==b?void 0:b.request({method:"scdo_sendTransaction",params:[t]}))}}),(0,a.jsx)(c.u,{title:"scdo_sendTransaction",description:"发送交易，静态参数",presupposeParams:m.sendTransaction(null!==(j=null==T?void 0:T.address)&&void 0!==j?j:"",null!==(y=null==T?void 0:T.address)&&void 0!==y?y:""),onExecute:async e=>{let t=JSON.parse(e);return await (null==b?void 0:b.request({method:"scdo_sendTransaction",params:[t]}))}})]}),(0,a.jsx)(u.Z,{dapps:s})]})}},6912:function(e,t,n){"use strict";n.d(t,{Z:function(){return ConnectButton}});var a=n(85893),s=n(67294),o=n(9663),r=n(51731),i=n(53617),l=n(23225),c=n(96544),d=n(27361),u=n.n(d),m=n(78299);let p={address:"地址",publicKey:"公钥",chainId:"网络"};function ConnectButton(e){let{fetchWallets:t,onConnect:n,onDisconnect:d}=e,{settings:g}=(0,m.r)(),f=(0,s.useRef)(null),x=(0,s.useRef)(!1),[h,v]=(0,s.useState)([]),{setProvider:j,setAccount:y,provider:N,account:w}=(0,l.O)(),T=(0,s.useCallback)(async e=>{try{let{provider:t,...a}=await n(e);j(t),y(a)}catch(e){console.log("connectWallet error",e),(0,c.Am)({title:"连接失败",description:u()(e,"message","")})}},[n,y,j]),b=(0,s.useCallback)(async()=>{x.current=!1,await (null==d?void 0:d()),j(null),y(null)},[d,y,j]),k=(0,s.useCallback)(()=>{setTimeout(()=>{try{var e;null===(e=f.current)||void 0===e||e.click()}catch(e){}},150)},[]),C=(0,s.useCallback)(async e=>{let n=await (null==t?void 0:t());if((null==n?void 0:n.length)===0){k();return}let{directConnection:a}=null!=e?e:{directConnection:!1};(null==n?void 0:n.length)===1||(null==n?void 0:n.length)>0&&a?(k(),await T(n[0])):v(n)},[k,T,t]);return(0,s.useEffect)(()=>{let e=setTimeout(async()=>{!x.current&&(console.log("settings.autoConnect",g.autoConnect),g.autoConnect&&(x.current=!0,await C({directConnection:!0})))},500);return()=>{clearTimeout(e)}},[g.autoConnect]),(0,a.jsx)(r.Zb,{children:(0,a.jsxs)(r.aY,{className:"flex flex-col flex-wrap gap-3",children:[(0,a.jsxs)("div",{className:"flex flex-row flex-wrap justify-between",children:[(0,a.jsxs)(i.Vq,{children:[(0,a.jsx)(i.hg,{asChild:!0,children:(0,a.jsx)(o.z,{onClick:()=>C(),children:"Connect Wallet"})}),(0,a.jsxs)(i.cZ,{children:[(0,a.jsx)(i.GG,{ref:f}),(0,a.jsxs)(i.fK,{children:[(0,a.jsx)(i.$N,{children:"选择钱包开始连接"}),!!h&&h.map(e=>{var t;return(0,a.jsx)(i.GG,{asChild:!0,children:(0,a.jsxs)(o.z,{onClick:()=>T(e),className:"gap-2",children:[e.logo&&(0,a.jsx)("img",{alt:e.name,src:e.logo,className:"w-5 h-5 rounded-full"}),(0,a.jsx)("span",{className:"font-medium",children:e.name}),null===(t=e.tags)||void 0===t?void 0:t.map(e=>(0,a.jsx)("span",{className:"text-xs font-light",children:e},e))]})},e.id)}),!h||0===h.length&&(0,a.jsxs)(i.Be,{children:["没有钱包可用，请安装 OneKey Extension",(0,a.jsx)("a",{target:"_blank",href:"https://www.onekey.so/download/",children:"Install OneKey Extension →"})]})]})]})]}),N&&(0,a.jsx)(o.z,{variant:"destructive",onClick:b,children:"断开链接"})]}),w&&(0,a.jsx)("div",{className:"flex grid-cols-1 xl:grid-cols-2 flex-wrap gap-x-6 gap-y-3 mt-4",children:Object.keys(w).map(e=>{var t;return(0,a.jsxs)("div",{children:[(0,a.jsxs)("span",{children:["".concat(null!==(t=null==p?void 0:p[e])&&void 0!==t?t:e),": "]}),(0,a.jsx)("span",{className:"font-normal flex flex-wrap text-break",children:"".concat(null==w?void 0:w[e])})]},e)})})]})})}},53617:function(e,t,n){"use strict";n.d(t,{$N:function(){return g},Be:function(){return f},GG:function(){return u},Vq:function(){return l},cZ:function(){return p},fK:function(){return DialogHeader},hg:function(){return c}});var a=n(85893),s=n(67294),o=n(12854),r=n(41352),i=n(13441);let l=o.fC,c=o.xz,d=o.h_,u=o.x8,m=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,a.jsx)(o.aV,{ref:t,className:(0,i.cn)("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",n),...s})});m.displayName=o.aV.displayName;let p=s.forwardRef((e,t)=>{let{className:n,children:s,...l}=e;return(0,a.jsxs)(d,{children:[(0,a.jsx)(m,{}),(0,a.jsxs)(o.VY,{ref:t,className:(0,i.cn)("fixed left-[50%] top-[35%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",n),...l,children:[s,(0,a.jsxs)(o.x8,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[(0,a.jsx)(r.Z,{className:"h-4 w-4"}),(0,a.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})});p.displayName=o.VY.displayName;let DialogHeader=e=>{let{className:t,...n}=e;return(0,a.jsx)("div",{className:(0,i.cn)("flex flex-col space-y-1.5 text-center sm:text-left",t),...n})};DialogHeader.displayName="DialogHeader";let g=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,a.jsx)(o.Dx,{ref:t,className:(0,i.cn)("text-lg font-semibold leading-none tracking-tight",n),...s})});g.displayName=o.Dx.displayName;let f=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,a.jsx)(o.dk,{ref:t,className:(0,i.cn)("text-sm text-muted-foreground",n),...s})});f.displayName=o.dk.displayName},46601:function(){}}]);
//# sourceMappingURL=9832.668ac4ce5ad86ce4.js.map