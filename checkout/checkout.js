/*
  checkout.js
  -----------
  Halaman /checkout/: pilih metode bayar (Tunai / QRIS dinamis), buat
  dokumen pesanan di Firestore, lalu pindah ke /pesanan/ untuk memantau
  statusnya.
*/

let STORE_ID, STORE_NAME, TABLE, cart = {}, checkoutStore = null, pm = 'tunai';

async function init(){
  STORE_ID = ctxParam('storeId', 'lapak_current_store_id', true);
  STORE_NAME = ctxParam('storeName', 'lapak_current_store_name', true);
  TABLE = ctxParam('table', 'lapak_table', true);
  if(!STORE_ID || !TABLE){ goTo('/toko/', {table: TABLE || ''}); return; }
  cart = getCart(STORE_ID);
  if(Object.keys(cart).length === 0){ goTo('/keranjang/', {storeId:STORE_ID, storeName:STORE_NAME, table:TABLE}); return; }

  checkoutStore = await sGet('store:' + STORE_ID, true);
  const t = cartTotals(cart);
  const hasQris = !!(checkoutStore && (checkoutStore.qrisPayload || checkoutStore.qrisImage));

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar"><button class="backbtn" onclick="goTo('/keranjang/',{storeId:'${STORE_ID}',storeName:'${jsAttr(STORE_NAME)}',table:'${TABLE}'})">${ic('arrow-left',18)}</button><div><h2>Pembayaran</h2><div class="sub">Total ${rupiah(t.price)}</div></div></div>
  <div class="content">
    <div class="section-title">Pilih metode pembayaran</div>
    <div id="pmTunai" class="paymethod selected" onclick="choosePM('tunai')">
      <div class="pm-ic">${ic('banknote',20)}</div>
      <div class="pm-info"><div class="pm-title">Tunai</div><div class="pm-sub">Bayar saat pesanan diantar</div></div>
      <div class="pm-check">${ic('check',13)}</div>
    </div>
    <div id="pmQris" class="paymethod ${hasQris ? '' : 'disabled'}" onclick="${hasQris ? "choosePM('qris')" : ''}">
      <div class="pm-ic">${ic('qr-code',20)}</div>
      <div class="pm-info">
        <div class="pm-title">QRIS</div>
        <div class="pm-sub">${hasQris ? 'Satu kode, semua e-wallet & m-banking' : 'Belum tersedia dari toko ini'}</div>
        ${hasQris ? `<div class="wallet-row"><span class="wallet-chip">GoPay</span><span class="wallet-chip">OVO</span><span class="wallet-chip">DANA</span><span class="wallet-chip">ShopeePay</span><span class="wallet-chip">m-Banking</span></div>` : ''}
      </div>
      <div class="pm-check">${ic('check',13)}</div>
    </div>

    <div id="qrisArea"></div>

    <div class="section-title">Detail Pesanan</div>
    <div class="card">
      <div class="row" style="margin-bottom:8px;"><span class="muted">Meja</span><strong>No. ${TABLE}</strong></div>
      <div class="row" style="margin-bottom:8px;"><span class="muted">Lapak</span><strong>${escapeHtml(STORE_NAME)}</strong></div>
      <div class="row" style="padding-top:8px;border-top:1px solid var(--line);"><span class="muted">Total</span><strong style="color:var(--lantern);">${rupiah(t.price)}</strong></div>
    </div>
    <button class="btn btn-primary" id="payBtn" onclick="confirmPay()">Bayar Sekarang</button>
  </div>`;
  mountIcons();
}

function choosePM(pmSel){
  pm = pmSel;
  document.getElementById('pmTunai').classList.toggle('selected', pm === 'tunai');
  document.getElementById('pmQris').classList.toggle('selected', pm === 'qris');
  const area = document.getElementById('qrisArea');
  const t = cartTotals(cart);
  if(pm === 'qris' && checkoutStore){
    if(checkoutStore.qrisPayload){
      const dyn = buildDynamicQRIS(checkoutStore.qrisPayload, t.price);
      const imgUrl = dyn ? qrEncodeURL(dyn, 320) : checkoutStore.qrisImage;
      area.innerHTML = `<div class="qris-box">
        <img src="${imgUrl}" alt="QRIS ${escapeHtml(checkoutStore.name)}">
        <div class="qris-amount">${rupiah(t.price)}</div>
        <div class="qris-store">Nominal sudah otomatis terisi · scan pakai GoPay/OVO/DANA/ShopeePay/m-banking apa pun</div>
      </div>`;
    } else if(checkoutStore.qrisImage){
      area.innerHTML = `<div class="qris-box">
        <img src="${checkoutStore.qrisImage}" alt="QRIS ${escapeHtml(checkoutStore.name)}">
        <div class="qris-amount">${rupiah(t.price)}</div>
        <div class="qris-store">Cocokkan nominal saat bayar manual · ${escapeHtml(checkoutStore.name)}</div>
      </div>`;
    } else { area.innerHTML = ''; }
  } else {
    area.innerHTML = '';
  }
  mountIcons();
}

async function confirmPay(){
  const entries = Object.entries(cart);
  if(entries.length === 0){ alert('Keranjang kosong.'); return; }
  const t = cartTotals(cart);
  const orderId = genId();
  const loc = lsGetJSON('lapak_location', null);
  const order = {
    id: orderId,
    table: TABLE,
    storeId: STORE_ID,
    storeName: STORE_NAME,
    items: entries.map(([id,c]) => ({id, name:c.menu.name, price:c.menu.price, qty:c.qty})),
    total: t.price,
    paymentMethod: pm,
    paymentStatus: pm === 'qris' ? 'lunas' : 'bayar_ditempat',
    status: 'pending',
    location: loc,
    createdAt: Date.now()
  };
  const btn = document.getElementById('payBtn');
  if(btn){ btn.textContent = 'Memproses…'; btn.disabled = true; }
  await sSet('order:' + orderId, order, true);
  clearCart(STORE_ID);
  rememberOrder(orderId);
  goTo('/pesanan/', {orderId});
}

init();
