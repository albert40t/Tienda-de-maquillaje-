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
import Login from './components/pages/Login';

// Lazy load secondary pages only
const CategoryInventory = lazy(() => import('./components/pages/CategoryInventory'));
const StoreFront = lazy(() => import('./components/pages/StoreFront'));
const AdminUsers = lazy(() => import('./components/pages/AdminUsers'));
const ActivityLogs = lazy(() => import('./components/pages/ActivityLogs'));

// Auth Guard Component
const AuthGuard = ({ children, session }: { children: React.ReactNode, session: any }) => {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

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
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(38.50);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: 'Stefy Beauty',
    address: 'Av. Principal, Local 4',
    phone: '+58 412-1234567',
    email: 'contacto@stefybeauty.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    facebook: 'https://facebook.com'
  });

  const isStoreView = location.pathname === '/';

  // APK/Standalone Detection and Redirection
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const searchParams = new URLSearchParams(location.search);
    const isApkMode = searchParams.get('mode') === 'apk' || searchParams.get('apk') === 'true';

    // If it's the APK/App and they are at the root (store) without a session, send to login
    if ((isStandalone || isApkMode) && location.pathname === '/' && !session && !isAuthLoading) {
      navigate('/login', { replace: true });
    }
  }, [location, session, isAuthLoading, navigate]);

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
        const cachedBanners = localStorage.getItem('cache_banners');
        const cachedBiz = localStorage.getItem('cache_business_info');

        if (cachedProducts) setProducts(JSON.parse(cachedProducts));
        if (cachedCustomers) setCustomers(JSON.parse(cachedCustomers));
        if (cachedSales) setSales(JSON.parse(cachedSales));
        if (cachedCategories) setCategories(JSON.parse(cachedCategories));
        if (cachedBanners) setBanners(JSON.parse(cachedBanners));
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
    if (banners.length > 0) localStorage.setItem('cache_banners', JSON.stringify(banners));
    localStorage.setItem('cache_business_info', JSON.stringify(businessInfo));
  }, [products, customers, sales, categories, banners, businessInfo]);

  // Fetch Business Info independently of session
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const { data: bData } = await supabase.from('business_info').select('*').single();
        if (bData) {
          setBusinessInfo({
            ...bData,
            paymentConfig: bData.payment_config,
            storeUrl: bData.store_url
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

  // Fetch Public Data (Products, Categories, Banners)
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const { data: pData } = await supabase.from('productos').select('*');
        const { data: catData } = await supabase.from('categorias').select('*').order('name');
        const { data: bData } = await supabase.from('banners').select('*').order('created_at');
        
        if (pData) setProducts(pData.map(p => ({ ...p, costPrice: p.cost_price } as Product)));
        if (catData) setCategories(catData);
        if (bData) setBanners(bData);
      } catch (err) {
        console.error('Error fetching public data:', err);
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchPublicData();

    if (isOnline) {
      const pollInterval = setInterval(() => {
        fetchPublicData();
      }, 120000); // 2 minutes
      return () => clearInterval(pollInterval);
    }
  }, [isOnline]);

  // Fetch Private Data and setup realtime subscriptions (requiring auth)
  useEffect(() => {
    if (!session) return;

    const fetchPrivateData = async () => {
      try {
        const { data: cData } = await supabase.from('clientes').select('*');
        const { data: sData } = await supabase.from('ventas').select('*');
        
        if (cData) setCustomers(cData.map(c => ({ ...c, totalPurchases: c.total_purchases, idCard: c.id_card } as Customer)));
        if (sData) setSales(sData.map(s => ({ ...s, paymentMethods: s.payment_methods, customerId: s.customer_id } as Sale)));
      } catch (err) {
        console.error('Error in background sync:', err);
      }
    };

    fetchPrivateData();

    // POLILLING FALLBACK: Sync every 60 seconds as a safety net
    const pollInterval = setInterval(() => {
      if (isOnline) fetchPrivateData();
    }, 60000);

    // REFETCH ON FOCUS: When user comes back to the app
    const handleFocus = () => {
      if (isOnline) fetchPrivateData();
    };
    window.addEventListener('focus', handleFocus);

    const setupRealtime = () => {
      const channel = supabase.channel('db-changes-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, (payload) => {
          console.log('Realtime product update:', payload);
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
          console.log('Realtime sale update:', payload);
          if (payload.eventType === 'INSERT') {
            setSales(prev => {
              if (prev.find(s => s.id === payload.new.id)) return prev;
              return [{ ...payload.new, paymentMethods: payload.new.payment_methods, customerId: payload.new.customer_id } as Sale, ...prev];
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload) => {
          console.log('Realtime customer update:', payload);
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
          console.log('Realtime category update:', payload);
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
          console.log('Realtime business_info update:', payload);
          if (payload.eventType === 'UPDATE') {
            const bData = payload.new as any;
            setBusinessInfo({
              ...bData,
              paymentConfig: bData.payment_config,
              storeUrl: bData.store_url
            });
            if (bData.exchange_rate) {
              setExchangeRate(Number(bData.exchange_rate));
            }
          }
        })
        .subscribe((status) => {
          console.log('Supabase Realtime status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully connected to all database changes.');
          }
        });

      return channel;
    };

    const channel = setupRealtime();

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(channel);
    };
  }, [session, isOnline]);

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
    navigate('/login');
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col fixed inset-0 w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden justify-center items-center">
        <LoadingSpinner />
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
      {session && !isStoreView && (
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
            {/* Public Route */}
            <Route path="/" element={<StoreFront products={products} exchangeRate={exchangeRate} onBack={() => {}} businessInfo={businessInfo} banners={banners} isLoading={isProductsLoading} />} />
            <Route path="/login" element={
              session ? <Navigate to="/dashboard" replace /> : (
                <Login 
                  email={email} 
                  setEmail={setEmail} 
                  password={password} 
                  setPassword={setPassword} 
                  authError={authError} 
                  onAuth={handleAuth} 
                  isLoading={isAuthLoading}
                  businessName={businessInfo.name}
                />
              )
            } />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<AuthGuard session={session}><Home onNavigate={(p: any) => navigate(`/${p === 'home' ? 'dashboard' : p}`)} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} products={products} sales={sales} businessInfo={businessInfo} /></AuthGuard>} />
            <Route path="/pos" element={<AuthGuard session={session}><POS exchangeRate={exchangeRate} products={products} customers={customers} sales={sales} onProcessSale={handleProcessSale} businessInfo={businessInfo} /></AuthGuard>} />
            <Route path="/inventory" element={<AuthGuard session={session}><Inventory onSelectCategory={handleCategorySelect} products={products} categories={categories} setCategories={setCategories} isOnline={isOnline} businessInfo={businessInfo} /></AuthGuard>} />
            <Route path="/customers" element={<AuthGuard session={session}><Customers customers={customers} sales={sales} /></AuthGuard>} />
            <Route path="/category-inventory" element={<AuthGuard session={session}><CategoryInventory category={selectedCategory} onBack={() => navigate('/inventory')} exchangeRate={exchangeRate} products={products} setProducts={setProducts} /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard session={session}><Settings businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} onNavigate={(p: any) => navigate(`/${p}`)} onSignOut={handleSignOut} banners={banners} setBanners={setBanners} /></AuthGuard>} />
            <Route path="/admin-users" element={<AuthGuard session={session}><AdminUsers onBack={() => navigate('/settings')} /></AuthGuard>} />
            <Route path="/activity-logs" element={<AuthGuard session={session}><ActivityLogs onBack={() => navigate('/settings')} /></AuthGuard>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bottom Navigation */}
      {session && !isStoreView && <BottomNav />}
    </div>
  );
}
