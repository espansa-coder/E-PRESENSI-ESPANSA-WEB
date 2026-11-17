
/* =====================================================
 * E-PRESENSI ESPANSA
 * API CLIENT
 * Versi 1.1.0 - WEB / DEV
 *
 * Komunikasi frontend dengan Apps Script.
 * Tidak menyimpan password atau hash password.
 * ===================================================== */

(function (w) {
  'use strict';

  var EP = {
    API: 'https://script.google.com/macros/s/AKfycbywI14T7RLrxfsPiO-hYiaHKHUNOYhUc2adha6vXUNX2LafVVlPpDNpcGUYVb1SlcUSVg/exec',
    LOGIN: 'login.html'
  };

  var memoryDeviceId = null;

  // ==========================================
  // 1. SESSION STORAGE
  // ==========================================

  function readSession_() {
    try {
      return JSON.parse(
        sessionStorage.getItem('ep.sess')
      );
    } catch (error) {
      return null;
    }
  }

  EP.session = readSession_;

  // ==========================================
  // 2. RANDOM TOKEN
  // ==========================================

  function randomHex_(byteLength) {
    if (
      !w.crypto ||
      typeof w.crypto.getRandomValues !== 'function'
    ) {
      throw new Error(
        'Browser tidak mendukung pembangkit token aman.'
      );
    }

    var bytes = new Uint8Array(byteLength);
    w.crypto.getRandomValues(bytes);

    return Array.from(bytes)
      .map(function (byte) {
        return byte.toString(16).padStart(2, '0');
      })
      .join('');
  }

  function createSessionToken_() {
    // 32 byte = 64 karakter hexadecimal.
    return randomHex_(32);
  }

  // ==========================================
  // 3. DEVICE ID
  // ==========================================

  function getDeviceId_() {
    var key = 'ep.deviceId';
    var deviceId = null;

    try {
      deviceId = localStorage.getItem(key);

      if (deviceId) {
        return deviceId;
      }
    } catch (error) {
      // Lanjutkan ke sessionStorage.
    }

    try {
      deviceId = sessionStorage.getItem(key);

      if (deviceId) {
        return deviceId;
      }
    } catch (error) {
      // Lanjutkan ke pembuatan ID baru.
    }

    if (memoryDeviceId) {
      return memoryDeviceId;
    }

    deviceId = 'WEB-' + randomHex_(16);
    memoryDeviceId = deviceId;

    try {
      localStorage.setItem(key, deviceId);
    } catch (error) {
      try {
        sessionStorage.setItem(key, deviceId);
      } catch (storageError) {
        // ID tetap tersedia selama halaman terbuka.
      }
    }

    return deviceId;
  }

  EP.deviceId = getDeviceId_;

  // ==========================================
  // 4. REQUEST API
  // ==========================================

  function request_(action, payload, token) {
    return fetch(EP.API, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify({
        action: action,
        token: token || null,
        payload: payload || {}
      })
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (!result || result.ok !== true) {
        var error = new Error(
          result &&
          result.error &&
          result.error.message
            ? result.error.message
            : 'Permintaan ke server gagal.'
        );

        error.code =
          result &&
          result.error &&
          result.error.code
            ? result.error.code
            : 'REQUEST_FAILED';

        throw error;
      }

      return result.data;
    })
    .catch(function (error) {
      if (error && error.code) {
        throw error;
      }

      var networkError = new Error(
        'Tidak dapat terhubung ke server. Periksa koneksi internet.'
      );

      networkError.net = true;
      networkError.originalError = error;

      throw networkError;
    });
  }

  // API umum untuk seluruh halaman.
  EP.api = function (action, payload) {
    var session = readSession_();

    return request_(
      action,
      payload,
      session ? session.token : null
    )
    .catch(function (error) {
      if (
        error.code === 'SESI_BERAKHIR' &&
        action !== 'logout'
      ) {
        EP.logout(
          'Sesi berakhir. Silakan login kembali.',
          true
        );
      }

      throw error;
    });
  };

  // ==========================================
  // 5. TEST PING
  // ==========================================

  EP.testPing = function () {
    return request_('PING', {}, null);
  };

  // ==========================================
  // 6. LOGIN
  // ==========================================

  EP.login = function (username, password, options) {
    options = options || {};

    if (
      typeof username !== 'string' ||
      !username.trim()
    ) {
      return Promise.reject(
        new Error('Username harus diisi.')
      );
    }

    if (
      typeof password !== 'string' ||
      !password
    ) {
      return Promise.reject(
        new Error('Password harus diisi.')
      );
    }

    // Hapus sesi browser sebelumnya.
    sessionStorage.removeItem('ep.sess');

    var deviceId;

    try {
      deviceId = getDeviceId_();
    } catch (error) {
      return Promise.reject(error);
    }

    var loginSource = options.source || 'WEB';

    // Tahap pertama: meminta challenge.
    return request_(
      'CHALLENGE',
      {
        username: username,
        deviceId: deviceId,
        source: loginSource
      },
      null
    )
    .then(function (challenge) {
      if (
        !challenge ||
        !challenge.challengeId
      ) {
        throw new Error(
          'Server tidak memberikan challenge login.'
        );
      }

      // Token sesi dibuat menggunakan Web Crypto.
      var sessionToken = createSessionToken_();

      var loginPayload = {
        username: username,
        password: password,
        challengeId: challenge.challengeId,
        deviceId: deviceId,
        sessionToken: sessionToken,
        source: loginSource
      };

      // Device key hanya dikirim jika tersedia.
      if (options.deviceKey) {
        loginPayload.deviceKey = options.deviceKey;
      }

      // Tahap kedua: mengirim permintaan login.
      return request_(
        'LOGIN',
        loginPayload,
        null
      );
    })
    .then(function (data) {
      if (!data || !data.token || !data.user) {
        throw new Error(
          'Respons login dari server tidak lengkap.'
        );
      }

      // Simpan token sesi dan informasi pengguna.
      sessionStorage.setItem(
        'ep.sess',
        JSON.stringify({
          token: data.token,
          user: data.user,
          mustChange: !!data.mustChange
        })
      );

      return data;
    });
  };

  // ==========================================
  // 7. LOGOUT
  // ==========================================

  EP.logout = function (message, skipServer) {
    function finishLogout_() {
      sessionStorage.removeItem('ep.sess');

      if (message) {
        sessionStorage.setItem('ep.msg', message);
      }

      w.location.replace(EP.LOGIN);
    }

    if (skipServer || !readSession_()) {
      finishLogout_();
      return;
    }

    EP.api('LOGOUT', {})
      .then(finishLogout_)
      .catch(finishLogout_);
  };

  // ==========================================
  // 8. CHANGE PASSWORD
  // ==========================================

  EP.changePassword = function (
    currentPassword,
    newPassword,
    confirmation
  ) {
    return EP.api('CHANGE_PASSWORD', {
      currentPassword: currentPassword,
      newPassword: newPassword,
      confirmation: confirmation
    });
  };

  // ==========================================
  // 9. LOGIN GUARD
  // ==========================================

  EP.requireLogin = function (roles) {
    var session = readSession_();

    if (
      !session ||
      !session.token ||
      session.mustChange ||
      (
        roles &&
        roles.indexOf(session.user.role) < 0
      )
    ) {
      w.location.replace(EP.LOGIN);
      return false;
    }

    return true;
  };

  // ==========================================
  // 10. PUBLIC API
  // ==========================================

  w.EP = EP;

})(window);
