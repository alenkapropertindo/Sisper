/**
 * Utilitas Zona Waktu untuk SISPER
 * Seluruh penetapan tanggal & waktu di aplikasi SISPER menggunakan
 * Zona Waktu Sulawesi Tenggara (WITA - Waktu Indonesia Tengah / UTC+8 / Asia/Makassar).
 */

export const TIMEZONE_SULTRA = 'Asia/Makassar'; // IANA time zone untuk Sulawesi Tenggara (WITA / UTC+8)
export const TIMEZONE_LABEL = 'WITA (Sulawesi Tenggara)';

/**
 * Mendapatkan string tanggal hari ini dalam format YYYY-MM-DD sesuai zona waktu Sulawesi Tenggara (WITA).
 */
export function getWitaToday(): string {
  return getWitaDateString(new Date());
}

/**
 * Mendapatkan string tanggal kemarin dalam format YYYY-MM-DD sesuai zona waktu Sulawesi Tenggara (WITA).
 */
export function getWitaYesterday(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return getWitaDateString(yesterday);
}

/**
 * Mengonversi objek Date menjadi string tanggal 'YYYY-MM-DD' dalam zona waktu Sulawesi Tenggara.
 */
export function getWitaDateString(date: Date = new Date()): string {
  try {
    // en-CA format menghasilkan format 'YYYY-MM-DD' secara terstandarisasi
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE_SULTRA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback manual jika Intl gagal
    const utcTime = date.getTime();
    const witaOffsetMs = 8 * 60 * 60 * 1000; // UTC+8
    const witaDate = new Date(utcTime + witaOffsetMs);
    return witaDate.toISOString().split('T')[0];
  }
}

/**
 * Mendapatkan jam saat ini dalam format 'HH:mm:ss WITA'
 */
export function getWitaCurrentTimeString(includeSeconds = true): string {
  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: TIMEZONE_SULTRA,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false,
    });
    return `${formatter.format(new Date())} WITA`;
  } catch {
    const now = new Date();
    const utcTime = now.getTime();
    const witaOffsetMs = 8 * 60 * 60 * 1000;
    const witaDate = new Date(utcTime + witaOffsetMs);
    const h = String(witaDate.getUTCHours()).padStart(2, '0');
    const m = String(witaDate.getUTCMinutes()).padStart(2, '0');
    const s = String(witaDate.getUTCSeconds()).padStart(2, '0');
    return includeSeconds ? `${h}:${m}:${s} WITA` : `${h}:${m} WITA`;
  }
}

/**
 * Menormalisasi berbagai format tanggal (ISO timestamp, DD/MM/YYYY, Date object)
 * menjadi string 'YYYY-MM-DD' yang valid di zona waktu Sulawesi Tenggara.
 */
export function normalizeDateString(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    return getWitaDateString(val);
  }

  const str = String(val).trim();
  if (!str || str === '-') return '';

  // 1. Format standar ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. Format ISO dengan jam / timestamp (misal "2026-11-04T00:00:00.000Z" atau "2026-11-03T16:00:00.000Z")
  if (str.includes('T') || str.includes('Z')) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return getWitaDateString(parsed);
    }
  }

  // 3. Format DD/MM/YYYY (contoh: 04/11/2026 atau 4/11/2026)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 4. Format YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 5. Fallback ke 10 karakter pertama jika berformat YYYY-MM-DD ...
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  return str;
}

/**
 * Format string YYYY-MM-DD menjadi format teks Indonesia (contoh: "Rabu, 4 Nov 2026")
 */
export function formatWitaDateIndo(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const normalized = normalizeDateString(dateStr);
  if (!normalized) return '';
  const [y, m, d] = normalized.split('-').map(Number);
  if (!y || !m || !d) return normalized;

  // Bangun Date object di UTC jam 12:00 agar aman dari offset shift
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_SULTRA,
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  return dateObj.toLocaleDateString('id-ID', options || defaultOptions);
}

/**
 * Tambah/kurang hari dari tanggal YYYY-MM-DD
 */
export function addDaysWita(dateStr: string, days: number): string {
  const normalized = normalizeDateString(dateStr);
  const [y, m, d] = (normalized || getWitaToday()).split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, (m || 1) - 1, (d || 1), 12, 0, 0));
  dateObj.setUTCDate(dateObj.getUTCDate() + days);
  return getWitaDateString(dateObj);
}

/**
 * Mengecek apakah tanggal berada dalam rentang start dan end (inklusif)
 */
export function isDateInRangeWita(dateStr: string, startStr: string, endStr: string): boolean {
  const normDate = normalizeDateString(dateStr);
  const normStart = normalizeDateString(startStr);
  const normEnd = normalizeDateString(endStr);
  if (!normDate || !normStart || !normEnd) return false;
  return normDate >= normStart && normDate <= normEnd;
}
