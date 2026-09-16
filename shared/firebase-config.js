/*
  GANTI SEMUA NILAI DI BAWAH INI dengan config project Firebase kamu sendiri.

  Cara ambil config:
  1. Buka https://console.firebase.google.com -> buat/pilih project.
  2. Klik ikon gerigi (Project settings) di kiri atas.
  3. Scroll ke bagian "Your apps" -> klik ikon web ( </> ) untuk daftarkan app web baru.
  4. Firebase akan menampilkan objek firebaseConfig -> salin ke bawah ini.
  5. Aktifkan Firestore: menu kiri "Build" -> "Firestore Database" -> "Create database"
     -> pilih lokasi server terdekat (misal asia-southeast2 / Jakarta) -> mulai di "test mode" dulu.

  Untuk fitur unggah foto (foto toko, foto menu, QRIS), aktifkan juga Firebase Storage:
  menu kiri "Build" -> "Storage" -> "Get started" -> mulai di "test mode".

  ==========================================================================
  KALAU UPLOAD FOTO GAGAL / TIDAK MUNCUL (error di console: "storage/unauthorized"
  atau "Firebase Storage: User does not have permission"):
  ==========================================================================
  Ini HAMPIR SELALU karena Storage Security Rules default Firebase mewajibkan
  login (request.auth != null) -- padahal aplikasi Lapak Alun-Alun ini TIDAK
  memakai Firebase Authentication sama sekali (login penjual/admin cuma
  dicek manual lewat data di Firestore, bukan lewat sistem auth Firebase).
  Akibatnya semua upload otomatis ditolak oleh Storage.

  Perbaikannya:
  1. Buka https://console.firebase.google.com -> pilih project ini.
  2. Menu kiri "Build" -> "Storage" -> tab "Rules" di bagian atas.
  3. Ganti isinya jadi:

       rules_version = '2';
       service firebase.storage {
         match /b/{bucket}/o {
           match /{allPaths=**} {
             allow read, write: if true;
           }
         }
       }

  4. Klik "Publish".

  CATATAN: aturan "if true" ini artinya siapa pun yang tahu alamat project
  Firebase kamu bisa upload/hapus file di Storage -- sama seperti Firestore
  "test mode" yang juga terbuka. Ini level wajar untuk prototipe/skala
  warung kecil (karena aplikasi ini memang tidak punya sistem login
  Firebase Auth sungguhan), tapi kalau suatu saat mau lebih aman, perlu
  ditambah Firebase Authentication + Rules yang mengecek identitas
  penggunanya, bukan cuma "if true".

  Lihat README.md untuk panduan lengkap langkah demi langkah + aturan keamanan Firestore/Storage.
*/
const firebaseConfig = {
   apiKey: "AIzaSyAZq7NS68p54bGpM1C8m86pFybEul0WnPQ",
  authDomain: "lapak-alunalun.firebaseapp.com",
  projectId: "lapak-alunalun",
  storageBucket: "lapak-alunalun.firebasestorage.app",
  messagingSenderId: "465227413068",
  appId: "1:465227413068:web:4641e234eaacf5946ae6e9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
