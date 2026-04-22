import { Home, ShoppingBag, Package, Users, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavProps {
  role?: string;
}

export default function BottomNav({ role }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isSalesperson = role === 'vendedor' || role === 'salesperson';

  const navItems = [
    { id: 'home', path: '/dashboard', label: 'Inicio', icon: Home, show: true },
    { id: 'pos', path: '/pos', label: 'Caja', icon: ShoppingBag, show: !isSalesperson },
    { id: 'inventory', path: '/inventory', label: 'Inventario', icon: Package, show: true },
    { id: 'customers', path: '/customers', label: 'Clientas', icon: Users, show: !isSalesperson },
    { id: 'settings', path: '/settings', label: 'Ajustes', icon: Settings, show: true },
  ] as const;

  const filteredItems = navItems.filter(item => item.show);

  return (
    <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-around items-center z-50">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || 
          (item.id === 'inventory' && location.pathname.startsWith('/inventory'));
        
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-14 transition-colors duration-200 ${
              isActive ? 'text-primary-600' : 'text-gray-400 hover:text-primary-400'
            }`}
          >
            <div className={`p-1.5 rounded-full mb-1 transition-all duration-300 ${isActive ? 'bg-primary-50 scale-110' : 'bg-transparent'}`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
