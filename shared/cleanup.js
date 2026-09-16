/*
  cleanup.js
  ----------
  Kebijakan retensi 30 hari untuk riwayat pesanan (nota transaksi).

  CATATAN JUJUR soal "otomatis": karena situs ini murni file statis tanpa
  server/backend sendiri (tidak ada Cloud Function terjadwal), tidak ada
  proses yang benar-benar jalan sendiri di latar belakang 24 jam. Yang bisa
  dilakukan dari sisi web statis begini adalah membersihkan data yang sudah
  lewat 30 hari SETIAP KALI seseorang membuka halaman daftar pesanan (admin
  atau penjual) -- jadi "otomatis" di sini artinya "otomatis saat halaman
  terkait dibuka", bukan latar belakang terus-menerus tanpa ada yang buka
  situsnya sama sekali.

  Kalau suatu saat mau retensi yang benar-benar berjalan sendiri tanpa
  bergantung ada yang buka situs, itu perlu Firebase Cloud Functions dengan
  jadwal (Cloud Scheduler) di paket Blaze -- di luar cakupan situs statis
  ini, tapi bisa ditambahkan terpisah kalau dibutuhkan.
*/

const ORDER_RETENTION_DAYS = 30;
const PURGE_THROTTLE_MS = 6 * 60 * 60 * 1000; // jangan lebih sering dari tiap 6 jam per perangkat

/*
  purgeOldOrders()
  -----------------
  Hapus dokumen pesanan yang lebih tua dari ORDER_RETENTION_DAYS hari.
  Dibatasi (throttle) lewat localStorage supaya tidak boros baca Firestore
  setiap kali halaman dibuka -- cukup dicoba tiap beberapa jam sekali per
  perangkat yang membuka halaman pesanan.
*/
async function purgeOldOrders(){
  const THROTTLE_KEY = 'lapak_last_purge';
  const last = Number(localStorage.getItem(THROTTLE_KEY) || 0);
  if(Date.now() - last < PURGE_THROTTLE_MS) return { skipped:true };
  localStorage.setItem(THROTTLE_KEY, String(Date.now()));

  const cutoff = Date.now() - ORDER_RETENTION_DAYS*24*60*60*1000;
  let deleted = 0;
  try{
    const keys = await sList('order:', true);
    for(const k of keys){
      const o = await sGet(k, true);
      if(o && o.createdAt && o.createdAt < cutoff){
        await sDel(k, true);
        deleted++;
      }
    }
  }catch(e){
    console.error('purgeOldOrders error:', e);
  }
  return { skipped:false, deleted };
}
