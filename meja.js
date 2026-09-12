/*
  meja.js
  -------
  Halaman utama situs pembeli: input / scan nomor meja.
  Kalau ada pesanan yang masih berjalan di HP ini, langsung lempar ke
  halaman /pesanan/ -- supaya pembeli tidak "hilang arah" balik ke sini
  padahal pesanannya masih diproses.
  Kalau QR meja membawa ?table=N, langsung lempar ke halaman /toko/.
*/

function renderMejaForm(){
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="hero-card">
    <div class="ic-circle" style="width:56px;height:56px;border-radius:50%;margin:0 auto 14px;color:var(--lantern);">${ic('store',30)}</div>
    <h1>LAPAK ALUN-ALUN</h1>
    <p>Pesan jajanan tanpa perlu<br>meninggalkan meja</p>
  </div>
  <div class="content">
    <div class="card">
      <h3 style="display:flex;align-items:center;gap:8px;">${ic('map-pin',17)} Lokasi Pesanan</h3>
      <div class="field" style="margin-top:10px;">
        <label>Nomor Meja</label>
        <input id="tableInput" type="number" min="1" max="30" placeholder="Masukkan nomor meja">
      </div>
      <p class="muted" style="margin:-6px 0 14px;display:flex;gap:6px;align-items:flex-start;">${ic('info',14)} <span>Scan QR di meja untuk mengisi otomatis.</span></p>
      <button class="btn btn-primary" onclick="submitTable()">Lanjutkan ${ic('arrow-right',16)}</button>
    </div>
    <div class="link-note">
      <p class="muted">Punya lapak?<br><a href="${SELLER_SITE_URL}" target="_blank">Masuk sebagai penjual →</a></p>
    </div>
  </div>`;
  mountIcons();
}

async function submitTable(){
  const v = document.getElementById('tableInput').value;
  if(!v || v < 1){ alert('Isi nomor meja dulu ya.'); return; }
  localStorage.setItem('lapak_table', v);
  const loc = await getLocationOnce(2500); // opsional, tidak menahan navigasi lama-lama
  if(loc) lsSetJSON('lapak_location', loc);
  goTo('/toko/', {table:v});
}

(async function init(){
  const params = new URLSearchParams(location.search);
  const t = params.get('table');

  const activeId = getActiveOrderId();
  if(activeId){
    const order = await sGet('order:' + activeId, true);
    if(order && order.status !== 'selesai' && order.status !== 'dibatalkan'){
      goTo('/pesanan/', {orderId: activeId});
      return;
    } else {
      clearActiveOrder();
    }
  }

  if(t){
    localStorage.setItem('lapak_table', t);
    goTo('/toko/', {table:t});
    return;
  }
  renderMejaForm();
})();
