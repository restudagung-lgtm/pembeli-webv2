/*
  menu.js
  -------
  Halaman /menu/: daftar menu dari satu toko. Butuh storeId (dari URL,
  dititipkan ke localStorage sebagai cadangan), lalu keranjangnya disimpan
  per toko di localStorage lewat cart.js supaya nyambung ke halaman
  /keranjang/.
*/

const CATS = [
  { id:'makanan', label:'Makanan', icon:'utensils' },
  { id:'minuman', label:'Minuman', icon:'cup-soda' },
  { id:'snack', label:'Snack', icon:'cookie' },
  { id:'lainnya', label:'Lainnya', icon:'sparkles' },
];
function catMeta(id){ return CATS.find(c => c.id === id) || {label:'Lainnya', icon:'utensils'}; }

let STORE_ID, STORE_NAME, TABLE, menuCache = {}, menuList = [], menuCat = '', cart = {};

async function init(){
  STORE_ID = ctxParam('storeId', 'lapak_current_store_id', true);
  STORE_NAME = ctxParam('storeName', 'lapak_current_store_name', true);
  TABLE = ctxParam('table', 'lapak_table', true);
  if(!STORE_ID || !TABLE){ goTo('/toko/', {table: TABLE || ''}); return; }

  cart = getCart(STORE_ID);
  const store = await sGet('store:' + STORE_ID, true);

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar"><button class="backbtn" onclick="goTo('/toko/',{table:'${TABLE}'})">${ic('arrow-left',18)}</button><div><h2>${escapeHtml(STORE_NAME)} ${premiumBadge(store)}</h2><div class="sub">${ratingBadge(store)} · ${ic('map-pin',12)} Meja ${TABLE}</div></div></div>
  <div class="content">
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
  renderCartBar();
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
    return `<div class="menu-card">
      <div class="menu-thumb" style="${thumb}">${m.photoURL ? '' : ic(catMeta(m.category).icon, 24)}</div>
      <div class="menu-info">
        <div class="menu-name">${escapeHtml(m.name)}</div>
        <div class="menu-price">${rupiah(m.price)}</div>
      </div>
      <div class="menu-side" id="side-${m.id}">
        ${qty > 0 ? `<div class="qty-stepper"><button onclick="changeQty('${m.id}', -1)">−</button><span id="qty-${m.id}">${qty}</span><button onclick="changeQty('${m.id}', 1)">+</button></div>`
                   : `<button class="addbtn" onclick="changeQty('${m.id}', 1)">+</button>`}
      </div>
    </div>`;
  }).join('');
}

function changeQty(menuId, delta){
  const menu = menuCache[menuId];
  if(!menu) return;
  if(!cart[menuId]) cart[menuId] = {qty:0, menu};
  cart[menuId].qty = Math.max(0, cart[menuId].qty + delta);
  if(cart[menuId].qty === 0) delete cart[menuId];
  setCart(STORE_ID, cart);

  const side = document.getElementById('side-' + menuId);
  if(side){
    const qty = cart[menuId] ? cart[menuId].qty : 0;
    side.innerHTML = qty > 0
      ? `<div class="qty-stepper"><button onclick="changeQty('${menuId}', -1)">−</button><span id="qty-${menuId}">${qty}</span><button onclick="changeQty('${menuId}', 1)">+</button></div>`
      : `<button class="addbtn" onclick="changeQty('${menuId}', 1)">+</button>`;
  }
  renderCartBar();
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
