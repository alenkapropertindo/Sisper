import React from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  Home, 
  ShoppingBag, 
  Layers, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Package,
  Coins,
  Search,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';
import { 
  Project, 
  Konstruksi, 
  Inventory, 
  ProgresPekerjaan, 
  AbsensiKaryawan, 
  AbsensiPekerja, 
  TransaksiMaterial,
  RabTemplate,
  RabDetail
} from '../types';
import { getWitaToday, normalizeDateString } from '../utils/timezone';

interface DashboardViewProps {
  projects: Project[];
  konstruksiList: Konstruksi[];
  inventoryList: Inventory[];
  progresList: ProgresPekerjaan[];
  absensiList: AbsensiKaryawan[];
  absensiPekerjaList: AbsensiPekerja[];
  transaksiList: TransaksiMaterial[];
  rabTemplateList?: RabTemplate[];
  rabDetailList?: RabDetail[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  onAddProject?: () => void;
  onNavigate?: (
    tab: 'dashboard' | 'konstruksi' | 'logistik' | 'marketing' | 'operasional', 
    options?: { 
      subTab?: string; 
      search?: string; 
      statusFilter?: string;
      selectedUnit?: string;
      rekapViewMode?: 'detail' | 'semua_unit';
    }
  ) => void;
}

interface DonutChartProps {
  value: number;
  title: string;
  subtitle: string;
  colorClass?: string;
  strokeColor: string;
  gradientId: string;
  gradientColors: [string, string];
  icon: React.ReactNode;
  onClick?: () => void;
}

// Helper to provide vibrant, bright, and unique progress bar gradients
const getProgressBarGradient = (progress: number) => {
  if (progress === 100) {
    return 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.55)]';
  }
  if (progress >= 70) {
    return 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.55)]';
  }
  if (progress >= 40) {
    return 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.55)]';
  }
  if (progress > 0) {
    return 'bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-500 shadow-[0_0_8px_rgba(167,139,250,0.55)]';
  }
  return 'bg-slate-300';
};

const getProgressBarStyle = (progress: number): React.CSSProperties => {
  if (progress >= 100) {
    return {
      background: 'linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #059669 100%)',
      boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
    };
  }
  if (progress >= 70) {
    return {
      background: 'linear-gradient(90deg, #06b6d4 0%, #38bdf8 50%, #2563eb 100%)',
      boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)'
    };
  }
  if (progress >= 40) {
    return {
      background: 'linear-gradient(90deg, #fbbf24 0%, #fb923c 50%, #f59e0b 100%)',
      boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)'
    };
  }
  if (progress > 0) {
    return {
      background: 'linear-gradient(90deg, #a855f7 0%, #c084fc 50%, #6366f1 100%)',
      boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)'
    };
  }
  return {
    background: '#cbd5e1'
  };
};

function DonutChartWidget({ value, title, subtitle, strokeColor, gradientId, gradientColors, icon, onClick }: DonutChartProps) {
  const radius = 36;
  const strokeWidth = 7;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div 
      onClick={onClick} 
      className={`bg-[#e0e5ec] glossy-card-rim p-3 xs:p-5 rounded-2xl flex flex-col items-center justify-between text-center min-h-[190px] xs:min-h-[225px] transition-all duration-300 group ${
        onClick ? 'cursor-pointer hover:shadow-[3px_3px_8px_rgba(163,177,198,0.55),-3px_-3px_8px_rgba(255,255,255,0.95)] hover:-translate-y-0.5 active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6)]' : ''
      }`}
    >
      <div className="w-full flex justify-between items-center mb-1">
        <span 
          className="text-[10px] sm:text-[11px] font-black tracking-wider flex items-center gap-1.5 uppercase line-clamp-1 text-black"
        >
          <span className="p-1 rounded-lg bg-[#e0e5ec] shadow-[inset_1.5px_1.5px_3px_rgba(163,177,198,0.45),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.85)] text-black">
            {icon}
          </span>
          {title}
        </span>
      </div>
      
      {/* SVG Donut with bright gradient and vibrant outline */}
      <div className="relative flex items-center justify-center my-3 p-2.5 rounded-full shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] border border-slate-300/40">
        <svg height={92} width={92} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={gradientColors[0]} floodOpacity="0.45" />
            </filter>
          </defs>
          {/* Background circle track */}
          <circle
            stroke="#d1d9e6"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={46}
            cy={46}
          />
          {/* Progress circle */}
          <circle
            stroke={`url(#${gradientId})`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            filter={`url(#glow-${gradientId})`}
            style={{ 
              strokeDashoffset, 
              strokeLinecap: 'round', 
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            r={normalizedRadius}
            cx={46}
            cy={46}
          />
        </svg>
        {/* Absolute center label */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black font-display tracking-tight leading-none text-black">
            {value}%
          </span>
        </div>
      </div>

      <div className="w-full text-center mt-1">
        <p className="text-[10px] text-black font-bold tracking-wide uppercase line-clamp-1">{subtitle}</p>
      </div>
    </div>
  );
}

export default function DashboardView({
  projects,
  konstruksiList,
  inventoryList,
  progresList,
  absensiList,
  absensiPekerjaList,
  transaksiList,
  rabTemplateList = [],
  rabDetailList = [],
  selectedProjectId,
  setSelectedProjectId,
  onAddProject,
  onNavigate,
}: DashboardViewProps) {

  // 1. Filtered data
  const filteredKonstruksi = konstruksiList.filter(
    (k) => selectedProjectId === 'all' || k.projectId === selectedProjectId
  );

  const totalUnits = filteredKonstruksi.length;

  // Calculate percentages based on today's attendance or latest available date
  
  // A. Employee Attendance Date, Count & Percentage (WITA - Sulawesi Tenggara)
  const karyawanDateInfo = React.useMemo(() => {
    const todayStr = getWitaToday();
    const hasToday = absensiList.some(a => normalizeDateString(a.tanggal) === todayStr);
    if (hasToday) {
      return { date: todayStr, label: 'Hari Ini' };
    }
    // Fallback to latest date in table
    if (absensiList.length > 0) {
      const dates = absensiList.map(a => normalizeDateString(a.tanggal)).filter(Boolean).sort();
      const latest = dates[dates.length - 1];
      return { date: latest, label: `${latest}` };
    }
    return { date: todayStr, label: 'Hari Ini' };
  }, [absensiList]);

  const employeeAttendancePct = React.useMemo(() => {
    const targetAbs = absensiList.filter(a => normalizeDateString(a.tanggal) === karyawanDateInfo.date);
    if (targetAbs.length === 0) return 0;
    const total = targetAbs.length;
    const hadir = targetAbs.filter(a => a.statusKehadiran === 'Hadir').length;
    return Math.round((hadir / total) * 100);
  }, [absensiList, karyawanDateInfo]);

  const employeeAttendanceCount = React.useMemo(() => {
    const targetAbs = absensiList.filter(a => normalizeDateString(a.tanggal) === karyawanDateInfo.date);
    const hadir = targetAbs.filter(a => a.statusKehadiran === 'Hadir').length;
    return { hadir, total: targetAbs.length };
  }, [absensiList, karyawanDateInfo]);

  // B. Worker ("Tukang") Attendance Date, Count & Percentage (WITA - Sulawesi Tenggara)
  const pekerjaDateInfo = React.useMemo(() => {
    const todayStr = getWitaToday();
    const hasToday = absensiPekerjaList.some(a => normalizeDateString(a.tanggal) === todayStr);
    if (hasToday) {
      return { date: todayStr, label: 'Hari Ini' };
    }
    // Fallback to latest date in table
    if (absensiPekerjaList.length > 0) {
      const dates = absensiPekerjaList.map(a => normalizeDateString(a.tanggal)).filter(Boolean).sort();
      const latest = dates[dates.length - 1];
      return { date: latest, label: `${latest}` };
    }
    return { date: todayStr, label: 'Hari Ini' };
  }, [absensiPekerjaList]);

  const workerAttendancePct = React.useMemo(() => {
    const targetAbs = absensiPekerjaList.filter(a => normalizeDateString(a.tanggal) === pekerjaDateInfo.date);
    if (targetAbs.length === 0) return 0;
    const total = targetAbs.length;
    const hadir = targetAbs.filter(a => a.statusKehadiran === 'Hadir').length;
    return Math.round((hadir / total) * 100);
  }, [absensiPekerjaList, pekerjaDateInfo]);

  const workerAttendanceCount = React.useMemo(() => {
    const targetAbs = absensiPekerjaList.filter(a => normalizeDateString(a.tanggal) === pekerjaDateInfo.date);
    const hadir = targetAbs.filter(a => a.statusKehadiran === 'Hadir').length;
    return { hadir, total: targetAbs.length };
  }, [absensiPekerjaList, pekerjaDateInfo]);

  // C. Total Terbangun percentage
  const totalTerbangunPct = React.useMemo(() => {
    if (totalUnits === 0) return 0;
    const terbangun = filteredKonstruksi.filter(k => k.statusPembangunan === 'terbangun').length;
    return Math.round((terbangun / totalUnits) * 100);
  }, [filteredKonstruksi, totalUnits]);

  // D. Total Terjual percentage
  const totalTerjualPct = React.useMemo(() => {
    if (totalUnits === 0) return 0;
    const terjual = filteredKonstruksi.filter(k => k.statusPenjualan === 'terjual').length;
    return Math.round((terjual / totalUnits) * 100);
  }, [filteredKonstruksi, totalUnits]);

  // E. Total onProgress percentage
  const totalOnProgresPct = React.useMemo(() => {
    if (totalUnits === 0) return 0;
    const onProgres = filteredKonstruksi.filter(k => k.statusPembangunan === 'onProgres').length;
    return Math.round((onProgres / totalUnits) * 100);
  }, [filteredKonstruksi, totalUnits]);

  // F. Terbangun tapi belum terbooking percentage
  const terbangunBelumTerbookingPct = React.useMemo(() => {
    if (totalUnits === 0) return 0;
    const match = filteredKonstruksi.filter(
      k => k.statusPembangunan === 'terbangun' && k.statusPenjualan === 'tersedia'
    ).length;
    return Math.round((match / totalUnits) * 100);
  }, [filteredKonstruksi, totalUnits]);

  // G. Terbooking tapi belum terbangun percentage
  const terbookingBelumTerbangunPct = React.useMemo(() => {
    if (totalUnits === 0) return 0;
    const match = filteredKonstruksi.filter(
      k => k.statusPenjualan === 'terbooking' && k.statusPembangunan === 'onProgres'
    ).length;
    return Math.round((match / totalUnits) * 100);
  }, [filteredKonstruksi, totalUnits]);

  // H. Stock Value Gudang
  const totalStockValue = React.useMemo(() => {
    return inventoryList.reduce((acc, curr) => acc + (curr.jumlahStok * curr.harga), 0);
  }, [inventoryList]);

  // I. Work project item progress bars (Rata-rata progres bar tiap rumah)
  const homeProgressList = React.useMemo(() => {
    return filteredKonstruksi.map((home) => {
      // Find all progress items matching this block house
      const blockProgs = progresList.filter((p) => p.blokRumah === home.id);
      let avgProgress = 0;
      if (blockProgs.length > 0) {
        const sum = blockProgs.reduce((acc, curr) => acc + curr.persentasiProgres, 0);
        avgProgress = Math.round(sum / blockProgs.length);
      } else {
        avgProgress = home.statusPembangunan === 'terbangun' ? 100 : 0;
      }

      // Calculate total builder costs (material + labor) exactly as done in construction view
      const blockTransactions = transaksiList.filter(
        (t) => t.blokRumah === home.id && t.type === 'keluar'
      );
      const totalMaterialCost = blockTransactions.reduce((sum, t) => {
        const match = inventoryList.find((inv) => inv.namaMaterial === t.namaMaterial);
        const price = match ? match.harga : 0;
        return sum + (t.jumlah * price);
      }, 0);

      const totalLaborCost = blockProgs.reduce((sum, p) => sum + p.totalNilaiPekerjaan, 0);
      const totalBiayaBangun = totalMaterialCost + totalLaborCost;

      return {
        id: home.id,
        type: home.type,
        avgProgress,
        projectName: home.projectName,
        statusPembangunan: home.statusPembangunan,
        statusPenjualan: home.statusPenjualan,
        totalBiayaBangun,
        tanggalMulaiBangun: home.tanggalMulaiBangun,
        tanggalSelesai: home.tanggalSelesai,
      };
    });
  }, [filteredKonstruksi, progresList, transaksiList, inventoryList]);

  // Helper: Calculate working days from start date to end date (or today)
  const calculateWaktuPengerjaan = (mulaiStr?: string, selesaiStr?: string) => {
    if (!mulaiStr) return null;

    const start = new Date(mulaiStr);
    if (isNaN(start.getTime())) return null;

    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    let endMidnight: Date;
    if (selesaiStr) {
      const end = new Date(selesaiStr);
      if (!isNaN(end.getTime())) {
        endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      } else {
        const today = new Date();
        endMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      }
    } else {
      const today = new Date();
      endMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const diffMs = endMidnight.getTime() - startMidnight.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  // Format currency helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // =========================================================================
  // SECTION C: REKAPITULASI PENGGUNAAN MATERIAL PER UNIT (STATUS ON PROGRES - OVER RAB ONLY)
  // =========================================================================
  const [rekapSearchQuery, setRekapSearchQuery] = React.useState('');
  const [rekapViewMode, setRekapViewMode] = React.useState<'cards' | 'table'>('cards');

  // Compute On-Progres Units Material vs RAB Rekap
  const onProgresRekapData = React.useMemo(() => {
    // Filter specifically units with statusPembangunan === 'onProgres'
    const targetUnits = konstruksiList.filter(k => {
      if (k.statusPembangunan !== 'onProgres') return false;
      if (selectedProjectId === 'all') return true;
      return k.projectId === selectedProjectId;
    });

    return targetUnits.map(unit => {
      const proj = projects.find(p => p.id === unit.projectId);
      const rab = rabTemplateList.find(r => r.id === proj?.rabId);
      const standardItems = rabDetailList.filter(d => d.rabId === proj?.rabId);

      // Material OUT transactions for this unit
      const unitTxOut = transaksiList.filter(t => t.type === 'keluar' && t.blokRumah === unit.id);

      // Usage map (name in lowercase -> total quantity)
      const usageMap = new Map<string, number>();
      unitTxOut.forEach(t => {
        const key = t.namaMaterial.trim().toLowerCase();
        usageMap.set(key, (usageMap.get(key) || 0) + (Number(t.jumlah) || 0));
      });

      // Compare standard items with actual usage
      const overItems: { namaMaterial: string; standardQty: number; actualQty: number; satuan: string; selisih: number }[] = [];
      let totalStandardCost = 0;

      standardItems.forEach(item => {
        const key = item.namaMaterial.trim().toLowerCase();
        const actual = usageMap.get(key) || 0;
        const matchedInv = inventoryList.find(i => i.namaMaterial.trim().toLowerCase() === key);
        const price = matchedInv?.harga || 0;
        totalStandardCost += item.qtyStandar * price;

        if (actual > item.qtyStandar) {
          overItems.push({
            namaMaterial: item.namaMaterial,
            standardQty: item.qtyStandar,
            actualQty: actual,
            satuan: item.satuan,
            selisih: actual - item.qtyStandar
          });
        }
      });

      // Pemeriksaan material yang keluar tetapi tidak ada dalam standar RAB unit (pemakaian non-standar / over kuota)
      unitTxOut.forEach(t => {
        const key = t.namaMaterial.trim().toLowerCase();
        const isInStandard = standardItems.some(item => item.namaMaterial.trim().toLowerCase() === key);
        if (!isInStandard && (usageMap.get(key) || 0) > 0) {
          if (!overItems.some(o => o.namaMaterial.trim().toLowerCase() === key)) {
            const actual = usageMap.get(key) || Number(t.jumlah) || 0;
            const matchedInv = inventoryList.find(i => i.namaMaterial.trim().toLowerCase() === key);
            overItems.push({
              namaMaterial: t.namaMaterial,
              standardQty: 0,
              actualQty: actual,
              satuan: matchedInv?.satuan || 'Pcs',
              selisih: actual
            });
          }
        }
      });

      // Total actual material cost for this unit
      let totalActualCost = 0;
      unitTxOut.forEach(t => {
        const key = t.namaMaterial.trim().toLowerCase();
        const matchedInv = inventoryList.find(i => i.namaMaterial.trim().toLowerCase() === key);
        const price = matchedInv?.harga || 0;
        totalActualCost += (Number(t.jumlah) || 0) * price;
      });

      // Physical progress of unit
      const unitJobs = progresList.filter(p => p.blokRumah === unit.id);
      const physicalProgress = unitJobs.length > 0
        ? Math.round(unitJobs.reduce((acc, curr) => acc + (curr.persentasiProgres || 0), 0) / unitJobs.length)
        : 0;

      // Determine RAB status:
      // 'over' : pemakaian material melebihi standar RAB
      // 'no_tx': belum ada pengeluaran material (belum keluar) -> TIDAK ditampilkan
      // 'aman' : ada pengeluaran material dan masih dalam kuota standar -> TIDAK ditampilkan
      let rabStatus: 'over' | 'aman' | 'no_tx' = 'aman';
      if (overItems.length > 0) {
        rabStatus = 'over';
      } else if (unitTxOut.length === 0) {
        rabStatus = 'no_tx';
      } else {
        rabStatus = 'aman';
      }

      return {
        unit,
        projectName: proj?.name || unit.projectName || '-',
        rabName: rab?.namaRab || (proj?.rabId ? 'RAB Belum Ditemukan' : 'Belum Ditentukan'),
        rabId: proj?.rabId,
        standardItemsCount: standardItems.length,
        txCount: unitTxOut.length,
        itemsUsedCount: usageMap.size,
        overItems,
        overCount: overItems.length,
        totalActualCost,
        totalStandardCost,
        physicalProgress,
        rabStatus
      };
    });
  }, [konstruksiList, selectedProjectId, projects, rabTemplateList, rabDetailList, transaksiList, inventoryList, progresList]);

  // Strictly filter only units that are OVER RAB (aman and no_tx are excluded)
  const overRekapData = React.useMemo(() => {
    return onProgresRekapData.filter(item => item.rabStatus === 'over');
  }, [onProgresRekapData]);

  // Filtered Over RAB data based on search query
  const filteredRekapData = React.useMemo(() => {
    return overRekapData.filter(item => {
      const q = rekapSearchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        item.unit.id.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q) ||
        item.unit.type.toLowerCase().includes(q) ||
        item.overItems.some(o => o.namaMaterial.toLowerCase().includes(q))
      );
    });
  }, [overRekapData, rekapSearchQuery]);

  // Rekap summary statistics focused specifically on Over RAB units
  const rekapOverSummary = React.useMemo(() => {
    const totalOverUnits = overRekapData.length;
    const totalOverItemsCount = overRekapData.reduce((acc, curr) => acc + curr.overCount, 0);
    const totalActualCost = overRekapData.reduce((acc, curr) => acc + curr.totalActualCost, 0);
    const totalStandardCost = overRekapData.reduce((acc, curr) => acc + curr.totalStandardCost, 0);

    return {
      totalOverUnits,
      totalOverItemsCount,
      totalActualCost,
      totalStandardCost
    };
  }, [overRekapData]);

  const handleCekDetail = (unitId: string) => {
    if (onNavigate) {
      onNavigate('logistik', {
        subTab: 'rekap_unit',
        selectedUnit: unitId,
        rekapViewMode: 'detail'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Welcoming Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#e0e5ec] glossy-card-rim">
       
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#e0e5ec] text-indigo-600 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] border border-indigo-500/20">
            <Building2 size={22} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-display font-black text-black tracking-tight">Overview Real-Time</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-black border border-slate-300">
                Live Analytics
              </span>
            </div>
            <p className="text-xs text-black font-semibold mt-0.5">Pantau status kapling, kehadiran tim, dan progres fisik secara akurat</p>
          </div>
        </div>
        
        {/* Project Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-black text-black uppercase tracking-wider">Filter Projek:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs sm:text-sm font-black text-black bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] border border-slate-300/40 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer transition"
          >
            <option value="all">Semua Projek Perumahan</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {onAddProject && (
            <button
              onClick={onAddProject}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#e0e5ec] shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.85)] hover:shadow-[1px_1px_3px_rgba(163,177,198,0.6),-1px_-1px_3px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] text-xs font-black text-black transition cursor-pointer"
              title="Tambah Projek Perumahan Baru"
            >
              <PlusCircle size={15} className="text-black" />
              <span>+ Tambah Projek</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid statistics - Bento layouts with Badges and Donut Charts */}
      <div className="space-y-8">
        
        {/* SECTION A: DISTRIBUSI KAPLING & STATISTIK UNIT */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-4 bg-black rounded-full"></span>
            <h3 className="text-xs font-black uppercase tracking-widest text-black">Distribusi Kapling & Progres Lapangan</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Kapling Unit Badge Card */}
            <div 
              onClick={() => onNavigate?.('konstruksi')}
              className="bg-[#e0e5ec] glossy-card-rim p-4 sm:p-5 rounded-3xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_12px_rgba(163,177,198,0.55),-4px_-4px_12px_rgba(255,255,255,0.95)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.65)] group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 rounded-2xl bg-[#e0e5ec] text-black shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-slate-300/40">
                  <Home size={18} className="text-black" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-200 text-black border border-slate-300 rounded-full leading-none">
                  Total Kapling
                </span>
              </div>
              <div className="mt-2">
                <p className="text-[11px] font-black text-black uppercase tracking-wider">Unit Terdaftar</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black font-display text-black">{totalUnits}</span>
                  <span className="text-xs font-black text-black uppercase">Unit</span>
                </div>
              </div>
            </div>

            {/* 2. On Progres Pembangunan Badge Card */}
            <div 
              onClick={() => onNavigate?.('konstruksi', { subTab: 'blok', statusFilter: 'onProgres' })}
              className="bg-[#e0e5ec] glossy-card-rim p-4 sm:p-5 rounded-3xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_12px_rgba(163,177,198,0.55),-4px_-4px_12px_rgba(255,255,255,0.95)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.65)] group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 rounded-2xl bg-[#e0e5ec] text-black shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-slate-300/40">
                  <Activity size={18} className="text-black" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-200 text-black border border-slate-300 rounded-full leading-none">
                  In Progress
                </span>
              </div>
              <div className="mt-2">
                <p className="text-[11px] font-black text-black uppercase tracking-wider">Konstruksi Berjalan</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black font-display text-black">
                    {filteredKonstruksi.filter(k => k.statusPembangunan === 'onProgres').length}
                  </span>
                  <span className="text-xs font-black text-black uppercase">Unit</span>
                </div>
              </div>
            </div>

            {/* 3. Terbangun Belum Booking Badge Card */}
            <div 
              onClick={() => onNavigate?.('konstruksi', { subTab: 'blok', statusFilter: 'readyStock' })}
              className="bg-[#e0e5ec] glossy-card-rim p-4 sm:p-5 rounded-3xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_12px_rgba(163,177,198,0.55),-4px_-4px_12px_rgba(255,255,255,0.95)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.65)] group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 rounded-2xl bg-[#e0e5ec] text-black shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-slate-300/40">
                  <AlertTriangle size={18} className="text-black" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-200 text-black border border-slate-300 rounded-full leading-none">
                  Ready Stock
                </span>
              </div>
              <div className="mt-2">
                <p className="text-[11px] font-black text-black uppercase tracking-wider">Terbangun Belum Booking</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black font-display text-black">
                    {filteredKonstruksi.filter(k => k.statusPembangunan === 'terbangun' && k.statusPenjualan === 'tersedia').length}
                  </span>
                  <span className="text-xs font-black text-black uppercase">Unit</span>
                </div>
              </div>
            </div>

            {/* 4. Terbooking Belum Terbangun Badge Card */}
            <div 
              onClick={() => onNavigate?.('konstruksi', { subTab: 'blok', statusFilter: 'backlog' })}
              className="bg-[#e0e5ec] glossy-card-rim p-4 sm:p-5 rounded-3xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_12px_rgba(163,177,198,0.55),-4px_-4px_12px_rgba(255,255,255,0.95)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.65)] group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 rounded-2xl bg-[#e0e5ec] text-black shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-slate-300/40">
                  <TrendingUp size={18} className="text-black" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-200 text-black border border-slate-300 rounded-full leading-none">
                  Backlog Unit
                </span>
              </div>
              <div className="mt-2">
                <p className="text-[11px] font-black text-black uppercase tracking-wider">Terbooking Belum Bangun</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black font-display text-black">
                    {filteredKonstruksi.filter(k => k.statusPenjualan === 'terbooking' && k.statusPembangunan === 'onProgres').length}
                  </span>
                  <span className="text-xs font-black text-black uppercase">Unit</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION B: PERSENTASE KINERJA & ABSENSI (Elegant SVG Donut Charts) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-4 bg-gradient-to-b from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.5)]"></span>
            <h3 className="text-xs font-black uppercase tracking-widest text-black">Analisis Kinerja & Kehadiran (Donut Charts)</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">

            {/* Donut Chart 3: Kehadiran Karyawan */}
            <DonutChartWidget 
              value={employeeAttendancePct}
              title="Kehadiran Karyawan"
              subtitle={`${employeeAttendanceCount.hadir}/${employeeAttendanceCount.total} Hadir (${karyawanDateInfo.label})`}
              colorClass="text-black"
              strokeColor="#06b6d4"
              gradientId="grad-karyawan"
              gradientColors={['#06b6d4', '#3b82f6']}
              icon={<Users size={14} className="text-black" />}
              onClick={() => onNavigate?.('operasional')}
            />

            {/* Donut Chart 4: Kehadiran Pekerja */}
            <DonutChartWidget 
              value={workerAttendancePct}
              title="Kehadiran Pekerja"
              subtitle={`${workerAttendanceCount.hadir}/${workerAttendanceCount.total} Hadir (${pekerjaDateInfo.label})`}
              colorClass="text-black"
              strokeColor="#f59e0b"
              gradientId="grad-pekerja"
              gradientColors={['#fbbf24', '#f97316']}
              icon={<Activity size={14} className="text-black" />}
              onClick={() => onNavigate?.('operasional', { subTab: 'absensi_pekerja' })}
            />

            {/* Donut Chart 1: Total Terbangun */}
            <DonutChartWidget 
              value={totalTerbangunPct}
              title="Total Terbangun"
              subtitle={`${filteredKonstruksi.filter(k => k.statusPembangunan === 'terbangun').length} dari ${totalUnits} unit selesai`}
              colorClass="text-black"
              strokeColor="#10b981"
              gradientId="grad-terbangun"
              gradientColors={['#34d399', '#059669']}
              icon={<Layers size={14} className="text-black" />}
              onClick={() => onNavigate?.('konstruksi', { subTab: 'blok', statusFilter: 'terbangun' })}
            />

            {/* Donut Chart 2: Total Terjual */}
            <DonutChartWidget 
              value={totalTerjualPct}
              title="Total Terjual"
              subtitle={`${filteredKonstruksi.filter(k => k.statusPenjualan === 'terjual').length} unit lunas/akad`}
              colorClass="text-black"
              strokeColor="#f43f5e"
              gradientId="grad-terjual"
              gradientColors={['#f472b6', '#e11d48']}
              icon={<ShoppingBag size={14} className="text-black" />}
              onClick={() => onNavigate?.('konstruksi', { subTab: 'blok', statusFilter: 'terjual' })}
            />

          </div>
        </div>
      </div>

      {/* 10. Progres bar pembangunan rumah (Individual Block Progress List) */}
      <div className="p-6 rounded-3xl bg-[#e0e5ec] glossy-card-rim space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-display font-black text-black flex items-center gap-2">
              <Building2 className="text-black" size={20} />
              Progres Konstruksi Detail Blok Rumah
            </h3>
            <p className="text-xs text-black font-semibold">Status rata-rata penyelesaian blok rumah berdasarkan progres pekerjaan detail</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-black bg-[#e0e5ec] px-3 py-1 rounded-full shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-slate-300/40">
              Total {homeProgressList.length} Blok
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {homeProgressList.map((home) => (
            <div 
              key={home.id} 
              onClick={() => onNavigate?.('konstruksi', { subTab: 'progres', search: home.id })}
              className="p-5 rounded-2xl bg-[#e0e5ec] glossy-card-rim hover:-translate-y-1 hover:shadow-[4px_4px_12px_rgba(163,177,198,0.55),-4px_-4px_12px_rgba(255,255,255,0.95)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6)] cursor-pointer transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-display font-black text-sm transition tracking-tight">
                    <span className="text-black font-black text-base">Blok {home.id}</span>
                  </h5>
                  <p className="text-[11px] text-black font-semibold">{home.projectName}</p>
                </div>
                {/* Badges */}
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full ${
                    home.statusPembangunan === 'terbangun' 
                      ? 'bg-slate-200 text-black border border-slate-300' 
                      : 'bg-slate-200 text-black border border-slate-300'
                  }`}>
                    {home.statusPembangunan}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                    home.statusPenjualan === 'tersedia' 
                      ? 'bg-slate-200 text-black border border-slate-300'
                      : home.statusPenjualan === 'terbooking'
                      ? 'bg-slate-200 text-black border border-slate-300'
                      : 'bg-slate-200 text-black border border-slate-300'
                  }`}>
                    {home.statusPenjualan}
                  </span>
                </div>
              </div>

              {/* Progress, Cost & Duration representation */}
              <div className="mt-4 space-y-2.5">
                <div className="flex justify-between items-center text-[11px] border-t border-slate-300/40 pt-2.5">
                  <span className="font-semibold text-black">Biaya Bangun</span>
                  <span className="font-black text-black font-mono text-xs">{formatRupiah(home.totalBiayaBangun)}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] border-t border-slate-300/30 pt-2">
                  <span className="flex items-center gap-1.5 font-semibold text-black">
                    <Clock size={13} className="text-black" />
                    <span>Waktu Pengerjaan</span>
                  </span>
                  <span className="font-black font-mono text-xs text-black">
                    {(() => {
                      const days = calculateWaktuPengerjaan(home.tanggalMulaiBangun, home.tanggalSelesai);
                      if (days === null) return <span className="text-black font-normal">-</span>;
                      return (
                        <span className="flex items-center gap-1.5">
                          <span className="text-black font-black">{days} Hari</span>
                          {home.tanggalSelesai ? (
                            <span className="text-[9px] font-sans font-black px-1.5 py-0.5 rounded-full bg-slate-200 text-black border border-slate-300">
                              Selesai
                            </span>
                          ) : (
                            <span className="text-[9px] font-sans font-black px-1.5 py-0.5 rounded-full bg-slate-200 text-black border border-slate-300">
                              Berjalan
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-black text-black mb-1">
                    <span>Penyelesaian Fisik</span>
                    <span className="text-black font-mono font-black">{home.avgProgress}%</span>
                  </div>
                    <div className="w-full bg-[#e0e5ec] h-3.5 rounded-full p-0.5 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-slate-300/40">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarGradient(home.avgProgress)}`}
                      style={{ width: `${home.avgProgress}%`, ...getProgressBarStyle(home.avgProgress) }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {homeProgressList.length === 0 && (
            <div className="col-span-full py-8 text-center text-black font-semibold text-sm">
              Tidak ada data progres blok untuk projek ini. Silakan tambahkan blok perumahan baru.
            </div>
          )}
        </div>
      </div>

      {/* SECTION C: REKAPITULASI PENGGUNAAN MATERIAL PER UNIT (STATUS ON PROGRES - OVER RAB ONLY) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#e0e5ec] glossy-card-rim space-y-6">
        {/* Header with Title & Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-5 bg-black rounded-full" />
              <h3 className="text-base sm:text-xl font-display font-black text-black flex items-center gap-2.5">
                <AlertTriangle className="text-black" size={22} />
                Rekapitulasi Unit On-Progres Melebihi Batas (Over RAB)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-black font-semibold mt-1 pl-4">
              Pengawasan khusus unit on-progres yang mengalami pemakaian material melebihi kuota standar RAB. Unit aman dan belum keluar tidak ditampilkan. Klik unit untuk membuka lembar audit rincian.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-200 text-black border border-slate-300">
              {rekapOverSummary.totalOverUnits} Unit Terdeteksi Over RAB
            </span>
          </div>
        </div>

        {/* 4 Mini KPI Cards for Status Kontrol RAB (Over RAB Focus) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Unit Over RAB */}
          <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-black tracking-wider block">Unit Over RAB</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-black block mt-0.5">
                {rekapOverSummary.totalOverUnits} <span className="text-xs font-bold text-black">Unit</span>
              </span>
              <span className="text-[10px] text-black font-semibold mt-0.5 block">On-progres melebihi kuota</span>
            </div>
            <div className="p-3 bg-slate-200 text-black rounded-xl">
              <AlertTriangle size={20} />
            </div>
          </div>

          {/* Card 2: Total Item Material Over */}
          <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-black tracking-wider block">Item Material Over</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-black block mt-0.5">
                {rekapOverSummary.totalOverItemsCount} <span className="text-xs font-bold text-black">Jenis</span>
              </span>
              <span className="text-[10px] text-black font-semibold mt-0.5 block">Material melampaui kuota</span>
            </div>
            <div className="p-3 bg-slate-200 text-black rounded-xl">
              <Package size={20} />
            </div>
          </div>

          {/* Card 3: Total Biaya Material Unit Over */}
          <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-black tracking-wider block">Material Terserap (Over)</span>
              <span className="text-base sm:text-lg font-mono font-black text-black block mt-1 truncate max-w-[140px] sm:max-w-none">
                {formatRupiah(rekapOverSummary.totalActualCost)}
              </span>
              <span className="text-[10px] text-black font-semibold mt-0.5 block">Realisasi material keluar</span>
            </div>
            <div className="p-3 bg-slate-200 text-black rounded-xl">
              <Coins size={20} />
            </div>
          </div>

          {/* Card 4: Status Tindakan Audit */}
          <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-black tracking-wider block">Status Audit Kontrol</span>
              <span className="text-base sm:text-lg font-display font-black text-black block mt-0.5">
                {rekapOverSummary.totalOverUnits > 0 ? 'Perlu Audit' : 'Aman Terkendali'}
              </span>
              <span className="text-[10px] text-black font-semibold mt-0.5 block">
                {rekapOverSummary.totalOverUnits > 0 ? 'Evaluasi lapangan aktif' : 'Nol kelebihan kuota'}
              </span>
            </div>
            <div className="p-3 bg-slate-200 text-black rounded-xl">
              <ShieldCheck size={20} />
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Count Indicator, View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-300/40">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[220px] sm:min-w-[280px] flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-3 text-black" size={15} />
              <input
                type="text"
                placeholder="Cari blok atau nama material over (cth: A-01, Besi)..."
                value={rekapSearchQuery}
                onChange={(e) => setRekapSearchQuery(e.target.value)}
                className="w-full text-xs font-black pl-9 pr-3 py-2 rounded-xl bg-[#e0e5ec] border border-slate-300/60 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.45),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] focus:outline-none focus:ring-1 focus:ring-slate-400 text-black placeholder:text-gray-600"
              />
            </div>

            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-200 text-black border border-slate-300">
              Menampilkan: {filteredRekapData.length} Unit Over RAB
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-slate-300/40 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setRekapViewMode('cards')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                rekapViewMode === 'cards'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-black hover:bg-slate-200/50'
              }`}
            >
              Kartu Ringkas
            </button>
            <button
              type="button"
              onClick={() => setRekapViewMode('table')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                rekapViewMode === 'table'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-black hover:bg-slate-200/50'
              }`}
            >
              Tabel Lengkap
            </button>
          </div>
        </div>

        {/* Content Render: Cards Mode or Table Mode */}
        {rekapViewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredRekapData.map((item) => {
              return (
                <div
                  key={item.unit.id}
                  onClick={() => handleCekDetail(item.unit.id)}
                  className="bg-[#e0e5ec] glossy-card-rim p-5 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_16px_rgba(163,177,198,0.65),-6px_-6px_16px_rgba(255,255,255,0.95)] cursor-pointer group relative border-black"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-xl text-black">
                            Blok {item.unit.id}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-200 text-black border border-slate-300">
                            On Progres
                          </span>
                        </div>
                        <p className="text-xs text-black font-semibold mt-0.5">
                          {item.projectName} &bull; {item.unit.type}
                        </p>
                      </div>

                      {/* Kontrol Status Badge */}
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-200 text-black border border-slate-300">
                          <AlertTriangle size={11} className="text-black" />
                          Over RAB (+{item.overCount})
                        </span>
                      </div>
                    </div>

                    {/* Template RAB reference info */}
                    <div className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] border border-slate-300/40 text-[11px] flex items-center justify-between mt-3">
                      <span className="text-black font-semibold">Standar RAB:</span>
                      <strong className="text-black font-black truncate max-w-[180px]">
                        {item.rabName}
                      </strong>
                    </div>

                    {/* Progress Fisik Unit */}
                    <div className="mt-3.5 space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-black text-black">
                        <span>Penyelesaian Fisik:</span>
                        <span className="font-mono text-black font-black">
                          {item.physicalProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-[#e0e5ec] h-2.5 rounded-full p-0.5 shadow-[inset_1.5px_1.5px_3px_rgba(163,177,198,0.5),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.85)]">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBarGradient(item.physicalProgress)}`}
                          style={{ width: `${item.physicalProgress}%`, ...getProgressBarStyle(item.physicalProgress) }}
                        />
                      </div>
                    </div>

                    {/* Financial & Material stats */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-300/40 text-xs">
                      <div>
                        <span className="text-[10px] text-black font-semibold block">Transaksi Keluar</span>
                        <strong className="text-black font-mono font-black block mt-0.5">
                          {item.txCount} Kali ({item.itemsUsedCount} Jenis)
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-black font-semibold block">Nilai Material Keluar</span>
                        <strong className="text-black font-mono font-black text-xs block mt-0.5">
                          {formatRupiah(item.totalActualCost)}
                        </strong>
                      </div>
                    </div>

                    {/* Over Warning Item Alert Box */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-200/90 border border-slate-300 text-[11px] text-black space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-black text-xs">
                        <AlertTriangle size={13} className="text-black shrink-0" />
                        <span>Material Melebihi Kuota RAB ({item.overCount} Jenis):</span>
                      </div>
                      <div className="space-y-0.5 pl-4">
                        {item.overItems.slice(0, 3).map((ov, oIdx) => (
                          <div key={oIdx} className="text-[10px] font-mono flex justify-between">
                            <span className="font-bold text-black truncate max-w-[130px]">{ov.namaMaterial}</span>
                            <span className="text-black font-black">
                              {ov.actualQty}/{ov.standardQty} {ov.satuan} (+{ov.selisih})
                            </span>
                          </div>
                        ))}
                        {item.overItems.length > 3 && (
                          <div className="text-[10px] text-black italic font-bold">
                            +{item.overItems.length - 3} material lainnya over kuota
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Action Button to Cek Detail */}
                  <div className="mt-4 pt-3 border-t border-slate-300/30 flex items-center justify-between">
                    <span className="text-[11px] text-black font-semibold">
                      Buka Rincian Pemakaian
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCekDetail(item.unit.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e0e5ec] text-black hover:text-black font-black text-xs shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.9)] hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] transition border border-slate-300/50 cursor-pointer"
                    >
                      <span>Cek Detail RAB</span>
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredRekapData.length === 0 && (
              <div className="col-span-full py-12 text-center text-black space-y-2">
                <CheckCircle2 className="mx-auto text-black" size={40} />
                <h4 className="text-base font-black text-black">
                  {overRekapData.length === 0
                    ? 'Nol Unit Over RAB (Semua Unit Aman / Belum Ada Pengeluaran)'
                    : 'Tidak Ada Unit Over RAB yang Cocok'}
                </h4>
                <p className="text-xs text-black font-semibold max-w-md mx-auto">
                  {overRekapData.length === 0
                    ? 'Seluruh unit berstatus On Progres saat ini pemakaian materialnya masih dalam kuota standar RAB atau belum ada pengeluaran material. Unit yang aman dan belum keluar tidak ditampilkan.'
                    : 'Tidak ada unit Over RAB yang cocok dengan kata kunci pencarian Anda.'}
                </p>
                {rekapSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRekapSearchQuery('')}
                    className="text-xs text-black font-black underline cursor-pointer"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Table View Mode */
          <div className="overflow-x-auto rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] border border-slate-300/40 p-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300/60 text-black text-[11px] uppercase font-black font-display">
                  <th className="p-3.5">Blok Rumah</th>
                  <th className="p-3.5">Nama Proyek & Tipe</th>
                  <th className="p-3.5">Template RAB</th>
                  <th className="p-3.5 text-center">Fisik</th>
                  <th className="p-3.5 text-right font-mono">Transaksi Keluar</th>
                  <th className="p-3.5 text-right font-mono">Total Biaya</th>
                  <th className="p-3.5">Status Over RAB</th>
                  <th className="p-3.5 text-center">Aksi Cek Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/40 text-black">
                {filteredRekapData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-black font-semibold italic">
                      {overRekapData.length === 0
                        ? 'Nol unit on-progres yang over RAB. Unit dengan status aman dan yang belum ada pengeluaran material tidak ditampilkan.'
                        : 'Tidak ada unit Over RAB yang sesuai dengan filter pencarian.'}
                    </td>
                  </tr>
                ) : (
                  filteredRekapData.map((item) => {
                    return (
                      <tr
                        key={item.unit.id}
                        onClick={() => handleCekDetail(item.unit.id)}
                        className="hover:bg-slate-200/50 cursor-pointer transition text-black"
                      >
                        <td className="p-3.5">
                          <span className="font-display font-black text-black text-sm">
                            Blok {item.unit.id}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-black text-black">{item.projectName}</div>
                          <div className="text-[10px] text-black font-semibold">{item.unit.type}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-black">{item.rabName}</span>
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-black">
                          <div className="flex flex-col items-center gap-1">
                            <span>{item.physicalProgress}%</span>
                            <div className="w-16 bg-[#e0e5ec] h-2 rounded-full p-0.5 shadow-[inset_1px_1px_2px_rgba(163,177,198,0.5)] border border-slate-300/40">
                              <div
                                className={`h-1 rounded-full transition-all duration-300 ${getProgressBarGradient(item.physicalProgress)}`}
                                style={{ width: `${item.physicalProgress}%`, ...getProgressBarStyle(item.physicalProgress) }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-black">
                          {item.txCount} Kali ({item.itemsUsedCount} Jenis)
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-black">
                          {formatRupiah(item.totalActualCost)}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-200 text-black border border-slate-300">
                            <AlertTriangle size={11} className="text-black" />
                            {item.overCount} Item Melebihi RAB
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCekDetail(item.unit.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-black font-black text-xs border border-slate-300 cursor-pointer transition flex items-center gap-1 mx-auto"
                          >
                            <span>Cek Detail</span>
                            <ArrowRight size={12} className="text-black" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
