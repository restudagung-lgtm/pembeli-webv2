/*
  keranjang.js
  ------------
  Halaman /keranjang/: isi keranjang untuk satu toko (diambil dari
  localStorage lewat cart.js), lalu lanjut ke /checkout/.
*/

const CATS = [
  { id:'makanan', label:'Makanan', icon:'utensils' },
  { id:'minuman', label:'Minuman', icon:'cup-soda' },
  { id:'snack', label:'Snack', icon:'cookie' },
  { id:'lainnya', label:'Lainnya', icon:'sparkles' },
];
function catMeta(id){ return CATS.find(c => c.id === id) || {label:'Lainnya', icon:'utensils'}; }

let STORE_ID, STORE_NAME, TABLE, cart = {};

function init(){
  STORE_ID = ctxParam('storeId', 'lapak_current_store_id', true);
  STORE_NAME = ctxParam('storeName', 'lapak_current_store_name', true);
  TABLE = ctxParam('table', 'lapak_table', true);
  if(!STORE_ID || !TABLE){ goTo('/toko/', {table: TABLE || ''}); return; }
  cart = getCart(STORE_ID);
  render();
}

function changeQty(menuId, delta){
  if(!cart[menuId]) return;
  cart[menuId].qty = Math.max(0, cart[menuId].qty + delta);
  if(cart[menuId].qty === 0) delete cart[menuId];
  setCart(STORE_ID, cart);
  render();
}

function render(){
  const app = document.getElementById('app');
  const entries = Object.entries(cart);
  const t = cartTotals(cart);
  app.innerHTML = `
  <div class="topbar"><button class="backbtn" onclick="goTo('/menu/',{storeId:'${STORE_ID}',storeName:'${jsAttr(STORE_NAME)}',table:'${TABLE}'})">${ic('arrow-left',18)}</button><div><h2>Keranjang</h2><div class="sub">${escapeHtml(STORE_NAME)} · Meja ${TABLE}</div></div></div>
  <div class="content">
    ${entries.length === 0 ? `<div class="empty">${ic('shopping-cart',30)}<br>Keranjang masih kosong.</div>
      <button class="btn btn-outline" onclick="goTo('/menu/',{storeId:'${STORE_ID}',storeName:'${jsAttr(STORE_NAME)}',table:'${TABLE}'})">Kembali ke Menu</button>` : `
    <div class="section-title">Pesanan kamu</div>
    ${entries.map(([id,c]) => `
      <div class="menu-card">
        <div class="menu-thumb" style="${c.menu.photoURL ? `background-image:url('${c.menu.photoURL}')` : ''}">${c.menu.photoURL ? '' : ic(catMeta(c.menu.category).icon,24)}</div>
        <div class="menu-info">
          <div class="menu-name">${escapeHtml(c.menu.name)}</div>
          <div class="menu-price">${rupiah(c.menu.price)} × ${c.qty}</div>
        </div>
        <div class="menu-side">
          <div class="qty-stepper"><button onclick="changeQty('${id}', -1)">−</button><span>${c.qty}</span><button onclick="changeQty('${id}', 1)">+</button></div>
        </div>
      </div>`).join('')}
    <div class="section-title">Detail Pembayaran</div>
    <div class="card">
      <div class="row" style="margin-bottom:8px;"><span class="muted">Subtotal</span><span>${rupiah(t.price)}</span></div>
      <div class="row" style="margin-bottom:8px;"><span class="muted">Biaya layanan</span><span>Rp0</span></div>
      <div class="row" style="padding-top:10px;border-top:1px solid var(--line);"><strong>TOTAL</strong><strong style="color:var(--lantern);">${rupiah(t.price)}</strong></div>
    </div>
    <button class="btn btn-primary" onclick="goTo('/checkout/',{storeId:'${STORE_ID}',storeName:'${jsAttr(STORE_NAME)}',table:'${TABLE}'})">Lanjut Bayar ${ic('arrow-right',16)}</button>
    `}
  </div>`;
  mountIcons();
}

init();
