"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6426],{77844:function(e,l,t){t.d(l,{G:function(){return useFormContext},u:function(){return r}});var a=t(67294);let r=a.createContext(null),useFormContext=()=>{let e=a.useContext(r);if(!e)throw Error("useFormContext must be used within a ApiFormProvider");return e}},25618:function(e,l,t){t.d(l,{s:function(){return er}});var a=t(85893),r=t(67294),s=t(51731),d=t(9663),n=t(15103),i=t(53416);let o=new Map,createFormStore=e=>{let l=e||(0,i.x0)();if(o.has(l))return o.get(l);let t=new Map,a={id:l,scope:(0,n.MT)(),fieldAtom:(e,l)=>{if(!t.has(e)){var a;let r=(0,n.cn)({value:null!==(a=null==l?void 0:l.defaultValue)&&void 0!==a?a:void 0,...l});t.set(e,r)}return t.get(e)},fieldsAtom:e=>(0,n.cn)(l=>(null==e?void 0:e.length)?e.map(e=>{let t=a.fieldAtom(e),r=l(t);return{id:e,...r}}):[]),allFields:()=>Array.from(t.keys()),allFieldsAtom:()=>(0,n.cn)(e=>Array.from(t.values()).map(l=>e(l))),reset:()=>{t.forEach(e=>{let l=a.scope.get(e);a.scope.set(e,{value:void 0,defaultValue:null==l?void 0:l.defaultValue})})},destroy:()=>{t.clear()}};return o.set(l,a),a},deleteFormStore=e=>{var l;null===(l=o.get(e))||void 0===l||l.destroy(),o.delete(e)};var u=t(48583),c=t(77844),m=t(88240),v=t(27361),x=t.n(v),f=t(41609),p=t.n(f),h=t(48005);let g=(0,r.forwardRef)(function(e,l){let{children:t}=e,s=(0,r.useMemo)(()=>createFormStore(),[]);(0,r.useEffect)(()=>()=>{deleteFormStore(s.id)},[s.id]);let d=(0,r.useMemo)(()=>({reset:()=>{s.reset()},getField:e=>s.scope.get(s.fieldAtom(e)),setField:(e,l)=>{let t=s.scope.get(s.fieldAtom(e));s.scope.set(s.fieldAtom(e),{...t,...l})},getValue:e=>{var l;return null===(l=s.scope.get(s.fieldAtom(e)))||void 0===l?void 0:l.value},setValue:(e,l)=>{s.scope.set(s.fieldAtom(e),{value:l})},setJsonValue:(e,l)=>{let t;let a="";try{t="number"==typeof l||"boolean"==typeof l||"string"==typeof l?l.toString():(0,m.a)(l)}catch(e){console.log("execute error",e);try{a=JSON.stringify(e)}catch(e){a=x()(e,"message","Execution error")}}p()(a)?s.scope.set(s.fieldAtom(e),{value:(0,h.P3)(t)}):s.scope.set(s.fieldAtom(e),{error:a})},setError:(e,l)=>{s.scope.set(s.fieldAtom(e),{error:l})}}),[s]);(0,r.useImperativeHandle)(l,()=>d,[d]);let n=(0,r.useCallback)(()=>d,[d]),i=(0,r.useMemo)(()=>({store:s,getFromApi:n}),[s,n]);return(0,a.jsx)(u.zt,{store:s.scope,children:(0,a.jsx)(c.u.Provider,{value:i,children:t})})});function useForm(){let e=(0,c.G)();if(!e)throw Error("useForm must be used within ApiForm");let{store:l}=e,t=(0,r.useCallback)(e=>l.scope.get(l.fieldAtom(e)).value,[l]),a=(0,r.useCallback)((e,t)=>{l.scope.set(l.fieldAtom(e),{value:t})},[l]),s=(0,r.useCallback)(()=>{l.reset()},[l]);return{getValue:t,setValue:a,reset:s}}let ApiResetButton=function(){let{reset:e}=useForm();return(0,a.jsx)(d.z,{variant:"link",size:"sm",onClick:()=>e(),children:"Rest 请求"})},j=(0,r.forwardRef)(function(e,l){let{title:t,description:r,children:d,className:n}=e;return(0,a.jsx)(g,{ref:l,children:(0,a.jsxs)(s.Zb,{className:n,children:[(0,a.jsxs)("div",{className:"flex justify-between",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(s.Ol,{className:"text-xl font-medium searchable",children:t}),r&&(0,a.jsx)(s.SZ,{children:r})]}),(0,a.jsx)(ApiResetButton,{})]}),(0,a.jsx)(s.aY,{children:(0,a.jsx)("div",{className:"space-y-4",children:d})})]})})});var b=t(40293),N=t(18953);function useField(e){let{id:l,name:t,required:a,defaultValue:s,value:d,extra:n}=e,{store:i,getFromApi:o}=(0,c.G)(),v=(0,r.useMemo)(()=>{var e;return{name:t,required:a,defaultValue:s,value:null!==(e=null!=d?d:s)&&void 0!==e?e:void 0,extra:n}},[]),[f,g]=(0,u.KO)(i.fieldAtom(l,v)),j=(0,r.useCallback)(e=>{g(l=>l.value===e?l:{...l,value:e})},[g]),b=(0,r.useCallback)(e=>{g(l=>({...l,error:e}))},[g]),N=(0,r.useCallback)(e=>{g(l=>({...l,disabled:e}))},[g]),y=(0,r.useCallback)(e=>{g(l=>({...l,extra:e}))},[g]),k=(0,r.useCallback)(e=>{let l;let t="";try{l="number"==typeof e||"boolean"==typeof e||"string"==typeof e?e.toString():(0,m.a)(e)}catch(e){console.log("execute error",e);try{t=JSON.stringify(e)}catch(e){t=x()(e,"message","Execution error")}}p()(t)?j((0,h.P3)(l)):b(t)},[b,j]);return(0,r.useEffect)(()=>{void 0!==n&&y(n)},[n,y]),(0,r.useEffect)(()=>{void 0!==d&&g(e=>({...e,value:d}))},[d,g]),(0,r.useEffect)(()=>{g(e=>e.value===s?e:{...e,value:s})},[s,g]),(0,r.useMemo)(()=>({field:f,setValue:j,setError:b,setDisabled:N,setExtra:y,setValueJson:k,getFromApi:o}),[f,j,b,N,y,k,o])}let y=(0,r.memo)(e=>{var l;let{id:t,placeholder:r,type:s="text",hidden:d=!1,defaultValue:n,label:i,required:o}=e,{field:u,setValue:c}=useField({id:t,name:i,required:o,defaultValue:n});return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(b.I,{id:t,value:null!==(l=null==u?void 0:u.value)&&void 0!==l?l:"",onChange:e=>c(e.target.value),placeholder:r,disabled:null==u?void 0:u.disabled,type:s,hidden:d}),(null==u?void 0:u.error)&&!d&&(0,a.jsx)("div",{className:"text-sm text-red-500",children:u.error})]})}),k=(0,r.memo)(e=>{let{id:l,label:t,placeholder:r,required:s,hidden:d=!1,defaultValue:n,type:i}=e;return(0,a.jsxs)("div",{children:[t&&!d&&(0,a.jsxs)(N._,{htmlFor:l,children:[t,s&&(0,a.jsx)("span",{className:"text-red-500",children:"*"})]}),(0,a.jsx)(y,{id:l,placeholder:r,type:i,hidden:d,defaultValue:n,label:t,required:s})]})});k.displayName="ApiField";var w=t(96544);let C=(0,r.memo)(e=>{var l,t,s;let{id:n,label:i,onClick:o,validation:m,availableDependencyFields:v}=e,f=(0,c.G)();if(!f)throw Error("ApiButton must be used within ApiForm");let{store:h,getFromApi:g}=f,{field:j,setExtra:b}=useField({id:n,name:i}),N=null!==(s=null==j?void 0:null===(l=j.extra)||void 0===l?void 0:l.loading)&&void 0!==s&&s,y=null==j?void 0:null===(t=j.extra)||void 0===t?void 0:t.result,k=(0,r.useMemo)(()=>(null==v?void 0:v.length)?Array.from(v.reduce((e,l)=>(l.fieldIds.forEach(l=>{e.add(l)}),e),new Set)):[],[v]),[C]=(0,u.KO)((0,r.useMemo)(()=>h.fieldsAtom(k),[h,k])),F=(0,r.useMemo)(()=>{let e=C.filter(e=>(null==e?void 0:e.value)==null||p()(null==e?void 0:e.value)),l=null==v?void 0:v.some(l=>{var t,a;let r=l.fieldIds.every(l=>!e.some(e=>e.id===l)),s=(null===(a=l.required)||void 0===a?void 0:null===(t=a.call(l))||void 0===t?void 0:t.errorMessage)==null;return r&&s});if(l)return null;if((null==v?void 0:v.length)>0){let e=v.map(e=>{var l;let t=null===(l=e.required)||void 0===l?void 0:l.call(e);if(null==t?void 0:t.errorMessage)return t.errorMessage;let a=e.fieldIds.map(e=>C.find(l=>l.id===e)).filter(e=>e&&(null==e.value||p()(e.value))).map(e=>{var l;return null!==(l=e.name)&&void 0!==l?l:e.id});return 0===a.length?null:"(".concat(a.join(" 和 "),")")}).filter(Boolean);if(e.length>0)return"请填写: ".concat(e.join(" 或 "))}return null},[v,C]),A=(0,r.useCallback)(e=>{b({...null==j?void 0:j.extra,result:e})},[null==j?void 0:j.extra,b]),E=(0,r.useCallback)(e=>{b({...null==j?void 0:j.extra,loading:e})},[null==j?void 0:j.extra,b]),S=(0,r.useCallback)(async()=>{var e,l,t;A(void 0);let a=!0,r="";if(null==m?void 0:m.validator){let l=h.fieldsAtom(null==m?void 0:m.fields),t=null===(e=h.scope.get(l))||void 0===e?void 0:e.reduce((e,l)=>(e[l.id]=l,e),{}),s=m.fields.some(e=>{var l,a;return p()(null===(l=t[e])||void 0===l?void 0:l.value)&&!!(null===(a=t[e])||void 0===a?void 0:a.required)});if(s&&(a=!1,r="请填写 ".concat(m.fields.filter(e=>{var l,a;return p()(null===(l=t[e])||void 0===l?void 0:l.value)&&!!(null===(a=t[e])||void 0===a?void 0:a.required)}).join(", ")," 字段")),!a){A(r||"验证失败");return}let d=m.validator(t);a=!d,r=d}if(!a){A(r||"验证失败");return}try{E(!0);let e=h.allFieldsAtom(),t=null===(l=h.scope.get(e))||void 0===l?void 0:l.reduce((e,l)=>(e[l.id]=l,e),{});await o(g(),t)}catch(l){let e=null!==(t=x()(l,"message","error"))&&void 0!==t?t:JSON.stringify(l);(0,w.Am)({title:"执行失败",description:e,variant:"destructive"}),A(e)}finally{E(!1)}},[A,m,h,E,o,g]);return(0,a.jsxs)("div",{className:"flex flex-col gap-1",children:[(0,a.jsx)(d.z,{onClick:S,disabled:null!=F,loading:N,children:i},n),F&&(0,a.jsx)("div",{className:"text-red-500 text-sm",children:F}),y&&(0,a.jsx)("div",{className:"text-red-500 text-sm",children:y})]})});C.displayName="ApiButton";var F=t(13718);let A=(0,r.memo)(e=>{var l;let{id:t,placeholder:r,label:s,required:d}=e,{field:n,setValue:i}=useField({id:t,name:s,required:d});return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(F.Z,{value:null!==(l=null==n?void 0:n.value)&&void 0!==l?l:"",onChange:e=>i(e),placeholder:r}),(null==n?void 0:n.error)&&(0,a.jsx)("div",{className:"text-sm text-red-500",children:n.error})]})}),E=(0,r.memo)(e=>{let{id:l,label:t,placeholder:r,required:s}=e;return(0,a.jsxs)("div",{children:[t&&(0,a.jsxs)(N._,{htmlFor:l,children:[t,s&&(0,a.jsx)("span",{className:"text-red-500",children:"*"})]}),(0,a.jsx)(A,{id:l,placeholder:r})]})});E.displayName="ApiJsonEdit";var S=t(49333);let R=(0,r.forwardRef)(function(e,l){var t;let{id:s,label:d,required:n,defaultValue:i,placeholder:o,onRequestOptions:u,onValueChange:c,onOptionChange:m}=e,{getFromApi:v,field:x,setValue:f,setExtra:p}=useField({id:s,name:d,required:n}),h=null===(t=x.extra)||void 0===t?void 0:t.options,g=(0,r.useCallback)(()=>null==h?void 0:h.find(e=>e.value===x.value),[h,x.value]),j=(0,r.useMemo)(()=>g(),[g]),b=(0,r.useCallback)(e=>{p({options:e})},[p]);(0,r.useEffect)(()=>{u&&u().then(e=>{b(e)})},[u,b]);let y=(0,r.useCallback)(e=>{var l;f(e),null==c||c(e,v()),null==m||m(null!==(l=null==h?void 0:h.find(l=>l.value===e))&&void 0!==l?l:null,v())},[f,c,v,m,h]);return(0,r.useImperativeHandle)(l,()=>({setValue:y,getCurrentValue:()=>null==j?void 0:j.value,getCurrentOption:()=>j,getOptions:()=>h,setOptions:b}),[j,h,b,y]),(0,a.jsxs)("div",{children:[d&&(0,a.jsxs)(N._,{htmlFor:s,children:[d,n&&(0,a.jsx)("span",{className:"text-red-500",children:"*"})]}),(0,a.jsxs)(S.Ph,{defaultValue:i,value:x.value,onValueChange:y,children:[o&&(0,a.jsx)(S.i4,{className:"w-full",children:(0,a.jsx)(S.ki,{className:"text-base font-medium",placeholder:o})}),(0,a.jsx)(S.Bw,{children:null==h?void 0:h.map(e=>(0,a.jsx)(S.Ql,{value:e.value,className:"text-base font-medium",children:e.label},e.value))})]}),(null==j?void 0:j.remark)&&(0,a.jsx)("span",{className:"px-1 text-sm text-muted-foreground",children:j.remark})]})});R.displayName="ApiSelector";var V=t(12259);let _=(0,r.memo)(e=>{let{id:l,label:t,defaultChecked:r}=e,{field:s,setValue:d}=useField({id:l,name:t,defaultValue:r});return(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)(V.X,{id:l,defaultChecked:r,required:s.required,checked:s.value,onCheckedChange:e=>d(!!e),disabled:s.disabled}),(0,a.jsx)("label",{htmlFor:l,className:"p-0 m-0 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",children:t}),s.error&&(0,a.jsx)("div",{className:"text-sm text-red-500",children:s.error})]})});_.displayName="ApiCheckbox";var Y=t(20176);let M=(0,r.memo)(e=>{let{id:l,placeholder:t,label:r,required:s,maxHeight:d=500}=e,{field:n,setValue:i}=useField({id:l,name:r,required:s});return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(Y.i,{id:l,value:n.value,onChange:e=>i(e.target.value),placeholder:t,disabled:n.disabled,className:"min-h-10",maxHeight:d}),n.error&&(0,a.jsx)("div",{className:"text-sm text-red-500",children:n.error})]})}),z=(0,r.memo)(e=>{let{id:l,label:t,placeholder:r,required:s}=e;return(0,a.jsxs)("div",{children:[t&&(0,a.jsxs)(N._,{htmlFor:l,children:[t,s&&(0,a.jsx)("span",{className:"text-red-500",children:"*"})]}),(0,a.jsx)(M,{id:l,placeholder:r,label:t,required:s})]})});z.displayName="ApiAutoTextArea";let q=(0,r.memo)(e=>{let{id:l,placeholder:t,label:r,required:s}=e,{field:d,setValue:n}=useField({id:l,name:r,required:s});return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(Y.g,{id:l,value:null==d?void 0:d.value,onChange:e=>n(e.target.value),placeholder:t,disabled:null==d?void 0:d.disabled,style:{overflow:"hidden"}}),(null==d?void 0:d.error)&&(0,a.jsx)("div",{className:"text-sm text-red-500",children:d.error})]})}),I=(0,r.memo)(e=>{let{id:l,label:t,placeholder:r,required:s}=e;return(0,a.jsxs)("div",{children:[t&&(0,a.jsxs)(N._,{htmlFor:l,children:[t,s&&(0,a.jsx)("span",{className:"text-red-500",children:"*"})]}),(0,a.jsx)(q,{id:l,placeholder:r})]})});I.displayName="ApiTextArea";var O=t(29791);let B=(0,r.memo)(e=>{let{id:l,label:t,defaultChecked:r}=e,{field:s,setValue:d}=useField({id:l,name:t,defaultValue:r});return(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)(O.r,{id:l,defaultChecked:r,required:s.required,checked:s.value,onCheckedChange:e=>d(e),disabled:s.disabled}),(0,a.jsx)("label",{htmlFor:l,className:"p-0 m-0 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",children:t}),s.error&&(0,a.jsx)("div",{className:"text-sm text-red-500",children:s.error})]})});B.displayName="ApiSwitch";var Z=t(50927),G=t(10199),H=t(87764),D=t(13441);t(53617);let J=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(G.mY,{ref:l,className:(0,D.cn)("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",t),...r})});J.displayName=G.mY.displayName;let T=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsxs)("div",{className:"flex items-center border-b px-3","cmdk-input-wrapper":"",children:[(0,a.jsx)(H.Z,{className:"mr-2 h-4 w-4 shrink-0 opacity-50"}),(0,a.jsx)(G.mY.Input,{ref:l,className:(0,D.cn)("flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",t),...r})]})});T.displayName=G.mY.Input.displayName;let P=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(G.mY.List,{ref:l,className:(0,D.cn)("max-h-[300px] overflow-y-auto overflow-x-hidden",t),...r})});P.displayName=G.mY.List.displayName;let K=r.forwardRef((e,l)=>(0,a.jsx)(G.mY.Empty,{ref:l,className:"py-6 text-center text-sm",...e}));K.displayName=G.mY.Empty.displayName;let L=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(G.mY.Group,{ref:l,className:(0,D.cn)("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",t),...r})});L.displayName=G.mY.Group.displayName;let Q=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(G.mY.Separator,{ref:l,className:(0,D.cn)("-mx-1 h-px bg-border",t),...r})});Q.displayName=G.mY.Separator.displayName;let X=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(G.mY.Item,{ref:l,className:(0,D.cn)("relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",t),...r})});X.displayName=G.mY.Item.displayName;var $=t(8971),U=t(13742);let W=(0,r.forwardRef)(function(e,l){var t,s;let{id:n,label:i,required:o,defaultValue:u,placeholder:c,requestOptionsKey:m,onRequestOptions:v,onValueChange:x,onOptionChange:f}=e,{getFromApi:p,field:h,setValue:g,setExtra:j}=useField({id:n,name:i,required:o,defaultValue:u}),b=null==h?void 0:null===(t=h.extra)||void 0===t?void 0:t.options,[y,k]=r.useState(!1),w=(0,r.useCallback)(()=>null==b?void 0:b.find(e=>e.value===h.value),[b,null==h?void 0:h.value]),C=(0,r.useMemo)(()=>w(),[w]),F=(0,r.useCallback)(e=>{j({options:e})},[j]);(0,r.useEffect)(()=>{F([])},[m]),(0,r.useEffect)(()=>{y&&v&&((null==b?void 0:b.length)==null||(null==b?void 0:b.length)===0)&&v().then(e=>{F(e)})},[y,v,null==b?void 0:b.length,F]);let A=(0,r.useCallback)(e=>{var l;g(e),k(!1),null==x||x(e,p()),null==f||f(null!==(l=null==b?void 0:b.find(l=>l.value===e))&&void 0!==l?l:null,p())},[g,x,p,f,b]);return(0,r.useImperativeHandle)(l,()=>({setValue:A,getCurrentValue:()=>null==C?void 0:C.value,getCurrentOption:()=>C,getOptions:()=>b,setOptions:F}),[C,b,F,A]),(0,a.jsxs)("div",{className:"flex flex-col",children:[i&&(0,a.jsxs)(N._,{htmlFor:n,children:[i,o&&(0,a.jsx)("span",{className:"text-red-500",children:"*"})]}),(0,a.jsxs)(Z.J2,{open:y,onOpenChange:k,children:[(0,a.jsx)(Z.xo,{asChild:!0,children:(0,a.jsxs)(d.z,{variant:"outline",role:"combobox","aria-expanded":y,className:"w-full justify-between",children:[(0,a.jsx)("span",{className:"truncate text-left break-all line-clamp-2",children:(null==C?void 0:C.value)?null===(s=b.find(e=>e.value===(null==C?void 0:C.value)))||void 0===s?void 0:s.label:c}),(0,a.jsx)($.Z,{className:"ml-2 h-4 w-4 shrink-0 opacity-50"})]})}),(0,a.jsx)(Z.yk,{className:"w-[var(--radix-popover-trigger-width)] p-0",children:(0,a.jsxs)(J,{children:[(0,a.jsx)(T,{placeholder:c,className:"h-9"}),(0,a.jsxs)(P,{children:[(0,a.jsx)(K,{children:"没有找到选项"}),(0,a.jsx)(L,{children:null==b?void 0:b.map(e=>(0,a.jsxs)(X,{value:e.label,className:"break-all",onSelect:e=>{var l;let t=null==b?void 0:b.find(l=>l.label===e);A(null!==(l=null==t?void 0:t.value)&&void 0!==l?l:null)},children:[e.label,(0,a.jsx)(U.Z,{className:(0,D.cn)("ml-auto h-4 w-4",(null==C?void 0:C.value)===e.value?"opacity-100":"opacity-0")})]},e.value))})]})]})})]}),(null==C?void 0:C.remark)&&(0,a.jsx)("span",{className:"px-1 text-sm text-muted-foreground",children:C.remark})]})});var ee=t(12780);let el=r.forwardRef((e,l)=>{let{className:t,orientation:r="horizontal",decorative:s=!0,...d}=e;return(0,a.jsx)(ee.f,{ref:l,decorative:s,orientation:r,className:(0,D.cn)("shrink-0 bg-border","horizontal"===r?"h-[2px] w-full":"h-full w-[2px]",t),...d})});el.displayName=ee.f.displayName;let et=(0,r.memo)(()=>(0,a.jsx)(el,{}));et.displayName="ApiSeparator";let ea=(0,r.memo)(e=>{let{id:l,size:t="md",type:r="text",hidden:s=!1,value:d}=e,{field:n}=useField({id:l,value:d});if(s)return null;let i="";switch(t){case"sm":i="text-sm";break;case"md":i="text-base";break;case"lg":i="text-lg"}let o="",u="";switch(r){case"error":u="text-black",o="bg-red-100";break;case"warning":u="text-black",o="bg-yellow-100";break;case"success":u="text-black",o="bg-green-100";break;case"info":u="text-black",o="bg-gray-100";break;default:u="text-black",o="bg-white"}return n.value?(0,a.jsx)("div",{className:(0,D.cn)(i,u,o,"p-1 rounded-md font-medium"),children:null==n?void 0:n.value}):null});ea.displayName="ApiText";let er=j;er.Field=k,er.Button=C,er.JsonEdit=E,er.Selector=R,er.Checkbox=_,er.AutoHeightTextArea=z,er.TextArea=I,er.Switch=B,er.Combobox=W,er.Separator=et,er.Text=ea,er.useField=useField,er.useForm=useForm,er.useFormContext=c.G},6793:function(e,l,t){var a=t(85893);t(67294);var r=t(41664),s=t.n(r),d=t(51731);l.Z=e=>{let{dapps:l}=e;return(0,a.jsxs)(d.Zb,{children:[(0,a.jsx)(d.ll,{className:"text-xl",children:"Dapp Bookmarks"}),(0,a.jsx)(d.aY,{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",children:l.map((e,l)=>(0,a.jsx)("div",{className:"border p-2 rounded-lg shadow-sm hover:shadow-md",children:(0,a.jsx)(s(),{href:e.url,legacyBehavior:!0,children:(0,a.jsxs)("a",{className:"text-blue-500 hover:underline text-lg block",children:[e.name," →"]})})},l))})]})}},53617:function(e,l,t){t.d(l,{$N:function(){return x},Be:function(){return f},GG:function(){return c},Vq:function(){return i},cZ:function(){return v},fK:function(){return DialogHeader},hg:function(){return o}});var a=t(85893),r=t(67294),s=t(12854),d=t(41352),n=t(13441);let i=s.fC,o=s.xz,u=s.h_,c=s.x8,m=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(s.aV,{ref:l,className:(0,n.cn)("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",t),...r})});m.displayName=s.aV.displayName;let v=r.forwardRef((e,l)=>{let{className:t,children:r,...i}=e;return(0,a.jsxs)(u,{children:[(0,a.jsx)(m,{}),(0,a.jsxs)(s.VY,{ref:l,className:(0,n.cn)("fixed left-[50%] top-[35%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",t),...i,children:[r,(0,a.jsxs)(s.x8,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[(0,a.jsx)(d.Z,{className:"h-4 w-4"}),(0,a.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})});v.displayName=s.VY.displayName;let DialogHeader=e=>{let{className:l,...t}=e;return(0,a.jsx)("div",{className:(0,n.cn)("flex flex-col space-y-1.5 text-center sm:text-left",l),...t})};DialogHeader.displayName="DialogHeader";let x=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(s.Dx,{ref:l,className:(0,n.cn)("text-lg font-semibold leading-none tracking-tight",t),...r})});x.displayName=s.Dx.displayName;let f=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(s.dk,{ref:l,className:(0,n.cn)("text-sm text-muted-foreground",t),...r})});f.displayName=s.dk.displayName},18953:function(e,l,t){t.d(l,{_:function(){return o}});var a=t(85893),r=t(67294),s=t(49102),d=t(12003),n=t(13441);let i=(0,d.j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),o=r.forwardRef((e,l)=>{let{className:t,...r}=e;return(0,a.jsx)(s.f,{ref:l,className:(0,n.cn)(i(),t),...r})});o.displayName=s.f.displayName}}]);
//# sourceMappingURL=6426.952f25d18c689898.js.map