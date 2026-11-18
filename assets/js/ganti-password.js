/* =====================================================
 * E-PRESENSI ESPANSA
 * WAJIB GANTI PASSWORD
 * Versi 1.1.0 - WEB / DEV
 * ===================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('passwordForm');
    var currentInput = document.getElementById('currentPassword');
    var newInput = document.getElementById('newPassword');
    var confirmInput = document.getElementById('confirmPassword');
    var button = document.getElementById('passwordButton');
    var message = document.getElementById('passwordMessage');
    var logoutButton = document.getElementById('passwordLogout');

    function showMessage_(text) {
      message.textContent = text;
      message.hidden = false;
    }

    function clearMessage_() {
      message.textContent = '';
      message.hidden = true;
    }

    function setLoading_(loading) {
      button.disabled = loading;
      button.textContent = loading ? 'Menyimpan...' : 'Simpan Password Baru';
      form.setAttribute('aria-busy', loading ? 'true' : 'false');
    }

    function utf8ByteLength_(value) {
      if (window.TextEncoder) {
        return new TextEncoder().encode(value).length;
      }

      return unescape(encodeURIComponent(value)).length;
    }

    document.querySelectorAll('[data-toggle]').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var input = document.getElementById(toggle.getAttribute('data-toggle'));
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggle.textContent = show ? 'Sembunyikan' : 'Lihat';
        toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      });
    });

    if (!window.EP || !window.EP.requirePasswordChange ||
        !window.EP.requirePasswordChange()) {
      return;
    }

    currentInput.focus();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearMessage_();

      var currentPassword = currentInput.value;
      var newPassword = newInput.value;
      var confirmation = confirmInput.value;

      if (!currentPassword || !newPassword || !confirmation) {
        showMessage_('Semua kolom password wajib diisi.');
        return;
      }

      if (newPassword.length < 8) {
        showMessage_('Password baru minimal 8 karakter.');
        newInput.focus();
        return;
      }

      if (utf8ByteLength_(newPassword) > 72) {
        showMessage_('Password baru maksimal 72 byte UTF-8.');
        newInput.focus();
        return;
      }

      if (newPassword !== confirmation) {
        showMessage_('Konfirmasi password baru tidak sama.');
        confirmInput.focus();
        return;
      }

      if (newPassword === currentPassword) {
        showMessage_('Password baru harus berbeda dari password saat ini.');
        newInput.focus();
        return;
      }

      setLoading_(true);

      window.EP.changePassword(
        currentPassword,
        newPassword,
        confirmation
      )
      .then(function () {
        // Sesi browser dihapus agar pengguna harus login ulang.
        sessionStorage.removeItem('ep.sess');
        sessionStorage.setItem(
          'ep.msg',
          'Password berhasil diubah. Silakan login kembali menggunakan password baru.'
        );
        window.location.replace('login.html');
      })
      .catch(function (error) {
        showMessage_(
          error && error.message
            ? error.message
            : 'Password belum berhasil diubah. Silakan coba kembali.'
        );
        currentInput.value = '';
        currentInput.focus();
      })
      .finally(function () {
        setLoading_(false);
      });
    });

    logoutButton.addEventListener('click', function () {
      window.EP.logout('Anda telah keluar dari akun.');
    });
  });
})();
