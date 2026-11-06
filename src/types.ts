export interface Project {
  id: string;
  name: string;
  location: string;
  rabId?: string;
}

export interface RabTemplate {
  id: string;
  namaRab: string;
  keterangan?: string;
}

export interface RabDetail {
  id: string;
  rabId: string;
  namaMaterial: string;
  satuan: string;
  qtyStandar: number;
}

export interface Konstruksi {
  id: string; // block number (e.g., "A-01")
  projectId: string;
  projectName: string;
  type: string; // e.g., "Type 36", "Type 45", "Type 72"
  luasTanah: number; // m2
  luasBangunan: number; // m2
  statusPembangunan: 'onProgres' | 'terbangun';
  statusPenjualan: 'tersedia' | 'terjual' | 'terbooking';
  tanggalMulaiBangun: string;
  tanggalSelesai?: string;
}

export interface Inventory {
  id: string;
  namaMaterial: string;
  idGudang: string;
  namaGudang?: string;
  jumlahStok: number;
  satuan: string; // e.g., "Semen", "Besi", "kubik", "sak", "pcs"
  minimumStock: number;
  harga: number;
  kategoriMaterial: string; // e.g., "Struktur", "Finishing", "Atap", "Plumbing", "Kelistrikan"
}

export interface Gudang {
  id: string;
  namaGudang: string;
  lokasi: string;
}

export interface Supplier {
  id: string;
  namaSupplier: string;
  noHp: string;
  alamat: string;
}

export interface TransaksiMaterial {
  id: string;
  namaMaterial: string;
  namaGudang: string;
  blokRumah: string; // e.g., "A-01"
  type: 'masuk' | 'keluar';
  jumlah: number;
  tanggal: string;
  catatan: string;
  supplier?: string;
}

export interface ProgresPekerjaan {
  id: string;
  blokRumah: string; // linked to Konstruksi.id
  namaTukang: string;
  noHp: string;
  kategoriPekerjaan: 'struktur' | 'plafon' | 'atap' | 'listrik' | 'pembersihan' | 'drainase';
  itemPekerjaan: string;
  persentasiProgres: number; // 0 - 100
  nilaiPekerjaan: number; // total contract design
  totalNilaiPekerjaan: number; // nilaiPekerjaan * (persentasiProgres/100)
  catatan: string;
}

export interface OpnameTukang {
  id: string;
  projectId: string;
  blokId: string;
  namaTukang: string;
  kategoriPekerjaan: string;
  nilaiTotal: number; // calculated from ProgresPekerjaan
  nilaiTerbayar: number;
  nilaiBelumTerbayar: number; // nilaiTotal - nilaiTerbayar
  tanggalMulaiPekerjaan: string;
}

export interface RincianPembayaran {
  id: string;
  namaTukang: string;
  kategoriPekerjaan: string;
  nilaiPembayaran: number;
  tanggalPembayaran: string;
  namaProjek?: string;
  namaBlok?: string;
}

export interface Karyawan {
  id: string;
  namaKaryawan: string;
  jabatan: string;
  whatsup?: string;
  tanggalGabung: string;
}

export interface AbsensiKaryawan {
  id: string;
  tanggal: string;
  waktuCheckin: string;
  karyawanId: string;
  namaKaryawan?: string;
  statusKehadiran: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
}

export interface AbsensiPekerja {
  id: string;
  tanggal: string;
  namaTukang: string;
  statusKehadiran: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  keterangan: string;
}

export interface Pekerja {
  id: string;
  namaTukang: string;
  noHp: string;
  kategoriPekerjaan: 'struktur' | 'plafon' | 'atap' | 'listrik' | 'pembersihan' | 'drainase';
}

export interface LeadPenjualan {
  id: string;
  namaCustomer: string;
  namaProjek: string;
  namaBlok: string;
  namaMarketing: string;
  leadStatus: 'booking' | 'dp' | 'pmberkasan' | 'tunggu akad' | 'akad' | 'batal';
  noWhatsapp?: string;
  tanggalInput?: string;
}

export interface FeeMarketing {
  id: string;
  namaMarketing: string;
  komisi: number;
  statusPembayaran: 'Lunas' | 'Belum Bayar';
  tanggalPembayaran: string;
  noWhatsapp?: string;
  namaProjek?: string;
  namaBlok?: string;
}
