/*
  toko.js
  -------
  Halaman /toko/: daftar toko/lapak, diurutkan dari yang paling dekat dengan
  nomor meja pembeli. Bergantung pada nomor meja dari parameter URL
  (?table=N) atau localStorage kalau pembeli sedang tidak bawa parameter itu
  (misalnya balik lewat tab "Beranda").
*/

const CATS = [
  { id:'makanan', label:'Makanan', icon:'utensils' },
  { id:'minuman', label:'Minuman', icon:'cup-soda' },
  { id:'snack', label:'Snack', icon:'cookie' },
  { id:'lainnya', label:'Lainnya', icon:'sparkles' },
];
function catMeta(id){ return CATS.find(c => c.id === id) || {label:'Lainnya', icon:'utensils'}; }

let TABLE, storesCache = [], storeCat = '', _activeCartRef = null;

async function init(){
  TABLE = ctxParam('table', 'lapak_table', true);
  if(!TABLE){ goTo('/'); return; }

  const app = document.getElementById('app');
  const activeCart = findActiveCart();
  _activeCartRef = activeCart;
  app.innerHTML = `
  <div class="topbar"><button class="backbtn" onclick="goTo('/')">${ic('arrow-left',18)}</button><div style="flex:1;"><h2>Pilih Lapak</h2><div class="sub">${ic('map-pin',12)} Meja ${TABLE}</div></div>
    ${activeCart ? `<button class="topbar-cart-btn" onclick="goToActiveCart()">${ic('shopping-cart',22)}<span class="cart-badge">${activeCart.qty}</span></button>` : ''}
  </div>
  <div class="content">
    <div class="search-box">${ic('search',16)}<input id="storeSearch" placeholder="Cari makanan atau lapak..." oninput="filterStores()"></div>
    <div class="chip-row" id="storeChips"></div>
    <div class="section-title">Lapak di sekitar kamu</div>
    <div id="storeList"><div class="empty">Memuat toko…</div></div>
  </div>${bottomNav('home')}`;
  document.getElementById('storeChips').innerHTML =
    `<div class="chip active" onclick="pickStoreCat(this,'')">Semua</div>` +
    CATS.map(c => `<div class="chip" onclick="pickStoreCat(this,'${c.id}')">${ic(c.icon,14)} ${c.label}</div>`).join('');
  mountIcons();

  const keys = await sList('store:', true);
  const stores = (await Promise.all(keys.map(k => sGet(k, true)))).filter(Boolean);
  const totalTables = await getTotalTables();
  storesCache = stores.map(s => ({...s, _dist: circularDist(TABLE, s.nearTable, totalTables)}));
  storesCache.sort((a,b) => a._dist - b._dist);
  drawStoreList(storesCache);
}

function goToActiveCart(){
  if(!_activeCartRef) return;
  const match = storesCache.find(s => s.id === _activeCartRef.storeId);
  goTo('/keranjang/', {storeId: _activeCartRef.storeId, storeName: match ? match.name : '', table: TABLE});
}

function pickStoreCat(el, cat){
  document.querySelectorAll('#storeChips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  storeCat = cat;
  filterStores();
}
function filterStores(){
  const q = (document.getElementById('storeSearch').value || '').toLowerCase();
  let list = storesCache;
  if(storeCat) list = list.filter(s => (s.category||'') === storeCat);
  if(q) list = list.filter(s => (s.name||'').toLowerCase().includes(q) || (s.desc||'').toLowerCase().includes(q));
  drawStoreList(list);
}
function drawStoreList(stores){
  const el = document.getElementById('storeList');
  if(stores.length === 0){
    el.innerHTML = `<div class="empty">${ic('store',30)}<br>Belum ada toko yang cocok.<br>Ajak pedagang di sekitarmu untuk daftar lewat web penjual.</div>`;
    mountIcons();
    return;
  }
  el.innerHTML = stores.map((s,i) => {
    const isNearest = i === 0 && s._dist !== Infinity;
    let distLabel;
    if(s._dist === Infinity) distLabel = 'Lokasi toko belum ditandai';
    else if(s._dist === 0) distLabel = 'Tepat di sekitar mejamu';
    else distLabel = '≈ ' + s._dist + ' meja dari kamu';
    const thumb = s.photoURL ? `background-image:url('${s.photoURL}')` : '';
    const status = storeStatusLabel(s);
    const fav = isFavStore(s.id);
    return `
    <div class="store-card" style="position:relative;" onclick="goTo('/menu/',{storeId:'${s.id}',storeName:'${jsAttr(s.name)}',table:'${TABLE}'})">
      <div class="store-thumb" style="${thumb}">
        ${s.photoURL ? '' : ic(catMeta(s.category).icon, 24)}
      </div>
      <div class="store-info">
        <div class="row" style="align-items:flex-start;">
          <h3>${escapeHtml(s.name)} ${premiumBadge(s)}</h3>
          ${isNearest ? '<span class="badge badge-diproses">Terdekat</span>' : ''}
        </div>
        <div style="margin:2px 0 4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          ${ratingBadge(s)}
          <span class="hours-badge ${status.open ? 'is-open' : 'is-closed'}">${ic(status.open ? 'check-circle-2':'x-circle', 11)} ${status.text}</span>
        </div>
        <p class="muted" style="margin:0 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.desc || 'Belum ada deskripsi')}</p>
        <p class="faint" style="display:flex;align-items:center;gap:4px;">${ic('map-pin',11)} ${distLabel}</p>
      </div>
      <button class="fav-btn ${fav?'active':''}" style="position:absolute;top:10px;right:10px;" onclick="event.stopPropagation(); toggleFavStoreUI(this,'${s.id}')">${ic('heart',15)}</button>
    </div>`;
  }).join('');
  mountIcons();
}

function toggleFavStoreUI(btn, storeId){
  const active = toggleFavStore(storeId);
  btn.classList.toggle('active', active);
}

init();
