import React from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Code2,
} from 'lucide-react';
import {
  getAppsScriptUrl,
  setAppsScriptUrl,
  triggerAppsScriptSetup,
  fetchAllSheetsData,
} from '../supabaseClient';
import appsScriptCode from '../../google_apps_script.js?raw';

interface GoogleSheetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess: () => void;
}

export default function GoogleSheetSetupModal({
  isOpen,
  onClose,
  onSyncSuccess,
}: GoogleSheetSetupModalProps) {
  const [url, setUrl] = React.useState(() => getAppsScriptUrl());
  const [copied, setCopied] = React.useState(false);
  const [activeStepTab, setActiveStepTab] = React.useState<'connect' | 'script'>('connect');
  const [status, setStatus] = React.useState<{ type: 'idle' | 'loading' | 'success' | 'error'; msg: string }>({
    type: 'idle',
    msg: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      setUrl(getAppsScriptUrl());
      setStatus({ type: 'idle', msg: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    setAppsScriptUrl(cleanUrl);

    if (!cleanUrl) {
      setStatus({
        type: 'success',
        msg: 'Mode Demo Lokal diaktifkan (tanpa koneksi URL Google Apps Script).',
      });
      onSyncSuccess();
      return;
    }

    if (!cleanUrl.startsWith('https://script.google.com/')) {
      setStatus({
        type: 'error',
        msg: 'URL harus diawali dengan https://script.google.com/macros/s/.../exec',
      });
      return;
    }

    setStatus({ type: 'loading', msg: 'Menghubungi Web App Google Apps Script...' });
    try {
      await fetchAllSheetsData(true);
      setStatus({
        type: 'success',
        msg: 'Berhasil terhubung ke Google Sheets! Data telah disinkronkan.',
      });
      onSyncSuccess();
    } catch (err: any) {
      setStatus({
        type: 'error',
        msg: `Gagal terhubung: ${err.message || 'Pastikan akses Web App disetel ke "Anyone" (Siapa saja).'}`,
      });
    }
  };

  const handleAutoSetupSheets = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('https://script.google.com/')) {
      setStatus({
        type: 'error',
        msg: 'Masukkan URL Web App Google Apps Script yang valid terlebih dahulu.',
      });
      return;
    }
    setAppsScriptUrl(cleanUrl);
    setStatus({
      type: 'loading',
      msg: 'Memeriksa & menambahkan sheet/kolom baru tanpa mengubah data lama...',
    });

    try {
      const res = await triggerAppsScriptSetup();
      if (res.status === 'ok') {
        await fetchAllSheetsData(true);
        setStatus({
          type: 'success',
          msg: res.message || 'Sheet dan kolom baru berhasil ditambahkan! Data lama Anda tetap utuh.',
        });
        onSyncSuccess();
      } else {
        setStatus({
          type: 'error',
          msg: res.message || 'Gagal menjalankan setupDatabase.',
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        msg: `Gagal inisialisasi: ${err.message}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#e0e5ec] rounded-[28px] shadow-[12px_12px_24px_rgba(163,177,198,0.6),-12px_-12px_24px_rgba(255,255,255,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#e0e5ec] text-emerald-600 shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.85)]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-display font-extrabold text-[#2d3748]">
                Database Google Sheets (Apps Script)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Hubungkan aplikasi SISPER langsung ke Google Spreadsheet Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 shadow-[3px_3px_6px_rgba(163,177,198,0.45),-3px_-3px_6px_rgba(255,255,255,0.85)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveStepTab('connect')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeStepTab === 'connect'
                ? 'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] text-emerald-700'
                : 'shadow-[3px_3px_6px_rgba(163,177,198,0.45),-3px_-3px_6px_rgba(255,255,255,0.85)] text-slate-600'
            }`}
          >
            <FileSpreadsheet size={15} />
            1. Koneksi URL & Auto-Setup
          </button>
          <button
            type="button"
            onClick={() => setActiveStepTab('script')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeStepTab === 'script'
                ? 'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] text-indigo-700'
                : 'shadow-[3px_3px_6px_rgba(163,177,198,0.45),-3px_-3px_6px_rgba(255,255,255,0.85)] text-slate-600'
            }`}
          >
            <Code2 size={15} />
            2. Salin Kode Apps Script (Code.gs)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeStepTab === 'connect' ? (
            <>
              {/* Step-by-step quick instructions */}
              <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.85)] space-y-2 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Langkah Singkat Integrasi:</p>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>
                    Buka Google Sheet baru, lalu klik menu <b>Extensions &gt; Apps Script</b>.
                  </li>
                  <li>
                    Buka tab <b>"2. Salin Kode Apps Script"</b> di atas, klik <b>Copy Kode</b>, dan tempelkan ke <code>Code.gs</code>.
                  </li>
                  <li>
                    Klik <b>Deploy &gt; New deployment</b> &rarr; pilih jenis <b>Web app</b>, set <i>Execute as:</i> <b>Me</b> dan <i>Who has access:</i> <b>Anyone (Siapa saja)</b>.
                  </li>
                  <li>
                    Salin <b>Web App URL</b> (berakhiran <code>/exec</code>) ke kolom di bawah ini, lalu klik <b>Buat 15 Sheet Otomatis</b>.
                  </li>
                </ol>
              </div>

              <form onSubmit={handleSaveAndTest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Web App URL Google Apps Script
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-4 py-3.5 rounded-2xl text-xs font-mono bg-[#e0e5ec] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.55),inset_-4px_-4px_8px_rgba(255,255,255,0.85)] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Kosongkan dan simpan jika ingin kembali menggunakan data demo lokal.
                  </p>
                </div>

                {status.type !== 'idle' && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                      status.type === 'error'
                        ? 'text-rose-600 border-l-4 border-rose-500 bg-rose-50/60'
                        : status.type === 'success'
                        ? 'text-emerald-700 border-l-4 border-emerald-500 bg-emerald-50/60'
                        : 'text-indigo-700 border-l-4 border-indigo-500 bg-indigo-50/60'
                    }`}
                  >
                    {status.type === 'loading' && <RefreshCw size={16} className="animate-spin shrink-0" />}
                    {status.type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
                    {status.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
                    <span>{status.msg}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={status.type === 'loading'}
                    className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={15} />
                    Simpan & Hubungkan
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoSetupSheets}
                    disabled={status.type === 'loading' || !url.trim()}
                    className="flex-1 py-3 px-4 rounded-2xl bg-[#e0e5ec] shadow-[5px_5px_10px_rgba(163,177,198,0.5),-5px_-5px_10px_rgba(255,255,255,0.85)] hover:text-black text-black font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={15} className="text-black" />
                    Tambah Sheet Baru (Aman & Data Lama Utuh)
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 text-center italic">
                  * Tombol di atas hanya menambahkan sheet baru (seperti <code>rab_template</code> & <code>rab_detail</code>) dan kolom baru tanpa menghapus isi data lama Anda.
                </p>
              </form>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Kode Lengkap <code>Code.gs</code> (Siap Pakai)
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Kode Tersalin!' : 'Copy Kode Apps Script'}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-[340px] leading-relaxed">
                {appsScriptCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
