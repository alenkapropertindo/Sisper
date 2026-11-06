import React from 'react';
import { 
  Users, 
  CalendarDays, 
  Search, 
  UserPlus, 
  FileSpreadsheet,
  Wrench,
  Phone
} from 'lucide-react';
import { Karyawan, AbsensiKaryawan, ProgresPekerjaan, AbsensiPekerja, Pekerja } from '../types';
import { normalizeDateString, getWitaToday } from '../utils/timezone';

interface OperasionalViewProps {
  karyawanList: Karyawan[];
  absensiList: AbsensiKaryawan[];
  absensiPekerjaList: AbsensiPekerja[];
  progresList: ProgresPekerjaan[];
  pekerjaList: Pekerja[];
  onAddKaryawan: () => void;
  onAddAbsensi: () => void;
  onAddAbsensiPekerja: () => void;
  onAddPekerja?: (pekerja: Omit<Pekerja, 'id'>) => void;
  initialSubTab?: 'karyawan' | 'absensi' | 'absensi_pekerja' | 'pekerja';
  initialSearchQuery?: string;
}

export default function OperasionalView({
  karyawanList,
  absensiList,
  absensiPekerjaList,
  progresList,
  pekerjaList = [],
  onAddKaryawan,
  onAddAbsensi,
  onAddAbsensiPekerja,
  onAddPekerja,
  initialSubTab = 'absensi',
  initialSearchQuery = '',
}: OperasionalViewProps) {
  const [subTab, setSubTab] = React.useState<'karyawan' | 'absensi' | 'absensi_pekerja' | 'pekerja'>(initialSubTab);
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  React.useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Format YYYY-MM into Indo month name, e.g. "2026-05" -> "Mei 2026"
  const formatIndoMonth = React.useCallback((ym: string) => {
    if (!ym) return '';
    const parts = ym.split('-');
    if (parts.length < 2) return ym;
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${months[month - 1] || 'Bulan ' + month} ${year}`;
  }, []);

  // 1. Karyawan Attendance Months
  const availableMonths = React.useMemo(() => {
    const set = new Set<string>();
    (absensiList || []).forEach(a => {
      const cleanDate = normalizeDateString(a.tanggal);
      if (cleanDate && cleanDate.length >= 7) {
        set.add(cleanDate.slice(0, 7));
      }
    });
    if (set.size === 0) {
      set.add(getWitaToday().slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [absensiList]);

  const [selectedMonth, setSelectedMonth] = React.useState<string>('');

  React.useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // 2. Pekerja Attendance Months
  const availableWorkerMonths = React.useMemo(() => {
    const set = new Set<string>();
    (absensiPekerjaList || []).forEach(a => {
      const cleanDate = normalizeDateString(a.tanggal);
      if (cleanDate && cleanDate.length >= 7) {
        set.add(cleanDate.slice(0, 7));
      }
    });
    (availableMonths || []).forEach(m => set.add(m));
    if (set.size === 0) {
      set.add(getWitaToday().slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [absensiPekerjaList, availableMonths]);

  const [selectedWorkerMonth, setSelectedWorkerMonth] = React.useState<string>('');

  React.useEffect(() => {
    if (availableWorkerMonths.length > 0 && !selectedWorkerMonth) {
      setSelectedWorkerMonth(availableWorkerMonths[0]);
    }
  }, [availableWorkerMonths, selectedWorkerMonth]);

  // Look up worker's job category helper
  const getPekerjaCategory = React.useCallback((namaTukang: string) => {
    const key = namaTukang.trim().toLowerCase();
    const found = (pekerjaList || []).find(p => p.namaTukang.toLowerCase() === key);
    return found ? found.kategoriPekerjaan : null;
  }, [pekerjaList]);

  // Monthly Recap for Karyawan
  const employeeMonthlyRecap = React.useMemo(() => {
    return karyawanList.map(emp => {
      const empAbsList = (absensiList || []).filter(a => {
        const cleanDate = normalizeDateString(a.tanggal);
        return a.karyawanId === emp.id && cleanDate && cleanDate.startsWith(selectedMonth);
      });
      
      const total = empAbsList.length;
      const hadir = empAbsList.filter(a => a.statusKehadiran === 'Hadir').length;
      const sakit = empAbsList.filter(a => a.statusKehadiran === 'Sakit').length;
      const izin = empAbsList.filter(a => a.statusKehadiran === 'Izin').length;
      const alpa = empAbsList.filter(a => a.statusKehadiran === 'Alpa').length;
      const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;
      
      return {
        id: emp.id,
        namaKaryawan: emp.namaKaryawan,
        jabatan: emp.jabatan,
        hadir,
        sakit,
        izin,
        alpa,
        total,
        rate
      };
    });
  }, [karyawanList, absensiList, selectedMonth]);

  // Monthly Recap for Pekerja / Tukang
  const workerMonthlyRecap = React.useMemo(() => {
    const workerMap = new Map<string, { namaTukang: string; kategori: string }>();

    (pekerjaList || []).forEach(p => {
      if (p.namaTukang) {
        workerMap.set(p.namaTukang.trim().toLowerCase(), {
          namaTukang: p.namaTukang.trim(),
          kategori: p.kategoriPekerjaan || 'struktur'
        });
      }
    });

    (absensiPekerjaList || []).forEach(a => {
      if (a.namaTukang) {
        const key = a.namaTukang.trim().toLowerCase();
        if (!workerMap.has(key)) {
          workerMap.set(key, {
            namaTukang: a.namaTukang.trim(),
            kategori: getPekerjaCategory(a.namaTukang) || 'umum'
          });
        }
      }
    });

    (progresList || []).forEach(p => {
      if (p.namaTukang) {
        const key = p.namaTukang.trim().toLowerCase();
        if (!workerMap.has(key)) {
          workerMap.set(key, {
            namaTukang: p.namaTukang.trim(),
            kategori: p.kategoriPekerjaan || 'umum'
          });
        }
      }
    });

    return Array.from(workerMap.values()).map(w => {
      const wAbsList = (absensiPekerjaList || []).filter(a => {
        const cleanDate = normalizeDateString(a.tanggal);
        return a.namaTukang.trim().toLowerCase() === w.namaTukang.toLowerCase() &&
          cleanDate &&
          cleanDate.startsWith(selectedWorkerMonth);
      });

      const total = wAbsList.length;
      const hadir = wAbsList.filter(a => a.statusKehadiran === 'Hadir').length;
      const sakit = wAbsList.filter(a => a.statusKehadiran === 'Sakit').length;
      const izin = wAbsList.filter(a => a.statusKehadiran === 'Izin').length;
      const alpa = wAbsList.filter(a => a.statusKehadiran === 'Alpa').length;
      const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;

      return {
        namaTukang: w.namaTukang,
        kategori: w.kategori,
        hadir,
        sakit,
        izin,
        alpa,
        total,
        rate
      };
    });
  }, [pekerjaList, absensiPekerjaList, progresList, selectedWorkerMonth, getPekerjaCategory]);

  // Currency utility helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Resolve employee name helper
  const getEmployeeName = React.useCallback((id: string) => {
    return karyawanList.find(k => k.id === id)?.namaKaryawan || id;
  }, [karyawanList]);

  // Resolve employee role helper
  const getEmployeeRole = React.useCallback((id: string) => {
    return karyawanList.find(k => k.id === id)?.jabatan || 'Staff';
  }, [karyawanList]);

  // Filters based on active sub tab
  const filteredKaryawan = React.useMemo(() => {
    return karyawanList.filter(k => 
      k.namaKaryawan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [karyawanList, searchQuery]);

  const filteredAbsensi = React.useMemo(() => {
    return absensiList.filter(a => {
      const empName = getEmployeeName(a.karyawanId);
      return empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tanggal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.statusKehadiran.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [absensiList, searchQuery, getEmployeeName]);

  const filteredAbsensiPekerja = React.useMemo(() => {
    return (absensiPekerjaList || []).filter(a => {
      return a.namaTukang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tanggal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.statusKehadiran.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.keterangan.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [absensiPekerjaList, searchQuery]);

  const [isAddingPekerja, setIsAddingPekerja] = React.useState(false);
  const [newPekerjaName, setNewPekerjaName] = React.useState('');
  const [newPekerjaPhone, setNewPekerjaPhone] = React.useState('');
  const [newPekerjaCategory, setNewPekerjaCategory] = React.useState<'struktur' | 'plafon' | 'atap' | 'listrik' | 'pembersihan'>('struktur');

  const handlePekerjaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPekerjaName.trim() || !newPekerjaPhone.trim()) return;

    onAddPekerja?.({
      namaTukang: newPekerjaName.trim(),
      noHp: newPekerjaPhone.trim(),
      kategoriPekerjaan: newPekerjaCategory,
    });

    setNewPekerjaName('');
    setNewPekerjaPhone('');
    setNewPekerjaCategory('struktur');
    setIsAddingPekerja(false);
  };

  const filteredPekerja = React.useMemo(() => {
    return (pekerjaList || []).filter(p => 
      p.namaTukang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kategoriPekerjaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.noHp || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pekerjaList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Tab select header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#e0e5ec] p-2 rounded-2xl shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40">
        <div className="flex flex-wrap sm:flex-nowrap space-x-1 w-full sm:w-auto p-1 bg-slate-200/80 rounded-xl border border-slate-300">
          <button
            onClick={() => { setSubTab('absensi'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all cursor-pointer ${
              subTab === 'absensi' ? 'bg-black text-white shadow-sm' : 'text-black hover:bg-slate-300/60'
            }`}
          >
            <CalendarDays size={15} className={subTab === 'absensi' ? 'text-white' : 'text-black'} />
            Absensi Karyawan
          </button>
          <button
            onClick={() => { setSubTab('absensi_pekerja'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all cursor-pointer ${
              subTab === 'absensi_pekerja' ? 'bg-black text-white shadow-sm' : 'text-black hover:bg-slate-300/60'
            }`}
          >
            <CalendarDays size={15} className={subTab === 'absensi_pekerja' ? 'text-white' : 'text-black'} />
            Absensi Pekerja
          </button>
          <button
            onClick={() => { setSubTab('karyawan'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all cursor-pointer ${
              subTab === 'karyawan' ? 'bg-black text-white shadow-sm' : 'text-black hover:bg-slate-300/60'
            }`}
          >
            <Users size={15} className={subTab === 'karyawan' ? 'text-white' : 'text-black'} />
            Data Karyawan
          </button>
          <button
            onClick={() => { setSubTab('pekerja'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all cursor-pointer ${
              subTab === 'pekerja' ? 'bg-black text-white shadow-sm' : 'text-black hover:bg-slate-300/60'
            }`}
          >
            <Wrench size={14} className={subTab === 'pekerja' ? 'text-white' : 'text-black'} />
            Data Pekerja
          </button>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto">
          {subTab === 'karyawan' && (
            <button
               onClick={onAddKaryawan}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-black/85 text-white text-xs sm:text-sm font-black rounded-xl shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.85)] border border-black cursor-pointer transition"
            >
              <UserPlus size={15} className="text-white" />
              <span>Tambah Karyawan</span>
            </button>
          )}
          {subTab === 'absensi' && (
            <button
               onClick={onAddAbsensi}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-black/85 text-white text-xs sm:text-sm font-black rounded-xl shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.85)] border border-black cursor-pointer transition"
            >
              <CalendarDays size={15} className="text-white" />
              <span>Input Absensi Hari Ini</span>
            </button>
          )}
          {subTab === 'absensi_pekerja' && (
            <button
               onClick={onAddAbsensiPekerja}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-black/85 text-white text-xs sm:text-sm font-black rounded-xl shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.85)] border border-black cursor-pointer transition"
            >
              <CalendarDays size={15} className="text-white" />
              <span>Input Absensi Pekerja</span>
            </button>
          )}
          {subTab === 'pekerja' && (
            <button
               onClick={() => setIsAddingPekerja(!isAddingPekerja)}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-black/85 text-white text-xs sm:text-sm font-black rounded-xl shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.85)] border border-black cursor-pointer transition"
            >
              <UserPlus size={15} className="text-white" />
              <span>{isAddingPekerja ? 'Tutup Form' : 'Tambah Pekerja Baru'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="relative p-1 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40">
        <Search className="absolute left-4 top-3.5 text-black" size={18} />
        <input
          type="text"
          placeholder={`Cari dalam operasional ${subTab === 'absensi' ? 'absensi karyawan' : subTab === 'absensi_pekerja' ? 'absensi pekerja' : subTab === 'karyawan' ? 'data karyawan' : 'data pekerja'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs sm:text-sm rounded-xl pl-11 pr-4 py-2.5 bg-transparent border-none focus:outline-none text-black font-black placeholder:text-gray-600"
        />
      </div>

      {/* 1. SUBTAB: DATA KARYAWAN */}
      {subTab === 'karyawan' && (
        <div className="overflow-x-auto rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] border border-slate-300/40 p-1">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-300/60 text-black text-[11px] uppercase tracking-wider font-display font-black">
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Jabatan / Role</th>
                <th className="p-4">WhatsApp / Telepon</th>
                <th className="p-4 text-right">Tanggal Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/40 text-black">
              {filteredKaryawan.map((kar) => {
                const cleanPhone = (kar.whatsup || '').replace(/[^0-9]/g, '');
                const waLink = cleanPhone ? (cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone.startsWith('62') ? cleanPhone : '62' + cleanPhone) : '';

                return (
                  <tr key={kar.id} className="hover:bg-slate-200/50 transition">
                    <td className="p-4">
                      <div className="font-display font-black text-black text-[15px]">{kar.namaKaryawan}</div>
                      <div className="text-[11px] text-black font-semibold mt-0.5">ID: {kar.id}</div>
                    </td>
                    <td className="p-4 text-black font-bold">{kar.jabatan}</td>
                    <td className="p-4">
                      {kar.whatsup ? (
                        <a
                          href={`https://wa.me/${waLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 rounded-xl text-black font-mono font-black text-xs border border-slate-300 shadow-xs transition cursor-pointer"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone size={13} className="text-black" />
                          <span>{kar.whatsup}</span>
                        </a>
                      ) : (
                        <span className="text-black/60 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-black font-black">
                      {kar.tanggalGabung || '-'}
                    </td>
                  </tr>
                );
              })}
              {filteredKaryawan.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-black font-semibold text-xs italic">
                    Tidak ada karyawan yang terdaftar atau cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. SUBTAB: ABSENSI KARYAWAN */}
      {subTab === 'absensi' && (
        <div className="space-y-6">
          {/* Header & Month Selector */}
          <div className="bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-black font-display flex items-center gap-2">
                  <FileSpreadsheet className="text-black" size={18} />
                  Rekap Kehadiran Karyawan Berdasarkan Bulan
                </h3>
                <p className="text-xs text-black font-semibold mt-0.5">Berdasarkan bulan kerja aktivitas terdaftar</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-black">Pilih Bulan Kerja:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-black text-black bg-slate-200 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatIndoMonth(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabel Rekap Presensi per Staff Karyawan */}
            <div className="overflow-x-auto rounded-xl border border-slate-300/60 bg-white/40">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-200/80 border-b border-slate-300 text-black text-[11px] uppercase tracking-wider font-display font-black">
                    <th className="p-3 pl-4">Staff Karyawan</th>
                    <th className="p-3 text-center font-mono">Hadir</th>
                    <th className="p-3 text-center font-mono">Sakit</th>
                    <th className="p-3 text-center font-mono">Izin</th>
                    <th className="p-3 text-center font-mono">Alpa</th>
                    <th className="p-3 text-center font-mono">Total Input</th>
                    <th className="p-3 text-right pr-4 font-mono">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300/50 text-black">
                  {employeeMonthlyRecap.map((recap) => (
                    <tr key={recap.id} className="hover:bg-slate-200/50 transition">
                      <td className="p-3 pl-4">
                        <div className="font-display font-black text-black text-xs sm:text-sm">{recap.namaKaryawan}</div>
                        <div className="text-[10px] text-black font-semibold">{recap.jabatan}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-black text-black bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                          {recap.hadir}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-black text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {recap.sakit}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-black text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {recap.izin}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-black text-black bg-slate-200 px-2 py-0.5 rounded border border-slate-400">
                          {recap.alpa}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-xs font-black text-black">
                        {recap.total} Hari
                      </td>
                      <td className="p-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-xs font-black text-black">
                            {recap.total > 0 ? `${recap.rate}%` : '-'}
                          </span>
                          {recap.total > 0 && (
                            <div className="w-16 bg-[#e0e5ec] h-2 rounded-full p-0.5 shadow-[inset_1px_1px_2px_rgba(163,177,198,0.5)] border border-slate-300/40 hidden sm:block">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  recap.rate >= 90
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                    : recap.rate >= 75
                                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                                    : recap.rate > 0
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                                    : 'bg-slate-300'
                                }`}
                                style={{ width: `${recap.rate}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employeeMonthlyRecap.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-black font-semibold text-xs italic">
                        Tidak ada data karyawan terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* List Table container */}
          <div className="overflow-x-auto rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] border border-slate-300/40 p-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-300/60 text-black text-[11px] uppercase tracking-wider font-display font-black">
                  <th className="p-4">Tanggal Kerja</th>
                  <th className="p-4">Staff Karyawan</th>
                  <th className="p-4">Waktu Check-in & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/40 text-black">
                {filteredAbsensi.map((abs) => {
                  const name = getEmployeeName(abs.karyawanId);
                  const role = getEmployeeRole(abs.karyawanId);
                  return (
                    <tr key={abs.id} className="hover:bg-slate-200/50 transition">
                      <td className="p-4 font-mono font-black text-black text-xs">{abs.tanggal}</td>
                      <td className="p-4">
                        <div className="font-display font-black text-black text-sm">{name}</div>
                        <div className="text-[11px] text-black font-semibold mt-0.5">{role}</div>
                      </td>
                      <td className="p-4">
                        <div className="mb-1">
                          <span className={`inline-flex text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                            abs.statusKehadiran === 'Hadir'
                              ? 'bg-black text-white border-black'
                              : 'bg-slate-200 text-black border-slate-300'
                          }`}>
                            {abs.statusKehadiran}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-black text-black">{abs.waktuCheckin}</div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAbsensi.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-black font-semibold text-xs italic">
                      Tidak ada data absensi karyawan terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUBTAB: ABSENSI PEKERJA */}
      {subTab === 'absensi_pekerja' && (
        <div className="space-y-6">
          {/* Header & Month Selector for Pekerja */}
          <div className="bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-black font-display flex items-center gap-2">
                  <FileSpreadsheet className="text-black" size={18} />
                  Rekap Kehadiran Pekerja & Tukang Berdasarkan Bulan
                </h3>
                <p className="text-xs text-black font-semibold mt-0.5">Berdasarkan bulan kerja aktivitas mandor & tukang lapangan</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-black">Pilih Bulan Kerja:</span>
                <select
                  value={selectedWorkerMonth}
                  onChange={(e) => setSelectedWorkerMonth(e.target.value)}
                  className="text-xs font-black text-black bg-slate-200 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                >
                  {availableWorkerMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatIndoMonth(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabel Rekap Presensi per Pekerja / Tukang */}
            <div className="overflow-x-auto rounded-xl border border-slate-300/60 bg-white/40">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-200/80 border-b border-slate-300 text-black text-[11px] uppercase tracking-wider font-display font-black">
                    <th className="p-3 pl-4">Pekerja / Tukang</th>
                    <th className="p-3 text-center font-mono">Hadir</th>
                    <th className="p-3 text-center font-mono">Sakit</th>
                    <th className="p-3 text-center font-mono">Izin</th>
                    <th className="p-3 text-center font-mono">Alpa</th>
                    <th className="p-3 text-center font-mono">Total Input</th>
                    <th className="p-3 text-right pr-4 font-mono">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300/50 text-black">
                  {workerMonthlyRecap.map((recap, idx) => (
                    <tr key={idx} className="hover:bg-slate-200/50 transition">
                      <td className="p-3 pl-4">
                        <div className="font-display font-black text-black text-xs sm:text-sm">{recap.namaTukang}</div>
                        <div className="mt-0.5">
                          <span className="inline-flex font-black uppercase px-2 py-0.5 text-[9px] rounded bg-slate-200 text-black border border-slate-300">
                            {recap.kategori}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-black text-black bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                          {recap.hadir}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-black text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {recap.sakit}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-black text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {recap.izin}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-black text-black bg-slate-200 px-2 py-0.5 rounded border border-slate-400">
                          {recap.alpa}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-xs font-black text-black">
                        {recap.total} Hari
                      </td>
                      <td className="p-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-xs font-black text-black">
                            {recap.total > 0 ? `${recap.rate}%` : '-'}
                          </span>
                          {recap.total > 0 && (
                            <div className="w-16 bg-[#e0e5ec] h-2 rounded-full p-0.5 shadow-[inset_1px_1px_2px_rgba(163,177,198,0.5)] border border-slate-300/40 hidden sm:block">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  recap.rate >= 90
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                    : recap.rate >= 75
                                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                                    : recap.rate > 0
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                                    : 'bg-slate-300'
                                }`}
                                style={{ width: `${recap.rate}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {workerMonthlyRecap.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-black font-semibold text-xs italic">
                        Tidak ada data pekerja yang terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Worker Attendance Ledger */}
          <div className="overflow-x-auto rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] border border-slate-300/40 p-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-300/60 text-black text-[11px] uppercase tracking-wider font-display font-black">
                  <th className="p-4">Tanggal Kerja</th>
                  <th className="p-4">Nama Pekerja</th>
                  <th className="p-4">Status & Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/40 text-black">
                {(filteredAbsensiPekerja || []).map((abs) => {
                  const category = getPekerjaCategory(abs.namaTukang);
                  return (
                    <tr key={abs.id} className="hover:bg-slate-200/50 transition">
                      <td className="p-4 font-mono font-black text-black text-xs">{abs.tanggal}</td>
                      <td className="p-4">
                        <div className="font-display font-black text-black text-sm">{abs.namaTukang}</div>
                        {category ? (
                          <div className="mt-1">
                            <span className="inline-flex font-black uppercase px-2 py-0.5 text-[9px] rounded bg-slate-200 text-black border border-slate-300">
                              {category}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-black font-semibold mt-0.5 italic">Pekerja Umum / Baru</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="mb-1.5">
                          <span className={`inline-flex text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                            abs.statusKehadiran === 'Hadir'
                              ? 'bg-black text-white border-black'
                              : 'bg-slate-200 text-black border-slate-300'
                          }`}>
                            {abs.statusKehadiran}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-black">
                          {abs.keterangan || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(filteredAbsensiPekerja || []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-black font-semibold text-xs italic">
                      Tidak ada data absensi pekerja terdaftar atau cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUBTAB: DATA PEKERJA */}
      {subTab === 'pekerja' && (
        <>
          {isAddingPekerja && (
            <form onSubmit={handlePekerjaSubmit} className="bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40 rounded-2xl p-5 mb-6 space-y-4 max-w-2xl">
              <div className="text-sm font-black text-black border-b border-slate-300/60 pb-2 flex items-center gap-1.5 font-display">
                <Wrench size={16} className="text-black" />
                <span>Tambah Data Pekerja Baru</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-black block mb-1">Nama Pekerja*</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pak Supri"
                    value={newPekerjaName}
                    onChange={(e) => setNewPekerjaName(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-black font-bold text-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-black block mb-1">No WhatsApp*</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0812345678"
                    value={newPekerjaPhone}
                    onChange={(e) => setNewPekerjaPhone(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-black font-mono font-bold text-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-black block mb-1">Kategori Spesialis*</label>
                  <select
                    value={newPekerjaCategory}
                    onChange={(e) => setNewPekerjaCategory(e.target.value as any)}
                    className="w-full text-xs rounded-xl px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-black font-bold text-black cursor-pointer"
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPekerja(false)}
                  className="px-3.5 py-2 border border-slate-300 text-black text-xs font-black rounded-xl hover:bg-slate-200 cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-black/85 text-white text-xs font-black rounded-xl shadow-md cursor-pointer border border-black transition"
                >
                  Simpan Pekerja
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] border border-slate-300/40 p-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-300/60 text-black text-[11px] uppercase tracking-wider font-display font-black">
                  <th className="p-4">Nama Pekerja</th>
                  <th className="p-4">No WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/40 text-black">
                {filteredPekerja.map((p, idx) => {
                  const phoneStr = p.noHp != null ? String(p.noHp) : '';
                  const cleanPhone = phoneStr.replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone.startsWith('8') ? '62' + cleanPhone : cleanPhone;
                  const waLink = `https://wa.me/${waPhone}`;

                  return (
                    <tr key={idx} className="hover:bg-slate-200/50 transition">
                      <td className="p-4">
                        <div className="font-display font-black text-black text-[14px]">{p.namaTukang}</div>
                        <div className="mt-1">
                          <span className="inline-flex font-black uppercase px-2 py-0.5 text-[9px] rounded bg-slate-200 text-black border border-slate-300">
                            {p.kategoriPekerjaan}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {p.noHp !== '-' && p.noHp ? (
                          <a 
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-white bg-black hover:bg-black/85 px-3 py-1.5 rounded-xl border border-black shadow-sm transition font-mono font-black cursor-pointer whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.747 1.451 5.436.002 9.851-4.382 9.855-9.764.002-2.607-1.01-5.059-2.85-6.902C16.599 2.097 14.153 1.084 11.55 1.084c-5.438 0-9.853 4.384-9.857 9.767a9.61 9.61 0 0 0 1.488 4.887l-.976 3.566 3.651-.958zM16.14 13.911c-.248-.124-1.472-.729-1.7-.811-.228-.084-.393-.124-.559.124-.166.248-.642.812-.787.977-.145.166-.29.186-.539.063-.248-.124-1.05-.386-2-1.234-.738-.657-1.238-1.472-1.383-1.72-.145-.248-.015-.381.11-.504.111-.11.248-.29.373-.435.124-.145.166-.248.248-.415.083-.166.042-.311-.02-.435-.062-.124-.559-1.349-.766-1.849-.2-.486-.403-.421-.559-.429H8.38c-.166 0-.435.062-.663.311-.228.248-.87.851-.87 2.075 0 1.224.891 2.406.99 2.551.1.145 1.751 2.674 4.243 3.748.592.256 1.055.409 1.414.523.596.19 1.138.163 1.567.099.479-.072 1.472-.601 1.679-1.151.207-.55.207-1.023.145-1.124-.062-.1-.228-.166-.476-.29z"/>
                            </svg>
                            <span>{p.noHp}</span>
                          </a>
                        ) : (
                          <span className="text-black italic text-[11px] font-bold">Belum terdaftar</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredPekerja.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-black font-semibold text-xs italic">
                      Tidak ada data pekerja yang cocok atau tersedia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
