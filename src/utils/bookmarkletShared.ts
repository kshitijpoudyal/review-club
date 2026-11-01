/** Collapse whitespace for bookmarklet `javascript:` URLs. */
export function minifyBookmarklet(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Shared bookmarklet tail: validate, copy JSON to clipboard, redirect to PWA.
 * `__APP_ORIGIN__` is replaced when building retailer bookmarklets.
 */
export const BOOKMARKLET_HANDOFF_RUNTIME = `
function __rtShowToast(msg,color){
  var bn=document.createElement('div');
  bn.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:'+(color||'#022448')+';color:#fff;padding:12px 20px;border-radius:12px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;z-index:9999999;box-shadow:0 8px 24px rgba(0,0,0,0.3);max-width:90vw;text-align:center;line-height:1.4;';
  bn.textContent=msg;
  document.body.appendChild(bn);
  setTimeout(function(){if(bn.parentNode)bn.parentNode.removeChild(bn);},4500);
}
function __rtCopyJson(j){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    return navigator.clipboard.writeText(j);
  }
  return Promise.resolve();
}
function __rtB64url(str){
  return btoa(unescape(encodeURIComponent(str))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
}
function __rtRedirect(url){
  try{
    /* No 'noopener' feature: with it, window.open always returns null, which
       made the popup-blocked fallback also navigate this tab. Sever the
       opener manually instead. */
    var tab=window.open(url,'_blank');
    if(tab){try{tab.opener=null;}catch(e){}}
    else{window.location.href=url;}
  }catch(e){
    window.location.href=url;
  }
}
function __rtHandoff(p,accent){
  if(!p.orderNumber&&!p.productName&&!p.orderDate){
    __rtShowToast('Could not find order data on this page','#ba1a1a');
    return;
  }
  var j=JSON.stringify(p);
  __rtCopyJson(j);
  var origin='__APP_ORIGIN__';
  if(!origin){
    __rtShowToast('JSON copied. App URL not configured.','#ba1a1a');
    return;
  }
  var url=origin.replace(/\\/$/,'')+'/products#import='+__rtB64url(j);
  if(url.length>7500){
    __rtShowToast('JSON copied. Order too large for auto-import — paste in app.','#ba1a1a');
    return;
  }
  __rtRedirect(url);
}
`;

export function buildBookmarkletHref(extractorBody: string, appOrigin: string): string {
  const runtime = BOOKMARKLET_HANDOFF_RUNTIME.replace(/__APP_ORIGIN__/g, appOrigin.replace(/'/g, "\\'"));
  const code = minifyBookmarklet(`(function(){${extractorBody}${runtime}})();`);
  return `javascript:${code}`;
}
