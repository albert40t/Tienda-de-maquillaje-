import { useState, Suspense, lazy } from 'react';
import BottomNav from './components/BottomNav';
import { mockProducts, mockCustomers, mockSales } from './data/mockData';
import { Product, BusinessInfo, Customer, Sale } from './types';

// Lazy load pages for Code Splitting (Performance Optimization)
const Home = lazy(() => import('./components/pages/Home'));
const POS = lazy(() => import('./components/pages/POS'));
const Inventory = lazy(() => import('./components/pages/Inventory'));
const CategoryInventory = lazy(() => import('./components/pages/CategoryInventory'));
const Customers = lazy(() => import('./components/pages/Customers'));
const Settings = lazy(() => import('./components/pages/Settings'));
const StoreFront = lazy(() => import('./components/pages/StoreFront'));

export type Page = 'home' | 'pos' | 'inventory' | 'customers' | 'settings' | 'category-inventory' | 'store';

// Loading fallback for Suspense
const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(38.50);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: 'Stely Beauty',
    address: 'Av. Principal, Local 4',
    phone: '+58 412-1234567',
    email: 'contacto@stelybeauty.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    facebook: 'https://facebook.com'
  });

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage('category-inventory');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} products={products} />;
      case 'pos':
        return <POS exchangeRate={exchangeRate} products={products} customers={customers} sales={sales} onProcessSale={(sale) => setSales(prev => [sale, ...prev])} />;
      case 'inventory':
        return <Inventory onSelectCategory={handleCategorySelect} products={products} />;
      case 'customers':
        return <Customers customers={customers} sales={sales} />;
      case 'category-inventory':
        return <CategoryInventory category={selectedCategory} onBack={() => setCurrentPage('inventory')} exchangeRate={exchangeRate} products={products} setProducts={setProducts} />;
      case 'settings':
        return <Settings businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} />;
      case 'store':
        return <StoreFront products={products} exchangeRate={exchangeRate} onBack={() => setCurrentPage('home')} businessInfo={businessInfo} />;
      default:
        return <Home onNavigate={setCurrentPage} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} products={products} />;
    }
  };

  return (
    <div className="flex flex-col fixed inset-0 w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden">
      {/* Header */}
      {currentPage !== 'store' && (
        <header className="bg-white px-4 py-2.5 shadow-sm z-10 flex items-center justify-between">
          <h1 className="font-serif text-xl font-bold text-primary-800 tracking-tight">{businessInfo.name}</h1>
          <div className="w-7 h-7 text-xs rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
            {businessInfo.name.substring(0, 2).toUpperCase()}
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
