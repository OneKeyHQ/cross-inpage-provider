(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9499],{39499:function(t){t.exports=function(){"use strict";var t=Math.clz32,e=Math.abs,i=Math.max,r=Math.floor;let o=class o extends Array{constructor(t,e){if(super(t),this.sign=e,t>o.__kMaxLength)throw RangeError("Maximum BigInt size exceeded")}static BigInt(t){var e=Number.isFinite;if("number"==typeof t){if(0===t)return o.__zero();if(o.__isOneDigitInt(t))return 0>t?o.__oneDigit(-t,!0):o.__oneDigit(t,!1);if(!e(t)||r(t)!==t)throw RangeError("The number "+t+" cannot be converted to BigInt because it is not an integer");return o.__fromDouble(t)}if("string"==typeof t){let e=o.__fromString(t);if(null===e)throw SyntaxError("Cannot convert "+t+" to a BigInt");return e}if("boolean"==typeof t)return!0===t?o.__oneDigit(1,!1):o.__zero();if("object"==typeof t){if(t.constructor===o)return t;let e=o.__toPrimitive(t);return o.BigInt(e)}throw TypeError("Cannot convert "+t+" to a BigInt")}toDebugString(){let t=["BigInt["];for(let e of this)t.push((e?(e>>>0).toString(16):e)+", ");return t.push("]"),t.join("")}toString(t=10){if(2>t||36<t)throw RangeError("toString() radix argument must be between 2 and 36");return 0===this.length?"0":0==(t&t-1)?o.__toStringBasePowerOfTwo(this,t):o.__toStringGeneric(this,t,!1)}static toNumber(t){let e=t.length;if(0===e)return 0;if(1===e){let e=t.__unsignedDigit(0);return t.sign?-e:e}let i=t.__digit(e-1),r=o.__clz30(i),_=30*e-r;if(1024<_)return t.sign?-1/0:1/0;let n=_-1,l=i,s=e-1,u=r+3,g=32===u?0:l<<u;g>>>=12;let a=u-12,f=12<=u?0:l<<20+u,h=20+u;for(0<a&&0<s&&(s--,g|=(l=t.__digit(s))>>>30-a,f=l<<a+2,h=a+2);0<h&&0<s;)s--,l=t.__digit(s),f|=30<=h?l<<h-30:l>>>30-h,h-=30;let c=o.__decideRounding(t,h,s,l);if((1===c||0===c&&1==(1&f))&&0==(f=f+1>>>0)&&0!=++g>>>20&&(g=0,1023<++n))return t.sign?-1/0:1/0;let b=t.sign?-2147483648:0;return n=n+1023<<20,o.__kBitConversionInts[1]=b|n|g,o.__kBitConversionInts[0]=f,o.__kBitConversionDouble[0]}static unaryMinus(t){if(0===t.length)return t;let e=t.__copy();return e.sign=!t.sign,e}static bitwiseNot(t){return t.sign?o.__absoluteSubOne(t).__trim():o.__absoluteAddOne(t,!0)}static exponentiate(t,e){if(e.sign)throw RangeError("Exponent must be positive");if(0===e.length)return o.__oneDigit(1,!1);if(0===t.length)return t;if(1===t.length&&1===t.__digit(0))return t.sign&&0==(1&e.__digit(0))?o.unaryMinus(t):t;if(1<e.length)throw RangeError("BigInt too big");let i=e.__unsignedDigit(0);if(1===i)return t;if(i>=o.__kMaxLengthBits)throw RangeError("BigInt too big");if(1===t.length&&2===t.__digit(0)){let e=1+(0|i/30),r=t.sign&&0!=(1&i),_=new o(e,r);_.__initializeDigits();let n=1<<i%30;return _.__setDigit(e-1,n),_}let r=null,_=t;for(0!=(1&i)&&(r=t),i>>=1;0!==i;i>>=1)_=o.multiply(_,_),0!=(1&i)&&(r=null===r?_:o.multiply(r,_));return r}static multiply(t,e){if(0===t.length)return t;if(0===e.length)return e;let i=t.length+e.length;30<=t.__clzmsd()+e.__clzmsd()&&i--;let r=new o(i,t.sign!==e.sign);r.__initializeDigits();for(let i=0;i<t.length;i++)o.__multiplyAccumulate(e,t.__digit(i),r,i);return r.__trim()}static divide(t,e){let i;if(0===e.length)throw RangeError("Division by zero");if(0>o.__absoluteCompare(t,e))return o.__zero();let r=t.sign!==e.sign,_=e.__unsignedDigit(0);if(1===e.length&&32767>=_){if(1===_)return r===t.sign?t:o.unaryMinus(t);i=o.__absoluteDivSmall(t,_,null)}else i=o.__absoluteDivLarge(t,e,!0,!1);return i.sign=r,i.__trim()}static remainder(t,e){if(0===e.length)throw RangeError("Division by zero");if(0>o.__absoluteCompare(t,e))return t;let i=e.__unsignedDigit(0);if(1===e.length&&32767>=i){if(1===i)return o.__zero();let e=o.__absoluteModSmall(t,i);return 0===e?o.__zero():o.__oneDigit(e,t.sign)}let r=o.__absoluteDivLarge(t,e,!1,!0);return r.sign=t.sign,r.__trim()}static add(t,e){let i=t.sign;return i===e.sign?o.__absoluteAdd(t,e,i):0<=o.__absoluteCompare(t,e)?o.__absoluteSub(t,e,i):o.__absoluteSub(e,t,!i)}static subtract(t,e){let i=t.sign;return i===e.sign?0<=o.__absoluteCompare(t,e)?o.__absoluteSub(t,e,i):o.__absoluteSub(e,t,!i):o.__absoluteAdd(t,e,i)}static leftShift(t,e){return 0===e.length||0===t.length?t:e.sign?o.__rightShiftByAbsolute(t,e):o.__leftShiftByAbsolute(t,e)}static signedRightShift(t,e){return 0===e.length||0===t.length?t:e.sign?o.__leftShiftByAbsolute(t,e):o.__rightShiftByAbsolute(t,e)}static unsignedRightShift(){throw TypeError("BigInts have no unsigned right shift; use >> instead")}static lessThan(t,e){return 0>o.__compareToBigInt(t,e)}static lessThanOrEqual(t,e){return 0>=o.__compareToBigInt(t,e)}static greaterThan(t,e){return 0<o.__compareToBigInt(t,e)}static greaterThanOrEqual(t,e){return 0<=o.__compareToBigInt(t,e)}static equal(t,e){if(t.sign!==e.sign||t.length!==e.length)return!1;for(let i=0;i<t.length;i++)if(t.__digit(i)!==e.__digit(i))return!1;return!0}static notEqual(t,e){return!o.equal(t,e)}static bitwiseAnd(t,e){if(!t.sign&&!e.sign)return o.__absoluteAnd(t,e).__trim();if(t.sign&&e.sign){let r=i(t.length,e.length)+1,_=o.__absoluteSubOne(t,r),n=o.__absoluteSubOne(e);return _=o.__absoluteOr(_,n,_),o.__absoluteAddOne(_,!0,_).__trim()}return t.sign&&([t,e]=[e,t]),o.__absoluteAndNot(t,o.__absoluteSubOne(e)).__trim()}static bitwiseXor(t,e){if(!t.sign&&!e.sign)return o.__absoluteXor(t,e).__trim();if(t.sign&&e.sign){let r=i(t.length,e.length),_=o.__absoluteSubOne(t,r),n=o.__absoluteSubOne(e);return o.__absoluteXor(_,n,_).__trim()}let r=i(t.length,e.length)+1;t.sign&&([t,e]=[e,t]);let _=o.__absoluteSubOne(e,r);return _=o.__absoluteXor(_,t,_),o.__absoluteAddOne(_,!0,_).__trim()}static bitwiseOr(t,e){let r=i(t.length,e.length);if(!t.sign&&!e.sign)return o.__absoluteOr(t,e).__trim();if(t.sign&&e.sign){let i=o.__absoluteSubOne(t,r),_=o.__absoluteSubOne(e);return i=o.__absoluteAnd(i,_,i),o.__absoluteAddOne(i,!0,i).__trim()}t.sign&&([t,e]=[e,t]);let _=o.__absoluteSubOne(e,r);return _=o.__absoluteAndNot(_,t,_),o.__absoluteAddOne(_,!0,_).__trim()}static asIntN(t,e){if(0===e.length)return e;if(0>(t=r(t)))throw RangeError("Invalid value: not (convertible to) a safe integer");if(0===t)return o.__zero();if(t>=o.__kMaxLengthBits)return e;let i=0|(t+29)/30;if(e.length<i)return e;let _=e.__unsignedDigit(i-1),n=1<<(t-1)%30;if(e.length===i&&_<n)return e;if((_&n)!==n)return o.__truncateToNBits(t,e);if(!e.sign)return o.__truncateAndSubFromPowerOfTwo(t,e,!0);if(0==(_&n-1)){for(let r=i-2;0<=r;r--)if(0!==e.__digit(r))return o.__truncateAndSubFromPowerOfTwo(t,e,!1);return e.length===i&&_===n?e:o.__truncateToNBits(t,e)}return o.__truncateAndSubFromPowerOfTwo(t,e,!1)}static asUintN(t,e){if(0===e.length)return e;if(0>(t=r(t)))throw RangeError("Invalid value: not (convertible to) a safe integer");if(0===t)return o.__zero();if(e.sign){if(t>o.__kMaxLengthBits)throw RangeError("BigInt too big");return o.__truncateAndSubFromPowerOfTwo(t,e,!1)}if(t>=o.__kMaxLengthBits)return e;let i=0|(t+29)/30;if(e.length<i)return e;let _=t%30;if(e.length==i){if(0===_)return e;let t=e.__digit(i-1);if(0==t>>>_)return e}return o.__truncateToNBits(t,e)}static ADD(t,e){if(t=o.__toPrimitive(t),e=o.__toPrimitive(e),"string"==typeof t)return"string"!=typeof e&&(e=e.toString()),t+e;if("string"==typeof e)return t.toString()+e;if(t=o.__toNumeric(t),e=o.__toNumeric(e),o.__isBigInt(t)&&o.__isBigInt(e))return o.add(t,e);if("number"==typeof t&&"number"==typeof e)return t+e;throw TypeError("Cannot mix BigInt and other types, use explicit conversions")}static LT(t,e){return o.__compare(t,e,0)}static LE(t,e){return o.__compare(t,e,1)}static GT(t,e){return o.__compare(t,e,2)}static GE(t,e){return o.__compare(t,e,3)}static EQ(t,e){for(;;){if(o.__isBigInt(t))return o.__isBigInt(e)?o.equal(t,e):o.EQ(e,t);if("number"==typeof t){if(o.__isBigInt(e))return o.__equalToNumber(e,t);if("object"!=typeof e)return t==e;e=o.__toPrimitive(e)}else if("string"==typeof t){if(o.__isBigInt(e))return null!==(t=o.__fromString(t))&&o.equal(t,e);if("object"!=typeof e)return t==e;e=o.__toPrimitive(e)}else if("boolean"==typeof t){if(o.__isBigInt(e))return o.__equalToNumber(e,+t);if("object"!=typeof e)return t==e;e=o.__toPrimitive(e)}else if("symbol"==typeof t){if(o.__isBigInt(e))return!1;if("object"!=typeof e)return t==e;e=o.__toPrimitive(e)}else{if("object"!=typeof t||"object"==typeof e&&e.constructor!==o)return t==e;t=o.__toPrimitive(t)}}}static NE(t,e){return!o.EQ(t,e)}static __zero(){return new o(0,!1)}static __oneDigit(t,e){let i=new o(1,e);return i.__setDigit(0,t),i}__copy(){let t=new o(this.length,this.sign);for(let e=0;e<this.length;e++)t[e]=this[e];return t}__trim(){let t=this.length,e=this[t-1];for(;0===e;)e=this[--t-1],this.pop();return 0===t&&(this.sign=!1),this}__initializeDigits(){for(let t=0;t<this.length;t++)this[t]=0}static __decideRounding(t,e,i,r){let _;if(0<e)return -1;if(0>e)_=-e-1;else{if(0===i)return -1;i--,r=t.__digit(i),_=29}let n=1<<_;if(0==(r&n))return -1;if(0!=(r&(n-=1)))return 1;for(;0<i;)if(i--,0!==t.__digit(i))return 1;return 0}static __fromDouble(t){o.__kBitConversionDouble[0]=t;let e=2047&o.__kBitConversionInts[1]>>>20,i=e-1023,r=(0|i/30)+1,_=new o(r,0>t),n=1048575&o.__kBitConversionInts[1]|1048576,l=o.__kBitConversionInts[0],s=i%30,u,g=0;if(20>s){let t=20-s;g=t+32,u=n>>>t,n=n<<32-t|l>>>t,l<<=32-t}else if(20===s)g=32,u=n,n=l,l=0;else{let t=s-20;g=32-t,u=n<<t|l>>>32-t,n=l<<t,l=0}_.__setDigit(r-1,u);for(let t=r-2;0<=t;t--)0<g?(g-=30,u=n>>>2,n=n<<30|l>>>2,l<<=30):u=0,_.__setDigit(t,u);return _.__trim()}static __isWhitespace(t){return!!(13>=t&&9<=t)||(159>=t?32==t:131071>=t?160==t||5760==t:196607>=t?10>=(t&=131071)||40==t||41==t||47==t||95==t||4096==t:65279==t)}static __fromString(t,e=0){let i=0,r=t.length,_=0;if(0===r)return o.__zero();let n=t.charCodeAt(_);for(;o.__isWhitespace(n);){if(++_===r)return o.__zero();n=t.charCodeAt(_)}if(43===n){if(++_===r)return null;n=t.charCodeAt(_),i=1}else if(45===n){if(++_===r)return null;n=t.charCodeAt(_),i=-1}if(0===e){if(e=10,48===n){if(++_===r)return o.__zero();if(88===(n=t.charCodeAt(_))||120===n){if(e=16,++_===r)return null;n=t.charCodeAt(_)}else if(79===n||111===n){if(e=8,++_===r)return null;n=t.charCodeAt(_)}else if(66===n||98===n){if(e=2,++_===r)return null;n=t.charCodeAt(_)}}}else if(16===e&&48===n){if(++_===r)return o.__zero();if(88===(n=t.charCodeAt(_))||120===n){if(++_===r)return null;n=t.charCodeAt(_)}}if(0!=i&&10!==e)return null;for(;48===n;){if(++_===r)return o.__zero();n=t.charCodeAt(_)}let l=r-_,s=o.__kMaxBitsPerChar[e],u=o.__kBitsPerCharTableMultiplier-1;if(l>1073741824/s)return null;let g=s*l+u>>>o.__kBitsPerCharTableShift,a=new o(0|(g+29)/30,!1),f=10>e?e:10,h=10<e?e-10:0;if(0==(e&e-1)){s>>=o.__kBitsPerCharTableShift;let e=[],i=[],l=!1;do{let u=0,g=0;for(;;){let e;if(n-48>>>0<f)e=n-48;else if((32|n)-97>>>0<h)e=(32|n)-87;else{l=!0;break}if(g+=s,u=u<<s|e,++_===r){l=!0;break}if(n=t.charCodeAt(_),30<g+s)break}e.push(u),i.push(g)}while(!l);o.__fillFromParts(a,e,i)}else{a.__initializeDigits();let i=!1,l=0;do{let g=0,c=1;for(;;){let s;if(n-48>>>0<f)s=n-48;else if((32|n)-97>>>0<h)s=(32|n)-87;else{i=!0;break}let u=c*e;if(1073741823<u)break;if(c=u,g=g*e+s,l++,++_===r){i=!0;break}n=t.charCodeAt(_)}u=30*o.__kBitsPerCharTableMultiplier-1;let b=0|(s*l+u>>>o.__kBitsPerCharTableShift)/30;a.__inplaceMultiplyAdd(c,g,b)}while(!i)}if(_!==r){if(!o.__isWhitespace(n))return null;for(_++;_<r;_++)if(n=t.charCodeAt(_),!o.__isWhitespace(n))return null}return a.sign=-1==i,a.__trim()}static __fillFromParts(t,e,i){let r=0,_=0,n=0;for(let l=e.length-1;0<=l;l--){let s=e[l],u=i[l];_|=s<<n,30===(n+=u)?(t.__setDigit(r++,_),n=0,_=0):30<n&&(t.__setDigit(r++,1073741823&_),n-=30,_=s>>>u-n)}if(0!==_){if(r>=t.length)throw Error("implementation bug");t.__setDigit(r++,_)}for(;r<t.length;r++)t.__setDigit(r,0)}static __toStringBasePowerOfTwo(t,e){let i=t.length,r=e-1;r=(15&(r=(51&(r=(85&r>>>1)+(85&r))>>>2)+(51&r))>>>4)+(15&r);let _=r,n=e-1,l=t.__digit(i-1),s=o.__clz30(l),u=0|(30*i-s+_-1)/_;if(t.sign&&u++,268435456<u)throw Error("string too long");let g=Array(u),a=u-1,f=0,h=0;for(let e=0;e<i-1;e++){let i=t.__digit(e),r=(f|i<<h)&n;g[a--]=o.__kConversionChars[r];let l=_-h;for(f=i>>>l,h=30-l;h>=_;)g[a--]=o.__kConversionChars[f&n],f>>>=_,h-=_}let c=(f|l<<h)&n;for(g[a--]=o.__kConversionChars[c],f=l>>>_-h;0!==f;)g[a--]=o.__kConversionChars[f&n],f>>>=_;if(t.sign&&(g[a--]="-"),-1!=a)throw Error("implementation bug");return g.join("")}static __toStringGeneric(t,e,i){let r,_;let n=t.length;if(0===n)return"";if(1===n){let r=t.__unsignedDigit(0).toString(e);return!1===i&&t.sign&&(r="-"+r),r}let l=30*n-o.__clz30(t.__digit(n-1)),s=o.__kMaxBitsPerChar[e],u=s-1,g=l*o.__kBitsPerCharTableMultiplier;g+=u-1,g=0|g/u;let a=g+1>>1,f=o.exponentiate(o.__oneDigit(e,!1),o.__oneDigit(a,!1)),h=f.__unsignedDigit(0);if(1===f.length&&32767>=h){(r=new o(t.length,!1)).__initializeDigits();let i=0;for(let e=2*t.length-1;0<=e;e--){let _=i<<15|t.__halfDigit(e);r.__setHalfDigit(e,0|_/h),i=0|_%h}_=i.toString(e)}else{let i=o.__absoluteDivLarge(t,f,!0,!0);r=i.quotient;let n=i.remainder.__trim();_=o.__toStringGeneric(n,e,!0)}r.__trim();let c=o.__toStringGeneric(r,e,!0);for(;_.length<a;)_="0"+_;return!1===i&&t.sign&&(c="-"+c),c+_}static __unequalSign(t){return t?-1:1}static __absoluteGreater(t){return t?-1:1}static __absoluteLess(t){return t?1:-1}static __compareToBigInt(t,e){let i=t.sign;if(i!==e.sign)return o.__unequalSign(i);let r=o.__absoluteCompare(t,e);return 0<r?o.__absoluteGreater(i):0>r?o.__absoluteLess(i):0}static __compareToNumber(t,i){if(o.__isOneDigitInt(i)){let r=t.sign,_=0>i;if(r!==_)return o.__unequalSign(r);if(0===t.length){if(_)throw Error("implementation bug");return 0===i?0:-1}if(1<t.length)return o.__absoluteGreater(r);let n=e(i),l=t.__unsignedDigit(0);return l>n?o.__absoluteGreater(r):l<n?o.__absoluteLess(r):0}return o.__compareToDouble(t,i)}static __compareToDouble(t,e){if(e!=e)return e;if(e===1/0)return -1;if(e===-1/0)return 1;let i=t.sign;if(i!==0>e)return o.__unequalSign(i);if(0===e)throw Error("implementation bug: should be handled elsewhere");if(0===t.length)return -1;o.__kBitConversionDouble[0]=e;let r=2047&o.__kBitConversionInts[1]>>>20;if(2047==r)throw Error("implementation bug: handled elsewhere");let _=r-1023;if(0>_)return o.__absoluteGreater(i);let n=t.length,l=t.__digit(n-1),s=o.__clz30(l),u=30*n-s,g=_+1;if(u<g)return o.__absoluteLess(i);if(u>g)return o.__absoluteGreater(i);let a=1048576|1048575&o.__kBitConversionInts[1],f=o.__kBitConversionInts[0],h=29-s;if(h!==(0|(u-1)%30))throw Error("implementation bug");let c,b=0;if(20>h){let t=20-h;b=t+32,c=a>>>t,a=a<<32-t|f>>>t,f<<=32-t}else if(20===h)b=32,c=a,a=f,f=0;else{let t=h-20;b=32-t,c=a<<t|f>>>32-t,a=f<<t,f=0}if((l>>>=0)>(c>>>=0))return o.__absoluteGreater(i);if(l<c)return o.__absoluteLess(i);for(let e=n-2;0<=e;e--){0<b?(b-=30,c=a>>>2,a=a<<30|f>>>2,f<<=30):c=0;let r=t.__unsignedDigit(e);if(r>c)return o.__absoluteGreater(i);if(r<c)return o.__absoluteLess(i)}if(0!==a||0!==f){if(0===b)throw Error("implementation bug");return o.__absoluteLess(i)}return 0}static __equalToNumber(t,i){return o.__isOneDigitInt(i)?0===i?0===t.length:1===t.length&&t.sign===0>i&&t.__unsignedDigit(0)===e(i):0===o.__compareToDouble(t,i)}static __comparisonResultToBool(t,e){return 0===e?0>t:1===e?0>=t:2===e?0<t:3===e?0<=t:void 0}static __compare(t,e,i){if(t=o.__toPrimitive(t),e=o.__toPrimitive(e),"string"==typeof t&&"string"==typeof e)switch(i){case 0:return t<e;case 1:return t<=e;case 2:return t>e;case 3:return t>=e}if(o.__isBigInt(t)&&"string"==typeof e)return null!==(e=o.__fromString(e))&&o.__comparisonResultToBool(o.__compareToBigInt(t,e),i);if("string"==typeof t&&o.__isBigInt(e))return null!==(t=o.__fromString(t))&&o.__comparisonResultToBool(o.__compareToBigInt(t,e),i);if(t=o.__toNumeric(t),e=o.__toNumeric(e),o.__isBigInt(t)){if(o.__isBigInt(e))return o.__comparisonResultToBool(o.__compareToBigInt(t,e),i);if("number"!=typeof e)throw Error("implementation bug");return o.__comparisonResultToBool(o.__compareToNumber(t,e),i)}if("number"!=typeof t)throw Error("implementation bug");if(o.__isBigInt(e))return o.__comparisonResultToBool(o.__compareToNumber(e,t),2^i);if("number"!=typeof e)throw Error("implementation bug");return 0===i?t<e:1===i?t<=e:2===i?t>e:3===i?t>=e:void 0}__clzmsd(){return o.__clz30(this.__digit(this.length-1))}static __absoluteAdd(t,e,i){if(t.length<e.length)return o.__absoluteAdd(e,t,i);if(0===t.length)return t;if(0===e.length)return t.sign===i?t:o.unaryMinus(t);let r=t.length;(0===t.__clzmsd()||e.length===t.length&&0===e.__clzmsd())&&r++;let _=new o(r,i),n=0,l=0;for(;l<e.length;l++){let i=t.__digit(l)+e.__digit(l)+n;n=i>>>30,_.__setDigit(l,1073741823&i)}for(;l<t.length;l++){let e=t.__digit(l)+n;n=e>>>30,_.__setDigit(l,1073741823&e)}return l<_.length&&_.__setDigit(l,n),_.__trim()}static __absoluteSub(t,e,i){if(0===t.length)return t;if(0===e.length)return t.sign===i?t:o.unaryMinus(t);let r=new o(t.length,i),_=0,n=0;for(;n<e.length;n++){let i=t.__digit(n)-e.__digit(n)-_;_=1&i>>>30,r.__setDigit(n,1073741823&i)}for(;n<t.length;n++){let e=t.__digit(n)-_;_=1&e>>>30,r.__setDigit(n,1073741823&e)}return r.__trim()}static __absoluteAddOne(t,e,i=null){let r=t.length;null===i?i=new o(r,e):i.sign=e;let _=1;for(let e=0;e<r;e++){let r=t.__digit(e)+_;_=r>>>30,i.__setDigit(e,1073741823&r)}return 0!=_&&i.__setDigitGrow(r,1),i}static __absoluteSubOne(t,e){let i=t.length;e=e||i;let r=new o(e,!1),_=1;for(let e=0;e<i;e++){let i=t.__digit(e)-_;_=1&i>>>30,r.__setDigit(e,1073741823&i)}if(0!=_)throw Error("implementation bug");for(let t=i;t<e;t++)r.__setDigit(t,0);return r}static __absoluteAnd(t,e,i=null){let r=t.length,_=e.length,n=_;if(r<_){n=r;let i=t,l=r;t=e,r=_,e=i,_=l}let l=n;null===i?i=new o(l,!1):l=i.length;let s=0;for(;s<n;s++)i.__setDigit(s,t.__digit(s)&e.__digit(s));for(;s<l;s++)i.__setDigit(s,0);return i}static __absoluteAndNot(t,e,i=null){let r=t.length,_=e.length,n=_;r<_&&(n=r);let l=r;null===i?i=new o(l,!1):l=i.length;let s=0;for(;s<n;s++)i.__setDigit(s,t.__digit(s)&~e.__digit(s));for(;s<r;s++)i.__setDigit(s,t.__digit(s));for(;s<l;s++)i.__setDigit(s,0);return i}static __absoluteOr(t,e,i=null){let r=t.length,_=e.length,n=_;if(r<_){n=r;let i=t,l=r;t=e,r=_,e=i,_=l}let l=r;null===i?i=new o(l,!1):l=i.length;let s=0;for(;s<n;s++)i.__setDigit(s,t.__digit(s)|e.__digit(s));for(;s<r;s++)i.__setDigit(s,t.__digit(s));for(;s<l;s++)i.__setDigit(s,0);return i}static __absoluteXor(t,e,i=null){let r=t.length,_=e.length,n=_;if(r<_){n=r;let i=t,l=r;t=e,r=_,e=i,_=l}let l=r;null===i?i=new o(l,!1):l=i.length;let s=0;for(;s<n;s++)i.__setDigit(s,t.__digit(s)^e.__digit(s));for(;s<r;s++)i.__setDigit(s,t.__digit(s));for(;s<l;s++)i.__setDigit(s,0);return i}static __absoluteCompare(t,e){let i=t.length-e.length;if(0!=i)return i;let r=t.length-1;for(;0<=r&&t.__digit(r)===e.__digit(r);)r--;return 0>r?0:t.__unsignedDigit(r)>e.__unsignedDigit(r)?1:-1}static __multiplyAccumulate(t,e,i,r){if(0===e)return;let _=32767&e,n=e>>>15,l=0,s=0;for(let e,u=0;u<t.length;u++,r++){e=i.__digit(r);let g=t.__digit(u),a=32767&g,f=g>>>15,h=o.__imul(a,_),c=o.__imul(a,n),b=o.__imul(f,_),d=o.__imul(f,n);e+=s+h+l,l=e>>>30,e&=1073741823,e+=((32767&c)<<15)+((32767&b)<<15),l+=e>>>30,s=d+(c>>>15)+(b>>>15),i.__setDigit(r,1073741823&e)}for(;0!=l||0!==s;r++){let t=i.__digit(r);t+=l+s,s=0,l=t>>>30,i.__setDigit(r,1073741823&t)}}static __internalMultiplyAdd(t,e,i,r,_){let n=i,l=0;for(let i=0;i<r;i++){let r=t.__digit(i),s=o.__imul(32767&r,e),u=o.__imul(r>>>15,e),g=s+((32767&u)<<15)+l+n;n=g>>>30,l=u>>>15,_.__setDigit(i,1073741823&g)}if(_.length>r)for(_.__setDigit(r++,n+l);r<_.length;)_.__setDigit(r++,0);else if(0!==n+l)throw Error("implementation bug")}__inplaceMultiplyAdd(t,e,i){i>this.length&&(i=this.length);let r=32767&t,_=t>>>15,n=0,l=e;for(let t=0;t<i;t++){let e=this.__digit(t),i=32767&e,s=e>>>15,u=o.__imul(i,r),g=o.__imul(i,_),a=o.__imul(s,r),f=o.__imul(s,_),h=l+u+n;n=h>>>30,h&=1073741823,h+=((32767&g)<<15)+((32767&a)<<15),n+=h>>>30,l=f+(g>>>15)+(a>>>15),this.__setDigit(t,1073741823&h)}if(0!=n||0!==l)throw Error("implementation bug")}static __absoluteDivSmall(t,e,i=null){null===i&&(i=new o(t.length,!1));let r=0;for(let _,n=2*t.length-1;0<=n;n-=2){_=(r<<15|t.__halfDigit(n))>>>0;let l=0|_/e;_=((r=0|_%e)<<15|t.__halfDigit(n-1))>>>0;let s=0|_/e;r=0|_%e,i.__setDigit(n>>>1,l<<15|s)}return i}static __absoluteModSmall(t,e){let i=0;for(let r=2*t.length-1;0<=r;r--){let _=(i<<15|t.__halfDigit(r))>>>0;i=0|_%e}return i}static __absoluteDivLarge(t,e,i,r){let _=e.__halfDigitLength(),n=e.length,l=t.__halfDigitLength()-_,s=null;i&&(s=new o(l+2>>>1,!1)).__initializeDigits();let u=new o(_+2>>>1,!1);u.__initializeDigits();let g=o.__clz15(e.__halfDigit(_-1));0<g&&(e=o.__specialLeftShift(e,g,0));let a=o.__specialLeftShift(t,g,1),f=e.__halfDigit(_-1),h=0;for(let t,r=l;0<=r;r--){t=32767;let l=a.__halfDigit(r+_);if(l!==f){let i=(l<<15|a.__halfDigit(r+_-1))>>>0;t=0|i/f;let n=0|i%f,s=e.__halfDigit(_-2),u=a.__halfDigit(r+_-2);for(;o.__imul(t,s)>>>0>(n<<16|u)>>>0&&(t--,!(32767<(n+=f))););}o.__internalMultiplyAdd(e,t,0,n,u);let g=a.__inplaceSub(u,r,_+1);0!==g&&(g=a.__inplaceAdd(e,r,_),a.__setHalfDigit(r+_,32767&a.__halfDigit(r+_)+g),t--),i&&(1&r?h=t<<15:s.__setDigit(r>>>1,h|t))}if(r)return a.__inplaceRightShift(g),i?{quotient:s,remainder:a}:a;if(i)return s;throw Error("unreachable")}static __clz15(t){return o.__clz30(t)-15}__inplaceAdd(t,e,i){let r=0;for(let _=0;_<i;_++){let i=this.__halfDigit(e+_)+t.__halfDigit(_)+r;r=i>>>15,this.__setHalfDigit(e+_,32767&i)}return r}__inplaceSub(t,e,i){let r=0;if(1&e){e>>=1;let _=this.__digit(e),n=32767&_,l=0;for(;l<i-1>>>1;l++){let i=t.__digit(l),s=(_>>>15)-(32767&i)-r;r=1&s>>>15,this.__setDigit(e+l,(32767&s)<<15|32767&n),r=1&(n=(32767&(_=this.__digit(e+l+1)))-(i>>>15)-r)>>>15}let s=t.__digit(l),u=(_>>>15)-(32767&s)-r;if(r=1&u>>>15,this.__setDigit(e+l,(32767&u)<<15|32767&n),e+l+1>=this.length)throw RangeError("out of bounds");0==(1&i)&&(r=1&(n=(32767&(_=this.__digit(e+l+1)))-(s>>>15)-r)>>>15,this.__setDigit(e+t.length,1073709056&_|32767&n))}else{e>>=1;let _=0;for(;_<t.length-1;_++){let i=this.__digit(e+_),n=t.__digit(_),l=(32767&i)-(32767&n)-r;r=1&l>>>15;let s=(i>>>15)-(n>>>15)-r;r=1&s>>>15,this.__setDigit(e+_,(32767&s)<<15|32767&l)}let n=this.__digit(e+_),l=t.__digit(_),s=(32767&n)-(32767&l)-r;r=1&s>>>15;let u=0;0==(1&i)&&(r=1&(u=(n>>>15)-(l>>>15)-r)>>>15),this.__setDigit(e+_,(32767&u)<<15|32767&s)}return r}__inplaceRightShift(t){if(0===t)return;let e=this.__digit(0)>>>t,i=this.length-1;for(let r=0;r<i;r++){let i=this.__digit(r+1);this.__setDigit(r,1073741823&i<<30-t|e),e=i>>>t}this.__setDigit(i,e)}static __specialLeftShift(t,e,i){let r=t.length,_=new o(r+i,!1);if(0===e){for(let e=0;e<r;e++)_.__setDigit(e,t.__digit(e));return 0<i&&_.__setDigit(r,0),_}let n=0;for(let i=0;i<r;i++){let r=t.__digit(i);_.__setDigit(i,1073741823&r<<e|n),n=r>>>30-e}return 0<i&&_.__setDigit(r,n),_}static __leftShiftByAbsolute(t,e){let i=o.__toShiftAmount(e);if(0>i)throw RangeError("BigInt too big");let r=0|i/30,_=i%30,n=t.length,l=0!==_&&0!=t.__digit(n-1)>>>30-_,s=n+r+(l?1:0),u=new o(s,t.sign);if(0===_){let e=0;for(;e<r;e++)u.__setDigit(e,0);for(;e<s;e++)u.__setDigit(e,t.__digit(e-r))}else{let e=0;for(let t=0;t<r;t++)u.__setDigit(t,0);for(let i=0;i<n;i++){let n=t.__digit(i);u.__setDigit(i+r,1073741823&n<<_|e),e=n>>>30-_}if(l)u.__setDigit(n+r,e);else if(0!==e)throw Error("implementation bug")}return u.__trim()}static __rightShiftByAbsolute(t,e){let i=t.length,r=t.sign,_=o.__toShiftAmount(e);if(0>_)return o.__rightShiftByMaximum(r);let n=0|_/30,l=_%30,s=i-n;if(0>=s)return o.__rightShiftByMaximum(r);let u=!1;if(r){if(0!=(t.__digit(n)&(1<<l)-1))u=!0;else for(let e=0;e<n;e++)if(0!==t.__digit(e)){u=!0;break}}if(u&&0===l){let e=t.__digit(i-1);0==~e&&s++}let g=new o(s,r);if(0===l){g.__setDigit(s-1,0);for(let e=n;e<i;e++)g.__setDigit(e-n,t.__digit(e))}else{let e=t.__digit(n)>>>l,r=i-n-1;for(let i=0;i<r;i++){let r=t.__digit(i+n+1);g.__setDigit(i,1073741823&r<<30-l|e),e=r>>>l}g.__setDigit(r,e)}return u&&(g=o.__absoluteAddOne(g,!0,g)),g.__trim()}static __rightShiftByMaximum(t){return t?o.__oneDigit(1,!0):o.__zero()}static __toShiftAmount(t){if(1<t.length)return -1;let e=t.__unsignedDigit(0);return e>o.__kMaxLengthBits?-1:e}static __toPrimitive(t,e="default"){if("object"!=typeof t||t.constructor===o)return t;if("undefined"!=typeof Symbol&&"symbol"==typeof Symbol.toPrimitive){let i=t[Symbol.toPrimitive];if(i){let t=i(e);if("object"!=typeof t)return t;throw TypeError("Cannot convert object to primitive value")}}let i=t.valueOf;if(i){let e=i.call(t);if("object"!=typeof e)return e}let r=t.toString;if(r){let e=r.call(t);if("object"!=typeof e)return e}throw TypeError("Cannot convert object to primitive value")}static __toNumeric(t){return o.__isBigInt(t)?t:+t}static __isBigInt(t){return"object"==typeof t&&null!==t&&t.constructor===o}static __truncateToNBits(t,e){let i=0|(t+29)/30,r=new o(i,e.sign),_=i-1;for(let t=0;t<_;t++)r.__setDigit(t,e.__digit(t));let n=e.__digit(_);if(0!=t%30){let e=32-t%30;n=n<<e>>>e}return r.__setDigit(_,n),r.__trim()}static __truncateAndSubFromPowerOfTwo(t,e,i){let r;let _=0|(t+29)/30,n=new o(_,i),l=0,s=_-1,u=0;for(let t=(0,Math.min)(s,e.length);l<t;l++){let t=0-e.__digit(l)-u;u=1&t>>>30,n.__setDigit(l,1073741823&t)}for(;l<s;l++)n.__setDigit(l,0|1073741823&-u);let g=s<e.length?e.__digit(s):0,a=t%30;if(0==a)r=0-g-u&1073741823;else{let t=32-a;g=g<<t>>>t;let e=1<<32-t;r=e-g-u&e-1}return n.__setDigit(s,r),n.__trim()}__digit(t){return this[t]}__unsignedDigit(t){return this[t]>>>0}__setDigit(t,e){this[t]=0|e}__setDigitGrow(t,e){this[t]=0|e}__halfDigitLength(){let t=this.length;return 32767>=this.__unsignedDigit(t-1)?2*t-1:2*t}__halfDigit(t){return 32767&this[t>>>1]>>>15*(1&t)}__setHalfDigit(t,e){let i=t>>>1,r=this.__digit(i);this.__setDigit(i,1&t?32767&r|e<<15:1073709056&r|32767&e)}static __digitPow(t,e){let i=1;for(;0<e;)1&e&&(i*=t),e>>>=1,t*=t;return i}static __isOneDigitInt(t){return(1073741823&t)===t}};return o.__kMaxLength=33554432,o.__kMaxLengthBits=o.__kMaxLength<<5,o.__kMaxBitsPerChar=[0,0,32,51,64,75,83,90,96,102,107,111,115,119,122,126,128,131,134,136,139,141,143,145,147,149,151,153,154,156,158,159,160,162,163,165,166],o.__kBitsPerCharTableShift=5,o.__kBitsPerCharTableMultiplier=1<<o.__kBitsPerCharTableShift,o.__kConversionChars=["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"],o.__kBitConversionBuffer=new ArrayBuffer(8),o.__kBitConversionDouble=new Float64Array(o.__kBitConversionBuffer),o.__kBitConversionInts=new Int32Array(o.__kBitConversionBuffer),o.__clz30=t?function(e){return t(e)-2}:function(t){return 0===t?30:0|29-(0|(0,Math.log)(t>>>0)/Math.LN2)},o.__imul=Math.imul||function(t,e){return 0|t*e},o}()}}]);
//# sourceMappingURL=9499.7ff7e7f8d91db563.js.map