/*
  nav.js
  ------
  Bar navigasi bawah (Beranda / Favorit / Pesanan), dipasang di halaman
  /toko/, /favorit/, dan /pesanan-saya/ -- tiga "tab utama" ala aplikasi
  pesan makanan. Halaman lain (menu, keranjang, checkout, pesanan) sengaja
  tanpa tab bawah supaya fokus ke satu alur.
*/
function bottomNav(active){
  const table = ctxParam('table', 'lapak_table', false) || localStorage.getItem('lapak_table') || '';
  return `<div class="tabbar tabbar-eq">
    <button class="${active==='home'?'active':''}" onclick="goTo('/toko/',{table:'${table}'})">${ic('home',20)}<span>Beranda</span></button>
    <button class="${active==='favorit'?'active':''}" onclick="goTo('/favorit/',{table:'${table}'})">${ic('heart',20)}<span>Favorit</span></button>
    <button class="${active==='orders'?'active':''}" onclick="goTo('/pesanan-saya/')">${ic('receipt',20)}<span>Pesanan</span></button>
  </div>`;
}
