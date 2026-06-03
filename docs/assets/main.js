const PAGE_DATA = window.JECA_DATA || {};
const PRODUCTS = PAGE_DATA.products || [];
const CONCOURS = PAGE_DATA.concours || [];
const REWORK = PAGE_DATA.rework || [];
const COORDS = PAGE_DATA.coords || {};
const MAP_SOURCE = PAGE_DATA.mapSource || {};
const CATEGORIES = ["배전기자재","케이블","계측/진단","안전공구","시공공법","EMS/DER","수배전반","배전DX"];
const FAVORITE_KEY = "jeca-2026-favorites-pages";
const state = { query:"", category:"전체", view:"all", favoriteOnly:false, favorites:new Set(JSON.parse(localStorage.getItem(FAVORITE_KEY)||"[]")) };
const $ = (selector) => document.querySelector(selector);

function list(value){ return Array.isArray(value) ? value : (value ? [value] : []); }
function html(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function textHtml(value){ return html(value).replace(/\r?\n/g,"<br>"); }
function url(value){ const text=String(value||"").trim(); return /^https?:\/\//i.test(text) ? text : ""; }
function normalize(value){ return String(value||"").toLowerCase().replace(/[\s()[\]{}"'`·・･.,/\\_-]/g,""); }
function isProvisional(product){ return String(product.reliability_note||"").includes("자동 보강"); }
function activeProducts(){ return PRODUCTS.filter((product)=>!isProvisional(product)); }
function boothHall(booth){ const prefix=String(booth||"").split("-")[0]; return prefix ? `Hall ${prefix}` : "Hall ?"; }
function saveFavorites(){ localStorage.setItem(FAVORITE_KEY, JSON.stringify([...state.favorites])); }
function onlineResourceTitle(pair,fallback){ return Array.isArray(pair) && pair[0] ? pair[0] : fallback; }
function onlineResourceUrl(pair){ return Array.isArray(pair) ? url(pair[1]) : ""; }
function onlineOverlayRecord(raw){ return Array.isArray(raw) ? { u:raw[0], p:raw[1], v:raw[2] } : raw; }
function expandTinyOverlay(overlay){
  if (!overlay || !overlay.r) return overlay;
  const base = "https://www.jecafair.jp/online2026/";
  const dates = Array.isArray(overlay.d) ? overlay.d : [""];
  const tinyUrls = {};
  String(overlay.r).split("|").filter(Boolean).forEach((record)=>{
    const first = record.indexOf(",");
    const second = record.indexOf(",", first + 1);
    if (first < 1 || second < 0) return;
    const booth = record.slice(0, first);
    const date = dates[Number(record.slice(first + 1, second))] || "";
    const slug = record.slice(second + 1);
    tinyUrls[booth] = `${base}${date}${slug}`;
  });
  return { u:tinyUrls, p:String(overlay.p||"").split(",").filter(Boolean), v:String(overlay.v||"").split(",").filter(Boolean) };
}
function applyOnlineOverlay(overlay){
  overlay = expandTinyOverlay(overlay);
  const tinyUrls = overlay && overlay.u ? overlay.u : null;
  const pdfBooths = new Set(overlay && Array.isArray(overlay.p) ? overlay.p : []);
  const videoBooths = new Set(overlay && Array.isArray(overlay.v) ? overlay.v : []);
  const booths = overlay && (overlay.booths || overlay.b) ? (overlay.booths || overlay.b) : {};
  PRODUCTS.forEach((product)=>{
    const booth = String(product.booth||"").trim();
    const onlineBooth = String(product.online_booth||"").trim();
    const compactUrl = tinyUrls && (tinyUrls[booth] || tinyUrls[onlineBooth]);
    const online = compactUrl ? { u:compactUrl } : onlineOverlayRecord(booths[booth] || booths[onlineBooth]);
    if (!online) return;
    product.online_page_url = product.online_page_url || online.u || "";
    product.online_booth = product.online_booth || product.booth || "";
    if (!list(product.online_images).length && url(online.i)) product.online_images = [{ title:"온라인전시장 대표 이미지", url:online.i }];
    if (!list(product.online_pdfs).length && onlineResourceUrl(online.p)) product.online_pdfs = [{ title:onlineResourceTitle(online.p,"온라인전시장 PDF"), url:onlineResourceUrl(online.p) }];
    if (!list(product.online_videos).length && onlineResourceUrl(online.v)) product.online_videos = [{ title:onlineResourceTitle(online.v,"온라인전시장 영상"), url:onlineResourceUrl(online.v) }];
    if (!list(product.online_pdfs).length && product.online_page_url && (pdfBooths.has(booth) || pdfBooths.has(onlineBooth))) product.online_pdfs = [{ title:"온라인전시장 PDF/자료", url:product.online_page_url }];
    if (!list(product.online_videos).length && product.online_page_url && (videoBooths.has(booth) || videoBooths.has(onlineBooth))) product.online_videos = [{ title:"온라인전시장 영상 목록", url:product.online_page_url }];
    product.online_resource_counts = online.c || product.online_resource_counts || [];
  });
}
async function loadOnlineOverlay(){
  try {
    const packed = await fetch("./data/online2026_overlay.txt", { cache:"no-store" });
    if (packed.ok) {
      const text = (await packed.text()).trim();
      if (text.startsWith("{")) {
        applyOnlineOverlay(JSON.parse(text));
        return;
      }
      if (typeof DecompressionStream !== "undefined") {
        const binary = Uint8Array.from(atob(text), (char)=>char.charCodeAt(0));
        const stream = new Blob([binary]).stream().pipeThrough(new DecompressionStream("gzip"));
        applyOnlineOverlay(JSON.parse(await new Response(stream).text()));
        return;
      }
      return;
    }
    const response = await fetch("./data/online2026_overlay.json", { cache:"no-store" });
    if (response.ok) applyOnlineOverlay(await response.json());
  } catch (error) {
    console.warn("online2026 overlay unavailable", error);
  }
}
function assetTitle(item,fallback){ return String(item && item.title ? item.title : fallback); }
function assetUrl(item){ return url(item && item.url ? item.url : item); }
function firstAssetUrl(items){ return list(items).map(assetUrl).find(Boolean) || ""; }
function resourceItems(items,fallback){
  return list(items).map((item,index)=>({ title:assetTitle(item,`${fallback} ${index+1}`), href:assetUrl(item) })).filter((item)=>item.href);
}
function searchText(product){
  const onlineTexts=[...resourceItems(product.online_pdfs,"PDF"),...resourceItems(product.online_images,"이미지"),...resourceItems(product.online_videos,"영상")].map((item)=>item.title);
  return [product.company_name,product.product_name_ko,product.product_name_ja,product.booth,product.online_booth,...list(product.category),...list(product.keywords),product.product_detail,product.online_description,product.kepco_distribution_applicability,...onlineTexts].join(" ").toLowerCase();
}
function productConcours(product){
  if (list(product.source_urls).some((item)=>String(item).includes("concours.php"))) return true;
  const company=normalize(product.company_name), name=normalize(product.product_name_ja);
  return CONCOURS.some((item)=>{
    const sameBooth=item.booth && product.booth && String(item.booth)===String(product.booth);
    const itemCompany=normalize(item.company_name), itemName=normalize(item.product_ja);
    return sameBooth && ((itemCompany && company && (itemCompany.includes(company)||company.includes(itemCompany))) || (itemName && name && (itemName.includes(name)||name.includes(itemName))));
  });
}
function filteredProducts(){
  const query=state.query.trim().toLowerCase();
  return activeProducts().filter((product)=>{
    const queryHit=!query || searchText(product).includes(query);
    const categoryHit=state.category==="전체" || list(product.category).includes(state.category);
    const favoriteHit=!state.favoriteOnly || state.favorites.has(product.id);
    const concoursHit=state.view!=="concours" || productConcours(product);
    return queryHit && categoryHit && favoriteHit && concoursHit;
  });
}
function resetLimit(){}
function updateButtons(){
  $("#allCards").setAttribute("aria-pressed", String(state.view==="all"));
  $("#concoursOnly").setAttribute("aria-pressed", String(state.view==="concours"));
  $("#favoriteOnly").setAttribute("aria-pressed", String(state.favoriteOnly));
  $("#reworkOnly").setAttribute("aria-pressed", String(state.view==="rework"));
  $("#cardsArea").hidden = state.view==="rework";
  $("#concoursSection").hidden = state.view==="rework";
  $("#reworkSection").hidden = state.view!=="rework";
}
function renderFilters(){
  const available=new Set(activeProducts().flatMap((product)=>list(product.category)));
  const filters=["전체",...CATEGORIES.filter((item)=>available.has(item))];
  $("#categoryFilters").innerHTML=filters.map((item)=>`<button class="filter-btn${state.category===item?" is-active":""}" type="button" data-category="${html(item)}">${html(item)}</button>`).join("");
}
function imgHtml(product){
  const image=url(product.image_url);
  const page=url(product.product_page_url) || url(product.image_or_pdf_url);
  const fallback=`<div class="image-fallback">이미지 외부 로딩 차단${page ? ` / <a href="${html(page)}" target="_blank" rel="noopener">원문 열기</a>` : ""}</div>`;
  if (!image) return `<div class="card-media">${fallback}</div>`;
  return `<div class="card-media has-image">${fallback}<img src="${html(image)}" alt="${html(product.product_name_ko)} 제품 이미지" loading="lazy" decoding="async" onerror="this.hidden=true;this.closest('.card-media').classList.add('is-error')"></div>`;
}
function linkHtml(href,label,primary){
  const safe=url(href);
  return safe ? `<a class="card-link${primary?" primary":""}" href="${html(safe)}" target="_blank" rel="noopener">${label}</a>` : "";
}
function resourceListHtml(items,fallback){
  return resourceItems(items,fallback).map((item)=>`<li><a href="${html(item.href)}" target="_blank" rel="noopener">${html(item.title)}</a></li>`).join("");
}
function cardHtml(product){
  const favorite=state.favorites.has(product.id);
  const cats=list(product.category).map((item)=>`<span class="badge">${html(item)}</span>`).join("");
  const specs=list(product.confirmed_specs).map((item)=>`<li>${html(item)}</li>`).join("");
  const points=list(product.field_check_points).map((item)=>`<li>${html(item)}</li>`).join("");
  const sources=list(product.source_urls).map((item)=>`<li><a href="${html(item)}" target="_blank" rel="noopener">${html(item)}</a></li>`).join("");
  const onlineBadge=url(product.online_page_url) ? `<span class="badge online">온라인전시장 확인</span>` : "";
  const onlinePdfUrl=firstAssetUrl(product.online_pdfs);
  const onlineImageUrl=firstAssetUrl(product.online_images);
  const onlineVideoUrl=firstAssetUrl(product.online_videos);
  const imageOrPdfUrl=onlinePdfUrl || url(product.image_or_pdf_url) || onlineImageUrl;
  const onlineDescription=String(product.online_description||"").trim();
  const onlineLinks=[resourceListHtml(product.online_pdfs,"PDF"),resourceListHtml(product.online_images,"이미지"),resourceListHtml(product.online_videos,"영상")].filter(Boolean).join("");
  const onlineBlock=(onlineDescription || onlineLinks) ? `<span class="section-label">온라인전시장 자료</span>${onlineDescription ? `<p>${textHtml(onlineDescription)}</p>` : ""}${onlineLinks ? `<ul class="source-list">${onlineLinks}</ul>` : ""}` : "";
  return `<article class="product-card" data-id="${html(product.id)}">
    ${imgHtml(product)}
    <div class="card-body">
      <div class="card-top"><div><h2 class="card-title">${html(product.product_name_ko)}</h2><p class="jp-name">${html(product.product_name_ja)}</p></div><button class="favorite-btn${favorite?" is-on":""}" type="button" data-favorite="${html(product.id)}" aria-label="즐겨찾기" aria-pressed="${favorite}">★</button></div>
      <div class="badges"><span class="badge">${html(product.company_name)}</span><span class="badge">Booth ${html(product.booth)}</span>${cats}${onlineBadge}<span class="badge reliability">신뢰도 ${html(product.reliability)}</span></div>
      <div class="actions">${linkHtml(product.product_page_url,"원문 제품페이지",true)}${linkHtml(product.online_page_url,"온라인전시장 페이지",false)}${linkHtml(imageOrPdfUrl,"제품 이미지/PDF",false)}${linkHtml(onlineVideoUrl,"영상 목록",false)}<button class="booth-btn" type="button" data-map="${html(product.id)}">Booth ${html(product.booth)} 지도</button></div>
      <p class="kepco">${html(product.kepco_distribution_applicability)}</p>
      <p class="summary-text">${html(String(product.product_detail||"").slice(0,180))}${String(product.product_detail||"").length>180 ? "..." : ""}</p>
      <details class="details"><summary>상세 보기</summary><span class="section-label">제품 상세</span><p>${html(product.product_detail)}</p>${onlineBlock}<span class="section-label">확인된 사양/기능</span><ul>${specs}</ul><span class="section-label">현장 확인 포인트</span><ul>${points}</ul><span class="section-label">출처 URL</span><ul class="source-list">${sources}</ul></details>
    </div>
  </article>`;
}
function renderCards(){
  const active=activeProducts();
  const filtered=filteredProducts();
  $("#totalCount").textContent=active.length;
  $("#visibleCount").textContent=filtered.length;
  $("#onlineCount").textContent=active.filter((product)=>url(product.online_page_url)).length;
  $("#favoriteCount").textContent=active.filter((product)=>state.favorites.has(product.id)).length;
  updateButtons();
  $("#cards").innerHTML=filtered.length ? filtered.map(cardHtml).join("") : `<div class="empty">조건에 맞는 제품 카드가 없습니다.</div>`;
}
function renderConcours(){
  $("#concoursCount").textContent=CONCOURS.length;
  $("#concoursList").innerHTML=CONCOURS.map((item)=>`<article class="concours-item"><div><strong>${html(item.product_ja)}</strong><span>${html(item.company_name)} · Booth ${html(item.booth)}</span></div>${url(item.product_url) ? `<a href="${html(item.product_url)}" target="_blank" rel="noopener">원문</a>` : ""}</article>`).join("");
}
function statusLabel(status){ return ({pending:"대기",unresolved:"보류",upgraded:"보강"})[status] || status || "대기"; }
function reworkRows(){
  const query=state.query.trim().toLowerCase();
  return REWORK.filter((item)=>item.status!=="upgraded").filter((item)=>!query || [item.company_id,item.company_name,item.current_product_name,item.reason,item.status].join(" ").toLowerCase().includes(query));
}
function renderRework(){
  const rows=reworkRows();
  $("#reworkCount").textContent=rows.length;
  $("#reworkRows").innerHTML=rows.length ? rows.map((item)=>`<tr><td>${html(item.company_id)}</td><td>${html(item.company_name)}</td><td>${html(item.current_product_name)}</td><td><span class="status-pill status-${html(item.status)}">${html(statusLabel(item.status))}</span></td><td><p>${html(item.reason)}</p>${url(item.original_url) ? `<a href="${html(item.original_url)}" target="_blank" rel="noopener">원문 후보</a>` : ""}</td></tr>`).join("") : `<tr><td colspan="5">현재 재조사 대기 항목이 없습니다.</td></tr>`;
}
function configureMapLink(){
  const href=url(MAP_SOURCE.official_url || COORDS.source_url);
  const header=$("#headerMapLink"), drawer=$("#mapOfficialLink"), disabled=$("#mapOfficialDisabled");
  if (href) {
    header.href=href; header.hidden=false;
    drawer.href=href; drawer.hidden=false;
    disabled.hidden=true;
  } else {
    header.removeAttribute("href"); header.hidden=true;
    drawer.removeAttribute("href"); drawer.hidden=true;
    disabled.hidden=false;
  }
}
function openMap(product){
  const hall=boothHall(product.booth);
  const exact=COORDS.booths && COORDS.booths[product.booth];
  $("#mapTitle").textContent=`${product.company_name} 부스`;
  $("#mapBooth").textContent=`Booth ${product.booth} · ${hall}`;
  $("#mapCompany").textContent=product.company_name || "-";
  $("#mapProduct").textContent=product.product_name_ko || product.product_name_ja || "-";
  $("#mapHall").textContent=hall;
  $("#mapCoordStatus").textContent=exact ? "정확 좌표 확보" : "Hall 단위 표시";
  $("#mapNote").textContent=exact ? "booth_coords.json의 좌표가 확보된 항목입니다." : "정확 좌표가 아직 없어 Hall 단위 표시로 안내합니다.";
  document.querySelectorAll(".mini-hall").forEach((node)=>{
    node.classList.toggle("is-active", node.dataset.hall===hall);
    const pin=node.querySelector(".mini-pin");
    if (pin) pin.remove();
    if (node.dataset.hall===hall) node.insertAdjacentHTML("beforeend", `<span class="mini-pin">${html(product.booth)}</span>`);
  });
  configureMapLink();
  $("#mapDrawer").classList.add("is-open");
  $("#mapDrawer").setAttribute("aria-hidden","false");
}
function closeMap(){ $("#mapDrawer").classList.remove("is-open"); $("#mapDrawer").setAttribute("aria-hidden","true"); }
function setView(view){ state.view = state.view===view && view!=="all" ? "all" : view; resetLimit(); renderCards(); renderRework(); }
async function init(){
  await loadOnlineOverlay();
  renderFilters();
  renderCards();
  renderConcours();
  renderRework();
  configureMapLink();
  $("#searchInput").addEventListener("input",(event)=>{ state.query=event.target.value; resetLimit(); renderCards(); renderRework(); });
  $("#categoryFilters").addEventListener("click",(event)=>{ const button=event.target.closest("[data-category]"); if(!button)return; state.category=button.dataset.category; resetLimit(); renderFilters(); renderCards(); });
  $("#allCards").addEventListener("click",()=>setView("all"));
  $("#concoursOnly").addEventListener("click",()=>setView("concours"));
  $("#reworkOnly").addEventListener("click",()=>setView("rework"));
  $("#favoriteOnly").addEventListener("click",()=>{ state.favoriteOnly=!state.favoriteOnly; resetLimit(); renderCards(); });
  $("#cards").addEventListener("click",(event)=>{
    const fav=event.target.closest("[data-favorite]");
    if (fav) { state.favorites.has(fav.dataset.favorite) ? state.favorites.delete(fav.dataset.favorite) : state.favorites.add(fav.dataset.favorite); saveFavorites(); renderCards(); return; }
    const mapButton=event.target.closest("[data-map]");
    if (mapButton) { const product=PRODUCTS.find((item)=>item.id===mapButton.dataset.map); if(product) openMap(product); }
  });
  document.querySelectorAll("[data-close-map]").forEach((node)=>node.addEventListener("click",closeMap));
  document.addEventListener("keydown",(event)=>{ if(event.key==="Escape") closeMap(); });
}
init();
