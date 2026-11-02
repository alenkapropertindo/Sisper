import React from 'react';
import { 
  Receipt, 
  DollarSign, 
  CreditCard, 
  Search, 
  PlusCircle, 
  Activity, 
  HelpCircle,
  TrendingDown, 
  UserCheck 
} from 'lucide-react';
import { OpnameTukang, RincianPembayaran, ProgresPekerjaan } from '../types';

interface FinansialViewProps {
  progresList: ProgresPekerjaan[];
  pembayaranList: RincianPembayaran[];
  onAddPembayaran: () => void;
}

export default function FinansialView({
  progresList,
  pembayaranList,
  onAddPembayaran
}: FinansialViewProps) {
  const [subTab, setSubTab] = React.useState<'opname' | 'rincian'>('opname');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Currency utility helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // 1. Dynamic Opname Tukang Engine
  // Instead of static lists, we compute Opname Tukang LIVE from ProgresPekerjaan!
  // This complies with user guideline: "(ambil jumlah total nilai pekerjaan dengan id tukang yang sama pada tabel progres pekerjaan)"
  const opnameTukangList = React.useMemo(() => {
    // Group tasks on ProgresPekerjaan by Tukang name + category
    const tukangGroups: { [key: string]: {
      id: string;
      namaTukang: string;
      kategoriPekerjaan: string;
      blokId: string;
      projectId: string;
      totalValue: number;
      tanggalMulai: string;
    }} = {};

    progresList.forEach((prog, index) => {
      const key = `${prog.namaTukang}::${prog.kategoriPekerjaan}`;
      if (!tukangGroups[key]) {
        // Find if we have some starting date or fallback
        tukangGroups[key] = {
          id: `opn-${index + 1}`,
          namaTukang: prog.namaTukang,
          kategoriPekerjaan: prog.kategoriPekerjaan,
          blokId: prog.blokRumah,
          projectId: prog.blokRumah.startsWith('A') ? 'prj-01' : prog.blokRumah.startsWith('B') ? 'prj-02' : 'prj-03',
          totalValue: 0,
          tanggalMulai: '2026-02-15' // fallback date
        };
      }
      tukangGroups[key].totalValue += prog.totalNilaiPekerjaan;
    });

    // Translate to OpnameTukang structural representation, calculating paid value
    return Object.values(tukangGroups).map((g) => {
      // Find sum of matching payments for this worker + category
      const payments = pembayaranList
        .filter(p => p.namaTukang.toLowerCase() === g.namaTukang.toLowerCase() && p.kategoriPekerjaan.toLowerCase() === g.kategoriPekerjaan.toLowerCase())
        .reduce((sum, p) => sum + p.nilaiPembayaran, 0);

      const unpaid = Math.max(0, g.totalValue - payments);
      const paidPct = g.totalValue > 0 ? Math.round((payments / g.totalValue) * 100) : 0;

      return {
        id: g.id,
        projectId: g.projectId,
        blokId: g.blokId,
        namaTukang: g.namaTukang,
        kategoriPekerjaan: g.kategoriPekerjaan,
        nilaiTotal: g.totalValue,
        nilaiTerbayar: payments,
        nilaiBelumTerbayar: unpaid,
        persenTerbayar: paidPct,
        tanggalMulaiPekerjaan: g.tanggalMulai
      };
    });
  }, [progresList, pembayaranList]);

  // Filters based on search
  const filteredOpname = React.useMemo(() => {
    return opnameTukangList.filter(o => 
      o.namaTukang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.kategoriPekerjaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.blokId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [opnameTukangList, searchQuery]);

  const filteredRincian = React.useMemo(() => {
    return pembayaranList.filter(p => 
      p.namaTukang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kategoriPekerjaan.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pembayaranList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Tab select header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/55 backdrop-blur-md p-2 rounded-2xl border border-white/40">
        <div className="flex space-x-1 w-full sm:w-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setSubTab('opname'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              subTab === 'opname' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity size={15} className="text-indigo-500" />
            Opname Pekerja
          </button>
          <button
            onClick={() => { setSubTab('rincian'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              subTab === 'rincian' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt size={15} className="text-emerald-500" />
            Rincian Pembayaran Pekerja
          </button>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto">
          {subTab === 'opname' && (
            <button
              onClick={onAddPembayaran} // shortcut to directly pay outstanding workers
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer"
            >
              <CreditCard size={15} />
              Bayar Gaji Pekerja
            </button>
          )}
          {subTab === 'rincian' && (
            <button
              onClick={onAddPembayaran}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer"
            >
              <PlusCircle size={15} />
              Catat Pembayaran
            </button>
          )}
        </div>
      </div>

      {/* Lookup filter */}
      <div className="relative p-1 rounded-xl bg-white/45 backdrop-blur-md border border-white/20">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder={`Cari dalam ledger keuangan ${subTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm rounded-xl pl-11 pr-4 py-2.5 bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Render tables as requested */}
      {subTab === 'opname' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-display font-medium">
                <th className="p-4">Pekerja</th>
                <th className="p-4">Blok & Projek</th>
                <th className="p-4 text-right">Nilai Total Progres</th>
                <th className="p-4 text-right">Nilai & Progres Terbayar</th>
                <th className="p-4 text-right">Sisa Belum Terbayar</th>
                <th className="p-4">Tgl Mulai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOpname.map((opn) => {
                const isDebt = opn.nilaiBelumTerbayar > 0;
                return (
                  <tr key={opn.id} className="hover:bg-white/40 transition">
                    <td className="p-4">
                      <div className="font-display font-bold text-slate-900 text-[15px]">{opn.namaTukang}</div>
                      <div className="mt-1">
                        <span className="inline-flex text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                          {opn.kategoriPekerjaan}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-700">Blok {opn.blokId}</div>
                      <div className="text-[10px] text-slate-400">Projek: {opn.projectId === 'prj-01' ? 'Permata Hijau' : opn.projectId === 'prj-02' ? 'Griya Harmony' : 'Grand Nirwana'}</div>
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-slate-900">{formatRupiah(opn.nilaiTotal)}</td>
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
                    <td className={`p-4 text-right font-mono text-xs font-bold ${isDebt ? 'text-rose-600' : 'text-slate-400'}`}>
                      {formatRupiah(opn.nilaiBelumTerbayar)}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-400">{opn.tanggalMulaiPekerjaan}</td>
                  </tr>
                );
              })}
              {filteredOpname.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                    Tidak ada catatan opname aktif. Pastikan data "Progres Pekerjaan" telah diinput.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'rincian' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/60 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-display font-medium">
                <th className="p-4">Tanggal Bayar</th>
                <th className="p-4">Pekerja & Kategori</th>
                <th className="p-4">Blok & Projek</th>
                <th className="p-4 text-right">Nilai Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans text-xs">
              {filteredRincian.map((p) => (
                <tr key={p.id} className="hover:bg-white/40 transition">
                  <td className="p-4 font-mono font-bold text-slate-400">{p.tanggalPembayaran}</td>
                  <td className="p-4">
                    <div className="font-display font-semibold text-slate-950 text-sm">{p.namaTukang}</div>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-500">
                        {p.kategoriPekerjaan}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-700">Blok {p.namaBlok || 'A-01'}</div>
                    <div className="text-[10px] text-slate-400">Projek: {p.namaProjek || 'Permata Hijau Residence'}</div>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-emerald-600 text-sm">
                    {formatRupiah(p.nilaiPembayaran)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
