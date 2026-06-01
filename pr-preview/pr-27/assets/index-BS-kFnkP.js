(function(){const h=document.createElement("link").relList;if(h&&h.supports&&h.supports("modulepreload"))return;for(const v of document.querySelectorAll('link[rel="modulepreload"]'))d(v);new MutationObserver(v=>{for(const I of v)if(I.type==="childList")for(const y of I.addedNodes)y.tagName==="LINK"&&y.rel==="modulepreload"&&d(y)}).observe(document,{childList:!0,subtree:!0});function p(v){const I={};return v.integrity&&(I.integrity=v.integrity),v.referrerPolicy&&(I.referrerPolicy=v.referrerPolicy),v.crossOrigin==="use-credentials"?I.credentials="include":v.crossOrigin==="anonymous"?I.credentials="omit":I.credentials="same-origin",I}function d(v){if(v.ep)return;v.ep=!0;const I=p(v);fetch(v.href,I)}})();var xc={exports:{}},Cr={};var Nh;function Nf(){if(Nh)return Cr;Nh=1;var c=Symbol.for("react.transitional.element"),h=Symbol.for("react.fragment");function p(d,v,I){var y=null;if(I!==void 0&&(y=""+I),v.key!==void 0&&(y=""+v.key),"key"in v){I={};for(var S in v)S!=="key"&&(I[S]=v[S])}else I=v;return v=I.ref,{$$typeof:c,type:d,key:y,ref:v!==void 0?v:null,props:I}}return Cr.Fragment=h,Cr.jsx=p,Cr.jsxs=p,Cr}var Oh;function Of(){return Oh||(Oh=1,xc.exports=Nf()),xc.exports}var e=Of(),jc={exports:{}},ne={};var Dh;function Df(){if(Dh)return ne;Dh=1;var c=Symbol.for("react.transitional.element"),h=Symbol.for("react.portal"),p=Symbol.for("react.fragment"),d=Symbol.for("react.strict_mode"),v=Symbol.for("react.profiler"),I=Symbol.for("react.consumer"),y=Symbol.for("react.context"),S=Symbol.for("react.forward_ref"),g=Symbol.for("react.suspense"),f=Symbol.for("react.memo"),A=Symbol.for("react.lazy"),T=Symbol.for("react.activity"),Q=Symbol.iterator;function B(j){return j===null||typeof j!="object"?null:(j=Q&&j[Q]||j["@@iterator"],typeof j=="function"?j:null)}var C={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},R=Object.assign,O={};function L(j,q,Y){this.props=j,this.context=q,this.refs=O,this.updater=Y||C}L.prototype.isReactComponent={},L.prototype.setState=function(j,q){if(typeof j!="object"&&typeof j!="function"&&j!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,j,q,"setState")},L.prototype.forceUpdate=function(j){this.updater.enqueueForceUpdate(this,j,"forceUpdate")};function H(){}H.prototype=L.prototype;function _(j,q,Y){this.props=j,this.context=q,this.refs=O,this.updater=Y||C}var X=_.prototype=new H;X.constructor=_,R(X,L.prototype),X.isPureReactComponent=!0;var ie=Array.isArray;function xe(){}var J={H:null,A:null,T:null,S:null},ge=Object.prototype.hasOwnProperty;function Re(j,q,Y){var V=Y.ref;return{$$typeof:c,type:j,key:q,ref:V!==void 0?V:null,props:Y}}function et(j,q){return Re(j.type,q,j.props)}function Ue(j){return typeof j=="object"&&j!==null&&j.$$typeof===c}function Ee(j){var q={"=":"=0",":":"=2"};return"$"+j.replace(/[=:]/g,function(Y){return q[Y]})}var zt=/\/+/g;function Ce(j,q){return typeof j=="object"&&j!==null&&j.key!=null?Ee(""+j.key):q.toString(36)}function ze(j){switch(j.status){case"fulfilled":return j.value;case"rejected":throw j.reason;default:switch(typeof j.status=="string"?j.then(xe,xe):(j.status="pending",j.then(function(q){j.status==="pending"&&(j.status="fulfilled",j.value=q)},function(q){j.status==="pending"&&(j.status="rejected",j.reason=q)})),j.status){case"fulfilled":return j.value;case"rejected":throw j.reason}}throw j}function D(j,q,Y,V,te){var re=typeof j;(re==="undefined"||re==="boolean")&&(j=null);var he=!1;if(j===null)he=!0;else switch(re){case"bigint":case"string":case"number":he=!0;break;case"object":switch(j.$$typeof){case c:case h:he=!0;break;case A:return he=j._init,D(he(j._payload),q,Y,V,te)}}if(he)return te=te(j),he=V===""?"."+Ce(j,0):V,ie(te)?(Y="",he!=null&&(Y=he.replace(zt,"$&/")+"/"),D(te,q,Y,"",function(zs){return zs})):te!=null&&(Ue(te)&&(te=et(te,Y+(te.key==null||j&&j.key===te.key?"":(""+te.key).replace(zt,"$&/")+"/")+he)),q.push(te)),1;he=0;var Ve=V===""?".":V+":";if(ie(j))for(var Ae=0;Ae<j.length;Ae++)V=j[Ae],re=Ve+Ce(V,Ae),he+=D(V,q,Y,re,te);else if(Ae=B(j),typeof Ae=="function")for(j=Ae.call(j),Ae=0;!(V=j.next()).done;)V=V.value,re=Ve+Ce(V,Ae++),he+=D(V,q,Y,re,te);else if(re==="object"){if(typeof j.then=="function")return D(ze(j),q,Y,V,te);throw q=String(j),Error("Objects are not valid as a React child (found: "+(q==="[object Object]"?"object with keys {"+Object.keys(j).join(", ")+"}":q)+"). If you meant to render a collection of children, use an array instead.")}return he}function F(j,q,Y){if(j==null)return j;var V=[],te=0;return D(j,V,"","",function(re){return q.call(Y,re,te++)}),V}function Z(j){if(j._status===-1){var q=j._result;q=q(),q.then(function(Y){(j._status===0||j._status===-1)&&(j._status=1,j._result=Y)},function(Y){(j._status===0||j._status===-1)&&(j._status=2,j._result=Y)}),j._status===-1&&(j._status=0,j._result=q)}if(j._status===1)return j._result.default;throw j._result}var ye=typeof reportError=="function"?reportError:function(j){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var q=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof j=="object"&&j!==null&&typeof j.message=="string"?String(j.message):String(j),error:j});if(!window.dispatchEvent(q))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",j);return}console.error(j)},oe={map:F,forEach:function(j,q,Y){F(j,function(){q.apply(this,arguments)},Y)},count:function(j){var q=0;return F(j,function(){q++}),q},toArray:function(j){return F(j,function(q){return q})||[]},only:function(j){if(!Ue(j))throw Error("React.Children.only expected to receive a single React element child.");return j}};return ne.Activity=T,ne.Children=oe,ne.Component=L,ne.Fragment=p,ne.Profiler=v,ne.PureComponent=_,ne.StrictMode=d,ne.Suspense=g,ne.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=J,ne.__COMPILER_RUNTIME={__proto__:null,c:function(j){return J.H.useMemoCache(j)}},ne.cache=function(j){return function(){return j.apply(null,arguments)}},ne.cacheSignal=function(){return null},ne.cloneElement=function(j,q,Y){if(j==null)throw Error("The argument must be a React element, but you passed "+j+".");var V=R({},j.props),te=j.key;if(q!=null)for(re in q.key!==void 0&&(te=""+q.key),q)!ge.call(q,re)||re==="key"||re==="__self"||re==="__source"||re==="ref"&&q.ref===void 0||(V[re]=q[re]);var re=arguments.length-2;if(re===1)V.children=Y;else if(1<re){for(var he=Array(re),Ve=0;Ve<re;Ve++)he[Ve]=arguments[Ve+2];V.children=he}return Re(j.type,te,V)},ne.createContext=function(j){return j={$$typeof:y,_currentValue:j,_currentValue2:j,_threadCount:0,Provider:null,Consumer:null},j.Provider=j,j.Consumer={$$typeof:I,_context:j},j},ne.createElement=function(j,q,Y){var V,te={},re=null;if(q!=null)for(V in q.key!==void 0&&(re=""+q.key),q)ge.call(q,V)&&V!=="key"&&V!=="__self"&&V!=="__source"&&(te[V]=q[V]);var he=arguments.length-2;if(he===1)te.children=Y;else if(1<he){for(var Ve=Array(he),Ae=0;Ae<he;Ae++)Ve[Ae]=arguments[Ae+2];te.children=Ve}if(j&&j.defaultProps)for(V in he=j.defaultProps,he)te[V]===void 0&&(te[V]=he[V]);return Re(j,re,te)},ne.createRef=function(){return{current:null}},ne.forwardRef=function(j){return{$$typeof:S,render:j}},ne.isValidElement=Ue,ne.lazy=function(j){return{$$typeof:A,_payload:{_status:-1,_result:j},_init:Z}},ne.memo=function(j,q){return{$$typeof:f,type:j,compare:q===void 0?null:q}},ne.startTransition=function(j){var q=J.T,Y={};J.T=Y;try{var V=j(),te=J.S;te!==null&&te(Y,V),typeof V=="object"&&V!==null&&typeof V.then=="function"&&V.then(xe,ye)}catch(re){ye(re)}finally{q!==null&&Y.types!==null&&(q.types=Y.types),J.T=q}},ne.unstable_useCacheRefresh=function(){return J.H.useCacheRefresh()},ne.use=function(j){return J.H.use(j)},ne.useActionState=function(j,q,Y){return J.H.useActionState(j,q,Y)},ne.useCallback=function(j,q){return J.H.useCallback(j,q)},ne.useContext=function(j){return J.H.useContext(j)},ne.useDebugValue=function(){},ne.useDeferredValue=function(j,q){return J.H.useDeferredValue(j,q)},ne.useEffect=function(j,q){return J.H.useEffect(j,q)},ne.useEffectEvent=function(j){return J.H.useEffectEvent(j)},ne.useId=function(){return J.H.useId()},ne.useImperativeHandle=function(j,q,Y){return J.H.useImperativeHandle(j,q,Y)},ne.useInsertionEffect=function(j,q){return J.H.useInsertionEffect(j,q)},ne.useLayoutEffect=function(j,q){return J.H.useLayoutEffect(j,q)},ne.useMemo=function(j,q){return J.H.useMemo(j,q)},ne.useOptimistic=function(j,q){return J.H.useOptimistic(j,q)},ne.useReducer=function(j,q,Y){return J.H.useReducer(j,q,Y)},ne.useRef=function(j){return J.H.useRef(j)},ne.useState=function(j){return J.H.useState(j)},ne.useSyncExternalStore=function(j,q,Y){return J.H.useSyncExternalStore(j,q,Y)},ne.useTransition=function(){return J.H.useTransition()},ne.version="19.2.4",ne}var zh;function kc(){return zh||(zh=1,jc.exports=Df()),jc.exports}var G=kc(),gc={exports:{}},Rr={},yc={exports:{}},bc={};var Ih;function zf(){return Ih||(Ih=1,(function(c){function h(D,F){var Z=D.length;D.push(F);e:for(;0<Z;){var ye=Z-1>>>1,oe=D[ye];if(0<v(oe,F))D[ye]=F,D[Z]=oe,Z=ye;else break e}}function p(D){return D.length===0?null:D[0]}function d(D){if(D.length===0)return null;var F=D[0],Z=D.pop();if(Z!==F){D[0]=Z;e:for(var ye=0,oe=D.length,j=oe>>>1;ye<j;){var q=2*(ye+1)-1,Y=D[q],V=q+1,te=D[V];if(0>v(Y,Z))V<oe&&0>v(te,Y)?(D[ye]=te,D[V]=Z,ye=V):(D[ye]=Y,D[q]=Z,ye=q);else if(V<oe&&0>v(te,Z))D[ye]=te,D[V]=Z,ye=V;else break e}}return F}function v(D,F){var Z=D.sortIndex-F.sortIndex;return Z!==0?Z:D.id-F.id}if(c.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var I=performance;c.unstable_now=function(){return I.now()}}else{var y=Date,S=y.now();c.unstable_now=function(){return y.now()-S}}var g=[],f=[],A=1,T=null,Q=3,B=!1,C=!1,R=!1,O=!1,L=typeof setTimeout=="function"?setTimeout:null,H=typeof clearTimeout=="function"?clearTimeout:null,_=typeof setImmediate<"u"?setImmediate:null;function X(D){for(var F=p(f);F!==null;){if(F.callback===null)d(f);else if(F.startTime<=D)d(f),F.sortIndex=F.expirationTime,h(g,F);else break;F=p(f)}}function ie(D){if(R=!1,X(D),!C)if(p(g)!==null)C=!0,xe||(xe=!0,Ee());else{var F=p(f);F!==null&&ze(ie,F.startTime-D)}}var xe=!1,J=-1,ge=5,Re=-1;function et(){return O?!0:!(c.unstable_now()-Re<ge)}function Ue(){if(O=!1,xe){var D=c.unstable_now();Re=D;var F=!0;try{e:{C=!1,R&&(R=!1,H(J),J=-1),B=!0;var Z=Q;try{t:{for(X(D),T=p(g);T!==null&&!(T.expirationTime>D&&et());){var ye=T.callback;if(typeof ye=="function"){T.callback=null,Q=T.priorityLevel;var oe=ye(T.expirationTime<=D);if(D=c.unstable_now(),typeof oe=="function"){T.callback=oe,X(D),F=!0;break t}T===p(g)&&d(g),X(D)}else d(g);T=p(g)}if(T!==null)F=!0;else{var j=p(f);j!==null&&ze(ie,j.startTime-D),F=!1}}break e}finally{T=null,Q=Z,B=!1}F=void 0}}finally{F?Ee():xe=!1}}}var Ee;if(typeof _=="function")Ee=function(){_(Ue)};else if(typeof MessageChannel<"u"){var zt=new MessageChannel,Ce=zt.port2;zt.port1.onmessage=Ue,Ee=function(){Ce.postMessage(null)}}else Ee=function(){L(Ue,0)};function ze(D,F){J=L(function(){D(c.unstable_now())},F)}c.unstable_IdlePriority=5,c.unstable_ImmediatePriority=1,c.unstable_LowPriority=4,c.unstable_NormalPriority=3,c.unstable_Profiling=null,c.unstable_UserBlockingPriority=2,c.unstable_cancelCallback=function(D){D.callback=null},c.unstable_forceFrameRate=function(D){0>D||125<D?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ge=0<D?Math.floor(1e3/D):5},c.unstable_getCurrentPriorityLevel=function(){return Q},c.unstable_next=function(D){switch(Q){case 1:case 2:case 3:var F=3;break;default:F=Q}var Z=Q;Q=F;try{return D()}finally{Q=Z}},c.unstable_requestPaint=function(){O=!0},c.unstable_runWithPriority=function(D,F){switch(D){case 1:case 2:case 3:case 4:case 5:break;default:D=3}var Z=Q;Q=D;try{return F()}finally{Q=Z}},c.unstable_scheduleCallback=function(D,F,Z){var ye=c.unstable_now();switch(typeof Z=="object"&&Z!==null?(Z=Z.delay,Z=typeof Z=="number"&&0<Z?ye+Z:ye):Z=ye,D){case 1:var oe=-1;break;case 2:oe=250;break;case 5:oe=1073741823;break;case 4:oe=1e4;break;default:oe=5e3}return oe=Z+oe,D={id:A++,callback:F,priorityLevel:D,startTime:Z,expirationTime:oe,sortIndex:-1},Z>ye?(D.sortIndex=Z,h(f,D),p(g)===null&&D===p(f)&&(R?(H(J),J=-1):R=!0,ze(ie,Z-ye))):(D.sortIndex=oe,h(g,D),C||B||(C=!0,xe||(xe=!0,Ee()))),D},c.unstable_shouldYield=et,c.unstable_wrapCallback=function(D){var F=Q;return function(){var Z=Q;Q=F;try{return D.apply(this,arguments)}finally{Q=Z}}}})(bc)),bc}var _h;function If(){return _h||(_h=1,yc.exports=zf()),yc.exports}var vc={exports:{}},$e={};var Mh;function _f(){if(Mh)return $e;Mh=1;var c=kc();function h(g){var f="https://react.dev/errors/"+g;if(1<arguments.length){f+="?args[]="+encodeURIComponent(arguments[1]);for(var A=2;A<arguments.length;A++)f+="&args[]="+encodeURIComponent(arguments[A])}return"Minified React error #"+g+"; visit "+f+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function p(){}var d={d:{f:p,r:function(){throw Error(h(522))},D:p,C:p,L:p,m:p,X:p,S:p,M:p},p:0,findDOMNode:null},v=Symbol.for("react.portal");function I(g,f,A){var T=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:v,key:T==null?null:""+T,children:g,containerInfo:f,implementation:A}}var y=c.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function S(g,f){if(g==="font")return"";if(typeof f=="string")return f==="use-credentials"?f:""}return $e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=d,$e.createPortal=function(g,f){var A=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!f||f.nodeType!==1&&f.nodeType!==9&&f.nodeType!==11)throw Error(h(299));return I(g,f,null,A)},$e.flushSync=function(g){var f=y.T,A=d.p;try{if(y.T=null,d.p=2,g)return g()}finally{y.T=f,d.p=A,d.d.f()}},$e.preconnect=function(g,f){typeof g=="string"&&(f?(f=f.crossOrigin,f=typeof f=="string"?f==="use-credentials"?f:"":void 0):f=null,d.d.C(g,f))},$e.prefetchDNS=function(g){typeof g=="string"&&d.d.D(g)},$e.preinit=function(g,f){if(typeof g=="string"&&f&&typeof f.as=="string"){var A=f.as,T=S(A,f.crossOrigin),Q=typeof f.integrity=="string"?f.integrity:void 0,B=typeof f.fetchPriority=="string"?f.fetchPriority:void 0;A==="style"?d.d.S(g,typeof f.precedence=="string"?f.precedence:void 0,{crossOrigin:T,integrity:Q,fetchPriority:B}):A==="script"&&d.d.X(g,{crossOrigin:T,integrity:Q,fetchPriority:B,nonce:typeof f.nonce=="string"?f.nonce:void 0})}},$e.preinitModule=function(g,f){if(typeof g=="string")if(typeof f=="object"&&f!==null){if(f.as==null||f.as==="script"){var A=S(f.as,f.crossOrigin);d.d.M(g,{crossOrigin:A,integrity:typeof f.integrity=="string"?f.integrity:void 0,nonce:typeof f.nonce=="string"?f.nonce:void 0})}}else f==null&&d.d.M(g)},$e.preload=function(g,f){if(typeof g=="string"&&typeof f=="object"&&f!==null&&typeof f.as=="string"){var A=f.as,T=S(A,f.crossOrigin);d.d.L(g,A,{crossOrigin:T,integrity:typeof f.integrity=="string"?f.integrity:void 0,nonce:typeof f.nonce=="string"?f.nonce:void 0,type:typeof f.type=="string"?f.type:void 0,fetchPriority:typeof f.fetchPriority=="string"?f.fetchPriority:void 0,referrerPolicy:typeof f.referrerPolicy=="string"?f.referrerPolicy:void 0,imageSrcSet:typeof f.imageSrcSet=="string"?f.imageSrcSet:void 0,imageSizes:typeof f.imageSizes=="string"?f.imageSizes:void 0,media:typeof f.media=="string"?f.media:void 0})}},$e.preloadModule=function(g,f){if(typeof g=="string")if(f){var A=S(f.as,f.crossOrigin);d.d.m(g,{as:typeof f.as=="string"&&f.as!=="script"?f.as:void 0,crossOrigin:A,integrity:typeof f.integrity=="string"?f.integrity:void 0})}else d.d.m(g)},$e.requestFormReset=function(g){d.d.r(g)},$e.unstable_batchedUpdates=function(g,f){return g(f)},$e.useFormState=function(g,f,A){return y.H.useFormState(g,f,A)},$e.useFormStatus=function(){return y.H.useHostTransitionStatus()},$e.version="19.2.4",$e}var qh;function Mf(){if(qh)return vc.exports;qh=1;function c(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c)}catch(h){console.error(h)}}return c(),vc.exports=_f(),vc.exports}var Uh;function qf(){if(Uh)return Rr;Uh=1;var c=If(),h=kc(),p=Mf();function d(t){var n="https://react.dev/errors/"+t;if(1<arguments.length){n+="?args[]="+encodeURIComponent(arguments[1]);for(var s=2;s<arguments.length;s++)n+="&args[]="+encodeURIComponent(arguments[s])}return"Minified React error #"+t+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function v(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function I(t){var n=t,s=t;if(t.alternate)for(;n.return;)n=n.return;else{t=n;do n=t,(n.flags&4098)!==0&&(s=n.return),t=n.return;while(t)}return n.tag===3?s:null}function y(t){if(t.tag===13){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function S(t){if(t.tag===31){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function g(t){if(I(t)!==t)throw Error(d(188))}function f(t){var n=t.alternate;if(!n){if(n=I(t),n===null)throw Error(d(188));return n!==t?null:t}for(var s=t,r=n;;){var a=s.return;if(a===null)break;var i=a.alternate;if(i===null){if(r=a.return,r!==null){s=r;continue}break}if(a.child===i.child){for(i=a.child;i;){if(i===s)return g(a),t;if(i===r)return g(a),n;i=i.sibling}throw Error(d(188))}if(s.return!==r.return)s=a,r=i;else{for(var l=!1,o=a.child;o;){if(o===s){l=!0,s=a,r=i;break}if(o===r){l=!0,r=a,s=i;break}o=o.sibling}if(!l){for(o=i.child;o;){if(o===s){l=!0,s=i,r=a;break}if(o===r){l=!0,r=i,s=a;break}o=o.sibling}if(!l)throw Error(d(189))}}if(s.alternate!==r)throw Error(d(190))}if(s.tag!==3)throw Error(d(188));return s.stateNode.current===s?t:n}function A(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t;for(t=t.child;t!==null;){if(n=A(t),n!==null)return n;t=t.sibling}return null}var T=Object.assign,Q=Symbol.for("react.element"),B=Symbol.for("react.transitional.element"),C=Symbol.for("react.portal"),R=Symbol.for("react.fragment"),O=Symbol.for("react.strict_mode"),L=Symbol.for("react.profiler"),H=Symbol.for("react.consumer"),_=Symbol.for("react.context"),X=Symbol.for("react.forward_ref"),ie=Symbol.for("react.suspense"),xe=Symbol.for("react.suspense_list"),J=Symbol.for("react.memo"),ge=Symbol.for("react.lazy"),Re=Symbol.for("react.activity"),et=Symbol.for("react.memo_cache_sentinel"),Ue=Symbol.iterator;function Ee(t){return t===null||typeof t!="object"?null:(t=Ue&&t[Ue]||t["@@iterator"],typeof t=="function"?t:null)}var zt=Symbol.for("react.client.reference");function Ce(t){if(t==null)return null;if(typeof t=="function")return t.$$typeof===zt?null:t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case R:return"Fragment";case L:return"Profiler";case O:return"StrictMode";case ie:return"Suspense";case xe:return"SuspenseList";case Re:return"Activity"}if(typeof t=="object")switch(t.$$typeof){case C:return"Portal";case _:return t.displayName||"Context";case H:return(t._context.displayName||"Context")+".Consumer";case X:var n=t.render;return t=t.displayName,t||(t=n.displayName||n.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case J:return n=t.displayName||null,n!==null?n:Ce(t.type)||"Memo";case ge:n=t._payload,t=t._init;try{return Ce(t(n))}catch{}}return null}var ze=Array.isArray,D=h.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,F=p.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Z={pending:!1,data:null,method:null,action:null},ye=[],oe=-1;function j(t){return{current:t}}function q(t){0>oe||(t.current=ye[oe],ye[oe]=null,oe--)}function Y(t,n){oe++,ye[oe]=t.current,t.current=n}var V=j(null),te=j(null),re=j(null),he=j(null);function Ve(t,n){switch(Y(re,n),Y(te,t),Y(V,null),n.nodeType){case 9:case 11:t=(t=n.documentElement)&&(t=t.namespaceURI)?$u(t):0;break;default:if(t=n.tagName,n=n.namespaceURI)n=$u(n),t=eh(n,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}q(V),Y(V,t)}function Ae(){q(V),q(te),q(re)}function zs(t){t.memoizedState!==null&&Y(he,t);var n=V.current,s=eh(n,t.type);n!==s&&(Y(te,t),Y(V,s))}function Ar(t){te.current===t&&(q(V),q(te)),he.current===t&&(q(he),Sr._currentValue=Z)}var Ja,Ec;function Nn(t){if(Ja===void 0)try{throw Error()}catch(s){var n=s.stack.trim().match(/\n( *(at )?)/);Ja=n&&n[1]||"",Ec=-1<s.stack.indexOf(`
    at`)?" (<anonymous>)":-1<s.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Ja+t+Ec}var $a=!1;function ei(t,n){if(!t||$a)return"";$a=!0;var s=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(n){var U=function(){throw Error()};if(Object.defineProperty(U.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(U,[])}catch(N){var E=N}Reflect.construct(t,[],U)}else{try{U.call()}catch(N){E=N}t.call(U.prototype)}}else{try{throw Error()}catch(N){E=N}(U=t())&&typeof U.catch=="function"&&U.catch(function(){})}}catch(N){if(N&&E&&typeof N.stack=="string")return[N.stack,E.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var a=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,"name");a&&a.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var i=r.DetermineComponentFrameRoot(),l=i[0],o=i[1];if(l&&o){var m=l.split(`
`),k=o.split(`
`);for(a=r=0;r<m.length&&!m[r].includes("DetermineComponentFrameRoot");)r++;for(;a<k.length&&!k[a].includes("DetermineComponentFrameRoot");)a++;if(r===m.length||a===k.length)for(r=m.length-1,a=k.length-1;1<=r&&0<=a&&m[r]!==k[a];)a--;for(;1<=r&&0<=a;r--,a--)if(m[r]!==k[a]){if(r!==1||a!==1)do if(r--,a--,0>a||m[r]!==k[a]){var z=`
`+m[r].replace(" at new "," at ");return t.displayName&&z.includes("<anonymous>")&&(z=z.replace("<anonymous>",t.displayName)),z}while(1<=r&&0<=a);break}}}finally{$a=!1,Error.prepareStackTrace=s}return(s=t?t.displayName||t.name:"")?Nn(s):""}function ip(t,n){switch(t.tag){case 26:case 27:case 5:return Nn(t.type);case 16:return Nn("Lazy");case 13:return t.child!==n&&n!==null?Nn("Suspense Fallback"):Nn("Suspense");case 19:return Nn("SuspenseList");case 0:case 15:return ei(t.type,!1);case 11:return ei(t.type.render,!1);case 1:return ei(t.type,!0);case 31:return Nn("Activity");default:return""}}function Ac(t){try{var n="",s=null;do n+=ip(t,s),s=t,t=t.return;while(t);return n}catch(r){return`
Error generating stack: `+r.message+`
`+r.stack}}var ti=Object.prototype.hasOwnProperty,ni=c.unstable_scheduleCallback,si=c.unstable_cancelCallback,lp=c.unstable_shouldYield,cp=c.unstable_requestPaint,ot=c.unstable_now,op=c.unstable_getCurrentPriorityLevel,Nc=c.unstable_ImmediatePriority,Oc=c.unstable_UserBlockingPriority,Nr=c.unstable_NormalPriority,dp=c.unstable_LowPriority,Dc=c.unstable_IdlePriority,up=c.log,hp=c.unstable_setDisableYieldValue,Is=null,dt=null;function rn(t){if(typeof up=="function"&&hp(t),dt&&typeof dt.setStrictMode=="function")try{dt.setStrictMode(Is,t)}catch{}}var ut=Math.clz32?Math.clz32:fp,pp=Math.log,mp=Math.LN2;function fp(t){return t>>>=0,t===0?32:31-(pp(t)/mp|0)|0}var Or=256,Dr=262144,zr=4194304;function On(t){var n=t&42;if(n!==0)return n;switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return t&261888;case 262144:case 524288:case 1048576:case 2097152:return t&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return t&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return t}}function Ir(t,n,s){var r=t.pendingLanes;if(r===0)return 0;var a=0,i=t.suspendedLanes,l=t.pingedLanes;t=t.warmLanes;var o=r&134217727;return o!==0?(r=o&~i,r!==0?a=On(r):(l&=o,l!==0?a=On(l):s||(s=o&~t,s!==0&&(a=On(s))))):(o=r&~i,o!==0?a=On(o):l!==0?a=On(l):s||(s=r&~t,s!==0&&(a=On(s)))),a===0?0:n!==0&&n!==a&&(n&i)===0&&(i=a&-a,s=n&-n,i>=s||i===32&&(s&4194048)!==0)?n:a}function _s(t,n){return(t.pendingLanes&~(t.suspendedLanes&~t.pingedLanes)&n)===0}function xp(t,n){switch(t){case 1:case 2:case 4:case 8:case 64:return n+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function zc(){var t=zr;return zr<<=1,(zr&62914560)===0&&(zr=4194304),t}function ri(t){for(var n=[],s=0;31>s;s++)n.push(t);return n}function Ms(t,n){t.pendingLanes|=n,n!==268435456&&(t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0)}function jp(t,n,s,r,a,i){var l=t.pendingLanes;t.pendingLanes=s,t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0,t.expiredLanes&=s,t.entangledLanes&=s,t.errorRecoveryDisabledLanes&=s,t.shellSuspendCounter=0;var o=t.entanglements,m=t.expirationTimes,k=t.hiddenUpdates;for(s=l&~s;0<s;){var z=31-ut(s),U=1<<z;o[z]=0,m[z]=-1;var E=k[z];if(E!==null)for(k[z]=null,z=0;z<E.length;z++){var N=E[z];N!==null&&(N.lane&=-536870913)}s&=~U}r!==0&&Ic(t,r,0),i!==0&&a===0&&t.tag!==0&&(t.suspendedLanes|=i&~(l&~n))}function Ic(t,n,s){t.pendingLanes|=n,t.suspendedLanes&=~n;var r=31-ut(n);t.entangledLanes|=n,t.entanglements[r]=t.entanglements[r]|1073741824|s&261930}function _c(t,n){var s=t.entangledLanes|=n;for(t=t.entanglements;s;){var r=31-ut(s),a=1<<r;a&n|t[r]&n&&(t[r]|=n),s&=~a}}function Mc(t,n){var s=n&-n;return s=(s&42)!==0?1:ai(s),(s&(t.suspendedLanes|n))!==0?0:s}function ai(t){switch(t){case 2:t=1;break;case 8:t=4;break;case 32:t=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:t=128;break;case 268435456:t=134217728;break;default:t=0}return t}function ii(t){return t&=-t,2<t?8<t?(t&134217727)!==0?32:268435456:8:2}function qc(){var t=F.p;return t!==0?t:(t=window.event,t===void 0?32:Th(t.type))}function Uc(t,n){var s=F.p;try{return F.p=t,n()}finally{F.p=s}}var an=Math.random().toString(36).slice(2),Ke="__reactFiber$"+an,nt="__reactProps$"+an,Wn="__reactContainer$"+an,li="__reactEvents$"+an,gp="__reactListeners$"+an,yp="__reactHandles$"+an,Pc="__reactResources$"+an,qs="__reactMarker$"+an;function ci(t){delete t[Ke],delete t[nt],delete t[li],delete t[gp],delete t[yp]}function Zn(t){var n=t[Ke];if(n)return n;for(var s=t.parentNode;s;){if(n=s[Wn]||s[Ke]){if(s=n.alternate,n.child!==null||s!==null&&s.child!==null)for(t=lh(t);t!==null;){if(s=t[Ke])return s;t=lh(t)}return n}t=s,s=t.parentNode}return null}function Xn(t){if(t=t[Ke]||t[Wn]){var n=t.tag;if(n===5||n===6||n===13||n===31||n===26||n===27||n===3)return t}return null}function Us(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t.stateNode;throw Error(d(33))}function Jn(t){var n=t[Pc];return n||(n=t[Pc]={hoistableStyles:new Map,hoistableScripts:new Map}),n}function Ye(t){t[qs]=!0}var Lc=new Set,Bc={};function Dn(t,n){$n(t,n),$n(t+"Capture",n)}function $n(t,n){for(Bc[t]=n,t=0;t<n.length;t++)Lc.add(n[t])}var bp=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Hc={},Qc={};function vp(t){return ti.call(Qc,t)?!0:ti.call(Hc,t)?!1:bp.test(t)?Qc[t]=!0:(Hc[t]=!0,!1)}function _r(t,n,s){if(vp(n))if(s===null)t.removeAttribute(n);else{switch(typeof s){case"undefined":case"function":case"symbol":t.removeAttribute(n);return;case"boolean":var r=n.toLowerCase().slice(0,5);if(r!=="data-"&&r!=="aria-"){t.removeAttribute(n);return}}t.setAttribute(n,""+s)}}function Mr(t,n,s){if(s===null)t.removeAttribute(n);else{switch(typeof s){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(n);return}t.setAttribute(n,""+s)}}function Lt(t,n,s,r){if(r===null)t.removeAttribute(s);else{switch(typeof r){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(s);return}t.setAttributeNS(n,s,""+r)}}function bt(t){switch(typeof t){case"bigint":case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function Fc(t){var n=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function Sp(t,n,s){var r=Object.getOwnPropertyDescriptor(t.constructor.prototype,n);if(!t.hasOwnProperty(n)&&typeof r<"u"&&typeof r.get=="function"&&typeof r.set=="function"){var a=r.get,i=r.set;return Object.defineProperty(t,n,{configurable:!0,get:function(){return a.call(this)},set:function(l){s=""+l,i.call(this,l)}}),Object.defineProperty(t,n,{enumerable:r.enumerable}),{getValue:function(){return s},setValue:function(l){s=""+l},stopTracking:function(){t._valueTracker=null,delete t[n]}}}}function oi(t){if(!t._valueTracker){var n=Fc(t)?"checked":"value";t._valueTracker=Sp(t,n,""+t[n])}}function Yc(t){if(!t)return!1;var n=t._valueTracker;if(!n)return!0;var s=n.getValue(),r="";return t&&(r=Fc(t)?t.checked?"true":"false":t.value),t=r,t!==s?(n.setValue(t),!0):!1}function qr(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}var Tp=/[\n"\\]/g;function vt(t){return t.replace(Tp,function(n){return"\\"+n.charCodeAt(0).toString(16)+" "})}function di(t,n,s,r,a,i,l,o){t.name="",l!=null&&typeof l!="function"&&typeof l!="symbol"&&typeof l!="boolean"?t.type=l:t.removeAttribute("type"),n!=null?l==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+bt(n)):t.value!==""+bt(n)&&(t.value=""+bt(n)):l!=="submit"&&l!=="reset"||t.removeAttribute("value"),n!=null?ui(t,l,bt(n)):s!=null?ui(t,l,bt(s)):r!=null&&t.removeAttribute("value"),a==null&&i!=null&&(t.defaultChecked=!!i),a!=null&&(t.checked=a&&typeof a!="function"&&typeof a!="symbol"),o!=null&&typeof o!="function"&&typeof o!="symbol"&&typeof o!="boolean"?t.name=""+bt(o):t.removeAttribute("name")}function Gc(t,n,s,r,a,i,l,o){if(i!=null&&typeof i!="function"&&typeof i!="symbol"&&typeof i!="boolean"&&(t.type=i),n!=null||s!=null){if(!(i!=="submit"&&i!=="reset"||n!=null)){oi(t);return}s=s!=null?""+bt(s):"",n=n!=null?""+bt(n):s,o||n===t.value||(t.value=n),t.defaultValue=n}r=r??a,r=typeof r!="function"&&typeof r!="symbol"&&!!r,t.checked=o?t.checked:!!r,t.defaultChecked=!!r,l!=null&&typeof l!="function"&&typeof l!="symbol"&&typeof l!="boolean"&&(t.name=l),oi(t)}function ui(t,n,s){n==="number"&&qr(t.ownerDocument)===t||t.defaultValue===""+s||(t.defaultValue=""+s)}function es(t,n,s,r){if(t=t.options,n){n={};for(var a=0;a<s.length;a++)n["$"+s[a]]=!0;for(s=0;s<t.length;s++)a=n.hasOwnProperty("$"+t[s].value),t[s].selected!==a&&(t[s].selected=a),a&&r&&(t[s].defaultSelected=!0)}else{for(s=""+bt(s),n=null,a=0;a<t.length;a++){if(t[a].value===s){t[a].selected=!0,r&&(t[a].defaultSelected=!0);return}n!==null||t[a].disabled||(n=t[a])}n!==null&&(n.selected=!0)}}function Vc(t,n,s){if(n!=null&&(n=""+bt(n),n!==t.value&&(t.value=n),s==null)){t.defaultValue!==n&&(t.defaultValue=n);return}t.defaultValue=s!=null?""+bt(s):""}function Kc(t,n,s,r){if(n==null){if(r!=null){if(s!=null)throw Error(d(92));if(ze(r)){if(1<r.length)throw Error(d(93));r=r[0]}s=r}s==null&&(s=""),n=s}s=bt(n),t.defaultValue=s,r=t.textContent,r===s&&r!==""&&r!==null&&(t.value=r),oi(t)}function ts(t,n){if(n){var s=t.firstChild;if(s&&s===t.lastChild&&s.nodeType===3){s.nodeValue=n;return}}t.textContent=n}var wp=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Wc(t,n,s){var r=n.indexOf("--")===0;s==null||typeof s=="boolean"||s===""?r?t.setProperty(n,""):n==="float"?t.cssFloat="":t[n]="":r?t.setProperty(n,s):typeof s!="number"||s===0||wp.has(n)?n==="float"?t.cssFloat=s:t[n]=(""+s).trim():t[n]=s+"px"}function Zc(t,n,s){if(n!=null&&typeof n!="object")throw Error(d(62));if(t=t.style,s!=null){for(var r in s)!s.hasOwnProperty(r)||n!=null&&n.hasOwnProperty(r)||(r.indexOf("--")===0?t.setProperty(r,""):r==="float"?t.cssFloat="":t[r]="");for(var a in n)r=n[a],n.hasOwnProperty(a)&&s[a]!==r&&Wc(t,a,r)}else for(var i in n)n.hasOwnProperty(i)&&Wc(t,i,n[i])}function hi(t){if(t.indexOf("-")===-1)return!1;switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var kp=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),Cp=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Ur(t){return Cp.test(""+t)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":t}function Bt(){}var pi=null;function mi(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var ns=null,ss=null;function Xc(t){var n=Xn(t);if(n&&(t=n.stateNode)){var s=t[nt]||null;e:switch(t=n.stateNode,n.type){case"input":if(di(t,s.value,s.defaultValue,s.defaultValue,s.checked,s.defaultChecked,s.type,s.name),n=s.name,s.type==="radio"&&n!=null){for(s=t;s.parentNode;)s=s.parentNode;for(s=s.querySelectorAll('input[name="'+vt(""+n)+'"][type="radio"]'),n=0;n<s.length;n++){var r=s[n];if(r!==t&&r.form===t.form){var a=r[nt]||null;if(!a)throw Error(d(90));di(r,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name)}}for(n=0;n<s.length;n++)r=s[n],r.form===t.form&&Yc(r)}break e;case"textarea":Vc(t,s.value,s.defaultValue);break e;case"select":n=s.value,n!=null&&es(t,!!s.multiple,n,!1)}}}var fi=!1;function Jc(t,n,s){if(fi)return t(n,s);fi=!0;try{var r=t(n);return r}finally{if(fi=!1,(ns!==null||ss!==null)&&(ka(),ns&&(n=ns,t=ss,ss=ns=null,Xc(n),t)))for(n=0;n<t.length;n++)Xc(t[n])}}function Ps(t,n){var s=t.stateNode;if(s===null)return null;var r=s[nt]||null;if(r===null)return null;s=r[n];e:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(t=t.type,r=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!r;break e;default:t=!1}if(t)return null;if(s&&typeof s!="function")throw Error(d(231,n,typeof s));return s}var Ht=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),xi=!1;if(Ht)try{var Ls={};Object.defineProperty(Ls,"passive",{get:function(){xi=!0}}),window.addEventListener("test",Ls,Ls),window.removeEventListener("test",Ls,Ls)}catch{xi=!1}var ln=null,ji=null,Pr=null;function $c(){if(Pr)return Pr;var t,n=ji,s=n.length,r,a="value"in ln?ln.value:ln.textContent,i=a.length;for(t=0;t<s&&n[t]===a[t];t++);var l=s-t;for(r=1;r<=l&&n[s-r]===a[i-r];r++);return Pr=a.slice(t,1<r?1-r:void 0)}function Lr(t){var n=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&n===13&&(t=13)):t=n,t===10&&(t=13),32<=t||t===13?t:0}function Br(){return!0}function eo(){return!1}function st(t){function n(s,r,a,i,l){this._reactName=s,this._targetInst=a,this.type=r,this.nativeEvent=i,this.target=l,this.currentTarget=null;for(var o in t)t.hasOwnProperty(o)&&(s=t[o],this[o]=s?s(i):i[o]);return this.isDefaultPrevented=(i.defaultPrevented!=null?i.defaultPrevented:i.returnValue===!1)?Br:eo,this.isPropagationStopped=eo,this}return T(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var s=this.nativeEvent;s&&(s.preventDefault?s.preventDefault():typeof s.returnValue!="unknown"&&(s.returnValue=!1),this.isDefaultPrevented=Br)},stopPropagation:function(){var s=this.nativeEvent;s&&(s.stopPropagation?s.stopPropagation():typeof s.cancelBubble!="unknown"&&(s.cancelBubble=!0),this.isPropagationStopped=Br)},persist:function(){},isPersistent:Br}),n}var zn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Hr=st(zn),Bs=T({},zn,{view:0,detail:0}),Rp=st(Bs),gi,yi,Hs,Qr=T({},Bs,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:vi,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==Hs&&(Hs&&t.type==="mousemove"?(gi=t.screenX-Hs.screenX,yi=t.screenY-Hs.screenY):yi=gi=0,Hs=t),gi)},movementY:function(t){return"movementY"in t?t.movementY:yi}}),to=st(Qr),Ep=T({},Qr,{dataTransfer:0}),Ap=st(Ep),Np=T({},Bs,{relatedTarget:0}),bi=st(Np),Op=T({},zn,{animationName:0,elapsedTime:0,pseudoElement:0}),Dp=st(Op),zp=T({},zn,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),Ip=st(zp),_p=T({},zn,{data:0}),no=st(_p),Mp={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},qp={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Up={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Pp(t){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(t):(t=Up[t])?!!n[t]:!1}function vi(){return Pp}var Lp=T({},Bs,{key:function(t){if(t.key){var n=Mp[t.key]||t.key;if(n!=="Unidentified")return n}return t.type==="keypress"?(t=Lr(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?qp[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:vi,charCode:function(t){return t.type==="keypress"?Lr(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Lr(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),Bp=st(Lp),Hp=T({},Qr,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),so=st(Hp),Qp=T({},Bs,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:vi}),Fp=st(Qp),Yp=T({},zn,{propertyName:0,elapsedTime:0,pseudoElement:0}),Gp=st(Yp),Vp=T({},Qr,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),Kp=st(Vp),Wp=T({},zn,{newState:0,oldState:0}),Zp=st(Wp),Xp=[9,13,27,32],Si=Ht&&"CompositionEvent"in window,Qs=null;Ht&&"documentMode"in document&&(Qs=document.documentMode);var Jp=Ht&&"TextEvent"in window&&!Qs,ro=Ht&&(!Si||Qs&&8<Qs&&11>=Qs),ao=" ",io=!1;function lo(t,n){switch(t){case"keyup":return Xp.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function co(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var rs=!1;function $p(t,n){switch(t){case"compositionend":return co(n);case"keypress":return n.which!==32?null:(io=!0,ao);case"textInput":return t=n.data,t===ao&&io?null:t;default:return null}}function em(t,n){if(rs)return t==="compositionend"||!Si&&lo(t,n)?(t=$c(),Pr=ji=ln=null,rs=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return ro&&n.locale!=="ko"?null:n.data;default:return null}}var tm={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function oo(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n==="input"?!!tm[t.type]:n==="textarea"}function uo(t,n,s,r){ns?ss?ss.push(r):ss=[r]:ns=r,n=Da(n,"onChange"),0<n.length&&(s=new Hr("onChange","change",null,s,r),t.push({event:s,listeners:n}))}var Fs=null,Ys=null;function nm(t){Vu(t,0)}function Fr(t){var n=Us(t);if(Yc(n))return t}function ho(t,n){if(t==="change")return n}var po=!1;if(Ht){var Ti;if(Ht){var wi="oninput"in document;if(!wi){var mo=document.createElement("div");mo.setAttribute("oninput","return;"),wi=typeof mo.oninput=="function"}Ti=wi}else Ti=!1;po=Ti&&(!document.documentMode||9<document.documentMode)}function fo(){Fs&&(Fs.detachEvent("onpropertychange",xo),Ys=Fs=null)}function xo(t){if(t.propertyName==="value"&&Fr(Ys)){var n=[];uo(n,Ys,t,mi(t)),Jc(nm,n)}}function sm(t,n,s){t==="focusin"?(fo(),Fs=n,Ys=s,Fs.attachEvent("onpropertychange",xo)):t==="focusout"&&fo()}function rm(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return Fr(Ys)}function am(t,n){if(t==="click")return Fr(n)}function im(t,n){if(t==="input"||t==="change")return Fr(n)}function lm(t,n){return t===n&&(t!==0||1/t===1/n)||t!==t&&n!==n}var ht=typeof Object.is=="function"?Object.is:lm;function Gs(t,n){if(ht(t,n))return!0;if(typeof t!="object"||t===null||typeof n!="object"||n===null)return!1;var s=Object.keys(t),r=Object.keys(n);if(s.length!==r.length)return!1;for(r=0;r<s.length;r++){var a=s[r];if(!ti.call(n,a)||!ht(t[a],n[a]))return!1}return!0}function jo(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function go(t,n){var s=jo(t);t=0;for(var r;s;){if(s.nodeType===3){if(r=t+s.textContent.length,t<=n&&r>=n)return{node:s,offset:n-t};t=r}e:{for(;s;){if(s.nextSibling){s=s.nextSibling;break e}s=s.parentNode}s=void 0}s=jo(s)}}function yo(t,n){return t&&n?t===n?!0:t&&t.nodeType===3?!1:n&&n.nodeType===3?yo(t,n.parentNode):"contains"in t?t.contains(n):t.compareDocumentPosition?!!(t.compareDocumentPosition(n)&16):!1:!1}function bo(t){t=t!=null&&t.ownerDocument!=null&&t.ownerDocument.defaultView!=null?t.ownerDocument.defaultView:window;for(var n=qr(t.document);n instanceof t.HTMLIFrameElement;){try{var s=typeof n.contentWindow.location.href=="string"}catch{s=!1}if(s)t=n.contentWindow;else break;n=qr(t.document)}return n}function ki(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n&&(n==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||n==="textarea"||t.contentEditable==="true")}var cm=Ht&&"documentMode"in document&&11>=document.documentMode,as=null,Ci=null,Vs=null,Ri=!1;function vo(t,n,s){var r=s.window===s?s.document:s.nodeType===9?s:s.ownerDocument;Ri||as==null||as!==qr(r)||(r=as,"selectionStart"in r&&ki(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Vs&&Gs(Vs,r)||(Vs=r,r=Da(Ci,"onSelect"),0<r.length&&(n=new Hr("onSelect","select",null,n,s),t.push({event:n,listeners:r}),n.target=as)))}function In(t,n){var s={};return s[t.toLowerCase()]=n.toLowerCase(),s["Webkit"+t]="webkit"+n,s["Moz"+t]="moz"+n,s}var is={animationend:In("Animation","AnimationEnd"),animationiteration:In("Animation","AnimationIteration"),animationstart:In("Animation","AnimationStart"),transitionrun:In("Transition","TransitionRun"),transitionstart:In("Transition","TransitionStart"),transitioncancel:In("Transition","TransitionCancel"),transitionend:In("Transition","TransitionEnd")},Ei={},So={};Ht&&(So=document.createElement("div").style,"AnimationEvent"in window||(delete is.animationend.animation,delete is.animationiteration.animation,delete is.animationstart.animation),"TransitionEvent"in window||delete is.transitionend.transition);function _n(t){if(Ei[t])return Ei[t];if(!is[t])return t;var n=is[t],s;for(s in n)if(n.hasOwnProperty(s)&&s in So)return Ei[t]=n[s];return t}var To=_n("animationend"),wo=_n("animationiteration"),ko=_n("animationstart"),om=_n("transitionrun"),dm=_n("transitionstart"),um=_n("transitioncancel"),Co=_n("transitionend"),Ro=new Map,Ai="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Ai.push("scrollEnd");function Nt(t,n){Ro.set(t,n),Dn(n,[t])}var Yr=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var n=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(n))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},St=[],ls=0,Ni=0;function Gr(){for(var t=ls,n=Ni=ls=0;n<t;){var s=St[n];St[n++]=null;var r=St[n];St[n++]=null;var a=St[n];St[n++]=null;var i=St[n];if(St[n++]=null,r!==null&&a!==null){var l=r.pending;l===null?a.next=a:(a.next=l.next,l.next=a),r.pending=a}i!==0&&Eo(s,a,i)}}function Vr(t,n,s,r){St[ls++]=t,St[ls++]=n,St[ls++]=s,St[ls++]=r,Ni|=r,t.lanes|=r,t=t.alternate,t!==null&&(t.lanes|=r)}function Oi(t,n,s,r){return Vr(t,n,s,r),Kr(t)}function Mn(t,n){return Vr(t,null,null,n),Kr(t)}function Eo(t,n,s){t.lanes|=s;var r=t.alternate;r!==null&&(r.lanes|=s);for(var a=!1,i=t.return;i!==null;)i.childLanes|=s,r=i.alternate,r!==null&&(r.childLanes|=s),i.tag===22&&(t=i.stateNode,t===null||t._visibility&1||(a=!0)),t=i,i=i.return;return t.tag===3?(i=t.stateNode,a&&n!==null&&(a=31-ut(s),t=i.hiddenUpdates,r=t[a],r===null?t[a]=[n]:r.push(n),n.lane=s|536870912),i):null}function Kr(t){if(50<fr)throw fr=0,Ll=null,Error(d(185));for(var n=t.return;n!==null;)t=n,n=t.return;return t.tag===3?t.stateNode:null}var cs={};function hm(t,n,s,r){this.tag=t,this.key=s,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function pt(t,n,s,r){return new hm(t,n,s,r)}function Di(t){return t=t.prototype,!(!t||!t.isReactComponent)}function Qt(t,n){var s=t.alternate;return s===null?(s=pt(t.tag,n,t.key,t.mode),s.elementType=t.elementType,s.type=t.type,s.stateNode=t.stateNode,s.alternate=t,t.alternate=s):(s.pendingProps=n,s.type=t.type,s.flags=0,s.subtreeFlags=0,s.deletions=null),s.flags=t.flags&65011712,s.childLanes=t.childLanes,s.lanes=t.lanes,s.child=t.child,s.memoizedProps=t.memoizedProps,s.memoizedState=t.memoizedState,s.updateQueue=t.updateQueue,n=t.dependencies,s.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},s.sibling=t.sibling,s.index=t.index,s.ref=t.ref,s.refCleanup=t.refCleanup,s}function Ao(t,n){t.flags&=65011714;var s=t.alternate;return s===null?(t.childLanes=0,t.lanes=n,t.child=null,t.subtreeFlags=0,t.memoizedProps=null,t.memoizedState=null,t.updateQueue=null,t.dependencies=null,t.stateNode=null):(t.childLanes=s.childLanes,t.lanes=s.lanes,t.child=s.child,t.subtreeFlags=0,t.deletions=null,t.memoizedProps=s.memoizedProps,t.memoizedState=s.memoizedState,t.updateQueue=s.updateQueue,t.type=s.type,n=s.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext}),t}function Wr(t,n,s,r,a,i){var l=0;if(r=t,typeof t=="function")Di(t)&&(l=1);else if(typeof t=="string")l=gf(t,s,V.current)?26:t==="html"||t==="head"||t==="body"?27:5;else e:switch(t){case Re:return t=pt(31,s,n,a),t.elementType=Re,t.lanes=i,t;case R:return qn(s.children,a,i,n);case O:l=8,a|=24;break;case L:return t=pt(12,s,n,a|2),t.elementType=L,t.lanes=i,t;case ie:return t=pt(13,s,n,a),t.elementType=ie,t.lanes=i,t;case xe:return t=pt(19,s,n,a),t.elementType=xe,t.lanes=i,t;default:if(typeof t=="object"&&t!==null)switch(t.$$typeof){case _:l=10;break e;case H:l=9;break e;case X:l=11;break e;case J:l=14;break e;case ge:l=16,r=null;break e}l=29,s=Error(d(130,t===null?"null":typeof t,"")),r=null}return n=pt(l,s,n,a),n.elementType=t,n.type=r,n.lanes=i,n}function qn(t,n,s,r){return t=pt(7,t,r,n),t.lanes=s,t}function zi(t,n,s){return t=pt(6,t,null,n),t.lanes=s,t}function No(t){var n=pt(18,null,null,0);return n.stateNode=t,n}function Ii(t,n,s){return n=pt(4,t.children!==null?t.children:[],t.key,n),n.lanes=s,n.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},n}var Oo=new WeakMap;function Tt(t,n){if(typeof t=="object"&&t!==null){var s=Oo.get(t);return s!==void 0?s:(n={value:t,source:n,stack:Ac(n)},Oo.set(t,n),n)}return{value:t,source:n,stack:Ac(n)}}var os=[],ds=0,Zr=null,Ks=0,wt=[],kt=0,cn=null,It=1,_t="";function Ft(t,n){os[ds++]=Ks,os[ds++]=Zr,Zr=t,Ks=n}function Do(t,n,s){wt[kt++]=It,wt[kt++]=_t,wt[kt++]=cn,cn=t;var r=It;t=_t;var a=32-ut(r)-1;r&=~(1<<a),s+=1;var i=32-ut(n)+a;if(30<i){var l=a-a%5;i=(r&(1<<l)-1).toString(32),r>>=l,a-=l,It=1<<32-ut(n)+a|s<<a|r,_t=i+t}else It=1<<i|s<<a|r,_t=t}function _i(t){t.return!==null&&(Ft(t,1),Do(t,1,0))}function Mi(t){for(;t===Zr;)Zr=os[--ds],os[ds]=null,Ks=os[--ds],os[ds]=null;for(;t===cn;)cn=wt[--kt],wt[kt]=null,_t=wt[--kt],wt[kt]=null,It=wt[--kt],wt[kt]=null}function zo(t,n){wt[kt++]=It,wt[kt++]=_t,wt[kt++]=cn,It=n.id,_t=n.overflow,cn=t}var We=null,Ne=null,pe=!1,on=null,Ct=!1,qi=Error(d(519));function dn(t){var n=Error(d(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Ws(Tt(n,t)),qi}function Io(t){var n=t.stateNode,s=t.type,r=t.memoizedProps;switch(n[Ke]=t,n[nt]=r,s){case"dialog":ce("cancel",n),ce("close",n);break;case"iframe":case"object":case"embed":ce("load",n);break;case"video":case"audio":for(s=0;s<jr.length;s++)ce(jr[s],n);break;case"source":ce("error",n);break;case"img":case"image":case"link":ce("error",n),ce("load",n);break;case"details":ce("toggle",n);break;case"input":ce("invalid",n),Gc(n,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case"select":ce("invalid",n);break;case"textarea":ce("invalid",n),Kc(n,r.value,r.defaultValue,r.children)}s=r.children,typeof s!="string"&&typeof s!="number"&&typeof s!="bigint"||n.textContent===""+s||r.suppressHydrationWarning===!0||Xu(n.textContent,s)?(r.popover!=null&&(ce("beforetoggle",n),ce("toggle",n)),r.onScroll!=null&&ce("scroll",n),r.onScrollEnd!=null&&ce("scrollend",n),r.onClick!=null&&(n.onclick=Bt),n=!0):n=!1,n||dn(t,!0)}function _o(t){for(We=t.return;We;)switch(We.tag){case 5:case 31:case 13:Ct=!1;return;case 27:case 3:Ct=!0;return;default:We=We.return}}function us(t){if(t!==We)return!1;if(!pe)return _o(t),pe=!0,!1;var n=t.tag,s;if((s=n!==3&&n!==27)&&((s=n===5)&&(s=t.type,s=!(s!=="form"&&s!=="button")||tc(t.type,t.memoizedProps)),s=!s),s&&Ne&&dn(t),_o(t),n===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(d(317));Ne=ih(t)}else if(n===31){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(d(317));Ne=ih(t)}else n===27?(n=Ne,wn(t.type)?(t=ic,ic=null,Ne=t):Ne=n):Ne=We?Et(t.stateNode.nextSibling):null;return!0}function Un(){Ne=We=null,pe=!1}function Ui(){var t=on;return t!==null&&(lt===null?lt=t:lt.push.apply(lt,t),on=null),t}function Ws(t){on===null?on=[t]:on.push(t)}var Pi=j(null),Pn=null,Yt=null;function un(t,n,s){Y(Pi,n._currentValue),n._currentValue=s}function Gt(t){t._currentValue=Pi.current,q(Pi)}function Li(t,n,s){for(;t!==null;){var r=t.alternate;if((t.childLanes&n)!==n?(t.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),t===s)break;t=t.return}}function Bi(t,n,s,r){var a=t.child;for(a!==null&&(a.return=t);a!==null;){var i=a.dependencies;if(i!==null){var l=a.child;i=i.firstContext;e:for(;i!==null;){var o=i;i=a;for(var m=0;m<n.length;m++)if(o.context===n[m]){i.lanes|=s,o=i.alternate,o!==null&&(o.lanes|=s),Li(i.return,s,t),r||(l=null);break e}i=o.next}}else if(a.tag===18){if(l=a.return,l===null)throw Error(d(341));l.lanes|=s,i=l.alternate,i!==null&&(i.lanes|=s),Li(l,s,t),l=null}else l=a.child;if(l!==null)l.return=a;else for(l=a;l!==null;){if(l===t){l=null;break}if(a=l.sibling,a!==null){a.return=l.return,l=a;break}l=l.return}a=l}}function hs(t,n,s,r){t=null;for(var a=n,i=!1;a!==null;){if(!i){if((a.flags&524288)!==0)i=!0;else if((a.flags&262144)!==0)break}if(a.tag===10){var l=a.alternate;if(l===null)throw Error(d(387));if(l=l.memoizedProps,l!==null){var o=a.type;ht(a.pendingProps.value,l.value)||(t!==null?t.push(o):t=[o])}}else if(a===he.current){if(l=a.alternate,l===null)throw Error(d(387));l.memoizedState.memoizedState!==a.memoizedState.memoizedState&&(t!==null?t.push(Sr):t=[Sr])}a=a.return}t!==null&&Bi(n,t,s,r),n.flags|=262144}function Xr(t){for(t=t.firstContext;t!==null;){if(!ht(t.context._currentValue,t.memoizedValue))return!0;t=t.next}return!1}function Ln(t){Pn=t,Yt=null,t=t.dependencies,t!==null&&(t.firstContext=null)}function Ze(t){return Mo(Pn,t)}function Jr(t,n){return Pn===null&&Ln(t),Mo(t,n)}function Mo(t,n){var s=n._currentValue;if(n={context:n,memoizedValue:s,next:null},Yt===null){if(t===null)throw Error(d(308));Yt=n,t.dependencies={lanes:0,firstContext:n},t.flags|=524288}else Yt=Yt.next=n;return s}var pm=typeof AbortController<"u"?AbortController:function(){var t=[],n=this.signal={aborted:!1,addEventListener:function(s,r){t.push(r)}};this.abort=function(){n.aborted=!0,t.forEach(function(s){return s()})}},mm=c.unstable_scheduleCallback,fm=c.unstable_NormalPriority,Pe={$$typeof:_,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Hi(){return{controller:new pm,data:new Map,refCount:0}}function Zs(t){t.refCount--,t.refCount===0&&mm(fm,function(){t.controller.abort()})}var Xs=null,Qi=0,ps=0,ms=null;function xm(t,n){if(Xs===null){var s=Xs=[];Qi=0,ps=Gl(),ms={status:"pending",value:void 0,then:function(r){s.push(r)}}}return Qi++,n.then(qo,qo),n}function qo(){if(--Qi===0&&Xs!==null){ms!==null&&(ms.status="fulfilled");var t=Xs;Xs=null,ps=0,ms=null;for(var n=0;n<t.length;n++)(0,t[n])()}}function jm(t,n){var s=[],r={status:"pending",value:null,reason:null,then:function(a){s.push(a)}};return t.then(function(){r.status="fulfilled",r.value=n;for(var a=0;a<s.length;a++)(0,s[a])(n)},function(a){for(r.status="rejected",r.reason=a,a=0;a<s.length;a++)(0,s[a])(void 0)}),r}var Uo=D.S;D.S=function(t,n){vu=ot(),typeof n=="object"&&n!==null&&typeof n.then=="function"&&xm(t,n),Uo!==null&&Uo(t,n)};var Bn=j(null);function Fi(){var t=Bn.current;return t!==null?t:ke.pooledCache}function $r(t,n){n===null?Y(Bn,Bn.current):Y(Bn,n.pool)}function Po(){var t=Fi();return t===null?null:{parent:Pe._currentValue,pool:t}}var fs=Error(d(460)),Yi=Error(d(474)),ea=Error(d(542)),ta={then:function(){}};function Lo(t){return t=t.status,t==="fulfilled"||t==="rejected"}function Bo(t,n,s){switch(s=t[s],s===void 0?t.push(n):s!==n&&(n.then(Bt,Bt),n=s),n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,Qo(t),t;default:if(typeof n.status=="string")n.then(Bt,Bt);else{if(t=ke,t!==null&&100<t.shellSuspendCounter)throw Error(d(482));t=n,t.status="pending",t.then(function(r){if(n.status==="pending"){var a=n;a.status="fulfilled",a.value=r}},function(r){if(n.status==="pending"){var a=n;a.status="rejected",a.reason=r}})}switch(n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,Qo(t),t}throw Qn=n,fs}}function Hn(t){try{var n=t._init;return n(t._payload)}catch(s){throw s!==null&&typeof s=="object"&&typeof s.then=="function"?(Qn=s,fs):s}}var Qn=null;function Ho(){if(Qn===null)throw Error(d(459));var t=Qn;return Qn=null,t}function Qo(t){if(t===fs||t===ea)throw Error(d(483))}var xs=null,Js=0;function na(t){var n=Js;return Js+=1,xs===null&&(xs=[]),Bo(xs,t,n)}function $s(t,n){n=n.props.ref,t.ref=n!==void 0?n:null}function sa(t,n){throw n.$$typeof===Q?Error(d(525)):(t=Object.prototype.toString.call(n),Error(d(31,t==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":t)))}function Fo(t){function n(b,x){if(t){var w=b.deletions;w===null?(b.deletions=[x],b.flags|=16):w.push(x)}}function s(b,x){if(!t)return null;for(;x!==null;)n(b,x),x=x.sibling;return null}function r(b){for(var x=new Map;b!==null;)b.key!==null?x.set(b.key,b):x.set(b.index,b),b=b.sibling;return x}function a(b,x){return b=Qt(b,x),b.index=0,b.sibling=null,b}function i(b,x,w){return b.index=w,t?(w=b.alternate,w!==null?(w=w.index,w<x?(b.flags|=67108866,x):w):(b.flags|=67108866,x)):(b.flags|=1048576,x)}function l(b){return t&&b.alternate===null&&(b.flags|=67108866),b}function o(b,x,w,M){return x===null||x.tag!==6?(x=zi(w,b.mode,M),x.return=b,x):(x=a(x,w),x.return=b,x)}function m(b,x,w,M){var $=w.type;return $===R?z(b,x,w.props.children,M,w.key):x!==null&&(x.elementType===$||typeof $=="object"&&$!==null&&$.$$typeof===ge&&Hn($)===x.type)?(x=a(x,w.props),$s(x,w),x.return=b,x):(x=Wr(w.type,w.key,w.props,null,b.mode,M),$s(x,w),x.return=b,x)}function k(b,x,w,M){return x===null||x.tag!==4||x.stateNode.containerInfo!==w.containerInfo||x.stateNode.implementation!==w.implementation?(x=Ii(w,b.mode,M),x.return=b,x):(x=a(x,w.children||[]),x.return=b,x)}function z(b,x,w,M,$){return x===null||x.tag!==7?(x=qn(w,b.mode,M,$),x.return=b,x):(x=a(x,w),x.return=b,x)}function U(b,x,w){if(typeof x=="string"&&x!==""||typeof x=="number"||typeof x=="bigint")return x=zi(""+x,b.mode,w),x.return=b,x;if(typeof x=="object"&&x!==null){switch(x.$$typeof){case B:return w=Wr(x.type,x.key,x.props,null,b.mode,w),$s(w,x),w.return=b,w;case C:return x=Ii(x,b.mode,w),x.return=b,x;case ge:return x=Hn(x),U(b,x,w)}if(ze(x)||Ee(x))return x=qn(x,b.mode,w,null),x.return=b,x;if(typeof x.then=="function")return U(b,na(x),w);if(x.$$typeof===_)return U(b,Jr(b,x),w);sa(b,x)}return null}function E(b,x,w,M){var $=x!==null?x.key:null;if(typeof w=="string"&&w!==""||typeof w=="number"||typeof w=="bigint")return $!==null?null:o(b,x,""+w,M);if(typeof w=="object"&&w!==null){switch(w.$$typeof){case B:return w.key===$?m(b,x,w,M):null;case C:return w.key===$?k(b,x,w,M):null;case ge:return w=Hn(w),E(b,x,w,M)}if(ze(w)||Ee(w))return $!==null?null:z(b,x,w,M,null);if(typeof w.then=="function")return E(b,x,na(w),M);if(w.$$typeof===_)return E(b,x,Jr(b,w),M);sa(b,w)}return null}function N(b,x,w,M,$){if(typeof M=="string"&&M!==""||typeof M=="number"||typeof M=="bigint")return b=b.get(w)||null,o(x,b,""+M,$);if(typeof M=="object"&&M!==null){switch(M.$$typeof){case B:return b=b.get(M.key===null?w:M.key)||null,m(x,b,M,$);case C:return b=b.get(M.key===null?w:M.key)||null,k(x,b,M,$);case ge:return M=Hn(M),N(b,x,w,M,$)}if(ze(M)||Ee(M))return b=b.get(w)||null,z(x,b,M,$,null);if(typeof M.then=="function")return N(b,x,w,na(M),$);if(M.$$typeof===_)return N(b,x,w,Jr(x,M),$);sa(x,M)}return null}function K(b,x,w,M){for(var $=null,me=null,W=x,ae=x=0,ue=null;W!==null&&ae<w.length;ae++){W.index>ae?(ue=W,W=null):ue=W.sibling;var fe=E(b,W,w[ae],M);if(fe===null){W===null&&(W=ue);break}t&&W&&fe.alternate===null&&n(b,W),x=i(fe,x,ae),me===null?$=fe:me.sibling=fe,me=fe,W=ue}if(ae===w.length)return s(b,W),pe&&Ft(b,ae),$;if(W===null){for(;ae<w.length;ae++)W=U(b,w[ae],M),W!==null&&(x=i(W,x,ae),me===null?$=W:me.sibling=W,me=W);return pe&&Ft(b,ae),$}for(W=r(W);ae<w.length;ae++)ue=N(W,b,ae,w[ae],M),ue!==null&&(t&&ue.alternate!==null&&W.delete(ue.key===null?ae:ue.key),x=i(ue,x,ae),me===null?$=ue:me.sibling=ue,me=ue);return t&&W.forEach(function(An){return n(b,An)}),pe&&Ft(b,ae),$}function ee(b,x,w,M){if(w==null)throw Error(d(151));for(var $=null,me=null,W=x,ae=x=0,ue=null,fe=w.next();W!==null&&!fe.done;ae++,fe=w.next()){W.index>ae?(ue=W,W=null):ue=W.sibling;var An=E(b,W,fe.value,M);if(An===null){W===null&&(W=ue);break}t&&W&&An.alternate===null&&n(b,W),x=i(An,x,ae),me===null?$=An:me.sibling=An,me=An,W=ue}if(fe.done)return s(b,W),pe&&Ft(b,ae),$;if(W===null){for(;!fe.done;ae++,fe=w.next())fe=U(b,fe.value,M),fe!==null&&(x=i(fe,x,ae),me===null?$=fe:me.sibling=fe,me=fe);return pe&&Ft(b,ae),$}for(W=r(W);!fe.done;ae++,fe=w.next())fe=N(W,b,ae,fe.value,M),fe!==null&&(t&&fe.alternate!==null&&W.delete(fe.key===null?ae:fe.key),x=i(fe,x,ae),me===null?$=fe:me.sibling=fe,me=fe);return t&&W.forEach(function(Af){return n(b,Af)}),pe&&Ft(b,ae),$}function we(b,x,w,M){if(typeof w=="object"&&w!==null&&w.type===R&&w.key===null&&(w=w.props.children),typeof w=="object"&&w!==null){switch(w.$$typeof){case B:e:{for(var $=w.key;x!==null;){if(x.key===$){if($=w.type,$===R){if(x.tag===7){s(b,x.sibling),M=a(x,w.props.children),M.return=b,b=M;break e}}else if(x.elementType===$||typeof $=="object"&&$!==null&&$.$$typeof===ge&&Hn($)===x.type){s(b,x.sibling),M=a(x,w.props),$s(M,w),M.return=b,b=M;break e}s(b,x);break}else n(b,x);x=x.sibling}w.type===R?(M=qn(w.props.children,b.mode,M,w.key),M.return=b,b=M):(M=Wr(w.type,w.key,w.props,null,b.mode,M),$s(M,w),M.return=b,b=M)}return l(b);case C:e:{for($=w.key;x!==null;){if(x.key===$)if(x.tag===4&&x.stateNode.containerInfo===w.containerInfo&&x.stateNode.implementation===w.implementation){s(b,x.sibling),M=a(x,w.children||[]),M.return=b,b=M;break e}else{s(b,x);break}else n(b,x);x=x.sibling}M=Ii(w,b.mode,M),M.return=b,b=M}return l(b);case ge:return w=Hn(w),we(b,x,w,M)}if(ze(w))return K(b,x,w,M);if(Ee(w)){if($=Ee(w),typeof $!="function")throw Error(d(150));return w=$.call(w),ee(b,x,w,M)}if(typeof w.then=="function")return we(b,x,na(w),M);if(w.$$typeof===_)return we(b,x,Jr(b,w),M);sa(b,w)}return typeof w=="string"&&w!==""||typeof w=="number"||typeof w=="bigint"?(w=""+w,x!==null&&x.tag===6?(s(b,x.sibling),M=a(x,w),M.return=b,b=M):(s(b,x),M=zi(w,b.mode,M),M.return=b,b=M),l(b)):s(b,x)}return function(b,x,w,M){try{Js=0;var $=we(b,x,w,M);return xs=null,$}catch(W){if(W===fs||W===ea)throw W;var me=pt(29,W,null,b.mode);return me.lanes=M,me.return=b,me}}}var Fn=Fo(!0),Yo=Fo(!1),hn=!1;function Gi(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Vi(t,n){t=t.updateQueue,n.updateQueue===t&&(n.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,callbacks:null})}function pn(t){return{lane:t,tag:0,payload:null,callback:null,next:null}}function mn(t,n,s){var r=t.updateQueue;if(r===null)return null;if(r=r.shared,(je&2)!==0){var a=r.pending;return a===null?n.next=n:(n.next=a.next,a.next=n),r.pending=n,n=Kr(t),Eo(t,null,s),n}return Vr(t,r,n,s),Kr(t)}function er(t,n,s){if(n=n.updateQueue,n!==null&&(n=n.shared,(s&4194048)!==0)){var r=n.lanes;r&=t.pendingLanes,s|=r,n.lanes=s,_c(t,s)}}function Ki(t,n){var s=t.updateQueue,r=t.alternate;if(r!==null&&(r=r.updateQueue,s===r)){var a=null,i=null;if(s=s.firstBaseUpdate,s!==null){do{var l={lane:s.lane,tag:s.tag,payload:s.payload,callback:null,next:null};i===null?a=i=l:i=i.next=l,s=s.next}while(s!==null);i===null?a=i=n:i=i.next=n}else a=i=n;s={baseState:r.baseState,firstBaseUpdate:a,lastBaseUpdate:i,shared:r.shared,callbacks:r.callbacks},t.updateQueue=s;return}t=s.lastBaseUpdate,t===null?s.firstBaseUpdate=n:t.next=n,s.lastBaseUpdate=n}var Wi=!1;function tr(){if(Wi){var t=ms;if(t!==null)throw t}}function nr(t,n,s,r){Wi=!1;var a=t.updateQueue;hn=!1;var i=a.firstBaseUpdate,l=a.lastBaseUpdate,o=a.shared.pending;if(o!==null){a.shared.pending=null;var m=o,k=m.next;m.next=null,l===null?i=k:l.next=k,l=m;var z=t.alternate;z!==null&&(z=z.updateQueue,o=z.lastBaseUpdate,o!==l&&(o===null?z.firstBaseUpdate=k:o.next=k,z.lastBaseUpdate=m))}if(i!==null){var U=a.baseState;l=0,z=k=m=null,o=i;do{var E=o.lane&-536870913,N=E!==o.lane;if(N?(de&E)===E:(r&E)===E){E!==0&&E===ps&&(Wi=!0),z!==null&&(z=z.next={lane:0,tag:o.tag,payload:o.payload,callback:null,next:null});e:{var K=t,ee=o;E=n;var we=s;switch(ee.tag){case 1:if(K=ee.payload,typeof K=="function"){U=K.call(we,U,E);break e}U=K;break e;case 3:K.flags=K.flags&-65537|128;case 0:if(K=ee.payload,E=typeof K=="function"?K.call(we,U,E):K,E==null)break e;U=T({},U,E);break e;case 2:hn=!0}}E=o.callback,E!==null&&(t.flags|=64,N&&(t.flags|=8192),N=a.callbacks,N===null?a.callbacks=[E]:N.push(E))}else N={lane:E,tag:o.tag,payload:o.payload,callback:o.callback,next:null},z===null?(k=z=N,m=U):z=z.next=N,l|=E;if(o=o.next,o===null){if(o=a.shared.pending,o===null)break;N=o,o=N.next,N.next=null,a.lastBaseUpdate=N,a.shared.pending=null}}while(!0);z===null&&(m=U),a.baseState=m,a.firstBaseUpdate=k,a.lastBaseUpdate=z,i===null&&(a.shared.lanes=0),yn|=l,t.lanes=l,t.memoizedState=U}}function Go(t,n){if(typeof t!="function")throw Error(d(191,t));t.call(n)}function Vo(t,n){var s=t.callbacks;if(s!==null)for(t.callbacks=null,t=0;t<s.length;t++)Go(s[t],n)}var js=j(null),ra=j(0);function Ko(t,n){t=tn,Y(ra,t),Y(js,n),tn=t|n.baseLanes}function Zi(){Y(ra,tn),Y(js,js.current)}function Xi(){tn=ra.current,q(js),q(ra)}var mt=j(null),Rt=null;function fn(t){var n=t.alternate;Y(Me,Me.current&1),Y(mt,t),Rt===null&&(n===null||js.current!==null||n.memoizedState!==null)&&(Rt=t)}function Ji(t){Y(Me,Me.current),Y(mt,t),Rt===null&&(Rt=t)}function Wo(t){t.tag===22?(Y(Me,Me.current),Y(mt,t),Rt===null&&(Rt=t)):xn()}function xn(){Y(Me,Me.current),Y(mt,mt.current)}function ft(t){q(mt),Rt===t&&(Rt=null),q(Me)}var Me=j(0);function aa(t){for(var n=t;n!==null;){if(n.tag===13){var s=n.memoizedState;if(s!==null&&(s=s.dehydrated,s===null||rc(s)||ac(s)))return n}else if(n.tag===19&&(n.memoizedProps.revealOrder==="forwards"||n.memoizedProps.revealOrder==="backwards"||n.memoizedProps.revealOrder==="unstable_legacy-backwards"||n.memoizedProps.revealOrder==="together")){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var Vt=0,se=null,Se=null,Le=null,ia=!1,gs=!1,Yn=!1,la=0,sr=0,ys=null,gm=0;function Ie(){throw Error(d(321))}function $i(t,n){if(n===null)return!1;for(var s=0;s<n.length&&s<t.length;s++)if(!ht(t[s],n[s]))return!1;return!0}function el(t,n,s,r,a,i){return Vt=i,se=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,D.H=t===null||t.memoizedState===null?Dd:fl,Yn=!1,i=s(r,a),Yn=!1,gs&&(i=Xo(n,s,r,a)),Zo(t),i}function Zo(t){D.H=ir;var n=Se!==null&&Se.next!==null;if(Vt=0,Le=Se=se=null,ia=!1,sr=0,ys=null,n)throw Error(d(300));t===null||Be||(t=t.dependencies,t!==null&&Xr(t)&&(Be=!0))}function Xo(t,n,s,r){se=t;var a=0;do{if(gs&&(ys=null),sr=0,gs=!1,25<=a)throw Error(d(301));if(a+=1,Le=Se=null,t.updateQueue!=null){var i=t.updateQueue;i.lastEffect=null,i.events=null,i.stores=null,i.memoCache!=null&&(i.memoCache.index=0)}D.H=zd,i=n(s,r)}while(gs);return i}function ym(){var t=D.H,n=t.useState()[0];return n=typeof n.then=="function"?rr(n):n,t=t.useState()[0],(Se!==null?Se.memoizedState:null)!==t&&(se.flags|=1024),n}function tl(){var t=la!==0;return la=0,t}function nl(t,n,s){n.updateQueue=t.updateQueue,n.flags&=-2053,t.lanes&=~s}function sl(t){if(ia){for(t=t.memoizedState;t!==null;){var n=t.queue;n!==null&&(n.pending=null),t=t.next}ia=!1}Vt=0,Le=Se=se=null,gs=!1,sr=la=0,ys=null}function tt(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Le===null?se.memoizedState=Le=t:Le=Le.next=t,Le}function qe(){if(Se===null){var t=se.alternate;t=t!==null?t.memoizedState:null}else t=Se.next;var n=Le===null?se.memoizedState:Le.next;if(n!==null)Le=n,Se=t;else{if(t===null)throw se.alternate===null?Error(d(467)):Error(d(310));Se=t,t={memoizedState:Se.memoizedState,baseState:Se.baseState,baseQueue:Se.baseQueue,queue:Se.queue,next:null},Le===null?se.memoizedState=Le=t:Le=Le.next=t}return Le}function ca(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function rr(t){var n=sr;return sr+=1,ys===null&&(ys=[]),t=Bo(ys,t,n),n=se,(Le===null?n.memoizedState:Le.next)===null&&(n=n.alternate,D.H=n===null||n.memoizedState===null?Dd:fl),t}function oa(t){if(t!==null&&typeof t=="object"){if(typeof t.then=="function")return rr(t);if(t.$$typeof===_)return Ze(t)}throw Error(d(438,String(t)))}function rl(t){var n=null,s=se.updateQueue;if(s!==null&&(n=s.memoCache),n==null){var r=se.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(n={data:r.data.map(function(a){return a.slice()}),index:0})))}if(n==null&&(n={data:[],index:0}),s===null&&(s=ca(),se.updateQueue=s),s.memoCache=n,s=n.data[n.index],s===void 0)for(s=n.data[n.index]=Array(t),r=0;r<t;r++)s[r]=et;return n.index++,s}function Kt(t,n){return typeof n=="function"?n(t):n}function da(t){var n=qe();return al(n,Se,t)}function al(t,n,s){var r=t.queue;if(r===null)throw Error(d(311));r.lastRenderedReducer=s;var a=t.baseQueue,i=r.pending;if(i!==null){if(a!==null){var l=a.next;a.next=i.next,i.next=l}n.baseQueue=a=i,r.pending=null}if(i=t.baseState,a===null)t.memoizedState=i;else{n=a.next;var o=l=null,m=null,k=n,z=!1;do{var U=k.lane&-536870913;if(U!==k.lane?(de&U)===U:(Vt&U)===U){var E=k.revertLane;if(E===0)m!==null&&(m=m.next={lane:0,revertLane:0,gesture:null,action:k.action,hasEagerState:k.hasEagerState,eagerState:k.eagerState,next:null}),U===ps&&(z=!0);else if((Vt&E)===E){k=k.next,E===ps&&(z=!0);continue}else U={lane:0,revertLane:k.revertLane,gesture:null,action:k.action,hasEagerState:k.hasEagerState,eagerState:k.eagerState,next:null},m===null?(o=m=U,l=i):m=m.next=U,se.lanes|=E,yn|=E;U=k.action,Yn&&s(i,U),i=k.hasEagerState?k.eagerState:s(i,U)}else E={lane:U,revertLane:k.revertLane,gesture:k.gesture,action:k.action,hasEagerState:k.hasEagerState,eagerState:k.eagerState,next:null},m===null?(o=m=E,l=i):m=m.next=E,se.lanes|=U,yn|=U;k=k.next}while(k!==null&&k!==n);if(m===null?l=i:m.next=o,!ht(i,t.memoizedState)&&(Be=!0,z&&(s=ms,s!==null)))throw s;t.memoizedState=i,t.baseState=l,t.baseQueue=m,r.lastRenderedState=i}return a===null&&(r.lanes=0),[t.memoizedState,r.dispatch]}function il(t){var n=qe(),s=n.queue;if(s===null)throw Error(d(311));s.lastRenderedReducer=t;var r=s.dispatch,a=s.pending,i=n.memoizedState;if(a!==null){s.pending=null;var l=a=a.next;do i=t(i,l.action),l=l.next;while(l!==a);ht(i,n.memoizedState)||(Be=!0),n.memoizedState=i,n.baseQueue===null&&(n.baseState=i),s.lastRenderedState=i}return[i,r]}function Jo(t,n,s){var r=se,a=qe(),i=pe;if(i){if(s===void 0)throw Error(d(407));s=s()}else s=n();var l=!ht((Se||a).memoizedState,s);if(l&&(a.memoizedState=s,Be=!0),a=a.queue,ol(td.bind(null,r,a,t),[t]),a.getSnapshot!==n||l||Le!==null&&Le.memoizedState.tag&1){if(r.flags|=2048,bs(9,{destroy:void 0},ed.bind(null,r,a,s,n),null),ke===null)throw Error(d(349));i||(Vt&127)!==0||$o(r,n,s)}return s}function $o(t,n,s){t.flags|=16384,t={getSnapshot:n,value:s},n=se.updateQueue,n===null?(n=ca(),se.updateQueue=n,n.stores=[t]):(s=n.stores,s===null?n.stores=[t]:s.push(t))}function ed(t,n,s,r){n.value=s,n.getSnapshot=r,nd(n)&&sd(t)}function td(t,n,s){return s(function(){nd(n)&&sd(t)})}function nd(t){var n=t.getSnapshot;t=t.value;try{var s=n();return!ht(t,s)}catch{return!0}}function sd(t){var n=Mn(t,2);n!==null&&ct(n,t,2)}function ll(t){var n=tt();if(typeof t=="function"){var s=t;if(t=s(),Yn){rn(!0);try{s()}finally{rn(!1)}}}return n.memoizedState=n.baseState=t,n.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Kt,lastRenderedState:t},n}function rd(t,n,s,r){return t.baseState=s,al(t,Se,typeof r=="function"?r:Kt)}function bm(t,n,s,r,a){if(pa(t))throw Error(d(485));if(t=n.action,t!==null){var i={payload:a,action:t,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(l){i.listeners.push(l)}};D.T!==null?s(!0):i.isTransition=!1,r(i),s=n.pending,s===null?(i.next=n.pending=i,ad(n,i)):(i.next=s.next,n.pending=s.next=i)}}function ad(t,n){var s=n.action,r=n.payload,a=t.state;if(n.isTransition){var i=D.T,l={};D.T=l;try{var o=s(a,r),m=D.S;m!==null&&m(l,o),id(t,n,o)}catch(k){cl(t,n,k)}finally{i!==null&&l.types!==null&&(i.types=l.types),D.T=i}}else try{i=s(a,r),id(t,n,i)}catch(k){cl(t,n,k)}}function id(t,n,s){s!==null&&typeof s=="object"&&typeof s.then=="function"?s.then(function(r){ld(t,n,r)},function(r){return cl(t,n,r)}):ld(t,n,s)}function ld(t,n,s){n.status="fulfilled",n.value=s,cd(n),t.state=s,n=t.pending,n!==null&&(s=n.next,s===n?t.pending=null:(s=s.next,n.next=s,ad(t,s)))}function cl(t,n,s){var r=t.pending;if(t.pending=null,r!==null){r=r.next;do n.status="rejected",n.reason=s,cd(n),n=n.next;while(n!==r)}t.action=null}function cd(t){t=t.listeners;for(var n=0;n<t.length;n++)(0,t[n])()}function od(t,n){return n}function dd(t,n){if(pe){var s=ke.formState;if(s!==null){e:{var r=se;if(pe){if(Ne){t:{for(var a=Ne,i=Ct;a.nodeType!==8;){if(!i){a=null;break t}if(a=Et(a.nextSibling),a===null){a=null;break t}}i=a.data,a=i==="F!"||i==="F"?a:null}if(a){Ne=Et(a.nextSibling),r=a.data==="F!";break e}}dn(r)}r=!1}r&&(n=s[0])}}return s=tt(),s.memoizedState=s.baseState=n,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:od,lastRenderedState:n},s.queue=r,s=Ad.bind(null,se,r),r.dispatch=s,r=ll(!1),i=ml.bind(null,se,!1,r.queue),r=tt(),a={state:n,dispatch:null,action:t,pending:null},r.queue=a,s=bm.bind(null,se,a,i,s),a.dispatch=s,r.memoizedState=t,[n,s,!1]}function ud(t){var n=qe();return hd(n,Se,t)}function hd(t,n,s){if(n=al(t,n,od)[0],t=da(Kt)[0],typeof n=="object"&&n!==null&&typeof n.then=="function")try{var r=rr(n)}catch(l){throw l===fs?ea:l}else r=n;n=qe();var a=n.queue,i=a.dispatch;return s!==n.memoizedState&&(se.flags|=2048,bs(9,{destroy:void 0},vm.bind(null,a,s),null)),[r,i,t]}function vm(t,n){t.action=n}function pd(t){var n=qe(),s=Se;if(s!==null)return hd(n,s,t);qe(),n=n.memoizedState,s=qe();var r=s.queue.dispatch;return s.memoizedState=t,[n,r,!1]}function bs(t,n,s,r){return t={tag:t,create:s,deps:r,inst:n,next:null},n=se.updateQueue,n===null&&(n=ca(),se.updateQueue=n),s=n.lastEffect,s===null?n.lastEffect=t.next=t:(r=s.next,s.next=t,t.next=r,n.lastEffect=t),t}function md(){return qe().memoizedState}function ua(t,n,s,r){var a=tt();se.flags|=t,a.memoizedState=bs(1|n,{destroy:void 0},s,r===void 0?null:r)}function ha(t,n,s,r){var a=qe();r=r===void 0?null:r;var i=a.memoizedState.inst;Se!==null&&r!==null&&$i(r,Se.memoizedState.deps)?a.memoizedState=bs(n,i,s,r):(se.flags|=t,a.memoizedState=bs(1|n,i,s,r))}function fd(t,n){ua(8390656,8,t,n)}function ol(t,n){ha(2048,8,t,n)}function Sm(t){se.flags|=4;var n=se.updateQueue;if(n===null)n=ca(),se.updateQueue=n,n.events=[t];else{var s=n.events;s===null?n.events=[t]:s.push(t)}}function xd(t){var n=qe().memoizedState;return Sm({ref:n,nextImpl:t}),function(){if((je&2)!==0)throw Error(d(440));return n.impl.apply(void 0,arguments)}}function jd(t,n){return ha(4,2,t,n)}function gd(t,n){return ha(4,4,t,n)}function yd(t,n){if(typeof n=="function"){t=t();var s=n(t);return function(){typeof s=="function"?s():n(null)}}if(n!=null)return t=t(),n.current=t,function(){n.current=null}}function bd(t,n,s){s=s!=null?s.concat([t]):null,ha(4,4,yd.bind(null,n,t),s)}function dl(){}function vd(t,n){var s=qe();n=n===void 0?null:n;var r=s.memoizedState;return n!==null&&$i(n,r[1])?r[0]:(s.memoizedState=[t,n],t)}function Sd(t,n){var s=qe();n=n===void 0?null:n;var r=s.memoizedState;if(n!==null&&$i(n,r[1]))return r[0];if(r=t(),Yn){rn(!0);try{t()}finally{rn(!1)}}return s.memoizedState=[r,n],r}function ul(t,n,s){return s===void 0||(Vt&1073741824)!==0&&(de&261930)===0?t.memoizedState=n:(t.memoizedState=s,t=Tu(),se.lanes|=t,yn|=t,s)}function Td(t,n,s,r){return ht(s,n)?s:js.current!==null?(t=ul(t,s,r),ht(t,n)||(Be=!0),t):(Vt&42)===0||(Vt&1073741824)!==0&&(de&261930)===0?(Be=!0,t.memoizedState=s):(t=Tu(),se.lanes|=t,yn|=t,n)}function wd(t,n,s,r,a){var i=F.p;F.p=i!==0&&8>i?i:8;var l=D.T,o={};D.T=o,ml(t,!1,n,s);try{var m=a(),k=D.S;if(k!==null&&k(o,m),m!==null&&typeof m=="object"&&typeof m.then=="function"){var z=jm(m,r);ar(t,n,z,gt(t))}else ar(t,n,r,gt(t))}catch(U){ar(t,n,{then:function(){},status:"rejected",reason:U},gt())}finally{F.p=i,l!==null&&o.types!==null&&(l.types=o.types),D.T=l}}function Tm(){}function hl(t,n,s,r){if(t.tag!==5)throw Error(d(476));var a=kd(t).queue;wd(t,a,n,Z,s===null?Tm:function(){return Cd(t),s(r)})}function kd(t){var n=t.memoizedState;if(n!==null)return n;n={memoizedState:Z,baseState:Z,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Kt,lastRenderedState:Z},next:null};var s={};return n.next={memoizedState:s,baseState:s,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Kt,lastRenderedState:s},next:null},t.memoizedState=n,t=t.alternate,t!==null&&(t.memoizedState=n),n}function Cd(t){var n=kd(t);n.next===null&&(n=t.alternate.memoizedState),ar(t,n.next.queue,{},gt())}function pl(){return Ze(Sr)}function Rd(){return qe().memoizedState}function Ed(){return qe().memoizedState}function wm(t){for(var n=t.return;n!==null;){switch(n.tag){case 24:case 3:var s=gt();t=pn(s);var r=mn(n,t,s);r!==null&&(ct(r,n,s),er(r,n,s)),n={cache:Hi()},t.payload=n;return}n=n.return}}function km(t,n,s){var r=gt();s={lane:r,revertLane:0,gesture:null,action:s,hasEagerState:!1,eagerState:null,next:null},pa(t)?Nd(n,s):(s=Oi(t,n,s,r),s!==null&&(ct(s,t,r),Od(s,n,r)))}function Ad(t,n,s){var r=gt();ar(t,n,s,r)}function ar(t,n,s,r){var a={lane:r,revertLane:0,gesture:null,action:s,hasEagerState:!1,eagerState:null,next:null};if(pa(t))Nd(n,a);else{var i=t.alternate;if(t.lanes===0&&(i===null||i.lanes===0)&&(i=n.lastRenderedReducer,i!==null))try{var l=n.lastRenderedState,o=i(l,s);if(a.hasEagerState=!0,a.eagerState=o,ht(o,l))return Vr(t,n,a,0),ke===null&&Gr(),!1}catch{}if(s=Oi(t,n,a,r),s!==null)return ct(s,t,r),Od(s,n,r),!0}return!1}function ml(t,n,s,r){if(r={lane:2,revertLane:Gl(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},pa(t)){if(n)throw Error(d(479))}else n=Oi(t,s,r,2),n!==null&&ct(n,t,2)}function pa(t){var n=t.alternate;return t===se||n!==null&&n===se}function Nd(t,n){gs=ia=!0;var s=t.pending;s===null?n.next=n:(n.next=s.next,s.next=n),t.pending=n}function Od(t,n,s){if((s&4194048)!==0){var r=n.lanes;r&=t.pendingLanes,s|=r,n.lanes=s,_c(t,s)}}var ir={readContext:Ze,use:oa,useCallback:Ie,useContext:Ie,useEffect:Ie,useImperativeHandle:Ie,useLayoutEffect:Ie,useInsertionEffect:Ie,useMemo:Ie,useReducer:Ie,useRef:Ie,useState:Ie,useDebugValue:Ie,useDeferredValue:Ie,useTransition:Ie,useSyncExternalStore:Ie,useId:Ie,useHostTransitionStatus:Ie,useFormState:Ie,useActionState:Ie,useOptimistic:Ie,useMemoCache:Ie,useCacheRefresh:Ie};ir.useEffectEvent=Ie;var Dd={readContext:Ze,use:oa,useCallback:function(t,n){return tt().memoizedState=[t,n===void 0?null:n],t},useContext:Ze,useEffect:fd,useImperativeHandle:function(t,n,s){s=s!=null?s.concat([t]):null,ua(4194308,4,yd.bind(null,n,t),s)},useLayoutEffect:function(t,n){return ua(4194308,4,t,n)},useInsertionEffect:function(t,n){ua(4,2,t,n)},useMemo:function(t,n){var s=tt();n=n===void 0?null:n;var r=t();if(Yn){rn(!0);try{t()}finally{rn(!1)}}return s.memoizedState=[r,n],r},useReducer:function(t,n,s){var r=tt();if(s!==void 0){var a=s(n);if(Yn){rn(!0);try{s(n)}finally{rn(!1)}}}else a=n;return r.memoizedState=r.baseState=a,t={pending:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:a},r.queue=t,t=t.dispatch=km.bind(null,se,t),[r.memoizedState,t]},useRef:function(t){var n=tt();return t={current:t},n.memoizedState=t},useState:function(t){t=ll(t);var n=t.queue,s=Ad.bind(null,se,n);return n.dispatch=s,[t.memoizedState,s]},useDebugValue:dl,useDeferredValue:function(t,n){var s=tt();return ul(s,t,n)},useTransition:function(){var t=ll(!1);return t=wd.bind(null,se,t.queue,!0,!1),tt().memoizedState=t,[!1,t]},useSyncExternalStore:function(t,n,s){var r=se,a=tt();if(pe){if(s===void 0)throw Error(d(407));s=s()}else{if(s=n(),ke===null)throw Error(d(349));(de&127)!==0||$o(r,n,s)}a.memoizedState=s;var i={value:s,getSnapshot:n};return a.queue=i,fd(td.bind(null,r,i,t),[t]),r.flags|=2048,bs(9,{destroy:void 0},ed.bind(null,r,i,s,n),null),s},useId:function(){var t=tt(),n=ke.identifierPrefix;if(pe){var s=_t,r=It;s=(r&~(1<<32-ut(r)-1)).toString(32)+s,n="_"+n+"R_"+s,s=la++,0<s&&(n+="H"+s.toString(32)),n+="_"}else s=gm++,n="_"+n+"r_"+s.toString(32)+"_";return t.memoizedState=n},useHostTransitionStatus:pl,useFormState:dd,useActionState:dd,useOptimistic:function(t){var n=tt();n.memoizedState=n.baseState=t;var s={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return n.queue=s,n=ml.bind(null,se,!0,s),s.dispatch=n,[t,n]},useMemoCache:rl,useCacheRefresh:function(){return tt().memoizedState=wm.bind(null,se)},useEffectEvent:function(t){var n=tt(),s={impl:t};return n.memoizedState=s,function(){if((je&2)!==0)throw Error(d(440));return s.impl.apply(void 0,arguments)}}},fl={readContext:Ze,use:oa,useCallback:vd,useContext:Ze,useEffect:ol,useImperativeHandle:bd,useInsertionEffect:jd,useLayoutEffect:gd,useMemo:Sd,useReducer:da,useRef:md,useState:function(){return da(Kt)},useDebugValue:dl,useDeferredValue:function(t,n){var s=qe();return Td(s,Se.memoizedState,t,n)},useTransition:function(){var t=da(Kt)[0],n=qe().memoizedState;return[typeof t=="boolean"?t:rr(t),n]},useSyncExternalStore:Jo,useId:Rd,useHostTransitionStatus:pl,useFormState:ud,useActionState:ud,useOptimistic:function(t,n){var s=qe();return rd(s,Se,t,n)},useMemoCache:rl,useCacheRefresh:Ed};fl.useEffectEvent=xd;var zd={readContext:Ze,use:oa,useCallback:vd,useContext:Ze,useEffect:ol,useImperativeHandle:bd,useInsertionEffect:jd,useLayoutEffect:gd,useMemo:Sd,useReducer:il,useRef:md,useState:function(){return il(Kt)},useDebugValue:dl,useDeferredValue:function(t,n){var s=qe();return Se===null?ul(s,t,n):Td(s,Se.memoizedState,t,n)},useTransition:function(){var t=il(Kt)[0],n=qe().memoizedState;return[typeof t=="boolean"?t:rr(t),n]},useSyncExternalStore:Jo,useId:Rd,useHostTransitionStatus:pl,useFormState:pd,useActionState:pd,useOptimistic:function(t,n){var s=qe();return Se!==null?rd(s,Se,t,n):(s.baseState=t,[t,s.queue.dispatch])},useMemoCache:rl,useCacheRefresh:Ed};zd.useEffectEvent=xd;function xl(t,n,s,r){n=t.memoizedState,s=s(r,n),s=s==null?n:T({},n,s),t.memoizedState=s,t.lanes===0&&(t.updateQueue.baseState=s)}var jl={enqueueSetState:function(t,n,s){t=t._reactInternals;var r=gt(),a=pn(r);a.payload=n,s!=null&&(a.callback=s),n=mn(t,a,r),n!==null&&(ct(n,t,r),er(n,t,r))},enqueueReplaceState:function(t,n,s){t=t._reactInternals;var r=gt(),a=pn(r);a.tag=1,a.payload=n,s!=null&&(a.callback=s),n=mn(t,a,r),n!==null&&(ct(n,t,r),er(n,t,r))},enqueueForceUpdate:function(t,n){t=t._reactInternals;var s=gt(),r=pn(s);r.tag=2,n!=null&&(r.callback=n),n=mn(t,r,s),n!==null&&(ct(n,t,s),er(n,t,s))}};function Id(t,n,s,r,a,i,l){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(r,i,l):n.prototype&&n.prototype.isPureReactComponent?!Gs(s,r)||!Gs(a,i):!0}function _d(t,n,s,r){t=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(s,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(s,r),n.state!==t&&jl.enqueueReplaceState(n,n.state,null)}function Gn(t,n){var s=n;if("ref"in n){s={};for(var r in n)r!=="ref"&&(s[r]=n[r])}if(t=t.defaultProps){s===n&&(s=T({},s));for(var a in t)s[a]===void 0&&(s[a]=t[a])}return s}function Md(t){Yr(t)}function qd(t){console.error(t)}function Ud(t){Yr(t)}function ma(t,n){try{var s=t.onUncaughtError;s(n.value,{componentStack:n.stack})}catch(r){setTimeout(function(){throw r})}}function Pd(t,n,s){try{var r=t.onCaughtError;r(s.value,{componentStack:s.stack,errorBoundary:n.tag===1?n.stateNode:null})}catch(a){setTimeout(function(){throw a})}}function gl(t,n,s){return s=pn(s),s.tag=3,s.payload={element:null},s.callback=function(){ma(t,n)},s}function Ld(t){return t=pn(t),t.tag=3,t}function Bd(t,n,s,r){var a=s.type.getDerivedStateFromError;if(typeof a=="function"){var i=r.value;t.payload=function(){return a(i)},t.callback=function(){Pd(n,s,r)}}var l=s.stateNode;l!==null&&typeof l.componentDidCatch=="function"&&(t.callback=function(){Pd(n,s,r),typeof a!="function"&&(bn===null?bn=new Set([this]):bn.add(this));var o=r.stack;this.componentDidCatch(r.value,{componentStack:o!==null?o:""})})}function Cm(t,n,s,r,a){if(s.flags|=32768,r!==null&&typeof r=="object"&&typeof r.then=="function"){if(n=s.alternate,n!==null&&hs(n,s,a,!0),s=mt.current,s!==null){switch(s.tag){case 31:case 13:return Rt===null?Ca():s.alternate===null&&_e===0&&(_e=3),s.flags&=-257,s.flags|=65536,s.lanes=a,r===ta?s.flags|=16384:(n=s.updateQueue,n===null?s.updateQueue=new Set([r]):n.add(r),Ql(t,r,a)),!1;case 22:return s.flags|=65536,r===ta?s.flags|=16384:(n=s.updateQueue,n===null?(n={transitions:null,markerInstances:null,retryQueue:new Set([r])},s.updateQueue=n):(s=n.retryQueue,s===null?n.retryQueue=new Set([r]):s.add(r)),Ql(t,r,a)),!1}throw Error(d(435,s.tag))}return Ql(t,r,a),Ca(),!1}if(pe)return n=mt.current,n!==null?((n.flags&65536)===0&&(n.flags|=256),n.flags|=65536,n.lanes=a,r!==qi&&(t=Error(d(422),{cause:r}),Ws(Tt(t,s)))):(r!==qi&&(n=Error(d(423),{cause:r}),Ws(Tt(n,s))),t=t.current.alternate,t.flags|=65536,a&=-a,t.lanes|=a,r=Tt(r,s),a=gl(t.stateNode,r,a),Ki(t,a),_e!==4&&(_e=2)),!1;var i=Error(d(520),{cause:r});if(i=Tt(i,s),mr===null?mr=[i]:mr.push(i),_e!==4&&(_e=2),n===null)return!0;r=Tt(r,s),s=n;do{switch(s.tag){case 3:return s.flags|=65536,t=a&-a,s.lanes|=t,t=gl(s.stateNode,r,t),Ki(s,t),!1;case 1:if(n=s.type,i=s.stateNode,(s.flags&128)===0&&(typeof n.getDerivedStateFromError=="function"||i!==null&&typeof i.componentDidCatch=="function"&&(bn===null||!bn.has(i))))return s.flags|=65536,a&=-a,s.lanes|=a,a=Ld(a),Bd(a,t,s,r),Ki(s,a),!1}s=s.return}while(s!==null);return!1}var yl=Error(d(461)),Be=!1;function Xe(t,n,s,r){n.child=t===null?Yo(n,null,s,r):Fn(n,t.child,s,r)}function Hd(t,n,s,r,a){s=s.render;var i=n.ref;if("ref"in r){var l={};for(var o in r)o!=="ref"&&(l[o]=r[o])}else l=r;return Ln(n),r=el(t,n,s,l,i,a),o=tl(),t!==null&&!Be?(nl(t,n,a),Wt(t,n,a)):(pe&&o&&_i(n),n.flags|=1,Xe(t,n,r,a),n.child)}function Qd(t,n,s,r,a){if(t===null){var i=s.type;return typeof i=="function"&&!Di(i)&&i.defaultProps===void 0&&s.compare===null?(n.tag=15,n.type=i,Fd(t,n,i,r,a)):(t=Wr(s.type,null,r,n,n.mode,a),t.ref=n.ref,t.return=n,n.child=t)}if(i=t.child,!Rl(t,a)){var l=i.memoizedProps;if(s=s.compare,s=s!==null?s:Gs,s(l,r)&&t.ref===n.ref)return Wt(t,n,a)}return n.flags|=1,t=Qt(i,r),t.ref=n.ref,t.return=n,n.child=t}function Fd(t,n,s,r,a){if(t!==null){var i=t.memoizedProps;if(Gs(i,r)&&t.ref===n.ref)if(Be=!1,n.pendingProps=r=i,Rl(t,a))(t.flags&131072)!==0&&(Be=!0);else return n.lanes=t.lanes,Wt(t,n,a)}return bl(t,n,s,r,a)}function Yd(t,n,s,r){var a=r.children,i=t!==null?t.memoizedState:null;if(t===null&&n.stateNode===null&&(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode==="hidden"){if((n.flags&128)!==0){if(i=i!==null?i.baseLanes|s:s,t!==null){for(r=n.child=t.child,a=0;r!==null;)a=a|r.lanes|r.childLanes,r=r.sibling;r=a&~i}else r=0,n.child=null;return Gd(t,n,i,s,r)}if((s&536870912)!==0)n.memoizedState={baseLanes:0,cachePool:null},t!==null&&$r(n,i!==null?i.cachePool:null),i!==null?Ko(n,i):Zi(),Wo(n);else return r=n.lanes=536870912,Gd(t,n,i!==null?i.baseLanes|s:s,s,r)}else i!==null?($r(n,i.cachePool),Ko(n,i),xn(),n.memoizedState=null):(t!==null&&$r(n,null),Zi(),xn());return Xe(t,n,a,s),n.child}function lr(t,n){return t!==null&&t.tag===22||n.stateNode!==null||(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),n.sibling}function Gd(t,n,s,r,a){var i=Fi();return i=i===null?null:{parent:Pe._currentValue,pool:i},n.memoizedState={baseLanes:s,cachePool:i},t!==null&&$r(n,null),Zi(),Wo(n),t!==null&&hs(t,n,r,!0),n.childLanes=a,null}function fa(t,n){return n=ja({mode:n.mode,children:n.children},t.mode),n.ref=t.ref,t.child=n,n.return=t,n}function Vd(t,n,s){return Fn(n,t.child,null,s),t=fa(n,n.pendingProps),t.flags|=2,ft(n),n.memoizedState=null,t}function Rm(t,n,s){var r=n.pendingProps,a=(n.flags&128)!==0;if(n.flags&=-129,t===null){if(pe){if(r.mode==="hidden")return t=fa(n,r),n.lanes=536870912,lr(null,t);if(Ji(n),(t=Ne)?(t=ah(t,Ct),t=t!==null&&t.data==="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:cn!==null?{id:It,overflow:_t}:null,retryLane:536870912,hydrationErrors:null},s=No(t),s.return=n,n.child=s,We=n,Ne=null)):t=null,t===null)throw dn(n);return n.lanes=536870912,null}return fa(n,r)}var i=t.memoizedState;if(i!==null){var l=i.dehydrated;if(Ji(n),a)if(n.flags&256)n.flags&=-257,n=Vd(t,n,s);else if(n.memoizedState!==null)n.child=t.child,n.flags|=128,n=null;else throw Error(d(558));else if(Be||hs(t,n,s,!1),a=(s&t.childLanes)!==0,Be||a){if(r=ke,r!==null&&(l=Mc(r,s),l!==0&&l!==i.retryLane))throw i.retryLane=l,Mn(t,l),ct(r,t,l),yl;Ca(),n=Vd(t,n,s)}else t=i.treeContext,Ne=Et(l.nextSibling),We=n,pe=!0,on=null,Ct=!1,t!==null&&zo(n,t),n=fa(n,r),n.flags|=4096;return n}return t=Qt(t.child,{mode:r.mode,children:r.children}),t.ref=n.ref,n.child=t,t.return=n,t}function xa(t,n){var s=n.ref;if(s===null)t!==null&&t.ref!==null&&(n.flags|=4194816);else{if(typeof s!="function"&&typeof s!="object")throw Error(d(284));(t===null||t.ref!==s)&&(n.flags|=4194816)}}function bl(t,n,s,r,a){return Ln(n),s=el(t,n,s,r,void 0,a),r=tl(),t!==null&&!Be?(nl(t,n,a),Wt(t,n,a)):(pe&&r&&_i(n),n.flags|=1,Xe(t,n,s,a),n.child)}function Kd(t,n,s,r,a,i){return Ln(n),n.updateQueue=null,s=Xo(n,r,s,a),Zo(t),r=tl(),t!==null&&!Be?(nl(t,n,i),Wt(t,n,i)):(pe&&r&&_i(n),n.flags|=1,Xe(t,n,s,i),n.child)}function Wd(t,n,s,r,a){if(Ln(n),n.stateNode===null){var i=cs,l=s.contextType;typeof l=="object"&&l!==null&&(i=Ze(l)),i=new s(r,i),n.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,i.updater=jl,n.stateNode=i,i._reactInternals=n,i=n.stateNode,i.props=r,i.state=n.memoizedState,i.refs={},Gi(n),l=s.contextType,i.context=typeof l=="object"&&l!==null?Ze(l):cs,i.state=n.memoizedState,l=s.getDerivedStateFromProps,typeof l=="function"&&(xl(n,s,l,r),i.state=n.memoizedState),typeof s.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(l=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),l!==i.state&&jl.enqueueReplaceState(i,i.state,null),nr(n,r,i,a),tr(),i.state=n.memoizedState),typeof i.componentDidMount=="function"&&(n.flags|=4194308),r=!0}else if(t===null){i=n.stateNode;var o=n.memoizedProps,m=Gn(s,o);i.props=m;var k=i.context,z=s.contextType;l=cs,typeof z=="object"&&z!==null&&(l=Ze(z));var U=s.getDerivedStateFromProps;z=typeof U=="function"||typeof i.getSnapshotBeforeUpdate=="function",o=n.pendingProps!==o,z||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(o||k!==l)&&_d(n,i,r,l),hn=!1;var E=n.memoizedState;i.state=E,nr(n,r,i,a),tr(),k=n.memoizedState,o||E!==k||hn?(typeof U=="function"&&(xl(n,s,U,r),k=n.memoizedState),(m=hn||Id(n,s,m,r,E,k,l))?(z||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount()),typeof i.componentDidMount=="function"&&(n.flags|=4194308)):(typeof i.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=k),i.props=r,i.state=k,i.context=l,r=m):(typeof i.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{i=n.stateNode,Vi(t,n),l=n.memoizedProps,z=Gn(s,l),i.props=z,U=n.pendingProps,E=i.context,k=s.contextType,m=cs,typeof k=="object"&&k!==null&&(m=Ze(k)),o=s.getDerivedStateFromProps,(k=typeof o=="function"||typeof i.getSnapshotBeforeUpdate=="function")||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(l!==U||E!==m)&&_d(n,i,r,m),hn=!1,E=n.memoizedState,i.state=E,nr(n,r,i,a),tr();var N=n.memoizedState;l!==U||E!==N||hn||t!==null&&t.dependencies!==null&&Xr(t.dependencies)?(typeof o=="function"&&(xl(n,s,o,r),N=n.memoizedState),(z=hn||Id(n,s,z,r,E,N,m)||t!==null&&t.dependencies!==null&&Xr(t.dependencies))?(k||typeof i.UNSAFE_componentWillUpdate!="function"&&typeof i.componentWillUpdate!="function"||(typeof i.componentWillUpdate=="function"&&i.componentWillUpdate(r,N,m),typeof i.UNSAFE_componentWillUpdate=="function"&&i.UNSAFE_componentWillUpdate(r,N,m)),typeof i.componentDidUpdate=="function"&&(n.flags|=4),typeof i.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof i.componentDidUpdate!="function"||l===t.memoizedProps&&E===t.memoizedState||(n.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||l===t.memoizedProps&&E===t.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=N),i.props=r,i.state=N,i.context=m,r=z):(typeof i.componentDidUpdate!="function"||l===t.memoizedProps&&E===t.memoizedState||(n.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||l===t.memoizedProps&&E===t.memoizedState||(n.flags|=1024),r=!1)}return i=r,xa(t,n),r=(n.flags&128)!==0,i||r?(i=n.stateNode,s=r&&typeof s.getDerivedStateFromError!="function"?null:i.render(),n.flags|=1,t!==null&&r?(n.child=Fn(n,t.child,null,a),n.child=Fn(n,null,s,a)):Xe(t,n,s,a),n.memoizedState=i.state,t=n.child):t=Wt(t,n,a),t}function Zd(t,n,s,r){return Un(),n.flags|=256,Xe(t,n,s,r),n.child}var vl={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Sl(t){return{baseLanes:t,cachePool:Po()}}function Tl(t,n,s){return t=t!==null?t.childLanes&~s:0,n&&(t|=jt),t}function Xd(t,n,s){var r=n.pendingProps,a=!1,i=(n.flags&128)!==0,l;if((l=i)||(l=t!==null&&t.memoizedState===null?!1:(Me.current&2)!==0),l&&(a=!0,n.flags&=-129),l=(n.flags&32)!==0,n.flags&=-33,t===null){if(pe){if(a?fn(n):xn(),(t=Ne)?(t=ah(t,Ct),t=t!==null&&t.data!=="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:cn!==null?{id:It,overflow:_t}:null,retryLane:536870912,hydrationErrors:null},s=No(t),s.return=n,n.child=s,We=n,Ne=null)):t=null,t===null)throw dn(n);return ac(t)?n.lanes=32:n.lanes=536870912,null}var o=r.children;return r=r.fallback,a?(xn(),a=n.mode,o=ja({mode:"hidden",children:o},a),r=qn(r,a,s,null),o.return=n,r.return=n,o.sibling=r,n.child=o,r=n.child,r.memoizedState=Sl(s),r.childLanes=Tl(t,l,s),n.memoizedState=vl,lr(null,r)):(fn(n),wl(n,o))}var m=t.memoizedState;if(m!==null&&(o=m.dehydrated,o!==null)){if(i)n.flags&256?(fn(n),n.flags&=-257,n=kl(t,n,s)):n.memoizedState!==null?(xn(),n.child=t.child,n.flags|=128,n=null):(xn(),o=r.fallback,a=n.mode,r=ja({mode:"visible",children:r.children},a),o=qn(o,a,s,null),o.flags|=2,r.return=n,o.return=n,r.sibling=o,n.child=r,Fn(n,t.child,null,s),r=n.child,r.memoizedState=Sl(s),r.childLanes=Tl(t,l,s),n.memoizedState=vl,n=lr(null,r));else if(fn(n),ac(o)){if(l=o.nextSibling&&o.nextSibling.dataset,l)var k=l.dgst;l=k,r=Error(d(419)),r.stack="",r.digest=l,Ws({value:r,source:null,stack:null}),n=kl(t,n,s)}else if(Be||hs(t,n,s,!1),l=(s&t.childLanes)!==0,Be||l){if(l=ke,l!==null&&(r=Mc(l,s),r!==0&&r!==m.retryLane))throw m.retryLane=r,Mn(t,r),ct(l,t,r),yl;rc(o)||Ca(),n=kl(t,n,s)}else rc(o)?(n.flags|=192,n.child=t.child,n=null):(t=m.treeContext,Ne=Et(o.nextSibling),We=n,pe=!0,on=null,Ct=!1,t!==null&&zo(n,t),n=wl(n,r.children),n.flags|=4096);return n}return a?(xn(),o=r.fallback,a=n.mode,m=t.child,k=m.sibling,r=Qt(m,{mode:"hidden",children:r.children}),r.subtreeFlags=m.subtreeFlags&65011712,k!==null?o=Qt(k,o):(o=qn(o,a,s,null),o.flags|=2),o.return=n,r.return=n,r.sibling=o,n.child=r,lr(null,r),r=n.child,o=t.child.memoizedState,o===null?o=Sl(s):(a=o.cachePool,a!==null?(m=Pe._currentValue,a=a.parent!==m?{parent:m,pool:m}:a):a=Po(),o={baseLanes:o.baseLanes|s,cachePool:a}),r.memoizedState=o,r.childLanes=Tl(t,l,s),n.memoizedState=vl,lr(t.child,r)):(fn(n),s=t.child,t=s.sibling,s=Qt(s,{mode:"visible",children:r.children}),s.return=n,s.sibling=null,t!==null&&(l=n.deletions,l===null?(n.deletions=[t],n.flags|=16):l.push(t)),n.child=s,n.memoizedState=null,s)}function wl(t,n){return n=ja({mode:"visible",children:n},t.mode),n.return=t,t.child=n}function ja(t,n){return t=pt(22,t,null,n),t.lanes=0,t}function kl(t,n,s){return Fn(n,t.child,null,s),t=wl(n,n.pendingProps.children),t.flags|=2,n.memoizedState=null,t}function Jd(t,n,s){t.lanes|=n;var r=t.alternate;r!==null&&(r.lanes|=n),Li(t.return,n,s)}function Cl(t,n,s,r,a,i){var l=t.memoizedState;l===null?t.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:s,tailMode:a,treeForkCount:i}:(l.isBackwards=n,l.rendering=null,l.renderingStartTime=0,l.last=r,l.tail=s,l.tailMode=a,l.treeForkCount=i)}function $d(t,n,s){var r=n.pendingProps,a=r.revealOrder,i=r.tail;r=r.children;var l=Me.current,o=(l&2)!==0;if(o?(l=l&1|2,n.flags|=128):l&=1,Y(Me,l),Xe(t,n,r,s),r=pe?Ks:0,!o&&t!==null&&(t.flags&128)!==0)e:for(t=n.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Jd(t,s,n);else if(t.tag===19)Jd(t,s,n);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break e;for(;t.sibling===null;){if(t.return===null||t.return===n)break e;t=t.return}t.sibling.return=t.return,t=t.sibling}switch(a){case"forwards":for(s=n.child,a=null;s!==null;)t=s.alternate,t!==null&&aa(t)===null&&(a=s),s=s.sibling;s=a,s===null?(a=n.child,n.child=null):(a=s.sibling,s.sibling=null),Cl(n,!1,a,s,i,r);break;case"backwards":case"unstable_legacy-backwards":for(s=null,a=n.child,n.child=null;a!==null;){if(t=a.alternate,t!==null&&aa(t)===null){n.child=a;break}t=a.sibling,a.sibling=s,s=a,a=t}Cl(n,!0,s,null,i,r);break;case"together":Cl(n,!1,null,null,void 0,r);break;default:n.memoizedState=null}return n.child}function Wt(t,n,s){if(t!==null&&(n.dependencies=t.dependencies),yn|=n.lanes,(s&n.childLanes)===0)if(t!==null){if(hs(t,n,s,!1),(s&n.childLanes)===0)return null}else return null;if(t!==null&&n.child!==t.child)throw Error(d(153));if(n.child!==null){for(t=n.child,s=Qt(t,t.pendingProps),n.child=s,s.return=n;t.sibling!==null;)t=t.sibling,s=s.sibling=Qt(t,t.pendingProps),s.return=n;s.sibling=null}return n.child}function Rl(t,n){return(t.lanes&n)!==0?!0:(t=t.dependencies,!!(t!==null&&Xr(t)))}function Em(t,n,s){switch(n.tag){case 3:Ve(n,n.stateNode.containerInfo),un(n,Pe,t.memoizedState.cache),Un();break;case 27:case 5:zs(n);break;case 4:Ve(n,n.stateNode.containerInfo);break;case 10:un(n,n.type,n.memoizedProps.value);break;case 31:if(n.memoizedState!==null)return n.flags|=128,Ji(n),null;break;case 13:var r=n.memoizedState;if(r!==null)return r.dehydrated!==null?(fn(n),n.flags|=128,null):(s&n.child.childLanes)!==0?Xd(t,n,s):(fn(n),t=Wt(t,n,s),t!==null?t.sibling:null);fn(n);break;case 19:var a=(t.flags&128)!==0;if(r=(s&n.childLanes)!==0,r||(hs(t,n,s,!1),r=(s&n.childLanes)!==0),a){if(r)return $d(t,n,s);n.flags|=128}if(a=n.memoizedState,a!==null&&(a.rendering=null,a.tail=null,a.lastEffect=null),Y(Me,Me.current),r)break;return null;case 22:return n.lanes=0,Yd(t,n,s,n.pendingProps);case 24:un(n,Pe,t.memoizedState.cache)}return Wt(t,n,s)}function eu(t,n,s){if(t!==null)if(t.memoizedProps!==n.pendingProps)Be=!0;else{if(!Rl(t,s)&&(n.flags&128)===0)return Be=!1,Em(t,n,s);Be=(t.flags&131072)!==0}else Be=!1,pe&&(n.flags&1048576)!==0&&Do(n,Ks,n.index);switch(n.lanes=0,n.tag){case 16:e:{var r=n.pendingProps;if(t=Hn(n.elementType),n.type=t,typeof t=="function")Di(t)?(r=Gn(t,r),n.tag=1,n=Wd(null,n,t,r,s)):(n.tag=0,n=bl(null,n,t,r,s));else{if(t!=null){var a=t.$$typeof;if(a===X){n.tag=11,n=Hd(null,n,t,r,s);break e}else if(a===J){n.tag=14,n=Qd(null,n,t,r,s);break e}}throw n=Ce(t)||t,Error(d(306,n,""))}}return n;case 0:return bl(t,n,n.type,n.pendingProps,s);case 1:return r=n.type,a=Gn(r,n.pendingProps),Wd(t,n,r,a,s);case 3:e:{if(Ve(n,n.stateNode.containerInfo),t===null)throw Error(d(387));r=n.pendingProps;var i=n.memoizedState;a=i.element,Vi(t,n),nr(n,r,null,s);var l=n.memoizedState;if(r=l.cache,un(n,Pe,r),r!==i.cache&&Bi(n,[Pe],s,!0),tr(),r=l.element,i.isDehydrated)if(i={element:r,isDehydrated:!1,cache:l.cache},n.updateQueue.baseState=i,n.memoizedState=i,n.flags&256){n=Zd(t,n,r,s);break e}else if(r!==a){a=Tt(Error(d(424)),n),Ws(a),n=Zd(t,n,r,s);break e}else for(t=n.stateNode.containerInfo,t.nodeType===9?t=t.body:t=t.nodeName==="HTML"?t.ownerDocument.body:t,Ne=Et(t.firstChild),We=n,pe=!0,on=null,Ct=!0,s=Yo(n,null,r,s),n.child=s;s;)s.flags=s.flags&-3|4096,s=s.sibling;else{if(Un(),r===a){n=Wt(t,n,s);break e}Xe(t,n,r,s)}n=n.child}return n;case 26:return xa(t,n),t===null?(s=uh(n.type,null,n.pendingProps,null))?n.memoizedState=s:pe||(s=n.type,t=n.pendingProps,r=za(re.current).createElement(s),r[Ke]=n,r[nt]=t,Je(r,s,t),Ye(r),n.stateNode=r):n.memoizedState=uh(n.type,t.memoizedProps,n.pendingProps,t.memoizedState),null;case 27:return zs(n),t===null&&pe&&(r=n.stateNode=ch(n.type,n.pendingProps,re.current),We=n,Ct=!0,a=Ne,wn(n.type)?(ic=a,Ne=Et(r.firstChild)):Ne=a),Xe(t,n,n.pendingProps.children,s),xa(t,n),t===null&&(n.flags|=4194304),n.child;case 5:return t===null&&pe&&((a=r=Ne)&&(r=rf(r,n.type,n.pendingProps,Ct),r!==null?(n.stateNode=r,We=n,Ne=Et(r.firstChild),Ct=!1,a=!0):a=!1),a||dn(n)),zs(n),a=n.type,i=n.pendingProps,l=t!==null?t.memoizedProps:null,r=i.children,tc(a,i)?r=null:l!==null&&tc(a,l)&&(n.flags|=32),n.memoizedState!==null&&(a=el(t,n,ym,null,null,s),Sr._currentValue=a),xa(t,n),Xe(t,n,r,s),n.child;case 6:return t===null&&pe&&((t=s=Ne)&&(s=af(s,n.pendingProps,Ct),s!==null?(n.stateNode=s,We=n,Ne=null,t=!0):t=!1),t||dn(n)),null;case 13:return Xd(t,n,s);case 4:return Ve(n,n.stateNode.containerInfo),r=n.pendingProps,t===null?n.child=Fn(n,null,r,s):Xe(t,n,r,s),n.child;case 11:return Hd(t,n,n.type,n.pendingProps,s);case 7:return Xe(t,n,n.pendingProps,s),n.child;case 8:return Xe(t,n,n.pendingProps.children,s),n.child;case 12:return Xe(t,n,n.pendingProps.children,s),n.child;case 10:return r=n.pendingProps,un(n,n.type,r.value),Xe(t,n,r.children,s),n.child;case 9:return a=n.type._context,r=n.pendingProps.children,Ln(n),a=Ze(a),r=r(a),n.flags|=1,Xe(t,n,r,s),n.child;case 14:return Qd(t,n,n.type,n.pendingProps,s);case 15:return Fd(t,n,n.type,n.pendingProps,s);case 19:return $d(t,n,s);case 31:return Rm(t,n,s);case 22:return Yd(t,n,s,n.pendingProps);case 24:return Ln(n),r=Ze(Pe),t===null?(a=Fi(),a===null&&(a=ke,i=Hi(),a.pooledCache=i,i.refCount++,i!==null&&(a.pooledCacheLanes|=s),a=i),n.memoizedState={parent:r,cache:a},Gi(n),un(n,Pe,a)):((t.lanes&s)!==0&&(Vi(t,n),nr(n,null,null,s),tr()),a=t.memoizedState,i=n.memoizedState,a.parent!==r?(a={parent:r,cache:r},n.memoizedState=a,n.lanes===0&&(n.memoizedState=n.updateQueue.baseState=a),un(n,Pe,r)):(r=i.cache,un(n,Pe,r),r!==a.cache&&Bi(n,[Pe],s,!0))),Xe(t,n,n.pendingProps.children,s),n.child;case 29:throw n.pendingProps}throw Error(d(156,n.tag))}function Zt(t){t.flags|=4}function El(t,n,s,r,a){if((n=(t.mode&32)!==0)&&(n=!1),n){if(t.flags|=16777216,(a&335544128)===a)if(t.stateNode.complete)t.flags|=8192;else if(Ru())t.flags|=8192;else throw Qn=ta,Yi}else t.flags&=-16777217}function tu(t,n){if(n.type!=="stylesheet"||(n.state.loading&4)!==0)t.flags&=-16777217;else if(t.flags|=16777216,!xh(n))if(Ru())t.flags|=8192;else throw Qn=ta,Yi}function ga(t,n){n!==null&&(t.flags|=4),t.flags&16384&&(n=t.tag!==22?zc():536870912,t.lanes|=n,ws|=n)}function cr(t,n){if(!pe)switch(t.tailMode){case"hidden":n=t.tail;for(var s=null;n!==null;)n.alternate!==null&&(s=n),n=n.sibling;s===null?t.tail=null:s.sibling=null;break;case"collapsed":s=t.tail;for(var r=null;s!==null;)s.alternate!==null&&(r=s),s=s.sibling;r===null?n||t.tail===null?t.tail=null:t.tail.sibling=null:r.sibling=null}}function Oe(t){var n=t.alternate!==null&&t.alternate.child===t.child,s=0,r=0;if(n)for(var a=t.child;a!==null;)s|=a.lanes|a.childLanes,r|=a.subtreeFlags&65011712,r|=a.flags&65011712,a.return=t,a=a.sibling;else for(a=t.child;a!==null;)s|=a.lanes|a.childLanes,r|=a.subtreeFlags,r|=a.flags,a.return=t,a=a.sibling;return t.subtreeFlags|=r,t.childLanes=s,n}function Am(t,n,s){var r=n.pendingProps;switch(Mi(n),n.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Oe(n),null;case 1:return Oe(n),null;case 3:return s=n.stateNode,r=null,t!==null&&(r=t.memoizedState.cache),n.memoizedState.cache!==r&&(n.flags|=2048),Gt(Pe),Ae(),s.pendingContext&&(s.context=s.pendingContext,s.pendingContext=null),(t===null||t.child===null)&&(us(n)?Zt(n):t===null||t.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,Ui())),Oe(n),null;case 26:var a=n.type,i=n.memoizedState;return t===null?(Zt(n),i!==null?(Oe(n),tu(n,i)):(Oe(n),El(n,a,null,r,s))):i?i!==t.memoizedState?(Zt(n),Oe(n),tu(n,i)):(Oe(n),n.flags&=-16777217):(t=t.memoizedProps,t!==r&&Zt(n),Oe(n),El(n,a,t,r,s)),null;case 27:if(Ar(n),s=re.current,a=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&Zt(n);else{if(!r){if(n.stateNode===null)throw Error(d(166));return Oe(n),null}t=V.current,us(n)?Io(n):(t=ch(a,r,s),n.stateNode=t,Zt(n))}return Oe(n),null;case 5:if(Ar(n),a=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==r&&Zt(n);else{if(!r){if(n.stateNode===null)throw Error(d(166));return Oe(n),null}if(i=V.current,us(n))Io(n);else{var l=za(re.current);switch(i){case 1:i=l.createElementNS("http://www.w3.org/2000/svg",a);break;case 2:i=l.createElementNS("http://www.w3.org/1998/Math/MathML",a);break;default:switch(a){case"svg":i=l.createElementNS("http://www.w3.org/2000/svg",a);break;case"math":i=l.createElementNS("http://www.w3.org/1998/Math/MathML",a);break;case"script":i=l.createElement("div"),i.innerHTML="<script><\/script>",i=i.removeChild(i.firstChild);break;case"select":i=typeof r.is=="string"?l.createElement("select",{is:r.is}):l.createElement("select"),r.multiple?i.multiple=!0:r.size&&(i.size=r.size);break;default:i=typeof r.is=="string"?l.createElement(a,{is:r.is}):l.createElement(a)}}i[Ke]=n,i[nt]=r;e:for(l=n.child;l!==null;){if(l.tag===5||l.tag===6)i.appendChild(l.stateNode);else if(l.tag!==4&&l.tag!==27&&l.child!==null){l.child.return=l,l=l.child;continue}if(l===n)break e;for(;l.sibling===null;){if(l.return===null||l.return===n)break e;l=l.return}l.sibling.return=l.return,l=l.sibling}n.stateNode=i;e:switch(Je(i,a,r),a){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}r&&Zt(n)}}return Oe(n),El(n,n.type,t===null?null:t.memoizedProps,n.pendingProps,s),null;case 6:if(t&&n.stateNode!=null)t.memoizedProps!==r&&Zt(n);else{if(typeof r!="string"&&n.stateNode===null)throw Error(d(166));if(t=re.current,us(n)){if(t=n.stateNode,s=n.memoizedProps,r=null,a=We,a!==null)switch(a.tag){case 27:case 5:r=a.memoizedProps}t[Ke]=n,t=!!(t.nodeValue===s||r!==null&&r.suppressHydrationWarning===!0||Xu(t.nodeValue,s)),t||dn(n,!0)}else t=za(t).createTextNode(r),t[Ke]=n,n.stateNode=t}return Oe(n),null;case 31:if(s=n.memoizedState,t===null||t.memoizedState!==null){if(r=us(n),s!==null){if(t===null){if(!r)throw Error(d(318));if(t=n.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(d(557));t[Ke]=n}else Un(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Oe(n),t=!1}else s=Ui(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=s),t=!0;if(!t)return n.flags&256?(ft(n),n):(ft(n),null);if((n.flags&128)!==0)throw Error(d(558))}return Oe(n),null;case 13:if(r=n.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(a=us(n),r!==null&&r.dehydrated!==null){if(t===null){if(!a)throw Error(d(318));if(a=n.memoizedState,a=a!==null?a.dehydrated:null,!a)throw Error(d(317));a[Ke]=n}else Un(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Oe(n),a=!1}else a=Ui(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=a),a=!0;if(!a)return n.flags&256?(ft(n),n):(ft(n),null)}return ft(n),(n.flags&128)!==0?(n.lanes=s,n):(s=r!==null,t=t!==null&&t.memoizedState!==null,s&&(r=n.child,a=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(a=r.alternate.memoizedState.cachePool.pool),i=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(i=r.memoizedState.cachePool.pool),i!==a&&(r.flags|=2048)),s!==t&&s&&(n.child.flags|=8192),ga(n,n.updateQueue),Oe(n),null);case 4:return Ae(),t===null&&Zl(n.stateNode.containerInfo),Oe(n),null;case 10:return Gt(n.type),Oe(n),null;case 19:if(q(Me),r=n.memoizedState,r===null)return Oe(n),null;if(a=(n.flags&128)!==0,i=r.rendering,i===null)if(a)cr(r,!1);else{if(_e!==0||t!==null&&(t.flags&128)!==0)for(t=n.child;t!==null;){if(i=aa(t),i!==null){for(n.flags|=128,cr(r,!1),t=i.updateQueue,n.updateQueue=t,ga(n,t),n.subtreeFlags=0,t=s,s=n.child;s!==null;)Ao(s,t),s=s.sibling;return Y(Me,Me.current&1|2),pe&&Ft(n,r.treeForkCount),n.child}t=t.sibling}r.tail!==null&&ot()>Ta&&(n.flags|=128,a=!0,cr(r,!1),n.lanes=4194304)}else{if(!a)if(t=aa(i),t!==null){if(n.flags|=128,a=!0,t=t.updateQueue,n.updateQueue=t,ga(n,t),cr(r,!0),r.tail===null&&r.tailMode==="hidden"&&!i.alternate&&!pe)return Oe(n),null}else 2*ot()-r.renderingStartTime>Ta&&s!==536870912&&(n.flags|=128,a=!0,cr(r,!1),n.lanes=4194304);r.isBackwards?(i.sibling=n.child,n.child=i):(t=r.last,t!==null?t.sibling=i:n.child=i,r.last=i)}return r.tail!==null?(t=r.tail,r.rendering=t,r.tail=t.sibling,r.renderingStartTime=ot(),t.sibling=null,s=Me.current,Y(Me,a?s&1|2:s&1),pe&&Ft(n,r.treeForkCount),t):(Oe(n),null);case 22:case 23:return ft(n),Xi(),r=n.memoizedState!==null,t!==null?t.memoizedState!==null!==r&&(n.flags|=8192):r&&(n.flags|=8192),r?(s&536870912)!==0&&(n.flags&128)===0&&(Oe(n),n.subtreeFlags&6&&(n.flags|=8192)):Oe(n),s=n.updateQueue,s!==null&&ga(n,s.retryQueue),s=null,t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(s=t.memoizedState.cachePool.pool),r=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(r=n.memoizedState.cachePool.pool),r!==s&&(n.flags|=2048),t!==null&&q(Bn),null;case 24:return s=null,t!==null&&(s=t.memoizedState.cache),n.memoizedState.cache!==s&&(n.flags|=2048),Gt(Pe),Oe(n),null;case 25:return null;case 30:return null}throw Error(d(156,n.tag))}function Nm(t,n){switch(Mi(n),n.tag){case 1:return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 3:return Gt(Pe),Ae(),t=n.flags,(t&65536)!==0&&(t&128)===0?(n.flags=t&-65537|128,n):null;case 26:case 27:case 5:return Ar(n),null;case 31:if(n.memoizedState!==null){if(ft(n),n.alternate===null)throw Error(d(340));Un()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 13:if(ft(n),t=n.memoizedState,t!==null&&t.dehydrated!==null){if(n.alternate===null)throw Error(d(340));Un()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 19:return q(Me),null;case 4:return Ae(),null;case 10:return Gt(n.type),null;case 22:case 23:return ft(n),Xi(),t!==null&&q(Bn),t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 24:return Gt(Pe),null;case 25:return null;default:return null}}function nu(t,n){switch(Mi(n),n.tag){case 3:Gt(Pe),Ae();break;case 26:case 27:case 5:Ar(n);break;case 4:Ae();break;case 31:n.memoizedState!==null&&ft(n);break;case 13:ft(n);break;case 19:q(Me);break;case 10:Gt(n.type);break;case 22:case 23:ft(n),Xi(),t!==null&&q(Bn);break;case 24:Gt(Pe)}}function or(t,n){try{var s=n.updateQueue,r=s!==null?s.lastEffect:null;if(r!==null){var a=r.next;s=a;do{if((s.tag&t)===t){r=void 0;var i=s.create,l=s.inst;r=i(),l.destroy=r}s=s.next}while(s!==a)}}catch(o){ve(n,n.return,o)}}function jn(t,n,s){try{var r=n.updateQueue,a=r!==null?r.lastEffect:null;if(a!==null){var i=a.next;r=i;do{if((r.tag&t)===t){var l=r.inst,o=l.destroy;if(o!==void 0){l.destroy=void 0,a=n;var m=s,k=o;try{k()}catch(z){ve(a,m,z)}}}r=r.next}while(r!==i)}}catch(z){ve(n,n.return,z)}}function su(t){var n=t.updateQueue;if(n!==null){var s=t.stateNode;try{Vo(n,s)}catch(r){ve(t,t.return,r)}}}function ru(t,n,s){s.props=Gn(t.type,t.memoizedProps),s.state=t.memoizedState;try{s.componentWillUnmount()}catch(r){ve(t,n,r)}}function dr(t,n){try{var s=t.ref;if(s!==null){switch(t.tag){case 26:case 27:case 5:var r=t.stateNode;break;case 30:r=t.stateNode;break;default:r=t.stateNode}typeof s=="function"?t.refCleanup=s(r):s.current=r}}catch(a){ve(t,n,a)}}function Mt(t,n){var s=t.ref,r=t.refCleanup;if(s!==null)if(typeof r=="function")try{r()}catch(a){ve(t,n,a)}finally{t.refCleanup=null,t=t.alternate,t!=null&&(t.refCleanup=null)}else if(typeof s=="function")try{s(null)}catch(a){ve(t,n,a)}else s.current=null}function au(t){var n=t.type,s=t.memoizedProps,r=t.stateNode;try{e:switch(n){case"button":case"input":case"select":case"textarea":s.autoFocus&&r.focus();break e;case"img":s.src?r.src=s.src:s.srcSet&&(r.srcset=s.srcSet)}}catch(a){ve(t,t.return,a)}}function Al(t,n,s){try{var r=t.stateNode;Jm(r,t.type,s,n),r[nt]=n}catch(a){ve(t,t.return,a)}}function iu(t){return t.tag===5||t.tag===3||t.tag===26||t.tag===27&&wn(t.type)||t.tag===4}function Nl(t){e:for(;;){for(;t.sibling===null;){if(t.return===null||iu(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.tag===27&&wn(t.type)||t.flags&2||t.child===null||t.tag===4)continue e;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Ol(t,n,s){var r=t.tag;if(r===5||r===6)t=t.stateNode,n?(s.nodeType===9?s.body:s.nodeName==="HTML"?s.ownerDocument.body:s).insertBefore(t,n):(n=s.nodeType===9?s.body:s.nodeName==="HTML"?s.ownerDocument.body:s,n.appendChild(t),s=s._reactRootContainer,s!=null||n.onclick!==null||(n.onclick=Bt));else if(r!==4&&(r===27&&wn(t.type)&&(s=t.stateNode,n=null),t=t.child,t!==null))for(Ol(t,n,s),t=t.sibling;t!==null;)Ol(t,n,s),t=t.sibling}function ya(t,n,s){var r=t.tag;if(r===5||r===6)t=t.stateNode,n?s.insertBefore(t,n):s.appendChild(t);else if(r!==4&&(r===27&&wn(t.type)&&(s=t.stateNode),t=t.child,t!==null))for(ya(t,n,s),t=t.sibling;t!==null;)ya(t,n,s),t=t.sibling}function lu(t){var n=t.stateNode,s=t.memoizedProps;try{for(var r=t.type,a=n.attributes;a.length;)n.removeAttributeNode(a[0]);Je(n,r,s),n[Ke]=t,n[nt]=s}catch(i){ve(t,t.return,i)}}var Xt=!1,He=!1,Dl=!1,cu=typeof WeakSet=="function"?WeakSet:Set,Ge=null;function Om(t,n){if(t=t.containerInfo,$l=La,t=bo(t),ki(t)){if("selectionStart"in t)var s={start:t.selectionStart,end:t.selectionEnd};else e:{s=(s=t.ownerDocument)&&s.defaultView||window;var r=s.getSelection&&s.getSelection();if(r&&r.rangeCount!==0){s=r.anchorNode;var a=r.anchorOffset,i=r.focusNode;r=r.focusOffset;try{s.nodeType,i.nodeType}catch{s=null;break e}var l=0,o=-1,m=-1,k=0,z=0,U=t,E=null;t:for(;;){for(var N;U!==s||a!==0&&U.nodeType!==3||(o=l+a),U!==i||r!==0&&U.nodeType!==3||(m=l+r),U.nodeType===3&&(l+=U.nodeValue.length),(N=U.firstChild)!==null;)E=U,U=N;for(;;){if(U===t)break t;if(E===s&&++k===a&&(o=l),E===i&&++z===r&&(m=l),(N=U.nextSibling)!==null)break;U=E,E=U.parentNode}U=N}s=o===-1||m===-1?null:{start:o,end:m}}else s=null}s=s||{start:0,end:0}}else s=null;for(ec={focusedElem:t,selectionRange:s},La=!1,Ge=n;Ge!==null;)if(n=Ge,t=n.child,(n.subtreeFlags&1028)!==0&&t!==null)t.return=n,Ge=t;else for(;Ge!==null;){switch(n=Ge,i=n.alternate,t=n.flags,n.tag){case 0:if((t&4)!==0&&(t=n.updateQueue,t=t!==null?t.events:null,t!==null))for(s=0;s<t.length;s++)a=t[s],a.ref.impl=a.nextImpl;break;case 11:case 15:break;case 1:if((t&1024)!==0&&i!==null){t=void 0,s=n,a=i.memoizedProps,i=i.memoizedState,r=s.stateNode;try{var K=Gn(s.type,a);t=r.getSnapshotBeforeUpdate(K,i),r.__reactInternalSnapshotBeforeUpdate=t}catch(ee){ve(s,s.return,ee)}}break;case 3:if((t&1024)!==0){if(t=n.stateNode.containerInfo,s=t.nodeType,s===9)sc(t);else if(s===1)switch(t.nodeName){case"HEAD":case"HTML":case"BODY":sc(t);break;default:t.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((t&1024)!==0)throw Error(d(163))}if(t=n.sibling,t!==null){t.return=n.return,Ge=t;break}Ge=n.return}}function ou(t,n,s){var r=s.flags;switch(s.tag){case 0:case 11:case 15:$t(t,s),r&4&&or(5,s);break;case 1:if($t(t,s),r&4)if(t=s.stateNode,n===null)try{t.componentDidMount()}catch(l){ve(s,s.return,l)}else{var a=Gn(s.type,n.memoizedProps);n=n.memoizedState;try{t.componentDidUpdate(a,n,t.__reactInternalSnapshotBeforeUpdate)}catch(l){ve(s,s.return,l)}}r&64&&su(s),r&512&&dr(s,s.return);break;case 3:if($t(t,s),r&64&&(t=s.updateQueue,t!==null)){if(n=null,s.child!==null)switch(s.child.tag){case 27:case 5:n=s.child.stateNode;break;case 1:n=s.child.stateNode}try{Vo(t,n)}catch(l){ve(s,s.return,l)}}break;case 27:n===null&&r&4&&lu(s);case 26:case 5:$t(t,s),n===null&&r&4&&au(s),r&512&&dr(s,s.return);break;case 12:$t(t,s);break;case 31:$t(t,s),r&4&&hu(t,s);break;case 13:$t(t,s),r&4&&pu(t,s),r&64&&(t=s.memoizedState,t!==null&&(t=t.dehydrated,t!==null&&(s=Lm.bind(null,s),lf(t,s))));break;case 22:if(r=s.memoizedState!==null||Xt,!r){n=n!==null&&n.memoizedState!==null||He,a=Xt;var i=He;Xt=r,(He=n)&&!i?en(t,s,(s.subtreeFlags&8772)!==0):$t(t,s),Xt=a,He=i}break;case 30:break;default:$t(t,s)}}function du(t){var n=t.alternate;n!==null&&(t.alternate=null,du(n)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(n=t.stateNode,n!==null&&ci(n)),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}var De=null,rt=!1;function Jt(t,n,s){for(s=s.child;s!==null;)uu(t,n,s),s=s.sibling}function uu(t,n,s){if(dt&&typeof dt.onCommitFiberUnmount=="function")try{dt.onCommitFiberUnmount(Is,s)}catch{}switch(s.tag){case 26:He||Mt(s,n),Jt(t,n,s),s.memoizedState?s.memoizedState.count--:s.stateNode&&(s=s.stateNode,s.parentNode.removeChild(s));break;case 27:He||Mt(s,n);var r=De,a=rt;wn(s.type)&&(De=s.stateNode,rt=!1),Jt(t,n,s),yr(s.stateNode),De=r,rt=a;break;case 5:He||Mt(s,n);case 6:if(r=De,a=rt,De=null,Jt(t,n,s),De=r,rt=a,De!==null)if(rt)try{(De.nodeType===9?De.body:De.nodeName==="HTML"?De.ownerDocument.body:De).removeChild(s.stateNode)}catch(i){ve(s,n,i)}else try{De.removeChild(s.stateNode)}catch(i){ve(s,n,i)}break;case 18:De!==null&&(rt?(t=De,sh(t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,s.stateNode),Ds(t)):sh(De,s.stateNode));break;case 4:r=De,a=rt,De=s.stateNode.containerInfo,rt=!0,Jt(t,n,s),De=r,rt=a;break;case 0:case 11:case 14:case 15:jn(2,s,n),He||jn(4,s,n),Jt(t,n,s);break;case 1:He||(Mt(s,n),r=s.stateNode,typeof r.componentWillUnmount=="function"&&ru(s,n,r)),Jt(t,n,s);break;case 21:Jt(t,n,s);break;case 22:He=(r=He)||s.memoizedState!==null,Jt(t,n,s),He=r;break;default:Jt(t,n,s)}}function hu(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null))){t=t.dehydrated;try{Ds(t)}catch(s){ve(n,n.return,s)}}}function pu(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null&&(t=t.dehydrated,t!==null))))try{Ds(t)}catch(s){ve(n,n.return,s)}}function Dm(t){switch(t.tag){case 31:case 13:case 19:var n=t.stateNode;return n===null&&(n=t.stateNode=new cu),n;case 22:return t=t.stateNode,n=t._retryCache,n===null&&(n=t._retryCache=new cu),n;default:throw Error(d(435,t.tag))}}function ba(t,n){var s=Dm(t);n.forEach(function(r){if(!s.has(r)){s.add(r);var a=Bm.bind(null,t,r);r.then(a,a)}})}function at(t,n){var s=n.deletions;if(s!==null)for(var r=0;r<s.length;r++){var a=s[r],i=t,l=n,o=l;e:for(;o!==null;){switch(o.tag){case 27:if(wn(o.type)){De=o.stateNode,rt=!1;break e}break;case 5:De=o.stateNode,rt=!1;break e;case 3:case 4:De=o.stateNode.containerInfo,rt=!0;break e}o=o.return}if(De===null)throw Error(d(160));uu(i,l,a),De=null,rt=!1,i=a.alternate,i!==null&&(i.return=null),a.return=null}if(n.subtreeFlags&13886)for(n=n.child;n!==null;)mu(n,t),n=n.sibling}var Ot=null;function mu(t,n){var s=t.alternate,r=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:at(n,t),it(t),r&4&&(jn(3,t,t.return),or(3,t),jn(5,t,t.return));break;case 1:at(n,t),it(t),r&512&&(He||s===null||Mt(s,s.return)),r&64&&Xt&&(t=t.updateQueue,t!==null&&(r=t.callbacks,r!==null&&(s=t.shared.hiddenCallbacks,t.shared.hiddenCallbacks=s===null?r:s.concat(r))));break;case 26:var a=Ot;if(at(n,t),it(t),r&512&&(He||s===null||Mt(s,s.return)),r&4){var i=s!==null?s.memoizedState:null;if(r=t.memoizedState,s===null)if(r===null)if(t.stateNode===null){e:{r=t.type,s=t.memoizedProps,a=a.ownerDocument||a;t:switch(r){case"title":i=a.getElementsByTagName("title")[0],(!i||i[qs]||i[Ke]||i.namespaceURI==="http://www.w3.org/2000/svg"||i.hasAttribute("itemprop"))&&(i=a.createElement(r),a.head.insertBefore(i,a.querySelector("head > title"))),Je(i,r,s),i[Ke]=t,Ye(i),r=i;break e;case"link":var l=mh("link","href",a).get(r+(s.href||""));if(l){for(var o=0;o<l.length;o++)if(i=l[o],i.getAttribute("href")===(s.href==null||s.href===""?null:s.href)&&i.getAttribute("rel")===(s.rel==null?null:s.rel)&&i.getAttribute("title")===(s.title==null?null:s.title)&&i.getAttribute("crossorigin")===(s.crossOrigin==null?null:s.crossOrigin)){l.splice(o,1);break t}}i=a.createElement(r),Je(i,r,s),a.head.appendChild(i);break;case"meta":if(l=mh("meta","content",a).get(r+(s.content||""))){for(o=0;o<l.length;o++)if(i=l[o],i.getAttribute("content")===(s.content==null?null:""+s.content)&&i.getAttribute("name")===(s.name==null?null:s.name)&&i.getAttribute("property")===(s.property==null?null:s.property)&&i.getAttribute("http-equiv")===(s.httpEquiv==null?null:s.httpEquiv)&&i.getAttribute("charset")===(s.charSet==null?null:s.charSet)){l.splice(o,1);break t}}i=a.createElement(r),Je(i,r,s),a.head.appendChild(i);break;default:throw Error(d(468,r))}i[Ke]=t,Ye(i),r=i}t.stateNode=r}else fh(a,t.type,t.stateNode);else t.stateNode=ph(a,r,t.memoizedProps);else i!==r?(i===null?s.stateNode!==null&&(s=s.stateNode,s.parentNode.removeChild(s)):i.count--,r===null?fh(a,t.type,t.stateNode):ph(a,r,t.memoizedProps)):r===null&&t.stateNode!==null&&Al(t,t.memoizedProps,s.memoizedProps)}break;case 27:at(n,t),it(t),r&512&&(He||s===null||Mt(s,s.return)),s!==null&&r&4&&Al(t,t.memoizedProps,s.memoizedProps);break;case 5:if(at(n,t),it(t),r&512&&(He||s===null||Mt(s,s.return)),t.flags&32){a=t.stateNode;try{ts(a,"")}catch(K){ve(t,t.return,K)}}r&4&&t.stateNode!=null&&(a=t.memoizedProps,Al(t,a,s!==null?s.memoizedProps:a)),r&1024&&(Dl=!0);break;case 6:if(at(n,t),it(t),r&4){if(t.stateNode===null)throw Error(d(162));r=t.memoizedProps,s=t.stateNode;try{s.nodeValue=r}catch(K){ve(t,t.return,K)}}break;case 3:if(Ma=null,a=Ot,Ot=Ia(n.containerInfo),at(n,t),Ot=a,it(t),r&4&&s!==null&&s.memoizedState.isDehydrated)try{Ds(n.containerInfo)}catch(K){ve(t,t.return,K)}Dl&&(Dl=!1,fu(t));break;case 4:r=Ot,Ot=Ia(t.stateNode.containerInfo),at(n,t),it(t),Ot=r;break;case 12:at(n,t),it(t);break;case 31:at(n,t),it(t),r&4&&(r=t.updateQueue,r!==null&&(t.updateQueue=null,ba(t,r)));break;case 13:at(n,t),it(t),t.child.flags&8192&&t.memoizedState!==null!=(s!==null&&s.memoizedState!==null)&&(Sa=ot()),r&4&&(r=t.updateQueue,r!==null&&(t.updateQueue=null,ba(t,r)));break;case 22:a=t.memoizedState!==null;var m=s!==null&&s.memoizedState!==null,k=Xt,z=He;if(Xt=k||a,He=z||m,at(n,t),He=z,Xt=k,it(t),r&8192)e:for(n=t.stateNode,n._visibility=a?n._visibility&-2:n._visibility|1,a&&(s===null||m||Xt||He||Vn(t)),s=null,n=t;;){if(n.tag===5||n.tag===26){if(s===null){m=s=n;try{if(i=m.stateNode,a)l=i.style,typeof l.setProperty=="function"?l.setProperty("display","none","important"):l.display="none";else{o=m.stateNode;var U=m.memoizedProps.style,E=U!=null&&U.hasOwnProperty("display")?U.display:null;o.style.display=E==null||typeof E=="boolean"?"":(""+E).trim()}}catch(K){ve(m,m.return,K)}}}else if(n.tag===6){if(s===null){m=n;try{m.stateNode.nodeValue=a?"":m.memoizedProps}catch(K){ve(m,m.return,K)}}}else if(n.tag===18){if(s===null){m=n;try{var N=m.stateNode;a?rh(N,!0):rh(m.stateNode,!1)}catch(K){ve(m,m.return,K)}}}else if((n.tag!==22&&n.tag!==23||n.memoizedState===null||n===t)&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break e;for(;n.sibling===null;){if(n.return===null||n.return===t)break e;s===n&&(s=null),n=n.return}s===n&&(s=null),n.sibling.return=n.return,n=n.sibling}r&4&&(r=t.updateQueue,r!==null&&(s=r.retryQueue,s!==null&&(r.retryQueue=null,ba(t,s))));break;case 19:at(n,t),it(t),r&4&&(r=t.updateQueue,r!==null&&(t.updateQueue=null,ba(t,r)));break;case 30:break;case 21:break;default:at(n,t),it(t)}}function it(t){var n=t.flags;if(n&2){try{for(var s,r=t.return;r!==null;){if(iu(r)){s=r;break}r=r.return}if(s==null)throw Error(d(160));switch(s.tag){case 27:var a=s.stateNode,i=Nl(t);ya(t,i,a);break;case 5:var l=s.stateNode;s.flags&32&&(ts(l,""),s.flags&=-33);var o=Nl(t);ya(t,o,l);break;case 3:case 4:var m=s.stateNode.containerInfo,k=Nl(t);Ol(t,k,m);break;default:throw Error(d(161))}}catch(z){ve(t,t.return,z)}t.flags&=-3}n&4096&&(t.flags&=-4097)}function fu(t){if(t.subtreeFlags&1024)for(t=t.child;t!==null;){var n=t;fu(n),n.tag===5&&n.flags&1024&&n.stateNode.reset(),t=t.sibling}}function $t(t,n){if(n.subtreeFlags&8772)for(n=n.child;n!==null;)ou(t,n.alternate,n),n=n.sibling}function Vn(t){for(t=t.child;t!==null;){var n=t;switch(n.tag){case 0:case 11:case 14:case 15:jn(4,n,n.return),Vn(n);break;case 1:Mt(n,n.return);var s=n.stateNode;typeof s.componentWillUnmount=="function"&&ru(n,n.return,s),Vn(n);break;case 27:yr(n.stateNode);case 26:case 5:Mt(n,n.return),Vn(n);break;case 22:n.memoizedState===null&&Vn(n);break;case 30:Vn(n);break;default:Vn(n)}t=t.sibling}}function en(t,n,s){for(s=s&&(n.subtreeFlags&8772)!==0,n=n.child;n!==null;){var r=n.alternate,a=t,i=n,l=i.flags;switch(i.tag){case 0:case 11:case 15:en(a,i,s),or(4,i);break;case 1:if(en(a,i,s),r=i,a=r.stateNode,typeof a.componentDidMount=="function")try{a.componentDidMount()}catch(k){ve(r,r.return,k)}if(r=i,a=r.updateQueue,a!==null){var o=r.stateNode;try{var m=a.shared.hiddenCallbacks;if(m!==null)for(a.shared.hiddenCallbacks=null,a=0;a<m.length;a++)Go(m[a],o)}catch(k){ve(r,r.return,k)}}s&&l&64&&su(i),dr(i,i.return);break;case 27:lu(i);case 26:case 5:en(a,i,s),s&&r===null&&l&4&&au(i),dr(i,i.return);break;case 12:en(a,i,s);break;case 31:en(a,i,s),s&&l&4&&hu(a,i);break;case 13:en(a,i,s),s&&l&4&&pu(a,i);break;case 22:i.memoizedState===null&&en(a,i,s),dr(i,i.return);break;case 30:break;default:en(a,i,s)}n=n.sibling}}function zl(t,n){var s=null;t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(s=t.memoizedState.cachePool.pool),t=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(t=n.memoizedState.cachePool.pool),t!==s&&(t!=null&&t.refCount++,s!=null&&Zs(s))}function Il(t,n){t=null,n.alternate!==null&&(t=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==t&&(n.refCount++,t!=null&&Zs(t))}function Dt(t,n,s,r){if(n.subtreeFlags&10256)for(n=n.child;n!==null;)xu(t,n,s,r),n=n.sibling}function xu(t,n,s,r){var a=n.flags;switch(n.tag){case 0:case 11:case 15:Dt(t,n,s,r),a&2048&&or(9,n);break;case 1:Dt(t,n,s,r);break;case 3:Dt(t,n,s,r),a&2048&&(t=null,n.alternate!==null&&(t=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==t&&(n.refCount++,t!=null&&Zs(t)));break;case 12:if(a&2048){Dt(t,n,s,r),t=n.stateNode;try{var i=n.memoizedProps,l=i.id,o=i.onPostCommit;typeof o=="function"&&o(l,n.alternate===null?"mount":"update",t.passiveEffectDuration,-0)}catch(m){ve(n,n.return,m)}}else Dt(t,n,s,r);break;case 31:Dt(t,n,s,r);break;case 13:Dt(t,n,s,r);break;case 23:break;case 22:i=n.stateNode,l=n.alternate,n.memoizedState!==null?i._visibility&2?Dt(t,n,s,r):ur(t,n):i._visibility&2?Dt(t,n,s,r):(i._visibility|=2,vs(t,n,s,r,(n.subtreeFlags&10256)!==0||!1)),a&2048&&zl(l,n);break;case 24:Dt(t,n,s,r),a&2048&&Il(n.alternate,n);break;default:Dt(t,n,s,r)}}function vs(t,n,s,r,a){for(a=a&&((n.subtreeFlags&10256)!==0||!1),n=n.child;n!==null;){var i=t,l=n,o=s,m=r,k=l.flags;switch(l.tag){case 0:case 11:case 15:vs(i,l,o,m,a),or(8,l);break;case 23:break;case 22:var z=l.stateNode;l.memoizedState!==null?z._visibility&2?vs(i,l,o,m,a):ur(i,l):(z._visibility|=2,vs(i,l,o,m,a)),a&&k&2048&&zl(l.alternate,l);break;case 24:vs(i,l,o,m,a),a&&k&2048&&Il(l.alternate,l);break;default:vs(i,l,o,m,a)}n=n.sibling}}function ur(t,n){if(n.subtreeFlags&10256)for(n=n.child;n!==null;){var s=t,r=n,a=r.flags;switch(r.tag){case 22:ur(s,r),a&2048&&zl(r.alternate,r);break;case 24:ur(s,r),a&2048&&Il(r.alternate,r);break;default:ur(s,r)}n=n.sibling}}var hr=8192;function Ss(t,n,s){if(t.subtreeFlags&hr)for(t=t.child;t!==null;)ju(t,n,s),t=t.sibling}function ju(t,n,s){switch(t.tag){case 26:Ss(t,n,s),t.flags&hr&&t.memoizedState!==null&&yf(s,Ot,t.memoizedState,t.memoizedProps);break;case 5:Ss(t,n,s);break;case 3:case 4:var r=Ot;Ot=Ia(t.stateNode.containerInfo),Ss(t,n,s),Ot=r;break;case 22:t.memoizedState===null&&(r=t.alternate,r!==null&&r.memoizedState!==null?(r=hr,hr=16777216,Ss(t,n,s),hr=r):Ss(t,n,s));break;default:Ss(t,n,s)}}function gu(t){var n=t.alternate;if(n!==null&&(t=n.child,t!==null)){n.child=null;do n=t.sibling,t.sibling=null,t=n;while(t!==null)}}function pr(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var s=0;s<n.length;s++){var r=n[s];Ge=r,bu(r,t)}gu(t)}if(t.subtreeFlags&10256)for(t=t.child;t!==null;)yu(t),t=t.sibling}function yu(t){switch(t.tag){case 0:case 11:case 15:pr(t),t.flags&2048&&jn(9,t,t.return);break;case 3:pr(t);break;case 12:pr(t);break;case 22:var n=t.stateNode;t.memoizedState!==null&&n._visibility&2&&(t.return===null||t.return.tag!==13)?(n._visibility&=-3,va(t)):pr(t);break;default:pr(t)}}function va(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var s=0;s<n.length;s++){var r=n[s];Ge=r,bu(r,t)}gu(t)}for(t=t.child;t!==null;){switch(n=t,n.tag){case 0:case 11:case 15:jn(8,n,n.return),va(n);break;case 22:s=n.stateNode,s._visibility&2&&(s._visibility&=-3,va(n));break;default:va(n)}t=t.sibling}}function bu(t,n){for(;Ge!==null;){var s=Ge;switch(s.tag){case 0:case 11:case 15:jn(8,s,n);break;case 23:case 22:if(s.memoizedState!==null&&s.memoizedState.cachePool!==null){var r=s.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:Zs(s.memoizedState.cache)}if(r=s.child,r!==null)r.return=s,Ge=r;else e:for(s=t;Ge!==null;){r=Ge;var a=r.sibling,i=r.return;if(du(r),r===s){Ge=null;break e}if(a!==null){a.return=i,Ge=a;break e}Ge=i}}}var zm={getCacheForType:function(t){var n=Ze(Pe),s=n.data.get(t);return s===void 0&&(s=t(),n.data.set(t,s)),s},cacheSignal:function(){return Ze(Pe).controller.signal}},Im=typeof WeakMap=="function"?WeakMap:Map,je=0,ke=null,le=null,de=0,be=0,xt=null,gn=!1,Ts=!1,_l=!1,tn=0,_e=0,yn=0,Kn=0,Ml=0,jt=0,ws=0,mr=null,lt=null,ql=!1,Sa=0,vu=0,Ta=1/0,wa=null,bn=null,Qe=0,vn=null,ks=null,nn=0,Ul=0,Pl=null,Su=null,fr=0,Ll=null;function gt(){return(je&2)!==0&&de!==0?de&-de:D.T!==null?Gl():qc()}function Tu(){if(jt===0)if((de&536870912)===0||pe){var t=Dr;Dr<<=1,(Dr&3932160)===0&&(Dr=262144),jt=t}else jt=536870912;return t=mt.current,t!==null&&(t.flags|=32),jt}function ct(t,n,s){(t===ke&&(be===2||be===9)||t.cancelPendingCommit!==null)&&(Cs(t,0),Sn(t,de,jt,!1)),Ms(t,s),((je&2)===0||t!==ke)&&(t===ke&&((je&2)===0&&(Kn|=s),_e===4&&Sn(t,de,jt,!1)),qt(t))}function wu(t,n,s){if((je&6)!==0)throw Error(d(327));var r=!s&&(n&127)===0&&(n&t.expiredLanes)===0||_s(t,n),a=r?qm(t,n):Hl(t,n,!0),i=r;do{if(a===0){Ts&&!r&&Sn(t,n,0,!1);break}else{if(s=t.current.alternate,i&&!_m(s)){a=Hl(t,n,!1),i=!1;continue}if(a===2){if(i=n,t.errorRecoveryDisabledLanes&i)var l=0;else l=t.pendingLanes&-536870913,l=l!==0?l:l&536870912?536870912:0;if(l!==0){n=l;e:{var o=t;a=mr;var m=o.current.memoizedState.isDehydrated;if(m&&(Cs(o,l).flags|=256),l=Hl(o,l,!1),l!==2){if(_l&&!m){o.errorRecoveryDisabledLanes|=i,Kn|=i,a=4;break e}i=lt,lt=a,i!==null&&(lt===null?lt=i:lt.push.apply(lt,i))}a=l}if(i=!1,a!==2)continue}}if(a===1){Cs(t,0),Sn(t,n,0,!0);break}e:{switch(r=t,i=a,i){case 0:case 1:throw Error(d(345));case 4:if((n&4194048)!==n)break;case 6:Sn(r,n,jt,!gn);break e;case 2:lt=null;break;case 3:case 5:break;default:throw Error(d(329))}if((n&62914560)===n&&(a=Sa+300-ot(),10<a)){if(Sn(r,n,jt,!gn),Ir(r,0,!0)!==0)break e;nn=n,r.timeoutHandle=th(ku.bind(null,r,s,lt,wa,ql,n,jt,Kn,ws,gn,i,"Throttled",-0,0),a);break e}ku(r,s,lt,wa,ql,n,jt,Kn,ws,gn,i,null,-0,0)}}break}while(!0);qt(t)}function ku(t,n,s,r,a,i,l,o,m,k,z,U,E,N){if(t.timeoutHandle=-1,U=n.subtreeFlags,U&8192||(U&16785408)===16785408){U={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:Bt},ju(n,i,U);var K=(i&62914560)===i?Sa-ot():(i&4194048)===i?vu-ot():0;if(K=bf(U,K),K!==null){nn=i,t.cancelPendingCommit=K(zu.bind(null,t,n,i,s,r,a,l,o,m,z,U,null,E,N)),Sn(t,i,l,!k);return}}zu(t,n,i,s,r,a,l,o,m)}function _m(t){for(var n=t;;){var s=n.tag;if((s===0||s===11||s===15)&&n.flags&16384&&(s=n.updateQueue,s!==null&&(s=s.stores,s!==null)))for(var r=0;r<s.length;r++){var a=s[r],i=a.getSnapshot;a=a.value;try{if(!ht(i(),a))return!1}catch{return!1}}if(s=n.child,n.subtreeFlags&16384&&s!==null)s.return=n,n=s;else{if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function Sn(t,n,s,r){n&=~Ml,n&=~Kn,t.suspendedLanes|=n,t.pingedLanes&=~n,r&&(t.warmLanes|=n),r=t.expirationTimes;for(var a=n;0<a;){var i=31-ut(a),l=1<<i;r[i]=-1,a&=~l}s!==0&&Ic(t,s,n)}function ka(){return(je&6)===0?(xr(0),!1):!0}function Bl(){if(le!==null){if(be===0)var t=le.return;else t=le,Yt=Pn=null,sl(t),xs=null,Js=0,t=le;for(;t!==null;)nu(t.alternate,t),t=t.return;le=null}}function Cs(t,n){var s=t.timeoutHandle;s!==-1&&(t.timeoutHandle=-1,tf(s)),s=t.cancelPendingCommit,s!==null&&(t.cancelPendingCommit=null,s()),nn=0,Bl(),ke=t,le=s=Qt(t.current,null),de=n,be=0,xt=null,gn=!1,Ts=_s(t,n),_l=!1,ws=jt=Ml=Kn=yn=_e=0,lt=mr=null,ql=!1,(n&8)!==0&&(n|=n&32);var r=t.entangledLanes;if(r!==0)for(t=t.entanglements,r&=n;0<r;){var a=31-ut(r),i=1<<a;n|=t[a],r&=~i}return tn=n,Gr(),s}function Cu(t,n){se=null,D.H=ir,n===fs||n===ea?(n=Ho(),be=3):n===Yi?(n=Ho(),be=4):be=n===yl?8:n!==null&&typeof n=="object"&&typeof n.then=="function"?6:1,xt=n,le===null&&(_e=1,ma(t,Tt(n,t.current)))}function Ru(){var t=mt.current;return t===null?!0:(de&4194048)===de?Rt===null:(de&62914560)===de||(de&536870912)!==0?t===Rt:!1}function Eu(){var t=D.H;return D.H=ir,t===null?ir:t}function Au(){var t=D.A;return D.A=zm,t}function Ca(){_e=4,gn||(de&4194048)!==de&&mt.current!==null||(Ts=!0),(yn&134217727)===0&&(Kn&134217727)===0||ke===null||Sn(ke,de,jt,!1)}function Hl(t,n,s){var r=je;je|=2;var a=Eu(),i=Au();(ke!==t||de!==n)&&(wa=null,Cs(t,n)),n=!1;var l=_e;e:do try{if(be!==0&&le!==null){var o=le,m=xt;switch(be){case 8:Bl(),l=6;break e;case 3:case 2:case 9:case 6:mt.current===null&&(n=!0);var k=be;if(be=0,xt=null,Rs(t,o,m,k),s&&Ts){l=0;break e}break;default:k=be,be=0,xt=null,Rs(t,o,m,k)}}Mm(),l=_e;break}catch(z){Cu(t,z)}while(!0);return n&&t.shellSuspendCounter++,Yt=Pn=null,je=r,D.H=a,D.A=i,le===null&&(ke=null,de=0,Gr()),l}function Mm(){for(;le!==null;)Nu(le)}function qm(t,n){var s=je;je|=2;var r=Eu(),a=Au();ke!==t||de!==n?(wa=null,Ta=ot()+500,Cs(t,n)):Ts=_s(t,n);e:do try{if(be!==0&&le!==null){n=le;var i=xt;t:switch(be){case 1:be=0,xt=null,Rs(t,n,i,1);break;case 2:case 9:if(Lo(i)){be=0,xt=null,Ou(n);break}n=function(){be!==2&&be!==9||ke!==t||(be=7),qt(t)},i.then(n,n);break e;case 3:be=7;break e;case 4:be=5;break e;case 7:Lo(i)?(be=0,xt=null,Ou(n)):(be=0,xt=null,Rs(t,n,i,7));break;case 5:var l=null;switch(le.tag){case 26:l=le.memoizedState;case 5:case 27:var o=le;if(l?xh(l):o.stateNode.complete){be=0,xt=null;var m=o.sibling;if(m!==null)le=m;else{var k=o.return;k!==null?(le=k,Ra(k)):le=null}break t}}be=0,xt=null,Rs(t,n,i,5);break;case 6:be=0,xt=null,Rs(t,n,i,6);break;case 8:Bl(),_e=6;break e;default:throw Error(d(462))}}Um();break}catch(z){Cu(t,z)}while(!0);return Yt=Pn=null,D.H=r,D.A=a,je=s,le!==null?0:(ke=null,de=0,Gr(),_e)}function Um(){for(;le!==null&&!lp();)Nu(le)}function Nu(t){var n=eu(t.alternate,t,tn);t.memoizedProps=t.pendingProps,n===null?Ra(t):le=n}function Ou(t){var n=t,s=n.alternate;switch(n.tag){case 15:case 0:n=Kd(s,n,n.pendingProps,n.type,void 0,de);break;case 11:n=Kd(s,n,n.pendingProps,n.type.render,n.ref,de);break;case 5:sl(n);default:nu(s,n),n=le=Ao(n,tn),n=eu(s,n,tn)}t.memoizedProps=t.pendingProps,n===null?Ra(t):le=n}function Rs(t,n,s,r){Yt=Pn=null,sl(n),xs=null,Js=0;var a=n.return;try{if(Cm(t,a,n,s,de)){_e=1,ma(t,Tt(s,t.current)),le=null;return}}catch(i){if(a!==null)throw le=a,i;_e=1,ma(t,Tt(s,t.current)),le=null;return}n.flags&32768?(pe||r===1?t=!0:Ts||(de&536870912)!==0?t=!1:(gn=t=!0,(r===2||r===9||r===3||r===6)&&(r=mt.current,r!==null&&r.tag===13&&(r.flags|=16384))),Du(n,t)):Ra(n)}function Ra(t){var n=t;do{if((n.flags&32768)!==0){Du(n,gn);return}t=n.return;var s=Am(n.alternate,n,tn);if(s!==null){le=s;return}if(n=n.sibling,n!==null){le=n;return}le=n=t}while(n!==null);_e===0&&(_e=5)}function Du(t,n){do{var s=Nm(t.alternate,t);if(s!==null){s.flags&=32767,le=s;return}if(s=t.return,s!==null&&(s.flags|=32768,s.subtreeFlags=0,s.deletions=null),!n&&(t=t.sibling,t!==null)){le=t;return}le=t=s}while(t!==null);_e=6,le=null}function zu(t,n,s,r,a,i,l,o,m){t.cancelPendingCommit=null;do Ea();while(Qe!==0);if((je&6)!==0)throw Error(d(327));if(n!==null){if(n===t.current)throw Error(d(177));if(i=n.lanes|n.childLanes,i|=Ni,jp(t,s,i,l,o,m),t===ke&&(le=ke=null,de=0),ks=n,vn=t,nn=s,Ul=i,Pl=a,Su=r,(n.subtreeFlags&10256)!==0||(n.flags&10256)!==0?(t.callbackNode=null,t.callbackPriority=0,Hm(Nr,function(){return Uu(),null})):(t.callbackNode=null,t.callbackPriority=0),r=(n.flags&13878)!==0,(n.subtreeFlags&13878)!==0||r){r=D.T,D.T=null,a=F.p,F.p=2,l=je,je|=4;try{Om(t,n,s)}finally{je=l,F.p=a,D.T=r}}Qe=1,Iu(),_u(),Mu()}}function Iu(){if(Qe===1){Qe=0;var t=vn,n=ks,s=(n.flags&13878)!==0;if((n.subtreeFlags&13878)!==0||s){s=D.T,D.T=null;var r=F.p;F.p=2;var a=je;je|=4;try{mu(n,t);var i=ec,l=bo(t.containerInfo),o=i.focusedElem,m=i.selectionRange;if(l!==o&&o&&o.ownerDocument&&yo(o.ownerDocument.documentElement,o)){if(m!==null&&ki(o)){var k=m.start,z=m.end;if(z===void 0&&(z=k),"selectionStart"in o)o.selectionStart=k,o.selectionEnd=Math.min(z,o.value.length);else{var U=o.ownerDocument||document,E=U&&U.defaultView||window;if(E.getSelection){var N=E.getSelection(),K=o.textContent.length,ee=Math.min(m.start,K),we=m.end===void 0?ee:Math.min(m.end,K);!N.extend&&ee>we&&(l=we,we=ee,ee=l);var b=go(o,ee),x=go(o,we);if(b&&x&&(N.rangeCount!==1||N.anchorNode!==b.node||N.anchorOffset!==b.offset||N.focusNode!==x.node||N.focusOffset!==x.offset)){var w=U.createRange();w.setStart(b.node,b.offset),N.removeAllRanges(),ee>we?(N.addRange(w),N.extend(x.node,x.offset)):(w.setEnd(x.node,x.offset),N.addRange(w))}}}}for(U=[],N=o;N=N.parentNode;)N.nodeType===1&&U.push({element:N,left:N.scrollLeft,top:N.scrollTop});for(typeof o.focus=="function"&&o.focus(),o=0;o<U.length;o++){var M=U[o];M.element.scrollLeft=M.left,M.element.scrollTop=M.top}}La=!!$l,ec=$l=null}finally{je=a,F.p=r,D.T=s}}t.current=n,Qe=2}}function _u(){if(Qe===2){Qe=0;var t=vn,n=ks,s=(n.flags&8772)!==0;if((n.subtreeFlags&8772)!==0||s){s=D.T,D.T=null;var r=F.p;F.p=2;var a=je;je|=4;try{ou(t,n.alternate,n)}finally{je=a,F.p=r,D.T=s}}Qe=3}}function Mu(){if(Qe===4||Qe===3){Qe=0,cp();var t=vn,n=ks,s=nn,r=Su;(n.subtreeFlags&10256)!==0||(n.flags&10256)!==0?Qe=5:(Qe=0,ks=vn=null,qu(t,t.pendingLanes));var a=t.pendingLanes;if(a===0&&(bn=null),ii(s),n=n.stateNode,dt&&typeof dt.onCommitFiberRoot=="function")try{dt.onCommitFiberRoot(Is,n,void 0,(n.current.flags&128)===128)}catch{}if(r!==null){n=D.T,a=F.p,F.p=2,D.T=null;try{for(var i=t.onRecoverableError,l=0;l<r.length;l++){var o=r[l];i(o.value,{componentStack:o.stack})}}finally{D.T=n,F.p=a}}(nn&3)!==0&&Ea(),qt(t),a=t.pendingLanes,(s&261930)!==0&&(a&42)!==0?t===Ll?fr++:(fr=0,Ll=t):fr=0,xr(0)}}function qu(t,n){(t.pooledCacheLanes&=n)===0&&(n=t.pooledCache,n!=null&&(t.pooledCache=null,Zs(n)))}function Ea(){return Iu(),_u(),Mu(),Uu()}function Uu(){if(Qe!==5)return!1;var t=vn,n=Ul;Ul=0;var s=ii(nn),r=D.T,a=F.p;try{F.p=32>s?32:s,D.T=null,s=Pl,Pl=null;var i=vn,l=nn;if(Qe=0,ks=vn=null,nn=0,(je&6)!==0)throw Error(d(331));var o=je;if(je|=4,yu(i.current),xu(i,i.current,l,s),je=o,xr(0,!1),dt&&typeof dt.onPostCommitFiberRoot=="function")try{dt.onPostCommitFiberRoot(Is,i)}catch{}return!0}finally{F.p=a,D.T=r,qu(t,n)}}function Pu(t,n,s){n=Tt(s,n),n=gl(t.stateNode,n,2),t=mn(t,n,2),t!==null&&(Ms(t,2),qt(t))}function ve(t,n,s){if(t.tag===3)Pu(t,t,s);else for(;n!==null;){if(n.tag===3){Pu(n,t,s);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(bn===null||!bn.has(r))){t=Tt(s,t),s=Ld(2),r=mn(n,s,2),r!==null&&(Bd(s,r,n,t),Ms(r,2),qt(r));break}}n=n.return}}function Ql(t,n,s){var r=t.pingCache;if(r===null){r=t.pingCache=new Im;var a=new Set;r.set(n,a)}else a=r.get(n),a===void 0&&(a=new Set,r.set(n,a));a.has(s)||(_l=!0,a.add(s),t=Pm.bind(null,t,n,s),n.then(t,t))}function Pm(t,n,s){var r=t.pingCache;r!==null&&r.delete(n),t.pingedLanes|=t.suspendedLanes&s,t.warmLanes&=~s,ke===t&&(de&s)===s&&(_e===4||_e===3&&(de&62914560)===de&&300>ot()-Sa?(je&2)===0&&Cs(t,0):Ml|=s,ws===de&&(ws=0)),qt(t)}function Lu(t,n){n===0&&(n=zc()),t=Mn(t,n),t!==null&&(Ms(t,n),qt(t))}function Lm(t){var n=t.memoizedState,s=0;n!==null&&(s=n.retryLane),Lu(t,s)}function Bm(t,n){var s=0;switch(t.tag){case 31:case 13:var r=t.stateNode,a=t.memoizedState;a!==null&&(s=a.retryLane);break;case 19:r=t.stateNode;break;case 22:r=t.stateNode._retryCache;break;default:throw Error(d(314))}r!==null&&r.delete(n),Lu(t,s)}function Hm(t,n){return ni(t,n)}var Aa=null,Es=null,Fl=!1,Na=!1,Yl=!1,Tn=0;function qt(t){t!==Es&&t.next===null&&(Es===null?Aa=Es=t:Es=Es.next=t),Na=!0,Fl||(Fl=!0,Fm())}function xr(t,n){if(!Yl&&Na){Yl=!0;do for(var s=!1,r=Aa;r!==null;){if(t!==0){var a=r.pendingLanes;if(a===0)var i=0;else{var l=r.suspendedLanes,o=r.pingedLanes;i=(1<<31-ut(42|t)+1)-1,i&=a&~(l&~o),i=i&201326741?i&201326741|1:i?i|2:0}i!==0&&(s=!0,Fu(r,i))}else i=de,i=Ir(r,r===ke?i:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),(i&3)===0||_s(r,i)||(s=!0,Fu(r,i));r=r.next}while(s);Yl=!1}}function Qm(){Bu()}function Bu(){Na=Fl=!1;var t=0;Tn!==0&&ef()&&(t=Tn);for(var n=ot(),s=null,r=Aa;r!==null;){var a=r.next,i=Hu(r,n);i===0?(r.next=null,s===null?Aa=a:s.next=a,a===null&&(Es=s)):(s=r,(t!==0||(i&3)!==0)&&(Na=!0)),r=a}Qe!==0&&Qe!==5||xr(t),Tn!==0&&(Tn=0)}function Hu(t,n){for(var s=t.suspendedLanes,r=t.pingedLanes,a=t.expirationTimes,i=t.pendingLanes&-62914561;0<i;){var l=31-ut(i),o=1<<l,m=a[l];m===-1?((o&s)===0||(o&r)!==0)&&(a[l]=xp(o,n)):m<=n&&(t.expiredLanes|=o),i&=~o}if(n=ke,s=de,s=Ir(t,t===n?s:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r=t.callbackNode,s===0||t===n&&(be===2||be===9)||t.cancelPendingCommit!==null)return r!==null&&r!==null&&si(r),t.callbackNode=null,t.callbackPriority=0;if((s&3)===0||_s(t,s)){if(n=s&-s,n===t.callbackPriority)return n;switch(r!==null&&si(r),ii(s)){case 2:case 8:s=Oc;break;case 32:s=Nr;break;case 268435456:s=Dc;break;default:s=Nr}return r=Qu.bind(null,t),s=ni(s,r),t.callbackPriority=n,t.callbackNode=s,n}return r!==null&&r!==null&&si(r),t.callbackPriority=2,t.callbackNode=null,2}function Qu(t,n){if(Qe!==0&&Qe!==5)return t.callbackNode=null,t.callbackPriority=0,null;var s=t.callbackNode;if(Ea()&&t.callbackNode!==s)return null;var r=de;return r=Ir(t,t===ke?r:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),r===0?null:(wu(t,r,n),Hu(t,ot()),t.callbackNode!=null&&t.callbackNode===s?Qu.bind(null,t):null)}function Fu(t,n){if(Ea())return null;wu(t,n,!0)}function Fm(){nf(function(){(je&6)!==0?ni(Nc,Qm):Bu()})}function Gl(){if(Tn===0){var t=ps;t===0&&(t=Or,Or<<=1,(Or&261888)===0&&(Or=256)),Tn=t}return Tn}function Yu(t){return t==null||typeof t=="symbol"||typeof t=="boolean"?null:typeof t=="function"?t:Ur(""+t)}function Gu(t,n){var s=n.ownerDocument.createElement("input");return s.name=n.name,s.value=n.value,t.id&&s.setAttribute("form",t.id),n.parentNode.insertBefore(s,n),t=new FormData(t),s.parentNode.removeChild(s),t}function Ym(t,n,s,r,a){if(n==="submit"&&s&&s.stateNode===a){var i=Yu((a[nt]||null).action),l=r.submitter;l&&(n=(n=l[nt]||null)?Yu(n.formAction):l.getAttribute("formAction"),n!==null&&(i=n,l=null));var o=new Hr("action","action",null,r,a);t.push({event:o,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(Tn!==0){var m=l?Gu(a,l):new FormData(a);hl(s,{pending:!0,data:m,method:a.method,action:i},null,m)}}else typeof i=="function"&&(o.preventDefault(),m=l?Gu(a,l):new FormData(a),hl(s,{pending:!0,data:m,method:a.method,action:i},i,m))},currentTarget:a}]})}}for(var Vl=0;Vl<Ai.length;Vl++){var Kl=Ai[Vl],Gm=Kl.toLowerCase(),Vm=Kl[0].toUpperCase()+Kl.slice(1);Nt(Gm,"on"+Vm)}Nt(To,"onAnimationEnd"),Nt(wo,"onAnimationIteration"),Nt(ko,"onAnimationStart"),Nt("dblclick","onDoubleClick"),Nt("focusin","onFocus"),Nt("focusout","onBlur"),Nt(om,"onTransitionRun"),Nt(dm,"onTransitionStart"),Nt(um,"onTransitionCancel"),Nt(Co,"onTransitionEnd"),$n("onMouseEnter",["mouseout","mouseover"]),$n("onMouseLeave",["mouseout","mouseover"]),$n("onPointerEnter",["pointerout","pointerover"]),$n("onPointerLeave",["pointerout","pointerover"]),Dn("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),Dn("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),Dn("onBeforeInput",["compositionend","keypress","textInput","paste"]),Dn("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),Dn("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),Dn("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var jr="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Km=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(jr));function Vu(t,n){n=(n&4)!==0;for(var s=0;s<t.length;s++){var r=t[s],a=r.event;r=r.listeners;e:{var i=void 0;if(n)for(var l=r.length-1;0<=l;l--){var o=r[l],m=o.instance,k=o.currentTarget;if(o=o.listener,m!==i&&a.isPropagationStopped())break e;i=o,a.currentTarget=k;try{i(a)}catch(z){Yr(z)}a.currentTarget=null,i=m}else for(l=0;l<r.length;l++){if(o=r[l],m=o.instance,k=o.currentTarget,o=o.listener,m!==i&&a.isPropagationStopped())break e;i=o,a.currentTarget=k;try{i(a)}catch(z){Yr(z)}a.currentTarget=null,i=m}}}}function ce(t,n){var s=n[li];s===void 0&&(s=n[li]=new Set);var r=t+"__bubble";s.has(r)||(Ku(n,t,2,!1),s.add(r))}function Wl(t,n,s){var r=0;n&&(r|=4),Ku(s,t,r,n)}var Oa="_reactListening"+Math.random().toString(36).slice(2);function Zl(t){if(!t[Oa]){t[Oa]=!0,Lc.forEach(function(s){s!=="selectionchange"&&(Km.has(s)||Wl(s,!1,t),Wl(s,!0,t))});var n=t.nodeType===9?t:t.ownerDocument;n===null||n[Oa]||(n[Oa]=!0,Wl("selectionchange",!1,n))}}function Ku(t,n,s,r){switch(Th(n)){case 2:var a=Tf;break;case 8:a=wf;break;default:a=uc}s=a.bind(null,n,s,t),a=void 0,!xi||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(a=!0),r?a!==void 0?t.addEventListener(n,s,{capture:!0,passive:a}):t.addEventListener(n,s,!0):a!==void 0?t.addEventListener(n,s,{passive:a}):t.addEventListener(n,s,!1)}function Xl(t,n,s,r,a){var i=r;if((n&1)===0&&(n&2)===0&&r!==null)e:for(;;){if(r===null)return;var l=r.tag;if(l===3||l===4){var o=r.stateNode.containerInfo;if(o===a)break;if(l===4)for(l=r.return;l!==null;){var m=l.tag;if((m===3||m===4)&&l.stateNode.containerInfo===a)return;l=l.return}for(;o!==null;){if(l=Zn(o),l===null)return;if(m=l.tag,m===5||m===6||m===26||m===27){r=i=l;continue e}o=o.parentNode}}r=r.return}Jc(function(){var k=i,z=mi(s),U=[];e:{var E=Ro.get(t);if(E!==void 0){var N=Hr,K=t;switch(t){case"keypress":if(Lr(s)===0)break e;case"keydown":case"keyup":N=Bp;break;case"focusin":K="focus",N=bi;break;case"focusout":K="blur",N=bi;break;case"beforeblur":case"afterblur":N=bi;break;case"click":if(s.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":N=to;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":N=Ap;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":N=Fp;break;case To:case wo:case ko:N=Dp;break;case Co:N=Gp;break;case"scroll":case"scrollend":N=Rp;break;case"wheel":N=Kp;break;case"copy":case"cut":case"paste":N=Ip;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":N=so;break;case"toggle":case"beforetoggle":N=Zp}var ee=(n&4)!==0,we=!ee&&(t==="scroll"||t==="scrollend"),b=ee?E!==null?E+"Capture":null:E;ee=[];for(var x=k,w;x!==null;){var M=x;if(w=M.stateNode,M=M.tag,M!==5&&M!==26&&M!==27||w===null||b===null||(M=Ps(x,b),M!=null&&ee.push(gr(x,M,w))),we)break;x=x.return}0<ee.length&&(E=new N(E,K,null,s,z),U.push({event:E,listeners:ee}))}}if((n&7)===0){e:{if(E=t==="mouseover"||t==="pointerover",N=t==="mouseout"||t==="pointerout",E&&s!==pi&&(K=s.relatedTarget||s.fromElement)&&(Zn(K)||K[Wn]))break e;if((N||E)&&(E=z.window===z?z:(E=z.ownerDocument)?E.defaultView||E.parentWindow:window,N?(K=s.relatedTarget||s.toElement,N=k,K=K?Zn(K):null,K!==null&&(we=I(K),ee=K.tag,K!==we||ee!==5&&ee!==27&&ee!==6)&&(K=null)):(N=null,K=k),N!==K)){if(ee=to,M="onMouseLeave",b="onMouseEnter",x="mouse",(t==="pointerout"||t==="pointerover")&&(ee=so,M="onPointerLeave",b="onPointerEnter",x="pointer"),we=N==null?E:Us(N),w=K==null?E:Us(K),E=new ee(M,x+"leave",N,s,z),E.target=we,E.relatedTarget=w,M=null,Zn(z)===k&&(ee=new ee(b,x+"enter",K,s,z),ee.target=w,ee.relatedTarget=we,M=ee),we=M,N&&K)t:{for(ee=Wm,b=N,x=K,w=0,M=b;M;M=ee(M))w++;M=0;for(var $=x;$;$=ee($))M++;for(;0<w-M;)b=ee(b),w--;for(;0<M-w;)x=ee(x),M--;for(;w--;){if(b===x||x!==null&&b===x.alternate){ee=b;break t}b=ee(b),x=ee(x)}ee=null}else ee=null;N!==null&&Wu(U,E,N,ee,!1),K!==null&&we!==null&&Wu(U,we,K,ee,!0)}}e:{if(E=k?Us(k):window,N=E.nodeName&&E.nodeName.toLowerCase(),N==="select"||N==="input"&&E.type==="file")var me=ho;else if(oo(E))if(po)me=im;else{me=rm;var W=sm}else N=E.nodeName,!N||N.toLowerCase()!=="input"||E.type!=="checkbox"&&E.type!=="radio"?k&&hi(k.elementType)&&(me=ho):me=am;if(me&&(me=me(t,k))){uo(U,me,s,z);break e}W&&W(t,E,k),t==="focusout"&&k&&E.type==="number"&&k.memoizedProps.value!=null&&ui(E,"number",E.value)}switch(W=k?Us(k):window,t){case"focusin":(oo(W)||W.contentEditable==="true")&&(as=W,Ci=k,Vs=null);break;case"focusout":Vs=Ci=as=null;break;case"mousedown":Ri=!0;break;case"contextmenu":case"mouseup":case"dragend":Ri=!1,vo(U,s,z);break;case"selectionchange":if(cm)break;case"keydown":case"keyup":vo(U,s,z)}var ae;if(Si)e:{switch(t){case"compositionstart":var ue="onCompositionStart";break e;case"compositionend":ue="onCompositionEnd";break e;case"compositionupdate":ue="onCompositionUpdate";break e}ue=void 0}else rs?lo(t,s)&&(ue="onCompositionEnd"):t==="keydown"&&s.keyCode===229&&(ue="onCompositionStart");ue&&(ro&&s.locale!=="ko"&&(rs||ue!=="onCompositionStart"?ue==="onCompositionEnd"&&rs&&(ae=$c()):(ln=z,ji="value"in ln?ln.value:ln.textContent,rs=!0)),W=Da(k,ue),0<W.length&&(ue=new no(ue,t,null,s,z),U.push({event:ue,listeners:W}),ae?ue.data=ae:(ae=co(s),ae!==null&&(ue.data=ae)))),(ae=Jp?$p(t,s):em(t,s))&&(ue=Da(k,"onBeforeInput"),0<ue.length&&(W=new no("onBeforeInput","beforeinput",null,s,z),U.push({event:W,listeners:ue}),W.data=ae)),Ym(U,t,k,s,z)}Vu(U,n)})}function gr(t,n,s){return{instance:t,listener:n,currentTarget:s}}function Da(t,n){for(var s=n+"Capture",r=[];t!==null;){var a=t,i=a.stateNode;if(a=a.tag,a!==5&&a!==26&&a!==27||i===null||(a=Ps(t,s),a!=null&&r.unshift(gr(t,a,i)),a=Ps(t,n),a!=null&&r.push(gr(t,a,i))),t.tag===3)return r;t=t.return}return[]}function Wm(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5&&t.tag!==27);return t||null}function Wu(t,n,s,r,a){for(var i=n._reactName,l=[];s!==null&&s!==r;){var o=s,m=o.alternate,k=o.stateNode;if(o=o.tag,m!==null&&m===r)break;o!==5&&o!==26&&o!==27||k===null||(m=k,a?(k=Ps(s,i),k!=null&&l.unshift(gr(s,k,m))):a||(k=Ps(s,i),k!=null&&l.push(gr(s,k,m)))),s=s.return}l.length!==0&&t.push({event:n,listeners:l})}var Zm=/\r\n?/g,Xm=/\u0000|\uFFFD/g;function Zu(t){return(typeof t=="string"?t:""+t).replace(Zm,`
`).replace(Xm,"")}function Xu(t,n){return n=Zu(n),Zu(t)===n}function Te(t,n,s,r,a,i){switch(s){case"children":typeof r=="string"?n==="body"||n==="textarea"&&r===""||ts(t,r):(typeof r=="number"||typeof r=="bigint")&&n!=="body"&&ts(t,""+r);break;case"className":Mr(t,"class",r);break;case"tabIndex":Mr(t,"tabindex",r);break;case"dir":case"role":case"viewBox":case"width":case"height":Mr(t,s,r);break;case"style":Zc(t,r,i);break;case"data":if(n!=="object"){Mr(t,"data",r);break}case"src":case"href":if(r===""&&(n!=="a"||s!=="href")){t.removeAttribute(s);break}if(r==null||typeof r=="function"||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(s);break}r=Ur(""+r),t.setAttribute(s,r);break;case"action":case"formAction":if(typeof r=="function"){t.setAttribute(s,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof i=="function"&&(s==="formAction"?(n!=="input"&&Te(t,n,"name",a.name,a,null),Te(t,n,"formEncType",a.formEncType,a,null),Te(t,n,"formMethod",a.formMethod,a,null),Te(t,n,"formTarget",a.formTarget,a,null)):(Te(t,n,"encType",a.encType,a,null),Te(t,n,"method",a.method,a,null),Te(t,n,"target",a.target,a,null)));if(r==null||typeof r=="symbol"||typeof r=="boolean"){t.removeAttribute(s);break}r=Ur(""+r),t.setAttribute(s,r);break;case"onClick":r!=null&&(t.onclick=Bt);break;case"onScroll":r!=null&&ce("scroll",t);break;case"onScrollEnd":r!=null&&ce("scrollend",t);break;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(d(61));if(s=r.__html,s!=null){if(a.children!=null)throw Error(d(60));t.innerHTML=s}}break;case"multiple":t.multiple=r&&typeof r!="function"&&typeof r!="symbol";break;case"muted":t.muted=r&&typeof r!="function"&&typeof r!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(r==null||typeof r=="function"||typeof r=="boolean"||typeof r=="symbol"){t.removeAttribute("xlink:href");break}s=Ur(""+r),t.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",s);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(s,""+r):t.removeAttribute(s);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":r&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(s,""):t.removeAttribute(s);break;case"capture":case"download":r===!0?t.setAttribute(s,""):r!==!1&&r!=null&&typeof r!="function"&&typeof r!="symbol"?t.setAttribute(s,r):t.removeAttribute(s);break;case"cols":case"rows":case"size":case"span":r!=null&&typeof r!="function"&&typeof r!="symbol"&&!isNaN(r)&&1<=r?t.setAttribute(s,r):t.removeAttribute(s);break;case"rowSpan":case"start":r==null||typeof r=="function"||typeof r=="symbol"||isNaN(r)?t.removeAttribute(s):t.setAttribute(s,r);break;case"popover":ce("beforetoggle",t),ce("toggle",t),_r(t,"popover",r);break;case"xlinkActuate":Lt(t,"http://www.w3.org/1999/xlink","xlink:actuate",r);break;case"xlinkArcrole":Lt(t,"http://www.w3.org/1999/xlink","xlink:arcrole",r);break;case"xlinkRole":Lt(t,"http://www.w3.org/1999/xlink","xlink:role",r);break;case"xlinkShow":Lt(t,"http://www.w3.org/1999/xlink","xlink:show",r);break;case"xlinkTitle":Lt(t,"http://www.w3.org/1999/xlink","xlink:title",r);break;case"xlinkType":Lt(t,"http://www.w3.org/1999/xlink","xlink:type",r);break;case"xmlBase":Lt(t,"http://www.w3.org/XML/1998/namespace","xml:base",r);break;case"xmlLang":Lt(t,"http://www.w3.org/XML/1998/namespace","xml:lang",r);break;case"xmlSpace":Lt(t,"http://www.w3.org/XML/1998/namespace","xml:space",r);break;case"is":_r(t,"is",r);break;case"innerText":case"textContent":break;default:(!(2<s.length)||s[0]!=="o"&&s[0]!=="O"||s[1]!=="n"&&s[1]!=="N")&&(s=kp.get(s)||s,_r(t,s,r))}}function Jl(t,n,s,r,a,i){switch(s){case"style":Zc(t,r,i);break;case"dangerouslySetInnerHTML":if(r!=null){if(typeof r!="object"||!("__html"in r))throw Error(d(61));if(s=r.__html,s!=null){if(a.children!=null)throw Error(d(60));t.innerHTML=s}}break;case"children":typeof r=="string"?ts(t,r):(typeof r=="number"||typeof r=="bigint")&&ts(t,""+r);break;case"onScroll":r!=null&&ce("scroll",t);break;case"onScrollEnd":r!=null&&ce("scrollend",t);break;case"onClick":r!=null&&(t.onclick=Bt);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!Bc.hasOwnProperty(s))e:{if(s[0]==="o"&&s[1]==="n"&&(a=s.endsWith("Capture"),n=s.slice(2,a?s.length-7:void 0),i=t[nt]||null,i=i!=null?i[s]:null,typeof i=="function"&&t.removeEventListener(n,i,a),typeof r=="function")){typeof i!="function"&&i!==null&&(s in t?t[s]=null:t.hasAttribute(s)&&t.removeAttribute(s)),t.addEventListener(n,r,a);break e}s in t?t[s]=r:r===!0?t.setAttribute(s,""):_r(t,s,r)}}}function Je(t,n,s){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":ce("error",t),ce("load",t);var r=!1,a=!1,i;for(i in s)if(s.hasOwnProperty(i)){var l=s[i];if(l!=null)switch(i){case"src":r=!0;break;case"srcSet":a=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(d(137,n));default:Te(t,n,i,l,s,null)}}a&&Te(t,n,"srcSet",s.srcSet,s,null),r&&Te(t,n,"src",s.src,s,null);return;case"input":ce("invalid",t);var o=i=l=a=null,m=null,k=null;for(r in s)if(s.hasOwnProperty(r)){var z=s[r];if(z!=null)switch(r){case"name":a=z;break;case"type":l=z;break;case"checked":m=z;break;case"defaultChecked":k=z;break;case"value":i=z;break;case"defaultValue":o=z;break;case"children":case"dangerouslySetInnerHTML":if(z!=null)throw Error(d(137,n));break;default:Te(t,n,r,z,s,null)}}Gc(t,i,o,m,k,l,a,!1);return;case"select":ce("invalid",t),r=l=i=null;for(a in s)if(s.hasOwnProperty(a)&&(o=s[a],o!=null))switch(a){case"value":i=o;break;case"defaultValue":l=o;break;case"multiple":r=o;default:Te(t,n,a,o,s,null)}n=i,s=l,t.multiple=!!r,n!=null?es(t,!!r,n,!1):s!=null&&es(t,!!r,s,!0);return;case"textarea":ce("invalid",t),i=a=r=null;for(l in s)if(s.hasOwnProperty(l)&&(o=s[l],o!=null))switch(l){case"value":r=o;break;case"defaultValue":a=o;break;case"children":i=o;break;case"dangerouslySetInnerHTML":if(o!=null)throw Error(d(91));break;default:Te(t,n,l,o,s,null)}Kc(t,r,a,i);return;case"option":for(m in s)s.hasOwnProperty(m)&&(r=s[m],r!=null)&&(m==="selected"?t.selected=r&&typeof r!="function"&&typeof r!="symbol":Te(t,n,m,r,s,null));return;case"dialog":ce("beforetoggle",t),ce("toggle",t),ce("cancel",t),ce("close",t);break;case"iframe":case"object":ce("load",t);break;case"video":case"audio":for(r=0;r<jr.length;r++)ce(jr[r],t);break;case"image":ce("error",t),ce("load",t);break;case"details":ce("toggle",t);break;case"embed":case"source":case"link":ce("error",t),ce("load",t);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(k in s)if(s.hasOwnProperty(k)&&(r=s[k],r!=null))switch(k){case"children":case"dangerouslySetInnerHTML":throw Error(d(137,n));default:Te(t,n,k,r,s,null)}return;default:if(hi(n)){for(z in s)s.hasOwnProperty(z)&&(r=s[z],r!==void 0&&Jl(t,n,z,r,s,void 0));return}}for(o in s)s.hasOwnProperty(o)&&(r=s[o],r!=null&&Te(t,n,o,r,s,null))}function Jm(t,n,s,r){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var a=null,i=null,l=null,o=null,m=null,k=null,z=null;for(N in s){var U=s[N];if(s.hasOwnProperty(N)&&U!=null)switch(N){case"checked":break;case"value":break;case"defaultValue":m=U;default:r.hasOwnProperty(N)||Te(t,n,N,null,r,U)}}for(var E in r){var N=r[E];if(U=s[E],r.hasOwnProperty(E)&&(N!=null||U!=null))switch(E){case"type":i=N;break;case"name":a=N;break;case"checked":k=N;break;case"defaultChecked":z=N;break;case"value":l=N;break;case"defaultValue":o=N;break;case"children":case"dangerouslySetInnerHTML":if(N!=null)throw Error(d(137,n));break;default:N!==U&&Te(t,n,E,N,r,U)}}di(t,l,o,m,k,z,i,a);return;case"select":N=l=o=E=null;for(i in s)if(m=s[i],s.hasOwnProperty(i)&&m!=null)switch(i){case"value":break;case"multiple":N=m;default:r.hasOwnProperty(i)||Te(t,n,i,null,r,m)}for(a in r)if(i=r[a],m=s[a],r.hasOwnProperty(a)&&(i!=null||m!=null))switch(a){case"value":E=i;break;case"defaultValue":o=i;break;case"multiple":l=i;default:i!==m&&Te(t,n,a,i,r,m)}n=o,s=l,r=N,E!=null?es(t,!!s,E,!1):!!r!=!!s&&(n!=null?es(t,!!s,n,!0):es(t,!!s,s?[]:"",!1));return;case"textarea":N=E=null;for(o in s)if(a=s[o],s.hasOwnProperty(o)&&a!=null&&!r.hasOwnProperty(o))switch(o){case"value":break;case"children":break;default:Te(t,n,o,null,r,a)}for(l in r)if(a=r[l],i=s[l],r.hasOwnProperty(l)&&(a!=null||i!=null))switch(l){case"value":E=a;break;case"defaultValue":N=a;break;case"children":break;case"dangerouslySetInnerHTML":if(a!=null)throw Error(d(91));break;default:a!==i&&Te(t,n,l,a,r,i)}Vc(t,E,N);return;case"option":for(var K in s)E=s[K],s.hasOwnProperty(K)&&E!=null&&!r.hasOwnProperty(K)&&(K==="selected"?t.selected=!1:Te(t,n,K,null,r,E));for(m in r)E=r[m],N=s[m],r.hasOwnProperty(m)&&E!==N&&(E!=null||N!=null)&&(m==="selected"?t.selected=E&&typeof E!="function"&&typeof E!="symbol":Te(t,n,m,E,r,N));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var ee in s)E=s[ee],s.hasOwnProperty(ee)&&E!=null&&!r.hasOwnProperty(ee)&&Te(t,n,ee,null,r,E);for(k in r)if(E=r[k],N=s[k],r.hasOwnProperty(k)&&E!==N&&(E!=null||N!=null))switch(k){case"children":case"dangerouslySetInnerHTML":if(E!=null)throw Error(d(137,n));break;default:Te(t,n,k,E,r,N)}return;default:if(hi(n)){for(var we in s)E=s[we],s.hasOwnProperty(we)&&E!==void 0&&!r.hasOwnProperty(we)&&Jl(t,n,we,void 0,r,E);for(z in r)E=r[z],N=s[z],!r.hasOwnProperty(z)||E===N||E===void 0&&N===void 0||Jl(t,n,z,E,r,N);return}}for(var b in s)E=s[b],s.hasOwnProperty(b)&&E!=null&&!r.hasOwnProperty(b)&&Te(t,n,b,null,r,E);for(U in r)E=r[U],N=s[U],!r.hasOwnProperty(U)||E===N||E==null&&N==null||Te(t,n,U,E,r,N)}function Ju(t){switch(t){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function $m(){if(typeof performance.getEntriesByType=="function"){for(var t=0,n=0,s=performance.getEntriesByType("resource"),r=0;r<s.length;r++){var a=s[r],i=a.transferSize,l=a.initiatorType,o=a.duration;if(i&&o&&Ju(l)){for(l=0,o=a.responseEnd,r+=1;r<s.length;r++){var m=s[r],k=m.startTime;if(k>o)break;var z=m.transferSize,U=m.initiatorType;z&&Ju(U)&&(m=m.responseEnd,l+=z*(m<o?1:(o-k)/(m-k)))}if(--r,n+=8*(i+l)/(a.duration/1e3),t++,10<t)break}}if(0<t)return n/t/1e6}return navigator.connection&&(t=navigator.connection.downlink,typeof t=="number")?t:5}var $l=null,ec=null;function za(t){return t.nodeType===9?t:t.ownerDocument}function $u(t){switch(t){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function eh(t,n){if(t===0)switch(n){case"svg":return 1;case"math":return 2;default:return 0}return t===1&&n==="foreignObject"?0:t}function tc(t,n){return t==="textarea"||t==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.children=="bigint"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var nc=null;function ef(){var t=window.event;return t&&t.type==="popstate"?t===nc?!1:(nc=t,!0):(nc=null,!1)}var th=typeof setTimeout=="function"?setTimeout:void 0,tf=typeof clearTimeout=="function"?clearTimeout:void 0,nh=typeof Promise=="function"?Promise:void 0,nf=typeof queueMicrotask=="function"?queueMicrotask:typeof nh<"u"?function(t){return nh.resolve(null).then(t).catch(sf)}:th;function sf(t){setTimeout(function(){throw t})}function wn(t){return t==="head"}function sh(t,n){var s=n,r=0;do{var a=s.nextSibling;if(t.removeChild(s),a&&a.nodeType===8)if(s=a.data,s==="/$"||s==="/&"){if(r===0){t.removeChild(a),Ds(n);return}r--}else if(s==="$"||s==="$?"||s==="$~"||s==="$!"||s==="&")r++;else if(s==="html")yr(t.ownerDocument.documentElement);else if(s==="head"){s=t.ownerDocument.head,yr(s);for(var i=s.firstChild;i;){var l=i.nextSibling,o=i.nodeName;i[qs]||o==="SCRIPT"||o==="STYLE"||o==="LINK"&&i.rel.toLowerCase()==="stylesheet"||s.removeChild(i),i=l}}else s==="body"&&yr(t.ownerDocument.body);s=a}while(s);Ds(n)}function rh(t,n){var s=t;t=0;do{var r=s.nextSibling;if(s.nodeType===1?n?(s._stashedDisplay=s.style.display,s.style.display="none"):(s.style.display=s._stashedDisplay||"",s.getAttribute("style")===""&&s.removeAttribute("style")):s.nodeType===3&&(n?(s._stashedText=s.nodeValue,s.nodeValue=""):s.nodeValue=s._stashedText||""),r&&r.nodeType===8)if(s=r.data,s==="/$"){if(t===0)break;t--}else s!=="$"&&s!=="$?"&&s!=="$~"&&s!=="$!"||t++;s=r}while(s)}function sc(t){var n=t.firstChild;for(n&&n.nodeType===10&&(n=n.nextSibling);n;){var s=n;switch(n=n.nextSibling,s.nodeName){case"HTML":case"HEAD":case"BODY":sc(s),ci(s);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(s.rel.toLowerCase()==="stylesheet")continue}t.removeChild(s)}}function rf(t,n,s,r){for(;t.nodeType===1;){var a=s;if(t.nodeName.toLowerCase()!==n.toLowerCase()){if(!r&&(t.nodeName!=="INPUT"||t.type!=="hidden"))break}else if(r){if(!t[qs])switch(n){case"meta":if(!t.hasAttribute("itemprop"))break;return t;case"link":if(i=t.getAttribute("rel"),i==="stylesheet"&&t.hasAttribute("data-precedence"))break;if(i!==a.rel||t.getAttribute("href")!==(a.href==null||a.href===""?null:a.href)||t.getAttribute("crossorigin")!==(a.crossOrigin==null?null:a.crossOrigin)||t.getAttribute("title")!==(a.title==null?null:a.title))break;return t;case"style":if(t.hasAttribute("data-precedence"))break;return t;case"script":if(i=t.getAttribute("src"),(i!==(a.src==null?null:a.src)||t.getAttribute("type")!==(a.type==null?null:a.type)||t.getAttribute("crossorigin")!==(a.crossOrigin==null?null:a.crossOrigin))&&i&&t.hasAttribute("async")&&!t.hasAttribute("itemprop"))break;return t;default:return t}}else if(n==="input"&&t.type==="hidden"){var i=a.name==null?null:""+a.name;if(a.type==="hidden"&&t.getAttribute("name")===i)return t}else return t;if(t=Et(t.nextSibling),t===null)break}return null}function af(t,n,s){if(n==="")return null;for(;t.nodeType!==3;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!s||(t=Et(t.nextSibling),t===null))return null;return t}function ah(t,n){for(;t.nodeType!==8;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!n||(t=Et(t.nextSibling),t===null))return null;return t}function rc(t){return t.data==="$?"||t.data==="$~"}function ac(t){return t.data==="$!"||t.data==="$?"&&t.ownerDocument.readyState!=="loading"}function lf(t,n){var s=t.ownerDocument;if(t.data==="$~")t._reactRetry=n;else if(t.data!=="$?"||s.readyState!=="loading")n();else{var r=function(){n(),s.removeEventListener("DOMContentLoaded",r)};s.addEventListener("DOMContentLoaded",r),t._reactRetry=r}}function Et(t){for(;t!=null;t=t.nextSibling){var n=t.nodeType;if(n===1||n===3)break;if(n===8){if(n=t.data,n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"||n==="F!"||n==="F")break;if(n==="/$"||n==="/&")return null}}return t}var ic=null;function ih(t){t=t.nextSibling;for(var n=0;t;){if(t.nodeType===8){var s=t.data;if(s==="/$"||s==="/&"){if(n===0)return Et(t.nextSibling);n--}else s!=="$"&&s!=="$!"&&s!=="$?"&&s!=="$~"&&s!=="&"||n++}t=t.nextSibling}return null}function lh(t){t=t.previousSibling;for(var n=0;t;){if(t.nodeType===8){var s=t.data;if(s==="$"||s==="$!"||s==="$?"||s==="$~"||s==="&"){if(n===0)return t;n--}else s!=="/$"&&s!=="/&"||n++}t=t.previousSibling}return null}function ch(t,n,s){switch(n=za(s),t){case"html":if(t=n.documentElement,!t)throw Error(d(452));return t;case"head":if(t=n.head,!t)throw Error(d(453));return t;case"body":if(t=n.body,!t)throw Error(d(454));return t;default:throw Error(d(451))}}function yr(t){for(var n=t.attributes;n.length;)t.removeAttributeNode(n[0]);ci(t)}var At=new Map,oh=new Set;function Ia(t){return typeof t.getRootNode=="function"?t.getRootNode():t.nodeType===9?t:t.ownerDocument}var sn=F.d;F.d={f:cf,r:of,D:df,C:uf,L:hf,m:pf,X:ff,S:mf,M:xf};function cf(){var t=sn.f(),n=ka();return t||n}function of(t){var n=Xn(t);n!==null&&n.tag===5&&n.type==="form"?Cd(n):sn.r(t)}var As=typeof document>"u"?null:document;function dh(t,n,s){var r=As;if(r&&typeof n=="string"&&n){var a=vt(n);a='link[rel="'+t+'"][href="'+a+'"]',typeof s=="string"&&(a+='[crossorigin="'+s+'"]'),oh.has(a)||(oh.add(a),t={rel:t,crossOrigin:s,href:n},r.querySelector(a)===null&&(n=r.createElement("link"),Je(n,"link",t),Ye(n),r.head.appendChild(n)))}}function df(t){sn.D(t),dh("dns-prefetch",t,null)}function uf(t,n){sn.C(t,n),dh("preconnect",t,n)}function hf(t,n,s){sn.L(t,n,s);var r=As;if(r&&t&&n){var a='link[rel="preload"][as="'+vt(n)+'"]';n==="image"&&s&&s.imageSrcSet?(a+='[imagesrcset="'+vt(s.imageSrcSet)+'"]',typeof s.imageSizes=="string"&&(a+='[imagesizes="'+vt(s.imageSizes)+'"]')):a+='[href="'+vt(t)+'"]';var i=a;switch(n){case"style":i=Ns(t);break;case"script":i=Os(t)}At.has(i)||(t=T({rel:"preload",href:n==="image"&&s&&s.imageSrcSet?void 0:t,as:n},s),At.set(i,t),r.querySelector(a)!==null||n==="style"&&r.querySelector(br(i))||n==="script"&&r.querySelector(vr(i))||(n=r.createElement("link"),Je(n,"link",t),Ye(n),r.head.appendChild(n)))}}function pf(t,n){sn.m(t,n);var s=As;if(s&&t){var r=n&&typeof n.as=="string"?n.as:"script",a='link[rel="modulepreload"][as="'+vt(r)+'"][href="'+vt(t)+'"]',i=a;switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":i=Os(t)}if(!At.has(i)&&(t=T({rel:"modulepreload",href:t},n),At.set(i,t),s.querySelector(a)===null)){switch(r){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(s.querySelector(vr(i)))return}r=s.createElement("link"),Je(r,"link",t),Ye(r),s.head.appendChild(r)}}}function mf(t,n,s){sn.S(t,n,s);var r=As;if(r&&t){var a=Jn(r).hoistableStyles,i=Ns(t);n=n||"default";var l=a.get(i);if(!l){var o={loading:0,preload:null};if(l=r.querySelector(br(i)))o.loading=5;else{t=T({rel:"stylesheet",href:t,"data-precedence":n},s),(s=At.get(i))&&lc(t,s);var m=l=r.createElement("link");Ye(m),Je(m,"link",t),m._p=new Promise(function(k,z){m.onload=k,m.onerror=z}),m.addEventListener("load",function(){o.loading|=1}),m.addEventListener("error",function(){o.loading|=2}),o.loading|=4,_a(l,n,r)}l={type:"stylesheet",instance:l,count:1,state:o},a.set(i,l)}}}function ff(t,n){sn.X(t,n);var s=As;if(s&&t){var r=Jn(s).hoistableScripts,a=Os(t),i=r.get(a);i||(i=s.querySelector(vr(a)),i||(t=T({src:t,async:!0},n),(n=At.get(a))&&cc(t,n),i=s.createElement("script"),Ye(i),Je(i,"link",t),s.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},r.set(a,i))}}function xf(t,n){sn.M(t,n);var s=As;if(s&&t){var r=Jn(s).hoistableScripts,a=Os(t),i=r.get(a);i||(i=s.querySelector(vr(a)),i||(t=T({src:t,async:!0,type:"module"},n),(n=At.get(a))&&cc(t,n),i=s.createElement("script"),Ye(i),Je(i,"link",t),s.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},r.set(a,i))}}function uh(t,n,s,r){var a=(a=re.current)?Ia(a):null;if(!a)throw Error(d(446));switch(t){case"meta":case"title":return null;case"style":return typeof s.precedence=="string"&&typeof s.href=="string"?(n=Ns(s.href),s=Jn(a).hoistableStyles,r=s.get(n),r||(r={type:"style",instance:null,count:0,state:null},s.set(n,r)),r):{type:"void",instance:null,count:0,state:null};case"link":if(s.rel==="stylesheet"&&typeof s.href=="string"&&typeof s.precedence=="string"){t=Ns(s.href);var i=Jn(a).hoistableStyles,l=i.get(t);if(l||(a=a.ownerDocument||a,l={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},i.set(t,l),(i=a.querySelector(br(t)))&&!i._p&&(l.instance=i,l.state.loading=5),At.has(t)||(s={rel:"preload",as:"style",href:s.href,crossOrigin:s.crossOrigin,integrity:s.integrity,media:s.media,hrefLang:s.hrefLang,referrerPolicy:s.referrerPolicy},At.set(t,s),i||jf(a,t,s,l.state))),n&&r===null)throw Error(d(528,""));return l}if(n&&r!==null)throw Error(d(529,""));return null;case"script":return n=s.async,s=s.src,typeof s=="string"&&n&&typeof n!="function"&&typeof n!="symbol"?(n=Os(s),s=Jn(a).hoistableScripts,r=s.get(n),r||(r={type:"script",instance:null,count:0,state:null},s.set(n,r)),r):{type:"void",instance:null,count:0,state:null};default:throw Error(d(444,t))}}function Ns(t){return'href="'+vt(t)+'"'}function br(t){return'link[rel="stylesheet"]['+t+"]"}function hh(t){return T({},t,{"data-precedence":t.precedence,precedence:null})}function jf(t,n,s,r){t.querySelector('link[rel="preload"][as="style"]['+n+"]")?r.loading=1:(n=t.createElement("link"),r.preload=n,n.addEventListener("load",function(){return r.loading|=1}),n.addEventListener("error",function(){return r.loading|=2}),Je(n,"link",s),Ye(n),t.head.appendChild(n))}function Os(t){return'[src="'+vt(t)+'"]'}function vr(t){return"script[async]"+t}function ph(t,n,s){if(n.count++,n.instance===null)switch(n.type){case"style":var r=t.querySelector('style[data-href~="'+vt(s.href)+'"]');if(r)return n.instance=r,Ye(r),r;var a=T({},s,{"data-href":s.href,"data-precedence":s.precedence,href:null,precedence:null});return r=(t.ownerDocument||t).createElement("style"),Ye(r),Je(r,"style",a),_a(r,s.precedence,t),n.instance=r;case"stylesheet":a=Ns(s.href);var i=t.querySelector(br(a));if(i)return n.state.loading|=4,n.instance=i,Ye(i),i;r=hh(s),(a=At.get(a))&&lc(r,a),i=(t.ownerDocument||t).createElement("link"),Ye(i);var l=i;return l._p=new Promise(function(o,m){l.onload=o,l.onerror=m}),Je(i,"link",r),n.state.loading|=4,_a(i,s.precedence,t),n.instance=i;case"script":return i=Os(s.src),(a=t.querySelector(vr(i)))?(n.instance=a,Ye(a),a):(r=s,(a=At.get(i))&&(r=T({},s),cc(r,a)),t=t.ownerDocument||t,a=t.createElement("script"),Ye(a),Je(a,"link",r),t.head.appendChild(a),n.instance=a);case"void":return null;default:throw Error(d(443,n.type))}else n.type==="stylesheet"&&(n.state.loading&4)===0&&(r=n.instance,n.state.loading|=4,_a(r,s.precedence,t));return n.instance}function _a(t,n,s){for(var r=s.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),a=r.length?r[r.length-1]:null,i=a,l=0;l<r.length;l++){var o=r[l];if(o.dataset.precedence===n)i=o;else if(i!==a)break}i?i.parentNode.insertBefore(t,i.nextSibling):(n=s.nodeType===9?s.head:s,n.insertBefore(t,n.firstChild))}function lc(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.title==null&&(t.title=n.title)}function cc(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.integrity==null&&(t.integrity=n.integrity)}var Ma=null;function mh(t,n,s){if(Ma===null){var r=new Map,a=Ma=new Map;a.set(s,r)}else a=Ma,r=a.get(s),r||(r=new Map,a.set(s,r));if(r.has(t))return r;for(r.set(t,null),s=s.getElementsByTagName(t),a=0;a<s.length;a++){var i=s[a];if(!(i[qs]||i[Ke]||t==="link"&&i.getAttribute("rel")==="stylesheet")&&i.namespaceURI!=="http://www.w3.org/2000/svg"){var l=i.getAttribute(n)||"";l=t+l;var o=r.get(l);o?o.push(i):r.set(l,[i])}}return r}function fh(t,n,s){t=t.ownerDocument||t,t.head.insertBefore(s,n==="title"?t.querySelector("head > title"):null)}function gf(t,n,s){if(s===1||n.itemProp!=null)return!1;switch(t){case"meta":case"title":return!0;case"style":if(typeof n.precedence!="string"||typeof n.href!="string"||n.href==="")break;return!0;case"link":if(typeof n.rel!="string"||typeof n.href!="string"||n.href===""||n.onLoad||n.onError)break;return n.rel==="stylesheet"?(t=n.disabled,typeof n.precedence=="string"&&t==null):!0;case"script":if(n.async&&typeof n.async!="function"&&typeof n.async!="symbol"&&!n.onLoad&&!n.onError&&n.src&&typeof n.src=="string")return!0}return!1}function xh(t){return!(t.type==="stylesheet"&&(t.state.loading&3)===0)}function yf(t,n,s,r){if(s.type==="stylesheet"&&(typeof r.media!="string"||matchMedia(r.media).matches!==!1)&&(s.state.loading&4)===0){if(s.instance===null){var a=Ns(r.href),i=n.querySelector(br(a));if(i){n=i._p,n!==null&&typeof n=="object"&&typeof n.then=="function"&&(t.count++,t=qa.bind(t),n.then(t,t)),s.state.loading|=4,s.instance=i,Ye(i);return}i=n.ownerDocument||n,r=hh(r),(a=At.get(a))&&lc(r,a),i=i.createElement("link"),Ye(i);var l=i;l._p=new Promise(function(o,m){l.onload=o,l.onerror=m}),Je(i,"link",r),s.instance=i}t.stylesheets===null&&(t.stylesheets=new Map),t.stylesheets.set(s,n),(n=s.state.preload)&&(s.state.loading&3)===0&&(t.count++,s=qa.bind(t),n.addEventListener("load",s),n.addEventListener("error",s))}}var oc=0;function bf(t,n){return t.stylesheets&&t.count===0&&Pa(t,t.stylesheets),0<t.count||0<t.imgCount?function(s){var r=setTimeout(function(){if(t.stylesheets&&Pa(t,t.stylesheets),t.unsuspend){var i=t.unsuspend;t.unsuspend=null,i()}},6e4+n);0<t.imgBytes&&oc===0&&(oc=62500*$m());var a=setTimeout(function(){if(t.waitingForImages=!1,t.count===0&&(t.stylesheets&&Pa(t,t.stylesheets),t.unsuspend)){var i=t.unsuspend;t.unsuspend=null,i()}},(t.imgBytes>oc?50:800)+n);return t.unsuspend=s,function(){t.unsuspend=null,clearTimeout(r),clearTimeout(a)}}:null}function qa(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)Pa(this,this.stylesheets);else if(this.unsuspend){var t=this.unsuspend;this.unsuspend=null,t()}}}var Ua=null;function Pa(t,n){t.stylesheets=null,t.unsuspend!==null&&(t.count++,Ua=new Map,n.forEach(vf,t),Ua=null,qa.call(t))}function vf(t,n){if(!(n.state.loading&4)){var s=Ua.get(t);if(s)var r=s.get(null);else{s=new Map,Ua.set(t,s);for(var a=t.querySelectorAll("link[data-precedence],style[data-precedence]"),i=0;i<a.length;i++){var l=a[i];(l.nodeName==="LINK"||l.getAttribute("media")!=="not all")&&(s.set(l.dataset.precedence,l),r=l)}r&&s.set(null,r)}a=n.instance,l=a.getAttribute("data-precedence"),i=s.get(l)||r,i===r&&s.set(null,a),s.set(l,a),this.count++,r=qa.bind(this),a.addEventListener("load",r),a.addEventListener("error",r),i?i.parentNode.insertBefore(a,i.nextSibling):(t=t.nodeType===9?t.head:t,t.insertBefore(a,t.firstChild)),n.state.loading|=4}}var Sr={$$typeof:_,Provider:null,Consumer:null,_currentValue:Z,_currentValue2:Z,_threadCount:0};function Sf(t,n,s,r,a,i,l,o,m){this.tag=1,this.containerInfo=t,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=ri(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=ri(0),this.hiddenUpdates=ri(null),this.identifierPrefix=r,this.onUncaughtError=a,this.onCaughtError=i,this.onRecoverableError=l,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=m,this.incompleteTransitions=new Map}function jh(t,n,s,r,a,i,l,o,m,k,z,U){return t=new Sf(t,n,s,l,m,k,z,U,o),n=1,i===!0&&(n|=24),i=pt(3,null,null,n),t.current=i,i.stateNode=t,n=Hi(),n.refCount++,t.pooledCache=n,n.refCount++,i.memoizedState={element:r,isDehydrated:s,cache:n},Gi(i),t}function gh(t){return t?(t=cs,t):cs}function yh(t,n,s,r,a,i){a=gh(a),r.context===null?r.context=a:r.pendingContext=a,r=pn(n),r.payload={element:s},i=i===void 0?null:i,i!==null&&(r.callback=i),s=mn(t,r,n),s!==null&&(ct(s,t,n),er(s,t,n))}function bh(t,n){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var s=t.retryLane;t.retryLane=s!==0&&s<n?s:n}}function dc(t,n){bh(t,n),(t=t.alternate)&&bh(t,n)}function vh(t){if(t.tag===13||t.tag===31){var n=Mn(t,67108864);n!==null&&ct(n,t,67108864),dc(t,67108864)}}function Sh(t){if(t.tag===13||t.tag===31){var n=gt();n=ai(n);var s=Mn(t,n);s!==null&&ct(s,t,n),dc(t,n)}}var La=!0;function Tf(t,n,s,r){var a=D.T;D.T=null;var i=F.p;try{F.p=2,uc(t,n,s,r)}finally{F.p=i,D.T=a}}function wf(t,n,s,r){var a=D.T;D.T=null;var i=F.p;try{F.p=8,uc(t,n,s,r)}finally{F.p=i,D.T=a}}function uc(t,n,s,r){if(La){var a=hc(r);if(a===null)Xl(t,n,r,Ba,s),wh(t,r);else if(Cf(a,t,n,s,r))r.stopPropagation();else if(wh(t,r),n&4&&-1<kf.indexOf(t)){for(;a!==null;){var i=Xn(a);if(i!==null)switch(i.tag){case 3:if(i=i.stateNode,i.current.memoizedState.isDehydrated){var l=On(i.pendingLanes);if(l!==0){var o=i;for(o.pendingLanes|=2,o.entangledLanes|=2;l;){var m=1<<31-ut(l);o.entanglements[1]|=m,l&=~m}qt(i),(je&6)===0&&(Ta=ot()+500,xr(0))}}break;case 31:case 13:o=Mn(i,2),o!==null&&ct(o,i,2),ka(),dc(i,2)}if(i=hc(r),i===null&&Xl(t,n,r,Ba,s),i===a)break;a=i}a!==null&&r.stopPropagation()}else Xl(t,n,r,null,s)}}function hc(t){return t=mi(t),pc(t)}var Ba=null;function pc(t){if(Ba=null,t=Zn(t),t!==null){var n=I(t);if(n===null)t=null;else{var s=n.tag;if(s===13){if(t=y(n),t!==null)return t;t=null}else if(s===31){if(t=S(n),t!==null)return t;t=null}else if(s===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;t=null}else n!==t&&(t=null)}}return Ba=t,null}function Th(t){switch(t){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(op()){case Nc:return 2;case Oc:return 8;case Nr:case dp:return 32;case Dc:return 268435456;default:return 32}default:return 32}}var mc=!1,kn=null,Cn=null,Rn=null,Tr=new Map,wr=new Map,En=[],kf="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function wh(t,n){switch(t){case"focusin":case"focusout":kn=null;break;case"dragenter":case"dragleave":Cn=null;break;case"mouseover":case"mouseout":Rn=null;break;case"pointerover":case"pointerout":Tr.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":wr.delete(n.pointerId)}}function kr(t,n,s,r,a,i){return t===null||t.nativeEvent!==i?(t={blockedOn:n,domEventName:s,eventSystemFlags:r,nativeEvent:i,targetContainers:[a]},n!==null&&(n=Xn(n),n!==null&&vh(n)),t):(t.eventSystemFlags|=r,n=t.targetContainers,a!==null&&n.indexOf(a)===-1&&n.push(a),t)}function Cf(t,n,s,r,a){switch(n){case"focusin":return kn=kr(kn,t,n,s,r,a),!0;case"dragenter":return Cn=kr(Cn,t,n,s,r,a),!0;case"mouseover":return Rn=kr(Rn,t,n,s,r,a),!0;case"pointerover":var i=a.pointerId;return Tr.set(i,kr(Tr.get(i)||null,t,n,s,r,a)),!0;case"gotpointercapture":return i=a.pointerId,wr.set(i,kr(wr.get(i)||null,t,n,s,r,a)),!0}return!1}function kh(t){var n=Zn(t.target);if(n!==null){var s=I(n);if(s!==null){if(n=s.tag,n===13){if(n=y(s),n!==null){t.blockedOn=n,Uc(t.priority,function(){Sh(s)});return}}else if(n===31){if(n=S(s),n!==null){t.blockedOn=n,Uc(t.priority,function(){Sh(s)});return}}else if(n===3&&s.stateNode.current.memoizedState.isDehydrated){t.blockedOn=s.tag===3?s.stateNode.containerInfo:null;return}}}t.blockedOn=null}function Ha(t){if(t.blockedOn!==null)return!1;for(var n=t.targetContainers;0<n.length;){var s=hc(t.nativeEvent);if(s===null){s=t.nativeEvent;var r=new s.constructor(s.type,s);pi=r,s.target.dispatchEvent(r),pi=null}else return n=Xn(s),n!==null&&vh(n),t.blockedOn=s,!1;n.shift()}return!0}function Ch(t,n,s){Ha(t)&&s.delete(n)}function Rf(){mc=!1,kn!==null&&Ha(kn)&&(kn=null),Cn!==null&&Ha(Cn)&&(Cn=null),Rn!==null&&Ha(Rn)&&(Rn=null),Tr.forEach(Ch),wr.forEach(Ch)}function Qa(t,n){t.blockedOn===n&&(t.blockedOn=null,mc||(mc=!0,c.unstable_scheduleCallback(c.unstable_NormalPriority,Rf)))}var Fa=null;function Rh(t){Fa!==t&&(Fa=t,c.unstable_scheduleCallback(c.unstable_NormalPriority,function(){Fa===t&&(Fa=null);for(var n=0;n<t.length;n+=3){var s=t[n],r=t[n+1],a=t[n+2];if(typeof r!="function"){if(pc(r||s)===null)continue;break}var i=Xn(s);i!==null&&(t.splice(n,3),n-=3,hl(i,{pending:!0,data:a,method:s.method,action:r},r,a))}}))}function Ds(t){function n(m){return Qa(m,t)}kn!==null&&Qa(kn,t),Cn!==null&&Qa(Cn,t),Rn!==null&&Qa(Rn,t),Tr.forEach(n),wr.forEach(n);for(var s=0;s<En.length;s++){var r=En[s];r.blockedOn===t&&(r.blockedOn=null)}for(;0<En.length&&(s=En[0],s.blockedOn===null);)kh(s),s.blockedOn===null&&En.shift();if(s=(t.ownerDocument||t).$$reactFormReplay,s!=null)for(r=0;r<s.length;r+=3){var a=s[r],i=s[r+1],l=a[nt]||null;if(typeof i=="function")l||Rh(s);else if(l){var o=null;if(i&&i.hasAttribute("formAction")){if(a=i,l=i[nt]||null)o=l.formAction;else if(pc(a)!==null)continue}else o=l.action;typeof o=="function"?s[r+1]=o:(s.splice(r,3),r-=3),Rh(s)}}}function Eh(){function t(i){i.canIntercept&&i.info==="react-transition"&&i.intercept({handler:function(){return new Promise(function(l){return a=l})},focusReset:"manual",scroll:"manual"})}function n(){a!==null&&(a(),a=null),r||setTimeout(s,20)}function s(){if(!r&&!navigation.transition){var i=navigation.currentEntry;i&&i.url!=null&&navigation.navigate(i.url,{state:i.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var r=!1,a=null;return navigation.addEventListener("navigate",t),navigation.addEventListener("navigatesuccess",n),navigation.addEventListener("navigateerror",n),setTimeout(s,100),function(){r=!0,navigation.removeEventListener("navigate",t),navigation.removeEventListener("navigatesuccess",n),navigation.removeEventListener("navigateerror",n),a!==null&&(a(),a=null)}}}function fc(t){this._internalRoot=t}Ya.prototype.render=fc.prototype.render=function(t){var n=this._internalRoot;if(n===null)throw Error(d(409));var s=n.current,r=gt();yh(s,r,t,n,null,null)},Ya.prototype.unmount=fc.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var n=t.containerInfo;yh(t.current,2,null,t,null,null),ka(),n[Wn]=null}};function Ya(t){this._internalRoot=t}Ya.prototype.unstable_scheduleHydration=function(t){if(t){var n=qc();t={blockedOn:null,target:t,priority:n};for(var s=0;s<En.length&&n!==0&&n<En[s].priority;s++);En.splice(s,0,t),s===0&&kh(t)}};var Ah=h.version;if(Ah!=="19.2.4")throw Error(d(527,Ah,"19.2.4"));F.findDOMNode=function(t){var n=t._reactInternals;if(n===void 0)throw typeof t.render=="function"?Error(d(188)):(t=Object.keys(t).join(","),Error(d(268,t)));return t=f(n),t=t!==null?A(t):null,t=t===null?null:t.stateNode,t};var Ef={bundleType:0,version:"19.2.4",rendererPackageName:"react-dom",currentDispatcherRef:D,reconcilerVersion:"19.2.4"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Ga=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Ga.isDisabled&&Ga.supportsFiber)try{Is=Ga.inject(Ef),dt=Ga}catch{}}return Rr.createRoot=function(t,n){if(!v(t))throw Error(d(299));var s=!1,r="",a=Md,i=qd,l=Ud;return n!=null&&(n.unstable_strictMode===!0&&(s=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onUncaughtError!==void 0&&(a=n.onUncaughtError),n.onCaughtError!==void 0&&(i=n.onCaughtError),n.onRecoverableError!==void 0&&(l=n.onRecoverableError)),n=jh(t,1,!1,null,null,s,r,null,a,i,l,Eh),t[Wn]=n.current,Zl(t),new fc(n)},Rr.hydrateRoot=function(t,n,s){if(!v(t))throw Error(d(299));var r=!1,a="",i=Md,l=qd,o=Ud,m=null;return s!=null&&(s.unstable_strictMode===!0&&(r=!0),s.identifierPrefix!==void 0&&(a=s.identifierPrefix),s.onUncaughtError!==void 0&&(i=s.onUncaughtError),s.onCaughtError!==void 0&&(l=s.onCaughtError),s.onRecoverableError!==void 0&&(o=s.onRecoverableError),s.formState!==void 0&&(m=s.formState)),n=jh(t,1,!0,n,s??null,r,a,m,i,l,o,Eh),n.context=gh(null),s=n.current,r=gt(),r=ai(r),a=pn(r),a.callback=null,mn(s,a,r),s=r,n.current.lanes=s,Ms(n,s),qt(n),t[Wn]=n.current,Zl(t),new Ya(n)},Rr.version="19.2.4",Rr}var Ph;function Uf(){if(Ph)return gc.exports;Ph=1;function c(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c)}catch(h){console.error(h)}}return c(),gc.exports=qf(),gc.exports}var Pf=Uf();const Xh=[{title:"Overview",items:[{label:"Why realtime.js",hash:"#/docs/why"},{label:"Getting Started",hash:"#/docs/getting-started"},{label:"Tutorial: Task Board",hash:"#/docs/tutorial"},{label:"Collections",hash:"#/docs/collections"},{label:"Choosing a Pattern",hash:"#/docs/choosing-a-pattern"}]},{title:"Guides",items:[{label:"TanStack Start + Drizzle",hash:"#/docs/server-functions"},{label:"Reactive Queries",hash:"#/docs/reactive-queries"},{label:"Authentication",hash:"#/docs/authentication"},{label:"Rich Text (Y.js)",hash:"#/docs/rich-text-crdts"},{label:"Centrifugo Guide",hash:"#/docs/centrifugo"},{label:"Read Receipts",hash:"#/docs/read-receipts"},{label:"Testing",hash:"#/docs/testing"}]},{title:"Features",items:[{label:"CRDTs",hash:"#/docs/crdts"},{label:"Presence",hash:"#/docs/presence"},{label:"Channels & Pub/Sub",hash:"#/docs/channels"},{label:"Streaming",hash:"#/docs/streaming"},{label:"Ephemeral Channels",hash:"#/docs/ephemeral"},{label:"Tick-Based Sync",hash:"#/docs/tick"}]},{title:"Infrastructure",items:[{label:"Transports",hash:"#/docs/transports"},{label:"Resilience",hash:"#/docs/resilience"},{label:"Scaling to Production",hash:"#/docs/scaling"},{label:"Server Hooks",hash:"#/docs/server-hooks"}]},{title:"Reference",items:[{label:"React Hooks",hash:"#/docs/hooks"},{label:"Solid Primitives",hash:"#/docs/solid-primitives"},{label:"Vue Composables",hash:"#/docs/vue-composables"},{label:"DevTools",hash:"#/docs/devtools"},{label:"Examples",hash:"#/docs/examples"},{label:"API Reference",hash:"#/docs/api-reference"},{label:"Error Reference",hash:"#/docs/error-reference"},{label:"Wire Protocol",hash:"#/docs/wire-protocol"}]}],Lf={"#/docs/why":"Why.tsx","#/docs/getting-started":"GettingStarted.tsx","#/docs/tutorial":"Tutorial.tsx","#/docs/collections":"Collections.tsx","#/docs/choosing-a-pattern":"ChoosingAPattern.tsx","#/docs/server-functions":"ServerFunctions.tsx","#/docs/reactive-queries":"ReactiveQueries.tsx","#/docs/authentication":"Authentication.tsx","#/docs/rich-text-crdts":"RichTextCRDTs.tsx","#/docs/centrifugo":"Centrifugo.tsx","#/docs/read-receipts":"ReadReceipts.tsx","#/docs/testing":"Testing.tsx","#/docs/crdts":"CRDTs.tsx","#/docs/presence":"Presence.tsx","#/docs/channels":"Channels.tsx","#/docs/streaming":"Streaming.tsx","#/docs/ephemeral":"Ephemeral.tsx","#/docs/tick":"Tick.tsx","#/docs/transports":"Transports.tsx","#/docs/resilience":"Resilience.tsx","#/docs/scaling":"Scaling.tsx","#/docs/server-hooks":"ServerHooks.tsx","#/docs/hooks":"Hooks.tsx","#/docs/solid-primitives":"SolidPrimitives.tsx","#/docs/vue-composables":"VueComposables.tsx","#/docs/devtools":"Devtools.tsx","#/docs/examples":"Examples.tsx","#/docs/api-reference":"ApiReference.tsx","#/docs/error-reference":"ErrorReference.tsx","#/docs/wire-protocol":"WireProtocol.tsx"},Bf=Xh.flatMap(c=>c.items.map(h=>({section:c.title,...h})));function Hf({currentHash:c}){const h=Bf.find(d=>c===d.hash),p=Lf[c];return e.jsxs("aside",{className:"sidebar",children:[e.jsx("a",{href:"#/",className:"sidebar-home",children:"← Home"}),h?e.jsxs("div",{className:"sidebar-breadcrumb",children:[h.section," › ",h.label]}):null,Xh.map(d=>e.jsxs("div",{className:"sidebar-section",children:[e.jsx("h4",{className:"sidebar-heading",children:d.title}),d.items.map(v=>e.jsx("a",{href:v.hash,className:`sidebar-link${c===v.hash?" active":""}`,children:v.label},v.hash))]},d.title)),p?e.jsx("a",{className:"sidebar-edit-link",href:`https://github.com/mikn/tanstack-realtime/edit/main/packages/docs/src/pages/docs/${p}`,target:"_blank",rel:"noopener",children:"Edit this page on GitHub"}):null]})}const Lh=[{label:"Why realtime.js",hash:"#/docs/why",section:"Overview",keywords:"why bring your own backend vendor-neutral no platform no lock-in no per-seat sync convex comparison capability matrix progressive adoption"},{label:"Getting Started",hash:"#/docs/getting-started",section:"Overview",keywords:"install setup quick start server handler createStartHandler createReactiveQueries provider transport"},{label:"Tutorial: Task Board",hash:"#/docs/tutorial",section:"Overview",keywords:"tutorial task board walkthrough end-to-end preset-start adapter-sse reactive-drizzle drizzle schema presence"},{label:"Collections",hash:"#/docs/collections",section:"Overview",keywords:"realtimeCollectionOptions liveChannelOptions streamChannelOptions collection source"},{label:"Choosing a Pattern",hash:"#/docs/choosing-a-pattern",section:"Overview",keywords:"decision matrix pattern CRDT presence pub/sub streaming"},{label:"TanStack Start + Drizzle",hash:"#/docs/server-functions",section:"Guides",keywords:"server functions drizzle ORM withServerFns createValidatedPublish"},{label:"Authentication",hash:"#/docs/authentication",section:"Guides",keywords:"auth getUser authorize JWT token bearer permissions"},{label:"Rich Text (Y.js)",hash:"#/docs/rich-text-crdts",section:"Guides",keywords:"yjs hocuspocus rich text editor CRDT collaborative"},{label:"Centrifugo Guide",hash:"#/docs/centrifugo",section:"Guides",keywords:"centrifugo websocket token proxy configuration"},{label:"Read Receipts",hash:"#/docs/read-receipts",section:"Guides",keywords:"read receipts seen unread message tracking"},{label:"Testing",hash:"#/docs/testing",section:"Guides",keywords:"test mock createMockTransport createMockClient vitest jest unit integration"},{label:"CRDTs",hash:"#/docs/crdts",section:"Features",keywords:"CRDT conflict-free LWW register PN-counter OR-set merge convergence fields"},{label:"Presence",hash:"#/docs/presence",section:"Features",keywords:"presence usePresence cursor who online avatar joinPresence updatePresence"},{label:"Channels & Pub/Sub",hash:"#/docs/channels",section:"Features",keywords:"channel subscribe publish useChannel useSubscribe usePublish message broadcast"},{label:"Streaming",hash:"#/docs/streaming",section:"Features",keywords:"stream AI reduce useStream createServerStream LLM streaming status done error"},{label:"Ephemeral Channels",hash:"#/docs/ephemeral",section:"Features",keywords:"ephemeral TTL typing indicator transient createEphemeralMap expiry auto-expire"},{label:"Tick-Based Sync",hash:"#/docs/tick",section:"Features",keywords:"tick game 60Hz delta compression useTickBatching computeDelta applyDelta high frequency"},{label:"Transports",hash:"#/docs/transports",section:"Infrastructure",keywords:"transport SSE websocket centrifugo adapter sseTransport centrifugoTransport pusher soketi partykit durable objects pusherTransport partykitTransport capabilities conformance"},{label:"Resilience",hash:"#/docs/resilience",section:"Infrastructure",keywords:"offline queue reconnect gap recovery dedup multi-tab SharedWorker BroadcastChannel coordinated"},{label:"Scaling to Production",hash:"#/docs/scaling",section:"Infrastructure",keywords:"scaling production redis PublishBackend multi-process fan-out deploy"},{label:"Server Hooks",hash:"#/docs/server-hooks",section:"Infrastructure",keywords:"server hooks lifecycle onClientConnect onClientDisconnect onFirstSubscriber onChannelEmpty"},{label:"React Hooks",hash:"#/docs/hooks",section:"Reference",keywords:"react hooks useRealtime useSubscribe usePublish useChannel usePresence useStream useRealtimeCollection useLiveChannel useSyncedCounter useSyncedValue useSyncedSet useConnectionStatus useIsConnected useLatestMessage useChannelHistory useTypingIndicator useChannelStats useOnReconnect"},{label:"Solid Primitives",hash:"#/docs/solid-primitives",section:"Reference",keywords:"solid primitives createRealtime createSubscribe createPublish createChannel createPresence createStream"},{label:"Vue Composables",hash:"#/docs/vue-composables",section:"Reference",keywords:"vue composables useRealtime useSubscribe usePublish useChannel usePresence useStream provide inject"},{label:"DevTools",hash:"#/docs/devtools",section:"Reference",keywords:"devtools panel inspect debug channels messages connection state offline queue"},{label:"API Reference",hash:"#/docs/api-reference",section:"Reference",keywords:"API reference createRealtimeClient serializeKey parseChannel createHookPipeline createHookableTransport deriveChannelFromUrl normalizePermissions createDedup createEphemeralMap throttle useGapRecovery useOfflineQueue createCoordinatedTransport createBroadcastChannelTransport createSharedWorkerTransport RealtimeProvider sseTransport centrifugoTransport createSseHandler createStartHandler"},{label:"Error Reference",hash:"#/docs/error-reference",section:"Reference",keywords:"error code RT_ troubleshoot debug ConflictError"},{label:"Wire Protocol",hash:"#/docs/wire-protocol",section:"Reference",keywords:"wire protocol SSE format envelope sequence signature message format"}];function Qf(c,h){const p=h.toLowerCase(),d=c.label.toLowerCase(),v=c.keywords.toLowerCase();if(d===p)return 100;if(d.startsWith(p))return 80;if(d.includes(p))return 60;const I=v.split(/\s+/);return I.some(y=>y===p)?50:I.some(y=>y.startsWith(p))?40:v.includes(p)?30:c.section.toLowerCase().includes(p)?10:0}function Ff({open:c,onClose:h}){const[p,d]=G.useState(""),v=G.useRef(null);if(G.useEffect(()=>{c&&(d(""),setTimeout(()=>v.current?.focus(),50))},[c]),G.useEffect(()=>{const y=S=>{(S.metaKey||S.ctrlKey)&&S.key==="k"&&(S.preventDefault(),h()),S.key==="Escape"&&c&&h()};return window.addEventListener("keydown",y),()=>window.removeEventListener("keydown",y)},[c,h]),!c)return null;const I=p.trim()?Lh.map(y=>({entry:y,score:Qf(y,p.trim())})).filter(y=>y.score>0).sort((y,S)=>S.score-y.score).slice(0,8).map(y=>y.entry):Lh.slice(0,8);return e.jsx("div",{className:"search-overlay",onClick:h,children:e.jsxs("div",{className:"search-dialog",onClick:y=>y.stopPropagation(),children:[e.jsx("input",{ref:v,className:"search-input",type:"text",placeholder:"Search docs...",value:p,onChange:y=>d(y.target.value)}),e.jsx("div",{className:"search-results",children:I.length===0?e.jsx("div",{className:"search-empty",children:"No results found"}):I.map(y=>e.jsxs("a",{href:y.hash,className:"search-result",onClick:h,children:[e.jsx("span",{className:"search-result-section",children:y.section}),e.jsx("span",{className:"search-result-label",children:y.label})]},y.hash))}),e.jsxs("div",{className:"search-footer",children:[e.jsx("kbd",{children:"Esc"})," to close"]})]})})}function Jh(c){var h,p,d="";if(typeof c=="string"||typeof c=="number")d+=c;else if(typeof c=="object")if(Array.isArray(c)){var v=c.length;for(h=0;h<v;h++)c[h]&&(p=Jh(c[h]))&&(d&&(d+=" "),d+=p)}else for(p in c)c[p]&&(d&&(d+=" "),d+=p);return d}function $h(){for(var c,h,p=0,d="",v=arguments.length;p<v;p++)(c=arguments[p])&&(h=Jh(c))&&(d&&(d+=" "),d+=h);return d}var Yf=Object.create,Za=Object.defineProperty,Gf=Object.defineProperties,Vf=Object.getOwnPropertyDescriptor,Kf=Object.getOwnPropertyDescriptors,ep=Object.getOwnPropertyNames,Wa=Object.getOwnPropertySymbols,Wf=Object.getPrototypeOf,Cc=Object.prototype.hasOwnProperty,tp=Object.prototype.propertyIsEnumerable,Bh=(c,h,p)=>h in c?Za(c,h,{enumerable:!0,configurable:!0,writable:!0,value:p}):c[h]=p,Pt=(c,h)=>{for(var p in h||(h={}))Cc.call(h,p)&&Bh(c,p,h[p]);if(Wa)for(var p of Wa(h))tp.call(h,p)&&Bh(c,p,h[p]);return c},Xa=(c,h)=>Gf(c,Kf(h)),np=(c,h)=>{var p={};for(var d in c)Cc.call(c,d)&&h.indexOf(d)<0&&(p[d]=c[d]);if(c!=null&&Wa)for(var d of Wa(c))h.indexOf(d)<0&&tp.call(c,d)&&(p[d]=c[d]);return p},Zf=(c,h)=>function(){return h||(0,c[ep(c)[0]])((h={exports:{}}).exports,h),h.exports},Xf=(c,h)=>{for(var p in h)Za(c,p,{get:h[p],enumerable:!0})},Jf=(c,h,p,d)=>{if(h&&typeof h=="object"||typeof h=="function")for(let v of ep(h))!Cc.call(c,v)&&v!==p&&Za(c,v,{get:()=>h[v],enumerable:!(d=Vf(h,v))||d.enumerable});return c},$f=(c,h,p)=>(p=c!=null?Yf(Wf(c)):{},Jf(!c||!c.__esModule?Za(p,"default",{value:c,enumerable:!0}):p,c)),ex=Zf({"../../node_modules/.pnpm/prismjs@1.29.0_patch_hash=vrxx3pzkik6jpmgpayxfjunetu/node_modules/prismjs/prism.js"(c,h){var p=(function(){var d=/(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i,v=0,I={},y={util:{encode:function C(R){return R instanceof S?new S(R.type,C(R.content),R.alias):Array.isArray(R)?R.map(C):R.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(C){return Object.prototype.toString.call(C).slice(8,-1)},objId:function(C){return C.__id||Object.defineProperty(C,"__id",{value:++v}),C.__id},clone:function C(R,O){O=O||{};var L,H;switch(y.util.type(R)){case"Object":if(H=y.util.objId(R),O[H])return O[H];L={},O[H]=L;for(var _ in R)R.hasOwnProperty(_)&&(L[_]=C(R[_],O));return L;case"Array":return H=y.util.objId(R),O[H]?O[H]:(L=[],O[H]=L,R.forEach(function(X,ie){L[ie]=C(X,O)}),L);default:return R}},getLanguage:function(C){for(;C;){var R=d.exec(C.className);if(R)return R[1].toLowerCase();C=C.parentElement}return"none"},setLanguage:function(C,R){C.className=C.className.replace(RegExp(d,"gi"),""),C.classList.add("language-"+R)},isActive:function(C,R,O){for(var L="no-"+R;C;){var H=C.classList;if(H.contains(R))return!0;if(H.contains(L))return!1;C=C.parentElement}return!!O}},languages:{plain:I,plaintext:I,text:I,txt:I,extend:function(C,R){var O=y.util.clone(y.languages[C]);for(var L in R)O[L]=R[L];return O},insertBefore:function(C,R,O,L){L=L||y.languages;var H=L[C],_={};for(var X in H)if(H.hasOwnProperty(X)){if(X==R)for(var ie in O)O.hasOwnProperty(ie)&&(_[ie]=O[ie]);O.hasOwnProperty(X)||(_[X]=H[X])}var xe=L[C];return L[C]=_,y.languages.DFS(y.languages,function(J,ge){ge===xe&&J!=C&&(this[J]=_)}),_},DFS:function C(R,O,L,H){H=H||{};var _=y.util.objId;for(var X in R)if(R.hasOwnProperty(X)){O.call(R,X,R[X],L||X);var ie=R[X],xe=y.util.type(ie);xe==="Object"&&!H[_(ie)]?(H[_(ie)]=!0,C(ie,O,null,H)):xe==="Array"&&!H[_(ie)]&&(H[_(ie)]=!0,C(ie,O,X,H))}}},plugins:{},highlight:function(C,R,O){var L={code:C,grammar:R,language:O};if(y.hooks.run("before-tokenize",L),!L.grammar)throw new Error('The language "'+L.language+'" has no grammar.');return L.tokens=y.tokenize(L.code,L.grammar),y.hooks.run("after-tokenize",L),S.stringify(y.util.encode(L.tokens),L.language)},tokenize:function(C,R){var O=R.rest;if(O){for(var L in O)R[L]=O[L];delete R.rest}var H=new A;return T(H,H.head,C),f(C,H,R,H.head,0),B(H)},hooks:{all:{},add:function(C,R){var O=y.hooks.all;O[C]=O[C]||[],O[C].push(R)},run:function(C,R){var O=y.hooks.all[C];if(!(!O||!O.length))for(var L=0,H;H=O[L++];)H(R)}},Token:S};function S(C,R,O,L){this.type=C,this.content=R,this.alias=O,this.length=(L||"").length|0}S.stringify=function C(R,O){if(typeof R=="string")return R;if(Array.isArray(R)){var L="";return R.forEach(function(xe){L+=C(xe,O)}),L}var H={type:R.type,content:C(R.content,O),tag:"span",classes:["token",R.type],attributes:{},language:O},_=R.alias;_&&(Array.isArray(_)?Array.prototype.push.apply(H.classes,_):H.classes.push(_)),y.hooks.run("wrap",H);var X="";for(var ie in H.attributes)X+=" "+ie+'="'+(H.attributes[ie]||"").replace(/"/g,"&quot;")+'"';return"<"+H.tag+' class="'+H.classes.join(" ")+'"'+X+">"+H.content+"</"+H.tag+">"};function g(C,R,O,L){C.lastIndex=R;var H=C.exec(O);if(H&&L&&H[1]){var _=H[1].length;H.index+=_,H[0]=H[0].slice(_)}return H}function f(C,R,O,L,H,_){for(var X in O)if(!(!O.hasOwnProperty(X)||!O[X])){var ie=O[X];ie=Array.isArray(ie)?ie:[ie];for(var xe=0;xe<ie.length;++xe){if(_&&_.cause==X+","+xe)return;var J=ie[xe],ge=J.inside,Re=!!J.lookbehind,et=!!J.greedy,Ue=J.alias;if(et&&!J.pattern.global){var Ee=J.pattern.toString().match(/[imsuy]*$/)[0];J.pattern=RegExp(J.pattern.source,Ee+"g")}for(var zt=J.pattern||J,Ce=L.next,ze=H;Ce!==R.tail&&!(_&&ze>=_.reach);ze+=Ce.value.length,Ce=Ce.next){var D=Ce.value;if(R.length>C.length)return;if(!(D instanceof S)){var F=1,Z;if(et){if(Z=g(zt,ze,C,Re),!Z||Z.index>=C.length)break;var q=Z.index,ye=Z.index+Z[0].length,oe=ze;for(oe+=Ce.value.length;q>=oe;)Ce=Ce.next,oe+=Ce.value.length;if(oe-=Ce.value.length,ze=oe,Ce.value instanceof S)continue;for(var j=Ce;j!==R.tail&&(oe<ye||typeof j.value=="string");j=j.next)F++,oe+=j.value.length;F--,D=C.slice(ze,oe),Z.index-=ze}else if(Z=g(zt,0,D,Re),!Z)continue;var q=Z.index,Y=Z[0],V=D.slice(0,q),te=D.slice(q+Y.length),re=ze+D.length;_&&re>_.reach&&(_.reach=re);var he=Ce.prev;V&&(he=T(R,he,V),ze+=V.length),Q(R,he,F);var Ve=new S(X,ge?y.tokenize(Y,ge):Y,Ue,Y);if(Ce=T(R,he,Ve),te&&T(R,Ce,te),F>1){var Ae={cause:X+","+xe,reach:re};f(C,R,O,Ce.prev,ze,Ae),_&&Ae.reach>_.reach&&(_.reach=Ae.reach)}}}}}}function A(){var C={value:null,prev:null,next:null},R={value:null,prev:C,next:null};C.next=R,this.head=C,this.tail=R,this.length=0}function T(C,R,O){var L=R.next,H={value:O,prev:R,next:L};return R.next=H,L.prev=H,C.length++,H}function Q(C,R,O){for(var L=R.next,H=0;H<O&&L!==C.tail;H++)L=L.next;R.next=L,L.prev=R,C.length-=H}function B(C){for(var R=[],O=C.head.next;O!==C.tail;)R.push(O.value),O=O.next;return R}return y})();h.exports=p,p.default=p}}),P=$f(ex());P.languages.markup={comment:{pattern:/<!--(?:(?!<!--)[\s\S])*?-->/,greedy:!0},prolog:{pattern:/<\?[\s\S]+?\?>/,greedy:!0},doctype:{pattern:/<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,greedy:!0,inside:{"internal-subset":{pattern:/(^[^\[]*\[)[\s\S]+(?=\]>$)/,lookbehind:!0,greedy:!0,inside:null},string:{pattern:/"[^"]*"|'[^']*'/,greedy:!0},punctuation:/^<!|>$|[[\]]/,"doctype-tag":/^DOCTYPE/i,name:/[^\s<>'"]+/}},cdata:{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,greedy:!0},tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"special-attr":[],"attr-value":{pattern:/=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,inside:{punctuation:[{pattern:/^=/,alias:"attr-equals"},{pattern:/^(\s*)["']|["']$/,lookbehind:!0}]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:[{pattern:/&[\da-z]{1,8};/i,alias:"named-entity"},/&#x?[\da-f]{1,8};/i]},P.languages.markup.tag.inside["attr-value"].inside.entity=P.languages.markup.entity,P.languages.markup.doctype.inside["internal-subset"].inside=P.languages.markup,P.hooks.add("wrap",function(c){c.type==="entity"&&(c.attributes.title=c.content.replace(/&amp;/,"&"))}),Object.defineProperty(P.languages.markup.tag,"addInlined",{value:function(c,d){var p={},p=(p["language-"+d]={pattern:/(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,lookbehind:!0,inside:P.languages[d]},p.cdata=/^<!\[CDATA\[|\]\]>$/i,{"included-cdata":{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,inside:p}}),d=(p["language-"+d]={pattern:/[\s\S]+/,inside:P.languages[d]},{});d[c]={pattern:RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g,function(){return c}),"i"),lookbehind:!0,greedy:!0,inside:p},P.languages.insertBefore("markup","cdata",d)}}),Object.defineProperty(P.languages.markup.tag,"addAttribute",{value:function(c,h){P.languages.markup.tag.inside["special-attr"].push({pattern:RegExp(/(^|["'\s])/.source+"(?:"+c+")"+/\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,"i"),lookbehind:!0,inside:{"attr-name":/^[^\s=]+/,"attr-value":{pattern:/=[\s\S]+/,inside:{value:{pattern:/(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,lookbehind:!0,alias:[h,"language-"+h],inside:P.languages[h]},punctuation:[{pattern:/^=/,alias:"attr-equals"},/"|'/]}}}})}}),P.languages.html=P.languages.markup,P.languages.mathml=P.languages.markup,P.languages.svg=P.languages.markup,P.languages.xml=P.languages.extend("markup",{}),P.languages.ssml=P.languages.xml,P.languages.atom=P.languages.xml,P.languages.rss=P.languages.xml,(function(c){var h={pattern:/\\[\\(){}[\]^$+*?|.]/,alias:"escape"},p=/\\(?:x[\da-fA-F]{2}|u[\da-fA-F]{4}|u\{[\da-fA-F]+\}|0[0-7]{0,2}|[123][0-7]{2}|c[a-zA-Z]|.)/,d="(?:[^\\\\-]|"+p.source+")",d=RegExp(d+"-"+d),v={pattern:/(<|')[^<>']+(?=[>']$)/,lookbehind:!0,alias:"variable"};c.languages.regex={"char-class":{pattern:/((?:^|[^\\])(?:\\\\)*)\[(?:[^\\\]]|\\[\s\S])*\]/,lookbehind:!0,inside:{"char-class-negation":{pattern:/(^\[)\^/,lookbehind:!0,alias:"operator"},"char-class-punctuation":{pattern:/^\[|\]$/,alias:"punctuation"},range:{pattern:d,inside:{escape:p,"range-punctuation":{pattern:/-/,alias:"operator"}}},"special-escape":h,"char-set":{pattern:/\\[wsd]|\\p\{[^{}]+\}/i,alias:"class-name"},escape:p}},"special-escape":h,"char-set":{pattern:/\.|\\[wsd]|\\p\{[^{}]+\}/i,alias:"class-name"},backreference:[{pattern:/\\(?![123][0-7]{2})[1-9]/,alias:"keyword"},{pattern:/\\k<[^<>']+>/,alias:"keyword",inside:{"group-name":v}}],anchor:{pattern:/[$^]|\\[ABbGZz]/,alias:"function"},escape:p,group:[{pattern:/\((?:\?(?:<[^<>']+>|'[^<>']+'|[>:]|<?[=!]|[idmnsuxU]+(?:-[idmnsuxU]+)?:?))?/,alias:"punctuation",inside:{"group-name":v}},{pattern:/\)/,alias:"punctuation"}],quantifier:{pattern:/(?:[+*?]|\{\d+(?:,\d*)?\})[?+]?/,alias:"number"},alternation:{pattern:/\|/,alias:"keyword"}}})(P),P.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0,greedy:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,boolean:/\b(?:false|true)\b/,function:/\b\w+(?=\()/,number:/\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,punctuation:/[{}[\];(),.:]/},P.languages.javascript=P.languages.extend("clike",{"class-name":[P.languages.clike["class-name"],{pattern:/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,lookbehind:!0}],keyword:[{pattern:/((?:^|\})\s*)catch\b/,lookbehind:!0},{pattern:/(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,lookbehind:!0}],function:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,number:{pattern:RegExp(/(^|[^\w$])/.source+"(?:"+/NaN|Infinity/.source+"|"+/0[bB][01]+(?:_[01]+)*n?/.source+"|"+/0[oO][0-7]+(?:_[0-7]+)*n?/.source+"|"+/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source+"|"+/\d+(?:_\d+)*n/.source+"|"+/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source+")"+/(?![\w$])/.source),lookbehind:!0},operator:/--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/}),P.languages.javascript["class-name"][0].pattern=/(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/,P.languages.insertBefore("javascript","keyword",{regex:{pattern:RegExp(/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source+/\//.source+"(?:"+/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source+"|"+/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source+")"+/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source),lookbehind:!0,greedy:!0,inside:{"regex-source":{pattern:/^(\/)[\s\S]+(?=\/[a-z]*$)/,lookbehind:!0,alias:"language-regex",inside:P.languages.regex},"regex-delimiter":/^\/|\/$/,"regex-flags":/^[a-z]+$/}},"function-variable":{pattern:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,lookbehind:!0,inside:P.languages.javascript},{pattern:/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,lookbehind:!0,inside:P.languages.javascript},{pattern:/(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,lookbehind:!0,inside:P.languages.javascript},{pattern:/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,lookbehind:!0,inside:P.languages.javascript}],constant:/\b[A-Z](?:[A-Z_]|\dx?)*\b/}),P.languages.insertBefore("javascript","string",{hashbang:{pattern:/^#!.*/,greedy:!0,alias:"comment"},"template-string":{pattern:/`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,greedy:!0,inside:{"template-punctuation":{pattern:/^`|`$/,alias:"string"},interpolation:{pattern:/((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,lookbehind:!0,inside:{"interpolation-punctuation":{pattern:/^\$\{|\}$/,alias:"punctuation"},rest:P.languages.javascript}},string:/[\s\S]+/}},"string-property":{pattern:/((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,lookbehind:!0,greedy:!0,alias:"property"}}),P.languages.insertBefore("javascript","operator",{"literal-property":{pattern:/((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,lookbehind:!0,alias:"property"}}),P.languages.markup&&(P.languages.markup.tag.addInlined("script","javascript"),P.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,"javascript")),P.languages.js=P.languages.javascript,P.languages.actionscript=P.languages.extend("javascript",{keyword:/\b(?:as|break|case|catch|class|const|default|delete|do|dynamic|each|else|extends|final|finally|for|function|get|if|implements|import|in|include|instanceof|interface|internal|is|namespace|native|new|null|override|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|use|var|void|while|with)\b/,operator:/\+\+|--|(?:[+\-*\/%^]|&&?|\|\|?|<<?|>>?>?|[!=]=?)=?|[~?@]/}),P.languages.actionscript["class-name"].alias="function",delete P.languages.actionscript.parameter,delete P.languages.actionscript["literal-property"],P.languages.markup&&P.languages.insertBefore("actionscript","string",{xml:{pattern:/(^|[^.])<\/?\w+(?:\s+[^\s>\/=]+=("|')(?:\\[\s\S]|(?!\2)[^\\])*\2)*\s*\/?>/,lookbehind:!0,inside:P.languages.markup}}),(function(c){var h=/#(?!\{).+/,p={pattern:/#\{[^}]+\}/,alias:"variable"};c.languages.coffeescript=c.languages.extend("javascript",{comment:h,string:[{pattern:/'(?:\\[\s\S]|[^\\'])*'/,greedy:!0},{pattern:/"(?:\\[\s\S]|[^\\"])*"/,greedy:!0,inside:{interpolation:p}}],keyword:/\b(?:and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,"class-member":{pattern:/@(?!\d)\w+/,alias:"variable"}}),c.languages.insertBefore("coffeescript","comment",{"multiline-comment":{pattern:/###[\s\S]+?###/,alias:"comment"},"block-regex":{pattern:/\/{3}[\s\S]*?\/{3}/,alias:"regex",inside:{comment:h,interpolation:p}}}),c.languages.insertBefore("coffeescript","string",{"inline-javascript":{pattern:/`(?:\\[\s\S]|[^\\`])*`/,inside:{delimiter:{pattern:/^`|`$/,alias:"punctuation"},script:{pattern:/[\s\S]+/,alias:"language-javascript",inside:c.languages.javascript}}},"multiline-string":[{pattern:/'''[\s\S]*?'''/,greedy:!0,alias:"string"},{pattern:/"""[\s\S]*?"""/,greedy:!0,alias:"string",inside:{interpolation:p}}]}),c.languages.insertBefore("coffeescript","keyword",{property:/(?!\d)\w+(?=\s*:(?!:))/}),delete c.languages.coffeescript["template-string"],c.languages.coffee=c.languages.coffeescript})(P),(function(c){var h=c.languages.javadoclike={parameter:{pattern:/(^[\t ]*(?:\/{3}|\*|\/\*\*)\s*@(?:arg|arguments|param)\s+)\w+/m,lookbehind:!0},keyword:{pattern:/(^[\t ]*(?:\/{3}|\*|\/\*\*)\s*|\{)@[a-z][a-zA-Z-]+\b/m,lookbehind:!0},punctuation:/[{}]/};Object.defineProperty(h,"addSupport",{value:function(p,d){(p=typeof p=="string"?[p]:p).forEach(function(v){var I=function(T){T.inside||(T.inside={}),T.inside.rest=d},y="doc-comment";if(S=c.languages[v]){var S,g=S[y];if((g=g||(S=c.languages.insertBefore(v,"comment",{"doc-comment":{pattern:/(^|[^\\])\/\*\*[^/][\s\S]*?(?:\*\/|$)/,lookbehind:!0,alias:"comment"}}))[y])instanceof RegExp&&(g=S[y]={pattern:g}),Array.isArray(g))for(var f=0,A=g.length;f<A;f++)g[f]instanceof RegExp&&(g[f]={pattern:g[f]}),I(g[f]);else I(g)}})}}),h.addSupport(["java","javascript","php"],h)})(P),(function(c){var h=/(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/,h=(c.languages.css={comment:/\/\*[\s\S]*?\*\//,atrule:{pattern:RegExp("@[\\w-](?:"+/[^;{\s"']|\s+(?!\s)/.source+"|"+h.source+")*?"+/(?:;|(?=\s*\{))/.source),inside:{rule:/^@[\w-]+/,"selector-function-argument":{pattern:/(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,lookbehind:!0,alias:"selector"},keyword:{pattern:/(^|[^\w-])(?:and|not|only|or)(?![\w-])/,lookbehind:!0}}},url:{pattern:RegExp("\\burl\\((?:"+h.source+"|"+/(?:[^\\\r\n()"']|\\[\s\S])*/.source+")\\)","i"),greedy:!0,inside:{function:/^url/i,punctuation:/^\(|\)$/,string:{pattern:RegExp("^"+h.source+"$"),alias:"url"}}},selector:{pattern:RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|`+h.source+")*(?=\\s*\\{)"),lookbehind:!0},string:{pattern:h,greedy:!0},property:{pattern:/(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,lookbehind:!0},important:/!important\b/i,function:{pattern:/(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,lookbehind:!0},punctuation:/[(){};:,]/},c.languages.css.atrule.inside.rest=c.languages.css,c.languages.markup);h&&(h.tag.addInlined("style","css"),h.tag.addAttribute("style","css"))})(P),(function(c){var h=/("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,h=(c.languages.css.selector={pattern:c.languages.css.selector.pattern,lookbehind:!0,inside:h={"pseudo-element":/:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,"pseudo-class":/:[-\w]+/,class:/\.[-\w]+/,id:/#[-\w]+/,attribute:{pattern:RegExp(`\\[(?:[^[\\]"']|`+h.source+")*\\]"),greedy:!0,inside:{punctuation:/^\[|\]$/,"case-sensitivity":{pattern:/(\s)[si]$/i,lookbehind:!0,alias:"keyword"},namespace:{pattern:/^(\s*)(?:(?!\s)[-*\w\xA0-\uFFFF])*\|(?!=)/,lookbehind:!0,inside:{punctuation:/\|$/}},"attr-name":{pattern:/^(\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+/,lookbehind:!0},"attr-value":[h,{pattern:/(=\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+(?=\s*$)/,lookbehind:!0}],operator:/[|~*^$]?=/}},"n-th":[{pattern:/(\(\s*)[+-]?\d*[\dn](?:\s*[+-]\s*\d+)?(?=\s*\))/,lookbehind:!0,inside:{number:/[\dn]+/,operator:/[+-]/}},{pattern:/(\(\s*)(?:even|odd)(?=\s*\))/i,lookbehind:!0}],combinator:/>|\+|~|\|\|/,punctuation:/[(),]/}},c.languages.css.atrule.inside["selector-function-argument"].inside=h,c.languages.insertBefore("css","property",{variable:{pattern:/(^|[^-\w\xA0-\uFFFF])--(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*/i,lookbehind:!0}}),{pattern:/(\b\d+)(?:%|[a-z]+(?![\w-]))/,lookbehind:!0}),p={pattern:/(^|[^\w.-])-?(?:\d+(?:\.\d+)?|\.\d+)/,lookbehind:!0};c.languages.insertBefore("css","function",{operator:{pattern:/(\s)[+\-*\/](?=\s)/,lookbehind:!0},hexcode:{pattern:/\B#[\da-f]{3,8}\b/i,alias:"color"},color:[{pattern:/(^|[^\w-])(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGr[ae]y|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGr[ae]y|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGr[ae]y|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gr[ae]y|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGr[ae]y|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGr[ae]y|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|RebeccaPurple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGr[ae]y|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Transparent|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)(?![\w-])/i,lookbehind:!0},{pattern:/\b(?:hsl|rgb)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:hsl|rgb)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B/i,inside:{unit:h,number:p,function:/[\w-]+(?=\()/,punctuation:/[(),]/}}],entity:/\\[\da-f]{1,8}/i,unit:h,number:p})})(P),(function(c){var h=/[*&][^\s[\]{},]+/,p=/!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/,d="(?:"+p.source+"(?:[ 	]+"+h.source+")?|"+h.source+"(?:[ 	]+"+p.source+")?)",v=/(?:[^\s\x00-\x08\x0e-\x1f!"#%&'*,\-:>?@[\]`{|}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]|[?:-]<PLAIN>)(?:[ \t]*(?:(?![#:])<PLAIN>|:<PLAIN>))*/.source.replace(/<PLAIN>/g,function(){return/[^\s\x00-\x08\x0e-\x1f,[\]{}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]/.source}),I=/"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/.source;function y(S,g){g=(g||"").replace(/m/g,"")+"m";var f=/([:\-,[{]\s*(?:\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|\]|\}|(?:[\r\n]\s*)?#))/.source.replace(/<<prop>>/g,function(){return d}).replace(/<<value>>/g,function(){return S});return RegExp(f,g)}c.languages.yaml={scalar:{pattern:RegExp(/([\-:]\s*(?:\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)\S[^\r\n]*(?:\2[^\r\n]+)*)/.source.replace(/<<prop>>/g,function(){return d})),lookbehind:!0,alias:"string"},comment:/#.*/,key:{pattern:RegExp(/((?:^|[:\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)<<key>>(?=\s*:\s)/.source.replace(/<<prop>>/g,function(){return d}).replace(/<<key>>/g,function(){return"(?:"+v+"|"+I+")"})),lookbehind:!0,greedy:!0,alias:"atrule"},directive:{pattern:/(^[ \t]*)%.+/m,lookbehind:!0,alias:"important"},datetime:{pattern:y(/\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?(?:[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?))?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?/.source),lookbehind:!0,alias:"number"},boolean:{pattern:y(/false|true/.source,"i"),lookbehind:!0,alias:"important"},null:{pattern:y(/null|~/.source,"i"),lookbehind:!0,alias:"important"},string:{pattern:y(I),lookbehind:!0,greedy:!0},number:{pattern:y(/[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\.inf|\.nan)/.source,"i"),lookbehind:!0},tag:p,important:h,punctuation:/---|[:[\]{}\-,|>?]|\.\.\./},c.languages.yml=c.languages.yaml})(P),(function(c){var h=/(?:\\.|[^\\\n\r]|(?:\n|\r\n?)(?![\r\n]))/.source;function p(f){return f=f.replace(/<inner>/g,function(){return h}),RegExp(/((?:^|[^\\])(?:\\{2})*)/.source+"(?:"+f+")")}var d=/(?:\\.|``(?:[^`\r\n]|`(?!`))+``|`[^`\r\n]+`|[^\\|\r\n`])+/.source,v=/\|?__(?:\|__)+\|?(?:(?:\n|\r\n?)|(?![\s\S]))/.source.replace(/__/g,function(){return d}),I=/\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)+\|?(?:\n|\r\n?)/.source,y=(c.languages.markdown=c.languages.extend("markup",{}),c.languages.insertBefore("markdown","prolog",{"front-matter-block":{pattern:/(^(?:\s*[\r\n])?)---(?!.)[\s\S]*?[\r\n]---(?!.)/,lookbehind:!0,greedy:!0,inside:{punctuation:/^---|---$/,"front-matter":{pattern:/\S+(?:\s+\S+)*/,alias:["yaml","language-yaml"],inside:c.languages.yaml}}},blockquote:{pattern:/^>(?:[\t ]*>)*/m,alias:"punctuation"},table:{pattern:RegExp("^"+v+I+"(?:"+v+")*","m"),inside:{"table-data-rows":{pattern:RegExp("^("+v+I+")(?:"+v+")*$"),lookbehind:!0,inside:{"table-data":{pattern:RegExp(d),inside:c.languages.markdown},punctuation:/\|/}},"table-line":{pattern:RegExp("^("+v+")"+I+"$"),lookbehind:!0,inside:{punctuation:/\||:?-{3,}:?/}},"table-header-row":{pattern:RegExp("^"+v+"$"),inside:{"table-header":{pattern:RegExp(d),alias:"important",inside:c.languages.markdown},punctuation:/\|/}}}},code:[{pattern:/((?:^|\n)[ \t]*\n|(?:^|\r\n?)[ \t]*\r\n?)(?: {4}|\t).+(?:(?:\n|\r\n?)(?: {4}|\t).+)*/,lookbehind:!0,alias:"keyword"},{pattern:/^```[\s\S]*?^```$/m,greedy:!0,inside:{"code-block":{pattern:/^(```.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^```$)/m,lookbehind:!0},"code-language":{pattern:/^(```).+/,lookbehind:!0},punctuation:/```/}}],title:[{pattern:/\S.*(?:\n|\r\n?)(?:==+|--+)(?=[ \t]*$)/m,alias:"important",inside:{punctuation:/==+$|--+$/}},{pattern:/(^\s*)#.+/m,lookbehind:!0,alias:"important",inside:{punctuation:/^#+|#+$/}}],hr:{pattern:/(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,lookbehind:!0,alias:"punctuation"},list:{pattern:/(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,lookbehind:!0,alias:"punctuation"},"url-reference":{pattern:/!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,inside:{variable:{pattern:/^(!?\[)[^\]]+/,lookbehind:!0},string:/(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,punctuation:/^[\[\]!:]|[<>]/},alias:"url"},bold:{pattern:p(/\b__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__\b|\*\*(?:(?!\*)<inner>|\*(?:(?!\*)<inner>)+\*)+\*\*/.source),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^..)[\s\S]+(?=..$)/,lookbehind:!0,inside:{}},punctuation:/\*\*|__/}},italic:{pattern:p(/\b_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_\b|\*(?:(?!\*)<inner>|\*\*(?:(?!\*)<inner>)+\*\*)+\*/.source),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^.)[\s\S]+(?=.$)/,lookbehind:!0,inside:{}},punctuation:/[*_]/}},strike:{pattern:p(/(~~?)(?:(?!~)<inner>)+\2/.source),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^~~?)[\s\S]+(?=\1$)/,lookbehind:!0,inside:{}},punctuation:/~~?/}},"code-snippet":{pattern:/(^|[^\\`])(?:``[^`\r\n]+(?:`[^`\r\n]+)*``(?!`)|`[^`\r\n]+`(?!`))/,lookbehind:!0,greedy:!0,alias:["code","keyword"]},url:{pattern:p(/!?\[(?:(?!\])<inner>)+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)|[ \t]?\[(?:(?!\])<inner>)+\])/.source),lookbehind:!0,greedy:!0,inside:{operator:/^!/,content:{pattern:/(^\[)[^\]]+(?=\])/,lookbehind:!0,inside:{}},variable:{pattern:/(^\][ \t]?\[)[^\]]+(?=\]$)/,lookbehind:!0},url:{pattern:/(^\]\()[^\s)]+/,lookbehind:!0},string:{pattern:/(^[ \t]+)"(?:\\.|[^"\\])*"(?=\)$)/,lookbehind:!0}}}}),["url","bold","italic","strike"].forEach(function(f){["url","bold","italic","strike","code-snippet"].forEach(function(A){f!==A&&(c.languages.markdown[f].inside.content.inside[A]=c.languages.markdown[A])})}),c.hooks.add("after-tokenize",function(f){f.language!=="markdown"&&f.language!=="md"||(function A(T){if(T&&typeof T!="string")for(var Q=0,B=T.length;Q<B;Q++){var C,R=T[Q];R.type!=="code"?A(R.content):(C=R.content[1],R=R.content[3],C&&R&&C.type==="code-language"&&R.type==="code-block"&&typeof C.content=="string"&&(C=C.content.replace(/\b#/g,"sharp").replace(/\b\+\+/g,"pp"),C="language-"+(C=(/[a-z][\w-]*/i.exec(C)||[""])[0].toLowerCase()),R.alias?typeof R.alias=="string"?R.alias=[R.alias,C]:R.alias.push(C):R.alias=[C]))}})(f.tokens)}),c.hooks.add("wrap",function(f){if(f.type==="code-block"){for(var A="",T=0,Q=f.classes.length;T<Q;T++){var B=f.classes[T],B=/language-(.+)/.exec(B);if(B){A=B[1];break}}var C,R=c.languages[A];R?f.content=c.highlight((function(O){return O=O.replace(y,""),O=O.replace(/&(\w{1,8}|#x?[\da-f]{1,8});/gi,function(L,H){var _;return(H=H.toLowerCase())[0]==="#"?(_=H[1]==="x"?parseInt(H.slice(2),16):Number(H.slice(1)),g(_)):S[H]||L})})(f.content),R,A):A&&A!=="none"&&c.plugins.autoloader&&(C="md-"+new Date().valueOf()+"-"+Math.floor(1e16*Math.random()),f.attributes.id=C,c.plugins.autoloader.loadLanguages(A,function(){var O=document.getElementById(C);O&&(O.innerHTML=c.highlight(O.textContent,c.languages[A],A))}))}}),RegExp(c.languages.markup.tag.pattern.source,"gi")),S={amp:"&",lt:"<",gt:">",quot:'"'},g=String.fromCodePoint||String.fromCharCode;c.languages.md=c.languages.markdown})(P),P.languages.graphql={comment:/#.*/,description:{pattern:/(?:"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*")(?=\s*[a-z_])/i,greedy:!0,alias:"string",inside:{"language-markdown":{pattern:/(^"(?:"")?)(?!\1)[\s\S]+(?=\1$)/,lookbehind:!0,inside:P.languages.markdown}}},string:{pattern:/"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*"/,greedy:!0},number:/(?:\B-|\b)\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,boolean:/\b(?:false|true)\b/,variable:/\$[a-z_]\w*/i,directive:{pattern:/@[a-z_]\w*/i,alias:"function"},"attr-name":{pattern:/\b[a-z_]\w*(?=\s*(?:\((?:[^()"]|"(?:\\.|[^\\"\r\n])*")*\))?:)/i,greedy:!0},"atom-input":{pattern:/\b[A-Z]\w*Input\b/,alias:"class-name"},scalar:/\b(?:Boolean|Float|ID|Int|String)\b/,constant:/\b[A-Z][A-Z_\d]*\b/,"class-name":{pattern:/(\b(?:enum|implements|interface|on|scalar|type|union)\s+|&\s*|:\s*|\[)[A-Z_]\w*/,lookbehind:!0},fragment:{pattern:/(\bfragment\s+|\.{3}\s*(?!on\b))[a-zA-Z_]\w*/,lookbehind:!0,alias:"function"},"definition-mutation":{pattern:/(\bmutation\s+)[a-zA-Z_]\w*/,lookbehind:!0,alias:"function"},"definition-query":{pattern:/(\bquery\s+)[a-zA-Z_]\w*/,lookbehind:!0,alias:"function"},keyword:/\b(?:directive|enum|extend|fragment|implements|input|interface|mutation|on|query|repeatable|scalar|schema|subscription|type|union)\b/,operator:/[!=|&]|\.{3}/,"property-query":/\w+(?=\s*\()/,object:/\w+(?=\s*\{)/,punctuation:/[!(){}\[\]:=,]/,property:/\w+/},P.hooks.add("after-tokenize",function(c){if(c.language==="graphql")for(var h=c.tokens.filter(function(C){return typeof C!="string"&&C.type!=="comment"&&C.type!=="scalar"}),p=0;p<h.length;){var d=h[p++];if(d.type==="keyword"&&d.content==="mutation"){var v=[];if(T(["definition-mutation","punctuation"])&&A(1).content==="("){p+=2;var I=Q(/^\($/,/^\)$/);if(I===-1)continue;for(;p<I;p++){var y=A(0);y.type==="variable"&&(B(y,"variable-input"),v.push(y.content))}p=I+1}if(T(["punctuation","property-query"])&&A(0).content==="{"&&(p++,B(A(0),"property-mutation"),0<v.length)){var S=Q(/^\{$/,/^\}$/);if(S!==-1)for(var g=p;g<S;g++){var f=h[g];f.type==="variable"&&0<=v.indexOf(f.content)&&B(f,"variable-input")}}}}function A(C){return h[p+C]}function T(C,R){R=R||0;for(var O=0;O<C.length;O++){var L=A(O+R);if(!L||L.type!==C[O])return}return 1}function Q(C,R){for(var O=1,L=p;L<h.length;L++){var H=h[L],_=H.content;if(H.type==="punctuation"&&typeof _=="string"){if(C.test(_))O++;else if(R.test(_)&&--O===0)return L}}return-1}function B(C,R){var O=C.alias;O?Array.isArray(O)||(C.alias=O=[O]):C.alias=O=[],O.push(R)}}),P.languages.sql={comment:{pattern:/(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,lookbehind:!0},variable:[{pattern:/@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,greedy:!0},/@[\w.$]+/],string:{pattern:/(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,greedy:!0,lookbehind:!0},identifier:{pattern:/(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/,greedy:!0,lookbehind:!0,inside:{punctuation:/^`|`$/}},function:/\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i,keyword:/\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,boolean:/\b(?:FALSE|NULL|TRUE)\b/i,number:/\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,operator:/[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,punctuation:/[;[\]()`,.]/},(function(c){var h=c.languages.javascript["template-string"],p=h.pattern.source,d=h.inside.interpolation,v=d.inside["interpolation-punctuation"],I=d.pattern.source;function y(T,Q){if(c.languages[T])return{pattern:RegExp("((?:"+Q+")\\s*)"+p),lookbehind:!0,greedy:!0,inside:{"template-punctuation":{pattern:/^`|`$/,alias:"string"},"embedded-code":{pattern:/[\s\S]+/,alias:T}}}}function S(T,Q,B){return T={code:T,grammar:Q,language:B},c.hooks.run("before-tokenize",T),T.tokens=c.tokenize(T.code,T.grammar),c.hooks.run("after-tokenize",T),T.tokens}function g(T,Q,B){var O=c.tokenize(T,{interpolation:{pattern:RegExp(I),lookbehind:!0}}),C=0,R={},O=S(O.map(function(H){if(typeof H=="string")return H;for(var _,X,H=H.content;T.indexOf((X=C++,_="___"+B.toUpperCase()+"_"+X+"___"))!==-1;);return R[_]=H,_}).join(""),Q,B),L=Object.keys(R);return C=0,(function H(_){for(var X=0;X<_.length;X++){if(C>=L.length)return;var ie,xe,J,ge,Re,et,Ue,Ee=_[X];typeof Ee=="string"||typeof Ee.content=="string"?(ie=L[C],(Ue=(et=typeof Ee=="string"?Ee:Ee.content).indexOf(ie))!==-1&&(++C,xe=et.substring(0,Ue),Re=R[ie],J=void 0,(ge={})["interpolation-punctuation"]=v,(ge=c.tokenize(Re,ge)).length===3&&((J=[1,1]).push.apply(J,S(ge[1],c.languages.javascript,"javascript")),ge.splice.apply(ge,J)),J=new c.Token("interpolation",ge,d.alias,Re),ge=et.substring(Ue+ie.length),Re=[],xe&&Re.push(xe),Re.push(J),ge&&(H(et=[ge]),Re.push.apply(Re,et)),typeof Ee=="string"?(_.splice.apply(_,[X,1].concat(Re)),X+=Re.length-1):Ee.content=Re)):(Ue=Ee.content,Array.isArray(Ue)?H(Ue):H([Ue]))}})(O),new c.Token(B,O,"language-"+B,T)}c.languages.javascript["template-string"]=[y("css",/\b(?:styled(?:\([^)]*\))?(?:\s*\.\s*\w+(?:\([^)]*\))*)*|css(?:\s*\.\s*(?:global|resolve))?|createGlobalStyle|keyframes)/.source),y("html",/\bhtml|\.\s*(?:inner|outer)HTML\s*\+?=/.source),y("svg",/\bsvg/.source),y("markdown",/\b(?:markdown|md)/.source),y("graphql",/\b(?:gql|graphql(?:\s*\.\s*experimental)?)/.source),y("sql",/\bsql/.source),h].filter(Boolean);var f={javascript:!0,js:!0,typescript:!0,ts:!0,jsx:!0,tsx:!0};function A(T){return typeof T=="string"?T:Array.isArray(T)?T.map(A).join(""):A(T.content)}c.hooks.add("after-tokenize",function(T){T.language in f&&(function Q(B){for(var C=0,R=B.length;C<R;C++){var O,L,H,_=B[C];typeof _!="string"&&(O=_.content,Array.isArray(O)?_.type==="template-string"?(_=O[1],O.length===3&&typeof _!="string"&&_.type==="embedded-code"&&(L=A(_),_=_.alias,_=Array.isArray(_)?_[0]:_,H=c.languages[_])&&(O[1]=g(L,H,_))):Q(O):typeof O!="string"&&Q([O]))}})(T.tokens)})})(P),(function(c){c.languages.typescript=c.languages.extend("javascript",{"class-name":{pattern:/(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,lookbehind:!0,greedy:!0,inside:null},builtin:/\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/}),c.languages.typescript.keyword.push(/\b(?:abstract|declare|is|keyof|readonly|require)\b/,/\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,/\btype\b(?=\s*(?:[\{*]|$))/),delete c.languages.typescript.parameter,delete c.languages.typescript["literal-property"];var h=c.languages.extend("typescript",{});delete h["class-name"],c.languages.typescript["class-name"].inside=h,c.languages.insertBefore("typescript","function",{decorator:{pattern:/@[$\w\xA0-\uFFFF]+/,inside:{at:{pattern:/^@/,alias:"operator"},function:/^[\s\S]+/}},"generic-function":{pattern:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,greedy:!0,inside:{function:/^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,generic:{pattern:/<[\s\S]+/,alias:"class-name",inside:h}}}}),c.languages.ts=c.languages.typescript})(P),(function(c){var h=c.languages.javascript,p=/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})+\}/.source,d="(@(?:arg|argument|param|property)\\s+(?:"+p+"\\s+)?)";c.languages.jsdoc=c.languages.extend("javadoclike",{parameter:{pattern:RegExp(d+/(?:(?!\s)[$\w\xA0-\uFFFF.])+(?=\s|$)/.source),lookbehind:!0,inside:{punctuation:/\./}}}),c.languages.insertBefore("jsdoc","keyword",{"optional-parameter":{pattern:RegExp(d+/\[(?:(?!\s)[$\w\xA0-\uFFFF.])+(?:=[^[\]]+)?\](?=\s|$)/.source),lookbehind:!0,inside:{parameter:{pattern:/(^\[)[$\w\xA0-\uFFFF\.]+/,lookbehind:!0,inside:{punctuation:/\./}},code:{pattern:/(=)[\s\S]*(?=\]$)/,lookbehind:!0,inside:h,alias:"language-javascript"},punctuation:/[=[\]]/}},"class-name":[{pattern:RegExp(/(@(?:augments|class|extends|interface|memberof!?|template|this|typedef)\s+(?:<TYPE>\s+)?)[A-Z]\w*(?:\.[A-Z]\w*)*/.source.replace(/<TYPE>/g,function(){return p})),lookbehind:!0,inside:{punctuation:/\./}},{pattern:RegExp("(@[a-z]+\\s+)"+p),lookbehind:!0,inside:{string:h.string,number:h.number,boolean:h.boolean,keyword:c.languages.typescript.keyword,operator:/=>|\.\.\.|[&|?:*]/,punctuation:/[.,;=<>{}()[\]]/}}],example:{pattern:/(@example\s+(?!\s))(?:[^@\s]|\s+(?!\s))+?(?=\s*(?:\*\s*)?(?:@\w|\*\/))/,lookbehind:!0,inside:{code:{pattern:/^([\t ]*(?:\*\s*)?)\S.*$/m,lookbehind:!0,inside:h,alias:"language-javascript"}}}}),c.languages.javadoclike.addSupport("javascript",c.languages.jsdoc)})(P),(function(c){c.languages.flow=c.languages.extend("javascript",{}),c.languages.insertBefore("flow","keyword",{type:[{pattern:/\b(?:[Bb]oolean|Function|[Nn]umber|[Ss]tring|[Ss]ymbol|any|mixed|null|void)\b/,alias:"class-name"}]}),c.languages.flow["function-variable"].pattern=/(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=\s*(?:function\b|(?:\([^()]*\)(?:\s*:\s*\w+)?|(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/i,delete c.languages.flow.parameter,c.languages.insertBefore("flow","operator",{"flow-punctuation":{pattern:/\{\||\|\}/,alias:"punctuation"}}),Array.isArray(c.languages.flow.keyword)||(c.languages.flow.keyword=[c.languages.flow.keyword]),c.languages.flow.keyword.unshift({pattern:/(^|[^$]\b)(?:Class|declare|opaque|type)\b(?!\$)/,lookbehind:!0},{pattern:/(^|[^$]\B)\$(?:Diff|Enum|Exact|Keys|ObjMap|PropertyType|Record|Shape|Subtype|Supertype|await)\b(?!\$)/,lookbehind:!0})})(P),P.languages.n4js=P.languages.extend("javascript",{keyword:/\b(?:Array|any|boolean|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|module|new|null|number|package|private|protected|public|return|set|static|string|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)\b/}),P.languages.insertBefore("n4js","constant",{annotation:{pattern:/@+\w+/,alias:"operator"}}),P.languages.n4jsd=P.languages.n4js,(function(c){function h(y,S){return RegExp(y.replace(/<ID>/g,function(){return/(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/.source}),S)}c.languages.insertBefore("javascript","function-variable",{"method-variable":{pattern:RegExp("(\\.\\s*)"+c.languages.javascript["function-variable"].pattern.source),lookbehind:!0,alias:["function-variable","method","function","property-access"]}}),c.languages.insertBefore("javascript","function",{method:{pattern:RegExp("(\\.\\s*)"+c.languages.javascript.function.source),lookbehind:!0,alias:["function","property-access"]}}),c.languages.insertBefore("javascript","constant",{"known-class-name":[{pattern:/\b(?:(?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)?Array|ArrayBuffer|BigInt|Boolean|DataView|Date|Error|Function|Intl|JSON|(?:Weak)?(?:Map|Set)|Math|Number|Object|Promise|Proxy|Reflect|RegExp|String|Symbol|WebAssembly)\b/,alias:"class-name"},{pattern:/\b(?:[A-Z]\w*)Error\b/,alias:"class-name"}]}),c.languages.insertBefore("javascript","keyword",{imports:{pattern:h(/(\bimport\b\s*)(?:<ID>(?:\s*,\s*(?:\*\s*as\s+<ID>|\{[^{}]*\}))?|\*\s*as\s+<ID>|\{[^{}]*\})(?=\s*\bfrom\b)/.source),lookbehind:!0,inside:c.languages.javascript},exports:{pattern:h(/(\bexport\b\s*)(?:\*(?:\s*as\s+<ID>)?(?=\s*\bfrom\b)|\{[^{}]*\})/.source),lookbehind:!0,inside:c.languages.javascript}}),c.languages.javascript.keyword.unshift({pattern:/\b(?:as|default|export|from|import)\b/,alias:"module"},{pattern:/\b(?:await|break|catch|continue|do|else|finally|for|if|return|switch|throw|try|while|yield)\b/,alias:"control-flow"},{pattern:/\bnull\b/,alias:["null","nil"]},{pattern:/\bundefined\b/,alias:"nil"}),c.languages.insertBefore("javascript","operator",{spread:{pattern:/\.{3}/,alias:"operator"},arrow:{pattern:/=>/,alias:"operator"}}),c.languages.insertBefore("javascript","punctuation",{"property-access":{pattern:h(/(\.\s*)#?<ID>/.source),lookbehind:!0},"maybe-class-name":{pattern:/(^|[^$\w\xA0-\uFFFF])[A-Z][$\w\xA0-\uFFFF]+/,lookbehind:!0},dom:{pattern:/\b(?:document|(?:local|session)Storage|location|navigator|performance|window)\b/,alias:"variable"},console:{pattern:/\bconsole(?=\s*\.)/,alias:"class-name"}});for(var p=["function","function-variable","method","method-variable","property-access"],d=0;d<p.length;d++){var I=p[d],v=c.languages.javascript[I],I=(v=c.util.type(v)==="RegExp"?c.languages.javascript[I]={pattern:v}:v).inside||{};(v.inside=I)["maybe-class-name"]=/^[A-Z][\s\S]*/}})(P),(function(c){var h=c.util.clone(c.languages.javascript),p=/(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source,d=/(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source,v=/(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;function I(g,f){return g=g.replace(/<S>/g,function(){return p}).replace(/<BRACES>/g,function(){return d}).replace(/<SPREAD>/g,function(){return v}),RegExp(g,f)}v=I(v).source,c.languages.jsx=c.languages.extend("markup",h),c.languages.jsx.tag.pattern=I(/<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/.source),c.languages.jsx.tag.inside.tag.pattern=/^<\/?[^\s>\/]*/,c.languages.jsx.tag.inside["attr-value"].pattern=/=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/,c.languages.jsx.tag.inside.tag.inside["class-name"]=/^[A-Z]\w*(?:\.[A-Z]\w*)*$/,c.languages.jsx.tag.inside.comment=h.comment,c.languages.insertBefore("inside","attr-name",{spread:{pattern:I(/<SPREAD>/.source),inside:c.languages.jsx}},c.languages.jsx.tag),c.languages.insertBefore("inside","special-attr",{script:{pattern:I(/=<BRACES>/.source),alias:"language-javascript",inside:{"script-punctuation":{pattern:/^=(?=\{)/,alias:"punctuation"},rest:c.languages.jsx}}},c.languages.jsx.tag);function y(g){for(var f=[],A=0;A<g.length;A++){var T=g[A],Q=!1;typeof T!="string"&&(T.type==="tag"&&T.content[0]&&T.content[0].type==="tag"?T.content[0].content[0].content==="</"?0<f.length&&f[f.length-1].tagName===S(T.content[0].content[1])&&f.pop():T.content[T.content.length-1].content!=="/>"&&f.push({tagName:S(T.content[0].content[1]),openedBraces:0}):0<f.length&&T.type==="punctuation"&&T.content==="{"?f[f.length-1].openedBraces++:0<f.length&&0<f[f.length-1].openedBraces&&T.type==="punctuation"&&T.content==="}"?f[f.length-1].openedBraces--:Q=!0),(Q||typeof T=="string")&&0<f.length&&f[f.length-1].openedBraces===0&&(Q=S(T),A<g.length-1&&(typeof g[A+1]=="string"||g[A+1].type==="plain-text")&&(Q+=S(g[A+1]),g.splice(A+1,1)),0<A&&(typeof g[A-1]=="string"||g[A-1].type==="plain-text")&&(Q=S(g[A-1])+Q,g.splice(A-1,1),A--),g[A]=new c.Token("plain-text",Q,null,Q)),T.content&&typeof T.content!="string"&&y(T.content)}}var S=function(g){return g?typeof g=="string"?g:typeof g.content=="string"?g.content:g.content.map(S).join(""):""};c.hooks.add("after-tokenize",function(g){g.language!=="jsx"&&g.language!=="tsx"||y(g.tokens)})})(P),(function(c){var h=c.util.clone(c.languages.typescript),h=(c.languages.tsx=c.languages.extend("jsx",h),delete c.languages.tsx.parameter,delete c.languages.tsx["literal-property"],c.languages.tsx.tag);h.pattern=RegExp(/(^|[^\w$]|(?=<\/))/.source+"(?:"+h.pattern.source+")",h.pattern.flags),h.lookbehind=!0})(P),P.languages.swift={comment:{pattern:/(^|[^\\:])(?:\/\/.*|\/\*(?:[^/*]|\/(?!\*)|\*(?!\/)|\/\*(?:[^*]|\*(?!\/))*\*\/)*\*\/)/,lookbehind:!0,greedy:!0},"string-literal":[{pattern:RegExp(/(^|[^"#])/.source+"(?:"+/"(?:\\(?:\((?:[^()]|\([^()]*\))*\)|\r\n|[^(])|[^\\\r\n"])*"/.source+"|"+/"""(?:\\(?:\((?:[^()]|\([^()]*\))*\)|[^(])|[^\\"]|"(?!""))*"""/.source+")"+/(?!["#])/.source),lookbehind:!0,greedy:!0,inside:{interpolation:{pattern:/(\\\()(?:[^()]|\([^()]*\))*(?=\))/,lookbehind:!0,inside:null},"interpolation-punctuation":{pattern:/^\)|\\\($/,alias:"punctuation"},punctuation:/\\(?=[\r\n])/,string:/[\s\S]+/}},{pattern:RegExp(/(^|[^"#])(#+)/.source+"(?:"+/"(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|\r\n|[^#])|[^\\\r\n])*?"/.source+"|"+/"""(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|[^#])|[^\\])*?"""/.source+")\\2"),lookbehind:!0,greedy:!0,inside:{interpolation:{pattern:/(\\#+\()(?:[^()]|\([^()]*\))*(?=\))/,lookbehind:!0,inside:null},"interpolation-punctuation":{pattern:/^\)|\\#+\($/,alias:"punctuation"},string:/[\s\S]+/}}],directive:{pattern:RegExp(/#/.source+"(?:"+/(?:elseif|if)\b/.source+"(?:[ 	]*"+/(?:![ \t]*)?(?:\b\w+\b(?:[ \t]*\((?:[^()]|\([^()]*\))*\))?|\((?:[^()]|\([^()]*\))*\))(?:[ \t]*(?:&&|\|\|))?/.source+")+|"+/(?:else|endif)\b/.source+")"),alias:"property",inside:{"directive-name":/^#\w+/,boolean:/\b(?:false|true)\b/,number:/\b\d+(?:\.\d+)*\b/,operator:/!|&&|\|\||[<>]=?/,punctuation:/[(),]/}},literal:{pattern:/#(?:colorLiteral|column|dsohandle|file(?:ID|Literal|Path)?|function|imageLiteral|line)\b/,alias:"constant"},"other-directive":{pattern:/#\w+\b/,alias:"property"},attribute:{pattern:/@\w+/,alias:"atrule"},"function-definition":{pattern:/(\bfunc\s+)\w+/,lookbehind:!0,alias:"function"},label:{pattern:/\b(break|continue)\s+\w+|\b[a-zA-Z_]\w*(?=\s*:\s*(?:for|repeat|while)\b)/,lookbehind:!0,alias:"important"},keyword:/\b(?:Any|Protocol|Self|Type|actor|as|assignment|associatedtype|associativity|async|await|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic|else|enum|extension|fallthrough|fileprivate|final|for|func|get|guard|higherThan|if|import|in|indirect|infix|init|inout|internal|is|isolated|lazy|left|let|lowerThan|mutating|none|nonisolated|nonmutating|open|operator|optional|override|postfix|precedencegroup|prefix|private|protocol|public|repeat|required|rethrows|return|right|safe|self|set|some|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|unsafe|var|weak|where|while|willSet)\b/,boolean:/\b(?:false|true)\b/,nil:{pattern:/\bnil\b/,alias:"constant"},"short-argument":/\$\d+\b/,omit:{pattern:/\b_\b/,alias:"keyword"},number:/\b(?:[\d_]+(?:\.[\de_]+)?|0x[a-f0-9_]+(?:\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i,"class-name":/\b[A-Z](?:[A-Z_\d]*[a-z]\w*)?\b/,function:/\b[a-z_]\w*(?=\s*\()/i,constant:/\b(?:[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/,operator:/[-+*/%=!<>&|^~?]+|\.[.\-+*/%=!<>&|^~?]+/,punctuation:/[{}[\]();,.:\\]/},P.languages.swift["string-literal"].forEach(function(c){c.inside.interpolation.inside=P.languages.swift}),(function(c){c.languages.kotlin=c.languages.extend("clike",{keyword:{pattern:/(^|[^.])\b(?:abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|to|try|typealias|val|var|vararg|when|where|while)\b/,lookbehind:!0},function:[{pattern:/(?:`[^\r\n`]+`|\b\w+)(?=\s*\()/,greedy:!0},{pattern:/(\.)(?:`[^\r\n`]+`|\w+)(?=\s*\{)/,lookbehind:!0,greedy:!0}],number:/\b(?:0[xX][\da-fA-F]+(?:_[\da-fA-F]+)*|0[bB][01]+(?:_[01]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?[fFL]?)\b/,operator:/\+[+=]?|-[-=>]?|==?=?|!(?:!|==?)?|[\/*%<>]=?|[?:]:?|\.\.|&&|\|\||\b(?:and|inv|or|shl|shr|ushr|xor)\b/}),delete c.languages.kotlin["class-name"];var h={"interpolation-punctuation":{pattern:/^\$\{?|\}$/,alias:"punctuation"},expression:{pattern:/[\s\S]+/,inside:c.languages.kotlin}};c.languages.insertBefore("kotlin","string",{"string-literal":[{pattern:/"""(?:[^$]|\$(?:(?!\{)|\{[^{}]*\}))*?"""/,alias:"multiline",inside:{interpolation:{pattern:/\$(?:[a-z_]\w*|\{[^{}]*\})/i,inside:h},string:/[\s\S]+/}},{pattern:/"(?:[^"\\\r\n$]|\\.|\$(?:(?!\{)|\{[^{}]*\}))*"/,alias:"singleline",inside:{interpolation:{pattern:/((?:^|[^\\])(?:\\{2})*)\$(?:[a-z_]\w*|\{[^{}]*\})/i,lookbehind:!0,inside:h},string:/[\s\S]+/}}],char:{pattern:/'(?:[^'\\\r\n]|\\(?:.|u[a-fA-F0-9]{0,4}))'/,greedy:!0}}),delete c.languages.kotlin.string,c.languages.insertBefore("kotlin","keyword",{annotation:{pattern:/\B@(?:\w+:)?(?:[A-Z]\w*|\[[^\]]+\])/,alias:"builtin"}}),c.languages.insertBefore("kotlin","function",{label:{pattern:/\b\w+@|@\w+\b/,alias:"symbol"}}),c.languages.kt=c.languages.kotlin,c.languages.kts=c.languages.kotlin})(P),P.languages.c=P.languages.extend("clike",{comment:{pattern:/\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,greedy:!0},string:{pattern:/"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,greedy:!0},"class-name":{pattern:/(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,lookbehind:!0},keyword:/\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,function:/\b[a-z_]\w*(?=\s*\()/i,number:/(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,operator:/>>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/}),P.languages.insertBefore("c","string",{char:{pattern:/'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,greedy:!0}}),P.languages.insertBefore("c","string",{macro:{pattern:/(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,lookbehind:!0,greedy:!0,alias:"property",inside:{string:[{pattern:/^(#\s*include\s*)<[^>]+>/,lookbehind:!0},P.languages.c.string],char:P.languages.c.char,comment:P.languages.c.comment,"macro-name":[{pattern:/(^#\s*define\s+)\w+\b(?!\()/i,lookbehind:!0},{pattern:/(^#\s*define\s+)\w+\b(?=\()/i,lookbehind:!0,alias:"function"}],directive:{pattern:/^(#\s*)[a-z]+/,lookbehind:!0,alias:"keyword"},"directive-hash":/^#/,punctuation:/##|\\(?=[\r\n])/,expression:{pattern:/\S[\s\S]*/,inside:P.languages.c}}}}),P.languages.insertBefore("c","function",{constant:/\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/}),delete P.languages.c.boolean,P.languages.objectivec=P.languages.extend("c",{string:{pattern:/@?"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,greedy:!0},keyword:/\b(?:asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|in|inline|int|long|register|return|self|short|signed|sizeof|static|struct|super|switch|typedef|typeof|union|unsigned|void|volatile|while)\b|(?:@interface|@end|@implementation|@protocol|@class|@public|@protected|@private|@property|@try|@catch|@finally|@throw|@synthesize|@dynamic|@selector)\b/,operator:/-[->]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|\|?|[~^%?*\/@]/}),delete P.languages.objectivec["class-name"],P.languages.objc=P.languages.objectivec,P.languages.reason=P.languages.extend("clike",{string:{pattern:/"(?:\\(?:\r\n|[\s\S])|[^\\\r\n"])*"/,greedy:!0},"class-name":/\b[A-Z]\w*/,keyword:/\b(?:and|as|assert|begin|class|constraint|do|done|downto|else|end|exception|external|for|fun|function|functor|if|in|include|inherit|initializer|lazy|let|method|module|mutable|new|nonrec|object|of|open|or|private|rec|sig|struct|switch|then|to|try|type|val|virtual|when|while|with)\b/,operator:/\.{3}|:[:=]|\|>|->|=(?:==?|>)?|<=?|>=?|[|^?'#!~`]|[+\-*\/]\.?|\b(?:asr|land|lor|lsl|lsr|lxor|mod)\b/}),P.languages.insertBefore("reason","class-name",{char:{pattern:/'(?:\\x[\da-f]{2}|\\o[0-3][0-7][0-7]|\\\d{3}|\\.|[^'\\\r\n])'/,greedy:!0},constructor:/\b[A-Z]\w*\b(?!\s*\.)/,label:{pattern:/\b[a-z]\w*(?=::)/,alias:"symbol"}}),delete P.languages.reason.function,(function(c){for(var h=/\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|<self>)*\*\//.source,p=0;p<2;p++)h=h.replace(/<self>/g,function(){return h});h=h.replace(/<self>/g,function(){return/[^\s\S]/.source}),c.languages.rust={comment:[{pattern:RegExp(/(^|[^\\])/.source+h),lookbehind:!0,greedy:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/b?"(?:\\[\s\S]|[^\\"])*"|b?r(#*)"(?:[^"]|"(?!\1))*"\1/,greedy:!0},char:{pattern:/b?'(?:\\(?:x[0-7][\da-fA-F]|u\{(?:[\da-fA-F]_*){1,6}\}|.)|[^\\\r\n\t'])'/,greedy:!0},attribute:{pattern:/#!?\[(?:[^\[\]"]|"(?:\\[\s\S]|[^\\"])*")*\]/,greedy:!0,alias:"attr-name",inside:{string:null}},"closure-params":{pattern:/([=(,:]\s*|\bmove\s*)\|[^|]*\||\|[^|]*\|(?=\s*(?:\{|->))/,lookbehind:!0,greedy:!0,inside:{"closure-punctuation":{pattern:/^\||\|$/,alias:"punctuation"},rest:null}},"lifetime-annotation":{pattern:/'\w+/,alias:"symbol"},"fragment-specifier":{pattern:/(\$\w+:)[a-z]+/,lookbehind:!0,alias:"punctuation"},variable:/\$\w+/,"function-definition":{pattern:/(\bfn\s+)\w+/,lookbehind:!0,alias:"function"},"type-definition":{pattern:/(\b(?:enum|struct|trait|type|union)\s+)\w+/,lookbehind:!0,alias:"class-name"},"module-declaration":[{pattern:/(\b(?:crate|mod)\s+)[a-z][a-z_\d]*/,lookbehind:!0,alias:"namespace"},{pattern:/(\b(?:crate|self|super)\s*)::\s*[a-z][a-z_\d]*\b(?:\s*::(?:\s*[a-z][a-z_\d]*\s*::)*)?/,lookbehind:!0,alias:"namespace",inside:{punctuation:/::/}}],keyword:[/\b(?:Self|abstract|as|async|await|become|box|break|const|continue|crate|do|dyn|else|enum|extern|final|fn|for|if|impl|in|let|loop|macro|match|mod|move|mut|override|priv|pub|ref|return|self|static|struct|super|trait|try|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\b/,/\b(?:bool|char|f(?:32|64)|[ui](?:8|16|32|64|128|size)|str)\b/],function:/\b[a-z_]\w*(?=\s*(?:::\s*<|\())/,macro:{pattern:/\b\w+!/,alias:"property"},constant:/\b[A-Z_][A-Z_\d]+\b/,"class-name":/\b[A-Z]\w*\b/,namespace:{pattern:/(?:\b[a-z][a-z_\d]*\s*::\s*)*\b[a-z][a-z_\d]*\s*::(?!\s*<)/,inside:{punctuation:/::/}},number:/\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\d(?:_?\d)*)?\.)?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:f32|f64|[iu](?:8|16|32|64|size)?))?\b/,boolean:/\b(?:false|true)\b/,punctuation:/->|\.\.=|\.{1,3}|::|[{}[\];(),:]/,operator:/[-+*\/%!^]=?|=[=>]?|&[&=]?|\|[|=]?|<<?=?|>>?=?|[@?]/},c.languages.rust["closure-params"].inside.rest=c.languages.rust,c.languages.rust.attribute.inside.string=c.languages.rust.string})(P),P.languages.go=P.languages.extend("clike",{string:{pattern:/(^|[^\\])"(?:\\.|[^"\\\r\n])*"|`[^`]*`/,lookbehind:!0,greedy:!0},keyword:/\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,boolean:/\b(?:_|false|iota|nil|true)\b/,number:[/\b0(?:b[01_]+|o[0-7_]+)i?\b/i,/\b0x(?:[a-f\d_]+(?:\.[a-f\d_]*)?|\.[a-f\d_]+)(?:p[+-]?\d+(?:_\d+)*)?i?(?!\w)/i,/(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?[\d_]+)?i?(?!\w)/i],operator:/[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,builtin:/\b(?:append|bool|byte|cap|close|complex|complex(?:64|128)|copy|delete|error|float(?:32|64)|u?int(?:8|16|32|64)?|imag|len|make|new|panic|print(?:ln)?|real|recover|rune|string|uintptr)\b/}),P.languages.insertBefore("go","string",{char:{pattern:/'(?:\\.|[^'\\\r\n]){0,10}'/,greedy:!0}}),delete P.languages.go["class-name"],(function(c){var h=/\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,p=/\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g,function(){return h.source});c.languages.cpp=c.languages.extend("c",{"class-name":[{pattern:RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source.replace(/<keyword>/g,function(){return h.source})),lookbehind:!0},/\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/,/\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i,/\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/],keyword:h,number:{pattern:/(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,greedy:!0},operator:/>>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,boolean:/\b(?:false|true)\b/}),c.languages.insertBefore("cpp","string",{module:{pattern:RegExp(/(\b(?:import|module)\s+)/.source+"(?:"+/"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source+"|"+/<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g,function(){return p})+")"),lookbehind:!0,greedy:!0,inside:{string:/^[<"][\s\S]+/,operator:/:/,punctuation:/\./}},"raw-string":{pattern:/R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,alias:"string",greedy:!0}}),c.languages.insertBefore("cpp","keyword",{"generic-function":{pattern:/\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,inside:{function:/^\w+/,generic:{pattern:/<[\s\S]+/,alias:"class-name",inside:c.languages.cpp}}}}),c.languages.insertBefore("cpp","operator",{"double-colon":{pattern:/::/,alias:"punctuation"}}),c.languages.insertBefore("cpp","class-name",{"base-clause":{pattern:/(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,lookbehind:!0,greedy:!0,inside:c.languages.extend("cpp",{})}}),c.languages.insertBefore("inside","double-colon",{"class-name":/\b[a-z_]\w*\b(?!\s*::)/i},c.languages.cpp["base-clause"])})(P),P.languages.python={comment:{pattern:/(^|[^\\])#.*/,lookbehind:!0,greedy:!0},"string-interpolation":{pattern:/(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,greedy:!0,inside:{interpolation:{pattern:/((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,lookbehind:!0,inside:{"format-spec":{pattern:/(:)[^:(){}]+(?=\}$)/,lookbehind:!0},"conversion-option":{pattern:/![sra](?=[:}]$)/,alias:"punctuation"},rest:null}},string:/[\s\S]+/}},"triple-quoted-string":{pattern:/(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,greedy:!0,alias:"string"},string:{pattern:/(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,greedy:!0},function:{pattern:/((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,lookbehind:!0},"class-name":{pattern:/(\bclass\s+)\w+/i,lookbehind:!0},decorator:{pattern:/(^[\t ]*)@\w+(?:\.\w+)*/m,lookbehind:!0,alias:["annotation","punctuation"],inside:{punctuation:/\./}},keyword:/\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,builtin:/\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,boolean:/\b(?:False|None|True)\b/,number:/\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,operator:/[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,punctuation:/[{}[\];(),.:]/},P.languages.python["string-interpolation"].inside.interpolation.inside.rest=P.languages.python,P.languages.py=P.languages.python,P.languages.json={property:{pattern:/(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,lookbehind:!0,greedy:!0},string:{pattern:/(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,lookbehind:!0,greedy:!0},comment:{pattern:/\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,greedy:!0},number:/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,punctuation:/[{}[\],]/,operator:/:/,boolean:/\b(?:false|true)\b/,null:{pattern:/\bnull\b/,alias:"keyword"}},P.languages.webmanifest=P.languages.json;var sp={};Xf(sp,{dracula:()=>nx,duotoneDark:()=>rx,duotoneLight:()=>ix,github:()=>cx,gruvboxMaterialDark:()=>qx,gruvboxMaterialLight:()=>Px,jettwaveDark:()=>Ax,jettwaveLight:()=>Ox,nightOwl:()=>dx,nightOwlLight:()=>hx,oceanicNext:()=>mx,okaidia:()=>xx,oneDark:()=>zx,oneLight:()=>_x,palenight:()=>gx,shadesOfPurple:()=>bx,synthwave84:()=>Sx,ultramin:()=>wx,vsDark:()=>rp,vsLight:()=>Rx});var tx={plain:{color:"#F8F8F2",backgroundColor:"#282A36"},styles:[{types:["prolog","constant","builtin"],style:{color:"rgb(189, 147, 249)"}},{types:["inserted","function"],style:{color:"rgb(80, 250, 123)"}},{types:["deleted"],style:{color:"rgb(255, 85, 85)"}},{types:["changed"],style:{color:"rgb(255, 184, 108)"}},{types:["punctuation","symbol"],style:{color:"rgb(248, 248, 242)"}},{types:["string","char","tag","selector"],style:{color:"rgb(255, 121, 198)"}},{types:["keyword","variable"],style:{color:"rgb(189, 147, 249)",fontStyle:"italic"}},{types:["comment"],style:{color:"rgb(98, 114, 164)"}},{types:["attr-name"],style:{color:"rgb(241, 250, 140)"}}]},nx=tx,sx={plain:{backgroundColor:"#2a2734",color:"#9a86fd"},styles:[{types:["comment","prolog","doctype","cdata","punctuation"],style:{color:"#6c6783"}},{types:["namespace"],style:{opacity:.7}},{types:["tag","operator","number"],style:{color:"#e09142"}},{types:["property","function"],style:{color:"#9a86fd"}},{types:["tag-id","selector","atrule-id"],style:{color:"#eeebff"}},{types:["attr-name"],style:{color:"#c4b9fe"}},{types:["boolean","string","entity","url","attr-value","keyword","control","directive","unit","statement","regex","atrule","placeholder","variable"],style:{color:"#ffcc99"}},{types:["deleted"],style:{textDecorationLine:"line-through"}},{types:["inserted"],style:{textDecorationLine:"underline"}},{types:["italic"],style:{fontStyle:"italic"}},{types:["important","bold"],style:{fontWeight:"bold"}},{types:["important"],style:{color:"#c4b9fe"}}]},rx=sx,ax={plain:{backgroundColor:"#faf8f5",color:"#728fcb"},styles:[{types:["comment","prolog","doctype","cdata","punctuation"],style:{color:"#b6ad9a"}},{types:["namespace"],style:{opacity:.7}},{types:["tag","operator","number"],style:{color:"#063289"}},{types:["property","function"],style:{color:"#b29762"}},{types:["tag-id","selector","atrule-id"],style:{color:"#2d2006"}},{types:["attr-name"],style:{color:"#896724"}},{types:["boolean","string","entity","url","attr-value","keyword","control","directive","unit","statement","regex","atrule"],style:{color:"#728fcb"}},{types:["placeholder","variable"],style:{color:"#93abdc"}},{types:["deleted"],style:{textDecorationLine:"line-through"}},{types:["inserted"],style:{textDecorationLine:"underline"}},{types:["italic"],style:{fontStyle:"italic"}},{types:["important","bold"],style:{fontWeight:"bold"}},{types:["important"],style:{color:"#896724"}}]},ix=ax,lx={plain:{color:"#393A34",backgroundColor:"#f6f8fa"},styles:[{types:["comment","prolog","doctype","cdata"],style:{color:"#999988",fontStyle:"italic"}},{types:["namespace"],style:{opacity:.7}},{types:["string","attr-value"],style:{color:"#e3116c"}},{types:["punctuation","operator"],style:{color:"#393A34"}},{types:["entity","url","symbol","number","boolean","variable","constant","property","regex","inserted"],style:{color:"#36acaa"}},{types:["atrule","keyword","attr-name","selector"],style:{color:"#00a4db"}},{types:["function","deleted","tag"],style:{color:"#d73a49"}},{types:["function-variable"],style:{color:"#6f42c1"}},{types:["tag","selector","keyword"],style:{color:"#00009f"}}]},cx=lx,ox={plain:{color:"#d6deeb",backgroundColor:"#011627"},styles:[{types:["changed"],style:{color:"rgb(162, 191, 252)",fontStyle:"italic"}},{types:["deleted"],style:{color:"rgba(239, 83, 80, 0.56)",fontStyle:"italic"}},{types:["inserted","attr-name"],style:{color:"rgb(173, 219, 103)",fontStyle:"italic"}},{types:["comment"],style:{color:"rgb(99, 119, 119)",fontStyle:"italic"}},{types:["string","url"],style:{color:"rgb(173, 219, 103)"}},{types:["variable"],style:{color:"rgb(214, 222, 235)"}},{types:["number"],style:{color:"rgb(247, 140, 108)"}},{types:["builtin","char","constant","function"],style:{color:"rgb(130, 170, 255)"}},{types:["punctuation"],style:{color:"rgb(199, 146, 234)"}},{types:["selector","doctype"],style:{color:"rgb(199, 146, 234)",fontStyle:"italic"}},{types:["class-name"],style:{color:"rgb(255, 203, 139)"}},{types:["tag","operator","keyword"],style:{color:"rgb(127, 219, 202)"}},{types:["boolean"],style:{color:"rgb(255, 88, 116)"}},{types:["property"],style:{color:"rgb(128, 203, 196)"}},{types:["namespace"],style:{color:"rgb(178, 204, 214)"}}]},dx=ox,ux={plain:{color:"#403f53",backgroundColor:"#FBFBFB"},styles:[{types:["changed"],style:{color:"rgb(162, 191, 252)",fontStyle:"italic"}},{types:["deleted"],style:{color:"rgba(239, 83, 80, 0.56)",fontStyle:"italic"}},{types:["inserted","attr-name"],style:{color:"rgb(72, 118, 214)",fontStyle:"italic"}},{types:["comment"],style:{color:"rgb(152, 159, 177)",fontStyle:"italic"}},{types:["string","builtin","char","constant","url"],style:{color:"rgb(72, 118, 214)"}},{types:["variable"],style:{color:"rgb(201, 103, 101)"}},{types:["number"],style:{color:"rgb(170, 9, 130)"}},{types:["punctuation"],style:{color:"rgb(153, 76, 195)"}},{types:["function","selector","doctype"],style:{color:"rgb(153, 76, 195)",fontStyle:"italic"}},{types:["class-name"],style:{color:"rgb(17, 17, 17)"}},{types:["tag"],style:{color:"rgb(153, 76, 195)"}},{types:["operator","property","keyword","namespace"],style:{color:"rgb(12, 150, 155)"}},{types:["boolean"],style:{color:"rgb(188, 84, 84)"}}]},hx=ux,yt={char:"#D8DEE9",comment:"#999999",keyword:"#c5a5c5",primitive:"#5a9bcf",string:"#8dc891",variable:"#d7deea",boolean:"#ff8b50",tag:"#fc929e",function:"#79b6f2",className:"#FAC863"},px={plain:{backgroundColor:"#282c34",color:"#ffffff"},styles:[{types:["attr-name"],style:{color:yt.keyword}},{types:["attr-value"],style:{color:yt.string}},{types:["comment","block-comment","prolog","doctype","cdata","shebang"],style:{color:yt.comment}},{types:["property","number","function-name","constant","symbol","deleted"],style:{color:yt.primitive}},{types:["boolean"],style:{color:yt.boolean}},{types:["tag"],style:{color:yt.tag}},{types:["string"],style:{color:yt.string}},{types:["punctuation"],style:{color:yt.string}},{types:["selector","char","builtin","inserted"],style:{color:yt.char}},{types:["function"],style:{color:yt.function}},{types:["operator","entity","url","variable"],style:{color:yt.variable}},{types:["keyword"],style:{color:yt.keyword}},{types:["atrule","class-name"],style:{color:yt.className}},{types:["important"],style:{fontWeight:"400"}},{types:["bold"],style:{fontWeight:"bold"}},{types:["italic"],style:{fontStyle:"italic"}},{types:["namespace"],style:{opacity:.7}}]},mx=px,fx={plain:{color:"#f8f8f2",backgroundColor:"#272822"},styles:[{types:["changed"],style:{color:"rgb(162, 191, 252)",fontStyle:"italic"}},{types:["deleted"],style:{color:"#f92672",fontStyle:"italic"}},{types:["inserted"],style:{color:"rgb(173, 219, 103)",fontStyle:"italic"}},{types:["comment"],style:{color:"#8292a2",fontStyle:"italic"}},{types:["string","url"],style:{color:"#a6e22e"}},{types:["variable"],style:{color:"#f8f8f2"}},{types:["number"],style:{color:"#ae81ff"}},{types:["builtin","char","constant","function","class-name"],style:{color:"#e6db74"}},{types:["punctuation"],style:{color:"#f8f8f2"}},{types:["selector","doctype"],style:{color:"#a6e22e",fontStyle:"italic"}},{types:["tag","operator","keyword"],style:{color:"#66d9ef"}},{types:["boolean"],style:{color:"#ae81ff"}},{types:["namespace"],style:{color:"rgb(178, 204, 214)",opacity:.7}},{types:["tag","property"],style:{color:"#f92672"}},{types:["attr-name"],style:{color:"#a6e22e !important"}},{types:["doctype"],style:{color:"#8292a2"}},{types:["rule"],style:{color:"#e6db74"}}]},xx=fx,jx={plain:{color:"#bfc7d5",backgroundColor:"#292d3e"},styles:[{types:["comment"],style:{color:"rgb(105, 112, 152)",fontStyle:"italic"}},{types:["string","inserted"],style:{color:"rgb(195, 232, 141)"}},{types:["number"],style:{color:"rgb(247, 140, 108)"}},{types:["builtin","char","constant","function"],style:{color:"rgb(130, 170, 255)"}},{types:["punctuation","selector"],style:{color:"rgb(199, 146, 234)"}},{types:["variable"],style:{color:"rgb(191, 199, 213)"}},{types:["class-name","attr-name"],style:{color:"rgb(255, 203, 107)"}},{types:["tag","deleted"],style:{color:"rgb(255, 85, 114)"}},{types:["operator"],style:{color:"rgb(137, 221, 255)"}},{types:["boolean"],style:{color:"rgb(255, 88, 116)"}},{types:["keyword"],style:{fontStyle:"italic"}},{types:["doctype"],style:{color:"rgb(199, 146, 234)",fontStyle:"italic"}},{types:["namespace"],style:{color:"rgb(178, 204, 214)"}},{types:["url"],style:{color:"rgb(221, 221, 221)"}}]},gx=jx,yx={plain:{color:"#9EFEFF",backgroundColor:"#2D2A55"},styles:[{types:["changed"],style:{color:"rgb(255, 238, 128)"}},{types:["deleted"],style:{color:"rgba(239, 83, 80, 0.56)"}},{types:["inserted"],style:{color:"rgb(173, 219, 103)"}},{types:["comment"],style:{color:"rgb(179, 98, 255)",fontStyle:"italic"}},{types:["punctuation"],style:{color:"rgb(255, 255, 255)"}},{types:["constant"],style:{color:"rgb(255, 98, 140)"}},{types:["string","url"],style:{color:"rgb(165, 255, 144)"}},{types:["variable"],style:{color:"rgb(255, 238, 128)"}},{types:["number","boolean"],style:{color:"rgb(255, 98, 140)"}},{types:["attr-name"],style:{color:"rgb(255, 180, 84)"}},{types:["keyword","operator","property","namespace","tag","selector","doctype"],style:{color:"rgb(255, 157, 0)"}},{types:["builtin","char","constant","function","class-name"],style:{color:"rgb(250, 208, 0)"}}]},bx=yx,vx={plain:{backgroundColor:"linear-gradient(to bottom, #2a2139 75%, #34294f)",backgroundImage:"#34294f",color:"#f92aad",textShadow:"0 0 2px #100c0f, 0 0 5px #dc078e33, 0 0 10px #fff3"},styles:[{types:["comment","block-comment","prolog","doctype","cdata"],style:{color:"#495495",fontStyle:"italic"}},{types:["punctuation"],style:{color:"#ccc"}},{types:["tag","attr-name","namespace","number","unit","hexcode","deleted"],style:{color:"#e2777a"}},{types:["property","selector"],style:{color:"#72f1b8",textShadow:"0 0 2px #100c0f, 0 0 10px #257c5575, 0 0 35px #21272475"}},{types:["function-name"],style:{color:"#6196cc"}},{types:["boolean","selector-id","function"],style:{color:"#fdfdfd",textShadow:"0 0 2px #001716, 0 0 3px #03edf975, 0 0 5px #03edf975, 0 0 8px #03edf975"}},{types:["class-name","maybe-class-name","builtin"],style:{color:"#fff5f6",textShadow:"0 0 2px #000, 0 0 10px #fc1f2c75, 0 0 5px #fc1f2c75, 0 0 25px #fc1f2c75"}},{types:["constant","symbol"],style:{color:"#f92aad",textShadow:"0 0 2px #100c0f, 0 0 5px #dc078e33, 0 0 10px #fff3"}},{types:["important","atrule","keyword","selector-class"],style:{color:"#f4eee4",textShadow:"0 0 2px #393a33, 0 0 8px #f39f0575, 0 0 2px #f39f0575"}},{types:["string","char","attr-value","regex","variable"],style:{color:"#f87c32"}},{types:["parameter"],style:{fontStyle:"italic"}},{types:["entity","url"],style:{color:"#67cdcc"}},{types:["operator"],style:{color:"ffffffee"}},{types:["important","bold"],style:{fontWeight:"bold"}},{types:["italic"],style:{fontStyle:"italic"}},{types:["entity"],style:{cursor:"help"}},{types:["inserted"],style:{color:"green"}}]},Sx=vx,Tx={plain:{color:"#282a2e",backgroundColor:"#ffffff"},styles:[{types:["comment"],style:{color:"rgb(197, 200, 198)"}},{types:["string","number","builtin","variable"],style:{color:"rgb(150, 152, 150)"}},{types:["class-name","function","tag","attr-name"],style:{color:"rgb(40, 42, 46)"}}]},wx=Tx,kx={plain:{color:"#9CDCFE",backgroundColor:"#1E1E1E"},styles:[{types:["prolog"],style:{color:"rgb(0, 0, 128)"}},{types:["comment"],style:{color:"rgb(106, 153, 85)"}},{types:["builtin","changed","keyword","interpolation-punctuation"],style:{color:"rgb(86, 156, 214)"}},{types:["number","inserted"],style:{color:"rgb(181, 206, 168)"}},{types:["constant"],style:{color:"rgb(100, 102, 149)"}},{types:["attr-name","variable"],style:{color:"rgb(156, 220, 254)"}},{types:["deleted","string","attr-value","template-punctuation"],style:{color:"rgb(206, 145, 120)"}},{types:["selector"],style:{color:"rgb(215, 186, 125)"}},{types:["tag"],style:{color:"rgb(78, 201, 176)"}},{types:["tag"],languages:["markup"],style:{color:"rgb(86, 156, 214)"}},{types:["punctuation","operator"],style:{color:"rgb(212, 212, 212)"}},{types:["punctuation"],languages:["markup"],style:{color:"#808080"}},{types:["function"],style:{color:"rgb(220, 220, 170)"}},{types:["class-name"],style:{color:"rgb(78, 201, 176)"}},{types:["char"],style:{color:"rgb(209, 105, 105)"}}]},rp=kx,Cx={plain:{color:"#000000",backgroundColor:"#ffffff"},styles:[{types:["comment"],style:{color:"rgb(0, 128, 0)"}},{types:["builtin"],style:{color:"rgb(0, 112, 193)"}},{types:["number","variable","inserted"],style:{color:"rgb(9, 134, 88)"}},{types:["operator"],style:{color:"rgb(0, 0, 0)"}},{types:["constant","char"],style:{color:"rgb(129, 31, 63)"}},{types:["tag"],style:{color:"rgb(128, 0, 0)"}},{types:["attr-name"],style:{color:"rgb(255, 0, 0)"}},{types:["deleted","string"],style:{color:"rgb(163, 21, 21)"}},{types:["changed","punctuation"],style:{color:"rgb(4, 81, 165)"}},{types:["function","keyword"],style:{color:"rgb(0, 0, 255)"}},{types:["class-name"],style:{color:"rgb(38, 127, 153)"}}]},Rx=Cx,Ex={plain:{color:"#f8fafc",backgroundColor:"#011627"},styles:[{types:["prolog"],style:{color:"#000080"}},{types:["comment"],style:{color:"#6A9955"}},{types:["builtin","changed","keyword","interpolation-punctuation"],style:{color:"#569CD6"}},{types:["number","inserted"],style:{color:"#B5CEA8"}},{types:["constant"],style:{color:"#f8fafc"}},{types:["attr-name","variable"],style:{color:"#9CDCFE"}},{types:["deleted","string","attr-value","template-punctuation"],style:{color:"#cbd5e1"}},{types:["selector"],style:{color:"#D7BA7D"}},{types:["tag"],style:{color:"#0ea5e9"}},{types:["tag"],languages:["markup"],style:{color:"#0ea5e9"}},{types:["punctuation","operator"],style:{color:"#D4D4D4"}},{types:["punctuation"],languages:["markup"],style:{color:"#808080"}},{types:["function"],style:{color:"#7dd3fc"}},{types:["class-name"],style:{color:"#0ea5e9"}},{types:["char"],style:{color:"#D16969"}}]},Ax=Ex,Nx={plain:{color:"#0f172a",backgroundColor:"#f1f5f9"},styles:[{types:["prolog"],style:{color:"#000080"}},{types:["comment"],style:{color:"#6A9955"}},{types:["builtin","changed","keyword","interpolation-punctuation"],style:{color:"#0c4a6e"}},{types:["number","inserted"],style:{color:"#B5CEA8"}},{types:["constant"],style:{color:"#0f172a"}},{types:["attr-name","variable"],style:{color:"#0c4a6e"}},{types:["deleted","string","attr-value","template-punctuation"],style:{color:"#64748b"}},{types:["selector"],style:{color:"#D7BA7D"}},{types:["tag"],style:{color:"#0ea5e9"}},{types:["tag"],languages:["markup"],style:{color:"#0ea5e9"}},{types:["punctuation","operator"],style:{color:"#475569"}},{types:["punctuation"],languages:["markup"],style:{color:"#808080"}},{types:["function"],style:{color:"#0e7490"}},{types:["class-name"],style:{color:"#0ea5e9"}},{types:["char"],style:{color:"#D16969"}}]},Ox=Nx,Dx={plain:{backgroundColor:"hsl(220, 13%, 18%)",color:"hsl(220, 14%, 71%)",textShadow:"0 1px rgba(0, 0, 0, 0.3)"},styles:[{types:["comment","prolog","cdata"],style:{color:"hsl(220, 10%, 40%)"}},{types:["doctype","punctuation","entity"],style:{color:"hsl(220, 14%, 71%)"}},{types:["attr-name","class-name","maybe-class-name","boolean","constant","number","atrule"],style:{color:"hsl(29, 54%, 61%)"}},{types:["keyword"],style:{color:"hsl(286, 60%, 67%)"}},{types:["property","tag","symbol","deleted","important"],style:{color:"hsl(355, 65%, 65%)"}},{types:["selector","string","char","builtin","inserted","regex","attr-value"],style:{color:"hsl(95, 38%, 62%)"}},{types:["variable","operator","function"],style:{color:"hsl(207, 82%, 66%)"}},{types:["url"],style:{color:"hsl(187, 47%, 55%)"}},{types:["deleted"],style:{textDecorationLine:"line-through"}},{types:["inserted"],style:{textDecorationLine:"underline"}},{types:["italic"],style:{fontStyle:"italic"}},{types:["important","bold"],style:{fontWeight:"bold"}},{types:["important"],style:{color:"hsl(220, 14%, 71%)"}}]},zx=Dx,Ix={plain:{backgroundColor:"hsl(230, 1%, 98%)",color:"hsl(230, 8%, 24%)"},styles:[{types:["comment","prolog","cdata"],style:{color:"hsl(230, 4%, 64%)"}},{types:["doctype","punctuation","entity"],style:{color:"hsl(230, 8%, 24%)"}},{types:["attr-name","class-name","boolean","constant","number","atrule"],style:{color:"hsl(35, 99%, 36%)"}},{types:["keyword"],style:{color:"hsl(301, 63%, 40%)"}},{types:["property","tag","symbol","deleted","important"],style:{color:"hsl(5, 74%, 59%)"}},{types:["selector","string","char","builtin","inserted","regex","attr-value","punctuation"],style:{color:"hsl(119, 34%, 47%)"}},{types:["variable","operator","function"],style:{color:"hsl(221, 87%, 60%)"}},{types:["url"],style:{color:"hsl(198, 99%, 37%)"}},{types:["deleted"],style:{textDecorationLine:"line-through"}},{types:["inserted"],style:{textDecorationLine:"underline"}},{types:["italic"],style:{fontStyle:"italic"}},{types:["important","bold"],style:{fontWeight:"bold"}},{types:["important"],style:{color:"hsl(230, 8%, 24%)"}}]},_x=Ix,Mx={plain:{color:"#ebdbb2",backgroundColor:"#292828"},styles:[{types:["imports","class-name","maybe-class-name","constant","doctype","builtin","function"],style:{color:"#d8a657"}},{types:["property-access"],style:{color:"#7daea3"}},{types:["tag"],style:{color:"#e78a4e"}},{types:["attr-name","char","url","regex"],style:{color:"#a9b665"}},{types:["attr-value","string"],style:{color:"#89b482"}},{types:["comment","prolog","cdata","operator","inserted"],style:{color:"#a89984"}},{types:["delimiter","boolean","keyword","selector","important","atrule","property","variable","deleted"],style:{color:"#ea6962"}},{types:["entity","number","symbol"],style:{color:"#d3869b"}}]},qx=Mx,Ux={plain:{color:"#654735",backgroundColor:"#f9f5d7"},styles:[{types:["delimiter","boolean","keyword","selector","important","atrule","property","variable","deleted"],style:{color:"#af2528"}},{types:["imports","class-name","maybe-class-name","constant","doctype","builtin"],style:{color:"#b4730e"}},{types:["string","attr-value"],style:{color:"#477a5b"}},{types:["property-access"],style:{color:"#266b79"}},{types:["function","attr-name","char","url"],style:{color:"#72761e"}},{types:["tag"],style:{color:"#b94c07"}},{types:["comment","prolog","cdata","operator","inserted"],style:{color:"#a89984"}},{types:["entity","number","symbol"],style:{color:"#924f79"}}]},Px=Ux,Lx=c=>G.useCallback(h=>{var p=h,{className:d,style:v,line:I}=p,y=np(p,["className","style","line"]);const S=Xa(Pt({},y),{className:$h("token-line",d)});return typeof c=="object"&&"plain"in c&&(S.style=c.plain),typeof v=="object"&&(S.style=Pt(Pt({},S.style||{}),v)),S},[c]),Bx=c=>{const h=G.useCallback(({types:p,empty:d})=>{if(c!=null){{if(p.length===1&&p[0]==="plain")return d!=null?{display:"inline-block"}:void 0;if(p.length===1&&d!=null)return c[p[0]]}return Object.assign(d!=null?{display:"inline-block"}:{},...p.map(v=>c[v]))}},[c]);return G.useCallback(p=>{var d=p,{token:v,className:I,style:y}=d,S=np(d,["token","className","style"]);const g=Xa(Pt({},S),{className:$h("token",...v.types,I),children:v.content,style:h(v)});return y!=null&&(g.style=Pt(Pt({},g.style||{}),y)),g},[h])},Hx=/\r\n|\r|\n/,Hh=c=>{c.length===0?c.push({types:["plain"],content:`
`,empty:!0}):c.length===1&&c[0].content===""&&(c[0].content=`
`,c[0].empty=!0)},Qh=(c,h)=>{const p=c.length;return p>0&&c[p-1]===h?c:c.concat(h)},Qx=c=>{const h=[[]],p=[c],d=[0],v=[c.length];let I=0,y=0,S=[];const g=[S];for(;y>-1;){for(;(I=d[y]++)<v[y];){let f,A=h[y];const Q=p[y][I];if(typeof Q=="string"?(A=y>0?A:["plain"],f=Q):(A=Qh(A,Q.type),Q.alias&&(A=Qh(A,Q.alias)),f=Q.content),typeof f!="string"){y++,h.push(A),p.push(f),d.push(0),v.push(f.length);continue}const B=f.split(Hx),C=B.length;S.push({types:A,content:B[0]});for(let R=1;R<C;R++)Hh(S),g.push(S=[]),S.push({types:A,content:B[R]})}y--,h.pop(),p.pop(),d.pop(),v.pop()}return Hh(S),g},Fh=Qx,Fx=({prism:c,code:h,grammar:p,language:d})=>G.useMemo(()=>{if(p==null)return Fh([h]);const v={code:h,grammar:p,language:d,tokens:[]};return c.hooks.run("before-tokenize",v),v.tokens=c.tokenize(h,p),c.hooks.run("after-tokenize",v),Fh(v.tokens)},[h,p,d,c]),Yx=(c,h)=>{const{plain:p}=c,d=c.styles.reduce((v,I)=>{const{languages:y,style:S}=I;return y&&!y.includes(h)||I.types.forEach(g=>{const f=Pt(Pt({},v[g]),S);v[g]=f}),v},{});return d.root=p,d.plain=Xa(Pt({},p),{backgroundColor:void 0}),d},Gx=Yx,Vx=({children:c,language:h,code:p,theme:d,prism:v})=>{const I=h.toLowerCase(),y=Gx(d,I),S=Lx(y),g=Bx(y),f=v.languages[I],A=Fx({prism:v,language:I,code:p,grammar:f});return c({tokens:A,className:`prism-code language-${I}`,style:y!=null?y.root:{},getLineProps:S,getTokenProps:g})},Kx=c=>G.createElement(Vx,Xa(Pt({},c),{prism:c.prism||P,theme:c.theme||rp,code:c.code,language:c.language}));function Wx(c,h){if(h){const p=h.split(".").pop()?.toLowerCase();if(p==="ts"||p==="tsx")return"tsx";if(p==="js"||p==="jsx")return"jsx"}return"tsx"}function u({code:c,title:h}){const[p,d]=G.useState(!1),v=G.useRef(null),I=Wx(c,h);G.useEffect(()=>()=>{v.current&&clearTimeout(v.current)},[]);const y=()=>{navigator.clipboard&&navigator.clipboard.writeText(c.trim()).then(()=>{d(!0),v.current&&clearTimeout(v.current),v.current=setTimeout(()=>d(!1),2e3)},()=>{})};return e.jsxs("div",{className:"code-block",children:[h&&e.jsx("div",{className:"code-block-header",children:e.jsx("div",{className:"code-title",children:h})}),e.jsx("button",{className:"code-copy-btn",onClick:y,title:"Copy to clipboard",children:p?"Copied!":"Copy"}),e.jsx(Kx,{theme:sp.nightOwl,code:c.trim(),language:I,children:({tokens:S,getLineProps:g,getTokenProps:f})=>e.jsx("pre",{children:e.jsx("code",{children:S.map((A,T)=>e.jsxs("span",{...g({line:A}),children:[A.map((Q,B)=>e.jsx("span",{...f({token:Q})},B)),`
`]},T))})})})]})}function Zx(){return e.jsxs("section",{className:"hero",children:[e.jsx("div",{className:"hero-glow"}),e.jsxs("div",{className:"container",children:[e.jsx("span",{className:"badge",children:"v0.1 · Experimental · pre-1.0"}),e.jsxs("h1",{children:[e.jsx("span",{className:"logo-tan",children:"realtime"}),e.jsx("span",{className:"gradient-text",children:".js"})]}),e.jsx("p",{className:"hero-tagline",children:"Bring your own backend."}),e.jsx("p",{className:"hero-sub",children:"The kitchen sink you actually need for proper realtime — sync, presence, CRDTs, and offline — with no platform and no per-seat bill. Keep your server, your database, your deploy target."}),e.jsx("div",{className:"hero-code",children:e.jsx(u,{code:`// Server — wrap any query. Channels derive from args automatically.
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)

// Client — live. Components sharing the same args share one connection.
const { data, collection } = useQuery(getTodos, { teamId }, {
  getKey: (t) => t.id,
})`})}),e.jsxs("div",{className:"hero-actions",children:[e.jsx("a",{href:"#/docs/getting-started",className:"btn btn-primary",children:"Get Started"}),e.jsx("a",{href:"#/docs/tutorial",className:"btn btn-secondary",children:"Tutorial"})]}),e.jsxs("div",{className:"hero-install",children:[e.jsx("code",{children:"npm i @realtimejs/core @realtimejs/react"}),e.jsxs("p",{className:"hero-install-alt",children:["Also available for ",e.jsx("a",{href:"#/docs/solid-primitives",children:"Solid"})," and"," ",e.jsx("a",{href:"#/docs/vue-composables",children:"Vue"})]})]})]})]})}function Xx(){const c=[{title:"Reactive queries",desc:"One annotation makes a server function live. Components sharing the same args share one connection.",code:`const { data, collection } = useQuery(getTodos, { teamId }, {
  getKey: (t) => t.id,
})

// Client-side filter — no extra fetch
const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)`},{title:"Optimistic mutations",desc:"Cache updates instantly, rolls back on error.",code:`const { mutate } = useMutation(createTodo, {
  optimistic: (cache, args) => {
    cache.update(getTodos, { teamId: args.teamId }, prev => [
      ...(prev ?? []), { id: crypto.randomUUID(), ...args },
    ])
  },
})`},{title:"Presence",desc:"Who is online, cursor positions, typing indicators. Needs a presence-capable transport (Centrifugo, Pusher, PartyKit).",code:`const { others } = usePresence(roomPresence, {
  params: { roomId },
  initial: { cursor: { x: 0, y: 0 }, name },
})`},{title:"Streaming",desc:"Reduce-based state from ordered event streams. Resumable with HMAC checkpoints.",code:`const aiStream = createStreamChannel({
  id: 'ai',
  channel: (p: { requestId: string }) => ['ai', p],
  initial: { content: '' },
  reduce: (s, e: { token?: string }) => ({ content: s.content + (e.token ?? '') }),
})

const { state, status } = useStream(aiStream, { params: { requestId } })`}];return e.jsx("section",{id:"use-cases",className:"section",children:e.jsxs("div",{className:"container",children:[e.jsx("h2",{children:"What you can build"}),e.jsx("p",{className:"section-sub",children:"Concrete patterns, each a few lines of config."}),e.jsx("div",{className:"use-cases-grid",children:c.map(h=>e.jsxs("div",{className:"use-case-card",children:[e.jsx("h3",{children:h.title}),e.jsx("p",{children:h.desc}),e.jsx(u,{code:h.code})]},h.title))})]})})}function Jx(){return e.jsx("section",{id:"spectrum",className:"section section-alt",children:e.jsxs("div",{className:"container",children:[e.jsx("h2",{children:"Adopt one config key at a time"}),e.jsxs("p",{className:"section-sub",children:["Start with a plain ",e.jsx("code",{children:"queryFn"}),". Add ",e.jsx("code",{children:"channel"})," when you’re ready for live updates. Add ",e.jsx("code",{children:"fields"})," when you need conflict resolution. Stop at any point — no rewrites."]}),e.jsxs("div",{className:"spectrum-steps",children:[e.jsxs("div",{className:"spectrum-step",children:[e.jsxs("div",{className:"spectrum-step-header",children:[e.jsx("span",{className:"step-number",children:"1"}),e.jsxs("div",{children:[e.jsx("h4",{children:"Server-only"}),e.jsx("p",{children:"Just a queryFn. No live connection, no client."})]})]}),e.jsx(u,{code:`realtimeCollectionOptions({
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (t) => t.id,
})`})]}),e.jsxs("div",{className:"spectrum-step active",children:[e.jsxs("div",{className:"spectrum-step-header",children:[e.jsx("span",{className:"step-number",children:"2"}),e.jsxs("div",{children:[e.jsx("h4",{children:"+ Channel — go live"}),e.jsx("p",{children:"Every mutation is broadcast to all subscribers."})]})]}),e.jsx(u,{code:`realtimeCollectionOptions({
  // ...queryFn, getKey
  client: realtimeClient,
  channel: ['todos', { projectId }],
})`})]}),e.jsxs("div",{className:"spectrum-step",children:[e.jsxs("div",{className:"spectrum-step-header",children:[e.jsx("span",{className:"step-number",children:"3"}),e.jsxs("div",{children:[e.jsx("h4",{children:"+ Fields — conflict-free"}),e.jsx("p",{children:"Concurrent edits merge automatically with CRDTs."})]})]}),e.jsx(u,{code:`realtimeCollectionOptions({
  // ...everything above
  fields: {
    title: 'lww',        // last-writer-wins
    votes: 'pn-counter', // concurrent increments add up
    tags:  'or-set',     // add always wins over remove
  },
})`})]})]})]})})}function $x(){return e.jsx("section",{id:"when-to-use",className:"section",children:e.jsxs("div",{className:"container",children:[e.jsx("h2",{children:"What this is (and isn’t)"}),e.jsxs("p",{className:"section-sub",children:[e.jsx("code",{children:"realtime.js"})," is a sync layer. It makes server functions reactive and adds presence, CRDTs, and pub/sub. It is not a database, not a hosting platform, and not a full backend — bring your own."]}),e.jsxs("div",{className:"positioning-grid",children:[e.jsxs("div",{className:"positioning-card positioning-good",children:[e.jsx("h3",{children:"Good fit"}),e.jsxs("ul",{children:[e.jsx("li",{children:"You have a database and want to make queries reactive without changing your stack"}),e.jsx("li",{children:"You want live updates, optimistic mutations, and automatic cache invalidation"}),e.jsx("li",{children:"You need presence, pub/sub, or collaborative editing"}),e.jsx("li",{children:"You want to choose your own database, ORM, auth, and deploy target"})]})]}),e.jsxs("div",{className:"positioning-card positioning-neutral",children:[e.jsx("h3",{children:"Look elsewhere"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Want a managed backend?"})," Convex bundles a database, auth, and realtime in one product. Less to configure, more to give up. Both are valid."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Postgres change streams?"})," ElectricSQL and PowerSync replicate at the WAL level. Different architecture."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Rich text?"})," Yjs is purpose-built."," ",e.jsx("code",{children:"realtime.js"})," works as a"," ",e.jsx("a",{href:"#/docs/rich-text-crdts",children:"transport for Y.js"}),", not a replacement."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Polling is fine?"})," TanStack Query with"," ",e.jsx("code",{children:"refetchInterval"})," is simpler when sub-second latency isn’t needed."]})]})]})]})]})})}function ej(){const c=[{label:"Core",features:[{title:"Reactive queries & mutations",desc:"Wrap server functions with realtime.query(). Channels derived automatically. Optimistic mutations with declarative rollback."},{title:"Composable collections",desc:"useQuery returns a live TanStack DB Collection. Pass it to useLiveQuery for client-side filtering, sorting, and joining — no extra server requests."},{title:"Presence & pub/sub",desc:"Track who's online, share cursor positions, and broadcast messages across subscribers."},{title:"Conflict-free data types",desc:"LWW registers, PN-counters, and OR-sets. Concurrent edits merge automatically."}]},{label:"Advanced",features:[{title:"AI streaming",desc:"Ordered, resumable streams with reduce-based state and HMAC-signed checkpoints."},{title:"Tick-based sync",desc:"Delta-compressed 60 Hz updates for game state, simulations, and high-frequency data."},{title:"Ephemeral channels",desc:"Auto-expiring events like typing indicators, emoji reactions, and toasts with configurable TTL."}]},{label:"Developer experience",features:[{title:"Transport-agnostic",desc:"SSE, Centrifugo, Pusher/Soketi, or PartyKit. Swap transports without changing application code."},{title:"Type-safe end to end",desc:"TypeScript flows from server function signature through channel keys to CRDT field definitions — no codegen needed."},{title:"Offline & multi-tab",desc:"Offline queue buffers mutations. Coordinated transport shares one connection across tabs."},{title:"DevTools",desc:"Inspect active channels, message logs, connection state, presence, and offline queue in a floating panel."},{title:"React, Solid & Vue",desc:"First-class adapters with framework-native internals. Same hooks/composables, same signatures."}]}];return e.jsx("section",{id:"features",className:"section section-alt",children:e.jsxs("div",{className:"container",children:[e.jsx("h2",{children:"Features"}),c.map(h=>e.jsxs("div",{className:"feature-group",children:[e.jsx("h3",{className:"feature-group-label",children:h.label}),e.jsx("div",{className:"features-grid",children:h.features.map(p=>e.jsxs("div",{className:"feature-card",children:[e.jsx("h3",{children:p.title}),e.jsx("p",{children:p.desc})]},p.title))})]},h.label))]})})}function tj(){const c=[{title:"SSE",tag:"Serverless-friendly",desc:"Receive-only HTTP. Works behind every proxy and CDN, runs on edge and serverless. The TanStack Start preset uses it under the hood. No presence — pair it with a provider for that."},{title:"Centrifugo",tag:"Self-hosted scale",desc:"WebSocket server you run. Bidirectional, with presence and gap replay built in. Scales across nodes natively."},{title:"Pusher / Soketi",tag:"Managed or self-hosted",desc:"Hosted Pusher with zero servers, or self-host Soketi (Pusher-protocol compatible). Presence via presence channels."},{title:"PartyKit",tag:"Edge / Durable Objects",desc:"Cloudflare Durable Objects at the edge. Bidirectional with presence; you deploy a small PartyKit server."}];return e.jsx("section",{id:"transports",className:"section",children:e.jsxs("div",{className:"container",children:[e.jsx("h2",{children:"Bring your own transport"}),e.jsxs("p",{className:"section-sub",children:["Four adapters ship today. Application code never references the transport — swap one import and your collections, hooks, and channels keep working. SSE handles the connection; for presence and multi-instance fan-out, reach for a provider or add a"," ",e.jsx("code",{children:"PublishBackend"}),". See the"," ",e.jsx("a",{href:"#/docs/transports",children:"capability matrix"})," for the honest per-provider breakdown."]}),e.jsx("div",{className:"features-grid",children:c.map(h=>e.jsxs("div",{className:"feature-card",children:[e.jsx("h3",{children:h.title}),e.jsxs("p",{children:[e.jsxs("strong",{children:[h.tag,"."]})," ",h.desc]})]},h.title))})]})})}function nj(){return e.jsx("section",{id:"quickstart",className:"section",children:e.jsxs("div",{className:"container",children:[e.jsx("h2",{children:"Quick start"}),e.jsxs("div",{className:"quickstart-steps",children:[e.jsxs("div",{className:"qs-step",children:[e.jsx("div",{className:"qs-number",children:"1"}),e.jsx("h3",{children:"Install"}),e.jsx(u,{code:"npm i @realtimejs/core @realtimejs/react"})]}),e.jsxs("div",{className:"qs-step",children:[e.jsx("div",{className:"qs-number",children:"2"}),e.jsx("h3",{children:"Create a client"}),e.jsx(u,{code:`import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'
import { RealtimeProvider } from '@realtimejs/react'

const client = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})

function App() {
  return (
    <RealtimeProvider client={client}>
      <YourApp />
    </RealtimeProvider>
  )
}`})]}),e.jsxs("div",{className:"qs-step",children:[e.jsx("div",{className:"qs-number",children:"3"}),e.jsx("h3",{children:"Query and mutate — it’s live"}),e.jsx(u,{code:`// Server — one annotation makes your function reactive
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)
export const addTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db.insert(todos).values({ teamId, title, done: false }).returning()
    return todo
  }
)

// Client — live data + optimistic mutations
function TodoList({ teamId }: { teamId: string }) {
  const { data } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })
  const { mutate } = useMutation(addTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, prev => [
        ...(prev ?? []), { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })
  // Click Add in one tab → it appears instantly in every tab
  return (
    <>
      <ul>{data?.map(t => <li key={t.id}>{t.title}</li>)}</ul>
      <button onClick={() => mutate({ teamId, title: 'New todo' })}>Add</button>
    </>
  )
}`})]})]})]})})}function sj(){return e.jsx("section",{className:"section section-alt",children:e.jsxs("div",{className:"container ecosystem-section",children:[e.jsx("h2",{children:"Ecosystem"}),e.jsx("p",{className:"section-sub",children:"Composes with the TanStack tools you already use."}),e.jsxs("div",{className:"ecosystem-grid",children:[e.jsxs("div",{className:"eco-card",children:[e.jsx("h3",{children:"TanStack DB"}),e.jsxs("p",{children:[e.jsx("code",{children:"useQuery"})," returns a live Collection. Compose with"," ",e.jsx("code",{children:"useLiveQuery"})," for client-side filtering, sorting, and joins."]})]}),e.jsxs("div",{className:"eco-card",children:[e.jsx("h3",{children:"TanStack Query"}),e.jsx("p",{children:"Coexists in the same app. Use Realtime for live data, Query for everything else."})]}),e.jsxs("div",{className:"eco-card",children:[e.jsx("h3",{children:"TanStack Start"}),e.jsx("p",{children:"Types flow from Drizzle schema through server functions to hooks. No codegen."})]}),e.jsxs("div",{className:"eco-card",children:[e.jsx("h3",{children:"Any backend"}),e.jsx("p",{children:"Not using Start? Works with Express, Hono, Fastify, or any fetch handler."})]})]})]})})}function rj(){const c=[{title:"Collaborative todos",desc:"Live collections plus field-level CRDTs — concurrent edits merge with no conflicts.",href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/collaborative-todos"},{title:"Chat",desc:"Channels and pub/sub — append-only live channels with history and typing indicators.",href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/chat"},{title:"AI streaming",desc:"Reduce-based streaming state — ordered, resumable token streams to the client.",href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/ai-streaming"}];return e.jsx("section",{id:"examples",className:"section",children:e.jsxs("div",{className:"container",children:[e.jsx("h2",{children:"Runnable examples"}),e.jsx("p",{className:"section-sub",children:"Full apps you can clone and run. Each one shows a different slice of the library."}),e.jsx("div",{className:"ecosystem-grid",children:c.map(h=>e.jsxs("a",{className:"eco-card",href:h.href,target:"_blank",rel:"noopener",children:[e.jsx("h3",{children:h.title}),e.jsx("p",{children:h.desc})]},h.title))})]})})}function aj(){return e.jsx("section",{className:"section",children:e.jsxs("div",{className:"container",children:[e.jsx("h2",{children:"Built for the community"}),e.jsxs("p",{className:"section-sub",children:[e.jsx("code",{children:"realtime.js"})," is MIT-licensed and community-driven. Join the conversation on"," ",e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime",target:"_blank",rel:"noopener",children:"GitHub"})," ","or"," ",e.jsx("a",{href:"https://discord.com/invite/WrRKjPJ",target:"_blank",rel:"noopener",children:"Discord"}),"."]})]})})}function ij(){return e.jsx("footer",{className:"footer",children:e.jsxs("div",{className:"container footer-inner",children:[e.jsxs("div",{className:"footer-brand",children:[e.jsx("span",{className:"logo-tan",children:"realtime"}),e.jsx("span",{className:"logo-realtime",children:".js"}),e.jsx("p",{children:"Bring your own backend. No platform, no per-seat bill."})]}),e.jsxs("div",{className:"footer-links",children:[e.jsxs("div",{children:[e.jsx("h4",{children:"Library"}),e.jsx("a",{href:"#features",children:"Features"}),e.jsx("a",{href:"#spectrum",children:"Progressive Adoption"}),e.jsx("a",{href:"#quickstart",children:"Quick Start"}),e.jsx("a",{href:"#/docs/getting-started",children:"Docs"})]}),e.jsxs("div",{children:[e.jsx("h4",{children:"Community"}),e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime",target:"_blank",rel:"noopener",children:"GitHub"}),e.jsx("a",{href:"https://discord.com/invite/WrRKjPJ",target:"_blank",rel:"noopener",children:"Discord"})]}),e.jsxs("div",{children:[e.jsx("h4",{children:"Ecosystem"}),e.jsx("a",{href:"https://tanstack.com/query",target:"_blank",rel:"noopener",children:"TanStack Query"}),e.jsx("a",{href:"https://tanstack.com/db",target:"_blank",rel:"noopener",children:"TanStack DB"}),e.jsx("a",{href:"https://tanstack.com/store",target:"_blank",rel:"noopener",children:"TanStack Store"}),e.jsx("a",{href:"https://tanstack.com/start",target:"_blank",rel:"noopener",children:"TanStack Start"})]})]}),e.jsx("div",{className:"footer-bottom",children:e.jsxs("p",{children:["© ",new Date().getFullYear()," mikn. MIT License. An independent, vendor-neutral project — not affiliated with or endorsed by TanStack."]})})]})})}function lj(){return e.jsxs(e.Fragment,{children:[e.jsx(Zx,{}),e.jsx(Xx,{}),e.jsx(Jx,{}),e.jsx($x,{}),e.jsx(ej,{}),e.jsx(tj,{}),e.jsx(nj,{}),e.jsx(sj,{}),e.jsx(rj,{}),e.jsx(aj,{}),e.jsx(ij,{})]})}const Yh={react:"React",solid:"Solid",vue:"Vue"};function Sc({react:c,solid:h,vue:p}){const[d,v]=G.useState("react"),I={react:c,solid:h,vue:p};return e.jsxs("div",{className:"framework-tabs",children:[e.jsx("div",{className:"framework-tab-bar",children:Object.keys(Yh).map(y=>e.jsx("button",{className:`framework-tab${d===y?" active":""}`,onClick:()=>v(y),children:Yh[y]},y))}),e.jsx("div",{className:"framework-tab-content",children:e.jsx(u,{code:I[d].code,title:I[d].title})})]})}function ap(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Getting Started"}),e.jsx("p",{className:"doc-lead",children:"Build a live todo list with optimistic mutations in five minutes. You’ll write a server function, wrap it with one annotation, and see every subscriber update automatically."}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"What you’ll have at the end:"})," a server function that queries your database, a client that stays in sync in real time, and instant optimistic mutations — the same reactive experience as fully managed platforms, on your own stack."]})}),e.jsx("h2",{id:"installation",children:"Installation"}),e.jsxs("p",{children:["Three pieces: the framework package (",e.jsx("code",{children:"@realtimejs/react"}),","," ","which re-exports ",e.jsx("code",{children:"@realtimejs/core"}),"), a transport adapter, and — for this guide’s auto-reactive server queries — the server preset plus the Drizzle engine. The meta package"," ",e.jsx("code",{children:"realtime.js"})," is also published if you prefer a single dependency."]}),e.jsx(Sc,{react:{code:`npm i @realtimejs/core @realtimejs/react @realtimejs/adapter-sse \\
      @realtimejs/preset-start @realtimejs/reactive-drizzle`},solid:{code:`npm i @realtimejs/core @realtimejs/solid @realtimejs/adapter-sse \\
      @realtimejs/preset-start @realtimejs/reactive-drizzle`},vue:{code:`npm i @realtimejs/core @realtimejs/vue @realtimejs/adapter-sse \\
      @realtimejs/preset-start @realtimejs/reactive-drizzle`}}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Why two server packages?"})," ",e.jsx("code",{children:"@realtimejs/preset-start"})," owns the transport (the SSE handler, ",e.jsx("code",{children:"publish"}),", auth). The auto-reactive query layer behind ",e.jsx("code",{children:"realtime.query()"})," /"," ",e.jsx("code",{children:"realtime.mutation()"})," ships"," ",e.jsx("strong",{children:"one engine today"})," —"," ",e.jsx("code",{children:"@realtimejs/reactive-drizzle"})," (Drizzle ORM + Postgres). If your stack isn’t Drizzle/Postgres, skip it and use the vendor-neutral primitives below (",e.jsx("code",{children:"useRealtimeCollection"}),", channels, presence) on any backend — see"," ",e.jsx("a",{href:"#/docs/why",children:"Why realtime.js"})," for the full capability breakdown."]})}),e.jsx("h2",{id:"server-setup",children:"Server setup"}),e.jsxs("p",{children:["Two packages cooperate here. ",e.jsx("code",{children:"@realtimejs/preset-start"})," owns the transport (SSE connections, ",e.jsx("code",{children:"publish"}),", auth)."," ",e.jsx("code",{children:"@realtimejs/reactive-drizzle"})," owns reactivity (the"," ",e.jsx("code",{children:"query"}),"/",e.jsx("code",{children:"mutation"})," wrappers that derive channels and auto-invalidate). Compose them once and re-export a single"," ",e.jsx("code",{children:"realtime"})," object that the rest of the app imports."]}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { createReactiveQueries } from '@realtimejs/reactive-drizzle'

// 1. Create the reactive engine first — the handler needs its onChannelEmpty.
const reactive = createReactiveQueries()

// 2. Create the transport handler (no auth required to get started).
const handler = createStartHandler({
  onChannelEmpty: reactive.onChannelEmpty,
})

// 3. Wire the handler's publish back into the engine so invalidations fan out.
reactive.bindPublish(handler.publish)

// 4. Re-export one object — \`realtime.handle\` for the route,
//    \`realtime.query\`/\`realtime.mutation\` for your server functions.
export const realtime = {
  handle: handler.handle,
  publish: handler.publish,
  query: reactive.query,
  mutation: reactive.mutation,
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Adding auth later:"})," pass ",e.jsx("code",{children:"getUser"})," and"," ",e.jsx("code",{children:"authorize"})," callbacks to lock down subscriptions and publishes. See the"," ",e.jsx("a",{href:"#/docs/authentication",children:"Authentication guide"})," for the full pattern. For now, let’s get data on screen first."]})}),e.jsx(u,{title:"app/routes/api/realtime.ts",code:`import { createAPIFileRoute } from '@tanstack/start/api'
import { realtime } from '../../server/realtime'

export const Route = createAPIFileRoute('/api/realtime')({
  GET:     ({ request }) => realtime.handle(request),
  POST:    ({ request }) => realtime.handle(request),
  OPTIONS: ({ request }) => realtime.handle(request),
})`}),e.jsx("h2",{id:"client-setup",children:"Client setup"}),e.jsx(u,{title:"app/client/realtime.ts",code:`import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

export const realtimeClient = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})`}),e.jsx(Sc,{react:{title:"app/root.tsx",code:`import { RealtimeProvider } from '@realtimejs/react'
import { realtimeClient } from './client/realtime'

function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <RouterProvider router={router} />
    </RealtimeProvider>
  )
}`},solid:{title:"app/root.tsx",code:`import { RealtimeProvider } from '@realtimejs/solid'
import { realtimeClient } from './client/realtime'

function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <RouterProvider router={router} />
    </RealtimeProvider>
  )
}`},vue:{title:"app/App.vue",code:`<script setup>
import { provideRealtimeClient } from '@realtimejs/vue'
import { realtimeClient } from './client/realtime'

provideRealtimeClient(realtimeClient)
<\/script>

<template>
  <RouterView />
</template>`}}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Auto-connect:"})," ",e.jsx("code",{children:"RealtimeProvider"})," calls"," ",e.jsx("code",{children:"client.connect()"})," automatically on mount and tears down on unmount. Pass"," ",e.jsxs("code",{children:["autoConnect=","{","false","}"]})," ","to manage the connection lifecycle yourself."]})}),e.jsx("h2",{id:"reactive-queries",children:"Your first reactive query"}),e.jsxs("p",{children:["Wrap your server function with ",e.jsx("code",{children:"realtime.query()"})," and call"," ",e.jsx("code",{children:"useQuery()"})," on the client. The channel is derived automatically from the query arguments — no manual wiring. Every component sharing the same ",e.jsx("code",{children:"(serverFn, args)"})," pair shares one fetch, one connection, and one cache."]}),e.jsx(u,{title:"app/server/todos.ts",code:`import { realtime } from './realtime'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'

// realtime.query() wraps your existing function — one annotation, data is now live
export const getTodos = realtime.query(
  async ({ teamId }: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, teamId))
)

export const createTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db.insert(todos).values({ teamId, title, done: false }).returning()
    return todo
  }
)`}),e.jsx(Sc,{react:{title:"app/features/todos/TodoList.tsx",code:`import { useQuery, useMutation } from '@realtimejs/react'
import { getTodos, createTodo } from '../../server/todos'

function TodoList({ teamId }: { teamId: string }) {
  const { data, isPending } = useQuery(getTodos, { teamId }, {
    getKey: (t) => t.id,
  })
  const { mutate } = useMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, prev => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  if (isPending) return <p>Loading…</p>
  return (
    <>
      <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>
      <button onClick={() => mutate({ teamId, title: 'New' })}>Add</button>
    </>
  )
}`},solid:{title:"app/features/todos/TodoList.tsx",code:`import { createQuery, createMutation } from '@realtimejs/solid'
import { getTodos, createTodo } from '../../server/todos'

function TodoList(props: { teamId: string }) {
  const { data, isPending } = createQuery(getTodos, () => ({ teamId: props.teamId }), {
    getKey: (t) => t.id,
  })
  const { mutate } = createMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, prev => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  return (
    <Show when={!isPending()} fallback={<p>Loading…</p>}>
      <ul><For each={data()}>{t => <li>{t.title}</li>}</For></ul>
      <button onClick={() => mutate({ teamId: props.teamId, title: 'New' })}>Add</button>
    </Show>
  )
}`},vue:{title:"app/features/todos/TodoList.vue",code:`<script setup lang="ts">
import { useQuery, useMutation } from '@realtimejs/vue'
import { getTodos, createTodo } from '../../server/todos'

const props = defineProps<{ teamId: string }>()
const { data, isPending } = useQuery(getTodos, { teamId: props.teamId }, {
  getKey: (t) => t.id,
})
const { mutate } = useMutation(createTodo, {
  optimistic: (cache, args) => {
    cache.update(getTodos, { teamId: args.teamId }, prev => [
      ...(prev ?? []),
      { id: crypto.randomUUID(), title: args.title, done: false },
    ])
  },
})
<\/script>

<template>
  <p v-if="isPending">Loading…</p>
  <template v-else>
    <ul><li v-for="t in data" :key="t.id">{{ t.title }}</li></ul>
    <button @click="mutate({ teamId: props.teamId, title: 'New' })">Add</button>
  </template>
</template>`}}),e.jsxs("p",{children:["The returned ",e.jsx("code",{children:"collection"})," is a live"," ",e.jsx("a",{href:"https://tanstack.com/db",target:"_blank",rel:"noopener",children:"TanStack DB Collection"}),". Pass it to ",e.jsx("code",{children:"useLiveQuery"})," for client-side filtering and sorting without additional server requests:"]}),e.jsx(u,{code:`import { useLiveQuery } from '@tanstack/react-db'

const { data, collection } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

// Filter entirely on the client — no extra fetch
const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)`}),e.jsx("h2",{id:"first-collection",children:"Alternative: REST-based live collections"}),e.jsxs("p",{children:["Not using TanStack Start or Drizzle? Connect any existing REST API with"," ",e.jsx("code",{children:"useRealtimeCollection"}),":"]}),e.jsx(u,{code:`import { useRealtimeCollection } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

function TodoList() {
  const todos = useRealtimeCollection<Todo>({
    url: '/api/todos',
    getKey: (t) => t.id,
  })
  const { data } = useLiveQuery((q) => q.from({ todos }))
  return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>
}`}),e.jsx("div",{className:"doc-callout",id:"how-it-works",children:e.jsxs("p",{children:[e.jsx("strong",{children:"How it works — connection vs. fan-out."})," Every realtime system solves two problems: ",e.jsx("em",{children:"connection"})," (how clients stay open and receive pushes) and ",e.jsx("em",{children:"fan-out"})," (how a publish on one server instance reaches clients on other instances). SSE handles connection. For multi-instance deployments add a"," ",e.jsx("code",{children:"PublishBackend"})," like Upstash Redis. A single-instance deployment works without one. Centrifugo solves both: clients connect directly to it and it handles all fan-out natively. See the"," ",e.jsx("a",{href:"#/docs/transports",children:"Transports guide"})," for a full comparison."]})}),e.jsx("h2",{id:"what-just-happened",children:"What just happened"}),e.jsx("p",{children:"In roughly 30 lines of code across server and client, you now have:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Live queries"})," — every component calling"," ",e.jsxs("code",{children:["useQuery(getTodos, ","{"," teamId ","}",")"]})," ","with the same args shares one connection and one cache. When any client mutates, all subscribers see the update instantly."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Optimistic mutations"})," — the UI updates before the server responds and rolls back automatically on error."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Automatic channels"})," — channels are derived from query arguments. No manual wiring, no channel strings to keep in sync."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Client-side queries"})," — the returned"," ",e.jsx("code",{children:"collection"})," works with ",e.jsx("code",{children:"useLiveQuery"})," for filtering and sorting without extra server requests."]})]}),e.jsx("p",{children:"This is the same reactive developer experience you get from fully managed platforms — live queries, optimistic mutations, automatic cache invalidation — running on your database, your ORM, your server."}),e.jsx("h2",{id:"next-steps",children:"Next steps"}),e.jsx("p",{children:"You have a working reactive app. Here’s where to go depending on what you’re building:"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"I want to…"}),e.jsx("th",{children:"Read this"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Understand reactive queries deeply (batching, consistency, pagination)"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Show who’s online, share cursors"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/presence",children:"Presence"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Build a chat or activity feed"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/channels",children:"Channels & Pub/Sub"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Handle concurrent edits without conflicts"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/crdts",children:"CRDTs"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Stream AI tokens to the client"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/streaming",children:"Streaming"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Add authentication and per-channel authorization"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/authentication",children:"Authentication"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Choose the right pattern for my use case"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/choosing-a-pattern",children:"Choosing a Pattern"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Prepare for multi-instance production deployment"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/scaling",children:"Scaling to Production"})})]})]})]})]})}function cj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Collections"}),e.jsxs("p",{className:"doc-lead",children:[e.jsx("code",{children:"realtimeCollectionOptions"})," turns a TanStack DB collection into a live, synced data source. Seed from your database, broadcast mutations through a channel, and resolve conflicts with CRDTs."]}),e.jsx("h2",{id:"react-shorthand",children:"React: useRealtimeCollection with url"}),e.jsxs("p",{children:["In React, ",e.jsx("code",{children:"useRealtimeCollection"})," accepts a ",e.jsx("code",{children:"url"})," ","prop that generates ",e.jsx("code",{children:"queryFn"})," and CRUD callbacks automatically. The channel is derived from the URL when omitted. Pair with ",e.jsx("code",{children:"useLiveQuery"})," for reactive rendering."]}),e.jsx(u,{title:"features/tasks/TaskList.tsx",code:`import { useRealtimeCollection } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

function TaskList({ projectId }: { projectId: string }) {
  const tasks = useRealtimeCollection<Task>({
    url: \`/api/tasks?projectId=\${projectId}\`,
    getKey: (t) => t.id,
    fields: { title: 'lww', status: 'lww', assignees: 'or-set' },
  })

  const { data } = useLiveQuery((q) => q.from({ tasks }))

  return <ul>{data.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
}`}),e.jsx("h2",{id:"with-rest",children:"withRest — framework-agnostic"}),e.jsxs("p",{children:["Outside React (or when building reusable collection configs), spread"," ",e.jsx("code",{children:"withRest"})," into ",e.jsx("code",{children:"realtimeCollectionOptions"})," to wire ",e.jsx("code",{children:"getKey"}),", ",e.jsx("code",{children:"queryFn"}),", ",e.jsx("code",{children:"onInsert"}),","," ",e.jsx("code",{children:"onUpdate"}),", and ",e.jsx("code",{children:"onDelete"})," to standard REST/JSON endpoints in one call. Your server routes stay as plain CRUD — no changes required."]}),e.jsx(u,{title:"features/tasks/collection.ts",code:`import { withRest, realtimeCollectionOptions } from '@realtimejs/core'

const tasksOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withRest<Task, string>({
      url: \`/api/tasks?projectId=\${projectId}\`,
      getKey: (t) => t.id,
    }),
    client:  realtimeClient,
    channel: ['tasks', { projectId }],
    fields:  { title: 'lww', status: 'lww', assignees: 'or-set' },
  })`}),e.jsx(u,{title:"server/routes/tasks.ts",code:`// Standard REST routes — no publish() needed anywhere.
router.get('/api/tasks', (req) =>
  db.tasks.findMany({ where: { projectId: req.query.projectId } })
)
router.post('/api/tasks', (req) =>
  db.tasks.create({ data: req.body })
)
router.patch('/api/tasks/:id', (req) =>
  db.tasks.update({ where: { id: req.params.id }, data: req.body })
)
router.delete('/api/tasks/:id', async (req) => {
  await db.tasks.delete({ where: { id: req.params.id } })
})`}),e.jsx("h2",{id:"custom-callbacks",children:"Custom callbacks"}),e.jsxs("p",{children:["Write ",e.jsx("code",{children:"onInsert"})," / ",e.jsx("code",{children:"onUpdate"})," manually when you need custom logic — multi-table writes, conditional branching, or returning a shaped response. Return the saved row and the library handles the broadcast."]}),e.jsx(u,{title:"features/chat/collection.ts",code:`const messagesOptions = (roomId: string) =>
  realtimeCollectionOptions({
    client:  realtimeClient,
    channel: ['messages', { roomId }],
    getKey:  (m) => m.id,

    queryFn: () =>
      fetch(\`/api/rooms/\${roomId}/messages?limit=50\`)
        .then((r) => r.json()),

    onInsert: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const res = await fetch(\`/api/rooms/\${roomId}/messages\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json() // returning the saved row triggers auto-broadcast
    },
  })`}),e.jsx("h2",{id:"server-push",children:"Server-initiated push"}),e.jsxs("p",{children:["The one case where you call ",e.jsx("code",{children:"sseHandler.broadcast()"})," ","directly: changes that originate outside a client mutation — background jobs, cron tasks, webhooks."]}),e.jsx(u,{title:"server/jobs/inventorySync.ts",code:`import { sseHandler } from '../realtime'
import { serializeKey } from '@realtimejs/core'

export async function syncInventory(productId: string) {
  const latestStock = await warehouseApi.getStock(productId)
  const product = await db.products.update({
    where: { id: productId },
    data: { stock: latestStock },
  })
  sseHandler.broadcast(
    serializeKey(['products', { id: productId }]),
    { action: 'update', data: product },
  )
}`}),e.jsx("h2",{id:"auto-broadcast",children:"How auto-broadcast works"}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["After ",e.jsx("code",{children:"onInsert"})," or ",e.jsx("code",{children:"onUpdate"})," returns a value, the originating tab calls ",e.jsx("code",{children:"client.publish()"})," automatically. You only call ",e.jsx("code",{children:"sseHandler.broadcast()"})," directly for changes that originate outside a client mutation."]})}),e.jsx("h2",{id:"full-stack",children:"Full-stack with TanStack Start"}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["Using TanStack Start? ",e.jsx("code",{children:"withServerFns"})," wires"," ",e.jsx("code",{children:"createServerFn"})," callables directly into collection callbacks — no REST layer, full type safety from DB schema to UI, and built-in support for optimistic locking with"," ",e.jsx("code",{children:"ConflictError"}),". See the"," ",e.jsx("a",{href:"#/docs/server-functions",children:"TanStack Start + Drizzle"})," guide."]})}),e.jsx("h2",{id:"optimistic-updates",children:"Optimistic updates"}),e.jsxs("p",{children:["Enable ",e.jsx("code",{children:"optimistic: true"})," to add a nonce to each mutation. The echo from the server is suppressed so there are no duplicate flashes. Use ",e.jsx("code",{children:"onOptimisticError"})," to handle failures — including conflicts detected by the server."]}),e.jsx(u,{code:`import { isConflictError } from '@realtimejs/core'

realtimeCollectionOptions({
  // ...
  optimistic: true,
  onOptimisticError: ({ error, action, key }) => {
    // action is the mutation type: 'insert' | 'update' | 'delete'
    if (isConflictError(error)) {
      // error.current holds the authoritative server state
      showConflictDialog({ current: error.current, action, key })
    } else {
      console.error(\`\${action} failed for key\`, key, error)
    }
  },
})`}),e.jsx("h2",{id:"refetch",children:"Gap recovery with refetch"}),e.jsxs("p",{children:["Add ",e.jsx("code",{children:"refetchOnReconnect: true"})," to any collection with a"," ",e.jsx("code",{children:"queryFn"}),". After a network gap, the query re-runs and diffs against local state."]}),e.jsx(u,{code:`realtimeCollectionOptions({
  // ...
  refetchOnReconnect: true,
})`}),e.jsx("h2",{id:"subscribe-errors",children:"Subscribe error handling"}),e.jsxs("p",{children:["When a subscription is rejected — authorization denied, channel not found, or a transport error — the client emits a subscribe error. The collection-level hooks surface it for you:"," ",e.jsx("code",{children:"liveChannelOptions"})," accepts an ",e.jsx("code",{children:"onSubscribeError"})," ","callback, and ",e.jsx("code",{children:"useChannel"})," / ",e.jsx("code",{children:"useSubscribe"})," return a reactive ",e.jsx("code",{children:"subscribeError"}),". To observe errors globally, register a listener with ",e.jsx("code",{children:"client.onSubscribeError"}),"."]}),e.jsx(u,{code:`import { useRealtime } from '@realtimejs/react'
import { useEffect } from 'react'

function SyncBanner() {
  const { status, client } = useRealtime()

  // Surface per-channel subscribe rejections (e.g. authorization denied).
  useEffect(
    () =>
      client.onSubscribeError((channel, reason, code) => {
        toast.error(\`Subscription to \${channel} failed: \${reason} (\${code})\`)
      }),
    [client],
  )

  if (status === 'disconnected') {
    return <div>Live updates unavailable. Check your connection.</div>
  }
  return null
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["See the ",e.jsx("a",{href:"#/docs/error-reference",children:"Error Reference"})," for details on subscribe errors, authorization failures, and how to debug them."]})}),e.jsx("h2",{id:"offline-queue",children:"Offline queue integration"}),e.jsxs("p",{children:["Register an offline queue on your transport with"," ",e.jsx("code",{children:"useOfflineQueue"})," to buffer publishes while the client is offline. Queued messages replay automatically in FIFO order when the connection is restored. Pair with ",e.jsx("code",{children:"optimistic: true"})," on your collections so local writes appear instantly while the queue waits to flush."]}),e.jsx(u,{code:`import { useOfflineQueue, createLocalStorageAdapter } from '@realtimejs/core'

const queue = useOfflineQueue(baseTransport, {
  maxSize: 500,
  storage: createLocalStorageAdapter(),
})

// Collections using this transport automatically buffer offline mutations.
const client = createRealtimeClient({ transport: baseTransport })`}),e.jsxs("p",{children:["See ",e.jsx("a",{href:"#/docs/resilience",children:"Resilience"})," for full offline queue options including IndexedDB storage and pending-count badges."]}),e.jsx("h2",{id:"see-also",children:"See also"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/server-functions",children:"TanStack Start + Drizzle"})," —"," ",e.jsx("code",{children:"withServerFns"})," for end-to-end type-safe collections without a REST layer"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," — the auto-channel ",e.jsx("code",{children:"realtime.query()"})," alternative for Drizzle/Postgres"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/crdts",children:"CRDTs"})," — field-level conflict resolution with LWW registers, PN-Counters, and OR-Sets"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/resilience",children:"Resilience"})," — offline queue, gap recovery, and multi-tab coordination"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/scaling",children:"Scaling to Production"})," — the PublishBackend interface for multi-process fan-out"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/error-reference",children:"Error Reference"})," — handling ConflictError, subscribe errors, and flush errors"]})]})]})}let oj=0;function Fe(c,h){return{id:++oj,client:c,text:h}}function Rc({entries:c}){const h=G.useRef(null);return G.useEffect(()=>{h.current&&(h.current.scrollTop=h.current.scrollHeight)},[c.length]),e.jsx("div",{className:"demo-log",ref:h,children:c.map(p=>e.jsxs("div",{className:`demo-log-entry demo-log-${p.client}`,children:[p.client!=="system"&&e.jsx("span",{className:`demo-dot demo-dot-${p.client}`}),p.text]},p.id))})}function dj(){const[c,h]=G.useState("Shopping List"),[p,d]=G.useState("Shopping List"),[v,I]=G.useState(0),[y,S]=G.useState(0),[g,f]=G.useState(null),[A,T]=G.useState([Fe("system",'Both clients see "Shopping List". Edit both, then merge.')]),Q=O=>{const L=v+1;h(O),I(L),f(null),T(H=>[...H,Fe("a",`set "${O}" (clock ${L})`)])},B=O=>{const L=y+1;d(O),S(L),f(null),T(H=>[...H,Fe("b",`set "${O}" (clock ${L})`)])},C=()=>{const O=v>y,L=O?"A":"B",H=O?c:p,_=v===y?`Tie at clock ${v} — clientId tiebreak (B > A)`:`clock ${Math.max(v,y)} > ${Math.min(v,y)}`;f({value:H,winner:L,reason:_}),T(X=>[...X,Fe("system",`Merge: Client ${L} wins (${_})`),Fe("system",`Both converge to "${H}"`)])},R=()=>{h("Shopping List"),d("Shopping List"),I(0),S(0),f(null),T([Fe("system",'Reset. Both clients see "Shopping List".')])};return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"LWW Register"}),e.jsxs("p",{className:"demo-desc",children:["Two clients rename a document while offline. On reconnect, the higher Lamport clock wins. Edit both fields and click ",e.jsx("strong",{children:"Merge"}),"."]}),e.jsxs("div",{className:"demo-clients",children:[e.jsxs("div",{className:"demo-client demo-client-a",children:[e.jsxs("div",{className:"demo-client-hdr",children:[e.jsx("span",{className:"demo-dot demo-dot-a"})," Client A",e.jsxs("span",{className:"demo-clock",children:["clock: ",v]})]}),e.jsx("input",{className:"demo-input",value:c,onChange:O=>Q(O.target.value)})]}),e.jsxs("div",{className:"demo-client demo-client-b",children:[e.jsxs("div",{className:"demo-client-hdr",children:[e.jsx("span",{className:"demo-dot demo-dot-b"})," Client B",e.jsxs("span",{className:"demo-clock",children:["clock: ",y]})]}),e.jsx("input",{className:"demo-input",value:p,onChange:O=>B(O.target.value)})]})]}),e.jsxs("div",{className:"demo-actions",children:[e.jsx("button",{className:"demo-btn demo-btn-primary",onClick:C,children:"Reconnect & Merge"}),e.jsx("button",{className:"demo-btn",onClick:R,children:"Reset"})]}),g&&e.jsxs("div",{className:`demo-result demo-result-${g.winner.toLowerCase()}`,children:[e.jsx("strong",{children:"Merged:"}),' "',g.value,'" — Client'," ",g.winner," wins (",g.reason,")"]}),e.jsx(Rc,{entries:A})]})}function uj(c){let h=0;for(const p of Object.values(c.inc))h+=p??0;for(const p of Object.values(c.dec))h-=p??0;return h}function hj(c,h){const p={...c.inc},d={...c.dec};for(const[v,I]of Object.entries(h.inc))(p[v]??0)<(I??0)&&(p[v]=I);for(const[v,I]of Object.entries(h.dec))(d[v]??0)<(I??0)&&(d[v]=I);return{inc:p,dec:d}}function pj(){const[c,h]=G.useState({inc:{},dec:{}}),[p,d]=G.useState({inc:{},dec:{}}),[v,I]=G.useState([Fe("system","Click +/- on each client. The merged total is always correct.")]),y=()=>{h(B=>({inc:{...B.inc,a:(B.inc.a??0)+1},dec:B.dec})),I(B=>[...B,Fe("a","+1")])},S=()=>{h(B=>({inc:B.inc,dec:{...B.dec,a:(B.dec.a??0)+1}})),I(B=>[...B,Fe("a","-1")])},g=()=>{d(B=>({inc:{...B.inc,b:(B.inc.b??0)+1},dec:B.dec})),I(B=>[...B,Fe("b","+1")])},f=()=>{d(B=>({inc:B.inc,dec:{...B.dec,b:(B.dec.b??0)+1}})),I(B=>[...B,Fe("b","-1")])},A=()=>{h({inc:{},dec:{}}),d({inc:{},dec:{}}),I([Fe("system","Reset. Counter back to 0.")])},T=hj(c,p),Q=uj(T);return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"PN-Counter"}),e.jsxs("p",{className:"demo-desc",children:["Each client tracks its own increments and decrements. Merging takes the max per client — ",e.jsx("strong",{children:"concurrent votes never get lost"}),"."]}),e.jsxs("div",{className:"demo-counter-total",children:[e.jsx("span",{className:"demo-counter-num",children:Q}),e.jsx("span",{className:"demo-counter-label",children:"merged total"})]}),e.jsxs("div",{className:"demo-clients",children:[e.jsxs("div",{className:"demo-client demo-client-a",children:[e.jsxs("div",{className:"demo-client-hdr",children:[e.jsx("span",{className:"demo-dot demo-dot-a"})," Client A",e.jsxs("span",{className:"demo-clock",children:["+",c.inc.a??0," / -",c.dec.a??0]})]}),e.jsxs("div",{className:"demo-btn-row",children:[e.jsx("button",{className:"demo-btn demo-btn-green",onClick:y,children:"+1"}),e.jsx("button",{className:"demo-btn demo-btn-red",onClick:S,children:"-1"})]})]}),e.jsxs("div",{className:"demo-client demo-client-b",children:[e.jsxs("div",{className:"demo-client-hdr",children:[e.jsx("span",{className:"demo-dot demo-dot-b"})," Client B",e.jsxs("span",{className:"demo-clock",children:["+",p.inc.b??0," / -",p.dec.b??0]})]}),e.jsxs("div",{className:"demo-btn-row",children:[e.jsx("button",{className:"demo-btn demo-btn-green",onClick:g,children:"+1"}),e.jsx("button",{className:"demo-btn demo-btn-red",onClick:f,children:"-1"})]})]})]}),e.jsx("div",{className:"demo-actions",children:e.jsx("button",{className:"demo-btn",onClick:A,children:"Reset"})}),e.jsx(Rc,{entries:v})]})}function Va(c){const h=new Map;for(const p of c.entries)h.set(p.key,p.value);return Array.from(h.values())}function Gh(c,h){const p=new Map;for(const d of c.entries)p.set(d.tag,d);for(const d of h.entries)p.set(d.tag,d);return{entries:Array.from(p.values())}}function wc(c,h){const p=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;return{entries:[...c.entries,{key:JSON.stringify(h),value:h,tag:p}]}}function Vh(c,h){return{entries:c.entries.filter(p=>p.key!==JSON.stringify(h))}}const mj=["bug","feature","docs"];function Tc(){let c={entries:[]};for(const h of mj)c=wc(c,h);return c}function fj(){const[c,h]=G.useState(Tc),[p,d]=G.useState(Tc),[v,I]=G.useState(""),[y,S]=G.useState(""),[g,f]=G.useState(!1),[A,T]=G.useState([Fe("system","Both clients see: bug, feature, docs. Add/remove, then merge.")]),Q=()=>{v.trim()&&(h(_=>wc(_,v.trim())),T(_=>[..._,Fe("a",`add "${v.trim()}"`)]),I(""),f(!1))},B=()=>{y.trim()&&(d(_=>wc(_,y.trim())),T(_=>[..._,Fe("b",`add "${y.trim()}"`)]),S(""),f(!1))},C=_=>{h(X=>Vh(X,_)),T(X=>[...X,Fe("a",`remove "${_}"`)]),f(!1)},R=_=>{d(X=>Vh(X,_)),T(X=>[...X,Fe("b",`remove "${_}"`)]),f(!1)},O=()=>{const _=Va(Gh(c,p));f(!0),T(X=>[...X,Fe("system",`Merge (union): [${_.join(", ")}]`)])},L=()=>{const _=Tc();h(_),d(_),I(""),S(""),f(!1),T([Fe("system","Reset.")])},H=Gh(c,p);return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"OR-Set"}),e.jsx("p",{className:"demo-desc",children:"Each add gets a unique tag. A concurrent add always wins over a concurrent remove. Try adding a tag on one client while removing it on the other."}),e.jsxs("div",{className:"demo-clients",children:[e.jsxs("div",{className:"demo-client demo-client-a",children:[e.jsxs("div",{className:"demo-client-hdr",children:[e.jsx("span",{className:"demo-dot demo-dot-a"})," Client A"]}),e.jsx("div",{className:"demo-tags",children:Va(c).map(_=>e.jsxs("span",{className:"demo-tag",children:[_," ",e.jsx("button",{className:"demo-tag-x",onClick:()=>C(_),children:"x"})]},_))}),e.jsxs("div",{className:"demo-tag-add",children:[e.jsx("input",{className:"demo-input",value:v,placeholder:"new tag...",onChange:_=>I(_.target.value),onKeyDown:_=>_.key==="Enter"&&Q()}),e.jsx("button",{className:"demo-btn",onClick:Q,children:"Add"})]})]}),e.jsxs("div",{className:"demo-client demo-client-b",children:[e.jsxs("div",{className:"demo-client-hdr",children:[e.jsx("span",{className:"demo-dot demo-dot-b"})," Client B"]}),e.jsx("div",{className:"demo-tags",children:Va(p).map(_=>e.jsxs("span",{className:"demo-tag",children:[_," ",e.jsx("button",{className:"demo-tag-x",onClick:()=>R(_),children:"x"})]},_))}),e.jsxs("div",{className:"demo-tag-add",children:[e.jsx("input",{className:"demo-input",value:y,placeholder:"new tag...",onChange:_=>S(_.target.value),onKeyDown:_=>_.key==="Enter"&&B()}),e.jsx("button",{className:"demo-btn",onClick:B,children:"Add"})]})]})]}),e.jsxs("div",{className:"demo-actions",children:[e.jsx("button",{className:"demo-btn demo-btn-primary",onClick:O,children:"Reconnect & Merge"}),e.jsx("button",{className:"demo-btn",onClick:L,children:"Reset"})]}),g&&e.jsxs("div",{className:"demo-result",children:[e.jsx("strong",{children:"Merged tags:"})," ",Va(H).map(_=>e.jsx("span",{className:"demo-tag demo-tag-merged",children:_},_))]}),e.jsx(Rc,{entries:A})]})}function xj(){const[c,h]=G.useState("lww");return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"CRDTs"}),e.jsxs("p",{className:"doc-lead",children:["Conflict-free data types let two clients edit the same row simultaneously and merge deterministically. Declare ",e.jsx("code",{children:"fields"})," ","on a collection and every conflict is resolved automatically."]}),e.jsx("h2",{id:"try-it",children:"Try it"}),e.jsxs("p",{children:["Each demo simulates two clients editing while offline. Click"," ",e.jsx("strong",{children:"Reconnect & Merge"})," to see how the CRDT resolves the conflict."]}),e.jsxs("div",{className:"demo-tabs",children:[e.jsx("button",{className:`demo-tab${c==="lww"?" active":""}`,onClick:()=>h("lww"),children:"LWW Register"}),e.jsx("button",{className:`demo-tab${c==="pn"?" active":""}`,onClick:()=>h("pn"),children:"PN-Counter"}),e.jsx("button",{className:`demo-tab${c==="or"?" active":""}`,onClick:()=>h("or"),children:"OR-Set"})]}),c==="lww"&&e.jsx(dj,{}),c==="pn"&&e.jsx(pj,{}),c==="or"&&e.jsx(fj,{}),e.jsx("h2",{id:"field-types",children:"Field types"}),e.jsx(u,{code:`realtimeCollectionOptions({
  // ...
  fields: {
    title:     'lww',        // Last-writer-wins (Lamport clock + clientId)
    votes:     'pn-counter', // Positive-negative counter
    tags:      'or-set',     // Observed-remove set (add wins)
    draftText: 'local',      // Client-only, never synced
  },
})`}),e.jsxs("div",{className:"doc-grid",children:[e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"lww"}),e.jsx("p",{children:"Lamport clock + clientId tiebreak. Most recent write wins deterministically. Use for text, enums, timestamps."})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"pn-counter"}),e.jsx("p",{children:"Per-client increment/decrement vectors. Merging takes the max — concurrent votes always add up."})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"or-set"}),e.jsx("p",{children:"Each add gets a unique tag. Add always wins over concurrent remove. Use for tags, reactions, assignee lists."})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"local"}),e.jsx("p",{children:"Client-only field, never synced. Incoming messages leave it untouched. Use for UI state like drafts or expand toggles."})]})]}),e.jsx("h2",{id:"standalone-hooks",children:"Standalone CRDT hooks"}),e.jsx("p",{children:"Self-contained hooks for shared counters, values, and sets. No collection required."}),e.jsx(u,{title:"useSyncedCounter",code:`import { defineSyncedCounter } from '@realtimejs/core'
import { useSyncedCounter } from '@realtimejs/react'

const postVotes = defineSyncedCounter({
  id: 'post-votes',
  channel: (params: { postId: string }) => ['votes', params],
})

function VoteButton({ postId }: { postId: string }) {
  const { value, increment, decrement } = useSyncedCounter(postVotes, {
    params: { postId },
    initial: 0,
  })

  return (
    <div>
      <button onClick={() => decrement()}>-</button>
      <span>{value}</span>
      <button onClick={() => increment()}>+</button>
    </div>
  )
}`}),e.jsx(u,{title:"useSyncedSet",code:`import { defineSyncedSet } from '@realtimejs/core'
import { useSyncedSet } from '@realtimejs/react'

const postTags = defineSyncedSet({
  id: 'post-tags',
  channel: (params: { postId: string }) => ['tags', params],
})

function TagEditor({ postId }: { postId: string }) {
  const { values: tags, add, remove } = useSyncedSet(postTags, {
    params: { postId },
    initial: [],
  })

  return (
    <>
      {tags.map(tag => (
        <span key={tag}>{tag} <button onClick={() => remove(tag)}>x</button></span>
      ))}
      <button onClick={() => add('important')}>+ important</button>
    </>
  )
}`}),e.jsx("h2",{id:"undo-redo",children:"Undo / redo"}),e.jsxs("p",{children:["CRDTs guarantee ",e.jsx("strong",{children:"convergence"})," — every client reaches the same state regardless of message ordering. However, convergence is not the same as undo. A CRDT merge doesn’t track “who did what” — it merges concurrent operations into a single resolved state. This means there’s no built-in way to say “undo Alice’s last change without undoing Bob’s.”"]}),e.jsx("h3",{id:"lww-undo",children:"Lightweight undo with LWW fields"}),e.jsx("p",{children:"For LWW fields you can implement a local undo stack: before each mutation, snapshot the current field value per-client and push it onto a stack. On undo, pop the stack and write the previous value as a new LWW operation."}),e.jsxs("p",{children:[e.jsx("strong",{children:"Caveat:"})," this “undo” is really “set to previous value.” If Bob changed the field between your edit and your undo, your undo overwrites Bob’s change (last-writer-wins)."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Note:"})," Undo for ",e.jsx("code",{children:"pn-counter"})," and"," ",e.jsx("code",{children:"or-set"})," is not covered here — those CRDTs would require computing inverse operations (e.g. decrement to undo an increment, re-add to undo a remove), which is application-specific."]}),e.jsx(u,{title:"Wrapping useSyncedValue with an undo stack",code:`import { useCallback, useRef } from 'react'
import { defineSyncedValue } from '@realtimejs/core'
import { useSyncedValue } from '@realtimejs/react'

const docTitle = defineSyncedValue<string>({
  id: 'doc-title',
  channel: (params: { docId: string }) => ['doc:title', params],
})

function EditableTitle({ docId }: { docId: string }) {
  const { value, set } = useSyncedValue(docTitle, {
    params: { docId },
    initial: 'Untitled',
  })

  const undoStack = useRef<Array<string>>([])
  const redoStack = useRef<Array<string>>([])

  const editTitle = useCallback(
    (newTitle: string) => {
      undoStack.current.push(value)
      redoStack.current = [] // clear redo on new edit
      set(newTitle)
    },
    [value, set],
  )

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (prev === undefined) return
    redoStack.current.push(value)
    // This is a NEW LWW write — if Bob edited in between,
    // your undo will overwrite his change (last-writer-wins).
    set(prev)
  }, [value, set])

  const redo = useCallback(() => {
    const next = redoStack.current.pop()
    if (next === undefined) return
    undoStack.current.push(value)
    set(next)
  }, [value, set])

  return (
    <div>
      <input value={value} onChange={(e) => editTitle(e.target.value)} />
      <button onClick={undo} disabled={undoStack.current.length === 0}>
        Undo
      </button>
      <button onClick={redo} disabled={redoStack.current.length === 0}>
        Redo
      </button>
    </div>
  )
}`}),e.jsx("h3",{id:"rich-text-undo",children:"Rich text: use Y.js UndoManager"}),e.jsx("p",{children:"For character-level collaborative text editing, realtime.js’s field-level CRDTs aren’t the right tool. They operate on whole-field granularity (replacing the entire value), not individual characters or ranges."}),e.jsxs("p",{children:["Use a dedicated rich-text CRDT library such as ",e.jsx("strong",{children:"Y.js"})," or"," ",e.jsx("strong",{children:"Automerge"}),", both of which provide a built-in"," ",e.jsx("code",{children:"UndoManager"})," that tracks operations per-client and can reverse them without affecting other users’ concurrent edits."]}),e.jsxs("p",{children:["See the ",e.jsx("a",{href:"#/docs/rich-text-crdts",children:"Rich Text (Y.js) guide"})," for a full walkthrough."]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Summary:"})," Field-level CRDTs are designed for structured data (forms, settings, counters, tag sets). For rich text collaboration with proper undo, pair realtime.js as the transport with Y.js as the CRDT engine."]})}),e.jsx("h2",{id:"merge-diagram",children:"How field-level merge works"}),e.jsxs("p",{children:["Each field resolves independently based on its CRDT type. Concurrent edits to ",e.jsx("em",{children:"different"})," fields never conflict. Concurrent edits to the ",e.jsx("em",{children:"same"})," field merge according to the field’s strategy:"]}),e.jsx(u,{code:`// Two clients edit the same todo concurrently:
//
//   Client A                          Client B
//   ────────                          ────────
//   title = "Buy milk"  (lww)         votes = increment()  (pn-counter)
//   tags  = add("urgent") (or-set)    tags  = add("shop")  (or-set)
//
// Merged result:
// ┌─────────┬───────────────────┬──────────────────────────────┐
// │  Field  │  CRDT type        │  Merged value                │
// ├─────────┼───────────────────┼──────────────────────────────┤
// │  title  │  lww              │  "Buy milk" (latest wins)    │
// │  votes  │  pn-counter       │  +1 (increments add up)      │
// │  tags   │  or-set           │  {"urgent","shop"} (union)   │
// └─────────┴───────────────────┴──────────────────────────────┘
//
// Key insight: each field is an independent CRDT.
// Editing "title" on Client A never conflicts with
// incrementing "votes" on Client B.`})]})}const Er=["#38bdf8","#c084fc","#f472b6","#22c55e"],Kh=["Alice","Bob","Charlie","Dana"];function jj(){const c=G.useRef(null),[h,p]=G.useState([{id:"1",name:"Alice",color:Er[0],cursor:null},{id:"2",name:"Bob",color:Er[1],cursor:{x:120,y:80}}]),[d,v]=G.useState(["1","2"]);G.useEffect(()=>{const S=setInterval(()=>{p(g=>g.map(f=>{if(f.id!=="2"||!d.includes("2"))return f;const A=c.current;if(!A)return f;const T=A.offsetWidth-10,Q=A.offsetHeight-10,B=f.cursor?.x??T/2,C=f.cursor?.y??Q/2;return{...f,cursor:{x:Math.max(10,Math.min(T,B+(Math.random()-.5)*40)),y:Math.max(10,Math.min(Q,C+(Math.random()-.5)*40))}}}))},600);return()=>clearInterval(S)},[d]);const I=S=>{const g=S.currentTarget.getBoundingClientRect(),f=S.clientX-g.left,A=S.clientY-g.top;p(T=>T.map(Q=>Q.id==="1"?{...Q,cursor:{x:f,y:A}}:Q))},y=S=>{const g=Kh.indexOf(S),f=String(g+1);d.includes(f)?(v(A=>A.filter(T=>T!==f)),p(A=>A.filter(T=>T.id!==f))):(v(A=>[...A,f]),p(A=>[...A,{id:f,name:S,color:Er[g],cursor:null}]))};return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"Live presence"}),e.jsx("p",{className:"demo-desc",children:"Move your mouse over the canvas to control Alice's cursor. Bob wanders on his own. Toggle users to simulate join/leave."}),e.jsx("div",{className:"demo-presence-controls",children:Kh.map((S,g)=>e.jsxs("button",{className:`demo-btn demo-btn-sm ${d.includes(String(g+1))?"demo-btn-active":""}`,style:d.includes(String(g+1))?{borderColor:Er[g],color:Er[g]}:{},onClick:()=>y(S),children:[S," ",d.includes(String(g+1))?"(online)":"(offline)"]},S))}),e.jsxs("div",{ref:c,className:"demo-presence-area",onMouseMove:I,children:[e.jsxs("div",{className:"demo-presence-label",children:[h.length," user",h.length!==1?"s":""," connected"]}),h.map(S=>S.cursor?e.jsxs("div",{className:"demo-cursor",style:{left:S.cursor.x,top:S.cursor.y,color:S.color},children:[e.jsx("svg",{width:"16",height:"20",viewBox:"0 0 16 20",fill:"currentColor",children:e.jsx("path",{d:"M0 0L16 12H6L3.5 20L0 0Z"})}),e.jsx("span",{className:"demo-cursor-label",style:{background:S.color},children:S.name})]},S.id):null)]}),e.jsx("div",{className:"demo-presence-avatars",children:h.map(S=>e.jsx("span",{className:"demo-avatar",style:{background:S.color},children:S.name[0]},S.id))})]})}function gj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Presence"}),e.jsxs("p",{className:"doc-lead",children:["Track who's connected and what they're doing. ",e.jsx("code",{children:"usePresence"})," ","joins on mount, leaves on unmount, and returns a reactive list of every other connected user."]}),e.jsx("h2",{id:"try-it",children:"Try it"}),e.jsx(jj,{}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Presence needs a presence-capable transport."})," Joining, leaving, and tracking peers requires a bidirectional transport that reports ",e.jsx("code",{children:"capabilities.presence === true"})," — Centrifugo, Pusher, or PartyKit. The SSE adapter is receive-only and reports ",e.jsx("code",{children:"capabilities.presence === false"}),", so"," ",e.jsx("code",{children:"usePresence"})," throws against it. Check"," ",e.jsx("code",{children:"client.capabilities.presence"})," before rendering presence UI, or pick a presence-capable adapter. See the"," ",e.jsx("a",{href:"#/docs/transports",children:"Transports guide"})," for the capability matrix."]})}),e.jsx("h2",{id:"define-channel",children:"Define a presence channel"}),e.jsx(u,{title:"presence/channel.ts",code:`import { createPresenceChannel } from '@realtimejs/core'

export const docPresence = createPresenceChannel({
  id: 'doc-presence',
  channel: (params: { docId: string }) => ['doc:presence', params],
})`}),e.jsx("h2",{id:"use-presence",children:"Use in a component"}),e.jsx(u,{title:"presence/DocumentPage.tsx",code:`import { usePresence } from '@realtimejs/react'
import { docPresence } from './channel'

function DocumentPage({ docId }: { docId: string }) {
  const { others, updatePresence } = usePresence(docPresence, {
    params: { docId },
    initial: { name: user.name, color: user.color, cursor: null },
  })

  return (
    <div
      onMouseMove={(e) =>
        updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
      }
    >
      {/* Who's here */}
      <div className="avatar-row">
        {others.map((u) => (
          <Avatar key={u.connectionId} name={u.data.name} color={u.data.color} />
        ))}
      </div>

      {/* Where they are */}
      {others
        .filter((u) => u.data.cursor)
        .map((u) => (
          <RemoteCursor
            key={u.connectionId}
            x={u.data.cursor.x}
            y={u.data.cursor.y}
            name={u.data.name}
            color={u.data.color}
          />
        ))}
    </div>
  )
}`}),e.jsx("h2",{id:"how-it-works",children:"How it works"}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("code",{children:"usePresence"})," subscribes to the channel, calls"," ",e.jsx("code",{children:"client.joinPresence(channel, initial)"})," on mount, and calls"," ",e.jsx("code",{children:"client.leavePresence(channel)"})," on unmount. The"," ",e.jsx("code",{children:"others"})," array is reactive — it updates when any peer joins, updates their data, or disconnects. The current user is always excluded. ",e.jsx("code",{children:"updatePresence(delta)"})," merges partial data, so a cursor update doesn't overwrite the user's name."]})}),e.jsx("h2",{id:"two-apis",children:"Two presence APIs"}),e.jsxs("p",{children:["There are two ways to consume presence, and they use"," ",e.jsx("strong",{children:"different shapes"})," — don’t mix them up:"]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:e.jsxs("code",{children:["usePresence(def, ","{ params, initial }",")"]})})," ","(the hook API, shown above) — pair with a"," ",e.jsx("code",{children:"createPresenceChannel"})," definition. Each peer is a"," ",e.jsx("code",{children:"PresenceUser"})," with ",e.jsx("code",{children:"connectionId"})," and"," ",e.jsx("code",{children:"data"})," fields (",e.jsx("code",{children:"u.connectionId"}),","," ",e.jsx("code",{children:"u.data.name"}),"). This is the right choice for almost all UI."]}),e.jsxs("li",{children:[e.jsx("strong",{children:e.jsxs("code",{children:["presenceChannelOptions(","{ client, channel }",")"]})})," ","(the TanStack DB collection API) — wrap it in"," ",e.jsx("code",{children:"createCollection"})," to query the live presence set with"," ",e.jsx("code",{children:"useLiveQuery"})," (sorting, joining, filtering). Rows are the same ",e.jsx("code",{children:"PresenceUser"})," shape, keyed by"," ",e.jsx("code",{children:"connectionId"}),". It only ",e.jsx("em",{children:"observes"})," presence — call ",e.jsx("code",{children:"usePresence"})," (or ",e.jsx("code",{children:"client.joinPresence"}),") separately to announce the current user."]})]}),e.jsx(u,{title:"presence/viewers.ts — DB-collection variant",code:`import { createCollection } from '@tanstack/db'
import { presenceChannelOptions } from '@realtimejs/core'
import { realtimeClient } from '../client/realtime'

// Observe who is viewing a document as a queryable collection.
export const viewersCollection = (docId: string) =>
  createCollection(
    presenceChannelOptions<{ name: string; avatar: string }>({
      client: realtimeClient,
      channel: ['doc:presence', { docId }],
      id: \`viewers-\${docId}\`,
    }),
  )

// In a component — the current user still announces via usePresence,
// and you query the collection for the live "others" list:
//   const viewers = useLiveQuery((q) => q.from({ v: viewersCollection(docId) }))
//   viewers.map((u) => u.connectionId)  // keyed by connectionId, not clientId`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsxs("strong",{children:["It’s ",e.jsx("code",{children:"connectionId"}),", not ",e.jsx("code",{children:"clientId"}),"."]})," ","Both APIs key peers by ",e.jsx("code",{children:"connectionId"})," and expose user data under ",e.jsx("code",{children:".data"}),". There is no ",e.jsx("code",{children:"user.clientId"})," on a"," ",e.jsx("code",{children:"PresenceUser"}),"."]})}),e.jsx("h2",{id:"contextual-presence",children:"Contextual presence"}),e.jsxs("p",{children:["Scope presence to a specific entity — a spreadsheet cell, a document paragraph, or a kanban card — so users see"," ",e.jsx("em",{children:"who is editing what"}),", not just who is online."]}),e.jsx(u,{title:"features/spreadsheet/CellPresence.tsx",code:`import { usePresence } from '@realtimejs/react'
import { createPresenceChannel } from '@realtimejs/core'
import { useState } from 'react'

// One presence channel per cell -- join when focused, leave on blur.
const cellPresence = createPresenceChannel({
  id: 'cell-presence',
  channel: (params: { sheetId: string; cellId: string }) =>
    ['sheet:cell', params],
})

// Inner component -- always calls usePresence (Rules of Hooks safe).
function CellEditor({ sheetId, cellId, onBlur }: {
  sheetId: string
  cellId: string
  onBlur: () => void
}) {
  const { others } = usePresence(cellPresence, {
    params: { sheetId, cellId },
    initial: { name: currentUser.name, color: currentUser.color },
  })

  return (
    <>
      {others.map((u) => (
        <span key={u.connectionId} className="cell-editor-badge"
              style={{ background: u.data.color }}>
          {u.data.name}
        </span>
      ))}
    </>
  )
}

function Cell({ sheetId, cellId }: { sheetId: string; cellId: string }) {
  const [focused, setFocused] = useState(false)

  return (
    <td
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* Mount CellEditor only when focused -- usePresence joins/leaves cleanly */}
      {focused && <CellEditor sheetId={sheetId} cellId={cellId} onBlur={() => setFocused(false)} />}
    </td>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsx("p",{children:"Keep contextual presence channels short-lived. Join when the user focuses the entity, leave on blur. This avoids accumulating hundreds of idle presence subscriptions across a large document."})}),e.jsx("h2",{id:"throttling",children:"Throttling high-frequency updates"}),e.jsxs("p",{children:["Cursor positions change dozens of times per second. Without throttling, each ",e.jsx("code",{children:"mousemove"})," triggers a publish — flooding the server and peers. Use the built-in ",e.jsx("code",{children:"throttle"})," utility to cap the update rate."]}),e.jsx(u,{title:"features/Canvas.tsx",code:`import { throttle } from '@realtimejs/core'
import { usePresence } from '@realtimejs/react'
import { useMemo, useCallback } from 'react'

function Canvas({ docId }: { docId: string }) {
  const { updatePresence } = usePresence(docPresence, {
    params: { docId },
    initial: { name: user.name, cursor: null },
  })

  // Cap updates to ~30 per second (33 ms interval).
  const throttledUpdate = useMemo(
    () =>
      throttle(
        (cursor: { x: number; y: number }) => {
          updatePresence({ cursor })
        },
        { interval: 33 },
      ),
    [updatePresence],
  )

  // Read currentTarget eagerly -- before the throttled callback fires.
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      throttledUpdate({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    },
    [throttledUpdate],
  )

  return <div onMouseMove={onMouseMove} onMouseLeave={() => updatePresence({ cursor: null })} />
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Rule of thumb:"})," 30–60 updates/second is enough for smooth cursors. For slower-moving data like scroll position, 5–10 updates/second is sufficient. The ",e.jsx("code",{children:"throttle"})," ","utility uses a trailing-edge strategy, so the final position is always sent."]})}),e.jsx("h2",{id:"see-also",children:"See also"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/ephemeral",children:"Ephemeral Channels"})," — cursor sharing recipe using ephemeral events instead of presence"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/channels",children:"Channels & Pub/Sub"})," — raw subscribe/publish for one-way cursor broadcasts"]})]})]})}function yj(){const[c,h]=G.useState([]),[p,d]=G.useState(""),[v,I]=G.useState(""),y=G.useRef(null);G.useEffect(()=>{y.current&&(y.current.scrollTop=y.current.scrollHeight)},[c.length]);const S=(A,T)=>{T.trim()&&h(Q=>[...Q,{id:crypto.randomUUID(),from:A,text:T.trim(),ts:Date.now()}])},g=()=>{S("A",p),d("")},f=()=>{S("B",v),I("")};return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"Pub/Sub channel"}),e.jsx("p",{className:"demo-desc",children:"Two clients publish messages to the same channel. Both see every message in real time. Type in either input and press Enter."}),e.jsxs("div",{ref:y,className:"demo-chat-feed",children:[c.length===0&&e.jsx("div",{className:"demo-chat-empty",children:"No messages yet. Send one from Client A or B."}),c.map(A=>e.jsxs("div",{className:`demo-chat-msg demo-chat-${A.from.toLowerCase()}`,children:[e.jsx("span",{className:`demo-dot demo-dot-${A.from.toLowerCase()}`}),e.jsxs("strong",{children:["Client ",A.from]}),": ",A.text]},A.id))]}),e.jsxs("div",{className:"demo-clients",children:[e.jsxs("div",{className:"demo-client demo-client-a",children:[e.jsxs("div",{className:"demo-client-hdr",children:[e.jsx("span",{className:"demo-dot demo-dot-a"})," Client A"]}),e.jsxs("div",{className:"demo-chat-input-row",children:[e.jsx("input",{className:"demo-input",value:p,placeholder:"Type a message...",onChange:A=>d(A.target.value),onKeyDown:A=>A.key==="Enter"&&g()}),e.jsx("button",{className:"demo-btn demo-btn-primary",onClick:g,children:"Send"})]})]}),e.jsxs("div",{className:"demo-client demo-client-b",children:[e.jsxs("div",{className:"demo-client-hdr",children:[e.jsx("span",{className:"demo-dot demo-dot-b"})," Client B"]}),e.jsxs("div",{className:"demo-chat-input-row",children:[e.jsx("input",{className:"demo-input",value:v,placeholder:"Type a message...",onChange:A=>I(A.target.value),onKeyDown:A=>A.key==="Enter"&&f()}),e.jsx("button",{className:"demo-btn demo-btn-primary",onClick:f,children:"Send"})]})]})]})]})}function bj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Channels & Pub/Sub"}),e.jsx("p",{className:"doc-lead",children:"Not every piece of realtime data is a database row. Channels give you raw pub/sub messaging, append-only event streams, and ephemeral data like typing indicators."}),e.jsx("h2",{id:"try-it",children:"Try it"}),e.jsx(yj,{}),e.jsx("h2",{id:"use-subscribe",children:"useSubscribe — raw channel events"}),e.jsx(u,{title:"features/chat/TypingIndicator.tsx",code:`import { useState } from 'react'
import { useSubscribe } from '@realtimejs/react'

function TypingIndicator({ roomId }: { roomId: string }) {
  const [typing, setTyping] = useState<string[]>([])

  useSubscribe(['chat:typing', { roomId }], (event) => {
    setTyping((event as { users: string[] }).users)
  })

  return typing.length > 0
    ? <span>{typing.join(', ')} typing...</span>
    : null
}`}),e.jsx("h2",{id:"use-publish",children:"usePublish — publish to a channel"}),e.jsx(u,{title:"features/chat/TypingBroadcast.tsx",code:`import { usePublish } from '@realtimejs/react'

function TypingBroadcast({ roomId }: { roomId: string }) {
  const publish = usePublish(['chat:typing', { roomId }])

  return (
    <input
      onFocus={() => publish({ users: [currentUser.id] })}
      onBlur={() => publish({ users: [] })}
    />
  )
}`}),e.jsx("h2",{id:"use-channel",children:"useChannel — subscribe + publish"}),e.jsx(u,{title:"features/chat/ChatRoom.tsx",code:`import { useState } from 'react'
import { useChannel } from '@realtimejs/react'

function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const { publish } = useChannel(
    ['chat', { roomId }],
    (raw) => setMessages((prev) => [...prev, raw as Message]),
  )

  return (
    <>
      {messages.map((m) => <p key={m.id}>{m.text}</p>)}
      <button onClick={() =>
        publish({ id: crypto.randomUUID(), text: 'Hi!' })
      }>
        Send
      </button>
    </>
  )
}`}),e.jsx("h2",{id:"live-channels",children:"Live event channels"}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"liveChannelOptions"})," for append-only streams like chat, audit logs, or game events. Unlike"," ",e.jsx("code",{children:"realtimeCollectionOptions"}),", there is no"," ",e.jsx("code",{children:"onUpdate"})," or ",e.jsx("code",{children:"onDelete"}),"."]}),e.jsx(u,{title:"features/chat/collection.ts",code:`import { liveChannelOptions } from '@realtimejs/core'

const chatOptions = (roomId: string) =>
  liveChannelOptions<Message, string>({
    client: realtimeClient,
    channel: ['chat', { roomId }],
    getKey: (m) => m.id,

    initialData: () =>
      fetch(\`/api/rooms/\${roomId}/messages?limit=50\`).then(r => r.json()),

    onEvent: (raw) => {
      const e = raw as { type: string; message: Message }
      return e.type === 'message' ? e.message : null
    },
  })`}),e.jsx("h2",{id:"use-live-channel",children:"useLiveChannel — managed collection hook"}),e.jsxs("p",{children:[e.jsx("code",{children:"useLiveChannel"})," is a React hook that creates and manages the lifecycle of an append-only live-channel collection. It wraps"," ",e.jsx("code",{children:"liveChannelOptions"})," and handles collection creation, cleanup on unmount, and automatically sources the realtime client from"," ",e.jsx("code",{children:"<RealtimeProvider>"}),"."]}),e.jsx(u,{title:"features/chat/ChatRoom.tsx",code:`import { useLiveChannel } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

interface ChatMessage {
  id: string
  text: string
  userId: string
  timestamp: number
}

function ChatRoom({ roomId }: { roomId: string }) {
  const messages = useLiveChannel<ChatMessage>({
    id: \`chat-\${roomId}\`,
    channel: ['chat', { roomId }],
    getKey: (m) => m.id,

    initialData: () =>
      fetch(\`/api/rooms/\${roomId}/messages?limit=50\`).then(r => r.json()),

    onEvent: (raw) => {
      const e = raw as { type: string; message: ChatMessage }
      return e.type === 'message' ? e.message : null
    },
  })

  const { data } = useLiveQuery((q) =>
    q.from({ messages }).orderBy(({ messages }) => messages.timestamp)
  )

  return <div>{data.map((m) => <p key={m.id}>{m.text}</p>)}</div>
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["The returned ",e.jsx("code",{children:"Collection"})," object is ",e.jsx("strong",{children:"stable"})," ","across renders. Pass it to ",e.jsx("code",{children:"useLiveQuery"})," or"," ",e.jsx("code",{children:"useLiveSuspenseQuery"})," from ",e.jsx("code",{children:"@tanstack/react-db"})," ","to query the data reactively. The collection is cleaned up automatically when the component unmounts."]})}),e.jsx("h2",{id:"validated-publish",children:"createValidatedPublish — server-side validation"}),e.jsxs("p",{children:[e.jsx("code",{children:"createValidatedPublish"})," wraps a ",e.jsx("code",{children:"PublishFn"})," with server-side validation. Before every publish, the validate function runs to check and optionally transform the payload. On validation failure, a"," ",e.jsx("code",{children:"PublishValidationError"})," is thrown."]}),e.jsx(u,{title:"server/realtime.ts",code:`import { createValidatedPublish } from '@realtimejs/core'
import { realtime } from './realtime'
import { todoSchema } from '../shared/schemas'

// \`realtime.publish\` is the transport-agnostic PublishFn from
// createStartHandler — see TanStack Start + Drizzle for the composition.
const validatedPublish = createValidatedPublish({
  publish: realtime.publish,

  validate: async ({ channel, data }) => {
    if (channel.namespace === 'todos') {
      const result = todoSchema.safeParse(data)
      if (!result.success) {
        return { accepted: false, reason: result.error.message }
      }
      return { accepted: true, data: result.data }
    }
    return { accepted: true }
  },
})`}),e.jsx("p",{children:"Use the validated publish function in your server functions or API routes. The validation runs synchronously within the function’s lifecycle — no persistent server process required."}),e.jsx(u,{title:"server/functions/todos.ts",code:`import { createServerFn } from '@tanstack/start'
import { validatedPublish } from '../realtime'

export const updateTodo = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: { id: string; projectId: string; title: string } }) => {
    const updated = await db.todos.update(data.id, data)

    // Publishes only if validation passes.
    // Throws PublishValidationError on rejection.
    await validatedPublish(['todos', { projectId: data.projectId }], {
      action: 'update',
      data: updated,
    })

    return updated
  },
)`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["The validate function receives the parsed channel (with"," ",e.jsx("code",{children:"namespace"})," and ",e.jsx("code",{children:"params"}),"), the raw channel string, and the data payload. Return"," ",e.jsxs("code",{children:["{","accepted: true, data: transformed","}"]})," ","to modify the payload before it reaches subscribers."]})}),e.jsx("h2",{id:"when-to-use",children:"liveChannelOptions vs realtimeCollectionOptions"}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["Use ",e.jsx("code",{children:"realtimeCollectionOptions"})," when your data lives in a database and has full CRUD semantics. Use"," ",e.jsx("code",{children:"liveChannelOptions"})," when events only ever append — chat, audit logs, game events. The key difference:"," ",e.jsx("code",{children:"liveChannelOptions"})," has no ",e.jsx("code",{children:"onUpdate"})," or"," ",e.jsx("code",{children:"onDelete"}),", and its ",e.jsx("code",{children:"onEvent"})," callback decides which events to keep."]})}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Tracking who is connected?"})," Pub/sub channels are fire-and-forget — they don’t track membership. For online users, shared cursors, and typing presence use"," ",e.jsx("a",{href:"#/docs/presence",children:e.jsx("code",{children:"usePresence"})})," ","instead, which needs a presence-capable transport (Centrifugo, Pusher, PartyKit). Raw ",e.jsx("code",{children:"useSubscribe"}),"/",e.jsx("code",{children:"usePublish"})," work on any transport, including receive-only SSE."]})}),e.jsx("h2",{id:"recipes",children:"Recipes"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/presence",children:"Presence"})," — online users, shared cursors, and typing indicators on a presence-capable transport"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/read-receipts",children:"Read Receipts"})," — track which messages each user has seen using a per-user high-water mark"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/ephemeral",children:"Emoji Reactions"})," — ephemeral flying-emoji animations paired with persistent PN-Counter totals"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/ephemeral#toast-notifications",children:"Toast Notifications"})," ","— fire-and-forget server alerts via ",e.jsx("code",{children:"useSubscribe"})]})]})]})}const Wh="realtime.js is a transport layer that adds live updates to your existing application. It plugs into whatever server and database you already have — no migration required. Start with a queryFn, add a channel to go live, and layer on CRDTs when you need conflict-free concurrent editing.";function vj(){const[c,h]=G.useState("idle"),[p,d]=G.useState(""),[v,I]=G.useState(""),y=G.useRef(null),S=G.useRef(0),g=()=>{h("pending"),d(""),I(""),S.current=0,setTimeout(()=>{h("streaming");const A=Wh.split(" ");y.current=setInterval(()=>{if(S.current>=A.length){y.current&&clearInterval(y.current),h("done");return}const T=A[S.current];S.current++,d(Q=>Q?Q+" "+T:T)},60)},800)},f=()=>{h("pending"),d(""),I(""),S.current=0,setTimeout(()=>{h("streaming");const A=Wh.split(" ").slice(0,8);y.current=setInterval(()=>{if(S.current>=A.length){y.current&&clearInterval(y.current),h("error"),I("Connection lost: upstream timeout");return}const T=A[S.current];S.current++,d(Q=>Q?Q+" "+T:T)},60)},800)};return G.useEffect(()=>()=>{y.current&&clearInterval(y.current)},[]),e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"AI token streaming"}),e.jsxs("p",{className:"demo-desc",children:["Simulates a server-initiated stream with status tracking:"," ",e.jsx("code",{children:"pending"})," → ",e.jsx("code",{children:"streaming"})," →"," ",e.jsx("code",{children:"done"})," (or ",e.jsx("code",{children:"error"}),"). Each token event is folded into state via a ",e.jsx("code",{children:"reduce"})," function."]}),e.jsxs("div",{className:"demo-stream-output",children:[c==="idle"&&e.jsx("span",{className:"demo-stream-placeholder",children:'Click "Ask AI" to start a stream...'}),c==="pending"&&e.jsx("span",{className:"demo-stream-thinking",children:"Thinking..."}),(c==="streaming"||c==="done"||c==="error")&&e.jsxs("span",{children:[p,c==="streaming"&&e.jsx("span",{className:"demo-stream-cursor",children:"|"})]}),c==="error"&&e.jsx("div",{className:"demo-stream-error-msg",children:v})]}),e.jsxs("div",{className:"demo-stream-status",children:["Status:"," ",e.jsx("span",{className:`demo-stream-badge demo-stream-${c}`,children:c})]}),e.jsxs("div",{className:"demo-actions",children:[e.jsx("button",{className:"demo-btn demo-btn-primary",onClick:g,disabled:c==="pending"||c==="streaming",children:"Ask AI"}),e.jsx("button",{className:"demo-btn demo-btn-red",onClick:f,disabled:c==="pending"||c==="streaming",children:"Simulate error"})]})]})}function Sj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Streaming"}),e.jsxs("p",{className:"doc-lead",children:["AI token streams, live metrics, and progress bars aren't collections of rows. They're a sequence of events folded into a single piece of state."," ",e.jsx("code",{children:"streamChannelOptions"})," with a ",e.jsx("code",{children:"reduce"})," function handles this pattern."]}),e.jsx("h2",{id:"try-it",children:"Try it"}),e.jsx(vj,{}),e.jsx("h2",{id:"define-stream",children:"Define a stream channel"}),e.jsx(u,{title:"features/ai/stream.ts",code:`import { createStreamChannel, serverStreamCallbacks } from '@realtimejs/core'

export const aiResponseStream = createStreamChannel({
  id: 'ai-response',
  channel: (params: { requestId: string }) => ['ai', params],

  initial: { content: '' },

  reduce: (state, event: { type: string; token?: string }) =>
    event.type === 'token'
      ? { content: state.content + (event.token ?? '') }
      : state,

  ...serverStreamCallbacks,
})`}),e.jsx("h2",{id:"consume-stream",children:"Consume in React"}),e.jsx(u,{title:"features/ai/AIResponse.tsx",code:`import { useStream } from '@realtimejs/react'
import { aiResponseStream } from './stream'

function AIResponse({ requestId }: { requestId: string }) {
  const { state, status, error } = useStream(aiResponseStream, {
    params: { requestId },
  })

  if (status === 'pending')  return <span>Thinking...</span>
  if (status === 'error')    return <span>Error: {error}</span>

  return (
    <p>
      {state.content}
      {status === 'streaming' && <span className="cursor">|</span>}
    </p>
  )
}`}),e.jsx("h2",{id:"server-side",children:"Server-side streaming"}),e.jsxs("p",{children:["On the server, push events onto the channel the client subscribes to. The TanStack Start preset exposes ",e.jsx("code",{children:"realtime.createStream()"})," ","(from ",e.jsx("code",{children:"createStartHandler"}),") which wraps"," ",e.jsx("code",{children:"createServerStream"})," and uses the handler’s"," ",e.jsx("code",{children:"publish"})," — so the same call works across multiple server processes when a ",e.jsx("code",{children:"PublishBackend"})," is configured. See"," ",e.jsx("a",{href:"#/docs/server-functions",children:"TanStack Start + Drizzle"})," for the"," ",e.jsx("code",{children:"realtime"})," composition."]}),e.jsx(u,{title:"app/server/functions/chat.ts",code:`import { createServerFn } from '@tanstack/start'
import { realtime } from '../realtime'

export const askAI = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: { requestId: string; prompt: string } }) => {
    const stream = realtime.createStream({
      channel: ['ai', { requestId: data.requestId }],
    })

    try {
      for await (const chunk of openai.stream(data.prompt)) {
        await stream.push({ type: 'token', token: chunk.text })
      }
      await stream.done()
    } catch (err) {
      await stream.error(String(err))
    }
  },
)`}),e.jsxs("p",{children:["Outside TanStack Start, build the stream directly with"," ",e.jsx("code",{children:"createServerStream"})," from ",e.jsx("code",{children:"@realtimejs/core"})," and pass any ",e.jsx("code",{children:"PublishFn"})," — for the SSE adapter that is"," ",e.jsx("code",{children:"sseHandler.broadcast"}),". This variant also takes an optional"," ",e.jsx("code",{children:"hmacKey"})," and server-side ",e.jsx("code",{children:"checkpoint"})," config:"]}),e.jsx(u,{title:"server/routes/chat.ts",code:`import { createServerStream } from '@realtimejs/core'
import { sseHandler } from '../realtime'

app.post('/api/chat', async (req) => {
  const { requestId, prompt } = req.body

  const stream = createServerStream({
    publish: (ch, data) => { sseHandler.broadcast(ch as string, data); return Promise.resolve() },
    channel: ['ai', { requestId }],
    hmacKey: process.env.STREAM_HMAC_KEY,
    checkpoint: {
      channelDef: aiResponseStream,
      interval: { time: 10_000 },
      handler: async (cp) => {
        await db.aiResponses.upsert({
          id: requestId,
          content: cp.state.content,
        })
      },
    },
  })

  try {
    for await (const chunk of openai.stream(prompt)) {
      await stream.push({ type: 'token', token: chunk.text })
    }
    await stream.done()
  } catch (err) {
    await stream.error(String(err))
  }
})`}),e.jsxs("h2",{id:"stale-after",children:["Stale detection with ",e.jsx("code",{children:"staleAfter"})]}),e.jsxs("p",{children:["Long-running streams can silently stall — the producer crashes, the network drops, or an upstream service times out. The"," ",e.jsx("code",{children:"staleAfter"})," option adds a silence timer: if no events (including heartbeats) arrive within the configured window, the stream status transitions to ",e.jsx("code",{children:"'stale'"}),"."]}),e.jsx(u,{title:"features/ai/stream.ts",code:`import { createStreamChannel, serverStreamCallbacks } from '@realtimejs/core'

export const aiResponseStream = createStreamChannel({
  id: 'ai-response',
  channel: (params: { requestId: string }) => ['ai', params],

  initial: { content: '' },

  reduce: (state, event: { type: string; token?: string }) =>
    event.type === 'token'
      ? { content: state.content + (event.token ?? '') }
      : state,

  ...serverStreamCallbacks,

  // If no event arrives for 15 seconds, mark the stream as stale.
  // Choose a value 2-3x the server's heartbeat interval.
  staleAfter: 15_000,
})`}),e.jsxs("p",{children:["In your component, check for the ",e.jsx("code",{children:"'stale'"})," status alongside the other lifecycle states:"]}),e.jsx(u,{title:"features/ai/AIResponse.tsx",code:`import { useStream } from '@realtimejs/react'
import { aiResponseStream } from './stream'

function AIResponse({ requestId }: { requestId: string }) {
  const { state, status, error } = useStream(aiResponseStream, {
    params: { requestId },
  })

  if (status === 'pending')   return <span>Thinking...</span>
  if (status === 'error')     return <span>Error: {error}</span>
  if (status === 'stale')     return <span>Stream may have disconnected...</span>

  return (
    <p>
      {state.content}
      {status === 'streaming' && <span className="cursor">|</span>}
    </p>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["Stale is a ",e.jsx("strong",{children:"soft failure"}),". The stream is not stopped, just flagged. If a new event arrives while stale, status reverts to"," ",e.jsx("code",{children:"'streaming'"})," automatically. You can also override ",e.jsx("code",{children:"staleAfter"})," per-hook instance via the"," ",e.jsx("code",{children:"useStream"})," options."]})}),e.jsx("h2",{id:"other-uses",children:"Beyond AI"}),e.jsxs("p",{children:[e.jsx("code",{children:"streamChannelOptions"})," works for any accumulated stream. Here's a live server metrics gauge:"]}),e.jsx(u,{code:`const cpuStream = createStreamChannel({
  id: 'cpu-metrics',
  channel: (params: { serverId: string }) => ['metrics:cpu', params],

  initial: { pct: 0, samples: [] as number[] },

  reduce: (state, event: { pct: number }) => ({
    pct: event.pct,
    samples: [...state.samples.slice(-60), event.pct],
  }),
  // Open-ended — no isDone, stream runs until unmount
})`}),e.jsx("h2",{id:"checkpoint-persistence",children:"Server-side checkpoint persistence"}),e.jsx("p",{children:"For long-running streams (AI responses, ETL pipelines), persist checkpoints so clients can resume after a page reload or reconnection without replaying the entire stream from the beginning."}),e.jsx(u,{title:"server/routes/ai-stream.ts",code:`import { createServerStream } from '@realtimejs/core'
import { sseHandler } from '../realtime'
import { db } from '../db'

const stream = createServerStream({
  publish: (ch, data) => { sseHandler.broadcast(ch as string, data); return Promise.resolve() },
  channel: ['ai', { requestId }],
  // Persist checkpoint to database after every N events
  checkpoint: {
    channelDef: aiResponseStream,
    interval: { events: 50 },
    handler: async (cp) => {
      await db.streamCheckpoints.upsert({
        where: { streamId: requestId },
        update: { checkpoint: JSON.stringify(cp), updatedAt: new Date() },
        create: { streamId: requestId, checkpoint: JSON.stringify(cp) },
      })
    },
  },
})`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Checkpoint granularity."})," Checkpointing every event adds database writes. For AI token streams, checkpoint every 50-100 tokens or every 2-3 seconds. The ",e.jsx("code",{children:"checkpoint.interval"})," ","option controls this: ",e.jsx("code",{children:"interval: { events: 50 }"})," ","checkpoints every 50th event."]})}),e.jsx("h2",{id:"see-also",children:"See also"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/channels",children:"Channels & Pub/Sub"})," — the raw"," ",e.jsx("code",{children:"subscribe"}),"/",e.jsx("code",{children:"publish"})," layer streams are built on"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/server-functions",children:"TanStack Start + Drizzle"})," — the ",e.jsx("code",{children:"realtime.createStream()"})," composition and server wiring"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/server-hooks",children:"Server Lifecycle Hooks"})," —"," ",e.jsx("code",{children:"onFirstSubscriber"})," / ",e.jsx("code",{children:"onChannelEmpty"})," for starting and stopping producers"]})]})]})}function Tj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Transports"}),e.jsx("p",{className:"doc-lead",children:"One API, any infrastructure. Swap transports without changing a line of application code."}),e.jsx("h2",{id:"which-transport",children:"Which transport should I use?"}),e.jsxs("p",{children:["Four transport adapters ship today. They make different trade-offs around direction, presence, gap recovery, and the infrastructure you run to fan messages out. The matrix below is filled directly from each adapter’s declared ",e.jsx("code",{children:"capabilities"})," — no aspirational cells."]}),e.jsxs("table",{className:"doc-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{scope:"col",children:"Capability / trait"}),e.jsx("th",{scope:"col",children:"SSE"}),e.jsx("th",{scope:"col",children:"Centrifugo"}),e.jsx("th",{scope:"col",children:"Pusher / Soketi"}),e.jsx("th",{scope:"col",children:"PartyKit"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Presence"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Yes"}),e.jsx("td",{children:"Yes (presence channels)"}),e.jsx("td",{children:"Yes (DO-held membership)"})]}),e.jsxs("tr",{children:[e.jsxs("td",{children:["Server‑assisted recovery",e.jsx("br",{}),"(gap replay)"]}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Yes (epoch / offset)"}),e.jsx("td",{children:"No (at‑most‑once)"}),e.jsx("td",{children:"No (at‑most‑once)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"History"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"No"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Ephemeral pub/sub"}),e.jsx("td",{children:"Yes"}),e.jsx("td",{children:"Yes"}),e.jsx("td",{children:"Yes"}),e.jsx("td",{children:"Yes"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Publish from client"}),e.jsxs("td",{children:["Via HTTP POST",e.jsx("br",{}),"(server endpoint)"]}),e.jsx("td",{children:"Yes (bidirectional)"}),e.jsxs("td",{children:["Private / presence",e.jsx("br",{}),"channels only"]}),e.jsx("td",{children:"Yes (bidirectional)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Infra model"}),e.jsxs("td",{children:["Serverless‑friendly HTTP",e.jsx("br",{}),"(any HTTP server)"]}),e.jsx("td",{children:"Self‑host WS server"}),e.jsxs("td",{children:["Managed SaaS",e.jsx("br",{}),"or self‑host Soketi"]}),e.jsx("td",{children:"Edge / Durable Objects"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Notable caveat"}),e.jsxs("td",{children:["In‑process fan‑out is dev / single‑node only; needs a ",e.jsx("code",{children:"PublishBackend"})," to scale"]}),e.jsx("td",{children:"Separate Centrifugo server to run"}),e.jsx("td",{children:"No replay; public‑channel fan‑out is server‑published"}),e.jsx("td",{children:"You deploy a PartyKit server"})]})]})]}),e.jsxs("p",{children:["Every cell above is asserted against the same declared capabilities the"," ",e.jsx("a",{href:"#capability-contract",children:"conformance kit"})," checks, so the matrix cannot drift from what the adapters actually do."]}),e.jsx("h2",{id:"architecture",children:"How realtime.js fits your architecture"}),e.jsx("p",{children:"Realtime delivery has two jobs, and they live in different tiers. Being explicit about this is what makes the “no presence on SSE” fact an architecture consequence rather than a bug."}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"The publish endpoint."})," In a serverless / edge deployment your functions are short‑lived — they cannot hold open sockets, so they act purely as the ",e.jsx("em",{children:"publish"})," point. A mutation handler writes to your database and emits a message; it does not keep a connection to every viewer."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"The fan‑out tier."})," Something durable has to hold the live connections and broadcast to them. That is either a provider (",e.jsx("strong",{children:"Centrifugo"}),", ",e.jsx("strong",{children:"Pusher/Soketi"}),","," ",e.jsx("strong",{children:"PartyKit"}),") or your own ",e.jsx("code",{children:"PublishBackend"})," ","(Redis pub/sub, Postgres ",e.jsx("code",{children:"LISTEN/NOTIFY"}),", or Cloudflare Durable Objects) sitting behind the SSE handler. The in‑process SSE handler that ships with the Start preset is a fan‑out tier too — an in‑memory one, which is why it is"," ",e.jsx("strong",{children:"dev / single‑node only"}),"."]})]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Why presence isn’t a property of the wire."})," ","Presence and typing indicators need"," ",e.jsx("em",{children:"server‑held membership state"})," — some component has to know who is currently joined to a channel and notify everyone when that set changes. A bare receive‑only SSE stream has nowhere to keep that state in a serverless model, so ",e.jsx("code",{children:"sseTransport"})," ","honestly reports ",e.jsx("code",{children:"presence: false"}),". Presence becomes available when a presence‑capable provider (Centrifugo, Pusher, PartyKit) or an external store holds the membership set — not by changing the wire protocol. See ",e.jsx("a",{href:"#/docs/presence",children:"Presence"})," ","and ",e.jsx("a",{href:"#/docs/scaling",children:"Scaling to Production"})," for the"," ",e.jsx("code",{children:"PublishBackend"})," interface."]}),e.jsx("h2",{id:"when-to-use-each",children:"When to use each"}),e.jsxs("p",{children:[e.jsx("strong",{children:"Serverless‑friendly → SSE"})," (plus a provider for presence). If you just need server→client live data, start with SSE: simplest setup, works behind every corporate proxy and CDN, runs on any HTTP server including edge runtimes and serverless functions. The TanStack Start preset (",e.jsx("code",{children:"@realtimejs/preset-start"}),") uses SSE under the hood. SSE is receive‑only and has no presence — if you need presence/typing, pair it with a presence‑capable provider below."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Want managed → Pusher."})," Use"," ",e.jsx("code",{children:"pusherTransport"})," when you want a hosted fan‑out tier with zero servers to operate. You get presence (via Pusher presence channels) and ephemeral pub/sub. There is no offset/epoch gap replay (delivery is at‑most‑once across disconnects), and client publish works only on private/presence channels — public‑channel fan‑out is server‑published via Pusher’s HTTP API."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Want self‑hosted WebSocket → Soketi or Centrifugo."})," ",e.jsx("code",{children:"pusherTransport"})," also points at a self‑hosted"," ",e.jsx("a",{href:"https://soketi.app",target:"_blank",rel:"noopener",children:"Soketi"})," ","server (Pusher‑protocol‑compatible). Choose"," ",e.jsx("strong",{children:"Centrifugo"})," when you additionally need"," ",e.jsx("em",{children:"server‑assisted gap recovery"}),": it is the only built‑in transport with epoch/offset replay, plus presence, multi‑node fan‑out, and token auth out of the box — no"," ",e.jsx("code",{children:"PublishBackend"})," wiring required."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Edge / Cloudflare → PartyKit."})," Use"," ",e.jsx("code",{children:"partykitTransport"})," when you deploy to the edge on PartyKit / Cloudflare Durable Objects. Presence works because the Durable Object holds connection membership server‑side. Like Pusher there is no gap replay (at‑most‑once); the adapter re‑asserts subscriptions and presence on every reconnect."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Already run your own WebSocket server?"})," Implement the"," ",e.jsx("code",{children:"RealtimeTransport"})," interface (and optionally"," ",e.jsx("code",{children:"PresenceCapable"}),") to plug it in. See the"," ",e.jsx("a",{href:"#capability-contract",children:"capability contract"})," below and the"," ",e.jsx("a",{href:"#/docs/wire-protocol",children:"Wire Protocol"})," page."]}),e.jsx("h2",{id:"centrifugo",children:"Centrifugo"}),e.jsx("p",{children:"Production WebSocket infrastructure with token auth and server-assisted gap recovery."}),e.jsx(u,{code:`import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'

const client = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'wss://rt.example.com/connection/websocket',
    token: getUserToken(),
  }),
})`}),e.jsx("h2",{id:"sse",children:"Server-Sent Events"}),e.jsx("p",{children:"For environments where WebSocket is unavailable. Works behind corporate proxies and CDNs."}),e.jsx(u,{code:`import { sseTransport } from '@realtimejs/adapter-sse'

const client = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime/events' }),
})`}),e.jsx("h2",{id:"pusher",children:"Pusher / Soketi"}),e.jsx("p",{children:"Managed fan-out via Pusher Channels, or self-hosted with the protocol-compatible Soketi server. Presence maps onto Pusher presence channels; client publish works on private/presence channels."}),e.jsx(u,{code:`import { pusherTransport } from '@realtimejs/adapter-pusher'

const client = createRealtimeClient({
  transport: pusherTransport({
    key: 'app-key',
    cluster: 'eu',
    // Presence/private channels require auth:
    authEndpoint: '/api/pusher/auth',
  }),
})`}),e.jsx("h2",{id:"partykit",children:"PartyKit / Durable Objects"}),e.jsx("p",{children:"Edge fan-out on PartyKit / Cloudflare Durable Objects. Presence works because the Durable Object holds connection membership server-side. No gap replay — subscriptions are re-asserted on reconnect."}),e.jsx(u,{code:`import { partykitTransport } from '@realtimejs/adapter-partykit'

const client = createRealtimeClient({
  transport: partykitTransport({
    host: 'my-app.username.partykit.dev',
    room: 'hub',
  }),
})`}),e.jsx("h2",{id:"tick",children:"Tick-based batching"}),e.jsx("p",{children:"High-frequency use cases — multiplayer games, collaborative drawing, live simulations. Registers hooks on any transport to batch state into one frame per tick interval."}),e.jsx(u,{title:"game/transport.ts",code:`import { useTickBatching } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = sseTransport({ url: '/api/realtime/sse' })
const tick = useTickBatching(transport, {
  tickMs: 16, deltaCompression: true,  // ~60 Hz
})

// Set state each frame — batched into one publish per tick
tick.setState('game:room-1', myPlayerId, {
  x: player.x,
  y: player.y,
  health: player.health,
})

// Receive batched frames from all players
tick.onTick('game:room-1', (frame) => {
  for (const [entityId, state] of Object.entries(frame.entities)) {
    updateEntity(entityId, state)
  }
  for (const entityId of frame.removed) {
    removeEntity(entityId)
  }
})`}),e.jsx("h2",{id:"message-adapters",children:"Message adapters"}),e.jsxs("p",{children:["If your server speaks a different wire format (Supabase, Debezium CDC), use the ",e.jsx("code",{children:"onMessage"})," callback to transform incoming events."]}),e.jsx(u,{title:"Supabase Realtime",code:`const tasksOptions = realtimeCollectionOptions({
  getKey: (t) => t.id,
  client: realtimeClient,
  channel: 'public:tasks',

  onMessage: (raw) => {
    const e = raw as { eventType: string; new: Task; old: Task }
    if (e.eventType === 'INSERT') return { action: 'insert', data: e.new }
    if (e.eventType === 'UPDATE') return { action: 'update', data: e.new }
    if (e.eventType === 'DELETE') return { action: 'delete', data: e.old }
    return null
  },
})`}),e.jsx(u,{title:"Postgres CDC (Debezium)",code:`const ordersOptions = realtimeCollectionOptions({
  getKey: (o) => o.id,
  client: realtimeClient,
  channel: 'orders',

  onMessage: (raw) => {
    const e = raw as { op: 'c' | 'u' | 'd'; after?: Order; before?: Order }
    if (e.op === 'c') return { action: 'insert', data: e.after! }
    if (e.op === 'u') return { action: 'update', data: e.after! }
    if (e.op === 'd') return { action: 'delete', data: e.before! }
    return null
  },
})`}),e.jsx("h2",{id:"capability-contract",children:"The capability contract & writing your own adapter"}),e.jsx("p",{children:"Every adapter declares what it can actually do through a small, machine-readable contract. This is the public extension point that makes “use most WebSocket providers” real: wrap any provider as a transport, declare its capabilities honestly, and validate it against the same battery the first-party adapters pass."}),e.jsx(u,{title:"The contract (exported from @realtimejs/core)",code:`interface TransportCapabilities {
  presence: boolean               // server-held membership + member lists
  serverAssistedRecovery: boolean // offset/epoch gap replay after a gap
  history: boolean                // on-demand server-side history retrieval
  ephemeral: boolean              // fire-and-forget pub/sub (the baseline)
}`}),e.jsxs("p",{children:["Adapters set ",e.jsx("code",{children:"transport.capabilities"}),". Consumers read them without caring which provider is underneath:"]}),e.jsx(u,{code:`import { getCapabilities } from '@realtimejs/core'

// Per-transport, before wrapping:
const caps = getCapabilities(transport)

// Or on a built client (reflects the active transport):
if (client.capabilities.presence) {
  // safe to use presence/typing hooks
}`}),e.jsxs("p",{children:[e.jsx("strong",{children:"Graceful degradation."})," On a transport that reports"," ",e.jsx("code",{children:"presence: false"})," (e.g. SSE), the presence methods are replaced with stubs that throw an actionable error —"," ",e.jsx("code",{children:"“[realtime] Transport does not support presence. Use a transport that implements PresenceCapable.”"})," ","— instead of silently doing nothing. Capability-gated code can check ",e.jsx("code",{children:"client.capabilities.presence"})," first and degrade the UI accordingly."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Validate any adapter with the conformance kit."})," ",e.jsx("code",{children:"@realtimejs/adapter-conformance"})," exports"," ",e.jsx("code",{children:"runAdapterConformance(harness)"}),", the exact battery every built-in adapter passes — including a real reconnect / re-subscribe check and an assertion that declared"," ",e.jsx("code",{children:"capabilities"})," match observable behavior (the presence sub-battery runs only when ",e.jsx("code",{children:"presence"})," is declared"," ",e.jsx("code",{children:"true"}),", and must agree with"," ",e.jsx("code",{children:"hasPresence(transport)"}),")."]}),e.jsx(u,{title:"adapter conformance test",code:`import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import { myTransport } from './my-transport'

runAdapterConformance({
  name: 'my-transport',
  createTransport: () => myTransport({ socket: fakeProvider }),
  capabilities: {
    presence: true,
    serverAssistedRecovery: false,
    history: false,
    ephemeral: true,
  },
  emitMessage: (channel, data) => fakeProvider.deliver(channel, data),
  simulateDisconnect: () => fakeProvider.drop(),
  simulateReconnect: () => fakeProvider.reconnect(),
})`}),e.jsx("h2",{id:"see-also",children:"See also"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/centrifugo",children:"Centrifugo Guide"})," — end-to-end walkthrough: installation, tokens, presence, gap recovery, and production topology"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/scaling",children:"Scaling to Production"})," — the PublishBackend interface for multi-process SSE / WebSocket fan-out"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/resilience",children:"Resilience"})," — offline queue, gap recovery, and multi-tab coordination"]})]})]})}function wj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Resilience"}),e.jsx("p",{className:"doc-lead",children:"Transport wrappers that stack on top of any adapter — SSE, Centrifugo, or custom. Use one, two, or all three in any combination."}),e.jsx("h2",{id:"offline-queue",children:"Offline queue"}),e.jsxs("p",{children:["Register an offline queue on any transport with"," ",e.jsx("code",{children:"useOfflineQueue"}),". Publishes buffer and replay in FIFO order when the connection comes back. Plug in ",e.jsx("code",{children:"localStorage"})," or IndexedDB so messages survive page refresh."]}),e.jsx(u,{code:`import {
  useOfflineQueue,
  createLocalStorageAdapter,
  createRealtimeClient,
} from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'
import { useStore } from '@tanstack/react-store'

const transport = sseTransport({ url: '/api/realtime' })
const queue = useOfflineQueue(transport, {
  maxSize: 500,
  storage: createLocalStorageAdapter(),
})

const client = createRealtimeClient({ transport })

// Reactive pending-count badge
function SyncStatus() {
  const pending = useStore(queue.store, (s) => s.pending.length)
  return pending > 0
    ? <span>{pending} changes pending sync</span>
    : null
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["Both ",e.jsx("code",{children:"createLocalStorageAdapter()"})," and"," ",e.jsx("code",{children:"createIndexedDBStorage()"})," default to the storage key"," ",e.jsx("code",{children:"'realtimejs-queue'"})," (the localStorage key / IndexedDB database name). Override it with the ",e.jsx("code",{children:"key"})," /"," ",e.jsx("code",{children:"dbName"})," option if you run more than one queue on the same origin. The default ",e.jsx("code",{children:"maxSize"})," is 1000 messages."]})}),e.jsx("h2",{id:"gap-recovery",children:"Gap recovery"}),e.jsxs("p",{children:["Two paths: add ",e.jsx("code",{children:"refetchOnReconnect: true"})," to any collection that has a ",e.jsx("code",{children:"queryFn"}),", or use ",e.jsx("code",{children:"useGapRecovery"})," at the transport level."]}),e.jsx(u,{code:`// Option A — collection level (queryFn required)
const tasksOptions = realtimeCollectionOptions({
  ...withRest({ url: \`/api/tasks?projectId=\${projectId}\`, getKey: (t) => t.id }),
  channel: ['tasks', { projectId }],
  refetchOnReconnect: true,
})

// Option B — transport level
import { useGapRecovery } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = sseTransport({ url: '/api/realtime' })
useGapRecovery(transport, {
  onGap: async (channel) => {
    await refetchCollection(channel)
  },
})`}),e.jsx("h2",{id:"multi-tab",children:"Multi-tab coordination"}),e.jsxs("p",{children:["Six browser tabs means six open connections."," ",e.jsx("code",{children:"createCoordinatedTransport"})," shares a single connection across all tabs automatically."]}),e.jsx("h3",{children:"BroadcastChannel (default)"}),e.jsx("p",{children:"One tab is elected leader and holds the connection. Others proxy through it. Zero config."}),e.jsx(u,{code:`import { createCoordinatedTransport } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = createCoordinatedTransport({
  transport: () => sseTransport({ url: '/api/realtime' }),
})`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Honest capabilities."})," A coordinated transport reports the ",e.jsx("em",{children:"inner"})," transport’s capabilities, so"," ",e.jsx("code",{children:"usePresence"})," degrades correctly. The BroadcastChannel and direct-fallback strategies construct the inner synchronously and auto-derive via ",e.jsx("code",{children:"getCapabilities"})," — an SSE inner still reports ",e.jsx("code",{children:"presence: false"}),". The SharedWorker strategy is the exception: the real transport lives in the worker process and can’t be inspected from the tab, so it defaults to the least-capable set. If your worker wraps a presence-capable transport, pass a matching ",e.jsx("code",{children:"capabilities"})," object to"," ",e.jsx("code",{children:"createCoordinatedTransport"})," to re-enable presence."]})}),e.jsx("h3",{children:"SharedWorker (opt-in)"}),e.jsx("p",{children:"A separate worker process survives tab close and crashes. Requires a small worker file."}),e.jsx(u,{title:"realtime.worker.ts",code:`import { createSharedWorkerCoordinator } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const coordinator = createSharedWorkerCoordinator(
  sseTransport({ url: '/api/realtime' }),
)
self.addEventListener('connect', (e) => {
  coordinator.connect(e.ports[0])
})`}),e.jsx(u,{title:"app code",code:`import { createCoordinatedTransport } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = createCoordinatedTransport({
  transport: () => sseTransport({ url: '/api/realtime' }),
  workerUrl: new URL('./realtime.worker.ts', import.meta.url),
})`}),e.jsx("h2",{id:"utilities",children:"Utilities"}),e.jsx("h3",{children:"createDedup"}),e.jsx("p",{children:"Bounded deduplication filter using FIFO eviction."}),e.jsx(u,{code:`import { createDedup } from '@realtimejs/core'

const dedup = createDedup({ maxSize: 500 })

transport.subscribe('chat', (msg) => {
  if (dedup.seen('chat', msg.id)) return
  handleMessage(msg)
})`}),e.jsx("h3",{children:"throttle"}),e.jsx("p",{children:"Trailing-edge throttle for high-frequency publishes."}),e.jsx(u,{code:`import { throttle } from '@realtimejs/core'

const throttledPublish = throttle(
  (pos: { x: number; y: number }) => client.publish('cursors', pos),
  { interval: 50 },
)

onMouseMove = (e) =>
  throttledPublish({ x: e.clientX, y: e.clientY })`}),e.jsx("h3",{children:"createEphemeralMap"}),e.jsx("p",{children:"Key-value store where entries auto-expire after a TTL. Perfect for typing indicators."}),e.jsx(u,{code:`import { createEphemeralMap } from '@realtimejs/core'

const typingUsers = createEphemeralMap<{ name: string }>({
  ttl: 3000,
})

typingUsers.set(userId, { name: 'Alice' })

typingUsers.subscribe((entries) => {
  setTyping(entries.map((e) => e.value.name))
})`}),e.jsx("h2",{id:"sharedworker-setup",children:"SharedWorker bundler setup"}),e.jsxs("p",{children:[e.jsx("code",{children:"createCoordinatedTransport()"})," auto-detects the best multi-tab strategy: ",e.jsx("strong",{children:"SharedWorker"})," →"," ",e.jsx("strong",{children:"BroadcastChannel"})," → ",e.jsx("strong",{children:"Direct"})," ","fallback. SharedWorker provides the best deduplication — a single WebSocket connection shared across all tabs via a dedicated worker process that survives tab close and crashes. Using it requires a small worker file and bundler configuration so the browser can load it."]}),e.jsx("h3",{children:"Worker file template"}),e.jsxs("p",{children:["Create a worker file (e.g. ",e.jsx("code",{children:"realtime-worker.ts"}),") in your source directory. This file runs inside the SharedWorker and holds the real transport connection on behalf of every tab."]}),e.jsx(u,{title:"realtime-worker.ts",code:`import { createSharedWorkerCoordinator } from '@realtimejs/core'
import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'

// createSharedWorkerCoordinator requires a PresenceCapable transport
const coordinator = createSharedWorkerCoordinator(
  centrifugoTransport({ url: 'ws://localhost:8000/connection/websocket' }),
)

self.addEventListener('connect', (e) => {
  coordinator.connect(e.ports[0])
})`}),e.jsx("h3",{children:"Vite"}),e.jsxs("p",{children:["Vite understands ",e.jsx("code",{children:"new URL(..., import.meta.url)"})," natively and will emit the worker as a separate chunk automatically."]}),e.jsx(u,{code:`import { createCoordinatedTransport } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = createCoordinatedTransport({
  transport: () => sseTransport({ url: '/api/realtime' }),
  workerUrl: new URL('./realtime-worker.ts', import.meta.url),
})`}),e.jsx("h3",{children:"Webpack 5"}),e.jsxs("p",{children:["Webpack 5 detects ",e.jsx("code",{children:"new URL(..., import.meta.url)"})," and emits the worker file as a separate chunk automatically. No additional loader or plugin is required."]}),e.jsx(u,{code:`import { createCoordinatedTransport } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = createCoordinatedTransport({
  transport: () => sseTransport({ url: '/api/realtime' }),
  workerUrl: new URL('./realtime-worker.ts', import.meta.url),
})`}),e.jsx("h3",{children:"What happens without SharedWorker"}),e.jsxs("p",{children:["When no ",e.jsx("code",{children:"workerUrl"})," is provided, or when SharedWorker is unavailable (e.g. Safari on iOS before 16),"," ",e.jsx("code",{children:"createCoordinatedTransport"})," falls back automatically:"]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"BroadcastChannel (default fallback)"})," — one tab is elected leader and holds the connection. Other tabs proxy through BroadcastChannel. If the leader tab closes, a new leader is elected and reconnects. Each tab still only sees one connection, but a brief reconnect happens during leader failover."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Direct (last resort)"})," — when BroadcastChannel is also unavailable (rare), every tab opens its own independent connection. There is no cross-tab coordination or deduplication."]})]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["SharedWorker is optional. If you don't configure it,"," ",e.jsx("code",{children:"createCoordinatedTransport"})," falls back to BroadcastChannel automatically. Most apps work fine without a SharedWorker."]})}),e.jsx("h2",{id:"what-happens-when",children:"What happens when…"}),e.jsxs("table",{className:"doc-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{scope:"col",children:"Scenario"}),e.jsx("th",{scope:"col",children:"What happens"}),e.jsx("th",{scope:"col",children:"Recovery"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Network goes offline"}),e.jsx("td",{children:"Publishes buffer in the offline queue. Subscriptions pause — no events are received."}),e.jsxs("td",{children:["Queue replays on reconnect. If"," ",e.jsx("code",{children:"refetchOnReconnect: true"}),", collections re-query to fill any gap."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Tab is closed"}),e.jsxs("td",{children:["Connection closes. With ",e.jsx("code",{children:"createCoordinatedTransport"}),", BroadcastChannel elects a new leader tab and reconnects. SharedWorker keeps the connection alive. Without coordination, the connection is simply dropped."]}),e.jsx("td",{children:"Other tabs continue receiving events without interruption (BroadcastChannel: brief reconnect; SharedWorker: seamless)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Auth token expires"}),e.jsx("td",{children:"Transport-dependent. WebSocket/Centrifugo close with an auth error. SSE returns 401 on reconnect."}),e.jsxs("td",{children:["Provide a ",e.jsx("code",{children:"getToken"})," function (WebSocket, SSE) or a"," ",e.jsx("code",{children:"token"})," callback (Centrifugo) that returns a fresh token on each connect. The transport calls it automatically during reconnection."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Server restarts"}),e.jsx("td",{children:"All connections drop. Clients enter reconnection backoff (exponential with jitter)."}),e.jsxs("td",{children:["Clients reconnect automatically. Use"," ",e.jsx("code",{children:"refetchOnReconnect"})," or Centrifugo epoch/offset recovery to fill any missed messages."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Laptop sleep / resume"}),e.jsx("td",{children:"Same as network offline. Connections time out during sleep."}),e.jsx("td",{children:"On wake, the client detects the stale connection and reconnects. Offline queue replays any buffered mutations."})]})]})]}),e.jsx("h2",{id:"see-also",children:"See also"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/transports",children:"Transports"})," — overview of all available transports and when to use each"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/scaling",children:"Scaling to Production"})," — the PublishBackend interface for multi-process fan-out"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/error-reference",children:"Error Reference"})," — connection errors, flush errors, and gap recovery errors"]})]})]})}function kj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"React Hooks"}),e.jsxs("p",{className:"doc-lead",children:["All hooks are exported from ",e.jsx("code",{children:"@realtimejs/react"}),". The client is sourced from ",e.jsx("code",{children:"RealtimeProvider"})," context."]}),e.jsxs("p",{children:["These same hooks are available for"," ",e.jsx("a",{href:"#/docs/solid-primitives",children:"Solid"})," and"," ",e.jsx("a",{href:"#/docs/vue-composables",children:"Vue"})," with identical names and signatures."]}),e.jsx("h2",{id:"useRealtime",children:"useRealtime"}),e.jsx("p",{children:"Connection status and control."}),e.jsx(u,{title:"ConnectionBadge.tsx",code:`import { useRealtime } from '@realtimejs/react'

function ConnectionBadge() {
  const { status, connect, disconnect } = useRealtime()

  return (
    <span className={status}>
      {status === 'connected' ? 'Live' : 'Offline'}
    </span>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useRealtime(): {
  status: ConnectionStatus  // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  connect: () => Promise<void>
  disconnect: () => void
  client: RealtimeClient
}`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/resilience",children:"Resilience"})," for connection recovery patterns."]}),e.jsx("h2",{id:"useSubscribe",children:"useSubscribe"}),e.jsx("p",{children:"Subscribe to raw channel events for the component lifetime."}),e.jsx(u,{title:"TypingIndicator.tsx",code:`import { useState } from 'react'
import { useSubscribe } from '@realtimejs/react'

function TypingIndicator({ roomId }: { roomId: string }) {
  const [typing, setTyping] = useState<string[]>([])

  useSubscribe(['chat:typing', { roomId }], (event) => {
    setTyping((event as { users: string[] }).users)
  })

  return <span>{typing.join(', ')} typing...</span>
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useSubscribe(
  channel: QueryKey | string,   // e.g. ['chat:typing', { roomId }]
  onMessage: (data: unknown) => void,
): { subscribeError: SubscribeError | null }`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/ephemeral",children:"Ephemeral Channels"})," for confetti, toasts, and fire-and-forget patterns."]}),e.jsx("h2",{id:"usePublish",children:"usePublish"}),e.jsx("p",{children:"Stable publish function bound to a channel."}),e.jsx(u,{title:"TypingBroadcast.tsx",code:`import { usePublish } from '@realtimejs/react'

function TypingBroadcast({ roomId }: { roomId: string }) {
  const publish = usePublish(['chat:typing', { roomId }])

  return (
    <input
      onFocus={() => publish({ users: [currentUser.id] })}
      onBlur={() => publish({ users: [] })}
    />
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function usePublish<T = unknown>(
  channel: QueryKey | string,
): (data: T) => Promise<void>`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/channels",children:"Channels"})," for validated publishing with ",e.jsx("code",{children:"createValidatedPublish"}),"."]}),e.jsx("h2",{id:"useChannel",children:"useChannel"}),e.jsx("p",{children:"Combined subscribe + publish for one channel."}),e.jsx(u,{title:"ChatRoom.tsx",code:`import { useState } from 'react'
import { useChannel } from '@realtimejs/react'

function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const { publish } = useChannel(
    ['chat', { roomId }],
    (raw) => setMessages((prev) => [...prev, raw as Message]),
  )

  return (
    <>
      {messages.map((m) => <p key={m.id}>{m.text}</p>)}
      <button onClick={() =>
        publish({ id: crypto.randomUUID(), text: 'Hi!' })
      }>
        Send
      </button>
    </>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useChannel(
  channel: QueryKey | string,
  onMessage?: (data: unknown) => void,  // optional — omit for publish-only
): {
  publish: (data: unknown) => Promise<void>
}`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/channels",children:"Channels & Pub/Sub"}),"."]}),e.jsx("h2",{id:"usePresence",children:"usePresence"}),e.jsxs("p",{children:["Join a presence channel. Returns peers (",e.jsx("code",{children:"others"}),"), your own last-sent data (",e.jsx("code",{children:"self"}),"), and an update function. Requires a presence-capable transport — ",e.jsx("code",{children:"usePresence"})," throws an actionable error on a transport that reports"," ",e.jsx("code",{children:"capabilities.presence === false"})," (e.g. SSE)."]}),e.jsxs("p",{children:["Define the channel once with ",e.jsx("code",{children:"createPresenceChannel"})," from"," ",e.jsx("code",{children:"@realtimejs/core"}),", then pass it to the hook:"]}),e.jsx(u,{title:"channel.ts",code:`import { createPresenceChannel } from '@realtimejs/core'

export const docPresence = createPresenceChannel({
  id: 'doc-presence',
  channel: (params: { docId: string }) => ['doc', params],
})`}),e.jsx(u,{title:"DocumentPage.tsx",code:`import { usePresence } from '@realtimejs/react'
import { docPresence } from './channel'

function DocumentPage({ docId }: { docId: string }) {
  const { others, self, updatePresence } = usePresence(docPresence, {
    params: { docId },
    initial: { name: user.name, cursor: null },
  })

  return (
    <div onMouseMove={(e) =>
      updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
    }>
      {/* self === your own last-sent presence data */}
      <Avatar name={self.name} isSelf />
      {/* others excludes you; each peer is keyed by connectionId */}
      {others.map((u) => (
        <Avatar key={u.connectionId} name={u.data.name} />
      ))}
    </div>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function usePresence<T>(
  channelDef: PresenceChannelDef,
  options: {
    params: Record<string, string>
    initial: T
  },
): {
  others: ReadonlyArray<PresenceUser<T>>  // peers only — self is excluded
  self: T                                 // your own last-sent presence data
  updatePresence: (delta: Partial<T>) => void
}`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/presence",children:"Presence"})," for contextual presence, throttling guidance, and cursor sharing patterns."]}),e.jsx("h2",{id:"useStream",children:"useStream"}),e.jsx("p",{children:"Subscribe to a reduce-based stream. Returns state, status, and error."}),e.jsx(u,{title:"AIResponse.tsx",code:`import { useStream } from '@realtimejs/react'
import { aiResponseStream } from './stream'

function AIResponse({ requestId }: { requestId: string }) {
  const { state, status, error } = useStream(aiResponseStream, {
    params: { requestId },
  })

  if (status === 'pending')  return <span>Thinking...</span>
  if (status === 'error')    return <span>Error: {error}</span>

  return (
    <p>
      {state.content}
      {status === 'streaming' && <span className="cursor">|</span>}
    </p>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useStream<TState, TEvent = unknown>(
  streamDef: StreamChannelDef<TState, TEvent>,
  options: {
    params: Record<string, string>
  },
): {
  state: TState
  status: 'pending' | 'streaming' | 'done' | 'error' | 'stale'
  error?: string
}`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/streaming",children:"Streaming"})," for checkpointing, HMAC signing, and ",e.jsx("code",{children:"staleAfter"}),"."]}),e.jsx("h2",{id:"useRealtimeCollection",children:"useRealtimeCollection"}),e.jsx("p",{children:"Creates a CRDT-backed TanStack DB collection. Client is sourced from context."}),e.jsx(u,{title:"TodoList.tsx",code:`import { useRealtimeCollection } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

function TodoList({ projectId }: { projectId: string }) {
  const todos = useRealtimeCollection<Todo>({
    channel: ['todos', { projectId }],
    getKey: (t) => t.id,
    queryFn: () => fetchTodos(projectId),
  })

  const { data } = useLiveQuery((q) =>
    q.from({ todos }).select()
  )

  return <ul>{data.map((t) => <li key={t.id}>{t.text}</li>)}</ul>
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useRealtimeCollection<T>(options: {
  channel: QueryKey
  getKey: (item: T) => string
  queryFn?: () => Promise<T[]>
  fields?: Record<string, 'lww' | 'pn-counter' | 'or-set'>
  optimistic?: boolean
  refetchOnReconnect?: boolean
}): Collection<T>`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/collections",children:"Collections"})," for the full progressive spectrum and ",e.jsx("a",{href:"#/docs/crdts",children:"CRDTs"})," for field-level merge behavior."]}),e.jsx("h2",{id:"useLiveChannel",children:"useLiveChannel"}),e.jsx("p",{children:"Creates an append-only live channel collection. For chat, game events, and feeds."}),e.jsx(u,{title:"AuditLog.tsx",code:`import { useLiveChannel } from '@realtimejs/react'

function AuditLog({ resourceId }: { resourceId: string }) {
  const events = useLiveChannel<AuditEvent>({
    channel: ['audit', { resourceId }],
    getKey: (e) => e.id,
    initialData: () => fetchAuditHistory(resourceId),
    onEvent: (raw) => {
      const e = raw as { type: string; event: AuditEvent }
      return e.type === 'audit' ? e.event : null
    },
  })
  // ...
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useLiveChannel<T>(options: {
  channel: QueryKey
  getKey: (item: T) => string
  initialData?: () => Promise<T[]>
  onEvent: (raw: unknown) => T | null
}): Collection<T>`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/channels",children:"Channels & Pub/Sub"})," for append-only patterns and"," ",e.jsx("a",{href:"#/docs/read-receipts",children:"Read Receipts"}),"."]}),e.jsx("h2",{id:"useConnectionStatus",children:"useConnectionStatus"}),e.jsxs("p",{children:["Returns the reactive ",e.jsx("code",{children:"ConnectionStatus"})," value. Lightweight alternative to ",e.jsx("code",{children:"useRealtime()"})," for status-only components."]}),e.jsx(u,{title:"ConnectionBanner.tsx",code:`import { useConnectionStatus } from '@realtimejs/react'

function ConnectionBanner() {
  const status = useConnectionStatus()

  if (status === 'connected') return null
  if (status === 'reconnecting') return <p>Reconnecting…</p>
  return <p>Offline — changes will sync when back online</p>
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useConnectionStatus(): ConnectionStatus
// ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'`}),e.jsx("h2",{id:"useIsConnected",children:"useIsConnected"}),e.jsxs("p",{children:["Returns ",e.jsx("code",{children:"true"})," when connected, ",e.jsx("code",{children:"false"})," otherwise. Convenience wrapper over ",e.jsx("code",{children:"useConnectionStatus()"}),"."]}),e.jsx(u,{title:"SendButton.tsx",code:`import { useIsConnected } from '@realtimejs/react'

function SendButton({ onClick }: { onClick: () => void }) {
  const connected = useIsConnected()
  return (
    <button onClick={onClick} disabled={!connected}>
      {connected ? 'Send' : 'Connecting…'}
    </button>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:"function useIsConnected(): boolean"}),e.jsx("h2",{id:"useLatestMessage",children:"useLatestMessage"}),e.jsx("p",{children:"Subscribes to a channel and returns only the most recently received message. Ideal for notification banners, status updates, and live score tickers."}),e.jsx(u,{title:"LiveScore.tsx",code:`import { useLatestMessage } from '@realtimejs/react'

function LiveScore({ matchId }: { matchId: string }) {
  const { message: score, messageCount } = useLatestMessage<ScoreUpdate>(
    ['scores', { matchId }],
  )
  return <p>{score ? \`\${score.home} - \${score.away}\` : 'Waiting…'}</p>
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useLatestMessage<T = unknown>(
  channel: QueryKey | string,
): {
  message: T | undefined
  messageCount: number    // incremented on every message
}`}),e.jsx("h2",{id:"useChannelHistory",children:"useChannelHistory"}),e.jsxs("p",{children:["Subscribes to a channel and buffers the last ",e.jsx("code",{children:"maxMessages"})," ","messages in order (ring buffer). Useful for chat UIs and activity feeds without a full database collection."]}),e.jsx(u,{title:"ChatRoom.tsx",code:`import { useChannelHistory } from '@realtimejs/react'

function ChatRoom({ roomId }: { roomId: string }) {
  const { messages, clear } = useChannelHistory<Message>(
    ['chat', { roomId }],
    { maxMessages: 100 },
  )

  return (
    <ul>
      {messages.map((m) => (
        <li key={m.id}>{m.author}: {m.text}</li>
      ))}
    </ul>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useChannelHistory<T = unknown>(
  channel: QueryKey | string,
  options?: {
    maxMessages?: number  // default: 50
  },
): {
  messages: ReadonlyArray<T>
  clear: () => void
}`}),e.jsx("h2",{id:"useTypingIndicator",children:"useTypingIndicator"}),e.jsxs("p",{children:["Tracks who is typing in a channel. Publishes ",e.jsx("code",{children:"typing:start"})," /"," ",e.jsx("code",{children:"typing:stop"})," events and auto-expires users after a configurable timeout."]}),e.jsx(u,{title:"TypingStatus.tsx",code:`import { useTypingIndicator } from '@realtimejs/react'

function ChatInput({ roomId }: { roomId: string }) {
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    ['typing', { roomId }],
    { selfId: currentUser.id },
  )

  return (
    <>
      <input
        onChange={(e) => { setValue(e.target.value); startTyping() }}
        onBlur={stopTyping}
      />
      {typingUsers.length > 0 && (
        <p>{typingUsers.join(', ')} typing…</p>
      )}
    </>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useTypingIndicator(
  channel: QueryKey | string,
  options: {
    selfId: string         // exclude yourself from typingUsers
    timeout?: number       // auto-expire after ms (default: 3000)
  },
): {
  typingUsers: ReadonlyArray<string>
  startTyping: () => void
  stopTyping: () => void
}`}),e.jsx("h2",{id:"useChannelStats",children:"useChannelStats"}),e.jsx("p",{children:"Tracks per-channel statistics without consuming message payloads. Useful for debug overlays and admin dashboards."}),e.jsx(u,{title:"ChannelDebug.tsx",code:`import { useChannelStats } from '@realtimejs/react'

function ChannelDebugBadge({ channel }: { channel: string }) {
  const { messageCount, lastMessageAt } = useChannelStats(channel)
  return (
    <span>
      {messageCount} msgs
      {lastMessageAt && \` · last \${new Date(lastMessageAt).toLocaleTimeString()}\`}
    </span>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useChannelStats(
  channel: QueryKey | string,
): {
  messageCount: number
  lastMessageAt: number | null
}`}),e.jsx("h2",{id:"useOnReconnect",children:"useOnReconnect"}),e.jsx("p",{children:"Fires a callback each time the realtime connection is restored after being disconnected. Useful for refetching server state or showing notifications."}),e.jsx(u,{title:"DataGrid.tsx",code:`import { useOnReconnect } from '@realtimejs/react'

function DataGrid() {
  const { refetch } = useQuery(...)

  useOnReconnect(() => {
    refetch()
  })

  return <table>...</table>
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:"function useOnReconnect(callback: () => void): void"}),e.jsx("h2",{id:"synced-hooks",children:"Standalone CRDT hooks"}),e.jsx("p",{children:"Self-contained hooks for shared counters, values, and sets. No collection required."}),e.jsx("h3",{children:"useSyncedCounter"}),e.jsx(u,{title:"VoteButton.tsx",code:`const postVotes = defineSyncedCounter({
  id: 'post-votes',
  channel: (params: { postId: string }) => ['votes', params],
})

function VoteButton({ postId }: { postId: string }) {
  const { value, increment, decrement } = useSyncedCounter(postVotes, {
    params: { postId },
    initial: 0,
  })
  return <button onClick={() => increment()}>+1 ({value})</button>
}`}),e.jsx("h3",{children:"useSyncedValue"}),e.jsx(u,{title:"EditableTitle.tsx",code:`const docTitle = defineSyncedValue({
  id: 'doc-title',
  channel: (params: { docId: string }) => ['doc:title', params],
})

function EditableTitle({ docId }: { docId: string }) {
  const { value, set } = useSyncedValue(docTitle, {
    params: { docId },
    initial: 'Untitled',
  })
  return <input value={value} onChange={(e) => set(e.target.value)} />
}`}),e.jsx("h3",{children:"useSyncedSet"}),e.jsx(u,{title:"TagEditor.tsx",code:`const postTags = defineSyncedSet({
  id: 'post-tags',
  channel: (params: { postId: string }) => ['tags', params],
})

function TagEditor({ postId }: { postId: string }) {
  const { values: tags, add, remove, has } = useSyncedSet(postTags, {
    params: { postId },
    initial: [],
  })
  return (
    <>
      {tags.map(tag => (
        <span key={tag}>{tag} <button onClick={() => remove(tag)}>x</button></span>
      ))}
      <button
        onClick={() => add('important')}
        disabled={has('important')}
      >
        + important
      </button>
    </>
  )
}`}),e.jsxs("p",{children:["See also: ",e.jsx("a",{href:"#/docs/crdts",children:"CRDTs"})," for theory and merge behavior, ",e.jsx("a",{href:"#/docs/ephemeral",children:"Ephemeral Channels"})," for pairing ephemeral animations with persistent CRDT counters."]}),e.jsx("h2",{id:"useQuery",children:"useQuery"}),e.jsxs("p",{children:["Subscribes to a reactive server query and keeps the result live. Returns a typed item array plus a composable ",e.jsx("code",{children:"collection"})," for client-side filtering with ",e.jsx("code",{children:"useLiveQuery"}),". See the"," ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"TodoList.tsx",code:`import { useQuery } from '@realtimejs/react'
import { getTodos } from '../server/todos'

function TodoList({ teamId }: { teamId: string }) {
  const { data, collection, isPending, error } =
    useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

  if (isPending) return <p>Loading…</p>
  if (error)     return <p>Error: {String(error)}</p>
  return <ul>{data.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useQuery<TArgs, TItem extends Record<string, unknown>>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: TArgs,
  options: {
    getKey: (item: TItem) => string    // required — stable key per item
    enabled?: boolean                   // default: true
    refetchOnReconnect?: boolean        // default: true
  }
): {
  data: Array<TItem>                    // live array from the server
  collection: Collection<TItem, string> | null  // pass to useLiveQuery for client-side views
  isPending: boolean
  isFetching: boolean
  error: unknown
  refetch: () => void
}`}),e.jsx("h2",{id:"useMutation",children:"useMutation"}),e.jsxs("p",{children:["Mutation hook with loading state, error handling, and declarative optimistic updates. See the"," ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"AddTodoForm.tsx",code:`import { useMutation } from '@realtimejs/react'
import { getTodos, createTodo } from '../server/todos'

function AddTodoForm({ teamId }: { teamId: string }) {
  const { mutate, isPending, error } = useMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  return (
    <button
      disabled={isPending}
      onClick={() => mutate({ teamId, title: 'New todo' })}
    >
      {isPending ? 'Saving…' : 'Add'}
    </button>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options?: {
    optimistic?: (cache: OptimisticCache, args: TArgs) => void
    onSuccess?: (data: TResult, args: TArgs) => void
    onError?: (error: unknown, args: TArgs) => void
  }
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: boolean
  error: unknown
  data: TResult | undefined
  reset: () => void
}`}),e.jsx("h2",{id:"usePaginatedQuery",children:"usePaginatedQuery"}),e.jsxs("p",{children:["Paginated variant of ",e.jsx("code",{children:"useQuery"}),". Accumulates pages and keeps the first page live. See the"," ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"FeedList.tsx",code:`import { usePaginatedQuery } from '@realtimejs/react'
import { getFeedPage } from '../server/feed'

function FeedList({ teamId }: { teamId: string }) {
  const { items, isPending, hasNextPage, fetchNextPage } =
    usePaginatedQuery(getFeedPage, { teamId })

  return (
    <>
      <ul>{items.map((i) => <li key={i.id}>{i.text}</li>)}</ul>
      {hasNextPage && <button onClick={() => fetchNextPage()}>Load more</button>}
    </>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function usePaginatedQuery<TItem, TArgs extends { cursor?: string | number | null; limit?: number }>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: Omit<TArgs, 'cursor' | 'limit'>,
  options?: {
    pageSize?: number
    enabled?: boolean
    refetchOnReconnect?: boolean
  }
): {
  items: TItem[]
  isPending: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: unknown
  fetchNextPage: () => Promise<void>
  refetch: () => void
}`})]})}function Cj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Error Reference"}),e.jsx("p",{className:"doc-lead",children:"This page documents every error type in realtime.js, what triggers it, and how to handle it."}),e.jsx("h2",{id:"conflict-error",children:"ConflictError<T>"}),e.jsxs("p",{children:["Thrown from a server function (",e.jsx("code",{children:"onInsert"}),","," ",e.jsx("code",{children:"onUpdate"}),", or ",e.jsx("code",{children:"onDelete"}),") when a concurrent edit is detected — for example, when an optimistic-lock check finds that a row’s ",e.jsx("code",{children:"version"})," column no longer matches the client’s copy."]}),e.jsx("h3",{children:"When it triggers"}),e.jsx("p",{children:"The server response differs from the optimistic prediction. Typically this means another user modified the same row between the time the client read it and the time the mutation arrived."}),e.jsx("h3",{children:"Properties"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"type"})," — always ",e.jsx("code",{children:"'ConflictError'"})," (stable discriminant that survives network serialization)"]}),e.jsxs("li",{children:[e.jsx("code",{children:"current: T"})," — the authoritative server state at the time of the conflict"]}),e.jsxs("li",{children:[e.jsx("code",{children:"message: string"})," — human-readable description of the conflict"]})]}),e.jsx("h3",{children:"How to handle"}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"isConflictError()"})," inside ",e.jsx("code",{children:"onOptimisticError"})," ","instead of ",e.jsx("code",{children:"instanceof"})," — TanStack Start reconstructs thrown errors on the client as plain objects, which breaks prototype chain checks."]}),e.jsxs("p",{children:["If ",e.jsx("code",{children:"onOptimisticError"})," is omitted, the optimistic state is rolled back silently with no UI feedback."]}),e.jsx(u,{title:"server function",code:`import { ConflictError } from '@realtimejs/core'

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: Todo }) => {
    const existing = await db.select().from(todos)
      .where(eq(todos.id, data.id))
      .then((r) => r[0])

    if (existing.version !== data.version) {
      throw new ConflictError('Concurrent edit', { current: existing })
    }

    return db.update(todos)
      .set({ ...data, version: data.version + 1 })
      .where(eq(todos.id, data.id))
      .returning()
      .then((r) => r[0])
  })`}),e.jsx(u,{title:"collection config",code:`import { isConflictError } from '@realtimejs/core'

realtimeCollectionOptions({
  // ...
  optimistic: true,
  onOptimisticError: ({ error, action, key }) => {
    if (isConflictError<Todo>(error)) {
      // error.current holds the authoritative server state
      showConflictDialog({
        current: error.current,
        key,
      })
    } else {
      toast.error(\`Failed to \${action} item \${key}\`)
    }
  },
})`}),e.jsx("h2",{id:"subscribe-errors",children:"Subscribe Errors"}),e.jsx("p",{children:"Returned when a client attempts to subscribe to a channel but is denied by the server’s authorization layer."}),e.jsx("h3",{children:"When it triggers"}),e.jsxs("ul",{children:[e.jsxs("li",{children:["The ",e.jsx("code",{children:"authorize"})," callback in the server handler returns"," ",e.jsx("code",{children:"false"})," for the ",e.jsx("code",{children:"'subscribe'"})," action"]}),e.jsxs("li",{children:["The ",e.jsx("code",{children:"getUser"})," callback returns ",e.jsx("code",{children:"null"})," (user not authenticated)"]}),e.jsx("li",{children:"The channel name does not match any expected pattern"})]}),e.jsx("h3",{children:"How it surfaces"}),e.jsxs("p",{children:["The SSE handler returns an HTTP ",e.jsx("code",{children:"403 Forbidden"})," (or"," ",e.jsx("code",{children:"401 Unauthorized"})," if authentication fails). On the client side, the transport currently logs a ",e.jsx("code",{children:"console.warn"})," for failed subscribe POST actions. The wire protocol defines a"," ",e.jsx("code",{children:"subscribe:error"})," message type with ",e.jsx("code",{children:"channel"}),","," ",e.jsx("code",{children:"code"}),", and ",e.jsx("code",{children:"reason"})," fields."]}),e.jsx("p",{children:"If unhandled, the collection receives no data for that channel — it stays empty with no error indicator."}),e.jsx("h3",{children:"How to handle"}),e.jsxs("p",{children:["Verify your ",e.jsx("code",{children:"authorize"})," function logic and ensure the client is sending a valid authentication token via"," ",e.jsxs("code",{children:["sseTransport(","{ getToken }",")"]}),"."]}),e.jsx(u,{title:"server handler",code:`const sse = createSseHandler({
  getUser: async (req) => {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const { sub } = await verifyJwt(auth.slice(7), JWT_SECRET)
      return { userId: sub }
    } catch {
      return null
    }
  },
  authorize: async (userId, channel) => {
    const canAccess = await db.canAccess(userId, channel.raw)
    return { subscribe: canAccess, publish: canAccess, presence: canAccess }
  },
})`}),e.jsx(u,{title:"client transport",code:`import { sseTransport } from '@realtimejs/adapter-sse'

const transport = sseTransport({
  url: '/api/realtime',
  getToken: () => auth.getSession().then((s) => s.accessToken),
})`}),e.jsx("h2",{id:"publish-errors",children:"Publish Errors"}),e.jsx("p",{children:"Returned when a client attempts to publish a message but the server rejects it."}),e.jsx("h3",{children:"When it triggers"}),e.jsxs("ul",{children:[e.jsxs("li",{children:["The ",e.jsx("code",{children:"authorize"})," callback returns ",e.jsx("code",{children:"false"})," for the"," ",e.jsx("code",{children:"'publish'"})," action"]}),e.jsxs("li",{children:["The user is not authenticated (",e.jsx("code",{children:"getUser"})," returns"," ",e.jsx("code",{children:"null"}),")"]})]}),e.jsx("h3",{children:"How it surfaces"}),e.jsxs("p",{children:["The SSE handler returns an HTTP ",e.jsx("code",{children:"403 Forbidden"})," response. In coordinated transports (SharedWorker, BroadcastChannel), the leader proxies the error back via a ",e.jsx("code",{children:"publish:ack"})," message with an"," ",e.jsx("code",{children:"error"})," field, and the follower’s ",e.jsx("code",{children:"publish"})," ","promise rejects."]}),e.jsx("p",{children:"If the returned promise rejection is not caught, it becomes an unhandled promise rejection."}),e.jsx("h3",{children:"How to handle"}),e.jsx("p",{children:"Check your authorization rules to ensure the publishing user has write access to the target channel."}),e.jsx(u,{code:`const sse = createSseHandler({
  authorize: async (userId, channel) => {
    const isOwner = await db.isChannelOwner(userId, channel.raw)
    return {
      subscribe: true,           // all authenticated users may subscribe
      publish:   isOwner,        // only channel owners may publish
      presence:  true,
    }
  },
})`}),e.jsx("h2",{id:"flush-errors",children:"Offline Queue Flush Errors"}),e.jsx("p",{children:"Fires when a queued message fails to publish during the replay that happens after the connection is restored."}),e.jsx("h3",{children:"When it triggers"}),e.jsxs("ul",{children:[e.jsx("li",{children:"The network becomes available and the offline queue begins flushing, but a specific message fails to send"}),e.jsx("li",{children:"The server rejects a queued publish (authorization expired, etc.)"})]}),e.jsx("h3",{children:"Callback"}),e.jsxs("p",{children:[e.jsx("code",{children:"onFlushError(message, error)"})," receives the"," ",e.jsx("code",{children:"QueuedMessage"})," that failed and the thrown error. Return"," ",e.jsx("code",{children:"true"})," to retry the message on the next flush, or"," ",e.jsx("code",{children:"false"})," to discard it. Defaults to"," ",e.jsx("code",{children:"() => false"})," (discard on failure)."]}),e.jsxs("p",{children:["If ",e.jsx("code",{children:"onFlushError"})," is omitted, failed messages are silently discarded with no notification."]}),e.jsx("h3",{children:"How to handle"}),e.jsx(u,{code:`import { useOfflineQueue } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = sseTransport({ url: '/api/realtime' })
useOfflineQueue(transport, {
  maxSize: 500,
  onFlushError: (message, error) => {
      console.error(
        \`Failed to flush message \${message.id} on \${message.channel}:\`,
        error,
      )
      // Return true to keep in queue and retry next flush,
      // false to discard permanently.
      if (isRetryable(error)) return true
      toast.error('A queued change could not be sent and was discarded.')
      return false
    },
  },
)`}),e.jsx("h2",{id:"gap-errors",children:"Gap Recovery Errors"}),e.jsxs("p",{children:["Fires when the ",e.jsx("code",{children:"onGap"})," callback throws or returns a rejected promise during reconnection recovery."]}),e.jsx("h3",{children:"When it triggers"}),e.jsxs("ul",{children:[e.jsxs("li",{children:["The connection transitions through ",e.jsx("code",{children:"'reconnecting'"})," or"," ",e.jsx("code",{children:"'disconnected'"})," and then back to ",e.jsx("code",{children:"'connected'"})]}),e.jsxs("li",{children:["The ",e.jsx("code",{children:"onGap"})," handler attempts to re-fetch missed data but the fetch fails (server down, timeout, etc.)"]})]}),e.jsx("h3",{children:"Callback"}),e.jsxs("p",{children:[e.jsx("code",{children:"onGapError(error, channel)"})," receives the thrown error and the channel whose recovery failed. By default, errors are silently swallowed so a failing recovery never crashes the transport."]}),e.jsx("h3",{children:"How to handle"}),e.jsx(u,{code:`import { useGapRecovery } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = sseTransport({ url: '/api/realtime' })
useGapRecovery(transport, {
  onGap: async (channel) => {
    await refetchCollection(channel)
  },
  onGapError: (error, channel) => {
    console.error(\`Gap recovery failed for \${channel}:\`, error)
    Sentry.captureException(error)
    // Fallback: force a full refetch or page reload
    window.location.reload()
  },
})`}),e.jsx("h2",{id:"stream-errors",children:"Stream Errors"}),e.jsx("p",{children:"Fires when the server-side stream producer signals a failure."}),e.jsx("h3",{children:"When it triggers"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"stream.error(message)"})," is called server-side, which publishes a ",e.jsx("code",{children:"{ type: STREAM_ERROR, message }"})," sentinel event"]}),e.jsxs("li",{children:["The stream goes stale (no events or heartbeats received within the"," ",e.jsx("code",{children:"staleAfter"})," threshold)"]}),e.jsx("li",{children:"HMAC signature validation fails on a received event"})]}),e.jsx("h3",{children:"How it surfaces"}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"useStream"})," hook returns ",e.jsx("code",{children:"status === 'error'"})," ","and an ",e.jsx("code",{children:"error"})," string with the message from the sentinel event. The stream’s ",e.jsx("code",{children:"isError"})," callback detects the sentinel:"]}),e.jsx(u,{title:"stream channel definition",code:`import {
  STREAM_DONE,
  STREAM_ERROR,
  createStreamChannel,
} from '@realtimejs/core'

const aiResponseStream = createStreamChannel({
  id: 'ai-response',
  channel: (params: { requestId: string }) => ['ai', params],
  initial: { content: '' },
  reduce: (state, event) => ({
    content: state.content + (event.delta ?? ''),
  }),
  isDone: (_state, event) => event.type === STREAM_DONE,
  isError: (_state, event) =>
    event.type === STREAM_ERROR ? (event.message ?? 'Stream error') : false,
  staleAfter: 15_000,
})`}),e.jsx("h3",{children:"How to handle"}),e.jsx(u,{code:`import { useStream } from '@realtimejs/react'

function AIResponse({ requestId }: { requestId: string }) {
  const { state, status, error } = useStream(aiResponseStream, {
    params: { requestId },
  })

  if (status === 'pending')  return <span>Thinking...</span>
  if (status === 'error') {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={() => retryRequest(requestId)}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <p>
      {state.content}
      {status === 'streaming' && <span className="cursor">|</span>}
    </p>
  )
}`}),e.jsx("h3",{children:"Server-side error signaling"}),e.jsx(u,{title:"server function",code:`const stream = sseHandler.createStream({
  channel: ['ai', { requestId }],
})

try {
  for await (const chunk of llmResponse) {
    await stream.push({ delta: chunk.text })
  }
  await stream.done()
} catch (err) {
  await stream.error(String(err))
}`}),e.jsx("h2",{id:"connection-errors",children:"Connection Errors"}),e.jsx("p",{children:"Transport-level failures that occur when the underlying SSE stream or WebSocket connection is interrupted."}),e.jsx("h3",{children:"When it triggers"}),e.jsxs("ul",{children:[e.jsx("li",{children:"The SSE fetch request fails (network offline, DNS failure)"}),e.jsx("li",{children:"The server closes the SSE stream unexpectedly"}),e.jsxs("li",{children:["The authentication token refresh (",e.jsx("code",{children:"getToken"}),") throws"]}),e.jsx("li",{children:"WebSocket close or SSE timeout"})]}),e.jsx("h3",{children:"Status values"}),e.jsxs("p",{children:["The transport’s ",e.jsx("code",{children:"store"})," (a TanStack Store of"," ",e.jsx("code",{children:"ConnectionStatus"}),") transitions through these states:"]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"'disconnected'"})," — no connection;"," ",e.jsx("code",{children:"connect()"})," has not been called or"," ",e.jsx("code",{children:"disconnect()"})," was called explicitly"]}),e.jsxs("li",{children:[e.jsx("code",{children:"'connecting'"})," — a connection handshake is in progress"]}),e.jsxs("li",{children:[e.jsx("code",{children:"'connected'"})," — connection is open and ready"]}),e.jsxs("li",{children:[e.jsx("code",{children:"'reconnecting'"})," — connection was lost unexpectedly; the transport is retrying with exponential back-off"]})]}),e.jsx("h3",{children:"Auto-recovery"}),e.jsx("p",{children:"All built-in transports reconnect automatically with exponential back-off. Configure the retry timing via the transport options:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"initialDelay"})," — initial back-off delay in ms (default: ",e.jsx("code",{children:"1000"}),")"]}),e.jsxs("li",{children:[e.jsx("code",{children:"maxDelay"})," — maximum back-off delay in ms (default:"," ",e.jsx("code",{children:"30000"}),")"]}),e.jsxs("li",{children:[e.jsx("code",{children:"jitter"})," — jitter factor 0–1 (default:"," ",e.jsx("code",{children:"0.25"}),")"]})]}),e.jsx("h3",{children:"How to handle"}),e.jsx(u,{code:`import { useRealtime } from '@realtimejs/react'

function ConnectionBanner() {
  const { status, client } = useRealtime()

  if (status === 'connected') return null

  return (
    <div className="connection-banner">
      {status === 'reconnecting' && 'Reconnecting...'}
      {status === 'connecting' && 'Connecting...'}
      {status === 'disconnected' && (
        <>
          Offline.{' '}
          <button onClick={() => client.connect()}>
            Reconnect
          </button>
        </>
      )}
    </div>
  )
}`})]})}function Rj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"TanStack Start + Drizzle"}),e.jsxs("p",{className:"doc-lead",children:["Wire Drizzle CRUD server functions into a realtime collection in one spread. Every mutation is persisted by the server, confirmed by Drizzle, and broadcast to all subscribers automatically — no manual"," ",e.jsx("code",{children:"publish()"})," call anywhere."]}),e.jsx("h2",{id:"overview",children:"How it works"}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"withServerFns"})," helper maps four async functions (typically TanStack Start ",e.jsx("code",{children:"createServerFn"})," callables) to the"," ",e.jsx("code",{children:"queryFn"}),", ",e.jsx("code",{children:"onInsert"}),", ",e.jsx("code",{children:"onUpdate"}),", and"," ",e.jsx("code",{children:"onDelete"})," callbacks expected by"," ",e.jsx("code",{children:"realtimeCollectionOptions"}),". It unwraps"," ",e.jsx("code",{children:"transaction.mutations[0].modified"})," internally so your server functions receive a plain ",e.jsx("code",{children:"{ data: T }"})," argument."]}),e.jsxs("p",{children:["The broadcast path is automatic: when ",e.jsx("code",{children:"onInsert"})," or"," ",e.jsx("code",{children:"onUpdate"})," returns a value, the library publishes it to the channel. Every connected client — on every tab, every device — receives the Drizzle-confirmed row."]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Server authority without extra plumbing."})," The Drizzle query result is the ground truth. You never call"," ",e.jsx("code",{children:"realtimePublish"})," by hand; returning the saved row from your server function is enough."]})}),e.jsx("h2",{id:"server-setup",children:"1. Server setup"}),e.jsxs("p",{children:["Two packages cooperate on the server."," ",e.jsx("code",{children:"@realtimejs/preset-start"})," owns the transport — the SSE handler, ",e.jsx("code",{children:"publish"}),", and auth. For the auto-reactive"," ",e.jsx("code",{children:"realtime.query()"})," / ",e.jsx("code",{children:"realtime.mutation()"})," layer below you also compose ",e.jsx("code",{children:"@realtimejs/reactive-drizzle"}),", the Drizzle/Postgres engine. Create both, wire them together, and re-export a single ",e.jsx("code",{children:"realtime"})," object the rest of the app imports."]}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { createReactiveQueries } from '@realtimejs/reactive-drizzle'
import { getSession } from './auth'

// 1. Create the reactive engine first — the handler needs its onChannelEmpty.
const reactive = createReactiveQueries()

// 2. Create the transport handler (auth optional — add it any time).
const handler = createStartHandler({
  onChannelEmpty: reactive.onChannelEmpty,
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
  authorize: async (userId, channel) => ({
    subscribe: !!userId,
    publish: !!userId,  // clients publish mutation results back to the channel
    presence: true,
  }),
})

// 3. Wire the handler's publish back into the engine so invalidations fan out.
reactive.bindPublish(handler.publish)

// 4. Re-export one object — \`realtime.handle\` for the route,
//    \`realtime.query\`/\`realtime.mutation\` for your server functions.
export const realtime = {
  handle: handler.handle,
  publish: handler.publish,
  query: reactive.query,
  mutation: reactive.mutation,
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsxs("strong",{children:[e.jsx("code",{children:"query"}),"/",e.jsx("code",{children:"mutation"})," are not on the handler."]})," ",e.jsx("code",{children:"createStartHandler"})," returns"," ",e.jsx("code",{children:"{ handle, publish, createStream, dispose }"})," — the reactive wrappers come from ",e.jsx("code",{children:"createReactiveQueries()"}),". The composed ",e.jsx("code",{children:"realtime"})," object above is the only thing the rest of the app sees. If your stack isn’t Drizzle/Postgres, skip"," ",e.jsx("code",{children:"@realtimejs/reactive-drizzle"})," and use the REST collection pattern (steps 3–6) instead. See"," ",e.jsx("a",{href:"#/docs/getting-started",children:"Getting Started"})," for the same wiring."]})}),e.jsx(u,{title:"app/routes/api/realtime.ts",code:`import { createAPIFileRoute } from '@tanstack/start/api'
import { realtime } from '../../server/realtime'

export const Route = createAPIFileRoute('/api/realtime')({
  GET:     ({ request }) => realtime.handle(request),
  POST:    ({ request }) => realtime.handle(request),
  OPTIONS: ({ request }) => realtime.handle(request),
})`}),e.jsx("h2",{id:"client-setup",children:"2. Client setup"}),e.jsxs("p",{children:["Pair the SSE handler with ",e.jsx("code",{children:"sseTransport"})," on the client. Wrap your app with ",e.jsx("code",{children:"RealtimeProvider"}),"."]}),e.jsx(u,{title:"app/client/realtime.ts",code:`import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

export const realtimeClient = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})`}),e.jsx(u,{title:"app/root.tsx",code:`import { RealtimeProvider } from '@realtimejs/react'
import { realtimeClient } from './client/realtime'

export function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <RouterProvider router={router} />
    </RealtimeProvider>
  )
}`}),e.jsx("h2",{id:"schema",children:"3. Drizzle schema"}),e.jsx("p",{children:"Define your table and export the inferred types. The server functions and the collection both use these types — no manual interface needed."}),e.jsx(u,{title:"db/schema.ts",code:`import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id:        text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title:     text('title').notNull(),
  done:      boolean('done').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Todo    = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert`}),e.jsx("h2",{id:"server-functions",children:"4. Server functions"}),e.jsxs("p",{children:["TanStack Start's bundler plugin requires ",e.jsx("code",{children:"createServerFn"})," ","calls to appear at module level — they cannot be created dynamically inside a factory. Define all four here; per-request filtering (e.g."," ",e.jsx("code",{children:"projectId"}),") is passed through ",e.jsx("code",{children:"data"}),"."]}),e.jsx(u,{title:"app/server/todos.ts",code:`import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos, type Todo, type NewTodo } from '../../db/schema'

export const fetchTodos = createServerFn()
  .handler(({ data }: { data: { projectId: string } }) =>
    db.select().from(todos).where(eq(todos.projectId, data.projectId))
  )

export const createTodo = createServerFn({ method: 'POST' })
  .handler(({ data }: { data: NewTodo }) =>
    db.insert(todos).values(data).returning().then((r) => r[0])
  )

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(({ data }: { data: Todo }) =>
    db.update(todos)
      .set(data)
      .where(eq(todos.id, data.id))
      .returning()
      .then((r) => r[0])
  )

export const deleteTodo = createServerFn({ method: 'POST' })
  .handler(({ data }: { data: Todo }) =>
    db.delete(todos).where(eq(todos.id, data.id))
  )`}),e.jsxs("p",{children:["Each write function returns the saved row directly from Drizzle's"," ",e.jsx("code",{children:".returning()"}),". That row becomes the broadcast payload — no extra shaping required."]}),e.jsx("h2",{id:"collection",children:"5. Collection"}),e.jsxs("p",{children:["Spread ",e.jsx("code",{children:"withServerFns"})," into"," ",e.jsx("code",{children:"realtimeCollectionOptions"}),". The ",e.jsx("code",{children:"query"})," option is a thunk that captures filter parameters via closure; ",e.jsx("code",{children:"insert"}),", ",e.jsx("code",{children:"update"}),", and ",e.jsx("code",{children:"delete"})," are passed through directly because they already accept ",e.jsx("code",{children:"{ data: T }"}),"."]}),e.jsx(u,{title:"app/features/todos/collection.ts",code:`import { withServerFns, realtimeCollectionOptions } from '@realtimejs/core'
import { realtimeClient } from '../../client/realtime'
import {
  fetchTodos, createTodo, updateTodo, deleteTodo,
} from '../../server/todos'

export const todosOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withServerFns({
      query:  () => fetchTodos({ data: { projectId } }),
      insert: createTodo,
      update: updateTodo,
      delete: deleteTodo,
    }),
    client:  realtimeClient,
    channel: ['todos', { projectId }],
  })`}),e.jsxs("p",{children:[e.jsx("code",{children:"getKey"})," defaults to ",e.jsx("code",{children:"(item) => item.id"}),". Pass it explicitly if your primary key field has a different name or is a number:"]}),e.jsx(u,{code:`...withServerFns({
  // ...
  getKey: (t) => t.todoId,   // override when field isn't 'id'
})`}),e.jsx("h2",{id:"component",children:"6. Component"}),e.jsxs("p",{children:["Create a collection with ",e.jsx("code",{children:"createCollection"})," (memoized so it is stable across renders), then read it reactively with"," ",e.jsx("code",{children:"useCollection"}),". Trigger writes by calling"," ",e.jsx("code",{children:"collection.insert()"}),", ",e.jsx("code",{children:"collection.update()"}),", or"," ",e.jsx("code",{children:"collection.delete()"})," directly — TanStack DB creates a transaction, calls the ",e.jsx("code",{children:"onInsert"})," / ",e.jsx("code",{children:"onUpdate"})," /"," ",e.jsx("code",{children:"onDelete"})," callback wired by ",e.jsx("code",{children:"withServerFns"}),", and the auto-broadcast propagates the confirmed row to every subscriber."]}),e.jsx(u,{title:"app/features/todos/TodoList.tsx",code:`import { createCollection } from '@tanstack/db'
import { useCollection } from '@tanstack/react-db'
import { useMemo } from 'react'
import { todosOptions } from './collection'

export function TodoList({ projectId }: { projectId: string }) {
  const collection = useMemo(
    () => createCollection(todosOptions(projectId)),
    [projectId],
  )
  const todos = useCollection(collection)

  const addTodo = () =>
    collection.insert({
      id:        crypto.randomUUID(),
      projectId,
      title:     'New todo',
      done:      false,
      createdAt: new Date(),
    })

  return (
    <>
      <button onClick={addTodo}>Add todo</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  )
}
// Every client updates the instant a todo is added, changed, or removed.`}),e.jsx("h2",{id:"broadcast",children:"How broadcast works"}),e.jsxs("div",{className:"doc-callout",children:[e.jsxs("p",{children:["When ",e.jsx("code",{children:"onInsert"})," or ",e.jsx("code",{children:"onUpdate"})," returns a value,"," ",e.jsx("code",{children:"realtimeCollectionOptions"})," calls"," ",e.jsx("code",{children:"client.publish()"})," with the result — the originating browser tab sends the Drizzle-confirmed row to the channel. All subscribers receive it and update their local state. This is why"," ",e.jsx("code",{children:"authorize.publish"})," must be ",e.jsx("code",{children:"true"})," for authenticated users."]}),e.jsxs("p",{children:[e.jsx("code",{children:"onDelete"})," follows the same path; the originating client publishes a ",e.jsx("code",{children:"delete"})," action so all subscribers remove the row from their local state."]})]}),e.jsx("h2",{id:"server-authoritative",children:"Server-authoritative mode"}),e.jsxs("p",{children:["The pattern above uses ",e.jsx("em",{children:"auto-broadcast"}),": the returned Drizzle row is the broadcast payload. This is the recommended approach."]}),e.jsxs("p",{children:["If you need to call ",e.jsx("code",{children:"realtime.publish()"})," yourself inside a server function (for example, to fan out to a different channel or to attach extra metadata), add ",e.jsx("code",{children:"serverAuthoritative: true"})," to prevent a duplicate broadcast:"]}),e.jsx(u,{code:`realtimeCollectionOptions({
  ...withServerFns({ query, insert, update, delete: deleteTodo }),
  serverAuthoritative: true,   // suppress auto-broadcast; server publishes manually
  client: realtimeClient,
  channel: ['todos', { projectId }],
})`}),e.jsx(u,{title:"app/server/todos.ts (manual publish variant)",code:`import { realtime } from '../realtime'

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: Todo }) => {
    const updated = await db.update(todos)
      .set(data)
      .where(eq(todos.id, data.id))
      .returning()
      .then((r) => r[0])

    // Publish to a second channel that aggregates all project activity
    await realtime.publish(['activity', { projectId: data.projectId }], {
      action: 'update',
      data:   updated,
    })

    // Also publish the primary channel explicitly (required with serverAuthoritative)
    await realtime.publish(['todos', { projectId: data.projectId }], {
      action: 'update',
      data:   updated,
    })
    return updated
  })`}),e.jsx("h2",{id:"scaling",children:"Scaling to multiple processes"}),e.jsxs("p",{children:["For horizontally-scaled deployments (multiple Node.js processes or serverless functions), add a ",e.jsx("code",{children:"PublishBackend"})," so every instance fans out messages to its own SSE connections."]}),e.jsx(u,{title:"app/server/realtime.ts (Redis backend)",code:`import { createStartHandler, type PublishBackend } from '@realtimejs/preset-start'
import { createReactiveQueries } from '@realtimejs/reactive-drizzle'
import Redis from 'ioredis'

const pub = new Redis(process.env.REDIS_URL!)
const sub = new Redis(process.env.REDIS_URL!)

const backend: PublishBackend = {
  async publish(channel, data) {
    await pub.publish('rt', JSON.stringify({ channel, data }))
  },
  subscribe(onMessage) {
    void sub.subscribe('rt')
    sub.on('message', (_ch, msg) => {
      const { channel, data } = JSON.parse(msg) as { channel: string; data: unknown }
      onMessage(channel, data)
    })
    return () => { void sub.unsubscribe('rt') }
  },
}

// Same composition as above — the only change is the \`backend\` option.
const reactive = createReactiveQueries()
const handler = createStartHandler({
  backend,
  getUser,
  authorize,
  onChannelEmpty: reactive.onChannelEmpty,
})
reactive.bindPublish(handler.publish)

export const realtime = {
  handle: handler.handle,
  publish: handler.publish,
  query: reactive.query,
  mutation: reactive.mutation,
}`}),e.jsx("p",{children:"No changes needed in the server functions or the collection — the backend is transparent to the rest of the stack."}),e.jsx("h2",{id:"reactive-query",children:"realtime.query()"}),e.jsxs("p",{children:[e.jsx("code",{children:"realtime.query(fn)"})," wraps a server query function and returns a ",e.jsx("code",{children:"ReactiveQueryFn"})," — a branded callable that carries TypeScript phantom type fields so the client-side"," ",e.jsx("a",{href:"#/docs/reactive-queries",children:"reactive query hooks"})," can infer"," ",e.jsx("code",{children:"TArgs"})," and ",e.jsx("code",{children:"TResult"})," without explicit generics. Channels are derived automatically from the SQL WHERE clause."]}),e.jsx(u,{title:"app/server/todos.ts",code:`import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'
import { realtime } from '../realtime'

export const getTodos = realtime.query(
  async ({ teamId }: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, teamId))
)

export const fetchTodos = createServerFn().handler(getTodos)`}),e.jsx("h2",{id:"reactive-mutation",children:"realtime.mutation()"}),e.jsxs("p",{children:[e.jsx("code",{children:"realtime.mutation(fn)"})," wraps a write operation and returns a"," ",e.jsx("code",{children:"ReactiveMutationFn"}),". After the mutation completes, it captures which rows were written and publishes a single batch invalidation message to all affected query subscribers."]}),e.jsx(u,{title:"app/server/todos.ts (continued)",code:`export const createTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db
      .insert(todos)
      .values({ teamId, title, done: false })
      .returning()
    return todo
  }
)

export const addTodo = createServerFn().handler(createTodo)`}),e.jsx("p",{children:"The channel name is derived automatically from the query arguments, so different argument values subscribe to different channels. You never need to define a channel key manually."}),e.jsxs("p",{children:["See ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," for the complete client-side usage guide."]})]})}function Ej(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Rich Text Collaboration"}),e.jsx("p",{className:"doc-lead",children:"realtime.js's field-level CRDTs handle structured data (forms, settings, counters). For character-level rich text editing — Google Docs-style — pair realtime.js as the transport with Y.js as the CRDT engine."}),e.jsxs("div",{className:"doc-callout",children:[e.jsx("strong",{children:"No built-in Y.js adapter."})," realtime.js does not ship a"," ",e.jsx("code",{children:"withYjs"})," adapter or a packaged Y.js provider. This is the manual integration pattern: you run Y.js’s own update and awareness messages over a realtime.js channel using"," ",e.jsx("code",{children:"client.subscribe"})," / ",e.jsx("code",{children:"client.publish"}),". realtime.js owns transport, reconnection, auth, and presence; Y.js owns the text CRDT. The ",e.jsx("code",{children:"RealtimeYjsProvider"})," below is roughly 40 lines you copy into your app — not an installable package."]}),e.jsx("h2",{id:"when",children:"When to use Y.js vs field CRDTs"}),e.jsx("p",{children:"realtime.js ships three built-in CRDT field types. They cover the vast majority of structured, field-level collaboration. Y.js (or Automerge) is only needed when you require character-level concurrent editing inside a single text value."}),e.jsxs("div",{className:"doc-grid",children:[e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"Field CRDTs (built-in)"}),e.jsxs("p",{children:[e.jsx("code",{children:"lww"}),", ",e.jsx("code",{children:"pn-counter"}),", ",e.jsx("code",{children:"or-set"})," ","— structured data, forms, counters, tag sets. Zero dependencies, included in ",e.jsx("code",{children:"@realtimejs/core"}),"."]})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"Y.js / Automerge"}),e.jsx("p",{children:"Rich text, nested documents, character-level concurrent editing. External dependency, larger bundle (~20-40 kB gzipped)."})]})]}),e.jsxs("table",{className:"doc-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Use case"}),e.jsx("th",{children:"Recommended approach"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Rename a document title"}),e.jsxs("td",{children:[e.jsx("code",{children:"lww"})," field"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Upvote / downvote counter"}),e.jsxs("td",{children:[e.jsx("code",{children:"pn-counter"})," field"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Tag or label set"}),e.jsxs("td",{children:[e.jsx("code",{children:"or-set"})," field"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Collaborative rich text editor"}),e.jsx("td",{children:"Y.js + realtime.js transport"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Collaborative code editor"}),e.jsx("td",{children:"Y.js + realtime.js transport"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Shared whiteboard / drawing"}),e.jsx("td",{children:"Y.js + realtime.js transport"})]})]})]}),e.jsx("h2",{id:"architecture",children:"Architecture"}),e.jsx("p",{children:"The integration follows a clean separation of concerns. Each layer does one thing well:"}),e.jsxs("div",{className:"doc-grid",children:[e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"realtime.js"}),e.jsxs("p",{children:["Handles transport (WebSocket/SSE), presence, reconnection, auth, and multi-tab coordination. Provides ",e.jsx("code",{children:"subscribe"})," and"," ",e.jsx("code",{children:"publish"})," on named channels."]})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"Y.js"}),e.jsx("p",{children:"Handles the text CRDT, awareness protocol, undo manager, and conflict-free merging of concurrent character-level edits."})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"Custom provider (the glue)"}),e.jsxs("p",{children:["A Y.js provider that bridges ",e.jsx("code",{children:"Y.Doc"})," updates to realtime.js channels. On local edit, publish the update. On channel message, apply it to the doc."]})]})]}),e.jsx(u,{title:"Architecture overview",code:`// Data flow:
//
//   Editor (Tiptap, ProseMirror, Monaco, etc.)
//     |
//     v
//   Y.Doc  -- local edits --> doc.on('update') --> client.publish(channel, update)
//     ^                                                  |
//     |                                                  v
//   Y.applyUpdate(doc, update) <-- client.subscribe(channel, onMessage)
//     ^
//     |
//   Remote edits from other clients`}),e.jsx("h2",{id:"setup",children:"Step-by-step setup"}),e.jsx("h3",{children:"1. Install dependencies"}),e.jsx(u,{code:"npm install yjs y-protocols @realtimejs/core"}),e.jsx("h3",{children:"2. Create a Y.js document"}),e.jsx(u,{code:`import * as Y from 'yjs'

const ydoc = new Y.Doc()
const yText = ydoc.getText('shared-text')`}),e.jsx("h3",{children:"3. Create a realtime.js provider for Y.js"}),e.jsx("p",{children:"The provider bridges Y.js document updates to realtime.js's pub/sub channels. When the local Y.Doc changes, it publishes the binary update to a channel. When a message arrives from the channel, it applies the update to the local Y.Doc."}),e.jsx(u,{title:"realtime-yjs-provider.ts",code:`import * as Y from 'yjs'
import type { RealtimeClient } from '@realtimejs/core'

export class RealtimeYjsProvider {
  private unsubscribe: (() => void) | null = null
  private updateHandler: ((update: Uint8Array, origin: unknown) => void) | null = null

  constructor(
    private client: RealtimeClient,
    private channel: string,
    private doc: Y.Doc,
  ) {}

  /** Start syncing. Call once after the client is connected. */
  connect() {
    // 1. Listen for remote updates from the channel
    this.unsubscribe = this.client.subscribe<{ update: Array<number> }>(
      this.channel,
      (message) => {
        const update = new Uint8Array(message.update)
        // Apply with a non-self origin so the handler below ignores it
        Y.applyUpdate(this.doc, update, 'remote')
      },
    )

    // 2. Publish local updates to the channel
    this.updateHandler = (update: Uint8Array, origin: unknown) => {
      // Only publish updates that originated locally (not from remote apply)
      if (origin === 'remote') return
      this.client.publish(this.channel, {
        update: Array.from(update),
      })
    }
    this.doc.on('update', this.updateHandler)
  }

  /** Stop syncing and clean up listeners. */
  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    if (this.updateHandler) {
      this.doc.off('update', this.updateHandler)
      this.updateHandler = null
    }
  }
}`}),e.jsx("h3",{children:"4. Wire it up"}),e.jsx(u,{title:"app.ts",code:`import * as Y from 'yjs'
import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'
import { RealtimeYjsProvider } from './realtime-yjs-provider'

// Create the realtime.js client
const client = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})

// Create the Y.js document
const ydoc = new Y.Doc()
const yText = ydoc.getText('shared-editor')

// Bridge them together
const provider = new RealtimeYjsProvider(client, 'doc:my-document', ydoc)

// Connect
await client.connect()
provider.connect()

// Now any editor bound to yText will sync through realtime.js.
// For example, with Tiptap:
//
//   import { Editor } from '@tiptap/core'
//   import Collaboration from '@tiptap/extension-collaboration'
//
//   const editor = new Editor({
//     extensions: [
//       Collaboration.configure({ document: ydoc }),
//     ],
//   })`}),e.jsx("h2",{id:"awareness",children:"Cursor sharing via Y.js Awareness + realtime.js Presence"}),e.jsx("p",{children:"Collaborative editors show remote cursors and selections. Y.js provides an Awareness protocol for this, and realtime.js provides Presence. They serve complementary roles:"}),e.jsxs("div",{className:"doc-grid",children:[e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"Y.js Awareness"}),e.jsxs("p",{children:["Tracks cursor position and selection ",e.jsx("strong",{children:"inside"})," the document. Updated on every keystroke. Editors like Tiptap and ProseMirror consume awareness state directly."]})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"realtime.js Presence"}),e.jsx("p",{children:'Tracks user identity, display name, color, and online status. Updated infrequently. Use for the collaborator list, avatars, and "who is viewing" indicators.'})]})]}),e.jsx(u,{title:"awareness-bridge.ts",code:`import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from 'y-protocols/awareness'
import type { RealtimeClient } from '@realtimejs/core'
import type * as Y from 'yjs'

/**
 * Bridge Y.js Awareness updates through realtime.js channels,
 * while using realtime.js Presence for user metadata.
 */
export function setupAwareness(
  client: RealtimeClient,
  doc: Y.Doc,
  channel: string,
  user: { name: string; color: string },
) {
  const awareness = new Awareness(doc)

  // Set local awareness state (cursor, selection, user info)
  awareness.setLocalState({
    user,
    cursor: null,
    selection: null,
  })

  // Publish awareness updates through the channel
  awareness.on('update', ({ added, updated, removed }: {
    added: Array<number>
    updated: Array<number>
    removed: Array<number>
  }) => {
    const changedClients = added.concat(updated, removed)
    const update = encodeAwarenessUpdate(awareness, changedClients)
    client.publish(channel + ':awareness', {
      update: Array.from(update),
    })
  })

  // Apply remote awareness updates
  const unsub = client.subscribe<{ update: Array<number> }>(
    channel + ':awareness',
    (message) => {
      applyAwarenessUpdate(
        awareness,
        new Uint8Array(message.update),
        'remote',
      )
    },
  )

  // Use realtime.js Presence for user-level metadata
  client.joinPresence(channel, {
    name: user.name,
    color: user.color,
    status: 'editing',
  })

  return {
    awareness,
    destroy() {
      unsub()
      client.leavePresence(channel)
      awareness.destroy()
    },
  }
}`}),e.jsxs("div",{className:"doc-callout",children:[e.jsx("strong",{children:"Transport requirement."})," The ",e.jsx("code",{children:"joinPresence"})," ","and ",e.jsx("code",{children:"leavePresence"})," methods are only available on transports that implement the ",e.jsx("code",{children:"PresenceCapable"})," interface (e.g."," ",e.jsx("code",{children:"centrifugoTransport"}),"). If your transport does not support presence natively (e.g. ",e.jsx("code",{children:"sseTransport"}),"), omit the presence calls and rely solely on Y.js Awareness for cursor sharing, or use realtime.js’s ",e.jsx("code",{children:"createPresenceChannel"})," with a separate pub/sub channel instead."]}),e.jsx("p",{children:"With this setup, the editor renders remote cursors from Y.js Awareness (keystroke-level updates), while the UI sidebar shows collaborator names and colors from realtime.js Presence (infrequent, higher-level metadata)."}),e.jsx("h2",{id:"undo",children:"Undo with Y.UndoManager"}),e.jsx("p",{children:"Y.js tracks operations per-client, enabling proper collaborative undo. When Client A undoes, only their own changes are reversed — Client B's edits are preserved."}),e.jsx(u,{code:`import * as Y from 'yjs'

const ydoc = new Y.Doc()
const yText = ydoc.getText('shared-editor')

// Create an undo manager scoped to yText
const undoManager = new Y.UndoManager(yText)

// Undo the last local operation
undoManager.undo()

// Redo the last undone operation
undoManager.redo()

// Wire to keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'z') {
    e.preventDefault()
    if (e.shiftKey) undoManager.redo()
    else undoManager.undo()
  }
})`}),e.jsxs("div",{className:"doc-callout",children:[e.jsx("strong",{children:"Production considerations."})," This guide shows the integration pattern. For a production implementation, also consider: initial document state loading, persistence, conflict-free reconnection, and document garbage collection."]})]})}function Aj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Authentication"}),e.jsx("p",{className:"doc-lead",children:"Authentication is the first thing you configure when moving to production. realtime.js validates every connection and every action — subscribe, publish, presence — so only authorized users reach your channels."}),e.jsxs("div",{className:"doc-callout",children:[e.jsx("p",{children:"Auth in realtime.js is split into two layers:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Server-side"})," — ",e.jsx("code",{children:"getUser"})," identifies who is connecting; ",e.jsx("code",{children:"authorize"})," decides what they can do per channel."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Client-side"})," — ",e.jsx("code",{children:"getToken"})," supplies credentials with every request so the server can verify identity."]})]})]}),e.jsxs("h2",{id:"server-getuser",children:["Server-side: ",e.jsx("code",{children:"getUser"})]}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"getUser"})," callback receives the raw ",e.jsx("code",{children:"Request"})," ","object and returns either ",e.jsx("code",{children:"{ userId: string }"})," or"," ",e.jsx("code",{children:"null"}),". It is called on ",e.jsx("strong",{children:"every"})," HTTP request — both the initial GET that opens the SSE stream and every subsequent POST action (subscribe, publish, unsubscribe)."]}),e.jsxs("p",{children:["When ",e.jsx("code",{children:"getUser"})," returns ",e.jsx("code",{children:"null"})," or"," ",e.jsx("code",{children:"undefined"}),", the handler immediately responds with"," ",e.jsx("strong",{children:"401 Unauthorized"}),". No connection is opened, no action is processed."]}),e.jsxs("p",{children:["When ",e.jsx("code",{children:"getUser"})," is omitted entirely, every request is treated as authenticated with ",e.jsx("code",{children:"userId: 'anonymous'"}),". This is convenient for development but should never be used in production."]}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { verifyJwt } from './auth'

export const realtime = createStartHandler({
  // Extract the user from a Bearer JWT
  getUser: async (req) => {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const { sub } = await verifyJwt(auth.slice(7), process.env.JWT_SECRET!)
      return { userId: sub }
    } catch {
      return null   // invalid or expired token → 401
    }
  },
})`}),e.jsxs("h2",{id:"server-authorize",children:["Server-side: ",e.jsx("code",{children:"authorize"})]}),e.jsxs("p",{children:["Once the user is authenticated, the ",e.jsx("code",{children:"authorize"})," callback decides whether the action is allowed on the requested channel. When it denies access, the handler responds with ",e.jsx("strong",{children:"403 Forbidden"}),". When ",e.jsx("code",{children:"authorize"})," is omitted, all authenticated users are permitted on all channels."]}),e.jsxs("p",{children:["Pass the ",e.jsx("code",{children:"AuthorizeFn"})," from ",e.jsx("code",{children:"@realtimejs/core"})," ","— it works across ",e.jsx("strong",{children:"all presets"})," (",e.jsx("code",{children:"createSseHandler"})," and ",e.jsx("code",{children:"createStartHandler"}),"). See the ",e.jsx("a",{href:"#unified-authorize",children:"unified AuthorizeFn"})," section below for the full signature."]}),e.jsxs("h2",{id:"unified-authorize",children:["Unified ",e.jsx("code",{children:"AuthorizeFn"})]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Recommended:"})," The ",e.jsx("code",{children:"AuthorizeFn"})," signature from ",e.jsx("code",{children:"@realtimejs/core"})," works across"," ",e.jsx("strong",{children:"all presets"})," — ",e.jsx("code",{children:"createSseHandler"})," and"," ",e.jsx("code",{children:"createStartHandler"}),". Write one authorize function and use it everywhere."]})}),e.jsxs("p",{children:["The unified signature receives the user ID and a parsed channel, and returns either a ",e.jsx("code",{children:"ChannelPermissions"})," object for fine-grained control or a plain ",e.jsx("code",{children:"boolean"})," as shorthand for all-or-nothing access:"]}),e.jsx(u,{title:"Signature",code:`type AuthorizeFn = (
  userId: string,
  channel: ParsedChannel,  // { namespace, params, raw }
) => ChannelPermissions | boolean | Promise<ChannelPermissions | boolean>

interface ChannelPermissions {
  subscribe: boolean
  publish: boolean
  presence: boolean
}`}),e.jsxs("p",{children:["When you return a boolean, it is expanded to all-or-nothing permissions via ",e.jsx("code",{children:"normalizePermissions"}),": ",e.jsx("code",{children:"true"})," becomes"," ",e.jsx("code",{children:"{ subscribe: true, publish: true, presence: true }"})," and"," ",e.jsx("code",{children:"false"})," denies everything."]}),e.jsx(u,{title:"app/server/authorize.ts",code:`import type { AuthorizeFn, ChannelPermissions } from '@realtimejs/core'
import { db } from './db'

export const authorize: AuthorizeFn = async (
  userId,
  channel,   // ParsedChannel: { namespace, params, raw }
): Promise<ChannelPermissions> => {
  switch (channel.namespace) {
    case 'todos': {
      const member = await db.query.projectMembers.findFirst({
        where: (m, { and, eq }) =>
          and(
            eq(m.userId, userId),
            eq(m.projectId, channel.params.projectId),
          ),
      })
      return member
        ? { subscribe: true, publish: true, presence: true }
        : { subscribe: false, publish: false, presence: false }
    }
    case 'announcements':
      // Public read-only channel — everyone can subscribe, only admins publish
      return {
        subscribe: true,
        publish: userId === 'admin',
        presence: false,
      }
    default:
      return { subscribe: false, publish: false, presence: false }
  }
}`}),e.jsx("p",{children:"Because the same function works everywhere, you can share it between your SSE handler and the Start preset without any adapters:"}),e.jsx(u,{title:"Shared across presets",code:`import { authorize } from './authorize'

// TanStack Start
const startHandler = createStartHandler({ getUser, authorize })

// Standalone SSE handler
const sseHandler = createSseHandler({ getUser, authorize })`}),e.jsx("h2",{id:"client-token",children:"Client-side: token auth"}),e.jsxs("p",{children:["On the client, pass a ",e.jsx("code",{children:"getToken"})," function to your transport. For SSE, the token is sent as an ",e.jsx("code",{children:"Authorization: Bearer"})," ","header on every request (both GET stream and POST actions)."]}),e.jsx(u,{title:"app/client/realtime.ts",code:`import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

export const realtimeClient = createRealtimeClient({
  transport: sseTransport({
    url: '/api/realtime',
    // Called lazily: once when opening the SSE stream, then before each POST action
    getToken: async () => {
      const session = await fetch('/api/auth/session')
      const { accessToken } = await session.json()
      return accessToken
    },
  }),
})`}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"getToken"})," function is called lazily — once when opening the SSE stream and then before each POST action. This means short-lived tokens are re-validated on every action without any extra configuration."]}),e.jsx("h2",{id:"token-refresh",children:"Token refresh"}),e.jsx("p",{children:"How token refresh works depends on the transport:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"SSE"})," — ",e.jsx("code",{children:"getToken"})," is called on every request (GET to open the stream, POST for subscribe/publish actions). If a token expires mid-session, the next POST action will call"," ",e.jsx("code",{children:"getToken"})," again and receive a fresh token automatically. When the stream itself disconnects and reconnects, a fresh token is fetched for the new GET request."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"WebSocket (Centrifugo)"})," — the token is sent once during the ",e.jsx("code",{children:"connect"})," command. The Centrifugo adapter does not currently implement mid-session token refresh; if the token expires, the connection must be closed and re-opened. The transport handles this automatically on reconnect by calling the"," ",e.jsx("code",{children:"token"})," function again."]})]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Practical advice:"})," If your JWT has a short TTL (e.g. 5 minutes), SSE is simpler because every request re-authenticates. With Centrifugo, set a generous connection token TTL or use subscription tokens (which are validated per-channel)."]})}),e.jsx("h2",{id:"centrifugo-tokens",children:"Centrifugo tokens"}),e.jsx("p",{children:"Centrifugo uses JWT-based auth with two types of tokens:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Connection token"})," — authenticates the WebSocket connection itself. Passed via the ",e.jsx("code",{children:"token"})," option. It contains the user's ",e.jsx("code",{children:"sub"})," (subject) claim and an expiration."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Subscription token"})," — authorizes access to a specific channel. Issued by your server for each channel the client wants to subscribe to. Centrifugo validates this token before allowing the subscription."]})]}),e.jsx(u,{title:"app/client/realtime.ts — Centrifugo",code:`import { createRealtimeClient } from '@realtimejs/core'
import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'

export const realtimeClient = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'wss://realtime.example.com/connection/websocket',
    // Connection token — fetched once per (re)connect
    token: async () => {
      const res = await fetch('/api/realtime/connection-token')
      const { token } = await res.json()
      return token
    },
  }),
})`}),e.jsx(u,{title:"app/routes/api/realtime/connection-token.ts — server",code:`import jwt from 'jsonwebtoken'
import { getSession } from '../../../server/auth'

// Endpoint that issues Centrifugo connection JWTs
export async function GET({ request }: { request: Request }) {
  const session = await getSession(request)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const token = jwt.sign(
    { sub: session.userId },
    process.env.CENTRIFUGO_TOKEN_SECRET!,
    { expiresIn: '1h' },
  )

  return Response.json({ token })
}`}),e.jsx("p",{children:"For channels that require per-channel authorization, configure Centrifugo to require subscription tokens and create a server endpoint that issues them after checking the user's permissions."}),e.jsxs("h2",{id:"validate-publish",children:["Server-side validation: ",e.jsx("code",{children:"ValidatePublishFn"})]}),e.jsxs("p",{children:["Authorization controls ",e.jsx("em",{children:"who"})," can publish. Validation controls"," ",e.jsx("em",{children:"what"})," they can publish. The ",e.jsx("code",{children:"ValidatePublishFn"})," hook runs server-side before a message is broadcast and can accept, reject, or transform the payload."]}),e.jsxs("p",{children:["Return ",e.jsx("code",{children:"{ accepted: true }"})," to allow,"," ",e.jsx("code",{children:"{ accepted: true, data: transformed }"})," to allow with a modified payload, or ",e.jsx("code",{children:"{ accepted: false, reason: '...' }"})," ","to reject. Rejected publishes throw a"," ",e.jsx("code",{children:"PublishValidationError"}),"."]}),e.jsx(u,{title:"app/server/realtime.ts — Zod validation",code:`import { createValidatedPublish, serializeKey } from '@realtimejs/core'
import { z } from 'zod'

const todoSchema = z.object({
  action: z.enum(['insert', 'update', 'delete']),
  data: z.object({
    id: z.string().uuid(),
    title: z.string().max(200),
    completed: z.boolean(),
  }),
})

const cursorSchema = z.object({
  x: z.number(),
  y: z.number(),
  userId: z.string(),
})

import { sseHandler } from './realtime.server'

const validatedPublish = createValidatedPublish({
  publish: (channel, data) => {
    sseHandler.broadcast(
      typeof channel === 'string' ? channel : serializeKey(channel),
      data,
    )
    return Promise.resolve()
  },
  validate: async ({ channel, data }) => {
    switch (channel.namespace) {
      case 'todos': {
        const result = todoSchema.safeParse(data)
        if (!result.success) {
          return { accepted: false, reason: result.error.message }
        }
        // Return the parsed data to strip unknown fields
        return { accepted: true, data: result.data }
      }
      case 'cursors': {
        const result = cursorSchema.safeParse(data)
        if (!result.success) {
          return { accepted: false, reason: 'Invalid cursor data' }
        }
        return { accepted: true }
      }
      default:
        return { accepted: false, reason: 'Unknown channel' }
    }
  },
})`}),e.jsx("h2",{id:"auth-failures",children:"What happens when auth fails"}),e.jsx("p",{children:"Auth failures surface differently depending on where they occur:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsxs("strong",{children:[e.jsx("code",{children:"getUser"})," returns null"]})," ","— the server responds with ",e.jsx("strong",{children:"401 Unauthorized"}),". For the initial GET request, no SSE stream is opened. For POST actions, the action is rejected."]}),e.jsxs("li",{children:[e.jsxs("strong",{children:[e.jsx("code",{children:"authorize"})," returns false"]})," ","— the server responds with ",e.jsx("strong",{children:"403 Forbidden"}),". The subscribe or publish action is rejected, but the SSE connection stays open for other channels."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Connection failure"})," — the SSE transport transitions to ",e.jsx("code",{children:"'reconnecting'"})," and retries with exponential back-off. Subscribe to the client's ",e.jsx("code",{children:"store"})," to observe connection state."]})]}),e.jsx(u,{title:"Observing connection state",code:`import { useStore } from '@tanstack/react-store'
import { realtimeClient } from './realtime'

function ConnectionStatus() {
  const { status } = useStore(realtimeClient.store)

  if (status === 'connected') return <span>Connected</span>
  if (status === 'reconnecting') return <span>Reconnecting...</span>
  if (status === 'connecting') return <span>Connecting...</span>
  return <span>Disconnected</span>
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Tip:"})," When a POST action fails with 401, the SSE transport logs a warning but does not automatically close the stream. If your token has expired, the next ",e.jsx("code",{children:"getToken"})," call (on the next action or reconnect) will fetch a fresh one."]})}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"CORS note:"})," The SSE handler defaults to"," ",e.jsx("code",{children:"Access-Control-Allow-Origin: '*'"})," for both the GET stream and POST actions. This is convenient for development but should be restricted to your application's origin in production deployments."]})}),e.jsx("h2",{id:"common-patterns",children:"Common patterns"}),e.jsx("h3",{children:"JWT with middleware"}),e.jsxs("p",{children:["The most common pattern: your auth middleware (e.g. Lucia, Auth.js, Clerk) sets a JWT or session cookie, and ",e.jsx("code",{children:"getUser"})," validates it."]}),e.jsx(u,{title:"JWT from Authorization header",code:`getUser: async (req) => {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const payload = await verifyJwt(auth.slice(7), JWT_SECRET)
    return { userId: payload.sub }
  } catch {
    return null
  }
}`}),e.jsx("h3",{children:"Session-based auth"}),e.jsxs("p",{children:["If your app uses HTTP-only session cookies, read the session directly in"," ",e.jsx("code",{children:"getUser"}),". No client-side ",e.jsx("code",{children:"getToken"})," is needed because the browser sends cookies automatically."]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Same-origin only:"})," Session/cookie-based auth only works when the SSE endpoint is on the same origin as the client. The SSE transport uses ",e.jsx("code",{children:"fetch()"})," without setting"," ",e.jsx("code",{children:"credentials: 'include'"}),", so cookies are not sent on cross-origin requests. If your realtime server is on a different origin, use token-based auth with ",e.jsx("code",{children:"getToken"})," instead."]})}),e.jsx(u,{title:"Session cookie",code:`import { getSession } from './auth'   // Lucia, Auth.js, etc.

// Server
const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
})

// Client — no getToken needed, cookies are sent automatically
const realtimeClient = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})`}),e.jsx("h3",{children:"API key auth"}),e.jsx("p",{children:"For server-to-server connections or internal services, an API key in a query parameter or header works well."}),e.jsx(u,{title:"API key from query param",code:`getUser: (req) => {
  const key = new URL(req.url).searchParams.get('apiKey')
  return key === process.env.INTERNAL_API_KEY
    ? { userId: 'service' }
    : null
}`}),e.jsx("h2",{id:"next-steps",children:"Next steps"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/getting-started",children:"Getting Started"})," — end-to-end setup including auth configuration"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/server-functions",children:"TanStack Start + Drizzle"})," — full-stack guide with server authority and conflict handling"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/transports",children:"Transports"})," — SSE vs. Centrifugo transport details and configuration"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/channels",children:"Channels & Pub/Sub"})," — channel namespacing and publish patterns"]})]})]})}function Nj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Scaling to Production"}),e.jsx("p",{className:"doc-lead",children:"A single server process works for development, but production needs fan-out across every instance behind your load balancer."}),e.jsx("h2",{id:"why",children:"Why you need this"}),e.jsxs("p",{children:["During development your app runs as a single Node.js process. Every WebSocket / SSE connection lives in the same memory space, so when you call ",e.jsx("code",{children:"publish()"})," the message reaches every subscriber instantly."]}),e.jsxs("p",{children:["In production you typically run multiple server instances behind a load balancer. Each instance only sees its own connections. A message published on ",e.jsx("strong",{children:"Server A"})," never reaches subscribers connected to ",e.jsx("strong",{children:"Server B"})," or ",e.jsx("strong",{children:"Server C"})," ","— unless you wire up a shared pub/sub backbone."]}),e.jsxs("p",{children:["That backbone is what the ",e.jsx("code",{children:"PublishBackend"})," interface provides. Plug in Redis, Postgres, or any message bus, and every server instance fans out to its local clients automatically."]}),e.jsx("h2",{id:"architecture",children:"Architecture overview"}),e.jsx("div",{className:"callout",children:e.jsx(u,{code:`                         ┌─────────────────┐
                         │  Load Balancer   │
                         └────┬───┬───┬─────┘
                              │   │   │
               ┌──────────────┤   │   ├──────────────┐
               │              │   │   │              │
          ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
          │Server 1 │   │Server 2 │   │Server 3 │
          │ (SSE)   │   │ (SSE)   │   │ (SSE)   │
          └────┬────┘   └────┬────┘   └────┬────┘
               │              │              │
               └──────┬───────┴───────┬──────┘
                      │               │
                 publish()      subscribe()
                      │               │
               ┌──────▼───────────────▼──────┐
               │    PublishBackend (Redis)    │
               │    PUBLISH  ←→  SUBSCRIBE   │
               └─────────────────────────────┘

  Server 2 publishes → Redis → Servers 1, 2, 3 broadcast
  to their own local SSE connections.`})}),e.jsx("h2",{id:"publish-backend-interface",children:"The PublishBackend interface"}),e.jsxs("p",{children:["The interface lives in ",e.jsx("code",{children:"@realtimejs/preset-start"})," and has exactly two methods. ",e.jsx("code",{children:"publish"})," is required;"," ",e.jsx("code",{children:"subscribe"})," is optional but needed for multi-process fan-out."]}),e.jsx(u,{code:`export interface PublishBackend {
  /**
   * Send a message to the shared store so every server
   * instance can forward it to local clients.
   */
  publish: (channel: string, data: unknown) => Promise<void>

  /**
   * Listen for messages arriving from the shared store.
   * Called once at startup. Return an unsubscribe function.
   *
   * When a message arrives, call onMessage(channel, data)
   * and the handler broadcasts it to local SSE connections.
   */
  subscribe?: (
    onMessage: (channel: string, data: unknown) => void,
  ) => () => void
}`}),e.jsx("h2",{id:"redis",children:"Redis PUBLISH/SUBSCRIBE"}),e.jsx("p",{children:"Redis pub/sub is the most common choice. You need two connections: one for publishing and one dedicated to subscribing (a Redis client in subscribe mode cannot issue other commands)."}),e.jsx(u,{title:"server/redis-backend.ts",code:`import Redis from 'ioredis'
import type { PublishBackend } from '@realtimejs/preset-start'

const pub = new Redis(process.env.REDIS_URL!)
const sub = new Redis(process.env.REDIS_URL!)

export const redisBackend: PublishBackend = {
  async publish(channel, data) {
    await pub.publish('realtime', JSON.stringify({ channel, data }))
  },

  subscribe(onMessage) {
    void sub.subscribe('realtime')
    sub.on('message', (_redisChannel, msg) => {
      const { channel, data } = JSON.parse(msg) as {
        channel: string
        data: unknown
      }
      onMessage(channel, data)
    })
    return () => {
      void sub.unsubscribe('realtime')
    }
  },
}`}),e.jsxs("p",{children:["Every server instance runs this same code. When Server 2 calls"," ",e.jsx("code",{children:"publish()"}),", the message goes to Redis. Redis pushes it to the ",e.jsx("code",{children:"subscribe"})," callback on Servers 1, 2, and 3. Each server then broadcasts to its own local SSE connections."]}),e.jsx("h2",{id:"postgres",children:"Postgres LISTEN/NOTIFY"}),e.jsx("p",{children:"If you already run Postgres and want to avoid adding Redis, Postgres LISTEN/NOTIFY works as a lightweight pub/sub channel. The payload limit is 8 KB per notification, which is plenty for most realtime events."}),e.jsx(u,{title:"server/pg-backend.ts",code:`import { Client } from 'pg'
import type { PublishBackend } from '@realtimejs/preset-start'

const pgPub = new Client(process.env.DATABASE_URL!)
const pgSub = new Client(process.env.DATABASE_URL!)

// Initialize connections. Call once at server startup.
async function initPgBackend() {
  await pgPub.connect()
  await pgSub.connect()
}
initPgBackend().catch((err) => {
  console.error('Failed to connect pg backend', err)
  process.exit(1)
})

export const pgBackend: PublishBackend = {
  async publish(channel, data) {
    const payload = JSON.stringify({ channel, data })
    await pgPub.query(\`SELECT pg_notify('realtime', $1)\`, [payload])
  },

  subscribe(onMessage) {
    pgSub.on('notification', (msg) => {
      if (msg.channel !== 'realtime' || !msg.payload) return
      const { channel, data } = JSON.parse(msg.payload) as {
        channel: string
        data: unknown
      }
      onMessage(channel, data)
    })
    void pgSub.query('LISTEN realtime')
    return () => {
      void pgSub.query('UNLISTEN realtime')
    }
  },
}`}),e.jsx("h2",{id:"pairing-start",children:"Pairing with createStartHandler"}),e.jsxs("p",{children:["Pass the backend as the ",e.jsx("code",{children:"backend"})," option. No other code changes are needed — server functions, collections, and streams all work identically."]}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { redisBackend } from './redis-backend'

export const realtime = createStartHandler({
  backend: redisBackend,
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
})

export const realtimePublish = realtime.publish`}),e.jsx("h2",{id:"pairing-sse",children:"Pairing with createSseHandler"}),e.jsxs("p",{children:["If you use the lower-level ",e.jsx("code",{children:"createSseHandler"})," directly (without the Start preset), you wire up the backend yourself. The pattern is the same — subscribe at startup, broadcast on incoming messages."]}),e.jsx(u,{title:"server/sse-with-backend.ts",code:`import { createSseHandler } from '@realtimejs/adapter-sse'
import { redisBackend } from './redis-backend'

const sse = createSseHandler({ getUser: validateToken })

// Wire up the backend: subscribe once at startup
const unsubscribe = redisBackend.subscribe?.((channel, data) => {
  sse.broadcast(channel, data)
})

// Publish through the backend instead of sse.broadcast()
export async function publish(channel: string, data: unknown) {
  await redisBackend.publish(channel, data)
}

// Clean up on shutdown
process.on('SIGTERM', () => {
  unsubscribe?.()
})`}),e.jsx("h2",{id:"centrifugo",children:"Centrifugo as an alternative"}),e.jsxs("p",{children:[e.jsx("a",{href:"https://centrifugal.dev",target:"_blank",rel:"noopener noreferrer",children:"Centrifugo"})," ","is a standalone WebSocket server that handles fan-out, presence, and gap recovery natively. When you use ",e.jsx("code",{children:"centrifugoTransport"})," on the client side and publish via the Centrifugo server API, there is"," ",e.jsx("strong",{children:"no need"})," for a ",e.jsx("code",{children:"PublishBackend"})," at all — Centrifugo itself is the shared backbone."]}),e.jsx(u,{code:`// Client — uses centrifugoTransport, no PublishBackend needed
import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'

const client = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'wss://rt.example.com/connection/websocket',
    token: getUserToken(),
  }),
})

// Server — publish via Centrifugo HTTP API
await fetch('http://centrifugo:8000/api/publish', {
  method: 'POST',
  headers: {
    Authorization: 'apikey ' + process.env.CENTRIFUGO_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    channel: 'todos:project-1',
    data: { action: 'update', data: updatedTodo },
  }),
})`}),e.jsx("p",{children:"This is the recommended path if you want built-in WebSocket scaling, presence tracking, and history recovery without managing any of it yourself."}),e.jsx("h2",{id:"durable-objects",children:"Cloudflare Durable Objects"}),e.jsx("p",{children:"Cloudflare Durable Objects sidestep the multi-process fan-out problem entirely. Each Durable Object is a single-threaded actor that handles all WebSocket connections for a given channel. Because there is only one instance responsible for each channel, there is no need to synchronize state across processes — every subscriber is connected to the same actor."}),e.jsxs("p",{children:["This means you do ",e.jsx("strong",{children:"not"})," need a"," ",e.jsx("code",{children:"PublishBackend"})," when using Durable Objects. Publishing is just a method call on the actor that already holds every connection."]}),e.jsx(u,{title:"src/realtime-do.ts (Cloudflare Worker)",code:`import { DurableObject } from 'cloudflare:workers'

export class RealtimeChannel extends DurableObject {
  private connections = new Set<WebSocket>()

  async fetch(request: Request) {
    const pair = new WebSocketPair()
    this.ctx.acceptWebSocket(pair[1])
    this.connections.add(pair[1])
    return new Response(null, { status: 101, webSocket: pair[0] })
  }

  webSocketClose(ws: WebSocket) {
    this.connections.delete(ws)
  }

  // Called from other Workers or via RPC — no backend needed
  async publish(data: unknown) {
    const msg = JSON.stringify(data)
    for (const ws of this.connections) {
      ws.send(msg)
    }
  }
}`}),e.jsxs("p",{children:["Each channel maps to its own Durable Object ID. Incoming requests are routed to the correct object via"," ",e.jsx("code",{children:"env.REALTIME.idFromName(channel)"}),". Because the DO is the single source of truth, fan-out is inherently consistent without any external pub/sub infrastructure."]}),e.jsx("h2",{id:"when",children:"When you need a PublishBackend"}),e.jsx("p",{children:"Not every deployment needs one. Here is the decision criteria:"}),e.jsxs("table",{className:"doc-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Scenario"}),e.jsx("th",{children:"PublishBackend needed?"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Single Node.js process (dev, small app)"}),e.jsx("td",{children:"No — in-process broadcast is sufficient"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Multiple server instances behind a load balancer"}),e.jsxs("td",{children:[e.jsx("strong",{children:"Yes"})," — messages must cross process boundaries"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Auto-scaling (Kubernetes, ECS, Fly.io)"}),e.jsxs("td",{children:[e.jsx("strong",{children:"Yes"})," — instances come and go dynamically"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Serverless functions (Vercel, Lambda)"}),e.jsxs("td",{children:[e.jsx("strong",{children:"Yes"})," — each invocation is isolated"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Centrifugo as the transport layer"}),e.jsx("td",{children:"No — Centrifugo handles fan-out natively"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Cloudflare Durable Objects (single actor per channel)"}),e.jsx("td",{children:"No — state lives in the Durable Object"})]})]})]}),e.jsx("h2",{id:"lifecycle-hooks",children:"Server lifecycle hooks"}),e.jsxs("p",{children:["All server constructors — ",e.jsx("code",{children:"createSseHandler"})," and"," ",e.jsx("code",{children:"createStartHandler"})," — accept optional lifecycle callbacks for observing connection and subscription events. These are fire-and-forget: errors inside callbacks are logged to"," ",e.jsx("code",{children:"console.error"})," but never propagate to clients."]}),e.jsx(u,{title:"Lifecycle hook signatures",code:`interface LifecycleHooks {
  onClientConnect?: (info: { connectionId: string; userId: string }) => void
  onClientDisconnect?: (info: { connectionId: string; userId: string }) => void
  onFirstSubscriber?: (channel: string) => void
  onChannelEmpty?: (channel: string) => void
}`}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"onClientConnect"})})," ","— fires after ",e.jsx("code",{children:"getUser"})," succeeds and the connection is ready."]}),e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"onClientDisconnect"})})," ","— fires when a client disconnects (WebSocket close or SSE stream cancel)."]}),e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"onFirstSubscriber"})})," ","— fires when the first subscriber joins a previously-empty channel. Useful for spinning up live queries or background tasks."]}),e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"onChannelEmpty"})})," ","— fires when the last subscriber leaves a channel. Useful for tearing down expensive resources."]})]}),e.jsx(u,{title:"Example: metrics + resource management",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { redisBackend } from './redis-backend'
import { metrics } from './metrics'
import { startLiveQuery, stopLiveQuery } from './live-queries'

export const realtime = createStartHandler({
  backend: redisBackend,
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },

  onClientConnect: ({ connectionId, userId }) => {
    metrics.increment('realtime.connections', { userId })
  },

  onClientDisconnect: ({ connectionId, userId }) => {
    metrics.decrement('realtime.connections', { userId })
  },

  onFirstSubscriber: (channel) => {
    // Spin up an expensive live query only when someone is listening
    startLiveQuery(channel)
  },

  onChannelEmpty: (channel) => {
    // Tear it down when the last subscriber leaves
    stopLiveQuery(channel)
  },
})`}),e.jsx("h2",{id:"summary",children:"Summary"}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"PublishBackend"})," interface is deliberately minimal: implement ",e.jsx("code",{children:"publish"})," and ",e.jsx("code",{children:"subscribe"}),", pass it as"," ",e.jsx("code",{children:"backend"}),", and the rest of your application code stays exactly the same. Redis and Postgres are the two most common choices, but any message bus that supports pub/sub semantics will work. If you prefer a fully managed solution, Centrifugo removes the need for a backend entirely. Lifecycle hooks give you visibility into connection and subscription events across all presets without modifying handler logic."]})]})}function Oj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Centrifugo Guide"}),e.jsx("p",{className:"doc-lead",children:"End-to-end walkthrough: run Centrifugo, wire up tokens, enable presence, publish from your server, and scale to multi-node with Redis."}),e.jsx("h2",{id:"what-is-centrifugo",children:"What is Centrifugo"}),e.jsxs("p",{children:[e.jsx("a",{href:"https://centrifugal.dev",target:"_blank",rel:"noopener",children:"Centrifugo"})," ","is a standalone, open-source real-time messaging server. Clients connect to it over WebSocket or SSE, and your application backend publishes messages through its HTTP or GRPC API. Because it handles both the persistent connections ",e.jsx("em",{children:"and"})," the fan-out across nodes, you do not need a separate ",e.jsx("code",{children:"PublishBackend"})," the way you would with the SSE transport."]}),e.jsxs("div",{className:"doc-callout",children:[e.jsx("p",{children:e.jsx("strong",{children:"Key capabilities:"})}),e.jsxs("ul",{children:[e.jsx("li",{children:"WebSocket and SSE transports with automatic fallback"}),e.jsx("li",{children:"Built-in horizontal scaling via Redis, KeyDB, Tarantool, or NATS broker engines"}),e.jsx("li",{children:"Channel history with epoch/offset-based gap recovery"}),e.jsx("li",{children:"JWT-based authentication for connections and per-channel subscriptions"}),e.jsx("li",{children:"Namespace-level access control and configuration"})]})]}),e.jsx("h2",{id:"installation",children:"Installation"}),e.jsx("p",{children:"The fastest way to start is Docker. For production, a static binary or RPM/DEB package is also available."}),e.jsx(u,{title:"terminal",code:`# Pull and run Centrifugo
docker run -d --name centrifugo -p 8000:8000 \\
  -v $(pwd)/config.json:/centrifugo/config.json \\
  centrifugo/centrifugo:v6 centrifugo -c config.json`}),e.jsxs("p",{children:["Create a minimal ",e.jsx("code",{children:"config.json"})," alongside the container. The two namespaces below cover data channels and the sidecar presence channels the adapter uses."]}),e.jsx(u,{title:"config.json",code:`{
  "token_hmac_secret_key": "my-secret-key",
  "api_key": "my-api-key",
  "allowed_origins": ["http://localhost:3000"],
  "namespaces": [
    {
      "name": "app",
      "history_size": 100,
      "history_ttl": "300s",
      "force_recovery": true
    },
    {
      "name": "$prs",
      "allow_publish_for_subscriber": true
    }
  ]
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["The ",e.jsx("code",{children:"app"})," namespace enables history and recovery so clients that briefly disconnect receive missed messages automatically. The"," ",e.jsx("code",{children:"$prs"})," namespace matches the adapter's default"," ",e.jsx("code",{children:"presencePrefix"})," (",e.jsx("code",{children:"$prs:"}),") and allows subscribers to publish presence heartbeats."]})}),e.jsx("h2",{id:"install-adapter",children:"Install the adapter"}),e.jsx(u,{code:`npm i @realtimejs/core @realtimejs/react \\
      @realtimejs/adapter-centrifugo`}),e.jsx("h2",{id:"client-setup",children:"Client setup"}),e.jsxs("p",{children:["Create a ",e.jsx("code",{children:"centrifugoTransport"})," and pass it to"," ",e.jsx("code",{children:"createRealtimeClient"}),". The only required option is"," ",e.jsx("code",{children:"url"}),". Pass ",e.jsx("code",{children:"token"})," when Centrifugo requires authentication (production)."]}),e.jsx(u,{title:"app/client/realtime.ts",code:`import { createRealtimeClient } from '@realtimejs/core'
import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'

export const realtimeClient = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'ws://localhost:8000/connection/websocket',
    token: () => fetchConnectionToken(),   // see next section
  }),
})`}),e.jsx("h3",{children:"All options"}),e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Option"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"url"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Centrifugo WebSocket endpoint URL"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"token"})}),e.jsx("td",{children:e.jsx("code",{children:"string | () => string | Promise<string>"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"JWT for connection auth, or an async function that returns one"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"data"})}),e.jsx("td",{children:e.jsx("code",{children:"Record<string, unknown>"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Arbitrary data forwarded to the server in the connect command"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"presencePrefix"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:e.jsx("code",{children:"$prs:"})}),e.jsx("td",{children:"Prefix for sidecar presence channels"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"initialDelay"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"1000"})}),e.jsx("td",{children:"Initial reconnect back-off delay in ms"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"maxDelay"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"30000"})}),e.jsx("td",{children:"Maximum reconnect back-off delay in ms"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"jitter"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"0.25"})}),e.jsx("td",{children:"Jitter factor (0–1) applied to reconnect delay"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"WebSocket"})}),e.jsx("td",{children:e.jsx("code",{children:"typeof WebSocket"})}),e.jsx("td",{children:e.jsx("code",{children:"globalThis.WebSocket"})}),e.jsxs("td",{children:["Custom WebSocket constructor (useful for Node < 21 with the"," ",e.jsx("code",{children:"ws"})," package)"]})]})]})]}),e.jsx("h2",{id:"connection-tokens",children:"Connection tokens"}),e.jsxs("p",{children:["Centrifugo authenticates every connection with a JWT. Your backend generates the token and the client passes it via the ",e.jsx("code",{children:"token"})," ","option. The token must contain at least a ",e.jsx("code",{children:"sub"})," (subject / user ID) claim. Add ",e.jsx("code",{children:"exp"})," to make tokens expire."]}),e.jsx(u,{title:"server/auth/centrifugo-token.ts",code:`import jwt from 'jsonwebtoken'

const CENTRIFUGO_SECRET = process.env.CENTRIFUGO_TOKEN_SECRET!

export function createConnectionToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    CENTRIFUGO_SECRET,
    { expiresIn: '15m' },
  )
}`}),e.jsx(u,{title:"server/routes/api/realtime-token.ts",code:`import { createConnectionToken } from '../../auth/centrifugo-token'
import { getSession } from '../../auth/session'

// Expose an endpoint that the client calls to fetch a fresh token
export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) return new Response('Unauthorized', { status: 401 })
  const token = createConnectionToken(session.userId)
  return Response.json({ token })
}`}),e.jsxs("p",{children:["On the client side, the ",e.jsx("code",{children:"token"})," option can be an async function. The adapter calls it on every connect (including reconnects), so expired tokens are refreshed automatically."]}),e.jsx(u,{title:"app/client/realtime.ts",code:`centrifugoTransport({
  url: 'wss://rt.example.com/connection/websocket',
  token: async () => {
    const res = await fetch('/api/realtime-token')
    const { token } = await res.json()
    return token
  },
})`}),e.jsxs("div",{className:"doc-callout",children:[e.jsx("p",{children:e.jsx("strong",{children:"Required JWT claims:"})}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"sub"})," — user identifier (required by Centrifugo)"]}),e.jsxs("li",{children:[e.jsx("code",{children:"exp"})," — expiration timestamp (recommended)"]}),e.jsxs("li",{children:[e.jsx("code",{children:"info"})," — optional JSON object attached to the connection, visible in join/leave events"]}),e.jsxs("li",{children:[e.jsx("code",{children:"channels"})," — optional list of channels to subscribe to on connect"]})]})]}),e.jsx("h2",{id:"subscription-tokens",children:"Subscription tokens"}),e.jsxs("p",{children:["For private or restricted channels, Centrifugo can require a separate per-channel JWT. This allows fine-grained authorization: the connection token proves ",e.jsx("em",{children:"who"})," the user is, and subscription tokens prove they are ",e.jsx("em",{children:"allowed"})," to read a specific channel."]}),e.jsx(u,{title:"server/auth/centrifugo-token.ts",code:`export function createSubscriptionToken(
  userId: string,
  channel: string,
): string {
  return jwt.sign(
    { sub: userId, channel },
    CENTRIFUGO_SECRET,
    { expiresIn: '15m' },
  )
}`}),e.jsxs("p",{children:["Enable subscription tokens in your Centrifugo namespace config by setting ",e.jsx("code",{children:'"allow_subscribe_for_client": false'})," (the default) and configuring a proxy or using the ",e.jsx("code",{children:"token_hmac_secret_key"})," ","for validation. The client obtains its subscription token by calling your backend before subscribing."]}),e.jsx("h2",{id:"presence",children:"Presence via Centrifugo"}),e.jsxs("p",{children:["The adapter implements presence using a ",e.jsx("strong",{children:"sidecar channel"})," ","pattern. For every data channel ",e.jsx("code",{children:"ch"}),", presence messages flow through a parallel channel named ",e.jsx("code",{children:"${presencePrefix}ch"})," ","(default ",e.jsx("code",{children:"$prs:ch"}),"). This keeps presence traffic separate from your data stream."]}),e.jsx(u,{title:"app/features/chat/presence.ts",code:`import { createPresenceChannel } from '@realtimejs/core'

export const chatPresence = createPresenceChannel({
  id: 'chat-presence',
  channel: (params: { roomId: string }) => \`app:chat-\${params.roomId}\`,
})`}),e.jsx(u,{title:"app/features/chat/ChatRoom.tsx",code:`import { usePresence } from '@realtimejs/react'
import { chatPresence } from './presence'

// Must be rendered inside <RealtimeProvider>
function ChatRoom({ roomId }: { roomId: string }) {
  const { others, updatePresence } = usePresence(chatPresence, {
    params: { roomId },
    initial: { name: currentUser.name, status: 'active' },
  })

  return (
    <div>
      <h3>Online ({others.length})</h3>
      <ul>
        {others.map((u) => (
          <li key={u.connectionId}>{(u.data as any).name}</li>
        ))}
      </ul>
    </div>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Server requirement:"})," The Centrifugo namespace matching your ",e.jsx("code",{children:"presencePrefix"})," must allow client publishing. In the config above, the ",e.jsx("code",{children:"$prs"})," namespace has"," ",e.jsx("code",{children:'"allow_publish_for_subscriber": true'}),"."]})}),e.jsxs("p",{children:["Under the hood, the adapter sends three message types on the sidecar channel. These are transport-level methods called automatically by the"," ",e.jsx("code",{children:"usePresence"})," hook — you do not call them directly:"]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"prs:join"})," — sent automatically when the hook mounts"]}),e.jsxs("li",{children:[e.jsx("code",{children:"prs:update"})," — sent when you call"," ",e.jsx("code",{children:"updatePresence()"})," (merges with existing data)"]}),e.jsxs("li",{children:[e.jsx("code",{children:"prs:leave"})," — sent automatically when the hook unmounts, then the sidecar subscription is removed"]})]}),e.jsx("h2",{id:"server-publishing",children:"Server-side publishing"}),e.jsx("p",{children:"Your backend publishes events to Centrifugo via its HTTP API. This is how database changes, webhook events, or background jobs push updates to connected clients."}),e.jsx(u,{title:"server/realtime/publish.ts",code:`const CENTRIFUGO_API = process.env.CENTRIFUGO_API_URL ?? 'http://localhost:8000/api'
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY!

export async function publishToChannel(
  channel: string,
  data: unknown,
): Promise<void> {
  const res = await fetch(\`\${CENTRIFUGO_API}/publish\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`apikey \${CENTRIFUGO_API_KEY}\`,
    },
    body: JSON.stringify({ channel, data }),
  })
  if (!res.ok) {
    throw new Error(\`Centrifugo publish failed: \${res.status}\`)
  }
}`}),e.jsx(u,{title:"server/routes/api/todos.ts",code:`import { publishToChannel } from '../../realtime/publish'

export async function POST(req: Request) {
  const todo = await createTodo(await req.json())

  // Fan out to all subscribers on the channel
  await publishToChannel('app:todos', {
    action: 'insert',
    data: todo,
  })

  return Response.json(todo, { status: 201 })
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["The ",e.jsx("code",{children:"api_key"})," in ",e.jsx("code",{children:"config.json"})," must match the"," ",e.jsx("code",{children:"Authorization: apikey ..."})," header. For production, use GRPC or a Centrifugo proxy instead of the HTTP API for lower latency."]})}),e.jsx("h2",{id:"gap-recovery",children:"Gap recovery"}),e.jsx("p",{children:"When a client briefly disconnects (network blip, laptop sleep), it should not need to re-fetch the entire collection. Centrifugo's epoch/offset recovery replays only the missed publications."}),e.jsxs("p",{children:[e.jsx("strong",{children:"How it works:"})," When a channel namespace has"," ",e.jsx("code",{children:"history_size"})," and ",e.jsx("code",{children:"history_ttl"})," configured, the server stores recent publications. Each publication gets a monotonic"," ",e.jsx("code",{children:"offset"})," within an ",e.jsx("code",{children:"epoch"})," (a string that changes when the server restarts or the stream resets). The adapter tracks the last seen epoch and offset per channel. On reconnect, it sends"," ",e.jsx("code",{children:"recover: true, epoch, offset"})," in the subscribe command, and Centrifugo replays only what was missed."]}),e.jsx(u,{title:"config.json (namespace excerpt)",code:`{
  "name": "app",
  "history_size": 100,
  "history_ttl": "300s",
  "force_recovery": true
}`}),e.jsxs("p",{children:["The adapter handles all of this automatically. No client-side configuration is needed beyond using a namespace with recovery enabled. If the recovery window is exceeded (the client was offline longer than"," ",e.jsx("code",{children:"history_ttl"}),"), the subscribe reply will not include missed publications, and the adapter clears its stored position. Pair this with"," ",e.jsx("code",{children:"refetchOnReconnect: true"})," on your collection as a fallback."]}),e.jsx(u,{code:`// Belt-and-suspenders: recovery for short gaps, refetch for long ones
const todosOptions = realtimeCollectionOptions({
  ...withRest<Todo, string>({
    url: '/api/todos',
    getKey: (t) => t.id,
  }),
  client: realtimeClient,
  channel: 'app:todos',
  refetchOnReconnect: true,   // fallback if epoch/offset recovery fails
})`}),e.jsx("h2",{id:"production-topology",children:"Production topology"}),e.jsx("p",{children:"A single Centrifugo node handles tens of thousands of connections. For high availability or higher throughput, run multiple Centrifugo nodes behind a load balancer and connect them with a Redis engine for cross-node fan-out."}),e.jsx("pre",{className:"ascii-diagram",children:`
  +-----------+      +-----------+
  |  Client A |      |  Client B |
  +-----+-----+      +-----+-----+
        |                   |
        v                   v
  +-----+-----+      +-----+-----+
  | Centrifugo |      | Centrifugo |
  |   Node 1   |      |   Node 2   |
  +-----+-----+      +-----+-----+
        |                   |
        +--------+----------+
                 |
           +-----+-----+
           |   Redis    |
           |  (engine)  |
           +-----+-----+
                 |
           +-----+-----+
           |  Your App  |
           |  (publish   |
           |   via API)  |
           +-----------+
`}),e.jsx(u,{title:"config.json (Redis engine)",code:`{
  "engine": "redis",
  "redis_address": "redis:6379",
  "token_hmac_secret_key": "my-secret-key",
  "api_key": "my-api-key",
  "namespaces": [
    {
      "name": "app",
      "history_size": 100,
      "history_ttl": "300s",
      "force_recovery": true
    },
    {
      "name": "$prs",
      "allow_publish_for_subscriber": true
    }
  ]
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Engine options:"})," Redis is the most common choice. Centrifugo also supports KeyDB (Redis-compatible), Tarantool, and NATS as broker engines. Choose based on your existing infrastructure."]})}),e.jsx("h2",{id:"when-to-choose",children:"When to choose Centrifugo"}),e.jsx("p",{children:"Centrifugo is the right fit when you need an external, dedicated real-time layer that scales independently of your application servers. Here is a quick decision guide:"}),e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Criterion"}),e.jsx("th",{children:"SSE transport"}),e.jsx("th",{children:"Centrifugo transport"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Deployment"}),e.jsx("td",{children:"Your app process holds connections"}),e.jsx("td",{children:"Separate Centrifugo process holds connections"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Multi-node fan-out"}),e.jsxs("td",{children:["Needs a ",e.jsx("code",{children:"PublishBackend"})," (e.g. Upstash Redis)"]}),e.jsx("td",{children:"Built in (Redis engine)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Protocol"}),e.jsx("td",{children:"Server-Sent Events (HTTP/1.1+)"}),e.jsx("td",{children:"WebSocket (with SSE fallback)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Gap recovery"}),e.jsxs("td",{children:[e.jsx("code",{children:"refetchOnReconnect"})," or ",e.jsx("code",{children:"useGapRecovery"})]}),e.jsx("td",{children:"Built-in epoch/offset replay, no extra code"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Auth model"}),e.jsx("td",{children:"Your middleware (cookie/session)"}),e.jsx("td",{children:"JWT tokens (connection + subscription)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Serverless friendly"}),e.jsx("td",{children:"Yes (SSE works on Workers, Lambda)"}),e.jsx("td",{children:"No (Centrifugo is a long-running process)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Best for"}),e.jsx("td",{children:"Simple setups, serverless, single-node"}),e.jsx("td",{children:"High scale, multi-region, dedicated infra"})]})]})]}),e.jsxs("p",{children:["If you are running serverless (Cloudflare Workers, Vercel Edge Functions), start with the SSE transport plus a"," ",e.jsx("code",{children:"PublishBackend"}),". If you have a long-running server environment and want built-in clustering, history replay, and connection-level auth out of the box, Centrifugo is the stronger choice."]}),e.jsx("h2",{id:"next-steps",children:"Next steps"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/transports",children:"Transports"})," — overview of all available transports and message adapters"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/presence",children:"Presence"})," — the full presence API (works with any transport)"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/resilience",children:"Resilience"})," — offline queue, multi-tab coordination, and gap recovery wrappers"]}),e.jsxs("li",{children:[e.jsx("a",{href:"https://centrifugal.dev/docs/getting-started/introduction",target:"_blank",rel:"noopener",children:"Centrifugo documentation"})," ","— official docs for server configuration, proxies, and GRPC API"]})]})]})}const Zh=["👍","❤️","😂","🔥","🎉"],Ut=["#38bdf8","#c084fc","#f472b6","#22c55e","#fb923c"],Dj=["Alice","Bob","Charlie","Dana","Eve"];function zj(){const[c,h]=G.useState([]),[p,d]=G.useState(Zh.map(S=>({emoji:S,count:0}))),[v,I]=G.useState(0);G.useEffect(()=>{if(c.length===0)return;const S=setTimeout(()=>{const g=Date.now();h(f=>f.filter(A=>g-A.createdAt<1800))},1800);return()=>clearTimeout(S)},[c]);const y=S=>{const g=`${Date.now()}-${Math.random()}`,f=10+Math.random()*80;h(A=>[...A,{id:g,emoji:S,x:f,createdAt:Date.now()}]),d(A=>A.map(T=>T.emoji===S?{...T,count:T.count+1}:T))};return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"Emoji reactions"}),e.jsx("p",{className:"demo-desc",children:"Click an emoji to send a reaction. Reactions float up and disappear after ~2 seconds — exactly like ephemeral channel events with a short TTL. Persistent counts accumulate separately."}),e.jsx("div",{style:{display:"flex",gap:8,marginBottom:8},children:Dj.map((S,g)=>e.jsx("button",{className:`demo-btn demo-btn-sm${v===g?" demo-btn-active":""}`,style:v===g?{borderColor:Ut[g],color:Ut[g]}:{},onClick:()=>I(g),children:S},S))}),e.jsxs("div",{style:{position:"relative",height:100,background:"var(--surface-2, #1e293b)",borderRadius:8,overflow:"hidden",marginBottom:12},children:[c.map(S=>e.jsx("span",{style:{position:"absolute",left:`${S.x}%`,bottom:0,fontSize:24,animation:"floatUp 1.8s ease-out forwards",pointerEvents:"none"},children:S.emoji},S.id)),e.jsx("style",{children:`
          @keyframes floatUp {
            from { transform: translateY(0); opacity: 1; }
            to   { transform: translateY(-90px); opacity: 0; }
          }
        `})]}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12},children:Zh.map(S=>e.jsx("button",{className:"demo-btn",style:{fontSize:20,padding:"4px 12px"},onClick:()=>y(S),children:S},S))}),e.jsx("div",{style:{display:"flex",gap:12,flexWrap:"wrap"},children:p.map(S=>e.jsxs("span",{style:{fontSize:14,color:"var(--text-muted, #94a3b8)",display:"flex",alignItems:"center",gap:4},children:[S.emoji,e.jsx("strong",{style:{color:"var(--text, #e2e8f0)"},children:S.count})]},S.emoji))})]})}function Ij(){const[h,p]=G.useState([]),d=G.useRef({}),v=(y,S)=>{const g=y.toLowerCase(),f={id:g,name:y,color:S,lastSeen:Date.now()};p(A=>[...A.filter(Q=>Q.id!==g),f]),g in d.current&&clearTimeout(d.current[g]),d.current[g]=setTimeout(()=>{p(A=>A.filter(T=>T.id!==g)),delete d.current[g]},3e3)};G.useEffect(()=>{const y=d.current;return()=>{for(const S of Object.values(y))clearTimeout(S)}},[]);const I={Alice:Ut[0],Bob:Ut[1],Charlie:Ut[2],Dana:Ut[3]};return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"User is viewing"}),e.jsxs("p",{className:"demo-desc",children:["Click a user's button to send a heartbeat. Their badge appears and automatically disappears after 3 seconds of silence — the same auto-expiry behaviour as ",e.jsx("code",{children:"ephemeralLiveOptions"}),"."]}),e.jsx("div",{style:{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"},children:["Alice","Bob","Charlie","Dana"].map(y=>e.jsxs("button",{className:"demo-btn",onClick:()=>v(y,I[y]),children:["Heartbeat as ",y]},y))}),e.jsx("div",{style:{minHeight:40},children:h.length===0?e.jsx("span",{style:{color:"var(--text-muted, #94a3b8)",fontSize:14},children:"No one is viewing (send a heartbeat)"}):e.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"},children:[e.jsx("span",{style:{color:"var(--text-muted, #94a3b8)",fontSize:13},children:"Viewing:"}),h.map(y=>e.jsx("span",{className:"demo-avatar",style:{background:y.color},title:`${y.name} (expires in ~3s)`,children:y.name[0]},y.id))]})})]})}function _j(){const c=G.useRef(null),[h,p]=G.useState([{id:"peer-1",name:"Bob",color:Ut[1],cursor:{x:120,y:60}},{id:"peer-2",name:"Charlie",color:Ut[2],cursor:{x:200,y:100}}]),[d,v]=G.useState(null);G.useEffect(()=>{const S=setInterval(()=>{p(g=>g.map(f=>{if(!f.cursor)return f;const A=c.current;if(!A)return f;const T=A.offsetWidth-16,Q=A.offsetHeight-16;return{...f,cursor:{x:Math.max(8,Math.min(T,f.cursor.x+(Math.random()-.5)*30)),y:Math.max(8,Math.min(Q,f.cursor.y+(Math.random()-.5)*30))}}}))},700);return()=>clearInterval(S)},[]);const I=S=>{const g=S.currentTarget.getBoundingClientRect();v({x:S.clientX-g.left,y:S.clientY-g.top})},y=()=>v(null);return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"Cursor sharing"}),e.jsxs("p",{className:"demo-desc",children:["Move your mouse over the canvas to see your cursor. Bob and Charlie move automatically. In a real app, cursor positions are broadcast via"," ",e.jsx("code",{children:"updatePresence"}),"."]}),e.jsxs("div",{ref:c,className:"demo-presence-area",onMouseMove:I,onMouseLeave:y,style:{userSelect:"none"},children:[e.jsxs("div",{className:"demo-presence-label",children:[h.length+(d?1:0)," cursor",h.length+(d?1:0)!==1?"s":""," visible"]}),d&&e.jsxs("div",{className:"demo-cursor",style:{left:d.x,top:d.y,color:Ut[0]},children:[e.jsx("svg",{width:"16",height:"20",viewBox:"0 0 16 20",fill:"currentColor",children:e.jsx("path",{d:"M0 0L16 12H6L3.5 20L0 0Z"})}),e.jsx("span",{className:"demo-cursor-label",style:{background:Ut[0]},children:"You"})]}),h.map(S=>S.cursor?e.jsxs("div",{className:"demo-cursor",style:{left:S.cursor.x,top:S.cursor.y,color:S.color},children:[e.jsx("svg",{width:"16",height:"20",viewBox:"0 0 16 20",fill:"currentColor",children:e.jsx("path",{d:"M0 0L16 12H6L3.5 20L0 0Z"})}),e.jsx("span",{className:"demo-cursor-label",style:{background:S.color},children:S.name})]},S.id):null)]})]})}function Mj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Ephemeral & Reaction Patterns"}),e.jsxs("p",{className:"doc-lead",children:['Ephemeral data has a short life — typing indicators, cursors, emoji reactions, and "user is viewing" badges. This guide shows six production-ready patterns built on ',e.jsx("code",{children:"ephemeralLiveOptions"}),","," ",e.jsx("code",{children:"usePublish"}),", ",e.jsx("code",{children:"usePresence"}),","," ",e.jsx("code",{children:"useSubscribe"}),", and ",e.jsx("code",{children:"useSyncedCounter"}),"."]}),e.jsx("h2",{id:"emoji-reactions",children:"1. Emoji reactions"}),e.jsx("p",{children:"Send ephemeral reaction events with a short TTL so every client sees the animation, then discard them automatically. Pair with a persistent counter (PN-Counter CRDT) when you need a total that survives page reloads."}),e.jsx(zj,{}),e.jsx("h3",{id:"reactions-server",children:"Server — publish to a reactions channel"}),e.jsx("p",{children:"The server receives reaction events from any client and re-broadcasts them to the channel. Nothing is stored permanently — the ephemeral map on each client handles the TTL."}),e.jsx(u,{title:"server/routes/reactions.ts",code:`import { createValidatedPublish } from '@realtimejs/core'
import { realtime } from './realtime.server'

// Validate and re-broadcast incoming reaction events.
// The payload is discarded after TTL ms — no database write needed.
export const publishReaction = createValidatedPublish({
  publish: realtime.publish,
  validate: ({ data }) => {
    const e = data as { type: string; emoji: string; userId: string }
    if (e.type !== 'reaction') return { accepted: false, reason: 'Not a reaction' }
    if (!['👍','❤️','😂','🔥','🎉'].includes(e.emoji)) {
      return { accepted: false, reason: 'Invalid emoji' }
    }
    return {
      accepted: true,
      data: { type: 'reaction', emoji: e.emoji, userId: e.userId },
    }
  },
})`}),e.jsx("h3",{id:"reactions-collection",children:"Client — ephemeral collection for animation"}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"ephemeralLiveOptions"})," to create a TanStack DB collection that holds only ",e.jsx("em",{children:"currently animating"})," reactions. Each reaction entry expires after ",e.jsx("code",{children:"ttl"})," ms and is automatically removed from the collection."]}),e.jsx(u,{title:"features/reactions/collection.ts",code:`import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@realtimejs/core'
import { realtimeClient } from '../client'

interface Reaction {
  id: string       // crypto.randomUUID() from the sender
  emoji: string
  userId: string
}

// Each reaction lives for 2 seconds then auto-expires.
export const reactionsCollection = createCollection(
  ephemeralLiveOptions<Reaction>({
    client: realtimeClient,
    channel: ['reactions', { postId: 'global' }],
    id: 'reactions',
    getKey: (r) => r.id,
    onEvent: (raw) => {
      const e = raw as { type: string; id: string; emoji: string; userId: string }
      if (e.type !== 'reaction') return null
      return { id: e.id, emoji: e.emoji, userId: e.userId }
    },
    ttl: 2000,  // remove from collection after 2 s
  }),
)`}),e.jsx("h3",{id:"reactions-component",children:"Client — sending and displaying reactions"}),e.jsx(u,{title:"features/reactions/ReactionBar.tsx",code:`import { useLiveQuery } from '@tanstack/react-db'
import { usePublish } from '@realtimejs/react'
import { reactionsCollection } from './collection'

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉']

function ReactionBar({ postId }: { postId: string }) {
  const publish = usePublish(['reactions', { postId }])

  // Only currently-animating reactions (auto-empties after TTL).
  const { data: animating } = useLiveQuery((q) =>
    q.from({ r: reactionsCollection }).select(),
  )

  const sendReaction = (emoji: string) => {
    void publish({
      type: 'reaction',
      id: crypto.randomUUID(),
      emoji,
      userId: currentUser.id,
    })
  }

  return (
    <div>
      {/* Floating animation layer */}
      {animating.map((r) => (
        <FloatingEmoji key={r.id} emoji={r.emoji} />
      ))}

      {/* Reaction buttons */}
      {EMOJIS.map((emoji) => (
        <button key={emoji} onClick={() => sendReaction(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Why not useState?"})," Using an ephemeral collection instead of local state means every tab and every client sees the same reactions — including reactions sent by other users. The"," ",e.jsx("code",{children:"onEvent"})," filter ensures only ",e.jsx("code",{children:"type: 'reaction'"})," ","events enter the collection; other event types on the same channel (e.g. messages) are ignored."]})}),e.jsx("h2",{id:"viewing-indicator",children:'2. "User is viewing" indicator'}),e.jsxs("p",{children:["Broadcast a heartbeat every few seconds to indicate that a user is actively viewing a page. The ",e.jsx("code",{children:"ttl"})," is set slightly longer than the heartbeat interval so a missed pulse causes the badge to disappear."]}),e.jsx(Ij,{}),e.jsx("h3",{id:"viewing-collection",children:"Collection definition"}),e.jsx(u,{title:"features/viewing/collection.ts",code:`import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@realtimejs/core'
import { realtimeClient } from '../client'

interface Viewer {
  userId: string
  name: string
  avatarUrl?: string
}

// TTL = 5 s, heartbeat interval = 3 s → one missed pulse = badge gone.
export const viewersCollection = createCollection(
  ephemeralLiveOptions<Viewer>({
    client: realtimeClient,
    channel: ['viewing', { pageId: 'home' }],
    id: 'viewers',
    getKey: (v) => v.userId,
    onEvent: (raw) => {
      const e = raw as { type: string; userId: string; name: string; avatarUrl?: string }
      if (e.type !== 'viewing') return null
      return { userId: e.userId, name: e.name, avatarUrl: e.avatarUrl }
    },
    ttl: 5000,  // badge disappears after 5 s of silence
  }),
)`}),e.jsx("h3",{id:"viewing-component",children:"Heartbeat component"}),e.jsxs("p",{children:["Send the heartbeat on mount and at a regular interval. Use"," ",e.jsx("code",{children:"usePublish"})," for the outgoing side and"," ",e.jsx("code",{children:"useLiveQuery"})," to reactively read the viewers collection."]}),e.jsx(u,{title:"features/viewing/ViewingIndicator.tsx",code:`import { useEffect } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { usePublish } from '@realtimejs/react'
import { viewersCollection } from './collection'

const HEARTBEAT_INTERVAL = 3000  // ms

function ViewingIndicator({ pageId }: { pageId: string }) {
  const publish = usePublish(['viewing', { pageId }])

  // Broadcast heartbeat on mount and every HEARTBEAT_INTERVAL ms.
  useEffect(() => {
    const payload = {
      type: 'viewing',
      userId: currentUser.id,
      name: currentUser.name,
    }
    void publish(payload)  // immediate on mount
    const id = setInterval(() => void publish(payload), HEARTBEAT_INTERVAL)
    return () => clearInterval(id)
  }, [publish])

  // Reactive list of current viewers (excludes self via server-side filtering
  // or by filtering userId on the client).
  const { data: viewers } = useLiveQuery((q) =>
    q.from({ v: viewersCollection })
      .where(({ v }) => v.userId !== currentUser.id)
      .select(),
  )

  return (
    <div className="avatar-row">
      {viewers.map((v) => (
        <img
          key={v.userId}
          src={v.avatarUrl ?? '/default-avatar.png'}
          alt={v.name}
          title={\`\${v.name} is viewing\`}
        />
      ))}
    </div>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Heartbeat pattern:"})," Calling ",e.jsx("code",{children:"set()"})," on the ephemeral map (inside ",e.jsx("code",{children:"ephemeralLiveOptions"}),") resets the TTL timer every time a new event arrives. As long as heartbeats keep arriving, the entry stays. One missed heartbeat past the TTL window removes it automatically."]})}),e.jsx("h2",{id:"cursor-sharing",children:"3. Cursor sharing"}),e.jsxs("p",{children:["Cursor positions change tens of times per second. Use"," ",e.jsx("code",{children:"usePresence"})," with ",e.jsx("code",{children:"updatePresence"})," to broadcast delta updates. Throttle the updates on the client to avoid flooding the server."]}),e.jsx(_j,{}),e.jsx("h3",{id:"cursor-channel",children:"Define a presence channel"}),e.jsx(u,{title:"features/cursors/channel.ts",code:`import { createPresenceChannel } from '@realtimejs/core'

export interface CursorPresenceData {
  name: string
  color: string
  cursor: { x: number; y: number } | null
}

export const cursorPresence = createPresenceChannel({
  id: 'cursor-presence',
  channel: (params: { documentId: string }) =>
    ['cursors', { documentId: params.documentId }],
})`}),e.jsx("h3",{id:"cursor-component",children:"Cursor-aware component"}),e.jsx(u,{title:"features/cursors/CollaborativeCanvas.tsx",code:`import { usePresence } from '@realtimejs/react'
import { throttle } from '@realtimejs/core'
import { useMemo } from 'react'
import { cursorPresence, type CursorPresenceData } from './channel'

function CollaborativeCanvas({ documentId }: { documentId: string }) {
  const { others, updatePresence } = usePresence<CursorPresenceData>(
    cursorPresence,
    {
      params: { documentId },
      initial: {
        name: currentUser.name,
        color: currentUser.color,
        cursor: null,
      },
    },
  )

  // Throttle cursor broadcasts to max 30 updates/s.
  const onMouseMove = useMemo(
    () =>
      throttle(
        (e: React.MouseEvent<HTMLDivElement>) => {
          const rect = e.currentTarget.getBoundingClientRect()
          updatePresence({
            cursor: { x: e.clientX - rect.left, y: e.clientY - rect.top },
          })
        },
        { interval: 33 },
      ),
    [updatePresence],
  )

  return (
    <div
      style={{ position: 'relative', width: '100%', height: 400 }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => updatePresence({ cursor: null })}
    >
      {/* Peer cursors */}
      {others
        .filter((u) => u.data.cursor !== null)
        .map((u) => (
          <div
            key={u.connectionId}
            style={{
              position: 'absolute',
              left: u.data.cursor!.x,
              top: u.data.cursor!.y,
              color: u.data.color,
              pointerEvents: 'none',
            }}
          >
            <CursorIcon />
            <span style={{ background: u.data.color }}>{u.data.name}</span>
          </div>
        ))}
    </div>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("code",{children:"usePresence"})," automatically leaves the channel on unmount, so peer cursors disappear when a user closes the tab. The"," ",e.jsx("code",{children:"others"})," array only contains ",e.jsx("em",{children:"other"})," connected users — the current user is always excluded. Call"," ",e.jsxs("code",{children:["updatePresence(","{ cursor: null }",")"]})," on"," ",e.jsx("code",{children:"onMouseLeave"})," to hide the cursor while the pointer is outside the canvas."]})}),e.jsx("h3",{id:"presence-vs-ephemeral",children:"Presence vs. ephemeralLiveOptions for cursors"}),e.jsxs("div",{className:"doc-grid",children:[e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"usePresence"}),e.jsxs("p",{children:["Server tracks connected users. Join/leave are automatic on mount/unmount. Best when you need to know ",e.jsx("em",{children:"who"})," is connected, not just what they last sent."]})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"ephemeralLiveOptions"}),e.jsx("p",{children:"Client-side TTL map, no server-side presence state. Best for channels that don't support the full presence protocol, or when you want explicit TTL control without relying on disconnect events."})]})]}),e.jsx("h2",{id:"combining",children:"4. Combining ephemeral + persistent"}),e.jsxs("p",{children:["Ephemeral data drives the ",e.jsx("em",{children:"animation"}),"; persistent data keeps the"," ",e.jsx("em",{children:"total"}),". This pattern lets every client see flying emojis for 2 seconds while the cumulative reaction count is durable across page reloads."]}),e.jsx(u,{title:"features/reactions/combined.ts",code:`// ── Persistent side ──────────────────────────────────────────────────────
// A PN-Counter CRDT that survives reconnects and page reloads.
// Concurrent increments from multiple users never get lost.
import { defineSyncedCounter } from '@realtimejs/core'

export const reactionCounter = defineSyncedCounter({
  id: 'reaction-count',
  channel: ({ postId }: { postId: string }) => ['reaction-counts', { postId }],
})

// ── Ephemeral side ───────────────────────────────────────────────────────
// Short-lived reaction events for the flying-emoji animation.
import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@realtimejs/core'
import { realtimeClient } from '../client'

interface EphemeralReaction {
  id: string
  emoji: string
  userId: string
}

export const ephemeralReactions = createCollection(
  ephemeralLiveOptions<EphemeralReaction>({
    client: realtimeClient,
    channel: ['reactions', { postId: 'placeholder' }],
    id: 'ephemeral-reactions',
    getKey: (r) => r.id,
    onEvent: (raw) => {
      const e = raw as { type: string; id: string; emoji: string; userId: string }
      if (e.type !== 'reaction') return null
      return { id: e.id, emoji: e.emoji, userId: e.userId }
    },
    ttl: 2000,
  }),
)`}),e.jsx(u,{title:"features/reactions/PostReactions.tsx",code:`import { useLiveQuery } from '@tanstack/react-db'
import { usePublish } from '@realtimejs/react'
import { useSyncedCounter } from '@realtimejs/react'
import { reactionCounter, ephemeralReactions } from './combined'

function PostReactions({ postId }: { postId: string }) {
  // Persistent total — survives page reload, concurrent-safe.
  const { value: totalCount, increment } = useSyncedCounter(reactionCounter, {
    params: { postId },
    initial: 0,
  })

  // Ephemeral animation data — auto-expires after 2 s.
  const { data: animating } = useLiveQuery((q) =>
    q.from({ r: ephemeralReactions }).select(),
  )

  const publish = usePublish(['reactions', { postId }])

  const react = (emoji: string) => {
    // 1. Publish ephemeral event → all clients see the animation.
    void publish({
      type: 'reaction',
      id: crypto.randomUUID(),
      emoji,
      userId: currentUser.id,
    })
    // 2. Increment the persistent counter → durable total.
    increment()
  }

  return (
    <div>
      {/* Floating animations driven by the ephemeral collection */}
      {animating.map((r) => (
        <FloatingEmoji key={r.id} emoji={r.emoji} />
      ))}

      <button onClick={() => react('👍')}>
        👍 {totalCount}
      </button>
    </div>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Two channels, two jobs."})," The ",e.jsx("code",{children:"reactions"})," ","channel carries ephemeral events; the ",e.jsx("code",{children:"reaction-counts"})," ","channel carries CRDT state. Publishing to both is fine — they're independent subscriptions and the server can handle them on different routes. The ephemeral collection empties itself after 2 seconds while the counter value accumulates indefinitely."]})}),e.jsx("h2",{id:"confetti",children:"5. Confetti / celebration animation"}),e.jsxs("p",{children:["Fire a full-screen confetti burst when a milestone is reached. The event is ephemeral — every connected client sees the animation, but nothing is stored. Use ",e.jsx("code",{children:"useSubscribe"})," with a callback that triggers the confetti library."]}),e.jsx("h3",{id:"confetti-client",children:"Client — celebration event listener"}),e.jsx(u,{title:"features/celebrations/CelebrationOverlay.tsx",code:`import { useSubscribe } from '@realtimejs/react'
import confetti from 'canvas-confetti'

function CelebrationOverlay({ projectId }: { projectId: string }) {
  useSubscribe(['celebrations', { projectId }], (event) => {
    const e = event as { type: string; message: string }
    if (e.type === 'confetti') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
    }
  })

  return null // overlay is purely side-effect-based
}`}),e.jsx("h3",{id:"confetti-server",children:"Server — trigger confetti when a goal is reached"}),e.jsx(u,{title:"server/routes/goals.ts",code:`// Server — trigger confetti when a goal is reached
import { serializeKey } from '@realtimejs/core'
import { sseHandler } from './realtime.server'

export async function completeGoal(goalId: string, projectId: string) {
  await db.goals.update({ where: { id: goalId }, data: { completed: true } })

  // Ephemeral celebration event — no storage needed
  sseHandler.broadcast(
    serializeKey(['celebrations', { projectId }]),
    { type: 'confetti', message: \`Goal "\${goalId}" completed!\` },
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Side-effect-only components."})," The"," ",e.jsx("code",{children:"CelebrationOverlay"})," renders ",e.jsx("code",{children:"null"})," — it exists purely to subscribe and trigger the confetti side effect. Mount it once inside your ",e.jsx("code",{children:"RealtimeProvider"})," and every page in the app will receive celebration events without extra wiring."]})}),e.jsx("h2",{id:"toast-notifications",children:"6. Toast notifications from server events"}),e.jsx("p",{children:"Display system-wide alerts, deployment notifications, or admin messages as toast popups. Subscribe to a notifications channel and pipe each event into your toast library. The events are fire-and-forget — clients that are offline when the toast fires simply never see it."}),e.jsx("h3",{id:"toast-client",children:"Client — notification listener"}),e.jsx(u,{title:"features/notifications/NotificationListener.tsx",code:`import { useSubscribe } from '@realtimejs/react'
import { toast } from 'your-toast-library'  // sonner, react-hot-toast, etc.

function NotificationListener() {
  useSubscribe(['notifications', { scope: 'global' }], (event) => {
    const e = event as {
      type: 'info' | 'warning' | 'success' | 'error'
      title: string
      body?: string
    }
    toast[e.type](e.title, { description: e.body })
  })

  return null
}

// Mount once at the app root, inside <RealtimeProvider>
function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <NotificationListener />
      <Router />
    </RealtimeProvider>
  )
}`}),e.jsx("h3",{id:"toast-server",children:"Server — broadcast a notification"}),e.jsx(u,{title:"server/routes/notifications.ts",code:`// Server — broadcast a toast notification to all connected clients
import { serializeKey } from '@realtimejs/core'
import { sseHandler } from './realtime.server'

export async function broadcastNotification(notification: {
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  body?: string
}) {
  sseHandler.broadcast(
    serializeKey(['notifications', { scope: 'global' }]),
    notification,
  )
}

// Usage: deploy hook, admin action, cron job, etc.
await broadcastNotification({
  type: 'success',
  title: 'Deployment complete',
  body: 'v2.4.1 is now live across all regions.',
})`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Any toast library works."})," The"," ",e.jsx("code",{children:"NotificationListener"})," component is agnostic — swap"," ",e.jsx("code",{children:"your-toast-library"})," for ",e.jsx("code",{children:"sonner"}),","," ",e.jsx("code",{children:"react-hot-toast"}),", or any library that exposes"," ",e.jsx("code",{children:"toast.info()"})," / ",e.jsx("code",{children:"toast.error()"})," style APIs. Because the listener returns ",e.jsx("code",{children:"null"}),", it adds zero DOM nodes."]})}),e.jsx("h2",{id:"quick-reference",children:"Quick reference"}),e.jsxs("div",{className:"doc-grid",children:[e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"ephemeralLiveOptions"}),e.jsxs("p",{children:["TanStack DB collection backed by a TTL map. Rows auto-expire after"," ",e.jsx("code",{children:"ttl"}),' ms of silence. Best for typing indicators, animation payloads, and "who is editing this cell" badges.']})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"usePublish"}),e.jsxs("p",{children:["Stable publish function for one-way fire-and-forget messages. Returns a ",e.jsx("code",{children:"Promise<void>"})," you can await for backpressure. Use for sending reactions, heartbeats, and cursor deltas."]})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"usePresence"}),e.jsxs("p",{children:["Joins a presence channel on mount and leaves on unmount."," ",e.jsx("code",{children:"others"})," is reactive. ",e.jsx("code",{children:"updatePresence(delta)"})," ","merges partial data — a cursor update doesn't overwrite the user's name."]})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"useSubscribe"}),e.jsxs("p",{children:["Raw channel listener — runs a callback on every event. Returns"," ",e.jsx("code",{children:"{ subscribeError }"})," for error handling. Use for confetti, toasts, sound effects, and analytics pings."]})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"useSyncedCounter"}),e.jsxs("p",{children:["PN-Counter CRDT hook. Concurrent ",e.jsx("code",{children:"increment()"})," calls from multiple clients always add up — no increments are ever lost. Pair with ephemeral data when you need durable totals."]})]})]}),e.jsx("h2",{id:"choosing",children:"Choosing the right primitive"}),e.jsx(u,{code:`// Short-lived animation payload (flying emoji, typing indicator)
ephemeralLiveOptions({ ttl: 2000, ... })

// Heartbeat / "user is viewing" badge
ephemeralLiveOptions({ ttl: 5000, ... })   // TTL > heartbeat interval
setInterval(() => publish({ type: 'viewing', ... }), 3000)

// Real-time cursor sharing
usePresence(channelDef, { initial: { cursor: null }, ... })
updatePresence({ cursor: { x, y } })       // partial merge, not replace

// Durable reaction count + ephemeral animation
useSyncedCounter(counterDef, { params })   // persistent total
usePublish(channel)                         // ephemeral animation trigger

// Side-effect on channel event (confetti, toast, sound)
useSubscribe(channel, (event) => { /* fire and forget */ })`})]})}function qj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Tick-Based Sync"}),e.jsx("p",{className:"doc-lead",children:"High-frequency state synchronization with delta compression at configurable intervals (up to 60 Hz). For multiplayer games, live dashboards, and real-time simulations."}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Specialized path."})," Tick batching is a niche feature for the rare cases where you publish many updates per second per entity. Most realtime apps never need it — reach for"," ",e.jsx("a",{href:"#/docs/reactive-queries",children:"reactive queries"}),","," ",e.jsx("a",{href:"#/docs/channels",children:"channels"}),", or"," ",e.jsx("a",{href:"#/docs/presence",children:"presence"})," first. Use tick batching only when per-event publishing is genuinely too expensive."]})}),e.jsx("h2",{id:"how",children:"How it works"}),e.jsxs("p",{children:[e.jsx("code",{children:"useTickBatching"})," registers tick-batching hooks on any transport, adding a fixed-interval tick loop. Instead of publishing individual events, you call ",e.jsx("code",{children:"setState()"})," to set the local state for an entity. The hook batches all dirty entities into a single"," ",e.jsx("strong",{children:"tick frame"})," sent once per interval. On the receiving side, ",e.jsx("code",{children:"onTick()"})," delivers the full batched frame rather than individual events."]}),e.jsx(u,{title:"realtime/tickSetup.ts",code:`import { useTickBatching } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = sseTransport({ url: '/api/realtime' })

// Register tick-batching hooks on the transport.
const tick = useTickBatching(transport, {
  // 60 Hz tick rate (16 ms interval, matching requestAnimationFrame)
  tickMs: 16,

  // Only send fields that changed since the last tick.
  deltaCompression: true,
})

// Normal subscribe/publish still work for non-tick channels.
// Tick frames are filtered out of regular subscribe() callbacks.`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["The default ",e.jsx("code",{children:"tickMs"})," is ",e.jsx("strong",{children:"16 ms"})," (roughly 60 Hz). For lower-frequency use cases like dashboards, increase this to 100–1000 ms to reduce bandwidth."]})}),e.jsx("h2",{id:"collection",children:"Define a tick collection"}),e.jsxs("p",{children:[e.jsx("code",{children:"tickCollectionOptions"})," creates a TanStack DB collection that syncs from tick frames. Each received frame batches all entity updates into a single begin/commit cycle for efficient rendering."]}),e.jsx(u,{title:"features/game/players.ts",code:`import { createCollection } from '@tanstack/db'
import { tickCollectionOptions } from '@realtimejs/core'
import { tick } from '../../realtime/tickSetup'

interface Player {
  id: string
  x: number
  y: number
  health: number
  name: string
}

export const playerCollection = createCollection(
  tickCollectionOptions<Player, string>({
    transport: tick,
    channel: 'game:room-1',
    id: 'players',

    getKey: (p) => p.id,
    keyToEntityId: (key) => key,

    fromEntity: (entityId, state, existing) => ({
      id: entityId,
      // Merge with existing state when using delta compression.
      ...(existing ?? { x: 0, y: 0, health: 100, name: '' }),
      ...(state as Partial<Player>),
    }),
  })
)`}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"fromEntity"})," callback converts raw entity state from a tick frame into a full row object. When delta compression is enabled, the ",e.jsx("code",{children:"existing"})," parameter contains the current row so you can merge partial updates."]}),e.jsx("h2",{id:"delta",children:"Delta compression"}),e.jsxs("p",{children:["When ",e.jsx("code",{children:"deltaCompression: true"})," is set on the transport, only fields that changed since the last tick are sent over the wire. The receiver reconstructs full state from deltas automatically."]}),e.jsx(u,{code:`// Tick 1: full state sent (first time)
// Wire: { x: 100, y: 200, health: 100, name: 'Alice' }

// Tick 2: only position changed
// Wire: { x: 105, y: 210 }
// Reconstructed: { x: 105, y: 210, health: 100, name: 'Alice' }

// Tick 3: nothing changed — no frame sent at all`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["Delta compression uses a shallow diff. Only top-level fields are compared. For nested objects, consider flattening your state or managing nested diffing in your ",e.jsx("code",{children:"fromEntity"})," callback."]})}),e.jsx("h2",{id:"example",children:"Example: multiplayer game state"}),e.jsx("p",{children:"A complete example showing how to send player state each render frame and receive batched updates from all players."}),e.jsx(u,{title:"features/game/GameLoop.tsx",code:`import { useEffect, useRef } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { tick } from '../../realtime/tickSetup'
import { playerCollection } from './players'

function GameLoop({ myPlayerId }: { myPlayerId: string }) {
  const posRef = useRef({ x: 0, y: 0 })

  // Send local state every animation frame.
  useEffect(() => {
    let raf: number
    const loop = () => {
      tick.setState('game:room-1', myPlayerId, posRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      tick.removeEntity('game:room-1', myPlayerId)
    }
  }, [myPlayerId])

  // Read all player positions reactively.
  const { data: players } = useLiveQuery((q) =>
    q.from({ playerCollection })
  )

  return (
    <canvas>
      {/* Render players at their positions */}
    </canvas>
  )
}`}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"tick.removeEntity()"})," when a player disconnects. The removal is included in the next tick frame’s ",e.jsx("code",{children:"removed"})," ","array."]}),e.jsx("h2",{id:"example-dashboard",children:"Example: live server metrics gauge"}),e.jsx("p",{children:"Tick-based sync is not just for games. Here is a live server metrics dashboard that batches updates at 10 Hz."}),e.jsx(u,{title:"features/metrics/metricsSetup.ts",code:`import { useTickBatching } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = sseTransport({ url: '/api/realtime' })

// 10 Hz is plenty for dashboard gauges.
export const metricsTick = useTickBatching(transport, { tickMs: 100 })`}),e.jsx(u,{title:"features/metrics/serverMetrics.ts",code:`import { createCollection } from '@tanstack/db'
import { tickCollectionOptions } from '@realtimejs/core'
import { metricsTick } from './metricsSetup'

interface ServerMetric {
  id: string
  cpu: number
  memory: number
  connections: number
}

export const metricsCollection = createCollection(
  tickCollectionOptions<ServerMetric, string>({
    transport: metricsTick,
    channel: 'metrics:servers',
    id: 'server-metrics',

    getKey: (m) => m.id,
    keyToEntityId: (key) => key,

    fromEntity: (entityId, state) => ({
      id: entityId,
      cpu: 0,
      memory: 0,
      connections: 0,
      ...(state as Partial<ServerMetric>),
    }),
  })
)`}),e.jsx(u,{title:"features/metrics/MetricsDashboard.tsx",code:`import { useLiveQuery } from '@tanstack/react-db'
import { metricsCollection } from './serverMetrics'

function MetricsDashboard() {
  const { data: servers } = useLiveQuery((q) =>
    q.from({ metricsCollection })
  )

  return (
    <div className="metrics-grid">
      {servers.map((s) => (
        <div key={s.id} className="metric-card">
          <h3>{s.id}</h3>
          <p>CPU: {s.cpu}%</p>
          <p>Memory: {s.memory}%</p>
          <p>Connections: {s.connections}</p>
        </div>
      ))}
    </div>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["On the server side, call"," ",e.jsx("code",{children:"tick.setState('metrics:servers', serverId, data)"})," ","from your metrics collector. The tick transport batches all server updates into a single frame per interval."]})})]})}function Uj(){const[c,h]=G.useState([{id:"m1",author:"Alice",text:"Hey, did you see the new design?",ts:Date.now()-4e3},{id:"m2",author:"Bob",text:"Just opened it — looks great!",ts:Date.now()-3e3},{id:"m3",author:"Alice",text:"Thanks! The animations were tricky.",ts:Date.now()-2e3}]),[p,d]=G.useState({alice:"m3",bob:"m2"}),[v,I]=G.useState("Bob"),[y,S]=G.useState(""),g=G.useRef(null);G.useEffect(()=>{g.current&&(g.current.scrollTop=g.current.scrollHeight)},[c.length]);const f=()=>{if(!y.trim())return;const B=`m${Date.now()}`,C={id:B,author:v,text:y.trim(),ts:Date.now()};h(R=>[...R,C]),d(R=>({...R,[v.toLowerCase()]:B})),S("")},A=B=>{const C=c[c.length-1]?.id??null;d(R=>({...R,[B.toLowerCase()]:C}))},T=B=>{const C=p[B.toLowerCase()];if(!C)return c.length;const R=c.findIndex(O=>O.id===C);return R===-1?c.length:c.length-1-R},Q=B=>{const C=[],R=c.findIndex(O=>O.id===B);return R===-1||(p.alice&&c.findIndex(L=>L.id===p.alice)>=R&&C.push("Alice"),p.bob&&c.findIndex(L=>L.id===p.bob)>=R&&C.push("Bob")),C};return e.jsxs("div",{className:"demo-box",children:[e.jsx("h3",{children:"Read receipts"}),e.jsx("p",{className:"demo-desc",children:'Switch between users to simulate reading. "Mark read" advances the read pointer for that user. The last message shows who has read up to it.'}),e.jsxs("div",{style:{display:"flex",gap:"0.5rem",marginBottom:"0.75rem"},children:[["Alice","Bob"].map(B=>{const C=T(B);return e.jsxs("button",{className:`demo-btn demo-btn-sm${v===B?" demo-btn-active":""}`,style:v===B?{borderColor:B==="Alice"?"#38bdf8":"#c084fc",color:B==="Alice"?"#38bdf8":"#c084fc"}:{},onClick:()=>I(B),children:[B,C>0&&e.jsx("span",{style:{marginLeft:"0.35rem",background:"#ef4444",color:"#fff",fontSize:"0.65rem",fontWeight:700,borderRadius:"100px",padding:"0.05rem 0.35rem",lineHeight:1.4},children:C})]},B)}),e.jsxs("button",{className:"demo-btn demo-btn-sm",onClick:()=>A(v),style:{marginLeft:"auto"},children:["Mark all read as ",v]})]}),e.jsx("div",{ref:g,className:"demo-chat-feed",style:{maxHeight:220},children:c.map((B,C)=>{const R=C===c.length-1,O=R?Q(B.id):[];return e.jsxs("div",{className:`demo-chat-msg demo-chat-${B.author.toLowerCase()==="alice"?"a":"b"}`,children:[e.jsx("span",{className:`demo-dot demo-dot-${B.author.toLowerCase()==="alice"?"a":"b"}`,style:{marginTop:3}}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("span",{style:{fontWeight:600,fontSize:"0.75rem",marginRight:"0.35rem"},children:B.author}),B.text,R&&O.length>0&&e.jsxs("div",{style:{marginTop:"0.2rem",fontSize:"0.68rem",color:"var(--text-muted)",display:"flex",gap:"0.25rem",alignItems:"center"},children:[e.jsx("span",{children:"Read by"}),O.map(L=>e.jsx("span",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:"50%",fontSize:"0.6rem",fontWeight:700,background:L==="Alice"?"#38bdf8":"#c084fc",color:"#000"},children:L[0]},L))]})]})]},B.id)})}),e.jsxs("div",{className:"demo-chat-input-row",children:[e.jsx("input",{className:"demo-input",value:y,placeholder:`Message as ${v}…`,onChange:B=>S(B.target.value),onKeyDown:B=>B.key==="Enter"&&f()}),e.jsx("button",{className:"demo-btn demo-btn-primary",onClick:f,children:"Send"})]})]})}function Pj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Read Receipts"}),e.jsxs("p",{className:"doc-lead",children:["Show users when their messages have been seen. realtime.js supports two approaches: ",e.jsx("strong",{children:"presence-based"}),' for ephemeral "last seen" state that lives only while users are connected, and'," ",e.jsx("strong",{children:"collection-based"})," for durable read receipts persisted to your database."]}),e.jsx("h2",{id:"try-it",children:"Try it"}),e.jsx(Uj,{}),e.jsx("h2",{id:"approaches",children:"Choosing an approach"}),e.jsxs("div",{className:"doc-grid",children:[e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"Presence-based"}),e.jsxs("p",{children:["Store ",e.jsx("code",{children:"lastReadMessageId"})," in the presence data for a room. Fast, zero persistence, and requires no extra database table. Receipt state is lost when the user disconnects."]})]}),e.jsxs("div",{className:"doc-grid-card",children:[e.jsx("h3",{children:"Collection-based"}),e.jsxs("p",{children:["Persist a ",e.jsx("code",{children:"read_receipts"})," row per user per room. Survives disconnections and page refreshes. Visible to users who were offline when the message arrived."]})]})]}),e.jsx("h2",{id:"presence-approach",children:"Presence-based read receipts"}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"createPresenceChannel"})," to define a typed presence channel for a chat room, then broadcast a ",e.jsx("code",{children:"lastReadMessageId"})," ","field whenever the user scrolls to the bottom or focuses the window."]}),e.jsx("h3",{id:"presence-channel",children:"1. Define the presence channel"}),e.jsx(u,{title:"features/chat/presence.ts",code:`import { createPresenceChannel } from '@realtimejs/core'

export interface ChatPresenceData {
  userId: string
  displayName: string
  lastReadMessageId: string | null
}

// createPresenceChannel requires an 'id' and a 'channel' factory.
export const chatPresence = createPresenceChannel({
  id: 'chat-presence',
  channel: (params: { roomId: string }) =>
    ['chat:presence', { roomId: params.roomId }],
})`}),e.jsx("h3",{id:"presence-hook",children:"2. Join and read presence in the chat component"}),e.jsxs("p",{children:["Pass ",e.jsx("code",{children:"initial"})," data when joining. Call"," ",e.jsx("code",{children:"updatePresence"})," with a delta — only the listed fields are merged, everything else stays unchanged."]}),e.jsx(u,{title:"features/chat/ChatRoom.tsx",code:`import { usePresence } from '@realtimejs/react'
import { chatPresence, type ChatPresenceData } from './presence'

function ChatRoom({ roomId, currentUser }: { roomId: string; currentUser: User }) {
  const { others, updatePresence } = usePresence<ChatPresenceData>(chatPresence, {
    params: { roomId },
    initial: {
      userId: currentUser.id,
      displayName: currentUser.name,
      lastReadMessageId: null,
    },
  })

  // Call this when the user reaches the bottom of the message list
  const markRead = (messageId: string) => {
    updatePresence({ lastReadMessageId: messageId })
  }

  return (
    <div>
      <MessageList
        roomId={roomId}
        onLastMessageVisible={markRead}
        // Pass 'others' so MessageList can show who has read each message
        readers={others}
      />
    </div>
  )
}`}),e.jsx("h3",{id:"presence-indicators",children:'3. Render "read by" indicators'}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"others"})," array from ",e.jsx("code",{children:"usePresence"})," is reactive. Each entry is a ",e.jsx("code",{children:"PresenceUser"})," whose ",e.jsx("code",{children:".data"})," field holds the typed presence payload. Filter by"," ",e.jsx("code",{children:"lastReadMessageId"})," to determine who has seen a message."]}),e.jsx(u,{title:"features/chat/MessageList.tsx",code:`import type { PresenceUser } from '@realtimejs/react'
import type { ChatPresenceData } from './presence'

interface Props {
  messages: Message[]
  readers: ReadonlyArray<PresenceUser<ChatPresenceData>>
  onLastMessageVisible: (messageId: string) => void
}

export function MessageList({ messages, readers, onLastMessageVisible }: Props) {
  // Build a map: messageId -> list of display names who have read up to it
  function getReadersUpTo(messageId: string): string[] {
    const msgIndex = messages.findIndex((m) => m.id === messageId)
    return readers
      .filter((reader) => {
        const lastRead = reader.data.lastReadMessageId
        if (!lastRead) return false
        const readerIndex = messages.findIndex((m) => m.id === lastRead)
        return readerIndex >= msgIndex
      })
      .map((reader) => reader.data.displayName)
  }

  const lastMessage = messages[messages.length - 1]

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <p>{msg.text}</p>
          {/* Show read receipts only on the last message to avoid clutter */}
          {msg.id === lastMessage?.id && (
            <ReadByRow names={getReadersUpTo(msg.id)} />
          )}
        </div>
      ))}
    </div>
  )
}

function ReadByRow({ names }: { names: string[] }) {
  if (names.length === 0) return null
  return (
    <div className="read-by-row">
      {names.map((name) => (
        <span key={name} className="read-avatar" title={name}>
          {name[0]}
        </span>
      ))}
    </div>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Note:"})," ",e.jsx("code",{children:"updatePresence"})," sends only the fields you provide — it merges into the server-stored state. A"," ",e.jsx("code",{children:"lastReadMessageId"})," update will not overwrite"," ",e.jsx("code",{children:"displayName"})," or any other field. The ",e.jsx("code",{children:"initial"})," ","object is sent once on mount and is not reactive; subsequent changes must go through ",e.jsx("code",{children:"updatePresence"}),"."]})}),e.jsx("h2",{id:"collection-approach",children:"Collection-based read receipts"}),e.jsxs("p",{children:["For durable receipts that survive disconnection, store a row per user per room in a ",e.jsx("code",{children:"read_receipts"})," table. Use"," ",e.jsx("code",{children:"realtimeCollectionOptions"})," to sync the collection in real time so every connected client sees receipt updates as they happen."]}),e.jsx("h3",{id:"collection-schema",children:"1. Data model"}),e.jsx(u,{title:"db/schema.ts",code:`// One row per user per room — upserted whenever the user reads new messages.
export interface ReadReceipt {
  id: string          // e.g. \`\${userId}:\${roomId}\`
  userId: string
  roomId: string
  lastReadMessageId: string
  readAt: string      // ISO-8601 timestamp
}`}),e.jsx("h3",{id:"collection-definition",children:"2. Define the collection"}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"useRealtimeCollection"})," (React hook) or the lower-level"," ",e.jsx("code",{children:"realtimeCollectionOptions"})," to wire up the collection. The"," ",e.jsx("code",{children:"getKey"})," function returns the composite key so upserts land on the correct row."]}),e.jsx(u,{title:"features/chat/readReceiptsCollection.ts",code:`import type { ReadReceipt } from '../../db/schema'

// Return raw config — useRealtimeCollection wraps it with the client
export const readReceiptsOptions = (roomId: string) => ({
  // Composite key keeps one row per user per room
  getKey: (r: ReadReceipt) => r.id,
  channel: ['read-receipts', { roomId }],

  // Load existing receipts on mount
  queryFn: () =>
    fetch(\`/api/rooms/\${roomId}/read-receipts\`).then((r) => r.json()),

  // Called when the current user upserts their receipt
  onInsert: async ({ transaction }: { transaction: { mutations: Array<{ modified: ReadReceipt }> } }) => {
    const data = transaction.mutations[0].modified
    const res = await fetch('/api/read-receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()  // returning the saved row triggers auto-broadcast
  },

  onUpdate: async ({ transaction }: { transaction: { mutations: Array<{ modified: ReadReceipt }> } }) => {
    const data = transaction.mutations[0].modified
    const res = await fetch(\`/api/read-receipts/\${data.id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
})`}),e.jsx("h3",{id:"collection-hook",children:"3. Use the collection in a component"}),e.jsxs("p",{children:[e.jsx("code",{children:"useRealtimeCollection"})," creates and manages the collection lifecycle. Pass the stable ",e.jsx("code",{children:"Collection"})," object to"," ",e.jsx("code",{children:"useLiveQuery"})," from ",e.jsx("code",{children:"@tanstack/react-db"})," to query reactively."]}),e.jsx(u,{title:"features/chat/ChatRoom.tsx",code:`import { useRealtimeCollection } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'
import { readReceiptsOptions } from './readReceiptsCollection'
import type { ReadReceipt } from '../../db/schema'

function ChatRoom({ roomId, currentUser }: { roomId: string; currentUser: User }) {
  // The collection is stable across renders
  const receiptsCollection = useRealtimeCollection<ReadReceipt>(
    readReceiptsOptions(roomId),
  )

  // Query all receipts for this room reactively
  const { data: receipts } = useLiveQuery((q) =>
    q.from({ receiptsCollection }).select(),
  )

  // Mark the current user as having read up to a message
  const markRead = (messageId: string) => {
    const receiptId = \`\${currentUser.id}:\${roomId}\`
    const existing = receipts.find((r) => r.id === receiptId)

    if (existing) {
      receiptsCollection.update(receiptId, (draft) => {
        draft.lastReadMessageId = messageId
        draft.readAt = new Date().toISOString()
      })
    } else {
      receiptsCollection.insert({
        id: receiptId,
        userId: currentUser.id,
        roomId,
        lastReadMessageId: messageId,
        readAt: new Date().toISOString(),
      })
    }
  }

  return (
    <MessageList
      roomId={roomId}
      receipts={receipts}
      onLastMessageVisible={markRead}
    />
  )
}`}),e.jsx("h2",{id:"read-by-indicators",children:'Showing "read by" indicators'}),e.jsxs("p",{children:["Whether you use presence or collections, the rendering logic is the same: for each message, find the receipts where"," ",e.jsx("code",{children:"lastReadMessageId"})," is at or after that message in the ordered list."]}),e.jsx(u,{title:"features/chat/MessageList.tsx (collection variant)",code:`interface Props {
  messages: Message[]
  receipts: ReadReceipt[]
}

export function MessageList({ messages, receipts }: Props) {
  // Index message positions for O(1) lookups
  const msgIndex = new Map(messages.map((m, i) => [m.id, i]))

  function getReadersUpTo(messageId: string): ReadReceipt[] {
    const threshold = msgIndex.get(messageId) ?? -1
    return receipts.filter((r) => {
      const readerPos = msgIndex.get(r.lastReadMessageId) ?? -1
      return readerPos >= threshold
    })
  }

  const lastMessage = messages[messages.length - 1]

  return (
    <ul>
      {messages.map((msg) => (
        <li key={msg.id}>
          <p>{msg.text}</p>

          {/* Only show read receipts on the last message */}
          {msg.id === lastMessage?.id && (
            <div className="read-by-row">
              {getReadersUpTo(msg.id).map((r) => (
                <Avatar key={r.userId} userId={r.userId} size={16} />
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}`}),e.jsx("h2",{id:"unread-count",children:"Unread count badge"}),e.jsxs("p",{children:["Compute the unread count by comparing the current user's"," ",e.jsx("code",{children:"lastReadMessageId"})," against the full message list. This works for both the presence and collection approaches."]}),e.jsx(u,{title:"features/chat/UnreadBadge.tsx",code:`interface Props {
  messages: Message[]
  lastReadMessageId: string | null
}

export function UnreadBadge({ messages, lastReadMessageId }: Props) {
  const unread = (() => {
    if (!lastReadMessageId) return messages.length
    const lastReadIndex = messages.findIndex((m) => m.id === lastReadMessageId)
    if (lastReadIndex === -1) return messages.length
    return messages.length - 1 - lastReadIndex
  })()

  if (unread === 0) return null

  return (
    <span className="unread-badge">
      {unread > 99 ? '99+' : unread}
    </span>
  )
}

// Usage — presence-based
function RoomListItem({ room, currentUser }: { room: Room; currentUser: User }) {
  const { others } = usePresence(chatPresence, {
    params: { roomId: room.id },
    initial: { userId: currentUser.id, displayName: currentUser.name, lastReadMessageId: null },
  })

  // Find the current user's own receipt from presence
  // (presence 'others' excludes the current user, so track it via local state
  //  or a separate source of truth like the collection approach below)
  return (
    <div>
      {room.name}
      <UnreadBadge
        messages={room.messages}
        lastReadMessageId={currentUser.lastReadMessageId}
      />
    </div>
  )
}

// Usage — collection-based (cleaner for room lists)
function RoomListItemWithCollection({ room, currentUser }: { room: Room; currentUser: User }) {
  const receiptsCollection = useRealtimeCollection(readReceiptsOptions(room.id))
  const { data: receipts } = useLiveQuery((q) =>
    q.from({ receiptsCollection }).select(),
  )

  const myReceipt = receipts.find((r) => r.userId === currentUser.id)

  return (
    <div>
      {room.name}
      <UnreadBadge
        messages={room.messages}
        lastReadMessageId={myReceipt?.lastReadMessageId ?? null}
      />
    </div>
  )
}`}),e.jsx("h2",{id:"mark-read-on-scroll",children:"Triggering mark-read automatically"}),e.jsxs("p",{children:["Use an ",e.jsx("code",{children:"IntersectionObserver"})," on the last message element to call ",e.jsx("code",{children:"markRead"})," automatically when the user scrolls to the bottom. This avoids button-based UX and matches the behavior users expect from chat apps."]}),e.jsx(u,{title:"features/chat/useMarkReadOnVisible.ts",code:`import { useEffect, useRef } from 'react'

/**
 * Calls \`onVisible\` with the message id when the element enters the viewport.
 * Ideal for the last message in a list.
 */
export function useMarkReadOnVisible(
  messageId: string | undefined,
  onVisible: (messageId: string) => void,
) {
  const ref = useRef<HTMLDivElement | null>(null)
  const callbackRef = useRef(onVisible)
  callbackRef.current = onVisible

  useEffect(() => {
    const el = ref.current
    if (!el || !messageId) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) callbackRef.current(messageId)
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [messageId])

  return ref
}

// Usage
function LastMessage({ message, onRead }: { message: Message; onRead: (id: string) => void }) {
  const ref = useMarkReadOnVisible(message.id, onRead)
  return <div ref={ref}>{message.text}</div>
}`}),e.jsx("h2",{id:"which-to-use",children:"Which approach to choose"}),e.jsxs("div",{className:"doc-callout",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"Use presence-based receipts"}),' when you only need to show "currently reading" state to other active users — lightweight chat apps, document viewers, support widgets. There is no persistence and no database table to manage.']}),e.jsxs("p",{style:{marginTop:"0.75rem"},children:[e.jsx("strong",{children:"Use collection-based receipts"})," when receipt state must survive page refreshes and be visible after a user reconnects — team chat, async collaboration tools, notification inboxes. A"," ",e.jsx("code",{children:"read_receipts"})," table gives you a queryable audit trail and correct unread counts even for users who were offline when messages arrived."]})]})]})}function Lj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Server Lifecycle Hooks"}),e.jsx("p",{className:"doc-lead",children:"The server-side callback surface for authentication, authorization, publish validation, and connection lifecycle events. Every hook is synchronous or async and integrates with any auth system you already use."}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Two kinds of hooks."})," The server callback surface includes ",e.jsx("strong",{children:"request hooks"})," (",e.jsx("code",{children:"getUser"}),","," ",e.jsx("code",{children:"authorize"}),", ",e.jsx("code",{children:"createValidatedPublish"}),") that run on every HTTP request, and ",e.jsx("strong",{children:"lifecycle hooks"})," (",e.jsx("code",{children:"onClientConnect"}),", ",e.jsx("code",{children:"onClientDisconnect"}),","," ",e.jsx("code",{children:"onFirstSubscriber"}),", ",e.jsx("code",{children:"onChannelEmpty"}),") that fire on connection and channel state changes."]})}),e.jsx("h2",{id:"overview",children:"Handler packages"}),e.jsxs("p",{children:["Two packages expose the server callback surface. Both accept the same"," ",e.jsx("code",{children:"getUser"}),", ",e.jsx("code",{children:"authorize"}),", and lifecycle hook options because ",e.jsx("code",{children:"createStartHandler"})," delegates to"," ",e.jsx("code",{children:"createSseHandler"})," internally."]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})})," ","— ",e.jsx("code",{children:"createSseHandler"}),". Fetch-API compatible. Mount on any edge runtime, Hono, or bare Node.js."]}),e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"@realtimejs/preset-start"})})," ","— ",e.jsx("code",{children:"createStartHandler"}),". Wraps ",e.jsx("code",{children:"createSseHandler"})," ","and adds a first-class ",e.jsx("code",{children:"publish"})," function plus optional"," ",e.jsx("code",{children:"PublishBackend"})," for multi-process fan-out. Returns"," ",e.jsx("code",{children:"{ handle, publish, createStream, dispose }"}),"."]})]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["The examples below assign the handler directly to a"," ",e.jsx("code",{children:"realtime"})," binding to focus on the auth/lifecycle surface. When you also use the auto-reactive ",e.jsx("code",{children:"realtime.query()"}),"/",e.jsx("code",{children:"realtime.mutation()"})," layer, the handler is one half of a composition with ",e.jsx("code",{children:"createReactiveQueries()"})," — see"," ",e.jsx("a",{href:"#/docs/server-functions",children:"TanStack Start + Drizzle"})," for the full ",e.jsx("code",{children:"realtime"})," object. The hook options documented here are identical either way."]})}),e.jsxs("h2",{id:"getUser",children:[e.jsx("code",{children:"getUser"})," — authentication"]}),e.jsxs("p",{children:["Called on ",e.jsx("strong",{children:"every"})," incoming HTTP request — both the GET that opens an SSE stream and every POST that dispatches a client action (subscribe / unsubscribe / publish). Return"," ",e.jsx("code",{children:"{ userId: string }"})," to allow the request, or"," ",e.jsx("code",{children:"null"})," / ",e.jsx("code",{children:"undefined"})," to reject with"," ",e.jsx("strong",{children:"401 Unauthorized"}),"."]}),e.jsxs("p",{children:["When ",e.jsx("code",{children:"getUser"})," is omitted, every request is treated as an anonymous user and allowed through. This is intentional for development and internal APIs that do not require auth."]}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`getUser?: (req: Request) =>
  | { userId: string }
  | null
  | undefined
  | Promise<{ userId: string } | null | undefined>`}),e.jsx("h3",{children:"JWT Bearer token"}),e.jsxs("p",{children:["The most common pattern. The client sets an"," ",e.jsx("code",{children:"Authorization: Bearer <token>"})," header via"," ",e.jsxs("code",{children:["sseTransport(","{ getToken }",")"]}),"; the server verifies it here."]}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { verifyJwt } from './auth'

export const realtime = createStartHandler({
  getUser: async (req) => {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const { sub } = await verifyJwt(auth.slice(7), process.env.JWT_SECRET!)
      return { userId: sub }
    } catch {
      return null   // expired / invalid token → 401
    }
  },
})

export const realtimePublish = realtime.publish`}),e.jsx("h3",{children:"Session cookie"}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { getSession } from './auth'

export const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
})`}),e.jsx("h3",{children:"API key from query param"}),e.jsx("p",{children:"Useful for server-to-server connections where setting headers is inconvenient."}),e.jsx(u,{code:`getUser: (req) => {
  const key = new URL(req.url).searchParams.get('apiKey')
  return key === process.env.API_KEY ? { userId: 'server' } : null
}`}),e.jsxs("h2",{id:"authorize",children:[e.jsx("code",{children:"authorize"})," — per-channel access control"]}),e.jsxs("p",{children:["Called after ",e.jsx("code",{children:"getUser"})," succeeds. Controls whether an authenticated user may ",e.jsx("strong",{children:"subscribe"}),","," ",e.jsx("strong",{children:"publish"}),", or use ",e.jsx("strong",{children:"presence"})," on a specific channel. Return a ",e.jsx("code",{children:"ChannelPermissions"})," object for fine-grained control, or a plain ",e.jsx("code",{children:"boolean"})," as shorthand (",e.jsx("code",{children:"true"})," = all permissions, ",e.jsx("code",{children:"false"})," = deny all →"," ",e.jsx("strong",{children:"403 Forbidden"}),")."]}),e.jsxs("p",{children:[e.jsx("code",{children:"unsubscribe"})," actions are always allowed and bypass this hook — they are cleanup operations and cannot be used to exfiltrate data."]}),e.jsxs("p",{children:["When ",e.jsx("code",{children:"authorize"})," is omitted, all authenticated users are permitted on all channels."]}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`import type { AuthorizeFn, ChannelPermissions, ParsedChannel } from '@realtimejs/core'

type AuthorizeFn = (
  userId: string,
  channel: ParsedChannel,   // { namespace, params, raw }
) => ChannelPermissions | boolean | Promise<ChannelPermissions | boolean>

interface ChannelPermissions {
  subscribe: boolean
  publish: boolean
  presence: boolean
}

interface ParsedChannel {
  namespace: string              // e.g. "todos"
  params: Record<string, string> // e.g. { projectId: "abc" }
  raw: string                    // e.g. "todos:projectId=abc"
}`}),e.jsxs("p",{children:["When you return a boolean, it is expanded via"," ",e.jsx("code",{children:"normalizePermissions"}),": ",e.jsx("code",{children:"true"})," becomes"," ",e.jsx("code",{children:"{ subscribe: true, publish: true, presence: true }"})," and"," ",e.jsx("code",{children:"false"})," denies everything."]}),e.jsx("h3",{children:"Basic role check"}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import type { AuthorizeFn } from '@realtimejs/core'

const authorize: AuthorizeFn = async (userId, channel) => {
  if (channel.namespace === 'admin') {
    const user = await db.users.findById(userId)
    return user?.role === 'admin'   // boolean shorthand
  }
  // All authenticated users get full access to other channels
  return true
}

export const realtime = createStartHandler({
  getUser: async (req) => resolveUser(req),
  authorize,
})`}),e.jsx("h3",{children:"Namespace-based access control"}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"channel.namespace"})," and ",e.jsx("code",{children:"channel.params"})," ","instead of manually parsing the raw channel string."]}),e.jsx(u,{code:`authorize: async (userId, channel) => {
  switch (channel.namespace) {
    case 'todos': {
      const member = await db.projectMembers.findFirst({
        where: { userId, projectId: channel.params.projectId },
      })
      if (!member) return false
      return {
        subscribe: true,
        publish: member.role === 'admin',
        presence: true,
      }
    }
    case 'announcements':
      return { subscribe: true, publish: false, presence: false }
    default:
      return false
  }
}`}),e.jsx("h3",{children:"Rate limiting publishes"}),e.jsx("p",{children:"Reject client-initiated publishes when they exceed a per-user rate limit."}),e.jsx(u,{code:`import { RateLimiter } from './rateLimiter'

const limiter = new RateLimiter({ max: 60, window: 60_000 }) // 60 publishes/minute

authorize: (userId, channel) => {
  if (!limiter.check(userId)) {
    return { subscribe: true, publish: false, presence: true }
  }
  return true
}`}),e.jsx("h2",{id:"lifecycle-hooks",children:"Lifecycle hooks"}),e.jsxs("p",{children:["In addition to the request hooks above, both"," ",e.jsx("code",{children:"createSseHandler"})," and ",e.jsx("code",{children:"createStartHandler"})," accept optional lifecycle callbacks that fire on connection and channel state changes. All lifecycle hooks are ",e.jsx("strong",{children:"fire-and-forget"})," — errors are logged to ",e.jsx("code",{children:"console.error"})," but never propagate to the client."]}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`import type { LifecycleHooks } from '@realtimejs/core'

interface LifecycleHooks {
  /** Fires after getUser succeeds and the SSE stream is established. */
  onClientConnect?: (info: { connectionId: string; userId: string }) => void

  /** Fires when the SSE stream closes (client disconnect or network drop). */
  onClientDisconnect?: (info: { connectionId: string; userId: string }) => void

  /** Fires when the first subscriber joins a previously-empty channel. */
  onFirstSubscriber?: (channel: string) => void

  /** Fires when the last subscriber leaves a channel (count → 0). */
  onChannelEmpty?: (channel: string) => void
}`}),e.jsx("h3",{children:"Metrics and resource management"}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'

export const realtime = createStartHandler({
  getUser: async (req) => resolveUser(req),
  authorize,

  onClientConnect: ({ connectionId, userId }) => {
    metrics.increment('realtime.connections', { userId })
    console.log('[realtime] connected', connectionId, userId)
  },

  onClientDisconnect: ({ connectionId, userId }) => {
    metrics.decrement('realtime.connections', { userId })
    console.log('[realtime] disconnected', connectionId, userId)
  },

  onFirstSubscriber: (channel) => {
    // Spin up a live query or background task for this channel
    startLiveQuery(channel)
  },

  onChannelEmpty: (channel) => {
    // Tear down resources when no one is listening
    stopLiveQuery(channel)
  },
})`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Error isolation."})," If a lifecycle callback throws, the error is caught and logged. The SSE connection and client actions are never affected by lifecycle hook failures."]})}),e.jsxs("h2",{id:"createValidatedPublish",children:[e.jsx("code",{children:"createValidatedPublish"})," — outbound payload validation"]}),e.jsxs("p",{children:["A factory that wraps any ",e.jsx("code",{children:"PublishFn"})," with a validation step. Call it in server functions to validate (and optionally transform) payloads before they are broadcast. Returns"," ",e.jsx("code",{children:"{ accepted: false, reason }"})," to throw a"," ",e.jsx("code",{children:"PublishValidationError"}),", or"," ",e.jsx("code",{children:"{ accepted: true, data: transformed }"})," to replace the payload."]}),e.jsxs("p",{children:["Imported from ",e.jsx("code",{children:"@realtimejs/core"}),"."]}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`import {
  createValidatedPublish,
  PublishValidationError,
} from '@realtimejs/core'

// ValidatePublishFn signature
type ValidatePublishFn = (params: {
  channel: ParsedChannel   // { namespace, params, raw }
  rawChannel: string
  data: unknown
  userId?: string
}) => PublishValidationResult | Promise<PublishValidationResult>

// PublishValidationResult discriminated union
type PublishValidationResult =
  | { accepted: true; data?: unknown }   // data replaces original payload
  | { accepted: false; reason?: string } // throws PublishValidationError`}),e.jsx("h3",{children:"Schema validation with Zod"}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { createValidatedPublish } from '@realtimejs/core'
import { z } from 'zod'

const TodoEvent = z.object({
  action: z.enum(['insert', 'update', 'delete']),
  data: z.object({ id: z.string(), title: z.string(), done: z.boolean() }),
})

export const realtime = createStartHandler({ getUser: resolveUser })

export const realtimePublish = createValidatedPublish({
  publish: realtime.publish,
  validate: async ({ channel, data }) => {
    if (channel.namespace === 'todos') {
      const result = TodoEvent.safeParse(data)
      if (!result.success) {
        return { accepted: false, reason: result.error.message }
      }
      return { accepted: true, data: result.data }  // use parsed/coerced data
    }
    return { accepted: true }
  },
})`}),e.jsx("h3",{children:"Payload transformation"}),e.jsxs("p",{children:["Return ",e.jsx("code",{children:"{ accepted: true, data: transformed }"})," to strip sensitive fields or attach server-side metadata before broadcasting."]}),e.jsx(u,{code:`validate: async ({ channel, data }) => {
  if (channel.namespace === 'chat') {
    const msg = data as { text: string; clientSecret: string }
    // Strip the client-only field before broadcasting
    return {
      accepted: true,
      data: { text: msg.text, timestamp: Date.now() },
    }
  }
  return { accepted: true }
}`}),e.jsxs("h2",{id:"publish",children:[e.jsx("code",{children:"handler.publish"})," — server-initiated broadcast"]}),e.jsxs("p",{children:["Available on ",e.jsx("code",{children:"StartRealtimeHandler"})," (from"," ",e.jsx("code",{children:"createStartHandler"}),"). Delivers a message to all clients subscribed to the channel. Call this from TanStack Start server functions after a database mutation."]}),e.jsxs("p",{children:[e.jsx("code",{children:"createSseHandler"})," exposes the equivalent as"," ",e.jsx("code",{children:"handler.broadcast(channel, data)"})," — a synchronous, string- only variant."]}),e.jsx(u,{title:"app/server/functions/todos.ts",code:`import { createServerFn } from '@tanstack/start'
import { realtimePublish } from '../realtime'
import { db } from '../db'

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const updated = await db.todos.update(data.id, data)

    // Broadcast to all subscribed clients — accepts QueryKey or string
    await realtimePublish(['todos', { projectId: data.projectId }], {
      action: 'update',
      data:   updated,
    })

    return updated
  })`}),e.jsxs("h2",{id:"pingInterval",children:[e.jsx("code",{children:"pingInterval"})," — keep-alive pings"]}),e.jsxs("p",{children:["Controls how often the server sends a ",e.jsx("code",{children:"ping"})," event over the SSE stream to prevent the connection from being closed by proxies and load balancers. Set to ",e.jsx("code",{children:"0"})," to disable."]}),e.jsx(u,{code:`import { createSseHandler } from '@realtimejs/adapter-sse'

const sse = createSseHandler({
  pingInterval: 15_000,  // ping every 15 s (default: 30 000 ms)
})`}),e.jsxs("h2",{id:"dispose",children:[e.jsx("code",{children:"handler.dispose"})," — cleanup on shutdown"]}),e.jsxs("p",{children:["Available on ",e.jsx("code",{children:"StartRealtimeHandler"}),". When a"," ",e.jsx("code",{children:"PublishBackend"})," with a ",e.jsx("code",{children:"subscribe"})," callback is provided, ",e.jsx("code",{children:"dispose()"})," calls the backend's unsubscribe function. Call it on server shutdown or during hot-module replacement to release the backend connection."]}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { redisBackend } from './redisBackend'

export const realtime = createStartHandler({
  backend: redisBackend,
  getUser:  resolveUser,
})

// Vite HMR — release the Redis subscription when the module hot-reloads
if (import.meta.hot) {
  import.meta.hot.dispose(() => realtime.dispose())
}`}),e.jsx("h2",{id:"patterns",children:"Common patterns"}),e.jsx("h3",{id:"pattern-logging",children:"Logging"}),e.jsxs("p",{children:["Use lifecycle hooks for connection tracking and ",e.jsx("code",{children:"authorize"})," ","for access decisions."]}),e.jsx(u,{code:`export const realtime = createStartHandler({
  getUser: async (req) => resolveUser(req),

  authorize: async (userId, channel) => {
    const allowed = await canAccess(userId, channel)
    console.log(
      \`[realtime] authorize userId=\${userId} channel=\${channel.raw} allowed=\${JSON.stringify(allowed)}\`
    )
    return allowed
  },

  onClientConnect: ({ connectionId, userId }) => {
    console.log(\`[realtime] connect userId=\${userId} conn=\${connectionId}\`)
  },
  onClientDisconnect: ({ connectionId, userId }) => {
    console.log(\`[realtime] disconnect userId=\${userId} conn=\${connectionId}\`)
  },
})`}),e.jsx("h3",{id:"pattern-metrics",children:"Metrics"}),e.jsxs("p",{children:["Track active connection count with"," ",e.jsx("code",{children:"handler.connectionCount()"})," (available on"," ",e.jsx("code",{children:"SseHandler"})," from ",e.jsx("code",{children:"createSseHandler"}),"). Expose it from a health-check endpoint or push it to your metrics store periodically."]}),e.jsx(u,{title:"app/routes/api/health.ts",code:`import { createAPIFileRoute } from '@tanstack/start/api'
import { sseHandler } from '../../server/realtime'

export const Route = createAPIFileRoute('/api/health')({
  GET: () =>
    Response.json({
      status:      'ok',
      connections: sseHandler.connectionCount(),
    }),
})`}),e.jsxs("div",{className:"doc-callout",children:[e.jsx("strong",{children:"Note."})," ",e.jsx("code",{children:"connectionCount()"})," is available directly on the ",e.jsx("code",{children:"SseHandler"})," returned by"," ",e.jsx("code",{children:"createSseHandler"}),". If you use"," ",e.jsx("code",{children:"createStartHandler"}),", it creates an internal SSE handler that is not directly exposed — use ",e.jsx("code",{children:"createSseHandler"})," ","directly when you need metrics access."]}),e.jsx("h3",{id:"pattern-auth",children:"Full authentication + authorization setup"}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { createValidatedPublish } from '@realtimejs/core'
import type { AuthorizeFn } from '@realtimejs/core'
import { verifyJwt } from './auth'
import { db } from './db'
import { z } from 'zod'

const TodoSchema = z.object({
  action: z.enum(['insert', 'update', 'delete']),
  data:   z.object({ id: z.string(), title: z.string(), done: z.boolean() }),
})

const authorize: AuthorizeFn = async (userId, channel) => {
  switch (channel.namespace) {
    case 'todos': {
      const member = await db.query.projectMembers.findFirst({
        where: (m, { and, eq }) =>
          and(eq(m.userId, userId), eq(m.projectId, channel.params.projectId)),
      })
      if (!member) return false
      return {
        subscribe: true,
        publish: member.role === 'admin',
        presence: true,
      }
    }
    default:
      return false
  }
}

export const realtime = createStartHandler({
  // 1. Authenticate every request
  getUser: async (req) => {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const { sub } = await verifyJwt(auth.slice(7), process.env.JWT_SECRET!)
      return { userId: sub }
    } catch {
      return null
    }
  },

  // 2. Per-channel access control (unified AuthorizeFn)
  authorize,

  // 3. Lifecycle hooks
  onClientConnect: ({ userId }) => {
    console.log('[realtime] connected', userId)
  },
  onClientDisconnect: ({ userId }) => {
    console.log('[realtime] disconnected', userId)
  },
})

// 4. Wrap the publish function with payload validation
export const realtimePublish = createValidatedPublish({
  publish: realtime.publish,
  validate: ({ channel, data }) => {
    if (channel.namespace === 'todos') {
      const result = TodoSchema.safeParse(data)
      return result.success
        ? { accepted: true, data: result.data }
        : { accepted: false, reason: result.error.message }
    }
    return { accepted: true }
  },
})`}),e.jsx("h2",{id:"api-summary",children:"API summary"}),e.jsxs("table",{className:"doc-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Hook / method"}),e.jsx("th",{children:"Package"}),e.jsx("th",{children:"When it fires"}),e.jsx("th",{children:"Return value"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"getUser(req)"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})}),e.jsx("td",{children:"Every GET + POST request"}),e.jsxs("td",{children:[e.jsx("code",{children:"{ userId }"})," or ",e.jsx("code",{children:"null"})," → 401"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"authorize(userId, channel)"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})}),e.jsx("td",{children:"subscribe and publish actions (not unsubscribe)"}),e.jsxs("td",{children:[e.jsx("code",{children:"ChannelPermissions | boolean"})," — ",e.jsx("code",{children:"false"})," → 403"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs("code",{children:["createValidatedPublish","({ publish, validate })"]})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsx("td",{children:"Wraps a publish fn; validate called before every broadcast"}),e.jsx("td",{children:"Accepted / rejected / transformed payload"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onClientConnect"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})}),e.jsx("td",{children:"SSE stream opened and authenticated"}),e.jsxs("td",{children:[e.jsx("code",{children:"void"})," (fire-and-forget)"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onClientDisconnect"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})}),e.jsx("td",{children:"SSE stream closed"}),e.jsxs("td",{children:[e.jsx("code",{children:"void"})," (fire-and-forget)"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onFirstSubscriber"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})}),e.jsx("td",{children:"First client subscribes to a channel"}),e.jsxs("td",{children:[e.jsx("code",{children:"void"})," (fire-and-forget)"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onChannelEmpty"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})}),e.jsx("td",{children:"Last subscriber leaves a channel"}),e.jsxs("td",{children:[e.jsx("code",{children:"void"})," (fire-and-forget)"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"handler.publish(channel, data)"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/preset-start"})}),e.jsx("td",{children:"Called explicitly in server functions"}),e.jsx("td",{children:e.jsxs("code",{children:["Promise","<void>"]})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"sseHandler.broadcast(channel, data)"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})}),e.jsx("td",{children:"Called explicitly; synchronous, string channel only"}),e.jsx("td",{children:e.jsx("code",{children:"void"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"sseHandler.connectionCount()"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/adapter-sse"})}),e.jsx("td",{children:"On demand (health checks, metrics)"}),e.jsx("td",{children:e.jsx("code",{children:"number"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"handler.dispose()"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/preset-start"})}),e.jsx("td",{children:"Server shutdown / HMR"}),e.jsx("td",{children:e.jsx("code",{children:"void"})})]})]})]})]})}function Bj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"API Reference"}),e.jsx("p",{className:"doc-lead",children:"Complete reference for all exported functions, hooks, types, and utilities across the realtime.js packages."}),e.jsx("h2",{id:"realtime-core",children:"@realtimejs/core"}),e.jsx("p",{children:"Framework-agnostic core. Includes the client factory, collection helpers, CRDT primitives, transport utilities, and server-side streaming."}),e.jsx("h3",{id:"client",children:"Client"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createRealtimeClient"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: RealtimeClientOptions) => RealtimeClient"})}),e.jsx("td",{children:"Creates a framework-agnostic realtime client that wraps a transport, exposing connect, disconnect, subscribe, publish, and presence methods."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"serializeKey"})}),e.jsx("td",{children:e.jsx("code",{children:"(key: QueryKey) => string"})}),e.jsxs("td",{children:["Deterministically serializes a ",e.jsx("code",{children:"QueryKey"})," array into a stable channel string. Used internally by all collection helpers."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"parseChannel"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: string) => ParsedChannel"})}),e.jsx("td",{children:"Parses a serialized channel string back into its base name and params object."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"hasPresence"})}),e.jsx("td",{children:e.jsx("code",{children:"(transport: RealtimeTransport) => transport is PresenceCapable"})}),e.jsxs("td",{children:["Type guard that checks whether a transport implements the optional"," ",e.jsx("code",{children:"PresenceCapable"})," interface."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"getCapabilities"})}),e.jsx("td",{children:e.jsx("code",{children:"(transport: RealtimeTransport) => TransportCapabilities"})}),e.jsxs("td",{children:["Returns the declared ",e.jsx("code",{children:"TransportCapabilities"})," (",e.jsx("code",{children:"presence"}),", ",e.jsx("code",{children:"serverAssistedRecovery"}),","," ",e.jsx("code",{children:"history"}),", ",e.jsx("code",{children:"ephemeral"}),"). If the transport doesn’t declare ",e.jsx("code",{children:"capabilities"}),", a conservative default is derived from its shape (",e.jsx("code",{children:"presence"})," via"," ",e.jsx("code",{children:"hasPresence"}),", everything else assumed least-capable except ",e.jsx("code",{children:"ephemeral"}),"). Use it to degrade UI gracefully when a feature is unavailable."]})]})]})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," createRealtimeClient ","}"," from '@realtimejs/core'"]})]}),e.jsx("h3",{id:"collections",children:"Collection Sources"}),e.jsxs("p",{children:["These functions create TanStack DB ",e.jsx("code",{children:"CollectionConfig"})," ","objects. Pass the result to ",e.jsx("code",{children:"createCollection()"})," from"," ",e.jsx("code",{children:"@tanstack/db"}),"."]}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"realtimeCollectionOptions"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: RealtimeCollectionConfig) => CollectionConfig"})}),e.jsx("td",{children:"Full-featured realtime collection with insert / update / delete semantics, optional per-field CRDT convergence, and optimistic mutations."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"liveChannelOptions"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: LiveChannelConfig) => CollectionConfig"})}),e.jsxs("td",{children:["Append-only live channel. Every event that passes"," ",e.jsx("code",{children:"onEvent"})," is inserted as a new row — designed for chat messages, game events, and activity feeds."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"streamChannelOptions"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: StreamChannelConfig) => CollectionConfig"})}),e.jsxs("td",{children:["Reduce-based streaming collection. Folds incoming events into a single reactive item with ",e.jsx("code",{children:"status"})," tracking (pending / streaming / done / error / stale)."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"presenceChannelOptions"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: PresenceCollectionConfig) => CollectionConfig"})}),e.jsx("td",{children:"Presence as a TanStack DB collection. Each connected peer is a row; the collection updates reactively as members join and leave."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"ephemeralLiveOptions"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: EphemeralLiveConfig) => CollectionConfig"})}),e.jsx("td",{children:"Ephemeral live channel where rows expire automatically after a configurable TTL — useful for typing indicators and transient state."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"tickCollectionOptions"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: TickCollectionConfig) => CollectionConfig"})}),e.jsxs("td",{children:["Game-tick collection for high-frequency state updates. Works with"," ",e.jsx("code",{children:"useTickBatching"})," to batch mutations per tick."]})]})]})]}),e.jsx("h3",{id:"channel-definitions",children:"Channel Definitions"}),e.jsx("p",{children:"Typed channel descriptors created at module level and reused across components."}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createPresenceChannel"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: PresenceChannelConfig) => PresenceChannelDef"})}),e.jsxs("td",{children:["Define a typed presence channel. Pass the result to"," ",e.jsx("code",{children:"usePresence"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createStreamChannel"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: StreamChannelDefConfig) => StreamChannelDef"})}),e.jsxs("td",{children:["Define a typed stream channel (with initial state, reduce, isDone, isError). Pass the result to ",e.jsx("code",{children:"useStream"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"defineSyncedCounter"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: SyncedCounterConfig) => SyncedCounterDef"})}),e.jsxs("td",{children:["Define a PN-Counter CRDT channel. Pass the result to"," ",e.jsx("code",{children:"useSyncedCounter"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"defineSyncedValue"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: SyncedValueConfig) => SyncedValueDef"})}),e.jsxs("td",{children:["Define a LWW-Register CRDT channel. Pass the result to"," ",e.jsx("code",{children:"useSyncedValue"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"defineSyncedSet"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: SyncedSetConfig) => SyncedSetDef"})}),e.jsxs("td",{children:["Define an OR-Set CRDT channel. Pass the result to"," ",e.jsx("code",{children:"useSyncedSet"}),"."]})]})]})]}),e.jsx("h3",{id:"db-helpers",children:"DB Composition Helpers"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"withRest"})}),e.jsx("td",{children:e.jsxs("code",{children:["(options: WithRestOptions) => ","{"," getKey, queryFn, onInsert, onUpdate, onDelete ","}"]})}),e.jsxs("td",{children:["Generates ",e.jsx("code",{children:"queryFn"})," and mutation callbacks for a standard REST/JSON API. Spread into"," ",e.jsx("code",{children:"realtimeCollectionOptions"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"withServerFns"})}),e.jsx("td",{children:e.jsxs("code",{children:["(options: WithServerFnsOptions) => ","{"," getKey, queryFn, onInsert, onUpdate, onDelete ","}"]})}),e.jsxs("td",{children:["Generates ",e.jsx("code",{children:"queryFn"})," and mutation callbacks from TanStack Start server functions. Spread into"," ",e.jsx("code",{children:"realtimeCollectionOptions"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"serverStreamCallbacks"})}),e.jsx("td",{children:e.jsxs("code",{children:["{"," isDone, isError ","}",": Partial<StreamChannelConfig>"]})}),e.jsxs("td",{children:["Pre-built ",e.jsx("code",{children:"isDone"})," / ",e.jsx("code",{children:"isError"})," callbacks that detect the sentinel events emitted by"," ",e.jsx("code",{children:"createServerStream"}),". Spread into"," ",e.jsx("code",{children:"streamChannelOptions"}),"."]})]})]})]}),e.jsx("h3",{id:"crdt-primitives",children:"CRDT Primitives"}),e.jsx("h4",{children:"Lamport Clock"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"generateClientId"})}),e.jsx("td",{children:e.jsx("code",{children:"() => string"})}),e.jsx("td",{children:"Generate a random unique client identifier."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"tickClock"})}),e.jsx("td",{children:e.jsx("code",{children:"() => number"})}),e.jsx("td",{children:"Increment and return the module-level Lamport clock. Call before publishing a LWW write."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"advanceClock"})}),e.jsx("td",{children:e.jsx("code",{children:"(remote: number) => void"})}),e.jsx("td",{children:"Advance the local clock past a received remote timestamp — ensures monotonicity."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"resetClock"})}),e.jsx("td",{children:e.jsx("code",{children:"() => void"})}),e.jsx("td",{children:"Reset the clock to zero (for testing)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createClock"})}),e.jsx("td",{children:e.jsx("code",{children:"() => LamportClock"})}),e.jsx("td",{children:"Create an isolated Lamport clock instance (tick, advance, reset, get)."})]})]})]}),e.jsx("h4",{children:"LWW-Register (Last-Write-Wins)"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"lwwWins"})}),e.jsx("td",{children:e.jsx("code",{children:"(current: LwwState, incoming: LwwState) => boolean"})}),e.jsxs("td",{children:["Returns ",e.jsx("code",{children:"true"})," if ",e.jsx("code",{children:"incoming"})," should replace"," ",e.jsx("code",{children:"current"}),", using Lamport clock + client ID tie-breaking."]})]})})]}),e.jsx("h4",{children:"PN-Counter (Positive-Negative)"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"pnValue"})}),e.jsx("td",{children:e.jsx("code",{children:"(state: PnState) => number"})}),e.jsx("td",{children:"Compute the current counter value from PN-Counter state."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"mergePn"})}),e.jsx("td",{children:e.jsx("code",{children:"(a: PnState, b: PnState) => PnState"})}),e.jsx("td",{children:"Merge two PN-Counter states by taking the max per client entry."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"pnIncrement"})}),e.jsx("td",{children:e.jsx("code",{children:"(state: PnState, clientId: string, by?: number) => PnState"})}),e.jsxs("td",{children:["Return a new state with the increment vector for"," ",e.jsx("code",{children:"clientId"})," raised by ",e.jsx("code",{children:"by"})," (default 1)."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"pnDecrement"})}),e.jsx("td",{children:e.jsx("code",{children:"(state: PnState, clientId: string, by?: number) => PnState"})}),e.jsxs("td",{children:["Return a new state with the decrement vector for"," ",e.jsx("code",{children:"clientId"})," raised by ",e.jsx("code",{children:"by"})," (default 1)."]})]})]})]}),e.jsx("h4",{children:"OR-Set (Observed-Remove Set)"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"orValues"})}),e.jsx("td",{children:e.jsx("code",{children:"<T>(state: OrState) => Array<T>"})}),e.jsx("td",{children:"Extract the current element values from OR-Set state."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"mergeOr"})}),e.jsx("td",{children:e.jsx("code",{children:"(a: OrState, b: OrState) => OrState"})}),e.jsx("td",{children:"Merge two OR-Set states (union of entries, preserving unique tags)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"compactOr"})}),e.jsx("td",{children:e.jsx("code",{children:"(state: OrState) => OrState"})}),e.jsx("td",{children:"Remove duplicate logical entries, keeping only the latest unique tag per value."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"orAdd"})}),e.jsx("td",{children:e.jsx("code",{children:"<T>(state: OrState, item: T) => OrState"})}),e.jsxs("td",{children:["Return a new state with ",e.jsx("code",{children:"item"})," added using a fresh unique tag."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"orRemove"})}),e.jsx("td",{children:e.jsx("code",{children:"<T>(state: OrState, item: T) => OrState"})}),e.jsxs("td",{children:["Return a new state with all entries matching ",e.jsx("code",{children:"item"})," ","removed."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"orHas"})}),e.jsx("td",{children:e.jsx("code",{children:"<T>(state: OrState, item: T) => boolean"})}),e.jsxs("td",{children:["Return ",e.jsx("code",{children:"true"})," if ",e.jsx("code",{children:"item"})," is present in the OR-Set (structural equality via JSON)."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"initOrFromArray"})}),e.jsx("td",{children:e.jsx("code",{children:"<T>(items: Array<T>) => OrState"})}),e.jsx("td",{children:"Seed an OR-Set from an array — each element gets a fresh unique tag."})]})]})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," pnValue, mergePn ","}"," from '@realtimejs/core'"]})]}),e.jsx("h3",{id:"stream-processing",children:"Stream Processing"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createStreamProcessor"})}),e.jsx("td",{children:e.jsx("code",{children:"<TState, TEvent>(config: StreamProcessorConfig, initial: TState, onTransition: StreamTransitionCallback) => StreamProcessor"})}),e.jsxs("td",{children:["Pure state-machine that folds events via ",e.jsx("code",{children:"reduce"})," /"," ",e.jsx("code",{children:"isDone"})," / ",e.jsx("code",{children:"isError"})," and fires a callback on every transition."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"processEvent"})}),e.jsx("td",{children:e.jsx("code",{children:"<TState, TEvent>(config, snapshot, event) => ProcessEventResult"})}),e.jsx("td",{children:"Single-step version of the stream processor — process one event against an existing snapshot and return the new snapshot."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"stripEnvelope"})}),e.jsx("td",{children:e.jsx("code",{children:"(event: unknown) => EnvelopeResult"})}),e.jsxs("td",{children:["Strip framework metadata (",e.jsx("code",{children:"_seq"}),", ",e.jsx("code",{children:"_ts"}),","," ",e.jsx("code",{children:"_signature"}),") from a received event, returning the clean user payload."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"withEnvelopeStripping"})}),e.jsx("td",{children:e.jsx("code",{children:"(handler: (event: unknown) => void) => (raw: unknown) => void"})}),e.jsx("td",{children:"Middleware that strips the framework envelope before forwarding to a handler."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"withHeartbeatFilter"})}),e.jsx("td",{children:e.jsx("code",{children:"(handler, options?: HeartbeatFilterOptions) => (raw: unknown) => void"})}),e.jsxs("td",{children:["Middleware that intercepts ",e.jsx("code",{children:"__stream:heartbeat"})," events, calls ",e.jsx("code",{children:"onHeartbeat"}),", and prevents them from reaching the downstream handler."]})]})]})]}),e.jsx("h3",{id:"server-utilities",children:"Server Utilities"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createServerStream"})}),e.jsx("td",{children:e.jsx("code",{children:"<TEvent>(options: CreateServerStreamOptions) => ServerStream<TEvent>"})}),e.jsxs("td",{children:["Create a server-side stream handle with ",e.jsx("code",{children:"push()"}),","," ",e.jsx("code",{children:"done()"}),", and ",e.jsx("code",{children:"error()"}),". Adds sequence numbers, optional HMAC signing, heartbeats, and checkpointing."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"verifyEventSignature"})}),e.jsx("td",{children:e.jsx("code",{children:"(event: unknown, signature: string | undefined, hmacKey: string) => Promise<boolean>"})}),e.jsx("td",{children:"Verify an HMAC-SHA256 signature on a received event using constant-time comparison."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createValidatedPublish"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: ValidatedPublishOptions) => PublishFn"})}),e.jsxs("td",{children:["Wrap a ",e.jsx("code",{children:"PublishFn"})," with per-channel permission checks and an optional payload validation function."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"PublishValidationError"})}),e.jsx("td",{children:e.jsx("code",{children:"class PublishValidationError extends Error"})}),e.jsxs("td",{children:["Thrown by a ",e.jsx("code",{children:"createValidatedPublish"})," publish when the payload validation function rejects the message. Carries the validation ",e.jsx("code",{children:"reason"})," as its message."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"STREAM_DONE"})}),e.jsx("td",{children:e.jsx("code",{children:"'__stream:done'"})}),e.jsxs("td",{children:["Sentinel ",e.jsx("code",{children:"type"})," value pushed by"," ",e.jsx("code",{children:"ServerStream.done()"}),". Use in ",e.jsx("code",{children:"isDone"})," ","callbacks."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"STREAM_ERROR"})}),e.jsx("td",{children:e.jsx("code",{children:"'__stream:error'"})}),e.jsxs("td",{children:["Sentinel ",e.jsx("code",{children:"type"})," value pushed by"," ",e.jsx("code",{children:"ServerStream.error()"}),". Use in ",e.jsx("code",{children:"isError"})," ","callbacks."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"STREAM_HEARTBEAT"})}),e.jsx("td",{children:e.jsx("code",{children:"'__stream:heartbeat'"})}),e.jsxs("td",{children:["Sentinel ",e.jsx("code",{children:"type"})," value pushed by the heartbeat timer. Consumed by ",e.jsx("code",{children:"withHeartbeatFilter"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"ConflictError"})}),e.jsx("td",{children:e.jsx("code",{children:"class ConflictError extends Error"})}),e.jsx("td",{children:"Error class thrown when an optimistic mutation is rejected due to a server-side conflict (HTTP 409)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"isConflictError"})}),e.jsx("td",{children:e.jsx("code",{children:"(e: unknown) => e is ConflictError"})}),e.jsx("td",{children:"Type guard for ConflictError."})]})]})]}),e.jsx("h3",{id:"transport-wrappers",children:"Transport Wrappers & Utilities"}),e.jsx("h4",{children:"Tick Transport"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useTickBatching"})}),e.jsx("td",{children:e.jsx("code",{children:"(transport: RealtimeTransport, options?: TickTransportOptions) => TickHandle"})}),e.jsx("td",{children:"Registers tick-batching hooks on a transport to batch outgoing publish calls at a fixed tick interval — ideal for game state with high-frequency updates."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"computeDelta"})}),e.jsx("td",{children:e.jsx("code",{children:"(prev: TickFrame, next: TickFrame) => TickFrame"})}),e.jsx("td",{children:"Compute only the fields that changed between two tick frames (for bandwidth reduction)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"applyDelta"})}),e.jsx("td",{children:e.jsx("code",{children:"(state: TickFrame, delta: TickFrame) => TickFrame"})}),e.jsx("td",{children:"Apply a delta frame onto an existing state to reconstruct the full state."})]})]})]}),e.jsx("h4",{children:"Offline Queue"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useOfflineQueue"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: OfflineQueueOptions) => OfflineQueueTransport"})}),e.jsx("td",{children:"Transport wrapper that buffers outgoing publish calls while disconnected and drains them in order on reconnect."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createIndexedDBStorage"})}),e.jsx("td",{children:e.jsx("code",{children:"(options?: IndexedDBStorageOptions) => OfflineQueueStorage"})}),e.jsx("td",{children:"Durable storage backend for the offline queue backed by IndexedDB. Survives page reloads."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createLocalStorageAdapter"})}),e.jsx("td",{children:e.jsx("code",{children:"(options?: LocalStorageOptions) => OfflineQueueStorage"})}),e.jsx("td",{children:"Lightweight storage backend for the offline queue backed by localStorage."})]})]})]}),e.jsx("h4",{children:"Deduplication"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createDedup"})}),e.jsx("td",{children:e.jsx("code",{children:"(options?: DedupOptions) => DeduplicationFilter"})}),e.jsx("td",{children:"Create a deduplication filter that suppresses replayed messages with the same sequence number."})]})})]}),e.jsx("h4",{children:"Gap Recovery"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useGapRecovery"})}),e.jsx("td",{children:e.jsx("code",{children:"(transport: RealtimeTransport, options: GapRecoveryOptions) => GapRecoveryTransport"})}),e.jsx("td",{children:"Transport wrapper that detects sequence gaps and triggers a recovery fetch when messages are missed during a reconnect."})]})})]}),e.jsx("h4",{children:"Throttle"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"throttle"})}),e.jsx("td",{children:e.jsx("code",{children:"<T extends (...args: any[]) => any>(fn: T, options: ThrottleOptions) => ThrottledFn<T>"})}),e.jsx("td",{children:"Rate-limit any function. Used internally for presence updates and cursor broadcasts."})]})})]}),e.jsx("h4",{children:"Ephemeral Map"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createEphemeralMap"})}),e.jsx("td",{children:e.jsx("code",{children:"<T>(options?: EphemeralMapOptions) => EphemeralMap<T>"})}),e.jsxs("td",{children:["A TTL-expiring key-value map. Entries are evicted after their TTL elapses — powers ",e.jsx("code",{children:"ephemeralLiveOptions"}),"."]})]})})]}),e.jsx("h4",{children:"Hook Pipeline"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createHookPipeline"})}),e.jsx("td",{children:e.jsx("code",{children:"() => HookPipeline"})}),e.jsxs("td",{children:["Creates a hook pipeline that executes registered hooks in priority order. The engine behind the transport’s ",e.jsx("code",{children:"hook()"})," ","method. Exposes typed methods for each hook point:"," ",e.jsx("code",{children:"onConnect"}),", ",e.jsx("code",{children:"onDisconnect"}),","," ",e.jsx("code",{children:"onReconnect"}),", ",e.jsx("code",{children:"beforePublish"}),","," ",e.jsx("code",{children:"beforeDeliver"}),", ",e.jsx("code",{children:"onChannelSubscribe"}),", and"," ",e.jsx("code",{children:"onChannelUnsubscribe"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createHookableTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"(inner: RealtimeTransport) => RealtimeTransport"})}),e.jsx("td",{children:"Wraps any transport that doesn’t natively implement the hook pipeline, adding hook functionality. Tracks active channels for reconnect hooks and connection status transitions. Use this to add hooks to custom or third-party transports."})]})]})]}),e.jsx("h4",{children:"Channel Utilities"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"deriveChannelFromUrl"})}),e.jsx("td",{children:e.jsx("code",{children:"(url: string) => string"})}),e.jsxs("td",{children:["Derives a channel name from a REST URL by extracting the last path segment as the namespace and query parameters as channel params. Strips ",e.jsx("code",{children:"/api"})," or"," ",e.jsxs("code",{children:["/api/v","<","N",">"]})," ","prefixes. Auto-used by ",e.jsx("code",{children:"useRealtimeCollection"})," when a"," ",e.jsx("code",{children:"url"})," is provided without an explicit"," ",e.jsx("code",{children:"channel"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"normalizePermissions"})}),e.jsx("td",{children:e.jsx("code",{children:"(result: ChannelPermissions | boolean) => ChannelPermissions"})}),e.jsxs("td",{children:["Normalizes a boolean or ",e.jsx("code",{children:"ChannelPermissions"})," object into a full ",e.jsx("code",{children:"ChannelPermissions"})," shape. Boolean"," ",e.jsx("code",{children:"true"})," maps to all permissions granted;"," ",e.jsx("code",{children:"false"})," maps to all denied."]})]})]})]}),e.jsx("h4",{children:"Multi-Tab Coordination"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createCoordinatedTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: CoordinatedTransportOptions) => RealtimeTransport"})}),e.jsx("td",{children:"Recommended entry point for multi-tab transport coordination. Automatically selects SharedWorker, BroadcastChannel, or direct transport based on browser support."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createBroadcastChannelTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: BroadcastChannelTransportOptions) => RealtimeTransport"})}),e.jsx("td",{children:"Multi-tab transport using BroadcastChannel with leader election. No worker file required."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"isBroadcastChannelSupported"})}),e.jsx("td",{children:e.jsx("code",{children:"() => boolean"})}),e.jsxs("td",{children:["Returns ",e.jsx("code",{children:"true"})," if the browser supports BroadcastChannel."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createSharedWorkerTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"(workerUrl: string, options?: SharedWorkerTransportOptions) => RealtimeTransport"})}),e.jsx("td",{children:"Multi-tab transport (tab side) that delegates to a SharedWorker. Best performance; requires a worker file."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createSharedWorkerCoordinator"})}),e.jsx("td",{children:e.jsx("code",{children:"(innerTransport: RealtimeTransport, options?: SharedWorkerCoordinatorOptions) => SharedWorkerCoordinator"})}),e.jsx("td",{children:"Worker side of the SharedWorker transport. Call inside the SharedWorker file to coordinate all connected tabs through a single real connection."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"isSharedWorkerSupported"})}),e.jsx("td",{children:e.jsx("code",{children:"() => boolean"})}),e.jsxs("td",{children:["Returns ",e.jsx("code",{children:"true"})," if the browser supports SharedWorker."]})]})]})]}),e.jsx("h2",{id:"react",children:"@realtimejs/react"}),e.jsxs("p",{children:["React provider and hooks. Re-exports everything from"," ",e.jsx("code",{children:"@realtimejs/core"})," so you only need one import."]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," useRealtime ","}"," from '@realtimejs/react'"]})]}),e.jsx("h3",{id:"provider",children:"Provider"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"RealtimeProvider"})}),e.jsx("td",{children:e.jsx("code",{children:"(props: RealtimeProviderProps) => JSX.Element"})}),e.jsxs("td",{children:["Context provider that makes a ",e.jsx("code",{children:"RealtimeClient"})," ","available to all hooks. Wrap your application (or subtree) with this component. By default (",e.jsxs("code",{children:["autoConnect=","{","true","}"]}),"), calls ",e.jsx("code",{children:"client.connect()"})," on mount and"," ",e.jsx("code",{children:"client.destroy()"})," on unmount. Set"," ",e.jsxs("code",{children:["autoConnect=","{","false","}"]})," ","to manage the connection lifecycle yourself."]})]})})]}),e.jsx("h3",{id:"hooks-connection",children:"Connection Hooks"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useRealtime"})}),e.jsx("td",{children:e.jsx("code",{children:"() => UseRealtimeResult"})}),e.jsxs("td",{children:["Returns reactive connection status (",e.jsx("code",{children:"status"}),") and control functions (",e.jsx("code",{children:"connect"}),", ",e.jsx("code",{children:"disconnect"}),","," ",e.jsx("code",{children:"client"}),"). Causes a re-render only when status changes."]})]})})]}),e.jsx("h3",{id:"hooks-pubsub",children:"Pub/Sub Hooks"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useSubscribe"})}),e.jsx("td",{children:e.jsxs("code",{children:["(channel: QueryKey | string, onMessage: (data: unknown) => void) => ","{"," subscribeError: SubscribeError | null ","}"]})}),e.jsx("td",{children:"Subscribe to raw channel events for the lifetime of the component. The callback is stabilized via a ref so a new function reference never causes a re-subscription."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"usePublish"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: QueryKey | string) => (data: unknown) => Promise<void>"})}),e.jsx("td",{children:"Returns a stable publish function bound to the channel. The returned Promise resolves when the transport dispatches the message."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useChannel"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: QueryKey | string, onMessage?: (data: unknown) => void) => UseChannelResult"})}),e.jsxs("td",{children:["Convenience hook combining ",e.jsx("code",{children:"useSubscribe"})," and"," ",e.jsx("code",{children:"usePublish"})," for a single channel. The"," ",e.jsx("code",{children:"onMessage"})," callback is optional (publish-only scenario)."]})]})]})]}),e.jsx("h3",{id:"hooks-presence",children:"Presence Hooks"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"usePresence"})}),e.jsx("td",{children:e.jsx("code",{children:"(channelDef: PresenceChannelDef, options: UsePresenceOptions) => UsePresenceResult"})}),e.jsxs("td",{children:["Joins a presence channel on mount and returns ",e.jsx("code",{children:"others"})," ","(other connected users, keyed by ",e.jsx("code",{children:"connectionId"}),"),"," ",e.jsx("code",{children:"self"})," (your own last-sent data), and"," ",e.jsx("code",{children:"updatePresence"}),". Leaves on unmount. Requires a presence-capable transport."]})]})})]}),e.jsx("h3",{id:"hooks-streaming",children:"Streaming Hooks"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useStream"})}),e.jsx("td",{children:e.jsx("code",{children:"(channelDef: StreamChannelDef, options: UseStreamOptions) => UseStreamResult"})}),e.jsxs("td",{children:["Subscribes to a streaming channel and accumulates events into reactive state via the channel definition's ",e.jsx("code",{children:"reduce"})," ","function. Returns ",e.jsx("code",{children:"state"}),", ",e.jsx("code",{children:"status"}),", and"," ",e.jsx("code",{children:"error"}),"."]})]})})]}),e.jsx("h3",{id:"hooks-collections",children:"Collection Hooks"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useRealtimeCollection"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: UseRealtimeCollectionConfig) => Collection<T, TKey>"})}),e.jsxs("td",{children:["Creates and manages a realtime-backed TanStack DB collection. The"," ",e.jsx("code",{children:"Collection"})," reference is stable across renders. Pass to ",e.jsx("code",{children:"useLiveQuery"})," from ",e.jsx("code",{children:"@tanstack/react-db"}),". Accepts a ",e.jsx("code",{children:"url"})," for REST shorthand (generates"," ",e.jsx("code",{children:"queryFn"})," + CRUD callbacks automatically) or manual"," ",e.jsx("code",{children:"queryFn"})," + callbacks."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useLiveChannel"})}),e.jsx("td",{children:e.jsx("code",{children:"(config: UseLiveChannelConfig) => Collection<T, TKey>"})}),e.jsxs("td",{children:["Creates and manages an append-only live-channel collection. Every event from ",e.jsx("code",{children:"onEvent"})," is inserted as a new row. The"," ",e.jsx("code",{children:"Collection"})," reference is stable."]})]})]})]}),e.jsx("h3",{id:"hooks-crdt",children:"CRDT Hooks"}),e.jsx("p",{children:"Self-contained hooks for shared counters, values, and sets. No TanStack DB collection required."}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useSyncedCounter"})}),e.jsx("td",{children:e.jsx("code",{children:"(def: SyncedCounterDef, options: UseSyncedCounterOptions) => UseSyncedCounterResult"})}),e.jsxs("td",{children:["Subscribe to a shared counter backed by a PN-Counter CRDT. Returns"," ",e.jsx("code",{children:"value"}),", ",e.jsx("code",{children:"increment(by?)"}),", and"," ",e.jsx("code",{children:"decrement(by?)"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useSyncedValue"})}),e.jsx("td",{children:e.jsx("code",{children:"(def: SyncedValueDef, options: UseSyncedValueOptions) => UseSyncedValueResult"})}),e.jsxs("td",{children:["Subscribe to a shared value backed by a LWW-Register CRDT. Returns"," ",e.jsx("code",{children:"value"})," and ",e.jsx("code",{children:"set(value)"}),". Last write wins with Lamport clock tie-breaking."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"useSyncedSet"})}),e.jsx("td",{children:e.jsx("code",{children:"(def: SyncedSetDef, options: UseSyncedSetOptions) => UseSyncedSetResult"})}),e.jsxs("td",{children:["Subscribe to a shared set backed by an OR-Set CRDT. Returns"," ",e.jsx("code",{children:"values"}),", ",e.jsx("code",{children:"add(item)"}),","," ",e.jsx("code",{children:"remove(item)"}),", and ",e.jsx("code",{children:"has(item)"}),"."]})]})]})]}),e.jsx("h2",{id:"adapter-sse",children:"@realtimejs/adapter-sse"}),e.jsx("p",{children:"Server-Sent Events (SSE) transport adapter. Provides both the client transport and the server handler."}),e.jsx("h3",{id:"sse-client",children:"Client Transport"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"sseTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: SseTransportOptions) => RealtimeTransport"})}),e.jsxs("td",{children:["Creates a ",e.jsx("code",{children:"RealtimeTransport"})," backed by SSE (GET stream) and HTTP POST (actions). Uses ",e.jsx("code",{children:"fetch()"})," instead of native ",e.jsx("code",{children:"EventSource"})," so it can set"," ",e.jsx("code",{children:"Authorization"})," headers and run in Node.js. Reconnects with exponential back-off."]})]})})]}),e.jsx("h4",{children:"SseTransportOptions"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Option"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"url"})}),e.jsx("td",{children:e.jsx("code",{children:"string | URL"})}),e.jsx("td",{children:"required"}),e.jsx("td",{children:"SSE endpoint URL."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"getToken"})}),e.jsx("td",{children:e.jsx("code",{children:"() => string | Promise<string>"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Called once per connection attempt to obtain a Bearer token."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"initialDelay"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:"1000"}),e.jsx("td",{children:"Reconnect back-off initial delay (ms)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"maxDelay"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:"30000"}),e.jsx("td",{children:"Reconnect back-off maximum delay (ms)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"jitter"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:"0.25"}),e.jsx("td",{children:"Reconnect back-off jitter factor (0–1)."})]})]})]}),e.jsx("h3",{id:"sse-server",children:"Server Handler"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createSseHandler"})}),e.jsx("td",{children:e.jsx("code",{children:"(options?: SseHandlerOptions) => SseHandler"})}),e.jsx("td",{children:"Creates a Fetch-API–compatible SSE handler (GET opens a stream, POST dispatches actions). Compatible with Cloudflare Workers, Deno, Bun, and Node.js (via a Fetch adapter). Maintains in-memory connection state — single-process only."})]})})]}),e.jsx("h4",{children:"SseHandler methods"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Method"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"handle"})}),e.jsx("td",{children:e.jsx("code",{children:"(req: Request) => Promise<Response>"})}),e.jsx("td",{children:"Handle an incoming HTTP request (GET / POST / OPTIONS)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"broadcast"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: string, data: unknown) => void"})}),e.jsxs("td",{children:["Push a message to all SSE connections subscribed to"," ",e.jsx("code",{children:"channel"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"connectionCount"})}),e.jsx("td",{children:e.jsx("code",{children:"() => number"})}),e.jsx("td",{children:"Return the current number of active SSE connections."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createStream"})}),e.jsx("td",{children:e.jsxs("code",{children:["<TEvent>(options: ","{"," channel, hmacKey? ","}",") => ServerStream<TEvent>"]})}),e.jsxs("td",{children:["Create a ",e.jsx("code",{children:"ServerStream"})," that publishes via"," ",e.jsx("code",{children:"broadcast()"}),"."]})]})]})]}),e.jsx("h4",{children:"SseHandlerOptions"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Option"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"pingInterval"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:"30000"}),e.jsxs("td",{children:["Keep-alive ping interval in ms. Set to ",e.jsx("code",{children:"0"})," to disable."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"getUser"})}),e.jsx("td",{children:e.jsxs("code",{children:["(req: Request) => ","{"," userId: string ","}"," | null | Promise<...>"]})}),e.jsx("td",{children:"—"}),e.jsxs("td",{children:["Authenticate the request. Return ",e.jsx("code",{children:"null"})," to reject with 401."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"authorize"})}),e.jsx("td",{children:e.jsx("code",{children:"AuthorizeFn"})}),e.jsx("td",{children:"—"}),e.jsxs("td",{children:["Per-channel access control. Receives"," ",e.jsx("code",{children:"(userId, parsedChannel)"})," and returns"," ",e.jsx("code",{children:"ChannelPermissions | boolean"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onClientConnect"})}),e.jsx("td",{children:e.jsxs("code",{children:["(info: ","{"," connectionId, userId ","}",") => void"]})}),e.jsx("td",{children:"—"}),e.jsxs("td",{children:["Fires after ",e.jsx("code",{children:"getUser"})," succeeds and the SSE stream is established. Fire-and-forget — errors are logged, not propagated."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onClientDisconnect"})}),e.jsx("td",{children:e.jsxs("code",{children:["(info: ","{"," connectionId, userId ","}",") => void"]})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Fires when the SSE stream closes (client disconnect or network drop). Fire-and-forget."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onFirstSubscriber"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: string) => void"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Fires when the first subscriber joins a previously-empty channel. Useful for spinning up live queries or background tasks."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onChannelEmpty"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: string) => void"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Fires when the last subscriber leaves a channel (count → 0). Useful for tearing down resources."})]})]})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," sseTransport, createSseHandler ","}"," from '@realtimejs/adapter-sse'"]})]}),e.jsx("h2",{id:"adapter-centrifugo",children:"@realtimejs/adapter-centrifugo"}),e.jsx("p",{children:"Centrifugo v4+ WebSocket transport adapter with built-in presence and epoch/offset recovery."}),e.jsx("h3",{id:"centrifugo-transport",children:"Transport"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"centrifugoTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: CentrifugoTransportOptions) => RealtimeTransport & PresenceCapable"})}),e.jsxs("td",{children:["Creates a ",e.jsx("code",{children:"RealtimeTransport"})," that connects to a Centrifugo server via the v4+ JSON WebSocket protocol. Supports presence via a sidecar channel, epoch/offset recovery for reconnect, and exponential back-off reconnection."]})]})})]}),e.jsx("h4",{children:"CentrifugoTransportOptions"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Option"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"url"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"required"}),e.jsx("td",{children:"Centrifugo WebSocket endpoint URL."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"token"})}),e.jsx("td",{children:e.jsx("code",{children:"string | (() => string | Promise<string>)"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"JWT token or factory for token-based auth."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"data"})}),e.jsx("td",{children:e.jsx("code",{children:"Record<string, unknown>"})}),e.jsx("td",{children:"—"}),e.jsxs("td",{children:["Arbitrary connection data forwarded in the ",e.jsx("code",{children:"connect"})," ","command."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"presencePrefix"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"'$prs:'"}),e.jsx("td",{children:"Namespace prefix for the sidecar presence channel."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"initialDelay"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:"1000"}),e.jsx("td",{children:"Reconnect back-off initial delay (ms)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"maxDelay"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:"30000"}),e.jsx("td",{children:"Reconnect back-off maximum delay (ms)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"jitter"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:"0.25"}),e.jsx("td",{children:"Reconnect back-off jitter factor (0–1)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"WebSocket"})}),e.jsx("td",{children:e.jsx("code",{children:"typeof globalThis.WebSocket"})}),e.jsx("td",{children:"globalThis.WebSocket"}),e.jsxs("td",{children:["Custom WebSocket constructor — pass the ",e.jsx("code",{children:"ws"})," package class for Node.js ","<"," 21."]})]})]})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," centrifugoTransport ","}"," from '@realtimejs/adapter-centrifugo'"]})]}),e.jsx("h2",{id:"adapter-pusher",children:"@realtimejs/adapter-pusher"}),e.jsxs("p",{children:["Pusher Channels (hosted) and self-hosted Soketi transport adapter. Soketi speaks the Pusher protocol, so the same adapter works against both — point ",e.jsx("code",{children:"wsHost"}),"/",e.jsx("code",{children:"wsPort"})," at Soketi for self-hosting. Presence-capable."]}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"pusherTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: PusherTransportOptions) => RealtimeTransport & PresenceCapable"})}),e.jsxs("td",{children:["Creates a transport over the Pusher protocol. Binds a single"," ",e.jsx("code",{children:"'message'"})," event per channel; presence channels map to"," ",e.jsx("code",{children:"presence-<channel>"}),"; client publishes use a Pusher client event (private/presence channels with client events enabled). Public fan-out is server-published via the Pusher HTTP API. Also exports the protocol constants"," ",e.jsx("code",{children:"PUSHER_MESSAGE_EVENT"}),","," ",e.jsx("code",{children:"PUSHER_CLIENT_MESSAGE_EVENT"}),", and"," ",e.jsx("code",{children:"PUSHER_PRESENCE_PREFIX"}),"."]})]})})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," pusherTransport ","}"," from '@realtimejs/adapter-pusher'"]})]}),e.jsx("h2",{id:"adapter-partykit",children:"@realtimejs/adapter-partykit"}),e.jsxs("p",{children:["PartyKit / Cloudflare Durable Objects transport adapter. Multiplexes all realtime.js channels over a single PartyKit room connection (the “hub”), routing each channel inside JSON envelopes. Presence is backed by Durable Object membership. A reference room server is available at ",e.jsx("code",{children:"@realtimejs/adapter-partykit/server"}),"."]}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"partykitTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"(options: PartyKitTransportOptions) => RealtimeTransport & PresenceCapable"})}),e.jsxs("td",{children:["Creates a transport that connects to a PartyKit room. Learns its own ",e.jsx("code",{children:"connectionId"})," from the server’s"," ",e.jsx("code",{children:"connected"})," envelope and excludes self from reported presence members."]})]})})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," partykitTransport ","}"," from '@realtimejs/adapter-partykit'"]})]}),e.jsx("h2",{id:"reactive-drizzle",children:"@realtimejs/reactive-drizzle"}),e.jsxs("p",{children:["Optional Drizzle/Postgres reactive-query engine for"," ",e.jsx("code",{children:"@realtimejs/core"}),". Kept separate so the core install carries zero ",e.jsx("code",{children:"drizzle-orm"})," dependencies. Composes with"," ",e.jsx("code",{children:"createStartHandler"}),": the handler owns the transport, this package owns the reactive engine (auto-derived channels, predicate matching, automatic invalidation)."]}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createReactiveQueries"})}),e.jsx("td",{children:e.jsx("code",{children:"(options?: CreateReactiveQueriesOptions) => ReactiveQueries"})}),e.jsxs("td",{children:["Creates the reactive engine. Returns ",e.jsx("code",{children:"query"}),","," ",e.jsx("code",{children:"mutation"}),", ",e.jsx("code",{children:"invalidate"}),","," ",e.jsx("code",{children:"bindPublish"}),", and ",e.jsx("code",{children:"onChannelEmpty"}),". Wire"," ",e.jsx("code",{children:"bindPublish(handler.publish)"})," after creating the handler so invalidations fan out."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createDrizzleEngine"})}),e.jsx("td",{children:e.jsx("code",{children:"(...) => ReactiveQueryEngine"})}),e.jsxs("td",{children:["The Drizzle implementation of the neutral"," ",e.jsx("code",{children:"ReactiveQueryEngine"})," seam (also exported as"," ",e.jsx("code",{children:"drizzleEngine"}),"). Implement your own engine to back the seam with a different store."]})]})]})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," createReactiveQueries ","}"," from '@realtimejs/reactive-drizzle'"]})]}),e.jsx("h2",{id:"adapter-conformance",children:"@realtimejs/adapter-conformance"}),e.jsxs("p",{children:["A Vitest conformance battery for custom transport authors. Wire your adapter to a controllable fake provider via the"," ",e.jsx("code",{children:"ConformanceHarness"})," hooks and the kit drives it against the"," ",e.jsx("code",{children:"RealtimeTransport"})," (+ ",e.jsx("code",{children:"PresenceCapable"}),") contract — including the three-phase reconnect-resubscribe check."]}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"runAdapterConformance"})}),e.jsx("td",{children:e.jsx("code",{children:"(harness: ConformanceHarness) => void"})}),e.jsxs("td",{children:["Registers the conformance ",e.jsx("code",{children:"describe"}),"/",e.jsx("code",{children:"it"})," ","blocks. Call it from a ",e.jsx("code",{children:"*.test.ts"})," in your adapter package. The harness supplies ",e.jsx("code",{children:"createTransport"}),","," ",e.jsx("code",{children:"capabilities"}),", ",e.jsx("code",{children:"emitMessage"}),", disconnect/ reconnect triggers, and optional"," ",e.jsx("code",{children:"simulateSubscribeError"}),"/",e.jsx("code",{children:"emitPresence"})," ","hooks."]})]})})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," runAdapterConformance ","}"," from '@realtimejs/adapter-conformance'"]})]}),e.jsx("h2",{id:"preset-start",children:"@realtimejs/preset-start"}),e.jsxs("p",{children:["TanStack Start / TanStack Router server-side preset. Composes"," ",e.jsx("code",{children:"createSseHandler"})," with a pluggable"," ",e.jsx("code",{children:"PublishBackend"})," for scalable multi-process deployments."]}),e.jsx("h3",{id:"start-handler",children:"Handler"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Name"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createStartHandler"})}),e.jsx("td",{children:e.jsx("code",{children:"(options?: StartHandlerOptions) => StartRealtimeHandler"})}),e.jsxs("td",{children:["Create a TanStack Start–compatible realtime handler. Returns"," ",e.jsx("code",{children:"handle"}),", ",e.jsx("code",{children:"publish"}),","," ",e.jsx("code",{children:"createStream"}),", and ",e.jsx("code",{children:"dispose"}),". Optionally accepts a ",e.jsx("code",{children:"backend"})," for multi-process fan-out."]})]})})]}),e.jsx("h4",{children:"StartRealtimeHandler methods"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Method"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"handle"})}),e.jsx("td",{children:e.jsx("code",{children:"(req: Request) => Promise<Response>"})}),e.jsx("td",{children:"Mount on a TanStack Start API route (GET / POST / OPTIONS)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"publish"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: QueryKey | string, data: unknown) => Promise<void>"})}),e.jsx("td",{children:"Broadcast data from server functions. Routes through the backend when configured."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"createStream"})}),e.jsx("td",{children:e.jsxs("code",{children:["<TEvent>(options: ","{"," channel, hmacKey? ","}",") => ServerStream<TEvent>"]})}),e.jsxs("td",{children:["Create a ",e.jsx("code",{children:"ServerStream"})," that routes pushes through the configured backend."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"dispose"})}),e.jsx("td",{children:e.jsx("code",{children:"() => void"})}),e.jsx("td",{children:"Release resources. Calls the backend unsubscribe function if one was registered."})]})]})]}),e.jsx("h4",{children:"StartHandlerOptions"}),e.jsxs("p",{children:["Extends ",e.jsx("code",{children:"SseHandlerOptions"})," (",e.jsx("code",{children:"getUser"}),","," ",e.jsx("code",{children:"authorize"}),", ",e.jsx("code",{children:"pingInterval"}),") with:"]}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Option"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"backend"})}),e.jsx("td",{children:e.jsx("code",{children:"PublishBackend"})}),e.jsx("td",{children:"External pub/sub backend for multi-process deployments. Omit for single-process (the common case)."})]})})]}),e.jsx("h4",{children:"PublishBackend interface"}),e.jsx("p",{children:"Implement this interface to route publishes through Redis, Postgres LISTEN/NOTIFY, Cloudflare Durable Objects, or any other storage without being tied to a specific provider."}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Method"}),e.jsx("th",{children:"Signature"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"publish"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: string, data: unknown) => Promise<void>"})}),e.jsx("td",{children:"Write a message to the backing store so all server instances are notified."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"subscribe"})}),e.jsx("td",{children:e.jsx("code",{children:"(onMessage: (channel: string, data: unknown) => void) => () => void"})}),e.jsxs("td",{children:["Subscribe to messages from the store and call"," ",e.jsx("code",{children:"onMessage"}),". Return a cleanup function. Only needed for multi-process deployments."]})]})]})]}),e.jsxs("p",{children:["Import:"," ",e.jsxs("code",{children:["import ","{"," createStartHandler ","}"," from '@realtimejs/preset-start'"]})]}),e.jsx("h2",{id:"key-types",children:"Key Types"}),e.jsx("p",{children:"All types are exported from their respective packages. The most commonly referenced types are listed below."}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Package"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"RealtimeClient"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsxs("td",{children:["The client object returned by ",e.jsx("code",{children:"createRealtimeClient"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"RealtimeTransport"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsx("td",{children:"Core transport interface (connect, disconnect, subscribe, publish)."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"PresenceCapable"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsx("td",{children:"Optional transport extension for joinPresence, updatePresence, leavePresence, onPresenceChange."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"TransportCapabilities"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsxs("td",{children:[e.jsxs("code",{children:["{"," presence; serverAssistedRecovery; history; ephemeral ","}"]})," ","— what a transport supports. Read via ",e.jsx("code",{children:"getCapabilities"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"ConnectionStatus"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsx("td",{children:e.jsx("code",{children:"'disconnected' | 'connecting' | 'connected' | 'reconnecting'"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"QueryKey"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsxs("td",{children:["Array channel key, e.g."," ",e.jsxs("code",{children:["['todos', ","{"," projectId ","}","]"]}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"PresenceUser<TData>"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsxs("td",{children:[e.jsxs("code",{children:["{"," connectionId: string; data: TData ","}"]})," ","— shape of a presence member."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"ServerStream<TEvent>"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsxs("td",{children:["Handle with ",e.jsx("code",{children:"push(event)"}),", ",e.jsx("code",{children:"done()"}),", and"," ",e.jsx("code",{children:"error(message)"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"StreamStatus"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsx("td",{children:e.jsx("code",{children:"'pending' | 'streaming' | 'done' | 'error' | 'stale'"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"PublishFn"})}),e.jsx("td",{children:e.jsx("code",{children:"@realtimejs/core"})}),e.jsx("td",{children:e.jsx("code",{children:"(channel: QueryKey | string, data: unknown) => Promise<void>"})})]})]})]})]})}function Hj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Wire Protocol Reference"}),e.jsx("p",{className:"doc-lead",children:"Message formats for every realtime.js transport. Useful for custom transport authors and debugging."}),e.jsx("h2",{id:"transport-interface",children:"Transport interface"}),e.jsxs("p",{children:["Every transport implements ",e.jsx("code",{children:"RealtimeTransport"}),". This is the contract between the realtime client and the underlying connection mechanism — WebSocket, SSE, Centrifugo, or your own custom transport."]}),e.jsx(u,{code:`export interface RealtimeTransport {
  connect: () => Promise<void>
  disconnect: () => void
  subscribe: (channel: string, onMessage: (data: unknown) => void) => () => void
  publish: (channel: string, data: unknown) => Promise<void>
  readonly store: Store<ConnectionStatus>
  /** Register lifecycle hooks (offline queue, gap recovery, dedup, etc.). */
  hook: (registration: HookRegistration) => HookHandle
  /** Optional: called when the server rejects a subscription attempt. */
  onSubscribeError?: (callback: (channel: string, reason: string, code?: number) => void) => () => void
  /** Optional: honest, machine-readable description of what this transport can do. */
  readonly capabilities?: TransportCapabilities
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface TransportCapabilities {
  presence: boolean                 // join/update/leave + member lists (PresenceCapable)
  serverAssistedRecovery: boolean   // replay missed messages by offset/epoch after a gap
  history: boolean                  // server-side message history retrieval
  ephemeral: boolean                // fire-and-forget delivery (baseline for any pub/sub)
}`}),e.jsxs("p",{children:["Declare ",e.jsx("code",{children:"capabilities"})," on your transport so the hook layer degrades the DX predictably (for example, ",e.jsx("code",{children:"usePresence"})," ","throws an actionable error when ",e.jsx("code",{children:"capabilities.presence"})," is"," ",e.jsx("code",{children:"false"}),"). Transports that omit it still work —"," ",e.jsx("code",{children:"getCapabilities()"})," from ",e.jsx("code",{children:"@realtimejs/core"})," ","derives a conservative default from the transport’s shape."]}),e.jsxs("p",{children:["Transports that support presence also implement the"," ",e.jsx("code",{children:"PresenceCapable"})," extension. The realtime client checks for these methods at runtime (via the ",e.jsx("code",{children:"hasPresence()"})," type guard) and enables presence features when they exist."]}),e.jsx(u,{code:`export interface PresenceCapable {
  joinPresence: (channel: string, data: unknown) => void
  updatePresence: (channel: string, data: unknown) => void
  leavePresence: (channel: string) => void
  onPresenceChange: (channel: string, callback: (users: ReadonlyArray<PresenceUser>) => void) => () => void
}

export interface PresenceUser<T = unknown> {
  connectionId: string
  data: T
}`}),e.jsx("h2",{id:"connection-status",children:"Connection status lifecycle"}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"ConnectionStatus"})," type forms a state machine. Every transport follows the same lifecycle:"]}),e.jsx(u,{code:`disconnected ──► connecting ──► connected
                                       │
                                       ▼
                                  reconnecting
                                       │
                                       ▼
                                  connecting ──► connected
                                       │
                                       ▼
                                  disconnected  (if max retries exceeded)`}),e.jsxs("p",{children:["When a transport is first created, it starts in"," ",e.jsx("code",{children:"disconnected"}),". Calling ",e.jsx("code",{children:"connect()"})," transitions to"," ",e.jsx("code",{children:"connecting"}),", then ",e.jsx("code",{children:"connected"})," on success. If the underlying connection drops unexpectedly, the transport moves to"," ",e.jsx("code",{children:"reconnecting"})," and attempts to re-establish the connection. During reconnection the transport cycles between"," ",e.jsx("code",{children:"reconnecting"})," and ",e.jsx("code",{children:"connecting"})," with exponential backoff. If reconnection succeeds, the status returns to"," ",e.jsx("code",{children:"connected"}),". If the maximum number of retries is exhausted, the transport falls back to ",e.jsx("code",{children:"disconnected"}),"."]}),e.jsx("h2",{id:"custom-websocket",children:"Custom WebSocket transport"}),e.jsxs("p",{children:["realtime.js does not ship a generic WebSocket transport. If you want to connect over a plain WebSocket (without Centrifugo), implement the"," ",e.jsx("code",{children:"RealtimeTransport"})," interface yourself. The interface is intentionally small — you only need to wire up the five core methods plus, optionally, presence and hook support."]}),e.jsx("p",{children:"You are free to choose any wire format for your custom transport. The example below shows a simple JSON message protocol that you can use as a starting point. Your server must speak the same format on the other end."}),e.jsx("h3",{children:"Example client-to-server messages"}),e.jsx(u,{code:`// Subscribe to a channel
{ type: 'subscribe'; channel: string }
// Unsubscribe from a channel
{ type: 'unsubscribe'; channel: string }
// Publish data to a channel
{ type: 'publish'; channel: string; data: unknown }
// Presence — join, update, or leave (requires PresenceCapable implementation)
{ type: 'presence:join'; channel: string; data: unknown }
{ type: 'presence:update'; channel: string; data: unknown }
{ type: 'presence:leave'; channel: string }`}),e.jsx("h3",{children:"Example server-to-client messages"}),e.jsx(u,{code:`// Sent once after the WebSocket opens
{ type: 'connected'; connectionId: string }
// Sent when a subscription is accepted
{ type: 'subscribe:ok'; channel: string }
// Sent when a subscription is rejected (e.g. auth failure)
{ type: 'subscribe:error'; channel: string; code: number; reason: string }
// Sent when data is published to a subscribed channel
{ type: 'message'; channel: string; data: unknown }
// Sent when presence changes (requires PresenceCapable implementation)
{ type: 'presence:update'; channel: string; users: ReadonlyArray<PresenceUser> }`}),e.jsxs("p",{children:["For presence support your transport must also implement the"," ",e.jsx("code",{children:"PresenceCapable"})," interface shown above. The built-in Centrifugo, Pusher, and PartyKit adapters implement both and can serve as reference implementations."]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Prove your transport is correct."})," Once you implement"," ",e.jsx("code",{children:"RealtimeTransport"})," (and optionally"," ",e.jsx("code",{children:"PresenceCapable"}),"), run it through the conformance battery in ",e.jsx("code",{children:"@realtimejs/adapter-conformance"}),". Call"," ",e.jsx("code",{children:"runAdapterConformance(harness)"})," from a Vitest file: it drives lifecycle, subscribe/deliver, unsubscribe, publish, the three-phase reconnect-resubscribe check, and — when you declare"," ",e.jsx("code",{children:"capabilities.presence"})," — a presence sub-battery, asserting that ",e.jsx("code",{children:"getCapabilities()"})," matches observed behavior. See the ",e.jsx("a",{href:"#/docs/api-reference",children:"API Reference"})," for the harness shape."]})}),e.jsx("h2",{id:"sse-messages",children:"SSE transport messages"}),e.jsxs("p",{children:["The SSE transport (",e.jsx("code",{children:"sseTransport"}),") uses Server-Sent Events for the server-to-client direction and HTTP POST requests for the client-to-server direction."]}),e.jsx("h3",{children:"Server to client (SSE events)"}),e.jsxs("p",{children:["Each SSE event has ",e.jsx("code",{children:"data:"})," containing JSON:"]}),e.jsx(u,{code:`type ServerEvent =
  | { type: 'connected'; connectionId: string }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'subscribe:error'; channel: string; reason: string; code?: number }
  | { type: 'ping' }`}),e.jsx("h3",{children:"Client to server (POST requests)"}),e.jsx("p",{children:"The client sends actions as JSON in the body of POST requests to the server endpoint:"}),e.jsx(u,{code:`type ClientAction =
  | { action: 'subscribe'; connectionId: string; channel: string }
  | { action: 'unsubscribe'; connectionId: string; channel: string }
  | { action: 'publish'; channel: string; data: unknown }`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["The SSE transport does ",e.jsx("strong",{children:"not"})," support presence. Presence requires bidirectional messaging for real-time join/leave/update events, and SSE is inherently unidirectional. If you need presence, use the Centrifugo transport or build a custom WebSocket transport instead."]})}),e.jsxs("p",{children:["Note that ",e.jsx("code",{children:"connectionId"})," is required on"," ",e.jsx("code",{children:"subscribe"})," and ",e.jsx("code",{children:"unsubscribe"})," actions. The client receives its ",e.jsx("code",{children:"connectionId"})," from the initial"," ",e.jsx("code",{children:"connected"})," SSE event and includes it in subsequent POST requests so the server can associate the action with the correct SSE connection."]}),e.jsx("h2",{id:"centrifugo-messages",children:"Centrifugo transport messages"}),e.jsxs("p",{children:["The Centrifugo transport (",e.jsx("code",{children:"centrifugoTransport"}),") speaks the native Centrifugo protocol over WebSocket. Commands are JSON objects with an incrementing ",e.jsx("code",{children:"id"})," field. The server replies with matching ",e.jsx("code",{children:"id"})," values so the client can correlate requests with responses."]}),e.jsx("h3",{children:"Client to server (commands)"}),e.jsx(u,{code:`type CentrifugoCommand =
  | { id: number; connect: { token?: string; data?: Record<string, unknown> } }
  | { id: number; subscribe: { channel: string; recover?: boolean; epoch?: string; offset?: number } }
  | { id: number; unsubscribe: { channel: string } }
  | { id: number; publish: { channel: string; data: unknown } }`}),e.jsx("h3",{children:"Server to client (replies)"}),e.jsxs("p",{children:["Replies include the ",e.jsx("code",{children:"id"})," from the original command so the client can match them. Each reply has at most one of"," ",e.jsx("code",{children:"connect"}),", ",e.jsx("code",{children:"subscribe"}),", ",e.jsx("code",{children:"publish"}),", or"," ",e.jsx("code",{children:"unsubscribe"})," set (corresponding to the command type), plus an optional ",e.jsx("code",{children:"error"})," field on failure:"]}),e.jsx(u,{code:`interface CentrifugoReply {
  id: number
  connect?: {
    client: string      // assigned connection ID
    version: string
    data?: unknown
    subs?: unknown
  }
  subscribe?: {
    recoverable?: boolean
    epoch?: string
    offset?: number
    publications?: Array<{ data: unknown; offset?: number }>
    data?: unknown
  }
  publish?: Record<string, never>    // empty on success
  unsubscribe?: Record<string, never>
  error?: {
    code: number
    message: string
  }
}`}),e.jsx("h3",{children:"Server to client (pushes)"}),e.jsxs("p",{children:["Server-initiated messages have no ",e.jsx("code",{children:"id"})," field. They arrive with a top-level ",e.jsx("code",{children:"push"})," key containing the channel and one of several event fields:"]}),e.jsx(u,{code:`interface CentrifugoPush {
  push: {
    channel: string
    // Publication — new data on a subscribed channel
    pub?: { data: unknown; offset?: number; tags?: Record<string, string> }
    // Join — a client joined the channel (requires joinLeave on the namespace)
    join?: { info: { user: string; client: string; conn_info?: unknown; chan_info?: unknown } }
    // Leave — a client left the channel
    leave?: { info: { user: string; client: string; conn_info?: unknown; chan_info?: unknown } }
    // Unsubscribe — server forcibly unsubscribed this client
    unsubscribe?: { resubscribe?: boolean }
    // Disconnect — server is closing the connection
    disconnect?: { code: number; reason: string; reconnect?: boolean }
  }
}`}),e.jsx("h3",{children:"Sidecar presence pattern"}),e.jsxs("p",{children:["Centrifugo’s native presence API is not used by the adapter. Instead, presence messages are published to a sidecar channel with the prefix ",e.jsx("code",{children:"$prs:"}),". For a data channel named"," ",e.jsx("code",{children:"app:chat-room-1"}),", presence flows through"," ",e.jsx("code",{children:"$prs:app:chat-room-1"}),"."]}),e.jsx(u,{code:`// Messages published to the sidecar presence channel
type PresenceSidecarMsg =
  | { type: 'prs:join'; clientId: string; data: unknown }
  | { type: 'prs:update'; clientId: string; data: unknown }
  | { type: 'prs:leave'; clientId: string }`}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"$prs"})," namespace must have"," ",e.jsx("code",{children:"allow_publish_for_subscriber: true"})," in your Centrifugo config so that clients can publish presence heartbeats directly."]}),e.jsx("h2",{id:"multi-tab-messages",children:"Multi-tab messages (BroadcastChannel)"}),e.jsxs("p",{children:["The coordinated transport uses the browser’s"," ",e.jsx("code",{children:"BroadcastChannel"})," API for inter-tab communication. One tab is elected as the leader and holds the actual WebSocket or SSE connection. Other tabs proxy their subscribe/publish calls through BroadcastChannel messages to the leader tab, which forwards them to the server and relays responses back."]}),e.jsxs("p",{children:["The wire format for these inter-tab messages is an internal implementation detail and may change between versions. See the"," ",e.jsx("a",{href:"#/docs/resilience",children:"Resilience"})," page for the public API and configuration options."]}),e.jsx("h2",{id:"collection-messages",children:"Collection channel messages"}),e.jsxs("p",{children:["Collections use a standard message envelope for insert, update, and delete operations. This is the shape of every message published to a collection channel. See ",e.jsx("a",{href:"#/docs/collections",children:"Collections"})," for the full API."]}),e.jsx(u,{code:`interface RealtimeChannelMessage<T = unknown> {
  action: 'insert' | 'update' | 'delete'
  data: T
  _crdt?: CrdtMessageHeader
  _nonce?: string
  _clientId?: string
}`}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"data"})," field carries the actual payload — the row being inserted, updated, or deleted. The underscore-prefixed fields are internal:"]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"_crdt"})," — CRDT convergence metadata. Present only when the collection uses CRDT conflict resolution. Contains vector clocks, field-level timestamps, and merge information."]}),e.jsxs("li",{children:[e.jsx("code",{children:"_nonce"})," — a unique identifier for optimistic update echo suppression. When a client publishes a mutation optimistically, it attaches a nonce. When the server echoes the mutation back, the client recognizes the nonce and skips the duplicate."]}),e.jsxs("li",{children:[e.jsx("code",{children:"_clientId"})," — identifies the originating client. Used together with ",e.jsx("code",{children:"_nonce"})," to determine whether an incoming message is an echo of the client’s own mutation."]})]}),e.jsx("h2",{id:"stream-messages",children:"Stream channel messages"}),e.jsxs("p",{children:["Stream channels use sentinel message types to signal lifecycle events. These are distinct from the user-defined event payloads that flow through ",e.jsx("code",{children:"reduce"}),". See"," ",e.jsx("a",{href:"#/docs/streaming",children:"Streaming"})," for the full API."]}),e.jsx(u,{code:`// Sentinel types — these are string constants, not user data
const STREAM_DONE      = '__stream:done' as const
const STREAM_ERROR     = '__stream:error' as const
const STREAM_HEARTBEAT = '__stream:heartbeat' as const

// Sent as channel messages:
// Done:      { type: '__stream:done' }
// Error:     { type: '__stream:error'; message: string }
// Heartbeat: { type: '__stream:heartbeat' }`}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"STREAM_DONE"})," sentinel transitions the stream status to"," ",e.jsx("code",{children:"done"}),". ",e.jsx("code",{children:"STREAM_ERROR"})," transitions to"," ",e.jsx("code",{children:"error"})," and includes a human-readable error message."," ",e.jsx("code",{children:"STREAM_HEARTBEAT"})," resets the ",e.jsx("code",{children:"staleAfter"})," timer without changing stream state — the server sends these periodically during long-running streams to prove the connection is alive."]}),e.jsx("p",{children:"When checkpointing is enabled, the server periodically captures the reduced state:"}),e.jsx(u,{code:`interface StreamCheckpoint<TState> {
  channel: string   // Serialized channel string
  seq: number       // Sequence number of last checkpointed event
  state: TState     // Accumulated state snapshot
  elapsed: number   // Milliseconds since stream creation
}`}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"channel"})," field is the serialized channel string."," ",e.jsx("code",{children:"seq"})," is the sequence number of the last checkpointed event."," ",e.jsx("code",{children:"state"})," holds the fully reduced (accumulated) state snapshot at the time of the checkpoint, and ",e.jsx("code",{children:"elapsed"})," is the number of milliseconds since the stream was created. Checkpoints are passed to your ",e.jsx("code",{children:"checkpoint.handler"})," callback for persistence."]}),e.jsx("div",{className:"doc-callout",children:e.jsx("p",{children:"You do not need to know the wire protocol to use realtime.js. This reference is for transport authors, debuggers, and advanced integration scenarios."})})]})}function Qj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Testing"}),e.jsxs("p",{className:"doc-lead",children:["realtime.js ships its testing utilities in the box. Use"," ",e.jsx("code",{children:"createMockTransport"})," and"," ",e.jsx("code",{children:"createMockPresenceTransport"})," from"," ",e.jsx("code",{children:"@realtimejs/core"})," to drive subscriptions, publishes, and connection state synchronously — no server, socket, or fake timers required."]}),e.jsxs("div",{className:"doc-callout",children:[e.jsx("p",{children:"These are the same mocks the library uses internally:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"createMockTransport()"})," — a full"," ",e.jsx("code",{children:"RealtimeTransport"})," with ",e.jsx("code",{children:"simulateMessage"}),","," ",e.jsx("code",{children:"simulateDisconnect"}),"/",e.jsx("code",{children:"simulateReconnect"}),","," ",e.jsx("code",{children:"simulateSubscribeError"}),", and a ",e.jsx("code",{children:"publishLog"}),"."]}),e.jsxs("li",{children:[e.jsx("code",{children:"createMockPresenceTransport()"})," — everything above, plus ",e.jsx("code",{children:"simulatePresenceJoin"}),","," ",e.jsx("code",{children:"simulatePresenceLeave"}),", and"," ",e.jsx("code",{children:"getPresenceState"}),"."]}),e.jsxs("li",{children:[e.jsx("code",{children:"createTestRealtimeProvider()"})," /"," ",e.jsx("code",{children:"createTestRealtimeProviderWithPresence()"})," from"," ",e.jsx("code",{children:"@realtimejs/react"})," — a pre-wired"," ",e.jsx("code",{children:"wrapper"})," for Testing Library’s"," ",e.jsx("code",{children:"renderHook"}),"/",e.jsx("code",{children:"render"}),". (Solid and Vue ship the same factories.)"]})]})]}),e.jsx("h2",{id:"mock-transport",children:"The mock transport"}),e.jsxs("p",{children:[e.jsx("code",{children:"createMockTransport()"})," returns a transport that satisfies the full ",e.jsx("code",{children:"RealtimeTransport"})," contract. It starts in"," ",e.jsx("code",{children:"'connected'"})," state and models a real provider: a message only reaches a subscriber when the channel is currently subscribed"," ",e.jsx("em",{children:"at the provider"}),", so a message emitted while disconnected is not delivered until the transport re-subscribes on reconnect."]}),e.jsx(u,{title:"test/transport.test.ts",code:`import { describe, it, expect } from 'vitest'
import { createMockTransport } from '@realtimejs/core'

describe('mock transport', () => {
  it('delivers subscribed messages and records publishes', async () => {
    const transport = createMockTransport()
    await transport.connect()

    const received: unknown[] = []
    const unsub = transport.subscribe('tasks', (d) => received.push(d))

    // Push a server event synchronously
    transport.simulateMessage('tasks', { action: 'insert', data: { id: '1' } })
    expect(received).toHaveLength(1)

    // Outgoing publishes are recorded for assertions
    await transport.publish('tasks', { action: 'update', data: { id: '1' } })
    expect(transport.publishLog).toHaveLength(1)
    expect(transport.publishLog[0]).toMatchObject({ channel: 'tasks' })

    unsub()
    transport.disconnect()
  })
})`}),e.jsxs("p",{children:["Pass ",e.jsx("code",{children:"initialStatus"})," to start disconnected, and"," ",e.jsx("code",{children:"capabilities"})," to exercise capability-gated code paths (for example, declaring ",e.jsx("code",{children:"{ serverAssistedRecovery: true }"})," to test a branch that only runs on recovery-capable transports):"]}),e.jsx(u,{code:`const transport = createMockTransport({
  initialStatus: 'disconnected',
  capabilities: {
    presence: false,
    serverAssistedRecovery: true,
    history: false,
    ephemeral: true,
  },
})`}),e.jsx("h2",{id:"testing-collection",children:"Testing a collection hook"}),e.jsxs("p",{children:["Collections are the core data primitive. To test one, build a mock transport, wire a client, and pass"," ",e.jsx("code",{children:"realtimeCollectionOptions"})," to TanStack DB’s"," ",e.jsx("code",{children:"createCollection"}),". Then push a server event with"," ",e.jsx("code",{children:"simulateMessage"})," and assert on the collection state."]}),e.jsx(u,{title:"test/task-collection.test.ts",code:`import { describe, it, expect } from 'vitest'
import { createCollection } from '@tanstack/db'
import {
  createMockTransport,
  createRealtimeClient,
  realtimeCollectionOptions,
} from '@realtimejs/core'

interface Task {
  id: string
  title: string
}

describe('task collection', () => {
  it('applies a server insert', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    await client.connect()

    const tasks = createCollection(
      realtimeCollectionOptions<Task, string>({
        client,
        channel: 'tasks',
        getKey: (t) => t.id,
      }),
    )

    // Simulate the server broadcasting an insert
    transport.simulateMessage('tasks', {
      action: 'insert',
      data: { id: '1', title: 'Buy milk' },
    })

    expect(tasks.get('1')).toMatchObject({ title: 'Buy milk' })
  })
})`}),e.jsxs("p",{children:["The same pattern covers ",e.jsx("code",{children:"update"})," and ",e.jsx("code",{children:"delete"})," ","actions — emit the corresponding event and assert the collection reflects it."]}),e.jsx("h2",{id:"testing-react",children:"Testing a React hook"}),e.jsxs("p",{children:["Hooks that read realtime data need a ",e.jsx("code",{children:"RealtimeProvider"})," in the tree. ",e.jsx("code",{children:"createTestRealtimeProvider()"})," from"," ",e.jsx("code",{children:"@realtimejs/react"})," returns a ",e.jsx("code",{children:"wrapper"}),", the"," ",e.jsx("code",{children:"transport"}),", and the ",e.jsx("code",{children:"client"})," in one call. The provider mounts with ",e.jsx("code",{children:"autoConnect=false"})," and the transport starts ",e.jsx("code",{children:"'connected'"}),", so your test controls the connection lifecycle explicitly."]}),e.jsx(u,{title:"test/use-subscribe.test.tsx",code:`import { it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  createTestRealtimeProvider,
  useSubscribe,
  usePublish,
} from '@realtimejs/react'

it('receives messages', () => {
  const { wrapper, transport } = createTestRealtimeProvider()
  const messages: unknown[] = []

  renderHook(() => useSubscribe('chat', (d) => messages.push(d)), { wrapper })

  act(() => transport.simulateMessage('chat', { hello: 'world' }))
  expect(messages).toHaveLength(1)
})

it('records optimistic publishes', async () => {
  const { wrapper, transport } = createTestRealtimeProvider()
  const { result } = renderHook(() => usePublish('votes'), { wrapper })

  await act(() => result.current({ delta: 1 }))
  expect(transport.publishLog).toContainEqual(
    expect.objectContaining({ channel: 'votes' }),
  )
})`}),e.jsxs("p",{children:["Pass your own ",e.jsx("code",{children:"transport"})," or ",e.jsx("code",{children:"client"})," to override the defaults — useful for sharing one mock across several"," ",e.jsx("code",{children:"renderHook"})," calls or for injecting custom capabilities."]}),e.jsx("h2",{id:"testing-presence",children:"Testing presence"}),e.jsxs("p",{children:["For presence hooks (",e.jsx("code",{children:"usePresence"}),"), use"," ",e.jsx("code",{children:"createMockPresenceTransport()"})," or, in React,"," ",e.jsx("code",{children:"createTestRealtimeProviderWithPresence()"}),". The presence mock adds ",e.jsx("code",{children:"simulatePresenceJoin"}),","," ",e.jsx("code",{children:"simulatePresenceLeave"}),", and ",e.jsx("code",{children:"getPresenceState"}),", and declares ",e.jsx("code",{children:"presence: true"})," in its capabilities so"," ",e.jsx("code",{children:"usePresence"})," does not throw."]}),e.jsx(u,{title:"test/use-presence.test.tsx",code:`import { it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  createTestRealtimeProviderWithPresence,
  usePresence,
} from '@realtimejs/react'
import { roomPresence } from '../app/presence'

it('reports remote members and your own state', () => {
  const { wrapper, transport } = createTestRealtimeProviderWithPresence()

  const { result } = renderHook(
    () =>
      usePresence(roomPresence, {
        params: { roomId: 'r1' },
        initial: { name: 'Alice' },
      }),
    { wrapper },
  )

  act(() => {
    transport.simulatePresenceJoin('room:roomId=r1', {
      connectionId: 'peer-1',
      data: { name: 'Bob' },
    })
  })

  expect(result.current.others).toHaveLength(1)
  expect((result.current.others[0].data as { name: string }).name).toBe('Bob')
  expect(result.current.self.name).toBe('Alice')

  act(() => transport.simulatePresenceLeave('room:roomId=r1', 'peer-1'))
  expect(result.current.others).toHaveLength(0)
})`}),e.jsx("h2",{id:"connection-states",children:"Simulating connection states"}),e.jsx("p",{children:"Drive disconnect/reconnect with the dedicated helpers rather than poking the store directly — they faithfully model the provider dropping and re-establishing subscriptions, so your retry logic and offline banners are tested against real transport semantics."}),e.jsx(u,{title:"test/connection.test.ts",code:`import { it, expect } from 'vitest'
import { createMockTransport } from '@realtimejs/core'

it('suspends and resumes delivery across a reconnect', async () => {
  const transport = createMockTransport()
  await transport.connect()

  const received: unknown[] = []
  transport.subscribe('chat', (d) => received.push(d))

  transport.simulateMessage('chat', 'before')
  expect(received).toEqual(['before'])

  // While disconnected the provider drops the subscription — nothing delivered
  transport.simulateDisconnect() // store → 'reconnecting'
  transport.simulateMessage('chat', 'while-down')
  expect(received).toEqual(['before'])

  // On reconnect the transport re-subscribes and delivery resumes
  transport.simulateReconnect() // store → 'connected'
  transport.simulateMessage('chat', 'after')
  expect(received).toEqual(['before', 'after'])
})`}),e.jsxs("p",{children:["The transport’s ",e.jsx("code",{children:"store"})," (a ",e.jsx("code",{children:"@tanstack/store"})," ",e.jsx("code",{children:"Store<ConnectionStatus>"}),") is observable too — subscribe to it to assert your UI reflects ",e.jsx("code",{children:"'connecting'"}),","," ",e.jsx("code",{children:"'reconnecting'"}),", and ",e.jsx("code",{children:"'disconnected'"})," states."]}),e.jsx("h2",{id:"optimistic-updates",children:"Testing optimistic rollback"}),e.jsxs("p",{children:["An optimistic mutation applies locally and is published immediately; the collection keeps the optimistic value until the server confirms (echo) or the mutation rejects (rollback). In a test you control both sides:"," ",e.jsx("code",{children:"publishLog"})," proves what was sent, and"," ",e.jsx("code",{children:"simulateMessage"})," lets you confirm the echo — or you let the mutation reject and assert the collection reverts."]}),e.jsx(u,{title:"test/optimistic.test.ts",code:`import { it, expect } from 'vitest'
import { createCollection } from '@tanstack/db'
import {
  createMockTransport,
  createRealtimeClient,
  realtimeCollectionOptions,
} from '@realtimejs/core'

interface Task { id: string; title: string }

it('rolls back when the mutation fails', async () => {
  const transport = createMockTransport()
  const client = createRealtimeClient({ transport })
  await client.connect()

  const tasks = createCollection(
    realtimeCollectionOptions<Task, string>({
      client,
      channel: 'tasks',
      getKey: (t) => t.id,
      onUpdate: async () => {
        throw new Error('server rejected') // forces rollback
      },
    }),
  )

  transport.simulateMessage('tasks', {
    action: 'insert',
    data: { id: '1', title: 'original' },
  })

  // Optimistic update applies immediately…
  const tx = tasks.update('1', (draft) => {
    draft.title = 'edited'
  })
  expect(tasks.get('1')?.title).toBe('edited')

  // …then rolls back to the confirmed value when onUpdate throws
  await tx.isPersisted.promise.catch(() => {})
  expect(tasks.get('1')?.title).toBe('original')
})`}),e.jsx("h2",{id:"conformance",children:"Testing a custom transport adapter"}),e.jsxs("p",{children:["Writing your own transport? Don’t hand-roll its tests. The"," ",e.jsx("code",{children:"@realtimejs/adapter-conformance"})," package exports"," ",e.jsx("code",{children:"runAdapterConformance(harness)"})," — the exact battery every first-party adapter (and the in-repo mocks) passes. It proves your transport honors the ",e.jsx("code",{children:"RealtimeTransport"})," contract (lifecycle, subscribe/deliver, channel isolation, unsubscribe, publish, and the"," ",e.jsx("strong",{children:"reconnect re-subscribe"})," guarantee) and that its declared"," ",e.jsx("code",{children:"capabilities"})," match observable behavior."]}),e.jsx(u,{title:"my-transport.conformance.test.ts",code:`import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import { myTransport } from './my-transport'
import { createFakeProvider } from './fake-provider'

// Call it at the top level — it registers its own describe/it blocks.
runAdapterConformance({
  name: 'my-transport',
  createTransport: () => myTransport({ provider: createFakeProvider() }),
  capabilities: {
    presence: true,
    serverAssistedRecovery: false,
    history: false,
    ephemeral: true,
  },
  // Deliver ONLY to channels currently subscribed at the provider:
  emitMessage: (channel, data) => fakeProvider.deliver(channel, data),
  // Drop the provider-side subscription set:
  simulateDisconnect: () => fakeProvider.drop(),
  // Reconnect — the transport must re-subscribe its active channels:
  simulateReconnect: () => fakeProvider.reconnect(),
  // Optional, provider-specific:
  simulateSubscribeError: (ch, reason, code) => fakeProvider.reject(ch, reason, code),
  emitPresence: (ch, members) => fakeProvider.presence(ch, members),
})`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["The presence sub-battery only runs when you declare"," ",e.jsx("code",{children:"presence: true"}),", and the kit asserts that"," ",e.jsx("code",{children:"hasPresence(transport)"})," agrees with the declared flag — no half-implemented presence. The"," ",e.jsx("code",{children:"serverAssistedRecovery"}),", ",e.jsx("code",{children:"history"}),", and"," ",e.jsx("code",{children:"ephemeral"})," flags are verified for honesty/consistency but are declaration-only (the kit has no provider-side view to exercise them behaviorally). See the ",e.jsx("a",{href:"#/docs/transports",children:"Transports"})," ","page’s capability contract section for the full picture."]})}),e.jsx("h2",{id:"see-also",children:"See also"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/transports",children:"Transports"})," — the capability contract and how adapters declare what they support"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/error-reference",children:"Error Reference"})," — every error code the library can throw, with causes and fixes"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/api-reference",children:"API Reference"})," — full API surface for transports, clients, collections, and hooks"]})]})]})}function Fj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Choosing a Pattern"}),e.jsx("p",{className:"doc-lead",children:"realtime.js has several patterns for different use cases. Most apps only need one or two."}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Short answer:"})," start with"," ",e.jsxs("a",{href:"#/docs/reactive-queries",children:[e.jsx("code",{children:"useQuery"})," + ",e.jsx("code",{children:"useMutation"})]}),". This covers 80% of use cases — live data, optimistic updates, automatic cache invalidation. Add other patterns only when you hit a specific need (chat feeds, presence, AI streaming). You can always combine patterns in the same app."]})}),e.jsx("h2",{id:"start-here",children:"The default: reactive queries"}),e.jsxs("p",{children:["If you have a server function that queries a database,"," ",e.jsx("code",{children:"useQuery"})," is the right choice. Wrap the function with"," ",e.jsx("code",{children:"realtime.query()"})," on the server and the hook handles channels, caching, and batched updates automatically."]}),e.jsx(u,{code:`// Server — one annotation, data is live
export const getTodos = realtime.query(async ({ teamId }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)

// Client — all components sharing this pair share one connection
const { data, collection } = useQuery(getTodos, { teamId }, {
  getKey: (t) => t.id,
})

// Filter client-side without touching the server
const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)`}),e.jsxs("p",{children:["See the ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for the full API including optimistic mutations and batched consistency."]}),e.jsx("h2",{id:"decision-tree",children:"Other patterns"}),e.jsx("p",{children:"When reactive queries don’t fit your use case, use this table to find the right pattern."}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Question"}),e.jsx("th",{children:"Pattern"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Do you have existing REST endpoints and want live CRUD without server functions?"}),e.jsx("td",{children:e.jsxs("a",{href:"#/docs/collections",children:[e.jsx("code",{children:"realtimeCollectionOptions"})," /"," ",e.jsx("code",{children:"useRealtimeCollection"})]})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Is the data append-only (chat messages, activity feeds, event logs)?"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/channels",children:e.jsx("code",{children:"liveChannelOptions"})})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Should rows auto-expire after a TTL (typing indicators, cursors)?"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/ephemeral",children:e.jsx("code",{children:"ephemeralLiveOptions"})})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Are you reducing a stream of events into a single value (AI token stream, progress)?"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/streaming",children:e.jsx("code",{children:"streamChannelOptions"})})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Do you need to show who is currently online?"}),e.jsx("td",{children:e.jsxs("a",{href:"#/docs/presence",children:[e.jsx("code",{children:"createPresenceChannel"})," + ",e.jsx("code",{children:"usePresence"})]})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Are you sending high-frequency batch state updates (game ticks)?"}),e.jsx("td",{children:e.jsx("a",{href:"#/docs/tick",children:e.jsx("code",{children:"tickCollectionOptions"})})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Do you need raw channel events without a collection abstraction?"}),e.jsx("td",{children:e.jsxs("a",{href:"#/docs/channels",children:[e.jsx("code",{children:"useSubscribe"})," / ",e.jsx("code",{children:"usePublish"})]})})]})]})]}),e.jsx("h2",{id:"quick-comparison",children:"Quick comparison"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Pattern"}),e.jsx("th",{children:"Mutations"}),e.jsx("th",{children:"Many rows"}),e.jsx("th",{children:"TTL"}),e.jsx("th",{children:"CRDTs"}),e.jsx("th",{children:"Use case"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:e.jsx("a",{href:"#/docs/reactive-queries",children:e.jsx("code",{children:"useQuery"})})})}),e.jsx("td",{children:"via useMutation"}),e.jsx("td",{children:"yes"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"Server function queries"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("a",{href:"#/docs/collections",children:e.jsx("code",{children:"realtimeCollectionOptions"})})}),e.jsx("td",{children:"insert/update/delete"}),e.jsx("td",{children:"yes"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"yes"}),e.jsx("td",{children:"REST/custom CRUD"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("a",{href:"#/docs/channels",children:e.jsx("code",{children:"liveChannelOptions"})})}),e.jsx("td",{children:"read-only (append)"}),e.jsx("td",{children:"yes"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"Chat, logs, feeds"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("a",{href:"#/docs/ephemeral",children:e.jsx("code",{children:"ephemeralLiveOptions"})})}),e.jsx("td",{children:"read-only (append)"}),e.jsx("td",{children:"yes"}),e.jsx("td",{children:"yes"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"Typing, cursors"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("a",{href:"#/docs/streaming",children:e.jsx("code",{children:"streamChannelOptions"})})}),e.jsx("td",{children:"reduce only"}),e.jsx("td",{children:"single item"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"AI streams, progress"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("a",{href:"#/docs/presence",children:e.jsx("code",{children:"usePresence"})})}),e.jsx("td",{children:"read-only"}),e.jsx("td",{children:"yes"}),e.jsx("td",{children:"connection-tied"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"Who is online"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("a",{href:"#/docs/tick",children:e.jsx("code",{children:"tickCollectionOptions"})})}),e.jsx("td",{children:"batch overwrite"}),e.jsx("td",{children:"yes"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"no"}),e.jsx("td",{children:"Game state"})]})]})]}),e.jsx("h2",{id:"common-combos",children:"Common combinations"}),e.jsx("p",{children:"Most apps use 2–3 patterns together. Here are typical stacks:"}),e.jsx("h3",{children:"SaaS dashboard"}),e.jsx(u,{code:`// Live data from your server functions
useQuery(getIssues, { projectId }, { getKey: (i) => i.id })

// Who is viewing this board right now — define the channel once...
const boardPresence = createPresenceChannel({
  id: 'board-presence',
  channel: ({ id }: { id: string }) => ['board', { id }],
})

// ...then join + observe in a component (keyed by connectionId)
const { others, updatePresence } = usePresence(boardPresence, {
  params: { id },
  initial: { name: currentUser.name },
})`}),e.jsx("h3",{children:"Chat app"}),e.jsx(u,{code:`// Message history + live messages (TanStack DB collection)
liveChannelOptions({ client, channel: ['room', { id }], ... })

// Typing indicators (auto-expire after 3s)
ephemeralLiveOptions({ client, channel: ['typing', { id }], ttl: 3000, ... })

// Who is in this room — join + observe via the presence hook
const roomPresence = createPresenceChannel({
  id: 'room-presence',
  channel: ({ id }: { id: string }) => ['room', { id }],
})
const { others } = usePresence(roomPresence, {
  params: { id },
  initial: { name: currentUser.name },
})
// Each peer is a PresenceUser keyed by connectionId (u.connectionId)`}),e.jsx("h3",{children:"AI assistant"}),e.jsx(u,{code:`// Conversation history — live from server function
useQuery(getMessages, { sessionId }, { getKey: (m) => m.id })

// Token stream for the current response
streamChannelOptions({ channel: ['stream', { sessionId }], ... })`}),e.jsx("h2",{id:"rest-collections",children:"Already have REST endpoints?"}),e.jsxs("p",{children:["If you are not using server functions, connect your existing REST API with ",e.jsx("code",{children:"useRealtimeCollection"}),". Pass a ",e.jsx("code",{children:"url"})," and get CRUD automatically:"]}),e.jsx(u,{code:`import { useRealtimeCollection } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

function TodoList() {
  const todos = useRealtimeCollection<Todo>({
    url: '/api/todos',
    getKey: (t) => t.id,
  })

  // Select all — re-renders on every change
  const { data } = useLiveQuery((q) => q.from({ todos }))

  // Mutations via the collection
  await todos.insert({ id: uuid(), text: 'New todo' })
  await todos.update(id, (draft) => { draft.done = true })
  await todos.delete(id)
}`}),e.jsx("p",{children:"The two-hook pattern is intentional: the collection manages sync, the query manages rendering. Change the query for filtering or sorting — not the collection:"}),e.jsx(u,{code:`// Same collection, different views — no extra fetches
const { data: active } = useLiveQuery((q) =>
  q.from({ todos }).where('done', '=', false)
)

const { data: sorted } = useLiveQuery((q) =>
  q.from({ todos }).orderBy('createdAt', 'desc')
)`}),e.jsx("h3",{id:"tanstack-query-escape-hatch",children:"Already using TanStack Query?"}),e.jsxs("p",{children:["Pass a ",e.jsx("code",{children:"queryFn"})," that delegates to your existing query client. You keep your cache, deduplication, and devtools:"]}),e.jsx(u,{code:`const todos = useRealtimeCollection<Todo>({
  channel: ['todos'],
  getKey: (t) => t.id,
  queryFn: () => queryClient.fetchQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then((r) => r.json()),
  }),
})`}),e.jsx("h2",{id:"see-also",children:"See also"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," — full guide to ",e.jsx("code",{children:"useQuery"})," and ",e.jsx("code",{children:"useMutation"})]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/collections",children:"Collections"})," — full documentation for ",e.jsx("code",{children:"realtimeCollectionOptions"})]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/api-reference",children:"API Reference"})," — signatures for all patterns"]})]})]})}function Yj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Reactive Queries"}),e.jsx("p",{className:"doc-lead",children:"Declare a server query once. Every component that calls it shares one fetch, one SSE subscription, and one cache — automatically. When data changes, all subscribers update in the same render pass."}),e.jsx("h2",{id:"concept",children:"How it works"}),e.jsxs("p",{children:[e.jsx("code",{children:"realtime.query(fn)"})," wraps your server function and returns a"," ",e.jsx("code",{children:"ReactiveQueryFn"}),". When a client calls it via"," ",e.jsx("code",{children:"useQuery"}),", the server returns the initial data along with a channel name derived from the query arguments. The client subscribes to that channel automatically and keeps the data live."]}),e.jsxs("p",{children:["Multiple components calling ",e.jsx("code",{children:"useQuery"})," with the same"," ",e.jsx("code",{children:"(serverFn, args)"})," pair deduplicate everything — one network request, one SSE connection, one"," ",e.jsx("a",{href:"https://tanstack.com/db",target:"_blank",rel:"noopener",children:"TanStack DB Collection"})," ","that all components read from."]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"No manual channel wiring."})," You never call"," ",e.jsx("code",{children:"realtimeCollectionOptions"})," or pass a channel key by hand. The server function encodes the channel into the response and the client hooks decode it transparently. When a mutation invalidates multiple queries, a single SSE batch message updates all of them in the same render pass — no torn state."]})}),e.jsx("h2",{id:"server-setup",children:"Server — realtime.query()"}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsxs("strong",{children:["Where does ",e.jsx("code",{children:"realtime.query"})," come from?"]})," ","It is ",e.jsx("em",{children:"not"})," a method on the transport handler."," ",e.jsx("code",{children:"createStartHandler"})," (from"," ",e.jsx("code",{children:"@realtimejs/preset-start"}),") returns"," ",e.jsx("code",{children:"{ handle, publish, createStream, dispose }"})," — the reactive ",e.jsx("code",{children:"query"}),"/",e.jsx("code",{children:"mutation"})," wrappers come from ",e.jsx("code",{children:"createReactiveQueries()"})," in"," ",e.jsx("code",{children:"@realtimejs/reactive-drizzle"})," (the Drizzle/Postgres engine, the one reactive engine that ships today). You compose the two once and re-export a single ",e.jsx("code",{children:"realtime"})," object. See"," ",e.jsx("a",{href:"#/docs/server-functions",children:"TanStack Start + Drizzle"})," and"," ",e.jsx("a",{href:"#/docs/getting-started",children:"Getting Started"})," for the exact wiring. If your stack isn’t Drizzle/Postgres, use the vendor-neutral ",e.jsx("a",{href:"#/docs/collections",children:"collection"})," /"," ",e.jsx("a",{href:"#/docs/channels",children:"channel"})," primitives instead."]})}),e.jsxs("p",{children:["Import the composed ",e.jsx("code",{children:"realtime"})," object from your server setup and wrap your query function. The wrapped function is callable on both server and client."]}),e.jsx(u,{title:"app/server/todos.ts",code:`import { realtime } from './realtime'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'

// realtime.query() wraps the function — channels derived automatically
export const getTodos = realtime.query(
  async ({ teamId }: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, teamId))
)`}),e.jsxs("p",{children:["The branded ",e.jsx("code",{children:"ReactiveQueryFn"})," type carries TypeScript phantom fields so ",e.jsx("code",{children:"useQuery"})," infers ",e.jsx("code",{children:"TArgs"})," and"," ",e.jsx("code",{children:"TItem"})," without explicit generics."]}),e.jsx("h2",{id:"server-mutation",children:"Server — realtime.mutation()"}),e.jsxs("p",{children:["Wrap write operations with ",e.jsx("code",{children:"realtime.mutation()"}),". The library captures which rows were written and publishes a batch invalidation to all affected query subscribers."]}),e.jsx(u,{title:"app/server/todos.ts (continued)",code:`export const createTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db
      .insert(todos)
      .values({ teamId, title, done: false })
      .returning()
    return todo
  }
)`}),e.jsx("h2",{id:"useQuery",children:"useQuery"}),e.jsxs("p",{children:["Subscribe to a reactive server query and keep the result live. Returns an array of typed items plus a composable ",e.jsx("code",{children:"collection"})," for client-side filtering and sorting."]}),e.jsx(u,{title:"TodoList.tsx",code:`import { useQuery } from '@realtimejs/react'
import { getTodos } from '../server/todos'

export function TodoList({ teamId }: { teamId: string }) {
  const {
    data,
    collection,
    isPending,
    isFetching,
    error,
    refetch,
  } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

  if (isPending) return <p>Loading…</p>
  if (error)     return <p>Error: {String(error)}</p>

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useQuery<TArgs, TItem extends Record<string, unknown>>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: TArgs,
  options: {
    getKey: (item: TItem) => string   // required — extracts a stable key per item
    enabled?: boolean                  // default: true — set false to skip initial fetch
    refetchOnReconnect?: boolean       // default: true
  }
): {
  data: Array<TItem>                   // live array of items from the server
  collection: Collection<TItem, string> | null  // TanStack DB collection for useLiveQuery
  isPending: boolean                   // true until first data arrives
  isFetching: boolean                  // true during background refetch
  error: unknown
  refetch: () => void
}`}),e.jsx("h2",{id:"collection-composability",children:"Client-side filtering with collection"}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"collection"})," returned by ",e.jsx("code",{children:"useQuery"})," is a live"," ",e.jsx("a",{href:"https://tanstack.com/db",target:"_blank",rel:"noopener",children:"TanStack DB Collection"}),". Pass it to ",e.jsx("code",{children:"useLiveQuery"})," to filter, sort, or join client-side — no extra server requests needed."]}),e.jsx(u,{title:"ActiveTodos.tsx",code:`import { useQuery } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'
import { getTodos } from '../server/todos'

export function ActiveTodos({ teamId }: { teamId: string }) {
  const { collection } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

  // Client-side filter — reactive, no network request
  const { data: active } = useLiveQuery(
    (q) => q.from({ todos: collection }).where('done', '=', false),
    [collection],
  )

  return <ul>{active.map(t => <li key={t.id}>{t.title}</li>)}</ul>
}`}),e.jsxs("p",{children:["Multiple components can call ",e.jsx("code",{children:"useQuery"})," with the same pair and each apply a different ",e.jsx("code",{children:"useLiveQuery"})," filter — all reading from the same underlying collection, zero duplicate fetches."]}),e.jsx(u,{code:`// Component A — shows done items, sorted by completion time
const { data: done } = useLiveQuery(
  (q) => q.from({ todos: collection })
          .where('done', '=', true)
          .orderBy('completedAt', 'desc'),
  [collection],
)

// Component B — shows active items assigned to current user
const { data: mine } = useLiveQuery(
  (q) => q.from({ todos: collection })
          .where('done', '=', false)
          .where('assigneeId', '=', currentUserId),
  [collection],
)`}),e.jsx("h2",{id:"useMutation",children:"useMutation"}),e.jsxs("p",{children:["Wraps a reactive mutation function with loading state and error handling. The ",e.jsx("code",{children:"optimistic"})," option provides declarative optimistic updates that are automatically rolled back on error."]}),e.jsx(u,{title:"AddTodoForm.tsx",code:`import { useMutation } from '@realtimejs/react'
import { getTodos, createTodo } from '../server/todos'

export function AddTodoForm({ teamId }: { teamId: string }) {
  const { mutate, isPending, error } = useMutation(createTodo, {
    optimistic: (cache, args) => {
      // Speculatively add the todo — rolled back automatically on error
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
    onSuccess: (todo) => console.log('Created:', todo.id),
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const title = (form.elements.namedItem('title') as HTMLInputElement).value
    await mutate({ teamId, title })
    form.reset()
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{String(error)}</p>}
      <input name="title" placeholder="New todo…" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Add'}
      </button>
    </form>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options?: {
    optimistic?: (cache: OptimisticCache, args: TArgs) => void
    onSuccess?: (data: TResult, args: TArgs) => void
    onError?: (error: unknown, args: TArgs) => void
  }
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: boolean
  error: unknown
  data: TResult | undefined
  reset: () => void
}`}),e.jsx("h2",{id:"usePaginatedQuery",children:"usePaginatedQuery"}),e.jsxs("p",{children:["Paginated variant of ",e.jsx("code",{children:"useQuery"}),". Accumulates pages as you call ",e.jsx("code",{children:"fetchNextPage"})," and keeps the first page live via the shared SSE subscription."]}),e.jsx(u,{title:"FeedList.tsx",code:`import { usePaginatedQuery } from '@realtimejs/react'
import { getFeedPage } from '../server/feed'

export function FeedList({ teamId }: { teamId: string }) {
  const {
    items,
    isPending,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePaginatedQuery(getFeedPage, { teamId })

  if (isPending) return <p>Loading feed…</p>
  if (error)     return <p>Error: {String(error)}</p>

  return (
    <>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function usePaginatedQuery<TItem, TArgs extends { cursor?: string | number | null; limit?: number }>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: Omit<TArgs, 'cursor' | 'limit'>,
  options?: {
    pageSize?: number         // default: 20
    enabled?: boolean
    refetchOnReconnect?: boolean
  }
): {
  items: TItem[]
  isPending: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: unknown
  fetchNextPage: () => Promise<void>
  refetch: () => void
}`}),e.jsx("h2",{id:"shared-cache",children:"Shared query cache"}),e.jsxs("p",{children:["Under the hood each unique ",e.jsx("code",{children:"(serverFn, args)"})," pair maps to a single TanStack DB Collection. Any number of components can call"," ",e.jsx("code",{children:"useQuery"})," with the same pair and they will all:"]}),e.jsxs("ul",{children:[e.jsx("li",{children:"Share the initial HTTP request — only one fetch fires."}),e.jsx("li",{children:"Share the SSE subscription — one connection services all components."}),e.jsxs("li",{children:["Reflect optimistic updates from ",e.jsx("em",{children:"any"})," sibling component instantly, with no prop drilling."]})]}),e.jsx("p",{children:"The collection is torn down and garbage-collected once all components using it unmount."}),e.jsx("h2",{id:"batched-consistency",children:"Batched consistency"}),e.jsxs("p",{children:["When a single mutation invalidates multiple queries (e.g. updating a todo that appears in a list ",e.jsx("em",{children:"and"})," a stats widget), the server re-runs all affected queries in parallel and sends one atomic"," ",e.jsx("code",{children:"__realtime_batch__"})," SSE message containing every update."]}),e.jsxs("p",{children:["The client fans these out synchronously inside"," ",e.jsx("code",{children:"RealtimeProvider"}),". React 18 automatic batching merges all resulting state updates into a single render — no torn state, no partial updates."]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Zero configuration."})," Batched consistency is enabled automatically by ",e.jsx("code",{children:"RealtimeProvider"}),". No changes to your query or mutation code are required."]})}),e.jsx("h2",{id:"invalidation",children:"How invalidation is routed"}),e.jsxs("p",{children:["When a ",e.jsx("code",{children:"realtime.mutation()"})," writes to the database, the server determines which subscriptions to re-run without broadcasting to all of them. It works in two steps:"]}),e.jsxs("ol",{children:[e.jsxs("li",{children:["The reactive DB proxy captures the WHERE clause from each"," ",e.jsx("code",{children:"realtime.query()"})," call and compiles it into a row-matching function stored alongside the subscription."]}),e.jsxs("li",{children:["On write, the ",e.jsx("code",{children:".returning()"})," rows are checked against every active subscription’s compiled predicate. Only matching subscriptions are re-queried and pushed to clients."]})]}),e.jsxs("p",{children:["For ",e.jsx("strong",{children:"UPDATE"})," operations there is one additional step: if the mutation’s ",e.jsx("code",{children:".set({…})"})," changed a column that is referenced by a subscription’s predicate, that subscription is re-run even when the post-update row no longer matches it. This ensures subscribers see items ",e.jsx("em",{children:"disappear"})," from filtered result sets, not just appear."]}),e.jsx("h3",{id:"invalidation-predicate-design",children:"Design predicates on stable fields"}),e.jsxs("p",{children:["Invalidation is most precise when server-side predicates filter on"," ",e.jsx("strong",{children:"stable fields"})," (IDs, team membership, foreign keys) and"," ",e.jsx("strong",{children:"mutable field filtering happens client-side"})," via"," ",e.jsx("code",{children:"useLiveQuery"}),". This is the recommended pattern:"]}),e.jsx(u,{code:`// ✅  Server predicate on stable field — precise invalidation
export const getTodos = realtime.query(
  async ({ teamId }: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, teamId))
)

// ✅  Client-side split on mutable field — no extra server request
const { collection } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)
const { data: done } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', true),
  [collection],
)`}),e.jsxs("p",{children:["The alternative — separate server queries filtering on"," ",e.jsx("code",{children:"done = false"})," and ",e.jsx("code",{children:"done = true"})," — works correctly (the conservative UPDATE check handles it), but re-runs both subscriptions on every toggle instead of just updating the shared collection client-side. One server query, two client views is both more efficient and simpler."]}),e.jsx("h2",{id:"arg-serialisation",children:"Arg serialisation gotcha"}),e.jsxs("p",{children:["The cache key is derived from ",e.jsx("code",{children:"JSON.stringify(args)"}),"."," ",e.jsx("code",{children:"JSON.stringify"})," does ",e.jsx("em",{children:"not"})," guarantee key order for plain objects, so two components passing logically equal args can create two separate collections if the object keys are in different order."]}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Recommendation:"})," always pass args as a literal object in a consistent key order, or define a shared constant:"]})}),e.jsx(u,{code:`// ✅ consistent — always same cache key
const args = { projectId, teamId } as const
useQuery(getTodos, args, { getKey: (t) => t.id })

// ⚠️  may produce two cache entries if callers differ in key order
useQuery(getTodos, { teamId, projectId }, { getKey: (t) => t.id })
useQuery(getTodos, { projectId, teamId }, { getKey: (t) => t.id })  // different key!`}),e.jsx("p",{children:"A future version of the library will normalise key order automatically. Until then, define args constants in a shared module."})]})}function Gj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Solid Primitives"}),e.jsxs("p",{className:"doc-lead",children:["All primitives are exported from ",e.jsx("code",{children:"@realtimejs/solid"}),". The client is sourced from ",e.jsx("code",{children:"RealtimeProvider"})," context."]}),e.jsxs("p",{children:["The Solid adapter mirrors the React adapter — every hook on the"," ",e.jsx("a",{href:"#/docs/hooks",children:"React Hooks"})," page has a Solid equivalent. Names match, with one convention difference: the reactive-query primitives are ",e.jsx("code",{children:"createQuery"}),", ",e.jsx("code",{children:"createMutation"}),", and ",e.jsx("code",{children:"createPaginatedQuery"})," (Solid-idiomatic"," ",e.jsx("code",{children:"create*"})," naming) rather than React’s"," ",e.jsx("code",{children:"useQuery"}),"/",e.jsx("code",{children:"useMutation"}),"/",e.jsx("code",{children:"usePaginatedQuery"}),". Every other primitive keeps its"," ",e.jsx("code",{children:"use*"})," name. Internally, primitives use Solid signals and"," ",e.jsx("code",{children:"createEffect"})," instead of React state and"," ",e.jsx("code",{children:"useEffect"}),", so query/mutation results are"," ",e.jsx("strong",{children:"signal accessors"})," (call them: ",e.jsx("code",{children:"query.data()"}),","," ",e.jsx("code",{children:"mutation.isPending()"}),")."]}),e.jsx("h2",{children:"Installation"}),e.jsx(u,{code:"npm install @realtimejs/core @realtimejs/solid"}),e.jsx("h2",{children:"Provider"}),e.jsx(u,{title:"App.tsx",code:`import { RealtimeProvider } from '@realtimejs/solid'
import { client } from './client'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
    </RealtimeProvider>
  )
}`}),e.jsx("h2",{children:"Available primitives"}),e.jsx("p",{children:"All hooks from the React adapter are available with identical names and signatures:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"useRealtime"}),", ",e.jsx("code",{children:"useConnectionStatus"}),","," ",e.jsx("code",{children:"useIsConnected"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useSubscribe"}),", ",e.jsx("code",{children:"usePublish"}),","," ",e.jsx("code",{children:"useChannel"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"usePresence"}),", ",e.jsx("code",{children:"useStream"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useRealtimeCollection"}),", ",e.jsx("code",{children:"useLiveChannel"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useLatestMessage"}),", ",e.jsx("code",{children:"useChannelHistory"}),","," ",e.jsx("code",{children:"useChannelStats"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useTypingIndicator"}),", ",e.jsx("code",{children:"useOnReconnect"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useSyncedCounter"}),", ",e.jsx("code",{children:"useSyncedValue"}),","," ",e.jsx("code",{children:"useSyncedSet"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"createQuery"}),", ",e.jsx("code",{children:"createMutation"}),","," ",e.jsx("code",{children:"createPaginatedQuery"})]})]}),e.jsx("h2",{id:"createQuery",children:"createQuery"}),e.jsxs("p",{children:["Solid primitive for reactive server queries. Subscribes to a reactive server query and keeps the result live via a shared SSE connection. See the ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"TodoList.tsx",code:`import { createQuery } from '@realtimejs/solid'
import { getTodos } from '../server/todos'

function TodoList(props: { teamId: string }) {
  const query = createQuery(
    getTodos,
    () => ({ teamId: props.teamId }),
    { getKey: (t) => t.id },
  )

  return (
    <Show when={!query.isPending()} fallback={<p>Loading…</p>}>
      <ul>
        <For each={query.data()}>{(todo) => <li>{todo.title}</li>}</For>
      </ul>
    </Show>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function createQuery<TArgs, TItem extends Record<string, unknown>>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: Accessor<TArgs>,      // reactive accessor — reruns when args change
  options: {
    getKey: (item: TItem) => string    // required — stable key per item
    enabled?: Accessor<boolean>
    refetchOnReconnect?: Accessor<boolean>
  },
): {
  data: Accessor<Array<TItem>>           // live array from the server
  collection: Accessor<Collection<TItem, string> | null>
  isPending: Accessor<boolean>
  isFetching: Accessor<boolean>
  error: Accessor<unknown>
  refetch: () => void
}`}),e.jsx("h2",{id:"createMutation",children:"createMutation"}),e.jsxs("p",{children:["Solid primitive for reactive mutations. Wraps an async mutation function with loading state, error handling, and declarative optimistic updates. See the ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"AddTodoForm.tsx",code:`import { createMutation } from '@realtimejs/solid'
import { getTodos, createTodo } from '../server/todos'

function AddTodoForm(props: { teamId: string }) {
  const mutation = createMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  return (
    <button
      disabled={mutation.isPending()}
      onClick={() => mutation.mutate({ teamId: props.teamId, title: 'New todo' })}
    >
      {mutation.isPending() ? 'Saving…' : 'Add'}
    </button>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function createMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options?: {
    optimistic?: (cache: OptimisticCache, args: TArgs) => void
    onSuccess?: (data: TResult, args: TArgs) => void
    onError?: (error: unknown, args: TArgs) => void
  }
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: Accessor<boolean>
  error: Accessor<unknown>
  data: Accessor<TResult | undefined>
  reset: () => void
}`}),e.jsx("h2",{id:"createPaginatedQuery",children:"createPaginatedQuery"}),e.jsxs("p",{children:["Paginated variant of ",e.jsx("code",{children:"createQuery"}),". Accumulates pages and keeps the first page live. See the"," ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"FeedList.tsx",code:`import { createPaginatedQuery } from '@realtimejs/solid'
import { getFeedPage } from '../server/feed'

function FeedList(props: { teamId: string }) {
  const query = createPaginatedQuery(
    getFeedPage,
    () => ({ teamId: props.teamId }),
  )

  return (
    <>
      <ul>
        <For each={query.items()}>{(item) => <li>{item.text}</li>}</For>
      </ul>
      <Show when={query.hasNextPage()}>
        <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage()}>
          {query.isFetchingNextPage() ? 'Loading…' : 'Load more'}
        </button>
      </Show>
    </>
  )
}`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function createPaginatedQuery<TItem, TArgs extends { cursor?: string | number | null; limit?: number }>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: Accessor<Omit<TArgs, 'cursor' | 'limit'>>,
  options?: {
    pageSize?: Accessor<number>
    enabled?: Accessor<boolean>
    refetchOnReconnect?: Accessor<boolean>
  },
): {
  items: Accessor<Array<TItem>>
  isPending: Accessor<boolean>
  isFetchingNextPage: Accessor<boolean>
  hasNextPage: Accessor<boolean>
  error: Accessor<unknown>
  fetchNextPage: () => Promise<void>
  refetch: () => void
}`}),e.jsx("h2",{children:"Testing utilities"}),e.jsxs("p",{children:[e.jsx("code",{children:"createTestRealtimeProvider"})," and"," ",e.jsx("code",{children:"createTestRealtimeProviderWithPresence"})," are exported for testing components that use realtime primitives."]}),e.jsxs("p",{children:["See ",e.jsx("a",{href:"#/docs/testing",children:"Testing"})," for patterns and examples."]}),e.jsx("h2",{children:"DevTools"}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"@realtimejs/solid-devtools"})," for the Solid developer tools panel. See ",e.jsx("a",{href:"#/docs/devtools",children:"DevTools"}),"."]})]})}function Vj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Vue Composables"}),e.jsxs("p",{className:"doc-lead",children:["All composables are exported from ",e.jsx("code",{children:"@realtimejs/vue"}),". The client is sourced from ",e.jsx("code",{children:"RealtimeProvider"})," context via Vue’s provide/inject."]}),e.jsxs("p",{children:["The Vue adapter mirrors the React adapter — every hook on the"," ",e.jsx("a",{href:"#/docs/hooks",children:"React Hooks"})," page has a Vue composable with the same name. The two conventions to know: reactive arguments accept"," ",e.jsx("code",{children:"MaybeRef<TArgs>"})," (pass a plain object, a"," ",e.jsx("code",{children:"ref"}),", or a ",e.jsx("code",{children:"computed"})," and the composable re-subscribes when it changes), and return values are Vue"," ",e.jsx("code",{children:"Ref"})," / ",e.jsx("code",{children:"ComputedRef"})," values rather than React state — read them with ",e.jsx("code",{children:".value"})," (auto-unwrapped in"," ",e.jsx("code",{children:"<template>"}),")."]}),e.jsx("h2",{children:"Installation"}),e.jsx(u,{code:"npm install @realtimejs/core @realtimejs/vue"}),e.jsx("h2",{children:"Provider"}),e.jsx(u,{title:"App.vue",code:`<script setup lang="ts">
import { RealtimeProvider } from '@realtimejs/vue'
import { client } from './client'
<\/script>

<template>
  <RealtimeProvider :client="client">
    <MyApp />
  </RealtimeProvider>
</template>`}),e.jsx("h2",{children:"Available composables"}),e.jsx("p",{children:"All hooks from the React adapter are available with identical names and signatures:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("code",{children:"useRealtime"}),", ",e.jsx("code",{children:"useConnectionStatus"}),","," ",e.jsx("code",{children:"useIsConnected"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useSubscribe"}),", ",e.jsx("code",{children:"usePublish"}),","," ",e.jsx("code",{children:"useChannel"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"usePresence"}),", ",e.jsx("code",{children:"useStream"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useRealtimeCollection"}),", ",e.jsx("code",{children:"useLiveChannel"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useLatestMessage"}),", ",e.jsx("code",{children:"useChannelHistory"}),","," ",e.jsx("code",{children:"useChannelStats"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useTypingIndicator"}),", ",e.jsx("code",{children:"useOnReconnect"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useSyncedCounter"}),", ",e.jsx("code",{children:"useSyncedValue"}),","," ",e.jsx("code",{children:"useSyncedSet"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"useQuery"}),", ",e.jsx("code",{children:"useMutation"}),","," ",e.jsx("code",{children:"usePaginatedQuery"})]})]}),e.jsx("h2",{id:"useQuery",children:"useQuery"}),e.jsxs("p",{children:["Subscribes to a reactive server query and keeps the result live. The"," ",e.jsx("code",{children:"args"})," parameter accepts a plain object or a"," ",e.jsx("code",{children:"MaybeRef<TArgs>"})," — Vue will automatically track reactive references and re-subscribe when they change. See the"," ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"TodoList.vue",code:`<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@realtimejs/vue'
import { getTodos } from '../server/todos'

const props = defineProps<{ teamId: string }>()

// args accepts a MaybeRef — pass a computed/ref to re-subscribe reactively.
const { data, isPending, error } = useQuery(
  getTodos,
  computed(() => ({ teamId: props.teamId })),
  { getKey: (t) => t.id },
)
<\/script>

<template>
  <p v-if="isPending">Loading…</p>
  <p v-else-if="error">Error: {{ error }}</p>
  <ul v-else>
    <li v-for="todo in data" :key="todo.id">{{ todo.title }}</li>
  </ul>
</template>`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useQuery<TArgs, TItem extends Record<string, unknown>>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: MaybeRef<TArgs>,      // plain object or ref — reactive refs are tracked
  options: {
    getKey: (item: TItem) => string    // required — stable key per item
    enabled?: MaybeRef<boolean>
    refetchOnReconnect?: MaybeRef<boolean>
  },
): {
  data: Ref<Array<TItem>>                // live array from the server
  collection: Ref<Collection<TItem, string> | null>  // pass to useLiveQuery
  isPending: ComputedRef<boolean>
  isFetching: Ref<boolean>
  error: Ref<unknown>
  refetch: () => void
}`}),e.jsx("h2",{id:"useMutation",children:"useMutation"}),e.jsxs("p",{children:["Mutation composable with loading state, error handling, and declarative optimistic updates. See the"," ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"AddTodoForm.vue",code:`<script setup lang="ts">
import { useMutation } from '@realtimejs/vue'
import { getTodos, createTodo } from '../server/todos'

const props = defineProps<{ teamId: string }>()

const { mutate, isPending, error, reset } = useMutation(createTodo, {
  optimistic: (cache, args) => {
    cache.update(getTodos, { teamId: args.teamId }, (prev) => [
      ...(prev ?? []),
      { id: crypto.randomUUID(), title: args.title, done: false },
    ])
  },
  onSuccess: (todo) => console.log('Created:', todo.id),
  onError:   (err) => console.error('Failed:', err),
})

function handleAdd() {
  mutate({ teamId: props.teamId, title: 'New todo' })
}
<\/script>

<template>
  <p v-if="error">{{ error }} <button @click="reset">Dismiss</button></p>
  <button :disabled="isPending" @click="handleAdd">
    {{ isPending ? 'Saving…' : 'Add' }}
  </button>
</template>`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function useMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options?: {
    optimistic?: (cache: OptimisticCache, args: TArgs) => void
    onSuccess?: (data: TResult, args: TArgs) => void
    onError?: (error: unknown, args: TArgs) => void
  }
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: Ref<boolean>
  error: Ref<unknown>
  data: Ref<TResult | undefined>
  reset: () => void
}`}),e.jsx("h2",{id:"usePaginatedQuery",children:"usePaginatedQuery"}),e.jsxs("p",{children:["Paginated variant of ",e.jsx("code",{children:"useQuery"}),". Accumulates pages as you call ",e.jsx("code",{children:"fetchNextPage"})," and keeps the first page live. The"," ",e.jsx("code",{children:"args"})," parameter accepts ",e.jsx("code",{children:"MaybeRef<TArgs>"}),". See the ",e.jsx("a",{href:"#/docs/reactive-queries",children:"Reactive Queries"})," guide for full examples."]}),e.jsx(u,{title:"FeedList.vue",code:`<script setup lang="ts">
import { usePaginatedQuery } from '@realtimejs/vue'
import { getFeedPage } from '../server/feed'

const props = defineProps<{ teamId: string }>()

const { items, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
  usePaginatedQuery(getFeedPage, { teamId: props.teamId })
<\/script>

<template>
  <p v-if="isPending">Loading…</p>
  <ul v-else>
    <li v-for="item in items" :key="item.id">{{ item.text }}</li>
  </ul>
  <button v-if="hasNextPage" :disabled="isFetchingNextPage" @click="fetchNextPage">
    {{ isFetchingNextPage ? 'Loading…' : 'Load more' }}
  </button>
</template>`}),e.jsx("h3",{children:"Signature"}),e.jsx(u,{code:`function usePaginatedQuery<TItem, TArgs extends { cursor?: string | number | null; limit?: number }>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: MaybeRef<Omit<TArgs, 'cursor' | 'limit'>>,
  options?: {
    pageSize?: MaybeRef<number>
    enabled?: MaybeRef<boolean>
    refetchOnReconnect?: MaybeRef<boolean>
  }
): {
  items: ComputedRef<Array<TItem>>
  isPending: ComputedRef<boolean>
  isFetching: Ref<boolean>
  isFetchingNextPage: Ref<boolean>
  hasNextPage: ComputedRef<boolean>
  error: Ref<unknown>
  fetchNextPage: () => Promise<void>
  refetch: () => void
}`}),e.jsx("h2",{children:"Testing utilities"}),e.jsxs("p",{children:[e.jsx("code",{children:"createTestRealtimeProvider"})," and"," ",e.jsx("code",{children:"createTestRealtimeProviderWithPresence"})," are exported for testing components that use realtime composables."]}),e.jsxs("p",{children:["See ",e.jsx("a",{href:"#/docs/testing",children:"Testing"})," for patterns and examples."]}),e.jsx("h2",{children:"DevTools"}),e.jsxs("p",{children:["Use ",e.jsx("code",{children:"@realtimejs/vue-devtools"})," for the Vue developer tools panel. See ",e.jsx("a",{href:"#/docs/devtools",children:"DevTools"}),"."]})]})}function Kj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"DevTools"}),e.jsx("p",{className:"doc-lead",children:"Developer tools panels for inspecting channels, messages, presence, connection state, and the offline queue. Available for React, Solid, and Vue."}),e.jsx("h2",{children:"Installation"}),e.jsx(u,{code:`# React
npm install @realtimejs/react-devtools

# Solid
npm install @realtimejs/solid-devtools

# Vue
npm install @realtimejs/vue-devtools`}),e.jsx("h2",{children:"Usage"}),e.jsxs("p",{children:["Add the ",e.jsx("code",{children:"RealtimeDevtools"})," component anywhere inside your"," ",e.jsx("code",{children:"RealtimeProvider"}),". It renders a floating panel that can be toggled open/closed."]}),e.jsx("h3",{children:"React"}),e.jsx(u,{title:"App.tsx",code:`import { RealtimeProvider } from '@realtimejs/react'
import { RealtimeDevtools } from '@realtimejs/react-devtools'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
      <RealtimeDevtools />
    </RealtimeProvider>
  )
}`}),e.jsx("h3",{children:"Solid"}),e.jsx(u,{title:"App.tsx",code:`import { RealtimeProvider } from '@realtimejs/solid'
import { RealtimeDevtools } from '@realtimejs/solid-devtools'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
      <RealtimeDevtools />
    </RealtimeProvider>
  )
}`}),e.jsx("h3",{children:"Vue"}),e.jsx(u,{title:"App.vue",code:`<script setup lang="ts">
import { RealtimeProvider } from '@realtimejs/vue'
import { RealtimeDevtools } from '@realtimejs/vue-devtools'
import { client } from './client'
<\/script>

<template>
  <RealtimeProvider :client="client">
    <MyApp />
    <RealtimeDevtools />
  </RealtimeProvider>
</template>`}),e.jsxs("p",{children:["In production builds (",e.jsx("code",{children:"process.env.NODE_ENV === 'production'"}),"), ",e.jsx("code",{children:"RealtimeDevtools"})," renders nothing unless"," ",e.jsx("code",{children:"force"})," is set to ",e.jsx("code",{children:"true"}),"."]}),e.jsx("h2",{children:"Props"}),e.jsx(u,{code:`interface RealtimeDevtoolsProps {
  /** Initial open state. @default false */
  initialIsOpen?: boolean
  /** Position of the floating toggle button. @default 'bottom-left' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Force rendering in production builds. @default false */
  force?: boolean
  /** Custom inline styles for the floating toggle button. */
  toggleButtonStyle?: CSSProperties
  /** Custom inline styles for the panel container. */
  panelStyle?: CSSProperties
  /** Offline queue handle to display queue state. Pass the result of useOfflineQueue(). */
  offlineQueue?: OfflineQueueHandle
  /** Track presence on channels when the transport supports it. @default true */
  trackPresence?: boolean
}`}),e.jsx("h2",{children:"What it shows"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Active channels"})," — list of all current subscriptions and subscriber count"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Message log"})," — timestamped incoming/outgoing messages, filterable by channel"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Connection state"})," — current status and a timeline of connection transitions"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Presence"})," — per-channel membership with user data"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Offline queue"})," — pending mutations and flush status"]})]}),e.jsx("h2",{children:"Advanced: createDevtoolsStore"}),e.jsxs("p",{children:["For custom devtools UIs, use ",e.jsx("code",{children:"createDevtoolsStore"})," directly. It takes the ",e.jsx("code",{children:"RealtimeClient"})," as its first argument (plus optional ",e.jsx("code",{children:"DevtoolsStoreOptions"}),") and returns a reactive handle with all the data the panel displays."]}),e.jsx(u,{code:`import { createDevtoolsStore } from '@realtimejs/react-devtools'

const devtools = createDevtoolsStore(client, {
  offlineQueue,        // optional OfflineQueueHandle from useOfflineQueue()
  trackPresence: true, // default
})
// devtools.store → Store<DevtoolsState> (channels, messages, connection history, etc.)
// devtools.clear() → clear collected messages and events
// devtools.destroy() → detach from the client and stop collecting`})]})}function Wj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Examples"}),e.jsxs("p",{className:"doc-lead",children:["Three runnable example apps live in the"," ",e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime/tree/main/examples",target:"_blank",rel:"noopener",children:e.jsx("code",{children:"examples/"})})," ","directory of the repo. Each is a self-contained Vite + React app talking to an in-memory SSE server mounted as Vite dev middleware — no database, no ORM, no external platform (the “bring your own backend” showcase). The snippets below are simplified extracts; follow each card to the full source."]}),e.jsxs("div",{className:"examples-grid",children:[e.jsxs("div",{className:"example-card",children:[e.jsx("h3",{children:e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/collaborative-todos",target:"_blank",rel:"noopener",children:"Collaborative Todos"})}),e.jsxs("p",{children:["A multi-tab todo list demonstrating optimistic updates and CRDT convergence. Uses ",e.jsx("code",{children:"useRealtimeCollection"})," (REST shorthand) with field-level CRDTs (",e.jsx("code",{children:"lww"})," title/completed,"," ",e.jsx("code",{children:"pn-counter"})," votes) so concurrent edits merge without a server-side merge step."]}),e.jsxs("div",{className:"example-card-tags",children:[e.jsx("span",{className:"example-card-tag",children:"useRealtimeCollection"}),e.jsx("span",{className:"example-card-tag",children:"CRDTs"}),e.jsx("span",{className:"example-card-tag",children:"SSE"})]})]}),e.jsxs("div",{className:"example-card",children:[e.jsx("h3",{children:e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/chat",target:"_blank",rel:"noopener",children:"Chat"})}),e.jsxs("p",{children:["A real-time chat room with an append-only message log, presence (“who’s online”), and typing indicators. Uses"," ",e.jsx("code",{children:"useLiveChannel"})," + ",e.jsx("code",{children:"useLiveQuery"})," for messages, ",e.jsx("code",{children:"createPresenceChannel"})," +"," ",e.jsx("code",{children:"usePresence"})," for presence (layered onto the SSE transport via a small ",e.jsx("code",{children:"withPresence"})," wrapper), and"," ",e.jsx("code",{children:"useTypingIndicator"}),"."]}),e.jsxs("div",{className:"example-card-tags",children:[e.jsx("span",{className:"example-card-tag",children:"useLiveChannel"}),e.jsx("span",{className:"example-card-tag",children:"Presence"}),e.jsx("span",{className:"example-card-tag",children:"useTypingIndicator"})]})]}),e.jsxs("div",{className:"example-card",children:[e.jsx("h3",{children:e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/ai-streaming",target:"_blank",rel:"noopener",children:"AI Streaming"})}),e.jsxs("p",{children:["Streams mock LLM tokens from the server to the browser and renders"," ",e.jsx("code",{children:"pending → streaming → done"})," states. Uses"," ",e.jsx("code",{children:"createStreamChannel"})," for the typed stream definition,"," ",e.jsx("code",{children:"handler.createStream"})," on the server, and"," ",e.jsx("code",{children:"useStream"})," on the client, with ",e.jsx("code",{children:"STREAM_DONE"}),"/",e.jsx("code",{children:"STREAM_ERROR"})," sentinels."]}),e.jsxs("div",{className:"example-card-tags",children:[e.jsx("span",{className:"example-card-tag",children:"createStreamChannel"}),e.jsx("span",{className:"example-card-tag",children:"useStream"}),e.jsx("span",{className:"example-card-tag",children:"Server Stream"})]})]})]}),e.jsx("h2",{id:"todo-example",children:"Collaborative Todos"}),e.jsxs("p",{children:["A shared todo list backed by a REST endpoint with realtime sync. The mutating client publishes a CRDT-tagged message back over the"," ",e.jsx("code",{children:"todos"})," channel so peers converge on field-level merges."," ",e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/collaborative-todos",target:"_blank",rel:"noopener",children:"Full source →"})]}),e.jsx("h3",{children:"Server"}),e.jsx(u,{title:"src/realtime.ts",code:`import { createSseHandler } from '@realtimejs/adapter-sse'

// In-memory SSE handler — the "database" is a plain Map in src/server.ts.
export const handler = createSseHandler({
  authorize: () => ({ subscribe: true, publish: true }),
})`}),e.jsx("h3",{children:"React component"}),e.jsxs("p",{children:[e.jsx("code",{children:"useRealtimeCollection"})," with the ",e.jsx("code",{children:"url"})," REST shorthand auto-derives the channel and CRUD callbacks."," ",e.jsx("code",{children:"fields"})," declares per-field CRDT merge: ",e.jsx("code",{children:"text"})," is last-write-wins, ",e.jsx("code",{children:"votes"})," is a PN-counter. Query the stable collection with ",e.jsx("code",{children:"useLiveQuery"}),"."]}),e.jsx(u,{title:"src/App.tsx",code:`import { useRealtimeCollection } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

interface Todo { id: string; text: string; votes: number; done: boolean }

export function TodoList() {
  const todos = useRealtimeCollection<Todo>({
    url: '/api/todos',
    getKey: (t) => t.id,
    fields: { text: 'lww', votes: 'pn-counter' },
    optimistic: true,  // echo suppression for the client-authoritative CRDT path
  })

  const { data } = useLiveQuery((q) =>
    q.from({ todos }).orderBy(({ todos: t }) => t.id, 'asc'),
  )

  const addTodo = () =>
    todos.insert({ id: crypto.randomUUID(), text: 'New todo', votes: 0, done: false })

  return (
    <div>
      <button onClick={addTodo}>Add Todo</button>
      <ul>
        {data.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => todos.update(todo.id, (draft) => { draft.done = !draft.done })}
            />
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  )
}`}),e.jsx("h2",{id:"chat-example",children:"Chat"}),e.jsxs("p",{children:["Append-only message log with live presence and typing indicators. Define the presence channel once with ",e.jsx("code",{children:"createPresenceChannel"}),", then join it with ",e.jsx("code",{children:"usePresence"})," (peers are in ",e.jsx("code",{children:"others"}),", keyed by ",e.jsx("code",{children:"connectionId"}),")."," ",e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/chat",target:"_blank",rel:"noopener",children:"Full source →"})]}),e.jsx(u,{title:"src/App.tsx",code:`import {
  createPresenceChannel,
  useLiveChannel,
  usePresence,
  useTypingIndicator,
} from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

const roomPresence = createPresenceChannel({
  id: 'chat-room-presence',
  channel: (p: { room: string }) => ['chat-presence', { room: p.room }],
})

export function ChatRoom({ room, userName }: { room: string; userName: string }) {
  // Append-only message collection seeded from REST, fed by 'message' events.
  const messages = useLiveChannel<ChatMessage>({
    id: \`chat-\${room}\`,
    channel: 'chat',
    getKey: (m) => m.id,
    initialData: () => fetch('/api/messages').then((r) => r.json()),
    onEvent: (raw) => {
      const e = raw as { type: string; data: ChatMessage }
      return e.type === 'message' ? e.data : null
    },
  })
  const { data } = useLiveQuery((q) =>
    q.from({ messages }).orderBy(({ messages: m }) => m.timestamp, 'asc'),
  )

  // Presence — 'others' excludes you and is keyed by connectionId.
  const { others, updatePresence } = usePresence<{ name: string }, { room: string }>(
    roomPresence,
    { params: { room }, initial: { name: userName } },
  )

  const { typingUsers, startTyping } = useTypingIndicator(['typing', { room }], {
    selfId: userName,
  })

  return (
    <div>
      <div className="online">
        Online: {others.map((u) => u.data.name).join(', ') || 'just you'}
      </div>
      <div className="messages">
        {data.map((m) => (
          <div key={m.id}>
            <strong>{m.author}:</strong> {m.text}
          </div>
        ))}
      </div>
      {typingUsers.length > 0 && <p>{typingUsers.join(', ')} typing…</p>}
    </div>
  )
}`}),e.jsx("h2",{id:"stream-example",children:"AI Streaming"}),e.jsxs("p",{children:["Define a typed stream with ",e.jsx("code",{children:"createStreamChannel"}),", push tokens server-side via ",e.jsx("code",{children:"handler.createStream"}),", and fold them into reactive state on the client with ",e.jsx("code",{children:"useStream"}),"."," ",e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime/tree/main/examples/ai-streaming",target:"_blank",rel:"noopener",children:"Full source →"})]}),e.jsx(u,{title:"src/streamDef.ts",code:`import { STREAM_DONE, STREAM_ERROR, createStreamChannel } from '@realtimejs/core'

interface StreamState {
  content: string
}
type StreamEvent =
  | { type: 'token'; content: string }
  | { type: typeof STREAM_DONE }
  | { type: typeof STREAM_ERROR; message?: string }

export const aiStream = createStreamChannel<StreamState, StreamEvent, { sessionId: string }>({
  id: 'ai-message-stream',
  channel: (p) => ['ai', { sessionId: p.sessionId }],
  initial: { content: '' },
  reduce: (state, event) =>
    event.type === 'token' ? { content: state.content + event.content } : state,
  isDone: (_state, event) => event.type === STREAM_DONE,
  isError: (_state, event) =>
    event.type === STREAM_ERROR ? (event.message ?? 'Stream error') : false,
  staleAfter: 15_000,
})`}),e.jsx(u,{title:"src/server.ts",code:`import { createSseHandler } from '@realtimejs/adapter-sse'

const sse = createSseHandler({ pingInterval: 0 })

export async function runMockStream(sessionId: string) {
  const stream = sse.createStream<{ type: 'token'; content: string }>({
    channel: ['ai', { sessionId }],
  })

  const words = 'The answer to your question is quite interesting.'.split(' ')
  for (const word of words) {
    await stream.push({ type: 'token', content: word + ' ' })
    await new Promise((r) => setTimeout(r, 100))
  }
  await stream.done()  // pushes the STREAM_DONE sentinel
}`}),e.jsx(u,{title:"src/App.tsx",code:`import { useStream } from '@realtimejs/react'
import { aiStream } from './streamDef'

export function AIChat({ sessionId }: { sessionId: string }) {
  const { state, status, error } = useStream(aiStream, { params: { sessionId } })

  if (status === 'pending') return <span>Thinking…</span>
  if (status === 'error')   return <span>Error: {error}</span>

  return (
    <div>
      <p>{state.content}</p>
      {status === 'streaming' && <span className="cursor">|</span>}
      {status === 'done' && <em>Complete</em>}
    </div>
  )
}`}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:["These snippets are simplified extracts. For the full runnable apps — server middleware, auth stub, and build config — see the"," ",e.jsxs("a",{href:"https://github.com/mikn/tanstack-realtime/tree/main/examples",target:"_blank",rel:"noopener",children:[e.jsx("code",{children:"examples/"})," directory"]})," ","in the GitHub repository."]})})]})}function Zj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Tutorial: Task Board"}),e.jsx("p",{className:"doc-lead",children:"A real-time task board with live queries, optimistic mutations, and presence. End to end, from schema to running app."}),e.jsx("h2",{id:"prerequisites",children:"Prerequisites"}),e.jsxs("ul",{children:[e.jsx("li",{children:"Node.js 18+"}),e.jsx("li",{children:"A Postgres database (local or hosted — Neon, Supabase, Railway all work)"}),e.jsx("li",{children:"Basic familiarity with React and TypeScript"})]}),e.jsx("h2",{id:"step-1",children:"Step 1: Create the project"}),e.jsx("p",{children:"Scaffold a TanStack Start app and install the realtime packages:"}),e.jsx(u,{code:`npx create-start-app@latest task-board
cd task-board

npm i @realtimejs/core @realtimejs/react \\
      @realtimejs/preset-start @realtimejs/adapter-sse \\
      @realtimejs/reactive-drizzle \\
      @tanstack/db @tanstack/react-db \\
      drizzle-orm postgres
npm i -D drizzle-kit`}),e.jsx("h2",{id:"step-2",children:"Step 2: Define your database schema"}),e.jsx("p",{children:"Create a Drizzle schema for tasks. This is the only data model in the entire app — types flow from here to every hook automatically."}),e.jsx(u,{title:"db/schema.ts",code:`import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
  id:        text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title:     text('title').notNull(),
  status:    text('status', { enum: ['todo', 'in-progress', 'done'] }).notNull().default('todo'),
  priority:  integer('priority').notNull().default(0),
  assignee:  text('assignee'),
  done:      boolean('done').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Task    = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert`}),e.jsx(u,{title:"db/index.ts",code:`import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client)`}),e.jsx("p",{children:"Run the migration:"}),e.jsx(u,{code:"npx drizzle-kit push"}),e.jsx("h2",{id:"step-3",children:"Step 3: Set up the realtime server"}),e.jsx("p",{children:"Two files: a handler and a route. This is all the server infrastructure you need."}),e.jsxs("p",{children:[e.jsx("code",{children:"@realtimejs/preset-start"})," owns the SSE transport;"," ",e.jsx("code",{children:"@realtimejs/reactive-drizzle"})," owns the auto-invalidating"," ",e.jsx("code",{children:"query"}),"/",e.jsx("code",{children:"mutation"})," wrappers. Compose them and re-export one ",e.jsx("code",{children:"realtime"})," object."]}),e.jsx(u,{title:"app/server/realtime.ts",code:`import { createStartHandler } from '@realtimejs/preset-start'
import { createReactiveQueries } from '@realtimejs/reactive-drizzle'

const reactive = createReactiveQueries()
const handler = createStartHandler({
  onChannelEmpty: reactive.onChannelEmpty,
})
reactive.bindPublish(handler.publish)

// One object for the whole app. Add getUser/authorize to createStartHandler
// later for auth — see the Authentication guide.
export const realtime = {
  handle: handler.handle,
  publish: handler.publish,
  query: reactive.query,
  mutation: reactive.mutation,
}`}),e.jsx(u,{title:"app/routes/api/realtime.ts",code:`import { createAPIFileRoute } from '@tanstack/start/api'
import { realtime } from '../../server/realtime'

export const Route = createAPIFileRoute('/api/realtime')({
  GET:     ({ request }) => realtime.handle(request),
  POST:    ({ request }) => realtime.handle(request),
  OPTIONS: ({ request }) => realtime.handle(request),
})`}),e.jsx("h2",{id:"step-4",children:"Step 4: Write your server functions"}),e.jsxs("p",{children:["Wrap your query and mutations with ",e.jsx("code",{children:"realtime.query()"})," and"," ",e.jsx("code",{children:"realtime.mutation()"}),". This is the only annotation needed — channels, caching, and invalidation are all automatic."]}),e.jsx(u,{title:"app/server/tasks.ts",code:`import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { tasks, type NewTask } from '../../db/schema'
import { realtime } from './realtime'

// Queries — one annotation makes them live
export const getTasks = realtime.query(
  async ({ projectId }: { projectId: string }) =>
    db.select().from(tasks).where(eq(tasks.projectId, projectId))
)

// Mutations — invalidate all subscribers automatically
export const createTask = realtime.mutation(
  async (input: NewTask) => {
    const [task] = await db.insert(tasks).values(input).returning()
    return task
  }
)

export const updateTask = realtime.mutation(
  async ({ id, ...fields }: { id: string } & Partial<NewTask>) => {
    const [task] = await db
      .update(tasks)
      .set(fields)
      .where(eq(tasks.id, id))
      .returning()
    return task
  }
)

export const deleteTask = realtime.mutation(
  async ({ id }: { id: string }) => {
    await db.delete(tasks).where(eq(tasks.id, id))
  }
)`}),e.jsx("h2",{id:"step-5",children:"Step 5: Connect the client"}),e.jsx("p",{children:"Create a realtime client and wrap your app with the provider."}),e.jsx(u,{title:"app/client/realtime.ts",code:`import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

export const realtimeClient = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})`}),e.jsx(u,{title:"app/root.tsx",code:`import { RealtimeProvider } from '@realtimejs/react'
import { realtimeClient } from './client/realtime'

export function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <RouterProvider router={router} />
    </RealtimeProvider>
  )
}`}),e.jsx("h2",{id:"step-6",children:"Step 6: Build the task board UI"}),e.jsxs("p",{children:["This is where the payoff arrives. ",e.jsx("code",{children:"useQuery"})," returns live data. ",e.jsx("code",{children:"useMutation"})," gives you optimistic updates. Open the app in two browser tabs and watch them stay in sync."]}),e.jsx(u,{title:"app/features/board/TaskBoard.tsx",code:`import { useQuery, useMutation } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'
import { getTasks, createTask, updateTask } from '../../server/tasks'

export function TaskBoard({ projectId }: { projectId: string }) {
  // Live query — subscribers sharing the same args share one connection
  const { data, collection } = useQuery(getTasks, { projectId }, {
    getKey: (t) => t.id,
  })

  // Client-side filtering — three columns, one server query, zero extra fetches
  const { data: todo } = useLiveQuery(
    (q) => q.from({ tasks: collection }).where('status', '=', 'todo'),
    [collection],
  )
  const { data: doing } = useLiveQuery(
    (q) => q.from({ tasks: collection }).where('status', '=', 'in-progress'),
    [collection],
  )

  // Optimistic mutation — UI updates before the server responds
  const { mutate: addTask } = useMutation(createTask, {
    optimistic: (cache, args) => {
      cache.update(getTasks, { projectId }, prev => [
        ...(prev ?? []), { ...args, createdAt: new Date() },
      ])
    },
  })

  const { mutate: editTask } = useMutation(updateTask, {
    optimistic: (cache, args) => {
      cache.update(getTasks, { projectId }, prev =>
        (prev ?? []).map(t => t.id === args.id ? { ...t, ...args } : t)
      )
    },
  })

  // ... render columns using todo, doing, etc.
}`}),e.jsx("h2",{id:"step-7",children:"Step 7: Add presence"}),e.jsx("div",{className:"doc-callout",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Presence needs a presence-capable transport."})," Presence tracks server-held membership state, so it requires a bidirectional transport — Centrifugo, Pusher/Soketi, or PartyKit. The receive-only ",e.jsx("code",{children:"sseTransport"})," from the previous steps reports"," ",e.jsx("code",{children:"capabilities.presence = false"}),", and"," ",e.jsx("code",{children:"usePresence"})," will throw against it. Swap the client’s transport for a presence-capable one (your queries, mutations, and channels keep working unchanged) before adding this step. See the"," ",e.jsx("a",{href:"#/docs/transports",children:"Transports capability matrix"})," and the"," ",e.jsx("a",{href:"#/docs/centrifugo",children:"Centrifugo guide"}),"."]})}),e.jsxs("p",{children:["Define a presence channel, then read it with ",e.jsx("code",{children:"usePresence"}),". The current user joins with ",e.jsx("code",{children:"initial"})," data on mount and is excluded from ",e.jsx("code",{children:"others"}),"."]}),e.jsx(u,{title:"app/features/board/presence.ts",code:`import { createPresenceChannel } from '@realtimejs/core'

export const boardPresence = createPresenceChannel({
  id: 'board-presence',
  channel: (params: { projectId: string }) => ['board-presence', params],
})`}),e.jsx(u,{title:"app/features/board/OnlineUsers.tsx",code:`import { usePresence } from '@realtimejs/react'
import { boardPresence } from './presence'

export function OnlineUsers({ projectId, userName }: {
  projectId: string
  userName: string
}) {
  const { others } = usePresence<{ name: string }>(boardPresence, {
    params: { projectId },
    initial: { name: userName },
  })

  return (
    <div className="online-users">
      <span className="you">You</span>
      {others.map(user => (
        <span key={user.connectionId} className="user-badge">
          {user.data.name}
        </span>
      ))}
    </div>
  )
}`}),e.jsx("h2",{id:"step-8",children:"Step 8: Run it"}),e.jsx(u,{code:"npm run dev"}),e.jsxs("p",{children:["Open ",e.jsx("code",{children:"http://localhost:3000"})," in two browser tabs. Add a task in one — it appears instantly in the other. Move a task to “Done” — both tabs update. If you wired up a presence-capable transport in Step 7, the presence indicator shows both tabs as online users."]}),e.jsx("h2",{id:"next-level",children:"Next steps"}),e.jsxs("table",{className:"api-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"I want to…"}),e.jsx("th",{children:"Add this"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Handle concurrent title edits"}),e.jsxs("td",{children:["Add ",e.jsxs("code",{children:["fields: ","{ title: 'lww' }"]})," for last-writer-wins merge. See ",e.jsx("a",{href:"#/docs/crdts",children:"CRDTs"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Show typing indicators"}),e.jsxs("td",{children:["Use ",e.jsx("code",{children:"useTypingIndicator()"}),". See"," ",e.jsx("a",{href:"#/docs/ephemeral",children:"Ephemeral Channels"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Stream AI task descriptions"}),e.jsxs("td",{children:["Use ",e.jsx("code",{children:"createServerStream()"})," + ",e.jsx("code",{children:"useStream()"}),". See ",e.jsx("a",{href:"#/docs/streaming",children:"Streaming"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Scale to multiple server instances"}),e.jsxs("td",{children:["Add a ",e.jsx("code",{children:"PublishBackend"})," (Redis or Upstash). See"," ",e.jsx("a",{href:"#/docs/scaling",children:"Scaling to Production"}),"."]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Work offline"}),e.jsxs("td",{children:["Add ",e.jsx("code",{children:"useOfflineQueue()"}),". Mutations queue locally and flush on reconnect. See ",e.jsx("a",{href:"#/docs/resilience",children:"Resilience"}),"."]})]})]})]})]})}function Xj(){return e.jsxs("article",{className:"doc-article",children:[e.jsx("h1",{children:"Why realtime.js"}),e.jsx("p",{className:"doc-lead",children:"Sync without a platform. Keep your backend, your database, and your deploy target — and skip the per-seat bill."}),e.jsx("h2",{id:"problem",children:"The problem"}),e.jsx("p",{children:"Making server data update in real time usually means one of two things: adopting a managed platform — and with it a proprietary database, a query language, a hosting target, and a per-seat or per-connection pricing meter — or wiring up WebSockets, channels, cache invalidation, presence, and reconnection logic yourself."}),e.jsxs("p",{children:[e.jsx("code",{children:"realtime.js"})," is a third option: a freestanding, vendor-neutral library. There is no platform to adopt and no lock-in. Your Express/Hono routes, your Postgres, and your deploy target stay exactly where they are. You pay your own infra, not a usage meter. Annotate a server function, get live queries — everything else stays the same."]}),e.jsx(u,{code:`// Before: a normal server function
export async function getTodos({ teamId }: { teamId: string }) {
  return db.select().from(todos).where(eq(todos.teamId, teamId))
}

// After: one wrapper, it's live
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)`}),e.jsx("h2",{id:"what-it-does",children:"What it does"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Reactive queries"})," — channels derive from function arguments. Components sharing the same args share one connection and one cache."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Optimistic mutations"})," — declare cache updates alongside the mutation. Automatic rollback on error."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Client-side queries"})," — the returned collection works with ",e.jsx("code",{children:"useLiveQuery"})," for filtering, sorting, and joining without extra server requests."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Presence"})," — cursors, typing indicators, online user lists."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"CRDTs"})," — LWW registers, PN-counters, OR-sets at field granularity for conflict-free concurrent editing."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Pub/sub"})," — raw channel events, append-only live channels, ephemeral channels with TTL."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Streaming"})," — reduce-based state from ordered event streams with resumable HMAC checkpoints."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Resilience"})," — offline queue, gap recovery, multi-tab coordination via BroadcastChannel or SharedWorker."]})]}),e.jsx("h2",{id:"what-it-doesnt",children:"What it doesn’t do"}),e.jsxs("p",{children:[e.jsx("code",{children:"realtime.js"})," is a sync layer, not a platform. It does not provide:"]}),e.jsxs("ul",{children:[e.jsx("li",{children:"A database — bring Postgres, MySQL, SQLite, or anything else"}),e.jsx("li",{children:"Authentication — bring your own JWT, session, or API key system"}),e.jsx("li",{children:"File storage, cron jobs, or search — use purpose-built tools"}),e.jsxs("li",{children:["Rich text CRDT — use"," ",e.jsx("a",{href:"#/docs/rich-text-crdts",children:"Y.js with realtime.js as the transport"})]})]}),e.jsxs("p",{children:["If you want all of those bundled together, a managed platform like Convex is designed for that. The trade-off is coupling to its database, query language, and pricing model — plus a per-seat or per-connection bill that grows with usage. With ",e.jsx("code",{children:"realtime.js"})," ","you pay your own infra and nothing else. Both are reasonable choices depending on what you value."]}),e.jsx("h2",{id:"what-needs-what",children:"What needs what (honest capability matrix)"}),e.jsxs("p",{children:["The whole point of the rebrand is credibility, so here is the honest breakdown. Most of ",e.jsx("code",{children:"realtime.js"})," is fully vendor-neutral and works with any backend. One layer — auto-invalidating reactive server queries — currently ships a single engine adapter."]}),e.jsx("h3",{id:"vendor-neutral",children:"Vendor-neutral — works with any backend"}),e.jsx("p",{children:"These features make no assumptions about your server, database, ORM, or deploy target. Bring whatever you already run:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Transports"})," — four adapters ship today: SSE (receive-only HTTP), Centrifugo (WebSocket, presence + gap replay), Pusher/Soketi (managed or self-hosted, presence), and PartyKit (edge / Durable Objects, presence), plus a small"," ",e.jsx("code",{children:"RealtimeTransport"})," interface for custom transports validated by ",e.jsx("code",{children:"@realtimejs/adapter-conformance"}),". Swap one import; your collections and hooks don’t change. See the"," ",e.jsx("a",{href:"#/docs/transports",children:"per-provider capability matrix"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Live collections"})," —"," ",e.jsx("code",{children:"realtimeCollectionOptions"})," backed by any transport."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Pub/sub channels"})," — raw publish/subscribe, append-only live channels, ephemeral channels with TTL."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Presence and typing indicators"})," — online user lists, cursors, typing state. Presence needs server-held membership state, so it requires a presence-capable transport (Centrifugo, Pusher/Soketi, PartyKit, or a custom WebSocket); the receive-only SSE transport reports ",e.jsx("code",{children:"presence: false"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Field-level CRDTs"})," — LWW registers, PN-counters, and OR-sets. Merging happens on the client; your server just stores and relays."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"AI / stream channels"})," — reduce-based streaming state from ordered event streams."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Offline queue"}),","," ",e.jsx("strong",{children:"multi-tab coordination"})," (SharedWorker → BroadcastChannel → direct), and ",e.jsx("strong",{children:"devtools"}),"."]})]}),e.jsx("h3",{id:"reactive-queries-requirement",children:"Reactive server queries — one built-in engine today"}),e.jsxs("p",{children:["Auto-invalidating reactive queries (",e.jsx("code",{children:"createReactiveQueries"})," ","— the layer behind ",e.jsx("code",{children:"realtime.query()"}),"/",e.jsx("code",{children:"realtime.mutation()"})," that derives channels and invalidates affected queries automatically) currently ships"," ",e.jsx("strong",{children:"one engine adapter"}),":"," ",e.jsx("code",{children:"@realtimejs/reactive-drizzle"})," (Drizzle ORM + Postgres)."]}),e.jsxs("p",{children:["The reactive layer is ",e.jsx("strong",{children:"pluggable"})," via the"," ",e.jsx("code",{children:"ReactiveQueryEngine"})," interface exported from core, so other ORMs and dialects can be supported by implementing that interface. Today, Drizzle/Postgres is the only built-in. If you use a different stack, the vendor-neutral primitives above (live collections, pub/sub, explicit channels) still work everywhere — you just wire invalidation yourself instead of getting it automatically."]}),e.jsx("h3",{id:"known-limitations",children:"Known limitations (stated honestly)"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"JOINs only track the primary table."})," Automatic multi-table reactivity covers separate ",e.jsx("code",{children:"select().from()"})," ","reads. A SQL ",e.jsx("code",{children:"JOIN"})," only captures the primary table — changes to joined tables won’t auto-invalidate. Use the explicit channel/predicate escape hatch for queries that join."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Distinct queries that derive the same channel can collide."})," ","Two different reactive queries that happen to derive the same channel key may interfere — a query sharing a channel key with another can miss updates. This is a known limitation tracked for a future fix; give colliding queries distinct args/channels for now."]})]}),e.jsx("h2",{id:"progressive",children:"Progressive adoption"}),e.jsxs("p",{children:["Features are additive. Start with a plain ",e.jsx("code",{children:"queryFn"}),", add a"," ",e.jsx("code",{children:"channel"})," for live updates, add ",e.jsx("code",{children:"fields"})," for conflict resolution. Each step is one config key. Stop at any point."]}),e.jsx(u,{code:`// Step 1: just a query
realtimeCollectionOptions({
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (t) => t.id,
})

// Step 2: add a channel — it's live
realtimeCollectionOptions({
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (t) => t.id,
  client: realtimeClient,
  channel: ['todos', { projectId }],
})

// Step 3: add CRDTs — concurrent edits merge
realtimeCollectionOptions({
  // ...everything above
  fields: { title: 'lww', votes: 'pn-counter', tags: 'or-set' },
})`}),e.jsx("h2",{id:"transport",children:"Transport-agnostic"}),e.jsx("p",{children:"Application code doesn’t reference the transport. Swap SSE for Centrifugo (or a custom WebSocket) by changing one import."}),e.jsx(u,{code:`// SSE — zero infra, works behind corporate proxies
transport: sseTransport({ url: '/api/realtime' })

// Centrifugo — WebSocket, multi-node clustering, gap recovery
transport: centrifugoTransport({ url: 'wss://rt.example.com/connection/websocket' })`}),e.jsx("h2",{id:"get-started",children:"Get started"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/getting-started",children:"Getting Started"})," — five minute setup"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/tutorial",children:"Tutorial"})," — build a task board end-to-end"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/choosing-a-pattern",children:"Choosing a Pattern"})," — which hooks to use"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/transports",children:"Transports"})," — the per-provider capability matrix and the serverless-vs-fan-out architecture"]}),e.jsxs("li",{children:[e.jsx("a",{href:"#/docs/examples",children:"Examples"})," — runnable apps: collaborative todos (CRDTs), chat (channels), and AI streaming"]})]})]})}function Jj(){const[c,h]=G.useState(window.location.hash||"#/");return G.useEffect(()=>{const p=()=>{h(window.location.hash||"#/"),window.scrollTo(0,0)};return window.addEventListener("hashchange",p),()=>window.removeEventListener("hashchange",p)},[]),c}const $j={"#/docs/getting-started":ap,"#/docs/collections":cj,"#/docs/server-functions":Rj,"#/docs/reactive-queries":Yj,"#/docs/crdts":xj,"#/docs/presence":gj,"#/docs/channels":bj,"#/docs/streaming":Sj,"#/docs/transports":Tj,"#/docs/resilience":wj,"#/docs/hooks":kj,"#/docs/error-reference":Cj,"#/docs/rich-text-crdts":Ej,"#/docs/authentication":Aj,"#/docs/scaling":Nj,"#/docs/centrifugo":Oj,"#/docs/ephemeral":Mj,"#/docs/tick":qj,"#/docs/read-receipts":Pj,"#/docs/server-hooks":Lj,"#/docs/api-reference":Bj,"#/docs/wire-protocol":Hj,"#/docs/testing":Qj,"#/docs/choosing-a-pattern":Fj,"#/docs/tutorial":Zj,"#/docs/why":Xj,"#/docs/solid-primitives":Gj,"#/docs/vue-composables":Vj,"#/docs/devtools":Kj,"#/docs/examples":Wj},Ka=[{hash:"#/docs/why",label:"Why realtime.js"},{hash:"#/docs/getting-started",label:"Getting Started"},{hash:"#/docs/tutorial",label:"Tutorial: Task Board"},{hash:"#/docs/collections",label:"Collections"},{hash:"#/docs/choosing-a-pattern",label:"Choosing a Pattern"},{hash:"#/docs/server-functions",label:"TanStack Start + Drizzle"},{hash:"#/docs/reactive-queries",label:"Reactive Queries"},{hash:"#/docs/authentication",label:"Authentication"},{hash:"#/docs/rich-text-crdts",label:"Rich Text (Y.js)"},{hash:"#/docs/centrifugo",label:"Centrifugo Guide"},{hash:"#/docs/read-receipts",label:"Read Receipts"},{hash:"#/docs/testing",label:"Testing"},{hash:"#/docs/crdts",label:"CRDTs"},{hash:"#/docs/presence",label:"Presence"},{hash:"#/docs/channels",label:"Channels & Pub/Sub"},{hash:"#/docs/streaming",label:"Streaming"},{hash:"#/docs/ephemeral",label:"Ephemeral Channels"},{hash:"#/docs/tick",label:"Tick-Based Sync"},{hash:"#/docs/transports",label:"Transports"},{hash:"#/docs/resilience",label:"Resilience"},{hash:"#/docs/scaling",label:"Scaling to Production"},{hash:"#/docs/server-hooks",label:"Server Hooks"},{hash:"#/docs/hooks",label:"React Hooks"},{hash:"#/docs/solid-primitives",label:"Solid Primitives"},{hash:"#/docs/vue-composables",label:"Vue Composables"},{hash:"#/docs/devtools",label:"DevTools"},{hash:"#/docs/examples",label:"Examples"},{hash:"#/docs/api-reference",label:"API Reference"},{hash:"#/docs/error-reference",label:"Error Reference"},{hash:"#/docs/wire-protocol",label:"Wire Protocol"}];function eg({hash:c}){const h=Ka.findIndex(v=>v.hash===c);if(h===-1)return null;const p=h>0?Ka[h-1]:null,d=h<Ka.length-1?Ka[h+1]:null;return e.jsxs("nav",{className:"prev-next-nav",children:[p?e.jsxs("a",{href:p.hash,className:"prev-next-link prev-link",children:["← ",p.label]}):e.jsx("span",{}),d?e.jsxs("a",{href:d.hash,className:"prev-next-link next-link",children:[d.label," →"]}):e.jsx("span",{})]})}function tg(){return e.jsx("div",{className:"disclaimer-bar",children:e.jsxs("span",{children:[e.jsx("strong",{children:"Experimental · pre-1.0"})," — the API still moves and it has not been hardened in production. Independent and vendor-neutral; not affiliated with or endorsed by TanStack."," ",e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime",target:"_blank",rel:"noopener",children:"View on GitHub"})]})})}function ng({hash:c,onSearchOpen:h}){const p=!c.startsWith("#/docs");return e.jsx("nav",{className:"nav",children:e.jsxs("div",{className:"nav-inner",children:[e.jsxs("a",{href:"#/",className:"nav-logo",children:[e.jsx("span",{className:"logo-tan",children:"realtime"}),e.jsx("span",{className:"logo-realtime",children:".js"})]}),e.jsxs("div",{className:"nav-links",children:[p?e.jsxs(e.Fragment,{children:[e.jsx("a",{href:"#features",children:"Features"}),e.jsx("a",{href:"#quickstart",children:"Quick Start"}),e.jsx("a",{href:"#when-to-use",children:"When to use"})]}):e.jsxs("button",{className:"search-trigger",onClick:h,children:["Search ",e.jsx("kbd",{children:"Ctrl+K"})]}),e.jsx("a",{href:"#/docs/getting-started",className:p?"":"nav-active",children:"Docs"}),e.jsx("a",{href:"https://github.com/mikn/tanstack-realtime",className:"nav-github",target:"_blank",rel:"noopener",children:"GitHub"})]})]})})}function sg(){const c=Jj(),h=c.startsWith("#/docs"),p=$j[c],[d,v]=G.useState(!1),I=G.useCallback(()=>v(!0),[]),y=G.useCallback(()=>v(!1),[]);return G.useEffect(()=>{const S=g=>{(g.metaKey||g.ctrlKey)&&g.key==="k"&&(g.preventDefault(),v(f=>!f))};return window.addEventListener("keydown",S),()=>window.removeEventListener("keydown",S)},[]),e.jsxs(e.Fragment,{children:[e.jsx(tg,{}),e.jsx(ng,{hash:c,onSearchOpen:I}),e.jsx(Ff,{open:d,onClose:y}),h?e.jsxs("div",{className:"docs-layout",children:[e.jsx(Hf,{currentHash:c}),e.jsxs("main",{className:"docs-content",children:[p?e.jsx(p,{}):e.jsx(ap,{}),e.jsx(eg,{hash:c})]})]}):e.jsx(lj,{})]})}Pf.createRoot(document.getElementById("root")).render(e.jsx(G.StrictMode,{children:e.jsx(sg,{})}));
