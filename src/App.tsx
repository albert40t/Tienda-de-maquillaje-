import { useState } from 'react';
import BottomNav from './components/BottomNav';
import Home from './components/pages/Home';
import POS from './components/pages/POS';
import Inventory from './components/pages/Inventory';
import CategoryInventory from './components/pages/CategoryInventory';
import Customers from './components/pages/Customers';
import Settings from './components/pages/Settings';
import StoreFront from './components/pages/StoreFront';
import { mockProducts, mockCustomers, mockSales } from './data/mockData';
import { Product, BusinessInfo, Customer, Sale } from './types';

export type Page = 'home' | 'pos' | 'inventory' | 'customers' | 'settings' | 'category-inventory' | 'store';

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
    email: 'contacto@stelybeauty.com'
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
        return <StoreFront products={products} exchangeRate={exchangeRate} onBack={() => setCurrentPage('home')} />;
      default:
        return <Home onNavigate={setCurrentPage} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} products={products} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative">
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
      <main className={`flex-1 overflow-y-auto ${currentPage !== 'store' ? 'pb-20' : ''}`}>
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      {currentPage !== 'store' && <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />}
    </div>
  );
}
