import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  CalendarDays, 
  StickyNote, 
  Briefcase, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  Bell
} from 'lucide-react';

const navigation = [
  { name: 'Panou de Control', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
  { name: 'Angajați', href: '/employees', icon: Users, adminOnly: true },
  { name: 'Sarcini', href: '/tasks', icon: CheckSquare, adminOnly: false },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays, adminOnly: false },
  { name: 'Notițe', href: '/notes', icon: StickyNote, adminOnly: false },
  { name: 'Clienți', href: '/clients', icon: Briefcase, adminOnly: true },
];

const Sidebar = ({ mobile = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navigation.filter(item => !item.adminOnly || isAdmin());

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-heading font-bold tracking-tight">
          Workforce Portal
        </h1>
        <p className="text-xs text-slate-400 mt-1">Panou de Control</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              data-testid={`nav-${item.href.replace('/', '')}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-white font-heading">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">
              {isAdmin() ? 'Administrator' : 'Angajat'}
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          data-testid="theme-toggle"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 mb-2"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 mr-2" />
              Mod Întunecat
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 mr-2" />
              Mod Luminos
            </>
          )}
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          data-testid="logout-button"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Deconectare
        </Button>
      </div>
    </div>
  );

  if (mobile) {
    return <NavContent />;
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 hidden lg:block z-40">
      <NavContent />
    </aside>
  );
};

export const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="mobile-menu-button">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-heading font-bold">Workforce Portal</h1>

        <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="mobile-theme-toggle">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
