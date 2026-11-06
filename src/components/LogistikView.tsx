import React from 'react';
import { 
  Package, 
  Warehouse, 
  Truck, 
  ArrowUpDown, 
  Search, 
  PlusCircle, 
  AlertOctagon, 
  Tags, 
  MapPin, 
  Phone,
  TrendingUp,
  TrendingDown,
  Coins,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Trash2,
  Sliders,
  Calendar,
  Filter,
  X
} from 'lucide-react';
import { Inventory, Gudang, Supplier, TransaksiMaterial, Project, Konstruksi, RabTemplate, RabDetail } from '../types';
import { getWitaToday, getWitaYesterday, getWitaDateString, normalizeDateString } from '../utils/timezone';

interface LogistikViewProps {
  inventoryList: Inventory[];
  gudangList: Gudang[];
  supplierList: Supplier[];
  transaksiList: TransaksiMaterial[];
  konstruksiList: Konstruksi[];
  projects: Project[];
  rabTemplateList?: RabTemplate[];
  rabDetailList?: RabDetail[];
  onAddInventory: () => void;
  onAddGudang: () => void;
  onAddSupplier: () => void;
  onAddTransaksi: () => void;
  onAddRabTemplate?: () => void;
  onAddRabDetail?: (rabId?: string) => void;
  onUpdateProjectRab?: (projectId: string, rabId: string) => void;
  onDeleteRabDetail?: (id: string) => void;
  initialSubTab?: 'inventory' | 'gudang' | 'supplier' | 'transaksi' | 'rab' | 'rekap_unit';
  initialSelectedUnit?: string;
  initialRekapViewMode?: 'detail' | 'semua_unit';
}

export default function LogistikView({
  inventoryList,
  gudangList,
  supplierList,
  transaksiList,
  konstruksiList = [],
  projects = [],
  rabTemplateList = [],
  rabDetailList = [],
  onAddInventory,
  onAddGudang,
  onAddSupplier,
  onAddTransaksi,
  onAddRabTemplate,
  onAddRabDetail,
  onUpdateProjectRab,
  onDeleteRabDetail,
  initialSubTab,
  initialSelectedUnit,
  initialRekapViewMode,
}: LogistikViewProps) {
  // Helper to determine vibrant, eye-catching category badge styling with diverse colors
  const getCategoryBadgeStyle = (category: string) => {
    const cat = (category || '').toLowerCase().trim();
    
    if (cat.includes('semen') || cat.includes('beton') || cat.includes('paving')) {
      return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/50';
    }
    if (cat.includes('besi') || cat.includes('baja') || cat.includes('metal') || cat.includes('rebar') || cat.includes('paku') || cat.includes('logam')) {
      return 'bg-blue-50 text-blue-700 border-blue-200/50';
    }
    if (cat.includes('pasir') || cat.includes('batu') || cat.includes('kerikil') || cat.includes('tanah') || cat.includes('agregat')) {
      return 'bg-amber-100/70 text-amber-800 border-amber-200/50';
    }
    if (cat.includes('cat') || cat.includes('finishing') || cat.includes('coating') || cat.includes('kuas') || cat.includes('thinner')) {
      return 'bg-pink-50 text-pink-700 border-pink-200/50';
    }
    if (cat.includes('kayu') || cat.includes('bambu') || cat.includes('triplek') || cat.includes('papan')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
    }
    if (cat.includes('pipa') || cat.includes('pralon') || cat.includes('fitting')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200/50';
    }
    if (cat.includes('sanitary') || cat.includes('saniter') || cat.includes('kran') || cat.includes('wastafel') || cat.includes('toilet')) {
      return 'bg-teal-50 text-teal-700 border-teal-200/50';
    }
    if (cat.includes('listrik') || cat.includes('kabel') || cat.includes('saklar') || cat.includes('lampu')) {
      return 'bg-violet-50 text-violet-700 border-violet-200/50';
    }
    if (cat.includes('genteng') || cat.includes('atap') || cat.includes('asbes')) {
      return 'bg-rose-50 text-rose-700 border-rose-200/50';
    }
    if (cat.includes('keramik') || cat.includes('ubin') || cat.includes('granit')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
    }
    
    // Fallback cycle based on character values
    const colors = [
      'bg-sky-50 text-sky-700 border-sky-200/50',
      'bg-purple-50 text-purple-700 border-purple-200/50',
      'bg-teal-50 text-teal-700 border-teal-200/50',
      'bg-rose-50 text-rose-700 border-rose-200/50',
      'bg-amber-50 text-amber-700 border-amber-200/50'
    ];
    const hash = Array.from(cat).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const [subTab, setSubTab] = React.useState<'inventory' | 'gudang' | 'supplier' | 'transaksi' | 'rab' | 'rekap_unit'>(() => initialSubTab || 'transaksi');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [metricsTimeframe, setMetricsTimeframe] = React.useState<'hari' | 'minggu' | 'bulan'>('hari');
  const [stockStatusFilter, setStockStatusFilter] = React.useState<string>('all');
  const [transaksiTypeFilter, setTransaksiTypeFilter] = React.useState<'all' | 'masuk' | 'keluar'>('all');
  const [transaksiTimePreset, setTransaksiTimePreset] = React.useState<'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'custom'>('all');
  const [transaksiDateFilter, setTransaksiDateFilter] = React.useState<string>('');
  const [selectedRabId, setSelectedRabId] = React.useState<string>(() => rabTemplateList[0]?.id || '');
  const [selectedBlokUnit, setSelectedBlokUnit] = React.useState<string>(() => initialSelectedUnit || konstruksiList[0]?.id || '');
  const [rekapViewMode, setRekapViewMode] = React.useState<'detail' | 'semua_unit'>(() => initialRekapViewMode || 'detail');

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  React.useEffect(() => {
    if (initialSelectedUnit) {
      setSelectedBlokUnit(initialSelectedUnit);
    }
  }, [initialSelectedUnit]);

  React.useEffect(() => {
    if (initialRekapViewMode) {
      setRekapViewMode(initialRekapViewMode);
    }
  }, [initialRekapViewMode]);

  React.useEffect(() => {
    if (!selectedRabId && rabTemplateList.length > 0) {
      setSelectedRabId(rabTemplateList[0].id);
    }
  }, [rabTemplateList, selectedRabId]);

  React.useEffect(() => {
    if (!selectedBlokUnit && konstruksiList.length > 0) {
      setSelectedBlokUnit(konstruksiList[0].id);
    }
  }, [konstruksiList, selectedBlokUnit]);

  // Filter Dinamis Transaksi Material berdasarkan Teks, Tipe Transaksi, dan Waktu/Tanggal
  const filteredTransaksi = React.useMemo(() => {
    const todayStr = getWitaToday();
    const yesterdayStr = getWitaYesterday();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStr = getWitaDateString(sevenDaysAgo);
    const currentMonthPrefix = todayStr.slice(0, 7);

    return transaksiList.filter(t => {
      // 1. Pencarian teks
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (t.namaMaterial || '').toLowerCase().includes(q) ||
        (t.namaGudang || '').toLowerCase().includes(q) ||
        (t.blokRumah || '').toLowerCase().includes(q) ||
        (t.supplier || '').toLowerCase().includes(q) ||
        (t.catatan || '').toLowerCase().includes(q);

      // 2. Filter Tipe Transaksi ('all' | 'masuk' | 'keluar')
      const matchType = transaksiTypeFilter === 'all' || t.type === transaksiTypeFilter;

      // 3. Filter Waktu / Tanggal Transaksi
      const normDate = normalizeDateString(t.tanggal);
      let matchDate = true;

      if (transaksiDateFilter) {
        matchDate = normDate === transaksiDateFilter;
      } else if (transaksiTimePreset === 'today') {
        matchDate = normDate === todayStr;
      } else if (transaksiTimePreset === 'yesterday') {
        matchDate = normDate === yesterdayStr;
      } else if (transaksiTimePreset === 'last7') {
        matchDate = normDate >= sevenDaysAgoStr && normDate <= todayStr;
      } else if (transaksiTimePreset === 'thisMonth') {
        matchDate = normDate.startsWith(currentMonthPrefix);
      }

      return matchSearch && matchType && matchDate;
    });
  }, [transaksiList, searchQuery, transaksiTypeFilter, transaksiTimePreset, transaksiDateFilter]);

  // Compute metrics (quantity and value) dynamically based on filtered transactions
  const metricsData = React.useMemo(() => {
    let masukQty = 0;
    let keluarQty = 0;
    let keluarCost = 0;

    filteredTransaksi.forEach(t => {
      const matchedInventory = inventoryList.find(inv => inv.namaMaterial === t.namaMaterial);
      const hargaSatuan = matchedInventory ? matchedInventory.harga : 0;
      const amount = Number(t.jumlah) || 0;

      if (t.type === 'masuk') {
        masukQty += amount;
      } else if (t.type === 'keluar') {
        keluarQty += amount;
        keluarCost += (amount * hargaSatuan);
      }
    });

    return {
      masukQty: Math.round(masukQty * 100) / 100,
      keluarQty: Math.round(keluarQty * 100) / 100,
      keluarCost: Math.round(keluarCost)
    };
  }, [filteredTransaksi, inventoryList]);

  // Currency utility helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper function to resolve Project Name for local inventory items based on their warehouse
  const getProjectNameForInventory = (item: Inventory) => {
    const gd = gudangList.find(g => g.id === item.idGudang);
    const searchStr = (gd ? gd.namaGudang + " " + gd.lokasi : item.idGudang || '').toLowerCase();
    
    // Look for match in projects array names
    const matchedProject = projects.find(p => {
      const pName = p.name.toLowerCase();
      const words = pName.split(' ');
      return words.some(word => word.length > 3 && searchStr.includes(word));
    });
    
    if (matchedProject) return matchedProject.name;
    
    // Specific predefined lookups
    if (searchStr.includes('permata') || item.idGudang === 'gud-01') return 'Permata Hijau Residence';
    if (searchStr.includes('griya') || searchStr.includes('harmony') || item.idGudang === 'gud-02') return 'Griya Harmony Cluster';
    if (searchStr.includes('nirwana') || item.idGudang === 'gud-03') return 'Grand Nirwana Regency';
    
    return projects[0]?.name || '-';
  };

  // Helper function to resolve Project Name for transaction records
  const getProjectNameForTransaksi = (t: TransaksiMaterial) => {
    if (t.type === 'keluar' && t.blokRumah && t.blokRumah !== '-') {
      const k = konstruksiList.find(item => item.id === t.blokRumah);
      if (k) {
        return k.projectName;
      }
    }
    
    // Otherwise fallback to warehouse-based project identification
    const gdName = t.namaGudang ? t.namaGudang.toLowerCase() : '';
    const matchedProject = projects.find(p => {
      const pName = p.name.toLowerCase();
      const words = pName.split(' ');
      return words.some(word => word.length > 3 && gdName.includes(word));
    });
    
    if (matchedProject) return matchedProject.name;
    
    if (gdName.includes('permata')) return 'Permata Hijau Residence';
    if (gdName.includes('griya') || gdName.includes('harmony')) return 'Griya Harmony Cluster';
    if (gdName.includes('nirwana') || gdName.includes('regency')) return 'Grand Nirwana Regency';
    
    return projects[0]?.name || '-';
  };

  // Filters based on active workspace and typing
  const filteredInventory = React.useMemo(() => {
    return inventoryList.filter(item => {
      const matchSearch = item.namaMaterial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kategoriMaterial.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (stockStatusFilter === 'all') return true;
      const isLow = item.jumlahStok <= item.minimumStock;
      if (stockStatusFilter === 'aman') return !isLow;
      if (stockStatusFilter === 're-order') return isLow;
      return true;
    });
  }, [inventoryList, searchQuery, stockStatusFilter]);

  const filteredGudang = React.useMemo(() => {
    return gudangList.filter(g => 
      g.namaGudang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.lokasi.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [gudangList, searchQuery]);

  const filteredSupplier = React.useMemo(() => {
    return supplierList.filter(s => 
      s.namaSupplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.alamat.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [supplierList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Navigation Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/55 backdrop-blur-md p-2 rounded-2xl border border-white/40">
        <div className="flex flex-wrap gap-1.5 w-full lg:w-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setSubTab('transaksi'); setSearchQuery(''); setStockStatusFilter('all'); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              subTab === 'transaksi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowUpDown size={14} className="text-violet-500" />
            Transaksi Material
          </button>
          <button
            onClick={() => { setSubTab('inventory'); setSearchQuery(''); setStockStatusFilter('all'); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              subTab === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package size={14} className="text-indigo-500" />
            Inventory Stok
          </button>
          <button
            onClick={() => { setSubTab('rab'); setSearchQuery(''); setStockStatusFilter('all'); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              subTab === 'rab' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers size={14} className="text-indigo-600" />
            Standar RAB Proyek
          </button>
          <button
            onClick={() => { setSubTab('rekap_unit'); setSearchQuery(''); setStockStatusFilter('all'); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              subTab === 'rekap_unit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            Rekap Material per Unit
          </button>
          <button
            onClick={() => { setSubTab('gudang'); setSearchQuery(''); setStockStatusFilter('all'); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              subTab === 'gudang' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Warehouse size={14} className="text-emerald-500" />
            Gudang
          </button>
          <button
            onClick={() => { setSubTab('supplier'); setSearchQuery(''); setStockStatusFilter('all'); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              subTab === 'supplier' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Truck size={14} className="text-amber-500" />
            Supplier
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {subTab === 'rab' && onAddRabDetail && (
            <button
              onClick={() => onAddRabDetail(selectedRabId)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer transition"
            >
              <PlusCircle size={15} />
              Tambah Item Material RAB
            </button>
          )}
          <button
            onClick={() => {
              if (subTab === 'inventory') onAddInventory();
              else if (subTab === 'gudang') onAddGudang();
              else if (subTab === 'supplier') onAddSupplier();
              else if (subTab === 'rab') {
                if (onAddRabTemplate) onAddRabTemplate();
              } else onAddTransaksi();
            }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer transition"
          >
            <PlusCircle size={15} />
            {subTab === 'inventory' && 'Tambah Material'}
            {subTab === 'gudang' && 'Tambah Ruang Gudang'}
            {subTab === 'supplier' && 'Tambah Supplier'}
            {subTab === 'transaksi' && 'Log Mutasi Material'}
            {subTab === 'rab' && 'Buat Template RAB Baru'}
            {subTab === 'rekap_unit' && 'Catat Mutasi Material'}
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 p-1 rounded-xl bg-white/45 backdrop-blur-md border border-white/20">
          <Search className="absolute left-4 top-4 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Cari dalam workspace ${subTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm rounded-xl pl-11 pr-4 py-2.5 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {subTab === 'inventory' && (
          <div className="p-1 rounded-xl bg-white/45 backdrop-blur-md border border-white/20 flex items-center min-w-[220px]">
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-semibold cursor-pointer"
            >
              <option value="all">Semua Status Stok</option>
              <option value="aman">Status: AMAN</option>
              <option value="re-order">Status: RE-ORDER (Minim)</option>
            </select>
          </div>
        )}

        {subTab === 'transaksi' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tipe Transaksi */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/45 backdrop-blur-md border border-white/20">
              <Sliders size={15} className="text-slate-400 ml-2 shrink-0" />
              <select
                value={transaksiTypeFilter}
                onChange={(e) => setTransaksiTypeFilter(e.target.value as any)}
                className="text-xs sm:text-sm rounded-lg px-2.5 py-1.5 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">Semua Tipe Transaksi</option>
                <option value="masuk">Tipe: Masuk (Drop Gudang)</option>
                <option value="keluar">Tipe: Keluar (Gudang ke Unit)</option>
              </select>
            </div>

            {/* Filter Waktu Transaksi */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/45 backdrop-blur-md border border-white/20">
              <Calendar size={15} className="text-slate-400 ml-2 shrink-0" />
              <select
                value={transaksiTimePreset}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setTransaksiTimePreset(val);
                  if (val !== 'custom') {
                    setTransaksiDateFilter('');
                  }
                }}
                className="text-xs sm:text-sm rounded-lg px-2.5 py-1.5 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="yesterday">Kemarin</option>
                <option value="last7">7 Hari Terakhir</option>
                <option value="thisMonth">Bulan Ini</option>
                <option value="custom">Pilih Tanggal...</option>
              </select>

              {/* Tanggal Spesifik (Input Date) */}
              {(transaksiTimePreset === 'custom' || transaksiDateFilter) && (
                <input
                  type="date"
                  value={transaksiDateFilter}
                  onChange={(e) => {
                    setTransaksiDateFilter(e.target.value);
                    setTransaksiTimePreset('custom');
                  }}
                  className="text-xs sm:text-sm rounded-lg px-2.5 py-1.5 bg-white/90 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-semibold cursor-pointer"
                />
              )}
            </div>

            {/* Tombol Reset jika ada filter aktif */}
            {(transaksiTypeFilter !== 'all' || transaksiTimePreset !== 'all' || transaksiDateFilter || searchQuery) && (
              <button
                onClick={() => {
                  setTransaksiTypeFilter('all');
                  setTransaksiTimePreset('all');
                  setTransaksiDateFilter('');
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 transition cursor-pointer"
                title="Reset semua filter mutasi"
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Render selected table */}
      {subTab === 'inventory' && (
        <div className="space-y-4">
          {/* Low Stock Watch banner if materials are empty/low */}
          {inventoryList.some(i => i.jumlahStok <= i.minimumStock) && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-200 text-orange-800 text-xs">
              <AlertOctagon size={18} className="text-orange-500 shrink-0" />
              <div>
                <strong>Perhatian Stok Minim:</strong> Terdapat material bangunan dengan kuantitas di bawah ambang batas aman. Segera hubungi supplier bersangkutan untuk pemesanan tambahan.
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-display font-medium">
                  <th className="p-4">Material</th>
                  <th className="p-4">Nama Projek & Gudang</th>
                  <th className="p-4 text-right">Stok Fisik & Harga</th>
                  <th className="p-4 text-right">Stok Minimum & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                {filteredInventory.map((item) => {
                  const isLow = item.jumlahStok <= item.minimumStock;
                  // Map warehouse id to human readable name
                  const wName = gudangList.find(g => g.id === item.idGudang)?.namaGudang || item.idGudang;
                  return (
                    <tr key={item.id} className="hover:bg-white/40 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{item.namaMaterial}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getCategoryBadgeStyle(item.kategoriMaterial)}`}>
                            <Tags size={9} className="opacity-70" />
                            {item.kategoriMaterial}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700 text-xs">
                          {getProjectNameForInventory(item)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{wName}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono font-bold text-slate-800 text-sm">
                          {item.jumlahStok} <span className="text-[11px] font-normal text-slate-500">{item.satuan}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-450 font-mono mt-0.5">
                          {formatRupiah(item.harga)}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono text-slate-500 font-bold text-xs">
                          {item.minimumStock} <span className="text-[11px] font-normal">{item.satuan}</span>
                        </div>
                        <div className="mt-1.5 flex justify-end">
                          <span className={`inline-flex text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                            isLow 
                              ? 'bg-orange-500/15 text-orange-600 border border-orange-500/20' 
                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-400/20'
                          }`}>
                            {isLow ? 'RE-ORDER' : 'AMAN'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'gudang' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGudang.map((g) => (
            <div key={g.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 font-mono">GUDANG ID: {g.id}</span>
                  <Warehouse className="text-emerald-500" size={18} />
                </div>
                <h3 className="text-md font-display font-bold text-slate-800">{g.namaGudang}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <MapPin size={13} className="text-indigo-400 shrink-0" />
                  <span>{g.lokasi}</span>
                </div>
              </div>
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Material Tersimpan</span>
                <span className="font-bold text-emerald-600">
                  {inventoryList.filter(i => i.idGudang === g.id).length} Item
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'supplier' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-display font-medium">
                <th className="p-4">Nama Supplier</th>
                <th className="p-4">Nomor HP/Kontak</th>
                <th className="p-4">Alamat Kantor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSupplier.map((s) => {
                const phoneStr = s.noHp != null ? String(s.noHp) : '';
                const cleanPhone = phoneStr.replace(/\D/g, '');
                const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone.startsWith('8') ? '62' + cleanPhone : cleanPhone;

                return (
                  <tr key={s.id} className="hover:bg-white/40 transition">
                    <td className="p-4 font-display font-bold text-slate-900 text-sm">{s.namaSupplier}</td>
                    <td className="p-4">
                      {s.noHp ? (
                        <a 
                          href={`https://wa.me/${waPhone}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all font-sans font-extrabold hover:-translate-y-0.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008 0c3.202.001 6.212 1.249 8.477 3.517 2.266 2.268 3.51 5.28 3.51 8.487-.004 6.657-5.34 11.997-11.951 12.003-2.005 0-3.974-.504-5.729-1.465L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.8 1.45 5.378 0 9.75-4.37 9.754-9.753.002-2.605-1.013-5.053-2.86-6.901C16.48 2.103 14.032.93 11.427.93c-5.385 0-9.76 4.373-9.765 9.758-.002 1.8.48 3.55 1.4 5.1l-.94 3.4 3.5-.92c1.55.85 3.25 1.3 4.9 1.3z" />
                          </svg>
                          <span>{s.noHp}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] font-sans">Belum terdaftar</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">{s.alamat}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'transaksi' && (
        <div className="space-y-5">
          {/* Metrics Section Header with Timeframe Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/75 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm gap-4">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-sm">Ringkasan Mutasi Material</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Analisis kuantitas material masuk & keluar beserta estimasi pembiayaan</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/40">
              <button
                onClick={() => { setTransaksiTimePreset('today'); setTransaksiDateFilter(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transaksiTimePreset === 'today' && !transaksiDateFilter
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => { setTransaksiTimePreset('last7'); setTransaksiDateFilter(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transaksiTimePreset === 'last7' && !transaksiDateFilter
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => { setTransaksiTimePreset('thisMonth'); setTransaksiDateFilter(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transaksiTimePreset === 'thisMonth' && !transaksiDateFilter
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => { setTransaksiTimePreset('all'); setTransaksiDateFilter(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  transaksiTimePreset === 'all' && !transaksiDateFilter
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Metrics Panel / Table Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Material Masuk */}
            <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-emerald-600/90 uppercase tracking-wider block">Material Masuk</span>
                <span className="font-mono text-2xl font-black text-slate-800 leading-none block mt-1.5">
                  {metricsData.masukQty} <span className="text-xs font-normal text-slate-450">satuan</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {transaksiDateFilter 
                    ? `Per tanggal ${transaksiDateFilter}`
                    : transaksiTimePreset === 'today' 
                    ? 'Total masuk hari ini' 
                    : transaksiTimePreset === 'yesterday'
                    ? 'Total masuk kemarin'
                    : transaksiTimePreset === 'last7' 
                    ? 'Total masuk 7 hari terakhir' 
                    : transaksiTimePreset === 'thisMonth'
                    ? 'Total masuk bulan ini'
                    : 'Total seluruh data masuk'}
                </span>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-xs">
                <TrendingUp size={18} />
              </div>
            </div>

            {/* Total Material Keluar */}
            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-rose-600/90 uppercase tracking-wider block">Material Keluar</span>
                <span className="font-mono text-2xl font-black text-slate-800 leading-none block mt-1.5">
                  {metricsData.keluarQty} <span className="text-xs font-normal text-slate-455">satuan</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {transaksiDateFilter 
                    ? `Per tanggal ${transaksiDateFilter}`
                    : transaksiTimePreset === 'today' 
                    ? 'Total keluar hari ini' 
                    : transaksiTimePreset === 'yesterday'
                    ? 'Total keluar kemarin'
                    : transaksiTimePreset === 'last7' 
                    ? 'Total keluar 7 hari terakhir' 
                    : transaksiTimePreset === 'thisMonth'
                    ? 'Total keluar bulan ini'
                    : 'Total seluruh data keluar'}
                </span>
              </div>
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shadow-xs">
                <TrendingDown size={18} />
              </div>
            </div>

            {/* Total Biaya Material Keluar */}
            <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-indigo-600/90 uppercase tracking-wider block">Total Biaya Keluar</span>
                <span className="font-mono text-lg font-extrabold text-slate-800 leading-none block mt-1.5">
                  {formatRupiah(metricsData.keluarCost)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1.5 block">
                  {transaksiTypeFilter === 'masuk' ? 'Hanya material masuk terfilter' : 'Estimasi nilai material keluar terfilter'}
                </span>
              </div>
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-xs">
                <Coins size={18} />
              </div>
            </div>
          </div>

          {/* Active Filter Bar & Row Count */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                {filteredTransaksi.length} Data Transaksi
              </span>
              {transaksiTypeFilter !== 'all' && (
                <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] uppercase border ${
                  transaksiTypeFilter === 'masuk'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  Tipe: {transaksiTypeFilter}
                </span>
              )}
              {(transaksiTimePreset !== 'all' || transaksiDateFilter) && (
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                  Waktu: {
                    transaksiDateFilter 
                      ? transaksiDateFilter 
                      : transaksiTimePreset === 'today' 
                      ? 'Hari Ini' 
                      : transaksiTimePreset === 'yesterday'
                      ? 'Kemarin'
                      : transaksiTimePreset === 'last7'
                      ? '7 Hari Terakhir'
                      : 'Bulan Ini'
                  }
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Zona Waktu: Sulawesi Tenggara (WITA)
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-display font-medium">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Nama Material</th>
                  <th className="p-4">Projek & Gudang</th>
                  <th className="p-4 text-center">Tipe Transaksi</th>
                  <th className="p-4 text-right">Biaya Material</th>
                  <th className="p-4">Catatan Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {filteredTransaksi.map((t) => {
                  const matchedInventory = inventoryList.find(inv => inv.namaMaterial === t.namaMaterial);
                  const hargaSatuan = matchedInventory ? matchedInventory.harga : 0;
                  const biayaMaterial = t.type === 'keluar' ? t.jumlah * hargaSatuan : null;

                  return (
                    <tr key={t.id} className="hover:bg-white/40 ease-in-out transition">
                      <td className="p-4">
                        <div className="font-mono font-bold text-indigo-600 text-[10px] mb-0.5">
                          {t.type === 'masuk' 
                            ? (t.supplier ? `Supplier: ${t.supplier}` : 'Masuk Gudang') 
                            : (t.blokRumah && t.blokRumah !== '-' ? `Blok ${t.blokRumah}` : '-')}
                        </div>
                        <div className="font-mono text-slate-400">{t.tanggal}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{t.namaMaterial}</td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-slate-700">{getProjectNameForTransaksi(t)}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5 font-medium">{t.namaGudang}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div>
                          <span className={`inline-flex font-extrabold uppercase px-2 py-0.5 text-[10px] rounded ${
                            t.type === 'masuk' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {t.type}
                          </span>
                        </div>
                        <div className={`mt-1 font-bold font-mono text-xs ${
                          t.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {t.type === 'masuk' ? '+' : '-'}{t.jumlah}
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold font-mono text-slate-700">
                        {biayaMaterial !== null ? formatRupiah(biayaMaterial) : '-'}
                      </td>
                      <td className="p-4 italic text-slate-500 text-xs max-w-xs">{t.catatan}</td>
                    </tr>
                  );
                })}
                {filteredTransaksi.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertOctagon size={24} className="text-slate-300" />
                        <span className="font-medium text-slate-600">Tidak ada riwayat mutasi material yang cocok dengan filter yang dipilih.</span>
                        {(transaksiTypeFilter !== 'all' || transaksiTimePreset !== 'all' || transaksiDateFilter || searchQuery) && (
                          <button
                            onClick={() => {
                              setTransaksiTypeFilter('all');
                              setTransaksiTimePreset('all');
                              setTransaksiDateFilter('');
                              setSearchQuery('');
                            }}
                            className="mt-1 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                          >
                            Reset semua filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB STANDAR RAB PROYEK */}
      {subTab === 'rab' && (
        <div className="space-y-6">
          {/* Information & Concept Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/60 border border-indigo-100/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shrink-0 mt-0.5">
                <Layers size={22} />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                  Standar Koefisien Material RAB (Bill of Materials)
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Tentukan kuantitas standar pemakaian material untuk <strong>1 unit rumah</strong> (misal 70 sak semen, 18 batang besi). 
                  Satu template RAB dapat diterapkan ke <strong>seluruh unit dalam 1 proyek</strong> sekaligus. Sistem akan mendeteksi dan memberi peringatan otomatis saat realisasi barang keluar melebihi batas RAB.
                </p>
              </div>
            </div>

            {onAddRabTemplate && (
              <button
                onClick={onAddRabTemplate}
                className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <PlusCircle size={15} />
                + Buat Template RAB Baru
              </button>
            )}
          </div>

          {/* Section 1: Template RAB Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>Daftar Template RAB Tersedia</span>
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold">
                  {rabTemplateList.length} Template
                </span>
              </h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rabTemplateList.map((rab) => {
                const isSelected = (selectedRabId || rabTemplateList[0]?.id) === rab.id;
                const itemsCount = rabDetailList.filter(d => d.rabId === rab.id).length;
                const assignedProjects = projects.filter(p => p.rabId === rab.id);

                return (
                  <div
                    key={rab.id}
                    onClick={() => setSelectedRabId(rab.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-white border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {rab.id}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isSelected ? 'Aktif Dipilih' : 'Klik Pilih'}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-slate-900 text-sm mb-1">{rab.namaRab}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[32px]">{rab.keterangan || 'Standar kebutuhan material unit perumahan'}</p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Standar Material</span>
                      <span className="font-bold font-mono text-indigo-600">{itemsCount} Item</span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Proyek Terhubung</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[140px] text-right">
                        {assignedProjects.length > 0 ? assignedProjects.map(p => p.name).join(', ') : 'Belum Terhubung'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Pemetaan RAB ke Proyek (Project RAB Assignment) */}
          <div className="p-5 rounded-2xl bg-white/70 border border-slate-100 shadow-xs space-y-4">
            <div>
              <h5 className="font-display font-bold text-slate-900 text-sm">
                Penerapan Template RAB ke Proyek (Berlaku untuk seluruh unit rumah dalam proyek)
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih template RAB yang akan digunakan oleh masing-masing proyek perumahan. Seluruh unit di dalam proyek tersebut akan otomatis mengacu pada standar RAB yang dipilih.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-bold font-display">
                    <th className="p-3.5">Nama Proyek</th>
                    <th className="p-3.5">Lokasi Proyek</th>
                    <th className="p-3.5 text-center">Jumlah Unit Rumah</th>
                    <th className="p-3.5">Template RAB yang Diterapkan</th>
                    <th className="p-3.5 text-right">Status Standar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {projects.map((proj) => {
                    const unitCount = konstruksiList.filter(k => k.projectId === proj.id).length;
                    const assignedRab = rabTemplateList.find(r => r.id === proj.rabId);

                    return (
                      <tr key={proj.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 font-bold font-display text-slate-900">{proj.name}</td>
                        <td className="p-3.5 text-slate-500">{proj.location || '-'}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-indigo-600">{unitCount} Unit</td>
                        <td className="p-3.5">
                          <select
                            value={proj.rabId || ''}
                            onChange={(e) => onUpdateProjectRab && onUpdateProjectRab(proj.id, e.target.value)}
                            className="text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 w-full max-w-xs"
                          >
                            <option value="">-- Pilih Template RAB --</option>
                            {rabTemplateList.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.namaRab}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          {assignedRab ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={11} /> Aktif Terhubung
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle size={11} /> Belum Dipilih
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Detail Item Material dalam Template RAB Terpilih */}
          {(() => {
            const activeRab = rabTemplateList.find(r => r.id === (selectedRabId || rabTemplateList[0]?.id));
            const detailsForActive = rabDetailList.filter(d => d.rabId === activeRab?.id);
            const filteredDetails = detailsForActive.filter(d =>
              d.namaMaterial.toLowerCase().includes(searchQuery.toLowerCase()) ||
              d.satuan.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h5 className="font-display font-bold text-black text-sm sm:text-base flex items-center gap-2">
                      <span className="text-black">Item Standar Material: </span>
                      <span className="text-black font-black">{activeRab ? activeRab.namaRab : 'Pilih Template'}</span>
                    </h5>
                    <p className="text-xs text-black font-medium mt-0.5">
                      Jumlah standar material di bawah ini adalah acuan batas pemakaian untuk <strong className="font-black text-black">1 unit rumah</strong>.
                    </p>
                  </div>

                  {onAddRabDetail && activeRab && (
                    <button
                      onClick={() => onAddRabDetail(activeRab.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl border border-black/20 transition cursor-pointer"
                    >
                      <PlusCircle size={14} className="text-black" />
                      + Tambah Item Material ke RAB Ini
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-black/20 bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-black/10 text-black text-[11px] uppercase font-black font-display">
                        <th className="p-3.5">Nama Material</th>
                        <th className="p-3.5">Satuan</th>
                        <th className="p-3.5 text-right font-mono">Quantity Standar</th>
                        <th className="p-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-black">
                      {filteredDetails.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-black font-bold italic">
                            Belum ada item material dalam template RAB ini. Klik "+ Tambah Item Material ke RAB Ini" untuk menambahkan.
                          </td>
                        </tr>
                      ) : (
                        filteredDetails.map((item) => {
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 transition">
                              <td className="p-3.5 font-bold font-display text-black text-xs sm:text-sm">
                                {item.namaMaterial}
                              </td>
                              <td className="p-3.5 font-semibold text-black">{item.satuan}</td>
                              <td className="p-3.5 text-right font-mono font-black text-black text-sm">
                                {item.qtyStandar} <span className="text-xs font-normal text-black">{item.satuan}</span>
                              </td>
                              <td className="p-3.5 text-center">
                                {onDeleteRabDetail && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Hapus standar "${item.namaMaterial}" dari template RAB ini?`)) {
                                        onDeleteRabDetail(item.id);
                                      }
                                    }}
                                    title="Hapus Item dari RAB"
                                    className="p-1.5 text-black hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                                  >
                                    <Trash2 size={14} className="text-black" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. TAB REKAP PENGGUNAAN MATERIAL PER UNIT VS STANDAR RAB */}
      {subTab === 'rekap_unit' && (
        <div className="space-y-6">
          {/* Header Controls & View Switcher */}
          <div className="p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                Rekapitulasi Penggunaan Material per Unit Rumah
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Kontrol perbandingan realisasi material keluar versus standar batas RAB untuk setiap unit rumah
              </p>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/50">
              <button
                onClick={() => setRekapViewMode('detail')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  rekapViewMode === 'detail'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Detail Per Unit
              </button>
              <button
                onClick={() => setRekapViewMode('semua_unit')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  rekapViewMode === 'semua_unit'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Ringkasan Semua Unit
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: DETAIL PER UNIT */}
          {rekapViewMode === 'detail' && (() => {
            const currentUnit = konstruksiList.find(k => k.id === (selectedBlokUnit || konstruksiList[0]?.id)) || konstruksiList[0];
            const currentProj = projects.find(p => p.id === currentUnit?.projectId);
            const currentRab = rabTemplateList.find(r => r.id === currentProj?.rabId);
            const standardItems = rabDetailList.filter(d => d.rabId === currentProj?.rabId);

            // Filter transactions for this unit
            const unitTxOut = transaksiList.filter(t => t.type === 'keluar' && t.blokRumah === currentUnit?.id);

            // Aggregate actual usage by material name
            const usageMap = new Map<string, number>();
            unitTxOut.forEach(t => {
              const key = t.namaMaterial.trim().toLowerCase();
              usageMap.set(key, (usageMap.get(key) || 0) + (Number(t.jumlah) || 0));
            });

            // Build consolidated row list
            const rowMap = new Map<string, {
              namaMaterial: string;
              satuan: string;
              standardQty: number;
              actualQty: number;
              isFromRab: boolean;
              hargaSatuan: number;
            }>();

            // 1. Add all standard items from RAB
            standardItems.forEach(item => {
              const key = item.namaMaterial.trim().toLowerCase();
              const matchedInv = inventoryList.find(i => i.namaMaterial.trim().toLowerCase() === key);
              const actual = usageMap.get(key) || 0;
              rowMap.set(key, {
                namaMaterial: item.namaMaterial,
                satuan: item.satuan,
                standardQty: item.qtyStandar,
                actualQty: actual,
                isFromRab: true,
                hargaSatuan: matchedInv?.harga || 0,
              });
            });

            // 2. Add any materials actually used that were not in RAB
            unitTxOut.forEach(t => {
              const key = t.namaMaterial.trim().toLowerCase();
              if (!rowMap.has(key)) {
                const matchedInv = inventoryList.find(i => i.namaMaterial.trim().toLowerCase() === key);
                rowMap.set(key, {
                  namaMaterial: t.namaMaterial,
                  satuan: matchedInv?.satuan || 'Pcs',
                  standardQty: 0,
                  actualQty: usageMap.get(key) || Number(t.jumlah) || 0,
                  isFromRab: false,
                  hargaSatuan: matchedInv?.harga || 0,
                });
              }
            });

            const rows = Array.from(rowMap.values()).filter(r =>
              r.namaMaterial.toLowerCase().includes(searchQuery.toLowerCase())
            );

            // Metrics
            const overCount = rows.filter(r => r.isFromRab && r.actualQty > r.standardQty).length;
            const totalActualCost = rows.reduce((sum, r) => sum + (r.actualQty * r.hargaSatuan), 0);
            const totalItemsUsed = rows.filter(r => r.actualQty > 0).length;

            return (
              <div className="space-y-5">
                {/* Unit Selector & Unit Info Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-100 shadow-xs">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-xs font-bold text-slate-600 shrink-0">Pilih Unit Blok Rumah:</label>
                      <select
                        value={selectedBlokUnit || currentUnit?.id || ''}
                        onChange={(e) => setSelectedBlokUnit(e.target.value)}
                        className="text-xs font-bold rounded-xl px-3 py-2 bg-slate-50 border border-slate-200 text-indigo-700 focus:bg-white focus:border-indigo-500 shadow-xs"
                      >
                        {konstruksiList.map((k) => (
                          <option key={k.id} value={k.id}>
                            Blok {k.id} - {k.projectName} ({k.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Status Pembangunan:</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        currentUnit?.statusPembangunan === 'terbangun'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {currentUnit?.statusPembangunan || 'onProgres'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Proyek Perumahan</span>
                      <strong className="text-slate-800 font-display block mt-0.5">{currentUnit?.projectName || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tipe Bangunan</span>
                      <strong className="text-slate-800 font-display block mt-0.5">
                        {currentUnit?.type} (LT: {currentUnit?.luasTanah}m², LB: {currentUnit?.luasBangunan}m²)
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Standar RAB Proyek</span>
                      <strong className="text-indigo-600 font-display block mt-0.5">
                        {currentRab ? currentRab.namaRab : 'Belum Ditentukan'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Status Penjualan</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${
                        currentUnit?.statusPenjualan === 'terjual' ? 'bg-emerald-100 text-emerald-700' :
                        currentUnit?.statusPenjualan === 'terbooking' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {currentUnit?.statusPenjualan || 'tersedia'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* KPI 1: Jenis Material Digunakan */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-white/70 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Material Keluar</span>
                      <span className="font-mono text-2xl font-black text-slate-800 block mt-1">
                        {totalItemsUsed} <span className="text-xs font-normal text-slate-400">dari {rows.length} jenis</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Akumulasi pengeluaran ke unit ini</span>
                    </div>
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                      <Package size={20} />
                    </div>
                  </div>

                  {/* KPI 2: Status Kontrol Batas RAB */}
                  <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
                    overCount > 0
                      ? 'border-rose-200 bg-rose-50/60'
                      : 'border-emerald-200 bg-emerald-50/50'
                  }`}>
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider block ${
                        overCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        Kontrol Batas RAB
                      </span>
                      <span className={`font-mono text-xl sm:text-2xl font-black block mt-1 ${
                        overCount > 0 ? 'text-rose-700' : 'text-emerald-800'
                      }`}>
                        {overCount > 0 ? `${overCount} Material Over` : 'Semua Sesuai RAB'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {overCount > 0 ? 'Terdapat material melebihi kuota standar' : 'Penggunaan material dalam batas wajar'}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl ${
                      overCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {overCount > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                  </div>

                  {/* KPI 3: Estimasi Biaya Material Terpakai */}
                  <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Total Biaya Material</span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                        {formatRupiah(totalActualCost)}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Estimasi nilai material yang terserap</span>
                    </div>
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Coins size={20} />
                    </div>
                  </div>
                </div>

                {/* Main Comparison Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/70 shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-bold font-display">
                        <th className="p-3.5">Nama Material</th>
                        <th className="p-3.5">Satuan</th>
                        <th className="p-3.5 text-right font-mono">Standar RAB (per Unit)</th>
                        <th className="p-3.5 text-right font-mono">Realisasi Keluar</th>
                        <th className="p-3.5 text-right font-mono">Selisih Deviasi</th>
                        <th className="p-3.5" style={{ minWidth: '150px' }}>Rasio Penggunaan</th>
                        <th className="p-3.5">Status & Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                            Belum ada data material untuk unit ini.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, idx) => {
                          const isOver = row.isFromRab && row.actualQty > row.standardQty;
                          const selisih = row.actualQty - row.standardQty;
                          const percent = row.standardQty > 0 ? Math.round((row.actualQty / row.standardQty) * 100) : 100;
                          const barWidth = Math.min(100, percent);

                          return (
                            <tr
                              key={idx}
                              className={`transition ${
                                isOver ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-white/90'
                              }`}
                            >
                              <td className="p-3.5 font-bold font-display text-slate-900">
                                <div>{row.namaMaterial}</div>
                                {!row.isFromRab && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-normal mt-0.5 inline-block">
                                    Item di luar template RAB proyek
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 font-semibold text-slate-600">{row.satuan}</td>
                              <td className="p-3.5 text-right font-mono text-slate-700 font-semibold">
                                {row.isFromRab ? (
                                  <span>{row.standardQty} <span className="text-[10px] font-normal text-slate-400">{row.satuan}</span></span>
                                ) : (
                                  <span className="text-slate-400 italic">-</span>
                                )}
                              </td>
                              <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                                {row.actualQty} <span className="text-[10px] font-normal text-slate-400">{row.satuan}</span>
                              </td>
                              <td className="p-3.5 text-right font-mono font-bold">
                                {row.isFromRab ? (
                                  selisih > 0 ? (
                                    <span className="text-rose-600">+{selisih} {row.satuan}</span>
                                  ) : selisih === 0 ? (
                                    <span className="text-blue-600">Pas (0)</span>
                                  ) : (
                                    <span className="text-emerald-600">{selisih} {row.satuan}</span>
                                  )
                                ) : (
                                  <span className="text-amber-600">+{row.actualQty} {row.satuan}</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                {row.isFromRab ? (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono">
                                      <span className={isOver ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                                        {percent}%
                                      </span>
                                      <span className="text-slate-400">
                                        {row.actualQty}/{row.standardQty}
                                      </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                          isOver
                                            ? 'bg-rose-500'
                                            : percent === 100
                                            ? 'bg-blue-500'
                                            : percent >= 80
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${barWidth}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Non-kuota</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                {row.isFromRab ? (
                                  isOver ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                                      <AlertTriangle size={12} className="text-rose-600 shrink-0" />
                                      MELEBIHI RAB (+{selisih} {row.satuan})
                                    </span>
                                  ) : percent === 100 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                      Batas Maksimal RAB (100%)
                                    </span>
                                  ) : row.actualQty === 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                                      Belum Keluar (0%)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                      Aman (Sisa {row.standardQty - row.actualQty} {row.satuan})
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100/70 text-amber-800 border border-amber-200">
                                    Di Luar Standar RAB
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Riwayat Mutasi Barang Keluar Khusus Unit Ini */}
                <div className="p-5 rounded-2xl bg-white/70 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-display font-bold text-slate-900 text-sm">
                        Riwayat Mutasi Barang Keluar ke Blok {currentUnit?.id}
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Log transaksi material yang dikeluarkan dari gudang ke unit ini
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {unitTxOut.length} Transaksi
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-bold font-display">
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Material</th>
                          <th className="p-3">Gudang Asal</th>
                          <th className="p-3 text-right">Jumlah Keluar</th>
                          <th className="p-3">Catatan Lapangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {unitTxOut.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                              Belum ada mutasi barang keluar yang dicatat untuk Blok {currentUnit?.id}.
                            </td>
                          </tr>
                        ) : (
                          unitTxOut.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/60 transition">
                              <td className="p-3 font-mono text-slate-500">{t.tanggal}</td>
                              <td className="p-3 font-bold text-slate-800">{t.namaMaterial}</td>
                              <td className="p-3 text-slate-500">{t.namaGudang}</td>
                              <td className="p-3 text-right font-mono font-bold text-rose-600">
                                -{t.jumlah}
                              </td>
                              <td className="p-3 italic text-slate-500 max-w-xs">{t.catatan || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW MODE 2: RINGKASAN SEMUA UNIT */}
          {rekapViewMode === 'semua_unit' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/70 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-bold font-display">
                      <th className="p-3.5">Blok Rumah</th>
                      <th className="p-3.5">Nama Proyek</th>
                      <th className="p-3.5">Tipe Unit</th>
                      <th className="p-3.5">Standar RAB Proyek</th>
                      <th className="p-3.5 text-center">Status Pembangunan</th>
                      <th className="p-3.5 text-right font-mono">Total Transaksi Keluar</th>
                      <th className="p-3.5">Status Kontrol RAB</th>
                      <th className="p-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {konstruksiList.map((unit) => {
                      const proj = projects.find(p => p.id === unit.projectId);
                      const rab = rabTemplateList.find(r => r.id === proj?.rabId);
                      const standardItems = rabDetailList.filter(d => d.rabId === proj?.rabId);
                      const unitTx = transaksiList.filter(t => t.type === 'keluar' && t.blokRumah === unit.id);

                      // Check over budget
                      const usageMap = new Map<string, number>();
                      unitTx.forEach(t => {
                        const key = t.namaMaterial.trim().toLowerCase();
                        usageMap.set(key, (usageMap.get(key) || 0) + (Number(t.jumlah) || 0));
                      });

                      const overCount = standardItems.filter(item => {
                        const actual = usageMap.get(item.namaMaterial.trim().toLowerCase()) || 0;
                        return actual > item.qtyStandar;
                      }).length;

                      return (
                        <tr key={unit.id} className="hover:bg-white/80 transition">
                          <td className="p-3.5 font-bold font-display text-indigo-700 text-sm">
                            Blok {unit.id}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-800">{unit.projectName}</td>
                          <td className="p-3.5 text-slate-600">{unit.type}</td>
                          <td className="p-3.5 font-medium text-slate-700">{rab ? rab.namaRab : 'Belum Ada'}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              unit.statusPembangunan === 'terbangun'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {unit.statusPembangunan}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            {unitTx.length} Kali
                          </td>
                          <td className="p-3.5">
                            {overCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                                <AlertTriangle size={11} /> {overCount} Material Melebihi RAB
                              </span>
                            ) : unitTx.length === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                Belum Ada Pemakaian
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} /> Semua Sesuai RAB
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setSelectedBlokUnit(unit.id);
                                setRekapViewMode('detail');
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition cursor-pointer"
                            >
                              Cek Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
