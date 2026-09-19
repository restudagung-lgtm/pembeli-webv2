/*
  checkout.js
  -----------
  Halaman /checkout/: pilih metode bayar (Tunai / QRIS dinamis), terapkan
  kode promo (kalau ada), buat dokumen pesanan di Firestore (sambil
  mengurangi stok menu yang dilacak), lalu pindah ke /pesanan/.
*/

let STORE_ID, STORE_NAME, TABLE, cart = {}, checkoutStore = null, pm = 'tunai', promoDiscount = 0, promoLabel = '';

async function init(){
  STORE_ID = ctxParam('storeId', 'lapak_current_store_id', true);
  STORE_NAME = ctxParam('storeName', 'lapak_current_store_name', true);
  TABLE = ctxParam('table', 'lapak_table', true);
  if(!STORE_ID || !TABLE){ goTo('/toko/', {table: TABLE || ''}); return; }
  cart = getCart(STORE_ID);
  if(Object.keys(cart).length === 0){ goTo('/keranjang/', {storeId:STORE_ID, storeName:STORE_NAME, table:TABLE}); return; }

  checkoutStore = await sGet('store:' + STORE_ID, true);
  const status = storeStatusLabel(checkoutStore);
  const t = cartTotals(cart);
  const hasQris = !!(checkoutStore && (checkoutStore.qrisPayload || checkoutStore.qrisImage));
  const hasPromo = !!(checkoutStore && checkoutStore.promo && checkoutStore.promo.code);

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="topbar"><button class="backbtn" onclick="goTo('/keranjang/',{storeId:'${STORE_ID}',storeName:'${jsAttr(STORE_NAME)}',table:'${TABLE}'})">${ic('arrow-left',18)}</button><div><h2>Pembayaran</h2><div class="sub">Total ${rupiah(t.price)}</div></div></div>
  <div class="content">
    ${!status.open ? `<div class="closed-banner">${ic('alert-triangle',15)} Toko sedang tutup sekarang, belum bisa menerima pesanan baru.</div>` : ''}

    ${hasPromo ? `
    <div class="section-title">Kode Promo</div>
    <div id="promoArea">
      <div class="promo-box">
        <input id="promoInput" type="text" placeholder="Masukkan kode promo">
        <button class="btn btn-outline btn-block-sm" style="width:auto;" onclick="applyPromo()">Terapkan</button>
      </div>
      <p id="promoMsg" class="faint" style="margin-top:-4px;"></p>
    </div>` : ''}

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
      <div class="row" style="margin-bottom:8px;"><span class="muted">Subtotal</span><span id="sumSubtotal">${rupiah(t.price)}</span></div>
      <div class="row" id="sumDiscountRow" style="margin-bottom:8px;display:none;"><span class="muted">Diskon</span><span id="sumDiscount" style="color:var(--leaf);"></span></div>
      <div class="row" style="padding-top:8px;border-top:1px solid var(--line);"><span class="muted">Total</span><strong style="color:var(--lantern);" id="sumTotal">${rupiah(t.price)}</strong></div>
    </div>
    <button class="btn btn-primary" id="payBtn" onclick="confirmPay()" ${!status.open ? 'disabled' : ''}>${status.open ? 'Bayar Sekarang' : 'Toko Sedang Tutup'}</button>
  </div>`;
  mountIcons();
}

function currentTotal(){
  const t = cartTotals(cart);
  return Math.max(0, t.price - promoDiscount);
}
function updateSummary(){
  const t = cartTotals(cart);
  document.getElementById('sumSubtotal').textContent = rupiah(t.price);
  const discRow = document.getElementById('sumDiscountRow');
  if(promoDiscount > 0){
    discRow.style.display = 'flex';
    document.getElementById('sumDiscount').textContent = '-' + rupiah(promoDiscount) + (promoLabel ? ` (${promoLabel})` : '');
  } else {
    discRow.style.display = 'none';
  }
  document.getElementById('sumTotal').textContent = rupiah(currentTotal());
  // Kalau QRIS lagi ditampilkan, perbarui juga nominalnya biar sesuai diskon.
  if(pm === 'qris') choosePM('qris');
}

function applyPromo(){
  const code = (document.getElementById('promoInput').value || '').trim().toUpperCase();
  const msg = document.getElementById('promoMsg');
  const promo = checkoutStore && checkoutStore.promo;
  if(!promo || !promo.code){ msg.textContent = 'Toko ini belum punya promo aktif.'; return; }
  if(code !== String(promo.code).toUpperCase()){ msg.textContent = 'Kode promo tidak ditemukan.'; msg.style.color = 'var(--chili)'; return; }
  if(promo.validUntil && promo.validUntil < Date.now()){ msg.textContent = 'Kode promo ini sudah kedaluwarsa.'; msg.style.color = 'var(--chili)'; return; }
  const t = cartTotals(cart);
  promoDiscount = Math.round(t.price * (Number(promo.percent) || 0) / 100);
  promoLabel = `${promo.percent}% · ${promo.code}`;
  msg.style.color = 'var(--leaf)';
  msg.innerHTML = `${ic('check',12)} Promo diterapkan: potongan ${rupiah(promoDiscount)}`;
  mountIcons();
  updateSummary();
}

function choosePM(pmSel){
  pm = pmSel;
  document.getElementById('pmTunai').classList.toggle('selected', pm === 'tunai');
  document.getElementById('pmQris').classList.toggle('selected', pm === 'qris');
  const area = document.getElementById('qrisArea');
  const total = currentTotal();
  if(pm === 'qris' && checkoutStore){
    if(checkoutStore.qrisPayload){
      const dyn = buildDynamicQRIS(checkoutStore.qrisPayload, total);
      const imgUrl = dyn ? qrEncodeURL(dyn, 320) : checkoutStore.qrisImage;
      area.innerHTML = `<div class="qris-box">
        <img src="${imgUrl}" alt="QRIS ${escapeHtml(checkoutStore.name)}">
        <div class="qris-amount">${rupiah(total)}</div>
        <div class="qris-store">Nominal sudah otomatis terisi · scan pakai GoPay/OVO/DANA/ShopeePay/m-banking apa pun</div>
      </div>`;
    } else if(checkoutStore.qrisImage){
      area.innerHTML = `<div class="qris-box">
        <img src="${checkoutStore.qrisImage}" alt="QRIS ${escapeHtml(checkoutStore.name)}">
        <div class="qris-amount">${rupiah(total)}</div>
        <div class="qris-store">Cocokkan nominal saat bayar manual · ${escapeHtml(checkoutStore.name)}</div>
      </div>`;
    } else { area.innerHTML = ''; }
  } else {
    area.innerHTML = '';
  }
  mountIcons();
}

/*
  decrementStockFor(entries)
  ------------------------------
  Kurangi stok tiap menu yang dilacak (punya field stock), dan sesuaikan
  jumlah pesanan kalau ternyata stok yang tersisa (dibaca ulang saat ini,
  bukan pas halaman dibuka) lebih sedikit dari yang dipesan -- misalnya
  ada pembeli lain yang checkout duluan barusan. Mengembalikan array item
  final (mungkin qty-nya berkurang) untuk dipakai di dokumen pesanan.
*/
async function decrementStockFor(entries){
  const finalItems = [];
  let adjusted = false;
  for(const [id, c] of entries){
    const key = 'menu:' + STORE_ID + ':' + id;
    const fresh = await sGet(key, true);
    const tracked = fresh && fresh.stock !== undefined && fresh.stock !== null && fresh.stock !== '';
    let qty = c.qty;
    if(tracked){
      const available = Math.max(0, Number(fresh.stock));
      if(available < qty){ qty = available; adjusted = true; }
      if(qty > 0){
        fresh.stock = available - qty;
        await sSet(key, fresh, true);
      }
    }
    if(qty > 0) finalItems.push({ id, name: c.menu.name, price: c.menu.price, qty });
  }
  return { finalItems, adjusted };
}

async function confirmPay(){
  const entries = Object.entries(cart);
  if(entries.length === 0){ alert('Keranjang kosong.'); return; }

  const btn = document.getElementById('payBtn');
  if(btn){ btn.textContent = 'Memproses…'; btn.disabled = true; }

  const { finalItems, adjusted } = await decrementStockFor(entries);
  if(finalItems.length === 0){
    alert('Maaf, semua menu di keranjangmu baru saja kehabisan stok. Coba pilih menu lain ya.');
    clearCart(STORE_ID);
    goTo('/menu/', {storeId:STORE_ID, storeName:STORE_NAME, table:TABLE});
    return;
  }
  if(adjusted){
    alert('Stok beberapa menu ternyata baru saja menipis, jumlah pesananmu sudah disesuaikan otomatis.');
  }

  const subtotal = finalItems.reduce((a,it) => a + it.price*it.qty, 0);
  const discount = Math.min(promoDiscount, subtotal);
  const total = subtotal - discount;

  const orderId = genId();
  const loc = lsGetJSON('lapak_location', null);
  const order = {
    id: orderId,
    table: TABLE,
    storeId: STORE_ID,
    storeName: STORE_NAME,
    items: finalItems,
    subtotal,
    discount,
    promoLabel: discount > 0 ? promoLabel : null,
    total,
    paymentMethod: pm,
    paymentStatus: pm === 'qris' ? 'lunas' : 'bayar_ditempat',
    status: 'pending',
    location: loc,
    createdAt: Date.now()
  };
  await sSet('order:' + orderId, order, true);
  clearCart(STORE_ID);
  rememberOrder(orderId, order.createdAt);
  goTo('/pesanan/', {orderId});
}

init();
