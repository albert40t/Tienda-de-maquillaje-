import { TrendingUp, PackageMinus, Clock, ChevronRight, DollarSign, AlertTriangle, Award, Store, Activity, Package, Edit2, Trash2, ShoppingCart, Check, X as CloseIcon, ShoppingBag } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Product, Sale, BusinessInfo, Page } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatBs, formatUSD } from '../../lib/formatUtils';

interface ActivityLog {
  id: string;
  user_email: string;
  action_type: string;
  description: string;
  created_at: string;
}

interface HomeProps {
  onNavigate: (page: Page) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  products: Product[];
  sales?: Sale[];
  businessInfo: BusinessInfo;
  userRole?: string;
}

export default function Home({ onNavigate, exchangeRate, setExchangeRate, products, sales = [], businessInfo, userRole }: HomeProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const normalizedRole = userRole?.toLowerCase().trim();
  const isSalesperson = normalizedRole === 'vendedor' || normalizedRole === 'salesperson' || normalizedRole === 'worker';

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (data) setLogs(data);
      setIsLoadingLogs(false);
    };

    fetchLogs();

    const channel = supabase.channel('home-activity-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setLogs(prev => [payload.new as ActivityLog, ...prev.slice(0, 4)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getIconForAction = (actionType: string) => {
    switch (actionType) {
      case 'CREATE_PRODUCT': return <Package size={14} className="text-green-600" />;
      case 'UPDATE_PRODUCT': return <Edit2 size={14} className="text-blue-600" />;
      case 'DELETE_PRODUCT': return <Trash2 size={14} className="text-red-600" />;
      case 'NEW_SALE': return <ShoppingCart size={14} className="text-purple-600" />;
      default: return <Activity size={14} className="text-gray-600" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Ahora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return new Date(dateStr).toLocaleDateString();
  };
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

  const topSellers = products.slice(0, 3);

  const [pendingRate, setPendingRate] = useState<number | null>(null);
  const [isConfirmingRate, setIsConfirmingRate] = useState(false);
  const [localRate, setLocalRate] = useState<string>(exchangeRate.toString());

  // Update localRate when global exchangeRate changes (e.g. from Supabase sync)
  useEffect(() => {
    setLocalRate(exchangeRate.toString());
  }, [exchangeRate]);

  const handleRateChange = (val: string) => {
    setLocalRate(val);
  };

  const initiateRateUpdate = () => {
    const newRate = Number(localRate);
    if (isNaN(newRate) || newRate <= 0 || newRate === exchangeRate) return;
    setPendingRate(newRate);
    setIsConfirmingRate(true);
  };

  const confirmRateUpdate = async () => {
    if (pendingRate === null) return;
    
    const rateToSave = pendingRate;
    setIsConfirmingRate(false);
    setPendingRate(null);
    
    // Optimistic UI update
    setExchangeRate(rateToSave);
    
    // Update local cache object
    if (businessInfo) {
      businessInfo.exchange_rate = rateToSave;
    }
    
    const loadingToast = toast.loading('Sincronizando tasa con la base de datos...');
    
    try {
      const { data: existing } = await supabase.from('business_info').select('id').eq('id', 1).single();
      let saveError;
      
      if (existing) {
        const { error } = await supabase
          .from('business_info')
          .update({ exchange_rate: rateToSave })
          .eq('id', 1);
        saveError = error;
      } else {
        const { error } = await supabase
          .from('business_info')
          .insert({ id: 1, exchange_rate: rateToSave });
        saveError = error;
      }

      if (saveError) throw saveError;
      
      toast.success(`¡Sincronizado! Tasa oficial: Bs. ${formatBs(rateToSave)}`, {
        id: loadingToast,
        icon: '✅',
      });
    } catch (error: any) {
      console.error('Error updating exchange rate:', error);
      if (error?.message?.includes('could not find the') || error?.message?.includes('schema cache')) {
        toast.error('Atención: La tasa se guardó temporalmente. Para guardarla en la base de datos, debes ejecutar el script SQL de migración "20240417000001_add_exchange_rate" en Supabase.', {
          id: loadingToast,
          duration: 10000,
        });
      } else {
        toast.error(`Error al guardar en la base de datos: ${error?.message || 'Se mantuvo el valor anterior.'}`, {
          id: loadingToast,
        });
      }
    }
  };

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-300">
      <div id="tutorial-welcome" className="space-y-0.5">
        <h2 className="text-xs font-medium text-gray-500">Hola, {businessInfo.name}</h2>
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
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-gray-50 rounded-xl px-3 py-1 border border-gray-200">
            <span className="text-gray-500 font-medium mr-1">Bs.</span>
            <input
              type="number"
              value={localRate}
              onChange={(e) => handleRateChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && initiateRateUpdate()}
              readOnly={isSalesperson}
              className={`w-16 text-right font-bold text-lg bg-transparent outline-none text-gray-900 ${isSalesperson ? 'cursor-default' : ''}`}
              step="0.01"
            />
          </div>
          {!isSalesperson && Number(localRate) !== exchangeRate && Number(localRate) > 0 && (
            <button 
              onClick={initiateRateUpdate}
              className="p-2 bg-primary-600 text-white rounded-xl shadow-sm hover:bg-primary-700 animate-in fade-in zoom-in duration-200"
            >
              <Check size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Exchange Rate */}
      {isConfirmingRate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsConfirmingRate(false)} />
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <DollarSign size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Actualizar Tasa?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Vas a cambiar la tasa oficial a <span className="font-bold text-gray-900">Bs. {formatBs(pendingRate || 0)}</span>. Esto afectará todos los cálculos de la terminal.
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={() => setIsConfirmingRate(false)}
                  className="py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <CloseIcon size={18} />
                  <span>No</span>
                </button>
                <button 
                  onClick={confirmRateUpdate}
                  className="py-3 px-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 shadow-md shadow-primary-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Check size={18} />
                  <span>Sí</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div id="dashboard-stats" className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              +${formatUSD(totalProfit)} Ganancia
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ventas (Hoy)</p>
            <p className="text-xl font-bold text-gray-900">${formatUSD(totalSales > 0 ? totalSales : 0)}</p>
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
              <ShoppingBag size={20} className="text-white" />
            </div>
            <span className="font-medium">Nueva Venta (Caja)</span>
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Actividad reciente</h3>
          <button 
            onClick={() => onNavigate('activity-logs')}
            className="text-xs font-bold text-primary-600 flex items-center"
          >
            Ver todo <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoadingLogs ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400">Cargando actividad...</p>
            </div>
          ) : logs.length > 0 ? (
            logs.map((log, i) => (
              <div key={log.id} className={`p-4 flex items-center justify-between ${i !== logs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="bg-gray-50 p-2 rounded-xl text-gray-400 shrink-0">
                    {getIconForAction(log.action_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {log.description}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {getTimeAgo(log.created_at)} • {(log.user_email || 'usuario').split('@')[0]}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-gray-50/50">
              <Activity size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 font-medium">No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
