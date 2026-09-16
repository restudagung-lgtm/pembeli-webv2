/*
  plan.js
  -------
  Aturan paket toko: gratis (free) vs premium.

  Karena aplikasi ini tidak punya sistem pembayaran berlangganan otomatis
  (tidak ada payment gateway/API pihak ketiga yang tersambung), status
  premium DIKELOLA MANUAL oleh admin alun-alun lewat halaman /toko/ di web
  admin -- misalnya setelah penjual bayar langganan secara langsung/transfer
  ke pengelola alun-alun. Ini bukan billing otomatis, cuma saklar status
  yang admin nyalakan/matikan, dengan tanggal kedaluwarsa opsional.

  Field yang dipakai di data toko (store):
  - store.plan          : 'free' (default) atau 'premium'
  - store.premiumUntil  : timestamp (ms) kapan status premium berakhir,
                           atau null/kosong kalau premium permanen (misal
                           dikasih manual oleh admin tanpa batas waktu).
*/

const FREE_MENU_LIMIT = 5;
const PREMIUM_DEFAULT_DAYS = 30;

function isPremium(store){
  if(!store || store.plan !== 'premium') return false;
  if(store.premiumUntil && store.premiumUntil < Date.now()) return false; // sudah lewat, dianggap balik ke free
  return true;
}

function menuLimitFor(store){
  return isPremium(store) ? Infinity : FREE_MENU_LIMIT;
}

function premiumBadge(store){
  if(!isPremium(store)) return '';
  return `<span class="premium-badge">${ic('crown',12)} Premium</span>`;
}

function planExpiryLabel(store){
  if(!store || store.plan !== 'premium') return null;
  if(!store.premiumUntil) return 'Premium (tanpa batas waktu)';
  const d = new Date(store.premiumUntil);
  const expired = store.premiumUntil < Date.now();
  return (expired ? 'Premium berakhir ' : 'Premium aktif sampai ') + d.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
}
