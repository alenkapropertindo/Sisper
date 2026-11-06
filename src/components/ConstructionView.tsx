import React from 'react';
import { 
  Wrench, 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  Sliders, 
  PlusCircle, 
  Maximize2, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  Activity,
  Receipt,
  CreditCard,
  Building2,
  Trash2
} from 'lucide-react';
import { Project, Konstruksi, ProgresPekerjaan, TransaksiMaterial, Inventory, RincianPembayaran, Pekerja, RabTemplate } from '../types';
import { UserSession } from './LoginView';
import { getWitaToday } from '../utils/timezone';

interface ConstructionViewProps {
  projects?: Project[];
  konstruksiList: Konstruksi[];
  progresList: ProgresPekerjaan[];
  transaksiList?: TransaksiMaterial[];
  inventoryList?: Inventory[];
  pembayaranList: RincianPembayaran[];
  selectedProjectId: string;
  onAddKonstruksi: () => void;
  onAddProgres: () => void;
  onAddPembayaran: () => void;
  onAddProject?: () => void;
  onDeleteProject?: (id: string) => void;
  onUpdateProjectRab?: (projectId: string, rabId: string) => void;
  onSelectProject?: (id: string) => void;
  onUpdateProgres?: (id: string, newProgress: number, namaTukang?: string, noHp?: string) => void;
  onUpdateKonstruksiStatus?: (id: string, newStatus: Konstruksi['statusPembangunan'], tanggalSelesaiValue?: string | null) => void;
  onUpdateKonstruksiSaleStatus?: (id: string, newStatus: Konstruksi['statusPenjualan']) => void;
  initialSubTab?: 'projek' | 'blok' | 'progres' | 'opname' | 'rincian';
  initialSearchQuery?: string;
  initialStatusFilter?: string;
  pekerjaList?: Pekerja[];
  rabTemplateList?: RabTemplate[];
  currentUser?: UserSession | null;
}

export default function ConstructionView({
  projects = [],
  konstruksiList,
  progresList,
  transaksiList = [],
  inventoryList = [],
  pembayaranList = [],
  selectedProjectId,
  onAddKonstruksi,
  onAddProgres,
  onAddPembayaran,
  onAddProject,
  onDeleteProject,
  onUpdateProjectRab,
  onSelectProject,
  onUpdateProgres,
  onUpdateKonstruksiStatus,
  onUpdateKonstruksiSaleStatus,
  initialSubTab = 'blok',
  initialSearchQuery = '',
  initialStatusFilter = 'all',
  pekerjaList = [],
  rabTemplateList = [],
  currentUser = null,
}: ConstructionViewProps) {
  const [subTab, setSubTab] = React.useState<'projek' | 'blok' | 'progres' | 'opname' | 'rincian'>(initialSubTab);
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = React.useState(initialStatusFilter);
  const [deleteProjectConfirm, setDeleteProjectConfirm] = React.useState<Project | null>(null);

  // Filtered projects
  const filteredProjects = React.useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (p.name || '').toLowerCase().includes(q) ||
             (p.location || '').toLowerCase().includes(q) ||
             (p.id || '').toLowerCase().includes(q);
    });
  }, [projects, searchQuery]);

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

  React.useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  React.useEffect(() => {
    if (currentUser?.role === 'admin_umum' && subTab === 'progres') {
      setSubTab('blok');
    }
  }, [currentUser, subTab]);

  const [progresBlokFilter, setProgresBlokFilter] = React.useState('all');
  const [progresKategoriFilter, setProgresKategoriFilter] = React.useState('all');
  const [opnameKategoriFilter, setOpnameKategoriFilter] = React.useState('all');
  const [pembayaranDateFilter, setPembayaranDateFilter] = React.useState('');
  const [editingProgresId, setEditingProgresId] = React.useState<string | null>(null);
  const [confirmModalData, setConfirmModalData] = React.useState<{
    blockId: string;
    projectName: string;
  } | null>(null);

  // Helper: Format rupiah currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper: Calculate total costs for a block (material + labor)
  const getBiayaBangunForBlock = (blockId: string) => {
    const blockTransactions = transaksiList.filter(
      (t) => t.blokRumah === blockId && t.type === 'keluar'
    );
    const totalMaterialCost = blockTransactions.reduce((sum, t) => {
      const match = inventoryList.find((inv) => inv.namaMaterial === t.namaMaterial);
      const price = match ? match.harga : 0;
      return sum + (t.jumlah * price);
    }, 0);

    const blockProgres = progresList.filter((p) => p.blokRumah === blockId);
    const totalLaborCost = blockProgres.reduce((sum, p) => sum + p.totalNilaiPekerjaan, 0);

    return {
      materialCost: totalMaterialCost,
      laborCost: totalLaborCost,
      totalCost: totalMaterialCost + totalLaborCost
    };
  };

  // Helper logic to calculate average progress percentage of a block ID
  const getAverageBlockProgress = React.useCallback((blockId: string) => {
    const blockProgs = progresList.filter((p) => p.blokRumah === blockId);
    if (blockProgs.length === 0) return 0;
    const sum = blockProgs.reduce((acc, curr) => acc + curr.persentasiProgres, 0);
    return Math.round(sum / blockProgs.length);
  }, [progresList]);

  // Unique block options dynamically computed from progresList
  const uniqueBlokOptions = React.useMemo(() => {
    const bloks = progresList.map((p) => p.blokRumah);
    return Array.from(new Set(bloks)).sort();
  }, [progresList]);

  // Unique categories dynamically computed from progresList
  const uniqueKategoriOptions = React.useMemo(() => {
    const kats = progresList.map((p) => p.kategoriPekerjaan);
    return Array.from(new Set(kats)).sort();
  }, [progresList]);

  // Filters
  const filteredBloks = React.useMemo(() => {
    return konstruksiList.filter((k) => {
      const matchProject = selectedProjectId === 'all' || k.projectId === selectedProjectId;
      const matchSearch = k.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        k.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'readyStock') {
          matchStatus = k.statusPenjualan === 'tersedia' && k.statusPembangunan === 'terbangun';
        } else if (statusFilter === 'backlog') {
          matchStatus = k.statusPenjualan === 'terbooking' && k.statusPembangunan === 'onProgres';
        } else {
          matchStatus = k.statusPembangunan === statusFilter || k.statusPenjualan === statusFilter;
        }
      }
      return matchProject && matchSearch && matchStatus;
    });
  }, [konstruksiList, selectedProjectId, searchQuery, statusFilter]);

  const filteredProgres = React.useMemo(() => {
    return progresList.filter((p) => {
      // Find associated project of the block ID
      const associatedBlock = konstruksiList.find(k => k.id === p.blokRumah);
      const matchProject = selectedProjectId === 'all' || (associatedBlock && associatedBlock.projectId === selectedProjectId);
      const matchSearch = p.blokRumah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.namaTukang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.itemPekerjaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kategoriPekerjaan.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchBlok = progresBlokFilter === 'all' || p.blokRumah === progresBlokFilter;
      const matchKategori = progresKategoriFilter === 'all' || p.kategoriPekerjaan.toLowerCase() === progresKategoriFilter.toLowerCase();
      
      return matchProject && matchSearch && matchBlok && matchKategori;
    });
  }, [progresList, konstruksiList, selectedProjectId, searchQuery, progresBlokFilter, progresKategoriFilter]);

  // Helper: Resolve real Project ID, Project Name, and Tanggal Mulai from konstruksiList & projects database
  const resolveBlockProjectInfo = React.useCallback((blokId?: string) => {
    const cleanBlok = String(blokId || '').trim();
    const matchedBlock = konstruksiList.find(
      (k) => String(k.id).trim().toLowerCase() === cleanBlok.toLowerCase()
    );
    if (matchedBlock) {
      const matchedProject = projects.find(
        (p) => String(p.id).trim().toLowerCase() === String(matchedBlock.projectId).trim().toLowerCase()
      );
      return {
        blokId: matchedBlock.id,
        projectId: matchedBlock.projectId || '',
        projectName: matchedBlock.projectName || matchedProject?.name || '-',
        tanggalMulai: matchedBlock.tanggalMulaiBangun || '-',
      };
    }
    return {
      blokId: cleanBlok || '-',
      projectId: '',
      projectName: projects[0]?.name || '-',
      tanggalMulai: '-',
    };
  }, [konstruksiList, projects]);

  // Dynamic Opname Tukang Engine
  const opnameTukangList = React.useMemo(() => {
    // Group tasks on ProgresPekerjaan by Tukang name + category + blokRumah so each block & project matches the database accurately
    const tukangGroups: { [key: string]: {
      id: string;
      namaTukang: string;
      noHp: string;
      kategoriPekerjaan: string;
      blokId: string;
      projectId: string;
      projectName: string;
      totalValue: number;
      tanggalMulai: string;
    }} = {};

    progresList.forEach((prog, index) => {
      const cleanTukang = (prog.namaTukang || '').trim();
      const cleanKategori = (prog.kategoriPekerjaan || '').trim();
      const cleanBlok = (prog.blokRumah || '').trim();
      const key = `${cleanTukang.toLowerCase()}::${cleanKategori.toLowerCase()}::${cleanBlok.toLowerCase()}`;
      if (!tukangGroups[key]) {
        const blockInfo = resolveBlockProjectInfo(cleanBlok);
        tukangGroups[key] = {
          id: `opn-${index + 1}`,
          namaTukang: cleanTukang,
          noHp: prog.noHp || '',
          kategoriPekerjaan: cleanKategori,
          blokId: blockInfo.blokId,
          projectId: blockInfo.projectId,
          projectName: blockInfo.projectName,
          totalValue: 0,
          tanggalMulai: blockInfo.tanggalMulai
        };
      }
      tukangGroups[key].totalValue += Number(prog.totalNilaiPekerjaan) || 0;
    });

    const groupsList = Object.values(tukangGroups);

    // 2. Hitung total pool pembayaran per (Pekerja + Kategori)
    const paymentPools: { [key: string]: number } = {};
    (pembayaranList || []).forEach((p) => {
      const cleanWorker = (p.namaTukang || '').trim().toLowerCase();
      const cleanCat = (p.kategoriPekerjaan || '').trim().toLowerCase();
      const wKey = `${cleanWorker}::${cleanCat}`;
      paymentPools[wKey] = (paymentPools[wKey] || 0) + (Number(p.nilaiPembayaran) || 0);
    });

    // Salinan pool pembayaran untuk dialokasikan secara estafet / berurutan (Waterfall FIFO)
    const remainingPools: { [key: string]: number } = { ...paymentPools };

    // Catat indeks baris terakhir untuk setiap pekerja+kategori agar sisa overpayment (jika ada) tetap tercatat
    const lastRowIndexByWorker: { [key: string]: number } = {};
    groupsList.forEach((g, idx) => {
      const wKey = `${g.namaTukang.toLowerCase()}::${g.kategoriPekerjaan.toLowerCase()}`;
      lastRowIndexByWorker[wKey] = idx;
    });

    return groupsList.map((g, idx) => {
      const wKey = `${g.namaTukang.toLowerCase()}::${g.kategoriPekerjaan.toLowerCase()}`;
      let pool = remainingPools[wKey] || 0;
      const isLastRow = lastRowIndexByWorker[wKey] === idx;

      let allocatedPayment = 0;
      if (g.totalValue > 0) {
        // Lunasi unit ini sampai maksimal 100% nilai progresnya
        allocatedPayment = Math.min(g.totalValue, pool);
        pool -= allocatedPayment;
        remainingPools[wKey] = pool;
      }

      // Jika baris terakhir pekerja ini dan masih ada sisa pool pembayaran (misal overpayment),
      // tampung pada baris ini agar total nilai pembayaran tetap utuh
      if (isLastRow && remainingPools[wKey] > 0) {
        allocatedPayment += remainingPools[wKey];
        remainingPools[wKey] = 0;
      }

      const unpaid = Math.max(0, g.totalValue - allocatedPayment);
      const paidPct = g.totalValue > 0 ? Math.round((allocatedPayment / g.totalValue) * 100) : 0;

      // Find the matched worker from pekerjaList to get their latest phone/whatsapp info
      const matchedPekerja = (pekerjaList || []).find(
        (p) => p.namaTukang.trim().toLowerCase() === g.namaTukang.trim().toLowerCase()
      );
      const activeNoHp = matchedPekerja?.noHp || g.noHp;

      return {
        id: g.id,
        projectId: g.projectId,
        projectName: g.projectName,
        blokId: g.blokId,
        namaTukang: g.namaTukang,
        noHp: activeNoHp,
        kategoriPekerjaan: g.kategoriPekerjaan,
        nilaiTotal: g.totalValue,
        nilaiTerbayar: allocatedPayment,
        nilaiBelumTerbayar: unpaid,
        persenTerbayar: paidPct,
        tanggalMulaiPekerjaan: g.tanggalMulai
      };
    });
  }, [progresList, pembayaranList, pekerjaList, resolveBlockProjectInfo]);

  // Filters based on search
  const filteredOpname = React.useMemo(() => {
    return opnameTukangList.filter(o => {
      const matchProject = selectedProjectId === 'all' || o.projectId === selectedProjectId;
      const matchSearch = o.namaTukang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.kategoriPekerjaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.blokId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKategori = opnameKategoriFilter === 'all' || o.kategoriPekerjaan.toLowerCase() === opnameKategoriFilter.toLowerCase();
      return matchProject && matchSearch && matchKategori;
    });
  }, [opnameTukangList, searchQuery, selectedProjectId, opnameKategoriFilter]);

  // Perhitungan Akumulasi Total Biaya Opname Pekerja (Menyesuaikan filter pencarian/kategori yang aktif)
  const opnameTotals = React.useMemo(() => {
    const totalNilai = filteredOpname.reduce((sum, o) => sum + (Number(o.nilaiTotal) || 0), 0);
    const totalTerbayar = filteredOpname.reduce((sum, o) => sum + (Number(o.nilaiTerbayar) || 0), 0);
    const totalBelumTerbayar = filteredOpname.reduce((sum, o) => sum + (Number(o.nilaiBelumTerbayar) || 0), 0);
    const persenTerbayar = totalNilai > 0 ? Math.round((totalTerbayar / totalNilai) * 100) : 0;
    const totalBaris = filteredOpname.length;

    return {
      totalNilai,
      totalTerbayar,
      totalBelumTerbayar,
      persenTerbayar,
      totalBaris,
    };
  }, [filteredOpname]);

  const rincianMetrics = React.useMemo(() => {
    if (!pembayaranList || pembayaranList.length === 0) {
      return { tanggalTerakhir: '-', totalTerakhir: 0 };
    }
    
    const activePayments = (pembayaranList || []).filter(p => {
      const associatedBlock = konstruksiList.find(k => k.id === p.namaBlok);
      return selectedProjectId === 'all' || (associatedBlock && associatedBlock.projectId === selectedProjectId);
    });

    if (activePayments.length === 0) {
      return { tanggalTerakhir: '-', totalTerakhir: 0 };
    }

    const sortedPayments = [...activePayments].sort((a, b) => {
      return new Date(b.tanggalPembayaran).getTime() - new Date(a.tanggalPembayaran).getTime();
    });

    const tanggalTerakhir = sortedPayments[0].tanggalPembayaran;
    
    const totalTerakhir = activePayments
      .filter(p => p.tanggalPembayaran === tanggalTerakhir)
      .reduce((sum, p) => sum + p.nilaiPembayaran, 0);

    return {
      tanggalTerakhir,
      totalTerakhir
    };
  }, [pembayaranList, selectedProjectId, konstruksiList]);

  const filteredRincian = React.useMemo(() => {
    return (pembayaranList || []).filter(p => {
      const associatedBlock = konstruksiList.find(k => k.id === p.namaBlok);
      const matchProject = selectedProjectId === 'all' || (associatedBlock && associatedBlock.projectId === selectedProjectId);
      const matchSearch = p.namaTukang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kategoriPekerjaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.namaBlok || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchDate = !pembayaranDateFilter || p.tanggalPembayaran === pembayaranDateFilter;
      return matchProject && matchSearch && matchDate;
    });
  }, [pembayaranList, searchQuery, selectedProjectId, konstruksiList, pembayaranDateFilter]);

  return (
    <div className="space-y-6">
      {/* Sub tabs inside Construction */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white/55 backdrop-blur-md p-2 rounded-2xl border border-white/40">
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { 
              setSubTab('projek'); 
              setSearchQuery(''); 
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              subTab === 'projek'
                ? 'bg-white text-indigo-600 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 size={15} />
            Daftar Projek ({projects.length})
          </button>
          <button
            onClick={() => { 
              setSubTab('blok'); 
              setSearchQuery(''); 
              setStatusFilter('all');
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              subTab === 'blok'
                ? 'bg-white text-indigo-600 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders size={15} />
            Konstruksi (Blok)
          </button>
          {currentUser?.role !== 'admin_umum' && (
            <button
              onClick={() => { 
                setSubTab('progres'); 
                setSearchQuery(''); 
                setProgresBlokFilter('all');
                setProgresKategoriFilter('all');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                subTab === 'progres'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Wrench size={15} />
              Progres Pekerja
            </button>
          )}
          <button
            onClick={() => { 
              setSubTab('opname'); 
              setSearchQuery(''); 
              setOpnameKategoriFilter('all');
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              subTab === 'opname'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity size={15} className="text-indigo-500" />
            Opname Pekerja
          </button>
          <button
            onClick={() => { 
              setSubTab('rincian'); 
              setSearchQuery(''); 
              setPembayaranDateFilter('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              subTab === 'rincian'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt size={15} className="text-emerald-500" />
            Rincian Pembayaran
          </button>
        </div>

        {/* Dynamic add / action button */}
        <div className="shrink-0 flex items-center">
          {subTab === 'projek' && onAddProject && (
            <button
              onClick={onAddProject}
              className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer"
            >
              <PlusCircle size={16} />
              Tambah Projek Baru
            </button>
          )}
          {subTab === 'blok' && (
            <div className="flex items-center gap-2 w-full xl:w-auto">
              {onAddProject && (
                <button
                  onClick={onAddProject}
                  className="flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl shadow-sm cursor-pointer"
                  title="Tambah Projek Baru"
                >
                  <Building2 size={15} className="text-slate-600" />
                  <span>+ Projek Baru</span>
                </button>
              )}
              <button
                onClick={onAddKonstruksi}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer"
              >
                <PlusCircle size={16} />
                Tambah Unit Blok
              </button>
            </div>
          )}
          {subTab === 'progres' && (
            <button
              onClick={onAddProgres}
              className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer"
            >
              <PlusCircle size={16} />
              Input Progres Kerja
            </button>
          )}
          {subTab === 'opname' && (
            <button
              onClick={onAddPembayaran}
              className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer"
            >
              <PlusCircle size={15} />
              Tambah Opname Baru
            </button>
          )}
          {subTab === 'rincian' && (
            <button
              onClick={onAddPembayaran}
              className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer"
            >
              <PlusCircle size={15} />
              Catat Pembayaran
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={
              subTab === 'projek' ? 'Cari nama projek perumahan, lokasi, atau ID...' :
              subTab === 'blok' ? 'Cari Nomor Blok, tipe rumah, atau projek...' : 
              subTab === 'progres' ? 'Cari id blok, nama pekerja, atau deskripsi item...' :
              subTab === 'opname' ? 'Cari pekerja, kategori pekerjaan, atau nama blok...' :
              'Cari pekerja atau kategori rincian...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm rounded-xl pl-10 pr-4 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-black"
          />
        </div>

        {subTab === 'blok' && (
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm rounded-xl px-3 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="onProgres">Konstruksi: On Progres</option>
              <option value="terbangun">Konstruksi: Terbangun</option>
              <option value="tersedia">Penjualan: Tersedia</option>
              <option value="terbooking">Penjualan: Terbooking</option>
              <option value="terjual">Penjualan: Terjual</option>
              <option value="readyStock">Ready Stock (Tersedia & Terbangun)</option>
              <option value="backlog">Backlog (Terbooking & On Progres)</option>
            </select>
          </div>
        )}

        {subTab === 'progres' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={progresBlokFilter}
                onChange={(e) => setProgresBlokFilter(e.target.value)}
                className="text-sm rounded-xl px-3 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-medium"
              >
                <option value="all">Semua Blok Rumah</option>
                {uniqueBlokOptions.map((blok) => (
                  <option key={blok} value={blok}>{blok}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-slate-400" />
              <select
                value={progresKategoriFilter}
                onChange={(e) => setProgresKategoriFilter(e.target.value)}
                className="text-sm rounded-xl px-3 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-medium capitalize"
              >
                <option value="all">Semua Kategori</option>
                {uniqueKategoriOptions.map((kat) => (
                  <option key={kat} value={kat} className="capitalize">{kat}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {subTab === 'opname' && (
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-slate-400" />
            <select
              value={opnameKategoriFilter}
              onChange={(e) => setOpnameKategoriFilter(e.target.value)}
              className="text-sm rounded-xl px-3 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-medium capitalize"
            >
              <option value="all">Semua Kategori</option>
              {uniqueKategoriOptions.map((kat) => (
                <option key={kat} value={kat} className="capitalize">{kat}</option>
              ))}
            </select>
          </div>
        )}

        {subTab === 'rincian' && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={pembayaranDateFilter}
              onChange={(e) => setPembayaranDateFilter(e.target.value)}
              className="text-sm rounded-xl px-3.5 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-semibold cursor-pointer"
            />
            {pembayaranDateFilter && (
              <button
                onClick={() => setPembayaranDateFilter('')}
                className="text-xs font-black text-black hover:text-black px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white/70 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Render subtab: PROJEK PERUMAHAN */}
      {subTab === 'projek' && (
        <div className="space-y-5">
          {/* Metric Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Projek</span>
              <div className="text-2xl font-black text-black mt-1">
                {projects.length} <span className="text-xs font-semibold text-slate-500">Lokasi</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Unit Terdata</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {konstruksiList.length} <span className="text-xs font-semibold text-slate-500">Unit</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit Terbangun</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {konstruksiList.filter(k => k.statusPembangunan === 'terbangun').length} <span className="text-xs font-semibold text-slate-500">Unit</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit On Progres</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {konstruksiList.filter(k => k.statusPembangunan === 'onProgres').length} <span className="text-xs font-semibold text-slate-500">Unit</span>
              </div>
            </div>
          </div>

          {/* Project Cards Grid */}
          {filteredProjects.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                <Building2 size={32} />
              </div>
              <div>
                <h4 className="text-base font-black text-black">
                  {searchQuery ? 'Tidak Ada Projek yang Sesuai' : 'Belum Ada Data Projek Perumahan'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {searchQuery 
                    ? `Tidak ditemukan projek dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain.`
                    : 'Daftarkan nama projek perumahan pertama Anda untuk mengelompokkan unit kapling, pengawasan konstruksi, dan template RAB standar.'}
                </p>
              </div>
              {onAddProject && (
                <button
                  onClick={onAddProject}
                  className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
                >
                  <PlusCircle size={16} />
                  + Tambah Projek Baru Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((p) => {
                const units = konstruksiList.filter(k => String(k.projectId).trim().toLowerCase() === String(p.id).trim().toLowerCase());
                const terbangun = units.filter(k => k.statusPembangunan === 'terbangun').length;
                const onProgres = units.filter(k => k.statusPembangunan === 'onProgres').length;
                const tersedia = units.filter(k => k.statusPenjualan === 'tersedia').length;
                const terbooking = units.filter(k => k.statusPenjualan === 'terbooking').length;
                const terjual = units.filter(k => k.statusPenjualan === 'terjual').length;
                const linkedRab = rabTemplateList.find(r => r.id === p.rabId);

                return (
                  <div 
                    key={p.id}
                    className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Header card: ID badge & Title */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                            <Building2 size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-black text-black truncate">{p.name}</h4>
                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                              ID: {p.id}
                            </span>
                          </div>
                        </div>
                        {onDeleteProject && (
                          <button
                            onClick={() => setDeleteProjectConfirm(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Projek"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3.5">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{p.location || 'Lokasi belum diatur'}</span>
                      </div>

                      {/* Linked RAB Selector */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 mb-3.5">
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 flex items-center justify-between">
                          <span>Template RAB Acuan</span>
                          {linkedRab && <span className="text-indigo-600 font-bold">Terhubung</span>}
                        </div>
                        <select
                          value={p.rabId || ''}
                          onChange={(e) => onUpdateProjectRab && onUpdateProjectRab(p.id, e.target.value)}
                          className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                        >
                          <option value="">-- Belum Terhubung RAB --</option>
                          {rabTemplateList.map(r => (
                            <option key={r.id} value={r.id}>{r.namaRab}</option>
                          ))}
                        </select>
                      </div>

                      {/* Units stats breakdown */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-semibold">Total Unit Kapling:</span>
                          <span className="font-black text-black">{units.length} Unit</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100/60">
                            Terbangun: <strong>{terbangun}</strong>
                          </div>
                          <div className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100/60">
                            On Progres: <strong>{onProgres}</strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                          <span>Tersedia: <strong>{tersedia}</strong></span>
                          <span>•</span>
                          <span>Terbooking: <strong>{terbooking}</strong></span>
                          <span>•</span>
                          <span>Terjual: <strong>{terjual}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSubTab('blok');
                          if (onSelectProject) onSelectProject(p.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        <Sliders size={13} />
                        <span>Lihat Unit Blok</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Render tables or grids */}
      {subTab === 'blok' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-display font-medium text-[11px] uppercase tracking-wider">
                <th className="p-4">Blok</th>
                <th className="p-4">Spesifikasi Unit</th>
                <th className="p-4">Konstruksi & Status Penjualan</th>
                <th className="p-4">Penyelesaian Rata-rata</th>
                <th className="p-4 text-right">Biaya Bangun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 font-sans text-slate-700">
              {filteredBloks.map((k) => {
                const avgProgVal = getAverageBlockProgress(k.id);
                const costs = getBiayaBangunForBlock(k.id);
                return (
                  <tr key={k.id} className="hover:bg-white/45 transition">
                    <td className="p-4">
                      <div className="font-display font-bold text-indigo-600 text-base">{k.id}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{k.projectName}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{k.type}</div>
                      <div className="text-[11px] text-slate-400">LT: {k.luasTanah} m² / LB: {k.luasBangunan} m²</div>
                    </td>
                    <td className="p-4 space-y-2">
                      <div>
                        {(() => {
                          const currentStatusVal = (k.statusPembangunan || '').toLowerCase().includes('terbangun') ? 'terbangun' : 'onProgres';
                          return (
                            <select
                              value={currentStatusVal}
                              onChange={(e) => {
                                const newStatus = e.target.value as Konstruksi['statusPembangunan'];
                                if (currentStatusVal === 'onProgres' && newStatus === 'terbangun') {
                                  setConfirmModalData({
                                    blockId: k.id,
                                    projectName: k.projectName
                                  });
                                } else if (newStatus === 'onProgres') {
                                  onUpdateKonstruksiStatus?.(k.id, 'onProgres', '');
                                } else {
                                  onUpdateKonstruksiStatus?.(k.id, newStatus);
                                }
                              }}
                              className={`text-[11px] font-extrabold uppercase px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm transition-all ${
                                currentStatusVal === 'terbangun'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              }`}
                            >
                              <option className="bg-white text-slate-800 font-sans" value="onProgres">ON PROGRES</option>
                              <option className="bg-white text-slate-800 font-sans" value="terbangun">TERBANGUN</option>
                            </select>
                          );
                        })()}
                      </div>
                      <div>
                        <select
                          value={k.statusPenjualan}
                          onChange={(e) => onUpdateKonstruksiSaleStatus?.(k.id, e.target.value as any)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm transition-all uppercase ${
                            k.statusPenjualan === 'tersedia'
                              ? 'bg-cyan-500/10 text-cyan-600 border-cyan-400/20'
                              : k.statusPenjualan === 'terbooking'
                              ? 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-400/20'
                              : 'bg-purple-500/10 text-purple-600 border-purple-400/20'
                          }`}
                        >
                          <option className="bg-white text-slate-800 font-sans" value="tersedia">TERSEDIA</option>
                          <option className="bg-white text-slate-800 font-sans" value="terbooking">TERBOOKING</option>
                          <option className="bg-white text-slate-800 font-sans" value="terjual">TERJUAL</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5 max-w-[120px]">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>{avgProgVal}%</span>
                        </div>
                        <div className="w-full bg-[#e0e5ec] h-2.5 rounded-full p-0.5 shadow-[inset_1px_1px_2px_rgba(163,177,198,0.5)] border border-slate-300/40">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              avgProgVal === 100 
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(52,211,153,0.55)]' 
                                : avgProgVal >= 70
                                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.55)]'
                                : avgProgVal >= 40
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(251,191,36,0.55)]'
                                : avgProgVal > 0
                                ? 'bg-gradient-to-r from-violet-400 to-indigo-500 shadow-[0_0_8px_rgba(167,139,250,0.55)]'
                                : 'bg-slate-300'
                            }`}
                            style={{ 
                              width: `${avgProgVal}%`,
                              ...(avgProgVal === 100 
                                ? { background: 'linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #059669 100%)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }
                                : avgProgVal >= 70
                                ? { background: 'linear-gradient(90deg, #06b6d4 0%, #38bdf8 50%, #2563eb 100%)', boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)' }
                                : avgProgVal >= 40
                                ? { background: 'linear-gradient(90deg, #fbbf24 0%, #fb923c 50%, #f59e0b 100%)', boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }
                                : avgProgVal > 0
                                ? { background: 'linear-gradient(90deg, #a855f7 0%, #c084fc 50%, #6366f1 100%)', boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)' }
                                : { background: '#cbd5e1' })
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 space-y-0.5">
                          <div>Mulai: {k.tanggalMulaiBangun}</div>
                          {k.tanggalSelesai ? (
                            <div className="text-emerald-600 font-bold">Selesai: {k.tanggalSelesai}</div>
                          ) : null}
                          {(() => {
                            if (!k.tanggalMulaiBangun) return null;
                            const start = new Date(k.tanggalMulaiBangun);
                            if (isNaN(start.getTime())) return null;
                            const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                            
                            let endMidnight: Date;
                            if (k.tanggalSelesai) {
                              const end = new Date(k.tanggalSelesai);
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
                            const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                            
                            return (
                              <div className="text-slate-600 font-semibold pt-0.5 border-t border-slate-100">
                                Waktu: {days} Hari {k.tanggalSelesai ? '(Selesai)' : '(Berjalan)'}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono">
                      <div className="font-bold text-slate-800 text-sm">
                        {formatRupiah(costs.totalCost)}
                      </div>
                      <div className="text-[10px] text-slate-400 space-y-0.5 mt-1">
                        <div className="flex justify-end gap-1">
                          <span>Mat:</span>
                          <span className="font-medium">{costs.materialCost > 0 ? formatRupiah(costs.materialCost) : '-'}</span>
                        </div>
                        <div className="flex justify-end gap-1">
                          <span>Pekerja:</span>
                          <span className="font-medium">{costs.laborCost > 0 ? formatRupiah(costs.laborCost) : '-'}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBloks.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada data unit konstruksi perumahan yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'progres' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-display font-medium text-[11px] uppercase tracking-wider">
                <th className="p-4">Rumah Blok</th>
                <th className="p-4">Pekerja & Kategori</th>
                <th className="p-4">Item Pekerjaan</th>
                <th className="p-4">Progres Bar</th>
                <th className="p-4 text-right">Total Realisasi Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 text-slate-700">
              {filteredProgres.map((p) => {
                const blockInfo = resolveBlockProjectInfo(p.blokRumah);
                const projectName = blockInfo.projectName;
                return (
                  <tr key={p.id} className="hover:bg-white/45 transition">
                    <td className="p-4">
                      <div className="font-display font-bold text-slate-800 text-base">{p.blokRumah}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{projectName}</div>
                    </td>
                    <td className="p-4">
                      {editingProgresId === p.id ? (
                        <div className="space-y-1 bg-slate-50 border border-slate-100 rounded-lg p-1.5 max-w-[150px]">
                          <input
                            type="text"
                            placeholder="Nama Pekerja"
                            value={p.namaTukang === 'Belum Ditunjuk' ? '' : p.namaTukang}
                            onChange={(e) => onUpdateProgres?.(p.id, p.persentasiProgres, e.target.value || 'Belum Ditunjuk', p.noHp)}
                            className="w-full text-xs font-bold rounded border border-slate-200 px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-display"
                          />
                          <input
                            type="text"
                            placeholder="WA: 0812..."
                            value={p.noHp === '-' ? '' : p.noHp || ''}
                            onChange={(e) => onUpdateProgres?.(p.id, p.persentasiProgres, p.namaTukang, e.target.value || '-')}
                            className="w-full text-[10px] rounded border border-slate-200 px-1.5 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-800">{p.namaTukang}</div>
                          {p.noHp && p.noHp !== '-' && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.noHp}</div>
                          )}
                        </>
                      )}
                      <div className="mt-1">
                        <span className={`inline-flex text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          p.kategoriPekerjaan === 'struktur' ? 'bg-amber-100 text-amber-700' :
                          p.kategoriPekerjaan === 'atap' ? 'bg-blue-100 text-blue-700' :
                          p.kategoriPekerjaan === 'plafon' ? 'bg-purple-100 text-purple-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {p.kategoriPekerjaan}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-medium text-slate-800 text-xs">{p.itemPekerjaan}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {formatRupiah(p.nilaiPekerjaan)}
                      </div>
                    </td>
                    <td className="p-4 min-w-[200px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-indigo-600 font-display text-sm whitespace-nowrap">{p.persentasiProgres}%</span>
                          {editingProgresId === p.id ? (
                            <button
                              onClick={() => setEditingProgresId(null)}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-bold uppercase rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
                              id={`save-prog-${p.id}`}
                            >
                              Simpan
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingProgresId(p.id)}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-black uppercase rounded bg-slate-100 border border-slate-200 text-black hover:bg-slate-200 hover:text-black transition-all cursor-pointer"
                              id={`edit-prog-${p.id}`}
                            >
                              Edit Progres
                            </button>
                          )}
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          disabled={editingProgresId !== p.id}
                          value={p.persentasiProgres}
                          onChange={(e) => onUpdateProgres?.(p.id, parseInt(e.target.value, 10))}
                          className={`w-full h-2 rounded-lg appearance-none focus:outline-none transition-all ${
                            editingProgresId === p.id 
                              ? 'cursor-ew-resize accent-indigo-600' 
                              : 'cursor-not-allowed opacity-60'
                          }`}
                          style={{
                            background: editingProgresId === p.id
                              ? `linear-gradient(to right, #06b6d4 0%, #3b82f6 ${p.persentasiProgres}%, #cbd5e1 ${p.persentasiProgres}%, #cbd5e1 100%)`
                              : p.persentasiProgres === 100
                              ? `linear-gradient(to right, #10b981 0%, #059669 ${p.persentasiProgres}%, #e2e8f0 ${p.persentasiProgres}%, #e2e8f0 100%)`
                              : p.persentasiProgres >= 70
                              ? `linear-gradient(to right, #06b6d4 0%, #3b82f6 ${p.persentasiProgres}%, #e2e8f0 ${p.persentasiProgres}%, #e2e8f0 100%)`
                              : p.persentasiProgres >= 40
                              ? `linear-gradient(to right, #f59e0b 0%, #f97316 ${p.persentasiProgres}%, #e2e8f0 ${p.persentasiProgres}%, #e2e8f0 100%)`
                              : `linear-gradient(to right, #8b5cf6 0%, #6366f1 ${p.persentasiProgres}%, #e2e8f0 ${p.persentasiProgres}%, #e2e8f0 100%)`
                          }}
                        />
                        {editingProgresId === p.id && (
                          <div className="text-[9px] text-indigo-500 font-bold animate-pulse">
                            ⚡ Geser untuk mengubah progres kerja
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-xs font-bold text-indigo-600">
                      {formatRupiah(p.totalNilaiPekerjaan)}
                      <div className="text-[10px] text-slate-400 font-normal">({p.persentasiProgres}%)</div>
                    </td>
                  </tr>
                );
              })}
              {filteredProgres.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Belum ada riwayat progres pekerjaan terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'opname' && (
        <div className="space-y-4">
          {/* Panel Ringkasan Total Biaya Opname (Dinamis Sesuai Filter) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white/75 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 p-1.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                <Receipt size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Biaya Progres ({opnameTotals.totalBaris} Baris)
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-slate-900 block leading-tight">
                  {formatRupiah(opnameTotals.totalNilai)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5 border-t sm:border-t-0 sm:border-l border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Progres Terbayar
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-mono font-black text-emerald-600 block leading-tight">
                    {formatRupiah(opnameTotals.totalTerbayar)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">({opnameTotals.persenTerbayar}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5 border-t sm:border-t-0 sm:border-l border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Sisa Belum Bayar
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-rose-600 block leading-tight">
                  {formatRupiah(opnameTotals.totalBelumTerbayar)}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-display font-bold">
                  <th className="p-4">Pekerja</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Blok & Projek</th>
                  <th className="p-4 text-right">Nilai Total Progres</th>
                  <th className="p-4 text-right">Nilai & Progres Terbayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                {/* BARIS TOTAL BIAYA (DI ATAS TABEL TEPAT SETELAH JUDUL KOLOM) */}
                <tr className="bg-gradient-to-r from-indigo-50/80 via-slate-50/90 to-emerald-50/80 border-b-2 border-indigo-200/80 font-sans shadow-xs">
                  <td colSpan={3} className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-black shadow-xs">
                        ∑
                      </span>
                      <div>
                        <div className="font-display font-black text-slate-900 text-xs sm:text-sm tracking-wide flex items-center gap-2">
                          <span>TOTAL BIAYA OPNAME</span>
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-md border border-indigo-200">
                            {opnameTotals.totalBaris} Baris Terhitung
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Akumulasi seluruh nilai baris terfilter
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-mono text-xs sm:text-sm font-black text-slate-900">
                      {formatRupiah(opnameTotals.totalNilai)}
                    </div>
                    {opnameTotals.totalBelumTerbayar > 0 && (
                      <div className="mt-1 bg-white/90 border border-rose-200/80 px-2 py-0.5 rounded-md inline-block text-right shadow-xs">
                        <span className="font-mono text-[11px] font-bold text-rose-600">
                          Sisa: {formatRupiah(opnameTotals.totalBelumTerbayar)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-mono text-xs sm:text-sm font-black text-emerald-600">
                      {formatRupiah(opnameTotals.totalTerbayar)}
                    </div>
                    <div className="flex flex-col items-end mt-1">
                      <span className="text-[10px] font-bold text-slate-600 mb-0.5">
                        {opnameTotals.persenTerbayar}% Terbayar
                      </span>
                      <div className="w-20 bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, opnameTotals.persenTerbayar)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>

                {filteredOpname.map((opn) => {
                  const isDebt = opn.nilaiBelumTerbayar > 0;
                  const phoneStr = opn.noHp != null ? String(opn.noHp) : '';
                  const cleanPhone = phoneStr.replace(/\D/g, '');
                  const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone.startsWith('8') ? '62' + cleanPhone : cleanPhone;

                return (
                  <tr key={opn.id} className="hover:bg-white/40 transition">
                    <td className="p-4">
                      <div className="font-display font-bold text-slate-900 text-[15px]">{opn.namaTukang}</div>
                      <div className="mt-1.5 flex items-center">
                        {opn.noHp ? (
                          <a 
                            href={`https://wa.me/${waPhone}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all font-sans font-extrabold hover:-translate-y-0.5 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008 0c3.202.001 6.212 1.249 8.477 3.517 2.266 2.268 3.51 5.28 3.51 8.487-.004 6.657-5.34 11.997-11.951 12.003-2.005 0-3.974-.504-5.729-1.465L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.8 1.45 5.378 0 9.75-4.37 9.754-9.753.002-2.605-1.013-5.053-2.86-6.901C16.48 2.103 14.032.93 11.427.93c-5.385 0-9.76 4.373-9.765 9.758-.002 1.8.48 3.55 1.4 5.1l-.94 3.4 3.5-.92c1.55.85 3.25 1.3 4.9 1.3z" />
                            </svg>
                            <span>{opn.noHp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-450 italic text-[11px] font-sans">No. HP tidak terdaftar</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="inline-flex text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                          {opn.kategoriPekerjaan}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Mulai: {opn.tanggalMulaiPekerjaan}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-700">Blok {opn.blokId}</div>
                      <div className="text-[10px] text-slate-400">{opn.projectName}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-xs text-slate-900 font-bold">{formatRupiah(opn.nilaiTotal)}</div>
                      <div className="flex flex-col items-end mt-1.5 bg-slate-50 border border-slate-100 p-1.5 rounded-lg max-w-[155px] ml-auto">
                        <span className={`font-mono text-[11px] font-extrabold ${isDebt ? 'text-rose-600' : 'text-slate-400'}`}>
                          {formatRupiah(opn.nilaiBelumTerbayar)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-xs text-emerald-600 font-bold">{formatRupiah(opn.nilaiTerbayar)}</div>
                      <div className="flex flex-col items-end mt-1.5">
                        <span className="text-[10px] font-bold text-slate-500 mb-0.5">{opn.persenTerbayar}% Terbayar</span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, opn.persenTerbayar)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOpname.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                    Tidak ada catatan opname aktif. Pastikan data "Progres Pekerjaan" telah diinput.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {subTab === 'rincian' && (
        <div className="space-y-4">
          {/* Metrics Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Pembayaran Terakhir */}
            <div className="p-4 rounded-xl border border-slate-100 bg-white/75 backdrop-blur-md flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-indigo-600/90 uppercase tracking-wider block">Tanggal Pembayaran Terakhir</span>
                <span className="font-mono text-xl font-bold text-slate-800 leading-none block mt-1.5">
                  {rincianMetrics.tanggalTerakhir}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Tanggal transaksi pengeluaran terbaru ke pekerja
                </span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar size={18} />
              </div>
            </div>

            {/* Total Pembayaran Terakhir */}
            <div className="p-4 rounded-xl border border-slate-100 bg-white/75 backdrop-blur-md flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-emerald-600/90 uppercase tracking-wider block">Total Pembayaran Terakhir</span>
                <span className="font-mono text-xl font-bold text-emerald-600 leading-none block mt-1.5">
                  {formatRupiah(rincianMetrics.totalTerakhir)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Jumlah total dana cair pada pembayaran terbaru ({rincianMetrics.tanggalTerakhir})
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CreditCard size={18} />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-display font-medium">
                  <th className="p-4">Nilai Pembayaran</th>
                  <th className="p-4">Pekerja & Kategori</th>
                  <th className="p-4">Blok & Projek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans text-xs">
                {filteredRincian.map((p) => (
                  <tr key={p.id} className="hover:bg-white/40 transition">
                    <td className="p-4">
                      <div className="font-mono font-bold text-emerald-600 text-sm">
                        {formatRupiah(p.nilaiPembayaran)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Tgl: {p.tanggalPembayaran}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-display font-semibold text-slate-950 text-sm">{p.namaTukang}</div>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-500">
                          {p.kategoriPekerjaan}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const resolved = resolveBlockProjectInfo(p.namaBlok);
                        return (
                          <>
                            <div className="font-semibold text-slate-700">Blok {p.namaBlok || resolved.blokId}</div>
                            <div className="text-[10px] text-slate-400">Projek: {p.namaProjek || resolved.projectName}</div>
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {filteredRincian.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada catatan pembayaran yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Penyelesaian Bangunan */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#e0e5ec] shadow-[12px_12px_24px_rgba(163,177,198,0.7),-12px_-12px_24px_rgba(255,255,255,0.9)] p-6 sm:p-7 rounded-3xl max-w-md w-full border border-white/60 space-y-5">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-3 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.85)]">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-[#2d3748]">Konfirmasi Bangunan Selesai</h3>
                <p className="text-xs text-slate-500">{confirmModalData.projectName}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah bangunan <strong className="text-indigo-600">Blok {confirmModalData.blockId}</strong> sudah selesai terbangun?
              <br />
              <span className="text-xs text-slate-500 mt-2 block p-2.5 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]">
                Tanggal selesai (<code className="font-mono text-emerald-600 font-bold">{getWitaToday()}</code>) akan dicatat secara otomatis ke kolom <strong>tanggalSelesai</strong> (WITA).
              </span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="px-5 py-2.5 rounded-2xl bg-[#e0e5ec] text-slate-600 text-xs font-bold shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.85)] hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const todayStr = getWitaToday();
                  onUpdateKonstruksiStatus?.(confirmModalData.blockId, 'terbangun', todayStr);
                  setConfirmModalData(null);
                }}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
              >
                Ya, Bangunan Selesai
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Projek */}
      {deleteProjectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#e0e5ec] shadow-[12px_12px_24px_rgba(163,177,198,0.7),-12px_-12px_24px_rgba(255,255,255,0.9)] p-6 sm:p-7 rounded-3xl max-w-md w-full border border-white/60 space-y-5">
            {(() => {
              const linkedUnits = konstruksiList.filter(
                (k) => String(k.projectId).trim().toLowerCase() === String(deleteProjectConfirm.id).trim().toLowerCase()
              );
              const hasUnits = linkedUnits.length > 0;

              return (
                <>
                  <div className="flex items-center gap-3 text-rose-600">
                    <div className="p-3 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.85)]">
                      <Trash2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-lg text-[#2d3748]">
                        {hasUnits ? 'Tidak Dapat Menghapus Projek' : 'Konfirmasi Hapus Projek'}
                      </h3>
                      <p className="text-xs text-slate-500">{deleteProjectConfirm.name}</p>
                    </div>
                  </div>

                  {hasUnits ? (
                    <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                      <p>
                        Projek <strong>{deleteProjectConfirm.name}</strong> masih memiliki{' '}
                        <strong className="text-rose-600">{linkedUnits.length} unit blok</strong> di data konstruksi.
                      </p>
                      <p className="text-xs text-slate-500 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                        Demi menjaga integritas database Google Sheets, projek tidak boleh dihapus selama masih ada unit blok yang terdaftar di dalamnya.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Apakah Anda yakin ingin menghapus data projek <strong>{deleteProjectConfirm.name}</strong> (ID: {deleteProjectConfirm.id}) dari database Google Sheets?
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteProjectConfirm(null)}
                      className="px-5 py-2.5 rounded-2xl bg-[#e0e5ec] text-slate-600 text-xs font-bold shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.85)] hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] transition-all cursor-pointer"
                    >
                      {hasUnits ? 'Mengerti' : 'Batal'}
                    </button>
                    {!hasUnits && onDeleteProject && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProject(deleteProjectConfirm.id);
                          setDeleteProjectConfirm(null);
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
                      >
                        Ya, Hapus Projek
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
