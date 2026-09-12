/*
  nav.js
  ------
  Bar navigasi bawah (Beranda / Pesanan), dipasang cuma di halaman /toko/
  dan /pesanan-saya/ -- dua "tab utama" ala aplikasi pesan makanan. Halaman
  lain (menu, keranjang, checkout, pesanan) sengaja tanpa tab bawah supaya
  fokus ke satu alur, sama seperti aplikasi GoFood/ShopeeFood saat sedang
  di dalam toko / proses checkout.
*/
function bottomNav(active){
  const table = ctxParam('table', 'lapak_table', false) || localStorage.getItem('lapak_table') || '';
  return `<div class="tabbar tabbar-2">
    <button class="${active==='home'?'active':''}" onclick="goTo('/toko/',{table:'${table}'})">${ic('home',20)}<span>Beranda</span></button>
    <button class="${active==='orders'?'active':''}" onclick="goTo('/pesanan-saya/')">${ic('receipt',20)}<span>Pesanan</span></button>
  </div>`;
}
