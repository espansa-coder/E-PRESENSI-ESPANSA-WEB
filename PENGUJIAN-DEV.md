# Panduan Pengujian Frontend DEV — E-PRESENSI ESPANSA v1.1.0

## Tujuan
Menguji alur login dan penggantian password wajib pada branch `feature/forced-password-change-dev` tanpa mengubah branch `main` dan tanpa menerbitkan perubahan ke GitHub Pages produksi.

## Lingkungan
- Frontend: branch `feature/forced-password-change-dev`
- Backend: Apps Script Web App DEV
- Akun uji: `admin.dev` (jangan tulis password ke dokumentasi, chat, atau tangkapan layar)
- Password baru hanya dimasukkan langsung pada halaman uji.

## Menjalankan secara lokal melalui localhost
1. Buka halaman branch di GitHub:
   https://github.com/espansa-coder/E-PRESENSI-ESPANSA-WEB/tree/feature/forced-password-change-dev
2. Pilih **Code → Download ZIP**, lalu ekstrak ZIP ke komputer.
3. Pastikan folder hasil ekstraksi memuat `login.html`, `ganti-password.html`, dan folder `assets`.
4. Jalankan server lokal dari folder tersebut. Pilih salah satu:
   - **VS Code + Live Server**: buka folder hasil ekstraksi di VS Code, klik kanan `login.html`, pilih **Open with Live Server**.
   - **Python**: buka PowerShell pada folder hasil ekstraksi, jalankan `py -m http.server 8000`, lalu buka http://localhost:8000/login.html.
5. Pastikan alamat halaman menggunakan `localhost` (bukan membuka file dengan awalan `file://`).

## Skenario pengujian
1. Buka `login.html` melalui localhost.
2. Login menggunakan akun uji DEV yang memang berstatus wajib ganti password.
3. Pastikan login mengarahkan pengguna ke `ganti-password.html`.
4. Uji validasi sisi browser: kolom kosong, password kurang dari 8 karakter, lebih dari 72 byte UTF-8, konfirmasi berbeda, dan password baru sama dengan password lama.
5. Masukkan password baru yang valid. Pastikan server menerima perubahan dan halaman mengarahkan kembali ke login.
6. Login ulang menggunakan password baru. Pastikan login berhasil dan tidak lagi diarahkan ke halaman ganti password.

## Catatan keamanan dan batas pengujian
- Jangan mengirim password lama atau password baru melalui chat, issue, commit, atau screenshot.
- Jangan gunakan akun produksi.
- Jangan menguji berulang kali dengan password yang tidak pasti; ikuti kebijakan penguncian akun.
- Jika ada kegagalan, catat kode/pesan error tanpa menyertakan nilai password, token sesi, atau data rahasia.
- Pengujian ini menggunakan backend DEV yang dikonfigurasi di `assets/js/api.js`.
- Branch ini belum digabung ke `main`; GitHub Pages utama tidak berubah.
