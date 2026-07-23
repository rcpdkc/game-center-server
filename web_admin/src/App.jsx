import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Sun, Moon, Server, Menu, Bell, AlertTriangle, X, Shield, Trash2, Settings, Wifi, Activity, ChevronDown, Monitor, CheckCircle2, XCircle, Cloud, CheckCircle, LogOut, Sparkles, Loader2, Megaphone } from 'lucide-react';
import axios from 'axios';

import { ToastProvider, useToast } from './components/Toast';

import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import GamesPage from './pages/GamesPage';
import ClientsPage from './pages/ClientsPage';
import NetworkPage from './pages/NetworkPage';
import DefinitionsPage from './pages/DefinitionsPage';
import FavoritesPage from './pages/FavoritesPage';
import SettingsPage from './pages/SettingsPage';
import MonitorPage from './pages/MonitorPage';
import MonitorLivePage from './pages/MonitorLivePage';
import SavesPage from './pages/SavesPage';
import SteamPage from './pages/SteamPage';
import LogsPage from './pages/LogsPage';
import RequestsPage from './pages/RequestsPage';
import PluginsPage from './pages/PluginsPage';
import MkLinksPage from './pages/MkLinksPage';
import FilterGamesPage from './pages/FilterGamesPage';
import AlertsHistoryPage from './pages/AlertsHistoryPage';
import UpdatesPage from './pages/UpdatesPage';

import LoginPage from './pages/LoginPage';

// Auth Context
export const AuthContext = createContext({ isAuthenticated: false, user: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState({
    username: localStorage.getItem('username') || 'Admin',
    role: localStorage.getItem('role') || 'admin'
  });

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    if (userData) {
      localStorage.setItem('username', userData.username || 'Admin');
      localStorage.setItem('role', userData.role || 'admin');
      setUser({
        username: userData.username || 'Admin',
        role: userData.role || 'admin'
      });
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Theme Context for Dark/Light Mode
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { logout, user } = useContext(AuthContext);
  const [favoriteMode, setFavoriteMode] = useState('auto');

  useEffect(() => {
    axios.get('/api/settings').then(r => {
      const s = r.data?.data || {};
      if (s.favorite_mode) setFavoriteMode(s.favorite_mode);
    }).catch(() => {});
  }, []);

  const isPlusActive = !!(localStorage.getItem('plus_token') ? localStorage : sessionStorage).getItem('plus_token');
  let permissions = [];
  try {
    const p = (localStorage.getItem('plus_token') ? localStorage : sessionStorage).getItem('plus_permissions');
    if (p) permissions = JSON.parse(p);
  } catch (e) {}

  const baseItems = [
    { path: '/', label: 'Dashboard', icon: 'bx bx-grid-alt' },
    { path: '/clients', label: 'Bilgisayarlar', icon: 'bx bx-desktop' },
    { path: '/monitor', label: 'Canlı Monitör', icon: 'bx bx-line-chart' },
    { path: '/monitortakip', label: 'Monitör OSD', icon: 'bx bx-desktop' },
    { path: '/network', label: 'Ağ İzleme', icon: 'bx bx-wifi' },
    { path: '/games', label: 'Oyunlar', icon: 'bx bx-joystick' },
    ...(favoriteMode === 'manual' ? [{ path: '/favorites', label: 'Favori Oyunlar', icon: 'bx bx-star' }] : []),
    { path: '/users', label: 'Kullanıcılar', icon: 'bx bx-user' },
    { path: '/saves', label: 'Oyun Kayıt', icon: 'bx bx-save' },
    { path: '/definitions', label: 'Tanımlamalar', icon: 'bx bx-collection' },
    { path: '/plugins', label: 'Eklentiler', icon: 'bx bx-extension' },
    { path: '/mklinks', label: 'MkLink Şablonları', icon: 'bx bx-link' },
    { path: '/updates', label: 'Guncellemeler', icon: 'bx bx-revision' },
    { path: '/filters', label: 'Filtreli Oyunlar', icon: 'bx bx-shield-x' },
    { path: '/alerts', label: 'Disk Uyarıları', icon: 'bx bx-hdd' },
    { path: '/steam', label: 'Oyun Hesapları', icon: 'bx bx-game' },
    { path: '/logs', label: 'Loglar', icon: 'bx bx-receipt' },
    { path: '/requests', label: 'İstek / Öneri', icon: 'bx bx-message-square-detail' },
    { path: '/settings', label: 'Ayarlar', icon: 'bx bx-cog' },
  ];

  const menuSections = [
    {
      items: [
        ...baseItems
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed top-0 left-0 h-full z-50 bg-[var(--color-sidebar)] border-r border-border transition-all duration-500 ease-in-out flex flex-col
        ${mobileOpen ? 'translate-x-0 w-[250px]' : '-translate-x-full lg:translate-x-0'} 
        ${collapsed ? 'lg:w-[78px]' : 'lg:w-[250px]'}`}
      >
        
        {/* Logo Details */}
        <div className="h-[60px] flex items-center px-[14px] pt-[20px] pb-[10px]">
          <i className="bx bxl-c-plus-plus text-[28px] text-accent min-w-[50px] text-center"></i>
          <span className={`text-[var(--text-primary)] text-[20px] font-semibold whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0 lg:hidden' : 'opacity-100'}`}>
            Game Center
          </span>
        </div>

        {/* Toggle Button */}
        <div 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-[25px] -right-[12px] h-[25px] w-[25px] bg-accent rounded-full text-white flex items-center justify-center cursor-pointer hidden lg:flex"
        >
          <i className={`bx text-[18px] transition-transform duration-300 ${collapsed ? 'bx-chevron-right' : 'bx-chevron-left'}`}></i>
        </div>

        {/* Scrollable Navigation */}
        <ul className="mt-[20px] px-[14px] flex-1 overflow-y-auto custom-scrollbar pb-[20px] space-y-[5px]">


          {menuSections[0].items.map((item) => {
            const active = location.pathname === item.path;
            const isAllowed = item.isCloud || item.path === '/' || (isPlusActive && permissions.includes(item.path));

            const content = (
              <>
                <i className={`${item.icon} min-w-[50px] text-[20px] text-center leading-[50px] transition-colors ${active ? (item.isCloud ? 'text-blue-500' : 'text-accent') : 'text-[var(--text-muted)] group-hover:text-accent'}`}></i>
                <span className={`flex-1 text-[15px] font-medium whitespace-nowrap transition-colors duration-400 ${
                  active ? (item.isCloud ? 'text-blue-500' : 'text-accent') : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                } ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  {item.label}
                  {item.path === '/updates' && !collapsed && (
                    <span className="ml-2 text-[9px] font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full align-middle">
                      BETA
                    </span>
                  )}
                </span>

              </>
            );

            return (
              <li key={item.path} className="relative group">
                <Link 
                  to={item.path}
                  className={`flex items-center h-[50px] rounded-[12px] transition-all duration-400 ${
                    active ? 'bg-accent/10' : 'hover:bg-accent/5'
                  }`}
                >
                  {content}
                </Link>
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-[calc(100%+15px)] z-20 bg-white shadow-lg text-[#11101D] px-[15px] py-[6px] rounded-[5px] text-[15px] font-medium opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 whitespace-nowrap lg:block hidden">
                    {item.label}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Profile Details */}
        <div className="mt-auto w-full bg-[var(--color-bg-dark)] border-t border-border p-[14px] transition-all duration-500 overflow-hidden">
          <div className="flex items-center">
            <div className="h-[45px] w-[45px] min-w-[45px] rounded-[12px] bg-accent/20 flex items-center justify-center">
              <i className="bx bx-user text-accent text-2xl"></i>
            </div>
            <div className={`ml-[15px] flex-1 whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0 lg:hidden' : 'opacity-100'}`}>
              <div className="text-[15px] font-medium text-[var(--text-primary)]">{user?.username || 'Admin'}</div>
              <div className="text-[12px] text-[var(--text-muted)]">{user?.role === 'admin' ? 'Sistem Yöneticisi' : 'Kullanıcı'}</div>
            </div>
            <i onClick={logout} className={`bx bx-log-out min-w-[50px] text-[20px] text-[var(--text-muted)] hover:text-accent text-center cursor-pointer transition-opacity ${collapsed ? 'opacity-0 lg:hidden' : 'opacity-100'}`}></i>
          </div>
        </div>

      </div>
    </>
  );
}

// ── UpdateModal ──────────────────────────────────────────────────────────────
function UpdateModal({ info, status, onClose, onUpdate }) {
  const isDownloading = status?.status === 'downloading';
  const isApplying   = status?.status === 'applying';
  const isDone       = status?.status === 'done';
  const isError      = status?.status === 'error';
  const isBusy       = isDownloading || isApplying;
  const progress     = status?.progress ?? 0;

  const statusLabel = () => {
    if (isDownloading) return `İndiriliyor... %${progress}`;
    if (isApplying)    return 'Kuruluyor...';
    if (isDone)        return '✅ Tamamlandı! Sayfa yenileniyor...';
    if (isError)       return `❌ Hata: ${status?.error}`;
    return null;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--color-sidebar)] border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            <h2 className="text-base font-bold text-white">Game Center Güncellemesi</h2>
          </div>
          {!isBusy && (
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white bg-black/20 hover:bg-black/40 rounded-lg transition-all">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Version Info */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Mevcut Sürüm</div>
              <div className="font-mono text-sm font-bold text-gray-300">v{info?.current_version ?? '?'}</div>
            </div>
            <div className="text-2xl text-emerald-400">→</div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Yeni Sürüm</div>
              <div className="font-mono text-sm font-bold text-emerald-400">v{info?.latest_version ?? '?'}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">📦 {info?.asset_name || 'GameCenter_Setup.exe'}</div>
        </div>

        {/* Release Notes */}
        {info?.release_notes && (
          <div className="px-6 py-3 border-b border-border max-h-40 overflow-y-auto custom-scrollbar">
            <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Sürüm Notları</p>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{info.release_notes}</pre>
          </div>
        )}

        {/* Progress Bar */}
        {(isBusy || isDone || isError) && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">{statusLabel()}</span>
              {isBusy && <span className="text-xs font-mono text-emerald-400">%{progress}</span>}
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${isError ? 'bg-red-500' : isDone ? 'bg-emerald-500' : 'bg-emerald-500'}`}
                style={{ width: `${isDone ? 100 : progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-6 py-4 flex gap-3">
          {!isBusy && !isDone && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-black/20 hover:bg-black/40 text-gray-300 text-sm font-medium rounded-xl transition-all"
            >
              Sonra
            </button>
          )}
          {!isDone && (
            <button
              onClick={!isBusy ? onUpdate : undefined}
              disabled={isBusy}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                isBusy
                  ? 'bg-emerald-800/50 text-emerald-400 cursor-not-allowed'
                  : isError
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
              }`}
            >
              {isDownloading && <Loader2 size={15} className="animate-spin" />}
              {isApplying && <Loader2 size={15} className="animate-spin" />}
              {isDownloading ? 'İndiriliyor...' : isApplying ? 'Kuruluyor...' : isError ? 'Tekrar Dene' : '⬇ Güncelle'}
            </button>
          )}
          {isDone && (
            <div className="flex-1 py-2.5 text-center text-sm font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              ✅ Güncelleme tamamlandı — yenileniyor...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function PlusModal({ onClose }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [hwid, setHwid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const existingToken = (localStorage.getItem('plus_token') ? localStorage : sessionStorage).getItem('plus_token');
  const plusUserStr = (localStorage.getItem('plus_token') ? localStorage : sessionStorage).getItem('plus_user');
  
  const [plusUser, setPlusUser] = useState(() => {
    try {
      return plusUserStr ? JSON.parse(plusUserStr) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (existingToken && plusUser?.email) {
      axios.post('https://gamecenter.rcpdkc.com/api/me', { email: plusUser.email })
        .then(res => {
          if (res.data.success) {
            setPlusUser(res.data.user);
            localStorage.setItem('plus_user', JSON.stringify(res.data.user));
            localStorage.setItem('plus_permissions', JSON.stringify(res.data.user.group_permissions || []));
          }
        })
        .catch(err => console.error("Could not refresh user data:", err));
    }
  }, []);

  useEffect(() => {
    axios.get('/api/system/hwid')
      .then(res => setHwid(res.data.hwid))
      .catch(err => console.error("Failed to fetch HWID:", err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('https://gamecenter.rcpdkc.com/api/login', { username: email, password, hwid });
      if (res.data.success) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('plus_token', res.data.token);
        storage.setItem('plus_user', JSON.stringify(res.data.user));
        storage.setItem('plus_permissions', JSON.stringify(res.data.user.group_permissions || []));

        // ── Gerçek kayıtlı kafe adını ve email'i yerel ayarlara yaz ────────────
        const realCafeName = res.data.user?.cafe_name;
        const cloudEmail = res.data.user?.email;
        const syncData = {};
        if (realCafeName) syncData.server_name = realCafeName;
        if (cloudEmail) syncData.cloud_email = cloudEmail;
        if (Object.keys(syncData).length > 0) {
          try {
            await axios.put('/api/settings', syncData);
            console.log('[Cloud Login] Ayarlar guncellendi:', syncData);
          } catch (syncErr) {
            console.warn('[Cloud Login] Ayarlar senkronize edilemedi:', syncErr.message);
          }
        }

        // ── Otomatik cafe_id bağlama: sunucunun cloud_cafe_id'sini cloud hesabına yaz ──
        try {
          const settingsRes = await axios.get('/api/settings');
          const localCafeId = settingsRes.data?.cloud_cafe_id;
          const cloudEmail = res.data.user?.email;
          if (localCafeId && cloudEmail) {
            await axios.post('https://gamecenter.rcpdkc.com/api/users', {
              action: 'self-link',
              email: cloudEmail,
              cafe_id: localCafeId,
            });
            console.log('[Cloud Login] cafe_id otomatik bağlandı:', localCafeId);
          }
        } catch (linkErr) {
          console.warn('[Cloud Login] Otomatik bağlama başarısız:', linkErr.message);
        }

        window.location.reload();
      } else {
        setError(res.data.error || 'Giriş başarısız.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('plus_token');
    localStorage.removeItem('plus_user');
    localStorage.removeItem('plus_permissions');
    sessionStorage.removeItem('plus_token');
    sessionStorage.removeItem('plus_user');
    sessionStorage.removeItem('plus_permissions');
    window.location.reload();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">

      <div style={{ position:'absolute', top:'20%', left:'25%', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none', filter:'blur(40px)' }} />
      <div style={{ position:'absolute', bottom:'20%', right:'20%', width:'400px', height:'400px', background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none', filter:'blur(40px)' }} />

      <div className="w-full max-w-[780px] relative animate-in zoom-in-95 duration-300">
        <div style={{ padding:'1px', borderRadius:'28px', background:'linear-gradient(135deg, rgba(249,115,22,0.3) 0%, rgba(255,255,255,0.06) 40%, rgba(99,102,241,0.2) 100%)', boxShadow:'0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(249,115,22,0.06)' }}>
          <div style={{ background:'linear-gradient(160deg, #0e1420 0%, #090d14 60%, #0b0f1c 100%)', borderRadius:'27px', overflow:'hidden', position:'relative' }}>

            <button onClick={onClose}
              style={{ position:'absolute', top:'18px', right:'18px', zIndex:30, padding:'8px', borderRadius:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; }}
            ><X size={16} /></button>

            {existingToken && plusUser ? (
              <div style={{ display:'flex', minHeight:'460px' }}>

                {/* SOL */}
                <div style={{ width:'240px', flexShrink:0, padding:'40px 28px', display:'flex', flexDirection:'column', alignItems:'center', background:'linear-gradient(180deg, rgba(249,115,22,0.07) 0%, rgba(249,115,22,0.02) 60%, transparent 100%)', borderRight:'1px solid rgba(255,255,255,0.05)', position:'relative' }}>
                  <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize:'20px 20px', pointerEvents:'none' }} />

                  <div style={{ position:'relative', marginBottom:'20px', zIndex:1 }}>
                    <div style={{ width:'88px', height:'88px', borderRadius:'24px', background:'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 1px rgba(249,115,22,0.3), 0 0 30px rgba(249,115,22,0.25), 0 8px 32px rgba(0,0,0,0.4)', fontSize:'36px', fontWeight:900, color:'white' }}>
                      {(plusUser.cafe_name || plusUser.first_name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ position:'absolute', bottom:'-4px', right:'-4px', width:'24px', height:'24px', borderRadius:'50%', background: plusUser.license_expired ? '#ef4444' : '#10b981', border:'3px solid #090d14', boxShadow: plusUser.license_expired ? '0 0 8px rgba(239,68,68,0.6)' : '0 0 8px rgba(16,185,129,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <CheckCircle size={11} color="white" />
                    </div>
                  </div>

                  <div style={{ textAlign:'center', zIndex:1, marginBottom:'14px' }}>
                    <div style={{ fontSize:'15px', fontWeight:800, color:'white', lineHeight:1.3 }}>{plusUser.cafe_name || `${plusUser.first_name} ${plusUser.last_name}`}</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'4px', wordBreak:'break-all' }}>{plusUser.email}</div>
                  </div>

                  <div style={{ zIndex:1, padding:'5px 14px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background: plusUser.group_color ? plusUser.group_color + '20' : 'rgba(255,255,255,0.07)', border:`1px solid ${plusUser.group_color ? plusUser.group_color + '50' : 'rgba(255,255,255,0.12)'}`, color: plusUser.group_color || '#94a3b8' }}>
                    {plusUser.group_name || 'Gruba Atanmamış'}
                  </div>

                  <div style={{ zIndex:1, marginTop:'12px', padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', gap:'6px', background: plusUser.license_expired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border:`1px solid ${plusUser.license_expired ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, color: plusUser.license_expired ? '#f87171' : '#34d399' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: plusUser.license_expired ? '#f87171' : '#34d399', boxShadow: plusUser.license_expired ? '0 0 6px #f87171' : '0 0 6px #34d399', display:'block' }} />
                    {plusUser.license_expired ? 'Süresi Doldu' : 'Aktif & Bağlı'}
                  </div>

                  <div style={{ flex:1 }} />

                  <button onClick={handleLogout}
                    style={{ zIndex:1, display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', borderRadius:'12px', fontSize:'12px', fontWeight:600, color:'rgba(248,113,113,0.6)', background:'transparent', border:'1px solid transparent', cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color='#f87171'; e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color='rgba(248,113,113,0.6)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; }}
                  ><LogOut size={13} />Güvenli Çıkış</button>
                </div>

                {/* SAĞ */}
                <div style={{ flex:1, padding:'40px 36px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                  <div style={{ marginBottom:'28px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                      <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(249,115,22,0.6)', textTransform:'uppercase' }}>Gamecenter Plus</span>
                      <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg, rgba(249,115,22,0.2) 0%, transparent 100%)' }} />
                    </div>
                    <h1 style={{ fontSize:'26px', fontWeight:900, color:'white', lineHeight:1.2, margin:0 }}>
                      Hoş geldiniz,<br />
                      <span style={{ background:'linear-gradient(90deg, #fb923c, #f97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                        {plusUser.cafe_name || plusUser.first_name}
                      </span>
                    </h1>
                    <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', marginTop:'8px' }}>Bulut hesabınız aktif ve sunucuya bağlı.</p>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {[
                      { icon:'bx bx-user', color:'#f97316', label:'Hesap Sahibi', value:`${plusUser.first_name} ${plusUser.last_name}`, sub:null },
                      { icon:'bx bx-buildings', color:'#10b981', label:'İşletme', value:plusUser.cafe_name || 'Belirtilmemiş', sub:plusUser.phone || null },
                      { icon:'bx bx-calendar', color:'#6366f1', label:'Üyelik Başlangıcı', value:plusUser.created_at ? new Date(plusUser.created_at).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}) : 'Bilinmiyor', sub:null },
                    ].map((item, i) => (
                      <div key={i}
                        style={{ padding:'14px 16px', borderRadius:'14px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', transition:'all 0.2s', cursor:'default', display:'flex', alignItems:'center', gap:'14px' }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.transform='translateX(3px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.transform='translateX(0)'; }}
                      >
                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:item.color+'18', border:`1px solid ${item.color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <i className={item.icon} style={{ color:item.color, fontSize:'16px' }} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase', marginBottom:'3px' }}>{item.label}</div>
                          <div style={{ fontSize:'14px', fontWeight:700, color:'rgba(255,255,255,0.92)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.value}</div>
                          {item.sub && <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginTop:'2px' }}>{item.sub}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            ) : (

              <div style={{ display:'flex', minHeight:'440px' }}>

                {/* SOL brand */}
                <div style={{ width:'220px', flexShrink:0, padding:'40px 28px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 100%)', borderRight:'1px solid rgba(255,255,255,0.05)', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize:'18px 18px', pointerEvents:'none' }} />
                  <div style={{ position:'absolute', top:'-60px', left:'-60px', width:'200px', height:'200px', background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
                  <div style={{ zIndex:1, textAlign:'center' }}>
                    <div style={{ width:'64px', height:'64px', borderRadius:'18px', margin:'0 auto 20px', background:'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(79,70,229,0.15) 100%)', border:'1px solid rgba(99,102,241,0.3)', boxShadow:'0 0 30px rgba(99,102,241,0.15), 0 8px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Cloud size={28} color="#818cf8" />
                    </div>
                    <div style={{ fontSize:'16px', fontWeight:900, color:'white', marginBottom:'6px' }}>Gamecenter Plus</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>Bulut tabanlı<br />yönetim platformu</div>
                    <div style={{ marginTop:'28px', display:'flex', flexDirection:'column', gap:'10px' }}>
                      {[{icon:'bx bx-cloud',text:'Merkezi Yönetim'},{icon:'bx bx-data',text:'Bulut Yedekleme'},{icon:'bx bx-shield',text:'Lisans Kontrolü'}].map((f,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <i className={f.icon} style={{ color:'#818cf8', fontSize:'11px' }} />
                          </div>
                          <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>{f.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SAĞ form */}
                <div style={{ flex:1, padding:'44px 40px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                  <div style={{ marginBottom:'28px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                      <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(129,140,248,0.7)', textTransform:'uppercase' }}>Bulut Girişi</span>
                      <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg, rgba(99,102,241,0.2) 0%, transparent 100%)' }} />
                    </div>
                    <h2 style={{ fontSize:'24px', fontWeight:900, color:'white', margin:0, lineHeight:1.2 }}>Hesabınıza<br />giriş yapın</h2>
                    <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.3)', marginTop:'8px' }}>Gamecenter Plus kimlik bilgilerinizi girin</p>
                  </div>

                  {error && (
                    <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', display:'flex', alignItems:'flex-start', gap:'10px', color:'#fca5a5', marginBottom:'20px', fontSize:'13px' }}>
                      <AlertTriangle size={15} style={{ flexShrink:0, marginTop:'1px' }} /><span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'12px' }} autoComplete="off">
                    {[
                      { type:'email', name:'email', val:email, set:setEmail, ph:'E-Posta Adresi', icon:'bx bx-envelope', ac:'off' },
                      { type:'password', name:'password', val:password, set:setPassword, ph:'Şifre', icon:'bx bx-lock-alt', ac:'new-password' },
                    ].map((f, i) => (
                      <div key={i} style={{ position:'relative' }}>
                        <div style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.25)', pointerEvents:'none' }}>
                          <i className={f.icon} style={{ fontSize:'16px' }} />
                        </div>
                        <input type={f.type} name={f.name} autoComplete={f.ac} required value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                          style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 14px 12px 40px', fontSize:'14px', color:'white', outline:'none', boxSizing:'border-box', transition:'all 0.2s' }}
                          onFocus={e => { e.target.style.borderColor='rgba(99,102,241,0.5)'; e.target.style.background='rgba(99,102,241,0.06)'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'; }}
                          onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.boxShadow='none'; }}
                        />
                      </div>
                    ))}

                    <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:'12px', fontWeight:500, userSelect:'none', paddingTop:'2px' }}>
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor:'#6366f1', width:'14px', height:'14px', cursor:'pointer' }} />
                      Beni Hatırla
                    </label>

                    <button disabled={loading} type="submit"
                      style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none', cursor:loading ? 'not-allowed' : 'pointer', background:'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color:'white', fontWeight:700, fontSize:'14px', boxShadow:'0 4px 20px rgba(99,102,241,0.3), 0 0 0 1px rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity:loading ? 0.7 : 1, transition:'all 0.2s', marginTop:'4px' }}
                      onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow='0 6px 28px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(99,102,241,0.3), 0 0 0 1px rgba(99,102,241,0.2)'; }}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : 'Giriş Yap'}
                    </button>
                  </form>

                  <div style={{ marginTop:'24px', paddingTop:'20px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>Henüz hesabınız yok mu?</span>
                    <button type="button" onClick={() => window.open('https://gamecenter.rcpdkc.com', '_blank')}
                      style={{ fontSize:'12px', fontWeight:600, color:'rgba(129,140,248,0.7)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', transition:'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color='#818cf8'}
                      onMouseLeave={e => e.currentTarget.style.color='rgba(129,140,248,0.7)'}
                    >Kayıt Ol <Sparkles size={12} /></button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}



function TopNavbar({ toggleMobileSidebar }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [networkAlerts, setNetworkAlerts] = useState([]);
  const [ramAlerts, setRamAlerts] = useState([]);
  const [diskAlerts, setDiskAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [globalAnnouncements, setGlobalAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gc_dismissed_announcements')) || []; } catch { return []; }
  });
  const isPlusActive = !!(localStorage.getItem('plus_token') ? localStorage : sessionStorage).getItem('plus_token');

  // ── Cloud Update State ──────────────────────────────────────────────────
  const [updateInfo, setUpdateInfo] = useState(null); // { has_update, latest_version, current_version, release_notes, asset_name }
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null); // { status, progress, error }

  // Sayfa yüklenince güncelleme kontrolü yap (1 kez)
  useEffect(() => {
    axios.get('/api/system/update/check')
      .then(r => { if (r.data.ok) setUpdateInfo(r.data); })
      .catch(() => {});
  }, []);

  // Güncelleme başladıktan sonra ilerlemeyi takip et
  useEffect(() => {
    if (!updateStatus || !['downloading','applying'].includes(updateStatus.status)) return;
    const interval = setInterval(() => {
      axios.get('/api/system/update/status')
        .then(r => {
          // Eğer sunucu yeniden başladıysa state sıfırlanıp 'idle' dönecektir
          if (r.data.status === 'idle' && updateStatus.status === 'applying') {
             setUpdateStatus({ status: 'done', progress: 100, error: null });
             clearInterval(interval);
             axios.post('/api/system/update/cleanup').catch(() => {});
             setTimeout(() => window.location.reload(), 2000);
             return;
          }
          
          setUpdateStatus(r.data);
          if (r.data.status === 'done') {
            clearInterval(interval);
            axios.post('/api/system/update/cleanup').catch(() => {});
            setTimeout(() => window.location.reload(), 2000);
          } else if (r.data.status === 'error') {
            clearInterval(interval);
          }
        })
        .catch(() => {
          // Sunucu yanıt vermiyorsa (Network Error), kurulum işlemi nedeniyle sunucu kapanmış demektir.
          setUpdateStatus(prev => ({ status: 'applying', progress: 100, error: null }));
        });
    }, 1500);
    return () => clearInterval(interval);
  }, [updateStatus?.status]);
  // ────────────────────────────────────────────────────────────────────────

  // Acil Durum
  const [showEmergency, setShowEmergency] = useState(false);
  const [filters, setFilters] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState(null);

  // ─── Donanım Eşik Ayarları Modal ────────────────────────────────
  const [showHwSettings, setShowHwSettings] = useState(false);
  const [hwClients, setHwClients] = useState([]);
  const [selectedHwHost, setSelectedHwHost] = useState('');
  const [hwThresholds, setHwThresholds] = useState({}); // { hostname: { eth: '1000', ram: '3200' } }
  const [hwManualEth, setHwManualEth] = useState('');
  const [hwManualRam, setHwManualRam] = useState('');
  const [hwSaving, setHwSaving] = useState(false);
  const [hwSaveMsg, setHwSaveMsg] = useState('');

  // Modal açılınca istemcileri yükle
  useEffect(() => {
    if (showHwSettings) {
      axios.get('/api/clients').then(r => {
        const arr = r.data?.data || r.data || [];
        const sorted = [...arr].sort((a, b) =>
          (a.hostname || '').localeCompare(b.hostname || '', undefined, { numeric: true, sensitivity: 'base' })
        );
        setHwClients(sorted);
        if (sorted.length > 0 && !selectedHwHost) setSelectedHwHost(sorted[0].hostname);
      }).catch(() => {});
    }
  }, [showHwSettings]);

  // PC seçilince DB'den esikleri yükle
  useEffect(() => {
    if (!selectedHwHost) return;
    if (hwThresholds[selectedHwHost] !== undefined) {
      // Zaten yüklendi, manual inputlari sifirla
      const t = hwThresholds[selectedHwHost] || {};
      setHwManualEth('');
      setHwManualRam('');
      return;
    }
    axios.get(`/api/clients/${selectedHwHost}/thresholds`).then(r => {
      const d = r.data?.data || {};
      setHwThresholds(prev => ({
        ...prev,
        [selectedHwHost]: {
          eth: d.expected_link_speed_mbps ? String(d.expected_link_speed_mbps) : '',
          ram: d.expected_ram_speed_mhz ? String(d.expected_ram_speed_mhz) : ''
        }
      }));
      setHwManualEth('');
      setHwManualRam('');
    }).catch(() => {});
  }, [selectedHwHost]);

  const currentHwHost = hwClients.find(c => c.hostname === selectedHwHost);
  const currentThreshold = hwThresholds[selectedHwHost] || { eth: '', ram: '' };

  function updateThresholdField(field, value) {
    setHwThresholds(prev => ({
      ...prev,
      [selectedHwHost]: { ...(prev[selectedHwHost] || { eth: '', ram: '' }), [field]: value }
    }));
    if (field === 'eth') setHwManualEth('');
    if (field === 'ram') setHwManualRam('');
  }

  function applyManualEth() {
    const v = parseInt(hwManualEth);
    if (!isNaN(v) && v > 0) updateThresholdField('eth', String(v));
  }
  function applyManualRam() {
    const v = parseInt(hwManualRam);
    if (!isNaN(v) && v > 0) updateThresholdField('ram', String(v));
  }

  async function saveHwThreshold() {
    if (!selectedHwHost) return;
    setHwSaving(true);
    setHwSaveMsg('');
    try {
      const ethVal = currentThreshold.eth ? parseInt(currentThreshold.eth) : null;
      const ramVal = currentThreshold.ram ? parseInt(currentThreshold.ram) : null;
      await axios.put(`/api/clients/${selectedHwHost}/thresholds`, {
        eth_mbps: ethVal,
        ram_mhz: ramVal
      });
      setHwSaveMsg('✓ Veritabanına kaydedildi!');
      setTimeout(() => setHwSaveMsg(''), 2500);
    } catch (e) {
      setHwSaveMsg('✗ Hata oluştu');
    }
    setHwSaving(false);
  }
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (showEmergency) {
      axios.get('/api/filters').then(r => setFilters(r.data?.data || [])).catch(() => {});
      // Ayarlardan default filtreı al
      axios.get('/api/settings').then(r => {
        const s = r.data?.data || {};
        if (s.emergency_filter_id) setSelectedFilterId(String(s.emergency_filter_id));
      }).catch(() => {});
    }
  }, [showEmergency]);

  async function triggerEmergency() {
    if (!selectedFilterId) return;
    setEmergencyLoading(true);
    try {
      const res = await axios.post('/api/emergency', { filter_id: parseInt(selectedFilterId) });
      setEmergencyResult(res.data?.data);
    } catch (e) {
      setEmergencyResult({ error: e.response?.data?.message || 'Hata oluştu' });
    }
    setEmergencyLoading(false);
  }

  function closeEmergency() {
    setShowEmergency(false);
    setSelectedFilterId('');
    setEmergencyResult(null);
    setEmergencyLoading(false);
  }

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await axios.get('/api/requests?limit=100');
        const reqs = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.data || []);
        const pending = reqs.filter(r => r.status !== 'Çözüldü');
        setPendingRequests(pending);
        setPendingCount(pending.length);

        const netRes = await axios.get('/api/network_alerts');
        if (netRes.data?.data) setNetworkAlerts(netRes.data.data);

        const diskRes = await axios.get('/api/alerts/history?limit=15&unread_only=true');
        if (diskRes.data?.data) {
          setDiskAlerts(diskRes.data.data);
        }

        // RAM frekans uyarılarını DB'den al
        try {
          const ramRes = await axios.get('/api/ram_alerts');
          if (ramRes.data?.data) setRamAlerts(ramRes.data.data);
        } catch {}

        try {
          const annRes = await fetch('https://gamecenter.rcpdkc.com/api/announcements');
          const annData = await annRes.json();
          if (annData.success) setGlobalAnnouncements(annData.data);
        } catch {}
      } catch (err) {}
    };
    fetchPending();
    const int = setInterval(fetchPending, 10000);
    return () => clearInterval(int);
  }, []);


  const getPageInfo = () => {
    switch (location.pathname) {
      case '/': return { title: 'Dashboard', subtitle: 'Sistem Özet Görünümü', icon: 'bx bx-grid-alt', color: 'text-accent' };
      case '/clients': return { title: 'Müşteri Bilgisayarları', subtitle: 'İstemci makineleri izleyin ve donanımlarını takip edin', icon: 'bx bx-desktop', color: 'text-blue-500' };
      case '/monitor': return { title: 'Canlı Monitör Ekranı', subtitle: 'İstemcilerin anlık ısı ve durum takibi', icon: 'bx bx-line-chart', color: 'text-yellow-500' };
      case '/network': return { title: 'Ağ İstatiği', subtitle: 'İnternet kullanım ve bant genişliği tablosu', icon: 'bx bx-wifi', color: 'text-cyan-500' };
      case '/games': return { title: 'Oyun Kütüphanesi', subtitle: 'Sistemde kayıtlı oyunları ve indirmeleri yönetin', icon: 'bx bx-joystick', color: 'text-emerald-500' };
      case '/users': return { title: 'Kullanıcı Yönetimi', subtitle: 'Yetkili kullanıcıları ve admin hesaplarını yönetin', icon: 'bx bx-user', color: 'text-purple-500' };
      case '/saves': return { title: 'Oyun Kayıt Yönetimi', subtitle: 'Kayıt dizinlerini ve bulut yedeklemeleri yönetin', icon: 'bx bx-save', color: 'text-blue-400' };
      case '/definitions': return { title: 'Sistem Tanımlamaları', subtitle: 'Oyun türleri ve genel kuralları yapılandırın', icon: 'bx bx-collection', color: 'text-amber-500' };
      case '/favorites': return { title: 'Favori Oyunlar', subtitle: 'İstemcide en üst sırada görünecek oyunların listesini manuel olarak yönetin', icon: 'bx bx-star', color: 'text-yellow-500' };
      case '/plugins': return { title: 'Sistem Eklentileri', subtitle: 'İstemci tarafında çalışacak eklentileri yapılandırın', icon: 'bx bx-extension', color: 'text-teal-500' };
      case '/mklinks': return { title: 'MkLink Şablonları', subtitle: 'Global MkLink yapılandırmalarını yönetin', icon: 'bx bx-link', color: 'text-amber-500' };
      case '/updates': return { title: 'Oyun Güncellemeleri', subtitle: 'Oyun launcher’ları ve komutlarla otomatik güncelleme yönetin', icon: 'bx bx-revision', color: 'text-emerald-400' };
      case '/filters': return { title: 'Filtreli Oyunlar', subtitle: 'Client\'ta gizlenecek oyun kurallarını oluşturun ve yönetin', icon: 'bx bx-shield-x', color: 'text-red-400' };
      case '/alerts': return { title: 'Disk Uyarı Geçmişi', subtitle: 'Write-Back diskini şişiren bilgisayarların kayıtları', icon: 'bx bx-hdd', color: 'text-red-500' };
      case '/steam': return { title: 'Oyun Hesap Yönetimi', subtitle: 'Tüm platformlardaki oyun hesaplarını ve görevlendirmeleri yönetin', icon: 'bx bx-game', color: 'text-blue-400' };
      case '/logs': return { title: 'Sistem Logları', subtitle: 'Sistemdeki tüm hareketleri ve hataları izleyin', icon: 'bx bx-receipt', color: 'text-indigo-500' };
      case '/requests': return { title: 'İstek / Öneri', subtitle: 'Kullanıcılardan gelen talepleri görüntüleyin', icon: 'bx bx-message-square-detail', color: 'text-rose-400' };
      case '/settings': return { title: 'Sistem Ayarları', subtitle: 'Game Center sunucu ve istemci davranışlarını yapılandırın', icon: 'bx bx-cog', color: 'text-gray-400' };
      case '/monitortakip': return { title: 'Monitor OSD Yönetimi', subtitle: 'DDC/CI üzerinden monitör ayarlarını merkezi yönet', icon: 'bx bx-desktop', color: 'text-cyan-400' };
      case '/plus': return { title: 'Gamecenter Plus', subtitle: 'Bulut yetkilendirmesi ve modül aktivasyonu', icon: 'bx bx-cloud', color: 'text-blue-500' };
      default: return { title: 'Yönetim Paneli', subtitle: 'Game Center Admin', icon: 'bx bxl-c-plus-plus', color: 'text-accent' };
    }
  };

  const info = getPageInfo();

  return (
    <>
    <div className="h-[70px] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-40 transition-colors duration-300"
      style={{
        background: 'var(--color-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 1px 30px rgba(0,0,0,0.1)'
      }}
    >
      <div className="flex items-center gap-4">
        <button onClick={toggleMobileSidebar} className="p-2 lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <Menu size={24} />
        </button>
        <div className="hidden sm:flex items-center gap-3.5">
          <div className="relative">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm`}
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <i className={`${info.icon} text-xl ${info.color}`}></i>
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${info.color.replace('text-', 'bg-')}`} style={{ opacity: 0.8, border: '2px solid var(--color-bg)' }} />
          </div>
          <div>
            <h1 className="text-[17px] font-black text-[var(--text-primary)] tracking-tight leading-tight">{info.title}</h1>
            <span className="text-[var(--text-muted)] text-[12px] font-medium leading-tight">{info.subtitle}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">

        {/* ACİL DURUM */}
        <button
          onClick={() => setShowEmergency(true)}
          className="relative p-2.5 rounded-xl text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-110"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          title="Acil Durum"
        >
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          <AlertTriangle size={17} />
        </button>

        {/* TEMA */}
        <button 
          onClick={toggleTheme} 
          className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-amber-400 transition-all duration-200 hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Tema Değiştir"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* PLUS MODAL BUTTON */}
        <button 
          onClick={() => setShowPlusModal(true)} 
          className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${isPlusActive ? 'text-green-400' : 'text-[var(--text-muted)] hover:text-blue-400'}`}
          style={{ background: isPlusActive ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', border: isPlusActive ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.08)' }}
          title="Gamecenter Plus"
        >
          <Cloud size={17} />
        </button>

        {showPlusModal && <PlusModal onClose={() => setShowPlusModal(false)} />}

        {/* Update Modal */}
        {showUpdateModal && createPortal(
          <UpdateModal
            info={updateInfo}
            status={updateStatus}
            onClose={() => { if (!['downloading','applying'].includes(updateStatus?.status)) setShowUpdateModal(false); }}
            onUpdate={async () => {
              try {
                await axios.post('/api/system/update/apply');
                const st = await axios.get('/api/system/update/status');
                setUpdateStatus(st.data);
              } catch (e) {
                setUpdateStatus({ status: 'error', error: e?.response?.data?.error || e.message, progress: 0 });
              }
            }}
          />,
          document.body
        )}


        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
              showNotifications 
                ? 'text-accent' 
                : 'text-[var(--text-muted)] hover:text-accent'
            }`}
            style={{
              background: showNotifications ? 'rgba(var(--color-accent-rgb,99,102,241),0.12)' : 'rgba(255,255,255,0.04)',
              border: showNotifications ? '1px solid rgba(var(--color-accent-rgb,99,102,241),0.25)' : '1px solid rgba(255,255,255,0.08)'
            }}
            title="Bildirimler"
          >
            <Bell size={17} />
            {(() => {
              const unreadAnnouncements = globalAnnouncements.filter(a => !dismissedAnnouncements.includes(a.id));
              const totalNotifs = pendingCount + networkAlerts.length + diskAlerts.length + ramAlerts.length + unreadAnnouncements.length + (updateInfo?.has_update ? 1 : 0);
              if (totalNotifs > 0) {
                return (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full border-2 border-[#0f0f19] min-w-[18px] text-center">
                    {totalNotifs}
                  </span>
                );
              }
              return null;
            })()}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute top-full right-0 mt-3 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                {/* 🔔 Güncelleme Bildirimi */}
                {updateInfo?.has_update && (
                  <div className="p-3 border-b border-border bg-emerald-500/10">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        Yeni Güncelleme Mevcut!
                      </h3>
                      <span className="text-[10px] text-emerald-300 font-mono bg-emerald-500/20 px-2 py-0.5 rounded-full">v{updateInfo.latest_version}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Mevcut: v{updateInfo.current_version} → Yeni: v{updateInfo.latest_version}</p>
                    <button
                      onClick={() => { setShowNotifications(false); setShowUpdateModal(true); }}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Güncelleme Menüsünü Aç →
                    </button>
                  </div>
                )}

                {/* Global Duyurular */}
                {(() => {
                  const unreadAnnouncements = globalAnnouncements.filter(a => !dismissedAnnouncements.includes(a.id));
                  if (unreadAnnouncements.length === 0) return null;
                  return (
                    <>
                      <div className="p-3 border-b border-border bg-blue-500/10 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2"><Megaphone size={16} /> Sistem Duyurusu</h3>
                      </div>
                      <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-border">
                          {unreadAnnouncements.map((ann) => (
                            <div key={ann.id} className="p-3 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-blue-400">{ann.title}</span>
                                <button
                                  onClick={() => {
                                    const newDismissed = [...dismissedAnnouncements, ann.id];
                                    setDismissedAnnouncements(newDismissed);
                                    localStorage.setItem('gc_dismissed_announcements', JSON.stringify(newDismissed));
                                  }}
                                  className="text-gray-500 hover:text-white" title="Temizle"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-300 mb-1">{ann.message}</p>
                              {ann.link && (
                                <a href={ann.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline">
                                  Linke Git &rarr;
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Disk Uyarıları */}
                {diskAlerts.length > 0 && (
                  <>
                    <div className="p-3 border-b border-border bg-amber-500/10 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2"><AlertTriangle size={16} /> Disk Uyarıları</h3>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{diskAlerts.length}</span>
                        <button 
                          onClick={async () => {
                            try {
                              await axios.post('/api/alerts/dismiss');
                              setDiskAlerts([]);
                            } catch (e) {}
                          }}
                          className="p-1.5 bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-colors"
                          title="Bildirimleri Gizle"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                      <div className="divide-y divide-border">
                        {diskAlerts.map((alert, i) => (
                          <div key={i} className="p-3 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                            <span className="text-xs font-bold text-amber-400 block">{alert.ip} {alert.identifier ? `/ ${alert.identifier}` : ''}</span>
                            <p className="text-xs text-gray-300 mt-0.5">
                              <span className="text-white font-bold">{alert.process}</span> — Büyüme: <span className="text-amber-400 font-bold">{alert.delta_mb} MB</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Ağ Hızı Uyarıları */}
                {networkAlerts.length > 0 && (
                  <>
                    <div className="p-4 border-b border-border bg-rose-500/10 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2"><AlertTriangle size={16} /> Ağ Hızı Uyarıları</h3>
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{networkAlerts.length} Hata</span>
                        <button
                          onClick={() => setNetworkAlerts([])}
                          className="p-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                          title="Bildirimleri temizle (sadece görünümden)"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                      <div className="divide-y divide-border">
                        {networkAlerts.map(alert => (
                          <div key={alert.hostname} className="p-4 bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-rose-400">{alert.hostname}</span>
                            </div>
                            <p className="text-xs text-gray-300">
                              Ağ hızı düştü! Beklenen: <strong className="text-white">{alert.expected_link_speed_mbps} Mbps</strong>,
                              Mevcut: <strong className="text-rose-400">{alert.link_speed_mbps} Mbps</strong>. Lütfen kabloyu kontrol edin.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* RAM Frekans Uyarıları */}
                {ramAlerts.length > 0 && (
                  <>
                    <div className="p-4 border-b border-border bg-purple-500/10 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2"><Activity size={16} /> RAM Frekans Uyarıları</h3>
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{ramAlerts.length} Hata</span>
                        <button
                          onClick={() => setRamAlerts([])}
                          className="p-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg transition-colors"
                          title="Bildirimleri temizle (sadece görünümden)"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                      <div className="divide-y divide-border">
                        {ramAlerts.map(alert => (
                          <div key={alert.hostname} className="p-4 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-purple-400">{alert.hostname}</span>
                            </div>
                            <p className="text-xs text-gray-300">
                              RAM frekansı düşük! Beklenen min: <strong className="text-white">{alert.expected_ram_speed_mhz} MHz</strong>,
                              Mevcut: <strong className="text-purple-400">{alert.ram_speed_mhz} MHz</strong>.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="p-4 border-b border-border bg-bg-dark/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Gelen Talepler</h3>
                  {pendingCount > 0 && (
                    <span className="bg-blue-500/20 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingCount} Yeni</span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {pendingRequests.length === 0 ? (
                    <div className="p-6 text-center text-[var(--text-muted)] text-sm">Bekleyen istek yok.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {pendingRequests.slice(0, 5).map(req => (
                        <div key={req.id} className="p-4 hover:bg-bg-dark/50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-accent">{req.client_ip || req.username || 'Bilinmiyor'}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{req.created_at?.split(' ')[1]?.substring(0, 5) || ''}</span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2">{req.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-border bg-bg-dark/50 text-center">
                  <Link 
                    to="/requests" 
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-accent hover:text-white transition-colors"
                  >
                    Tüm İstekleri Gör
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {/* ACİL DURUM MODAL */}
    {showEmergency && (
      <>
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={closeEmergency} />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md bg-[#1a1a1a] border-2 border-red-500/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-red-500/10 border-b border-red-500/30 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Acil Durum</h2>
                  <p className="text-xs text-red-300">Bu işlem geri alınamaz</p>
                </div>
              </div>
              <button onClick={closeEmergency} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {!emergencyResult ? (
                <>
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200">
                    <p className="font-bold mb-1">Ne olacak?</p>
                    <ul className="space-y-1 text-xs text-red-300 list-disc list-inside">
                      <li>Seçilen filtre <strong>anında aktifleştirilir</strong></li>
                      <li>Filtredeki oyunlar tüm clientlerde <strong>kapatılır</strong></li>
                      <li>GameCenter <strong>otomatik yeniden başlatılır</strong></li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Uygulanacak Filtre Seçin</label>
                    <select
                      value={selectedFilterId}
                      onChange={e => setSelectedFilterId(e.target.value)}
                      className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 appearance-none"
                    >
                      <option value="">-- Filtre seçin --</option>
                      {filters.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.game_count} oyun){f.is_active ? ' ✓ AKTİF' : ''}
                        </option>
                      ))}
                    </select>
                    {filters.length === 0 && (
                      <p className="mt-2 text-xs text-yellow-400">⚠ Henüz filtre yok. Önce Filtreli Oyunlar sayfasından filtre oluşturun.</p>
                    )}
                  </div>

                  <button
                    disabled={!selectedFilterId || emergencyLoading}
                    onClick={triggerEmergency}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {emergencyLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uygulanıyor...</>
                    ) : (
                      <><AlertTriangle size={16} /> Acil Durumu Uygula</>
                    )}
                  </button>
                </>
              ) : (
                /* Sonuç */
                <div className="text-center py-4 space-y-4">
                  {emergencyResult.error ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                        <X size={28} className="text-red-400" />
                      </div>
                      <p className="text-red-300 font-bold">{emergencyResult.error}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                        <Shield size={28} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-black text-lg">Acil Durum Uygulandı</p>
                        <p className="text-gray-400 text-sm mt-1">
                          <span className="text-red-300 font-bold">{emergencyResult.filter_name}</span> filtresi aktifleştirildi.
                        </p>
                        <p className="text-green-400 text-sm font-bold mt-2">
                          {emergencyResult.clients_notified} client'e restart komutu gönderildi.
                        </p>
                      </div>
                    </>
                  )}
                  <button
                    onClick={closeEmergency}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors"
                  >Kapat</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )}

    {/* ─── DONANIM EŞİK AYARLARI MODAL ─────────────────────────── */}
    {showHwSettings && (
      <>
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md" onClick={() => setShowHwSettings(false)} />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-3xl bg-[#13131f] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <Settings size={18} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white leading-tight">Donanım Eşik Ayarları</h2>
                  <p className="text-[11px] text-violet-400/70">Değer eşiğin altına düşünce bildirim alırsınız</p>
                </div>
              </div>
              <button onClick={() => setShowHwSettings(false)} className="p-1.5 text-gray-600 hover:text-white rounded-lg hover:bg-white/8 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Two-panel body */}
            <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, maxHeight: 'calc(90vh - 70px)' }}>

              {/* LEFT: PC List */}
              <div className="w-52 border-r border-white/6 flex flex-col flex-shrink-0" style={{ background: 'rgba(0,0,0,0.25)' }}>
                <div className="px-3 py-2.5 border-b border-white/6">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bilgisayarlar</p>
                </div>
                <div className="flex-1 overflow-y-auto py-1"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(139,92,246,0.3) transparent'
                  }}
                >
                  {hwClients.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-gray-600">Yükleniyor...</div>
                  ) : (
                    hwClients.map(c => {
                      const isActive = selectedHwHost === c.hostname;
                      const thresh = hwThresholds[c.hostname] || {};
                      const hasConfig = thresh.eth || thresh.ram;
                      return (
                        <button
                          key={c.hostname}
                          onClick={() => setSelectedHwHost(c.hostname)}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-all duration-150 relative ${
                            isActive ? 'bg-violet-500/15 text-white' : 'text-gray-400 hover:bg-white/4 hover:text-gray-200'
                          }`}
                        >
                          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-500 rounded-r" />}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            c.is_online ? 'bg-emerald-500/10' : 'bg-gray-700/30'
                          }`}>
                            <Monitor size={13} className={c.is_online ? 'text-emerald-400' : 'text-gray-600'} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold truncate">{c.hostname}</div>
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${c.is_online ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                              <span className="text-[9px] font-medium" style={{ color: c.is_online ? '#10b981' : '#4b5563' }}>
                                {c.is_online ? 'online' : 'offline'}
                              </span>
                              {hasConfig && <span className="ml-auto text-[9px] text-violet-400">●</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT: Settings Panel */}
              <div className="flex-1 flex flex-col">
                {selectedHwHost && currentHwHost ? (
                  <>
                    {/* PC Info Bar */}
                    <div className="px-5 py-3 border-b border-white/6 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        currentHwHost.is_online ? 'bg-emerald-500/10' : 'bg-gray-700/20'
                      }`}>
                        <Monitor size={15} className={currentHwHost.is_online ? 'text-emerald-400' : 'text-gray-500'} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">{currentHwHost.hostname}</div>
                        <div className="text-[11px] text-gray-500">{currentHwHost.ip || '--'}</div>
                      </div>
                      <div className="ml-auto flex gap-4 text-[11px]">
                        <div className="text-center">
                          <div className="text-gray-500 mb-0.5">Ethernet</div>
                          <div className="font-bold text-white">{currentHwHost.link_speed_mbps ? `${currentHwHost.link_speed_mbps} Mbps` : '--'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 mb-0.5">RAM Freq</div>
                          <div className="font-bold text-white">{currentHwHost.ram_speed_mhz && currentHwHost.ram_speed_mhz > 0 ? `${currentHwHost.ram_speed_mhz} MHz` : '--'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="flex-1 p-5 space-y-4 overflow-y-auto"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(139,92,246,0.25) transparent'
                      }}
                    >
                      {/* Ethernet Eşiği */}
                      <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
                              <Wifi size={13} className="text-rose-400" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">Ethernet Hız Eşiği</div>
                              <div className="text-[10px] text-gray-500">Minimum beklenen bağlantı hızı</div>
                            </div>
                          </div>
                          {currentThreshold.eth && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                              Eşik: {currentThreshold.eth} Mbps
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[{v:'', l:'Devre Dışı'}, {v:'100', l:'100 Mbps'}, {v:'1000', l:'1 Gbps'}, {v:'2500', l:'2.5 Gbps'}, {v:'10000', l:'10 Gbps'}].map(opt => (
                            <button
                              key={opt.v}
                              onClick={() => updateThresholdField('eth', opt.v)}
                              className={`px-3 py-2 rounded-lg text-[12px] font-semibold text-left transition-all ${
                                currentThreshold.eth === opt.v
                                  ? 'text-rose-300'
                                  : 'text-gray-500 hover:text-gray-300'
                              }`}
                              style={{
                                background: currentThreshold.eth === opt.v ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                                border: currentThreshold.eth === opt.v ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.06)'
                              }}
                            >
                              {currentThreshold.eth === opt.v && <span className="mr-1">✓</span>}{opt.l}
                            </button>
                          ))}
                        </div>
                        {/* Manuel değer */}
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 flex items-center gap-1 rounded-lg px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <input
                              type="number"
                              min="1"
                              placeholder="Manuel Mbps gir..."
                              value={hwManualEth}
                              onChange={e => setHwManualEth(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && applyManualEth()}
                              className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-gray-600 min-w-0"
                            />
                            <span className="text-[11px] text-gray-600 flex-shrink-0">Mbps</span>
                          </div>
                          <button
                            onClick={applyManualEth}
                            disabled={!hwManualEth}
                            className="px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all disabled:opacity-30"
                            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                          >Uygula</button>
                        </div>
                      </div>

                      {/* RAM Frekans Eşiği */}
                      <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
                              <Activity size={13} className="text-violet-400" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">RAM Frekans Eşiği</div>
                              <div className="text-[10px] text-gray-500">Minimum beklenen bellek hızı</div>
                            </div>
                          </div>
                          {currentThreshold.ram && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
                              Eşik: {currentThreshold.ram} MHz
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {[
                            {v:'', l:'Devredışı'},
                            {v:'2133', l:'2133'}, {v:'2400', l:'2400'}, {v:'2666', l:'2666'},
                            {v:'3000', l:'3000'}, {v:'3200', l:'3200'}, {v:'3600', l:'3600'},
                            {v:'4000', l:'4000'}, {v:'4800', l:'4800'}, {v:'5200', l:'5200'},
                            {v:'6000', l:'6000'}
                          ].map(opt => (
                            <button
                              key={opt.v}
                              onClick={() => updateThresholdField('ram', opt.v)}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold text-center transition-all ${
                                currentThreshold.ram === opt.v ? 'text-violet-300' : 'text-gray-500 hover:text-gray-300'
                              }`}
                              style={{
                                background: currentThreshold.ram === opt.v ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
                                border: currentThreshold.ram === opt.v ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)'
                              }}
                            >
                              {opt.l}{opt.v ? ' MHz' : ''}
                            </button>
                          ))}
                        </div>
                        {/* Manuel değer */}
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 flex items-center gap-1 rounded-lg px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <input
                              type="number"
                              min="1"
                              placeholder="Manuel MHz gir..."
                              value={hwManualRam}
                              onChange={e => setHwManualRam(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && applyManualRam()}
                              className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-gray-600 min-w-0"
                            />
                            <span className="text-[11px] text-gray-600 flex-shrink-0">MHz</span>
                          </div>
                          <button
                            onClick={applyManualRam}
                            disabled={!hwManualRam}
                            className="px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all disabled:opacity-30"
                            style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}
                          >Uygula</button>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-white/6 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      {hwSaveMsg ? (
                        <span className={`text-sm font-bold flex items-center gap-1.5 ${
                          hwSaveMsg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {hwSaveMsg}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-600">Kaydetmeden önce değişiklikleri kontrol edin.</span>
                      )}
                      <button
                        disabled={hwSaving}
                        onClick={saveHwThreshold}
                        className="flex items-center gap-2 px-5 py-2 font-bold rounded-xl transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'rgba(139,92,246,0.85)', color: 'white' }}
                      >
                        {hwSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Settings size={14} />}
                        Kaydet
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      <Monitor size={24} className="text-gray-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">Soldan bir bilgisayar seçin</p>
                    <p className="text-[11px] text-gray-700">Seçilen bilgisayar için ethernet ve RAM frekans eşikleri belirleyebilirsiniz.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    {/* ───────────────────────────────────────────────────────── */}
  </>);
}

// WritebackAlertPoller kaldırıldı — disk uyarıları artık TopNavbar bell ikonundan gösteriliyor

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg transition-colors duration-300 flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out ${collapsed ? 'lg:pl-[78px]' : 'lg:pl-[250px]'}`}>
        <TopNavbar toggleMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden relative p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function PlusGuard({ children }) {
  const location = useLocation();
  const isPlusActive = !!(localStorage.getItem('plus_token') ? localStorage : sessionStorage).getItem('plus_token');
  let permissions = [];
  try {
    const p = (localStorage.getItem('plus_token') ? localStorage : sessionStorage).getItem('plus_permissions');
    if (p) permissions = JSON.parse(p);
  } catch (e) {}

  // Dashboard is always allowed
  if (location.pathname === '/') return children;

  // If not logged in, force to Dashboard
  if (!isPlusActive) {
    return <Navigate to="/" replace />;
  }

  // If logged in but accessing a path not in permissions
  if (!permissions.includes(location.pathname)) {
    if (permissions.length > 0) {
      return <Navigate to={permissions[0]} replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <PlusGuard>
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />
                    <Route path="/games" element={<GamesPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/clients" element={<ClientsPage />} />
                    <Route path="/monitor" element={<MonitorLivePage />} />
                    <Route path="/monitortakip" element={<MonitorPage />} />
                    <Route path="/network" element={<NetworkPage />} />
                    <Route path="/definitions" element={<DefinitionsPage />} />
                    <Route path="/saves" element={<SavesPage />} />
                    <Route path="/steam" element={<SteamPage />} />
                    <Route path="/logs" element={<LogsPage />} />
                    <Route path="/requests" element={<RequestsPage />} />
                    <Route path="/plugins" element={<PluginsPage />} />
                    <Route path="/mklinks" element={<MkLinksPage />} />
                    <Route path="/updates" element={<UpdatesPage />} />
                    <Route path="/filters" element={<FilterGamesPage />} />
                    <Route path="/alerts" element={<AlertsHistoryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<div className="p-8"><h2 className="text-2xl font-bold text-[var(--text-primary)]">Sayfa Yapım Aşamasında</h2></div>} />
                      </Routes>
                    </PlusGuard>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
