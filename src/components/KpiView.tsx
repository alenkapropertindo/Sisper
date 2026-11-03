import React from 'react';
import { 
  Building, 
  Warehouse, 
  TrendingUp, 
  Users, 
  HardHat, 
  Calendar,
  Layers,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
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

// Premium Neumorphic Donut Chart Component
function NeumorphicDonutChart({
  percentage,
  size = 190,
  strokeWidth = 15,
  label = 'TOTAL SKOR',
  statusText = 'Optimal',
  statusBadgeColor = 'bg-emerald-100 text-black border-emerald-400'
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  statusText?: string;
  statusBadgeColor?: string;
}) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  // Vibrant gradient colors matching high performance
  let ringGradientStart = '#ff6b00';
  let ringGradientEnd = '#f43f5e';
  if (safePercentage >= 85) {
    ringGradientStart = '#10b981';
    ringGradientEnd = '#06b6d4';
  } else if (safePercentage >= 70) {
    ringGradientStart = '#f97316';
    ringGradientEnd = '#fbbf24';
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Outer Neumorphic Dish Container */}
      <div 
        className="rounded-full bg-[#f8fafc] shadow-[8px_8px_18px_rgba(163,177,198,0.45),-8px_-8px_18px_rgba(255,255,255,0.95)] flex items-center justify-center p-3 relative border border-white/80"
        style={{ width: size + 24, height: size + 24 }}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="donutNeumorphicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={ringGradientStart} />
              <stop offset="100%" stopColor={ringGradientEnd} />
            </linearGradient>
          </defs>

          {/* Background Inset Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress Ring with Smooth Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#donutNeumorphicGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Central Raised Neumorphic Disc */}
        <div 
          className="absolute rounded-full bg-[#f8fafc] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.95)] flex flex-col items-center justify-center text-center p-2 border border-white/80"
          style={{ width: size - strokeWidth * 2 - 14, height: size - strokeWidth * 2 - 14 }}
        >
          <span className="text-3xl font-black font-mono text-black leading-none">
            {safePercentage}%
          </span>
          <span className="text-[10px] font-black text-black uppercase tracking-wider mt-1">
            {label}
          </span>
        </div>
      </div>

      <div className="mt-3.5 flex flex-col items-center">
        <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-xl border shadow-xs ${statusBadgeColor}`}>
          {statusText}
        </span>
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
  // Period filter mode: 'harian' | 'mingguan' | 'bulanan'
  const [filterMode, setFilterMode] = React.useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  // State for evaluation date (YYYY-MM-DD)
  const todayStr = React.useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const [evalDate, setEvalDate] = React.useState<string>(() => {
    const dates = [
      ...absensiList.map(a => a.tanggal),
      ...absensiPekerjaList.map(a => a.tanggal)
    ].filter(Boolean);
    if (dates.length > 0) {
      const sorted = [...dates].sort().reverse();
      return sorted.includes(todayStr) ? todayStr : sorted[0];
    }
    return todayStr;
  });

  // State for evaluation month (YYYY-MM)
  const [evalMonth, setEvalMonth] = React.useState<string>(() => {
    return evalDate.slice(0, 7) || todayStr.slice(0, 7);
  });

  // Calculate active date range based on filterMode
  const activeRange = React.useMemo(() => {
    if (filterMode === 'harian') {
      const [y, m, d] = evalDate.split('-').map(Number);
      const dateObj = new Date(y, (m || 1) - 1, d || 1);
      const formatted = dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      return {
        start: evalDate,
        end: evalDate,
        label: `Harian: ${formatted}`
      };
    } else if (filterMode === 'mingguan') {
      const [y, m, d] = evalDate.split('-').map(Number);
      const target = new Date(y, (m || 1) - 1, d || 1);
      const day = target.getDay(); // 0 is Sun, 1 is Mon...
      const diffToMon = target.getDate() - (day === 0 ? 6 : day - 1);
      const monday = new Date(y, (m || 1) - 1, diffToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const toISO = (dt: Date) => {
        const yr = dt.getFullYear();
        const mo = String(dt.getMonth() + 1).padStart(2, '0');
        const da = String(dt.getDate()).padStart(2, '0');
        return `${yr}-${mo}-${da}`;
      };

      const startISO = toISO(monday);
      const endISO = toISO(sunday);
      const label = `Mingguan: ${monday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;

      return {
        start: startISO,
        end: endISO,
        label
      };
    } else {
      // Bulanan
      const [y, m] = evalMonth.split('-').map(Number);
      const start = `${evalMonth}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const end = `${evalMonth}-${String(lastDay).padStart(2, '0')}`;
      const dateObj = new Date(y, m - 1, 1);
      const label = `Bulanan: ${dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

      return {
        start,
        end,
        label
      };
    }
  }, [filterMode, evalDate, evalMonth]);

  // Quick navigation for weekly filter
  const handlePrevWeek = () => {
    const d = new Date(evalDate);
    d.setDate(d.getDate() - 7);
    setEvalDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(evalDate);
    d.setDate(d.getDate() + 7);
    setEvalDate(d.toISOString().split('T')[0]);
  };

  // Filtered construction units based on project selection
  const filteredKonstruksi = React.useMemo(() => {
    if (selectedProjectId === 'all') return konstruksiList;
    return konstruksiList.filter(k => k.projectId === selectedProjectId);
  }, [konstruksiList, selectedProjectId]);

  // ==========================================
  // 1. KPI LOGISTIK
  // ==========================================
  const kpiLogistikData = React.useMemo(() => {
    const totalItems = inventoryList.length;
    if (totalItems === 0) {
      return { score: 100, totalItems: 0, reorderCount: 0, safeCount: 0, reorderList: [] };
    }
    const reorderList = inventoryList.filter(i => i.jumlahStok <= i.minimumStock);
    const reorderCount = reorderList.length;
    const safeCount = totalItems - reorderCount;
    const score = Math.max(0, Math.min(100, Math.round(((totalItems - reorderCount) / totalItems) * 100)));

    return { score, totalItems, reorderCount, safeCount, reorderList };
  }, [inventoryList]);

  // ==========================================
  // 2. KPI PENGAWASAN
  // ==========================================
  const kpiPengawasanData = React.useMemo(() => {
    const onProgresUnits = filteredKonstruksi.filter(k => k.statusPembangunan === 'onProgres');
    const totalUnits = onProgresUnits.length;

    if (totalUnits === 0) {
      return { score: 100, totalUnits: 0, overCount: 0, safeCount: 0, overUnitsList: [] };
    }

    const overUnitsList: { unit: Konstruksi; overItemsCount: number }[] = [];

    onProgresUnits.forEach(unit => {
      const proj = projects.find(p => p.id === unit.projectId);
      const standardItems = rabDetailList.filter(d => d.rabId === proj?.rabId);
      
      const unitTxOut = transaksiList.filter(t => 
        t.type === 'keluar' && 
        t.blokRumah === unit.id &&
        (!t.tanggal || t.tanggal <= activeRange.end)
      );

      const usageMap = new Map<string, number>();
      unitTxOut.forEach(t => {
        const key = t.namaMaterial.trim().toLowerCase();
        usageMap.set(key, (usageMap.get(key) || 0) + (Number(t.jumlah) || 0));
      });

      let isOver = false;
      let overCount = 0;

      standardItems.forEach(item => {
        const key = item.namaMaterial.trim().toLowerCase();
        const actual = usageMap.get(key) || 0;
        if (actual > item.qtyStandar) {
          isOver = true;
          overCount++;
        }
      });

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
    const score = Math.max(0, Math.min(100, Math.round(((totalUnits - overCount) / totalUnits) * 100)));

    return { score, totalUnits, overCount, safeCount, overUnitsList };
  }, [filteredKonstruksi, projects, rabDetailList, transaksiList, activeRange]);

  // ==========================================
  // 3. KPI PENJUALAN
  // ==========================================
  const kpiPenjualanData = React.useMemo(() => {
    const terbangunUnits = filteredKonstruksi.filter(k => k.statusPembangunan === 'terbangun');
    const totalTerbangun = terbangunUnits.length;

    if (totalTerbangun === 0) {
      return { score: 100, totalTerbangun: 0, unbookedCount: 0, bookedCount: 0, unbookedList: [] };
    }

    const unbookedList = terbangunUnits.filter(k => k.statusPenjualan === 'tersedia');
    const unbookedCount = unbookedList.length;
    const bookedCount = totalTerbangun - unbookedCount;
    const score = Math.max(0, Math.min(100, Math.round(((totalTerbangun - unbookedCount) / totalTerbangun) * 100)));

    return { score, totalTerbangun, unbookedCount, bookedCount, unbookedList };
  }, [filteredKonstruksi]);

  // ==========================================
  // 4. KPI KEHADIRAN KARYAWAN
  // ==========================================
  const kpiKaryawanData = React.useMemo(() => {
    const totalKaryawan = karyawanList.length;
    if (totalKaryawan === 0) {
      return { score: 100, totalKaryawan: 0, hadirCount: 0, totalExpected: 0, absenCount: 0, daysCount: 1 };
    }

    const recordsInRange = absensiList.filter(a => 
      a.tanggal && a.tanggal >= activeRange.start && a.tanggal <= activeRange.end
    );

    if (filterMode === 'harian') {
      const hadirCount = recordsInRange.filter(a => a.statusKehadiran === 'Hadir').length;
      const safeAbsCount = Math.max(0, totalKaryawan - hadirCount);
      const score = Math.max(0, Math.min(100, Math.round((hadirCount / totalKaryawan) * 100)));
      return { score, totalKaryawan, hadirCount, totalExpected: totalKaryawan, absenCount: safeAbsCount, daysCount: 1 };
    } else {
      const activeDates = Array.from(new Set(recordsInRange.map(r => r.tanggal)));
      const daysCount = Math.max(1, activeDates.length);
      const totalExpected = totalKaryawan * daysCount;
      const hadirCount = recordsInRange.filter(a => a.statusKehadiran === 'Hadir').length;
      const safeAbsCount = Math.max(0, totalExpected - hadirCount);
      const score = totalExpected > 0 ? Math.max(0, Math.min(100, Math.round((hadirCount / totalExpected) * 100))) : 100;

      return { score, totalKaryawan, hadirCount, totalExpected, absenCount: safeAbsCount, daysCount };
    }
  }, [karyawanList, absensiList, activeRange, filterMode]);

  // ==========================================
  // 5. KPI KEHADIRAN PEKERJA
  // ==========================================
  const kpiPekerjaData = React.useMemo(() => {
    const recordsInRange = absensiPekerjaList.filter(a => 
      a.tanggal && a.tanggal >= activeRange.start && a.tanggal <= activeRange.end
    );
    const totalAbsen = recordsInRange.length;

    if (totalAbsen === 0) {
      return { score: 100, totalAbsen: 0, hadirCount: 0, absenCount: 0 };
    }

    const hadirCount = recordsInRange.filter(a => a.statusKehadiran === 'Hadir').length;
    const absCount = totalAbsen - hadirCount;
    const score = Math.max(0, Math.min(100, Math.round((hadirCount / totalAbsen) * 100)));

    return { score, totalAbsen, hadirCount, absenCount: absCount };
  }, [absensiPekerjaList, activeRange]);

  // ==========================================
  // 6. TOTAL SKOR PERUSAHAAN (Rata-rata 5 KPI)
  // ==========================================
  const kpiPerusahaan = React.useMemo(() => {
    const sLogistik = kpiLogistikData.score;
    const sPengawasan = kpiPengawasanData.score;
    const sPenjualan = kpiPenjualanData.score;
    const sKaryawan = kpiKaryawanData.score;
    const sPekerja = kpiPekerjaData.score;

    const avg = Math.round((sLogistik + sPengawasan + sPenjualan + sKaryawan + sPekerja) / 5);

    let statusText = 'Optimal';
    let statusBadgeColor = 'bg-emerald-100 text-black border-emerald-400';

    if (avg >= 85) {
      statusText = 'Sangat Baik';
      statusBadgeColor = 'bg-emerald-100 text-black border-emerald-400';
    } else if (avg >= 70) {
      statusText = 'Baik';
      statusBadgeColor = 'bg-amber-100 text-black border-amber-400';
    } else if (avg >= 50) {
      statusText = 'Perlu Evaluasi';
      statusBadgeColor = 'bg-orange-100 text-black border-orange-400';
    } else {
      statusText = 'Kritis';
      statusBadgeColor = 'bg-rose-100 text-black border-rose-400';
    }

    return {
      score: avg,
      statusText,
      statusBadgeColor
    };
  }, [kpiLogistikData, kpiPengawasanData, kpiPenjualanData, kpiKaryawanData, kpiPekerjaData]);

  // 5 KPIs for Neumorphic Vertical Progress Bars (Image 1 style)
  const kpiItems: {
    id: string;
    name: string;
    tab: 'dashboard' | 'konstruksi' | 'logistik' | 'marketing' | 'operasional';
    subTab?: string;
    icon: React.ReactNode;
    score: number;
    gradientClass: string;
    badgeText: string;
    isSafe: boolean;
  }[] = [
    {
      id: 'logistik',
      name: 'Logistik',
      tab: 'logistik',
      icon: <Warehouse size={15} className="text-black shrink-0" />,
      score: kpiLogistikData.score,
      gradientClass: 'from-[#0284c7] to-[#38bdf8]', // Cyan / Sky Blue
      badgeText: kpiLogistikData.reorderCount === 0 ? 'Aman' : `${kpiLogistikData.reorderCount} Reorder`,
      isSafe: kpiLogistikData.reorderCount === 0
    },
    {
      id: 'pengawasan',
      name: 'Pengawasan',
      tab: 'konstruksi',
      subTab: 'blok',
      icon: <Building size={15} className="text-black shrink-0" />,
      score: kpiPengawasanData.score,
      gradientClass: 'from-[#4f46e5] to-[#818cf8]', // Indigo / Violet
      badgeText: kpiPengawasanData.overCount === 0 ? 'Sesuai' : `${kpiPengawasanData.overCount} Over`,
      isSafe: kpiPengawasanData.overCount === 0
    },
    {
      id: 'penjualan',
      name: 'Penjualan',
      tab: 'marketing',
      subTab: 'leads',
      icon: <TrendingUp size={15} className="text-black shrink-0" />,
      score: kpiPenjualanData.score,
      gradientClass: 'from-[#059669] to-[#34d399]', // Emerald / Teal
      badgeText: kpiPenjualanData.unbookedCount === 0 ? 'Terbooking' : `${kpiPenjualanData.unbookedCount} Tersedia`,
      isSafe: kpiPenjualanData.unbookedCount === 0
    },
    {
      id: 'karyawan',
      name: 'Karyawan',
      tab: 'operasional',
      subTab: 'absensi',
      icon: <Users size={15} className="text-black shrink-0" />,
      score: kpiKaryawanData.score,
      gradientClass: 'from-[#d97706] to-[#fbbf24]', // Amber / Gold
      badgeText: kpiKaryawanData.absenCount === 0 ? 'Lengkap' : `${kpiKaryawanData.absenCount} Absen`,
      isSafe: kpiKaryawanData.absenCount === 0
    },
    {
      id: 'pekerja',
      name: 'Pekerja',
      tab: 'operasional',
      subTab: 'absensi_pekerja',
      icon: <HardHat size={15} className="text-black shrink-0" />,
      score: kpiPekerjaData.score,
      gradientClass: 'from-[#e11d48] to-[#fb7185]', // Rose / Coral
      badgeText: kpiPekerjaData.absenCount === 0 ? 'Lengkap' : `${kpiPekerjaData.absenCount} Izin/Skt`,
      isSafe: kpiPekerjaData.absenCount === 0
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Filter Controls: Harian / Mingguan / Bulanan + Proyek */}
      <div className="p-4 bg-[#f8fafc] rounded-2xl sm:rounded-3xl border border-black/10 shadow-[6px_6px_14px_rgba(163,177,198,0.3),-6px_-6px_14px_rgba(255,255,255,0.95)] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.35),-2px_-2px_5px_rgba(255,255,255,0.9)] flex items-center justify-center text-black shrink-0">
            <Layers size={17} className="text-black" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-display font-black text-black leading-tight">
              Dashboard KPI
            </h1>
            <span className="text-[11px] font-bold text-black/70 block mt-0.5">
              {activeRange.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Period Mode Selector: Harian | Mingguan | Bulanan */}
          <div className="flex p-1 bg-slate-200/70 rounded-xl shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)] text-xs font-black">
            <button
              onClick={() => setFilterMode('harian')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterMode === 'harian'
                  ? 'bg-white text-black shadow-[2px_2px_5px_rgba(163,177,198,0.4),-2px_-2px_5px_rgba(255,255,255,0.95)] font-black'
                  : 'text-black/60 hover:text-black font-bold'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setFilterMode('mingguan')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterMode === 'mingguan'
                  ? 'bg-white text-black shadow-[2px_2px_5px_rgba(163,177,198,0.4),-2px_-2px_5px_rgba(255,255,255,0.95)] font-black'
                  : 'text-black/60 hover:text-black font-bold'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setFilterMode('bulanan')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterMode === 'bulanan'
                  ? 'bg-white text-black shadow-[2px_2px_5px_rgba(163,177,198,0.4),-2px_-2px_5px_rgba(255,255,255,0.95)] font-black'
                  : 'text-black/60 hover:text-black font-bold'
              }`}
            >
              Bulanan
            </button>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/80 rounded-xl text-xs flex-1 sm:flex-initial">
            <Building size={14} className="text-black shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent font-bold text-black outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">Semua Proyek</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Date / Week / Month Picker */}
          {filterMode === 'harian' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/80 rounded-xl text-xs">
              <Calendar size={14} className="text-black shrink-0" />
              <input
                type="date"
                value={evalDate}
                onChange={(e) => setEvalDate(e.target.value)}
                className="bg-transparent font-bold text-black outline-none cursor-pointer"
              />
            </div>
          )}

          {filterMode === 'mingguan' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/80 rounded-xl text-xs">
              <button
                onClick={handlePrevWeek}
                title="Minggu Sebelumnya"
                className="p-1 hover:bg-slate-100 rounded-md text-black transition cursor-pointer"
              >
                <ChevronLeft size={14} className="text-black" />
              </button>
              <div className="flex items-center gap-1">
                <Calendar size={14} className="text-black shrink-0" />
                <input
                  type="date"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="bg-transparent font-bold text-black outline-none cursor-pointer text-xs"
                />
              </div>
              <button
                onClick={handleNextWeek}
                title="Minggu Berikutnya"
                className="p-1 hover:bg-slate-100 rounded-md text-black transition cursor-pointer"
              >
                <ChevronRight size={14} className="text-black" />
              </button>
            </div>
          )}

          {filterMode === 'bulanan' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/80 rounded-xl text-xs">
              <Calendar size={14} className="text-black shrink-0" />
              <input
                type="month"
                value={evalMonth}
                onChange={(e) => setEvalMonth(e.target.value)}
                className="bg-transparent font-bold text-black outline-none cursor-pointer font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* KARTU UTAMA: 
          - TABLET & DESKTOP (md:): TOTAL SKOR DI KIRI, BARCHART DI KANAN
          - MOBILE (< md): TOTAL SKOR DI ATAS, BARCHART DI BAWAH
          - TEMA NEUMORPHIC PREMIUM (SESUAI GAMBAR 1)
      */}
      <div className="p-5 sm:p-7 bg-[#f8fafc] rounded-3xl border border-black/10 shadow-[8px_8px_20px_rgba(163,177,198,0.35),-8px_-8px_20px_rgba(255,255,255,0.95)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          
          {/* BAGIAN 1: TOTAL SKOR (DI KIRI PADA TABLET/DESKTOP, DI ATAS PADA MOBILE) */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col items-center justify-center p-5 bg-[#f8fafc] rounded-3xl shadow-[inset_3px_3px_7px_rgba(163,177,198,0.3),inset_-3px_-3px_7px_rgba(255,255,255,0.95)] border border-white/80">
            <h4 className="text-xs sm:text-sm font-display font-black text-black uppercase tracking-wider mb-4">
              Total Skor Performa
            </h4>

            {/* Premium Neumorphic Donut Chart */}
            <NeumorphicDonutChart
              percentage={kpiPerusahaan.score}
              size={180}
              strokeWidth={15}
              label="TOTAL SKOR"
              statusText={kpiPerusahaan.statusText}
              statusBadgeColor={kpiPerusahaan.statusBadgeColor}
            />

            <p className="text-[11px] font-bold text-black/70 text-center mt-3 max-w-[200px]">
              Rata-rata performa ({filterMode === 'harian' ? 'Harian' : filterMode === 'mingguan' ? 'Mingguan' : 'Bulanan'})
            </p>
          </div>

          {/* DIVIDER VERTICAL UNTUK TABLET & DESKTOP */}
          <div className="hidden md:block w-px h-72 bg-black/10 self-stretch my-auto" />

          {/* BAGIAN 2: BARCHART VERTIKAL NEUMORPHIC PREMIUM (DI KANAN PADA TABLET/DESKTOP, DI BAWAH PADA MOBILE) */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-display font-black text-black">
                  {filterMode === 'harian'
                    ? 'Indeks Performa Harian Perusahaan'
                    : filterMode === 'mingguan'
                    ? 'Indeks Performa Mingguan Perusahaan'
                    : 'Indeks Performa Bulanan Perusahaan'}
                </h3>
            </div>

            {/* Neumorphic Capsule Bars (Gambar 1) */}
            <div className="relative pt-4 pb-2 px-1 sm:px-3">
              {/* Subtle Y-Axis Grid Lines like Image 1 */}
              <div className="absolute inset-x-0 top-6 bottom-16 pointer-events-none flex flex-col justify-between opacity-30">
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
              </div>

              {/* Grid 5 Vertical Capsules */}
              <div className="grid grid-cols-5 gap-2 sm:gap-4 relative z-10">
                {kpiItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab(item.tab, item.subTab)}
                    className="flex flex-col items-center justify-end group cursor-pointer"
                    title={`Klik untuk membuka modul ${item.name}`}
                  >
                    {/* Percentage on top with bold mono font */}
                    <span className="text-[11px] sm:text-sm font-black font-mono text-black mb-2.5 group-hover:scale-105 transition-transform">
                      {item.score}%
                    </span>

                    {/* Outer Neumorphic 3D Raised Pill Column (Image 1 Style) */}
                    <div className="w-9 sm:w-12 md:w-13 lg:w-14 h-48 sm:h-56 md:h-60 bg-white rounded-full p-1.5 flex flex-col justify-end shadow-[5px_5px_12px_rgba(163,177,198,0.45),-5px_-5px_12px_rgba(255,255,255,0.95)] border border-slate-100/90 group-hover:shadow-[7px_7px_15px_rgba(163,177,198,0.5),-7px_-7px_15px_rgba(255,255,255,1)] transition-all">
                      {/* Inner Sunken Groove Canal (Image 1 Inset Slot) */}
                      <div className="w-full h-full bg-[#eef2f6] rounded-full p-1 relative flex flex-col justify-end overflow-hidden shadow-[inset_0_3px_6px_rgba(0,0,0,0.12),inset_0_-2px_4px_rgba(255,255,255,0.85)]">
                        {/* Liquid Pill Fill with Two-Tone Gradient */}
                        <div
                          className={`w-full rounded-full transition-all duration-700 ease-out shadow-xs bg-gradient-to-t ${item.gradientClass}`}
                          style={{
                            height: `${Math.max(8, item.score)}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom Label & Neumorphic Icon Button */}
                    <div className="mt-3.5 text-center flex flex-col items-center w-full">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.9)] flex items-center justify-center text-black mb-1 group-hover:shadow-[4px_4px_8px_rgba(163,177,198,0.45)] transition">
                        {item.icon}
                      </div>
                      <span className="text-[10px] sm:text-xs font-black text-black truncate w-full">
                        {item.name}
                      </span>
                      <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 border hidden sm:inline-block ${
                        item.isSafe
                          ? 'bg-emerald-100 text-black border-emerald-300'
                          : 'bg-amber-100 text-black border-amber-300'
                      }`}>
                        {item.badgeText}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ITEM PERHATIAN (JIKA ADA ANOMALI / DEFISIT) */}
      {(kpiLogistikData.reorderCount > 0 || kpiPengawasanData.overCount > 0 || kpiPenjualanData.unbookedCount > 0) && (
        <div className="p-4 sm:p-5 bg-[#f8fafc] rounded-2xl sm:rounded-3xl border border-black/10 shadow-[6px_6px_14px_rgba(163,177,198,0.3),-6px_-6px_14px_rgba(255,255,255,0.95)] space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-black" />
            <h3 className="font-display font-black text-black text-xs sm:text-sm">
              Perlu Perhatian
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {kpiLogistikData.reorderCount > 0 && (
              <div 
                onClick={() => onNavigateTab('logistik')}
                className="p-2.5 bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:shadow-[3px_3px_7px_rgba(163,177,198,0.4)] rounded-xl border border-slate-200/80 flex justify-between items-center cursor-pointer transition"
              >
                <span className="font-black text-black">Stok Reorder</span>
                <span className="font-black font-mono text-black bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 text-[11px]">
                  {kpiLogistikData.reorderCount} Material
                </span>
              </div>
            )}

            {kpiPengawasanData.overCount > 0 && (
              <div 
                onClick={() => onNavigateTab('konstruksi', 'blok')}
                className="p-2.5 bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:shadow-[3px_3px_7px_rgba(163,177,198,0.4)] rounded-xl border border-slate-200/80 flex justify-between items-center cursor-pointer transition"
              >
                <span className="font-black text-black">Unit Melebihi RAB</span>
                <span className="font-black font-mono text-black bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300 text-[11px]">
                  {kpiPengawasanData.overCount} Unit
                </span>
              </div>
            )}

            {kpiPenjualanData.unbookedCount > 0 && (
              <div 
                onClick={() => onNavigateTab('marketing', 'leads')}
                className="p-2.5 bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:shadow-[3px_3px_7px_rgba(163,177,198,0.4)] rounded-xl border border-slate-200/80 flex justify-between items-center cursor-pointer transition"
              >
                <span className="font-black text-black">Terbangun Belum Booking</span>
                <span className="font-black font-mono text-black bg-slate-200 px-2 py-0.5 rounded-lg text-[11px]">
                  {kpiPenjualanData.unbookedCount} Unit
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
