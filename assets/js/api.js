/* E-PRESENSI ESPANSA - klien API bersama. Dipakai semua halaman portal.
 * Alamat Web App hanya ada di sini. Jangan menaruh password, kunci, atau token di file ini. */
(function (w) {
  'use strict';
  var EP = { API: 'https://script.google.com/macros/s/AKfycbzxlDM0vbjCH8MCDHafTl9njW3d4XW7fJJ8yY6OSjinWkEEF1wId5k8eMEUREedXCHZkw/exec', LOGIN: 'login.html' };

  function read() { try { return JSON.parse(sessionStorage.getItem('ep.sess')); } catch (e) { return null; } }
  EP.session = read;

  EP.api = function (action, payload) {
    var s = read();
    return fetch(EP.API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, token: s ? s.token : null, payload: payload || {} }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) {
          var e = new Error(j.error.message); e.code = j.error.code;
          if (e.code === 'SESI_BERAKHIR' && action !== 'login') EP.logout('Sesi berakhir. Silakan login kembali.', true);
          throw e;
        }
        return j.data;
      }, function (e) { e.net = true; e.message = 'Tidak dapat terhubung ke server.'; throw e; });
  };

  EP.login = function (username, password) {
    sessionStorage.removeItem('ep.sess');
    return EP.api('login', { username: username, password: password, clientId: 'portal-web' }).then(function (d) {
      sessionStorage.setItem('ep.sess', JSON.stringify({ token: d.token, user: d.user, mustChange: !!d.mustChange }));
      return d;
    });
  };

  EP.logout = function (msg, skipServer) {
    var done = function () {
      sessionStorage.removeItem('ep.sess');
      if (msg) sessionStorage.setItem('ep.msg', msg);
      location.replace(EP.LOGIN);
    };
    if (skipServer || !read()) return done();
    EP.api('logout', {}).then(done, done);
  };

  // Panggil di awal halaman terlindungi. Mengembalikan false (dan mengalihkan) jika belum login atau peran tidak sesuai.
  EP.requireLogin = function (roles) {
    var s = read();
    if (!s || !s.token || s.mustChange || (roles && roles.indexOf(s.user.role) < 0)) { location.replace(EP.LOGIN); return false; }
    return true;
  };
  w.EP = EP;
})(window);
