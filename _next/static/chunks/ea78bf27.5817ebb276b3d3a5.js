"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6052],{71618:function(o,e,t){t.d(e,{KQ:function(){return useBalance},Os:function(){return useWallet},eT:function(){return AlephiumWalletProvider},u$:function(){return AlephiumConnectButton}});var r=t(85893),n=t(67294),a=t(26718),i=t(21190),c=t(73935),s=t(43631),d=t(70643),l=t(92777),p=t(91033),u=t(73460),b=t(61688),x=t(88283),k=t(48945),h=t(16918),f=t(55891);let g={font:{family:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji'"},text:{primary:{color:"#373737"},secondary:{color:"#999999",hover:{color:"#111111"}},error:"#FC6464",valid:"#32D74B"},buttons:{primary:{borderRadius:16,color:"#000373737000",background:"#FFFFFF",border:"#F0F0F0",hover:{color:"#000000",border:"#1A88F8"}},secondary:{borderRadius:16,background:"#F6F7F9",color:"#000000"}},navigation:{color:"#999999"},modal:{background:"#ffffff",divider:"#f7f6f8"},tooltips:{color:"#999999",background:"#ffffff",hover:{background:"#f6f7f9"}},overlay:{background:"rgba(0, 0, 0, 0.06)"},qrCode:{accentColor:"#F7F6F8"}};"undefined"==typeof window||window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;let v={connectKit:{options:{iconStyle:"light"},theme:{preferred:"dark",light:g,dark:g}}},C=(0,n.createContext)(null),useConnectSettingContext=()=>{let o=(0,n.useContext)(C);if(!o)throw Error("ConnectSetting Hook must be inside a Provider.");return o},m=(0,n.createContext)(null),useAlephiumConnectContext=()=>{let o=(0,n.useContext)(m);if(!o)throw Error("AlephiumConnect Hook must be inside a Provider.");return o},y=(0,n.createContext)(null),useAlephiumBalanceContext=()=>{let o=(0,n.useContext)(y);if(!o)throw Error("AlephiumBalance Hook must be inside a Provider.");return o},Portal=o=>{o={selector:"__ALEPHIUMCONNECT__",...o};let{selector:e,children:t}=o,r=(0,n.useRef)(null),[a,i]=(0,n.useState)(!1);return((0,n.useEffect)(()=>{let o="#"+e.replace(/^#/,"");if(r.current=document.querySelector(o),!r.current){let o=document.createElement("div");o.setAttribute("id",e),document.body.appendChild(o),r.current=o}i(!0)},[e]),r.current&&a)?(0,c.createPortal)(t,r.current):null},detectBrowser=()=>{var o;let e=(0,s.qY)();return null!==(o=null==e?void 0:e.name)&&void 0!==o?o:""},detectOS=()=>{var o;let e=(0,s.qY)();return null!==(o=null==e?void 0:e.os)&&void 0!==o?o:""},isIOS=()=>{let o=detectOS();return o.toLowerCase().includes("ios")},isAndroid=()=>{let o=detectOS();return o.toLowerCase().includes("android")},isMobile=()=>isAndroid()||isIOS();function flattenChildren(o){let e=n.Children.toArray(o);return e.reduce((o,e)=>e.type===n.Fragment?o.concat(flattenChildren(e.props.children)):(o.push(e),o),[])}let truncatedAddress=o=>{let e=o.slice(0,6),t=o.slice(-6);return`${e} ... ${t}`};var w="function"==typeof d.ZP.div?d.ZP:d.ZP.default,F={mobileWidth:560};let j=w(a.E.div)`
  z-index: -1;
  pointer-events: auto;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: var(--width);
  top: 64px;
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  background: var(--ck-body-color-danger);
  border-radius: 20px;
  padding: 24px 46px 82px 24px;
  transition: width var(--duration) var(--ease);
  a {
    font-weight: 700;
    text-decoration: underline;
  }
  code {
    font-size: 0.9em;
    display: inline-block;
    font-family: monospace;
    margin: 1px;
    padding: 0 4px;
    border-radius: 8px;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.1);
  }
`,E=d.F4`
from { opacity: 0; }
  to { opacity: 1; }
`,A=d.F4`
from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
`,D=d.F4`
from { opacity: 0; transform: scale(1.1); }
  to { opacity: 1; transform: scale(1); }
`,B=d.F4`
from { opacity: 1; }
  to { opacity: 0; }
`,L=d.F4`
from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(1.1); }
`,_=d.F4`
from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.85); }
`,S=w(a.E.div)`
  max-width: 100%;
  width: 295px;
  padding-top: 48px;
`,O=w(a.E.div)`
  user-select: none;
  position: relative;
  display: block;
  text-align: center;
  color: var(--ck-body-color-muted);
  font-size: 15px;
  font-weight: 400;
  line-height: 21px;
  span {
    z-index: 2;
    position: relative;
    display: inline-block;
    user-select: none;
    pointer-events: none;
    padding: 0 14px;
    background: var(--ck-body-background);
    transition: background-color 200ms ease;
  }
  &:before {
    z-index: 2;
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    transform: translateY(-1px);
    background: var(--ck-body-divider);
    box-shadow: var(--ck-body-divider-box-shadow);
  }
`,I=w(a.E.div)`
  z-index: 3;
  pointer-events: none;
  user-select: none;
  position: absolute;
  top: 25px;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  transform: translateX(-50%);
  width: var(--width);
  text-align: center;
  font-size: 17px;
  line-height: 20px;
  font-weight: var(--ck-modal-heading-font-weight, 600);
  color: var(--ck-body-color);
  span {
    display: inline-block;
  }
`,$=w(a.E.div)`
  position: relative;
  padding: 0;
`,M=w(a.E.div)`
  left: 0;
  right: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 0 16px;

  @media only screen and (max-width: ${F.mobileWidth}px) {
    display: block;
  }
`,T=w(a.E.h1)`
  margin: 0;
  padding: 0;
  line-height: ${o=>o.$small?20:22}px;
  font-size: ${o=>o.$small?17:19}px;
  font-weight: var(--ck-modal-h1-font-weight, 600);
  color: ${o=>o.$error?"var(--ck-body-color-danger)":o.$valid?"var(--ck-body-color-valid)":"var(--ck-body-color)"};
  > svg {
    position: relative;
    top: -2px;
    display: inline-block;
    vertical-align: middle;
    margin-right: 6px;
  }
  @media only screen and (max-width: ${F.mobileWidth}px) {
    margin-bottom: 6px;
    font-size: 17px;
  }
`,N=w.div`
  font-size: 16px;
  font-weight: 400;
  line-height: 21px;
  color: var(--ck-body-color-muted);
  strong {
    font-weight: 500;
    color: var(--ck-body-color);
  }
`,P=w(a.E.div)`
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--ck-overlay-background, rgba(71, 88, 107, 0.24));
  backdrop-filter: var(--ck-overlay-backdrop-filter, none);
  opacity: 0;
  animation: ${o=>o.$active?E:B} 150ms ease-out both;
`,z=d.F4`
  from{ opacity: 0; transform: scale(0.97); }
  to{ opacity: 1; transform: scale(1); }
`,U=d.F4`
  from{ opacity: 1; transform: scale(1); }
  to{ opacity: 0; transform: scale(0.97); }
`,H=d.F4`
  from { transform: translate3d(0, 100%, 0); }
  to { transform: translate3d(0, 0%, 0); }
`,W=d.F4`
  from { opacity: 1; }
  to { opacity: 0; }
`,R=w(a.E.div)`
  z-index: 2;
  position: relative;
  color: var(--ck-body-color);

  animation: 150ms ease both;
  animation-name: ${U};
  &.active {
    animation-name: ${z};
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: var(--width);
    height: var(--height);
    transform: translateX(-50%);
    backface-visibility: hidden;
    transition: all 200ms ease;
    border-radius: var(--ck-border-radius, 20px);
    background: var(--ck-body-background);
    box-shadow: var(--ck-modal-box-shadow);
  }

  @media only screen and (max-width: ${F.mobileWidth}px) {
    animation-name: ${W};
    animation-duration: 130ms;
    animation-timing-function: ease;

    &.active {
      animation-name: ${H};
      animation-duration: 300ms;
      animation-delay: 32ms;
      animation-timing-function: cubic-bezier(0.15, 1.15, 0.6, 1);
    }

    &:before {
      width: 100%;
      transition: 0ms height cubic-bezier(0.15, 1.15, 0.6, 1);
      will-change: height;
    }
  }
`,Z=w(a.E.div)`
  z-index: 3;
  position: absolute;
  top: 0;
  left: 50%;
  height: 64px;
  transform: translateX(-50%);
  backface-visibility: hidden;
  width: var(--width);
  transition: 0.2s ease width;
  pointer-events: auto;
  //border-bottom: 1px solid var(--ck-body-divider);
`,V=w(a.E.div)`
  position: relative;
  overflow: hidden;
  height: var(--height);
  transition: 0.2s ease height;
  @media only screen and (max-width: ${F.mobileWidth}px) {
    transition: 0ms height cubic-bezier(0.15, 1.15, 0.6, 1);
    /* animation-delay: 34ms; */
  }
`,G=w(a.E.div)`
  z-index: 2;
  position: relative;
  top: 0;
  left: 50%;
  margin-left: calc(var(--width) / -2);
  width: var(--width);
  /* left: 0; */
  /* width: 100%; */
  display: flex;
  justify-content: center;
  align-items: center;
  transform-origin: center center;
  animation: 200ms ease both;

  &.active {
    animation-name: ${D};
  }
  &.active-scale-up {
    animation-name: ${A};
  }
  &.exit-scale-down {
    z-index: 1;
    pointer-events: none;
    position: absolute;
    /* top: 0; */
    /* left: 0; */
    animation-name: ${_};
  }
  &.exit {
    z-index: 1;
    pointer-events: none;
    position: absolute;
    /* top: 0; */
    /* left: 0; */
    /* left: 50%; */
    /* transform: translateX(-50%); */
    animation-name: ${L};
    animation-delay: 16.6667ms;
  }
  @media only screen and (max-width: ${F.mobileWidth}px) {
    /* animation: 0ms ease both; */
    /* animation-delay: 35ms; */
    animation: 0ms cubic-bezier(0.15, 1.15, 0.6, 1) both;

    &.active {
      animation-name: ${E};
    }
    &.active-scale-up {
      animation-name: ${E};
    }
    &.exit-scale-down {
      z-index: 3;
      animation-name: ${B};
    }
    &.exit {
      z-index: 3;
      animation-name: ${B};
      animation-delay: 0ms;
    }
  }
`,q=w(a.E.div)`
  margin: 0 auto;
  width: fit-content;
  padding: 29px 24px 24px;
  backface-visibility: hidden;
`,X=w.div`
  z-index: 2147483646; // z-index set one below max (2147483647) for if we wish to layer things ontop of the modal in a seperate Portal
  position: fixed;
  inset: 0;
`,J=w(a.E.button)`
  z-index: 3;
  cursor: pointer;
  position: absolute;
  top: 22px;
  right: 17px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 0;
  margin: 0;
  color: var(--ck-body-action-color);
  background: var(--ck-body-background);
  transition: background-color 200ms ease, transform 100ms ease;
  /* will-change: transform; */
  svg {
    display: block;
  }

  &:hover {
    background: var(--ck-body-background-secondary);
  }
  &:active {
    transform: scale(0.9);
  }
`,K=w(a.E.button)`
  z-index: 3;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 0;
  margin: 0;
  color: var(--ck-body-action-color);
  background: var(--ck-body-background);
  transition: background-color 200ms ease, transform 100ms ease;
  /* will-change: transform; */
  svg {
    display: block;
    position: relative;
    left: -1px;
  }

  &:enabled {
    cursor: pointer;
    &:hover {
      background: var(--ck-body-background-secondary);
    }
    &:active {
      transform: scale(0.9);
    }
  }
`,Q=w(a.E.button)`
  z-index: 3;
  position: absolute;
  inset: 0;
  transform: translateX(-1px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 0;
  margin: 0;
  color: var(--ck-body-action-color);
  background: var(--ck-body-background);
  transition: background-color 200ms ease, transform 100ms ease;
  /* will-change: transform; */
  svg {
    display: block;
    position: relative;
  }
  &:enabled {
    cursor: pointer;
    &:hover {
      background: var(--ck-body-background-secondary);
    }
    &:active {
      transform: scale(0.9);
    }
  }
`,Y=w(a.E.div)`
  --ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --duration: 200ms;
  --transition: height var(--duration) var(--ease), width var(--duration) var(--ease);
  z-index: 3;
  display: block;
  pointer-events: none;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  transform: translate3d(-50%, -50%, 0);
  backface-visibility: hidden;
  @media only screen and (max-width: ${F.mobileWidth}px) {
    pointer-events: auto;
    left: 0;
    top: auto;
    bottom: -5px;
    transform: none;
    ${R} {
      max-width: 448px;
      margin: 0 auto;
      &:before {
        width: 100%;
        border-radius: var(--ck-border-radius, 30px) var(--ck-border-radius, 30px) 0 0;
      }
    }
    ${G} {
      left: 0;
      right: 0;
      margin: 0 auto;
      width: auto;
    }
    ${S} {
      margin: 0 auto;
      width: 100% !important;
    }
    ${I} {
      top: 29px;
    }
    ${M} {
      gap: 12px;
    }
    ${N} {
      margin: 0 auto;
      max-width: 295px;
    }
    ${q} {
      width: 100%;
      padding: 31px 24px;
    }
    ${Z} {
      width: 100%;
      top: 4px;
      border-bottom: 0;
    }
    ${J} {
      right: 22px;
    }
    ${K} {
      top: -1px;
      left: -3px;
    }
    ${Q} {
      top: -1px;
      left: -3px;
      svg {
        width: 65%;
        height: auto;
      }
    }
    ${J},
    ${K},
    ${Q} {
      // Quick hack for bigger tappable area on mobile
      transform: scale(1.4) !important;
      background: transparent !important;
      svg {
        transform: scale(0.8) !important;
      }
    }
  }
`;function FocusTrap(o){let e=function(){let o=(0,n.useRef)(null);function handleFocus(e){if(!o.current)return;let t=o.current.querySelectorAll(`
        a[href]:not(:disabled),
        button:not(:disabled),
        textarea:not(:disabled),
        input[type="text"]:not(:disabled),
        input[type="radio"]:not(:disabled),
        input[type="checkbox"]:not(:disabled),
        select:not(:disabled)
      `),r=t[0],n=t[t.length-1],a="Tab"===e.key||9===e.keyCode;a&&(e.shiftKey?document.activeElement===r&&(n.focus(),e.preventDefault()):document.activeElement===n&&(r.focus(),e.preventDefault()))}return(0,n.useEffect)(()=>{o.current&&(o.current.addEventListener("keydown",handleFocus),o.current.focus({preventScroll:!0}));let e=o.current;return()=>{e&&e.removeEventListener("keydown",handleFocus)}},[o]),o}();return(0,n.useEffect)(()=>{e.current&&e.current.focus({preventScroll:!0})},[e]),(0,r.jsx)("div",{ref:e,tabIndex:0,children:o.children})}let oo={debug:10,info:20,warn:30,error:40,none:100},oe="undefined"!=typeof window&&window.document&&void 0!==window.document.createElement?n.useLayoutEffect:n.useEffect,useFitText=({logLevel:o="info",maxFontSize:e=100,minFontSize:t=20,onFinish:r,onStart:a,resolution:i=5}={})=>{let c=oo[o],s=(0,n.useCallback)(()=>({calcKey:0,fontSize:e,fontSizePrev:t,fontSizeMax:e,fontSizeMin:t}),[e,t]),d=(0,n.useRef)(null),l=(0,n.useRef)(),u=(0,n.useRef)(!1),[b,x]=(0,n.useState)(s),{calcKey:k,fontSize:h,fontSizeMax:f,fontSizeMin:g,fontSizePrev:v}=b,C=null,[m]=(0,n.useState)(()=>new p.Z(()=>{C=window.requestAnimationFrame(()=>{u.current||(a&&a(),u.current=!0,x({...s(),calcKey:k+1}))})}));(0,n.useEffect)(()=>(d.current&&m.observe(d.current),()=>{C&&window.cancelAnimationFrame(C),m.disconnect()}),[C,m]);let y=d.current&&d.current.innerHTML;return(0,n.useEffect)(()=>{0===k||u.current||(y!==l.current&&(a&&a(),x({...s(),calcKey:k+1})),l.current=y)},[k,s,y,a]),oe(()=>{let o;if(0===k)return;let e=Math.abs(h-v)<=i,n=!!d.current&&(d.current.scrollHeight>d.current.offsetHeight||d.current.scrollWidth>d.current.offsetWidth),a=n&&h===v,s=h>v;if(e){a?(u.current=!1,c<=oo.info&&console.info(`[use-fit-text] reached \`minFontSize = ${t}\` without fitting text`)):n?x({fontSize:s?v:g,fontSizeMax:f,fontSizeMin:g,fontSizePrev:v,calcKey:k}):(u.current=!1,r&&r(h));return}let l=f,p=g;n?(o=s?v-h:g-h,l=Math.min(f,h)):(o=s?f-h:v-h,p=Math.max(g,h)),x({calcKey:k,fontSize:h+o/2,fontSizeMax:l,fontSizeMin:p,fontSizePrev:h})},[k,h,f,g,v,r,d,i]),{fontSize:h,ref:d}},ot=n.forwardRef(({children:o},e)=>{let[t,a]=n.useState(!1),{fontSize:i,ref:c}=useFitText({logLevel:"none",maxFontSize:100,minFontSize:70,onStart:()=>a(!0),onFinish:()=>a(!0)});return(0,r.jsx)("div",{ref:c,style:{visibility:t?"visible":"hidden",fontSize:`${i}%`,maxHeight:"100%",maxWidth:"100%",display:"flex",justifyContent:"center",alignItems:"center"},children:o})});ot.displayName="FitText";var or={base:{light:{"--ck-connectbutton-font-size":"15px","--ck-connectbutton-color":"#373737","--ck-connectbutton-background":"#F6F7F9","--ck-connectbutton-background-secondary":"#FFFFFF","--ck-connectbutton-hover-color":"#373737","--ck-connectbutton-hover-background":"#F0F2F5","--ck-connectbutton-active-color":"#373737","--ck-connectbutton-active-background":"#EAECF1","--ck-connectbutton-balance-color":"#373737","--ck-connectbutton-balance-background":"#fff","--ck-connectbutton-balance-box-shadow":"inset 0 0 0 1px var(--ck-connectbutton-background)","--ck-connectbutton-balance-hover-background":"#F6F7F9","--ck-connectbutton-balance-hover-box-shadow":"inset 0 0 0 1px var(--ck-connectbutton-hover-background)","--ck-connectbutton-balance-active-background":"#F0F2F5","--ck-connectbutton-balance-active-box-shadow":"inset 0 0 0 1px var(--ck-connectbutton-active-background)","--ck-primary-button-border-radius":"16px","--ck-primary-button-color":"#373737","--ck-primary-button-background":"#F6F7F9","--ck-primary-button-font-weight":"600","--ck-primary-button-hover-color":"#373737","--ck-primary-button-hover-background":"#F0F2F5","--ck-secondary-button-border-radius":"16px","--ck-secondary-button-color":"#373737","--ck-secondary-button-background":"#F6F7F9","--ck-tertiary-button-background":"#FFFFFF","--ck-secondary-button-hover-background":"#e0e4eb","--ck-modal-box-shadow":"0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-overlay-background":"rgba(71, 88, 107, 0.24)","--ck-body-color":"#373737","--ck-body-color-muted":"#999999","--ck-body-color-muted-hover":"#111111","--ck-body-background":"#ffffff","--ck-body-background-transparent":"rgba(255,255,255,0)","--ck-body-background-secondary":"#f6f7f9","--ck-body-background-secondary-hover-background":"#e0e4eb","--ck-body-background-secondary-hover-outline":"#4282FF","--ck-body-background-tertiary":"#F3F4F7","--ck-body-action-color":"#999999","--ck-body-divider":"#f7f6f8","--ck-body-color-danger":"#FF4E4E","--ck-body-color-valid":"#32D74B","--ck-siwe-border":"#F0F0F0","--ck-body-disclaimer-color":"#AAAAAB","--ck-body-disclaimer-link-color":"#838485","--ck-body-disclaimer-link-hover-color":"#000000","--ck-tooltip-background":"#ffffff","--ck-tooltip-background-secondary":"#ffffff","--ck-tooltip-color":"#999999","--ck-tooltip-shadow":"0px 2px 10px rgba(0, 0, 0, 0.08)","--ck-dropdown-button-color":"#999999","--ck-dropdown-button-box-shadow":"0 0 0 1px rgba(0,0,0,0.01), 0px 0px 7px rgba(0, 0, 0, 0.05)","--ck-dropdown-button-background":"#fff","--ck-dropdown-button-hover-color":"#8B8B8B","--ck-dropdown-button-hover-background":"#F5F7F9","--ck-qr-dot-color":"#000000","--ck-qr-border-color":"#f7f6f8","--ck-focus-color":"#1A88F8","--ck-spinner-color":"var(--ck-focus-color)","--ck-copytoclipboard-stroke":"#CCCCCC"},dark:{"--ck-connectbutton-font-size":"15px","--ck-connectbutton-color":"#ffffff","--ck-connectbutton-background":"#383838","--ck-connectbutton-background-secondary":"#282828","--ck-connectbutton-hover-background":"#404040","--ck-connectbutton-active-background":"#4D4D4D","--ck-connectbutton-balance-color":"#fff","--ck-connectbutton-balance-background":"#282828","--ck-connectbutton-balance-box-shadow":"inset 0 0 0 1px var(--ck-connectbutton-background)","--ck-connectbutton-balance-hover-background":"#383838","--ck-connectbutton-balance-hover-box-shadow":"inset 0 0 0 1px var(--ck-connectbutton-hover-background)","--ck-connectbutton-balance-active-background":"#404040","--ck-connectbutton-balance-active-box-shadow":"inset 0 0 0 1px var(--ck-connectbutton-active-background)","--ck-primary-button-color":"#ffffff","--ck-primary-button-background":"#383838","--ck-primary-button-border-radius":"16px","--ck-primary-button-font-weight":"600","--ck-primary-button-hover-background":"#404040","--ck-primary-button-active-border-radius":"16px","--ck-secondary-button-color":"#ffffff","--ck-secondary-button-background":"#333333","--ck-secondary-button-hover-background":"#4D4D4D","--ck-tertiary-button-background":"#424242","--ck-focus-color":"#1A88F8","--ck-overlay-background":"rgba(0,0,0,0.4)","--ck-body-color":"#ffffff","--ck-body-color-muted":"rgba(255, 255, 255, 0.4)","--ck-body-color-muted-hover":"rgba(255, 255, 255, 0.8)","--ck-body-background":"#2B2B2B","--ck-body-background-transparent":"rgba(0,0,0,0)","--ck-body-background-secondary":"#333333","--ck-body-background-secondary-hover-background":"#4D4D4D","--ck-body-background-secondary-hover-outline":"#ffffff","--ck-body-background-tertiary":"#333333","--ck-body-action-color":"#808080","--ck-body-divider":"#383838","--ck-body-color-danger":"#FF4E4E","--ck-body-disclaimer-color":"#858585","--ck-body-disclaimer-link-color":"#ADADAD","--ck-body-disclaimer-link-hover-color":"#FFFFFF","--ck-modal-box-shadow":"0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-copytoclipboard-stroke":"#555555","--ck-tooltip-background":"#2B2B2B","--ck-tooltip-background-secondary":"#333333","--ck-tooltip-color":"#999999","--ck-tooltip-shadow":"0px 2px 10px rgba(0, 0, 0, 0.08)","--ck-dropdown-button-color":"#6C7381","--ck-spinner-color":"var(--ck-focus-color)","--ck-qr-dot-color":"#ffffff","--ck-qr-border-color":"#3d3d3d"}},web95:{"--ck-font-family":"Lato","--ck-border-radius":"0px","--ck-connectbutton-color":"#373737","--ck-connectbutton-background":"linear-gradient(180deg, #F0F0EA 0%, #FFFFFF 50%, #F0F0EA 100%) 100% 100% / 200% 200%, #F5F5F1","--ck-connectbutton-box-shadow":" 0 0 0 1px #003C74, 2px 2px 0px rgba(255, 255, 255, 0.75), -2px -2px 0px rgba(0, 0, 0, 0.05), inset 0px 0px 0px 0px #97B9EC, inset -1px -2px 2px rgba(0, 0, 0, 0.2)","--ck-connectbutton-border-radius":"4.5px","--ck-connectbutton-hover-color":"#373737","--ck-connectbutton-hover-background":"linear-gradient(180deg, #F0F0EA 0%, #FFFFFF 50%, #F0F0EA 100%) 100% 0% / 200% 200%, #F5F5F1","--ck-connectbutton-active-background":"linear-gradient(180deg, #F0F0EA 0%, #FFFFFF 50%, #F0F0EA 100%) 100% 100% / 200% 200%, #F5F5F1","--ck-connectbutton-balance-color":"#373737","--ck-connectbutton-balance-background":"#fff","--ck-connectbutton-balance-box-shadow":"0 0 0 1px #E4E7E7","--ck-connectbutton-balance-hover-box-shadow":"0 0 0 1px #d7dbdb","--ck-connectbutton-balance-active-box-shadow":"0 0 0 1px #bbc0c0","--ck-focus-color":"#1A88F8","--ck-overlay-background":"rgba(0, 127,  128, 0.8)","--ck-body-color":"#373737","--ck-body-color-muted":"#808080","--ck-body-color-muted-hover":"#111111","--ck-body-background":"#F0EDE2","--ck-body-background-transparent":"rgba(255,255,255,0)","--ck-body-background-secondary-hover-background":"#FAFAFA","--ck-body-background-secondary-hover-outline":"#4282FF","--ck-body-action-color":"#373737","--ck-body-color-danger":"#FC6464","--ck-body-color-valid":"#32D74B","--ck-body-divider":"#919B9C","--ck-body-divider-box-shadow":"0px 1px 0px #FBFBF8","--ck-primary-button-background":"linear-gradient(180deg, #FFFFFF 0%, #F0F0EA 100%), #F5F5F1","--ck-primary-button-box-shadow":"inset 0 0 0 1px #003C74, 1px 1px 0px rgba(255, 255, 255, 0.75), -1px -1px 0px rgba(0, 0, 0, 0.05), inset 0px 0px 0px 0px #97B9EC, inset -1px -2px 2px rgba(0, 0, 0, 0.2)","--ck-primary-button-border-radius":"6px","--ck-primary-button-hover-box-shadow":"inset 0 0 0 1px #003C74, 1px 1px 0px rgba(255, 255, 255, 0.75), -1px -1px 0px rgba(0, 0, 0, 0.05), inset 0px 0px 0px 5px #97B9EC, inset -1px -2px 2px rgba(0, 0, 0, 0.2)","--ck-primary-button-hover-border-radius":"6px","--ck-modal-heading-font-weight":400,"--ck-modal-box-shadow":`
    inset 0px -3px 0px #0F37A9,
    inset -2px 0px 0px #0F37A9,
    inset 0px -4px 0px #0D5DDF,
    inset -4px 0px 0px #0D5DDF,
    inset 2px 0px 0px #0453DD,
    inset 0px 2px 0px #044FD1,
    inset 4px 0px 0px #4283EB,
    inset 0px 4px 0px #4283EB
  `,"--ck-modal-h1-font-weight":400,"--ck-secondary-button-color":"#373737","--ck-secondary-button-border-radius":"6px","--ck-secondary-button-box-shadow":"inset 0 0 0 1px #003C74, 1px 1px 0px rgba(255, 255, 255, 0.75), -1px -1px 0px rgba(0, 0, 0, 0.05), inset 0px 0px 0px 0px #97B9EC, inset -1px -2px 2px rgba(0, 0, 0, 0.2)","--ck-secondary-button-background":"linear-gradient(180deg, #FFFFFF 0%, #F0F0EA 100%), #F5F5F1","--ck-secondary-button-hover-box-shadow":"inset 0 0 0 1px #003C74, 1px 1px 0px rgba(255, 255, 255, 0.75), -1px -1px 0px rgba(0, 0, 0, 0.05), inset 0px 0px 0px 4px #97B9EC, inset -1px -2px 2px rgba(0, 0, 0, 0.2)","--ck-body-background-secondary":"rgba(0, 0, 0, 0.1)","--ck-body-background-tertiary":"linear-gradient(180deg, #FBFBFB 0%, #EFEFEE 100%)","--ck-tertiary-border-radius":"0px","--ck-tertiary-box-shadow":"inset 0 0 0 1px #919B9C, 1px 1px 2px rgba(0, 0, 0, 0.15), inset -2px -2px 0px #FFFFFF","--ck-body-button-text-align":"left","--ck-body-button-box-shadow":"0 2px 4px rgba(0, 0, 0, 0.05 )","--ck-body-disclaimer-background":"linear-gradient(180deg, #FBFBFB 0%, #EFEFEE 100%)","--ck-body-disclaimer-box-shadow":`
    inset 0px -3px 0px #0F37A9,
    inset -2px 0px 0px #0F37A9,
    inset 0px -4px 0px #0D5DDF,
    inset -4px 0px 0px #0D5DDF,
    inset 2px 0px 0px #0453DD,
    inset 4px 0px 0px #4283EB,
    inset 0 1px 0 0 #919B9C`,"--ck-body-disclaimer-font-size":"14px","--ck-body-disclaimer-color":"#959594","--ck-body-disclaimer-link-color":"#626262","--ck-body-disclaimer-link-hover-color":"#000000","--ck-qr-dot-color":"#000000","--ck-qr-border-color":"#919B9C","--ck-qr-border-radius":"0","--ck-qr-background":"#FFFFFF","--ck-copytoclipboard-stroke":"rgba(55, 55, 55, 0.4)","--ck-tooltip-background":"linear-gradient(270deg, #F7F3E6 7.69%, #F5F7DA 100%)","--ck-tooltip-background-secondary":"#f6f7f9","--ck-tooltip-color":"#000000","--ck-tooltip-shadow":" 0 0 0 1.5px #2b2622, 0px 2px 10px rgba(0, 0, 0, 0.08)","--ck-spinner-color":"var(--ck-focus-color)","--ck-dropdown-button-color":"#999999","--ck-dropdown-button-box-shadow":"0 0 0 1px #A0A0A0, 1px 1px 0px rgba(255, 255, 255, 0.75), -1px -1px 0px rgba(0, 0, 0, 0.05), inset -1px -2px 2px rgba(0, 0, 0, 0.2)","--ck-dropdown-button-background":"linear-gradient(180deg, #FFFFFF 0%, #F0F0EA 100%), #F5F5F1","--ck-dropdown-button-hover-background":"linear-gradient(0deg, #FFFFFF 0%, #F0F0EA 100%), #F5F5F1","--ck-dropdown-pending-color":"#ACA899","--ck-dropdown-active-color":"#FFFFFF","--ck-dropdown-active-static-color":"#ACA899","--ck-dropdown-active-background":"#3F69BF","--ck-dropdown-active-border-radius":"0","--ck-dropdown-active-inset":"-12px","--ck-dropdown-color":"#ACA899","--ck-dropdown-background":"#FFFFFF","--ck-dropdown-box-shadow":"inset 0 0 0 1px #ACA899, 2px 2px 7px rgba(0, 0, 0, 0.15)","--ck-dropdown-border-radius":"0","--ck-alert-color":"#ACA899","--ck-alert-background":"linear-gradient(180deg, #FBFBFB 0%, #EFEFEE 100%)","--ck-alert-box-shadow":"inset 0 0 0 1px #919B9C, 1px 1px 2px rgba(0, 0, 0, 0.15), inset -2px -2px 0px #FFFFFF","--ck-alert-border-radius":"0","--ck-graphic-primary-color":"#333333","--ck-graphic-primary-background":"#FFFFFF","--ck-graphic-compass-background":"#FFFFFF","--ck-siwe-border":"#919B9C"},retro:{"--ck-font-family":'"SF Pro Rounded",ui-rounded,"Nunito",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol"',"--ck-border-radius":"8px","--ck-connectbutton-font-size":"17px","--ck-connectbutton-color":"#000000","--ck-connectbutton-background":"#ffffff","--ck-connectbutton-box-shadow":"-4px 4px 0px #000000, inset 0 0 0 2px #000000","--ck-connectbutton-border-radius":"8px","--ck-connectbutton-hover-background":"#F3EDE8","--ck-connectbutton-active-box-shadow":"0 0 0 0 #000000, inset 0 0 0 2px #000000","--ck-connectbutton-balance-color":"#000000","--ck-connectbutton-balance-background":"#F3EDE8","--ck-connectbutton-balance-box-shadow":"-4px 4px 0px #000000, inset 0 0 0 2px #000000","--ck-connectbutton-balance-hover-background":"#eee5dd","--ck-connectbutton-balance-connectbutton-box-shadow":"-4px 8px 0px -4px #000000, inset 0 0 0 2px #000000","--ck-connectbutton-balance-connectbutton-border-radius":"0px 8px 8px 0","--ck-primary-button-color":"#373737","--ck-primary-button-background":"#ffffff","--ck-primary-button-box-shadow":"inset 0 0 0 2px #000000, -4px 4px 0 0 #000000","--ck-primary-button-border-radius":"8px","--ck-primary-button-hover-background":"#F3EDE8","--ck-primary-button-hover-box-shadow":"inset 0 0 0 2px #000000, -0px 0px 0 0 #000000","--ck-secondary-button-border-radius":"8px","--ck-secondary-button-color":"#373737","--ck-secondary-button-background":"#ffffff","--ck-secondary-button-box-shadow":"-4px 4px 0 0 #000000, inset 0 0 0 2px #000000","--ck-secondary-button-hover-background":"#F3EDE8","--ck-secondary-button-hover-box-shadow":"0 0 0 0 #000000, inset 0 0 0 2px #000000","--ck-focus-color":"#3B99FC","--ck-overlay-background":"rgba(133, 120, 122, 0.8)","--ck-body-color":"#373737","--ck-body-color-muted":"rgba(0, 0, 0, 0.5)","--ck-body-color-muted-hover":"#000000","--ck-body-background":"#EBE1D8","--ck-body-background-transparent":"rgba(255,255,255,0)","--ck-body-background-secondary":"rgba(0,0,0,0.1)","--ck-body-background-secondary-hover-background":"#4D4D4D","--ck-body-background-secondary-hover-outline":"#373737","--ck-body-background-tertiary":"#ffffff","--ck-tertiary-border-radius":"8px","--ck-tertiary-box-shadow":"-4px 4px 0 0 #000000, inset 0 0 0 2px #000000","--ck-body-action-color":"#373737","--ck-body-divider":"#373737","--ck-body-color-danger":"#FF4E4E","--ck-body-disclaimer-background":"#E3D6C9","--ck-body-disclaimer-box-shadow":"-4px 4px 0 0 #000000, inset 2px 0 0 0 #000000, inset -2px 0 0 0 #000000, inset 0 -2px 0 0 #000000","--ck-body-disclaimer-font-weight":"500","--ck-body-disclaimer-color":"#888079","--ck-body-disclaimer-link-color":"#5B5650","--ck-body-disclaimer-link-hover-color":"#000000","--ck-modal-box-shadow":"-10px 10px 0px #000000, inset 0 0 0 2px #000000","--ck-copytoclipboard-stroke":"#555555","--ck-tooltip-border-radius":"8px","--ck-tooltip-color":"#373737","--ck-tooltip-background":"#ffffff","--ck-tooltip-background-secondary":"#EBE1D8","--ck-tooltip-shadow":"-6px 6px 0 0 #000000, 0 0 0 2px #000000","--ck-spinner-color":"#1A88F8","--ck-dropdown-button-color":"#000","--ck-dropdown-button-box-shadow":"-2px 2px 0 2px #000000,  0 0 0 2px #000000","--ck-dropdown-button-background":"#ffffff","--ck-dropdown-button-hover-background":"#F3EDE8","--ck-dropdown-button-hover-box-shadow":"-2px 2px 0 0 #000000,  0 0 0 2px #000000","--ck-dropdown-pending-color":"rgba(0, 0, 0, 0.5)","--ck-dropdown-active-color":"#FFFFFF","--ck-dropdown-active-static-color":"rgba(0, 0, 0, 0.5)","--ck-dropdown-active-background":"#3B99FC","--ck-dropdown-active-box-shadow":"inset 0 0 0 2px #000000","--ck-dropdown-active-border-radius":"8px","--ck-dropdown-color":"rgba(0, 0, 0, 0.5)","--ck-dropdown-background":"#FFFFFF","--ck-dropdown-box-shadow":"-4px 4px 0 0 #000000, inset 0 0 0 2px #000000","--ck-dropdown-border-radius":"8px","--ck-alert-color":"rgba(0, 0, 0, 0.5)","--ck-alert-background":" #F5F5F5","--ck-alert-border-radius":"8px","--ck-qr-border-radius":"8px","--ck-qr-dot-color":"#000000","--ck-qr-border-color":"#000000","--ck-qr-background":"#ffffff","--ck-graphic-primary-color":"#000000","--ck-graphic-primary-background":"#ffffff","--ck-graphic-compass-background":"#FFFFFF","--ck-siwe-border":"#8E8985"},soft:{"--ck-border-radius":"12px","--ck-connectbutton-font-size":"17px","--ck-connectbutton-border-radius":"12px","--ck-connectbutton-color":"#414451","--ck-connectbutton-background":"#ffffff","--ck-connectbutton-box-shadow":"inset 0 0 0 1px #E9EAEC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-connectbutton-hover-background":"#F6F7F9","--ck-connectbutton-hover-box-shadow":"inset 0 0 0 1px #E9EAEC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-connectbutton-balance-color":"#373737","--ck-connectbutton-balance-background":"#F6F7F9","--ck-connectbutton-balance-box-shadow":"none","--ck-connectbutton-balance-hover-background":"#f1f1f3","--ck-primary-button-border-radius":"12px","--ck-primary-button-color":"#414451","--ck-primary-button-background":"#ffffff","--ck-primary-button-box-shadow":"0 0 0 1px #E9EAEC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-primary-button-hover-background":"#F6F7F9","--ck-primary-button-hover-box-shadow":"0 0 0 1px #D9DBDD, 0px 0 0 rgba(0, 0, 0, 0.02)","--ck-secondary-button-border-radius":"12px","--ck-secondary-button-color":"#414451","--ck-secondary-button-background":"#ffffff","--ck-secondary-button-box-shadow":"0 0 0 1px #E9EAEC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-secondary-button-hover-background":"#F6F7F9","--ck-secondary-button-hover-box-shadow":"0 0 0 1px #D9DBDD, 0px 0 0 rgba(0, 0, 0, 0.02)","--ck-focus-color":"#1A88F8","--ck-modal-box-shadow":"0px 3px 16px rgba(0, 0, 0, 0.08)","--ck-body-color":"#414451","--ck-body-color-muted":"#9196A1","--ck-body-color-muted-hover":"#000000","--ck-body-background":"#ffffff","--ck-body-background-transparent":"rgba(255,255,255,0)","--ck-body-background-secondary":"#f6f7f9","--ck-body-background-secondary-hover-background":"#e0e4eb","--ck-body-background-secondary-hover-outline":"#4282FF","--ck-body-background-tertiary":"#F6F8FA","--ck-tertiary-border-radius":"13px","--ck-tertiary-box-shadow":"inset 0 0 0 1px rgba(0, 0, 0, 0.04)","--ck-body-action-color":"#999999","--ck-body-divider":"#f7f6f8","--ck-body-color-danger":"#FF4E4E","--ck-body-color-valid":"#32D74B","--ck-body-disclaimer-background":"#F9FAFA","--ck-body-disclaimer-color":"#AFB1B6","--ck-body-disclaimer-link-color":"#787B84","--ck-body-disclaimer-link-hover-color":"#000000","--ck-copytoclipboard-stroke":"#CCCCCC","--ck-tooltip-background":"#ffffff","--ck-tooltip-background-secondary":"#ffffff","--ck-tooltip-color":"#999999","--ck-tooltip-shadow":"0px 2px 10px rgba(0, 0, 0, 0.08)","--ck-spinner-color":"var(--ck-focus-color)","--ck-dropdown-button-color":"#999999","--ck-dropdown-button-box-shadow":"0 0 0 1px rgba(0, 0, 0, 0.01), 0px 0px 7px rgba(0, 0, 0, 0.05)","--ck-dropdown-button-background":"#fff","--ck-dropdown-button-hover-color":"#8B8B8B","--ck-dropdown-button-hover-background":"#E7E7E7","--ck-dropdown-color":"rgba(55, 55, 55, 0.4)","--ck-dropdown-box-shadow":"0px 2px 15px rgba(0, 0, 0, 0.15)","--ck-alert-color":"#9196A1","--ck-alert-background":"#F6F8FA","--ck-alert-box-shadow":"inset 0 0 0 1px rgba(0, 0, 0, 0.04)","--ck-alert-border-radius":"8px","--ck-qr-border-radius":"12px","--ck-qr-dot-color":"#2E3138","--ck-qr-border-color":"#E9EAEC","--ck-siwe-border":"#EAEBED"},midnight:{"--ck-font-family":'"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol"',"--ck-border-radius":"10px","--ck-connectbutton-font-size":"17px","--ck-connectbutton-border-radius":"8px","--ck-connectbutton-color":"#ffffff","--ck-connectbutton-background":"#313235","--ck-connectbutton-box-shadow":"inset 0 0 0 1px rgba(255, 255, 255, 0.05)","--ck-connectbutton-hover-background":"#414144","--ck-connectbutton-active-background":"#4C4D4F","--ck-connectbutton-balance-color":"#ffffff","--ck-connectbutton-balance-background":"#1F2023","--ck-connectbutton-balance-box-shadow":"inset 0 0 0 1px #313235","--ck-connectbutton-balance-hover-background":"#313235","--ck-connectbutton-balance-active-background":"#414144","--ck-primary-button-border-radius":"8px","--ck-primary-button-color":"#ffffff","--ck-primary-button-background":"rgba(255, 255, 255, 0.08)","--ck-primary-button-box-shadow":"inset 0 0 0 1px rgba(255, 255, 255, 0.05)","--ck-primary-button-hover-background":"rgba(255, 255, 255, 0.2)","--ck-secondary-button-border-radius":"8px","--ck-secondary-button-color":"#ffffff","--ck-secondary-button-background":"#363638","--ck-secondary-button-box-shadow":"inset 0 0 0 1px rgba(255, 255, 255, 0.05)","--ck-secondary-button-hover-background":"#3c3c3e","--ck-overlay-background":"rgba(0,0,0,0.4)","--ck-modal-box-shadow":"inset 0 0 0 1px #38393C, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-focus-color":"#1A88F8","--ck-body-color":"#ffffff","--ck-body-color-muted":"#8B8F97","--ck-body-color-muted-hover":"#ffffff","--ck-body-background":"#1F2023","--ck-body-background-transparent":"rgba(31, 32, 35, 0)","--ck-body-background-secondary":"#313235","--ck-body-background-secondary-hover-background":"#e0e4eb","--ck-body-background-secondary-hover-outline":"rgba(255, 255, 255, 0.02)","--ck-body-background-tertiary":"#313235","--ck-tertiary-border-radius":"12px","--ck-tertiary-box-shadow":"inset 0 0 0 1px rgba(255, 255, 255, 0.02)","--ck-body-action-color":"#8B8F97","--ck-body-divider":"rgba(255,255,255,0.1)","--ck-body-color-danger":"#FF4E4E","--ck-body-color-valid":"#32D74B","--ck-body-disclaimer-background":"#2B2D31","--ck-body-disclaimer-box-shadow":"none","--ck-body-disclaimer-color":"#808183","--ck-body-disclaimer-link-color":"#AAABAD","--ck-body-disclaimer-link-hover-color":"#ffffff","--ck-copytoclipboard-stroke":"#CCCCCC","--ck-tooltip-background":"#1F2023","--ck-tooltip-background-secondary":"#1F2023","--ck-tooltip-color":"#ffffff","--ck-tooltip-shadow":" 0 0 0 1px rgba(255, 255, 255, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-spinner-color":"var(--ck-focus-color)","--ck-dropdown-button-color":"#6C7381","--ck-dropdown-button-box-shadow":"inset 0 0 0 1px rgba(255, 255, 255, 0.05)","--ck-dropdown-button-background":"#313235","--ck-dropdown-pending-color":"#8B8F97","--ck-dropdown-active-color":"#FFF","--ck-dropdown-active-static-color":"#FFF","--ck-dropdown-active-background":"rgba(255, 255, 255, 0.07)","--ck-dropdown-color":"#8B8F97","--ck-dropdown-background":"#313235","--ck-dropdown-box-shadow":"inset 0 0 0 1px rgba(255, 255, 255, 0.03)","--ck-dropdown-border-radius":"8px","--ck-alert-color":"#8B8F97","--ck-alert-background":"#404145","--ck-alert-box-shadow":"inset 0 0 0 1px rgba(255, 255, 255, 0.02)","--ck-qr-border-radius":"12px","--ck-qr-dot-color":"#ffffff","--ck-qr-border-color":"rgba(255,255,255,0.1)"},minimal:{"--ck-font-family":'"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol"',"--ck-border-radius":"0px","--ck-connectbutton-font-size":"17px","--ck-connectbutton-border-radius":"0px","--ck-connectbutton-color":"#414451","--ck-connectbutton-background":"#ffffff","--ck-connectbutton-box-shadow":"inset 0 0 0 1px #EBEBEB","--ck-connectbutton-hover-color":"#111","--ck-connectbutton-hover-box-shadow":"inset 0 0 0 1px #111","--ck-connectbutton-balance-color":"#111111","--ck-connectbutton-balance-background":"#F7F7F7","--ck-connectbutton-balance-box-shadow":"inset 0 0 0 1px #F7F7F7","--ck-connectbutton-balance-hover-background":"#f1f1f3","--ck-connectbutton-balance-hover-box-shadow":"inset 0 0 0 1px #111","--ck-primary-button-border-radius":"0px","--ck-primary-button-color":"#111111","--ck-primary-button-background":"#ffffff","--ck-primary-button-box-shadow":"inset 0 0 0 1px #EBEBEB","--ck-primary-button-hover-box-shadow":"inset 0 0 0 1px #111111","--ck-secondary-button-border-radius":"0px","--ck-secondary-button-color":"#111111","--ck-secondary-button-background":"#ffffff","--ck-secondary-button-box-shadow":"inset 0 0 0 1px #EBEBEB","--ck-secondary-button-hover-box-shadow":"inset 0 0 0 1px #111111","--ck-dropdown-button-color":"#999999","--ck-dropdown-button-box-shadow":"0 0 0 1px rgba(0, 0, 0, 0.01), 0px 0px 7px rgba(0, 0, 0, 0.05)","--ck-dropdown-button-background":"#fff","--ck-dropdown-button-hover-color":"#8B8B8B","--ck-dropdown-button-hover-background":"#E7E7E7","--ck-focus-color":"#1A88F8","--ck-modal-box-shadow":"0px 3px 16px rgba(0, 0, 0, 0.08)","--ck-body-color":"#111111","--ck-body-color-muted":"#A0A0A0","--ck-body-color-muted-hover":"#000000","--ck-body-background":"#ffffff","--ck-body-background-transparent":"rgba(255,255,255,0)","--ck-body-background-secondary":"#f6f7f9","--ck-body-background-secondary-hover-background":"#e0e4eb","--ck-body-background-secondary-hover-outline":"#4282FF","--ck-body-background-tertiary":"#ffffff","--ck-tertiary-border-radius":"0px","--ck-tertiary-box-shadow":"inset 0 0 0 1px rgba(0, 0, 0, 0.04)","--ck-body-action-color":"#A0A0A0","--ck-body-divider":"#EBEBEB","--ck-body-color-danger":"#FF4E4E","--ck-body-color-valid":"#32D74B","--ck-body-disclaimer-background":"#FAFAFA","--ck-body-disclaimer-box-shadow":"inset 0 1px 0 0 #ECECEC","--ck-body-disclaimer-color":"#9D9D9D","--ck-body-disclaimer-link-color":"#6E6E6E","--ck-body-disclaimer-link-hover-color":"#000000","--ck-copytoclipboard-stroke":"#CCCCCC","--ck-tooltip-border-radius":"0px","--ck-tooltip-background":"#ffffff","--ck-tooltip-background-secondary":"#ffffff","--ck-tooltip-color":"#999999","--ck-tooltip-shadow":"0px 2px 10px rgba(0, 0, 0, 0.08)","--ck-spinner-color":"var(--ck-focus-color)","--ck-dropdown-active-border-radius":"0","--ck-dropdown-box-shadow":"0px 2px 15px rgba(0, 0, 0, 0.15)","--ck-dropdown-border-radius":"0","--ck-alert-color":"rgba(17, 17, 17, 0.4)","--ck-alert-background":"#fff","--ck-alert-box-shadow":"inset 0 0 0 1px #EBEBEB","--ck-alert-border-radius":"0","--ck-qr-border-radius":"0px","--ck-qr-dot-color":"#111111","--ck-qr-border-color":"#EBEBEB","--ck-modal-h1-font-weight":"400","--ck-modal-heading-font-weight":"400","--ck-primary-button-font-weight":"400","--ck-siwe-border":"#EBEBEB"},rounded:{"--ck-font-family":'"Nunito",ui-rounded,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol"',"--ck-border-radius":"24px","--ck-connectbutton-font-size":"17px","--ck-connectbutton-font-weight":"700","--ck-connectbutton-border-radius":"14px","--ck-connectbutton-color":"#000000","--ck-connectbutton-background":"#ffffff","--ck-connectbutton-box-shadow":"inset 0 0 0 2px #DFE4EC, 0 2px 0 0 #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-connectbutton-hover-background":"#F9FAFB","--ck-connectbutton-balance-color":"#414451","--ck-connectbutton-balance-background":"#F9FAFB","--ck-connectbutton-balance-box-shadow":"0 2px 0 0 #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-connectbutton-balance-hover-background":"#F5F7F9","--ck-connectbutton-balance-hover-box-shadow":"0 2px 0 0 #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-connectbutton-balance-active-box-shadow":"0 0 0 0 #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-connectbutton-active-background":"#F5F7F9","--ck-connectbutton-active-box-shadow":"inset 0 0 0 2px #CFD7E2, 0 0px 0 0 #CFD7E2, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-primary-button-border-radius":"18px","--ck-primary-button-color":"#000000","--ck-primary-button-background":"#ffffff","--ck-primary-button-box-shadow":"inset 0 0 0 2px #DFE4EC, inset  0 -4px 0 0 #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-primary-button-hover-background":"#F5F7F9","--ck-primary-button-hover-box-shadow":"inset 0 0 0 2px #DFE4EC, inset  0 -2px 0 0 #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-secondary-button-border-radius":"16px","--ck-secondary-button-color":"#000000","--ck-secondary-button-background":"#ffffff","--ck-secondary-button-box-shadow":"inset 0 0 0 2px #DFE4EC, inset  0 -4px 0 0 #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-secondary-button-hover-background":"#F5F7F9","--ck-secondary-button-hover-box-shadow":"inset 0 0 0 2px #DFE4EC, inset  0 -2px 0 0 #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-focus-color":"#1A88F8","--ck-modal-box-shadow":"0px 3px 16px rgba(0, 0, 0, 0.08)","--ck-body-color":"#000000","--ck-body-color-muted":"#93989F","--ck-body-color-muted-hover":"#000000","--ck-body-background":"#ffffff","--ck-body-background-transparent":"rgba(255,255,255,0)","--ck-body-background-secondary":"#f6f7f9","--ck-body-background-secondary-hover-background":"#e0e4eb","--ck-body-background-secondary-hover-outline":"#4282FF","--ck-body-background-tertiary":"#ffffff","--ck-tertiary-border-radius":"22px","--ck-tertiary-box-shadow":"inset 0 0 0 2px #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-body-action-color":"#93989F","--ck-body-divider":"#DFE4EC","--ck-body-color-danger":"#FF4E4E","--ck-body-color-valid":"#32D74B","--ck-body-disclaimer-background":"#F9FAFB","--ck-body-disclaimer-font-size":"14px","--ck-body-disclaimer-font-weight":"700","--ck-body-disclaimer-color":"#959697","--ck-body-disclaimer-link-color":"#646464","--ck-body-disclaimer-link-hover-color":"#000000","--ck-copytoclipboard-stroke":"#CCCCCC","--ck-tooltip-background":"#ffffff","--ck-tooltip-background-secondary":"#ffffff","--ck-tooltip-color":"#999999","--ck-tooltip-shadow":" 0 0 0 2px #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-spinner-color":"var(--ck-focus-color)","--ck-dropdown-button-color":"#999999","--ck-dropdown-button-box-shadow":"0 0 0 2px #DFE4EC,  0 2px 0 2px #DFE4EC, 0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-dropdown-button-background":"#fff","--ck-dropdown-button-hover-color":"#8B8B8B","--ck-dropdown-button-hover-background":"#F5F7F9","--ck-dropdown-pending-color":"#848D9A","--ck-dropdown-active-color":"#000000","--ck-dropdown-active-static-color":"#848D9A","--ck-dropdown-active-background":"#F5F7F9","--ck-dropdown-color":"#848D9A","--ck-dropdown-background":"#FFFFFF","--ck-dropdown-box-shadow":"0px 2px 15px rgba(0, 0, 0, 0.15)","--ck-dropdown-border-radius":"16px","--ck-alert-color":"#848D9A","--ck-alert-background":"#F5F7F9","--ck-qr-border-radius":"24px","--ck-qr-dot-color":"#111111","--ck-qr-border-color":"#DFE4EC","--ck-modal-h1-font-weight":"700","--ck-modal-heading-font-weight":"700","--ck-primary-button-font-weight":"700","--ck-siwe-border":"#DFE4EC"},nouns:{"--ck-font-family":'"PT Root UI",ui-rounded,"Nunito",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol"',"--ck-border-radius":"24px","--ck-connectbutton-font-size":"16px","--ck-connectbutton-font-weight":"700","--ck-connectbutton-border-radius":"10px","--ck-connectbutton-color":"#151C3B","--ck-connectbutton-background":"#ffffff","--ck-connectbutton-box-shadow":"inset 0 0 0 1px #D6D8E1","--ck-connectbutton-hover-background":"#E9EBF3","--ck-connectbutton-hover-box-shadow":"inset 0 0 0 1px #D4D8E8","--ck-connectbutton-active-background":"#D4D8E8","--ck-connectbutton-active-box-shadow":"inset 0 0 0 1px #D4D8E8","--ck-connectbutton-balance-color":"#373737","--ck-connectbutton-balance-background":"#F6F7F9","--ck-connectbutton-balance-box-shadow":"none","--ck-connectbutton-balance-hover-background":"#f1f1f3","--ck-primary-button-border-radius":"16px","--ck-primary-button-color":"#151C3B","--ck-primary-button-background":"#ffffff","--ck-primary-button-font-weight":"700","--ck-primary-button-hover-background":"#DEE1ED","--ck-secondary-button-border-radius":"16px","--ck-secondary-button-color":"#151C3B","--ck-secondary-button-background":"#ffffff","--ck-secondary-button-font-weight":"700","--ck-secondary-button-hover-background":"#DEE1ED","--ck-focus-color":"#1A88F8","--ck-modal-box-shadow":"0px 2px 4px rgba(0, 0, 0, 0.02)","--ck-overlay-background":"rgba(213, 215, 225, 0.8)","--ck-overlay-backdrop-filter":"blur(6px)","--ck-body-color":"#151C3B","--ck-body-color-muted":"#757A8E","--ck-body-color-muted-hover":"#000000","--ck-body-background":"#F4F4F8","--ck-body-background-transparent":"rgba(255,255,255,0)","--ck-body-background-secondary":"#E9E9F1","--ck-body-background-secondary-hover-background":"#e0e4eb","--ck-body-background-tertiary":"#E9E9F1","--ck-tertiary-border-radius":"24px","--ck-body-action-color":"#79809C","--ck-body-divider":"#D9DBE3","--ck-body-color-danger":"#FF4E4E","--ck-body-color-valid":"#32D74B","--ck-body-disclaimer-background":"#F9FAFA","--ck-body-disclaimer-color":"#AFB1B6","--ck-body-disclaimer-link-color":"#787B84","--ck-body-disclaimer-link-hover-color":"#000000","--ck-copytoclipboard-stroke":"#79809C","--ck-tooltip-background":"#ffffff","--ck-tooltip-background-secondary":"#ffffff","--ck-tooltip-color":"#999999","--ck-tooltip-shadow":"0px 2px 10px rgba(0, 0, 0, 0.08)","--ck-spinner-color":"var(--ck-focus-color)","--ck-dropdown-button-color":"#999999","--ck-dropdown-button-box-shadow":"0 0 0 1px rgba(0, 0, 0, 0.01), 0px 0px 7px rgba(0, 0, 0, 0.05)","--ck-dropdown-button-background":"#fff","--ck-dropdown-button-hover-color":"#8B8B8B","--ck-dropdown-button-hover-background":"#DEE1ED","--ck-dropdown-button-hover-box-shadow":"0px 0px 7px rgba(0, 0, 0, 0.05)","--ck-dropdown-color":"#757A8E","--ck-dropdown-box-shadow":"0 0 0 1px rgba(0, 0, 0, 0.01), 0px 0px 7px rgba(0, 0, 0, 0.05)","--ck-alert-color":"#9196A1","--ck-alert-background":"#F6F8FA","--ck-alert-box-shadow":"inset 0 0 0 1px rgba(0, 0, 0, 0.04)","--ck-alert-border-radius":"8px","--ck-qr-border-radius":"24px","--ck-qr-dot-color":"#000000","--ck-qr-background":"#ffffff","--ck-siwe-border":"#DFE4EC","--ck-graphic-primary-background":"#fff","--ck-graphic-compass-background":"#fff","--ck-graphic-primary-box-shadow":"0px 2.94737px 14.7368px rgba(0, 0, 0, 0.1)","--ck-graphic-compass-box-shadow":"0px 2px 9px rgba(0, 0, 0, 0.15)"}};let on={default:{"--ck-font-family":`-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica,
    'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji',
    'Segoe UI Symbol'`,"--ck-border-radius":"20px","--ck-secondary-button-border-radius":"16px"},graphics:{light:{"--ck-graphic-wave-stop-01":"#E8F17D","--ck-graphic-wave-stop-02":"#A8ECDE","--ck-graphic-wave-stop-03":"#7AA1F2","--ck-graphic-wave-stop-04":"#DEA1E8","--ck-graphic-wave-stop-05":"#F46D98","--ck-graphic-scaniconwithlogos-01":"#4E4E4E","--ck-graphic-scaniconwithlogos-02":"#272727","--ck-graphic-scaniconwithlogos-03":"#F8D74A","--ck-graphic-scaniconwithlogos-04":"#F6F7F9","--ck-chain-ethereum-01":"#25292E","--ck-chain-ethereum-02":"#fff","--ck-chain-ethereum-03":"#DFE0E0"},dark:{"--ck-graphic-wave-stop-01":"#E8F17D","--ck-graphic-wave-stop-02":"#A8ECDE","--ck-graphic-wave-stop-03":"#7AA1F2","--ck-graphic-wave-stop-04":"#DEA1E8","--ck-graphic-wave-stop-05":"#F46D98","--ck-graphic-scaniconwithlogos-01":"#AFAFAF","--ck-graphic-scaniconwithlogos-02":"#696969","--ck-graphic-scaniconwithlogos-03":"#F8D74A","--ck-graphic-scaniconwithlogos-04":"#3D3D3D"}},ens:{light:{"--ck-ens-01-start":"#FF3B30","--ck-ens-01-stop":"#FF9500","--ck-ens-02-start":"#FF9500","--ck-ens-02-stop":"#FFCC00","--ck-ens-03-start":"#FFCC00","--ck-ens-03-stop":"#34C759","--ck-ens-04-start":"#5856D6","--ck-ens-04-stop":"#AF52DE","--ck-ens-05-start":"#5AC8FA","--ck-ens-05-stop":"#007AFF","--ck-ens-06-start":"#007AFF","--ck-ens-06-stop":"#5856D6","--ck-ens-07-start":"#5856D6","--ck-ens-07-stop":"#AF52DE","--ck-ens-08-start":"#AF52DE","--ck-ens-08-stop":"#FF2D55"},dark:{"--ck-ens-01-start":"#FF453A","--ck-ens-01-stop":"#FF9F0A","--ck-ens-02-start":"#FF9F0A","--ck-ens-02-stop":"#FFD60A","--ck-ens-03-start":"#FFD60A","--ck-ens-03-stop":"#32D74B","--ck-ens-04-start":"#32D74B","--ck-ens-04-stop":"#64D2FF","--ck-ens-05-start":"#64D2FF","--ck-ens-05-stop":"#0A84FF","--ck-ens-06-start":"#0A84FF","--ck-ens-06-stop":"#5E5CE6","--ck-ens-07-start":"#5E5CE6","--ck-ens-07-stop":"#BF5AF2","--ck-ens-08-start":"#BF5AF2","--ck-ens-08-stop":"#FF2D55"}},brand:{"--ck-family-brand":"#1A88F8","--ck-brand-walletConnect":"#3B99FC","--ck-brand-coinbaseWallet":"#0052FF","--ck-brand-metamask":"#f6851b","--ck-brand-metamask-01":"#F6851B","--ck-brand-metamask-02":"#E2761B","--ck-brand-metamask-03":"#CD6116","--ck-brand-metamask-04":"#161616","--ck-brand-metamask-05":"#763D16","--ck-brand-metamask-06":"#D7C1B3","--ck-brand-metamask-07":"#C0AD9E","--ck-brand-metamask-08":"#E4761B","--ck-brand-metamask-09":"#233447","--ck-brand-metamask-10":"#E4751F","--ck-brand-metamask-11":"#FEF5E7","--ck-brand-metamask-12":"#E3C8AB","--ck-brand-trust-01":"#3375BB","--ck-brand-trust-02":"#ffffff","--ck-brand-trust-01b":"#ffffff","--ck-brand-trust-02b":"#3375BB","--ck-brand-argent":"#f36a3d","--ck-brand-imtoken-01":"#11C4D1","--ck-brand-imtoken-02":"#0062AD"}},hexToP3=o=>{let e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(o);if(null==e)return o;let t={r:parseInt(e[1],16),g:parseInt(e[2],16),b:parseInt(e[3],16)};return`color(display-p3 ${t.r/255} ${t.g/255} ${t.b/255})`},createCssVars=(o,e)=>d.iv`
    ${Object.keys(o).map(e=>{let t=o[e];return t&&`${e}:${t};`})}
  `,oa={light:or.base.light,dark:or.base.dark,web95:or.web95,retro:or.retro,soft:or.soft,midnight:or.midnight,minimal:or.minimal,rounded:or.rounded,nouns:or.nouns},createCssColors=(o,e)=>{let t=e?" !important":"";return d.iv`
    ${Object.keys(o).map(e=>{let r=o[e];return r&&`${e}:${r}${t};`})}
    @supports (color: color(display-p3 1 1 1)) {
      ${Object.keys(o).map(e=>{let r=o[e];return`${e}:${hexToP3(r)}${t};`})}
    }
  `},oi={default:createCssVars(on.default),light:createCssColors(oa.light),dark:createCssColors(oa.dark),web95:createCssColors(oa.web95),retro:createCssColors(oa.retro),soft:createCssColors(oa.soft),midnight:createCssColors(oa.midnight),minimal:createCssColors(oa.minimal),rounded:createCssColors(oa.rounded),nouns:createCssColors(oa.nouns)},oc={brand:createCssVars(on.brand),ensLight:createCssVars(on.ens.light),ensDark:createCssVars(on.ens.dark),graphicsLight:createCssVars(on.graphics.light),graphicsDark:createCssVars(on.graphics.dark)},os=d.iv`
  ${oc.brand}
  ${oc.ensLight}
  ${oc.graphicsLight}
`,od=d.iv`
  ${oc.brand}
  ${oc.ensDark}
  ${oc.graphicsDark}
`,ol="auto",op=w(a.E.div)`
  ${oi.default}

  ${o=>{switch(o.$useTheme){case"web95":return ol="light",oi.web95;case"retro":return ol="light",oi.retro;case"soft":return ol="light",oi.soft;case"midnight":return ol="dark",oi.midnight;case"minimal":return ol="light",oi.minimal;case"rounded":return ol="light",oi.rounded;case"nouns":return ol="light",oi.nouns;default:if("light"===o.$useMode)return ol="light",oi.light;if("dark"===o.$useMode)return ol="dark",oi.dark;return d.iv`
            @media (prefers-color-scheme: light) {
              ${oi.light}
            }
            @media (prefers-color-scheme: dark) {
              ${oi.dark}
            }
          `}}}

  ${o=>{switch(ol){case"light":return os;case"dark":return od;default:return d.iv`
          ${os}
          @media (prefers-color-scheme: dark) {
            ${od}
          }
        `}}}


  ${o=>{if(o.$customTheme)return createCssColors(o.$customTheme,!0)}}

  all: initial;
  text-align: left;
  text-direction: ltr;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-text-stroke: 0.001px transparent;
  text-size-adjust: none;
  font-size: 16px;

  button {
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-text-stroke: 0.001px transparent;
  }

  &,
  * {
    font-family: var(--ck-font-family);
    box-sizing: border-box;
    outline: none;
    border: none;
  }
  /*
  @media (prefers-reduced-motion) {
    * {
      animation-duration: 60ms !important;
      transition-duration: 60ms !important;
    }
  }
  */
  img,
  svg {
    max-width: 100%;
  }
  strong {
    font-weight: 600;
  }
  a:focus-visible,
  button:focus,
  button:focus-visible {
    outline: none;
  }
`,InfoIcon=({...o})=>(0,r.jsx)("svg",{"aria-hidden":"true",width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",xmlns:"http://www.w3.org/2000/svg",...o,children:(0,r.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M20 11C20 15.9706 15.9706 20 11 20C6.02944 20 2 15.9706 2 11C2 6.02944 6.02944 2 11 2C15.9706 2 20 6.02944 20 11ZM22 11C22 17.0751 17.0751 22 11 22C4.92487 22 0 17.0751 0 11C0 4.92487 4.92487 0 11 0C17.0751 0 22 4.92487 22 11ZM11.6445 12.7051C11.6445 13.1348 11.3223 13.4678 10.7744 13.4678C10.2266 13.4678 9.92578 13.1885 9.92578 12.6191V12.4795C9.92578 11.4268 10.4951 10.8574 11.2686 10.3203C12.2031 9.67578 12.665 9.32129 12.665 8.59082C12.665 7.76367 12.0205 7.21582 11.043 7.21582C10.3232 7.21582 9.80762 7.57031 9.45312 8.16113C9.38282 8.24242 9.32286 8.32101 9.2667 8.39461C9.04826 8.68087 8.88747 8.8916 8.40039 8.8916C8.0459 8.8916 7.66992 8.62305 7.66992 8.15039C7.66992 7.96777 7.70215 7.7959 7.75586 7.61328C8.05664 6.625 9.27051 5.75488 11.1182 5.75488C12.9336 5.75488 14.5234 6.71094 14.5234 8.50488C14.5234 9.7832 13.7822 10.417 12.7402 11.1045C11.999 11.5986 11.6445 11.9746 11.6445 12.5762V12.7051ZM11.9131 15.5625C11.9131 16.1855 11.376 16.6797 10.7529 16.6797C10.1299 16.6797 9.59277 16.1748 9.59277 15.5625C9.59277 14.9395 10.1191 14.4453 10.7529 14.4453C11.3867 14.4453 11.9131 14.9287 11.9131 15.5625Z",fill:"currentColor"})}),CloseIcon=({...o})=>(0,r.jsxs)(a.E.svg,{width:14,height:14,viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg",...o,children:[(0,r.jsx)("path",{d:"M1 13L13 1",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"}),(0,r.jsx)("path",{d:"M1 0.999999L13 13",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"})]}),BackIcon=({...o})=>(0,r.jsx)(a.E.svg,{width:9,height:16,viewBox:"0 0 9 16",fill:"none",xmlns:"http://www.w3.org/2000/svg",...o,children:(0,r.jsx)("path",{d:"M8 1L1 8L8 15",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})}),ou={initial:{zIndex:2,opacity:0},animate:{opacity:1,scale:1,transition:{duration:.165,delay:.055,ease:[.26,.08,.25,1]}},exit:{zIndex:1,opacity:0,pointerEvents:"none",position:"absolute",left:["50%","50%"],x:["-50%","-50%"],transition:{duration:.22,ease:[.26,.08,.25,1]}}},ob={CONNECTORS:"CONNECTORS",PROFILE:"PROFILE",CONNECT:"CONNECT"},Modal=({open:o,pages:e,pageId:t,positionInside:c,inline:s,onClose:d,onBack:p,onInfo:u})=>{let b=useConnectSettingContext(),x=isMobile(),[k,h]=(0,l.Y)({timeout:160,preEnter:!0,mountOnEnter:!0,unmountOnExit:!0}),f=!("exited"===k||"unmounted"===k),g="preEnter"===k||"exiting"!==k,v=b.route===ob.CONNECTORS?0:1,C=function(o,e){let t=(0,n.useRef)({target:o,previous:e});return t.current.target!==o&&(t.current.previous=t.current.target,t.current.target=o),t.current.previous}(v,v);(0,n.useEffect)(()=>{h(o),o&&F(void 0)},[o]);let[m,y]=(0,n.useState)({width:void 0,height:void 0}),[w,F]=(0,n.useState)(void 0),updateBounds=o=>{let e={width:null==o?void 0:o.offsetWidth,height:null==o?void 0:o.offsetHeight};y({width:`${null==e?void 0:e.width}px`,height:`${null==e?void 0:e.height}px`})},E=(0,n.useRef)(null),A=(0,n.useRef)(),D=(0,n.useCallback)(o=>{o&&(E.current=o,F(void 0!==w),clearTimeout(A.current),A.current=setTimeout(()=>F(!1),360),updateBounds(o))},[w,A,E]);(0,n.useEffect)(()=>{E.current&&updateBounds(E.current)},[x]),(0,n.useEffect)(()=>{if(!f){y({width:void 0,height:void 0});return}let listener=o=>{"Escape"===o.key&&d&&d()};return document.addEventListener("keydown",listener),()=>{document.removeEventListener("keydown",listener)}},[f,d]);let B={"--height":m.height,"--width":m.width},L=(0,r.jsx)(op,{$useTheme:b.theme,$useMode:b.mode,$customTheme:b.customTheme,children:(0,r.jsxs)(X,{role:"dialog",style:{pointerEvents:g?"auto":"none",position:c?"absolute":void 0},children:[!s&&(0,r.jsx)(P,{$active:g,onClick:d}),(0,r.jsxs)(Y,{style:B,initial:!1,children:[(0,r.jsx)("div",{style:{pointerEvents:w?"all":"none",position:"absolute",top:0,bottom:0,left:"50%",transform:"translateX(-50%)",width:"var(--width)",zIndex:9,transition:"width 200ms ease"}}),(0,r.jsxs)(R,{className:`${g&&"active"}`,children:[(0,r.jsx)(i.M,{initial:!1,children:b.errorMessage&&(0,r.jsxs)(j,{initial:{y:"10%",x:"-50%"},animate:{y:"-100%"},exit:{y:"100%"},transition:{duration:.2,ease:"easeInOut"},children:[(0,r.jsx)("span",{children:b.errorMessage}),(0,r.jsx)("div",{onClick:()=>console.log("click"),style:{position:"absolute",right:24,top:24},children:(0,r.jsx)(CloseIcon,{})})]})}),(0,r.jsxs)(Z,{children:[d&&(0,r.jsx)(J,{"aria-label":"close",onClick:d,children:(0,r.jsx)(CloseIcon,{})}),(0,r.jsx)("div",{style:{position:"absolute",top:23,left:20,width:32,height:32},children:(0,r.jsx)(i.M,{children:p?(0,r.jsx)(K,{disabled:w,"aria-label":"back",onClick:p,initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:x?0:.1,delay:x?.01:0},children:(0,r.jsx)(BackIcon,{})},"backButton"):b.route===ob.PROFILE&&u&&(0,r.jsx)(Q,{disabled:w,"aria-label":"more info",onClick:u,initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:x?0:.1,delay:x?.01:0},children:(0,r.jsx)(InfoIcon,{})},"infoButton")})})]}),(0,r.jsx)(I,{children:(0,r.jsx)(i.M,{children:(0,r.jsx)(a.E.div,{style:{position:"absolute",top:0,bottom:0,left:52,right:52,display:"flex",justifyContent:"center"},initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:x?0:.17,delay:x?.01:0},children:(0,r.jsx)(ot,{children:function(){switch(b.route){case ob.CONNECTORS:return"Connectors";case ob.PROFILE:return"Profile";default:return""}}()})},`${b.route}-''}`)})}),(0,r.jsx)(V,{children:e.map(({id:o,content:e})=>(0,r.jsx)(Page,{open:o===t,initial:!c&&"entered"!==k,enterAnim:o===t?v>C?"active-scale-up":"active":"",exitAnim:o!==t?v<C?"exit-scale-down":"exit":"",children:(0,r.jsx)(q,{ref:D,style:{pointerEvents:o===t&&g?"auto":"none"},children:e},`inner-${o}`)},o))})]})]})]})});return(0,r.jsx)(r.Fragment,{children:f&&(0,r.jsx)(r.Fragment,{children:c?L:(0,r.jsx)(r.Fragment,{children:(0,r.jsx)(Portal,{children:(0,r.jsx)(FocusTrap,{children:L})})})})})},Page=({children:o,open:e,initial:t,enterAnim:a,exitAnim:i})=>{let[c,s]=(0,l.Y)({timeout:400,preEnter:!0,initialEntered:e,mountOnEnter:!0,unmountOnExit:!0});return((0,n.useEffect)(()=>{s(e)},[e]),"exited"===c||"unmounted"===c)?null:(0,r.jsx)(G,{className:`${"preEnter"===c||"exiting"!==c?a:i}`,style:{animationDuration:t?"0ms":void 0,animationDelay:t?"0ms":void 0},children:o})},OrDivider=({children:o})=>(0,r.jsx)(O,{children:(0,r.jsx)("span",{children:null!=o?o:"or"})});var ox={AlephiumIcon:({...o})=>(0,r.jsx)("svg",{...o,version:"1.0",xmlns:"http://www.w3.org/2000/svg",width:"36.000000pt",height:"36.000000pt",viewBox:"0 0 108.000000 108.000000",preserveAspectRatio:"xMidYMid meet",children:(0,r.jsxs)("g",{transform:"translate(0.000000,108.000000) scale(0.100000,-0.100000)",fill:"#000000",stroke:"none",children:[(0,r.jsx)("path",{d:"M655 871 l-30 -6 -3 -108 -3 -109 31 6 c16 3 44 9 60 12 l30 6 0 104\n0 104 -27 -1 c-16 -1 -41 -4 -58 -8z"}),(0,r.jsx)("path",{d:"M381 831 c-19 -3 -36 -10 -37 -16 -2 -5 54 -136 124 -290 l128 -280\n64 3 c35 1 68 6 73 11 5 5 -48 133 -120 292 l-129 284 -34 1 c-19 1 -50 -1\n-69 -5z"}),(0,r.jsx)("path",{d:"M390 426 l-55 -11 -3 -114 -3 -114 52 7 c90 12 90 12 87 133 -2 60\n-7 107 -13 109 -5 1 -35 -3 -65 -10z"})]})}),WalletConnect:({background:o=!1,...e})=>(0,r.jsx)("svg",{...e,"aria-hidden":"true",width:"32",height:"32",viewBox:"0 0 32 32",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:o?{background:"var(--ck-brand-walletConnect)"}:void 0,children:(0,r.jsx)("path",{d:"M9.58818 11.8556C13.1293 8.31442 18.8706 8.31442 22.4117 11.8556L22.8379 12.2818C23.015 12.4588 23.015 12.7459 22.8379 12.9229L21.3801 14.3808C21.2915 14.4693 21.148 14.4693 21.0595 14.3808L20.473 13.7943C18.0026 11.3239 13.9973 11.3239 11.5269 13.7943L10.8989 14.4223C10.8104 14.5109 10.6668 14.5109 10.5783 14.4223L9.12041 12.9645C8.94336 12.7875 8.94336 12.5004 9.12041 12.3234L9.58818 11.8556ZM25.4268 14.8706L26.7243 16.1682C26.9013 16.3452 26.9013 16.6323 26.7243 16.8093L20.8737 22.6599C20.6966 22.8371 20.4096 22.8371 20.2325 22.6599L16.0802 18.5076C16.0359 18.4634 15.9641 18.4634 15.9199 18.5076L11.7675 22.6599C11.5905 22.8371 11.3034 22.8371 11.1264 22.66C11.1264 22.66 11.1264 22.6599 11.1264 22.6599L5.27561 16.8092C5.09856 16.6322 5.09856 16.3451 5.27561 16.168L6.57313 14.8706C6.75019 14.6934 7.03726 14.6934 7.21431 14.8706L11.3668 19.023C11.411 19.0672 11.4828 19.0672 11.5271 19.023L15.6793 14.8706C15.8563 14.6934 16.1434 14.6934 16.3205 14.8706L20.473 19.023C20.5172 19.0672 20.589 19.0672 20.6332 19.023L24.7856 14.8706C24.9627 14.6935 25.2498 14.6935 25.4268 14.8706Z",fill:o?"white":"var(--ck-brand-walletConnect)"})})};let ok=[];"undefined"!=typeof window&&(ok=[{id:"injected",name:"Extension Wallet",shortName:"Browser",logos:{default:(0,r.jsx)(ox.AlephiumIcon,{}),mobile:(0,r.jsx)("div",{style:{padding:5,background:"var(--ck-body-background-tertiary)",borderRadius:"27%",boxShadow:"inset 0 0 0 1px rgba(0, 0, 0, 0.02)"},children:(0,r.jsx)("div",{style:{transform:"scale(0.75)",position:"relative",width:"100%"},children:(0,r.jsx)(ox.AlephiumIcon,{})})}),transparent:(0,r.jsx)(ox.AlephiumIcon,{})},scannable:!1,extensionIsInstalled:()=>!!window.alephiumProviders},{id:"desktopWallet",name:"Desktop wallet",shortName:"Desktop wallet",logos:{default:(0,r.jsx)(ox.AlephiumIcon,{}),mobile:(0,r.jsx)("div",{style:{padding:5,background:"var(--ck-body-background-tertiary)",borderRadius:"27%",boxShadow:"inset 0 0 0 1px rgba(0, 0, 0, 0.02)"},children:(0,r.jsx)("div",{style:{transform:"scale(0.75)",position:"relative",width:"100%"},children:(0,r.jsx)(ox.AlephiumIcon,{})})}),transparent:(0,r.jsx)(ox.AlephiumIcon,{})},scannable:!1},{id:"walletConnect",name:"WalletConnect",shortName:"WalletConnect",logos:{default:(0,r.jsx)(ox.WalletConnect,{}),mobile:(0,r.jsx)("div",{style:{padding:5,background:"var(--ck-body-background-secondary)",borderRadius:"21%",boxShadow:"inset 0 0 0 1px rgba(0, 0, 0, 0.02)"},children:(0,r.jsx)(ox.WalletConnect,{})}),transparent:(0,r.jsx)(ox.WalletConnect,{background:!1}),connectorButton:(0,r.jsx)(ox.WalletConnect,{}),qrCode:(0,r.jsx)(ox.WalletConnect,{background:!0})},logoBackground:"var(--ck-brand-walletConnect)",scannable:!0}]);var oh=ok;let of=w(a.E.div)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 0 16px;
`,og=w(a.E.button)`
  cursor: pointer;
  user-select: none;
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 20px;
  width: 100%;
  height: 64px;
  font-size: 17px;
  font-weight: var(--ck-primary-button-font-weight, 500);
  line-height: 20px;
  text-align: var(--ck-body-button-text-align, left);
  transition: 180ms ease;
  transition-property: background, color, box-shadow, transform;
  will-change: transform, box-shadow, background-color, color;

  --fallback-color: var(--ck-primary-button-color);
  --fallback-background: var(--ck-primary-button-background);
  --fallback-box-shadow: var(--ck-primary-button-box-shadow);
  --fallback-border-radius: var(--ck-primary-button-border-radius);

  --color: var(--ck-primary-button-color, var(--fallback-color));
  --background: var(--ck-primary-button-background, var(--fallback-background));
  --box-shadow: var(--ck-primary-button-box-shadow, var(--fallback-box-shadow));
  --border-radius: var(--ck-primary-button-border-radius, var(--fallback-border-radius));

  --hover-color: var(--ck-primary-button-hover-color, var(--color));
  --hover-background: var(--ck-primary-button-hover-background, var(--background));
  --hover-box-shadow: var(--ck-primary-button-hover-box-shadow, var(--box-shadow));
  --hover-border-radius: var(--ck-primary-button-hover-border-radius, var(--border-radius));

  --active-color: var(--ck-primary-button-active-color, var(--hover-color));
  --active-background: var(--ck-primary-button-active-background, var(--hover-background));
  --active-box-shadow: var(--ck-primary-button-active-box-shadow, var(--hover-box-shadow));
  --active-border-radius: var(--ck-primary-button-active-border-radius, var(--hover-border-radius));

  color: var(--color);
  background: var(--background);
  box-shadow: var(--box-shadow);
  border-radius: var(--border-radius);

  &:disabled {
    transition: 180ms ease;
  }

  &:not(:disabled) {
    &:hover {
      color: var(--hover-color);
      background: var(--hover-background);
      box-shadow: var(--hover-box-shadow);
      border-radius: var(--hover-border-radius);
    }
    &:focus-visible {
      transition-duration: 100ms;
      color: var(--hover-color);
      background: var(--hover-background);
      box-shadow: var(--hover-box-shadow);
      border-radius: var(--hover-border-radius);
    }
    &:active {
      color: var(--active-color);
      background: var(--active-background);
      box-shadow: var(--active-box-shadow);
      border-radius: var(--active-border-radius);
    }
  }
`,ov=w(a.E.span)`
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-right: 38px;
`,oC=w(a.E.div)`
  position: absolute;
  right: 20px;
  width: 32px;
  height: 32px;
  overflow: hidden;
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
`,om=w(a.E.div)`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 0 28px;
  margin: 0 0;
`,oy=w(a.E.button)`
  --background: var(--ck-body-background-secondary);
  cursor: pointer;
  user-select: none;
  position: relative;
  padding: 0;
  width: 100%;
  min-width: 25%;
  font-size: 13px;
  font-weight: 500;
  line-height: 13px;
  text-align: center;
  transition: transform 100ms ease;

  background: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &:not(:disabled) {
    &:active {
      transform: scale(0.97);
    }
  }
`,ow=w(a.E.span)`
  display: block;
  padding: 10px 0 0;
  color: var(--ck-body-color);
  opacity: 0.75;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`,oF=w(a.E.div)`
  margin: 0 auto;
  width: 60px;
  height: 60px;
  overflow: hidden;
  svg {
    border-radius: inherit;
    display: block;
    position: relative;
    transform: translate3d(0, 0, 0);
    width: 100%;
    height: 100%;
  }
`,desktopWallet=()=>{let o=oh.find(o=>"desktopWallet"===o.id);if(!o)throw Error("Desktop wallet connector configuration not found");return o},injected=o=>{let e="undefined"!=typeof window,t=isMobile()&&!e;return{id:"injected",name:"Extension Wallet",shortName:"browser",scannable:!1,logos:{default:(0,r.jsx)(ox.AlephiumIcon,{})},installed:!!(!t&&e)}},walletConnect=o=>({id:"walletConnect",name:"Other Wallets",logos:{default:(0,r.jsx)(ox.WalletConnect,{}),mobile:(0,r.jsx)(ox.WalletConnect,{}),transparent:(0,r.jsx)(ox.WalletConnect,{background:!1}),connectorButton:(0,r.jsx)(ox.WalletConnect,{}),qrCode:(0,r.jsx)(ox.WalletConnect,{background:!0})},logoBackground:"var(--ck-brand-walletConnect)",scannable:!0}),getWallets=({})=>[injected(),walletConnect(),desktopWallet()],Connectors=()=>{let o=useConnectSettingContext(),e=isMobile(),t=getWallets({}),a=(0,n.useMemo)(()=>e?oh.filter(o=>"desktopWallet"!==o.id):oh,[e]);return(0,r.jsx)(S,{style:{width:312},children:e?(0,r.jsx)(r.Fragment,{children:(0,r.jsx)(om,{children:a.map(e=>{var n,i,c,s,d;let l=a.filter(o=>o.id===e.id)[0];if(!l)return null;let p=l.logos,u=null!==(i=null!==(n=l.shortName)&&void 0!==n?n:l.name)&&void 0!==i?i:e.name;if("injected"===l.id&&e.name){let o=findInjectedConnectorInfo(e.name,t);o&&(p=o.logos,u=o.name.replace(" Wallet",""))}return"walletConnect"===l.id?u="Wallet Connect":"desktopWallet"===l.id&&(u="Desktop wallet"),(0,r.jsxs)(oy,{onClick:()=>{o.setRoute(ob.CONNECT),o.setConnectorId(e.id)},children:[(0,r.jsx)(oF,{children:null!==(d=null!==(s=null!==(c=p.mobile)&&void 0!==c?c:p.appIcon)&&void 0!==s?s:p.connectorButton)&&void 0!==d?d:p.default}),(0,r.jsx)(ow,{children:u})]},`m-${e.id}`)})})}):(0,r.jsx)(r.Fragment,{children:(0,r.jsx)(of,{children:a.map(e=>{var n,i;let c=a.filter(o=>o.id===e.id)[0];if(!c)return null;let s=c.logos,d=null!==(n=c.name)&&void 0!==n?n:e.name;if("walletConnect"===c.id?d="WalletConnect":"desktopWallet"===c.id&&(d="Desktop wallet"),"injected"===c.id&&e.name){let o=findInjectedConnectorInfo(e.name,t);o&&(s=o.logos,d=o.name)}let l=null!==(i=s.connectorButton)&&void 0!==i?i:s.default;return c.extensionIsInstalled&&s.appIcon&&c.extensionIsInstalled()&&(l=s.appIcon),(0,r.jsxs)(og,{disabled:o.route!==ob.CONNECTORS,onClick:()=>{o.setRoute(ob.CONNECT),o.setConnectorId(e.id)},children:[(0,r.jsx)(oC,{children:l}),(0,r.jsx)(ov,{children:d})]},e.id)})})})})},findInjectedConnectorInfo=(o,e)=>{let t=o.split(/[(),]+/);t.shift(),t=t.map(o=>o.trim());let r=t.filter(o=>{let t=e.map(o=>o.name).includes(o);return t?o:null});if(0===r.length)return null;let n=e.filter(o=>o.installed&&o.name===r[0])[0];return n},oj=w(a.E.div)`
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  left: 0;
  right: 0;
  ${M} {
    padding: 0 8px 32px;
    gap: 12px;
  }
`,oE=d.F4`
  0%{ transform:none; }
  25%{ transform:translateX(${2}px); }
  50%{ transform:translateX(-${2}px); }
  75%{ transform:translateX(${2}px); }
  100%{ transform:none; }
`,oA=d.F4`
  0%{ opacity:1; }
  100%{ opacity:0; }
`,oD=w(a.E.div)`
  /*
  background: var(
    --ck-body-background
  ); // To stop the overlay issue during transition for the squircle spinner
  */
`,oB=w(a.E.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto 16px;
  height: 120px;
  //transform: scale(1.001); // fixes shifting issue between states
`,oL=w(a.E.div)`
  user-select: none;
  position: relative;
  --spinner-error-opacity: 0;
  &:before {
    content: '';
    position: absolute;
    inset: -5px;
    opacity: 0;
    background: var(--ck-body-color-danger);
    ${o=>o.$circle&&d.iv`
        border-radius: 50%;
        background: none;
        box-shadow: inset 0 0 0 3.5px var(--ck-body-color-danger);
      `}
  }
  ${o=>o.$shake&&d.iv`
      animation: ${oE} 220ms ease-out both;
      &:before {
        animation: ${oA} 220ms ease-out 750ms both;
      }
    `}
`,o_=w(a.E.button)`
  z-index: 5;
  appearance: none;
  position: absolute;
  right: 2px;
  bottom: 2px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  background: none;

  color: var(--ck-body-background);
  transition: color 200ms ease;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);

  &:before {
    z-index: 3;
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 200ms ease;
    background: var(--ck-body-color);
  }

  &:hover:before {
    opacity: 0.1;
  }
`,oS=w(a.E.div)`
  position: absolute;
  inset: 0;

  &:before {
    z-index: 1;
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 16px;
    background: conic-gradient(from 90deg, currentColor 10%, var(--ck-body-color) 80%);
  }

  svg {
    z-index: 2;
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
  }
`,oO=d.F4`
  0%{ transform: rotate(0deg); }
  100%{ transform: rotate(360deg); }
`,oI=w(a.E.div)`
  position: absolute;
  right: 16px;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${oO} 1s linear infinite;
  svg {
    display: block;
    position: relative;
    animation: ${oO} 1s ease-in-out infinite;
  }
`,o$=w.svg`
  --x: -3px;
  --stroke-width: 2;
  position: relative;
  top: 1px;
  left: -0.5px;
  display: inline-block;
  vertical-align: middle;
  margin-left: 9px;
  margin-right: 1px;
  transition: all 100ms ease;
  transform: translateX(var(--x, -3px));
  color: var(--ck-secondary-button-color, var(--ck-body-color));
  opacity: 0.4;
`,oM=w.path``,oT=w.line`
  transition: inherit;
  transition-property: transform;
  transform-origin: 90% 50%;
  transform: scaleX(0.1);
`,oN=w.div`
  display: inline-block;
  vertical-align: middle;
  position: relative;
  margin-right: 6px;
  color: var(--ck-secondary-button-color, var(--ck-body-color));
`,oP=w.div`
  transform: rotate(90deg);
  ${o$} {
    margin: 0 auto;
  }
`,oz=w(a.E.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  inset: 0;
  height: 100%;
`,oU=w.button`

  ${({disabled:o})=>o&&d.iv`
      cursor: not-allowed;
      pointer-events: none;
    `}

  ${({$variant:o})=>"primary"===o?d.iv`
        --color: var(--ck-primary-button-color, var(--ck-body-color));
        --background: var(--ck-primary-button-background, var(--ck-body-background-primary));
        --box-shadow: var(--ck-primary-button-box-shadow);
        --border-radius: var(--ck-primary-button-border-radius);
        --font-weight: var(--ck-primary-button-font-weight, 500);

        --hover-color: var(--ck-button-primary-hover-color, var(--color));
        --hover-background: var(--ck-primary-button-hover-background, var(--background));
        --hover-box-shadow: var(--ck-primary-button-hover-box-shadow, var(--box-shadow));
        --hover-border-radius: var(--ck-primary-button-hover-border-radius, var(--border-radius));
        --hover-font-weight: var(--ck-primary-button-font-weight, var(--font-weight));
      `:"secondary"===o?d.iv`
        --color: var(--ck-secondary-button-color, var(--ck-body-color));
        --background: var(--ck-secondary-button-background, var(--ck-body-background-secondary));
        --box-shadow: var(--ck-secondary-button-box-shadow);
        --border-radius: var(--ck-secondary-button-border-radius);
        --font-weight: var(--ck-secondary-button-font-weight, 500);

        --hover-color: var(--ck-secondary-button-hover-color, var(--color));
        --hover-background: var(--ck-secondary-button-hover-background, var(--background));
        --hover-box-shadow: var(--ck-secondary-button-hover-box-shadow, var(--box-shadow));
        --hover-border-radius: var(--ck-secondary-button-hover-border-radius, var(--border-radius));
        --hover-font-weight: var(--ck-secondary-button-font-weight, var(--font-weight));
      `:"tertiary"===o?d.iv`
        --color: var(--ck-tertiary-button-color, var(--ck-secondary-button-color));
        --background: var(--ck-tertiary-button-background, var(--ck-secondary-button-background));
        --box-shadow: var(--ck-tertiary-button-box-shadow, var(--ck-secondary-button-box-shadow));
        --border-radius: var(--ck-tertiary-button-border-radius, var(--ck-secondary-button-border-radius));
        --font-weight: var(--ck-tertiary-button-font-weight, var(--ck-secondary-button-font-weight));

        --hover-color: var(--button-tertiary-hover-color, var(--ck-tertiary-button-color));
        --hover-background: var(--ck-tertiary-button-hover-background, var(--ck-tertiary-button-background));
        --hover-box-shadow: var(--ck-tertiary-button-hover-box-shadow, var(--ck-tertiary-button-box-shadow));
        --hover-border-radius: var(
          --ck-tertiary-button-hover-border-radius,
          var(--ck-tertiary-button-border-radius, var(--border-radius))
        );
        --hover-font-weight: var(--ck-tertiary-button-font-weight, var(--ck-secondary-button-font-weight));
      `:void 0}

  appearance: none;
  cursor: pointer;
  user-select: none;
  min-width: fit-content;
  width: 100%;
  display:block;
  text-align: center;
  height: 48px;
  margin: 12px 0 0;
  line-height: 48px;
  padding: 0 4px;
  font-size: 16px;
  font-weight: var(--font-weight,500);
  text-decoration: none;
  white-space: nowrap;
  transition: 100ms ease;
  transition-property: box-shadow, background-color;
  color: var(--color);
  background: var(--background);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  will-change: transform, box-shadow, background-color, color;

  ${oN} {
    ${o$} {
      transform: translateX(0);
      ${oT} {
        transform: none;
      }
      ${oM} {
      }
    }
  }
}

  @media only screen and (min-width: ${F.mobileWidth+1}px) {
    &:hover,
    &:focus-visible {
      color: var(--ck-accent-text-color, var(--hover-color));
      background: var(--ck-accent-color, var(--hover-background));
      border-radius: var(--hover-border-radius);
      box-shadow: var(--hover-box-shadow);

      ${o$} {
        transform: translateX(0);
        ${oT} {
          transform: none;
        }
        ${oM} {
        }
      }
      ${oN} {
        ${o$} {
          transform: translateX(var(--x));
          ${oT} {
            transform: scaleX(0.1);
          }
          ${oM} {
          }
        }
      }
    }
    &:active {
      box-shadow: var(--ck-secondary-button-active-box-shadow, var(--hover-box-shadow));
    }
  }
  @media only screen and (max-width: ${F.mobileWidth}px) {
    transition: transform 100ms ease;
    transform: scale(1);
    font-size: 17px;
    &:active {
    }
  }
`,oH=w.div`
  transform: translateZ(0); // Shifting fix
  position: relative;
  display: inline-block;
  vertical-align: middle;
  max-width: calc(100% - 42px);
  /*
  overflow: hidden;
  text-overflow: ellipsis;
  */
`,oW=w(a.E.div)`
  position: relative;
  display: inline-block;
  vertical-align: middle;
  max-width: 20px;
  max-height: 20px;
  margin: 0 10px;
  &:first-child {
    margin-left: 0;
  }
  &:last-child {
    margin-right: 0;
  }
  ${o=>o.$rounded&&d.iv`
        overflow: hidden;
        border-radius: 5px;
      `}
  svg {
    display: block;
    position: relative;
    max-width: 100%;
    height: auto;
  }
`,oR={duration:.4,ease:[.175,.885,.32,.98]},Spinner$1=()=>(0,r.jsx)(oI,{initial:{opacity:0,rotate:180},animate:{opacity:1,rotate:0},exit:{position:"absolute",opacity:0,rotate:-180,transition:{...oR}},transition:{...oR,delay:.2},children:(0,r.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 18 18",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[(0,r.jsx)("circle",{cx:"9",cy:"9",r:"7",stroke:"currentColor",strokeOpacity:"0.1",strokeWidth:"2.5"}),(0,r.jsx)("path",{d:"M16 9C16 5.13401 12.866 2 9 2",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round"})]})}),Button=({children:o,variant:e="secondary",disabled:t,icon:n,iconPosition:a="left",roundedIcon:c,waiting:s,arrow:d,download:l,href:p,style:u,onClick:b})=>{let x="string"==typeof o?o:flattenChildren(o).join(""),k="string"==typeof p?p:flattenChildren(p).join("");return(0,r.jsx)(oU,{as:p?"a":void 0,onClick:o=>{!t&&b&&b(o)},href:k,target:p&&"_blank",rel:p&&"noopener noreferrer",disabled:t,$variant:e,style:u,children:(0,r.jsxs)(i.M,{initial:!1,children:[(0,r.jsxs)(oz,{initial:{opacity:0,y:-10},animate:{opacity:1,y:-1},exit:{position:"absolute",opacity:0,y:10,transition:{...oR}},transition:{...oR,delay:.2},children:[n&&"left"===a&&(0,r.jsx)(oW,{$rounded:c,children:n}),l&&(0,r.jsx)(oN,{children:(0,r.jsx)(oP,{children:(0,r.jsxs)(o$,{width:"13",height:"12",viewBox:"0 0 13 12",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[(0,r.jsx)(oT,{stroke:"currentColor",x1:"1",y1:"6",x2:"12",y2:"6",strokeWidth:"var(--stroke-width)",strokeLinecap:"round"}),(0,r.jsx)(oM,{stroke:"currentColor",d:"M7.51431 1.5L11.757 5.74264M7.5 10.4858L11.7426 6.24314",strokeWidth:"var(--stroke-width)",strokeLinecap:"round"})]})})}),(0,r.jsx)(oH,{style:{paddingLeft:d?6:0},children:(0,r.jsx)(ot,{children:o})}),n&&"right"===a&&(0,r.jsx)(oW,{$rounded:c,children:n}),d&&(0,r.jsxs)(o$,{width:"13",height:"12",viewBox:"0 0 13 12",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[(0,r.jsx)(oT,{stroke:"currentColor",x1:"1",y1:"6",x2:"12",y2:"6",strokeWidth:"2",strokeLinecap:"round"}),(0,r.jsx)(oM,{stroke:"currentColor",d:"M7.51431 1.5L11.757 5.74264M7.5 10.4858L11.7426 6.24314",strokeWidth:"2",strokeLinecap:"round"})]})]},x),s&&(0,r.jsx)(Spinner$1,{})]})})},oZ=w(a.E.div)`
  z-index: 2147483647;
  position: fixed;
  inset: 0;
  pointer-events: none;
`,oV=w(a.E.div)`
  --shadow: var(--ck-tooltip-shadow);
  z-index: 2147483647;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  gap: 8px;
  width: fit-content;
  align-items: center;
  justify-content: center;
  border-radius: var(--ck-tooltip-border-radius, ${o=>"small"===o.$size?11:14}px);
  border-radius: ;
  padding: 10px 16px 10px 12px;
  font-size: 14px;
  line-height: 19px;
  font-weight: 500;
  letter-spacing: -0.1px;
  color: var(--ck-tooltip-color);
  background: var(--ck-tooltip-background);
  box-shadow: var(--shadow);
  > span {
    z-index: 3;
    position: relative;
  }
  > div {
    margin: -4px 0; // offset for icon
  }
  strong {
    color: var(--ck-spinner-color);
  }

  .ck-tt-logo {
    display: inline-block;
    vertical-align: text-bottom;
    height: 1em;
    width: 1.25em;
    svg {
      display: block;
      height: 100%;
      transform: translate(0.5px, -1px) scale(1.75);
    }
  }
`,oG=w(a.E.div)`
  z-index: 2;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${o=>"small"===o.$size?14:18}px;
  right: 100%;
  top: 0;
  bottom: 0;
  overflow: hidden;
  &:before {
    content: '';
    position: absolute;
    box-shadow: var(--shadow);
    width: ${o=>"small"===o.$size?14:18}px;
    height: ${o=>"small"===o.$size?14:18}px;
    transform: translate(75%, 0) rotate(45deg);
    background: var(--ck-tooltip-background);
    border-radius: ${o=>"small"===o.$size?2:3}px 0 0 0;
  }
`,Tooltip=({children:o,message:e,open:t,xOffset:c=0,yOffset:s=0,delay:d})=>{let l=useConnectSettingContext(),[p,b]=(0,n.useState)(!1),[x,k]=(0,n.useState)(!1),[h,f]=(0,n.useState)("small"),[g,v]=(0,n.useState)(!1),[C]=(0,n.useState)(l.route),m=(0,n.useRef)(null),[y,w]=(0,u.Z)({debounce:g?0:220,offsetSize:!0,scroll:!0}),checkBounds=()=>{let o=!1,e=c+w.left+w.width,t=s+w.top+.5*w.height;return(e>window.innerWidth||e<0||t>window.innerHeight||t<0)&&(o=!0),o},F="undefined"!=typeof window?n.useLayoutEffect:n.useEffect;return F(()=>{if(!m.current||w.top+w.bottom+w.left+w.right+w.height+w.width===0)return;let o=c+w.left+w.width,e=s+w.top+.5*w.height;g||0===o||0===e||v(!0),m.current.style.left=`${o}px`,m.current.style.top=`${e}px`,f(m.current.offsetHeight<=40?"small":"large"),k(checkBounds())},[w,t,p]),(0,n.useEffect)(()=>{l.open||b(!1)},[l.open]),(0,n.useEffect)(()=>{b(!!t)},[t]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(a.E.div,{ref:y,style:void 0===t?{cursor:"help"}:{},onHoverStart:()=>b(!0),onHoverEnd:()=>b(!1),onClick:()=>b(!1),children:o}),(0,r.jsx)(Portal,{children:(0,r.jsx)(i.M,{children:C===l.route&&!x&&p&&(0,r.jsx)(op,{$useTheme:l.theme,$useMode:l.mode,$customTheme:l.customTheme,children:(0,r.jsx)(oZ,{children:(0,r.jsxs)(oV,{role:"tooltip",$size:h,ref:m,initial:"collapsed",animate:g?"open":{},exit:"collapsed",variants:{collapsed:{transformOrigin:"20px 50%",opacity:0,scale:.9,z:.01,y:"-50%",x:20,transition:{duration:.1}},open:{willChange:"opacity,transform",opacity:1,scale:1,z:.01,y:"-50%",x:20,transition:{ease:[.76,0,.24,1],duration:.15,delay:d||.5}}},children:[e,(0,r.jsx)(oG,{$size:h})]})})})})})]})},oq=w(a.E.div)`
  display: flex;
  gap: 8px;
  position: relative;
  border-radius: 9px;
  margin: 0 auto;
  padding: 10px;
  text-align: left;
  font-size: 14px;
  line-height: 17px;
  font-weight: 400;
  max-width: 260px;
  min-width: 100%;

  border-radius: var(--ck-alert-border-radius, 12px);
  color: var(--ck-alert-color, var(--ck-body-color-muted));
  background: var(--ck-alert-background, var(--ck-body-background-secondary));
  box-shadow: var(--ck-alert-box-shadow, var(--ck-body-box-shadow));

  @media only screen and (max-width: ${F.mobileWidth}px) {
    padding: 16px;
    font-size: 16px;
    line-height: 21px;
    border-radius: 24px;
    text-align: center;
  }
`,oX=w(a.E.div)`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
`,oJ=n.forwardRef(({children:o,icon:e},t)=>(0,r.jsxs)(oq,{children:[e&&(0,r.jsx)(oX,{children:e}),(0,r.jsx)("div",{children:o})]}));oJ.displayName="Alert";let oK=w(a.E.div)`
  z-index: 4;
  position: relative;
  width: 100px;
  height: 100px;
  svg {
    z-index: 3;
    position: relative;
    display: block;
  }
`,oQ=w(a.E.div)`
  z-index: 2;
  position: absolute;
  //overflow: hidden;
  inset: 6px;
  border-radius: 50px;
  background: var(--ck-body-background);
  display: flex;
  align-items: center;
  justify-content: center;
  svg,
  img {
    pointer-events: none;
    display: block;
    margin: 0 auto;
    width: 100%;
    height: 100%;
    ${o=>o.$small&&d.iv`
        width: 60%;
        height: 60%;
      `}
  }
`,oY=w(a.E.div)`
  position: absolute;
  inset: -5px;
`,o0=w(a.E.div)`
  pointer-events: none;
  user-select: none;
  z-index: 1;
  position: absolute;
  inset: -25%;
  background: var(--ck-body-background);
  div:first-child {
    position: absolute;
    left: 50%;
    right: 0;
    top: 0;
    bottom: 0;
    overflow: hidden;
    &:before {
      position: absolute;
      content: '';
      inset: 0;
      background: var(--ck-spinner-color);
      transform-origin: 0% 50%;
      animation: rotateExpiringSpinner 5000ms ease-in both;
    }
  }
  div:last-child {
    position: absolute;
    left: 0;
    right: 50%;
    top: 0;
    bottom: 0;
    overflow: hidden;
    &:before {
      position: absolute;
      content: '';
      inset: 0;
      background: var(--ck-spinner-color);
      transform-origin: 100% 50%;
      animation: rotateExpiringSpinner 5000ms ease-out 5000ms both;
    }
  }
  @keyframes rotateExpiringSpinner {
    0% {
      transform: rotate(-180deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
`,o1=w(a.E.div)`
  pointer-events: none;
  user-select: none;
  z-index: 1;
  position: absolute;
  inset: 0;
  svg {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    animation: rotateSpinner 1200ms linear infinite;
  }
  @keyframes rotateSpinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`,CircleSpinner=({logo:o,smallLogo:e,connecting:t=!0,unavailable:n=!1,countdown:a=!1})=>(0,r.jsxs)(oK,{transition:{duration:.5,ease:[.175,.885,.32,.98]},children:[(0,r.jsx)(oQ,{$small:!n&&e,style:n?{borderRadius:0}:void 0,children:o}),(0,r.jsx)(oY,{children:(0,r.jsxs)(i.M,{children:[t&&(0,r.jsx)(o1,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0,transition:{duration:a?1:0}},children:(0,r.jsxs)("svg",{"aria-hidden":"true",width:"102",height:"102",viewBox:"0 0 102 102",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[(0,r.jsx)("path",{d:"M52 100C24.3858 100 2 77.6142 2 50",stroke:"url(#paint0_linear_1943_4139)",strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round"}),(0,r.jsx)("defs",{children:(0,r.jsxs)("linearGradient",{id:"paint0_linear_1943_4139",x1:"2",y1:"48.5",x2:"53",y2:"100",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"var(--ck-spinner-color)"}),(0,r.jsx)("stop",{offset:"1",stopColor:"var(--ck-spinner-color)",stopOpacity:"0"})]})})]})},"Spinner"),a&&(0,r.jsxs)(o0,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.25},children:[(0,r.jsx)("div",{}),(0,r.jsx)("div",{})]},"ExpiringSpinner")]})})]}),Scan=({...o})=>(0,r.jsx)("svg",{"aria-hidden":"true",width:"16",height:"16",viewBox:"0 0 16 16",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:(0,r.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M0 2.82561C0 1.26507 1.26507 0 2.82561 0H4.59161C6.15215 0 7.41722 1.26507 7.41722 2.82561V4.59161C7.41722 6.15215 6.15215 7.41722 4.59161 7.41722H2.82561C1.26507 7.41722 0 6.15215 0 4.59161V2.82561ZM2.82561 1.69536C2.20139 1.69536 1.69536 2.20139 1.69536 2.82561V4.59161C1.69536 5.21583 2.20139 5.72185 2.82561 5.72185H4.59161C5.21583 5.72185 5.72185 5.21583 5.72185 4.59161V2.82561C5.72185 2.20139 5.21583 1.69536 4.59161 1.69536H2.82561ZM0 11.4084C0 9.84791 1.26507 8.58284 2.82561 8.58284H4.59161C6.15215 8.58284 7.41722 9.8479 7.41722 11.4084V13.1744C7.41722 14.735 6.15215 16.0001 4.59161 16.0001H2.82561C1.26507 16.0001 0 14.735 0 13.1744V11.4084ZM2.82561 10.2782C2.20139 10.2782 1.69536 10.7842 1.69536 11.4084V13.1744C1.69536 13.7987 2.20139 14.3047 2.82561 14.3047H4.59161C5.21583 14.3047 5.72185 13.7987 5.72185 13.1744V11.4084C5.72185 10.7842 5.21583 10.2782 4.59161 10.2782H2.82561ZM11.4083 0C9.84779 0 8.58272 1.26507 8.58272 2.82561V4.59161C8.58272 6.15215 9.84779 7.41722 11.4083 7.41722H13.1743C14.7349 7.41722 15.9999 6.15215 15.9999 4.59161V2.82561C15.9999 1.26507 14.7349 0 13.1743 0H11.4083ZM10.2781 2.82561C10.2781 2.20139 10.7841 1.69536 11.4083 1.69536H13.1743C13.7985 1.69536 14.3046 2.20139 14.3046 2.82561V4.59161C14.3046 5.21583 13.7985 5.72185 13.1743 5.72185H11.4083C10.7841 5.72185 10.2781 5.21583 10.2781 4.59161V2.82561ZM15.7351 9.96026C15.7351 10.7795 15.0709 11.4437 14.2516 11.4437C13.4323 11.4437 12.7682 10.7795 12.7682 9.96026C12.7682 9.14098 13.4323 8.47682 14.2516 8.47682C15.0709 8.47682 15.7351 9.14098 15.7351 9.96026ZM9.96026 11.4437C10.7795 11.4437 11.4437 10.7795 11.4437 9.96026C11.4437 9.14098 10.7795 8.47682 9.96026 8.47682C9.14098 8.47682 8.47682 9.14098 8.47682 9.96026C8.47682 10.7795 9.14098 11.4437 9.96026 11.4437ZM15.7351 14.2517C15.7351 15.071 15.0709 15.7352 14.2516 15.7352C13.4323 15.7352 12.7682 15.071 12.7682 14.2517C12.7682 13.4325 13.4323 12.7683 14.2516 12.7683C15.0709 12.7683 15.7351 13.4325 15.7351 14.2517ZM9.96026 15.7352C10.7795 15.7352 11.4437 15.071 11.4437 14.2517C11.4437 13.4325 10.7795 12.7683 9.96026 12.7683C9.14098 12.7683 8.47682 13.4325 8.47682 14.2517C8.47682 15.071 9.14098 15.7352 9.96026 15.7352Z",fill:"currentColor",fillOpacity:"0.3"})}),AlertIcon=({...o})=>(0,r.jsxs)("svg",{"aria-hidden":"true",width:"19",height:"18",viewBox:"0 0 19 18",fill:"none",xmlns:"http://www.w3.org/2000/svg",...o,children:[(0,r.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M6.81753 1.60122C7.39283 0.530035 8.46953 0 9.50409 0C10.5507 0 11.6022 0.539558 12.1805 1.59767L18.6047 13.3334C18.882 13.8283 19 14.3568 19 14.8622C19 16.5296 17.7949 18 15.9149 18H3.08514C1.20508 18 0 16.5296 0 14.8622C0 14.3454 0.131445 13.8172 0.405555 13.3379L6.81753 1.60122ZM9.50409 2C9.13355 2 8.77256 2.18675 8.57866 2.54907L8.57458 2.5567L2.14992 14.3166L2.144 14.3268C2.04638 14.4959 2 14.6817 2 14.8622C2 15.5497 2.43032 16 3.08514 16H15.9149C16.5697 16 17 15.5497 17 14.8622C17 14.6681 16.9554 14.4805 16.8588 14.309L16.8529 14.2986L10.4259 2.55741C10.2191 2.1792 9.86395 2 9.50409 2Z",fill:"currentColor"}),(0,r.jsx)("path",{d:"M9.5 11.2297C9.01639 11.2297 8.7459 10.9419 8.72951 10.4186L8.60656 6.4157C8.59016 5.88372 8.95902 5.5 9.4918 5.5C10.0164 5.5 10.4016 5.89244 10.3852 6.42442L10.2623 10.4099C10.2377 10.9419 9.96721 11.2297 9.5 11.2297ZM9.5 14.5C8.95082 14.5 8.5 14.0901 8.5 13.5058C8.5 12.9215 8.95082 12.5116 9.5 12.5116C10.0492 12.5116 10.5 12.9128 10.5 13.5058C10.5 14.0988 10.041 14.5 9.5 14.5Z",fill:"currentColor"})]}),DisconnectIcon=({...o})=>(0,r.jsx)("svg",{"aria-hidden":"true",width:"15",height:"14",viewBox:"0 0 15 14",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{left:0,top:0},...o,children:(0,r.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M4 0C1.79086 0 0 1.79086 0 4V10C0 12.2091 1.79086 14 4 14H6C6.55228 14 7 13.5523 7 13C7 12.4477 6.55228 12 6 12H4C2.89543 12 2 11.1046 2 10V4C2 2.89543 2.89543 2 4 2H6C6.55228 2 7 1.55228 7 1C7 0.447715 6.55228 0 6 0H4ZM11.7071 3.29289C11.3166 2.90237 10.6834 2.90237 10.2929 3.29289C9.90237 3.68342 9.90237 4.31658 10.2929 4.70711L11.5858 6H9.5H6C5.44772 6 5 6.44772 5 7C5 7.55228 5.44772 8 6 8H9.5H11.5858L10.2929 9.29289C9.90237 9.68342 9.90237 10.3166 10.2929 10.7071C10.6834 11.0976 11.3166 11.0976 11.7071 10.7071L14.7071 7.70711C15.0976 7.31658 15.0976 6.68342 14.7071 6.29289L11.7071 3.29289Z",fill:"currentColor",fillOpacity:"0.4"})}),TickIcon=({...o})=>(0,r.jsx)("svg",{"aria-hidden":"true",width:"18",height:"18",viewBox:"0 0 18 18",fill:"none",xmlns:"http://www.w3.org/2000/svg",...o,children:(0,r.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18ZM13.274 7.13324C13.6237 6.70579 13.5607 6.07577 13.1332 5.72604C12.7058 5.37632 12.0758 5.43932 11.726 5.86676L7.92576 10.5115L6.20711 8.79289C5.81658 8.40237 5.18342 8.40237 4.79289 8.79289C4.40237 9.18342 4.40237 9.81658 4.79289 10.2071L7.29289 12.7071C7.49267 12.9069 7.76764 13.0128 8.04981 12.9988C8.33199 12.9847 8.59505 12.8519 8.77396 12.6332L13.274 7.13324Z",fill:"currentColor"})}),RetryIconCircle=({...o})=>(0,r.jsx)("svg",{"aria-hidden":"true",width:"32",height:"32",viewBox:"0 0 32 32",fill:"none",xmlns:"http://www.w3.org/2000/svg",...o,children:(0,r.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16ZM24.5001 8.74263C25.0834 8.74263 25.5563 9.21551 25.5563 9.79883V14.5997C25.5563 15.183 25.0834 15.6559 24.5001 15.6559H19.6992C19.1159 15.6559 18.643 15.183 18.643 14.5997C18.643 14.0164 19.1159 13.5435 19.6992 13.5435H21.8378L20.071 11.8798C20.0632 11.8724 20.0555 11.865 20.048 11.8574C19.1061 10.915 17.8835 10.3042 16.5643 10.1171C15.2452 9.92999 13.9009 10.1767 12.7341 10.82C11.5674 11.4634 10.6413 12.4685 10.0955 13.684C9.54968 14.8994 9.41368 16.2593 9.70801 17.5588C10.0023 18.8583 10.711 20.0269 11.7273 20.8885C12.7436 21.7502 14.0124 22.2582 15.3425 22.336C16.6726 22.4138 17.9919 22.0572 19.1017 21.3199C19.5088 21.0495 19.8795 20.7333 20.2078 20.3793C20.6043 19.9515 21.2726 19.9262 21.7004 20.3228C22.1282 20.7194 22.1534 21.3876 21.7569 21.8154C21.3158 22.2912 20.8176 22.7161 20.2706 23.0795C18.7793 24.0702 17.0064 24.5493 15.2191 24.4448C13.4318 24.3402 11.7268 23.6576 10.3612 22.4998C8.9956 21.3419 8.0433 19.7716 7.6478 18.0254C7.2523 16.2793 7.43504 14.4519 8.16848 12.8186C8.90192 11.1854 10.1463 9.83471 11.7142 8.97021C13.282 8.10572 15.0884 7.77421 16.861 8.02565C18.6282 8.27631 20.2664 9.09278 21.5304 10.3525L23.4439 12.1544V9.79883C23.4439 9.21551 23.9168 8.74263 24.5001 8.74263Z",fill:"currentColor"})}),CopyToClipboardIcon$1=({...o})=>(0,r.jsxs)("svg",{"aria-hidden":"true",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",...o,children:[(0,r.jsx)("path",{d:"M14 9.5V7C14 5.89543 13.1046 5 12 5H7C5.89543 5 5 5.89543 5 7V12C5 13.1046 5.89543 14 7 14H9.5",stroke:"var(--ck-body-color-muted)",strokeWidth:"2"}),(0,r.jsx)("rect",{x:"10",y:"10",width:"9",height:"9",rx:"2",stroke:"var(--ck-body-color-muted)",strokeWidth:"2"}),(0,r.jsx)("path",{d:"M1 3L3 5L7 1",stroke:"var(--ck-body-color)",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round"})]}),o2=w(a.E.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 32px;
  max-height: 32px;
  width: 100%;
  height: 100%;
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
`,o5=(0,r.jsxs)("svg",{"aria-hidden":"true",width:20,height:20,viewBox:"0 0 20 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[(0,r.jsx)("g",{filter:"url(#filter0_ii_927_5781)",children:(0,r.jsxs)("g",{clipPath:"url(#clip0_927_5781)",children:[(0,r.jsx)("path",{d:"M1.58771 0V12.2727H6.06498L10.0002 5.45455H20.0002V0H1.58771Z",fill:"#DB4437"}),(0,r.jsx)("path",{d:"M1.58771 0V12.2727H6.06498L10.0002 5.45455H20.0002V0H1.58771Z",fill:"url(#paint0_linear_927_5781)"}),(0,r.jsx)("path",{d:"M6.17038 12.2272L1.64538 4.46582L1.57947 4.57946L6.07265 12.284L6.17038 12.2272Z",fill:"black",fillOpacity:"0.15"}),(0,r.jsx)("path",{d:"M0 20.0003H9.51932L13.9375 15.5821V12.273H6.0625L0 1.87305V20.0003Z",fill:"#0F9D58"}),(0,r.jsx)("path",{d:"M0 20.0003H9.51932L13.9375 15.5821V12.273H6.0625L0 1.87305V20.0003Z",fill:"url(#paint1_linear_927_5781)"}),(0,r.jsx)("path",{d:"M13.8412 12.4208L13.7469 12.3662L9.38324 19.9969H9.51392L13.8435 12.4242L13.8412 12.4208Z",fill:"#263238",fillOpacity:"0.15"}),(0,r.jsx)("path",{d:"M10.0006 5.45459L13.9381 12.2728L9.51996 20H20.0006V5.45459H10.0006Z",fill:"#FFCD40"}),(0,r.jsx)("path",{d:"M10.0006 5.45459L13.9381 12.2728L9.51996 20H20.0006V5.45459H10.0006Z",fill:"url(#paint2_linear_927_5781)"}),(0,r.jsx)("path",{d:"M9.9996 5.45459L13.9371 12.2728L9.51892 20H19.9996V5.45459H9.9996Z",fill:"#FFCD40"}),(0,r.jsx)("path",{d:"M9.9996 5.45459L13.9371 12.2728L9.51892 20H19.9996V5.45459H9.9996Z",fill:"url(#paint3_linear_927_5781)"}),(0,r.jsx)("path",{d:"M1.58691 0V12.2727H6.06419L9.99941 5.45455H19.9994V0H1.58691Z",fill:"#DB4437"}),(0,r.jsx)("path",{d:"M1.58691 0V12.2727H6.06419L9.99941 5.45455H19.9994V0H1.58691Z",fill:"url(#paint4_linear_927_5781)"}),(0,r.jsx)("path",{d:"M10 5.45459V7.83527L18.9091 5.45459H10Z",fill:"url(#paint5_radial_927_5781)"}),(0,r.jsx)("path",{d:"M0 19.9998H9.51932L11.9318 15.9089L13.9375 12.2726H6.0625L0 1.87256V19.9998Z",fill:"#0F9D58"}),(0,r.jsx)("path",{d:"M0 19.9998H9.51932L12.1023 15.5112L13.9375 12.2726H6.0625L0 1.87256V19.9998Z",fill:"url(#paint6_linear_927_5781)"}),(0,r.jsx)("path",{d:"M1.58771 4.59668L8.09339 11.1012L6.06384 12.2728L1.58771 4.59668Z",fill:"url(#paint7_radial_927_5781)"}),(0,r.jsx)("path",{d:"M9.52661 19.9884L11.9084 11.1021L13.938 12.2725L9.52661 19.9884Z",fill:"url(#paint8_radial_927_5781)"}),(0,r.jsx)("path",{d:"M10.0003 14.5455C12.5107 14.5455 14.5458 12.5104 14.5458 10C14.5458 7.48966 12.5107 5.45459 10.0003 5.45459C7.48996 5.45459 5.4549 7.48966 5.4549 10C5.4549 12.5104 7.48996 14.5455 10.0003 14.5455Z",fill:"#F1F1F1"}),(0,r.jsx)("path",{d:"M9.99995 13.6365C12.0083 13.6365 13.6363 12.0084 13.6363 10.0001C13.6363 7.99183 12.0083 6.36377 9.99995 6.36377C7.99164 6.36377 6.36359 7.99183 6.36359 10.0001C6.36359 12.0084 7.99164 13.6365 9.99995 13.6365Z",fill:"#4285F4"}),(0,r.jsx)("path",{d:"M10.0003 5.34082C7.48899 5.34082 5.4549 7.37491 5.4549 9.88628V9.99991C5.4549 7.48855 7.48899 5.45446 10.0003 5.45446H20.0003V5.34082H10.0003Z",fill:"black",fillOpacity:"0.2"}),(0,r.jsx)("path",{d:"M13.9318 12.273C13.1455 13.6299 11.6818 14.5458 10 14.5458C8.31818 14.5458 6.85227 13.6299 6.06818 12.273H6.06364L0 1.87305V1.98668L6.06818 12.3867C6.85455 13.7435 8.31818 14.6594 10 14.6594C11.6818 14.6594 13.1455 13.7446 13.9318 12.3867H13.9375V12.273H13.9307H13.9318Z",fill:"white",fillOpacity:"0.1"}),(0,r.jsx)("path",{opacity:"0.1",d:"M10.1133 5.45459C10.094 5.45459 10.0758 5.45686 10.0565 5.458C12.5406 5.48868 14.5452 7.50913 14.5452 10C14.5452 12.491 12.5406 14.5114 10.0565 14.5421C10.0758 14.5421 10.094 14.5455 10.1133 14.5455C12.6247 14.5455 14.6588 12.5114 14.6588 10C14.6588 7.48868 12.6247 5.45459 10.1133 5.45459Z",fill:"black"}),(0,r.jsx)("path",{d:"M13.9769 12.4204C14.3632 11.7522 14.5871 10.9795 14.5871 10.1522C14.5874 9.68602 14.5157 9.22262 14.3746 8.77832C14.4826 9.16696 14.5451 9.57377 14.5451 9.99764C14.5451 10.8249 14.3212 11.5976 13.9348 12.2658L13.9371 12.2704L9.51892 19.9976H9.65074L13.9769 12.4204Z",fill:"white",fillOpacity:"0.2"}),(0,r.jsx)("path",{d:"M10 0.113636C15.5034 0.113636 19.9682 4.56023 20 10.0568C20 10.0375 20.0011 10.0193 20.0011 10C20.0011 4.47727 15.5239 0 10.0011 0C4.47841 0 0 4.47727 0 10C0 10.0193 0.00113639 10.0375 0.00113639 10.0568C0.0318182 4.56023 4.49659 0.113636 10 0.113636Z",fill:"white",fillOpacity:"0.2"}),(0,r.jsx)("path",{d:"M10 19.8865C15.5034 19.8865 19.9682 15.4399 20 9.94336C20 9.96268 20.0011 9.98086 20.0011 10.0002C20.0011 15.5229 15.5239 20.0002 10.0011 20.0002C4.47841 20.0002 0 15.5229 0 10.0002C0 9.98086 0.00113639 9.96268 0.00113639 9.94336C0.0318182 15.4399 4.49659 19.8865 10.0011 19.8865H10Z",fill:"black",fillOpacity:"0.15"})]})}),(0,r.jsxs)("defs",{children:[(0,r.jsxs)("filter",{id:"filter0_ii_927_5781",x:0,y:"-0.235294",width:20,height:"20.4706",filterUnits:"userSpaceOnUse",colorInterpolationFilters:"sRGB",children:[(0,r.jsx)("feFlood",{floodOpacity:0,result:"BackgroundImageFix"}),(0,r.jsx)("feBlend",{mode:"normal",in:"SourceGraphic",in2:"BackgroundImageFix",result:"shape"}),(0,r.jsx)("feColorMatrix",{in:"SourceAlpha",type:"matrix",values:"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0",result:"hardAlpha"}),(0,r.jsx)("feOffset",{dy:"0.235294"}),(0,r.jsx)("feGaussianBlur",{stdDeviation:"0.235294"}),(0,r.jsx)("feComposite",{in2:"hardAlpha",operator:"arithmetic",k2:-1,k3:1}),(0,r.jsx)("feColorMatrix",{type:"matrix",values:"0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"}),(0,r.jsx)("feBlend",{mode:"normal",in2:"shape",result:"effect1_innerShadow_927_5781"}),(0,r.jsx)("feColorMatrix",{in:"SourceAlpha",type:"matrix",values:"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0",result:"hardAlpha"}),(0,r.jsx)("feOffset",{dy:"-0.235294"}),(0,r.jsx)("feGaussianBlur",{stdDeviation:"0.235294"}),(0,r.jsx)("feComposite",{in2:"hardAlpha",operator:"arithmetic",k2:-1,k3:1}),(0,r.jsx)("feColorMatrix",{type:"matrix",values:"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"}),(0,r.jsx)("feBlend",{mode:"normal",in2:"effect1_innerShadow_927_5781",result:"effect2_innerShadow_927_5781"})]}),(0,r.jsxs)("linearGradient",{id:"paint0_linear_927_5781",x1:"2.42521",y1:"7.61591",x2:"8.39112",y2:"4.13068",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#A52714",stopOpacity:"0.6"}),(0,r.jsx)("stop",{offset:"0.66",stopColor:"#A52714",stopOpacity:0})]}),(0,r.jsxs)("linearGradient",{id:"paint1_linear_927_5781",x1:"11.6932",y1:"17.7844",x2:"5.06136",y2:"13.8981",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#055524",stopOpacity:"0.4"}),(0,r.jsx)("stop",{offset:"0.33",stopColor:"#055524",stopOpacity:0})]}),(0,r.jsxs)("linearGradient",{id:"paint2_linear_927_5781",x1:"12.9438",y1:"4.75004",x2:"14.6143",y2:"12.0569",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#EA6100",stopOpacity:"0.3"}),(0,r.jsx)("stop",{offset:"0.66",stopColor:"#EA6100",stopOpacity:0})]}),(0,r.jsxs)("linearGradient",{id:"paint3_linear_927_5781",x1:"12.9428",y1:"4.75004",x2:"14.6132",y2:"12.0569",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#EA6100",stopOpacity:"0.3"}),(0,r.jsx)("stop",{offset:"0.66",stopColor:"#EA6100",stopOpacity:0})]}),(0,r.jsxs)("linearGradient",{id:"paint4_linear_927_5781",x1:"2.42441",y1:"7.61591",x2:"8.39032",y2:"4.13068",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#A52714",stopOpacity:"0.6"}),(0,r.jsx)("stop",{offset:"0.66",stopColor:"#A52714",stopOpacity:0})]}),(0,r.jsxs)("radialGradient",{id:"paint5_radial_927_5781",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(9.56818 5.44891) scale(9.55455)",children:[(0,r.jsx)("stop",{stopColor:"#3E2723",stopOpacity:"0.2"}),(0,r.jsx)("stop",{offset:1,stopColor:"#3E2723",stopOpacity:0})]}),(0,r.jsxs)("linearGradient",{id:"paint6_linear_927_5781",x1:"11.6932",y1:"17.7839",x2:"5.06136",y2:"13.8976",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#055524",stopOpacity:"0.4"}),(0,r.jsx)("stop",{offset:"0.33",stopColor:"#055524",stopOpacity:0})]}),(0,r.jsxs)("radialGradient",{id:"paint7_radial_927_5781",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(1.57975 4.60463) scale(8.86818)",children:[(0,r.jsx)("stop",{stopColor:"#3E2723",stopOpacity:"0.2"}),(0,r.jsx)("stop",{offset:1,stopColor:"#3E2723",stopOpacity:0})]}),(0,r.jsxs)("radialGradient",{id:"paint8_radial_927_5781",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(9.97775 10.0157) scale(9.98523)",children:[(0,r.jsx)("stop",{stopColor:"#263238",stopOpacity:"0.2"}),(0,r.jsx)("stop",{offset:1,stopColor:"#263238",stopOpacity:0})]}),(0,r.jsx)("clipPath",{id:"clip0_927_5781",children:(0,r.jsx)("rect",{width:20,height:20,rx:10,fill:"white"})})]})]}),o4=(0,r.jsxs)("svg",{"aria-hidden":"true",width:20,height:20,viewBox:"0 0 20 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[(0,r.jsxs)("g",{clipPath:"url(#clip0_927_5847)",children:[(0,r.jsx)("path",{d:"M19.011 6.71023C18.5898 5.69685 17.7355 4.60269 17.0665 4.25681C17.5436 5.18063 17.8747 6.17276 18.0481 7.19792L18.0499 7.21417C16.954 4.48315 15.0963 3.38023 13.5782 0.981835C13.5014 0.860539 13.4246 0.738994 13.3498 0.610696C13.3071 0.537418 13.2728 0.471393 13.2431 0.410621C13.1801 0.288713 13.1316 0.159878 13.0985 0.0267267C13.0985 0.0205825 13.0963 0.0146369 13.0923 0.0100242C13.0882 0.00541151 13.0826 0.00245454 13.0765 0.00171737C13.0705 7.85858e-05 13.0642 7.85858e-05 13.0582 0.00171737C13.057 0.00171737 13.055 0.00396821 13.0535 0.0044684C13.052 0.00496859 13.0487 0.00721943 13.0465 0.00821981L13.0502 0.00171737C10.6156 1.42725 9.78901 4.06574 9.71399 5.38624C8.74136 5.45292 7.81141 5.81121 7.04549 6.41437C6.96561 6.34671 6.88212 6.28343 6.79539 6.2248C6.57456 5.45174 6.56514 4.6336 6.76813 3.85566C5.87401 4.28877 5.07954 4.90279 4.43501 5.65884H4.43051C4.04636 5.17191 4.07337 3.5663 4.09538 3.23093C3.98174 3.2766 3.87326 3.33419 3.77176 3.40274C3.43264 3.64477 3.11562 3.91635 2.8244 4.2143C2.49255 4.55075 2.18946 4.91441 1.91831 5.30146V5.30296V5.3012C1.29521 6.18444 0.853213 7.18234 0.617826 8.23731L0.604821 8.30133C0.586564 8.38661 0.52079 8.81377 0.509535 8.90656C0.509535 8.91381 0.508035 8.92056 0.507285 8.92781C0.42244 9.36882 0.369864 9.81542 0.349976 10.2641V10.3141C0.354259 12.7396 1.26772 15.0754 2.91002 16.8604C4.55233 18.6454 6.80415 19.7498 9.22094 19.9556C11.6377 20.1615 14.0439 19.4538 15.9644 17.9723C17.8849 16.4908 19.1803 14.3431 19.5947 11.9532C19.6109 11.8282 19.6242 11.7044 19.6387 11.5781C19.8384 9.92791 19.6222 8.25404 19.01 6.70873L19.011 6.71023ZM7.83928 14.2981C7.88455 14.3198 7.92707 14.3433 7.97358 14.3641L7.98034 14.3684C7.93332 14.3458 7.8863 14.3224 7.83928 14.2981ZM18.0501 7.21692V7.20767L18.0519 7.21792L18.0501 7.21692Z",fill:"url(#paint0_linear_927_5847)"}),(0,r.jsx)("path",{d:"M19.0109 6.71026C18.5898 5.69688 17.7354 4.60272 17.0664 4.25684C17.5435 5.18066 17.8746 6.17278 18.0481 7.19794V7.20719L18.0498 7.21745C18.797 9.35551 18.689 11.6997 17.7482 13.7599C16.6373 16.1435 13.9493 18.5867 9.7402 18.4667C5.19349 18.3379 1.18699 14.9629 0.439211 10.5437C0.30291 9.84668 0.439211 9.4933 0.507737 8.92684C0.414265 9.36685 0.362102 9.81463 0.351929 10.2643V10.3144C0.356212 12.7399 1.26967 15.0757 2.91198 16.8607C4.55429 18.6456 6.8061 19.7501 9.2229 19.9559C11.6397 20.1617 14.0458 19.4541 15.9664 17.9725C17.8869 16.491 19.1822 14.3434 19.5966 11.9535C19.6129 11.8284 19.6262 11.7046 19.6407 11.5783C19.8403 9.92819 19.6242 8.25431 19.0119 6.70901L19.0109 6.71026Z",fill:"url(#paint1_radial_927_5847)"}),(0,r.jsx)("path",{d:"M19.0109 6.71026C18.5898 5.69688 17.7354 4.60272 17.0664 4.25684C17.5435 5.18066 17.8746 6.17278 18.0481 7.19794V7.20719L18.0498 7.21745C18.797 9.35551 18.689 11.6997 17.7482 13.7599C16.6373 16.1435 13.9493 18.5867 9.7402 18.4667C5.19349 18.3379 1.18699 14.9629 0.439211 10.5437C0.30291 9.84668 0.439211 9.4933 0.507737 8.92684C0.414265 9.36685 0.362102 9.81463 0.351929 10.2643V10.3144C0.356212 12.7399 1.26967 15.0757 2.91198 16.8607C4.55429 18.6456 6.8061 19.7501 9.2229 19.9559C11.6397 20.1617 14.0458 19.4541 15.9664 17.9725C17.8869 16.491 19.1822 14.3434 19.5966 11.9535C19.6129 11.8284 19.6262 11.7046 19.6407 11.5783C19.8403 9.92819 19.6242 8.25431 19.0119 6.70901L19.0109 6.71026Z",fill:"url(#paint2_radial_927_5847)"}),(0,r.jsx)("path",{d:"M14.2993 7.84794C14.3203 7.8627 14.3398 7.87745 14.3595 7.89221C14.1161 7.46047 13.813 7.06519 13.4592 6.71802C10.4456 3.70439 12.6696 0.18557 13.0445 0.00550206L13.0483 0C10.6136 1.42553 9.78706 4.06402 9.71204 5.38452C9.82508 5.37677 9.93712 5.36726 10.0527 5.36726C10.9164 5.36893 11.7644 5.59929 12.5103 6.03492C13.2562 6.47055 13.8734 7.09592 14.2993 7.84744V7.84794Z",fill:"url(#paint3_radial_927_5847)"}),(0,r.jsx)("path",{d:"M10.0577 8.45061C10.0417 8.6917 9.18992 9.52326 8.89206 9.52326C6.13602 9.52326 5.68835 11.1906 5.68835 11.1906C5.8104 12.5947 6.78877 13.7516 7.97146 14.3618C8.02548 14.3898 8.08025 14.4151 8.13502 14.4399C8.22989 14.4819 8.32476 14.5207 8.41963 14.5564C8.82553 14.7 9.25065 14.7821 9.68085 14.7997C14.5127 15.0263 15.448 9.02257 11.9615 7.27942C12.7839 7.1724 13.6168 7.37463 14.2986 7.84688C13.8727 7.09536 13.2555 6.46999 12.5096 6.03436C11.7637 5.59873 10.9158 5.36837 10.052 5.3667C9.93695 5.3667 9.82441 5.3762 9.71136 5.38396C8.73874 5.45064 7.80879 5.80893 7.04286 6.41209C7.19067 6.53714 7.35748 6.7042 7.70886 7.05058C8.36661 7.69857 10.0535 8.36983 10.0572 8.44861L10.0577 8.45061Z",fill:"url(#paint4_radial_927_5847)"}),(0,r.jsx)("path",{d:"M10.0577 8.45061C10.0417 8.6917 9.18992 9.52326 8.89206 9.52326C6.13602 9.52326 5.68835 11.1906 5.68835 11.1906C5.8104 12.5947 6.78877 13.7516 7.97146 14.3618C8.02548 14.3898 8.08025 14.4151 8.13502 14.4399C8.22989 14.4819 8.32476 14.5207 8.41963 14.5564C8.82553 14.7 9.25065 14.7821 9.68085 14.7997C14.5127 15.0263 15.448 9.02257 11.9615 7.27942C12.7839 7.1724 13.6168 7.37463 14.2986 7.84688C13.8727 7.09536 13.2555 6.46999 12.5096 6.03436C11.7637 5.59873 10.9158 5.36837 10.052 5.3667C9.93695 5.3667 9.82441 5.3762 9.71136 5.38396C8.73874 5.45064 7.80879 5.80893 7.04286 6.41209C7.19067 6.53714 7.35748 6.7042 7.70886 7.05058C8.36661 7.69857 10.0535 8.36983 10.0572 8.44861L10.0577 8.45061Z",fill:"url(#paint5_radial_927_5847)"}),(0,r.jsx)("path",{d:"M6.59134 6.0923C6.66987 6.14231 6.73464 6.18583 6.79141 6.2251C6.57058 5.45204 6.56117 4.63389 6.76415 3.85596C5.87003 4.28907 5.07556 4.90308 4.43103 5.65913C4.4783 5.65788 5.88432 5.63262 6.59134 6.0923Z",fill:"url(#paint6_radial_927_5847)"}),(0,r.jsx)("path",{d:"M0.437567 10.5439C1.1856 14.963 5.19185 18.3393 9.73855 18.4668C13.9476 18.5859 16.6361 16.1425 17.7466 13.7601C18.6873 11.6998 18.7954 9.35569 18.0482 7.21762V7.20837C18.0482 7.20111 18.0467 7.19686 18.0482 7.19911L18.0499 7.21537C18.3938 9.46046 17.2519 11.6345 15.4665 13.1076L15.4609 13.1201C11.9821 15.9536 8.6534 14.8292 7.98064 14.3706C7.93363 14.348 7.88661 14.3246 7.83959 14.3003C5.81158 13.3309 4.97352 11.4842 5.15358 9.89862C4.67218 9.90573 4.19905 9.77307 3.79151 9.51672C3.38397 9.26038 3.05952 8.89134 2.85747 8.45433C3.38987 8.1282 3.99692 7.94382 4.62077 7.91878C5.24461 7.89374 5.86448 8.02887 6.42131 8.31128C7.56906 8.83225 8.87507 8.8836 10.0602 8.45433C10.0564 8.37555 8.36954 7.70405 7.71179 7.05631C7.36041 6.70993 7.1936 6.54312 7.04579 6.41782C6.96591 6.35016 6.88243 6.28688 6.7957 6.22825C6.73818 6.18898 6.6734 6.14647 6.59562 6.09545C5.88861 5.63578 4.48258 5.66104 4.43607 5.66229H4.43156C4.04742 5.17535 4.07443 3.56975 4.09644 3.23438C3.9828 3.28005 3.87431 3.33764 3.77282 3.40619C3.4337 3.64822 3.11667 3.91979 2.82546 4.21774C2.49242 4.55325 2.18808 4.91607 1.91562 5.3024V5.3039V5.30215C1.29252 6.18539 0.850521 7.18329 0.615133 8.23825C0.610381 8.25801 0.266002 9.76357 0.435816 10.5444L0.437567 10.5439Z",fill:"url(#paint7_radial_927_5847)"}),(0,r.jsx)("path",{d:"M13.459 6.71761C13.8128 7.06516 14.1159 7.46087 14.3593 7.89305C14.4126 7.93331 14.4624 7.97333 14.5046 8.01209C16.7022 10.0378 15.5508 12.9014 15.465 13.104C17.2502 11.6332 18.3911 9.45763 18.0485 7.21179C16.952 4.47826 15.0923 3.37535 13.5768 0.976952C13.5 0.855657 13.4232 0.734111 13.3484 0.605813C13.3057 0.532535 13.2714 0.466511 13.2417 0.405738C13.1787 0.283831 13.1302 0.154995 13.0971 0.0218439C13.0971 0.0156997 13.0949 0.0097541 13.0909 0.0051414C13.0868 0.000528701 13.0812 -0.00242828 13.0751 -0.00316545C13.0691 -0.00480423 13.0628 -0.00480423 13.0568 -0.00316545C13.0556 -0.00316545 13.0536 -0.000914601 13.0521 -0.000414413C13.0506 8.57743e-05 13.0473 0.00233662 13.0451 0.00333699C12.6702 0.181154 10.4466 3.70222 13.4602 6.71335L13.459 6.71761Z",fill:"url(#paint8_radial_927_5847)"}),(0,r.jsx)("path",{d:"M14.5043 8.01315C14.462 7.97439 14.4122 7.93437 14.359 7.8941C14.3392 7.87935 14.3197 7.86459 14.2987 7.84984C13.6169 7.37759 12.784 7.17536 11.9616 7.28238C15.4479 9.02553 14.5125 15.0278 9.68095 14.8027C9.25075 14.785 8.82562 14.703 8.41973 14.5594C8.32486 14.5238 8.22999 14.485 8.13512 14.4428C8.08035 14.4178 8.02558 14.3928 7.97156 14.3648L7.97831 14.369C8.65206 14.829 11.9798 15.9526 15.4586 13.1186L15.4641 13.1061C15.5509 12.9035 16.7023 10.0399 14.5038 8.01415L14.5043 8.01315Z",fill:"url(#paint9_radial_927_5847)"}),(0,r.jsx)("path",{d:"M5.68842 11.1892C5.68842 11.1892 6.13583 9.52179 8.89212 9.52179C9.18998 9.52179 10.0425 8.69023 10.0578 8.44914C8.8727 8.8784 7.56669 8.82706 6.41894 8.30608C5.86211 8.02367 5.24224 7.88855 4.61839 7.91359C3.99455 7.93863 3.3875 8.123 2.8551 8.44914C3.05715 8.88615 3.3816 9.25518 3.78914 9.51153C4.19668 9.76787 4.66981 9.90053 5.15121 9.89343C4.97165 11.4783 5.80946 13.3247 7.83722 14.2951C7.88249 14.3168 7.925 14.3403 7.97152 14.3611C6.78783 13.7496 5.81046 12.5932 5.68842 11.1899V11.1892Z",fill:"url(#paint10_radial_927_5847)"}),(0,r.jsx)("path",{d:"M19.0112 6.71023C18.59 5.69685 17.7357 4.60269 17.0667 4.25681C17.5438 5.18063 17.8749 6.17276 18.0483 7.19792L18.0501 7.21417C16.9542 4.48315 15.0965 3.38023 13.5784 0.981835C13.5016 0.860539 13.4249 0.738994 13.3501 0.610696C13.3073 0.537418 13.2731 0.471393 13.2433 0.410621C13.1803 0.288713 13.1318 0.159878 13.0987 0.0267267C13.0988 0.0205825 13.0966 0.0146369 13.0925 0.0100242C13.0884 0.00541151 13.0828 0.00245454 13.0767 0.00171737C13.0708 7.85859e-05 13.0644 7.85859e-05 13.0585 0.00171737C13.0572 0.00171737 13.0552 0.00396821 13.0537 0.0044684C13.0522 0.00496859 13.049 0.00721943 13.0467 0.00821981L13.0505 0.00171737C10.6158 1.42725 9.78925 4.06574 9.71422 5.38624C9.82726 5.37848 9.9393 5.36898 10.0548 5.36898C10.9186 5.37065 11.7666 5.60101 12.5125 6.03664C13.2584 6.47227 13.8756 7.09764 14.3014 7.84916C13.6196 7.37691 12.7868 7.17468 11.9643 7.2817C15.4506 9.02485 14.5153 15.0271 9.68371 14.802C9.25351 14.7843 8.82838 14.7023 8.42248 14.5587C8.32761 14.5232 8.23275 14.4843 8.13788 14.4421C8.08311 14.4171 8.02834 14.3921 7.97432 14.3641L7.98107 14.3684C7.93405 14.3458 7.88703 14.3224 7.84002 14.2981C7.88528 14.3198 7.9278 14.3433 7.97432 14.3641C6.79062 13.7524 5.81326 12.5959 5.69121 11.1929C5.69121 11.1929 6.13863 9.52554 8.89491 9.52554C9.19277 9.52554 10.0453 8.69398 10.0606 8.45289C10.0568 8.37411 8.36996 7.7026 7.71222 7.05486C7.36084 6.70848 7.19402 6.54167 7.04622 6.41637C6.96634 6.34871 6.88285 6.28543 6.79612 6.2268C6.57529 5.45374 6.56588 4.6356 6.76886 3.85766C5.87474 4.29077 5.08027 4.90479 4.43574 5.66084H4.43124C4.04709 5.17391 4.0741 3.5683 4.09611 3.23293C3.98247 3.2786 3.87399 3.33619 3.77249 3.40474C3.43337 3.64677 3.11635 3.91835 2.82514 4.2163C2.49328 4.55275 2.19019 4.91641 1.91905 5.30345V5.30496V5.30321C1.29595 6.18644 0.853946 7.18434 0.618558 8.23931L0.605554 8.30333C0.587297 8.38861 0.505516 8.82177 0.493762 8.91481C0.418959 9.36194 0.371188 9.81318 0.350708 10.2661V10.3161C0.354992 12.7416 1.26845 15.0774 2.91076 16.8624C4.55307 18.6474 6.80488 19.7518 9.22168 19.9576C11.6385 20.1635 14.0446 19.4558 15.9652 17.9743C17.8857 16.4928 19.181 14.3451 19.5954 11.9552C19.6117 11.8302 19.6249 11.7064 19.6394 11.5801C19.8391 9.92991 19.623 8.25604 19.0107 6.71073L19.0112 6.71023ZM18.0496 7.20817L18.0513 7.21842L18.0496 7.20817Z",fill:"url(#paint11_linear_927_5847)"})]}),(0,r.jsxs)("defs",{children:[(0,r.jsxs)("linearGradient",{id:"paint0_linear_927_5847",x1:"17.728",y1:"3.09786",x2:"1.63621",y2:"18.6237",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{offset:"0.048",stopColor:"#FFF44F"}),(0,r.jsx)("stop",{offset:"0.111",stopColor:"#FFE847"}),(0,r.jsx)("stop",{offset:"0.225",stopColor:"#FFC830"}),(0,r.jsx)("stop",{offset:"0.368",stopColor:"#FF980E"}),(0,r.jsx)("stop",{offset:"0.401",stopColor:"#FF8B16"}),(0,r.jsx)("stop",{offset:"0.462",stopColor:"#FF672A"}),(0,r.jsx)("stop",{offset:"0.534",stopColor:"#FF3647"}),(0,r.jsx)("stop",{offset:"0.705",stopColor:"#E31587"})]}),(0,r.jsxs)("radialGradient",{id:"paint1_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(17.1052 2.25108) scale(20.2076)",children:[(0,r.jsx)("stop",{offset:"0.129",stopColor:"#FFBD4F"}),(0,r.jsx)("stop",{offset:"0.186",stopColor:"#FFAC31"}),(0,r.jsx)("stop",{offset:"0.247",stopColor:"#FF9D17"}),(0,r.jsx)("stop",{offset:"0.283",stopColor:"#FF980E"}),(0,r.jsx)("stop",{offset:"0.403",stopColor:"#FF563B"}),(0,r.jsx)("stop",{offset:"0.467",stopColor:"#FF3750"}),(0,r.jsx)("stop",{offset:"0.71",stopColor:"#F5156C"}),(0,r.jsx)("stop",{offset:"0.782",stopColor:"#EB0878"}),(0,r.jsx)("stop",{offset:"0.86",stopColor:"#E50080"})]}),(0,r.jsxs)("radialGradient",{id:"paint2_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(9.6024 10.5042) scale(20.2076)",children:[(0,r.jsx)("stop",{offset:"0.3",stopColor:"#960E18"}),(0,r.jsx)("stop",{offset:"0.351",stopColor:"#B11927",stopOpacity:"0.74"}),(0,r.jsx)("stop",{offset:"0.435",stopColor:"#DB293D",stopOpacity:"0.343"}),(0,r.jsx)("stop",{offset:"0.497",stopColor:"#F5334B",stopOpacity:"0.094"}),(0,r.jsx)("stop",{offset:"0.53",stopColor:"#FF3750",stopOpacity:0})]}),(0,r.jsxs)("radialGradient",{id:"paint3_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(12.1034 -2.25084) scale(14.638)",children:[(0,r.jsx)("stop",{offset:"0.132",stopColor:"#FFF44F"}),(0,r.jsx)("stop",{offset:"0.252",stopColor:"#FFDC3E"}),(0,r.jsx)("stop",{offset:"0.506",stopColor:"#FF9D12"}),(0,r.jsx)("stop",{offset:"0.526",stopColor:"#FF980E"})]}),(0,r.jsxs)("radialGradient",{id:"paint4_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(7.35173 15.7558) scale(9.62111)",children:[(0,r.jsx)("stop",{offset:"0.353",stopColor:"#3A8EE6"}),(0,r.jsx)("stop",{offset:"0.472",stopColor:"#5C79F0"}),(0,r.jsx)("stop",{offset:"0.669",stopColor:"#9059FF"}),(0,r.jsx)("stop",{offset:1,stopColor:"#C139E6"})]}),(0,r.jsxs)("radialGradient",{id:"paint5_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(10.5799 8.76923) rotate(-13.5916) scale(5.10194 5.97309)",children:[(0,r.jsx)("stop",{offset:"0.206",stopColor:"#9059FF",stopOpacity:0}),(0,r.jsx)("stop",{offset:"0.278",stopColor:"#8C4FF3",stopOpacity:"0.064"}),(0,r.jsx)("stop",{offset:"0.747",stopColor:"#7716A8",stopOpacity:"0.45"}),(0,r.jsx)("stop",{offset:"0.975",stopColor:"#6E008B",stopOpacity:"0.6"})]}),(0,r.jsxs)("radialGradient",{id:"paint6_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(9.35238 1.50057) scale(6.9226)",children:[(0,r.jsx)("stop",{stopColor:"#FFE226"}),(0,r.jsx)("stop",{offset:"0.121",stopColor:"#FFDB27"}),(0,r.jsx)("stop",{offset:"0.295",stopColor:"#FFC82A"}),(0,r.jsx)("stop",{offset:"0.502",stopColor:"#FFA930"}),(0,r.jsx)("stop",{offset:"0.732",stopColor:"#FF7E37"}),(0,r.jsx)("stop",{offset:"0.792",stopColor:"#FF7139"})]}),(0,r.jsxs)("radialGradient",{id:"paint7_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(14.8545 -3.00121) scale(29.5361)",children:[(0,r.jsx)("stop",{offset:"0.113",stopColor:"#FFF44F"}),(0,r.jsx)("stop",{offset:"0.456",stopColor:"#FF980E"}),(0,r.jsx)("stop",{offset:"0.622",stopColor:"#FF5634"}),(0,r.jsx)("stop",{offset:"0.716",stopColor:"#FF3647"}),(0,r.jsx)("stop",{offset:"0.904",stopColor:"#E31587"})]}),(0,r.jsxs)("radialGradient",{id:"paint8_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(12.3996 -1.36343) rotate(83.976) scale(21.6445 14.2051)",children:[(0,r.jsx)("stop",{stopColor:"#FFF44F"}),(0,r.jsx)("stop",{offset:"0.06",stopColor:"#FFE847"}),(0,r.jsx)("stop",{offset:"0.168",stopColor:"#FFC830"}),(0,r.jsx)("stop",{offset:"0.304",stopColor:"#FF980E"}),(0,r.jsx)("stop",{offset:"0.356",stopColor:"#FF8B16"}),(0,r.jsx)("stop",{offset:"0.455",stopColor:"#FF672A"}),(0,r.jsx)("stop",{offset:"0.57",stopColor:"#FF3647"}),(0,r.jsx)("stop",{offset:"0.737",stopColor:"#E31587"})]}),(0,r.jsxs)("radialGradient",{id:"paint9_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(9.35233 4.00165) scale(18.4369)",children:[(0,r.jsx)("stop",{offset:"0.137",stopColor:"#FFF44F"}),(0,r.jsx)("stop",{offset:"0.48",stopColor:"#FF980E"}),(0,r.jsx)("stop",{offset:"0.592",stopColor:"#FF5634"}),(0,r.jsx)("stop",{offset:"0.655",stopColor:"#FF3647"}),(0,r.jsx)("stop",{offset:"0.904",stopColor:"#E31587"})]}),(0,r.jsxs)("radialGradient",{id:"paint10_radial_927_5847",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(14.1041 5.00184) scale(20.1801)",children:[(0,r.jsx)("stop",{offset:"0.094",stopColor:"#FFF44F"}),(0,r.jsx)("stop",{offset:"0.231",stopColor:"#FFE141"}),(0,r.jsx)("stop",{offset:"0.509",stopColor:"#FFAF1E"}),(0,r.jsx)("stop",{offset:"0.626",stopColor:"#FF980E"})]}),(0,r.jsxs)("linearGradient",{id:"paint11_linear_927_5847",x1:"17.5331",y1:"3.01533",x2:"3.84302",y2:"16.708",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{offset:"0.167",stopColor:"#FFF44F",stopOpacity:"0.8"}),(0,r.jsx)("stop",{offset:"0.266",stopColor:"#FFF44F",stopOpacity:"0.634"}),(0,r.jsx)("stop",{offset:"0.489",stopColor:"#FFF44F",stopOpacity:"0.217"}),(0,r.jsx)("stop",{offset:"0.6",stopColor:"#FFF44F",stopOpacity:0})]}),(0,r.jsx)("clipPath",{id:"clip0_927_5847",children:(0,r.jsx)("rect",{width:20,height:20,fill:"white"})})]})]}),o9=((0,r.jsxs)("svg",{"aria-hidden":"true",width:20,height:20,viewBox:"0 0 20 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[(0,r.jsx)("path",{d:"M17.2924 5.22043L17.7256 4.15905L16.4982 2.8883C15.8339 2.22404 14.4187 2.61393 14.4187 2.61393L12.8158 0.794434H7.16242L5.55231 2.62115C5.55231 2.62115 4.13715 2.23848 3.47289 2.8883L2.24545 4.15183L2.67866 5.21321L2.13715 6.78721L3.9422 13.6681C4.31765 15.141 4.57036 15.7114 5.63173 16.4623L8.93137 18.7006C9.24906 18.8955 9.63895 19.2349 9.99274 19.2349C10.3465 19.2349 10.7364 18.8955 11.0541 18.7006L14.3538 16.4623C15.4151 15.7114 15.6678 15.141 16.0433 13.6681L17.8483 6.78721L17.2924 5.22043Z",fill:"url(#paint0_linear_927_5861)"}),(0,r.jsx)("path",{d:"M13.9711 3.78343C13.9711 3.78343 16.0433 6.28884 16.0433 6.81592C16.0433 7.35744 15.7834 7.49462 15.5234 7.77621L13.9711 9.43686C13.8267 9.58126 13.5162 9.82675 13.6967 10.2527C13.8772 10.686 14.1299 11.2203 13.8411 11.769C13.5523 12.3249 13.0469 12.6932 12.722 12.6354C12.2387 12.4786 11.7777 12.2602 11.3502 11.9856C11.0758 11.8051 10.1949 11.0758 10.1949 10.7943C10.1949 10.5127 11.1047 10 11.278 9.89895C11.444 9.78343 12.2166 9.33577 12.231 9.16249C12.2455 8.9892 12.2455 8.94588 12.0144 8.51267C11.7834 8.07946 11.379 7.50184 11.4368 7.12639C11.509 6.75094 12.1588 6.54877 12.6426 6.36827L14.1372 5.80509C14.2527 5.74733 14.2238 5.69679 13.8772 5.66068C13.5307 5.6318 12.5559 5.50184 12.1155 5.62458C11.6751 5.74733 10.9386 5.93505 10.8664 6.03614C10.8086 6.13722 10.7509 6.13722 10.8159 6.48379L11.2346 8.75816C11.2635 9.04697 11.3213 9.24191 11.018 9.31411C10.7003 9.38632 10.1733 9.50906 9.99276 9.50906C9.81225 9.50906 9.27796 9.38632 8.96749 9.31411C8.65702 9.24191 8.71478 9.04697 8.75088 8.75816C8.77976 8.46935 9.09745 6.82314 9.16243 6.48379C9.23464 6.13722 9.16965 6.13722 9.11189 6.03614C9.03969 5.93505 8.29601 5.74733 7.85558 5.62458C7.42236 5.50184 6.44041 5.6318 6.09384 5.66791C5.74727 5.69679 5.71839 5.74011 5.83391 5.81231L7.3285 6.36827C7.80503 6.54877 8.46929 6.75094 8.53428 7.12639C8.60648 7.50906 8.19493 8.07946 7.95666 8.51267C7.71839 8.94588 7.72561 8.9892 7.74005 9.16249C7.75449 9.33577 8.53428 9.78343 8.69312 9.89895C8.86641 10.0073 9.77615 10.5127 9.77615 10.7943C9.77615 11.0758 8.91695 11.8051 8.62814 11.9856C8.20063 12.2602 7.73957 12.4786 7.2563 12.6354C6.93139 12.6932 6.42597 12.3249 6.12994 11.769C5.84113 11.2203 6.10106 10.686 6.27435 10.2527C6.45485 9.81953 6.1516 9.58848 5.99998 9.43686L4.44763 7.77621C4.19493 7.50906 3.935 7.36466 3.935 6.83036C3.935 6.29606 6.0072 3.79787 6.0072 3.79787L7.97832 4.11556C8.20937 4.11556 8.722 3.92061 9.19132 3.75455C9.66063 3.61014 9.98554 3.5957 9.98554 3.5957C9.98554 3.5957 10.3032 3.5957 10.7798 3.75455C11.2563 3.91339 11.7617 4.11556 11.9928 4.11556C12.231 4.11556 13.9783 3.77621 13.9783 3.77621L13.9711 3.78343ZM12.4188 13.3719C12.5487 13.4441 12.4693 13.6029 12.3465 13.6896L10.5126 15.1192C10.3682 15.2636 10.1372 15.4802 9.98554 15.4802C9.83391 15.4802 9.61009 15.2636 9.45846 15.1192C8.8506 14.6351 8.23683 14.1586 7.61731 13.6896C7.50178 13.6029 7.42236 13.4513 7.54511 13.3719L8.62814 12.7943C9.05864 12.5665 9.51417 12.3897 9.98554 12.2672C10.0938 12.2672 10.7798 12.5127 11.3357 12.7943L12.4188 13.3719Z",fill:"white"}),(0,r.jsx)("path",{d:"M14.4332 2.62115L12.8159 0.794434H7.16243L5.55232 2.62115C5.55232 2.62115 4.13716 2.23848 3.4729 2.8883C3.4729 2.8883 5.35016 2.72223 5.99998 3.77638L7.99276 4.11573C8.2238 4.11573 8.73644 3.92079 9.20575 3.75472C9.67507 3.61032 9.99998 3.59588 9.99998 3.59588C9.99998 3.59588 10.3177 3.59588 10.7942 3.75472C11.2707 3.91357 11.7761 4.11573 12.0072 4.11573C12.2455 4.11573 13.9928 3.77638 13.9928 3.77638C14.6426 2.72223 16.5198 2.8883 16.5198 2.8883C15.8556 2.22404 14.4404 2.61393 14.4404 2.61393",fill:"url(#paint1_linear_927_5861)"}),(0,r.jsxs)("defs",{children:[(0,r.jsxs)("linearGradient",{id:"paint0_linear_927_5861",x1:"2.13715",y1:"10.1991",x2:"17.8483",y2:"10.1991",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{offset:"0.4",stopColor:"#FF5500"}),(0,r.jsx)("stop",{offset:"0.6",stopColor:"#FF2000"})]}),(0,r.jsxs)("linearGradient",{id:"paint1_linear_927_5861",x1:"3.73384",y1:"2.4883",x2:"16.5198",y2:"2.4883",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#FF452A"}),(0,r.jsx)("stop",{offset:1,stopColor:"#FF2000"})]})]})]}),(0,r.jsxs)("svg",{"aria-hidden":"true",width:20,height:20,viewBox:"0 0 20 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[(0,r.jsxs)("g",{clipPath:"url(#clip0_927_5865)",children:[(0,r.jsx)("path",{d:"M18.0547 14.8828C17.7865 15.0222 17.5099 15.1448 17.2266 15.25C16.3293 15.584 15.3792 15.7533 14.4219 15.75C10.7266 15.75 7.50781 13.2109 7.50781 9.94531C7.51262 9.50803 7.63385 9.07993 7.85905 8.70506C8.08424 8.33019 8.40526 8.0221 8.78906 7.8125C5.44531 7.95312 4.58594 11.4375 4.58594 13.4766C4.58594 19.2578 9.90625 19.8359 11.0547 19.8359C11.6719 19.8359 12.6016 19.6562 13.1641 19.4766L13.2656 19.4453C15.4183 18.7014 17.2534 17.2465 18.4688 15.3203C18.5041 15.2618 18.5192 15.1933 18.5119 15.1253C18.5046 15.0574 18.4752 14.9937 18.4282 14.944C18.3812 14.8944 18.3192 14.8615 18.2518 14.8505C18.1843 14.8394 18.1151 14.8508 18.0547 14.8828Z",fill:"url(#paint0_linear_927_5865)"}),(0,r.jsx)("path",{opacity:"0.35",d:"M18.0547 14.8828C17.7865 15.0222 17.5099 15.1448 17.2266 15.25C16.3293 15.584 15.3792 15.7533 14.4219 15.75C10.7266 15.75 7.50781 13.2109 7.50781 9.94531C7.51262 9.50803 7.63385 9.07993 7.85905 8.70506C8.08424 8.33019 8.40526 8.0221 8.78906 7.8125C5.44531 7.95312 4.58594 11.4375 4.58594 13.4766C4.58594 19.2578 9.90625 19.8359 11.0547 19.8359C11.6719 19.8359 12.6016 19.6562 13.1641 19.4766L13.2656 19.4453C15.4183 18.7014 17.2534 17.2465 18.4688 15.3203C18.5041 15.2618 18.5192 15.1933 18.5119 15.1253C18.5046 15.0574 18.4752 14.9937 18.4282 14.944C18.3812 14.8944 18.3192 14.8615 18.2518 14.8505C18.1843 14.8394 18.1151 14.8508 18.0547 14.8828Z",fill:"url(#paint1_radial_927_5865)"}),(0,r.jsx)("path",{d:"M8.2578 18.8516C7.56239 18.4196 6.95961 17.854 6.48436 17.1875C5.94166 16.4447 5.56809 15.5921 5.38987 14.6896C5.21165 13.787 5.23311 12.8565 5.45272 11.9631C5.67234 11.0697 6.08479 10.2353 6.66115 9.51826C7.23751 8.80123 7.96379 8.21903 8.78905 7.8125C9.03905 7.69531 9.45311 7.49219 10.0078 7.5C10.3981 7.50302 10.7824 7.59627 11.1308 7.77245C11.4791 7.94864 11.7819 8.20299 12.0156 8.51562C12.3299 8.93835 12.5023 9.4498 12.5078 9.97656C12.5078 9.96094 14.4219 3.75781 6.2578 3.75781C2.82811 3.75781 0.00780015 7.00781 0.00780015 9.86719C-0.00584162 11.3776 0.317079 12.8721 0.953112 14.2422C1.99473 16.4602 3.81447 18.2185 6.06689 19.1834C8.3193 20.1483 10.8476 20.2526 13.1719 19.4766C12.3576 19.7337 11.4972 19.811 10.6501 19.7031C9.80297 19.5952 8.98941 19.3047 8.26561 18.8516H8.2578Z",fill:"url(#paint2_linear_927_5865)"}),(0,r.jsx)("path",{opacity:"0.41",d:"M8.2578 18.8516C7.56239 18.4196 6.95961 17.854 6.48436 17.1875C5.94166 16.4447 5.56809 15.5921 5.38987 14.6896C5.21165 13.787 5.23311 12.8565 5.45272 11.9631C5.67234 11.0697 6.08479 10.2353 6.66115 9.51826C7.23751 8.80123 7.96379 8.21903 8.78905 7.8125C9.03905 7.69531 9.45311 7.49219 10.0078 7.5C10.3981 7.50302 10.7824 7.59627 11.1308 7.77245C11.4791 7.94864 11.7819 8.20299 12.0156 8.51562C12.3299 8.93835 12.5023 9.4498 12.5078 9.97656C12.5078 9.96094 14.4219 3.75781 6.2578 3.75781C2.82811 3.75781 0.00780015 7.00781 0.00780015 9.86719C-0.00584162 11.3776 0.317079 12.8721 0.953112 14.2422C1.99473 16.4602 3.81447 18.2185 6.06689 19.1834C8.3193 20.1483 10.8476 20.2526 13.1719 19.4766C12.3576 19.7337 11.4972 19.811 10.6501 19.7031C9.80297 19.5952 8.98941 19.3047 8.26561 18.8516H8.2578Z",fill:"url(#paint3_radial_927_5865)"}),(0,r.jsx)("path",{d:"M11.9062 11.625C11.8359 11.7031 11.6406 11.8203 11.6406 12.0625C11.6406 12.2656 11.7734 12.4688 12.0156 12.6328C13.1328 13.4141 15.25 13.3047 15.2578 13.3047C16.0907 13.3041 16.9081 13.0802 17.625 12.6562C18.3467 12.2341 18.9456 11.6307 19.3622 10.9057C19.7788 10.1808 19.9986 9.35955 20 8.52344C20.0234 6.77344 19.375 5.60937 19.1172 5.09375C17.4531 1.85937 13.8828 4.89564e-08 10 4.89564e-08C7.37202 -0.00025981 4.84956 1.03398 2.97819 2.87904C1.10682 4.7241 0.0369559 7.23166 0 9.85938C0.0390625 7.00781 2.875 4.70312 6.25 4.70312C6.52344 4.70312 8.08594 4.72656 9.53125 5.48438C10.5466 5.98895 11.3875 6.78627 11.9453 7.77344C12.4219 8.60156 12.5078 9.65625 12.5078 10.0781C12.5078 10.5 12.2969 11.1172 11.8984 11.6328L11.9062 11.625Z",fill:"url(#paint4_radial_927_5865)"}),(0,r.jsx)("path",{d:"M11.9062 11.625C11.8359 11.7031 11.6406 11.8203 11.6406 12.0625C11.6406 12.2656 11.7734 12.4688 12.0156 12.6328C13.1328 13.4141 15.25 13.3047 15.2578 13.3047C16.0907 13.3041 16.9081 13.0802 17.625 12.6562C18.3467 12.2341 18.9456 11.6307 19.3622 10.9057C19.7788 10.1808 19.9986 9.35955 20 8.52344C20.0234 6.77344 19.375 5.60937 19.1172 5.09375C17.4531 1.85937 13.8828 4.89564e-08 10 4.89564e-08C7.37202 -0.00025981 4.84956 1.03398 2.97819 2.87904C1.10682 4.7241 0.0369559 7.23166 0 9.85938C0.0390625 7.00781 2.875 4.70312 6.25 4.70312C6.52344 4.70312 8.08594 4.72656 9.53125 5.48438C10.5466 5.98895 11.3875 6.78627 11.9453 7.77344C12.4219 8.60156 12.5078 9.65625 12.5078 10.0781C12.5078 10.5 12.2969 11.1172 11.8984 11.6328L11.9062 11.625Z",fill:"url(#paint5_radial_927_5865)"})]}),(0,r.jsxs)("defs",{children:[(0,r.jsxs)("linearGradient",{id:"paint0_linear_927_5865",x1:"4.58594",y1:"13.8281",x2:"18.5234",y2:"13.8281",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#0C59A4"}),(0,r.jsx)("stop",{offset:1,stopColor:"#114A8B"})]}),(0,r.jsxs)("radialGradient",{id:"paint1_radial_927_5865",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(12.2813 13.9332) scale(7.45313 7.08047)",children:[(0,r.jsx)("stop",{offset:"0.7",stopOpacity:0}),(0,r.jsx)("stop",{offset:"0.9",stopOpacity:"0.5"}),(0,r.jsx)("stop",{offset:1})]}),(0,r.jsxs)("linearGradient",{id:"paint2_linear_927_5865",x1:"11.9297",y1:"7.78125",x2:"3.23436",y2:"17.2578",gradientUnits:"userSpaceOnUse",children:[(0,r.jsx)("stop",{stopColor:"#1B9DE2"}),(0,r.jsx)("stop",{offset:"0.2",stopColor:"#1595DF"}),(0,r.jsx)("stop",{offset:"0.7",stopColor:"#0680D7"}),(0,r.jsx)("stop",{offset:1,stopColor:"#0078D4"})]}),(0,r.jsxs)("radialGradient",{id:"paint3_radial_927_5865",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(5.51209 15.5419) rotate(-81.3844) scale(11.202 9.05011)",children:[(0,r.jsx)("stop",{offset:"0.8",stopOpacity:0}),(0,r.jsx)("stop",{offset:"0.9",stopOpacity:"0.5"}),(0,r.jsx)("stop",{offset:1})]}),(0,r.jsxs)("radialGradient",{id:"paint4_radial_927_5865",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(2.02266 3.69656) rotate(92.2906) scale(15.8251 33.7043)",children:[(0,r.jsx)("stop",{stopColor:"#35C1F1"}),(0,r.jsx)("stop",{offset:"0.1",stopColor:"#34C1ED"}),(0,r.jsx)("stop",{offset:"0.2",stopColor:"#2FC2DF"}),(0,r.jsx)("stop",{offset:"0.3",stopColor:"#2BC3D2"}),(0,r.jsx)("stop",{offset:"0.7",stopColor:"#36C752"})]}),(0,r.jsxs)("radialGradient",{id:"paint5_radial_927_5865",cx:0,cy:0,r:1,gradientUnits:"userSpaceOnUse",gradientTransform:"translate(18.7547 6.03906) rotate(73.7398) scale(7.60156 6.18159)",children:[(0,r.jsx)("stop",{stopColor:"#66EB6E"}),(0,r.jsx)("stop",{offset:1,stopColor:"#66EB6E",stopOpacity:0})]}),(0,r.jsx)("clipPath",{id:"clip0_927_5865",children:(0,r.jsx)("rect",{width:20,height:20,fill:"white"})})]})]}));var o8={Chrome:o5,FireFox:o4,Edge:o9};let o3=n.forwardRef(({browser:o},e)=>{let t;let n=null!=o?o:detectBrowser();switch(n){case"chrome":t=o8.Chrome;break;case"firefox":t=o8.FireFox;break;case"edge":t=o8.Edge}return t?(0,r.jsx)(o2,{children:t}):(0,r.jsx)(r.Fragment,{})});o3.displayName="BrowserIcon";let o7="alph:lastConnectedAccount";function getStorage(){var o;return null===(o=globalThis.window)||void 0===o?void 0:o.localStorage}function setLastConnectedAccount(o,e,t){let r=getStorage();void 0!==r&&r.setItem(o7,JSON.stringify({connectorId:o,account:e,network:t}))}function removeLastConnectedAccount(){let o=getStorage();void 0!==o&&o.removeItem(o7)}function useConnect(){let{connectorId:o}=useConnectSettingContext(),{signerProvider:e,setSignerProvider:t,setConnectionStatus:r,setAccount:a,addressGroup:i,network:c,keyType:s,connectors:d}=useAlephiumConnectContext(),l=(0,n.useCallback)(()=>{removeLastConnectedAccount(),t(void 0),a(void 0)},[t,a]),p=(0,n.useCallback)(o=>{a(o.account),t(o.signerProvider)},[a,t]),u=(0,n.useMemo)(()=>({network:c,addressGroup:i,keyType:s,onDisconnected:l,onConnected:p}),[l,p,c,i,s]),b=(0,n.useMemo)(()=>d[`${o}`],[o,d]),x=(0,n.useMemo)(()=>async o=>(r("connecting"),await b.connect({...u,injectedProviderId:o})),[b,u,r]),k=(0,n.useMemo)(()=>async()=>{e&&await b.disconnect(e)},[b,e]);return(0,n.useMemo)(()=>({connect:x,disconnect:k}),[x,k])}let o6=function(){let o=new Set,e=[],addNewProvider=t=>{void 0===e.find(o=>o.icon===t.icon)&&(e.push(t),o.forEach(o=>o([...e])))},detectOneKeyProvider=()=>{let o=window.alephium;o&&(0,x.OF)(o)&&addNewProvider(o)},detectDefaultProvider=()=>{let o=(0,x.vw)(x.jQ.id);if(void 0!==o){addNewProvider(o);return}window.addEventListener((0,x.qH)(x.jQ.id),()=>{let o=(0,x.vw)(x.jQ.id);void 0!==o&&addNewProvider(o)},{once:!0})},detectProviders=()=>{if("undefined"!=typeof window){detectOneKeyProvider(),detectDefaultProvider();let handler=o=>{o.detail&&(0,x.OF)(o.detail.provider)&&addNewProvider(o.detail.provider)};return window.addEventListener("announceAlephiumProvider",handler),window.dispatchEvent(new Event("requestAlephiumProvider")),()=>window.removeEventListener("announceAlephiumProvider",handler)}},t=detectProviders();return{getProviders:()=>e,subscribe:e=>(o.add(e),()=>o.delete(e)),reset:()=>{e=[],null==t||t(),t=detectProviders()}}}();function getInjectedProviderId(o){return o.icon.includes("onekey")?"OneKey":"Alephium"}async function getInjectedProvider(o,e){return void 0===e?(0,x.Ul)():o.find(o=>getInjectedProviderId(o)===e)}let useInjectedProviders=()=>(0,b.useSyncExternalStore)(o6.subscribe,o6.getProviders,o6.getProviders),eo={CONNECTED:"connected",LISTING:"listing",CONNECTING:"connecting",EXPIRING:"expiring",FAILED:"failed",REJECTED:"rejected",NOTCONNECTED:"notconnected",UNAVAILABLE:"unavailable"},ee={initial:{willChange:"transform,opacity",position:"relative",opacity:0,scale:.95},animate:{position:"relative",opacity:1,scale:1,transition:{ease:[.16,1,.3,1],duration:.4,delay:.05,position:{delay:0}}},exit:{position:"absolute",opacity:0,scale:.95,transition:{ease:[.16,1,.3,1],duration:.3}}},ConnectWithInjector=({connectorId:o,switchConnectMethod:e,forceState:t})=>{var a,c;let{setOpen:s}=useConnectSettingContext(),d=useInjectedProviders(),[l,p]=(0,n.useState)(0!==d.length?getInjectedProviderId(d[0]):void 0);console.log(`providers size: ${d.length}`);let{connect:u}=useConnect(),[b,x]=(0,n.useState)(o),[k,h]=(0,n.useState)(!1),f=oh.filter(o=>o.id===b)[0];(0,n.useState)(9);let g=d.length>0,v=detectBrowser(),C=f.extensions?f.extensions[v]:void 0,m=f.extensions?{name:Object.keys(f.extensions)[0],label:Object.keys(f.extensions)[0].charAt(0).toUpperCase()+Object.keys(f.extensions)[0].slice(1),url:f.extensions[Object.keys(f.extensions)[0]]}:void 0,y=d.length>1?eo.LISTING:eo.CONNECTING,[w,F]=(0,n.useState)(t||(g?y:eo.UNAVAILABLE)),j=(0,n.useCallback)(o=>{p(o),F(eo.CONNECTING)},[F,p]),E=(0,n.useCallback)(()=>{g&&w!==eo.LISTING&&u(l).then(o=>{o&&F(eo.CONNECTED),s(!1)})},[g,s,u,w,l]),A=(0,n.useRef)();return((0,n.useEffect)(()=>{if(w!==eo.UNAVAILABLE)return A.current=setTimeout(E,600),()=>{clearTimeout(A.current)}},[w,E]),f)?"walletConnect"===f.id?(0,r.jsx)(S,{children:(0,r.jsxs)(oD,{children:[(0,r.jsx)(I,{children:"Invalid State"}),(0,r.jsx)(M,{children:(0,r.jsx)(oJ,{children:"WalletConnect does not have an injection flow. This state should never happen."})})]})}):(0,r.jsx)(S,{children:(0,r.jsxs)(oD,{children:[w===eo.LISTING&&(0,r.jsx)(r.Fragment,{children:(0,r.jsx)(of,{children:d.map(o=>{let e=getInjectedProviderId(o);return(0,r.jsxs)(og,{onClick:()=>j(e),children:[(0,r.jsx)(oC,{children:(0,r.jsx)("img",{src:o.icon,alt:"Icon"})}),(0,r.jsx)(ov,{children:e})]},e)})})}),w!==eo.LISTING&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(oB,{children:(0,r.jsxs)(oL,{$shake:w===eo.FAILED||w===eo.REJECTED,$circle:!0,children:[(0,r.jsx)(i.M,{children:(w===eo.FAILED||w===eo.REJECTED)&&(0,r.jsx)(o_,{"aria-label":"Retry",initial:{opacity:0,scale:.8},animate:{opacity:1,scale:1},exit:{opacity:0,scale:.8},whileTap:{scale:.9},transition:{duration:.1},onClick:E,children:(0,r.jsx)(oS,{children:(0,r.jsx)(Tooltip,{open:k&&(w===eo.FAILED||w===eo.REJECTED),message:"try again",xOffset:-6,children:(0,r.jsx)(RetryIconCircle,{})})})})}),(0,r.jsx)(CircleSpinner,{logo:w===eo.UNAVAILABLE?(0,r.jsx)("div",{style:{transform:"scale(1.14)",position:"relative",width:"100%"},children:null!==(a=f.logos.transparent)&&void 0!==a?a:f.logos.default}):(0,r.jsx)(r.Fragment,{children:null!==(c=f.logos.transparent)&&void 0!==c?c:f.logos.default}),smallLogo:"injected"===f.id,connecting:w===eo.CONNECTING,unavailable:w===eo.UNAVAILABLE,countdown:w===eo.EXPIRING})]})}),(0,r.jsx)($,{children:(0,r.jsxs)(i.M,{initial:!1,children:[w===eo.FAILED&&(0,r.jsxs)(oj,{initial:"initial",animate:"animate",exit:"exit",variants:ee,children:[(0,r.jsxs)(M,{children:[(0,r.jsxs)(T,{$error:!0,children:[(0,r.jsx)(AlertIcon,{}),"failed"]}),(0,r.jsx)(N,{children:"failed"})]}),f.scannable&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(OrDivider,{}),(0,r.jsx)(Button,{icon:(0,r.jsx)(Scan,{}),onClick:()=>e(b),children:"scan qr code"})]})]},eo.FAILED),w===eo.REJECTED&&(0,r.jsxs)(oj,{initial:"initial",animate:"animate",exit:"exit",variants:ee,children:[(0,r.jsxs)(M,{style:{paddingBottom:28},children:[(0,r.jsx)(T,{children:"rejected"}),(0,r.jsx)(N,{children:"rejected"})]}),f.scannable&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(OrDivider,{}),(0,r.jsx)(Button,{icon:(0,r.jsx)(Scan,{}),onClick:()=>e(b),children:"scan the qr code"})]})]},eo.REJECTED),(w===eo.CONNECTING||w===eo.EXPIRING)&&(0,r.jsx)(oj,{initial:"initial",animate:"animate",exit:"exit",variants:ee,children:(0,r.jsx)(M,{style:{paddingBottom:28},children:(0,r.jsx)(T,{children:"injected"===f.id?"connecting":"rejected"})})},eo.CONNECTING),w===eo.CONNECTED&&(0,r.jsx)(oj,{initial:"initial",animate:"animate",exit:"exit",variants:ee,children:(0,r.jsx)(M,{children:(0,r.jsxs)(T,{$valid:!0,children:[(0,r.jsx)(TickIcon,{})," ","Connected"]})})},eo.CONNECTED),w===eo.NOTCONNECTED&&(0,r.jsx)(oj,{initial:"initial",animate:"animate",exit:"exit",variants:ee,children:(0,r.jsx)(M,{children:(0,r.jsx)(T,{children:"Not Connected"})})},eo.NOTCONNECTED),w===eo.UNAVAILABLE&&(0,r.jsx)(oj,{initial:"initial",animate:"animate",exit:"exit",variants:ee,children:C?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(M,{style:{paddingBottom:18},children:(0,r.jsx)(T,{children:"Install"})}),!g&&C&&(0,r.jsx)(Button,{href:C,icon:(0,r.jsx)(o3,{}),children:"Install the extension"})]}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(M,{style:{paddingBottom:12},children:(0,r.jsx)(T,{children:"Not Available"})}),!g&&m&&(0,r.jsxs)(Button,{href:null==m?void 0:m.url,icon:(0,r.jsx)(o3,{browser:null==m?void 0:m.name}),children:["Install on ",null==m?void 0:m.label]})]})},eo.UNAVAILABLE)]})})]})]})}):(0,r.jsx)(S,{children:(0,r.jsxs)(oD,{children:[(0,r.jsx)(I,{children:"Invalid State"}),(0,r.jsx)(M,{children:(0,r.jsx)(oJ,{children:"No connectors match the id given. This state should never happen."})})]})})},et=!1,ConnectWithWalletConnect=()=>{let{setOpen:o}=useConnectSettingContext(),[e,t]=(0,n.useState)(),{connect:a}=useConnect();return(0,n.useEffect)(()=>{et||a().then(()=>{et=!0,o(!1),t(void 0)}).catch(o=>t(`${o}`))},[a,o]),(0,r.jsx)(S,{children:(0,r.jsx)(oD,{children:void 0!==e?e:"Connecting to wallet connect"})})},ConnectWithDesktopWallet=()=>{let[o,e]=(0,n.useState)(),{connect:t}=useConnect();return(0,n.useEffect)(()=>{t().catch(o=>e(`${o}`))},[t]),(0,r.jsx)(S,{children:(0,r.jsx)(oD,{children:void 0!==o?o:"Opening desktop wallet..."})})},er={QRCODE:"QRCODE",INJECTOR:"INJECTOR",DESKTOPWALLET:"DESKTOPWALLET"},ConnectUsing=({connectorId:o})=>{let[e,t]=(0,n.useState)(o),c=oh.filter(o=>o.id===e)[0],s=c.extensionIsInstalled&&c.extensionIsInstalled(),d=(!c.scannable||s)&&"desktopWallet"!==o,[l,p]=(0,n.useState)(d?er.INJECTOR:"desktopWallet"===o?er.DESKTOPWALLET:er.QRCODE);return c?l===er.QRCODE?(0,r.jsx)(ConnectWithWalletConnect,{}):l===er.DESKTOPWALLET?(0,r.jsx)(ConnectWithDesktopWallet,{}):(0,r.jsx)(i.M,{children:l===er.INJECTOR&&(0,r.jsx)(a.E.div,{initial:"initial",animate:"animate",exit:"exit",variants:ou,children:(0,r.jsx)(ConnectWithInjector,{connectorId:e,switchConnectMethod:o=>{o&&t(o),p(er.QRCODE)}})},er.INJECTOR)}):(0,r.jsx)(oJ,{children:"Connector not found"})},en=w(a.E.div)`
  transition: all 220ms cubic-bezier(0.175, 0.885, 0.32, 1.1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  svg {
    display: block;
  }
  svg,
  svg path,
  svg rect {
    transition: inherit;
  }
  svg path:first-child {
    transform-origin: 50% 50%;
    fill: var(--bg);
    stroke: var(--color);
  }
  svg rect {
    transform-origin: 53% 63%;
    fill: var(--bg);
    stroke: var(--color);
  }
  svg path:last-child {
    opacity: 0;
    stroke: var(--bg);
    transform: translate(11.75px, 10px) rotate(90deg) scale(0.6);
  }
  ${o=>o.$clipboard?d.iv`
          --color: var(--ck-focus-color) !important;
          --bg: var(--ck-body-background);
          svg {
            transition-delay: 0ms;
            path:first-child {
              opacity: 0;
              transform: rotate(-90deg) scale(0.2);
            }
            rect {
              rx: 10px;
              fill: var(--color);
              transform: rotate(-90deg) scale(1.45);
            }
            path:last-child {
              transition-delay: 100ms;
              opacity: 1;
              transform: translate(7.75px, 9.5px);
            }
          }
        `:d.iv`
          &:hover {
          }
          &:hover:active {
          }
        `}
`,CopyToClipboardIcon=({copied:o,small:e})=>(0,r.jsx)(en,{$clipboard:o,children:(0,r.jsx)(CopyToClipboardIcon$1,{style:{transform:e?"scale(1)":"translateX(3px) scale(1.5)",opacity:e||o?1:.3}})}),ea=w.div`
  --color: var(--ck-copytoclipboard-stroke);
  --bg: var(--ck-body-background);
  transition: all 220ms cubic-bezier(0.175, 0.885, 0.32, 1.1);

  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  ${o=>o.$disabled?d.iv`
          cursor: not-allowed;
          opacity: 0.4;
        `:d.iv`
          &:hover {
            --color: var(--ck-body-color-muted);
          }
        `}
`,ei=w.div`
  display: block;
  position: relative;
  transition: inherit;
  svg {
    position: absolute;
    left: 100%;
    display: block;
    top: -1px;
    margin: 0;
    margin-left: 4px;
  }
`,CopyToClipboard=({string:o,children:e,variant:t})=>{let a;let[i,c]=(0,n.useState)(!1),onCopy=()=>{if(!o)return;let e=o.trim();navigator.clipboard&&navigator.clipboard.writeText(e),c(!0),clearTimeout(a),a=setTimeout(()=>c(!1),1e3)};return"button"===t?(0,r.jsx)(Button,{disabled:!o,onClick:onCopy,icon:(0,r.jsx)(CopyToClipboardIcon,{copied:i}),children:e}):(0,r.jsx)(ea,{onClick:onCopy,$disabled:!o,children:(0,r.jsxs)(ei,{children:[e,(0,r.jsx)(CopyToClipboardIcon,{copied:i,small:!0})]})})},Profile=({closeModal:o})=>{let{displayAccount:e,setOpen:t}=useConnectSettingContext(),{account:a}=useAlephiumConnectContext(),{disconnect:i}=useConnect(),[c,s]=(0,n.useState)(!1),d=a?e?e(a):a.address:void 0;return(0,n.useEffect)(()=>{if(c)return o?o():t(!1),()=>{i(),t(!1)}},[c,i,o,t]),(0,r.jsxs)(S,{children:[(0,r.jsx)(M,{style:{paddingBottom:22,gap:6},children:(0,r.jsx)(T,{children:(0,r.jsx)(CopyToClipboard,{string:d,children:d&&truncatedAddress(d)})})}),(0,r.jsx)(Button,{onClick:()=>s(!0),icon:(0,r.jsx)(DisconnectIcon,{}),children:"Disconnect"})]})},ec={},ConnectModal=({mode:o="auto",theme:e="auto",customTheme:t=ec})=>{let{route:a,setRoute:i,open:c,setOpen:s,connectorId:d,setMode:l,setTheme:p,setCustomTheme:u}=useConnectSettingContext(),{account:b,network:x,addressGroup:k,keyType:h}=useAlephiumConnectContext(),f=(0,n.useRef)(x),g=(0,n.useRef)(k),v=(0,n.useRef)(h),C=!!b,{disconnect:m}=useConnect();(0,n.useEffect)(()=>{C&&f.current!==x&&m(),f.current=x},[x,f,m,C]),(0,n.useEffect)(()=>{C&&void 0!==k&&g.current!==k&&m(),g.current=k},[k,g,m,C]),(0,n.useEffect)(()=>{C&&v.current!==h&&m(),v.current=h},[h,v,m,C]);let y=a!==ob.CONNECTORS&&a!==ob.PROFILE,w=[{id:"CONNECTORS",content:(0,r.jsx)(Connectors,{})},{id:"CONNECT",content:(0,r.jsx)(ConnectUsing,{connectorId:d})},{id:"PROFILE",content:(0,r.jsx)(Profile,{})}],F=(0,n.useCallback)(()=>{s(!1)},[s]);return(0,n.useEffect)(()=>{C&&a!==ob.PROFILE&&F()},[C,a,F]),(0,n.useEffect)(()=>l(o),[l,o]),(0,n.useEffect)(()=>p(e),[p,e]),(0,n.useEffect)(()=>u(t),[u,t]),(0,n.useEffect)(()=>{if(!c)return;let o=document.createElement("meta");return o.setAttribute("property","og:title"),o.setAttribute("content","alephium"),document.head.prepend(o),()=>{document.head.removeChild(o)}},[c]),(0,r.jsx)(Modal,{open:c,pages:w,pageId:a,onClose:F,onInfo:void 0,onBack:y?()=>{i(ob.CONNECTORS)}:void 0})},es=["injected","walletConnect","desktopWallet"],ed="6e2562e43678dd68a9070a62b6d52207";async function _wcConnect(o,e,t){let r=await h.WalletConnectProvider.init({projectId:ed,networkId:e.network,addressGroup:e.addressGroup,onDisconnected:e.onDisconnected,...e.signClientOptions});r.on("displayUri",o),r.on("session_delete",e.onDisconnected);try{if(await r.connect(),r.account)return await e.onConnected({account:r.account,signerProvider:r}),setLastConnectedAccount(t,r.account,e.network),r.account}catch(o){console.error("Wallet connect error:",o),e.onDisconnected()}}let wcAutoConnect=async(o,e)=>{try{let t=await h.WalletConnectProvider.init({projectId:ed,networkId:o.network,addressGroup:o.addressGroup,onDisconnected:o.onDisconnected,...o.signClientOptions});t.on("session_delete",o.onDisconnected);let r=t.isPreauthorized();if(!r)return;if(await t.connect(),t.account)return await o.onConnected({account:t.account,signerProvider:t}),setLastConnectedAccount(e,t.account,o.network),t.account}catch(e){console.error(`Wallet connect auto-connect error: ${e}`),o.onDisconnected()}},wcDisconnect=async o=>{await o.disconnect()},ConnectSettingProvider=({theme:o="auto",mode:e="auto",customTheme:t,csrModeOnly:a,children:i})=>{let c=(0,n.useContext)(C);if(c)throw Error("Multiple, nested usages of ConnectSettingContext detected. Please use only one.");let[s,d]=(0,n.useState)(o),[l,p]=(0,n.useState)(e),[u,b]=(0,n.useState)(null!=t?t:{}),[x,k]=(0,n.useState)(!1),[h,f]=(0,n.useState)("injected"),[g,v]=(0,n.useState)(ob.CONNECTORS),[m,y]=(0,n.useState)("");return(0,n.useEffect)(()=>d(o),[o]),(0,n.useEffect)(()=>p(e),[e]),(0,n.useEffect)(()=>b(null!=t?t:{}),[t]),(0,r.jsx)(C.Provider,{value:{open:x,setOpen:k,route:g,setRoute:v,connectorId:h,setConnectorId:f,theme:s,setTheme:d,mode:l,setMode:p,customTheme:u,setCustomTheme:b,csrModeOnly:null!=a&&a,errorMessage:m},children:i})},DefaultThemeProvider=({children:o})=>{let e=useConnectSettingContext();return(0,r.jsxs)(d.f6,{theme:v,children:[o,(0,r.jsx)(ConnectModal,{theme:e.theme,mode:e.mode,customTheme:e.customTheme})]})},AlephiumConnectProvider=({network:o,addressGroup:e,keyType:t,children:a,connectors:i})=>{let c=(0,n.useContext)(m);if(c)throw Error("Multiple, nested usages of AlephiumConnectProvider detected. Please use only one.");let[s,d]=(0,n.useState)(o),[l,p]=(0,n.useState)(e),[u,b]=(0,n.useState)(null!=t?t:"default"),k=useInjectedProviders(),h=(0,n.useMemo)(()=>({injected:{connect:async o=>{try{let e=await getInjectedProvider(k,o.injectedProviderId),t={addressGroup:o.addressGroup,keyType:o.keyType,networkId:o.network,onDisconnected:o.onDisconnected},r=await (null==e?void 0:e.enable(t));if(e&&r)return await o.onConnected({account:r,signerProvider:e}),setLastConnectedAccount("injected",r,o.network),r}catch(e){console.error("Wallet connect error:",e),o.onDisconnected()}},disconnect:async o=>await o.disconnect(),autoConnect:async o=>{try{let e=[...k];if(0===e.length){let o=await (0,x.Ul)();void 0!==o&&e.push(o)}let t={addressGroup:o.addressGroup,keyType:o.keyType,networkId:o.network,onDisconnected:void 0};for(let r of e){let e=await r.enableIfConnected(t);if(e)return await o.onConnected({account:e,signerProvider:r}),setLastConnectedAccount("injected",e,o.network),r.onDisconnected=o.onDisconnected,e}}catch(e){console.error("Wallet auto-connect error:",e),o.onDisconnected()}}},walletConnect:function(o){let e="walletConnect";return{connect:async t=>{let r=await _wcConnect(o=>f.open(o,()=>console.log("qr closed")),{...t,signClientOptions:o},e);return f.close(),r},disconnect:wcDisconnect,autoConnect:async t=>await wcAutoConnect({...t,signClientOptions:o},e)}}(void 0),desktopWallet:function(o){let e="desktopWallet";return{connect:async t=>await _wcConnect(o=>window.open(`alephium://wc?uri=${o}`),{...t,signClientOptions:o},e),disconnect:wcDisconnect,autoConnect:async t=>await wcAutoConnect({...t,signClientOptions:o},e)}}(void 0)}),[k]),g=(0,n.useMemo)(()=>void 0===i||0===Object.keys(i).length?h:{...h,...i},[h,i]);(0,n.useEffect)(()=>d(o),[o]),(0,n.useEffect)(()=>p(e),[e]),(0,n.useEffect)(()=>b(null!=t?t:"default"),[t]);let v=(0,n.useMemo)(()=>{let o=function(){let o=getStorage();if(void 0===o)return;let e=o.getItem(o7);return null===e?void 0:JSON.parse(e)}();if(void 0!==o&&o.network===s&&(void 0===l||o.account.group===l)&&(void 0===u||o.account.keyType===u))return o},[s,l,u]),[C,y]=(0,n.useState)(void 0!==v?"connecting":"disconnected"),[w,F]=(0,n.useState)(null==v?void 0:v.account),[j,E]=(0,n.useState)(),A=(0,n.useCallback)(o=>{E(o),y(void 0===o?"disconnected":"connected")},[E,y]),D=(0,n.useCallback)(o=>{F(e=>(null==e?void 0:e.address)===(null==o?void 0:o.address)?e:o)},[F]);return(0,n.useEffect)(()=>{let func=async()=>{let onDisconnected=()=>{removeLastConnectedAccount(),D(void 0),A(void 0)},onConnected=o=>{D(o.account),A(o.signerProvider)};try{let r=null==v?void 0:v.connectorId,n=Array.from(es),a=void 0===r?n:[r].concat(n.filter(o=>o!==r));for(let r of a){let n=g[`${r}`];if(void 0!==n.autoConnect){let r=await n.autoConnect({network:o,addressGroup:e,keyType:t,onDisconnected,onConnected});if(void 0!==r)return}}}catch(o){console.error(o)}onDisconnected()};func()},[]),(0,r.jsx)(m.Provider,{value:{network:s,setNetwork:d,addressGroup:l,setAddressGroup:p,keyType:null!=u?u:"default",setKeyType:b,account:w,connectionStatus:C,setConnectionStatus:y,setAccount:D,signerProvider:j,setSignerProvider:A,connectors:g},children:a})},AlephiumBalanceProvider=({children:o})=>{let e=(0,n.useContext)(y);if(e)throw Error("Multiple, nested usages of AlephiumBalanceProvider detected. Please use only one.");let{account:t,signerProvider:a,network:i}=useAlephiumConnectContext(),[c,s]=(0,n.useState)(),d=(0,n.useCallback)(async()=>{var o;let e=null!==(o=function(){try{return k.web3.getCurrentNodeProvider()}catch(o){return}}())&&void 0!==o?o:null==a?void 0:a.nodeProvider;if(e&&t){let o=await e.addresses.getAddressesAddressBalance(t.address);s(e=>void 0!==e&&(0,k.isBalanceEqual)(e,o)?e:o)}else void 0===t&&s(void 0)},[t,a]),l=(0,n.useCallback)((o,e)=>{if(void 0===t)throw Error("Wallet is not connected");let r=null!=e?e:1,n="devnet"===i?1e3:4e3,messageCallback=async o=>{"Confirmed"===o.type&&o.chainConfirmations>=r&&await d()};(0,k.subscribeToTxStatus)({pollingInterval:n,messageCallback,errorCallback:(o,e)=>(e.unsubscribe(),console.error(`tx status subscription error: ${o}`),Promise.resolve())},o,void 0,void 0,r)},[d,t,i]);return(0,n.useEffect)(()=>{void 0===t&&s(void 0)},[t]),(0,r.jsx)(y.Provider,{value:{balance:c,updateBalance:d,updateBalanceForTx:l},children:o})},AlephiumWalletProvider=({theme:o,customTheme:e,network:t,addressGroup:n,keyType:a,connectors:i,csrModeOnly:c,children:s})=>(0,r.jsx)(AlephiumConnectProvider,{network:t,addressGroup:n,keyType:a,connectors:i,children:(0,r.jsx)(ConnectSettingProvider,{theme:"simple-light"===o||"simple-dark"===o?"auto":o,mode:"simple-light"===o?"light":"simple-dark"===o?"dark":"auto",customTheme:e,csrModeOnly:c,children:(0,r.jsx)(DefaultThemeProvider,{children:(0,r.jsx)(AlephiumBalanceProvider,{children:s})})})});function useIsMounted(){let[o,e]=(0,n.useState)(!1);return(0,n.useEffect)(()=>e(!0),[]),o}let el=w(a.E.div)`
  top: 0;
  bottom: 0;
  left: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
`,ep=w(a.E.div)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  height: 40px;
  padding: 0;
  line-height: 0;
  letter-spacing: -0.2px;
  font-size: var(--ck-connectbutton-font-size, 16px);
  font-weight: var(--ck-connectbutton-font-weight, 500);
  text-align: center;
  transition: 100ms ease;
  transition-property: color, background, box-shadow, border-radius;

  color: var(--color);
  background: var(--background);
  box-shadow: var(--box-shadow);
  border-radius: var(--border-radius);

  &.primary {
    --color: var(--ck-connectbutton-color);
    --background: var(--ck-connectbutton-background);
    --box-shadow: var(--ck-connectbutton-box-shadow);
    --border-radius: var(--ck-connectbutton-border-radius, 12px);

    --hover-color: var(--ck-connectbutton-hover-color, var(--color));
    --hover-background: var(--ck-connectbutton-hover-background, var(--background));
    --hover-box-shadow: var(--ck-connectbutton-hover-box-shadow, var(--box-shadow));
    --hover-border-radius: var(--ck-connectbutton-hover-border-radius, var(--border-radius));

    --active-color: var(--ck-connectbutton-active-color, var(--hover-color));
    --active-background: var(--ck-connectbutton-active-background, var(--hover-background));
    --active-box-shadow: var(--ck-connectbutton-active-box-shadow, var(--hover-box-shadow));
    --active-border-radius: var(--ck-connectbutton-active-border-radius, var(--hover-border-radius));
  }
  &.secondary {
    --color: var(--ck-connectbutton-balance-color);
    --background: var(--ck-connectbutton-balance-background);
    --box-shadow: var(--ck-connectbutton-balance-box-shadow);
    --border-radius: var(--ck-connectbutton-balance-border-radius, var(--ck-connectbutton-border-radius, 12px));

    --hover-color: var(--ck-connectbutton-balance-hover-color, var(--color));
    --hover-background: var(--ck-connectbutton-balance-hover-background, var(--background));
    --hover-box-shadow: var(--ck-connectbutton-balance-hover-box-shadow, var(--box-shadow));
    --hover-border-radius: var(--ck-connectbutton-balance-hover-border-radius, var(--border-radius));

    --active-color: var(--ck-connectbutton-balance-active-color, var(--hover-color));
    --active-background: var(--ck-connectbutton-balance-active-background, var(--hover-background));
    --active-box-shadow: var(--ck-connectbutton-balance-active-box-shadow, var(--hover-box-shadow));
    --active-border-radius: var(--ck-connectbutton-balance-active-border-radius, var(--hover-border-radius));
  }
`,eu=w.button`
  all: initial;
  appearance: none;
  user-select: none;
  position: relative;
  padding: 0;
  margin: 0;
  background: none;
  border-radius: var(--ck-border-radius);

  &:disabled {
    pointer-events: none;
    opacity: 0.3;
  }

  display: flex;
  flex-wrap: nowrap;
  background: none;
  cursor: pointer;
  * {
    cursor: pointer;
  }
  &:hover {
    ${ep} {
      color: var(--hover-color, var(--color));
      background: var(--hover-background, var(--background));
      box-shadow: var(--hover-box-shadow, var(--box-shadow));
      border-radius: var(--hover-border-radius, var(--border-radius));
    }
  }
  &:active {
    ${ep} {
      color: var(--active-color, var(--hover-color, var(--color)));
      background: var(--active-background, var(--hover-background, var(--background)));
      box-shadow: var(--active-box-shadow, var(--hover-box-shadow, var(--box-shadow)));
      border-radius: var(--active-border-radius, var(--hover-border-radius, var(--border-radius)));
    }
  }
  &:focus-visible,
  &:focus {
    outline: none;
  }
`,ThemedButton=({children:o,variant:e="primary",autoSize:t=!0,duration:n=.3,style:a})=>{let[i,c]=(0,u.Z)();return(0,r.jsx)(ep,{className:e,initial:!1,animate:t?{width:c.width>10?c.width:"auto"}:void 0,transition:{duration:n,ease:[.25,1,.5,1],delay:.01},style:a,children:(0,r.jsx)("div",{ref:i,style:{whiteSpace:"nowrap",width:"fit-content",position:"relative",padding:"0 12px"},children:o})})},eb={initial:{zIndex:2,opacity:0,x:"-100%"},animate:{opacity:1,x:.1,transition:{duration:.4,ease:[.25,1,.5,1]}},exit:{zIndex:1,opacity:0,x:"-100%",pointerEvents:"none",position:"absolute",transition:{duration:.4,ease:[.25,1,.5,1]}}},ex={initial:{zIndex:2,opacity:0,x:"100%"},animate:{x:.2,opacity:1,transition:{duration:.4,ease:[.25,1,.5,1]}},exit:{zIndex:1,x:"100%",opacity:0,pointerEvents:"none",position:"absolute",transition:{duration:.4,ease:[.25,1,.5,1]}}},ek={initial:{opacity:0},animate:{opacity:1,transition:{duration:.3,ease:[.25,1,.5,1]}},exit:{position:"absolute",opacity:0,transition:{duration:.3,ease:[.25,1,.5,1]}}},defaultDisplayAccount=o=>o.address,ConnectButtonRenderer=({displayAccount:o,children:e})=>{let t=useIsMounted(),n=useConnectSettingContext(),{account:a}=useAlephiumConnectContext(),{disconnect:i}=useConnect();if(!e||!t)return null;let c=a?(null!=o?o:defaultDisplayAccount)(a):void 0;return(0,r.jsx)(r.Fragment,{children:e({show:function(){n.setOpen(!0),n.setRoute(a?ob.PROFILE:ob.CONNECTORS)},hide:function(){n.setOpen(!1)},isConnected:!!a,isConnecting:n.open,disconnect:i,account:a,truncatedAddress:c?truncatedAddress(c):void 0})})};function AlephiumConnectButtonInner({label:o,displayAccount:e}){let{account:t}=useAlephiumConnectContext();return(0,r.jsx)(i.M,{initial:!1,children:t?(0,r.jsx)(el,{initial:"initial",animate:"animate",exit:"exit",variants:ex,style:{height:40},children:(0,r.jsx)("div",{style:{position:"relative",paddingRight:0},children:(0,r.jsx)(i.M,{initial:!1,children:(0,r.jsx)(el,{initial:"initial",animate:"animate",exit:"exit",variants:ek,style:{position:"relative"},children:truncatedAddress(e(t))},"ckTruncatedAddress")})})},"connectedText"):(0,r.jsx)(el,{initial:"initial",animate:"animate",exit:"exit",variants:eb,style:{height:40},children:o||"Connect Alephium"},"connectWalletText")})}function AlephiumConnectButton({label:o,onClick:e,displayAccount:t}){let n=useIsMounted(),a=useConnectSettingContext(),{account:i}=useAlephiumConnectContext(),c=!!i;function show(){a.setOpen(!0),a.setRoute(c?ob.PROFILE:ob.CONNECTORS)}return a.csrModeOnly||n?(0,r.jsx)(op,{$useTheme:a.theme,$useMode:a.mode,$customTheme:a.customTheme,children:(0,r.jsx)(eu,{onClick:()=>{e?e(show):show()},children:(0,r.jsx)(ThemedButton,{theme:a.theme,mode:a.mode,customTheme:a.customTheme,style:{overflow:"hidden"},children:(0,r.jsx)(AlephiumConnectButtonInner,{label:o,displayAccount:null!=t?t:o=>o.address})})})}):null}function useBalance(){let{balance:o,updateBalance:e,updateBalanceForTx:t}=useAlephiumBalanceContext();return(0,n.useEffect)(()=>{void 0===o&&e()},[o,e]),(0,n.useMemo)(()=>({balance:o,updateBalanceForTx:t}),[o,t])}function useWallet(){let{account:o,signerProvider:e,connectionStatus:t,network:r}=useAlephiumConnectContext();return(0,n.useMemo)(()=>"connected"===t?{connectionStatus:t,signer:e,account:{...o,network:r},nodeProvider:null==e?void 0:e.nodeProvider,explorerProvider:null==e?void 0:e.explorerProvider}:"disconnected"===t?{connectionStatus:t,signer:void 0,account:void 0,nodeProvider:void 0,explorerProvider:void 0}:{connectionStatus:t,signer:void 0,account:void 0===o?void 0:{...o,network:r},nodeProvider:void 0,explorerProvider:void 0},[e,o,r,t])}ConnectButtonRenderer.displayName="AlephiumConnectButton.Custom",AlephiumConnectButton.Custom=ConnectButtonRenderer}}]);
//# sourceMappingURL=ea78bf27.5817ebb276b3d3a5.js.map