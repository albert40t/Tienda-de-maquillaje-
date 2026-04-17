import { useState } from 'react';
import { ShoppingBag, BarChart3, History, ArrowLeft, Search, Plus, Minus, X, CheckCircle2, ChevronRight, Wallet, Percent, Smartphone, CreditCard, Banknote, MessageCircle, User, ReceiptText, ShoppingCart, Lock, Landmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product, CartItem, Customer, PaymentMethod, Sale, BusinessInfo } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatBs, formatUSD } from '../../lib/formatUtils';

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
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [payments, setPayments] = useState<{method: PaymentMethod['method'], amount: number}[]>([]);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | ''>('');
  const [currentPaymentAmountBs, setCurrentPaymentAmountBs] = useState<number | ''>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod['method']>('zelle');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);

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
    // If no explicit payments added, add the total with current selected method
    const finalPayments = payments.length > 0 
      ? payments 
      : [{ method: currentPaymentMethod, amount: total }];

    const newSale: Sale = {
      id: `SALE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toISOString(),
      items: cart,
      total: total,
      discount: discount,
      paymentMethods: finalPayments,
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
    setPayments([]);
    setDiscount(0);
    setSelectedCustomer('');
    setAmountReceived('');
    setPaymentReference('');
    setCurrentPaymentAmountBs('');
    setIsSuccess(false);
    setSearch('');
    setView('menu');
  };

  const generateWhatsAppReceipt = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    const customerPhone = customer?.phone?.replace(/\D/g, '') || '';
    
    let message = `*RECIBO DE COMPRA - ${businessInfo?.name || 'Stely Beauty'}*\n`;
    message += `----------------------------------\n`;
    message += `*Fecha:* ${new Date().toLocaleString()}\n`;
    if (customer) message += `*Cliente:* ${customer.name}\n`;
    message += `----------------------------------\n`;
    
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} - $${formatUSD(item.price * item.quantity)}\n`;
    });
    
    message += `----------------------------------\n`;
    if (discount > 0) message += `*Descuento:* ${discount}%\n`;
    message += `*TOTAL A PAGAR: $${formatUSD(total)}*\n`;
    message += `*Equivalente en Bs.:* ${formatBs(total * exchangeRate)}\n`;
    message += `----------------------------------\n`;

    const finalPayments = payments.length > 0 
      ? payments 
      : [{ method: currentPaymentMethod, amount: total }];

    if (finalPayments.length === 1) {
      let line = `*Método de Pago:* ${finalPayments[0].method.replace('_', ' ').toUpperCase()}`;
      if (finalPayments[0].reference) line += ` (Ref: ${finalPayments[0].reference})`;
      message += `${line}\n\n`;
    } else {
      message += `*Métodos de Pago:*\n`;
      finalPayments.forEach(p => {
        let line = `• ${p.method.replace('_', ' ').toUpperCase()}: $${formatUSD(p.amount)}`;
        if (p.reference) line += ` (Ref: ${p.reference})`;
        message += `${line}\n`;
      });
      message += `\n`;
    }

    message += `¡Gracias por preferirnos! ✨`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = customerPhone 
      ? `https://wa.me/${customerPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    // Crear un link invisible y hacerle click para saltar bloqueadores de popups
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Views ---

  if (view === 'new_sale') {
    const categories = Array.from(new Set(products.map(p => p.category)));
    
    // Get brands only if Perfumes is selected
    const brands = selectedCategory === 'Perfumes' 
      ? Array.from(new Set(products.filter(p => p.category === 'Perfumes' && p.brand).map(p => p.brand!)))
      : [];

    const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      const matchesBrand = selectedBrand ? p.brand === selectedBrand : true;
      return matchesSearch && matchesCategory && matchesBrand;
    });

    return (
      <div className="h-full flex flex-col lg:flex-row bg-[#F8F9FA] animate-in slide-in-from-right-8 duration-300 relative overflow-hidden">
        {/* Main Terminal Area (Products) */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-col space-y-3 z-10 shrink-0">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setView('menu')} 
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                title="Volver al menú"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
            
            {/* Categories (Pills) */}
            <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 sticky top-0 bg-white">
              <div className="flex space-x-2.5 pb-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedBrand(null);
                  }}
                  className={`shrink-0 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    selectedCategory === null 
                      ? 'bg-gray-900 border-gray-900 text-white shadow-lg scale-105' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  Todos
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedBrand(null);
                    }}
                    className={`shrink-0 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      selectedCategory === category 
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-105' 
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands (Sub-categories) - Only shown for Perfumes */}
            {selectedCategory === 'Perfumes' && brands.length > 0 && (
              <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 bg-gray-50/50 py-2 border-t border-gray-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedBrand(null)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                      selectedBrand === null 
                        ? 'bg-white border-gray-400 text-gray-900 shadow-sm' 
                        : 'bg-transparent border-transparent text-gray-400'
                    }`}
                  >
                    Todas las Marcas
                  </button>
                  {brands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                        selectedBrand === brand 
                          ? 'bg-white border-primary-400 text-primary-700 shadow-sm' 
                          : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-4 pb-28 lg:pb-6">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="group bg-white rounded-3xl md:rounded-[2rem] p-2 md:p-3 shadow-sm border border-gray-100 text-left hover:border-primary-400 hover:shadow-xl hover:shadow-primary-900/5 active:scale-95 transition-all flex flex-col h-full relative"
              >
                <div className="aspect-square rounded-2xl md:rounded-[1.5rem] overflow-hidden mb-2 md:mb-3 bg-gray-50 relative">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg text-[10px] md:text-[11px] font-black text-gray-900 shadow-sm border border-gray-100">
                    ${formatUSD(product.price)}
                  </div>
                </div>
                <div className="px-0.5 md:px-1 flex flex-col flex-1">
                  <h3 className="text-[11px] md:text-[13px] font-bold text-gray-900 leading-tight line-clamp-2 mb-1.5 md:mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mt-auto pt-0.5">
                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate max-w-[50px] md:max-w-[60px]">
                      {product.brand ? product.brand : (selectedCategory ? '' : product.category)}
                    </span>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold">No encontramos el producto</h3>
                <p className="text-gray-500 text-sm max-w-[200px] mt-1">Intenta con otro nombre o cambia de categoría.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Cart Area (Always visible on Desktop, Mobile Button Overlay) */}
        <aside className="hidden lg:flex w-96 bg-white border-l border-gray-200 flex-col shadow-2xl relative z-20">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <ShoppingBag size={20} className="text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900">Ticket Actual</h2>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{itemCount} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item.id} className="group flex items-center space-x-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-sm relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {item.quantity > 1 && (
                      <div className="absolute -top-1 -right-1 bg-primary-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {item.quantity}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs font-bold text-primary-600">${formatUSD(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-[#F8F9FA] rounded-xl p-1 shrink-0">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)} 
                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-black w-4 text-center text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)} 
                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-4">
                  <Plus size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-500">Agrega productos<br/>al ticket</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-[#F8F9FA] border-t border-gray-200">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-gray-500 text-sm font-medium">
                <span>Subtotal</span>
                <span>${formatUSD(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-900 font-bold border-t border-gray-200 pt-3">
                <span className="text-lg">Total</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-primary-600 leading-none">${formatUSD(subtotal)}</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mt-1">~ Bs. {formatBs(subtotal * exchangeRate)}</div>
                </div>
              </div>
            </div>
            
            <button 
              disabled={cart.length === 0}
              className={`w-full py-5 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-primary-900/10 transition-all flex items-center justify-center active:scale-[0.98] ${
                cart.length > 0 
                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              onClick={handleCheckout}
            >
              <CheckCircle2 size={24} className="mr-2" />
              Procesar Pago
            </button>
          </div>
        </aside>

        {/* Mobile Ticket Trigger */}
        {itemCount > 0 && (
          <div className="lg:hidden fixed bottom-24 left-6 right-6 z-20 animate-in slide-in-from-bottom-8">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-gray-900 text-white px-6 py-4.5 rounded-[1.75rem] shadow-2xl flex items-center justify-between hover:bg-gray-800 transition-transform active:scale-95"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-primary-500 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner transform rotate-3">
                  {itemCount}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-1">Ticket Actual</p>
                  <p className="font-bold text-sm">Ver Detalle</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-primary-400 uppercase leading-none mb-1">Total</p>
                <p className="font-black text-xl leading-none mb-0.5">${formatUSD(subtotal)}</p>
                <p className="text-[10px] font-bold text-gray-400">Bs. {formatBs(subtotal * exchangeRate)}</p>
              </div>
            </button>
          </div>
        )}

        {/* Simple Cart Drawer */}
        {isCartOpen && (
          <div className="absolute inset-0 z-[60] flex flex-col justify-end">
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
                      <p className="text-xs font-bold text-primary-600">${formatUSD(item.price)}</p>
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
                    <div className="text-2xl font-black text-gray-900">${formatUSD(subtotal)}</div>
                    <div className="text-sm font-medium text-gray-500">Bs. {formatBs(subtotal * exchangeRate)}</div>
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
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-0 lg:p-8">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsCheckoutOpen(false)} />
            <div className="bg-[#F8F9FA] w-full max-w-4xl h-full lg:h-auto lg:max-h-[85vh] lg:rounded-[2.5rem] flex flex-col lg:flex-row relative animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden border border-white/20">
              
              {/* Order Summary Side (Desktop) */}
              <div className="hidden lg:flex w-80 bg-white border-r border-gray-100 flex-col shrink-0">
                <div className="p-6 shrink-0 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center">
                    <ReceiptText size={16} className="mr-2 text-primary-600" />
                    Resumen del Ticket
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-gray-700 leading-tight mb-0.5 line-clamp-1">{item.name}</p>
                        <p className="text-xs font-medium text-gray-400">{item.quantity} x ${formatUSD(item.price)}</p>
                      </div>
                      <span className="font-bold text-gray-900 shrink-0">${formatUSD(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-gray-900 text-white shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Subtotal</span>
                    <span className="font-medium tracking-tight">${formatUSD(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center mb-4 text-green-400">
                      <span className="text-xs font-bold uppercase">Descuento ({discount}%)</span>
                      <span className="font-medium tracking-tight">-${formatUSD(subtotal * (discount / 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-sm font-bold uppercase text-primary-400">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono leading-none">${formatUSD(total)}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mt-1">~ Bs. {formatBs(total * exchangeRate)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Checkout View */}
              <div className="flex-1 flex flex-col h-full lg:h-auto lg:overflow-visible">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white shrink-0 lg:rounded-tr-[2.5rem]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-none">Terminal de Pago</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 lg:hidden">Total: ${total.toFixed(2)}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsCheckoutOpen(false)} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all">
                    <X size={22} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8 bg-[#F8F9FA]/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Clienta Asignada</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-within:text-primary-600 transition-colors" size={18} />
                        <select 
                          value={selectedCustomer}
                          onChange={(e) => setSelectedCustomer(e.target.value)}
                          className="w-full pl-11 pr-10 py-4 bg-white border border-gray-100 rounded-[1.25rem] text-sm font-bold text-gray-700 focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none appearance-none shadow-sm transition-all"
                        >
                          <option value="">Consumidor Final</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Aplicar Descuento</label>
                      <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 text-gray-400 rounded-l-[1.25rem] group-within:bg-primary-50 group-within:text-primary-600 transition-colors">
                          <Percent size={18} />
                        </div>
                        <input 
                          type="number" 
                          value={discount || ''}
                          onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                          placeholder="0"
                          className="w-full pl-16 pr-4 py-4 bg-white border border-gray-100 rounded-[1.25rem] text-sm font-black text-gray-900 focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none shadow-sm transition-all placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-Payment System */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Método de Pago</label>
                      {payments.length > 0 && (
                        <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-full uppercase">
                          Pagado: ${formatUSD(payments.reduce((sum, p) => sum + p.amount, 0))} / Resta: ${formatUSD(Math.max(0, total - payments.reduce((sum, p) => sum + p.amount, 0)))}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { id: 'zelle', label: 'Zelle', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { id: 'cash_usd', label: 'Efectivo ($)', icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { id: 'pos', label: 'Punto Venta', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                      ].map(method => (
                        <button 
                          key={method.id}
                          onClick={() => {
                            setCurrentPaymentMethod(method.id as PaymentMethod['method']);
                            setPaymentReference('');
                            setCurrentPaymentAmount('');
                            setCurrentPaymentAmountBs('');
                            if (method.id !== 'cash_usd') setAmountReceived('');
                          }}
                          className={`p-4 rounded-[1.5rem] border-2 flex flex-col items-center justify-center space-y-2 transition-all active:scale-95 ${
                            currentPaymentMethod === method.id 
                              ? `bg-white border-primary-500 ${method.color} shadow-lg shadow-primary-900/5` 
                              : 'bg-white border-transparent text-gray-400 hover:border-gray-100'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${currentPaymentMethod === method.id ? method.bg : 'bg-gray-50'}`}>
                            <method.icon size={22} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider">{method.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Amount Input for Current Payment */}
                    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
                      <div className="flex flex-col space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Amount Column */}
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {['pago_movil', 'pos'].includes(currentPaymentMethod) ? 'Monto en Bs.' : 'Monto en $'}
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-gray-300">
                                {['pago_movil', 'pos'].includes(currentPaymentMethod) ? 'Bs.' : '$'}
                              </span>
                              {['pago_movil', 'pos'].includes(currentPaymentMethod) ? (
                                <input 
                                  type="number" 
                                  value={currentPaymentAmountBs}
                                  onChange={(e) => {
                                    const valInBs = e.target.value ? Number(e.target.value) : '';
                                    setCurrentPaymentAmountBs(valInBs);
                                    if (typeof valInBs === 'number') {
                                      setCurrentPaymentAmount(valInBs / exchangeRate);
                                    } else {
                                      setCurrentPaymentAmount('');
                                    }
                                  }}
                                  placeholder={formatBs(Math.max(0, (total - payments.reduce((sum, p) => sum + p.amount, 0)) * exchangeRate))}
                                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xl font-black text-gray-900 focus:ring-4 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-200"
                                />
                              ) : (
                                <input 
                                  type="number" 
                                  value={currentPaymentAmount}
                                  onChange={(e) => {
                                    const valInUsd = e.target.value ? Number(e.target.value) : '';
                                    setCurrentPaymentAmount(valInUsd);
                                  }}
                                  placeholder={formatUSD(Math.max(0, total - payments.reduce((sum, p) => sum + p.amount, 0)))}
                                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xl font-black text-gray-900 focus:ring-4 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-200"
                                />
                              )}
                            </div>
                            {['pago_movil', 'pos'].includes(currentPaymentMethod) && typeof currentPaymentAmount === 'number' && (
                              <p className="text-[10px] font-bold text-gray-400 px-1 italic">
                                Equivalente: ${formatUSD(currentPaymentAmount)} (Tasa: {formatBs(exchangeRate)})
                              </p>
                            )}
                          </div>

                          {/* Reference Column (Only for electronic payments) */}
                          {['zelle', 'pago_movil', 'pos'].includes(currentPaymentMethod) && (
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Referencia {currentPaymentMethod === 'pago_movil' ? '(Obligatorio)' : '(Opcional)'}
                              </label>
                              <div className="relative">
                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                  type="text" 
                                  value={paymentReference}
                                  onChange={(e) => setPaymentReference(e.target.value)}
                                  placeholder="Nº Referencia..."
                                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-200"
                                />
                              </div>
                            </div>
                          )}

                          {currentPaymentMethod === 'cash_usd' && (
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest">Calculadora de Cambio</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-gray-300">$</span>
                                <input 
                                  type="number" 
                                  value={amountReceived}
                                  onChange={(e) => setAmountReceived(e.target.value ? Number(e.target.value) : '')}
                                  placeholder="Recibido..."
                                  className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border-none rounded-2xl text-xl font-black text-emerald-900 focus:ring-4 focus:ring-emerald-100 outline-none transition-all placeholder:text-emerald-200"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => {
                            const amount = Number(currentPaymentAmount) || Math.max(0, total - payments.reduce((sum, p) => sum + p.amount, 0));
                            
                            if (amount <= 0) return;
                            
                            // Mandatory reference for Pago Móvil
                            if (currentPaymentMethod === 'pago_movil' && !paymentReference.trim()) {
                              toast.error('La referencia es obligatoria para Pago Móvil');
                              return;
                            }

                            setPayments([...payments, { 
                              method: currentPaymentMethod, 
                              amount, 
                              reference: paymentReference.trim() || undefined 
                            }]);
                            
                            setCurrentPaymentAmount('');
                            setCurrentPaymentAmountBs('');
                            setPaymentReference('');
                            toast.success(`Abonado: $${formatUSD(amount)}`);
                          }}
                          className="w-full bg-primary-600 text-white py-4 rounded-2xl shadow-xl shadow-primary-900/20 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center space-x-2"
                        >
                          <Plus size={20} />
                          <span className="font-bold">Añadir este Pago al Ticket</span>
                        </button>
                      </div>

                      {/* Change Reminder Card */}
                      {currentPaymentMethod === 'cash_usd' && typeof amountReceived === 'number' && amountReceived > 0 && (
                        <div className="bg-emerald-600 p-4 rounded-2xl text-white flex justify-between items-center animate-in zoom-in-95">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                              <Banknote size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase opacity-80 leading-none mb-1">Cambio a entregar</p>
                              <p className="text-xl font-black font-mono">${formatUSD(Math.max(0, amountReceived - (Number(currentPaymentAmount) || (total - payments.reduce((sum, p) => sum + p.amount, 0)))))}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-bold uppercase opacity-80 leading-none mb-1">En Bs.</p>
                             <p className="font-bold">Bs. {formatBs(Math.max(0, amountReceived - (Number(currentPaymentAmount) || (total - payments.reduce((sum, p) => sum + p.amount, 0)))) * exchangeRate)}</p>
                          </div>
                        </div>
                      )}

                      {/* Payments List */}
                      {payments.length > 0 && (
                        <div className="pt-4 border-t border-gray-100 space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Pagos Registrados</p>
                          {payments.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 animate-in slide-in-from-left-4">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                                  {p.method === 'cash_usd' ? <Banknote size={16} /> : <Smartphone size={16} />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900 uppercase">
                                    {p.method.replace('_', ' ')}
                                    {p.reference && <span className="text-gray-400 ml-2 normal-case font-medium">(Ref: {p.reference})</span>}
                                  </p>
                                  <p className="text-[10px] text-gray-500 font-medium">Abono parcial</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="font-mono font-bold text-gray-900">${formatUSD(p.amount)}</span>
                                <button 
                                  onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white border-t border-gray-100 shrink-0 lg:rounded-br-[2.5rem]">
                  <button 
                    className="w-full bg-gray-900 text-white py-5 rounded-[1.75rem] font-bold text-lg shadow-2xl shadow-gray-900/20 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center group"
                    onClick={processSale}
                  >
                    <CheckCircle2 size={24} className="mr-3 text-primary-500 group-hover:scale-110 transition-transform" />
                    Finalizar y Registrar Venta
                  </button>
                </div>
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
              <p className="text-gray-500 mb-8 font-medium">El pago de ${formatUSD(total)} ha sido procesado.</p>
              
              <div className="w-full space-y-3">
                <button 
                  className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-[#128C7E] transition-colors shadow-md"
                  onClick={() => {
                    generateWhatsAppReceipt();
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
    const filteredSales = sales.filter(sale => sale.date.startsWith(historyDate));
    const dayTotal = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const dayCount = filteredSales.length;
    const isToday = historyDate === new Date().toISOString().split('T')[0];

    return (
      <div className="h-full flex flex-col bg-[#F8F9FA] animate-in slide-in-from-right-8 duration-300 relative overflow-hidden">
        {/* Header Section */}
        <div className="bg-white px-6 py-5 border-b border-gray-200 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setView('menu')} 
                className="p-2.5 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h2 className="text-[22px] font-black text-gray-900 leading-tight">Historial de Caja</h2>
                <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  <span>{dayCount} transacciones encontradas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center bg-gray-50 p-1 rounded-2xl border border-gray-100">
              <button 
                onClick={() => setHistoryDate(new Date().toISOString().split('T')[0])}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${isToday ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Hoy
              </button>
              <div className="relative group">
                <input 
                  type="date" 
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="bg-transparent px-4 py-2 border-none rounded-xl text-xs font-bold text-gray-700 focus:ring-0 outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Sales List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4">
            {/* Daily Summary (Mobile/Tablet Only) - Shown inline for scanability */}
            <div className="lg:hidden bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl mb-6 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Monto Total del Día</p>
                <h3 className="text-3xl font-black font-mono leading-none">${dayTotal.toFixed(2)}</h3>
              </div>
              <div className="text-right">
                <p className="text-primary-400 text-[10px] font-bold uppercase tracking-widest mb-1">Volumen</p>
                <p className="text-xl font-bold leading-none">{dayCount} <span className="text-xs opacity-60">Oper.</span></p>
              </div>
            </div>

            {filteredSales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredSales.sort((a, b) => b.date.localeCompare(a.date)).map(sale => (
                  <button 
                    key={sale.id} 
                    onClick={() => setSelectedSale(sale)}
                    className="group bg-white p-5 rounded-[1.75rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-900/5 hover:-translate-y-0.5 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        sale.paymentMethods[0]?.method === 'cash_usd' ? 'bg-amber-50 text-amber-600' : 
                        sale.paymentMethods[0]?.method === 'pago_movil' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {sale.paymentMethods[0]?.method === 'cash_usd' ? <Banknote size={24} /> : 
                         sale.paymentMethods[0]?.method === 'pos' ? <CreditCard size={24} /> : <Smartphone size={24} />}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-gray-400 leading-none mb-1">
                          {new Date(sale.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                        <h4 className="text-sm font-black text-gray-900 capitalize">
                          {customers.find(c => c.id === sale.customerId)?.name || 'Consumidor Final'}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                          {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'} • {sale.paymentMethods[0]?.method.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-gray-900 font-mono">${sale.total.toFixed(2)}</div>
                      {sale.discount > 0 && (
                        <div className="text-[10px] font-bold text-emerald-500 uppercase">-{sale.discount}% desc.</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <History size={32} className="text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold italic">No hay ventas registradas</h3>
                <p className="text-gray-500 text-sm max-w-[200px] mt-1 italic">Para esta fecha aún no se han realizado transacciones.</p>
              </div>
            )}
          </div>

          {/* Right Summary Sidebar (Desktop Only) */}
          <aside className="hidden lg:flex w-80 bg-white border-l border-gray-200 flex-col shadow-2xl z-20">
            <div className="p-8 shrink-0">
              <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-600/20 blur-3xl group-hover:bg-primary-600/40 transition-all duration-700 rounded-full"></div>
                <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Resumen Diario</p>
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Monto de Venta</p>
                    <h1 className="text-5xl font-black font-mono leading-none tracking-tighter">${dayTotal.toFixed(2)}</h1>
                    <p className="text-gray-500 text-xs font-bold font-mono mt-2 opacity-60">~ Bs. {(dayTotal * exchangeRate).toFixed(2)}</p>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Volumen</p>
                      <p className="text-2xl font-black leading-none">{dayCount}</p>
                      <p className="text-[10px] font-bold text-primary-400 uppercase mt-1">Transacciones</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary-400">
                      <BarChart3 size={24} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Desglose por Pago</h4>
                <div className="space-y-3 px-1">
                  {['cash_usd', 'pago_movil', 'zelle', 'pos'].map(method => {
                    const methodSales = filteredSales.filter(s => s.paymentMethods.some(pm => pm.method === method));
                    const methodTotal = methodSales.reduce((sum, s) => sum + s.total, 0);
                    const percentage = dayTotal > 0 ? (methodTotal / dayTotal) * 100 : 0;
                    
                    return (
                      <div key={method} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                          <span className="text-gray-500">{method.replace('_', ' ')}</span>
                          <span className="text-gray-900">${methodTotal.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 transition-all duration-1000" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="mt-auto p-8 border-t border-gray-100">
              <button 
                onClick={() => setView('new_sale')}
                className="w-full bg-primary-600 text-white py-4 rounded-3xl font-bold flex items-center justify-center space-x-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/10 active:scale-95 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                <span>Nueva Venta</span>
              </button>
            </div>
          </aside>
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
                      <span className="uppercase text-right">
                        {selectedSale.paymentMethods.length === 1 
                          ? `${selectedSale.paymentMethods[0].method.replace('_', ' ')} ${selectedSale.paymentMethods[0].reference ? `(${selectedSale.paymentMethods[0].reference})` : ''}`
                          : 'Múltiples Métodos'}
                      </span>
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
  if (view === 'menu') {
    return (
      <div className="h-full flex flex-col bg-[#F8F9FA] p-3 md:p-12 animate-in fade-in duration-500 overflow-y-auto">
        <div className="mb-6 md:mb-12 text-center lg:text-left pt-2 md:pt-0">
          <h1 className="text-xl md:text-5xl font-black text-gray-900 tracking-tight mb-1 md:mb-3">Terminal POS</h1>
          <p className="text-gray-500 text-[11px] md:text-lg font-medium">Gestión de ventas y caja</p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-6xl mx-auto w-full pb-10">
          <button 
            onClick={() => setView('new_sale')}
            className="group relative bg-white p-3 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-primary-900/10 hover:-translate-y-1 transition-all text-left flex flex-col"
          >
            <div className="w-10 h-10 md:w-16 md:h-16 bg-primary-50 md:bg-primary-100 text-primary-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <ShoppingCart className="w-5 h-5 md:w-8 md:h-8" />
            </div>
            <h3 className="text-[13px] md:text-2xl font-bold text-gray-900 mb-1 md:mb-2 leading-tight">Nueva Venta</h3>
            <p className="text-gray-400 text-[9px] md:text-sm leading-tight md:leading-relaxed mb-3 md:mb-6 line-clamp-2 md:line-clamp-none font-medium">Inicia un ticket de venta.</p>
            <div className="mt-auto flex items-center text-primary-600 font-bold text-[9px] md:text-sm">
              <span className="hidden md:inline">Comenzar ahora</span>
              <span className="inline md:hidden uppercase tracking-tighter">Comenzar</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-0.5 md:ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button 
            onClick={() => setView('history')}
            className="group relative bg-white p-3 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-primary-900/10 hover:-translate-y-1 transition-all text-left flex flex-col"
          >
            <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-50 md:bg-blue-100 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <History className="w-5 h-5 md:w-8 md:h-8" />
            </div>
            <h3 className="text-[13px] md:text-2xl font-bold text-gray-900 mb-1 md:mb-2 leading-tight">Historial</h3>
            <p className="text-gray-400 text-[9px] md:text-sm leading-tight md:leading-relaxed mb-3 md:mb-6 line-clamp-2 md:line-clamp-none font-medium">Ventas del día y cierres.</p>
            <div className="mt-auto flex items-center text-blue-600 font-bold text-[9px] md:text-sm">
              <span className="hidden md:inline">Ver historial completo</span>
              <span className="inline md:hidden uppercase tracking-tighter">Ver Caja</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-0.5 md:ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button 
            onClick={() => setView('reports')}
            className="group relative bg-white p-3 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-primary-900/10 hover:-translate-y-1 transition-all text-left flex flex-col opacity-80"
          >
            <div className="w-10 h-10 md:w-16 md:h-16 bg-purple-50 md:bg-purple-100 text-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5 md:w-8 md:h-8" />
            </div>
            <h3 className="text-[13px] md:text-2xl font-bold text-gray-900 mb-1 md:mb-2 leading-tight">Reportes</h3>
            <p className="text-gray-400 text-[9px] md:text-sm leading-tight md:leading-relaxed mb-3 md:mb-6 line-clamp-2 md:line-clamp-none font-medium">Gráficas y estadísticas.</p>
            <div className="mt-auto flex items-center text-purple-600 font-bold text-[9px] md:text-sm">
              <span className="hidden md:inline">Dashboard de analíticas</span>
              <span className="inline md:hidden uppercase tracking-tighter">Estadísticas</span>
              <Lock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 ml-1" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
