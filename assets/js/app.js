/* =================================
   E-PRESENSI ESPANSA
   JavaScript Utama
   ================================= */

const APP_CONFIG = {
  nama: "E-PRESENSI ESPANSA",
  sekolah: "SMP Negeri 1 Panawangan",
  versi: "1.0.0",
  lingkungan: "WEB",
  zonaWaktu: "Asia/Jakarta"
};

document.addEventListener("DOMContentLoaded", () => {
  console.log(APP_CONFIG.nama);
  console.log("Versi:", APP_CONFIG.versi);
  console.log("Lingkungan:", APP_CONFIG.lingkungan);
});
