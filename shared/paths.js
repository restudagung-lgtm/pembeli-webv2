/*
  paths.js
  --------
  Situs pembeli sekarang terdiri dari beberapa HALAMAN TERPISAH (bukan satu
  halaman yang isinya diganti-ganti lewat JavaScript), satu folder untuk
  setiap layar: /toko/, /menu/, /keranjang/, /checkout/, /pesanan/,
  /pesanan-saya/, dan halaman utama (isi nomor meja) di root "/".

  Karena berpindah halaman = berpindah dokumen HTML sungguhan, data yang
  perlu dibawa (nomor meja, toko yang dipilih, id pesanan) dititipkan lewat
  parameter URL (?table=5&storeId=abc) dan/atau localStorage sebagai
  cadangan kalau parameter URL-nya tidak ada (misalnya pembeli reload
  halaman atau buka lewat tombol back).
*/

// BASE_PATH dipakai kalau situs ini di-deploy di dalam subfolder, misalnya
// GitHub Pages "project site" (https://username.github.io/nama-repo/...).
// Kalau situsnya ada di root domain sendiri (domain custom atau Firebase
// Hosting), ganti jadi string kosong ''.
//
// Nilai di bawah ini SUDAH disesuaikan dengan alamat GitHub Pages yang
// tertulis di shared/site-config.js (.../pembeli-web/). Kalau nama repo
// GitHub kamu berbeda, atau kamu pindah ke domain custom, ganti nilai ini.
const BASE_PATH = '/pembeli-webv2';

/*
  pageUrl('/menu/', {storeId:'abc', table:'5'})
  -> '/menu/?storeId=abc&table=5'
*/
function pageUrl(path, params){
  let qs = '';
  if(params){
    const entries = Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '');
    if(entries.length) qs = '?' + new URLSearchParams(entries).toString();
  }
  return BASE_PATH + path + qs;
}

/*
  ctxParam('table', 'lapak_table')
  -----------------------------------
  Ambil nilai dari parameter URL kalau ada (dan simpan ke localStorage
  supaya bisa dipakai lagi di halaman lain / kalau di-reload). Kalau
  parameter URL tidak ada, coba ambil dari localStorage sebagai cadangan.
*/
function ctxParam(name, storageKey, persist){
  const params = new URLSearchParams(location.search);
  const v = params.get(name);
  if(v){
    if(persist !== false && storageKey) localStorage.setItem(storageKey, v);
    return v;
  }
  return storageKey ? localStorage.getItem(storageKey) : null;
}

function goTo(path, params){
  location.href = pageUrl(path, params);
}
