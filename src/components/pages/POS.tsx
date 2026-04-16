import { useState } from 'react';
import { ShoppingBag, BarChart3, History, ArrowLeft, Search, Plus, Minus, X, CheckCircle2, ChevronRight, Wallet, Percent, Smartphone, CreditCard, Banknote, MessageCircle, User, ReceiptText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product, CartItem, Customer, PaymentMethod, Sale, BusinessInfo } from '../../types';
import { supabase } from '../../lib/supabase';

interface POSProps {
  exchangeRate: number;
  products: Product[];
  customers?: Customer[];
  sales?: Sale[];
  businessInfo?: BusinessInfo;
  onProcessSale?: (sale: Sale) => void;
}

type ViewState = 'menu' | 'new_sale' | 'reports' | 'history';

export default function POS({ exchangeRate, products, customers = [], sales = [], businessInfo, onProcessSale }: POSProps) {
  const [view, setView] = useState<ViewState>('menu');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // --- POS State ---
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod['method']>('zelle');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Handlers ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - (subtotal * (discount / 100)));
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const processSale = async () => {
    const newSale: Sale = {
      id: `SALE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toISOString(),
      items: cart,
      total: total,
      discount: discount,
      paymentMethods: [{ method: paymentMethod, amount: total }],
      customerId: selectedCustomer || undefined,
      profit: cart.reduce((sum, item) => sum + ((item.price - (item.costPrice || 0)) * item.quantity), 0) - (subtotal * (discount / 100))
    };
    
    if (onProcessSale) {
      onProcessSale(newSale);
    }
    
    // Log activity
    const sessionStr = localStorage.getItem('app_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      await supabase.from('activity_logs').insert({
        user_email: session.email,
        action_type: 'NEW_SALE',
        description: `Registró una venta por $${total.toFixed(2)}`
      });
    }
    
    setIsCheckoutOpen(false);
    setIsSuccess(true);
    toast.success('¡Venta completada exitosamente!');
  };

  const resetPOS = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomer('');
    setAmountReceived('');
    setIsSuccess(false);
    setSearch('');
    setView('menu');
  };

  // --- Views ---

  if (view === 'new_sale') {
    const categories = Array.from(new Set(products.map(p => p.category)));

    const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="h-full flex flex-col bg-gray-50 animate-in slide-in-from-right-8 duration-300 relative">
        <div className="bg-white px-4 py-3 shadow-sm flex flex-col space-y-3 z-10">
          <div className="flex items-center space-x-3">
            <button onClick={() => setView('menu')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>
          </div>
          
          {/* Categories (Pills) */}
          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex space-x-2 pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === null ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Todos
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === category ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 pb-24">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-left hover:border-primary-300 active:scale-95 transition-all flex flex-col"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-gray-50">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 line-clamp-2 mb-1 flex-1">{product.name}</h3>
              <div className="flex justify-between items-end w-full mt-auto">
                <span className="font-bold text-primary-600">${product.price.toFixed(2)}</span>
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <Plus size={14} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {itemCount > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between hover:bg-gray-800 transition-transform active:scale-95"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {itemCount}
                </div>
                <span className="font-semibold">Ver Ticket</span>
              </div>
              <span className="font-bold text-lg">${subtotal.toFixed(2)}</span>
            </button>
          </div>
        )}

        {/* Simple Cart Drawer */}
        {isCartOpen && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCartOpen(false)} />
            <div className="bg-white rounded-t-3xl h-[80%] flex flex-col relative animate-in slide-in-from-bottom-full duration-300">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Ticket Actual</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 bg-white border border-gray-100 p-3 rounded-2xl">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-gray-50" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs font-bold text-primary-600">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-gray-500 hover:text-gray-900 bg-white rounded shadow-sm"><Minus size={14} /></button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-gray-500 hover:text-gray-900 bg-white rounded shadow-sm"><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-gray-100 pb-safe">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-gray-500 font-medium">Total a Cobrar</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-gray-900">${subtotal.toFixed(2)}</div>
                    <div className="text-sm font-medium text-gray-500">Bs. {(subtotal * exchangeRate).toFixed(2)}</div>
                  </div>
                </div>
                <button 
                  className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg shadow-sm hover:bg-primary-700 transition-colors flex items-center justify-center"
                  onClick={handleCheckout}
                >
                  <CheckCircle2 size={24} className="mr-2" />
                  Cobrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Drawer (Payment Terminal) */}
        {isCheckoutOpen && (
          <div className="absolute inset-0 z-40 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCheckoutOpen(false)} />
            <div className="bg-gray-50 rounded-t-3xl h-[92%] flex flex-col relative animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-3xl">
                <h2 className="text-lg font-bold text-gray-900">Terminal de Pago</h2>
                <button onClick={() => setIsCheckoutOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Total Display */}
                <div className="bg-gray-900 rounded-3xl p-6 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"></div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Monto a Cobrar</p>
                  <h1 className="text-5xl font-bold text-white tracking-tight mb-2 font-mono">${total.toFixed(2)}</h1>
                  <p className="text-gray-400 font-medium font-mono">Bs. {(total * exchangeRate).toFixed(2)}</p>
                </div>

                <div className="space-y-5">
                  {/* Customer Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Asignar a Clienta</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select 
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-200 outline-none appearance-none shadow-sm"
                      >
                        <option value="">Consumidor Final</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Aplicar Descuento (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="number" 
                        value={discount || ''}
                        onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                        placeholder="0"
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary-200 outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Método de Pago</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setPaymentMethod('zelle')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${paymentMethod === 'zelle' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        <Smartphone size={28} strokeWidth={paymentMethod === 'zelle' ? 2.5 : 2} />
                        <span className="text-sm font-bold">Zelle</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('pago_movil')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${paymentMethod === 'pago_movil' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        <Smartphone size={28} strokeWidth={paymentMethod === 'pago_movil' ? 2.5 : 2} />
                        <span className="text-sm font-bold">Pago Móvil</span>
                      </button>
                      <button 
                        onClick={() => { setPaymentMethod('cash_usd'); setAmountReceived(''); }}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${paymentMethod === 'cash_usd' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        <Banknote size={28} strokeWidth={paymentMethod === 'cash_usd' ? 2.5 : 2} />
                        <span className="text-sm font-bold">Efectivo ($)</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('pos')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${paymentMethod === 'pos' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        <CreditCard size={28} strokeWidth={paymentMethod === 'pos' ? 2.5 : 2} />
                        <span className="text-sm font-bold">Punto de Venta</span>
                      </button>
                    </div>
                  </div>

                  {/* Cash Change Calculator (Worker Feature) */}
                  {paymentMethod === 'cash_usd' && (
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Calculadora de Vuelto</label>
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">$</span>
                          <input 
                            type="number" 
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value ? Number(e.target.value) : '')}
                            placeholder="Monto recibido..."
                            className="w-full pl-8 pr-4 py-3 bg-white border border-green-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-400 outline-none"
                          />
                        </div>
                      </div>
                      {typeof amountReceived === 'number' && amountReceived >= total && (
                        <div className="mt-3 flex justify-between items-center bg-white p-3 rounded-xl border border-green-100">
                          <span className="text-sm font-bold text-gray-500">Cambio a entregar:</span>
                          <span className="text-xl font-black text-green-600">${(amountReceived - total).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-white border-t border-gray-200 pb-safe">
                <button 
                  className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-primary-700 transition-transform active:scale-95 flex items-center justify-center"
                  onClick={processSale}
                >
                  <CheckCircle2 size={24} className="mr-2" />
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {isSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" />
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 shadow-2xl">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Venta Exitosa!</h2>
              <p className="text-gray-500 mb-8 font-medium">El pago de ${total.toFixed(2)} ha sido procesado.</p>
              
              <div className="w-full space-y-3">
                <button 
                  className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-[#128C7E] transition-colors shadow-md"
                  onClick={() => {
                    alert('Abriendo WhatsApp...');
                    resetPOS();
                  }}
                >
                  <MessageCircle size={22} />
                  <span>Enviar Recibo</span>
                </button>
                <button 
                  className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                  onClick={resetPOS}
                >
                  Volver al Menú
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'reports') {
    return (
      <div className="h-full flex flex-col bg-gray-50 animate-in slide-in-from-right-8 duration-300">
        <div className="bg-white px-4 py-3 shadow-sm flex items-center space-x-3 z-10">
          <button onClick={() => setView('menu')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            Reportes de Ventas
          </h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-blue-50 text-blue-500">
            <BarChart3 size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Próximamente</h3>
          <p className="text-gray-500">Esta sección está en construcción. Aquí podrás ver tus estadísticas detalladas muy pronto.</p>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="h-full flex flex-col bg-gray-50 animate-in slide-in-from-right-8 duration-300 relative">
        <div className="bg-white px-4 py-3 shadow-sm flex items-center space-x-3 z-10">
          <button onClick={() => setView('menu')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Historial de Caja</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {sales && sales.length > 0 ? (
            [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => (
              <button
                key={sale.id}
                onClick={() => setSelectedSale(sale)}
                className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col text-left hover:border-primary-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2 w-full">
                  <div>
                    <span className="text-xs font-bold text-gray-400">{sale.id}</span>
                    <h3 className="text-sm font-bold text-gray-900 mt-0.5">
                      {new Date(sale.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </h3>
                  </div>
                  <span className="text-base font-black text-gray-900">${sale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                      {sale.paymentMethods[0]?.method.replace('_', ' ')}
                    </span>
                    {sale.customerId && (
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-primary-50 text-primary-600 flex items-center">
                        <User size={10} className="mr-1" />
                        {customers.find(c => c.id === sale.customerId)?.name || 'Clienta'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500">{sale.items.reduce((acc, item) => acc + item.quantity, 0)} arts.</span>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12">
              <History size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No hay ventas registradas</p>
            </div>
          )}
        </div>

        {/* Ticket Modal */}
        {selectedSale && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedSale(null)} />
            <div className="bg-gray-100 rounded-t-3xl h-[85%] flex flex-col relative animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-3xl">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <ReceiptText className="mr-2 text-primary-600" size={20}/> 
                  Detalle de Venta
                </h2>
                <button onClick={() => setSelectedSale(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20}/>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {/* Receipt Paper */}
                <div className="bg-white mx-auto shadow-sm border border-gray-200 p-5 rounded-lg font-mono text-sm relative max-w-sm">
                  <div className="text-center mb-4 border-b-2 border-dashed border-gray-200 pb-4">
                    {businessInfo?.logo && (
                      <div className="flex justify-center mb-3">
                        <img src={businessInfo.logo} alt="Logo" className="w-16 h-16 object-cover rounded-md grayscale" />
                      </div>
                    )}
                    <h3 className="font-bold text-lg uppercase tracking-widest text-gray-900">{businessInfo?.name || 'Ticket'}</h3>
                    {businessInfo?.address && <p className="text-xs text-gray-500 mt-1">{businessInfo.address}</p>}
                    {businessInfo?.phone && <p className="text-xs text-gray-500">{businessInfo.phone}</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(selectedSale.date).toLocaleString('es-ES')}</p>
                    <p className="text-xs text-gray-400">Recibo: {selectedSale.id.substring(0, 8)}</p>
                  </div>
                  <div className="space-y-3">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="flex justify-between font-semibold text-gray-800 mb-1">
                          <span className="line-clamp-1 pr-2">{item.name}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <span className="text-xs text-gray-500">{item.quantity} x ${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200">
                    {selectedSale.discount > 0 && (
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Descuento</span>
                        <span>{selectedSale.discount}%</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg text-gray-900">
                      <span>TOTAL</span>
                      <span>${selectedSale.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Método de Pago</span>
                      <span className="uppercase">{selectedSale.paymentMethods[0]?.method.replace('_', ' ')}</span>
                    </div>
                    {selectedSale.customerId && (
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Clienta</span>
                        <span>{customers.find(c => c.id === selectedSale.customerId)?.name || 'Registrada'}</span>
                      </div>
                    )}
                  </div>
                  {(businessInfo?.instagram || businessInfo?.email) && (
                    <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 text-center space-y-1">
                      <p className="text-xs font-bold text-gray-800">¡Gracias por su compra!</p>
                      {businessInfo.instagram && <p className="text-[10px] text-gray-500">IG: {businessInfo.instagram.replace('https://instagram.com/', '@')}</p>}
                      {businessInfo.email && <p className="text-[10px] text-gray-500">{businessInfo.email}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- MAIN MENU VIEW ---
  return (
    <div className="h-full flex flex-col bg-[#F8F9FA] animate-in fade-in duration-300">
      <div className="px-6 pt-8 pb-6">
        <h2 className="text-2xl font-serif font-bold text-gray-900">Gestión de Caja</h2>
        <p className="text-gray-500 text-sm mt-1">Selecciona una operación para continuar</p>
      </div>

      <div className="px-6 space-y-4">
        {/* Nueva Venta Button */}
        <button 
          onClick={() => setView('new_sale')}
          className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center space-x-5 hover:border-primary-300 hover:shadow-md transition-all group text-left"
        >
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingBag size={32} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Nueva Venta</h3>
            <p className="text-sm text-gray-500">Crear un nuevo ticket de cobro</p>
          </div>
          <ChevronRight size={24} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
        </button>

        <div className="grid grid-cols-2 gap-4">
          {/* Reportes Button */}
          <button 
            onClick={() => setView('reports')}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 size={28} strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Reportes</h3>
            <p className="text-xs text-gray-500">Estadísticas</p>
          </button>

          {/* Historial Button */}
          <button 
            onClick={() => setView('history')}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wallet size={28} strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Cierre de Caja</h3>
            <p className="text-xs text-gray-500">Historial</p>
          </button>
        </div>
      </div>
    </div>
  );
}
