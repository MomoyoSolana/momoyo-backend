// 🔐 Validasi pengguna berdasarkan ID (bisa Telegram ID atau API Key)
function validateRequest(data) {
  const allowedIds = ['6431046364', '7281440075', '1470018858']; // Ganti dengan ID Telegram yang diizinkan
  return allowedIds.includes(String(data.userId));
}
