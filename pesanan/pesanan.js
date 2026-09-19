/*
  pesanan.js
  ----------
  Halaman /pesanan/: status satu pesanan, auto-refresh tiap 4 detik.
  Bisa membatalkan pesanan (selama masih "pending"), cetak struk, dan
  memberi rating + ulasan PER MENU setelah pesanan selesai (rata-ratanya
  juga dipakai sebagai satu suara untuk rating toko).
*/

let ORDER_ID, trackInterval = null, _itemRatings = [];

async function init(){
  ORDER_ID = ctxParam('orderId', null, false);
  if(!ORDER_ID){ goTo('/pesanan-saya/'); return; }
  await draw();
  if(trackInterval) clearInterval(trackInterval);
  trackInterval = setInterval(draw, 4000);
}

async function draw(){
  const app = document.getElementById('app');
  const order = await sGet('order:' + ORDER_ID, true);
  if(!order){
    app.innerHTML = `
    <div class="topbar"><button class="backbtn" onclick="goTo('/pesanan-saya/')">${ic('arrow-left',18)}</button><div><h2>Status Pesanan</h2></div></div>
    <div class="content"><div class="empty">${ic('alert-triangle',30)}<br>Pesanan tidak ditemukan. Mungkin sudah lama atau tautannya salah.</div>
    <button class="btn btn-outline" onclick="goTo('/pesanan-saya/')">Lihat Pesanan Lain</button></div>`;
    mountIcons();
    if(trackInterval){ clearInterval(trackInterval); trackInterval = null; }
    return;
  }
  if((order.status === 'selesai' || order.status === 'dibatalkan') && getActiveOrderId() === order.id){
    clearActiveOrder();
  }
  if(_itemRatings.length !== order.items.length) _itemRatings = order.items.map(() => 5);

  const idx = STATUS_FLOW.indexOf(order.status);
  const canceled = order.status === 'dibatalkan';
  const iconByStatus = {pending:'clock', diproses:'utensils', diantar:'truck', selesai:'check-circle-2', dibatalkan:'x-circle'};
  const descByStatus = {
    pending:'Pesananmu sedang menunggu dikonfirmasi oleh lapak.',
    diproses:'Lapak sedang menyiapkan pesananmu.',
    diantar:'Pesanan dalam perjalanan ke mejamu.',
    selesai:'Pesanan sudah sampai. Selamat menikmati!',
    dibatalkan:'Pesanan ini sudah dibatalkan.'
  };
  app.innerHTML = `
  <div class="topbar"><button class="backbtn" onclick="goTo('/pesanan-saya/')">${ic('arrow-left',18)}</button><div style="flex:1;"><h2>Status Pesanan</h2><div class="sub">#${order.id.toUpperCase()}</div></div>
    <button class="ic-btn" onclick="printReceipt()" aria-label="Cetak Struk">${ic('printer',20)}</button>
  </div>
  <div class="content">
    <div class="status-hero">
      <div class="status-ic st-${order.status}">${ic(iconByStatus[order.status] || 'clock', 32)}</div>
      <h2>${STATUS_LABEL[order.status]}</h2>
      <p>${descByStatus[order.status]}</p>
    </div>

    ${!canceled ? `
    <div class="card">
      <div class="track">
        ${STATUS_FLOW.map((s,i) => `<div class="tstep ${i<=idx?'done':''}"><div class="dot">${i<=idx ? ic('check',13) : (i+1)}</div><p>${STATUS_LABEL[s]}</p></div>`).join('')}
      </div>
    </div>` : ''}

    <div class="card">
      <div class="row" style="margin-bottom:6px;"><strong>${escapeHtml(order.storeName)}</strong><span class="muted">Meja ${order.table}</span></div>
      <div style="border-top:1px solid var(--line);margin:8px 0;"></div>
      ${order.items.map(it => `<div class="rline muted" style="display:flex;justify-content:space-between;"><span>${it.qty}× ${escapeHtml(it.name)}</span><span>${rupiah(it.price*it.qty)}</span></div>`).join('')}
      <div style="border-top:1px solid var(--line);margin:8px 0;"></div>
      ${order.discount ? `
      <div class="row" style="margin-bottom:4px;"><span class="muted">Subtotal</span><span>${rupiah(order.subtotal)}</span></div>
      <div class="row" style="margin-bottom:4px;"><span class="muted">Diskon${order.promoLabel ? ' ('+escapeHtml(order.promoLabel)+')' : ''}</span><span style="color:var(--leaf);">-${rupiah(order.discount)}</span></div>
      ` : ''}
      <div class="row"><strong>Total</strong><strong style="color:var(--lantern);">${rupiah(order.total)}</strong></div>
      <div class="row" style="margin-top:6px;"><span class="muted">Pembayaran</span><span class="badge badge-${order.paymentStatus}">${order.paymentMethod === 'qris' ? 'QRIS' : 'Tunai'} ${order.paymentStatus === 'lunas' ? '· Lunas' : '· Di tempat'}</span></div>
    </div>

    ${order.status === 'pending' ? `
    <button class="btn btn-danger" onclick="cancelOrder()">${ic('x-circle',16)} Batalkan Pesanan</button>
    <p class="faint" style="text-align:center;margin-top:8px;">Bisa dibatalkan selama lapak belum mulai menyiapkan.</p>
    ` : ''}

    ${order.status === 'selesai' && !order.ratingSubmitted ? `
    <div class="card">
      <h3 style="text-align:center;">Beri Rating &amp; Ulasan</h3>
      <p class="muted" style="text-align:center;">Bagaimana menu-menu dari pesanan ini?</p>
      ${order.items.map((it,i) => `
      <div style="margin:12px 0;text-align:center;">
        <div class="muted" style="font-size:13px;font-weight:700;color:var(--text);">${escapeHtml(it.name)}</div>
        <div class="rate-picker" id="ratePicker-${i}" style="margin:6px 0 0;">
          ${[1,2,3,4,5].map(n => `<button onclick="setItemRate(${i},${n})" data-star="${n}">${starIcon(n<=5,20)}</button>`).join('')}
        </div>
      </div>`).join('')}
      <div class="field"><label>Ulasan (opsional)</label><textarea id="reviewComment" placeholder="Ceritakan pengalamanmu..."></textarea></div>
      <button class="btn btn-primary" onclick="submitRating('${order.storeId}')">Kirim Rating &amp; Ulasan</button>
    </div>` : ''}
    ${order.status === 'selesai' && order.ratingSubmitted ? `
    <div class="card">
      <h3 style="text-align:center;">Rating Kamu</h3>
      ${(order.itemRatings || []).map((r,i) => `<div class="row" style="margin-top:6px;"><span class="muted">${escapeHtml(order.items[i] ? order.items[i].name : '')}</span>${renderStars(r,15)}</div>`).join('')}
      ${order.reviewComment ? `<p class="muted" style="margin-top:10px;font-style:italic;">"${escapeHtml(order.reviewComment)}"</p>` : ''}
      <p class="faint" style="text-align:center;margin-top:10px;">Terima kasih atas rating &amp; ulasan kamu!</p>
    </div>` : ''}

    <div style="height:6px;"></div>
    <button class="btn btn-outline" onclick="goTo('/menu/',{storeId:'${order.storeId}',storeName:'${jsAttr(order.storeName)}',table:'${order.table}'})">Pesan Lagi dari Lapak Ini</button>
  </div>`;
  mountIcons();
}

function setItemRate(i, n){
  _itemRatings[i] = n;
  document.querySelectorAll('#ratePicker-' + i + ' button').forEach(b => {
    const s = Number(b.dataset.star);
    b.innerHTML = starIcon(s <= n, 20);
  });
}

async function submitRating(storeId){
  const order = await sGet('order:' + ORDER_ID, true);
  if(!order || order.ratingSubmitted) return;
  const comment = (document.getElementById('reviewComment').value || '').trim();

  order.ratingSubmitted = true;
  order.itemRatings = _itemRatings.slice();
  order.reviewComment = comment || null;
  await sSet('order:' + ORDER_ID, order, true);

  // Update rating tiap menu.
  for(let i = 0; i < order.items.length; i++){
    const it = order.items[i];
    const key = 'menu:' + storeId + ':' + it.id;
    const m = await sGet(key, true);
    if(m){
      m.ratingSum = (m.ratingSum || 0) + _itemRatings[i];
      m.ratingCount = (m.ratingCount || 0) + 1;
      await sSet(key, m, true);
    }
  }

  // Update rating toko (rata-rata dari rating menu di pesanan ini, dihitung sebagai satu suara).
  const avg = _itemRatings.reduce((a,b) => a+b, 0) / _itemRatings.length;
  const store = await sGet('store:' + storeId, true);
  if(store){
    store.ratingSum = (store.ratingSum || 0) + avg;
    store.ratingCount = (store.ratingCount || 0) + 1;
    await sSet('store:' + storeId, store, true);
  }

  // Simpan sebagai ulasan supaya penjual bisa membacanya di halaman Profil.
  const reviewId = genId();
  await sSet('review:' + storeId + ':' + reviewId, {
    id: reviewId, storeId, orderId: order.id,
    items: order.items.map((it,i) => ({name: it.name, rating: _itemRatings[i]})),
    comment: comment || null,
    createdAt: Date.now()
  }, true);

  draw();
}

async function cancelOrder(){
  if(!confirm('Batalkan pesanan ini? Tindakan ini tidak bisa dibatalkan lagi.')) return;
  const order = await sGet('order:' + ORDER_ID, true);
  if(!order || order.status !== 'pending'){ alert('Pesanan sudah mulai diproses dan tidak bisa dibatalkan lagi.'); draw(); return; }
  order.status = 'dibatalkan';
  await sSet('order:' + ORDER_ID, order, true);
  clearActiveOrder();
  draw();
}

async function printReceipt(){
  const order = await sGet('order:' + ORDER_ID, true);
  if(!order) return;
  const win = window.open('', '_blank');
  const itemsHtml = order.items.map(it => `<div class="rline"><span>${it.qty}× ${escapeHtml(it.name)}</span><span>${rupiah(it.price*it.qty)}</span></div>`).join('');
  win.document.write(`
  <!doctype html><html><head><title>Struk #${order.id.toUpperCase()}</title><meta charset="UTF-8">
  <style>
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:24px;background:#fff;}
    .receipt{max-width:340px;margin:0 auto;background:#FBF1DE;color:#231A0E;border-radius:14px;padding:22px 20px;}
    .receipt h2{font-size:19px;text-align:center;margin:0 0 4px;}
    .center{text-align:center;color:#5b4a2f;font-size:12px;margin-bottom:10px;}
    .dashed{border-top:1.5px dashed rgba(35,26,14,.35);margin:14px 0;}
    .rline{display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;}
    .total{font-weight:700;font-size:16px;}
    @media print{ @page{ margin:10mm; } }
  </style></head>
  <body onload="setTimeout(function(){window.print();},400)">
    <div class="receipt">
      <h2>🏮 Lapak Alun-Alun</h2>
      <div class="center">#${order.id.toUpperCase()} · ${new Date(order.createdAt).toLocaleString('id-ID')}</div>
      <div class="rline"><span>Lapak</span><span>${escapeHtml(order.storeName)}</span></div>
      <div class="rline"><span>Meja</span><span>No. ${order.table}</span></div>
      <div class="dashed"></div>
      ${itemsHtml}
      <div class="dashed"></div>
      ${order.discount ? `<div class="rline"><span>Subtotal</span><span>${rupiah(order.subtotal)}</span></div><div class="rline"><span>Diskon</span><span>-${rupiah(order.discount)}</span></div>` : ''}
      <div class="rline total"><span>Total</span><span>${rupiah(order.total)}</span></div>
      <div class="rline"><span>Pembayaran</span><span>${order.paymentMethod === 'qris' ? 'QRIS' : 'Tunai'} ${order.paymentStatus === 'lunas' ? '(Lunas)' : '(Di tempat)'}</span></div>
      <div class="dashed"></div>
      <div class="center">Terima kasih sudah memesan!</div>
    </div>
  </body></html>`);
  win.document.close();
}

init();
