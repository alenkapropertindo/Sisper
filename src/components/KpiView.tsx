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
  ChevronRight,
  Sparkles,
  Bot,
  Phone,
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2
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
import {
  getWitaToday,
  getWitaYesterday,
  normalizeDateString,
  formatWitaDateIndo,
  addDaysWita,
  TIMEZONE_LABEL,
  TIMEZONE_SULTRA,
} from '../utils/timezone';

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
  onNavigateTab: (
    tab: 'dashboard' | 'konstruksi' | 'logistik' | 'marketing' | 'operasional',
    options?: {
      subTab?: string;
      search?: string;
      statusFilter?: string;
      selectedUnit?: string;
      rekapViewMode?: 'detail' | 'semua_unit';
    } | string
  ) => void;
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

  // State for evaluation date (YYYY-MM-DD) based on WITA (Sulawesi Tenggara)
  const todayStr = React.useMemo(() => {
    return getWitaToday();
  }, []);
  const yesterdayStr = React.useMemo(() => {
    return getWitaYesterday();
  }, []);

  // Track if initial sync has occurred
  const hasInitializedRef = React.useRef(false);

  const [evalDate, setEvalDate] = React.useState<string>(() => {
    return getWitaToday();
  });

  // On initial mount ONLY: if today has no attendance records but database has records, default to latest recorded date
  React.useEffect(() => {
    if (hasInitializedRef.current) return;
    const normalizedDates = [
      ...absensiList.map(a => normalizeDateString(a.tanggal)),
      ...absensiPekerjaList.map(a => normalizeDateString(a.tanggal))
    ].filter(Boolean);

    if (normalizedDates.length > 0) {
      const sorted = [...new Set(normalizedDates)].sort().reverse();
      const today = getWitaToday();
      if (!sorted.includes(today)) {
        setEvalDate(sorted[0]);
      }
    }
    hasInitializedRef.current = true;
  }, [absensiList, absensiPekerjaList]);

  // State for evaluation month (YYYY-MM)
  const [evalMonth, setEvalMonth] = React.useState<string>(() => {
    return evalDate.slice(0, 7) || todayStr.slice(0, 7);
  });

  React.useEffect(() => {
    if (evalDate) {
      setEvalMonth(evalDate.slice(0, 7));
    }
  }, [evalDate]);

  // Calculate active date range based on filterMode in WITA timezone
  const activeRange = React.useMemo(() => {
    if (filterMode === 'harian') {
      const formatted = formatWitaDateIndo(evalDate);
      return {
        start: evalDate,
        end: evalDate,
        label: `Harian: ${formatted}`
      };
    } else if (filterMode === 'mingguan') {
      const [y, m, d] = evalDate.split('-').map(Number);
      const target = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
      const day = target.getUTCDay(); // 0 is Sun, 1 is Mon...
      const diffToMon = target.getUTCDate() - (day === 0 ? 6 : day - 1);
      const monday = new Date(Date.UTC(y, (m || 1) - 1, diffToMon, 12, 0, 0));
      const sunday = new Date(Date.UTC(y, (m || 1) - 1, diffToMon + 6, 12, 0, 0));

      const startISO = monday.toISOString().split('T')[0];
      const endISO = sunday.toISOString().split('T')[0];
      const label = `Mingguan: ${formatWitaDateIndo(startISO, { day: 'numeric', month: 'short' })} - ${formatWitaDateIndo(endISO, { day: 'numeric', month: 'short', year: 'numeric' })}`;

      return {
        start: startISO,
        end: endISO,
        label
      };
    } else {
      // Bulanan
      const [y, m] = evalMonth.split('-').map(Number);
      const start = `${evalMonth}-01`;
      const lastDay = new Date(Date.UTC(y, m, 0, 12, 0, 0)).getUTCDate();
      const end = `${evalMonth}-${String(lastDay).padStart(2, '0')}`;
      const dateObj = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
      const label = `Bulanan: ${dateObj.toLocaleDateString('id-ID', { timeZone: TIMEZONE_SULTRA, month: 'long', year: 'numeric' })}`;

      return {
        start,
        end,
        label
      };
    }
  }, [filterMode, evalDate, evalMonth]);

  // Quick navigation for weekly filter using WITA dates
  const handlePrevWeek = () => {
    setEvalDate(prev => addDaysWita(prev, -7));
  };

  const handleNextWeek = () => {
    setEvalDate(prev => addDaysWita(prev, 7));
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

    const overUnitsList: { unit: Konstruksi; overItemsCount: number; overAmountRp: number }[] = [];
    let totalKerugianRp = 0;

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
      let unitOverRp = 0;

      standardItems.forEach(item => {
        const key = item.namaMaterial.trim().toLowerCase();
        const actual = usageMap.get(key) || 0;
        if (actual > item.qtyStandar) {
          isOver = true;
          overCount++;
          const selisih = actual - item.qtyStandar;
          const invItem = inventoryList.find(inv => inv.namaMaterial.trim().toLowerCase() === key);
          const price = invItem?.harga || 0;
          unitOverRp += selisih * price;
        }
      });

      unitTxOut.forEach(t => {
        const key = t.namaMaterial.trim().toLowerCase();
        const inStd = standardItems.some(i => i.namaMaterial.trim().toLowerCase() === key);
        if (!inStd && (usageMap.get(key) || 0) > 0) {
          isOver = true;
          overCount++;
          const invItem = inventoryList.find(inv => inv.namaMaterial.trim().toLowerCase() === key);
          const price = invItem?.harga || 0;
          unitOverRp += (Number(t.jumlah) || 0) * price;
        }
      });

      if (isOver) {
        overUnitsList.push({ unit, overItemsCount: overCount, overAmountRp: unitOverRp });
        totalKerugianRp += unitOverRp;
      }
    });

    const overCount = overUnitsList.length;
    const safeCount = totalUnits - overCount;
    const score = Math.max(0, Math.min(100, Math.round(((totalUnits - overCount) / totalUnits) * 100)));

    return { score, totalUnits, overCount, safeCount, overUnitsList, totalKerugianRp };
  }, [filteredKonstruksi, projects, rabDetailList, transaksiList, inventoryList, activeRange]);

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

    const recordsInRange = absensiList.filter(a => {
      const cleanDate = normalizeDateString(a.tanggal);
      return cleanDate && cleanDate >= activeRange.start && cleanDate <= activeRange.end;
    });

    if (recordsInRange.length === 0) {
      // Tidak ada catatan ketidakhadiran/absensi pada rentang ini -> Default 100% aman
      return { score: 100, totalKaryawan, hadirCount: totalKaryawan, totalExpected: totalKaryawan, absenCount: 0, daysCount: 1 };
    }

    // Helper to check if record status is 'Hadir'
    const isHadirStatus = (status: string) => {
      const s = (status || '').trim().toLowerCase();
      return s === 'hadir';
    };

    if (filterMode === 'harian') {
      const nonHadirCount = recordsInRange.filter(a => !isHadirStatus(a.statusKehadiran)).length;
      const explicitHadirCount = recordsInRange.filter(a => isHadirStatus(a.statusKehadiran)).length;
      
      const hadirCount = explicitHadirCount > 0 
        ? explicitHadirCount 
        : Math.max(0, totalKaryawan - nonHadirCount);

      const absenCount = nonHadirCount;
      const score = Math.max(0, Math.min(100, Math.round((hadirCount / totalKaryawan) * 100)));
      return { score, totalKaryawan, hadirCount, totalExpected: totalKaryawan, absenCount, daysCount: 1 };
    } else {
      const activeDates = Array.from(new Set(recordsInRange.map(r => normalizeDateString(r.tanggal))));
      const daysCount = Math.max(1, activeDates.length);
      const totalExpected = totalKaryawan * daysCount;

      const nonHadirCount = recordsInRange.filter(a => !isHadirStatus(a.statusKehadiran)).length;
      const explicitHadirCount = recordsInRange.filter(a => isHadirStatus(a.statusKehadiran)).length;
      
      const hadirCount = explicitHadirCount > 0
        ? explicitHadirCount
        : Math.max(0, totalExpected - nonHadirCount);

      const absenCount = nonHadirCount;
      const score = totalExpected > 0 ? Math.max(0, Math.min(100, Math.round((hadirCount / totalExpected) * 100))) : 100;

      return { score, totalKaryawan, hadirCount, totalExpected, absenCount, daysCount };
    }
  }, [karyawanList, absensiList, activeRange, filterMode]);

  // ==========================================
  // 5. KPI KEHADIRAN PEKERJA
  // ==========================================
  const kpiPekerjaData = React.useMemo(() => {
    const recordsInRange = absensiPekerjaList.filter(a => {
      const cleanDate = normalizeDateString(a.tanggal);
      return cleanDate && cleanDate >= activeRange.start && cleanDate <= activeRange.end;
    });
    const totalInput = recordsInRange.length;

    if (totalInput === 0) {
      return { score: 100, totalAbsen: 0, hadirCount: 0, absenCount: 0 };
    }

    const isHadir = (status: string) => (status || '').trim().toLowerCase() === 'hadir';

    const hadirCount = recordsInRange.filter(a => isHadir(a.statusKehadiran)).length;
    const absCount = recordsInRange.filter(a => !isHadir(a.statusKehadiran)).length;

    // Hitung persentase: jika ada 4 pekerja diinput (3 hadir, 1 alpa/izin), skor = (3 / 4) * 100 = 75%
    const score = Math.max(0, Math.min(100, Math.round((hadirCount / totalInput) * 100)));

    return { score, totalAbsen: totalInput, hadirCount, absenCount: absCount };
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

  // ==========================================
  // WHATSAPP RESOLVERS & HELPERS
  // ==========================================
  const formatWaNumber = React.useCallback((phone?: string) => {
    if (!phone) return '';
    const clean = phone.replace(/[^0-9]/g, '');
    if (!clean) return '';
    if (clean.startsWith('0')) return '62' + clean.slice(1);
    if (clean.startsWith('8')) return '62' + clean;
    if (clean.startsWith('62')) return clean;
    return '62' + clean;
  }, []);

  // Team contact helpers
  const logistikContact = React.useMemo(() => {
    const emp = karyawanList.find(k => (k.jabatan || '').toLowerCase().includes('logistik') && k.whatsup);
    if (emp) return { name: emp.namaKaryawan, wa: formatWaNumber(emp.whatsup) };
    return { name: 'Tim Logistik', wa: '6282264345250' };
  }, [karyawanList, formatWaNumber]);

  const pengawasContact = React.useMemo(() => {
    const emp = karyawanList.find(k => 
      ((k.jabatan || '').toLowerCase().includes('pengawas') || 
       (k.jabatan || '').toLowerCase().includes('teknis') || 
       (k.jabatan || '').toLowerCase().includes('lapangan')) && k.whatsup
    );
    if (emp) return { name: emp.namaKaryawan, wa: formatWaNumber(emp.whatsup) };
    return { name: 'Pengawas Lapangan', wa: '6282264345250' };
  }, [karyawanList, formatWaNumber]);

  const marketingContact = React.useMemo(() => {
    const emp = karyawanList.find(k => (k.jabatan || '').toLowerCase().includes('marketing') && k.whatsup);
    if (emp) return { name: emp.namaKaryawan, wa: formatWaNumber(emp.whatsup) };
    return { name: 'Tim Marketing', wa: '6282264345252' };
  }, [karyawanList, formatWaNumber]);

  // Absent employee info
  const absentEmployeeDetail = React.useMemo(() => {
    const recordsInRange = absensiList.filter(a => {
      const cleanDate = normalizeDateString(a.tanggal);
      return cleanDate && cleanDate >= activeRange.start && cleanDate <= activeRange.end && a.statusKehadiran !== 'Hadir';
    });
    if (recordsInRange.length === 0) return null;
    const firstAbs = recordsInRange[0];
    const emp = karyawanList.find(k => k.id === firstAbs.karyawanId);
    return {
      nama: emp?.namaKaryawan || 'Karyawan',
      jabatan: emp?.jabatan || 'Staff',
      status: firstAbs.statusKehadiran,
      wa: formatWaNumber(emp?.whatsup) || '6282264345251',
      totalAbsen: recordsInRange.length,
    };
  }, [absensiList, karyawanList, activeRange, formatWaNumber]);

  // Absent worker info (consecutive days check)
  const absentWorkerDetail = React.useMemo(() => {
    const recordsInRange = absensiPekerjaList.filter(a => {
      const cleanDate = normalizeDateString(a.tanggal);
      return cleanDate && cleanDate >= activeRange.start && cleanDate <= activeRange.end && a.statusKehadiran !== 'Hadir';
    });
    if (recordsInRange.length === 0) return null;
    
    // Group by worker name to count non-attendance
    const workerAbsCount: { [name: string]: number } = {};
    recordsInRange.forEach(r => {
      const name = r.namaTukang.trim();
      workerAbsCount[name] = (workerAbsCount[name] || 0) + 1;
    });

    const entries = Object.entries(workerAbsCount).sort((a, b) => b[1] - a[1]);
    const topWorker = entries[0];
    const days = topWorker ? topWorker[1] : 1;
    const workerName = topWorker ? topWorker[0] : (recordsInRange[0]?.namaTukang || 'Pekerja');

    return {
      nama: workerName,
      days: days >= 2 ? `${days} hari berturut-turut` : `${days} hari`,
      totalAbsen: recordsInRange.length,
    };
  }, [absensiPekerjaList, activeRange]);

  // Over RAB unit detail for link redirection
  const firstOverUnit = React.useMemo(() => {
    if (kpiPengawasanData.overUnitsList && kpiPengawasanData.overUnitsList.length > 0) {
      return kpiPengawasanData.overUnitsList[0].unit.id;
    }
    return '';
  }, [kpiPengawasanData]);

  // ==========================================
  // INSAIGHT AI NOTE STATE & 10:00 AM REFRESH
  // ==========================================
  interface InsAiGhtNotes {
    logistikNote: string | null;
    pengawasanNote: string | null;
    penjualanNote: string | null;
    karyawanNote: string | null;
    pekerjaNote: string | null;
    generatedAt: string; // ISO string
    evalDateKey: string;
  }

  const [aiNotes, setAiNotes] = React.useState<InsAiGhtNotes | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  // Fallback template builder following the user's exact specification
  const generateDeterministicTemplateNotes = React.useCallback((): InsAiGhtNotes => {
    let logistikNote: string | null = null;
    if (kpiLogistikData.score < 100 && kpiLogistikData.reorderList.length > 0) {
      const itemNames = kpiLogistikData.reorderList.slice(0, 3).map(i => i.namaMaterial.toLowerCase()).join(' dan ');
      logistikNote = `material ${itemNames} terdeteksi dengan status reorder, pastikan keterlambatan stok tidak menghambat progres pekerjaan bangunan, hubungi tim logistik sekarang`;
    }

    let pengawasanNote: string | null = null;
    if (kpiPengawasanData.score < 100 && kpiPengawasanData.overCount > 0) {
      const unitCount = kpiPengawasanData.overCount;
      const formattedLoss = (kpiPengawasanData.totalKerugianRp || 0).toLocaleString('id-ID');
      pengawasanNote = `${unitCount} blok rumah terdeteksi menggunakan material melebihi standar RAB. Total kerugian diperkirakan mencapai Rp ${formattedLoss}. Klik link dibawah untuk melihat rincian penggunaan material atau hubungi pengawas untuk konfirmasi`;
    }

    let penjualanNote: string | null = null;
    if (kpiPenjualanData.score < 100 && kpiPenjualanData.unbookedCount > 0) {
      const unbooked = kpiPenjualanData.unbookedCount;
      penjualanNote = `kami mendeteksi ${unbooked} rumah sudah selesai terbangun tapi belum memiliki user terdaftar (status belum terbooking). Evaluasi tim penjualan sekarang`;
    }

    let karyawanNote: string | null = null;
    if (kpiKaryawanData.score < 100 && absentEmployeeDetail) {
      karyawanNote = `satu karyawan yang terdaftar sebagai ${absentEmployeeDetail.jabatan.toLowerCase()} (${absentEmployeeDetail.nama}) tidak hadir dengan status ${absentEmployeeDetail.status.toLowerCase()}. Konfirmasi sekarang`;
    }

    let pekerjaNote: string | null = null;
    if (kpiPekerjaData.score < 100 && absentWorkerDetail) {
      pekerjaNote = `1 pekerja (${absentWorkerDetail.nama}) terkonfirmasi tidak hadir ${absentWorkerDetail.days}. Pastikan jadwal penyelesaian pekerjaan tidak terlambat, hubungi pengawas untuk konfirmasi pekerjaan`;
    }

    return {
      logistikNote,
      pengawasanNote,
      penjualanNote,
      karyawanNote,
      pekerjaNote,
      generatedAt: new Date().toISOString(),
      evalDateKey: activeRange.start,
    };
  }, [
    kpiLogistikData,
    kpiPengawasanData,
    kpiPenjualanData,
    kpiKaryawanData,
    kpiPekerjaData,
    absentEmployeeDetail,
    absentWorkerDetail,
    activeRange.start,
  ]);

  // Function to call server-side Gemini API or fallback
  const fetchAiInsights = React.useCallback(async (force = false) => {
    // If all scores are 100%, insAIght notes are default empty (null)
    const allPerfect = 
      kpiLogistikData.score >= 100 &&
      kpiPengawasanData.score >= 100 &&
      kpiPenjualanData.score >= 100 &&
      kpiKaryawanData.score >= 100 &&
      kpiPekerjaData.score >= 100;

    if (allPerfect) {
      setAiNotes({
        logistikNote: null,
        pengawasanNote: null,
        penjualanNote: null,
        karyawanNote: null,
        pekerjaNote: null,
        generatedAt: new Date().toISOString(),
        evalDateKey: activeRange.start,
      });
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    const payload = {
      filterLabel: activeRange.label,
      scores: {
        logistik: kpiLogistikData.score,
        pengawasan: kpiPengawasanData.score,
        penjualan: kpiPenjualanData.score,
        karyawan: kpiKaryawanData.score,
        pekerja: kpiPekerjaData.score,
      },
      logistik: {
        score: kpiLogistikData.score,
        reorderCount: kpiLogistikData.reorderCount,
        reorderItems: kpiLogistikData.reorderList.map(i => i.namaMaterial),
      },
      pengawasan: {
        score: kpiPengawasanData.score,
        overCount: kpiPengawasanData.overCount,
        overUnits: kpiPengawasanData.overUnitsList.map(u => ({
          blok: u.unit.id,
          projek: u.unit.projectName,
          overAmountRp: u.overAmountRp,
        })),
        totalKerugianRp: kpiPengawasanData.totalKerugianRp,
      },
      penjualan: {
        score: kpiPenjualanData.score,
        unbookedCount: kpiPenjualanData.unbookedCount,
        unbookedUnits: kpiPenjualanData.unbookedList.map(u => u.id),
      },
      karyawan: absentEmployeeDetail,
      pekerja: absentWorkerDetail,
    };

    try {
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && resData.insights) {
        const ins = resData.insights;
        const newNotes: InsAiGhtNotes = {
          logistikNote: kpiLogistikData.score < 100 ? (ins.logistikNote || generateDeterministicTemplateNotes().logistikNote) : null,
          pengawasanNote: kpiPengawasanData.score < 100 ? (ins.pengawasanNote || generateDeterministicTemplateNotes().pengawasanNote) : null,
          penjualanNote: kpiPenjualanData.score < 100 ? (ins.penjualanNote || generateDeterministicTemplateNotes().penjualanNote) : null,
          karyawanNote: kpiKaryawanData.score < 100 ? (ins.karyawanNote || generateDeterministicTemplateNotes().karyawanNote) : null,
          pekerjaNote: kpiPekerjaData.score < 100 ? (ins.pekerjaNote || generateDeterministicTemplateNotes().pekerjaNote) : null,
          generatedAt: new Date().toISOString(),
          evalDateKey: activeRange.start,
        };
        setAiNotes(newNotes);
        // Save to localStorage with date key
        try {
          const cacheKey = `insAIght_${activeRange.start}_${selectedProjectId}`;
          localStorage.setItem(cacheKey, JSON.stringify(newNotes));
        } catch (e) {
          // ignore
        }
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err: any) {
      console.warn('Using deterministic template for insAIght:', err?.message);
      const fallback = generateDeterministicTemplateNotes();
      setAiNotes(fallback);
      try {
        const cacheKey = `insAIght_${activeRange.start}_${selectedProjectId}`;
        localStorage.setItem(cacheKey, JSON.stringify(fallback));
      } catch (e) {}
    } finally {
      setIsAiLoading(false);
    }
  }, [
    kpiLogistikData,
    kpiPengawasanData,
    kpiPenjualanData,
    kpiKaryawanData,
    kpiPekerjaData,
    activeRange,
    selectedProjectId,
    absentEmployeeDetail,
    absentWorkerDetail,
    generateDeterministicTemplateNotes,
  ]);

  // Load from cache or check 10:00 AM daily refresh constraint
  React.useEffect(() => {
    const cacheKey = `insAIght_${activeRange.start}_${selectedProjectId}`;
    const cached = localStorage.getItem(cacheKey);
    const now = new Date();

    if (cached) {
      try {
        const parsed: InsAiGhtNotes = JSON.parse(cached);
        const genDate = new Date(parsed.generatedAt);
        
        // Calculate the most recent 10:00 AM cutoff
        const todayTenAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
        let cutoffTime = todayTenAM;
        if (now < todayTenAM) {
          // Before 10 AM today, the previous 10 AM was yesterday
          cutoffTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0, 0);
        }

        // If generated after the cutoffTime, reuse the daily snapshot!
        if (genDate >= cutoffTime) {
          setAiNotes(parsed);
          return;
        }
      } catch (e) {
        // invalid cache
      }
    }

    // Otherwise generate the insight
    fetchAiInsights();
  }, [activeRange.start, selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Has at least one active note below 100%
  const hasAnyActiveNote = aiNotes && (
    Boolean(aiNotes.logistikNote) ||
    Boolean(aiNotes.pengawasanNote) ||
    Boolean(aiNotes.penjualanNote) ||
    Boolean(aiNotes.karyawanNote) ||
    Boolean(aiNotes.pekerjaNote)
  );

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
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Quick shortcut buttons for Hari Ini & Kemarin (WITA) */}
              <div className="flex p-0.5 bg-slate-200/80 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEvalDate(todayStr)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    evalDate === todayStr
                      ? 'bg-white text-black font-black shadow-[1px_1px_4px_rgba(0,0,0,0.12)]'
                      : 'text-black/65 hover:text-black font-bold'
                  }`}
                  title="Filter Hari Ini (Zona Waktu WITA - Sulawesi Tenggara)"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setEvalDate(yesterdayStr)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    evalDate === yesterdayStr
                      ? 'bg-white text-black font-black shadow-[1px_1px_4px_rgba(0,0,0,0.12)]'
                      : 'text-black/65 hover:text-black font-bold'
                  }`}
                  title="Filter Kemarin (Zona Waktu WITA - Sulawesi Tenggara)"
                >
                  Kemarin
                </button>
              </div>

              {/* Datepicker input */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/80 rounded-xl text-xs">
                <Calendar size={14} className="text-black shrink-0" />
                <input
                  type="date"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="bg-transparent font-bold text-black outline-none cursor-pointer"
                />
              </div>

              {/* Sulawesi Tenggara WITA badge */}
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black text-sky-800 bg-sky-100/80 px-2 py-1 rounded-lg border border-sky-300">
                <Clock size={11} className="text-sky-700" /> WITA (Sulawesi Tenggara)
              </span>
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

      {/* ========================================================
          BAGIAN INSAIGHT (CATATAN DIBUAT OLEH AI)
          - Posisi: Paling Bawah Halaman Dashboard KPI
          - Update: 1 kali sehari jam 10:00 pagi
          - Default kosong, hanya terisi jika performa < 100%
          - Terbagi 5 bagian: Logistik, Pengawasan, Penjualan, Karyawan, Pekerja
          - Link WhatsApp & Link Navigasi Tersemat Langsung
          ======================================================== */}
      <div className="p-5 sm:p-7 bg-[#f8fafc] rounded-3xl border border-black/10 shadow-[8px_8px_20px_rgba(163,177,198,0.35),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-5">
        
        {/* Header insAIght */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles size={20} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-display font-black text-black tracking-tight flex items-center gap-1.5">
                  ins<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-600 font-black">AI</span>ght
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 text-black border border-slate-300">
                  AI Evaluasi Operasional
                </span>
              </div>
              <p className="text-xs text-black/70 font-bold mt-0.5">
                Catatan otomatis AI berdasarkan skor performa di bawah 100%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-black/70 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
              <Clock size={13} className="text-black shrink-0" />
              <span>Snapshot: {aiNotes ? new Date(aiNotes.generatedAt).toLocaleTimeString('id-ID', { timeZone: TIMEZONE_SULTRA, hour: '2-digit', minute: '2-digit' }) : '10:00'} WITA</span>
            </div>

            <button
              onClick={() => fetchAiInsights(true)}
              disabled={isAiLoading}
              title="Perbarui catatan sekarang"
              className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs text-black cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={`text-black ${isAiLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* State Display: Loading, All 100% Safe (Default Kosong), or Cards */}
        {isAiLoading && !aiNotes ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/70 shadow-xs">
            <Bot size={28} className="text-black mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-bold text-black">insAIght sedang menganalisis performa operasional...</p>
          </div>
        ) : !hasAnyActiveNote ? (
          /* Default Kosong jika semua performa 100% */
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-display font-black text-black text-sm">
              Semua Pilar Beroperasi 100% Optimal
            </h4>
            <p className="text-xs text-black/70 font-semibold max-w-md mx-auto">
              Tidak ada catatan evaluasi dari insAIght saat ini. Seluruh logistik, pengawasan konstruksi, penjualan, dan presensi berstatus aman dan memenuhi target.
            </p>
          </div>
        ) : (
          /* 5 Kategori Catatan insAIght - Tampilan Per Baris (1 Kolom Penuh) */
          <div className="flex flex-col space-y-4 w-full">
            
            {/* 1. LOGISTIK */}
            {aiNotes?.logistikNote && (
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[4px_4px_10px_rgba(163,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.9)] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-display font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                      <Warehouse size={15} className="text-cyan-600" />
                      1. Logistik
                    </span>
                    <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Skor {kpiLogistikData.score}%
                    </span>
                  </div>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    {aiNotes.logistikNote}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/${logistikContact.wa}?text=${encodeURIComponent('Halo Tim Logistik, mohon tindak lanjuti material reorder di SISPER agar progres pembangunan tetap lancar.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Phone size={13} />
                    <span>WhatsApp Tim Logistik</span>
                  </a>
                  <button
                    onClick={() => onNavigateTab('logistik', 'inventory')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <span>Cek Stok Gudang</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* 2. PENGAWASAN */}
            {aiNotes?.pengawasanNote && (
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[4px_4px_10px_rgba(163,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.9)] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-display font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                      <Building size={15} className="text-indigo-600" />
                      2. Pengawasan Konstruksi
                    </span>
                    <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Skor {kpiPengawasanData.score}%
                    </span>
                  </div>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    {aiNotes.pengawasanNote}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      onNavigateTab('logistik', {
                        subTab: 'rekap_unit',
                        selectedUnit: firstOverUnit || konstruksiList[0]?.id || '',
                        rekapViewMode: 'semua_unit',
                      });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <span>Lihat Rincian Rekap Material Per Unit</span>
                    <ExternalLink size={12} />
                  </button>
                  <a
                    href={`https://wa.me/${pengawasContact.wa}?text=${encodeURIComponent('Halo Pengawas Lapangan, terdeteksi penggunaan material melebihi standar RAB pada unit perumahan. Mohon konfirmasi.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Phone size={13} />
                    <span>WhatsApp Pengawas</span>
                  </a>
                </div>
              </div>
            )}

            {/* 3. PENJUALAN */}
            {aiNotes?.penjualanNote && (
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[4px_4px_10px_rgba(163,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.9)] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-display font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={15} className="text-emerald-600" />
                      3. Penjualan Unit
                    </span>
                    <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Skor {kpiPenjualanData.score}%
                    </span>
                  </div>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    {aiNotes.penjualanNote}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/${marketingContact.wa}?text=${encodeURIComponent('Halo Tim Marketing, terdapat unit rumah yang sudah selesai terbangun namun belum terbooking. Mohon evaluasi strategi penjualan.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Phone size={13} />
                    <span>WhatsApp Tim Marketing</span>
                  </a>
                  <button
                    onClick={() => onNavigateTab('marketing', 'leads')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <span>Pipeline Lead Penjualan</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* 4. KARYAWAN */}
            {aiNotes?.karyawanNote && (
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[4px_4px_10px_rgba(163,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.9)] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-display font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={15} className="text-amber-600" />
                      4. Kehadiran Karyawan
                    </span>
                    <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Skor {kpiKaryawanData.score}%
                    </span>
                  </div>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    {aiNotes.karyawanNote}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {absentEmployeeDetail ? (
                    <a
                      href={`https://wa.me/${absentEmployeeDetail.wa}?text=${encodeURIComponent(`Halo ${absentEmployeeDetail.nama}, mengonfirmasi ketidakhadiran Anda hari ini (${absentEmployeeDetail.status}). Semoga lekas sehat/kembali beraktivitas.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Phone size={13} />
                      <span>WhatsApp {absentEmployeeDetail.nama}</span>
                    </a>
                  ) : null}
                  <button
                    onClick={() => onNavigateTab('operasional', 'absensi')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <span>Tabel Presensi Karyawan</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* 5. PEKERJA */}
            {aiNotes?.pekerjaNote && (
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[4px_4px_10px_rgba(163,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.9)] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-display font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                      <HardHat size={15} className="text-rose-600" />
                      5. Kehadiran Pekerja / Tukang
                    </span>
                    <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Skor {kpiPekerjaData.score}%
                    </span>
                  </div>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    {aiNotes.pekerjaNote}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/${pengawasContact.wa}?text=${encodeURIComponent(`Halo Pengawas Lapangan, terkonfirmasi ada pekerja (${absentWorkerDetail?.nama || 'tukang'}) yang tidak hadir. Mohon pastikan progres pekerjaan di lapangan tetap sesuai jadwal.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Phone size={13} />
                    <span>WhatsApp Pengawas Lapangan</span>
                  </a>
                  <button
                    onClick={() => onNavigateTab('operasional', 'absensi_pekerja')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <span>Presensi Pekerja Lapangan</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

