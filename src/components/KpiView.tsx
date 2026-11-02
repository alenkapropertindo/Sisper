import React from 'react';
import { 
  Building, 
  Warehouse, 
  TrendingUp, 
  Users, 
  HardHat, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { 
  Project, 
  Konstruksi, 
  Inventory, 
  TransaksiMaterial, 
  RabTemplate, 
  RabDetail, 
  ProgresPekerjaan, 
  Karyawan, 
  AbsensiKaryawan, 
  Pekerja, 
  AbsensiPekerja 
} from '../types';

interface KpiViewProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  inventoryList: Inventory[];
  konstruksiList: Konstruksi[];
  transaksiList: TransaksiMaterial[];
  rabTemplateList: RabTemplate[];
  rabDetailList: RabDetail[];
  progresList: ProgresPekerjaan[];
  karyawanList: Karyawan[];
  absensiList: AbsensiKaryawan[];
  pekerjaList: Pekerja[];
  absensiPekerjaList: AbsensiPekerja[];
  onNavigateTab: (tab: 'dashboard' | 'konstruksi' | 'logistik' | 'marketing' | 'operasional', subTab?: string) => void;
}

// Reusable SVG Donut Chart with vibrant, bright, high-contrast colors (no black progress bars/rings)
function DonutChart({
  percentage,
  size = 130,
  strokeWidth = 13,
  color = '#10b981',
  bgColor = '#e2e8f0',
  label,
  sublabel
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Central percentage text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
        <span className="text-xl sm:text-2xl font-black font-mono text-black leading-none">
          {safePercentage}%
        </span>
        {label && (
          <span className="text-[10px] font-black text-black uppercase tracking-wider mt-0.5">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[9px] font-bold text-black/70 leading-tight">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export default function KpiView({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  inventoryList = [],
  konstruksiList = [],
  transaksiList = [],
  rabTemplateList = [],
  rabDetailList = [],
  progresList = [],
  karyawanList = [],
  absensiList = [],
  pekerjaList = [],
  absensiPekerjaList = [],
  onNavigateTab
}: KpiViewProps) {
  // State for evaluation date (defaults to today in YYYY-MM-DD or latest available date)
  const todayStr = React.useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Find latest attendance date if available, default to today
  const [evalDate, setEvalDate] = React.useState<string>(() => {
    const dates = [
      ...absensiList.map(a => a.tanggal),
      ...absensiPekerjaList.map(a => a.tanggal)
    ].filter(Boolean);
    if (dates.length > 0) {
      const sorted = [...dates].sort().reverse();
      // If today exists in records, pick today, otherwise latest recorded date
      return sorted.includes(todayStr) ? todayStr : sorted[0];
    }
    return todayStr;
  });

  // Filtered construction units based on project selection
  const filteredKonstruksi = React.useMemo(() => {
    if (selectedProjectId === 'all') return konstruksiList;
    return konstruksiList.filter(k => k.projectId === selectedProjectId);
  }, [konstruksiList, selectedProjectId]);

  // ==========================================
  // 1. KPI LOGISTIK (Ketersediaan Stok)
  // 100% jika tidak ada stok reorder.
  // Contoh: 10 barang, 2 reorder -> reorder rate = 2/10 * 100% = 20%, performa = 80%.
  // ==========================================
  const kpiLogistikData = React.useMemo(() => {
    const totalItems = inventoryList.length;
    if (totalItems === 0) {
      return {
        score: 100,
        totalItems: 0,
        reorderCount: 0,
        safeCount: 0,
        reorderRate: 0,
        reorderList: []
      };
    }
    const reorderList = inventoryList.filter(i => i.jumlahStok <= i.minimumStock);
    const reorderCount = reorderList.length;
    const safeCount = totalItems - reorderCount;
    const reorderRate = Math.round((reorderCount / totalItems) * 100);
    const score = Math.max(0, Math.min(100, Math.round(((totalItems - reorderCount) / totalItems) * 100)));

    return {
      score,
      totalItems,
      reorderCount,
      safeCount,
      reorderRate,
      reorderList
    };
  }, [inventoryList]);

  // ==========================================
  // 2. KPI PENGAWASAN (Kontrol Penggunaan Material vs Standar RAB)
  // 100% jika tidak ada rumah onprogres yang penggunaan materialnya melebihi RAB.
  // Contoh: 10 rumah onprogres, 2 over RAB -> over rate = 2/10 * 100% = 20%, performa = 80%.
  // ==========================================
  const kpiPengawasanData = React.useMemo(() => {
    const onProgresUnits = filteredKonstruksi.filter(k => k.statusPembangunan === 'onProgres');
    const totalUnits = onProgresUnits.length;

    if (totalUnits === 0) {
      return {
        score: 100,
        totalUnits: 0,
        overCount: 0,
        safeCount: 0,
        overRate: 0,
        overUnitsList: []
      };
    }

    const overUnitsList: { unit: Konstruksi; overItemsCount: number }[] = [];

    onProgresUnits.forEach(unit => {
      const proj = projects.find(p => p.id === unit.projectId);
      const standardItems = rabDetailList.filter(d => d.rabId === proj?.rabId);
      const unitTxOut = transaksiList.filter(t => t.type === 'keluar' && t.blokRumah === unit.id);

      const usageMap = new Map<string, number>();
      unitTxOut.forEach(t => {
        const key = t.namaMaterial.trim().toLowerCase();
        usageMap.set(key, (usageMap.get(key) || 0) + (Number(t.jumlah) || 0));
      });

      let isOver = false;
      let overCount = 0;

      // Check against standard items
      standardItems.forEach(item => {
        const key = item.namaMaterial.trim().toLowerCase();
        const actual = usageMap.get(key) || 0;
        if (actual > item.qtyStandar) {
          isOver = true;
          overCount++;
        }
      });

      // Check unregistered materials used
      unitTxOut.forEach(t => {
        const key = t.namaMaterial.trim().toLowerCase();
        const inStd = standardItems.some(i => i.namaMaterial.trim().toLowerCase() === key);
        if (!inStd && (usageMap.get(key) || 0) > 0) {
          isOver = true;
          overCount++;
        }
      });

      if (isOver) {
        overUnitsList.push({ unit, overItemsCount: overCount });
      }
    });

    const overCount = overUnitsList.length;
    const safeCount = totalUnits - overCount;
    const overRate = Math.round((overCount / totalUnits) * 100);
    const score = Math.max(0, Math.min(100, Math.round(((totalUnits - overCount) / totalUnits) * 100)));

    return {
      score,
      totalUnits,
      overCount,
      safeCount,
      overRate,
      overUnitsList
    };
  }, [filteredKonstruksi, projects, rabDetailList, transaksiList]);

  // ==========================================
  // 3. KPI PENJUALAN (Penyerapan Rumah Terbangun)
  // 100% jika tidak ada rumah terbangun yang belum terbooking.
  // Contoh: 10 rumah terbangun, 2 belum terbooking -> unbooked rate = 2/10 * 100% = 20%, performa = 80%.
  // ==========================================
  const kpiPenjualanData = React.useMemo(() => {
    const terbangunUnits = filteredKonstruksi.filter(k => k.statusPembangunan === 'terbangun');
    const totalTerbangun = terbangunUnits.length;

    if (totalTerbangun === 0) {
      return {
        score: 100,
        totalTerbangun: 0,
        unbookedCount: 0,
        bookedCount: 0,
        unbookedRate: 0,
        unbookedList: []
      };
    }

    const unbookedList = terbangunUnits.filter(k => k.statusPenjualan === 'tersedia');
    const unbookedCount = unbookedList.length;
    const bookedCount = totalTerbangun - unbookedCount;
    const unbookedRate = Math.round((unbookedCount / totalTerbangun) * 100);
    const score = Math.max(0, Math.min(100, Math.round(((totalTerbangun - unbookedCount) / totalTerbangun) * 100)));

    return {
      score,
      totalTerbangun,
      unbookedCount,
      bookedCount,
      unbookedRate,
      unbookedList
    };
  }, [filteredKonstruksi]);

  // ==========================================
  // 4. KPI KEHADIRAN KARYAWAN
  // 100% jika seluruh karyawan hadir.
  // Contoh: 5 karyawan, 1 izin/sakit -> deduction = 1/5 * 100% = 20%, kehadiran = 80%.
  // ==========================================
  const kpiKaryawanData = React.useMemo(() => {
    const totalKaryawan = karyawanList.length;
    if (totalKaryawan === 0) {
      return {
        score: 100,
        totalKaryawan: 0,
        hadirCount: 0,
        absenCount: 0,
        absenRate: 0,
        absenList: []
      };
    }

    const recordsOnDate = absensiList.filter(a => a.tanggal === evalDate);
    const hadirRecords = recordsOnDate.filter(a => a.statusKehadiran === 'Hadir');
    const nonHadirRecords = recordsOnDate.filter(a => a.statusKehadiran !== 'Hadir');

    // Missing records for today count as absent/not clocked in yet if total > recorded
    const attendedEmpIds = new Set(recordsOnDate.map(r => r.karyawanId));
    const unclockedEmployees = karyawanList.filter(k => !attendedEmpIds.has(k.id));

    const hadirCount = hadirRecords.length;
    const absentees = [
      ...nonHadirRecords.map(r => {
        const emp = karyawanList.find(k => k.id === r.karyawanId);
        return {
          nama: emp?.namaKaryawan || r.namaKaryawan || 'Karyawan',
          jabatan: emp?.jabatan || '-',
          status: r.statusKehadiran
        };
      }),
      ...unclockedEmployees.map(emp => ({
        nama: emp.namaKaryawan,
        jabatan: emp.jabatan,
        status: 'Belum Absen'
      }))
    ];

    const absCount = totalKaryawan - hadirCount;
    const safeAbsCount = Math.max(0, absCount);
    const score = Math.max(0, Math.min(100, Math.round((hadirCount / totalKaryawan) * 100)));
    const absenRate = Math.round((safeAbsCount / totalKaryawan) * 100);

    return {
      score,
      totalKaryawan,
      hadirCount,
      absenCount: safeAbsCount,
      absenRate,
      absenList: absentees
    };
  }, [karyawanList, absensiList, evalDate]);

  // ==========================================
  // 5. KPI KEHADIRAN PEKERJA
  // 100% jika seluruh pekerja yang absen di hari itu hadir.
  // Dihitung dari pekerja yang absen di hari itu, bukan total terdaftar.
  // Contoh: 5 pekerja yang absen dihari itu, 1 izin/sakit -> performa = 4/5 * 100% = 80%.
  // ==========================================
  const kpiPekerjaData = React.useMemo(() => {
    const recordsOnDate = absensiPekerjaList.filter(a => a.tanggal === evalDate);
    const totalAbsenHariItu = recordsOnDate.length;

    if (totalAbsenHariItu === 0) {
      return {
        score: 100,
        totalAbsenHariItu: 0,
        hadirCount: 0,
        absenCount: 0,
        absenRate: 0,
        absenList: []
      };
    }

    const hadirRecords = recordsOnDate.filter(a => a.statusKehadiran === 'Hadir');
    const nonHadirRecords = recordsOnDate.filter(a => a.statusKehadiran !== 'Hadir');

    const hadirCount = hadirRecords.length;
    const absCount = nonHadirRecords.length;
    const score = Math.max(0, Math.min(100, Math.round((hadirCount / totalAbsenHariItu) * 100)));
    const absenRate = Math.round((absCount / totalAbsenHariItu) * 100);

    return {
      score,
      totalAbsenHariItu,
      hadirCount,
      absenCount: absCount,
      absenRate,
      absenList: nonHadirRecords
    };
  }, [absensiPekerjaList, evalDate]);

  // ==========================================
  // 6. KPI PERFORMA PERUSAHAAN (Rata-rata 5 pilar)
  // ==========================================
  const kpiPerusahaan = React.useMemo(() => {
    const sLogistik = kpiLogistikData.score;
    const sPengawasan = kpiPengawasanData.score;
    const sPenjualan = kpiPenjualanData.score;
    const sKaryawan = kpiKaryawanData.score;
    const sPekerja = kpiPekerjaData.score;

    const avg = Math.round((sLogistik + sPengawasan + sPenjualan + sKaryawan + sPekerja) / 5);

    let statusText = 'Sangat Baik';
    let statusBadgeColor = 'bg-emerald-100 text-black border-emerald-300';
    let ringColor = '#10b981'; // Emerald

    if (avg >= 85) {
      statusText = 'Sangat Baik';
      statusBadgeColor = 'bg-emerald-100 text-black border-emerald-400';
      ringColor = '#10b981';
    } else if (avg >= 70) {
      statusText = 'Baik (Terkendali)';
      statusBadgeColor = 'bg-sky-100 text-black border-sky-400';
      ringColor = '#0284c7';
    } else if (avg >= 50) {
      statusText = 'Cukup (Perlu Evaluasi)';
      statusBadgeColor = 'bg-amber-100 text-black border-amber-400';
      ringColor = '#f59e0b';
    } else {
      statusText = 'Kritis (Perhatian Khusus)';
      statusBadgeColor = 'bg-rose-100 text-black border-rose-400';
      ringColor = '#f43f5e';
    }

    return {
      score: avg,
      statusText,
      statusBadgeColor,
      ringColor
    };
  }, [kpiLogistikData, kpiPengawasanData, kpiPenjualanData, kpiKaryawanData, kpiPekerjaData]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
              <Layers size={22} className="text-black" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-display font-black text-black">
                Key Performance Indicator (KPI)
              </h1>
              <p className="text-xs text-black font-semibold mt-0.5">
                Pengukuran performa komprehensif 5 pilar operasional & evaluasi kinerja perusahaan
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Project filter & Evaluation date */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Project Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-black/15 rounded-2xl text-xs">
            <Building size={14} className="text-black" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent font-bold text-black outline-none cursor-pointer"
            >
              <option value="all">Semua Proyek Perumahan</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Date Selector for Attendance evaluation */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-black/15 rounded-2xl text-xs">
            <Calendar size={14} className="text-black" />
            <span className="font-bold text-black hidden sm:inline">Tgl Absensi:</span>
            <input
              type="date"
              value={evalDate}
              onChange={(e) => setEvalDate(e.target.value)}
              className="bg-transparent font-bold text-black outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 1. HERO CARD: PERFORMA PERUSAHAAN (Rata-rata 5 Pilar) */}
      <div className="p-6 sm:p-7 bg-white rounded-3xl border border-black/15 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Donut Chart Hero */}
            <DonutChart
              percentage={kpiPerusahaan.score}
              size={150}
              strokeWidth={15}
              color={kpiPerusahaan.ringColor}
              label="TOTAL SCORE"
              sublabel="Rata-rata 5 Pilar"
            />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-black bg-slate-100 px-2.5 py-1 rounded-lg border border-black/10">
                  Pilar Utama
                </span>
                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg border ${kpiPerusahaan.statusBadgeColor}`}>
                  {kpiPerusahaan.statusText}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-display font-black text-black">
                Performa Keseluruhan Perusahaan
              </h2>
              <p className="text-xs sm:text-sm text-black font-semibold max-w-xl">
                Nilai performa dihitung dari rata-rata 5 pilar operasional: <strong>Logistik</strong> ({kpiLogistikData.score}%), <strong>Pengawasan Konstruksi</strong> ({kpiPengawasanData.score}%), <strong>Penjualan Unit</strong> ({kpiPenjualanData.score}%), <strong>Kehadiran Karyawan</strong> ({kpiKaryawanData.score}%), dan <strong>Kehadiran Pekerja</strong> ({kpiPekerjaData.score}%).
              </p>

              {/* Formula Badge */}
              <div className="inline-block mt-1 text-[11px] font-mono font-bold bg-slate-50 text-black px-3 py-1.5 rounded-xl border border-black/10">
                Formula: ({kpiLogistikData.score}% + {kpiPengawasanData.score}% + {kpiPenjualanData.score}% + {kpiKaryawanData.score}% + {kpiPekerjaData.score}%) ÷ 5 = <strong>{kpiPerusahaan.score}%</strong>
              </div>
            </div>
          </div>

          {/* Quick Pillar Summary Bars */}
          <div className="w-full lg:w-72 bg-slate-50 p-4 rounded-2xl border border-black/10 space-y-2.5">
            <span className="text-[11px] font-black uppercase text-black block tracking-wider">
              Ringkasan Nilai 5 Pilar
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-black flex items-center gap-1.5">
                  <Warehouse size={13} className="text-black" /> Logistik
                </span>
                <span className="font-mono font-black text-black">{kpiLogistikData.score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${kpiLogistikData.score}%` }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-black flex items-center gap-1.5">
                  <Building size={13} className="text-black" /> Pengawasan
                </span>
                <span className="font-mono font-black text-black">{kpiPengawasanData.score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${kpiPengawasanData.score}%` }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-black flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-black" /> Penjualan
                </span>
                <span className="font-mono font-black text-black">{kpiPenjualanData.score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${kpiPenjualanData.score}%` }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-black flex items-center gap-1.5">
                  <Users size={13} className="text-black" /> Kehadiran Karyawan
                </span>
                <span className="font-mono font-black text-black">{kpiKaryawanData.score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${kpiKaryawanData.score}%` }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-black flex items-center gap-1.5">
                  <HardHat size={13} className="text-black" /> Kehadiran Pekerja
                </span>
                <span className="font-mono font-black text-black">{kpiPekerjaData.score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${kpiPekerjaData.score}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 PILAR GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* ===================================== */}
        {/* PILAR 1: LOGISTIK */}
        {/* ===================================== */}
        <div className="p-5 bg-white rounded-3xl border border-black/15 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                  <Warehouse size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="font-display font-black text-black text-base">KPI Logistik</h3>
                  <span className="text-[11px] font-bold text-black">Ketersediaan Stok Gudang</span>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                kpiLogistikData.reorderCount === 0
                  ? 'bg-emerald-100 text-black border-emerald-300'
                  : 'bg-amber-100 text-black border-amber-300'
              }`}>
                {kpiLogistikData.reorderCount === 0 ? '100% Aman' : `${kpiLogistikData.reorderCount} Reorder`}
              </span>
            </div>

            {/* Chart & KPI Metrics */}
            <div className="mt-5 flex items-center justify-around gap-3">
              <DonutChart
                percentage={kpiLogistikData.score}
                size={110}
                strokeWidth={11}
                color="#0284c7" /* Bright Sky Blue */
                label="STOK AMAN"
              />

              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Total Material:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiLogistikData.totalItems} Barang</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Status Reorder:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiLogistikData.reorderCount} Barang</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-black/10 text-xs space-y-1">
              <p className="font-black text-black text-[11px] uppercase tracking-wide">Aturan Pengukuran:</p>
              <p className="text-black font-medium leading-relaxed">
                Bernilai 100% jika <strong>tidak ada stok</strong> dengan status reorder.
                {kpiLogistikData.totalItems > 0 && (
                  <span className="block mt-0.5 font-mono text-[11px] text-black font-bold">
                    Perhitungan: 100% - ({kpiLogistikData.reorderCount} ÷ {kpiLogistikData.totalItems} × 100%) = <strong>{kpiLogistikData.score}%</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('logistik')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-black rounded-xl border border-black/15 transition cursor-pointer"
          >
            Cek Detail Gudang & Stok <ArrowUpRight size={14} className="text-black" />
          </button>
        </div>

        {/* ===================================== */}
        {/* PILAR 2: PENGAWASAN (RAB) */}
        {/* ===================================== */}
        <div className="p-5 bg-white rounded-3xl border border-black/15 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Building size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="font-display font-black text-black text-base">KPI Pengawasan</h3>
                  <span className="text-[11px] font-bold text-black">Kontrol Material vs RAB</span>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                kpiPengawasanData.overCount === 0
                  ? 'bg-emerald-100 text-black border-emerald-300'
                  : 'bg-rose-100 text-black border-rose-300'
              }`}>
                {kpiPengawasanData.overCount === 0 ? '100% Sesuai' : `${kpiPengawasanData.overCount} Over RAB`}
              </span>
            </div>

            {/* Chart & KPI Metrics */}
            <div className="mt-5 flex items-center justify-around gap-3">
              <DonutChart
                percentage={kpiPengawasanData.score}
                size={110}
                strokeWidth={11}
                color="#6366f1" /* Bright Indigo */
                label="SESUAI RAB"
              />

              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Unit On-Progres:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiPengawasanData.totalUnits} Rumah</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Melebihi Standar:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiPengawasanData.overCount} Rumah</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-black/10 text-xs space-y-1">
              <p className="font-black text-black text-[11px] uppercase tracking-wide">Aturan Pengukuran:</p>
              <p className="text-black font-medium leading-relaxed">
                Bernilai 100% jika <strong>tidak ada rumah on-progres</strong> yang pemakaian materialnya melebihi RAB.
                {kpiPengawasanData.totalUnits > 0 && (
                  <span className="block mt-0.5 font-mono text-[11px] text-black font-bold">
                    Perhitungan: 100% - ({kpiPengawasanData.overCount} ÷ {kpiPengawasanData.totalUnits} × 100%) = <strong>{kpiPengawasanData.score}%</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('konstruksi', 'blok')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-black rounded-xl border border-black/15 transition cursor-pointer"
          >
            Cek Unit On-Progres & RAB <ArrowUpRight size={14} className="text-black" />
          </button>
        </div>

        {/* ===================================== */}
        {/* PILAR 3: PENJUALAN */}
        {/* ===================================== */}
        <div className="p-5 bg-white rounded-3xl border border-black/15 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <TrendingUp size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="font-display font-black text-black text-base">KPI Penjualan</h3>
                  <span className="text-[11px] font-bold text-black">Booking Rumah Terbangun</span>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                kpiPenjualanData.unbookedCount === 0
                  ? 'bg-emerald-100 text-black border-emerald-300'
                  : 'bg-amber-100 text-black border-amber-300'
              }`}>
                {kpiPenjualanData.unbookedCount === 0 ? '100% Terbooking' : `${kpiPenjualanData.unbookedCount} Belum Booking`}
              </span>
            </div>

            {/* Chart & KPI Metrics */}
            <div className="mt-5 flex items-center justify-around gap-3">
              <DonutChart
                percentage={kpiPenjualanData.score}
                size={110}
                strokeWidth={11}
                color="#10b981" /* Bright Emerald Green */
                label="TERBOOKING"
              />

              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Rumah Terbangun:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiPenjualanData.totalTerbangun} Unit</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Belum Terbooking:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiPenjualanData.unbookedCount} Unit</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-black/10 text-xs space-y-1">
              <p className="font-black text-black text-[11px] uppercase tracking-wide">Aturan Pengukuran:</p>
              <p className="text-black font-medium leading-relaxed">
                Bernilai 100% jika <strong>tidak ada rumah terbangun</strong> yang statusnya belum terbooking.
                {kpiPenjualanData.totalTerbangun > 0 && (
                  <span className="block mt-0.5 font-mono text-[11px] text-black font-bold">
                    Perhitungan: 100% - ({kpiPenjualanData.unbookedCount} ÷ {kpiPenjualanData.totalTerbangun} × 100%) = <strong>{kpiPenjualanData.score}%</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('marketing', 'leads')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-black rounded-xl border border-black/15 transition cursor-pointer"
          >
            Cek Status Penjualan & Unit <ArrowUpRight size={14} className="text-black" />
          </button>
        </div>

        {/* ===================================== */}
        {/* PILAR 4: KEHADIRAN KARYAWAN */}
        {/* ===================================== */}
        <div className="p-5 bg-white rounded-3xl border border-black/15 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Users size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="font-display font-black text-black text-base">KPI Kehadiran Karyawan</h3>
                  <span className="text-[11px] font-bold text-black">Presensi Staff & Manajemen</span>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                kpiKaryawanData.absenCount === 0
                  ? 'bg-emerald-100 text-black border-emerald-300'
                  : 'bg-amber-100 text-black border-amber-300'
              }`}>
                {kpiKaryawanData.absenCount === 0 ? '100% Lengkap' : `${kpiKaryawanData.absenCount} Tidak Hadir`}
              </span>
            </div>

            {/* Chart & KPI Metrics */}
            <div className="mt-5 flex items-center justify-around gap-3">
              <DonutChart
                percentage={kpiKaryawanData.score}
                size={110}
                strokeWidth={11}
                color="#f59e0b" /* Bright Amber Orange */
                label="KEHADIRAN"
              />

              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Total Karyawan:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiKaryawanData.totalKaryawan} Orang</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Hadir ({evalDate}):</span>
                  <span className="font-black text-black font-mono text-sm">{kpiKaryawanData.hadirCount} Orang</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-black/10 text-xs space-y-1">
              <p className="font-black text-black text-[11px] uppercase tracking-wide">Aturan Pengukuran:</p>
              <p className="text-black font-medium leading-relaxed">
                Bernilai 100% jika <strong>seluruh karyawan hadir</strong>. Setiap izin/sakit/alpa mengurangi persentase.
                {kpiKaryawanData.totalKaryawan > 0 && (
                  <span className="block mt-0.5 font-mono text-[11px] text-black font-bold">
                    Perhitungan: {kpiKaryawanData.hadirCount} ÷ {kpiKaryawanData.totalKaryawan} × 100% = <strong>{kpiKaryawanData.score}%</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('operasional', 'absensi')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-black rounded-xl border border-black/15 transition cursor-pointer"
          >
            Cek Rekap Absensi Karyawan <ArrowUpRight size={14} className="text-black" />
          </button>
        </div>

        {/* ===================================== */}
        {/* PILAR 5: KEHADIRAN PEKERJA */}
        {/* ===================================== */}
        <div className="p-5 bg-white rounded-3xl border border-black/15 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                  <HardHat size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="font-display font-black text-black text-base">KPI Kehadiran Pekerja</h3>
                  <span className="text-[11px] font-bold text-black">Tukang & Pekerja Lapangan</span>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                kpiPekerjaData.absenCount === 0
                  ? 'bg-emerald-100 text-black border-emerald-300'
                  : 'bg-rose-100 text-black border-rose-300'
              }`}>
                {kpiPekerjaData.absenCount === 0 ? '100% Hadir' : `${kpiPekerjaData.absenCount} Izin/Sakit`}
              </span>
            </div>

            {/* Chart & KPI Metrics */}
            <div className="mt-5 flex items-center justify-around gap-3">
              <DonutChart
                percentage={kpiPekerjaData.score}
                size={110}
                strokeWidth={11}
                color="#f43f5e" /* Bright Rose Red */
                label="KEHADIRAN"
              />

              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Pekerja Yang Absen:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiPekerjaData.totalAbsenHariItu} Orang</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-black/10">
                  <span className="text-[10px] text-black font-bold block">Hadir Bekerja:</span>
                  <span className="font-black text-black font-mono text-sm">{kpiPekerjaData.hadirCount} Orang</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-black/10 text-xs space-y-1">
              <p className="font-black text-black text-[11px] uppercase tracking-wide">Aturan Pengukuran:</p>
              <p className="text-black font-medium leading-relaxed">
                Dihitung dari <strong>pekerja yang absen di hari itu</strong> (bukan total terdaftar). Bernilai 100% jika seluruh yang absen berstatus Hadir.
                {kpiPekerjaData.totalAbsenHariItu > 0 && (
                  <span className="block mt-0.5 font-mono text-[11px] text-black font-bold">
                    Perhitungan: {kpiPekerjaData.hadirCount} ÷ {kpiPekerjaData.totalAbsenHariItu} × 100% = <strong>{kpiPekerjaData.score}%</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('operasional', 'absensi_pekerja')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-black rounded-xl border border-black/15 transition cursor-pointer"
          >
            Cek Rekap Absensi Pekerja <ArrowUpRight size={14} className="text-black" />
          </button>
        </div>

        {/* ===================================== */}
        {/* SUMMARY / PANDUAN KPI CARD */}
        {/* ===================================== */}
        <div className="p-5 bg-white rounded-3xl border border-black/15 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-700">
                <CheckCircle2 size={18} className="text-black" />
              </div>
              <div>
                <h3 className="font-display font-black text-black text-base">Standar Evaluasi KPI</h3>
                <span className="text-[11px] font-bold text-black">Indeks Mutu Manajemen</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-black">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="font-black text-black">85% - 100%</span>
                <span className="font-bold text-black">Sangat Baik (Optimal)</span>
              </div>
              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
                <span className="font-black text-black">70% - 84%</span>
                <span className="font-bold text-black">Baik (Operasional Terkendali)</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="font-black text-black">50% - 69%</span>
                <span className="font-bold text-black">Cukup (Perlu Evaluasi)</span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
                <span className="font-black text-black">&lt; 50%</span>
                <span className="font-bold text-black">Kritis (Perhatian Khusus)</span>
              </div>
            </div>

            <p className="text-[11px] text-black font-semibold leading-relaxed">
              Semua perhitungan data disinkronkan secara real-time dengan database Google Sheets/Supabase.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-black/10 flex items-center justify-between">
            <span className="text-xs font-bold text-black">Tanggal Penilaian:</span>
            <span className="text-xs font-black font-mono text-black">{evalDate}</span>
          </div>
        </div>

      </div>

      {/* ITEM PERHATIAN / ACTIONABLE ALERTS TABLE */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-black/15 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-display font-black text-black text-base sm:text-lg flex items-center gap-2">
              <AlertTriangle size={18} className="text-black" />
              Item & Unit yang Membutuhkan Perhatian Manajemen
            </h3>
            <p className="text-xs text-black font-medium mt-0.5">
              Daftar anomali atau deviasi yang mempengaruhi penurunan skor performa perusahaan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          
          {/* Reorder Materials */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-black/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Warehouse size={13} className="text-black" /> Material Reorder ({kpiLogistikData.reorderCount})
              </span>
              <button 
                onClick={() => onNavigateTab('logistik')}
                className="text-[10px] font-bold text-black underline hover:no-underline cursor-pointer"
              >
                Ke Gudang
              </button>
            </div>
            {kpiLogistikData.reorderList.length === 0 ? (
              <p className="text-black font-semibold italic text-xs py-2">Semua stok material dalam batas aman.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {kpiLogistikData.reorderList.slice(0, 5).map(m => (
                  <div key={m.id} className="p-2 bg-white rounded-xl border border-black/10 flex justify-between items-center">
                    <div>
                      <p className="font-black text-black">{m.namaMaterial}</p>
                      <p className="text-[10px] text-black">Min: {m.minimumStock} {m.satuan}</p>
                    </div>
                    <span className="font-black font-mono text-black text-xs bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                      Sisa: {m.jumlahStok} {m.satuan}
                    </span>
                  </div>
                ))}
                {kpiLogistikData.reorderList.length > 5 && (
                  <p className="text-[10px] text-black font-bold text-center">
                    +{kpiLogistikData.reorderList.length - 5} material lainnya
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Over-RAB Units */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-black/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Building size={13} className="text-black" /> Unit On-Progres Over RAB ({kpiPengawasanData.overCount})
              </span>
              <button 
                onClick={() => onNavigateTab('dashboard')}
                className="text-[10px] font-bold text-black underline hover:no-underline cursor-pointer"
              >
                Ke Dashboard
              </button>
            </div>
            {kpiPengawasanData.overUnitsList.length === 0 ? (
              <p className="text-black font-semibold italic text-xs py-2">Tidak ada rumah on-progres yang over RAB.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {kpiPengawasanData.overUnitsList.slice(0, 5).map(({ unit, overItemsCount }) => (
                  <div key={unit.id} className="p-2 bg-white rounded-xl border border-black/10 flex justify-between items-center">
                    <div>
                      <p className="font-black text-black">Blok {unit.id} ({unit.type})</p>
                      <p className="text-[10px] text-black">{unit.projectName || '-'}</p>
                    </div>
                    <span className="font-black font-mono text-black text-xs bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300">
                      {overItemsCount} item over
                    </span>
                  </div>
                ))}
                {kpiPengawasanData.overUnitsList.length > 5 && (
                  <p className="text-[10px] text-black font-bold text-center">
                    +{kpiPengawasanData.overUnitsList.length - 5} unit lainnya
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Unbooked Built Units */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-black/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <TrendingUp size={13} className="text-black" /> Rumah Terbangun Belum Booking ({kpiPenjualanData.unbookedCount})
              </span>
              <button 
                onClick={() => onNavigateTab('konstruksi', 'blok')}
                className="text-[10px] font-bold text-black underline hover:no-underline cursor-pointer"
              >
                Ke Unit
              </button>
            </div>
            {kpiPenjualanData.unbookedList.length === 0 ? (
              <p className="text-black font-semibold italic text-xs py-2">Semua rumah terbangun telah terbooking/terjual.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {kpiPenjualanData.unbookedList.slice(0, 5).map(unit => (
                  <div key={unit.id} className="p-2 bg-white rounded-xl border border-black/10 flex justify-between items-center">
                    <div>
                      <p className="font-black text-black">Blok {unit.id} ({unit.type})</p>
                      <p className="text-[10px] text-black">{unit.projectName || '-'}</p>
                    </div>
                    <span className="font-black text-black text-[10px] bg-slate-200 px-2 py-0.5 rounded-lg font-mono">
                      Tersedia
                    </span>
                  </div>
                ))}
                {kpiPenjualanData.unbookedList.length > 5 && (
                  <p className="text-[10px] text-black font-bold text-center">
                    +{kpiPenjualanData.unbookedList.length - 5} unit lainnya
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
