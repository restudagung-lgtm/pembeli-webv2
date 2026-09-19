/*
  menu.js
  -------
  Halaman /menu/: daftar menu dari satu toko. Butuh storeId (dari URL,
  dititipkan ke localStorage sebagai cadangan), lalu keranjangnya disimpan
  per toko di localStorage lewat cart.js supaya nyambung ke halaman
  /keranjang/. Menampilkan rating per menu, status stok, dan status
  buka/tutup toko.
*/

const CATS = [
  { id:'makanan', label:'Makanan', icon:'utensils' },
  { id:'minuman', label:'Minuman', icon:'cup-soda' },
  { id:'snack', label:'Snack', icon:'cookie' },
  { id:'lainnya', label:'Lainnya', icon:'sparkles' },
];
function catMeta(id){ return CATS.find(c => c.id === id) || {label:'Lainnya', icon:'utensils'}; }

let STORE_ID, STORE_NAME, TABLE, menuCache = {}, menuList = [], menuCat = '', cart = {}, storeIsOpen = true;

async function init(){
  STORE_ID = ctxParam('storeId', 'lapak_current_store_id', true);
  STORE_NAME = ctxParam('storeName', 'lapak_current_store_name', true);
  TABLE = ctxParam('table', 'lapak_table', true);
  if(!STORE_ID || !TABLE){ goTo('/toko/', {table: TABLE || ''}); return; }

  cart = getCart(STORE_ID);
  const store = await sGet('store:' + STORE_ID, true);
  const status = storeStatusLabel(store);
  storeIsOpen = status.open;
  const fav = isFavStore(STORE_ID);

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar"><button class="backbtn" onclick="goTo('/toko/',{table:'${TABLE}'})">${ic('arrow-left',18)}</button>
    <div style="flex:1;"><h2>${escapeHtml(STORE_NAME)} ${premiumBadge(store)}</h2><div class="sub">${ratingBadge(store)} · <span class="hours-badge ${status.open?'is-open':'is-closed'}">${status.text}</span></div></div>
    <button class="ic-btn" style="margin-right:4px;color:${fav?'var(--chili)':'var(--text-faint)'};" onclick="toggleFavStoreHeader(this)">${ic('heart',20)}</button>
    <button class="topbar-cart-btn" onclick="goTo('/keranjang/',{storeId:'${STORE_ID}',storeName:'${jsAttr(STORE_NAME)}',table:'${TABLE}'})">${ic('shopping-cart',22)}<span class="cart-badge" id="topCartBadge" style="display:none;">0</span></button>
  </div>
  <div class="content">
    ${!status.open ? `<div class="closed-banner">${ic('alert-triangle',15)} Toko sedang tutup. Kamu tetap bisa lihat menunya, tapi belum bisa pesan sekarang.</div>` : ''}
    <div class="search-box">${ic('search',16)}<input id="menuSearch" placeholder="Cari menu..." oninput="filterMenu()"></div>
    <div class="chip-row" id="menuChips"></div>
    <div class="section-title">Menu</div>
    <div id="menuList"><div class="empty">Memuat menu…</div></div>
  </div>`;
  document.getElementById('menuChips').innerHTML =
    `<div class="chip active" onclick="pickMenuCat(this,'')">Semua</div>` +
    CATS.map(c => `<div class="chip" onclick="pickMenuCat(this,'${c.id}')">${ic(c.icon,14)} ${c.label}</div>`).join('');
  mountIcons();

  const keys = await sList('menu:' + STORE_ID + ':', true);
  const items = (await Promise.all(keys.map(k => sGet(k, true)))).filter(Boolean).filter(m => m.available !== false);
  items.forEach(m => { menuCache[m.id] = m; });
  menuList = items;
  drawMenuList(items);
  updateTopCartBadge();
  renderCartBar();
}

function toggleFavStoreHeader(btn){
  const active = toggleFavStore(STORE_ID);
  btn.style.color = active ? 'var(--chili)' : 'var(--text-faint)';
}

function pickMenuCat(el, cat){
  document.querySelectorAll('#menuChips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  menuCat = cat;
  filterMenu();
}
function filterMenu(){
  const q = (document.getElementById('menuSearch').value || '').toLowerCase();
  let list = menuList;
  if(menuCat) list = list.filter(m => m.category === menuCat);
  if(q) list = list.filter(m => (m.name||'').toLowerCase().includes(q));
  drawMenuList(list);
}
function isOutOfStock(m){
  return m.stock !== undefined && m.stock !== null && m.stock !== '' && Number(m.stock) <= 0;
}
function drawMenuList(items){
  const el = document.getElementById('menuList');
  if(items.length === 0){
    el.innerHTML = `<div class="empty">${ic('utensils',30)}<br>Tidak ada menu yang cocok.</div>`;
    mountIcons();
    return;
  }
  el.innerHTML = items.map(m => {
    const qty = (cart[m.id] || {}).qty || 0;
    const thumb = m.photoURL ? `background-image:url('${m.photoURL}')` : '';
    const outOfStock = isOutOfStock(m);
    const canOrder = storeIsOpen && !outOfStock;
    const fav = isFavMenu(STORE_ID, m.id);
    const hasStockInfo = m.stock !== undefined && m.stock !== null && m.stock !== '';
    let side;
    if(outOfStock) side = `<span class="badge badge-habis">Habis</span>`;
    else if(!storeIsOpen) side = `<span class="faint">Toko tutup</span>`;
    else side = qty > 0
      ? `<div class="qty-stepper"><button onclick="changeQty('${m.id}', -1)">−</button><span id="qty-${m.id}">${qty}</span><button onclick="changeQty('${m.id}', 1)">+</button></div>`
      : `<button class="addbtn" onclick="changeQty('${m.id}', 1)">+</button>`;
    return `<div class="menu-card ${outOfStock ? 'stock-out' : ''}" style="position:relative;">
      <div class="menu-thumb" style="${thumb}">${m.photoURL ? '' : ic(catMeta(m.category).icon, 24)}</div>
      <div class="menu-info">
        <div class="menu-name">${escapeHtml(m.name)}</div>
        <div class="menu-price">${rupiah(m.price)}</div>
        <div style="margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          ${m.ratingCount ? ratingBadge(m) : ''}
          ${hasStockInfo && !outOfStock && Number(m.stock) <= 5 ? `<span class="stock-low">Sisa ${m.stock}</span>` : ''}
        </div>
      </div>
      <div class="menu-side" id="side-${m.id}">${side}</div>
      <button class="fav-btn ${fav?'active':''}" style="position:absolute;top:6px;right:6px;width:24px;height:24px;background:none;box-shadow:none;" onclick="toggleFavMenuUI(this,'${m.id}')">${ic('heart',13)}</button>
    </div>`;
  }).join('');
}

function toggleFavMenuUI(btn, menuId){
  const active = toggleFavMenu(STORE_ID, menuId);
  btn.classList.toggle('active', active);
}

function changeQty(menuId, delta){
  const menu = menuCache[menuId];
  if(!menu || !storeIsOpen || isOutOfStock(menu)) return;
  if(!cart[menuId]) cart[menuId] = {qty:0, menu};
  let nextQty = cart[menuId].qty + delta;
  if(menu.stock !== undefined && menu.stock !== null && menu.stock !== ''){
    nextQty = Math.min(nextQty, Number(menu.stock));
  }
  cart[menuId].qty = Math.max(0, nextQty);
  if(cart[menuId].qty === 0) delete cart[menuId];
  setCart(STORE_ID, cart);

  const side = document.getElementById('side-' + menuId);
  if(side){
    const qty = cart[menuId] ? cart[menuId].qty : 0;
    side.innerHTML = qty > 0
      ? `<div class="qty-stepper"><button onclick="changeQty('${menuId}', -1)">−</button><span id="qty-${menuId}">${qty}</span><button onclick="changeQty('${menuId}', 1)">+</button></div>`
      : `<button class="addbtn" onclick="changeQty('${menuId}', 1)">+</button>`;
  }
  updateTopCartBadge();
  renderCartBar();
}

function updateTopCartBadge(){
  const badge = document.getElementById('topCartBadge');
  if(!badge) return;
  const t = cartTotals(cart);
  badge.style.display = t.qty > 0 ? 'flex' : 'none';
  badge.textContent = t.qty;
}

function renderCartBar(){
  let bar = document.getElementById('cartbar');
  const t = cartTotals(cart);
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'cartbar';
    bar.className = 'cartbar';
    document.getElementById('app').appendChild(bar);
  }
  if(t.qty === 0){ bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML = `
    <div class="cartbar-ic">${ic('shopping-cart',18)}</div>
    <div class="cartbar-info" style="flex:1;">
      <span class="cartbar-qty">${t.qty} item</span>
      <span class="cartbar-price">${rupiah(t.price)}</span>
    </div>
    <button class="btn btn-primary" onclick="goTo('/keranjang/',{storeId:'${STORE_ID}',storeName:'${jsAttr(STORE_NAME)}',table:'${TABLE}'})">Lihat</button>`;
  mountIcons();
}

init();
