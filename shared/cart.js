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
