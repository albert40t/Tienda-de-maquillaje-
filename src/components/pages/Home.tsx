import { TrendingUp, PackageMinus, Clock, ChevronRight, DollarSign, AlertTriangle, Award, Store } from 'lucide-react';
import { Page } from '../../App';
import { Product, Sale } from '../../types';

interface HomeProps {
  onNavigate: (page: Page) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  products: Product[];
  sales?: Sale[];
}

export default function Home({ onNavigate, exchangeRate, setExchangeRate, products, sales = [] }: HomeProps) {
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

  // Mock top sellers
  const topSellers = products.slice(0, 3);

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-300">
      <div className="space-y-0.5">
        <h2 className="text-xs font-medium text-gray-500">Hola, Stely</h2>
        <p className="text-xl font-semibold text-gray-900">Resumen de hoy</p>
      </div>

      {/* Exchange Rate Card */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-50 p-2 rounded-full text-blue-600">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tasa del día</p>
          </div>
        </div>
        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-1 border border-gray-200">
          <span className="text-gray-500 font-medium mr-1">Bs.</span>
          <input
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Number(e.target.value))}
            className="w-16 text-right font-bold text-lg bg-transparent outline-none text-gray-900"
            step="0.01"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              +${totalProfit.toFixed(2)} Ganancia
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ventas (Hoy)</p>
            <p className="text-xl font-bold text-gray-900">${totalSales > 0 ? totalSales.toFixed(2) : '458.50'}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 h-32">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${lowStockCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
              <PackageMinus size={16} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Bajo Stock</p>
              <p className="text-sm font-bold text-gray-900">{lowStockCount} items</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${outOfStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Agotados</p>
              <p className="text-sm font-bold text-gray-900">{outOfStockCount} items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Acciones rápidas</h3>
        
        <button 
          onClick={() => onNavigate('store')}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white rounded-2xl p-4 flex items-center justify-between transition-colors shadow-md"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Store size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-base">Ver Tienda Online</p>
              <p className="text-pink-100 text-xs">Vista para clientes</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-pink-100" />
        </button>

        <button 
          onClick={() => onNavigate('pos')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-2xl p-4 flex items-center justify-between transition-colors shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="font-medium">Nueva Venta</span>
          </div>
          <ChevronRight size={20} className="text-primary-200" />
        </button>
      </div>

      {/* Top Sellers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Más Vendidos</h3>
          <Award size={20} className="text-amber-500" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {topSellers.map((product, i) => (
            <div key={product.id} className={`p-3 flex items-center space-x-3 ${i !== topSellers.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                <p className="text-xs text-gray-500">{product.category}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Actividad reciente</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className={`p-4 flex items-center justify-between ${i !== 2 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="bg-gray-50 p-2 rounded-full text-gray-400">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Venta #10{4-i}</p>
                  <p className="text-xs text-gray-500">Hace {i * 15 + 5} min</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900">+${(Math.random() * 50 + 10).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
