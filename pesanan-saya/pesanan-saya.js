/*
  pesanan-saya.js
  ---------------
  Halaman /pesanan-saya/: daftar riwayat pesanan dari perangkat ini
  (id pesanan disimpan di localStorage, bukan data akun -- karena situs ini
  tidak punya sistem login pembeli).
*/

async function init(){
  const app = document.getElementById('app');
  const ids = getOrderHistory();
  app.innerHTML = `
  <div class="topbar"><div><h2>Pesanan Saya</h2><div class="sub">Riwayat pesanan di perangkat ini</div></div></div>
  <div class="content" id="ordersListContent"><div class="empty">Memuat…</div></div>
  ${bottomNav('orders')}`;
  mountIcons();

  if(ids.length === 0){
    document.getElementById('ordersListContent').innerHTML = `<div class="empty">${ic('receipt',30)}<br>Belum ada pesanan dari perangkat ini.</div>
    <button class="btn btn-primary" onclick="goTo('/')">Mulai Pesan</button>`;
    mountIcons();
    return;
  }
  const orders = (await Promise.all(ids.map(id => sGet('order:' + id, true))));
  // Kalau dokumennya sudah tidak ada (mungkin sudah lewat 30 hari dan
  // terhapus otomatis di server), buang juga dari riwayat lokal.
  orders.forEach((o, i) => { if(!o) dropFromOrderHistory(ids[i]); });
  const validOrders = orders.filter(Boolean);
  const iconByStatus = {pending:'clock', diproses:'utensils', diantar:'truck', selesai:'check-circle-2', dibatalkan:'x-circle'};
  document.getElementById('ordersListContent').innerHTML =
    `<p class="faint" style="text-align:center;margin-bottom:10px;">${ic('clock',11)} Nota pesanan tersimpan 30 hari, lalu terhapus otomatis.</p>` +
    validOrders.map(o => `
    <div class="order-list-card" onclick="goTo('/pesanan/',{orderId:'${o.id}'})">
      <div class="ol-ic">${ic(iconByStatus[o.status] || 'clock', 20)}</div>
      <div class="ol-info">
        <h3>${escapeHtml(o.storeName)}</h3>
        <p class="muted" style="margin:0;">${o.items.length} item · ${rupiah(o.total)} · Meja ${o.table}</p>
      </div>
      <span class="badge badge-${o.status}">${STATUS_LABEL[o.status]}</span>
    </div>`).join('');
  mountIcons();
}

init();
