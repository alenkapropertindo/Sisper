/**
 * Utilitas Pengurutan Nomor Blok Alami (Natural Block Sorting)
 * Mengurutkan nomor blok secara teratur mulai dari A01/A-01, A02/A-02, ..., B01, dst.
 */
export function compareBlockIds(a: string, b: string): number {
  const normA = String(a || '').trim();
  const normB = String(b || '').trim();

  // Pola regex untuk mengekstrak awalan huruf dan nomor urut blok
  // Mendukung format: "A01", "A-01", "A.01", "Blok A-01", "A 01", dll.
  const regex = /(?:blok\s*)?([a-zA-Z]+)[^0-9a-zA-Z]*(\d+)?/i;
  const matchA = normA.match(regex);
  const matchB = normB.match(regex);

  if (matchA && matchB) {
    const prefixA = matchA[1].toUpperCase();
    const prefixB = matchB[1].toUpperCase();

    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB);
    }

    const numA = matchA[2] !== undefined ? parseInt(matchA[2], 10) : 0;
    const numB = matchB[2] !== undefined ? parseInt(matchB[2], 10) : 0;

    if (numA !== numB) {
      return numA - numB;
    }
  }

  // Fallback ke natural alphanumeric localeCompare
  return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' });
}
