/*
  cart.js
  -------
  Keranjang belanja disimpan per toko di localStorage (bukan cuma di memori),
  supaya isinya tidak hilang saat pembeli berpindah dari /menu/ ke /keranjang/
  ke /checkout/ -- karena sekarang itu 3 halaman terpisah, bukan satu halaman
  yang statenya otomatis nyambung.

  Bentuk data: { [menuId]: { qty: number, menu: {...salinan data menu} } }
*/
function cartKey(storeId){ return 'lapak_cart_' + storeId; }

function getCart(storeId){
  return lsGetJSON(cartKey(storeId), {});
}
function setCart(storeId, cart){
  lsSetJSON(cartKey(storeId), cart);
}
function clearCart(storeId){
  localStorage.removeItem(cartKey(storeId));
}
function cartTotals(cart){
  const qty = Object.values(cart).reduce((a,c) => a + c.qty, 0);
  const price = Object.values(cart).reduce((a,c) => a + c.qty * (c.menu ? c.menu.price : 0), 0);
  return {qty, price};
}

/*
  findActiveCart()
  -----------------
  Cari keranjang toko mana pun di perangkat ini yang masih ada isinya.
  Dipakai untuk menampilkan ikon keranjang + badge di topbar halaman
  /toko/ (di luar konteks satu toko tertentu). Kalau ada lebih dari satu
  keranjang aktif (jarang terjadi -- misalnya sempat isi keranjang di dua
  toko berbeda), cukup ambil salah satu duluan.
*/
function findActiveCart(){
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.indexOf('lapak_cart_') === 0){
      const storeId = key.slice('lapak_cart_'.length);
      const cart = lsGetJSON(key, {});
      const t = cartTotals(cart);
      if(t.qty > 0) return { storeId, cart, qty:t.qty, price:t.price };
    }
  }
  return null;
}
