import React from 'react';
import { TrendingUp, DollarSign, PlusCircle, ArrowUpRight } from 'lucide-react';
import LeadsView from './LeadsView';
import FeeMarketingView from './FeeMarketingView';
import { LeadPenjualan, FeeMarketing } from '../types';

interface MarketingViewProps {
  leadList: LeadPenjualan[];
  feeList: FeeMarketing[];
  onAddLead: () => void;
  onAddFee: () => void;
  onUpdateLeadStatus: (id: string, status: LeadPenjualan['leadStatus']) => void;
  onUpdateFeeStatus: (id: string, status: FeeMarketing['statusPembayaran']) => void;
}

export default function MarketingView({
  leadList,
  feeList,
  onAddLead,
  onAddFee,
  onUpdateLeadStatus,
  onUpdateFeeStatus
}: MarketingViewProps) {
  const [subTab, setSubTab] = React.useState<'lead' | 'fee'>('lead');

  return (
    <div className="space-y-6">
      {/* Tab select header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/55 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-sm animate-fade-in">
        <div className="flex space-x-1 w-full sm:w-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSubTab('lead')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              subTab === 'lead'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp size={15} className="text-orange-500" />
            Lead Penjualan
          </button>
          <button
            onClick={() => setSubTab('fee')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              subTab === 'fee'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <DollarSign size={15} className="text-indigo-500" />
            Fee Marketing
          </button>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto">
          {subTab === 'lead' ? (
            <button
              onClick={onAddLead}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle size={15} />
              Input Customer Lead Baru
            </button>
          ) : (
            <button
              onClick={onAddFee}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle size={15} />
              Input Komisi Baru
            </button>
          )}
        </div>
      </div>

      {subTab === 'lead' ? (
        <LeadsView leadList={leadList} onAddLead={onAddLead} hideHeader={true} onUpdateStatus={onUpdateLeadStatus} />
      ) : (
        <FeeMarketingView feeList={feeList} onAddFee={onAddFee} hideHeader={true} onUpdateStatus={onUpdateFeeStatus} />
      )}
    </div>
  );
}
