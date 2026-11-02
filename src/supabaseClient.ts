// Google Sheets via Google Apps Script (Web App) Database Adapter for SISPER
// Supports dynamic Web App URL configuration via localStorage or VITE_APPS_SCRIPT_URL env var

const STORAGE_KEY_URL = 'sisper_apps_script_url';

export function getAppsScriptUrl(): string {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  if (saved && saved.trim().startsWith('https://script.google.com/')) {
    return saved.trim();
  }
  const envUrl = (import.meta as any).env?.VITE_APPS_SCRIPT_URL || '';
  return envUrl.trim();
}

export function setAppsScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const clean = url.trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEY_URL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }
    cachedSnapshot = null;
  }
}

// Local Fallback / Seed Data when Google Sheets URL is not yet configured or empty
export const DEFAULT_SEED_DATA: Record<string, any[]> = {
  akun: [
    { username: 'superadmin', password: 'sisper123', name: 'Rizqo', role: 'super_admin', roleLabel: 'Super Admin' },
    { username: 'irfan', password: 'irfan1', name: 'Irfan', role: 'logistik', roleLabel: 'Logistik' },
    { username: 'risko', password: 'risko2', name: 'Agung Saputra', role: 'pengawas', roleLabel: 'Pengawas' },
    { username: 'emy', password: 'emy123', name: 'Siti Rahma', role: 'marketing', roleLabel: 'Marketing' },
    { username: 'fira', password: 'fira321', name: 'Budi Santoso', role: 'admin_umum', roleLabel: 'Admin Umum' },
  ],
  projects: [
    { id: 'prj-01', name: 'Permata Hijau Residence', location: 'Bandung Utara', rabId: 'rab-01' },
    { id: 'prj-02', name: 'Griya Harmony Cluster', location: 'Cibubur, Depok', rabId: 'rab-02' },
    { id: 'prj-03', name: 'Grand Nirwana Regency', location: 'Sidoarjo, Surabaya', rabId: 'rab-01' },
  ],
  rab_template: [
    { id: 'rab-01', namaRab: 'RAB Standar Type 36 & 45', keterangan: 'Standar material bata merah per 1 unit rumah' },
    { id: 'rab-02', namaRab: 'RAB Premium Cluster Harmony', keterangan: 'Standar spesifikasi hebel & finishing granit' },
  ],
  rab_detail: [
    { id: 'rabd-01', rabId: 'rab-01', namaMaterial: 'Semen Tigaroda 50kg', satuan: 'Semen/Sak', qtyStandar: 70 },
    { id: 'rabd-02', rabId: 'rab-01', namaMaterial: 'Besi Beton 10mm', satuan: 'Batang', qtyStandar: 18 },
    { id: 'rabd-03', rabId: 'rab-01', namaMaterial: 'Pasir Muntilan Pasang', satuan: 'M3 (Kubik)', qtyStandar: 12 },
    { id: 'rabd-04', rabId: 'rab-01', namaMaterial: 'Genteng Keramik Kanmuri', satuan: 'Pcs', qtyStandar: 1500 },
    { id: 'rabd-05', rabId: 'rab-01', namaMaterial: 'Gipsum Jayaboard 9mm', satuan: 'Lembar', qtyStandar: 25 },
    { id: 'rabd-06', rabId: 'rab-02', namaMaterial: 'Semen Tigaroda 50kg', satuan: 'Semen/Sak', qtyStandar: 85 },
    { id: 'rabd-07', rabId: 'rab-02', namaMaterial: 'Besi Beton 10mm', satuan: 'Batang', qtyStandar: 24 },
    { id: 'rabd-08', rabId: 'rab-02', namaMaterial: 'Keramik Lantai 60x60 Milan', satuan: 'Dus', qtyStandar: 45 },
  ],
  gudang: [
    { id: 'gud-01', namaGudang: 'Gudang Utama Permata', lokasi: 'Permata Hijau Blok G' },
    { id: 'gud-02', namaGudang: 'Gudang Transit Griya', lokasi: 'Harmony Cluster Ruko A' },
    { id: 'gud-03', namaGudang: 'Gudang Sentral Nirwana', lokasi: 'Grand Sentral Regency Kav 14' },
  ],
  suppliers: [
    { id: 'sup-01', namaSupplier: 'CV. Sinar Baja Abadi', noHp: '081234567890', alamat: 'Jl. Industri No. 45, Bandung' },
    { id: 'sup-02', namaSupplier: 'PT. Semen Nusantara Prima', noHp: '081987654321', alamat: 'Kawasan Industri Gresik, Jatim' },
    { id: 'sup-03', namaSupplier: 'Toko Surya Kelistrikan', noHp: '085643210987', alamat: 'Jl. Margonda Raya No. 120, Depok' },
  ],
  inventory: [
    { id: 'mat-01', namaMaterial: 'Semen Tigaroda 50kg', idGudang: 'gud-01', jumlahStok: 450, satuan: 'Semen/Sak', minimumStock: 80, harga: 72000, kategoriMaterial: 'Struktur' },
    { id: 'mat-02', namaMaterial: 'Besi Beton 10mm', idGudang: 'gud-01', jumlahStok: 120, satuan: 'Batang', minimumStock: 50, harga: 95000, kategoriMaterial: 'Struktur' },
    { id: 'mat-03', namaMaterial: 'Pasir Muntilan Pasang', idGudang: 'gud-01', jumlahStok: 18, satuan: 'M3 (Kubik)', minimumStock: 5, harga: 320000, kategoriMaterial: 'Struktur' },
    { id: 'mat-04', namaMaterial: 'Genteng Keramik Kanmuri', idGudang: 'gud-02', jumlahStok: 3400, satuan: 'Pcs', minimumStock: 1000, harga: 14500, kategoriMaterial: 'Atap' },
    { id: 'mat-05', namaMaterial: 'Gipsum Jayaboard 9mm', idGudang: 'gud-02', jumlahStok: 85, satuan: 'Lembar', minimumStock: 30, harga: 68000, kategoriMaterial: 'Plafon' },
    { id: 'mat-06', namaMaterial: 'Kabel NYM 3x2.5 Eternal', idGudang: 'gud-03', jumlahStok: 14, satuan: 'Roll', minimumStock: 4, harga: 650000, kategoriMaterial: 'Kelistrikan' },
    { id: 'mat-07', namaMaterial: 'Keramik Lantai 60x60 Milan', idGudang: 'gud-03', jumlahStok: 90, satuan: 'Dus', minimumStock: 25, harga: 135000, kategoriMaterial: 'Finishing' },
  ],
  konstruksi: [
    { id: 'A-01', projectId: 'prj-01', projectName: 'Permata Hijau Residence', type: 'Type 45', luasTanah: 90, luasBangunan: 45, statusPembangunan: 'terbangun', statusPenjualan: 'terjual', tanggalMulaiBangun: '2026-01-10', tanggalSelesai: '2026-04-20' },
    { id: 'A-02', projectId: 'prj-01', projectName: 'Permata Hijau Residence', type: 'Type 45', luasTanah: 90, luasBangunan: 45, statusPembangunan: 'onProgres', statusPenjualan: 'terbooking', tanggalMulaiBangun: '2026-03-05' },
    { id: 'A-03', projectId: 'prj-01', projectName: 'Permata Hijau Residence', type: 'Type 36', luasTanah: 72, luasBangunan: 36, statusPembangunan: 'terbangun', statusPenjualan: 'tersedia', tanggalMulaiBangun: '2026-02-15', tanggalSelesai: '2026-05-10' },
    { id: 'B-01', projectId: 'prj-02', projectName: 'Griya Harmony Cluster', type: 'Type 60', luasTanah: 120, luasBangunan: 60, statusPembangunan: 'onProgres', statusPenjualan: 'terbooking', tanggalMulaiBangun: '2026-04-01' },
    { id: 'B-02', projectId: 'prj-02', projectName: 'Griya Harmony Cluster', type: 'Type 36', luasTanah: 72, luasBangunan: 36, statusPembangunan: 'terbangun', statusPenjualan: 'terjual', tanggalMulaiBangun: '2026-01-20', tanggalSelesai: '2026-04-25' },
    { id: 'B-03', projectId: 'prj-02', projectName: 'Griya Harmony Cluster', type: 'Type 120/120', luasTanah: 150, luasBangunan: 120, statusPembangunan: 'onProgres', statusPenjualan: 'tersedia', tanggalMulaiBangun: '2026-05-10' },
    { id: 'C-01', projectId: 'prj-03', projectName: 'Grand Nirwana Regency', type: 'Type 72', luasTanah: 105, luasBangunan: 72, statusPembangunan: 'terbangun', statusPenjualan: 'terjual', tanggalMulaiBangun: '2025-11-12', tanggalSelesai: '2026-03-01' },
    { id: 'C-02', projectId: 'prj-03', projectName: 'Grand Nirwana Regency', type: 'Type 72', luasTanah: 105, luasBangunan: 72, statusPembangunan: 'onProgres', statusPenjualan: 'terbooking', tanggalMulaiBangun: '2026-03-20' },
    { id: 'C-03', projectId: 'prj-03', projectName: 'Grand Nirwana Regency', type: 'Type 45', luasTanah: 84, luasBangunan: 45, statusPembangunan: 'terbangun', statusPenjualan: 'terbooking', tanggalMulaiBangun: '2026-02-01', tanggalSelesai: '2026-05-05' },
  ],
  transaksi_material: [
    { id: 'tr-01', namaMaterial: 'Semen Tigaroda 50kg', namaGudang: 'Gudang Utama Permata', blokRumah: 'A-02', type: 'keluar', jumlah: 50, tanggal: '2026-05-15', catatan: 'Pekerjaan struktur pondasi dan slup' },
    { id: 'tr-02', namaMaterial: 'Besi Beton 10mm', namaGudang: 'Gudang Utama Permata', blokRumah: 'A-02', type: 'keluar', jumlah: 52, tanggal: '2026-05-16', catatan: 'Perakitan kolom utama' },
    { id: 'tr-03', namaMaterial: 'Semen Tigaroda 50kg', namaGudang: 'Gudang Utama Permata', blokRumah: '-', type: 'masuk', jumlah: 100, tanggal: '2026-05-20', catatan: 'Drop supply bahan sisa prj-02', supplier: 'PT. Semen Nusantara Prima' },
    { id: 'tr-04', namaMaterial: 'Genteng Keramik Kanmuri', namaGudang: 'Gudang Transit Griya', blokRumah: 'B-01', type: 'keluar', jumlah: 1200, tanggal: '2026-05-22', catatan: 'Pemasangan genteng blok Ruko' },
  ],
  progres_pekerjaan: [
    { id: 'prog-01', blokRumah: 'A-01', namaTukang: 'Pak Joko Budiman', noHp: '081211112222', kategoriPekerjaan: 'struktur', itemPekerjaan: 'Pondasi & Dinding', persentasiProgres: 100, nilaiPekerjaan: 15000000, totalNilaiPekerjaan: 15000000, catatan: 'Selesai 100%' },
    { id: 'prog-02', blokRumah: 'A-01', namaTukang: 'Pak Slamet Riyadi', noHp: '081233334444', kategoriPekerjaan: 'atap', itemPekerjaan: 'Baja Ringan & Genteng', persentasiProgres: 100, nilaiPekerjaan: 12000000, totalNilaiPekerjaan: 12000000, catatan: 'Rangka baja ringan kokoh' },
    { id: 'prog-03', blokRumah: 'A-01', namaTukang: 'Pak Ahmad K', noHp: '081255556666', kategoriPekerjaan: 'plafon', itemPekerjaan: 'Papan gipsum & cat plafon', persentasiProgres: 100, nilaiPekerjaan: 8000000, totalNilaiPekerjaan: 8000000, catatan: 'Selesai rapi' },
    { id: 'prog-04', blokRumah: 'A-02', namaTukang: 'Pak Joko Budiman', noHp: '081211112222', kategoriPekerjaan: 'struktur', itemPekerjaan: 'Balok & Plaster Dinding', persentasiProgres: 90, nilaiPekerjaan: 15000000, totalNilaiPekerjaan: 13500000, catatan: 'Balok gantung selesai, dinding tinggal diaci' },
    { id: 'prog-05', blokRumah: 'A-02', namaTukang: 'Pak Slamet Riyadi', noHp: '081233334444', kategoriPekerjaan: 'atap', itemPekerjaan: 'Rangka kuda-kuda kayu/baja', persentasiProgres: 40, nilaiPekerjaan: 11000000, totalNilaiPekerjaan: 4400000, catatan: 'Sedang pasang kuda-kuda pertama' },
    { id: 'prog-06', blokRumah: 'A-02', namaTukang: 'Pak Sugeng Widodo', noHp: '081277778888', kategoriPekerjaan: 'listrik', itemPekerjaan: 'Instalasi stopkontak & kabel', persentasiProgres: 30, nilaiPekerjaan: 6000000, totalNilaiPekerjaan: 1800000, catatan: 'Pipa tertanam 70%, kabel ditarik sebagian' },
    { id: 'prog-07', blokRumah: 'B-01', namaTukang: 'Pak Joko Budiman', noHp: '081211112222', kategoriPekerjaan: 'struktur', itemPekerjaan: 'Semenisasi Lantai', persentasiProgres: 15, nilaiPekerjaan: 14000000, totalNilaiPekerjaan: 2100000, catatan: 'Urugan pasir matang' },
    { id: 'prog-08', blokRumah: 'B-02', namaTukang: 'Pak Ahmad K', noHp: '081255556666', kategoriPekerjaan: 'plafon', itemPekerjaan: 'Plafon Drop Ceiling', persentasiProgres: 100, nilaiPekerjaan: 10000000, totalNilaiPekerjaan: 10000000, catatan: 'Sangat rapi sesuai konsep' },
  ],
  rincian_pembayaran: [
    { id: 'pay-01', namaTukang: 'Pak Joko Budiman', kategoriPekerjaan: 'struktur', nilaiPembayaran: 12000000, tanggalPembayaran: '2026-05-10', namaProjek: 'Griya Harmony Cluster', namaBlok: 'B-01' },
    { id: 'pay-02', namaTukang: 'Pak Slamet Riyadi', kategoriPekerjaan: 'atap', nilaiPembayaran: 10000000, tanggalPembayaran: '2026-05-12', namaProjek: 'Permata Hijau Residence', namaBlok: 'A-01' },
    { id: 'pay-03', namaTukang: 'Pak Ahmad K', kategoriPekerjaan: 'plafon', nilaiPembayaran: 15000000, tanggalPembayaran: '2026-05-14', namaProjek: 'Griya Harmony Cluster', namaBlok: 'B-02' },
  ],
  karyawan: [
    { id: 'kar-01', namaKaryawan: 'Adi Wijaya, S.T.', jabatan: 'Site Manager', gajiHarian: 9500000, tanggalGabung: '2025-01-15' },
    { id: 'kar-02', namaKaryawan: 'Dina Lestari', jabatan: 'Logistik Gudang', gajiHarian: 4800000, tanggalGabung: '2025-06-01' },
    { id: 'kar-03', namaKaryawan: 'Budi Saputra', jabatan: 'Supervisor Lapangan', gajiHarian: 6800000, tanggalGabung: '2025-03-10' },
    { id: 'kar-04', namaKaryawan: 'Siti Rahmawati', jabatan: 'Administrasi Projek', gajiHarian: 4500000, tanggalGabung: '2025-08-20' },
  ],
  absensi_karyawan: [
    { id: 'abs-01', tanggal: '2026-05-28', waktuCheckin: '07:45', karyawanId: 'kar-01', namaKaryawan: 'Adi Wijaya, S.T.', statusKehadiran: 'Hadir' },
    { id: 'abs-02', tanggal: '2026-05-28', waktuCheckin: '07:55', karyawanId: 'kar-02', namaKaryawan: 'Dina Lestari', statusKehadiran: 'Hadir' },
    { id: 'abs-03', tanggal: '2026-05-28', waktuCheckin: '08:15', karyawanId: 'kar-03', namaKaryawan: 'Budi Saputra', statusKehadiran: 'Hadir' },
    { id: 'abs-04', tanggal: '2026-05-28', waktuCheckin: '-', karyawanId: 'kar-04', namaKaryawan: 'Siti Rahmawati', statusKehadiran: 'Izin' },
  ],
  absensi_pekerja: [
    { id: 'absp-01', tanggal: '2026-05-28', namaTukang: 'Pak Joko Budiman', statusKehadiran: 'Hadir', keterangan: 'Mulai pasang dinding bata' },
    { id: 'absp-02', tanggal: '2026-05-28', namaTukang: 'Pak Slamet Riyadi', statusKehadiran: 'Hadir', keterangan: 'Pasang balok kayu atap' },
    { id: 'absp-03', tanggal: '2026-05-28', namaTukang: 'Pak Ahmad K', statusKehadiran: 'Hadir', keterangan: 'Finishing plafon' },
    { id: 'absp-04', tanggal: '2026-05-28', namaTukang: 'Pak Sugeng Widodo', statusKehadiran: 'Izin', keterangan: 'Acara keluarga' },
  ],
  pekerja: [
    { id: 'pekerja-01', namaTukang: 'Pak Joko Budiman', noHp: '081211112222', kategoriPekerjaan: 'struktur' },
    { id: 'pekerja-02', namaTukang: 'Pak Slamet Riyadi', noHp: '081233334444', kategoriPekerjaan: 'atap' },
    { id: 'pekerja-03', namaTukang: 'Pak Ahmad K', noHp: '081255556666', kategoriPekerjaan: 'plafon' },
    { id: 'pekerja-04', namaTukang: 'Pak Sugeng Widodo', noHp: '081277778888', kategoriPekerjaan: 'listrik' },
    { id: 'pekerja-05', namaTukang: 'Pak Supri', noHp: '081299990000', kategoriPekerjaan: 'pembersihan' },
  ],
  leads_penjualan: [
    { id: 'led-01', namaCustomer: 'Muhammad Farhan', namaProjek: 'Permata Hijau Residence', namaBlok: 'A-01', namaMarketing: 'Rian Firdaus', leadStatus: 'akad', noWhatsapp: '081234567891', tanggalInput: '2026-05-10' },
    { id: 'led-02', namaCustomer: 'Dewi Anggraini', namaProjek: 'Permata Hijau Residence', namaBlok: 'A-02', namaMarketing: 'Sarah Amalia', leadStatus: 'pmberkasan', noWhatsapp: '085787654321', tanggalInput: '2026-05-12' },
    { id: 'led-03', namaCustomer: 'Hendra Setiawan', namaProjek: 'Griya Harmony Cluster', namaBlok: 'B-01', namaMarketing: 'Sarah Amalia', leadStatus: 'dp', noWhatsapp: '081298765430', tanggalInput: '2026-05-15' },
    { id: 'led-04', namaCustomer: 'Lilis Karlina', namaProjek: 'Griya Harmony Cluster', namaBlok: 'B-02', namaMarketing: 'Rian Firdaus', leadStatus: 'akad', noWhatsapp: '089676543210', tanggalInput: '2026-05-18' },
    { id: 'led-05', namaCustomer: 'Joko Susilo', namaProjek: 'Grand Nirwana Regency', namaBlok: 'C-02', namaMarketing: 'Andi Wijaya', leadStatus: 'booking', noWhatsapp: '085209876543', tanggalInput: '2026-05-20' },
    { id: 'led-06', namaCustomer: 'Rina Herawati', namaProjek: 'Grand Nirwana Regency', namaBlok: 'C-03', namaMarketing: 'Sarah Amalia', leadStatus: 'tunggu akad', noWhatsapp: '081345678901', tanggalInput: '2026-05-22' },
  ],
  fee_marketing: [
    { id: 'fee-01', namaMarketing: 'Rian Firdaus', komisi: 12500000, statusPembayaran: 'Lunas', tanggalPembayaran: '2026-04-30', noWhatsapp: '081223344556', namaProjek: 'Permata Hijau Residence', namaBlok: 'A-01' },
    { id: 'fee-02', namaMarketing: 'Sarah Amalia', komisi: 8000000, statusPembayaran: 'Belum Bayar', tanggalPembayaran: '-', noWhatsapp: '085711223344', namaProjek: 'Griya Harmony Cluster', namaBlok: 'B-01' },
    { id: 'fee-03', namaMarketing: 'Andi Wijaya', komisi: 5000000, statusPembayaran: 'Belum Bayar', tanggalPembayaran: '-', noWhatsapp: '081399887766', namaProjek: 'Grand Nirwana Regency', namaBlok: 'C-02' },
    { id: 'fee-04', namaMarketing: 'Rian Firdaus', komisi: 15000000, statusPembayaran: 'Lunas', tanggalPembayaran: '2026-05-20', noWhatsapp: '081223344556', namaProjek: 'Permata Hijau Residence', namaBlok: 'A-02' },
  ],
};

// In-memory snapshot cache to coalesce concurrent .from(table).select('*') calls into 1 HTTP GET request
let cachedSnapshot: Record<string, any[]> | null = null;
let inflightFetch: Promise<Record<string, any[]>> | null = null;

export async function fetchAllSheetsData(forceRefresh = false): Promise<Record<string, any[]>> {
  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    throw new Error('URL Google Apps Script belum diatur. Silakan masukkan URL Web App Anda di Pengaturan Database.');
  }

  if (cachedSnapshot && !forceRefresh) {
    return cachedSnapshot;
  }

  if (inflightFetch) {
    return inflightFetch;
  }

  inflightFetch = (async () => {
    try {
      const separator = scriptUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${scriptUrl}${separator}action=all&_t=${Date.now()}`, {
        method: 'GET',
        redirect: 'follow',
      });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const json = await res.json();
      if (json.status === 'error') {
        throw new Error(json.message || 'Error pada Google Apps Script');
      }
      const rawData: Record<string, any[]> = json.data || {};
      const numericKeys = new Set([
        'luasTanah', 'luasBangunan', 'jumlahStok', 'minimumStock', 'harga',
        'jumlah', 'persentasiProgres', 'nilaiPekerjaan', 'totalNilaiPekerjaan',
        'nilaiPembayaran', 'gajiHarian', 'komisi', 'qtyStandar'
      ]);
      const phoneKeys = new Set(['noHp', 'noWhatsapp']);

      Object.keys(rawData).forEach((table) => {
        if (Array.isArray(rawData[table])) {
          rawData[table] = rawData[table].map((row) => {
            const normalized: Record<string, any> = {};
            Object.keys(row || {}).forEach((k) => {
              const val = row[k];
              if (numericKeys.has(k)) {
                normalized[k] = Number(val) || 0;
              } else if (val === null || val === undefined) {
                normalized[k] = '';
              } else {
                let strVal = String(val);
                // Jika Google Sheets menghapus angka 0 di depan nomor telepon (misal 8123456789 -> 08123456789)
                if (phoneKeys.has(k) && /^[8]\d{7,13}$/.test(strVal.trim())) {
                  strVal = '0' + strVal.trim();
                }
                normalized[k] = strVal;
              }
            });
            return normalized;
          });
        }
      });

      cachedSnapshot = rawData;
      return cachedSnapshot!;
    } finally {
      inflightFetch = null;
    }
  })();

  return inflightFetch;
}

export async function triggerAppsScriptSetup(): Promise<{ status: string; message?: string }> {
  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    throw new Error('URL Google Apps Script belum diisi.');
  }
  const res = await fetch(scriptUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'setup' }),
  });
  const json = await res.json();
  cachedSnapshot = null;
  return json;
}

async function postToAppsScript(payload: Record<string, any>): Promise<{ data: any; error: any }> {
  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return { data: null, error: { message: 'Mode Lokal: URL Google Apps Script belum dikonfigurasi' } };
  }
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        // Menggunakan text/plain agar tidak memicu preflight OPTIONS CORS di Google Apps Script
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.status === 'error') {
      return { data: null, error: { message: json.message || 'Gagal menulis ke Google Sheet' } };
    }
    return { data: json, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Network error ke Google Apps Script' } };
  }
}

class GoogleSheetQueryBuilder {
  private tableName: string;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private filterField: string | null = null;
  private filterValue: any = null;
  private limitCount: number | null = null;
  private isMaybeSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(_columns = '*') {
    this.operation = 'select';
    return this;
  }

  insert(rows: any[] | any) {
    this.operation = 'insert';
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(values: Record<string, any>) {
    this.operation = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filterField = field;
    this.filterValue = value;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.execute();
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      if (this.operation === 'select') {
        const scriptUrl = getAppsScriptUrl();
        let tableRows: any[] = [];

        if (!scriptUrl) {
          // Gunakan data demo lokal jika pengguna belum memasukkan URL Apps Script
          tableRows = DEFAULT_SEED_DATA[this.tableName] || [];
        } else {
          const allData = await fetchAllSheetsData();
          tableRows = allData[this.tableName] || [];
          // Khusus tabel 'akun', jika sheet masih kosong gunakan fallback DEFAULT_SEED_DATA.akun agar tetap bisa login
          if (this.tableName === 'akun' && tableRows.length === 0) {
            tableRows = DEFAULT_SEED_DATA.akun;
          }
        }

        let result = [...tableRows];
        if (this.filterField !== null) {
          result = result.filter(
            (r) => String(r[this.filterField!] ?? '').toLowerCase() === String(this.filterValue ?? '').toLowerCase()
          );
        }
        if (this.limitCount !== null) {
          result = result.slice(0, this.limitCount);
        }
        if (this.isMaybeSingle) {
          return { data: result[0] || null, error: null };
        }
        return { data: result, error: null };
      }

      if (this.operation === 'insert') {
        if (cachedSnapshot && cachedSnapshot[this.tableName]) {
          cachedSnapshot[this.tableName] = [...this.payload, ...cachedSnapshot[this.tableName]];
        }
        return await postToAppsScript({
          action: 'insert',
          table: this.tableName,
          rows: this.payload,
        });
      }

      if (this.operation === 'update') {
        if (cachedSnapshot && cachedSnapshot[this.tableName] && this.filterField) {
          cachedSnapshot[this.tableName] = cachedSnapshot[this.tableName].map((r) =>
            String(r[this.filterField!]) === String(this.filterValue) ? { ...r, ...this.payload } : r
          );
        }
        return await postToAppsScript({
          action: 'update',
          table: this.tableName,
          matchField: this.filterField || 'id',
          matchValue: this.filterValue,
          values: this.payload,
        });
      }

      if (this.operation === 'delete') {
        if (cachedSnapshot && cachedSnapshot[this.tableName] && this.filterField) {
          cachedSnapshot[this.tableName] = cachedSnapshot[this.tableName].filter(
            (r) => String(r[this.filterField!]) !== String(this.filterValue)
          );
        }
        return await postToAppsScript({
          action: 'delete',
          table: this.tableName,
          matchField: this.filterField || 'id',
          matchValue: this.filterValue,
        });
      }

      return { data: null, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Database operation error' } };
    }
  }

  // Make the builder Thenable so `await supabase.from(...).select(...)` works seamlessly
  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  from: (tableName: string) => new GoogleSheetQueryBuilder(tableName),
};

