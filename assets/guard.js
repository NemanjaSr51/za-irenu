/* Runs first on every inner page: no key on this device -> back to the gate (index.html), remembering where she was headed. */
(function () {
  var KEY = 'irena-kljuc', OK = '1711121935972527';
  try { if (localStorage.getItem(KEY) === OK) return; } catch (e) {}
  try { sessionStorage.setItem('irena-dalje', location.href); } catch (e) {}
  document.documentElement.style.visibility = 'hidden';
  location.replace('index.html');
})();
