import React from 'react';
import { 
  BarChart3, 
  Building, 
  Warehouse, 
  CircleDollarSign, 
  Settings2, 
  Menu, 
  X, 
  Home, 
  TrendingUp, 
  Briefcase, 
  BadgeHelp,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Wallet,
  Users,
  LogOut,
  FileSpreadsheet,
  Gauge
} from 'lucide-react';

// Import types
import {
  Project,
  Konstruksi,
  Inventory,
  Gudang,
  Supplier,
  TransaksiMaterial,
  ProgresPekerjaan,
  RincianPembayaran,
  Karyawan,
  AbsensiKaryawan,
  AbsensiPekerja,
  Pekerja,
  LeadPenjualan,
  FeeMarketing,
  RabTemplate,
  RabDetail
} from './types';

// Import subcomponents
import DashboardView from './components/DashboardView';
import { getWitaToday, normalizeDateString, TIMEZONE_SULTRA } from './utils/timezone';
import { compareBlockIds } from './utils/sorting';
import KpiView from './components/KpiView';
import ConstructionView from './components/ConstructionView';
import LogistikView from './components/LogistikView';
import OperasionalView from './components/OperasionalView';
import MarketingView from './components/MarketingView';
import AddRecordModal from './components/AddRecordModal';
import LoginView, { UserSession } from './components/LoginView';
import GoogleSheetSetupModal from './components/GoogleSheetSetupModal';

// Import Google Sheets Adapter
import { supabase, getAppsScriptUrl } from './supabaseClient';

export default function App() {
  // User Session Multi-Role state
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(() => {
    const saved = localStorage.getItem('currentUserSession');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  React.useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUserSession', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUserSession');
    }
  }, [currentUser]);

  // Navigation tabs
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'kpi' | 'konstruksi' | 'logistik' | 'marketing' | 'operasional'>(() => {
    const saved = localStorage.getItem('lastActiveTab');
    if (saved && ['dashboard', 'kpi', 'konstruksi', 'logistik', 'marketing', 'operasional'].includes(saved)) {
      return saved as 'dashboard' | 'kpi' | 'konstruksi' | 'logistik' | 'marketing' | 'operasional';
    }
    return 'dashboard';
  });

  React.useEffect(() => {
    localStorage.setItem('lastActiveTab', activeTab);
  }, [activeTab]);

  const isTabAllowed = (tab: 'dashboard' | 'kpi' | 'konstruksi' | 'logistik' | 'marketing' | 'operasional') => {
    if (!currentUser) return false;
    const { role } = currentUser;
    if (role === 'super_admin' || role === 'admin_umum') return true;
    if (role === 'logistik') return tab === 'dashboard' || tab === 'kpi' || tab === 'logistik';
    if (role === 'pengawas') return tab === 'dashboard' || tab === 'kpi' || tab === 'konstruksi';
    if (role === 'marketing') return tab === 'dashboard' || tab === 'kpi' || tab === 'marketing';
    return false;
  };

  // Handle restricted access redirect on state load or role change
  React.useEffect(() => {
    if (currentUser && !isTabAllowed(activeTab)) {
      if (isTabAllowed('dashboard')) {
        setActiveTab('dashboard');
      } else if (isTabAllowed('kpi')) {
        setActiveTab('kpi');
      } else if (isTabAllowed('konstruksi')) {
        setActiveTab('konstruksi');
      } else if (isTabAllowed('logistik')) {
        setActiveTab('logistik');
      } else if (isTabAllowed('marketing')) {
        setActiveTab('marketing');
      }
    }
  }, [currentUser, activeTab]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('all');
  
  // Controlled Construction Tab & Search Sub-Filter for Navigation redirects
  const [initialConstructionSubTab, setInitialConstructionSubTab] = React.useState<'blok' | 'progres' | 'opname' | 'rincian'>('blok');
  const [initialConstructionSearchQuery, setInitialConstructionSearchQuery] = React.useState<string>('');
  const [initialConstructionStatusFilter, setInitialConstructionStatusFilter] = React.useState<string>('all');

  // Controlled Operasional Tab & Search Sub-Filter for Navigation redirects
  const [initialOperasionalSubTab, setInitialOperasionalSubTab] = React.useState<'karyawan' | 'absensi' | 'absensi_pekerja' | 'pekerja'>('absensi');
  const [initialOperasionalSearchQuery, setInitialOperasionalSearchQuery] = React.useState<string>('');

  // Controlled Logistik Tab & Selected Unit for Direct Cek Detail redirects
  const [initialLogistikSubTab, setInitialLogistikSubTab] = React.useState<'inventory' | 'gudang' | 'supplier' | 'transaksi' | 'rab' | 'rekap_unit'>('transaksi');
  const [initialLogistikSelectedUnit, setInitialLogistikSelectedUnit] = React.useState<string>('');
  const [initialLogistikRekapViewMode, setInitialLogistikRekapViewMode] = React.useState<'detail' | 'semua_unit'>('detail');

  const navigateToTab = (
    tab: 'dashboard' | 'kpi' | 'konstruksi' | 'logistik' | 'marketing' | 'operasional',
    options?: { 
      subTab?: string; 
      search?: string; 
      statusFilter?: string;
      selectedUnit?: string;
      rekapViewMode?: 'detail' | 'semua_unit';
    }
  ) => {
    setActiveTab(tab);
    if (tab === 'konstruksi') {
      setInitialConstructionSubTab((options?.subTab as any) || 'blok');
      setInitialConstructionSearchQuery(options?.search || '');
      setInitialConstructionStatusFilter(options?.statusFilter || 'all');
    } else if (tab === 'operasional') {
      setInitialOperasionalSubTab((options?.subTab as any) || 'absensi');
      setInitialOperasionalSearchQuery(options?.search || '');
    } else if (tab === 'logistik') {
      if (options?.subTab) setInitialLogistikSubTab(options.subTab as any);
      if (options?.selectedUnit) setInitialLogistikSelectedUnit(options.selectedUnit);
      if (options?.rekapViewMode) setInitialLogistikRekapViewMode(options.rekapViewMode);
    } else {
      setInitialConstructionSubTab('blok');
      setInitialConstructionSearchQuery('');
      setInitialConstructionStatusFilter('all');
      setInitialOperasionalSubTab('absensi');
      setInitialOperasionalSearchQuery('');
    }
  };
  
  // Rtc Time Tick
  const [currentTime, setCurrentTime] = React.useState('');

  // Core database states (Synchronized with Supabase)
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [gudangList, setGudangList] = React.useState<Gudang[]>([]);
  const [supplierList, setSupplierList] = React.useState<Supplier[]>([]);
  const [inventoryList, setInventoryList] = React.useState<Inventory[]>([]);
  const [konstruksiList, setKonstruksiList] = React.useState<Konstruksi[]>([]);
  const [transaksiList, setTransaksiList] = React.useState<TransaksiMaterial[]>([]);
  const [progresList, setProgresList] = React.useState<ProgresPekerjaan[]>([]);
  const [pembayaranList, setPembayaranList] = React.useState<RincianPembayaran[]>([]);
  const [karyawanList, setKaryawanList] = React.useState<Karyawan[]>([]);
  const [absensiList, setAbsensiList] = React.useState<AbsensiKaryawan[]>([]);
  const [absensiPekerjaList, setAbsensiPekerjaList] = React.useState<AbsensiPekerja[]>([]);
  const [pekerjaList, setPekerjaList] = React.useState<Pekerja[]>([]);
  const [leadList, setLeadList] = React.useState<LeadPenjualan[]>([]);
  const [feeList, setFeeList] = React.useState<FeeMarketing[]>([]);
  const [rabTemplateList, setRabTemplateList] = React.useState<RabTemplate[]>([]);
  const [rabDetailList, setRabDetailList] = React.useState<RabDetail[]>([]);

  // Connection Indicator States
  const [dbStatus, setDbStatus] = React.useState<'local' | 'connecting' | 'connected' | 'error'>('connecting');
  const [dbStatusMessage, setDbStatusMessage] = React.useState<string>('Menghubungkan ke Google Sheets...');
  const [isSheetSetupOpen, setIsSheetSetupOpen] = React.useState(false);

  const loadSupabaseData = React.useCallback(async () => {
    try {
      setDbStatus('connecting');
      
      // 1. Perform ping to check if tables exist and are connected
      const { error: pingError } = await supabase.from('projects').select('id').limit(1);
      if (pingError) {
        throw new Error(`Koneksi gagal atau Sheet belum ada: ${pingError.message}`);
      }

      // 2. Fetch all collections in parallel
      const [
        resProjects,
        resGudang,
        resSuppliers,
        resInventory,
        resKonstruksi,
        resTransaksi,
        resProgres,
        resPembayaran,
        resKaryawan,
        resAbsensi,
        resAbsensiPekerja,
        resLeads,
        resFee,
        resRabTemplate,
        resRabDetail
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('gudang').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('konstruksi').select('*'),
        supabase.from('transaksi_material').select('*'),
        supabase.from('progres_pekerjaan').select('*'),
        supabase.from('rincian_pembayaran').select('*'),
        supabase.from('karyawan').select('*'),
        supabase.from('absensi_karyawan').select('*'),
        supabase.from('absensi_pekerja').select('*'),
        supabase.from('leads_penjualan').select('*'),
        supabase.from('fee_marketing').select('*'),
        supabase.from('rab_template').select('*'),
        supabase.from('rab_detail').select('*')
      ]);

      // Error detection
      if (resProjects.error) throw resProjects.error;
      if (resGudang.error) throw resGudang.error;
      if (resSuppliers.error) throw resSuppliers.error;
      if (resInventory.error) throw resInventory.error;
      if (resKonstruksi.error) throw resKonstruksi.error;
      if (resTransaksi.error) throw resTransaksi.error;
      if (resProgres.error) throw resProgres.error;
      if (resPembayaran.error) throw resPembayaran.error;
      if (resKaryawan.error) throw resKaryawan.error;
      if (resAbsensi.error) throw resAbsensi.error;
      if (resAbsensiPekerja.error) throw resAbsensiPekerja.error;
      if (resLeads.error) throw resLeads.error;
      if (resFee.error) throw resFee.error;

      // 3. Populate state directly from database records
      setProjects(resProjects.data || []);
      setGudangList(resGudang.data || []);
      setSupplierList(resSuppliers.data || []);
      setInventoryList(resInventory.data || []);
      // Normalize konstruksi data to handle both camelCase and snake_case column names
      const loadedProjects: Project[] = resProjects.data || [];
      const normalizedKonstruksi = (resKonstruksi.data || []).map((row: any) => {
        const projId = row.projectId || row.project_id || '';
        const matchedProj = loadedProjects.find(
          (p) => String(p.id).trim().toLowerCase() === String(projId).trim().toLowerCase()
        );
        return {
          id: String(row.id || row.blok || row.blok_rumah || row.blokRumah || '').trim(),
          projectId: projId,
          projectName: row.projectName || row.project_name || matchedProj?.name || '',
          type: row.type || 'Type 36',
          luasTanah: Number(row.luasTanah ?? row.luas_tanah ?? 0),
          luasBangunan: Number(row.luasBangunan ?? row.luas_bangunan ?? 0),
          statusPembangunan: (row.statusPembangunan || row.status_pembangunan || 'onProgres') as 'onProgres' | 'terbangun',
          statusPenjualan: (row.statusPenjualan || row.status_penjualan || 'tersedia') as 'tersedia' | 'terjual' | 'terbooking',
          tanggalMulaiBangun: row.tanggalMulaiBangun || row.tanggal_mulai_bangun || '',
          tanggalSelesai: row.tanggalSelesai || row.tanggal_selesai || undefined,
        };
      });
      setKonstruksiList(normalizedKonstruksi.sort((a, b) => compareBlockIds(a.id, b.id)));
      setTransaksiList(resTransaksi.data || []);
      setProgresList(resProgres.data || []);
      setPembayaranList(resPembayaran.data || []);
      setKaryawanList(resKaryawan.data || []);
      setAbsensiList(resAbsensi.data || []);
      setAbsensiPekerjaList(resAbsensiPekerja.data || []);
      setLeadList(resLeads.data || []);
      setFeeList(resFee.data || []);
      setRabTemplateList(resRabTemplate.data || []);
      setRabDetailList(resRabDetail.data || []);

      try {
        const { data: pekerjaRes, error: pekerjaErr } = await supabase.from('pekerja').select('*');
        if (!pekerjaErr && pekerjaRes) {
          setPekerjaList(pekerjaRes);
        }
      } catch (pekerjaErr) {
        console.warn('Gagal membaca sheet pekerja:', pekerjaErr);
      }

      const activeUrl = getAppsScriptUrl();
      setDbStatus(activeUrl ? 'connected' : 'local');
      setDbStatusMessage(activeUrl ? 'Terhubung dengan Google Sheets!' : 'Database siap terhubung ke Google Sheets');
    } catch (err: any) {
      console.warn('Gagal memuat data Google Sheets, mengaktifkan modus offline:', err);
      setDbStatus('local');
      setDbStatusMessage(`Modus Offline: ${err.message || 'Gagal koneksi'}`);
    }
  }, []);

  // Fetch on Mount
  React.useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  const handleUpdateLeadStatus = React.useCallback((id: string, newStatus: LeadPenjualan['leadStatus']) => {
    const todayStr = getWitaToday();
    setLeadList((prev) =>
      prev.map((l) => (l.id === id ? { ...l, leadStatus: newStatus, tanggalInput: todayStr } : l))
    );
    // Background sync to Supabase
    supabase.from('leads_penjualan')
      .update({ leadStatus: newStatus, tanggalInput: todayStr })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase update failed:', error.message);
      });
  }, []);

  const handleAddPekerja = React.useCallback((newPekerjaData: Omit<Pekerja, 'id'>) => {
    const generatedId = `pekerja-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newPekerja: Pekerja = {
      id: generatedId,
      ...newPekerjaData
    };

    setPekerjaList((prev) => [newPekerja, ...prev]);
    showToast(`Sukses mendaftarkan pekerja ${newPekerja.namaTukang}!`);

    // Insert to Supabase
    supabase.from('pekerja').insert([newPekerja]).then(({ error }) => {
      if (error) console.warn('Supabase insert pekerja failed:', error.message);
    });
  }, []);

  const handleUpdateFeeStatus = React.useCallback((id: string, newStatus: FeeMarketing['statusPembayaran']) => {
    const todayStr = getWitaToday();
    const tglBayar = newStatus === 'Lunas' ? todayStr : '-';
    setFeeList((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            statusPembayaran: newStatus,
            tanggalPembayaran: tglBayar,
          };
        }
        return f;
      })
    );
    // Background sync to Supabase
    supabase.from('fee_marketing')
      .update({ statusPembayaran: newStatus, tanggalPembayaran: tglBayar })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase update failed:', error.message);
      });
  }, []);

  const handleUpdateProgres = React.useCallback((id: string, newProgress: number, namaTukang?: string, noHp?: string) => {
    const target = progresList.find((p) => p.id === id);
    if (!target) return;

    const persentasiProgres = Math.min(100, Math.max(0, newProgress));
    const totalNilaiPekerjaan = Math.round(target.nilaiPekerjaan * (persentasiProgres / 100));
    
    const updatedProgres = {
      ...target,
      persentasiProgres,
      totalNilaiPekerjaan,
      ...(namaTukang !== undefined ? { namaTukang } : {}),
      ...(noHp !== undefined ? { noHp } : {}),
    };

    // Update state
    setProgresList((prev) => prev.map((p) => (p.id === id ? updatedProgres : p)));

    // Background sync to Supabase
    supabase.from('progres_pekerjaan')
      .update({ 
        persentasiProgres: updatedProgres.persentasiProgres, 
        totalNilaiPekerjaan: updatedProgres.totalNilaiPekerjaan,
        namaTukang: updatedProgres.namaTukang,
        noHp: updatedProgres.noHp
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase update failed:', error.message);
      });
  }, [progresList]);

  const handleUpdateKonstruksiStatus = React.useCallback(async (
    id: string, 
    newStatus: Konstruksi['statusPembangunan'],
    tanggalSelesaiValue?: string | null
  ) => {
    // 1. Update local React state instantly
    setKonstruksiList((prev) =>
      prev.map((k) => {
        if (k.id === id) {
          const updated = { ...k, statusPembangunan: newStatus };
          if (tanggalSelesaiValue !== undefined) {
            updated.tanggalSelesai = tanggalSelesaiValue || undefined;
          } else if (newStatus === 'onProgres') {
            updated.tanggalSelesai = undefined;
          }
          return updated;
        }
        return k;
      })
    );

    const statusLabel = newStatus === 'terbangun' ? 'Terbangun' : 'On Progres';
    showToast(`Status pembangunan Blok ${id} berhasil diperbarui menjadi ${statusLabel}.`);

    // 2. Resilient Supabase sync (handles camelCase vs snake_case schema and missing columns gracefully)
    try {
      // Primary attempt: camelCase payload
      const camelPayload: Record<string, any> = { statusPembangunan: newStatus };
      if (tanggalSelesaiValue !== undefined) {
        camelPayload.tanggalSelesai = tanggalSelesaiValue || null;
      }

      const resCamel = await supabase
        .from('konstruksi')
        .update(camelPayload)
        .eq('id', id);

      if (resCamel.error) {
        console.warn('CamelCase update failed, trying snake_case payload:', resCamel.error.message);

        // Secondary attempt: snake_case payload
        const snakePayload: Record<string, any> = { status_pembangunan: newStatus };
        if (tanggalSelesaiValue !== undefined) {
          snakePayload.tanggal_selesai = tanggalSelesaiValue || null;
        }

        const resSnake = await supabase
          .from('konstruksi')
          .update(snakePayload)
          .eq('id', id);

        if (resSnake.error) {
          console.warn('Snake_case update failed, falling back to status column only:', resSnake.error.message);

          // Fallback attempt: update status column only (if tanggalSelesai column does not exist in DB schema)
          const fallbackCamel = await supabase
            .from('konstruksi')
            .update({ statusPembangunan: newStatus })
            .eq('id', id);

          if (fallbackCamel.error) {
            await supabase
              .from('konstruksi')
              .update({ status_pembangunan: newStatus })
              .eq('id', id);
          }
        }
      }
    } catch (err: any) {
      console.error('Database sync error:', err);
    }
  }, []);

  const handleUpdateKonstruksiSaleStatus = React.useCallback(async (id: string, newStatus: Konstruksi['statusPenjualan']) => {
    setKonstruksiList((prev) =>
      prev.map((k) => (k.id === id ? { ...k, statusPenjualan: newStatus } : k))
    );
    showToast(`Status penjualan Blok ${id} diperbarui: ${newStatus.toUpperCase()}`);

    try {
      const resCamel = await supabase
        .from('konstruksi')
        .update({ statusPenjualan: newStatus })
        .eq('id', id);

      if (resCamel.error) {
        await supabase
          .from('konstruksi')
          .update({ status_penjualan: newStatus })
          .eq('id', id);
      }
    } catch (err: any) {
      console.error('Database sync error for sale status:', err);
    }
  }, []);


  // Modal formulation state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<'project' | 'konstruksi' | 'progres' | 'inventory' | 'gudang' | 'supplier' | 'transaksi' | 'pembayaran' | 'fee' | 'karyawan' | 'absensi' | 'lead' | 'rab_template' | 'rab_detail' | ''>('');
  const [selectedDefaultRabId, setSelectedDefaultRabId] = React.useState<string>('');

  // Tick clock effect (Sulawesi Tenggara - WITA / Asia/Makassar)
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('id-ID', {
        timeZone: TIMEZONE_SULTRA,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + ' WITA');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show customized system alert message
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Saved Entry Handlers (Aggregating form results back to states)
  const handleSaveModal = (data: any) => {
    const today = getWitaToday();
    const generatedId = Math.random().toString(36).substr(2, 9).toUpperCase();

    switch (modalType) {
      case 'project': {
        const cleanName = String(data.name || '').trim();
        const cleanLocation = String(data.location || '').trim();
        const newProject: Project = {
          id: data.id ? String(data.id).trim() : `proj-${generatedId}`,
          name: cleanName,
          location: cleanLocation,
          rabId: data.rabId ? String(data.rabId).trim() : '',
        };
        setProjects(prev => [...prev, newProject]);
        showToast(`Sukses mendaftarkan projek baru: ${newProject.name}!`);

        // Supabase / Google Sheets insert
        supabase.from('projects').insert([newProject]).then(({ error }) => {
          if (error) console.warn('Supabase insert project failed:', error.message);
        });
        break;
      }
      case 'konstruksi': {
        const { 
          autoGenerateJobs, 
          workerStruktur, 
          workerAtap, 
          workerPlafon, 
          workerListrik, 
          workerPembersihan,
          workerDrainase,
          ...cleanKonstruksiData 
        } = data;
        const selectedProj = projects.find(p => p.id === cleanKonstruksiData.projectId);
        const newKonstruksi: Konstruksi = {
          ...cleanKonstruksiData,
          projectName: selectedProj ? selectedProj.name : 'Unknown Project',
        };
        setKonstruksiList(prev => [...prev, newKonstruksi].sort((a, b) => compareBlockIds(a.id, b.id)));
        showToast(`Sukses menambahkan Kapling Blok ${newKonstruksi.id}!`);
        
        // Supabase Insert Table
        supabase.from('konstruksi').insert([newKonstruksi]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });

        if (autoGenerateJobs) {
          const templates: { kategoriPekerjaan: 'struktur' | 'plafon' | 'atap' | 'listrik' | 'pembersihan' | 'drainase'; itemPekerjaan: string; nilaiPekerjaan: number; }[] = [
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'PEK. PONDASI RUMAH', nilaiPekerjaan: 1000000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'PAS. SLOF', nilaiPekerjaan: 700000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'TIMBUNAN', nilaiPekerjaan: 300000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'PAS. BATA  + KUSENG', nilaiPekerjaan: 4200000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'PAS. RING BALOK+DAK KM', nilaiPekerjaan: 1000000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'PLASTER LUAR DALAM', nilaiPekerjaan: 2800000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'PAS. TEGEL RUMAH', nilaiPekerjaan: 1300000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'PEK. KAMAR MANDI + SEPTICK TANK', nilaiPekerjaan: 1000000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'ORNAMEN DEPAN + PAGAR DEPAN&BELAKANG', nilaiPekerjaan: 800000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'CARPORT+DEKER+PELUR BELAKANG', nilaiPekerjaan: 600000 },
            { kategoriPekerjaan: 'drainase', itemPekerjaan: 'SALURAN DEPAN', nilaiPekerjaan: 600000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'ACI + PLAMIR', nilaiPekerjaan: 800000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'CAT DINDING & KUSENG', nilaiPekerjaan: 1200000 },
            { kategoriPekerjaan: 'listrik', itemPekerjaan: 'PEK. LISTRIK', nilaiPekerjaan: 500000 },
            { kategoriPekerjaan: 'atap', itemPekerjaan: 'RANGKA+ATAP+LIST', nilaiPekerjaan: 1500000 },
            { kategoriPekerjaan: 'plafon', itemPekerjaan: 'PEK PLAFON + CAT', nilaiPekerjaan: 1500000 },
            { kategoriPekerjaan: 'pembersihan', itemPekerjaan: 'PEMBERSIHAN LUAR + DALAM', nilaiPekerjaan: 200000 },
            { kategoriPekerjaan: 'struktur', itemPekerjaan: 'DRAINASE BELAKANG', nilaiPekerjaan: 300000 },
          ];

          // Helper to map and retrieve the assigned worker's phone number
          const getAssignedWorker = (category: 'struktur' | 'plafon' | 'atap' | 'listrik' | 'pembersihan' | 'drainase') => {
            let assignedName = '';
            if (category === 'struktur') assignedName = workerStruktur || '';
            else if (category === 'atap') assignedName = workerAtap || '';
            else if (category === 'plafon') assignedName = workerPlafon || '';
            else if (category === 'listrik') assignedName = workerListrik || '';
            else if (category === 'pembersihan') assignedName = workerPembersihan || '';
            else if (category === 'drainase') assignedName = workerDrainase || '';

            assignedName = assignedName.trim();
            if (!assignedName) {
              return { name: 'Belum Ditunjuk', noHp: '-' };
            }

            const found = progresList.find(p => p.namaTukang?.toLowerCase() === assignedName.toLowerCase());
            return {
              name: assignedName,
              noHp: found ? found.noHp || '-' : '-',
            };
          };

          const seededProgresList: ProgresPekerjaan[] = templates.map((t, idx) => {
            const seedId = `prog-${generatedId}-${idx}`;
            const worker = getAssignedWorker(t.kategoriPekerjaan);
            return {
              id: seedId,
              blokRumah: newKonstruksi.id,
              namaTukang: worker.name,
              noHp: worker.noHp,
              kategoriPekerjaan: t.kategoriPekerjaan,
              itemPekerjaan: t.itemPekerjaan,
              persentasiProgres: 0,
              nilaiPekerjaan: t.nilaiPekerjaan,
              totalNilaiPekerjaan: 0,
              catatan: 'Dibuat otomatis dari template standard.',
            };
          });

          // Update React State
          setProgresList(prev => [...seededProgresList, ...prev]);

          // Insert seeded items to Supabase
          supabase.from('progres_pekerjaan').insert(seededProgresList).then(({ error }) => {
            if (error) console.warn('Supabase insert seeded progres failed:', error.message);
          });
        }
        break;
      }
      case 'progres': {
        const itemValCalculated = data.nilaiPekerjaan * (data.persentasiProgres / 100);
        const newProgres: ProgresPekerjaan = {
          id: `prog-${generatedId}`,
          blokRumah: data.blokRumah,
          namaTukang: data.namaTukang,
          noHp: data.noHp || '0812...',
          kategoriPekerjaan: data.kategoriPekerjaan,
          itemPekerjaan: data.itemPekerjaan,
          persentasiProgres: data.persentasiProgres,
          nilaiPekerjaan: data.nilaiPekerjaan,
          totalNilaiPekerjaan: Math.round(itemValCalculated),
          catatan: data.catatan || 'Di-input via System.',
        };
        setProgresList(prev => [newProgres, ...prev]);
        showToast(`Sukses mencatat progres pekerjaan ${newProgres.namaTukang} di Blok ${newProgres.blokRumah}.`);

        // Supabase Insert Table
        supabase.from('progres_pekerjaan').insert([newProgres]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'inventory': {
        const newInventory: Inventory = {
          id: `mat-${generatedId}`,
          namaMaterial: data.namaMaterial,
          idGudang: data.idGudang,
          jumlahStok: data.jumlahStok,
          satuan: data.satuan,
          minimumStock: data.minimumStock,
          harga: data.harga,
          kategoriMaterial: data.kategoriMaterial,
        };
        setInventoryList(prev => [newInventory, ...prev]);
        showToast(`Sukses menambahkan material baru: ${newInventory.namaMaterial}.`);

        // Supabase Insert Table
        supabase.from('inventory').insert([newInventory]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'gudang': {
        const newGudang: Gudang = {
          id: `gud-${generatedId}`,
          namaGudang: data.namaGudang,
          lokasi: data.lokasi,
        };
        setGudangList(prev => [...prev, newGudang]);
        showToast(`Sukses meresmikan ${newGudang.namaGudang}!`);

        // Supabase Insert Table
        supabase.from('gudang').insert([newGudang]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'supplier': {
        const newSupplier: Supplier = {
          id: `sup-${generatedId}`,
          namaSupplier: data.namaSupplier,
          noHp: data.noHp,
          alamat: data.alamat,
        };
        setSupplierList(prev => [...prev, newSupplier]);
        showToast(`Sukses mendaftarkan Supplier ${newSupplier.namaSupplier}.`);

        // Supabase Insert Table
        supabase.from('suppliers').insert([newSupplier]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'transaksi': {
        const newTx: TransaksiMaterial = {
          id: `tx-${generatedId}`,
          namaMaterial: data.namaMaterial,
          namaGudang: data.namaGudang,
          blokRumah: data.type === 'masuk' ? '-' : data.blokRumah,
          type: data.type,
          jumlah: data.jumlah,
          tanggal: data.tanggal,
          catatan: data.catatan,
          supplier: data.type === 'masuk' ? (data.supplier || '') : '',
        };
        setTransaksiList(prev => [newTx, ...prev]);

        // INTELLIGENT WORKFLOW SIDE EFFECT: Update inventory quantities automatically!
        const matchedInv = inventoryList.find(
          inv => inv.namaMaterial.toLowerCase() === data.namaMaterial.toLowerCase()
        );

        if (matchedInv) {
          const numJumlah = Number(data.jumlah) || 0;
          const diff = data.type === 'masuk' ? numJumlah : -numJumlah;
          const updatedQty = Math.max(0, Math.round((matchedInv.jumlahStok + diff) * 1000) / 1000);

          setInventoryList(prevInv =>
            prevInv.map(inv =>
              inv.id === matchedInv.id ? { ...inv, jumlahStok: updatedQty } : inv
            )
          );

          // Update matching stock quantity in Database
          supabase.from('inventory')
            .update({ jumlahStok: updatedQty })
            .eq('id', matchedInv.id)
            .then(({ error }) => {
              if (error) console.warn('Supabase inventory sync failed:', error.message);
            });
        }

        showToast(`Sukses mendaftarkan transaksi mutasi ${data.namaMaterial}: ${data.jumlah} ${data.type}!`);

        // Supabase Insert Table
        supabase.from('transaksi_material').insert([newTx]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'pembayaran': {
        const newPayment: RincianPembayaran = {
          id: `pay-${generatedId}`,
          namaTukang: data.namaTukang,
          kategoriPekerjaan: data.kategoriPekerjaan,
          nilaiPembayaran: data.nilaiPembayaran,
          tanggalPembayaran: data.tanggalPembayaran,
          namaProjek: data.namaProjek,
          namaBlok: data.namaBlok,
        };
        setPembayaranList(prev => [newPayment, ...prev]);
        showToast(`Sukses merilis dana pembayaran Rp${data.nilaiPembayaran.toLocaleString()} ke pekerja ${data.namaTukang}.`);

        // Supabase Insert Table
        supabase.from('rincian_pembayaran').insert([newPayment]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'fee': {
        const newFee: FeeMarketing = {
          id: `fee-${generatedId}`,
          namaMarketing: data.namaMarketing,
          komisi: data.komisi,
          statusPembayaran: data.statusPembayaran,
          tanggalPembayaran: data.statusPembayaran === 'Lunas' ? today : '-',
          namaProjek: data.namaProjek,
          namaBlok: data.namaBlok,
        };
        setFeeList(prev => [newFee, ...prev]);
        showToast(`Komisi untuk marketing ${newFee.namaMarketing} dicatat.`);

        // Supabase Insert Table
        supabase.from('fee_marketing').insert([newFee]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'karyawan': {
        const newKar: Karyawan = {
          id: `kar-${generatedId}`,
          namaKaryawan: data.namaKaryawan,
          jabatan: data.jabatan,
          whatsup: data.whatsup || '',
          tanggalGabung: data.tanggalGabung,
        };
        setKaryawanList(prev => [...prev, newKar]);
        showToast(`Karyawan baru ${newKar.namaKaryawan} berhasil didaftarkan.`);

        // Supabase Insert Table
        supabase.from('karyawan').insert([newKar]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'absensi': {
        // Add optional/derived properties directly
        const cleanTanggal = normalizeDateString(data.tanggal) || today;
        const matchedKaryawan = karyawanList.find(k => k.id === data.karyawanId);
        const newAbsWithProps: AbsensiKaryawan = {
          id: `abs-${generatedId}`,
          tanggal: cleanTanggal,
          waktuCheckin: data.statusKehadiran === 'Hadir' ? data.waktuCheckin : '-',
          karyawanId: data.karyawanId,
          namaKaryawan: matchedKaryawan ? matchedKaryawan.namaKaryawan : 'Karyawan',
          statusKehadiran: data.statusKehadiran,
        };
        setAbsensiList(prev => [newAbsWithProps, ...prev]);
        showToast(`Absensi dicatat untuk karyawan.`);

        // Supabase Insert Table
        supabase.from('absensi_karyawan').insert([{
          id: newAbsWithProps.id,
          tanggal: newAbsWithProps.tanggal,
          waktuCheckin: newAbsWithProps.waktuCheckin,
          karyawanId: newAbsWithProps.karyawanId,
          statusKehadiran: newAbsWithProps.statusKehadiran
        }]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'absensi_pekerja': {
        const cleanTanggal = normalizeDateString(data.tanggal) || today;
        const newAbsP: AbsensiPekerja = {
          id: `absp-${generatedId}`,
          tanggal: cleanTanggal,
          namaTukang: data.namaTukang,
          statusKehadiran: data.statusKehadiran,
          keterangan: data.keterangan || '-',
        };
        setAbsensiPekerjaList(prev => [newAbsP, ...prev]);
        showToast(`Absensi dicatat untuk pekerja ${data.namaTukang}.`);

        // Supabase Insert Table
        supabase.from('absensi_pekerja').insert([newAbsP]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'lead': {
        const newLead: LeadPenjualan = {
          id: `led-${generatedId}`,
          namaCustomer: data.namaCustomer,
          namaProjek: data.namaProjek,
          namaBlok: data.namaBlok,
          namaMarketing: data.namaMarketing,
          leadStatus: data.leadStatus,
          noWhatsapp: data.noWhatsapp,
          tanggalInput: data.tanggalInput || today,
        };
        setLeadList(prev => [newLead, ...prev]);
        showToast(`Lead Customer ${newLead.namaCustomer} dicatat.`);

        // Supabase Insert Table
        supabase.from('leads_penjualan').insert([newLead]).then(({ error }) => {
          if (error) console.warn('Supabase insert failed:', error.message);
        });
        break;
      }
      case 'rab_template': {
        const newRab: RabTemplate = {
          id: `rab-${generatedId}`,
          namaRab: data.namaRab,
          keterangan: data.keterangan || '',
        };
        setRabTemplateList(prev => [...prev, newRab]);
        showToast(`Template RAB "${newRab.namaRab}" berhasil dibuat.`);
        supabase.from('rab_template').insert([newRab]).then(({ error }) => {
          if (error) console.warn('Supabase insert rab_template failed:', error.message);
        });
        break;
      }
      case 'rab_detail': {
        const newDetail: RabDetail = {
          id: `rabd-${generatedId}`,
          rabId: data.rabId,
          namaMaterial: data.namaMaterial,
          satuan: data.satuan || 'Pcs',
          qtyStandar: Number(data.qtyStandar) || 0,
        };
        setRabDetailList(prev => [...prev, newDetail]);
        showToast(`Standar material "${newDetail.namaMaterial}" ditambahkan ke RAB.`);
        supabase.from('rab_detail').insert([newDetail]).then(({ error }) => {
          if (error) console.warn('Supabase insert rab_detail failed:', error.message);
        });
        break;
      }
      default:
        break;
    }
  };

  const handleUpdateProjectRab = React.useCallback(async (projectId: string, rabId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, rabId } : p));
    showToast(`RAB Proyek berhasil dihubungkan!`);
    try {
      await supabase.from('projects').update({ rabId }).eq('id', projectId);
    } catch (err) {
      console.warn('Update project rab failed:', err);
    }
  }, []);

  const handleDeleteProject = React.useCallback(async (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    const unitsInProject = konstruksiList.filter(k => String(k.projectId).trim().toLowerCase() === String(id).trim().toLowerCase());
    if (unitsInProject.length > 0) {
      showToast(`Tidak dapat menghapus projek "${proj.name}". Masih terdapat ${unitsInProject.length} unit blok di projek ini.`);
      return;
    }
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId('all');
    }
    showToast(`Projek "${proj.name}" berhasil dihapus.`);
    try {
      await supabase.from('projects').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete project failed:', err);
    }
  }, [projects, konstruksiList, selectedProjectId]);

  const handleDeleteRabDetail = React.useCallback(async (id: string) => {
    setRabDetailList(prev => prev.filter(r => r.id !== id));
    showToast('Item standar RAB dihapus.');
    try {
      await supabase.from('rab_detail').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete rab_detail failed:', err);
    }
  }, []);

  // Helper selectors to quickly open modal
  const openModal = (type: typeof modalType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  if (!currentUser) {
    return (
      <LoginView 
        onLoginSuccess={(session) => {
          setCurrentUser(session);
          setActiveTab('dashboard');
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#e0e5ec] text-[#3e4a5b] font-sans">
      
      {/* Dynamic Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3.5 p-4 rounded-2xl bg-[#e0e5ec] shadow-[9px_9px_16px_rgba(163,177,198,0.55),-9px_-9px_16px_rgba(255,255,255,0.85)] border-l-4 border-l-emerald-500 max-w-sm animate-scale-up">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
          <div className="text-xs font-semibold">{toastMessage}</div>
        </div>
      )}

      {/* Main Structural Boundary */}
      <div className="flex min-h-screen">

        {/* 1. LEFT SIDEBAR - Desktop Neumorphic rail */}
        <aside className="hidden lg:flex flex-col w-72 bg-[#e0e5ec] shadow-[9px_9px_16px_rgba(163,177,198,0.55),-9px_-9px_16px_rgba(255,255,255,0.85)] m-4 mr-0 rounded-[28px] overflow-hidden p-6 gap-8 shrink-0">
          
          {/* Logo Brand Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#e0e5ec] text-black shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.85)] border border-slate-300/40 flex items-center justify-center">
                <Building size={22} className="text-black" />
              </div>
              <div>
                <h1 className="text-xl font-display font-black text-black tracking-tight leading-none mb-0.5">
                  SISPER<span className="text-black">.</span>
                </h1>
                <p className="text-[10px] uppercase font-black text-black tracking-widest font-sans">Perumahan Sektor Utama</p>
              </div>
            </div>
          </div>

          {/* Navigation group */}
          <div className="flex-1 flex flex-col gap-2.5">
            <span className="text-[10px] font-black text-black uppercase tracking-widest mb-1 px-2">Kategori Menu</span>
            
            {isTabAllowed('dashboard') && (
              <button
                onClick={() => navigateToTab('dashboard')}
                className={`w-full justify-start text-left flex items-center gap-3.5 px-4 py-3.5 text-xs sm:text-sm font-black rounded-2xl transition-all duration-150 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] text-black border border-slate-400/50'
                    : 'text-black hover:shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.7)] hover:text-black'
                }`}
              >
                <BarChart3 size={18} className="text-black" />
                Overview & Dashboard
              </button>
            )}

            {isTabAllowed('kpi') && (
              <button
                onClick={() => navigateToTab('kpi')}
                className={`w-full justify-start text-left flex items-center gap-3.5 px-4 py-3.5 text-xs sm:text-sm font-black rounded-2xl transition-all duration-150 cursor-pointer ${
                  activeTab === 'kpi'
                    ? 'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] text-black border border-slate-400/50'
                    : 'text-black hover:shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.7)] hover:text-black'
                }`}
              >
                <Gauge size={18} className="text-black" />
                KPI
              </button>
            )}

            {isTabAllowed('konstruksi') && (
              <button
                onClick={() => navigateToTab('konstruksi')}
                className={`w-full justify-start text-left flex items-center gap-3.5 px-4 py-3.5 text-xs sm:text-sm font-black rounded-2xl transition-all duration-150 cursor-pointer ${
                  activeTab === 'konstruksi'
                    ? 'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] text-black border border-slate-400/50'
                    : 'text-black hover:shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.7)] hover:text-black'
                }`}
              >
                <Building size={18} className="text-black" />
                Pekerjaan Konstruksi
              </button>
            )}

            {isTabAllowed('logistik') && (
              <button
                onClick={() => navigateToTab('logistik')}
                className={`w-full justify-start text-left flex items-center gap-3.5 px-4 py-3.5 text-xs sm:text-sm font-black rounded-2xl transition-all duration-150 cursor-pointer ${
                  activeTab === 'logistik'
                    ? 'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] text-black border border-slate-400/50'
                    : 'text-black hover:shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.7)] hover:text-black'
                }`}
              >
                <Warehouse size={18} className="text-black" />
                Logistik & Gudang
              </button>
            )}

            {isTabAllowed('marketing') && (
              <button
                onClick={() => navigateToTab('marketing')}
                className={`w-full justify-start text-left flex items-center gap-3.5 px-4 py-3.5 text-xs sm:text-sm font-black rounded-2xl transition-all duration-150 cursor-pointer ${
                  activeTab === 'marketing'
                    ? 'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] text-black border border-slate-400/50'
                    : 'text-black hover:shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.7)] hover:text-black'
                }`}
              >
                <TrendingUp size={18} className="text-black" />
                Marketing & Penjualan
              </button>
            )}

            {isTabAllowed('operasional') && (
              <button
                onClick={() => navigateToTab('operasional')}
                className={`w-full justify-start text-left flex items-center gap-3.5 px-4 py-3.5 text-xs sm:text-sm font-black rounded-2xl transition-all duration-150 cursor-pointer ${
                  activeTab === 'operasional'
                    ? 'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] text-black border border-slate-400/50'
                    : 'text-black hover:shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.7)] hover:text-black'
                }`}
              >
                <Users size={18} className="text-black" />
                Data karyawan & pekerja
              </button>
            )}
          </div>

           {/* User profile segment */}
          <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.55),inset_-4px_-4px_8px_rgba(255,255,255,0.85)] flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_rgba(163,177,198,0.45),-3px_-3px_6px_rgba(255,255,255,0.85)] text-black font-bold flex items-center justify-center text-xs shrink-0 border border-slate-300/40">
                {currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-black truncate">{currentUser?.name}</h4>
                <p className="text-[9px] text-black font-black uppercase tracking-wider truncate">{currentUser?.roleLabel}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setCurrentUser(null);
                setActiveTab('dashboard');
              }}
              className="mt-0.5 flex items-center justify-center gap-1.5 w-full py-2 bg-[#e0e5ec] text-black shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.85)] hover:shadow-[1px_1px_3px_rgba(163,177,198,0.5),-1px_-1px_3px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] hover:text-black transition duration-150 rounded-xl text-xs font-bold cursor-pointer"
            >
              <LogOut size={13} className="text-black" />
              <span>Logout</span>
            </button>

            <div className="flex items-center gap-1.5 text-[10px] text-black font-mono mt-1 pt-2 border-t border-slate-300/40">
              <Clock size={11} className="text-black" />
              <span>{currentTime || 'Syncing...'}</span>
            </div>
          </div>
        </aside>

        {/* 2. MAIN HEADER AND TAB PAGES SCROLLABLE ZONE */}
        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto max-w-full lg:max-w-[calc(100%-18rem)]">
          
          {/* Header Mobile Toolbar / Brand bar */}
          <header className="flex lg:hidden items-center justify-between mb-5 p-4 rounded-2xl bg-[#e0e5ec] shadow-[5px_5px_10px_rgba(163,177,198,0.5),-5px_-5px_10px_rgba(255,255,255,0.85)]">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-[#e0e5ec] text-black shadow-[3px_3px_6px_rgba(163,177,198,0.45),-3px_-3px_6px_rgba(255,255,255,0.85)] flex items-center justify-center">
                <Building size={16} />
              </div>
              <h1 className="text-md font-display font-black text-black">SISPER<span className="text-black">.</span></h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSheetSetupOpen(true)}
                className="p-2.5 bg-[#e0e5ec] shadow-[3px_3px_6px_rgba(163,177,198,0.45),-3px_-3px_6px_rgba(255,255,255,0.85)] rounded-xl text-black cursor-pointer"
                title="Konfigurasi Google Sheets"
              >
                <FileSpreadsheet size={18} />
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2.5 bg-[#e0e5ec] shadow-[3px_3px_6px_rgba(163,177,198,0.45),-3px_-3px_6px_rgba(255,255,255,0.85)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] rounded-xl text-black cursor-pointer"
              >
                <Menu size={18} />
              </button>
            </div>
          </header>

          {/* Desktop Navigation Top Summary / Filters */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-black text-black tracking-tight flex items-center gap-2.5">
                <span>Sistem Informasi Perumahan</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-300/60 text-black border border-slate-400/40">
                  SISPER
                </span>
              </h2>
              <p className="text-xs text-black font-semibold mt-0.5">Pengawasan Progres Lapangan, Logistik Gudang & Pipeline Penjualan</p>
            </div>
            <button
              onClick={() => setIsSheetSetupOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#e0e5ec] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.85)] hover:shadow-[2px_2px_4px_rgba(163,177,198,0.5),-2px_-2px_4px_rgba(255,255,255,0.9)] text-xs font-black text-black hover:text-black transition cursor-pointer border border-slate-300/40"
            >
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              <FileSpreadsheet size={16} className="text-black" />
              <span>{getAppsScriptUrl() ? 'Google Sheets Aktif' : 'Hubungkan Google Sheets'}</span>
            </button>
          </div>

          {/* Active Workspaces Render Context */}
          <div className="flex-1 min-h-[500px]">
            {activeTab === 'dashboard' && (
              <DashboardView 
                projects={projects}
                konstruksiList={konstruksiList}
                inventoryList={inventoryList}
                progresList={progresList}
                absensiList={absensiList}
                absensiPekerjaList={absensiPekerjaList}
                transaksiList={transaksiList}
                rabTemplateList={rabTemplateList}
                rabDetailList={rabDetailList}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                onAddProject={() => openModal('project')}
                onNavigate={navigateToTab}
              />
            )}

            {activeTab === 'kpi' && (
              <KpiView 
                projects={projects}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                inventoryList={inventoryList}
                konstruksiList={konstruksiList}
                transaksiList={transaksiList}
                rabTemplateList={rabTemplateList}
                rabDetailList={rabDetailList}
                progresList={progresList}
                karyawanList={karyawanList}
                absensiList={absensiList}
                pekerjaList={pekerjaList}
                absensiPekerjaList={absensiPekerjaList}
                onNavigateTab={(tab, options) => {
                  if (typeof options === 'string') {
                    navigateToTab(tab, { subTab: options });
                  } else {
                    navigateToTab(tab, options);
                  }
                }}
              />
            )}

            {activeTab === 'konstruksi' && (
              <ConstructionView 
                projects={projects}
                konstruksiList={konstruksiList}
                progresList={progresList}
                transaksiList={transaksiList}
                inventoryList={inventoryList}
                pembayaranList={pembayaranList}
                selectedProjectId={selectedProjectId}
                onAddKonstruksi={() => openModal('konstruksi')}
                onAddProgres={() => openModal('progres')}
                onAddPembayaran={() => openModal('pembayaran')}
                onAddProject={() => openModal('project')}
                onDeleteProject={handleDeleteProject}
                onUpdateProjectRab={handleUpdateProjectRab}
                onSelectProject={(id) => setSelectedProjectId(id)}
                onUpdateProgres={handleUpdateProgres}
                onUpdateKonstruksiStatus={handleUpdateKonstruksiStatus}
                onUpdateKonstruksiSaleStatus={handleUpdateKonstruksiSaleStatus}
                initialSubTab={initialConstructionSubTab}
                initialSearchQuery={initialConstructionSearchQuery}
                initialStatusFilter={initialConstructionStatusFilter}
                pekerjaList={pekerjaList}
                rabTemplateList={rabTemplateList}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'logistik' && (
              <LogistikView 
                inventoryList={inventoryList}
                gudangList={gudangList}
                supplierList={supplierList}
                transaksiList={transaksiList}
                konstruksiList={konstruksiList}
                projects={projects}
                rabTemplateList={rabTemplateList}
                rabDetailList={rabDetailList}
                initialSubTab={initialLogistikSubTab}
                initialSelectedUnit={initialLogistikSelectedUnit}
                initialRekapViewMode={initialLogistikRekapViewMode}
                onAddInventory={() => openModal('inventory')}
                onAddGudang={() => openModal('gudang')}
                onAddSupplier={() => openModal('supplier')}
                onAddTransaksi={() => openModal('transaksi')}
                onAddRabTemplate={() => openModal('rab_template')}
                onAddRabDetail={(rabId) => {
                  setSelectedDefaultRabId(rabId || rabTemplateList[0]?.id || '');
                  openModal('rab_detail');
                }}
                onUpdateProjectRab={handleUpdateProjectRab}
                onDeleteRabDetail={handleDeleteRabDetail}
              />
            )}

            {activeTab === 'marketing' && (
              <MarketingView 
                leadList={leadList}
                feeList={feeList}
                onAddLead={() => openModal('lead')}
                onAddFee={() => openModal('fee')}
                onUpdateLeadStatus={handleUpdateLeadStatus}
                onUpdateFeeStatus={handleUpdateFeeStatus}
              />
            )}

            {activeTab === 'operasional' && (
              <OperasionalView 
                karyawanList={karyawanList}
                absensiList={absensiList}
                absensiPekerjaList={absensiPekerjaList}
                progresList={progresList}
                pekerjaList={pekerjaList}
                onAddKaryawan={() => openModal('karyawan')}
                onAddAbsensi={() => openModal('absensi')}
                onAddAbsensiPekerja={() => openModal('absensi_pekerja')}
                onAddPekerja={handleAddPekerja}
                initialSubTab={initialOperasionalSubTab}
                initialSearchQuery={initialOperasionalSearchQuery}
              />
            )}
          </div>
        </main>

      </div>

      {/* 3. MOBILE MENU BACKDROP / DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="w-72 bg-white/95 backdrop-blur-xl h-full p-6 flex flex-col gap-6 shadow-2xl animate-slide-in">
            
            {/* Header drawer */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500 rounded-lg text-white">
                  <Building size={16} />
                </div>
                <h2 className="text-md font-display font-black text-slate-800">SISPER Menu</h2>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex-1 flex flex-col gap-2">
              {isTabAllowed('dashboard') && (
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3.5 text-xs sm:text-sm font-black rounded-xl transition ${
                    activeTab === 'dashboard' ? 'bg-slate-200/90 text-black' : 'text-black hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <BarChart3 size={16} className="text-black" />
                  Overview & Dashboard
                </button>
              )}

              {isTabAllowed('kpi') && (
                <button
                  onClick={() => { setActiveTab('kpi'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3.5 text-xs sm:text-sm font-black rounded-xl transition ${
                    activeTab === 'kpi' ? 'bg-slate-200/90 text-black' : 'text-black hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <Gauge size={16} className="text-black" />
                  KPI
                </button>
              )}

              {isTabAllowed('konstruksi') && (
                <button
                  onClick={() => { setActiveTab('konstruksi'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3.5 text-xs sm:text-sm font-black rounded-xl transition ${
                    activeTab === 'konstruksi' ? 'bg-slate-200/90 text-black' : 'text-black hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <Building size={16} className="text-black" />
                  Pekerjaan Konstruksi
                </button>
              )}

              {isTabAllowed('logistik') && (
                <button
                  onClick={() => { setActiveTab('logistik'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3.5 text-xs sm:text-sm font-black rounded-xl transition ${
                    activeTab === 'logistik' ? 'bg-slate-200/90 text-black' : 'text-black hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <Warehouse size={16} className="text-black" />
                  Logistik & Gudang
                </button>
              )}

              {isTabAllowed('marketing') && (
                <button
                  onClick={() => { setActiveTab('marketing'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3.5 text-xs sm:text-sm font-black rounded-xl transition ${
                    activeTab === 'marketing' ? 'bg-slate-200/90 text-black' : 'text-black hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <TrendingUp size={16} className="text-black" />
                  Marketing & Penjualan
                </button>
              )}

              {isTabAllowed('operasional') && (
                <button
                  onClick={() => { setActiveTab('operasional'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3.5 text-xs sm:text-sm font-black rounded-xl transition ${
                    activeTab === 'operasional' ? 'bg-slate-200/90 text-black' : 'text-black hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <Users size={16} className="text-black" />
                  Data karyawan & pekerja
                </button>
              )}
            </div>

            {/* Mobile Profile & Logout */}
            <div className="border-t border-slate-200 pt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-300 text-black font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-black truncate">{currentUser?.name}</h4>
                  <p className="text-[9px] text-black font-black uppercase tracking-wider truncate">{currentUser?.roleLabel}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-black rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
              >
                <LogOut size={13} className="text-black" />
                <span>Logout</span>
              </button>
            </div>

            {/* Footer drawer */}
            <div className="border-t border-slate-200 pt-4 text-xs font-mono text-black">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-black" />
                <span>{currentTime || 'UTC Sync'}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. DYNAMIC SYSTEM MODAL (Adapts inputs based on active record trigger type) */}
      <AddRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        projects={projects}
        gudangList={gudangList}
        karyawanList={karyawanList}
        konstruksiList={konstruksiList}
        inventoryList={inventoryList}
        progresList={progresList}
        pekerjaList={pekerjaList}
        supplierList={supplierList}
        rabTemplateList={rabTemplateList}
        rabDetailList={rabDetailList}
        transaksiList={transaksiList}
        defaultRabId={selectedDefaultRabId}
        onSave={handleSaveModal}
        onOpenAddProject={() => openModal('project')}
      />

      <GoogleSheetSetupModal
        isOpen={isSheetSetupOpen}
        onClose={() => setIsSheetSetupOpen(false)}
        onSyncSuccess={() => {
          loadSupabaseData();
          showToast('Sinkronisasi Google Sheets berhasil diperbarui!');
        }}
      />

    </div>
  );
}
