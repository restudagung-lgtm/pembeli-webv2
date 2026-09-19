/*
  favorites.js
  ------------
  Favorit toko & menu, disimpan lokal per perangkat (localStorage) --
  sama seperti riwayat pesanan, karena situs pembeli ini tidak punya akun
  login, jadi "favorit" di sini sifatnya per-HP, bukan per-akun.
*/

function getFavStores(){
  return lsGetJSON('lapak_fav_stores', []);
}
function isFavStore(storeId){
  return getFavStores().includes(storeId);
}
function toggleFavStore(storeId){
  let list = getFavStores();
  if(list.includes(storeId)) list = list.filter(id => id !== storeId);
  else list.unshift(storeId);
  lsSetJSON('lapak_fav_stores', list);
  return list.includes(storeId);
}

function getFavMenus(){
  return lsGetJSON('lapak_fav_menus', []); // array of {storeId, menuId}
}
function isFavMenu(storeId, menuId){
  return getFavMenus().some(f => f.storeId === storeId && f.menuId === menuId);
}
function toggleFavMenu(storeId, menuId){
  let list = getFavMenus();
  const exists = list.some(f => f.storeId === storeId && f.menuId === menuId);
  if(exists) list = list.filter(f => !(f.storeId === storeId && f.menuId === menuId));
  else list.unshift({storeId, menuId});
  lsSetJSON('lapak_fav_menus', list);
  return !exists;
}
