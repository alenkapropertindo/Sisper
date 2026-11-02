import React from 'react';
import { 
  DollarSign, 
  Search, 
  PlusCircle, 
  Filter, 
  Wallet,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { FeeMarketing } from '../types';

interface FeeMarketingViewProps {
  feeList: FeeMarketing[];
  onAddFee: () => void;
  hideHeader?: boolean;
  onUpdateStatus?: (id: string, newStatus: FeeMarketing['statusPembayaran']) => void;
}

export default function FeeMarketingView({
  feeList,
  onAddFee,
  hideHeader = false,
  onUpdateStatus
}: FeeMarketingViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedMonth, setSelectedMonth] = React.useState('all');
  const [hasSetDefault, setHasSetDefault] = React.useState(false);

  // Currency formatter
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

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

  // Extract all unique months from feeList
  const availableMonths = React.useMemo(() => {
    const list = new Set<string>();
    feeList.forEach(f => {
      if (f.tanggalPembayaran && f.tanggalPembayaran.match(/^\d{4}-\d{2}/)) {
        list.add(f.tanggalPembayaran.slice(0, 7));
      }
    });
    return Array.from(list).sort().reverse();
  }, [feeList]);

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

  // Filter by month first (if not 'all', matches start of tanggalPembayaran)
  const monthlyFees = React.useMemo(() => {
    if (selectedMonth === 'all') return feeList;
    return feeList.filter(f => f.tanggalPembayaran && f.tanggalPembayaran.startsWith(selectedMonth));
  }, [feeList, selectedMonth]);

  // Metric Calculation based on monthlyFees
  const totalCommissionVal = monthlyFees.reduce((sum, f) => sum + f.komisi, 0);
  const totalPaidVal = monthlyFees.filter(f => f.statusPembayaran === 'Lunas').reduce((sum, f) => sum + f.komisi, 0);
  const totalPendingVal = monthlyFees.filter(f => f.statusPembayaran !== 'Lunas').reduce((sum, f) => sum + f.komisi, 0);
  const paidCount = monthlyFees.filter(f => f.statusPembayaran === 'Lunas').length;
  const pendingCount = monthlyFees.filter(f => f.statusPembayaran !== 'Lunas').length;

  const filteredFee = React.useMemo(() => {
    return monthlyFees.filter(f => {
      const matchSearch = f.namaMarketing.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || f.statusPembayaran === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [monthlyFees, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Title block */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/55 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm">
          <div>
            <h3 className="text-lg font-display font-extrabold text-slate-800 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-500" />
              Fee & Komisi Marketing
            </h3>
            <p className="text-xs text-slate-400 font-medium font-sans">Kelola Catatan Insentif Agen, Progress Pembayaran, dan Realisasi Pencairan Komisi</p>
          </div>
          
          <button
            onClick={onAddFee}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle size={15} />
            Input Komisi Baru
          </button>
        </div>
      )}

      {/* Numerical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total volume */}
        <div className="p-5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume Komisi</p>
            <h4 className="text-lg font-black font-display text-slate-800">{formatRupiah(totalCommissionVal)}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">{feeList.length} Transaksi</p>
          </div>
        </div>

        {/* Lunas Paid volume */}
        <div className="p-5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sudah Terbayarkan (Lunas)</p>
            <h4 className="text-lg font-black font-display text-emerald-600">{formatRupiah(totalPaidVal)}</h4>
            <p className="text-[10px] text-emerald-400 mt-0.5">{paidCount} Agen Lunas</p>
          </div>
        </div>

        {/* Pending volume */}
        <div className="p-5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Belum Dibayar (Pending)</p>
            <h4 className="text-lg font-black font-display text-rose-500">{formatRupiah(totalPendingVal)}</h4>
            <p className="text-[10px] text-rose-400 mt-0.5">{pendingCount} Menunggu Approval</p>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari Agen Marketing Specialist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Filter size={16} className="text-slate-400" />
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-xl px-3 py-2 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-medium"
          >
            <option value="all">Semua Status Pembayaran</option>
            <option value="Lunas">Lunas (Selesai Cair)</option>
            <option value="Pending">Pending (Outstanding)</option>
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

      {/* Main Ledger Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-display font-medium">
              <th className="p-4">Nama Marketing Specialist</th>
              <th className="p-4">Blok & Perumahan</th>
              <th className="p-4 text-right">Nilai Komisi & Status</th>
              <th className="p-4">Tanggal Pembayaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
            {filteredFee.map((f) => (
              <tr key={f.id} className="hover:bg-white/40 transition">
                <td className="p-4">
                  <div className="font-display font-bold text-slate-800 text-sm">{f.namaMarketing}</div>
                  <div className="mt-1.5">
                    {f.noWhatsapp ? (
                      <a
                        href={`https://wa.me/${f.noWhatsapp.replace(/\D/g, '').replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all font-sans font-extrabold hover:-translate-y-0.5 cursor-pointer"
                        id={`wa-marketing-${f.id}`}
                      >
                        <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.747 1.451 5.436.002 9.851-4.382 9.855-9.764.002-2.607-1.01-5.059-2.85-6.902C16.599 2.097 14.153 1.084 11.55 1.084c-5.438 0-9.853 4.384-9.857 9.767a9.61 9.61 0 0 0 1.488 4.887l-.976 3.566 3.651-.958zM16.14 13.911c-.248-.124-1.472-.729-1.7-.811-.228-.084-.393-.124-.559.124-.166.248-.642.812-.787.977-.145.166-.29.186-.539.063-.248-.124-1.05-.386-2-1.234-.738-.657-1.238-1.472-1.383-1.72-.145-.248-.015-.381.11-.504.111-.11.248-.29.373-.435.124-.145.166-.248.248-.415.083-.166.042-.311-.02-.435-.062-.124-.559-1.349-.766-1.849-.2-.486-.403-.421-.559-.429H8.38c-.166 0-.435.062-.663.311-.228.248-.87.851-.87 2.075 0 1.224.891 2.406.99 2.551.1.145 1.751 2.674 4.243 3.748.592.256 1.055.409 1.414.523.596.19 1.138.163 1.567.099.479-.072 1.472-.601 1.679-1.151.207-.55.207-1.023.145-1.124-.062-.1-.228-.166-.476-.29z"/>
                        </svg>
                        <span>{f.noWhatsapp}</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono italic">WA Tidak Ada</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-slate-700">Blok {f.namaBlok || 'A-01'}</div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans">{f.namaProjek || 'Permata Hijau Residence'}</div>
                </td>
                <td className="p-4 text-right">
                  <div className="mb-1 flex justify-end">
                    <select
                      value={f.statusPembayaran}
                      onChange={(e) => onUpdateStatus?.(f.id, e.target.value as any)}
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm transition-all ${
                        f.statusPembayaran === 'Lunas'
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-400/20'
                          : 'bg-rose-500/15 text-rose-600 border-rose-400/20'
                      }`}
                    >
                      <option className="bg-white text-slate-800 font-sans" value="Lunas">LUNAS</option>
                      <option className="bg-white text-slate-800 font-sans" value="Belum Bayar">BELUM BAYAR</option>
                    </select>
                  </div>
                  <div className="font-mono text-sm font-bold text-indigo-700">
                    {formatRupiah(f.komisi)}
                  </div>
                </td>
                <td className="p-4 text-xs font-mono text-slate-400">
                  {f.statusPembayaran === 'Lunas' ? f.tanggalPembayaran : 'Waiting approval / Pending'}
                </td>
              </tr>
            ))}

            {filteredFee.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">
                  Tidak ada catatan komisi yang cocok dengan kriteria pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
