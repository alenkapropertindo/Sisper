/**
 * ============================================================================
 * GOOGLE APPS SCRIPT (Code.gs) UNTUK DATABASE SISPER (SISTEM INFORMASI PERUMAHAN)
 * ============================================================================
 *
 * CARA PENGGUNAAN:
 * 1. Buka Google Sheets baru di https://sheets.new
 * 2. Klik menu: Extensions (Ekstensi) -> Apps Script
 * 3. Hapus semua kode di dalam file `Code.gs`, lalu Paste seluruh kode ini.
 * 4. Tekan Ctrl+S (Simpan).
 * 5. Pilih fungsi `setupDatabase` di dropdown atas (sebelah tombol Run/Jalankan),
 *    lalu klik "Run" untuk membuat seluruh 15 Sheet + Header + Data Awal otomatis!
 * 6. Klik tombol "Deploy" -> "New deployment" (Deployment baru):
 *    - Select type: "Web app"
 *    - Execute as: "Me" (Email Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 7. Klik "Deploy", salin URL Web App (berakhiran /exec), dan tempelkan ke
 *    pengaturan Database Google Sheets di aplikasi SISPER.
 */

const SCHEMA = {
  akun: ['username', 'password', 'name', 'role', 'roleLabel'],
  projects: ['id', 'name', 'location', 'rabId'],
  rab_template: ['id', 'namaRab', 'keterangan'],
  rab_detail: ['id', 'rabId', 'namaMaterial', 'satuan', 'qtyStandar'],
  gudang: ['id', 'namaGudang', 'lokasi'],
  suppliers: ['id', 'namaSupplier', 'noHp', 'alamat'],
  inventory: ['id', 'namaMaterial', 'idGudang', 'jumlahStok', 'satuan', 'minimumStock', 'harga', 'kategoriMaterial'],
  konstruksi: ['id', 'projectId', 'projectName', 'type', 'luasTanah', 'luasBangunan', 'statusPembangunan', 'statusPenjualan', 'tanggalMulaiBangun', 'tanggalSelesai'],
  transaksi_material: ['id', 'namaMaterial', 'namaGudang', 'blokRumah', 'type', 'jumlah', 'tanggal', 'catatan', 'supplier'],
  progres_pekerjaan: ['id', 'blokRumah', 'namaTukang', 'noHp', 'kategoriPekerjaan', 'itemPekerjaan', 'persentasiProgres', 'nilaiPekerjaan', 'totalNilaiPekerjaan', 'catatan'],
  rincian_pembayaran: ['id', 'namaTukang', 'kategoriPekerjaan', 'nilaiPembayaran', 'tanggalPembayaran', 'namaProjek', 'namaBlok'],
  karyawan: ['id', 'namaKaryawan', 'jabatan', 'gajiHarian', 'tanggalGabung'],
  absensi_karyawan: ['id', 'tanggal', 'waktuCheckin', 'karyawanId', 'namaKaryawan', 'statusKehadiran'],
  absensi_pekerja: ['id', 'tanggal', 'namaTukang', 'statusKehadiran', 'keterangan'],
  pekerja: ['id', 'namaTukang', 'noHp', 'kategoriPekerjaan'],
  leads_penjualan: ['id', 'namaCustomer', 'namaProjek', 'namaBlok', 'namaMarketing', 'leadStatus', 'noWhatsapp', 'tanggalInput'],
  fee_marketing: ['id', 'namaMarketing', 'komisi', 'statusPembayaran', 'tanggalPembayaran', 'noWhatsapp', 'namaProjek', 'namaBlok']
};

const NUMERIC_FIELDS = [
  'luasTanah', 'luasBangunan', 'jumlahStok', 'minimumStock', 'harga',
  'jumlah', 'persentasiProgres', 'nilaiPekerjaan', 'totalNilaiPekerjaan',
  'nilaiPembayaran', 'gajiHarian', 'komisi', 'qtyStandar'
];

/**
 * Jalankan fungsi ini 1x dari editor Apps Script (atau dari tombol "Setup & Seed" di aplikasi)
 * untuk membuat seluruh Sheet dan mengisi data awal secara otomatis.
 */
/**
 * Jalankan fungsi ini dari editor Apps Script (atau dari tombol di aplikasi)
 * FUNGSI INI AMAN (NON-DESTRUCTIVE):
 * - Jika sheet sudah ada dan ada datanya, DATA LAMA TIDAK AKAN DIHAPUS.
 * - Kolom baru yang belum ada (seperti `rabId` pada `projects`) otomatis ditambahkan di baris header.
 * - Hanya sheet yang belum ada (seperti `rab_template` dan `rab_detail`) yang akan dibuatkan baru beserta data awalnya.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SCHEMA).forEach(tableName => {
    let sheet = ss.getSheetByName(tableName);
    const headers = SCHEMA[tableName];

    // 1. Jika sheet belum ada, buat sheet baru
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    // 2. Jika sheet benar-benar kosong, buat seluruh header
    if (lastRow === 0 || lastCol === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#e0e5ec')
        .setFontColor('#2d3748');
      sheet.setFrozenRows(1);
    } else {
      // 3. Jika sheet sudah ada dan memiliki data:
      // PERIKSA kolom header yang belum ada, lalu tambahkan di ujung kanan (TANPA MENGHAPUS DATA LAMA)
      const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
      let nextCol = lastCol + 1;
      headers.forEach(h => {
        if (currentHeaders.indexOf(h) === -1) {
          sheet.getRange(1, nextCol).setValue(h)
            .setFontWeight('bold')
            .setBackground('#e0e5ec')
            .setFontColor('#2d3748');
          nextCol++;
        }
      });
    }
  });

  seedInitialData();
  return { 
    status: 'ok', 
    message: 'Update berhasil! Sheet dan kolom baru telah ditambahkan tanpa menghapus atau mengubah data lama Anda.' 
  };
}

function seedInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const seedMap = {
    akun: [
      ['superadmin', 'sisper123', 'Rizqo', 'super_admin', 'Super Admin'],
      ['irfan', 'irfan1', 'Irfan', 'logistik', 'Logistik'],
      ['risko', 'risko2', 'Agung Saputra', 'pengawas', 'Pengawas'],
      ['emy', 'emy123', 'Siti Rahma', 'marketing', 'Marketing'],
      ['fira', 'fira321', 'Budi Santoso', 'admin_umum', 'Admin Umum']
    ],
    projects: [
      ['prj-01', 'Permata Hijau Residence', 'Bandung Utara', 'rab-01'],
      ['prj-02', 'Griya Harmony Cluster', 'Cibubur, Depok', 'rab-02'],
      ['prj-03', 'Grand Nirwana Regency', 'Sidoarjo, Surabaya', 'rab-01']
    ],
    rab_template: [
      ['rab-01', 'RAB Standar Type 36 & 45', 'Standar material bata merah per 1 unit rumah'],
      ['rab-02', 'RAB Premium Cluster Harmony', 'Standar spesifikasi hebel & finishing granit']
    ],
    rab_detail: [
      ['rabd-01', 'rab-01', 'Semen Tigaroda 50kg', 'Semen/Sak', 70],
      ['rabd-02', 'rab-01', 'Besi Beton 10mm', 'Batang', 18],
      ['rabd-03', 'rab-01', 'Pasir Muntilan Pasang', 'M3 (Kubik)', 12],
      ['rabd-04', 'rab-01', 'Genteng Keramik Kanmuri', 'Pcs', 1500],
      ['rabd-05', 'rab-01', 'Gipsum Jayaboard 9mm', 'Lembar', 25],
      ['rabd-06', 'rab-02', 'Semen Tigaroda 50kg', 'Semen/Sak', 85],
      ['rabd-07', 'rab-02', 'Besi Beton 10mm', 'Batang', 24],
      ['rabd-08', 'rab-02', 'Keramik Lantai 60x60 Milan', 'Dus', 45]
    ],
    gudang: [
      ['gud-01', 'Gudang Utama Permata', 'Permata Hijau Blok G'],
      ['gud-02', 'Gudang Transit Griya', 'Harmony Cluster Ruko A'],
      ['gud-03', 'Gudang Sentral Nirwana', 'Grand Sentral Regency Kav 14']
    ],
    suppliers: [
      ['sup-01', 'CV. Sinar Baja Abadi', '081234567890', 'Jl. Industri No. 45, Bandung'],
      ['sup-02', 'PT. Semen Nusantara Prima', '081987654321', 'Kawasan Industri Gresik, Jatim'],
      ['sup-03', 'Toko Surya Kelistrikan', '085643210987', 'Jl. Margonda Raya No. 120, Depok']
    ],
    inventory: [
      ['mat-01', 'Semen Tigaroda 50kg', 'gud-01', 450, 'Semen/Sak', 80, 72000, 'Struktur'],
      ['mat-02', 'Besi Beton 10mm', 'gud-01', 120, 'Batang', 50, 95000, 'Struktur'],
      ['mat-03', 'Pasir Muntilan Pasang', 'gud-01', 18, 'M3 (Kubik)', 5, 320000, 'Struktur'],
      ['mat-04', 'Genteng Keramik Kanmuri', 'gud-02', 3400, 'Pcs', 1000, 14500, 'Atap'],
      ['mat-05', 'Gipsum Jayaboard 9mm', 'gud-02', 85, 'Lembar', 30, 68000, 'Plafon'],
      ['mat-06', 'Kabel NYM 3x2.5 Eternal', 'gud-03', 14, 'Roll', 4, 650000, 'Kelistrikan'],
      ['mat-07', 'Keramik Lantai 60x60 Milan', 'gud-03', 90, 'Dus', 25, 135000, 'Finishing']
    ],
    konstruksi: [
      ['A-01', 'prj-01', 'Permata Hijau Residence', 'Type 45', 90, 45, 'terbangun', 'terjual', '2026-01-10', '2026-04-20'],
      ['A-02', 'prj-01', 'Permata Hijau Residence', 'Type 45', 90, 45, 'onProgres', 'terbooking', '2026-03-05', ''],
      ['A-03', 'prj-01', 'Permata Hijau Residence', 'Type 36', 72, 36, 'terbangun', 'tersedia', '2026-02-15', '2026-05-10'],
      ['B-01', 'prj-02', 'Griya Harmony Cluster', 'Type 60', 120, 60, 'onProgres', 'terbooking', '2026-04-01', ''],
      ['B-02', 'prj-02', 'Griya Harmony Cluster', 'Type 36', 72, 36, 'terbangun', 'terjual', '2026-01-20', '2026-04-25'],
      ['B-03', 'prj-02', 'Griya Harmony Cluster', 'Type 120/120', 150, 120, 'onProgres', 'tersedia', '2026-05-10', ''],
      ['C-01', 'prj-03', 'Grand Nirwana Regency', 'Type 72', 105, 72, 'terbangun', 'terjual', '2025-11-12', '2026-03-01'],
      ['C-02', 'prj-03', 'Grand Nirwana Regency', 'Type 72', 105, 72, 'onProgres', 'terbooking', '2026-03-20', ''],
      ['C-03', 'prj-03', 'Grand Nirwana Regency', 'Type 45', 84, 45, 'terbangun', 'terbooking', '2026-02-01', '2026-05-05']
    ],
    transaksi_material: [
      ['tr-01', 'Semen Tigaroda 50kg', 'Gudang Utama Permata', 'A-02', 'keluar', 50, '2026-05-15', 'Pekerjaan struktur pondasi dan slup', ''],
      ['tr-02', 'Besi Beton 10mm', 'Gudang Utama Permata', 'A-02', 'keluar', 30, '2026-05-16', 'Perakitan kolom utama', ''],
      ['tr-03', 'Semen Tigaroda 50kg', 'Gudang Utama Permata', '-', 'masuk', 100, '2026-05-20', 'Drop supply bahan PT. Semen Nusantara Prima', 'PT. Semen Nusantara Prima'],
      ['tr-04', 'Genteng Keramik Kanmuri', 'Gudang Transit Griya', 'B-01', 'keluar', 1200, '2026-05-22', 'Pemasangan genteng blok Ruko', '']
    ],
    progres_pekerjaan: [
      ['prog-01', 'A-01', 'Pak Joko Budiman', '081211112222', 'struktur', 'Pondasi & Dinding', 100, 15000000, 15000000, 'Selesai 100%'],
      ['prog-02', 'A-01', 'Pak Slamet Riyadi', '081233334444', 'atap', 'Baja Ringan & Genteng', 100, 12000000, 12000000, 'Rangka baja ringan kokoh'],
      ['prog-03', 'A-01', 'Pak Ahmad K', '081255556666', 'plafon', 'Papan gipsum & cat plafon', 100, 8000000, 8000000, 'Selesai rapi'],
      ['prog-04', 'A-02', 'Pak Joko Budiman', '081211112222', 'struktur', 'Balok & Plaster Dinding', 90, 15000000, 13500000, 'Balok gantung selesai, dinding tinggal diaci'],
      ['prog-05', 'A-02', 'Pak Slamet Riyadi', '081233334444', 'atap', 'Rangka kuda-kuda kayu/baja', 40, 11000000, 4400000, 'Sedang pasang kuda-kuda pertama'],
      ['prog-06', 'A-02', 'Pak Sugeng Widodo', '081277778888', 'listrik', 'Instalasi stopkontak & kabel', 30, 6000000, 1800000, 'Pipa tertanam 70%, kabel ditarik sebagian'],
      ['prog-07', 'B-01', 'Pak Joko Budiman', '081211112222', 'struktur', 'Semenisasi Lantai', 15, 14000000, 2100000, 'Urugan pasir matang'],
      ['prog-08', 'B-02', 'Pak Ahmad K', '081255556666', 'plafon', 'Plafon Drop Ceiling', 100, 10000000, 10000000, 'Sangat rapi sesuai konsep']
    ],
    rincian_pembayaran: [
      ['pay-01', 'Pak Joko Budiman', 'struktur', 12000000, '2026-05-10', 'Griya Harmony Cluster', 'B-01'],
      ['pay-02', 'Pak Slamet Riyadi', 'atap', 10000000, '2026-05-12', 'Permata Hijau Residence', 'A-01'],
      ['pay-03', 'Pak Ahmad K', 'plafon', 15000000, '2026-05-14', 'Griya Harmony Cluster', 'B-02']
    ],
    karyawan: [
      ['kar-01', 'Adi Wijaya, S.T.', 'Site Manager', 9500000, '2025-01-15'],
      ['kar-02', 'Dina Lestari', 'Logistik Gudang', 4800000, '2025-06-01'],
      ['kar-03', 'Budi Saputra', 'Supervisor Lapangan', 6800000, '2025-03-10'],
      ['kar-04', 'Siti Rahmawati', 'Administrasi Projek', 4500000, '2025-08-20']
    ],
    absensi_karyawan: [
      ['abs-01', '2026-05-28', '07:45', 'kar-01', 'Adi Wijaya, S.T.', 'Hadir'],
      ['abs-02', '2026-05-28', '07:55', 'kar-02', 'Dina Lestari', 'Hadir'],
      ['abs-03', '2026-05-28', '08:15', 'kar-03', 'Budi Saputra', 'Hadir'],
      ['abs-04', '2026-05-28', '-', 'kar-04', 'Siti Rahmawati', 'Izin'],
      ['abs-05', '2026-05-27', '07:40', 'kar-01', 'Adi Wijaya, S.T.', 'Hadir'],
      ['abs-06', '2026-05-27', '07:50', 'kar-02', 'Dina Lestari', 'Hadir']
    ],
    absensi_pekerja: [
      ['absp-01', '2026-05-28', 'Pak Joko Budiman', 'Hadir', 'Mulai pasang dinding bata'],
      ['absp-02', '2026-05-28', 'Pak Slamet Riyadi', 'Hadir', 'Pasang balok kayu atap'],
      ['absp-03', '2026-05-28', 'Pak Ahmad K', 'Hadir', 'Finishing plafon'],
      ['absp-04', '2026-05-28', 'Pak Sugeng Widodo', 'Izin', 'Acara keluarga']
    ],
    pekerja: [
      ['pekerja-01', 'Pak Joko Budiman', '081211112222', 'struktur'],
      ['pekerja-02', 'Pak Slamet Riyadi', '081233334444', 'atap'],
      ['pekerja-03', 'Pak Ahmad K', '081255556666', 'plafon'],
      ['pekerja-04', 'Pak Sugeng Widodo', '081277778888', 'listrik'],
      ['pekerja-05', 'Pak Supri', '081299990000', 'pembersihan']
    ],
    leads_penjualan: [
      ['led-01', 'Muhammad Farhan', 'Permata Hijau Residence', 'A-01', 'Rian Firdaus', 'akad', '081234567891', '2026-05-10'],
      ['led-02', 'Dewi Anggraini', 'Permata Hijau Residence', 'A-02', 'Sarah Amalia', 'pmberkasan', '085787654321', '2026-05-12'],
      ['led-03', 'Hendra Setiawan', 'Griya Harmony Cluster', 'B-01', 'Sarah Amalia', 'dp', '081298765430', '2026-05-15'],
      ['led-04', 'Lilis Karlina', 'Griya Harmony Cluster', 'B-02', 'Rian Firdaus', 'akad', '089676543210', '2026-05-18'],
      ['led-05', 'Joko Susilo', 'Grand Nirwana Regency', 'C-02', 'Andi Wijaya', 'booking', '085209876543', '2026-05-20'],
      ['led-06', 'Rina Herawati', 'Grand Nirwana Regency', 'C-03', 'Sarah Amalia', 'tunggu akad', '081345678901', '2026-05-22']
    ],
    fee_marketing: [
      ['fee-01', 'Rian Firdaus', 12500000, 'Lunas', '2026-04-30', '081223344556', 'Permata Hijau Residence', 'A-01'],
      ['fee-02', 'Sarah Amalia', 8000000, 'Belum Bayar', '-', '085711223344', 'Griya Harmony Cluster', 'B-01'],
      ['fee-03', 'Andi Wijaya', 5000000, 'Belum Bayar', '-', '081399887766', 'Grand Nirwana Regency', 'C-02'],
      ['fee-04', 'Rian Firdaus', 15000000, 'Lunas', '2026-05-20', '081223344556', 'Permata Hijau Residence', 'A-02']
    ]
  };

  Object.keys(seedMap).forEach(tableName => {
    const sheet = ss.getSheetByName(tableName);
    if (sheet && sheet.getLastRow() <= 1) {
      const rows = seedMap[tableName];
      if (rows && rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
    }
  });
}

/**
 * Helper untuk membaca 1 Sheet menjadi Array of Objects
 */
function readSheetData(ss, tableName) {
  let sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    // Jika sheet belum ada, buat otomatis sesuai SCHEMA
    if (SCHEMA[tableName]) {
      sheet = ss.insertSheet(tableName);
      sheet.getRange(1, 1, 1, SCHEMA[tableName].length).setValues([SCHEMA[tableName]]);
    } else {
      return [];
    }
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(h => String(h).trim());
  const data = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // Lewati baris kosong
    if (row.every(cell => cell === '' || cell === null)) continue;

    const obj = {};
    headers.forEach((h, colIdx) => {
      let val = row[colIdx];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else if (NUMERIC_FIELDS.indexOf(h) !== -1) {
        val = Number(val) || 0;
      }
      obj[h] = val;
    });
    data.push(obj);
  }
  return data;
}

/**
 * Handler HTTP GET
 * - ?action=all  -> Mengambil seluruh tabel sekaligus
 * - ?table=nama  -> Mengambil 1 tabel tertentu
 * - ?action=setup -> Membuat 15 Sheet + Seed Data Awal otomatis
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'all';
    const table = (e && e.parameter && e.parameter.table) ? e.parameter.table : null;

    if (action === 'setup') {
      const res = setupDatabase();
      return createJsonResponse(res);
    }

    if (table) {
      const data = readSheetData(ss, table);
      return createJsonResponse({ status: 'ok', data: data });
    }

    // Default: kembalikan semua tabel dalam 1 request agar sangat cepat
    const allData = {};
    Object.keys(SCHEMA).forEach(tableName => {
      allData[tableName] = readSheetData(ss, tableName);
    });

    return createJsonResponse({ status: 'ok', data: allData });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Handler HTTP POST
 * Menerima body JSON (dikirim sebagai text/plain agar bebas blokir CORS preflight)
 * Format payload:
 * {
 *   action: 'insert' | 'update' | 'delete' | 'setup',
 *   table: 'nama_sheet',
 *   rows: [...],         // untuk insert
 *   values: {...},       // untuk update
 *   matchField: 'id',    // untuk update / delete
 *   matchValue: '...'    // untuk update / delete
 * }
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'setup') {
      const res = setupDatabase();
      return createJsonResponse(res);
    }

    const tableName = body.table;
    let sheet = ss.getSheetByName(tableName);
    if (!sheet && SCHEMA[tableName]) {
      sheet = ss.insertSheet(tableName);
      sheet.getRange(1, 1, 1, SCHEMA[tableName].length).setValues([SCHEMA[tableName]]);
    }

    if (!sheet) {
      return createJsonResponse({ status: 'error', message: 'Sheet tidak ditemukan: ' + tableName });
    }

    const lastCol = Math.max(sheet.getLastColumn(), (SCHEMA[tableName] || []).length);
    let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());

    if (action === 'insert') {
      const rowsToInsert = Array.isArray(body.rows) ? body.rows : [body.rows];
      const matrix = rowsToInsert.map(item => {
        return headers.map(h => {
          // Support camelCase maupun snake_case fallback
          if (item[h] !== undefined && item[h] !== null) return item[h];
          return '';
        });
      });

      if (matrix.length > 0) {
        const startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, matrix.length, headers.length).setValues(matrix);
      }
      return createJsonResponse({ status: 'ok', inserted: matrix.length });
    }

    if (action === 'update') {
      const matchField = body.matchField || 'id';
      const matchValue = String(body.matchValue);
      const updates = body.values || {};

      // Cek apakah ada kolom baru di updates yang belum ada di header (misal tanggalSelesai)
      Object.keys(updates).forEach(k => {
        if (headers.indexOf(k) === -1) {
          headers.push(k);
          sheet.getRange(1, headers.length).setValue(k);
        }
      });

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({ status: 'ok', updated: 0 });
      }

      const dataRange = sheet.getRange(1, 1, lastRow, headers.length);
      const allValues = dataRange.getValues();
      const matchColIdx = headers.indexOf(matchField);

      if (matchColIdx === -1) {
        return createJsonResponse({ status: 'error', message: 'Kolom kunci tidak ditemukan: ' + matchField });
      }

      let updatedCount = 0;
      for (let i = 1; i < allValues.length; i++) {
        if (String(allValues[i][matchColIdx]) === matchValue) {
          headers.forEach((h, colIdx) => {
            if (updates[h] !== undefined) {
              allValues[i][colIdx] = updates[h] === null ? '' : updates[h];
            }
          });
          sheet.getRange(i + 1, 1, 1, headers.length).setValues([allValues[i]]);
          updatedCount++;
        }
      }

      return createJsonResponse({ status: 'ok', updated: updatedCount });
    }

    if (action === 'delete') {
      const matchField = body.matchField || 'id';
      const matchValue = String(body.matchValue);
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return createJsonResponse({ status: 'ok', deleted: 0 });

      const allValues = sheet.getRange(1, 1, lastRow, headers.length).getValues();
      const matchColIdx = headers.indexOf(matchField);
      if (matchColIdx === -1) return createJsonResponse({ status: 'error', message: 'Kolom tidak ditemukan' });

      let deletedCount = 0;
      for (let i = allValues.length - 1; i >= 1; i--) {
        if (String(allValues[i][matchColIdx]) === matchValue) {
          sheet.deleteRow(i + 1);
          deletedCount++;
        }
      }
      return createJsonResponse({ status: 'ok', deleted: deletedCount });
    }

    return createJsonResponse({ status: 'error', message: 'Action tidak dikenali: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
