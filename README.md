# Lapak Alun-Alun — Web Pembeli

Situs untuk pembeli: scan QR di meja → pilih lapak → pilih menu → bayar →
pantau status pesanan. Dibangun tanpa proses build (HTML/CSS/JS polos) +
Firebase (Firestore untuk data, Storage untuk foto).

## Struktur folder

Setiap layar adalah **halaman HTML sungguhan** di folder sendiri, bukan satu
halaman yang isinya diganti-ganti lewat JavaScript:

```
pembeli-web/
├── index.html          halaman utama: isi/scan nomor meja
├── meja.js              skrip untuk index.html
├── toko/
│   ├── index.html       daftar lapak (diurutkan dari yang terdekat)
│   └── toko.js
├── menu/
│   ├── index.html       menu dari satu lapak
│   └── menu.js
├── keranjang/
│   ├── index.html       keranjang belanja
│   └── keranjang.js
├── checkout/
│   ├── index.html       pilih metode bayar (Tunai / QRIS)
│   └── checkout.js
├── pesanan/
│   ├── index.html       status & lacak satu pesanan (bisa dibatalkan/kasih rating)
│   └── pesanan.js
├── pesanan-saya/
│   ├── index.html       riwayat pesanan dari perangkat ini
│   └── pesanan-saya.js
└── shared/               file yang dipakai bersama semua halaman di atas
    ├── firebase-config.js
    ├── storage.js
    ├── utils.js          fungsi bantu umum, ikon, QRIS dinamis, rating, dst.
    ├── cart.js           keranjang belanja (localStorage per toko)
    ├── nav.js             bar navigasi bawah (Beranda / Pesanan)
    ├── paths.js           BASE_PATH & fungsi pindah halaman (goTo/pageUrl)
    ├── site-config.js     alamat web PENJUAL
    └── style.css
```

Karena berpindah halaman = berpindah dokumen HTML sungguhan (bukan SPA),
data yang perlu dibawa antar halaman (nomor meja, toko yang dipilih, isi
keranjang, id pesanan) dititipkan lewat **parameter URL** (`?table=5`) dan
**localStorage** sebagai cadangan kalau parameter URL-nya hilang (misalnya
pembeli menekan tombol back atau membuka ulang halaman).

## PENTING: `BASE_PATH` di `shared/paths.js`

Karena semua tombol/link di sini memakai path seperti `/toko/`, `/menu/`,
dst., situs ini perlu tahu di subfolder mana dia berjalan kalau di-deploy
lewat **GitHub Pages project site** (`https://username.github.io/nama-repo/`).

Buka `shared/paths.js`, ada baris:

```js
const BASE_PATH = '/pembeli-web';
```

- Kalau nama repo GitHub kamu **persis** `pembeli-web`, biarkan seperti itu.
- Kalau nama repo kamu **beda**, ganti jadi `/nama-repo-kamu`.
- Kalau kamu pakai **domain sendiri** (custom domain) atau hosting yang
  filenya ada di root (Netlify, Vercel, Firebase Hosting root), ganti jadi
  string kosong: `const BASE_PATH = '';`

## Setup sebelum dipakai

1. **Firebase**: isi `shared/firebase-config.js` dengan konfigurasi project
   Firebase kamu (lihat komentar di dalam file itu untuk panduan lengkap).
2. **Firebase Storage**: aktifkan di Firebase Console (Build → Storage →
   Get started) supaya fitur unggah foto (foto toko, foto menu, QRIS) jalan.
3. **Alamat web penjual**: isi `shared/site-config.js` dengan alamat situs
   penjual kamu setelah di-deploy.
4. **Deploy**: push folder ini ke sebuah repo GitHub, aktifkan GitHub Pages
   (Settings → Pages → source: branch `main`, folder `/root`), lalu cek
   `BASE_PATH` di atas sudah cocok dengan nama repo-nya.

## Retensi nota pesanan (30 hari)

Nota pesanan (baik yang tersimpan di Firestore maupun riwayat lokal di
"Pesanan Saya") otomatis dianggap kedaluwarsa setelah 30 hari — lihat
`shared/cleanup.js` untuk detail cara kerja & keterbatasannya (dipicu saat
halaman pesanan penjual/admin dibuka, bukan proses latar belakang 24 jam).

## Kalau upload foto gagal (di web penjual)

Web pembeli ini tidak mengunggah foto sendiri, tapi kalau foto toko/menu/
QRIS yang diunggah lewat web **penjual** tidak muncul, itu biasanya karena
Firebase Storage Rules — lihat komentar troubleshooting lengkap di
`shared/firebase-config.js` (berlaku sama karena semua situs memakai
project Firebase yang sama).

## Alur data (ringkas)

- Semua data toko/menu/pesanan disimpan di Firestore lewat `shared/storage.js`
  (koleksi tunggal bernama `kv`, key-value).
- Foto diunggah ke Firebase Storage lewat `sUploadImage()`.
- QRIS: kalau penjual mengunggah foto QRIS yang berhasil dibaca otomatis
  (`shared/utils.js` → `decodeQRISFromFile`, `buildDynamicQRIS`), nominal
  transaksi akan otomatis disisipkan ke kode QR sebelum ditampilkan ke
  pembeli — jadi satu kode QRIS bisa langsung dipindai GoPay/OVO/DANA/
  ShopeePay/m-banking apa pun dengan nominal yang sudah pas.
