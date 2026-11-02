import React from 'react';
import { 
  TrendingUp, 
  Search, 
  PlusCircle, 
  Filter, 
  TrendingDown, 
  FolderIcon, 
  Sparkles,
  Award,
  CircleDollarSign,
  AlertCircle
} from 'lucide-react';
import { LeadPenjualan } from '../types';

interface LeadsViewProps {
  leadList: LeadPenjualan[];
  onAddLead: () => void;
  hideHeader?: boolean;
  onUpdateStatus?: (id: string, newStatus: LeadPenjualan['leadStatus']) => void;
}

export default function LeadsView({
  leadList,
  onAddLead,
  hideHeader = false,
  onUpdateStatus
}: LeadsViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedMonth, setSelectedMonth] = React.useState('all');
  const [hasSetDefault, setHasSetDefault] = React.useState(false);

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

  // Extract all unique months from leadList based on tanggalInput
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    leadList.forEach(l => {
      if (l.tanggalInput && l.tanggalInput.match(/^\d{4}-\d{2}/)) {
        monthsSet.add(l.tanggalInput.slice(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [leadList]);

  // Set default month to current month or latest month
  React.useEffect(() => {
    if (availableMonths.length > 0 && !hasSetDefault) {
      const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-05"
      if (availableMonths.includes(currentMonth)) {
        setSelectedMonth(currentMonth);
      } else {
        setSelectedMonth(availableMonths[0]);
      }
      setHasSetDefault(true);
    }
  }, [availableMonths, hasSetDefault]);

  // Filter leads first by month if not 'all'
  const monthlyLeads = React.useMemo(() => {
    if (selectedMonth === 'all') return leadList;
    return leadList.filter(l => l.tanggalInput && l.tanggalInput.startsWith(selectedMonth));
  }, [leadList, selectedMonth]);

  // Calculates metrics based on monthlyLeads
  const totalLeads = monthlyLeads.length;
  const countAkad = monthlyLeads.filter(l => l.leadStatus === 'akad').length;
  const countBooking = monthlyLeads.filter(l => l.leadStatus === 'booking').length;
  const countDPOrProcess = monthlyLeads.filter(l => l.leadStatus === 'dp' || l.leadStatus === 'pmberkasan').length;

  const filteredLeads = React.useMemo(() => {
    return monthlyLeads.filter(l => {
      const matchSearch = 
        l.namaCustomer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.namaProjek.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.namaMarketing.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || l.leadStatus === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [monthlyLeads, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Upper Title Row */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/55 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm">
          <div>
            <h3 className="text-lg font-display font-extrabold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-500" />
              Lead & Pipeline Penjualan
            </h3>
            <p className="text-xs text-slate-400 font-medium font-sans">Sistem Monitoring Prospek, Booking, DP, hingga Akad Penjualan Unit</p>
          </div>
          
          <button
            onClick={onAddLead}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle size={15} />
            Input Customer Lead Baru
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lead */}
        <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
            <FolderIcon size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</p>
            <h4 className="text-xl font-black font-display text-slate-800">{totalLeads} <span className="text-xs font-semibold text-slate-400">Prospek</span></h4>
          </div>
        </div>

        {/* Lead Akad (Success) */}
        <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sudah Akad</p>
            <h4 className="text-xl font-black font-display text-emerald-600">{countAkad} <span className="text-xs font-semibold text-emerald-400">Unit</span></h4>
          </div>
        </div>

        {/* Lead Booking */}
        <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Fee</p>
            <h4 className="text-xl font-black font-display text-blue-600">{countBooking} <span className="text-xs font-semibold text-blue-400">Unit</span></h4>
          </div>
        </div>

        {/* Lead DP & Process */}
        <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <CircleDollarSign size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DP & Pemberkasan</p>
            <h4 className="text-xl font-black font-display text-purple-600">{countDPOrProcess} <span className="text-xs font-semibold text-purple-400">Unit</span></h4>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari Customer, Projek, atau Nama Marketing..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2 bg-white/70 border border-slate-250 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Filter size={16} className="text-slate-400" />
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-xl px-3 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-medium capitalize"
          >
            <option value="all">Semua Status Pipeline</option>
            <option value="prospek">Prospek</option>
            <option value="booking">Booking Fee</option>
            <option value="dp">Pembayaran DP</option>
            <option value="pmberkasan">Pemberkasan</option>
            <option value="akad">Akad Kredit (Selesai)</option>
            <option value="batal">Dibatalkan</option>
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs sm:text-sm rounded-xl px-3 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-medium"
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatIndoMonth(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table List element */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-display font-medium">
              <th className="p-4">Customer</th>
              <th className="p-4">Target Unit & Blok</th>
              <th className="p-4">Marketing Assignee</th>
              <th className="p-4 text-center">Status & Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLeads.map((led) => {
              return (
                <tr key={led.id} className="hover:bg-white/40 transition">
                  <td className="p-4 font-display font-bold text-slate-900 text-sm">
                    {led.namaCustomer}
                    <div className="mt-1.5 font-sans">
                      {led.noWhatsapp ? (
                        <a
                          href={`https://wa.me/${String(led.noWhatsapp).replace(/\D/g, '').replace(/^(0|8)/, (m) => (m === '0' ? '62' : '628'))}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-2 text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all font-sans font-extrabold hover:-translate-y-0.5 cursor-pointer"
                          id={`wa-lead-${led.id}`}
                        >
                          <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.747 1.451 5.436.002 9.851-4.382 9.855-9.764.002-2.607-1.01-5.059-2.85-6.902C16.599 2.097 14.153 1.084 11.55 1.084c-5.438 0-9.853 4.384-9.857 9.767a9.61 9.61 0 0 0 1.488 4.887l-.976 3.566 3.651-.958zM16.14 13.911c-.248-.124-1.472-.729-1.7-.811-.228-.084-.393-.124-.559.124-.166.248-.642.812-.787.977-.145.166-.29.186-.539.063-.248-.124-1.05-.386-2-1.234-.738-.657-1.238-1.472-1.383-1.72-.145-.248-.015-.381.11-.504.111-.11.248-.29.373-.435.124-.145.166-.248.248-.415.083-.166.042-.311-.02-.435-.062-.124-.559-1.349-.766-1.849-.2-.486-.403-.421-.559-.429H8.38c-.166 0-.435.062-.663.311-.228.248-.87.851-.87 2.075 0 1.224.891 2.406.99 2.551.1.145 1.751 2.674 4.243 3.748.592.256 1.055.409 1.414.523.596.19 1.138.163 1.567.099.479-.072 1.472-.601 1.679-1.151.207-.55.207-1.023.145-1.124-.062-.1-.228-.166-.476-.29z"/>
                          </svg>
                          <span>{led.noWhatsapp}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono italic">WA Tidak Ada</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-700">Blok {led.namaBlok}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-sans">{led.namaProjek}</div>
                  </td>
                  <td className="p-4 text-slate-600 text-xs font-semibold">{led.namaMarketing}</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1.5 justify-center">
                      <select
                        value={led.leadStatus}
                        onChange={(e) => onUpdateStatus?.(led.id, e.target.value as any)}
                        className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm transition-all ${
                          led.leadStatus === 'akad'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : led.leadStatus === 'batal'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : led.leadStatus === 'booking'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : led.leadStatus === 'dp'
                            ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
                            : led.leadStatus === 'pmberkasan'
                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                        }`}
                      >
                        <option className="bg-white text-slate-800 font-sans" value="booking">BOOKING</option>
                        <option className="bg-white text-slate-800 font-sans" value="dp">DP</option>
                        <option className="bg-white text-slate-800 font-sans" value="pmberkasan">PEMBERKASAN</option>
                        <option className="bg-white text-slate-800 font-sans" value="tunggu akad">TUNGGU AKAD</option>
                        <option className="bg-white text-slate-800 font-sans" value="akad">AKAD</option>
                        <option className="bg-white text-slate-800 font-sans" value="batal">BATAL</option>
                      </select>
                      <span className="text-[10px] font-mono text-slate-400">
                        Update: {led.tanggalInput || '-'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">
                  Tidak ada lead penjualan yang cocok dengan filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
