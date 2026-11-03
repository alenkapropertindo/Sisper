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
  karyawan: ['id', 'namaKaryawan', 'jabatan', 'whatsup', 'tanggalGabung'],
  absensi_karyawan: ['id', 'tanggal', 'waktuCheckin', 'karyawanId', 'namaKaryawan', 'statusKehadiran'],
  absensi_pekerja: ['id', 'tanggal', 'namaTukang', 'statusKehadiran', 'keterangan'],
  pekerja: ['id', 'namaTukang', 'noHp', 'kategoriPekerjaan'],
  leads_penjualan: ['id', 'namaCustomer', 'namaProjek', 'namaBlok', 'namaMarketing', 'leadStatus', 'noWhatsapp', 'tanggalInput'],
  fee_marketing: ['id', 'namaMarketing', 'komisi', 'statusPembayaran', 'tanggalPembayaran', 'noWhatsapp', 'namaProjek', 'namaBlok']
};

const NUMERIC_FIELDS = [
  'luasTanah', 'luasBangunan', 'jumlahStok', 'minimumStock', 'harga',
  'jumlah', 'persentasiProgres', 'nilaiPekerjaan', 'totalNilaiPekerjaan',
  'nilaiPembayaran', 'komisi', 'qtyStandar'
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

  // Inisialisasi akun superadmin default jika sheet akun masih kosong (agar pengguna langsung bisa login)
  const akunSheet = ss.getSheetByName('akun');
  if (akunSheet && akunSheet.getLastRow() <= 1) {
    akunSheet.getRange(2, 1, 1, 5).setValues([
      ['superadmin', 'sisper123', 'Super Admin', 'super_admin', 'Super Admin']
    ]);
  }

  return { 
    status: 'ok', 
    message: 'Setup database selesai! Seluruh 15 sheet dan header telah siap digunakan secara bersih langsung dari database Anda.' 
  };
}

/**
 * Helper fleksibel untuk menemukan sheet berdasarkan nama tabel
 * Mendukung pencocokan nama jamak/tunggal (contoh: 'projects' vs 'project') dan case-insensitive
 */
function findSheet(ss, tableName) {
  if (!ss || !tableName) return null;
  // 1. Cek nama persis
  let sheet = ss.getSheetByName(tableName);
  if (sheet) return sheet;

  // 2. Cek variasi jamak / tunggal (misal 'projects' -> 'project' atau sebaliknya)
  if (tableName.endsWith('s')) {
    sheet = ss.getSheetByName(tableName.slice(0, -1));
    if (sheet) return sheet;
  } else {
    sheet = ss.getSheetByName(tableName + 's');
    if (sheet) return sheet;
  }

  // 3. Cek case-insensitive terhadap seluruh tab sheet
  const allSheets = ss.getSheets();
  const targetLower = tableName.toLowerCase();
  for (let i = 0; i < allSheets.length; i++) {
    const sName = allSheets[i].getName().trim().toLowerCase();
    if (sName === targetLower || 
        (targetLower.endsWith('s') && sName === targetLower.slice(0, -1)) ||
        (!targetLower.endsWith('s') && sName === targetLower + 's')) {
      return allSheets[i];
    }
  }
  return null;
}

/**
 * Helper untuk membaca 1 Sheet menjadi Array of Objects
 */
function readSheetData(ss, tableName) {
  let sheet = findSheet(ss, tableName);
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
    let sheet = findSheet(ss, tableName);
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
