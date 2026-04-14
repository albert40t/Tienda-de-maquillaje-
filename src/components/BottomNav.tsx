import { Home, ShoppingBag, Package, Users, Settings } from 'lucide-react';
import { Page } from '../App';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'pos', label: 'Caja', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'customers', label: 'Clientas', icon: Users },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-between items-center z-20">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id || (currentPage === 'category-inventory' && item.id === 'inventory');
        
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
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
