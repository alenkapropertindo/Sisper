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
    { username: 'superadmin', password: 'sisper123', name: 'Super Admin', role: 'super_admin', roleLabel: 'Super Admin' },
  ],
  projects: [],
  rab_template: [],
  rab_detail: [],
  gudang: [],
  suppliers: [],
  inventory: [],
  konstruksi: [],
  transaksi_material: [],
  progres_pekerjaan: [],
  rincian_pembayaran: [],
  karyawan: [],
  absensi_karyawan: [],
  absensi_pekerja: [],
  pekerja: [],
  leads_penjualan: [],
  fee_marketing: [],
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
        'nilaiPembayaran', 'komisi', 'qtyStandar'
      ]);
      const phoneKeys = new Set(['noHp', 'noWhatsapp', 'whatsup', 'whatsapp']);

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

      // Sinkronisasi alias tabel jamak & tunggal (misal 'project' <-> 'projects')
      if (rawData['project'] && !rawData['projects']) {
        rawData['projects'] = rawData['project'];
      } else if (rawData['projects'] && !rawData['project']) {
        rawData['project'] = rawData['projects'];
      }

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

