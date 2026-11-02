-- Schema Database SISPER (Sistem Informasi Perumahan)
-- Salin dan jalankan seluruh query di bawah ini pada SQL Editor Supabase Anda.

-- ===========================================================================
-- 1. DROP EXISTING TABLES (Jika ada, agar siap dipasang bersih)
-- ===========================================================================
DROP TABLE IF EXISTS "fee_marketing" CASCADE;
DROP TABLE IF EXISTS "leads_penjualan" CASCADE;
DROP TABLE IF EXISTS "absensi_pekerja" CASCADE;
DROP TABLE IF EXISTS "absensi_karyawan" CASCADE;
DROP TABLE IF EXISTS "karyawan" CASCADE;
DROP TABLE IF EXISTS "rincian_pembayaran" CASCADE;
DROP TABLE IF EXISTS "progres_pekerjaan" CASCADE;
DROP TABLE IF EXISTS "transaksi_material" CASCADE;
DROP TABLE IF EXISTS "konstruksi" CASCADE;
DROP TABLE IF EXISTS "inventory" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;
DROP TABLE IF EXISTS "gudang" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "pekerja" CASCADE;

-- ===========================================================================
-- 2. CREATE TABLES WITH EXACT TYPE MAPPINGS
-- ===========================================================================

-- Projects Table
CREATE TABLE "projects" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL
);

-- Gudang Table
CREATE TABLE "gudang" (
  "id" TEXT PRIMARY KEY,
  "namaGudang" TEXT NOT NULL,
  "lokasi" TEXT NOT NULL
);

-- Suppliers Table
CREATE TABLE "suppliers" (
  "id" TEXT PRIMARY KEY,
  "namaSupplier" TEXT NOT NULL,
  "noHp" TEXT NOT NULL,
  "alamat" TEXT NOT NULL
);

-- Inventory Table
CREATE TABLE "inventory" (
  "id" TEXT PRIMARY KEY,
  "namaMaterial" TEXT NOT NULL,
  "idGudang" TEXT NOT NULL,
  "jumlahStok" FLOAT8 NOT NULL DEFAULT 0,
  "satuan" TEXT NOT NULL,
  "minimumStock" FLOAT8 NOT NULL DEFAULT 0,
  "harga" NUMERIC NOT NULL DEFAULT 0,
  "kategoriMaterial" TEXT NOT NULL
);

-- Konstruksi Table
CREATE TABLE "konstruksi" (
  "id" TEXT PRIMARY KEY, -- Blok unit (e.g., "A-01")
  "projectId" TEXT NOT NULL,
  "projectName" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "luasTanah" NUMERIC NOT NULL DEFAULT 0,
  "luasBangunan" NUMERIC NOT NULL DEFAULT 0,
  "statusPembangunan" TEXT NOT NULL,
  "statusPenjualan" TEXT NOT NULL,
  "tanggalMulaiBangun" DATE NOT NULL
);

-- Transaksi Material Table
CREATE TABLE "transaksi_material" (
  "id" TEXT PRIMARY KEY,
  "namaMaterial" TEXT NOT NULL,
  "namaGudang" TEXT NOT NULL,
  "blokRumah" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "jumlah" NUMERIC NOT NULL DEFAULT 0,
  "tanggal" DATE NOT NULL,
  "catatan" TEXT
);

-- Progres Pekerjaan Table
CREATE TABLE "progres_pekerjaan" (
  "id" TEXT PRIMARY KEY,
  "blokRumah" TEXT NOT NULL,
  "namaTukang" TEXT NOT NULL,
  "noHp" TEXT NOT NULL,
  "kategoriPekerjaan" TEXT NOT NULL,
  "itemPekerjaan" TEXT NOT NULL,
  "persentasiProgres" NUMERIC NOT NULL DEFAULT 0,
  "nilaiPekerjaan" NUMERIC NOT NULL DEFAULT 0,
  "totalNilaiPekerjaan" NUMERIC NOT NULL DEFAULT 0,
  "catatan" TEXT
);

-- Rincian Pembayaran Table
CREATE TABLE "rincian_pembayaran" (
  "id" TEXT PRIMARY KEY,
  "namaTukang" TEXT NOT NULL,
  "kategoriPekerjaan" TEXT NOT NULL,
  "nilaiPembayaran" NUMERIC NOT NULL DEFAULT 0,
  "tanggalPembayaran" DATE NOT NULL,
  "namaProjek" TEXT,
  "namaBlok" TEXT
);

-- Karyawan Table
CREATE TABLE "karyawan" (
  "id" TEXT PRIMARY KEY,
  "namaKaryawan" TEXT NOT NULL,
  "jabatan" TEXT NOT NULL,
  "gajiHarian" NUMERIC NOT NULL DEFAULT 0,
  "tanggalGabung" DATE NOT NULL
);

-- Absensi Karyawan Table
CREATE TABLE "absensi_karyawan" (
  "id" TEXT PRIMARY KEY,
  "tanggal" DATE NOT NULL,
  "waktuCheckin" TEXT NOT NULL,
  "karyawanId" TEXT NOT NULL,
  "statusKehadiran" TEXT NOT NULL
);

-- Absensi Pekerja Table
CREATE TABLE "absensi_pekerja" (
  "id" TEXT PRIMARY KEY,
  "tanggal" DATE NOT NULL,
  "namaTukang" TEXT NOT NULL,
  "statusKehadiran" TEXT NOT NULL,
  "keterangan" TEXT
);

-- Pekerja Table
CREATE TABLE "pekerja" (
  "id" TEXT PRIMARY KEY,
  "namaTukang" TEXT NOT NULL,
  "noHp" TEXT NOT NULL,
  "kategoriPekerjaan" TEXT NOT NULL
);

-- Leads Penjualan Table
CREATE TABLE "leads_penjualan" (
  "id" TEXT PRIMARY KEY,
  "namaCustomer" TEXT NOT NULL,
  "namaProjek" TEXT NOT NULL,
  "namaBlok" TEXT NOT NULL,
  "namaMarketing" TEXT NOT NULL,
  "leadStatus" TEXT NOT NULL,
  "noWhatsapp" TEXT,
  "tanggalInput" DATE
);

-- Fee Marketing Table
CREATE TABLE "fee_marketing" (
  "id" TEXT PRIMARY KEY,
  "namaMarketing" TEXT NOT NULL,
  "komisi" NUMERIC NOT NULL DEFAULT 0,
  "statusPembayaran" TEXT NOT NULL,
  "tanggalPembayaran" TEXT NOT NULL,
  "noWhatsapp" TEXT,
  "namaProjek" TEXT,
  "namaBlok" TEXT
);

-- ===========================================================================
-- 3. ACTIVATE ROW LEVEL SECURITY (RLS) FOR PUBLIC ACCESS
--    Guna memudahkan development, kita aktifkan policy default READ & WRITE
-- ===========================================================================
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gudang" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "konstruksi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaksi_material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "progres_pekerjaan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rincian_pembayaran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "karyawan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "absensi_karyawan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "absensi_pekerja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads_penjualan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fee_marketing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pekerja" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select all" ON "projects" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "projects" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "projects" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "gudang" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "gudang" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "gudang" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "suppliers" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "suppliers" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "suppliers" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "inventory" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "inventory" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "inventory" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "konstruksi" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "konstruksi" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "konstruksi" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "transaksi_material" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "transaksi_material" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "transaksi_material" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "progres_pekerjaan" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "progres_pekerjaan" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "progres_pekerjaan" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "rincian_pembayaran" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "rincian_pembayaran" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "rincian_pembayaran" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "karyawan" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "karyawan" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "karyawan" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "absensi_karyawan" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "absensi_karyawan" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "absensi_karyawan" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "absensi_pekerja" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "absensi_pekerja" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "absensi_pekerja" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "leads_penjualan" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "leads_penjualan" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "leads_penjualan" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "fee_marketing" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "fee_marketing" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "fee_marketing" FOR UPDATE USING (true);

CREATE POLICY "Allow public select all" ON "pekerja" FOR SELECT USING (true);
CREATE POLICY "Allow public insert all" ON "pekerja" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all" ON "pekerja" FOR UPDATE USING (true);

-- ===========================================================================
-- 4. INSERT DATA SEEDING (Inisialisasi Data Demo)
-- ===========================================================================

-- Projects
INSERT INTO "projects" ("id", "name", "location") VALUES
('prj-01', 'Permata Hijau Residence', 'Bandung Utara'),
('prj-02', 'Griya Harmony Cluster', 'Cibubur, Depok'),
('prj-03', 'Grand Nirwana Regency', 'Sidoarjo, Surabaya');

-- Gudang
INSERT INTO "gudang" ("id", "namaGudang", "lokasi") VALUES
('gud-01', 'Gudang Utama Permata', 'Permata Hijau Blok G'),
('gud-02', 'Gudang Transit Griya', 'Harmony Cluster Ruko A'),
('gud-03', 'Gudang Sentral Nirwana', 'Grand Sentral Regency Kav 14');

-- Suppliers
INSERT INTO "suppliers" ("id", "namaSupplier", "noHp", "alamat") VALUES
('sup-01', 'CV. Sinar Baja Abadi', '081234567890', 'Jl. Industri No. 45, Bandung'),
('sup-02', 'PT. Semen Nusantara Prima', '081987654321', 'Kawasan Industri Gresik, Jatim'),
('sup-03', 'Toko Surya Kelistrikan', '085643210987', 'Jl. Margonda Raya No. 120, Depok');

-- Inventory
INSERT INTO "inventory" ("id", "namaMaterial", "idGudang", "jumlahStok", "satuan", "minimumStock", "harga", "kategoriMaterial") VALUES
('mat-01', 'Semen Tigaroda 50kg', 'gud-01', 450, 'Semen/Sak', 80, 72000, 'Struktur'),
('mat-02', 'Besi Beton 10mm', 'gud-01', 120, 'Batang', 50, 95000, 'Struktur'),
('mat-03', 'Pasir Muntilan Pasang', 'gud-01', 18, 'M3 (Kubik)', 5, 320000, 'Struktur'),
('mat-04', 'Genteng Keramik Kanmuri', 'gud-02', 3400, 'Pcs', 1000, 14500, 'Atap'),
('mat-05', 'Gipsum Jayaboard 9mm', 'gud-02', 85, 'Lembar', 30, 68000, 'Plafon'),
('mat-06', 'Kabel NYM 3x2.5 Eternal', 'gud-03', 14, 'Roll', 4, 650000, 'Kelistrikan'),
('mat-07', 'Keramik Lantai 60x60 Milan', 'gud-03', 90, 'Dus', 25, 135000, 'Finishing');

-- Konstruksi
INSERT INTO "konstruksi" ("id", "projectId", "projectName", "type", "luasTanah", "luasBangunan", "statusPembangunan", "statusPenjualan", "tanggalMulaiBangun") VALUES
('A-01', 'prj-01', 'Permata Hijau Residence', 'Type 45', 90, 45, 'terbangun', 'terjual', '2026-01-10'),
('A-02', 'prj-01', 'Permata Hijau Residence', 'Type 45', 90, 45, 'onProgres', 'terbooking', '2026-03-05'),
('A-03', 'prj-01', 'Permata Hijau Residence', 'Type 36', 72, 36, 'terbangun', 'tersedia', '2026-02-15'),
('B-01', 'prj-02', 'Griya Harmony Cluster', 'Type 60', 120, 60, 'onProgres', 'terbooking', '2026-04-01'),
('B-02', 'prj-02', 'Griya Harmony Cluster', 'Type 36', 72, 36, 'terbangun', 'terjual', '2026-01-20'),
('B-03', 'prj-02', 'Griya Harmony Cluster', 'Type 120/120', 150, 120, 'onProgres', 'tersedia', '2026-05-10'),
('C-01', 'prj-03', 'Grand Nirwana Regency', 'Type 72', 105, 72, 'terbangun', 'terjual', '2025-11-12'),
('C-02', 'prj-03', 'Grand Nirwana Regency', 'Type 72', 105, 72, 'onProgres', 'terbooking', '2026-03-20'),
('C-03', 'prj-03', 'Grand Nirwana Regency', 'Type 45', 84, 45, 'terbangun', 'terbooking', '2026-02-01');

-- Transaksi Material
INSERT INTO "transaksi_material" ("id", "namaMaterial", "namaGudang", "blokRumah", "type", "jumlah", "tanggal", "catatan") VALUES
('tr-01', 'Semen Tigaroda 50kg', 'Gudang Utama Permata', 'A-02', 'keluar', 50, '2026-05-15', 'Pekerjaan struktur pondasi dan slup'),
('tr-02', 'Besi Beton 10mm', 'Gudang Utama Permata', 'A-02', 'keluar', 30, '2026-05-16', 'Perakitan kolom utama'),
('tr-03', 'Semen Tigaroda 50kg', 'Gudang Utama Permata', 'A-01', 'masuk', 100, '2026-05-20', 'Drop supply bahan sisa prj-02'),
('tr-04', 'Genteng Keramik Kanmuri', 'Gudang Transit Griya', 'B-01', 'keluar', 1200, '2026-05-22', 'Pemasangan genteng blok Ruko');

-- Progres Pekerjaan
INSERT INTO "progres_pekerjaan" ("id", "blokRumah", "namaTukang", "noHp", "kategoriPekerjaan", "itemPekerjaan", "persentasiProgres", "nilaiPekerjaan", "totalNilaiPekerjaan", "catatan") VALUES
('prog-01', 'A-01', 'Pak Joko Budiman', '081211112222', 'struktur', 'Pondasi & Dinding', 100, 15000000, 15000000, 'Selesai 100%'),
('prog-02', 'A-01', 'Pak Slamet Riyadi', '081233334444', 'atap', 'Baja Ringan & Genteng', 100, 12000000, 12000000, 'Rangka baja ringan kokoh'),
('prog-03', 'A-01', 'Pak Ahmad K', '081255556666', 'plafon', 'Papan gipsum & cat plafon', 100, 8000000, 8000000, 'Selesai rapi'),
('prog-04', 'A-02', 'Pak Joko Budiman', '081211112222', 'struktur', 'Balok & Daster Dinding', 90, 15000000, 13500000, 'Balok gantung selesai, dinding tinggal diaci'),
('prog-05', 'A-02', 'Pak Slamet Riyadi', '081233334444', 'atap', 'Rangka kuda-kuda kayu/baja', 40, 11000000, 4400000, 'Sedang pasang kuda-kuda pertama'),
('prog-06', 'A-02', 'Pak Sugeng Widodo', '081277778888', 'listrik', 'Instalasi stopkontak & kabel', 30, 6000000, 1800000, 'Pipa tertanam 70%, kabel ditarik sebagian'),
('prog-07', 'B-01', 'Pak Joko Budiman', '081211112222', 'struktur', 'Semenisasi Lantai', 15, 14000000, 2100000, 'Urugan pasir matang'),
('prog-08', 'B-02', 'Pak Ahmad K', '081255556666', 'plafon', 'Plafon Drop Ceiling', 100, 10000000, 10000000, 'Sangat rapi sesuai konsep');

-- Rincian Pembayaran
INSERT INTO "rincian_pembayaran" ("id", "namaTukang", "kategoriPekerjaan", "nilaiPembayaran", "tanggalPembayaran", "namaProjek", "namaBlok") VALUES
('pay-01', 'Pak Joko Budiman', 'struktur', 12000000, '2026-05-10', 'Griya Harmony Cluster', 'B-01'),
('pay-02', 'Pak Slamet Riyadi', 'atap', 10000000, '2026-05-12', 'Permata Hijau Residence', 'A-01'),
('pay-03', 'Pak Ahmad K', 'plafon', 15000000, '2026-05-14', 'Griya Harmony Cluster', 'B-02');

-- Karyawan
INSERT INTO "karyawan" ("id", "namaKaryawan", "jabatan", "gajiHarian", "tanggalGabung") VALUES
('kar-01', 'Adi Wijaya, S.T.', 'Site Manager', 9500000, '2025-01-15'),
('kar-02', 'Dina Lestari', 'Logistik Gudang', 4800000, '2025-06-01'),
('kar-03', 'Budi Saputra', 'Supervisor Lapangan', 6800000, '2025-03-10'),
('kar-04', 'Siti Rahmawati', 'Administrasi Projek', 4500000, '2025-08-20');

-- Absensi Karyawan
INSERT INTO "absensi_karyawan" ("id", "tanggal", "waktuCheckin", "karyawanId", "statusKehadiran") VALUES
('abs-01', '2026-05-28', '07:45', 'kar-01', 'Hadir'),
('abs-02', '2026-05-28', '07:55', 'kar-02', 'Hadir'),
('abs-03', '2026-05-28', '08:15', 'kar-03', 'Hadir'),
('abs-04', '2026-05-28', '-', 'kar-04', 'Izin'),
('abs-05', '2026-05-27', '07:40', 'kar-01', 'Hadir'),
('abs-06', '2026-05-27', '07:50', 'kar-02', 'Hadir'),
('abs-07', '2026-05-27', '08:00', 'kar-03', 'Hadir'),
('abs-08', '2026-05-27', '07:55', 'kar-04', 'Hadir');

-- Absensi Pekerja
INSERT INTO "absensi_pekerja" ("id", "tanggal", "namaTukang", "statusKehadiran", "keterangan") VALUES
('absp-01', '2026-05-28', 'Pak Joko Budiman', 'Hadir', 'Mulai pasang dinding bata'),
('absp-02', '2026-05-28', 'Pak Slamet Riyadi', 'Hadir', 'Pasang balok kayu atap'),
('absp-03', '2026-05-28', 'Pak Ahmad K', 'Hadir', 'Finishing plafon'),
('absp-04', '2026-05-28', 'Pak Joko', 'Izin', 'Acara keluarga'),
('absp-05', '2026-05-27', 'Pak Joko Budiman', 'Hadir', 'Pekerjaan struktur kolom'),
('absp-06', '2026-05-27', 'Pak Slamet Riyadi', 'Hadir', 'Pengukuran atap'),
('absp-07', '2026-05-27', 'Pak Ahmad K', 'Sakit', 'Demam tinggi'),
('absp-08', '2026-05-27', 'Pak Joko', 'Hadir', 'Instalasi stop kontak');

-- Leads Penjualan
INSERT INTO "leads_penjualan" ("id", "namaCustomer", "namaProjek", "namaBlok", "namaMarketing", "leadStatus", "noWhatsapp", "tanggalInput") VALUES
('led-01', 'Muhammad Farhan', 'Permata Hijau Residence', 'A-01', 'Rian Firdaus', 'akad', '081234567891', '2026-05-10'),
('led-02', 'Dewi Anggraini', 'Permata Hijau Residence', 'A-02', 'Sarah Amalia', 'pmberkasan', '085787654321', '2026-05-12'),
('led-03', 'Hendra Setiawan', 'Griya Harmony Cluster', 'B-01', 'Sarah Amalia', 'dp', '081298765430', '2026-05-15'),
('led-04', 'Lilis Karlina', 'Griya Harmony Cluster', 'B-02', 'Rian Firdaus', 'akad', '089676543210', '2026-05-18'),
('led-05', 'Joko Susilo', 'Grand Nirwana Regency', 'C-02', 'Andi Wijaya', 'booking', '085209876543', '2026-05-20'),
('led-06', 'Rina Herawati', 'Grand Nirwana Regency', 'C-03', 'Sarah Amalia', 'tunggu akad', '081345678901', '2026-05-22'),
('led-07', 'Anwar Sadat', 'Permata Hijau Residence', 'A-03', 'Rian Firdaus', 'batal', '081198765432', '2026-05-25');

-- Fee Marketing
INSERT INTO "fee_marketing" ("id", "namaMarketing", "komisi", "statusPembayaran", "tanggalPembayaran", "noWhatsapp", "namaProjek", "namaBlok") VALUES
('fee-01', 'Rian Firdaus', 12500000, 'Lunas', '2026-04-30', '081223344556', 'Permata Hijau Residence', 'A-01'),
('fee-02', 'Sarah Amalia', 8000000, 'Belum Bayar', '-', '085711223344', 'Griya Harmony Cluster', 'B-01'),
('fee-03', 'Andi Wijaya', 5000000, 'Belum Bayar', '-', '081399887766', 'Grand Nirwana Regency', 'C-02'),
('fee-04', 'Rian Firdaus', 15000000, 'Lunas', '2026-05-20', '081223344556', 'Permata Hijau Residence', 'A-02');

-- Pekerja
INSERT INTO "pekerja" ("id", "namaTukang", "noHp", "kategoriPekerjaan") VALUES
('pekerja-01', 'Pak Joko Budiman', '081211112222', 'struktur'),
('pekerja-02', 'Pak Slamet Riyadi', '081233334444', 'atap'),
('pekerja-03', 'Pak Ahmad K', '081255556666', 'plafon'),
('pekerja-04', 'Pak Sugeng Widodo', '081277778888', 'listrik'),
('pekerja-05', 'Pak Supri', '081299990000', 'pembersihan');
