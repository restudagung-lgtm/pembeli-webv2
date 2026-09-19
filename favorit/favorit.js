/*
  favorit.js
  ----------
  Halaman /favorit/: daftar toko & menu favorit (tersimpan lokal di
  perangkat ini, karena situs pembeli tidak punya akun login).
*/

const CATS = [
  { id:'makanan', label:'Makanan', icon:'utensils' },
  { id:'minuman', label:'Minuman', icon:'cup-soda' },
  { id:'snack', label:'Snack', icon:'cookie' },
  { id:'lainnya', label:'Lainnya', icon:'sparkles' },
];
function catMeta(id){ return CATS.find(c => c.id === id) || {label:'Lainnya', icon:'utensils'}; }

async function init(){
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar"><div><h2>Favorit</h2><div class="sub">Tersimpan di perangkat ini</div></div></div>
  <div class="content">
    <div class="section-title">Toko Favorit</div>
    <div id="favStores"><div class="empty">Memuat…</div></div>
    <div class="section-title">Menu Favorit</div>
    <div id="favMenus"><div class="empty">Memuat…</div></div>
  </div>
  ${bottomNav('favorit')}`;
  mountIcons();

  await renderFavStores();
  await renderFavMenus();
}

async function renderFavStores(){
  const el = document.getElementById('favStores');
  const ids = getFavStores();
  if(ids.length === 0){
    el.innerHTML = `<div class="empty">${ic('heart',26)}<br>Belum ada toko favorit. Ketuk ikon hati di daftar toko untuk menyimpannya di sini.</div>`;
    mountIcons();
    return;
  }
  const stores = (await Promise.all(ids.map(id => sGet('store:' + id, true))));
  const rows = [];
  stores.forEach((s, i) => { if(!s) toggleFavStore(ids[i]); else rows.push(s); }); // buang toko yg sudah tidak ada
  const table = ctxParam('table', 'lapak_table', false) || '';
  el.innerHTML = rows.map(s => `
    <div class="store-card" onclick="goTo('/menu/',{storeId:'${s.id}',storeName:'${jsAttr(s.name)}',table:'${table}'})">
      <div class="store-thumb" style="${s.photoURL ? `background-image:url('${s.photoURL}')` : ''}">${s.photoURL ? '' : ic(catMeta(s.category).icon, 24)}</div>
      <div class="store-info">
        <div class="row" style="align-items:flex-start;">
          <h3>${escapeHtml(s.name)} ${premiumBadge(s)}</h3>
        </div>
        <div style="margin:2px 0 4px;">${ratingBadge(s)}</div>
        <p class="muted" style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.desc || 'Belum ada deskripsi')}</p>
      </div>
      <button class="fav-btn active" onclick="event.stopPropagation(); unfavStore('${s.id}')">${ic('heart',16)}</button>
    </div>`).join('') || `<div class="empty">${ic('heart',26)}<br>Belum ada toko favorit.</div>`;
  mountIcons();
}

async function unfavStore(storeId){
  toggleFavStore(storeId);
  renderFavStores();
}

async function renderFavMenus(){
  const el = document.getElementById('favMenus');
  const favs = getFavMenus();
  if(favs.length === 0){
    el.innerHTML = `<div class="empty">${ic('heart',26)}<br>Belum ada menu favorit. Ketuk ikon hati di kartu menu untuk menyimpannya di sini.</div>`;
    mountIcons();
    return;
  }
  const storeCache = {};
  const rows = [];
  for(const f of favs){
    const menu = await sGet('menu:' + f.storeId + ':' + f.menuId, true);
    if(!menu){ toggleFavMenu(f.storeId, f.menuId); continue; }
    if(!storeCache[f.storeId]) storeCache[f.storeId] = await sGet('store:' + f.storeId, true);
    rows.push({ menu, store: storeCache[f.storeId] });
  }
  if(rows.length === 0){
    el.innerHTML = `<div class="empty">${ic('heart',26)}<br>Belum ada menu favorit.</div>`;
    mountIcons();
    return;
  }
  const table = ctxParam('table', 'lapak_table', false) || '';
  el.innerHTML = rows.map(({menu:m, store:s}) => `
    <div class="menu-card" onclick="goTo('/menu/',{storeId:'${m.storeId}',storeName:'${jsAttr(s ? s.name : '')}',table:'${table}'})" style="cursor:pointer;">
      <div class="menu-thumb" style="${m.photoURL ? `background-image:url('${m.photoURL}')` : ''}">${m.photoURL ? '' : ic(catMeta(m.category).icon,24)}</div>
      <div class="menu-info">
        <div class="menu-name">${escapeHtml(m.name)}</div>
        <div class="menu-price">${rupiah(m.price)}</div>
        <p class="faint" style="margin:2px 0 0;">${s ? escapeHtml(s.name) : ''}</p>
      </div>
      <button class="fav-btn active" onclick="event.stopPropagation(); unfavMenu('${m.storeId}','${m.id}')">${ic('heart',16)}</button>
    </div>`).join('');
  mountIcons();
}

async function unfavMenu(storeId, menuId){
  toggleFavMenu(storeId, menuId);
  renderFavMenus();
}

init();
