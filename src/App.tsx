import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import PWAManager from './components/PWAManager';
import { Product, BusinessInfo, Customer, Sale } from './types';
import { supabase } from './lib/supabase';
import { offlineManager } from './lib/offlineManager';
import { useOfflineSync } from './hooks/useOfflineSync';
import { RefreshCcw, Wifi, WifiOff } from 'lucide-react';
import { Category } from './types';

import Home from './components/pages/Home';
import POS from './components/pages/POS';
import Inventory from './components/pages/Inventory';
import Customers from './components/pages/Customers';
import Settings from './components/pages/Settings';

// Lazy load secondary pages only
const CategoryInventory = lazy(() => import('./components/pages/CategoryInventory'));
const StoreFront = lazy(() => import('./components/pages/StoreFront'));
const AdminUsers = lazy(() => import('./components/pages/AdminUsers'));
const ActivityLogs = lazy(() => import('./components/pages/ActivityLogs'));

// Loading fallback for Suspense
const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center h-full min-h-[300px]">
    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, pendingCount, sync } = useOfflineSync();
  const [session, setSession] = useState<{ email: string; role: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(38.50);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: 'Stefy Beauty',
    address: 'Av. Principal, Local 4',
    phone: '+58 412-1234567',
    email: 'contacto@stefybeauty.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    facebook: 'https://facebook.com'
  });

  const isStoreView = location.pathname === '/store';

  // Initialize Auth and Local Data
  useEffect(() => {
    const initData = () => {
      try {
        const activeSession = localStorage.getItem('app_session');
        if (activeSession) {
          setSession(JSON.parse(activeSession));
        }

        // Load cached data for offline readiness
        const cachedProducts = localStorage.getItem('cache_products');
        const cachedCustomers = localStorage.getItem('cache_customers');
        const cachedSales = localStorage.getItem('cache_sales');
        const cachedCategories = localStorage.getItem('cache_categories');
        const cachedBiz = localStorage.getItem('cache_business_info');

        if (cachedProducts) setProducts(JSON.parse(cachedProducts));
        if (cachedCustomers) setCustomers(JSON.parse(cachedCustomers));
        if (cachedSales) setSales(JSON.parse(cachedSales));
        if (cachedCategories) setCategories(JSON.parse(cachedCategories));
        if (cachedBiz) setBusinessInfo(JSON.parse(cachedBiz));
        
      } catch (e) {
        console.error('Data initialization failed', e);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initData();
  }, []);

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    if (products.length > 0) localStorage.setItem('cache_products', JSON.stringify(products));
    if (customers.length > 0) localStorage.setItem('cache_customers', JSON.stringify(customers));
    if (sales.length > 0) localStorage.setItem('cache_sales', JSON.stringify(sales));
    if (categories.length > 0) localStorage.setItem('cache_categories', JSON.stringify(categories));
    localStorage.setItem('cache_business_info', JSON.stringify(businessInfo));
  }, [products, customers, sales, categories, businessInfo]);

  // Fetch Business Info independently of session
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const { data: bData } = await supabase.from('business_info').select('*').single();
        if (bData) {
          setBusinessInfo({
            ...bData,
            paymentConfig: bData.payment_config
          });
          if (bData.exchange_rate) {
            setExchangeRate(Number(bData.exchange_rate));
          }
        }
      } catch (e) {
        console.error('Error fetching business info:', e);
      }
    };
    fetchBusinessInfo();
  }, []);

  // Fetch data and setup realtime subscriptions (requiring auth)
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const { data: pData } = await supabase.from('productos').select('*');
      const { data: cData } = await supabase.from('clientes').select('*');
      const { data: sData } = await supabase.from('ventas').select('*');
      const { data: catData } = await supabase.from('categorias').select('*').order('name');
      
      if (pData && pData.length > 0) {
        setProducts(pData.map(p => ({ ...p, costPrice: p.cost_price } as Product)));
      }
      
      if (cData && cData.length > 0) {
        setCustomers(cData.map(c => ({ 
          ...c, 
          totalPurchases: c.total_purchases,
          idCard: c.id_card 
        } as Customer)));
      }

      if (sData && sData.length > 0) {
        setSales(sData.map(s => ({ ...s, paymentMethods: s.payment_methods, customerId: s.customer_id } as Sale)));
      }

      if (catData && catData.length > 0) {
        setCategories(catData);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCategories(prev => {
            if (prev.find(c => c.id === payload.new.id)) return prev;
            return [...prev, payload.new as Category];
          });
        } else if (payload.eventType === 'UPDATE') {
          setCategories(prev => prev.map(c => c.id === payload.new.id ? payload.new as Category : c));
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_info' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setBusinessInfo({
            ...payload.new as any,
            paymentConfig: (payload.new as any).payment_config
          });
          if ((payload.new as any).exchange_rate) {
            setExchangeRate(Number((payload.new as any).exchange_rate));
          }
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // Consultar la tabla personalizada 'empleados' en Supabase
      const { data: user, error } = await supabase
        .from('empleados')
        .select('*')
        .ilike('email', cleanEmail)
        .eq('password', cleanPassword)
        .single();

      if (error) {
        console.error('Login error:', error);
        if (error.code === 'PGRST116') {
          setAuthError('Email o contraseña incorrectos');
        } else {
          setAuthError(`Error de conexión: ${error.message} (Código: ${error.code || 'Desconocido'})`);
        }
      } else if (!user) {
        setAuthError('Usuario no encontrado');
      } else {
        const newSession = { email: user.email, role: user.role };
        localStorage.setItem('app_session', JSON.stringify(newSession));
        setSession(newSession);
      }
    } catch (err: any) {
      console.error('Auth Exception:', err);
      setAuthError('Ha ocurrido un error inesperado');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('app_session');
    setSession(null);
    setEmail('');
    setPassword('');
    navigate('/');
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
            <h1 className="font-serif text-3xl font-bold text-primary-800 mb-2">{businessInfo.name}</h1>
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
    navigate('/category-inventory');
  };

  const handleProcessSale = async (sale: Sale) => {
    // Optimistic update
    setSales(prev => [sale, ...prev]);
    
    // Process sale with offline support
    const saleData = {
      id: sale.id,
      date: sale.date,
      items: sale.items,
      total: sale.total,
      discount: sale.discount,
      payment_methods: sale.paymentMethods,
      customer_id: sale.customerId,
      profit: sale.profit
    };

    if (isOnline) {
      try {
        const { error } = await supabase.from('ventas').insert(saleData);
        if (error) throw error;
      } catch (e) {
        console.error('Error sharing sale online, queueing...', e);
        offlineManager.addAction('CREATE_SALE', saleData);
      }
    } else {
      offlineManager.addAction('CREATE_SALE', saleData);
    }
  };

  return (
    <div className="flex flex-col fixed inset-0 w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden">
      <Toaster position="top-center" />
      <PWAManager businessInfo={businessInfo} />
      {/* Header */}
      {!isStoreView && (
        <header className="bg-white px-4 py-2.5 shadow-sm z-10 flex items-center justify-between shrink-0">
          <h1 className="font-serif text-xl font-bold text-primary-800 tracking-tight">{businessInfo.name}</h1>
          
          <div className="flex items-center space-x-3">
            {/* Sync status indicator */}
            <div className="flex items-center">
              {pendingCount > 0 ? (
                <button 
                  onClick={() => sync()}
                  className="flex items-center space-x-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-full animate-pulse border border-amber-100"
                  title="Sincronizando datos pendientes..."
                >
                  <RefreshCcw size={12} className="animate-spin" />
                  <span className="text-[10px] font-black">{pendingCount}</span>
                </button>
              ) : (
                <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full ${isOnline ? 'text-green-600' : 'text-red-600 bg-red-50'}`}>
                  {isOnline ? (
                    <Wifi size={14} className="opacity-40" />
                  ) : (
                    <>
                      <WifiOff size={14} />
                      <span className="text-[8px] font-black uppercase">Offline</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {session.role === 'admin' && location.pathname !== '/admin-users' && (
              <button 
                onClick={() => navigate('/admin-users')}
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
      <main className={`flex-1 overflow-y-auto ${!isStoreView ? 'pb-28' : ''}`}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home onNavigate={(p: any) => navigate(`/${p === 'home' ? '' : p}`)} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} products={products} sales={sales} businessInfo={businessInfo} />} />
            <Route path="/pos" element={<POS exchangeRate={exchangeRate} products={products} customers={customers} sales={sales} onProcessSale={handleProcessSale} businessInfo={businessInfo} />} />
            <Route path="/inventory" element={<Inventory onSelectCategory={handleCategorySelect} products={products} categories={categories} setCategories={setCategories} isOnline={isOnline} />} />
            <Route path="/customers" element={<Customers customers={customers} sales={sales} />} />
            <Route path="/category-inventory" element={<CategoryInventory category={selectedCategory} onBack={() => navigate('/inventory')} exchangeRate={exchangeRate} products={products} setProducts={setProducts} />} />
            <Route path="/settings" element={<Settings businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} onNavigate={(p: any) => navigate(`/${p}`)} onSignOut={handleSignOut} />} />
            <Route path="/store" element={<StoreFront products={products} exchangeRate={exchangeRate} onBack={() => navigate('/')} businessInfo={businessInfo} />} />
            <Route path="/admin-users" element={<AdminUsers onBack={() => navigate('/settings')} />} />
            <Route path="/activity-logs" element={<ActivityLogs onBack={() => navigate('/settings')} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bottom Navigation */}
      {!isStoreView && <BottomNav />}
    </div>
  );
}
