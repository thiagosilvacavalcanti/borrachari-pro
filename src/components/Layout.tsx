import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  DollarSign, 
  Calendar, 
  Users, 
  LogOut,
  Menu,
  X,
  History,
  Wrench,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: PlusCircle, label: 'Novo Serviço', path: '/venda' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Package, label: 'Estoque', path: '/estoque' },
  { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
  { icon: History, label: 'Histórico', path: '/historico' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: SettingsIcon, label: 'Configurações', path: '/configuracoes' },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, shop } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 shadow-lg shadow-orange-600/20">
              <PlusCircle className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">Rodolfo Alemão</span>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                    isActive 
                      ? "bg-orange-600/10 text-orange-500 font-medium" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-zinc-800 pt-6">
            <div className="mb-4 px-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Loja</p>
              <p className="truncate text-sm font-medium text-zinc-300">{shop?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600">
            <PlusCircle className="text-white" size={18} />
          </div>
          <span className="font-bold">Rodolfo Alemão</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 z-50 bg-zinc-950 p-6 lg:hidden"
          >
            <div className="flex justify-end">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <X size={32} />
              </button>
            </div>
            <nav className="mt-8 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-2xl bg-zinc-900 p-5 text-xl font-medium"
                >
                  <item.icon size={28} className="text-orange-500" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-4 rounded-2xl bg-red-500/10 p-5 text-xl font-medium text-red-500"
              >
                <LogOut size={28} />
                Sair
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64">
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav - Quick Access */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full border-t border-zinc-800 bg-zinc-900/80 p-2 backdrop-blur-xl lg:hidden">
        <Link to="/" className="flex flex-1 flex-col items-center gap-1 py-2 text-zinc-400">
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Início</span>
        </Link>
        <Link to="/venda" className="flex flex-1 flex-col items-center gap-1 py-1">
          <div className="flex h-12 w-12 -translate-y-6 items-center justify-center rounded-full bg-orange-600 shadow-lg shadow-orange-600/40 ring-4 ring-zinc-950">
            <PlusCircle className="text-white" size={24} />
          </div>
          <span className="text-[10px] -mt-5 font-bold text-orange-500">Vender</span>
        </Link>
        <Link to="/agenda" className="flex flex-1 flex-col items-center gap-1 py-2 text-zinc-400">
          <Calendar size={20} />
          <span className="text-[10px]">Agenda</span>
        </Link>
        <Link to="/historico" className="flex flex-1 flex-col items-center gap-1 py-2 text-zinc-400">
          <History size={20} />
          <span className="text-[10px]">Histórico</span>
        </Link>
      </nav>
    </div>
  );
};
