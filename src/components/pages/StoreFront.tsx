import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ArrowLeft, Plus, Minus, X, CheckCircle2, ChevronRight, CreditCard, Smartphone, Wallet, Landmark, Search, ChevronUp } from 'lucide-react';
import { Product, CartItem } from '../../types';

interface StoreFrontProps {
  products: Product[];
  exchangeRate: number;
  onBack: () => void;
}

type CheckoutStep = 'cart' | 'details' | 'payment' | 'summary';

export default function StoreFront({ products, exchangeRate, onBack }: StoreFrontProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('cart');

  // Customer Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('');

  // Store UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const carouselItems = [
    { title: "Descubre tu belleza", subtitle: "Los mejores productos de maquillaje seleccionados para ti.", bg: "bg-pink-50/90" },
    { title: "20% de Descuento", subtitle: "En toda la línea de cuidado facial por este mes.", bg: "bg-rose-50/90" },
    { title: "Nuevos Labiales", subtitle: "Tonos mate de larga duración que te encantarán.", bg: "bg-fuchsia-50/90" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

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
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleWhatsAppOrder = () => {
    const itemsText = cart.map(item => `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`).join('%0A');
    const totalBs = (subtotal * exchangeRate).toFixed(2);
    
    const message = `¡Hola! Quiero realizar un pedido en Stely Beauty 💖%0A%0A*Datos del Cliente:*%0ANombre: ${firstName} ${lastName}%0ACédula: ${idCard}%0ATeléfono: ${phone}%0A%0A*Pedido:*%0A${itemsText}%0A%0A*Total:* $${subtotal.toFixed(2)} (Bs. ${totalBs})%0A*Método de Pago:* ${paymentMethod.replace('_', ' ').toUpperCase()}`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
    
    // Reset after order
    setCart([]);
    setIsCartOpen(false);
    setStep('cart');
  };

  const renderCheckoutContent = () => {
    switch (step) {
      case 'cart':
        return (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="font-medium">Tu bolsa está vacía</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex space-x-4">
                    <div className="w-20 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight">{item.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:text-black"><Minus size={14} /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:text-black"><Plus size={14} /></button>
                        </div>
                        <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 pb-28 bg-white border-t border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-2xl font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => setStep('details')}
                  className="w-full bg-black text-white py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition-colors"
                >
                  Proceder al Pago
                </button>
              </div>
            )}
          </>
        );
      case 'details':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Tus Datos</h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all" placeholder="Ej. María" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Apellido</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all" placeholder="Ej. Pérez" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cédula de Identidad</label>
                <input type="text" value={idCard} onChange={e => setIdCard(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all" placeholder="Ej. 20123456" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono (WhatsApp)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all" placeholder="Ej. 04121234567" />
              </div>
            </div>
            <div className="p-6 pb-28 bg-white border-t border-gray-100">
              <button 
                disabled={!firstName || !lastName || !idCard || !phone}
                onClick={() => setStep('payment')}
                className="w-full bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        );
      case 'payment':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-6">Método de Pago</h3>
              
              <div className="space-y-3">
                {[
                  { id: 'pago_movil', name: 'Pago Móvil', icon: Smartphone },
                  { id: 'transferencia', name: 'Transferencia Bancaria', icon: Landmark },
                  { id: 'zelle', name: 'Zelle', icon: Smartphone },
                  { id: 'usdt_binance', name: 'USDT (Binance)', icon: Wallet },
                  { id: 'paypal', name: 'PayPal', icon: CreditCard },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === method.id ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${paymentMethod === method.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <method.icon size={20} />
                    </div>
                    <span className="font-bold text-gray-900">{method.name}</span>
                    {paymentMethod === method.id && <CheckCircle2 className="ml-auto text-black" size={20} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 pb-28 bg-white border-t border-gray-100">
              <button 
                disabled={!paymentMethod}
                onClick={() => setStep('summary')}
                className="w-full bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition-colors"
              >
                Revisar Pedido
              </button>
            </div>
          </div>
        );
      case 'summary':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6 text-center">Resumen de tu Orden</h3>
              
              <div className="bg-gray-50 rounded-3xl p-6 mb-6 border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Productos</h4>
                <div className="space-y-3 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}x {item.name}</span>
                      <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Datos de Facturación</h4>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <p><span className="font-semibold text-gray-900">Cliente:</span> {firstName} {lastName}</p>
                  <p><span className="font-semibold text-gray-900">Cédula:</span> {idCard}</p>
                  <p><span className="font-semibold text-gray-900">Teléfono:</span> {phone}</p>
                  <p><span className="font-semibold text-gray-900">Pago:</span> <span className="uppercase">{paymentMethod.replace('_', ' ')}</span></p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-gray-900">Total USD</span>
                    <span className="text-2xl font-black text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-gray-500">Total VES (Tasa: {exchangeRate})</span>
                    <span className="text-lg font-bold text-gray-500">Bs. {(subtotal * exchangeRate).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 pb-28 bg-white border-t border-gray-100">
              <button 
                onClick={handleWhatsAppOrder}
                className="w-full bg-[#25D366] text-white py-4 rounded-full font-bold text-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center shadow-lg shadow-[#25D366]/30"
              >
                Culminar por WhatsApp
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden font-sans animate-in fade-in duration-500">
      {/* Store Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/90 backdrop-blur-md z-30 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-black transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">Stely Beauty</h1>
        <button 
          onClick={() => { setIsCartOpen(true); setStep('cart'); }} 
          className="p-2 -mr-2 relative text-gray-900 hover:opacity-70 transition-opacity"
        >
          <ShoppingBag size={24} />
          {itemCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {itemCount}
            </span>
          )}
        </button>
      </header>

      {/* Scrollable Content Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative pb-20"
      >
        {/* Banner & Controls (Scrolls away) */}
        <div className="bg-white pb-4">
          {/* Carousel Banner */}
        <div className="relative overflow-hidden h-32">
          {carouselItems.map((item, index) => (
            <div 
              key={index}
              className={`absolute inset-0 px-6 py-6 flex flex-col justify-center transition-opacity duration-1000 ${item.bg} ${index === carouselIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">{item.title}</h2>
              <p className="text-gray-700 text-sm">{item.subtitle}</p>
            </div>
          ))}
          {/* Carousel Indicators */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1.5 z-20">
            {carouselItems.map((_, idx) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'w-4 bg-gray-900' : 'w-1.5 bg-gray-400/50'}`} />
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 mt-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar maquillaje, brochas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 mt-4 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-3 pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex flex-col items-center shrink-0 space-y-1 ${selectedCategory === null ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${selectedCategory === null ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-transparent bg-gray-100 text-gray-500'}`}>
                <span className="font-bold text-xs uppercase">All</span>
              </div>
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex flex-col items-center shrink-0 space-y-1 ${selectedCategory === category ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${selectedCategory === category ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-transparent bg-gray-100 text-gray-500'}`}>
                  <span className="font-bold text-xs uppercase">{category.substring(0, 3)}</span>
                </div>
                <span className="text-[10px] font-medium text-gray-600 w-14 text-center truncate">{category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No se encontraron productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="group flex flex-col">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-4">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Agotado</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">{product.category}</span>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</h3>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    <button 
                      disabled={product.stock === 0}
                      onClick={() => addToCart(product)}
                      className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-800 transition-colors active:scale-95"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Scroll to Top FAB */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-6 right-6 w-12 h-12 bg-pink-500 text-white rounded-full shadow-lg shadow-pink-500/30 flex items-center justify-center hover:bg-pink-600 transition-all animate-in zoom-in duration-300 z-40"
        >
          <ChevronUp size={24} />
        </button>
      )}

      {/* Cart / Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCartOpen(false)} />
          <div className="w-full max-w-md bg-white h-full relative flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {step !== 'cart' && (
                  <button 
                    onClick={() => {
                      if (step === 'summary') setStep('payment');
                      else if (step === 'payment') setStep('details');
                      else if (step === 'details') setStep('cart');
                    }} 
                    className="p-1 -ml-1 text-gray-400 hover:text-black"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  {step === 'cart' ? 'Tu Bolsa' : step === 'details' ? 'Checkout' : step === 'payment' ? 'Pago' : 'Resumen'}
                </h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-black transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {renderCheckoutContent()}
          </div>
        </div>
      )}
    </div>
  );
}
