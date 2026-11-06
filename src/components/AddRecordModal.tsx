import React from 'react';
import { X, Save, AlertCircle, AlertTriangle } from 'lucide-react';
import { Project, Gudang, Karyawan, Konstruksi, Inventory, ProgresPekerjaan, Pekerja, Supplier, RabTemplate, RabDetail, TransaksiMaterial } from '../types';
import { getWitaToday, normalizeDateString } from '../utils/timezone';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'project' | 'konstruksi' | 'progres' | 'inventory' | 'gudang' | 'supplier' | 'transaksi' | 'pembayaran' | 'fee' | 'karyawan' | 'absensi' | 'absensi_pekerja' | 'lead' | 'rab_template' | 'rab_detail' | '';
  projects: Project[];
  gudangList: Gudang[];
  karyawanList: Karyawan[];
  konstruksiList: Konstruksi[];
  inventoryList: Inventory[];
  progresList?: ProgresPekerjaan[];
  pekerjaList?: Pekerja[];
  supplierList?: Supplier[];
  rabTemplateList?: RabTemplate[];
  rabDetailList?: RabDetail[];
  transaksiList?: TransaksiMaterial[];
  defaultRabId?: string;
  onSave: (data: any) => void;
  onOpenAddProject?: () => void;
}

export default function AddRecordModal({
  isOpen,
  onClose,
  type,
  projects,
  gudangList,
  karyawanList,
  konstruksiList,
  inventoryList,
  progresList = [],
  pekerjaList = [],
  supplierList = [],
  rabTemplateList = [],
  rabDetailList = [],
  transaksiList = [],
  defaultRabId = '',
  onSave,
  onOpenAddProject,
}: AddRecordModalProps) {
  if (!isOpen || !type) return null;

  // Generic state object to capture any form variables dynamically
  const [formData, setFormData] = React.useState<any>({});
  const [errorMsg, setErrorMsg] = React.useState('');

  // Calculate live RAB budget check for transaksi material keluar
  const rabBudgetCheck = React.useMemo(() => {
    if (type !== 'transaksi' || formData.type !== 'keluar' || !formData.blokRumah || !formData.namaMaterial) {
      return null;
    }

    const targetBlok = konstruksiList.find(k => k.id === formData.blokRumah);
    if (!targetBlok) return null;

    const targetProject = projects.find(p => p.id === targetBlok.projectId);
    if (!targetProject || !targetProject.rabId) return null;

    const rabTemplate = rabTemplateList.find(r => r.id === targetProject.rabId);
    if (!rabTemplate) return null;

    const rabItem = rabDetailList.find(
      d => d.rabId === targetProject.rabId && d.namaMaterial.toLowerCase().trim() === formData.namaMaterial.toLowerCase().trim()
    );
    if (!rabItem) return null;

    const pastUsage = transaksiList
      .filter(t => t.type === 'keluar' && t.blokRumah === formData.blokRumah && t.namaMaterial.toLowerCase().trim() === formData.namaMaterial.toLowerCase().trim())
      .reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0);

    const inputQty = parseFloat(String(formData.jumlah || '').replace(',', '.')) || 0;
    const projectedTotal = Math.round((pastUsage + inputQty) * 1000) / 1000;
    const isExceeded = projectedTotal > rabItem.qtyStandar;
    const overQty = Math.max(0, Math.round((projectedTotal - rabItem.qtyStandar) * 1000) / 1000);

    return {
      rabName: rabTemplate.namaRab,
      standardQty: rabItem.qtyStandar,
      satuan: rabItem.satuan,
      pastUsage,
      inputQty,
      projectedTotal,
      isExceeded,
      overQty,
      percentage: Math.round((projectedTotal / rabItem.qtyStandar) * 100),
    };
  }, [type, formData.type, formData.blokRumah, formData.namaMaterial, formData.jumlah, konstruksiList, projects, rabTemplateList, rabDetailList, transaksiList]);

  // Extract unique workers combining registered workers (pekerjaList) and progress records (progresList)
  const uniqueWorkers = React.useMemo(() => {
    const map = new Map<string, { namaTukang: string; noHp: string; kategori?: string }>();

    // 1. First add from master pekerjaList (database)
    (pekerjaList || []).forEach((p) => {
      const name = p.namaTukang?.trim();
      if (!name || name === 'Belum Ditunjuk') return;
      const key = name.toLowerCase();
      map.set(key, { namaTukang: name, noHp: p.noHp || '', kategori: p.kategoriPekerjaan });
    });

    // 2. Also add from progresList if not already present
    (progresList || []).forEach((p) => {
      const name = p.namaTukang?.trim();
      if (!name || name === 'Belum Ditunjuk') return;
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { namaTukang: name, noHp: p.noHp || '', kategori: p.kategoriPekerjaan });
      } else {
        const existing = map.get(key)!;
        if (p.noHp && p.noHp !== '-' && (!existing.noHp || existing.noHp === '-')) {
          existing.noHp = p.noHp;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.namaTukang.localeCompare(b.namaTukang));
  }, [pekerjaList, progresList]);

  // Initializing default form fields based on type
  React.useEffect(() => {
    const today = getWitaToday();
    
    if (type === 'project') {
      setFormData({
        id: '',
        name: '',
        location: '',
        rabId: rabTemplateList[0]?.id || '',
      });
    } else if (type === 'konstruksi') {
      setFormData({
        id: '',
        projectId: projects[0]?.id || '',
        projectName: projects[0]?.name || '',
        type: 'Type 36',
        luasTanah: 91,
        luasBangunan: 36,
        statusPembangunan: 'onProgres',
        statusPenjualan: 'tersedia',
        tanggalMulaiBangun: today,
        autoGenerateJobs: true,
        workerStruktur: '',
        workerAtap: '',
        workerPlafon: '',
        workerListrik: '',
        workerPembersihan: '',
        workerDrainase: '',
      });
    } else if (type === 'progres') {
      setFormData({
        blokRumah: konstruksiList[0]?.id || 'A01',
        namaTukang: '',
        noHp: '',
        kategoriPekerjaan: 'struktur',
        itemPekerjaan: '',
        persentasiProgres: 50,
        nilaiPekerjaan: 10000000,
        catatan: '',
      });
    } else if (type === 'inventory') {
      setFormData({
        namaMaterial: '',
        idGudang: gudangList[0]?.id || '',
        jumlahStok: 100,
        satuan: 'Sak',
        minimumStock: 20,
        harga: 75000,
        kategoriMaterial: 'Struktur',
      });
    } else if (type === 'gudang') {
      setFormData({
        namaGudang: '',
        lokasi: '',
      });
    } else if (type === 'supplier') {
      setFormData({
        namaSupplier: '',
        noHp: '',
        alamat: '',
      });
    } else if (type === 'transaksi') {
      setFormData({
        namaMaterial: inventoryList[0]?.namaMaterial || 'Semen Tigaroda 50kg',
        namaGudang: gudangList[0]?.namaGudang || 'Gudang Utama Permata',
        blokRumah: konstruksiList[0]?.id || 'A-02',
        type: 'keluar',
        jumlah: 10,
        tanggal: today,
        catatan: '',
        supplier: '',
      });
    } else if (type === 'pembayaran') {
      const defaultWorker = (pekerjaList && pekerjaList.length > 0)
        ? pekerjaList[0]
        : (uniqueWorkers && uniqueWorkers.length > 0)
        ? { namaTukang: uniqueWorkers[0].namaTukang, kategoriPekerjaan: 'struktur' }
        : { namaTukang: 'Pak Joko Budiman', kategoriPekerjaan: 'struktur' };

      setFormData({
        namaTukang: defaultWorker.namaTukang,
        kategoriPekerjaan: (defaultWorker as any).kategoriPekerjaan || 'struktur',
        nilaiPembayaran: '',
        tanggalPembayaran: today,
        namaProjek: projects[0]?.name || '',
        namaBlok: konstruksiList[0]?.id || 'A-01',
      });
    } else if (type === 'fee') {
      setFormData({
        namaMarketing: 'Sarah Amalia',
        komisi: 5000000,
        statusPembayaran: 'Belum Bayar',
        tanggalPembayaran: '-',
        noWhatsapp: '',
        namaProjek: projects[0]?.name || '',
        namaBlok: konstruksiList[0]?.id || 'A-01',
      });
    } else if (type === 'karyawan') {
      setFormData({
        namaKaryawan: '',
        jabatan: 'Staff Teknis',
        whatsup: '',
        tanggalGabung: today,
      });
    } else if (type === 'absensi') {
      setFormData({
        tanggal: today,
        waktuCheckin: '08:00',
        karyawanId: karyawanList[0]?.id || '',
        statusKehadiran: 'Hadir',
      });
    } else if (type === 'absensi_pekerja') {
      const defaultWorkerName = uniqueWorkers[0]?.namaTukang || (pekerjaList[0]?.namaTukang) || '';
      setFormData({
        tanggal: today,
        namaTukang: defaultWorkerName,
        statusKehadiran: 'Hadir',
        keterangan: '',
      });
    } else if (type === 'lead') {
      setFormData({
        namaCustomer: '',
        namaProjek: projects[0]?.name || 'Permata Hijau Residence',
        namaBlok: konstruksiList[0]?.id || 'A-01',
        namaMarketing: 'Sarah Amalia',
        leadStatus: 'booking',
        noWhatsapp: '',
        tanggalInput: today,
      });
    } else if (type === 'rab_template') {
      setFormData({
        namaRab: '',
        keterangan: '',
      });
    } else if (type === 'rab_detail') {
      setFormData({
        rabId: defaultRabId || rabTemplateList[0]?.id || '',
        namaMaterial: inventoryList[0]?.namaMaterial || '',
        satuan: inventoryList[0]?.satuan || 'Sak',
        qtyStandar: 50,
      });
    }
    setErrorMsg('');
  }, [type, projects, gudangList, karyawanList, konstruksiList, inventoryList, progresList, pekerjaList, defaultRabId, rabTemplateList]);

  const handleChange = (key: string, value: any) => {
    let finalValue = value;
    if (key === 'jumlah') {
      finalValue = value;
    } else if (['luasTanah', 'luasBangunan', 'jumlahStok', 'minimumStock', 'harga', 'persentasiProgres', 'nilaiPekerjaan', 'nilaiPembayaran', 'komisi'].includes(key)) {
      finalValue = value === '' ? '' : (Number(value) || 0);
    }

    // Auto update project name if projectId changes
    if (key === 'projectId' && type === 'konstruksi') {
      const selectedProj = projects.find(p => p.id === value);
      setFormData((prev: any) => ({
        ...prev,
        projectId: value,
        projectName: selectedProj ? selectedProj.name : '',
      }));
      return;
    }

    // Auto update category for selected worker in payment form
    if (key === 'namaTukang' && type === 'pembayaran') {
      const selectedWorker = (pekerjaList || []).find(p => p.namaTukang === value);
      if (selectedWorker) {
        setFormData((prev: any) => ({
          ...prev,
          namaTukang: value,
          kategoriPekerjaan: selectedWorker.kategoriPekerjaan,
        }));
        return;
      }
    }

    setFormData((prev: any) => ({
      ...prev,
      [key]: finalValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom Validation
    if (type === 'project' && (!formData.name || !formData.location)) {
       setErrorMsg('Mohon lengkapi Nama Projek dan Lokasi Perumahan.');
       return;
    }
    if (type === 'konstruksi' && !formData.id) {
       setErrorMsg('Mohon isi Nomor Blok Rumah (misal: A-12)');
       return;
    }
    if (type === 'progres' && (!formData.namaTukang || !formData.itemPekerjaan)) {
       setErrorMsg('Mohon lengkapi nama tukang dan item pekerjaan.');
       return;
    }
    if (type === 'inventory' && !formData.namaMaterial) {
       setErrorMsg('Mohon isi nama material / barang.');
       return;
    }
    if (type === 'gudang' && !formData.namaGudang) {
       setErrorMsg('Mohon isi nama gudang.');
       return;
    }
    if (type === 'supplier' && !formData.namaSupplier) {
      setErrorMsg('Mohon isi nama supplier.');
      return;
    }
    if (type === 'karyawan' && !formData.namaKaryawan) {
      setErrorMsg('Mohon isi nama karyawan.');
      return;
    }
    if (type === 'absensi_pekerja' && !formData.namaTukang) {
      setErrorMsg('Mohon tentukan atau isi nama tukang / pekerja.');
      return;
    }
    if (type === 'lead' && !formData.namaCustomer) {
      setErrorMsg('Mohon isi nama customer lead.');
      return;
    }
    if (type === 'rab_template' && !formData.namaRab) {
      setErrorMsg('Mohon isi nama template RAB.');
      return;
    }
    if (type === 'transaksi') {
      const parsedJumlah = parseFloat(String(formData.jumlah || '').replace(',', '.'));
      if (isNaN(parsedJumlah) || parsedJumlah <= 0) {
        setErrorMsg('Mohon isi kuantitas / jumlah mutasi yang valid (lebih dari 0, contoh: 0.5 atau 1).');
        return;
      }
      formData.jumlah = parsedJumlah;
    }
    if (type === 'rab_detail' && (!formData.namaMaterial || !formData.qtyStandar)) {
      setErrorMsg('Mohon isi nama material dan kuantitas standar RAB.');
      return;
    }

    // Pass data back to save handler
    onSave(formData);
    onClose();
  };

  const getModalTitle = () => {
    switch (type) {
      case 'project': return 'Tambah Projek Perumahan Baru';
      case 'konstruksi': return 'Tambah Unit Blok';
      case 'progres': return 'Input Progres Pekerjaan';
      case 'inventory': return 'Tambah Stok Material';
      case 'gudang': return 'Tambah Gudang Baru';
      case 'supplier': return 'Tambah Partner Supplier';
      case 'transaksi': return 'Catat Mutasi Material';
      case 'pembayaran': return 'Catat Pembayaran Pekerja';
      case 'fee': return 'Catat Fee Marketing';
      case 'karyawan': return 'Tambah Data Karyawan';
      case 'absensi': return 'Catat Absensi Karyawan';
      case 'absensi_pekerja': return 'Catat Absensi Pekerja';
      case 'lead': return 'Tambah Lead Penjualan';
      case 'rab_template': return 'Buat Template RAB Baru';
      case 'rab_detail': return 'Tambah Standar Material RAB';
      default: return 'Tambah Record';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/40 bg-white/85 backdrop-blur-2xl shadow-2xl animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/40 px-6 py-4">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-lg uppercase tracking-wide">
              {getModalTitle()}
            </h3>
            <p className="text-xs text-slate-500">Isi formulir berikut untuk mendaftarkan record baru</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-4">
          
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 0. Form Projek Perumahan Baru */}
          {type === 'project' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Projek Perumahan*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Grand Permata Residence"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lokasi / Alamat Projek*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Sudirman KM 5, Palembang"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kode / ID Projek (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Auto: proj-xxxx"
                    value={formData.id || ''}
                    onChange={(e) => handleChange('id', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-black"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Biarkan kosong untuk ID otomatis</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Template RAB Standar</label>
                  <select
                    value={formData.rabId || ''}
                    onChange={(e) => handleChange('rabId', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-black"
                  >
                    <option value="">-- Tanpa Template RAB --</option>
                    {rabTemplateList.map((r) => (
                      <option key={r.id} value={r.id}>{r.namaRab}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Acuan batas material unit rumah</span>
                </div>
              </div>
            </>
          )}

          {/* 1. Kofigurasi Konstruksi */}
          {type === 'konstruksi' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nomor Blok (ID)*</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: A-04"
                    value={formData.id || ''}
                    onChange={(e) => handleChange('id', e.target.value.toUpperCase())}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-black"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 block">Projek Perumahan*</label>
                    {onOpenAddProject && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAddProject();
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        + Buat Baru
                      </button>
                    )}
                  </div>
                  {projects.length === 0 ? (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex flex-col gap-1">
                      <span>Belum ada data projek.</span>
                      {onOpenAddProject && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAddProject();
                          }}
                          className="self-start text-[10px] font-bold px-2 py-0.5 bg-amber-600 text-white rounded-md cursor-pointer"
                        >
                          + Tambah Projek
                        </button>
                      )}
                    </div>
                  ) : (
                    <select
                      value={formData.projectId || ''}
                      onChange={(e) => handleChange('projectId', e.target.value)}
                      className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-black"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tipe Rumah</label>
                <input
                  type="text"
                  placeholder="Contoh: Type 36, Type 45, Type 70"
                  value={formData.type || ''}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Luas Tanah (m²)</label>
                  <input
                    type="number"
                    value={formData.luasTanah || 0}
                    onChange={(e) => handleChange('luasTanah', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Luas Bangunan (m²)</label>
                  <input
                    type="number"
                    value={formData.luasBangunan || 0}
                    onChange={(e) => handleChange('luasBangunan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Status Konstruksi</label>
                  <select
                    value={formData.statusPembangunan || 'onProgres'}
                    onChange={(e) => handleChange('statusPembangunan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    <option value="onProgres">onProgres</option>
                    <option value="terbangun">terbangun</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Status Penjualan</label>
                  <select
                    value={formData.statusPenjualan || 'tersedia'}
                    onChange={(e) => handleChange('statusPenjualan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    <option value="tersedia">Tersedia</option>
                    <option value="terbooking">Terbooking</option>
                    <option value="terjual">Terjual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Mulai Bangun</label>
                <input
                  type="date"
                  value={formData.tanggalMulaiBangun || ''}
                  onChange={(e) => handleChange('tanggalMulaiBangun', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>

              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100/75 rounded-2xl flex items-start gap-3 mt-2 select-none">
                <input
                  type="checkbox"
                  id="autoGenerateJobs"
                  checked={formData.autoGenerateJobs === true}
                  onChange={(e) => handleChange('autoGenerateJobs', e.target.checked)}
                  className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="autoGenerateJobs" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 block">Buat 18 Item Pekerjaan Otomatis</span>
                  <span className="text-[10px] text-slate-500 leading-snug block mt-0.5">
                    Sistem akan otomatis membuat 18 item rencana pekerjaan standard (Struktur, Atap, Listrik, dll) dengan nominal biaya standard sehingga Anda hanya tinggal mengedit progres dan menunjuk pekerja saja nantinya.
                  </span>
                </label>
              </div>

              {formData.autoGenerateJobs === true && (
                <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl space-y-3 mt-2 animate-fade-in">
                  <span className="text-xs font-bold text-slate-700 block border-b border-slate-200/60 pb-1.5 mb-2">
                    Tunjuk Pekerja per Bidang (Opsional)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Pekerja Struktur</label>
                      <select
                        value={formData.workerStruktur || ''}
                        onChange={(e) => handleChange('workerStruktur', e.target.value)}
                        className="w-full text-xs rounded-xl px-2.5 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">-- Belum Ditunjuk --</option>
                        {uniqueWorkers.map((w) => (
                          <option key={w.namaTukang} value={w.namaTukang}>{w.namaTukang}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Pekerja Atap</label>
                      <select
                        value={formData.workerAtap || ''}
                        onChange={(e) => handleChange('workerAtap', e.target.value)}
                        className="w-full text-xs rounded-xl px-2.5 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">-- Belum Ditunjuk --</option>
                        {uniqueWorkers.map((w) => (
                          <option key={w.namaTukang} value={w.namaTukang}>{w.namaTukang}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Pekerja Plafon</label>
                      <select
                        value={formData.workerPlafon || ''}
                        onChange={(e) => handleChange('workerPlafon', e.target.value)}
                        className="w-full text-xs rounded-xl px-2.5 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">-- Belum Ditunjuk --</option>
                        {uniqueWorkers.map((w) => (
                          <option key={w.namaTukang} value={w.namaTukang}>{w.namaTukang}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Pekerja Listrik</label>
                      <select
                        value={formData.workerListrik || ''}
                        onChange={(e) => handleChange('workerListrik', e.target.value)}
                        className="w-full text-xs rounded-xl px-2.5 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">-- Belum Ditunjuk --</option>
                        {uniqueWorkers.map((w) => (
                          <option key={w.namaTukang} value={w.namaTukang}>{w.namaTukang}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Pekerja Pembersihan</label>
                      <select
                        value={formData.workerPembersihan || ''}
                        onChange={(e) => handleChange('workerPembersihan', e.target.value)}
                        className="w-full text-xs rounded-xl px-2.5 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">-- Belum Ditunjuk --</option>
                        {uniqueWorkers.map((w) => (
                          <option key={w.namaTukang} value={w.namaTukang}>{w.namaTukang}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Pekerja Drainase</label>
                      <select
                        value={formData.workerDrainase || ''}
                        onChange={(e) => handleChange('workerDrainase', e.target.value)}
                        className="w-full text-xs rounded-xl px-2.5 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">-- Belum Ditunjuk --</option>
                        {uniqueWorkers.map((w) => (
                          <option key={w.namaTukang} value={w.namaTukang}>{w.namaTukang}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 2. Progres Pekerjaan */}
          {type === 'progres' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Sasar Blok Rumah</label>
                  <select
                    value={formData.blokRumah || ''}
                    onChange={(e) => handleChange('blokRumah', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    {konstruksiList.map((k) => (
                      <option key={k.id} value={k.id}>Blok {k.id} ({k.projectName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Kategori Pekerjaan</label>
                  <select
                    value={formData.kategoriPekerjaan || 'struktur'}
                    onChange={(e) => handleChange('kategoriPekerjaan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    <option value="struktur">Struktur</option>
                    <option value="plafon">Plafon</option>
                    <option value="atap">Atap</option>
                    <option value="listrik">Listrik</option>
                    <option value="pembersihan">Pembersihan</option>
                    <option value="drainase">Drainase</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Kepala Tukang*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Joko"
                  value={formData.namaTukang || ''}
                  onChange={(e) => handleChange('namaTukang', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Item Detail Pekerjaan*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemasangan keramik teras samping"
                  value={formData.itemPekerjaan || ''}
                  onChange={(e) => handleChange('itemPekerjaan', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Persentasi Progres (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0 - 100"
                    value={formData.persentasiProgres || 0}
                    onChange={(e) => handleChange('persentasiProgres', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nilai Pekerjaan Kontrak (IDR)</label>
                  <input
                    type="number"
                    value={formData.nilaiPekerjaan || 0}
                    onChange={(e) => handleChange('nilaiPekerjaan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                  <div className="mt-1.5 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5 shadow-sm">
                    <span>💵</span> Terformat: Rp {Number(formData.nilaiPekerjaan || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Opsional - Catatan pengerjaan lapangan"
                  value={formData.catatan || ''}
                  onChange={(e) => handleChange('catatan', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
            </>
          )}

          {/* 3. Inventory */}
          {type === 'inventory' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nama Material*</label>
                  <input
                    type="text"
                    required
                    placeholder="Semen Gresik, Paku 4 inch"
                    value={formData.namaMaterial || ''}
                    onChange={(e) => handleChange('namaMaterial', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Kategori Material</label>
                  <select
                    value={formData.kategoriMaterial || 'Struktur'}
                    onChange={(e) => handleChange('kategoriMaterial', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    <option value="Struktur">Struktur</option>
                    <option value="Plumbing">Plumbing / Air</option>
                    <option value="Atap">Atap & Penutup</option>
                    <option value="Plafon">Plafon & Gypsum</option>
                    <option value="Kelistrikan">Kelistrikan</option>
                    <option value="Finishing">Finishing Cat/Keramik</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Jumlah Awal Stok</label>
                  <input
                    type="number"
                    value={formData.jumlahStok || 0}
                    onChange={(e) => handleChange('jumlahStok', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Sak, Batang, Kubik, Pcs, Lembar"
                    value={formData.satuan || ''}
                    onChange={(e) => handleChange('satuan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Harga Satuan (IDR)</label>
                  <input
                    type="number"
                    value={formData.harga || 0}
                    onChange={(e) => handleChange('harga', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    value={formData.minimumStock || 0}
                    onChange={(e) => handleChange('minimumStock', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Alokasi Gudang</label>
                <select
                  value={formData.idGudang || ''}
                  onChange={(e) => handleChange('idGudang', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                >
                  {gudangList.map((g) => (
                    <option key={g.id} value={g.id}>{g.namaGudang}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* 4. Gudang */}
          {type === 'gudang' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Gudang*</label>
                <input
                  type="text"
                  required
                  placeholder="Gudang Transit Barat, Gudang B"
                  value={formData.namaGudang || ''}
                  onChange={(e) => handleChange('namaGudang', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Lokasi Konstruksi Gudang</label>
                <input
                  type="text"
                  placeholder="Kavling 24, Sebelah Kantor Pemasaran"
                  value={formData.lokasi || ''}
                  onChange={(e) => handleChange('lokasi', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
            </>
          )}

          {/* 5. Supplier */}
          {type === 'supplier' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Supplier Partner*</label>
                <input
                  type="text"
                  required
                  placeholder="PT. Sinar Jaya Distributor"
                  value={formData.namaSupplier || ''}
                  onChange={(e) => handleChange('namaSupplier', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nomor Kontak (HP)</label>
                <input
                  type="text"
                  placeholder="081234..."
                  value={formData.noHp || ''}
                  onChange={(e) => handleChange('noHp', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Alamat Supplier</label>
                <input
                  type="text"
                  placeholder="Jl. Raya Timur No. 12"
                  value={formData.alamat || ''}
                  onChange={(e) => handleChange('alamat', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
            </>
          )}

          {/* 6. Transaksi Material */}
          {type === 'transaksi' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Pilih Material</label>
                <select
                  value={formData.namaMaterial || ''}
                  onChange={(e) => handleChange('namaMaterial', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                >
                  {inventoryList.map((i) => (
                    <option key={i.id} value={i.namaMaterial}>{i.namaMaterial} (Stok: {i.jumlahStok})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Pilih Gudang Asal/Tujuan</label>
                  <select
                    value={formData.namaGudang || ''}
                    onChange={(e) => handleChange('namaGudang', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    {gudangList.map((g) => (
                      <option key={g.id} value={g.namaGudang}>{g.namaGudang}</option>
                    ))}
                  </select>
                </div>
                {formData.type !== 'masuk' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Target Blok Rumah</label>
                    <select
                      value={formData.blokRumah || ''}
                      onChange={(e) => handleChange('blokRumah', e.target.value)}
                      className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                    >
                      {konstruksiList.map((k) => (
                        <option key={k.id} value={k.id}>Blok {k.id}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Partner Supplier</label>
                    <select
                      value={formData.supplier || ''}
                      onChange={(e) => handleChange('supplier', e.target.value)}
                      className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                    >
                      <option value="">-- Pilih Supplier --</option>
                      {supplierList.map((s) => (
                        <option key={s.id} value={s.namaSupplier}>{s.namaSupplier}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(() => {
                const selectedInv = inventoryList.find(i => i.namaMaterial === formData.namaMaterial);
                const unitName = selectedInv?.satuan || '';
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Mutasi Type</label>
                      <select
                        value={formData.type || 'keluar'}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                      >
                        <option value="keluar">Keluar (Gudang ke Unit)</option>
                        <option value="masuk">Masuk (Drop ke Gudang)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">
                        Kuantitas / Jumlah {unitName ? `(${unitName})` : ''}*
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          placeholder="Contoh: 0.5 atau 1"
                          value={formData.jumlah !== undefined && formData.jumlah !== null ? formData.jumlah : ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.,]/g, '');
                            handleChange('jumlah', val);
                          }}
                          className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-16"
                        />
                        <div className="absolute right-2 flex items-center gap-1">
                          {unitName && (
                            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
                              {unitName}
                            </span>
                          )}
                          <div className="flex flex-col border border-slate-200 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseFloat(String(formData.jumlah || '0').replace(',', '.')) || 0;
                                const nextVal = Math.round((curr + 0.5) * 10) / 10;
                                handleChange('jumlah', String(nextVal));
                              }}
                              className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[9px] font-bold leading-none border-b border-slate-200 cursor-pointer"
                              title="Tambah 0.5"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseFloat(String(formData.jumlah || '0').replace(',', '.')) || 0;
                                const nextVal = Math.max(0.1, Math.round((curr - 0.5) * 10) / 10);
                                handleChange('jumlah', String(nextVal));
                              }}
                              className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[9px] font-bold leading-none cursor-pointer"
                              title="Kurang 0.5"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Bisa memasukkan angka desimal (contoh: 0,5 atau 0.5)
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Mutasi</label>
                <input
                  type="date"
                  value={formData.tanggal || ''}
                  onChange={(e) => handleChange('tanggal', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>

              {formData.type !== 'masuk' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Catatan Operasional</label>
                  <input
                    type="text"
                    placeholder="Rincian pemakaian bahan"
                    value={formData.catatan || ''}
                    onChange={(e) => handleChange('catatan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
              )}

              {/* LIVE RAB BUDGET CHECK WARNING */}
              {rabBudgetCheck && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  rabBudgetCheck.isExceeded
                    ? 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-sm animate-fade-in'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {rabBudgetCheck.isExceeded ? (
                      <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    ) : (
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    )}
                    <div className="space-y-1 text-xs leading-relaxed">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>
                          {rabBudgetCheck.isExceeded ? 'Perhatian: Melebihi Batas Standar RAB!' : 'Penggunaan Dalam Batas Kuota RAB'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          rabBudgetCheck.isExceeded ? 'bg-amber-200/80 text-amber-800' : 'bg-emerald-200/70 text-emerald-800'
                        }`}>
                          {rabBudgetCheck.percentage}% Kuota
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Template: <strong className="text-slate-800">{rabBudgetCheck.rabName}</strong> | Standar RAB: <strong>{rabBudgetCheck.standardQty} {rabBudgetCheck.satuan}</strong>.
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Sudah terpakai sebelumnya: <strong>{rabBudgetCheck.pastUsage} {rabBudgetCheck.satuan}</strong> + Input saat ini: <strong>{rabBudgetCheck.inputQty} {rabBudgetCheck.satuan}</strong> = Proyeksi: <strong>{rabBudgetCheck.projectedTotal} {rabBudgetCheck.satuan}</strong>.
                      </p>
                      {rabBudgetCheck.isExceeded && (
                        <p className="text-[11px] font-bold text-amber-700 bg-amber-100/70 p-2 rounded-xl mt-1">
                          ⚠️ Melebihi standar sebanyak +{rabBudgetCheck.overQty} {rabBudgetCheck.satuan}. Anda tetap dapat menyimpan record pengeluaran ini.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 7. Catat Pembayaran Gaji Tukang */}
          {type === 'pembayaran' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nama Tukang</label>
                  <select
                    value={formData.namaTukang || ''}
                    onChange={(e) => handleChange('namaTukang', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 focus:ring-indigo-400 font-semibold text-slate-700"
                  >
                    {pekerjaList && pekerjaList.length > 0 ? (
                      pekerjaList.map((p) => (
                        <option key={p.id} value={p.namaTukang}>
                          {p.namaTukang}
                        </option>
                      ))
                    ) : uniqueWorkers && uniqueWorkers.length > 0 ? (
                      uniqueWorkers.map((w, idx) => (
                        <option key={idx} value={w.namaTukang}>
                          {w.namaTukang}
                        </option>
                      ))
                    ) : (
                      <option value="Pak Joko Budiman">Pak Joko Budiman</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Kategori Pekerjaan</label>
                  <select
                    value={formData.kategoriPekerjaan || 'struktur'}
                    onChange={(e) => handleChange('kategoriPekerjaan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 capitalize font-semibold text-slate-700"
                  >
                    <option value="struktur">Struktur</option>
                    <option value="plafon">Plafon</option>
                    <option value="atap">Atap</option>
                    <option value="listrik">Listrik</option>
                    <option value="pembersihan">Pembersihan</option>
                    <option value="drainase">Drainase</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Projek Perumahan</label>
                  <select
                    value={formData.namaProjek || ''}
                    onChange={(e) => handleChange('namaProjek', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Blok Rumah</label>
                  <select
                    value={formData.namaBlok || ''}
                    onChange={(e) => handleChange('namaBlok', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    {konstruksiList.map((k) => (
                      <option key={k.id} value={k.id}>Blok {k.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Jumlah Nilai Pembayaran (IDR)*</label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan jumlah nominal..."
                  value={formData.nilaiPembayaran ?? ''}
                  onChange={(e) => handleChange('nilaiPembayaran', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
                <div className="mt-1.5 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5 shadow-sm animate-fade-in">
                  <span>💵</span> Terformat: Rp {Number(formData.nilaiPembayaran || 0).toLocaleString('id-ID')}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Pembayaran</label>
                <input
                  type="date"
                  value={formData.tanggalPembayaran || ''}
                  onChange={(e) => handleChange('tanggalPembayaran', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
            </>
          )}

          {/* 8. Fee Marketing */}
          {type === 'fee' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Marketing Specialist*</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Amalia, Rian Firdaus"
                  value={formData.namaMarketing || ''}
                  onChange={(e) => handleChange('namaMarketing', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nomor WhatsApp Marketing</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={formData.noWhatsapp || ''}
                  onChange={(e) => handleChange('noWhatsapp', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Projek Perumahan Sasar</label>
                  <select
                    value={formData.namaProjek || ''}
                    onChange={(e) => handleChange('namaProjek', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Unit Blok Terikat</label>
                  <select
                    value={formData.namaBlok || ''}
                    onChange={(e) => handleChange('namaBlok', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    {konstruksiList.map((k) => (
                      <option key={k.id} value={k.id}>Blok {k.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nilai Komisi / Fee (IDR)</label>
                  <input
                    type="number"
                    value={formData.komisi || 0}
                    onChange={(e) => handleChange('komisi', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                  <div className="mt-1.5 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5 shadow-sm">
                    <span>💵</span> Terformat: Rp {Number(formData.komisi || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Status Pembayaran</label>
                  <select
                    value={formData.statusPembayaran || 'Belum Bayar'}
                    onChange={(e) => handleChange('statusPembayaran', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
              </div>

              {formData.statusPembayaran === 'Lunas' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Pembayaran Komisi</label>
                  <input
                    type="date"
                    onChange={(e) => handleChange('tanggalPembayaran', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
              )}
            </>
          )}

          {/* 9. Data Karyawan */}
          {type === 'karyawan' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Lengkap Karyawan*</label>
                <input
                  type="text"
                  required
                  placeholder="Pratama Wijaya"
                  value={formData.namaKaryawan || ''}
                  onChange={(e) => handleChange('namaKaryawan', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Jabatan Operasional</label>
                  <input
                    type="text"
                    placeholder="Staff Teknis, Admin Berkas, Marketing"
                    value={formData.jabatan || ''}
                    onChange={(e) => handleChange('jabatan', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="Contoh: 082264345250"
                    value={formData.whatsup || ''}
                    onChange={(e) => handleChange('whatsup', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Bergabung</label>
                <input
                  type="date"
                  value={formData.tanggalGabung || ''}
                  onChange={(e) => handleChange('tanggalGabung', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
            </>
          )}

          {/* 10. Absensi Karyawan */}
          {type === 'absensi' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Pilih Karyawan</label>
                <select
                  value={formData.karyawanId || ''}
                  onChange={(e) => handleChange('karyawanId', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                >
                  {karyawanList.map((k) => (
                    <option key={k.id} value={k.id}>{k.namaKaryawan} ({k.jabatan})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Waktu Check-In</label>
                  <input
                    type="text"
                    placeholder="Contoh: 08:00"
                    value={formData.waktuCheckin || '08:00'}
                    onChange={(e) => handleChange('waktuCheckin', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Status Kehadiran</label>
                  <select
                    value={formData.statusKehadiran || 'Hadir'}
                    onChange={(e) => handleChange('statusKehadiran', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Absensi</label>
                <input
                  type="date"
                  value={formData.tanggal || ''}
                  onChange={(e) => handleChange('tanggal', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
            </>
          )}

          {/* Absensi Pekerja */}
          {type === 'absensi_pekerja' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Pilih Pekerja Terdaftar</label>
                <select
                  value={formData.namaTukang || ''}
                  onChange={(e) => handleChange('namaTukang', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 mb-2 font-semibold text-black"
                >
                  <option value="">-- Pilih Pekerja Terdaftar --</option>
                  {uniqueWorkers.map((w) => (
                    <option key={w.namaTukang} value={w.namaTukang}>
                      {w.namaTukang} {w.kategori ? `(${w.kategori.toUpperCase()})` : ''} {w.noHp && w.noHp !== '-' ? `• ${w.noHp}` : ''}
                    </option>
                  ))}
                </select>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Pekerja / Tukang (Konfirmasi / Ketik Baru)*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Joko Budiman"
                  value={formData.namaTukang || ''}
                  onChange={(e) => handleChange('namaTukang', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 font-semibold text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Status Kehadiran</label>
                  <select
                    value={formData.statusKehadiran || 'Hadir'}
                    onChange={(e) => handleChange('statusKehadiran', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Absensi</label>
                  <input
                    type="date"
                    value={formData.tanggal || ''}
                    onChange={(e) => handleChange('tanggal', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Keterangan Aktivitas / Detail</label>
                <input
                  type="text"
                  placeholder="Contoh: Melanjutkan pasang kusen / Istirahat sakit"
                  value={formData.keterangan || ''}
                  onChange={(e) => handleChange('keterangan', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
            </>
          )}

          {/* 11. Lead Penjualan */}
          {type === 'lead' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Customer Prospektif*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk Ahmad Santoso"
                  value={formData.namaCustomer || ''}
                  onChange={(e) => handleChange('namaCustomer', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nomor WhatsApp Customer</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={formData.noWhatsapp || ''}
                  onChange={(e) => handleChange('noWhatsapp', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Projek Perumahan Sasar</label>
                  <select
                    value={formData.namaProjek || ''}
                    onChange={(e) => handleChange('namaProjek', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Unit Blok Terikat</label>
                  <select
                    value={formData.namaBlok || ''}
                    onChange={(e) => handleChange('namaBlok', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    {konstruksiList.map((k) => (
                      <option key={k.id} value={k.id}>Blok {k.id}</option>
                    ))}
                  </select>
                </div>
              </div>               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nama Marketing</label>
                  <input
                    type="text"
                    placeholder="Sarah Amalia, Rian Firdaus"
                    value={formData.namaMarketing || ''}
                    onChange={(e) => handleChange('namaMarketing', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Lead Status Pipeline</label>
                  <select
                    value={formData.leadStatus || 'booking'}
                    onChange={(e) => handleChange('leadStatus', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                  >
                    <option value="booking">booking (Tanda Jadi)</option>
                    <option value="dp">dp (Down Payment)</option>
                    <option value="pmberkasan">pmberkasan (KPR / Legal)</option>
                    <option value="tunggu akad">tunggu akad</option>
                    <option value="akad">akad (Selesai Lunas)</option>
                    <option value="batal">batal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Lead Diinput*</label>
                <input
                  type="date"
                  required
                  value={formData.tanggalInput || ''}
                  onChange={(e) => handleChange('tanggalInput', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-200"
                />
              </div>
            </>
          )}

          {/* 12. Template RAB */}
          {type === 'rab_template' && (
            <>
              <div>
                <label className="text-xs font-black text-black block mb-1">Nama Template RAB*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RAB Standar Type 36 & 45"
                  value={formData.namaRab || ''}
                  onChange={(e) => handleChange('namaRab', e.target.value)}
                  className="w-full text-sm font-semibold text-black rounded-xl px-3 py-2 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-xs font-black text-black block mb-1">Keterangan / Deskripsi Standar</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Standar material bata merah, rangka baja ringan, genteng keramik per 1 unit rumah"
                  value={formData.keterangan || ''}
                  onChange={(e) => handleChange('keterangan', e.target.value)}
                  className="w-full text-sm font-semibold text-black rounded-xl px-3 py-2 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </>
          )}

          {/* 13. Detail Standar Material RAB */}
          {type === 'rab_detail' && (
            <>
              <div>
                <label className="text-xs font-black text-black block mb-1">Pilih Template RAB Sasaran*</label>
                <select
                  value={formData.rabId || ''}
                  onChange={(e) => handleChange('rabId', e.target.value)}
                  className="w-full text-sm font-bold text-black rounded-xl px-3 py-2 bg-white border border-slate-300"
                >
                  {rabTemplateList.map((r) => (
                    <option key={r.id} value={r.id}>{r.namaRab}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-black block mb-1">Pilih dari Katalog Stok Material (Otomatis Isi)</label>
                <select
                  value=""
                  onChange={(e) => {
                    const selected = inventoryList.find(i => i.namaMaterial === e.target.value);
                    if (selected) {
                      setFormData((prev: any) => ({
                        ...prev,
                        namaMaterial: selected.namaMaterial,
                        satuan: selected.satuan,
                      }));
                    }
                  }}
                  className="w-full text-sm font-semibold text-black rounded-xl px-3 py-2 bg-white border border-slate-300 mb-2"
                >
                  <option value="">-- Pilih Material dari Inventory Gudang --</option>
                  {inventoryList.map((i) => (
                    <option key={i.id} value={i.namaMaterial}>{i.namaMaterial} ({i.satuan})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-black block mb-1">Nama Material*</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Semen Tigaroda 50kg"
                    value={formData.namaMaterial || ''}
                    onChange={(e) => handleChange('namaMaterial', e.target.value)}
                    className="w-full text-sm font-semibold text-black rounded-xl px-3 py-2 bg-white border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-black block mb-1">Satuan*</label>
                  <input
                    type="text"
                    required
                    placeholder="Sak, Batang, M3, Pcs, Lembar"
                    value={formData.satuan || ''}
                    onChange={(e) => handleChange('satuan', e.target.value)}
                    className="w-full text-sm font-semibold text-black rounded-xl px-3 py-2 bg-white border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-black block mb-1">Kuantitas Standar (Qty per 1 Unit Rumah)*</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  placeholder="Contoh: 70"
                  value={formData.qtyStandar || ''}
                  onChange={(e) => handleChange('qtyStandar', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 bg-white border border-slate-300 font-mono font-black text-black"
                />
                <p className="text-[11px] font-semibold text-black mt-1">
                  Standar ini berlaku untuk setiap unit rumah di proyek yang menggunakan template RAB ini.
                </p>
              </div>
            </>
          )}

          {/* Footer Save Controls */}
          <div className="flex justify-end gap-3.5 pt-5 border-t border-slate-100 bg-white/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl shadow-md cursor-pointer transition"
            >
              <Save size={15} />
              Simpan Record
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
