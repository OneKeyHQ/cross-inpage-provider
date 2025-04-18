(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1816],{6793:function(e,n,t){"use strict";var a=t(85893);t(67294);var s=t(41664),i=t.n(s),r=t(51731);n.Z=e=>{let{dapps:n}=e;return(0,a.jsxs)(r.Zb,{children:[(0,a.jsx)(r.ll,{className:"text-xl",children:"Dapp Bookmarks"}),(0,a.jsx)(r.aY,{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",children:n.map((e,n)=>(0,a.jsx)("div",{className:"border p-2 rounded-lg shadow-sm hover:shadow-md",children:(0,a.jsx)(i(),{href:e.url,legacyBehavior:!0,children:(0,a.jsxs)("a",{className:"text-blue-500 hover:underline text-lg block",children:[e.name," →"]})})},n))})]})}},50615:function(e,n,t){"use strict";t.d(n,{Z:function(){return InfoLayout}});var a=t(85893),s=t(51731);function InfoLayout(e){let{title:n,children:t}=e;return(0,a.jsxs)(s.Zb,{children:[n&&(0,a.jsx)(s.Ol,{className:"font-medium",children:n}),(0,a.jsx)(s.aY,{className:"flex flex-col flex-wrap gap-3 break-all",children:t})]})}},47840:function(e,n,t){"use strict";t.r(n),t.d(n,{default:function(){return App}});var a=t(85893);let s=[{name:"SEAM",url:"https://app.seam.money/"},{name:"Aptos Names",url:"https://www.aptosnames.com/"},{name:"Liquid Swap",url:"https://liquidswap.com/#/"}];var i=t(6912),r=t(67294),o=t(66409),l=t(99710),c=t(23225),d=t(8590),u=t(30202),f=t(6793),p={signMessage:[{id:"signMessage",name:"signMessage",value:JSON.stringify({address:!1,application:!0,chainId:!0,message:"This is a sample message",nonce:12345})}],signTransaction:e=>[{id:"signTransaction-native",name:"transfer native coin",value:JSON.stringify({transactionOrPayload:{type:"entry_function_payload",function:"0x1::coin::transfer",type_arguments:["0x1::aptos_coin::AptosCoin"],arguments:[e,"100000"]}})},{id:"signTransaction-native-options",name:"transfer native coin - options",value:JSON.stringify({transactionOrPayload:{type:"entry_function_payload",function:"0x1::coin::transfer",type_arguments:["0x1::aptos_coin::AptosCoin"],arguments:[e,"100000"]},options:{maxGasAmount:1e6,gasUnitPrice:1e6}})},{id:"signTransaction-usdc-legacy",name:"transfer usdc coin (legacy)",value:JSON.stringify({transactionOrPayload:{type:"entry_function_payload",function:"0x1::coin::transfer",type_arguments:["0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"],arguments:[e,1e4]}})},{id:"signTransaction-usdc-fa",name:"transfer usdc coin",value:JSON.stringify({transactionOrPayload:{type:"entry_function_payload",function:"0x1::primary_fungible_store::transfer",type_arguments:["0x1::fungible_asset::Metadata"],arguments:["0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",e,1e4]}})}],signAndSubmitTransaction:e=>[{id:"transaction-native-pure",name:"transfer native coin pure",value:JSON.stringify({sender:e,data:{function:"0x1::coin::transfer",typeArguments:["0x1::aptos_coin::AptosCoin"],functionArguments:[e,"100000"]}})},{id:"signTransaction-native-pure-options",name:"transfer native coin pure - options",value:JSON.stringify({sender:e,data:{function:"0x1::coin::transfer",typeArguments:["0x1::aptos_coin::AptosCoin"],functionArguments:[e,"100000"]},options:{maxGasAmount:1e6,gasUnitPrice:1e6}})}]},m=t(50780),g=t.n(m),x=t(22751),y=t(63451),v=t(5528),b=t(16427),h=t(50615);function jsonToUint8Array(e){let n="string"==typeof e?JSON.parse(e):e,t=Object.keys(n).map(e=>n[e]);return new Uint8Array(t)}var j=t(27361),w=t.n(j),N=t(48764).Buffer;function Example(){var e,n,t,i,r,c,d;let{connected:u,account:m,network:v,signAndSubmitTransaction:h,signMessageAndVerify:j,signMessage:S,signTransaction:A,submitTransaction:O}=(0,b.Os)(),C=new y.gZG(new y.ScN({network:y.ZcK.MAINNET}));return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(l.s,{title:"Basics",children:[(0,a.jsx)(l.u,{title:"getNetwork",description:"getNetwork",disableRequestContent:!0,allowCallWithoutProvider:!0,onExecute:async()=>Promise.resolve(v)}),(0,a.jsx)(l.u,{title:"isConnected",description:"isConnected",disableRequestContent:!0,allowCallWithoutProvider:!0,onExecute:async()=>Promise.resolve(u)}),(0,a.jsx)(l.u,{title:"account",description:"当前账户",disableRequestContent:!0,allowCallWithoutProvider:!0,onExecute:async()=>Promise.resolve(m)}),(0,a.jsx)(l.u,{title:"network",description:"当前网络",disableRequestContent:!0,allowCallWithoutProvider:!0,onExecute:async()=>Promise.resolve(v)})]}),(0,a.jsxs)(l.s,{title:"Transfer",children:[(0,a.jsx)(l.u,{title:"signMessage",description:"signMessage",presupposeParams:p.signMessage,onExecute:async e=>{let n=JSON.parse(e),t=await S(n);return JSON.stringify(t)},onValidate:(e,n)=>{let{fullMessage:t,signature:a}=JSON.parse(n),s=jsonToUint8Array(w()(a,"data.data")),i=g().sign.detached.verify(N.from(t),s,(0,o.nr)((0,x.stripHexPrefix)(null==m?void 0:m.publicKey)));return Promise.resolve(i.toString())}}),(0,a.jsx)(l.u,{title:"signMessageAndVerify",description:"signMessageAndVerify",presupposeParams:p.signMessage,onExecute:async e=>{let n=JSON.parse(e),t=await j(n);return JSON.stringify(t)}}),(0,a.jsx)(l.u,{title:"signTransaction",description:"signTransaction",presupposeParams:p.signTransaction(null!==(e=null==m?void 0:m.address)&&void 0!==e?e:""),onExecute:async e=>{let n=JSON.parse(e),{transactionOrPayload:t,asFeePayer:a,options:s}=n,i=await A(t,a,s);return i}}),(0,a.jsx)(l.u,{title:"signAndSubmitTransaction",description:"signAndSubmitTransaction",presupposeParams:p.signAndSubmitTransaction(null!==(n=null==m?void 0:m.address)&&void 0!==n?n:""),onExecute:async e=>{let n=JSON.parse(e),t=await h(n);return JSON.stringify(t)}})]}),(0,a.jsxs)(l.s,{title:"SDK Build Transaction",children:[(0,a.jsx)(l.u,{title:"signTransaction-SDK-build transaction",description:"使用 SDK 构造 Coin 转账",presupposeParams:[{id:"sender",name:"sender",value:JSON.stringify({recipient:null!==(t=null==m?void 0:m.address)&&void 0!==t?t:"",amount:1e5})}],onExecute:async e=>{var n;let{recipient:t,amount:a}=JSON.parse(e),s=await C.coin.transferCoinTransaction({sender:null!==(n=null==m?void 0:m.address)&&void 0!==n?n:"",recipient:t,amount:a});return{txn:s.bcsToHex().toStringWithoutPrefix(),result:await A(s)}},onValidate:async(e,n)=>{let{txn:t,result:a}=JSON.parse(n),s=jsonToUint8Array(w()(a,"public_key.key.data")),i=jsonToUint8Array(w()(a,"signature.data.data")),r=y._tO.deserialize(new y.ZKs((0,o.nr)(t))),l=await O({transaction:r,senderAuthenticator:new y.rEE(new y.EZS(s),new y.AoU(i))});return Promise.resolve(JSON.stringify(l))}}),(0,a.jsx)(l.u,{title:"signTransaction-SDK-build transaction",description:"使用 SDK 构造 Legacy Token 转账",presupposeParams:[{id:"sender",name:"sender",value:JSON.stringify({recipient:null!==(i=null==m?void 0:m.address)&&void 0!==i?i:"",amount:1e5,coinType:"0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"})}],onExecute:async e=>{var n;let{recipient:t,amount:a,coinType:s}=JSON.parse(e),i=await C.coin.transferCoinTransaction({sender:null!==(n=null==m?void 0:m.address)&&void 0!==n?n:"",recipient:t,amount:a,coinType:s});return{txn:i.bcsToHex().toStringWithoutPrefix(),result:await A(i)}},onValidate:async(e,n)=>{let{txn:t,result:a}=JSON.parse(n),s=jsonToUint8Array(w()(a,"public_key.key.data")),i=jsonToUint8Array(w()(a,"signature.data.data")),r=y._tO.deserialize(new y.ZKs((0,o.nr)(t))),l=await O({transaction:r,senderAuthenticator:new y.rEE(new y.EZS(s),new y.AoU(i))});return Promise.resolve(JSON.stringify(l))}}),(0,a.jsx)(l.u,{title:"signTransaction-SDK-build transaction",description:"使用 SDK 构造 Token 转账",presupposeParams:[{id:"sender",name:"sender",value:JSON.stringify({recipient:null!==(r=null==m?void 0:m.address)&&void 0!==r?r:"",amount:1e5,coinType:"0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b"})}],onExecute:async e=>{let{recipient:n,amount:t,coinType:a}=JSON.parse(e);try{var s;let e=await C.transaction.build.simple({sender:null!==(s=null==m?void 0:m.address)&&void 0!==s?s:"",data:{function:"0x1::primary_fungible_store::transfer",typeArguments:["0x1::fungible_asset::Metadata"],functionArguments:[a,n,t],abi:{typeParameters:[{constraints:[]}],parameters:[(0,y._LL)("0x1::object::Object"),new y.iep,new y.VwW]}}});return{txn:e.bcsToHex().toStringWithoutPrefix(),result:await A(e)}}catch(e){console.log(e)}},onValidate:async(e,n)=>{let{txn:t,result:a}=JSON.parse(n),s=jsonToUint8Array(w()(a,"public_key.key.data")),i=jsonToUint8Array(w()(a,"signature.data.data")),r=y._tO.deserialize(new y.ZKs((0,o.nr)(t))),l=await O({transaction:r,senderAuthenticator:new y.rEE(new y.EZS(s),new y.AoU(i))});return Promise.resolve(JSON.stringify(l))}})]}),(0,a.jsxs)(l.s,{title:"SignAndSubmitTransaction Test",children:[(0,a.jsx)(l.u,{title:"signAndSubmitTransaction Normal Argument",description:"Normal Argument 测试",presupposeParams:[{id:"sender",name:"sender",value:JSON.stringify({recipient:null!==(c=null==m?void 0:m.address)&&void 0!==c?c:"",amount:1e5,coinType:"0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b"})}],onExecute:async e=>{var n;let{recipient:t,amount:a,coinType:s}=JSON.parse(e);return{result:await h({sender:null!==(n=null==m?void 0:m.address)&&void 0!==n?n:"",data:{function:"0x1::primary_fungible_store::transfer",typeArguments:["0x1::fungible_asset::Metadata"],functionArguments:[s,t,a]}})}}}),(0,a.jsx)(l.u,{title:"signAndSubmitTransaction Encode Argument",description:"Encode Argument 测试 (OneKey、OKX、MizuWallet 等都不支持)",presupposeParams:[{id:"sender",name:"sender",value:JSON.stringify({recipient:null!==(d=null==m?void 0:m.address)&&void 0!==d?d:"",amount:1e5,coinType:"0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b"})}],onExecute:async e=>{var n;let{recipient:t,amount:a,coinType:s}=JSON.parse(e);return{result:await h({sender:null!==(n=null==m?void 0:m.address)&&void 0!==n?n:"",data:{function:"0x1::primary_fungible_store::transfer",typeArguments:["0x1::fungible_asset::Metadata"],functionArguments:[s,y.kxK.from(t),new y.G90(a)]}})}}}),(0,a.jsx)(l.u,{title:"signAndSubmitTransaction Script",description:"Script 测试",presupposeParams:[{id:"sign with script payload",name:"with script payload",value:""}],onExecute:async e=>{var n,t;return{result:await h({sender:null!==(n=null==m?void 0:m.address)&&void 0!==n?n:"",data:{bytecode:"a11ceb0b060000000701000402040a030e0c041a04051e20073e30086e2000000001010204010001000308000104030401000105050601000002010203060c0305010b0001080101080102060c03010b0001090002050b00010900000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177076465706f7369740000000000000000000000000000000000000000000000000000000000000001000001080b000b0138000c030b020b03380102",functionArguments:[new y.G90(1),y.kxK.from(null!==(t=null==m?void 0:m.address)&&void 0!==t?t:"")]}})}}})]}),(0,a.jsx)(f.Z,{dapps:s})]})}function AptosConnectButton(){var e,n,t,s,o,l,d;let{connected:u,wallets:f,account:p,network:m,connect:g,disconnect:x}=(0,b.Os)(),{setProvider:y}=(0,c.O)(),j=(0,r.useRef)([]);j.current=f.filter(e=>e.readyState===v.i1.Installed),(0,r.useEffect)(()=>{console.log("Aptos Standard Wallets:",f)},[f]);let w=(0,r.useCallback)(async e=>{let n=j.current.find(n=>n.name===e.id);return n?(g(n.name),{provider:void 0}):Promise.reject("Wallet not found")},[g]);return(0,r.useEffect)(()=>{console.log("account changed",p),y(p)},[p,y]),(0,r.useEffect)(()=>{console.log("network changed",m)},[m]),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(i.Z,{fetchWallets:()=>Promise.resolve(j.current.map(e=>({id:e.name,name:e.name,tags:[e.isAIP62Standard?"AIP62":""]}))),onConnect:w,onDisconnect:()=>void x()}),(0,a.jsxs)(h.Z,{title:"Base Info",children:[p&&(0,a.jsxs)("p",{children:["Account:",null!==(e=null==p?void 0:p.address)&&void 0!==e?e:""]}),p&&(0,a.jsxs)("p",{children:["PubKey:",null!==(n=null==p?void 0:p.publicKey)&&void 0!==n?n:""]}),p&&(0,a.jsxs)("p",{children:["minKeysRequired:",null!==(t=null==p?void 0:p.minKeysRequired)&&void 0!==t?t:""]}),p&&(0,a.jsxs)("p",{children:["ansName:",null!==(s=null==p?void 0:p.ansName)&&void 0!==s?s:""]}),m&&(0,a.jsxs)("p",{children:["chainId:",null!==(o=null==m?void 0:m.chainId)&&void 0!==o?o:""]}),m&&(0,a.jsxs)("p",{children:["networkName:",null!==(l=null==m?void 0:m.name)&&void 0!==l?l:""]}),m&&(0,a.jsxs)("p",{children:["networkUrl:",null!==(d=null==m?void 0:m.url)&&void 0!==d?d:""]}),p&&(0,a.jsxs)("p",{children:["Status :",u?"Connected":"Disconnected"]})]})]})}let S=new d.S;function App(){return(0,a.jsx)(u.aH,{client:S,children:(0,a.jsxs)(b.Ay,{autoConnect:!0,dappConfig:{network:y.ZcK.MAINNET},optInWallets:["Petra","OneKey","OKX Wallet","Nightly","Mizu Wallet","Pontem Wallet"],onError:e=>{console.log("error",e)},children:[(0,a.jsx)(AptosConnectButton,{}),(0,a.jsx)(Example,{})]})})}},6912:function(e,n,t){"use strict";t.d(n,{Z:function(){return ConnectButton}});var a=t(85893),s=t(67294),i=t(9663),r=t(51731),o=t(53617),l=t(23225),c=t(96544),d=t(27361),u=t.n(d),f=t(78299);let p={address:"地址",publicKey:"公钥",chainId:"网络"};function ConnectButton(e){let{fetchWallets:n,onConnect:t,onDisconnect:d}=e,{settings:m}=(0,f.r)(),g=(0,s.useRef)(null),x=(0,s.useRef)(!1),[y,v]=(0,s.useState)([]),{setProvider:b,setAccount:h,provider:j,account:w}=(0,l.O)(),N=(0,s.useCallback)(async e=>{try{let{provider:n,...a}=await t(e);b(n),h(a)}catch(e){console.log("connectWallet error",e),(0,c.Am)({title:"连接失败",description:u()(e,"message","")})}},[t,h,b]),S=(0,s.useCallback)(async()=>{x.current=!1,await (null==d?void 0:d()),b(null),h(null)},[d,h,b]),A=(0,s.useCallback)(()=>{setTimeout(()=>{try{var e;null===(e=g.current)||void 0===e||e.click()}catch(e){}},150)},[]),O=(0,s.useCallback)(async e=>{let t=await (null==n?void 0:n());if((null==t?void 0:t.length)===0){A();return}let{directConnection:a}=null!=e?e:{directConnection:!1};(null==t?void 0:t.length)===1||(null==t?void 0:t.length)>0&&a?(A(),await N(t[0])):v(t)},[A,N,n]);return(0,s.useEffect)(()=>{let e=setTimeout(async()=>{!x.current&&(console.log("settings.autoConnect",m.autoConnect),m.autoConnect&&(x.current=!0,await O({directConnection:!0})))},500);return()=>{clearTimeout(e)}},[m.autoConnect]),(0,a.jsx)(r.Zb,{children:(0,a.jsxs)(r.aY,{className:"flex flex-col flex-wrap gap-3",children:[(0,a.jsxs)("div",{className:"flex flex-row flex-wrap justify-between",children:[(0,a.jsxs)(o.Vq,{children:[(0,a.jsx)(o.hg,{asChild:!0,children:(0,a.jsx)(i.z,{onClick:()=>O(),children:"Connect Wallet"})}),(0,a.jsxs)(o.cZ,{children:[(0,a.jsx)(o.GG,{ref:g}),(0,a.jsxs)(o.fK,{children:[(0,a.jsx)(o.$N,{children:"选择钱包开始连接"}),!!y&&y.map(e=>{var n;return(0,a.jsx)(o.GG,{asChild:!0,children:(0,a.jsxs)(i.z,{onClick:()=>N(e),className:"gap-2",children:[e.logo&&(0,a.jsx)("img",{alt:e.name,src:e.logo,className:"w-5 h-5 rounded-full"}),(0,a.jsx)("span",{className:"font-medium",children:e.name}),null===(n=e.tags)||void 0===n?void 0:n.map(e=>(0,a.jsx)("span",{className:"text-xs font-light",children:e},e))]})},e.id)}),!y||0===y.length&&(0,a.jsxs)(o.Be,{children:["没有钱包可用，请安装 OneKey Extension",(0,a.jsx)("a",{target:"_blank",href:"https://www.onekey.so/download/",children:"Install OneKey Extension →"})]})]})]})]}),j&&(0,a.jsx)(i.z,{variant:"destructive",onClick:S,children:"断开链接"})]}),w&&(0,a.jsx)("div",{className:"flex grid-cols-1 xl:grid-cols-2 flex-wrap gap-x-6 gap-y-3 mt-4",children:Object.keys(w).map(e=>{var n;return(0,a.jsxs)("div",{children:[(0,a.jsxs)("span",{children:["".concat(null!==(n=null==p?void 0:p[e])&&void 0!==n?n:e),": "]}),(0,a.jsx)("span",{className:"font-normal flex flex-wrap text-break",children:"".concat(null==w?void 0:w[e])})]},e)})})]})})}},53617:function(e,n,t){"use strict";t.d(n,{$N:function(){return m},Be:function(){return g},GG:function(){return u},Vq:function(){return l},cZ:function(){return p},fK:function(){return DialogHeader},hg:function(){return c}});var a=t(85893),s=t(67294),i=t(12854),r=t(41352),o=t(13441);let l=i.fC,c=i.xz,d=i.h_,u=i.x8,f=s.forwardRef((e,n)=>{let{className:t,...s}=e;return(0,a.jsx)(i.aV,{ref:n,className:(0,o.cn)("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",t),...s})});f.displayName=i.aV.displayName;let p=s.forwardRef((e,n)=>{let{className:t,children:s,...l}=e;return(0,a.jsxs)(d,{children:[(0,a.jsx)(f,{}),(0,a.jsxs)(i.VY,{ref:n,className:(0,o.cn)("fixed left-[50%] top-[35%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",t),...l,children:[s,(0,a.jsxs)(i.x8,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[(0,a.jsx)(r.Z,{className:"h-4 w-4"}),(0,a.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})});p.displayName=i.VY.displayName;let DialogHeader=e=>{let{className:n,...t}=e;return(0,a.jsx)("div",{className:(0,o.cn)("flex flex-col space-y-1.5 text-center sm:text-left",n),...t})};DialogHeader.displayName="DialogHeader";let m=s.forwardRef((e,n)=>{let{className:t,...s}=e;return(0,a.jsx)(i.Dx,{ref:n,className:(0,o.cn)("text-lg font-semibold leading-none tracking-tight",t),...s})});m.displayName=i.Dx.displayName;let g=s.forwardRef((e,n)=>{let{className:t,...s}=e;return(0,a.jsx)(i.dk,{ref:n,className:(0,o.cn)("text-sm text-muted-foreground",t),...s})});g.displayName=i.dk.displayName},46601:function(){},89214:function(){},85568:function(){},52361:function(){},94616:function(){}}]);
//# sourceMappingURL=1816.3e04011c1baddc21.js.map