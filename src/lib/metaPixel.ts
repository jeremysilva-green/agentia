// Meta Pixel configuration shared by the server (layout, proxy) and the client
// (route watcher). Plain module — no imports — so next.config.ts can use it too.

export const META_PIXEL_ID = "1159351416547695";

// Only the real site reports to Meta — localhost and preview deployments
// would otherwise pollute the pixel's data with test traffic.
export const META_PIXEL_HOST = "agentia.com.py";

// Routes where Meta must receive nothing at all: account access, signed-in
// panels, and pages addressed by a private code (agreements, short links).
// Matched by path segment: "/s" covers "/s" and "/s/abc" but not "/sa".
export const META_BLOCKED_PREFIXES = [
  "/ingresar",
  "/registro",
  "/restablecer-contrasena",
  "/auth",
  "/panel",
  "/panel-afiliado",
  "/acuerdo",
  "/imprimir-acuerdo",
  "/s",
  "/c",
  "/sa",
  "/api",
] as const;

export function isMetaBlockedPath(pathname: string): boolean {
  return META_BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// Set by proxy.ts so the root layout (which never sees the URL) can decide on
// the server whether the pixel may load at all.
export const PATHNAME_HEADER = "x-pathname";

// Short-lived cookie the sign-up actions set so the first public page the new
// account lands on can fire CompleteRegistration (sign-up itself happens on a
// blocked route, where the pixel is not loaded).
export const SIGNUP_COOKIE = "mt_signup";

// Everything the pixel sends to Meta passes through this filter first. The
// pixel has no setting for any of it, so it wraps the transports it uses
// (image pixel, sendBeacon, fetch, XHR) right before a request leaves:
//  - Nothing is sent while window.__mtBlocked is set (the visitor is on, or is
//    clicking into, a blocked route), and nothing whose page URL (dl) is a
//    blocked route. This drops events instead of using Meta's consent switch:
//    the pixel *queues* events while consent is revoked and sends them later.
//  - Query strings and fragments can carry search terms, codes and tokens, so
//    in every URL found inside any parameter or body — the page URL (dl), the
//    referrer (rl), the automatic click events' link destinations — only
//    utm_* and fbclid survive, and a URL pointing at a blocked route is cut
//    down to the bare site origin.
const META_URL_FILTER = `
var BLOCKED=${JSON.stringify(META_BLOCKED_PREFIXES)};
var KEEP=/^(utm_[a-z0-9_]+|fbclid)$/i;
function blockedPath(p){return BLOCKED.some(function(x){return p===x||p.indexOf(x+'/')===0})}
function clean(u){try{var x=new URL(u);if(blockedPath(x.pathname))return x.origin+'/';var k=[];x.searchParams.forEach(function(v,n){if(KEEP.test(n))k.push([n,v])});x.search='';k.forEach(function(p){x.searchParams.append(p[0],p[1])});x.hash='';return x.toString()}catch(e){return u.split('#')[0].split('?')[0]}}
function scrub(v){return typeof v==='string'?v.replace(/https?:\\/\\/[^\\s"'<>\\\\]+/g,clean):v}
function isFb(u){try{return /(^|\\.)facebook\\.(com|net)$/.test(new URL(u,location.href).hostname)}catch(e){return false}}
function pageIsBlocked(dl){try{return !!dl&&blockedPath(new URL(dl,location.href).pathname)}catch(e){return false}}
function scrubQuery(q){var o=new URLSearchParams();new URLSearchParams(q).forEach(function(v,n){o.append(n,scrub(v))});return o.toString()}
function prepUrl(u){
if(typeof u!=='string'||!isFb(u))return u;
if(window.__mtBlocked)return null;
var x=new URL(u,location.href);
if(pageIsBlocked(x.searchParams.get('dl')))return null;
if(x.search)x.search='?'+scrubQuery(x.search.slice(1));
return x.toString()}
function prepBody(b){
if(window.__mtBlocked)return null;
if(typeof b==='string'){
if(/^\\s*[{[]/.test(b))return scrub(b);
if(pageIsBlocked(new URLSearchParams(b).get('dl')))return null;
return scrubQuery(b)}
if(typeof URLSearchParams!=='undefined'&&b instanceof URLSearchParams){
if(pageIsBlocked(b.get('dl')))return null;
return new URLSearchParams(scrubQuery(b.toString()))}
if(typeof FormData!=='undefined'&&b instanceof FormData){
if(pageIsBlocked(b.get('dl')))return null;
var f=new FormData();b.forEach(function(v,n){f.append(n,typeof v==='string'?scrub(v):v)});return f}
return b}
var d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
if(d&&d.set)Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){var r=prepUrl(v);if(r!==null)d.set.call(this,r)}});
var sa=Element.prototype.setAttribute;
Element.prototype.setAttribute=function(n,v){if(this instanceof HTMLImageElement&&String(n).toLowerCase()==='src'){v=prepUrl(v);if(v===null)return}return sa.call(this,n,v)};
if(navigator.sendBeacon){var sb=navigator.sendBeacon;navigator.sendBeacon=function(u,b){if(!isFb(u))return sb.apply(navigator,arguments);var pu=prepUrl(u),pb=pu===null?null:prepBody(b);return pu===null||pb===null?true:sb.call(navigator,pu,pb)}}
var ft=window.fetch;
if(ft)window.fetch=function(i,o){if(typeof i==='string'&&isFb(i)){var pu=prepUrl(i),pb=pu===null?null:(o&&o.body?prepBody(o.body):undefined);if(pu===null||pb===null)return Promise.resolve(new Response(null,{status:204}));i=pu;if(pb!==undefined)o=Object.assign({},o,{body:pb})}return ft.call(this,i,o)};
var xo=XMLHttpRequest.prototype.open,xs=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open=function(m,u){var fb=typeof u==='string'&&isFb(u),pu=fb?prepUrl(u):u;this.__mtFb=fb;this.__mtDrop=fb&&pu===null;arguments[1]=pu===null?u:pu;return xo.apply(this,arguments)};
XMLHttpRequest.prototype.send=function(b){if(this.__mtFb){if(this.__mtDrop)return;var pb=prepBody(b);if(pb===null)return;b=pb}return xs.call(this,b)};
`;

// Official Meta base code, wrapped so it can run only once however it gets
// started (server-rendered <Script> or the client watcher), preceded by the
// filter above, with Meta's own history tracking turned off (the watcher
// fires PageView itself, and only for public routes) and repeated PageViews
// allowed (otherwise Meta ignores every PageView after the first one).
export const META_PIXEL_SNIPPET = `(function(){if(window.__mtPixel)return;window.__mtPixel=1;
${META_URL_FILTER}
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq.disablePushState=true;
fbq.allowDuplicatePageViews=true;
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');})();`;
