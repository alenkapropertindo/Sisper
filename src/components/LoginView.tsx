import React from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { supabase, getAppsScriptUrl } from '../supabaseClient';
import GoogleSheetSetupModal from './GoogleSheetSetupModal';

export interface UserSession {
  username: string;
  name: string;
  role: 'super_admin' | 'logistik' | 'pengawas' | 'marketing' | 'admin_umum';
  roleLabel: string;
}

const DEMO_ACCOUNTS = [
  { username: 'superadmin', password: 'sisper123', name: 'Rizqo', role: 'super_admin' as const, roleLabel: 'Super Admin', color: 'indigo' },
  { username: 'irfan', password: 'irfan1', name: 'Irfan', role: 'logistik' as const, roleLabel: 'Logistik', color: 'emerald' },
  { username: 'risko', password: 'risko2', name: 'Agung Saputra', role: 'pengawas' as const, roleLabel: 'Pengawas', color: 'blue' },
  { username: 'emy', password: 'emy123', name: 'Siti Rahma', role: 'marketing' as const, roleLabel: 'Marketing', color: 'orange' },
  { username: 'fira', password: 'fira321', name: 'Budi Santoso', role: 'admin_umum' as const, roleLabel: 'Admin Umum', color: 'rose' },
];

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = React.useState(false);
  const [hasScriptUrl, setHasScriptUrl] = React.useState(() => Boolean(getAppsScriptUrl()));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Query the 'akun' table in Supabase
      const { data, error: fetchError } = await supabase
        .from('akun')
        .select('*')
        .eq('username', username.trim())
        .maybeSingle();

      if (fetchError) {
        console.error('Login error:', fetchError);
        setError('Koneksi ke database gagal: ' + fetchError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Username tidak terdaftar dalam sistem.');
        setLoading(false);
        return;
      }

      if (data.password !== password) {
        setError('Password yang Anda masukkan salah.');
        setLoading(false);
        return;
      }

      // Valid session
      const role = data.role as 'super_admin' | 'logistik' | 'pengawas' | 'marketing' | 'admin_umum';
      const defaultLabels: Record<string, string> = {
        super_admin: 'Super Admin',
        logistik: 'Logistik',
        pengawas: 'Pengawas',
        marketing: 'Marketing',
        admin_umum: 'Admin Umum',
      };
      const roleLabel = data.role_label || data.roleLabel || defaultLabels[role] || 'Staf';

      const session: UserSession = {
        username: data.username,
        name: data.name || data.username,
        role: role,
        roleLabel: roleLabel,
      };

      onLoginSuccess(session);
    } catch (err: any) {
      console.error('Unexpected auth error:', err);
      setError('Terjadi kesalahan tak terduga saat autentikasi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#e0e5ec] text-black font-sans flex items-center justify-center p-4">
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10 p-2">
        
        {/* Left Side: App Intro & Branding */}
        <div className="lg:col-span-5 flex flex-col gap-6 text-center lg:text-left p-2 sm:p-4">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="p-4 rounded-2xl bg-[#e0e5ec] text-indigo-600 shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.85)] flex items-center justify-center">
              <Building size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-black tracking-tight leading-none mb-1">
                SISPER<span className="text-indigo-600">.</span>
              </h1>
              <p className="text-[11px] uppercase font-bold text-indigo-600 tracking-widest font-sans">
                Perumahan Sektor Utama
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-black text-black tracking-tight leading-tight">
              Akses Portal Multi-Role SISPER
            </h2>
            <p className="text-sm text-black leading-relaxed font-semibold">
              Sistem informasi pengawasan progres proyek lapangan, pencatatan logistik & material gudang, pipeline marketing, serta operasional dalam genggaman Anda.
            </p>
          </div>
        </div>

        {/* Right Side: Neumorphic Login Form */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="neu-flat p-6 sm:p-10"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-display font-black text-black tracking-tight">Masuk ke Akun Anda</h3>
              <p className="text-xs text-black mt-1 font-semibold">Masukkan kredensial Anda untuk melanjutkan pekerjaan Anda.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgba(224,112,112,0.25),inset_-3px_-3px_6px_rgba(255,255,255,0.85)] border-l-4 border-rose-500 text-rose-600 text-xs font-semibold flex items-center gap-2.5 animate-shake">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-black tracking-wide uppercase px-1" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-black">
                    <User size={18} />
                  </span>
                  <input
                    id="username"
                    type="text"
                    required
                    placeholder="Contoh: superadmin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-sm rounded-2xl pl-12 pr-4 py-3.5 bg-[#e0e5ec] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.55),inset_-4px_-4px_8px_rgba(255,255,255,0.85)] border-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black placeholder:text-gray-600 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-black tracking-wide uppercase px-1" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-black">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm rounded-2xl pl-12 pr-12 py-3.5 bg-[#e0e5ec] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.55),inset_-4px_-4px_8px_rgba(255,255,255,0.85)] border-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black placeholder:text-gray-600 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-black hover:opacity-75 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-[#e0e5ec] shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.85)] hover:shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.9)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.65),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] text-black hover:text-black font-extrabold rounded-2xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="font-black text-black">Masuk ke Portal</span>
                    <ArrowRight size={16} className="text-black" />
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-300/40 flex items-center justify-between">
                <span className="text-[11px] font-bold text-black">
                  Status DB: {hasScriptUrl ? 'Google Sheets Terhubung' : 'Mode Demo Lokal'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSheetModalOpen(true)}
                  className="text-xs font-black text-black hover:text-black flex items-center gap-1.5 cursor-pointer underline"
                >
                  <FileSpreadsheet size={15} className="text-black" />
                  <span>Konfigurasi Google Sheets</span>
                </button>
              </div>
            </form>

          </motion.div>

        </div>

      </div>

      <GoogleSheetSetupModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        onSyncSuccess={() => setHasScriptUrl(Boolean(getAppsScriptUrl()))}
      />

    </div>
  );
}
