import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import BottomNav from './components/BottomNav';
import { Product, BusinessInfo, Customer, Sale } from './types';
import { supabase } from './lib/supabase';

// Lazy load pages for Code Splitting (Performance Optimization)
const Home = lazy(() => import('./components/pages/Home'));
const POS = lazy(() => import('./components/pages/POS'));
const Inventory = lazy(() => import('./components/pages/Inventory'));
const CategoryInventory = lazy(() => import('./components/pages/CategoryInventory'));
const Customers = lazy(() => import('./components/pages/Customers'));
const Settings = lazy(() => import('./components/pages/Settings'));
const StoreFront = lazy(() => import('./components/pages/StoreFront'));
const AdminUsers = lazy(() => import('./components/pages/AdminUsers'));
const ActivityLogs = lazy(() => import('./components/pages/ActivityLogs'));

export type Page = 'home' | 'pos' | 'inventory' | 'customers' | 'settings' | 'category-inventory' | 'store' | 'admin-users' | 'activity-logs';

// Loading fallback for Suspense
const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const [session, setSession] = useState<{ email: string; role: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(38.50);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: 'Stely Beauty',
    address: 'Av. Principal, Local 4',
    phone: '+58 412-1234567',
    email: 'contacto@stelybeauty.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    facebook: 'https://facebook.com'
  });

  // Initialize Auth from LocalStorage (just to keep session active)
  useEffect(() => {
    const initAuth = () => {
      const activeSession = localStorage.getItem('app_session');
      if (activeSession) {
        setSession(JSON.parse(activeSession));
      }
      setIsAuthLoading(false);
    };
    initAuth();
  }, []);

  // Fetch data and setup realtime subscriptions
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const { data: pData } = await supabase.from('productos').select('*');
      const { data: cData } = await supabase.from('clientes').select('*');
      const { data: sData } = await supabase.from('ventas').select('*');
      
      if (pData && pData.length > 0) {
        setProducts(pData.map(p => ({ ...p, costPrice: p.cost_price } as Product)));
      } else {
        setProducts([]);
      }
      
      if (cData && cData.length > 0) {
        setCustomers(cData.map(c => ({ ...c, totalPurchases: c.total_purchases } as Customer)));
      } else {
        setCustomers([]);
      }
      
      if (sData && sData.length > 0) {
        setSales(sData.map(s => ({ ...s, paymentMethods: s.payment_methods, customerId: s.customer_id } as Sale)));
      } else {
        setSales([]);
      }
    };

    fetchData();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => {
            if (prev.find(p => p.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, costPrice: payload.new.cost_price } as Product];
          });
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? { ...payload.new, costPrice: payload.new.cost_price } as Product : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSales(prev => {
            if (prev.find(s => s.id === payload.new.id)) return prev;
            return [{ ...payload.new, paymentMethods: payload.new.payment_methods, customerId: payload.new.customer_id } as Sale, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCustomers(prev => {
            if (prev.find(c => c.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, totalPurchases: payload.new.total_purchases } as Customer];
          });
        } else if (payload.eventType === 'UPDATE') {
          setCustomers(prev => prev.map(c => c.id === payload.new.id ? { ...payload.new, totalPurchases: payload.new.total_purchases } as Customer : c));
        } else if (payload.eventType === 'DELETE') {
          setCustomers(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    const cleanEmail = email.trim();

    try {
      // Consultar la tabla personalizada 'empleados' en Supabase
      const { data: user, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password', password)
        .single();

      if (error || !user) {
        setAuthError('Credenciales incorrectas o el usuario no existe');
      } else {
        const newSession = { email: user.email, role: user.role };
        localStorage.setItem('app_session', JSON.stringify(newSession));
        setSession(newSession);
      }
    } catch (error: any) {
      setAuthError('Error al conectar con la base de datos');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('app_session');
    setSession(null);
    setEmail('');
    setPassword('');
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col fixed inset-0 w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col fixed inset-0 w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden justify-center px-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold text-primary-800 mb-2">Stely Beauty</h1>
            <p className="text-gray-500 text-sm">Ingresa para gestionar tu tienda</p>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 mt-6"
            >
              {isAuthLoading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage('category-inventory');
  };

  const handleProcessSale = async (sale: Sale) => {
    // Optimistic update
    setSales(prev => [sale, ...prev]);
    
    // Supabase insert
    await supabase.from('ventas').insert({
      id: sale.id,
      date: sale.date,
      items: sale.items,
      total: sale.total,
      discount: sale.discount,
      payment_methods: sale.paymentMethods,
      customer_id: sale.customerId,
      profit: sale.profit
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} products={products} />;
      case 'pos':
        return <POS exchangeRate={exchangeRate} products={products} customers={customers} sales={sales} onProcessSale={handleProcessSale} />;
      case 'inventory':
        return <Inventory onSelectCategory={handleCategorySelect} products={products} />;
      case 'customers':
        return <Customers customers={customers} sales={sales} />;
      case 'category-inventory':
        return <CategoryInventory category={selectedCategory} onBack={() => setCurrentPage('inventory')} exchangeRate={exchangeRate} products={products} setProducts={setProducts} />;
      case 'settings':
        return <Settings businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} onNavigate={setCurrentPage} />;
      case 'store':
        return <StoreFront products={products} exchangeRate={exchangeRate} onBack={() => setCurrentPage('home')} businessInfo={businessInfo} />;
      case 'admin-users':
        return <AdminUsers onBack={() => setCurrentPage('settings')} />;
      case 'activity-logs':
        return <ActivityLogs onBack={() => setCurrentPage('settings')} />;
      default:
        return <Home onNavigate={setCurrentPage} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} products={products} />;
    }
  };

  return (
    <div className="flex flex-col fixed inset-0 w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden">
      <Toaster position="top-center" />
      {/* Header */}
      {currentPage !== 'store' && (
        <header className="bg-white px-4 py-2.5 shadow-sm z-10 flex items-center justify-between">
          <h1 className="font-serif text-xl font-bold text-primary-800 tracking-tight">{businessInfo.name}</h1>
          <div className="flex items-center space-x-3">
            {session.role === 'admin' && currentPage !== 'admin-users' && (
              <button 
                onClick={() => setCurrentPage('admin-users')}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium bg-primary-50 px-2 py-1 rounded-md"
              >
                Usuarios
              </button>
            )}
            <button 
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-gray-900 font-medium"
            >
              Salir
            </button>
            <div className="w-7 h-7 text-xs rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
              {businessInfo.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto ${currentPage !== 'store' ? 'pb-28' : ''}`}>
        <Suspense fallback={<LoadingSpinner />}>
          {renderPage()}
        </Suspense>
      </main>

      {/* Bottom Navigation */}
      {currentPage !== 'store' && <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />}
    </div>
  );
}
