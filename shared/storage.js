/*
  storage.js
  ----------
  Semua bagian lain dari aplikasi (customer.js, seller.js, admin.js, app.js) HANYA
  memanggil fungsi-fungsi ini untuk baca/tulis data: sGet, sSet, sList, sDel,
  dan sUploadImage untuk unggah foto. Itu sengaja dibuat begitu dari awal, supaya
  kalau suatu saat kamu mau ganti "mesin" penyimpanan lagi (misalnya dari Firebase
  ke Supabase, atau ke backend sendiri), cukup ubah isi file ini saja — file lain
  tidak perlu disentuh.

  Cara kerja saat ini:
  - Semua data (toko, menu, pesanan, akun penjual, pengaturan) disimpan
    sebagai satu koleksi Firestore bernama "kv" (key-value), satu dokumen
    per key, isinya field "value" berupa JSON string.
  - Foto (foto toko, foto menu, foto QRIS) diunggah ke Firebase Storage lewat
    sUploadImage(), hasilnya berupa URL yang lalu disimpan sebagai field biasa
    di dalam data toko/menu (misalnya store.photoURL).
  - Khusus key "session" (dipakai untuk mengingat login penjual/admin di HP itu
    saja), disimpan di localStorage browser, BUKAN ke Firestore — karena
    sifatnya memang per-perangkat, bukan data bersama.

  PENTING soal foto: fitur ini butuh Firebase Storage aktif di project kamu.
  1. Buka https://console.firebase.google.com -> pilih project -> menu kiri
     "Build" -> "Storage" -> "Get started" -> pilih lokasi server yang sama
     dengan Firestore -> mulai di "test mode" dulu supaya cepat jalan.
  2. Kalau project baru (paket Spark/gratis) diminta upgrade ke paket Blaze,
     itu wajar dari Firebase untuk mengaktifkan Storage -- kuota gratis
     bulanannya tetap ada, jadi untuk skala warung/lapak biasanya tidak kena biaya.
  3. Lihat README.md untuk contoh Storage Rules yang lebih aman sebelum dipakai sungguhan.
*/

const KV_COLLECTION = 'kv';

async function sGet(key, shared){
  if(key === 'session'){
    const v = localStorage.getItem('session');
    return v ? JSON.parse(v) : null;
  }
  try{
    const doc = await db.collection(KV_COLLECTION).doc(key).get();
    if(!doc.exists) return null;
    return JSON.parse(doc.data().value);
  }catch(e){
    console.error('sGet error:', key, e);
    return null;
  }
}

async function sSet(key, val, shared){
  if(key === 'session'){
    localStorage.setItem('session', JSON.stringify(val));
    return true;
  }
  try{
    await db.collection(KV_COLLECTION).doc(key).set({
      value: JSON.stringify(val),
      updatedAt: Date.now()
    });
    return true;
  }catch(e){
    console.error('sSet error:', key, e);
    return false;
  }
}

async function sDel(key, shared){
  if(key === 'session'){
    localStorage.removeItem('session');
    return;
  }
  try{
    await db.collection(KV_COLLECTION).doc(key).delete();
  }catch(e){
    console.error('sDel error:', key, e);
  }
}

async function sList(prefix, shared){
  try{
    const end = prefix + '\uf8ff';
    const snap = await db.collection(KV_COLLECTION)
      .where(firebase.firestore.FieldPath.documentId(), '>=', prefix)
      .where(firebase.firestore.FieldPath.documentId(), '<', end)
      .get();
    return snap.docs.map(d => d.id);
  }catch(e){
    console.error('sList error:', prefix, e);
    return [];
  }
}

/*
  sUploadImage(path, blob)
  -------------------------
  Unggah satu file/blob gambar ke Firebase Storage di lokasi "path"
  (contoh: 'stores/abc123/photo.jpg'), lalu kembalikan URL publik untuk
  disimpan di data toko/menu.

  PENTING: fungsi ini SENGAJA tidak menelan error-nya sendiri (tidak ada
  try/catch di sini) -- errornya dilempar apa adanya ke pemanggil supaya
  pesan aslinya bisa ditampilkan ke pengguna. Penyebab paling umum upload
  gagal adalah Storage Security Rules default Firebase yang mewajibkan
  login (request.auth != null), padahal aplikasi ini tidak memakai Firebase
  Authentication. Lihat komentar di firebase-config.js untuk aturan yang
  perlu dipasang di Firebase Console -> Storage -> Rules.
*/
async function sUploadImage(path, blob){
  if(typeof firebase.storage !== 'function'){
    throw new Error('Firebase Storage belum dimuat -- cek apakah script firebase-storage-compat.js ada di index.html halaman ini.');
  }
  const ref = firebase.storage().ref().child(path);
  await ref.put(blob, { contentType: blob.type || 'image/jpeg' });
  return await ref.getDownloadURL();
}

/*
  sDeleteImage(path)
  -------------------
  Hapus file gambar lama di Storage (dipanggil saat foto diganti/dihapus).
  Di sini boleh diam-diam gagal (misalnya file memang sudah tidak ada) --
  kegagalan hapus foto lama bukan hal fatal buat pengguna.
*/
async function sDeleteImage(path){
  try{
    if(typeof firebase.storage !== 'function' || !path) return;
    await firebase.storage().ref().child(path).delete();
  }catch(e){
    console.warn('sDeleteImage gagal (diabaikan):', path, e);
  }
}
