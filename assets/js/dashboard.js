/* Menyambungkan dashboard.html ke backend: empat kartu ringkasan, nama pengguna, dan tombol Keluar.
 * Mencari elemen berdasarkan teks yang sudah ada di halaman (Total Siswa, Presensi Hari Ini, Belum Presensi,
 * Status Aplikasi, Keluar), jadi HTML dan CSS rancangan tidak perlu diubah. */
(function () {
  'use strict';
  if (!window.EP || !EP.requireLogin(['ADMIN', 'ADMIN_UTAMA'])) return;

  function leaves() { return Array.prototype.filter.call(document.querySelectorAll('body *'), function (e) { return e.children.length === 0; }); }
  function norm(e) { return (e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function leafIn(root, text) { var l = root.querySelectorAll('*'); for (var i = 0; i < l.length; i++) if (l[i].children.length === 0 && norm(l[i]) === text) return l[i]; return null; }

  // Kartu dicari lewat teks labelnya; nilai awal "—" diganti data dari server.
  var cache = {};
  function setCard(label, value, note, initial) {
    var el = cache[label];
    if (el && el.isConnected) { el.textContent = value; var n = cache[label + '#n']; if (n) n.textContent = note; return; }
    var lab = leaves().filter(function (e) { return norm(e) === label; })[0]; if (!lab) return;
    var box = lab.parentElement;
    for (var i = 0; i < 5 && box; i++, box = box.parentElement) {
      var v = leafIn(box, initial || '—') || (box.querySelector('[data-ep-val]'));
      if (v) {
        v.setAttribute('data-ep-val', '1'); v.textContent = value; cache[label] = v;
        var n = box.querySelector('[data-ep-note]') || leafIn(box, 'Data belum terhubung') || leafIn(box, 'Lingkungan pengembangan');
        if (n) { n.setAttribute('data-ep-note', '1'); n.textContent = note; cache[label + '#n'] = n; }
        return;
      }
    }
  }

  var sess = EP.session();
  leaves().forEach(function (e) {
    if (/^Selamat Datang, Administrator$/i.test(norm(e))) e.textContent = 'Selamat Datang, ' + sess.user.nama;
    if (norm(e) === 'Keluar') {
      var t = e.closest('a,button') || e;
      t.addEventListener('click', function (ev) { ev.preventDefault(); EP.logout(); });
    }
  });

  function load() {
    EP.api('admin.ringkasan').then(function (d) {
      var pct = d.totalSiswa ? Math.round(d.presensiHariIni * 100 / d.totalSiswa) : 0;
      setCard('Total Siswa', String(d.totalSiswa), 'Siswa aktif');
      setCard('Presensi Hari Ini', d.ada ? String(d.presensiHariIni) : '0', d.hariPresensi ? (d.ada ? 'Masuk, ' + pct + '% dari siswa aktif' : 'Belum ada scan hari ini') : 'Bukan hari presensi');
      setCard('Belum Presensi', d.ada ? String(d.belumPresensi + d.alpa) : '-', d.ada ? (d.alpa ? d.alpa + ' sudah ALPA' : 'Belum scan MASUK') : 'Menunggu data hari ini');
      setCard('Status Aplikasi', d.env, 'Build ' + d.build + (d.sesiAktif ? ' | Sesi ' + d.sesiAktif : ''), 'DEV');
    }).catch(function (e) {
      ['Total Siswa', 'Presensi Hari Ini', 'Belum Presensi'].forEach(function (l) { setCard(l, '-', e.message || 'Gagal memuat'); });
    });
  }
  load(); setInterval(load, 60000);
})();
