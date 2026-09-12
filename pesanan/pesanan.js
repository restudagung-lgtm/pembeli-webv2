/*
  pesanan.js
  ----------
  Halaman /pesanan/: status satu pesanan, auto-refresh tiap 4 detik.
  Bisa membatalkan pesanan (selama masih "pending") dan memberi rating
  toko setelah pesanan selesai.
*/

let ORDER_ID, trackInterval = null, _rateValue = 0;

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
  <div class="topbar"><button class="backbtn" onclick="goTo('/pesanan-saya/')">${ic('arrow-left',18)}</button><div><h2>Status Pesanan</h2><div class="sub">#${order.id.toUpperCase()}</div></div></div>
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
      <div class="row"><strong>Total</strong><strong style="color:var(--lantern);">${rupiah(order.total)}</strong></div>
      <div class="row" style="margin-top:6px;"><span class="muted">Pembayaran</span><span class="badge badge-${order.paymentStatus}">${order.paymentMethod === 'qris' ? 'QRIS' : 'Tunai'} ${order.paymentStatus === 'lunas' ? '· Lunas' : '· Di tempat'}</span></div>
    </div>

    ${order.status === 'pending' ? `
    <button class="btn btn-danger" onclick="cancelOrder()">${ic('x-circle',16)} Batalkan Pesanan</button>
    <p class="faint" style="text-align:center;margin-top:8px;">Bisa dibatalkan selama lapak belum mulai menyiapkan.</p>
    ` : ''}

    ${order.status === 'selesai' && !order.ratingSubmitted ? `
    <div class="card" style="text-align:center;">
      <h3>Beri Rating Lapak Ini</h3>
      <p class="muted">Bagaimana pesananmu dari ${escapeHtml(order.storeName)}?</p>
      <div class="rate-picker" id="ratePicker">
        ${[1,2,3,4,5].map(n => `<button onclick="setRateHover(${n})" data-star="${n}">${starIcon(false,26)}</button>`).join('')}
      </div>
      <button class="btn btn-primary" id="submitRateBtn" onclick="submitRating('${order.storeId}')" disabled>Kirim Rating</button>
    </div>` : ''}
    ${order.status === 'selesai' && order.ratingSubmitted ? `<div class="card" style="text-align:center;">${renderStars(order.ratingValue, 20)}<p class="muted" style="margin-top:6px;">Terima kasih atas rating kamu!</p></div>` : ''}

    <div style="height:6px;"></div>
    <button class="btn btn-outline" onclick="goTo('/menu/',{storeId:'${order.storeId}',storeName:'${jsAttr(order.storeName)}',table:'${order.table}'})">Pesan Lagi dari Lapak Ini</button>
  </div>`;
  mountIcons();
}

function setRateHover(n){
  _rateValue = n;
  document.querySelectorAll('#ratePicker button').forEach(b => {
    const s = Number(b.dataset.star);
    b.innerHTML = starIcon(s <= n, 26);
    b.classList.toggle('active', s <= n);
  });
  document.getElementById('submitRateBtn').disabled = false;
}

async function submitRating(storeId){
  if(!_rateValue) return;
  const order = await sGet('order:' + ORDER_ID, true);
  if(!order || order.ratingSubmitted) return;
  order.ratingSubmitted = true;
  order.ratingValue = _rateValue;
  await sSet('order:' + ORDER_ID, order, true);
  const store = await sGet('store:' + storeId, true);
  if(store){
    store.ratingSum = (store.ratingSum || 0) + _rateValue;
    store.ratingCount = (store.ratingCount || 0) + 1;
    await sSet('store:' + storeId, store, true);
  }
  _rateValue = 0;
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

init();
