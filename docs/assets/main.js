const PAGE_DATA = window.JECA_DATA || {};
const PRODUCTS = PAGE_DATA.products || [];
const CONCOURS = PAGE_DATA.concours || [];
const REWORK = PAGE_DATA.rework || [];
const COORDS = PAGE_DATA.coords || {};
const MAP_SOURCE = PAGE_DATA.mapSource || {};
const CATEGORIES = ["배전기자재","케이블","계측/진단","안전공구","시공공법","EMS/DER","수배전반","배전DX"];
const FAVORITE_KEY = "jeca-2026-favorites-pages";
const PAGE_SIZE = 30;
const state = { query:"", category:"전체", view:"all", favoriteOnly:false, limit:PAGE_SIZE, favorites:new Set(JSON.parse(localStorage.getItem(FAVORITE_KEY)||"[]")), expanded:new Set() };
const $ = (selector) => document.querySelector(selector);

function list(value){ return Array.isArray(value) ? value : (value ? [value] : []); }
function html(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function url(value){ const text=String(value||"").trim(); return /^https?:\/\//i.test(text) ? text : ""; }
function normalize(value){ return String(value||"").toLowerCase().replace(/[\s()[\]{}"'`·・･.,/\\_-]/g,""); }
function isProvisional(product){ return String(product.reliability_note||"").includes("자동 보강"); }
function activeProducts(){ return PRODUCTS.filter((product)=>!isProvisional(product)); }
function boothHall(booth){ const prefix=String(booth||"").split("-")[0]; return prefix ? `Hall ${prefix}` : "Hall ?"; }
function saveFavorites(){ localStorage.setItem(FAVORITE_KEY, JSON.stringify([...state.favorites])); }
function searchText(product){ return [product.company_name,product.product_name_ko,product.product_name_ja,product.booth,...list(product.category),...list(product.keywords),product.product_detail,product.kepco_distribution_applicability].join(" ").toLowerCase(); }
function splitPreview(text,maxLength=180){
  const clean=String(text||"").trim();
  const chars=Array.from(clean);
  if (chars.length<=maxLength) return { previewText:clean, remainingText:"", hasMore:false };
  let cut=maxLength;
  for (let i=maxLength; i>Math.floor(maxLength*0.6); i-=1) {
    if (/[.!?。！？]/.test(chars[i-1])) { cut=i; break; }
  }
  if (cut===maxLength) {
    for (let i=maxLength; i>Math.floor(maxLength*0.75); i-=1) {
      if (/\s/.test(chars[i-1])) { cut=i; break; }
    }
  }
  const previewText=chars.slice(0,cut).join("").trimEnd();
  const remainingText=chars.slice(cut).join("");
  return { previewText, remainingText, hasMore:remainingText.trim().length>0 };
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
function resetLimit(){ state.limit=PAGE_SIZE; }
function updateButtons(){
  $("#allCards").setAttribute("aria-pressed", String(state.view==="all"));
  $("#concoursOnly").setAttribute("aria-pressed", String(state.view==="concours"));
  $("#favoriteOnly").setAttribute("aria-pressed", String(state.favoriteOnly));
  $("#reworkOnly").setAttribute("aria-pressed", String(state.view==="rework"));
  $("#cardsArea").hidden = state.view==="rework";
  $("#moreWrap").hidden = state.view==="rework";
  $("#concoursSection").hidden = state.view==="rework";
  $("#reworkSection").hidden = state.view!=="rework" && state.view!=="all";
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
function cardHtml(product){
  const favorite=state.favorites.has(product.id);
  const expanded=state.expanded.has(product.id);
  const detail=splitPreview(product.product_detail,180);
  const cats=list(product.category).map((item)=>`<span class="badge">${html(item)}</span>`).join("");
  const specs=list(product.confirmed_specs).map((item)=>`<li>${html(item)}</li>`).join("");
  const points=list(product.field_check_points).map((item)=>`<li>${html(item)}</li>`).join("");
  const sources=list(product.source_urls).map((item)=>`<li><a href="${html(item)}" target="_blank" rel="noopener">${html(item)}</a></li>`).join("");
  const detailId=`detail-${html(product.id)}`;
  const detailToggle=detail.hasMore ? `<button class="detail-toggle" type="button" data-detail-toggle="${html(product.id)}" aria-expanded="${expanded}" aria-controls="${detailId}">${expanded ? "접기" : "상세 보기"}</button>` : "";
  const detailPanel=expanded ? `<div class="detail-panel" id="${detailId}"><span class="section-label">확인된 사양/기능</span><ul>${specs}</ul><span class="section-label">현장 확인 포인트</span><ul>${points}</ul><span class="section-label">출처 URL</span><ul class="source-list">${sources}</ul></div>` : "";
  return `<article class="product-card" data-id="${html(product.id)}">
    ${imgHtml(product)}
    <div class="card-body">
      <div class="card-top"><div><h2 class="card-title">${html(product.product_name_ko)}</h2><p class="jp-name">${html(product.product_name_ja)}</p></div><button class="favorite-btn${favorite?" is-on":""}" type="button" data-favorite="${html(product.id)}" aria-label="즐겨찾기" aria-pressed="${favorite}">★</button></div>
      <div class="badges"><span class="badge">${html(product.company_name)}</span><span class="badge">Booth ${html(product.booth)}</span>${cats}<span class="badge reliability">신뢰도 ${html(product.reliability)}</span></div>
      <div class="actions">${linkHtml(product.product_page_url,"원문 제품페이지",true)}${linkHtml(product.image_or_pdf_url,"제품 이미지/PDF",false)}<button class="booth-btn" type="button" data-map="${html(product.id)}">Booth ${html(product.booth)} 지도</button></div>
      <p class="kepco">${html(product.kepco_distribution_applicability)}</p>
      <p class="summary-text">${html(detail.previewText)}${detail.hasMore && !expanded ? "..." : ""}${detail.hasMore && expanded ? `<span class="summary-rest">${html(detail.remainingText)}</span>` : ""}</p>
      ${detailToggle}
      ${detailPanel}
    </div>
  </article>`;
}
function renderCards(){
  const active=activeProducts();
  const filtered=filteredProducts();
  const shown=filtered.slice(0,state.limit);
  $("#totalCount").textContent=active.length;
  $("#visibleCount").textContent=filtered.length;
  $("#favoriteCount").textContent=active.filter((product)=>state.favorites.has(product.id)).length;
  $("#renderedCount").textContent=shown.length;
  updateButtons();
  $("#cards").innerHTML=shown.length ? shown.map(cardHtml).join("") : `<div class="empty">조건에 맞는 제품 카드가 없습니다.</div>`;
  const more=state.limit < filtered.length && state.view!=="rework";
  $("#moreWrap").hidden=!more;
  $("#moreButton").textContent=more ? `더 보기 (${Math.min(PAGE_SIZE, filtered.length-state.limit)}개 추가)` : "더 보기";
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
function init(){
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
  $("#moreButton").addEventListener("click",()=>{ state.limit += PAGE_SIZE; renderCards(); });
  $("#cards").addEventListener("click",(event)=>{
    const fav=event.target.closest("[data-favorite]");
    if (fav) { state.favorites.has(fav.dataset.favorite) ? state.favorites.delete(fav.dataset.favorite) : state.favorites.add(fav.dataset.favorite); saveFavorites(); renderCards(); return; }
    const detailButton=event.target.closest("[data-detail-toggle]");
    if (detailButton) { state.expanded.has(detailButton.dataset.detailToggle) ? state.expanded.delete(detailButton.dataset.detailToggle) : state.expanded.add(detailButton.dataset.detailToggle); renderCards(); return; }
    const mapButton=event.target.closest("[data-map]");
    if (mapButton) { const product=PRODUCTS.find((item)=>item.id===mapButton.dataset.map); if(product) openMap(product); }
  });
  document.querySelectorAll("[data-close-map]").forEach((node)=>node.addEventListener("click",closeMap));
  document.addEventListener("keydown",(event)=>{ if(event.key==="Escape") closeMap(); });
}
init();
