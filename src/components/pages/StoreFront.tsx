import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ArrowLeft, Plus, Minus, X, CheckCircle2, ChevronRight, CreditCard, Smartphone, Wallet, Landmark, Search, ChevronUp, Heart, Store, Truck, Tag, SlidersHorizontal, Info, Percent, Instagram, Facebook } from 'lucide-react';
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

  // New Store Features State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // percentage
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

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

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }
    if (isRightSwipe) {
      setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'favorites' 
      ? favorites.includes(p.id)
      : selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return 0; // 'newest' - assuming original array order is newest
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === 'PROMO20') {
      setAppliedDiscount(20);
    } else {
      setAppliedDiscount(0);
      alert('Cupón inválido'); // We can use a better UI later, but alert is ok for quick feedback or just ignore. Actually, let's just clear it.
    }
  };

  const getProductBadge = (product: Product) => {
    if (product.stock > 0 && product.stock <= 5) return { text: '¡ÚLTIMOS!', color: 'bg-red-500' };
    if (product.price < 10) return { text: 'OFERTA', color: 'bg-pink-500' };
    if (product.id.charCodeAt(0) % 3 === 0) return { text: 'NUEVO', color: 'bg-purple-500' };
    return null;
  };

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
  const discountAmountValue = subtotal * (appliedDiscount / 100);
  const deliveryFee = deliveryMethod === 'delivery' ? 3.00 : 0;
  const total = subtotal - discountAmountValue + deliveryFee;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleWhatsAppOrder = () => {
    const itemsText = cart.map(item => `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`).join('%0A');
    const totalBs = (total * exchangeRate).toFixed(2);
    
    let deliveryText = deliveryMethod === 'delivery' 
      ? `*Entrega:* Delivery ($3.00)%0A*Dirección:* ${deliveryAddress}%0A*Referencia:* ${deliveryReference}`
      : `*Entrega:* Retiro en Tienda`;

    let notesText = orderNotes ? `%0A*Notas:* ${orderNotes}` : '';
    let discountText = appliedDiscount > 0 ? `%0A*Descuento:* -${appliedDiscount}% ($${discountAmountValue.toFixed(2)})` : '';
    
    const message = `¡Hola! Quiero realizar un pedido en Stely Beauty 💖%0A%0A*Datos del Cliente:*%0ANombre: ${firstName} ${lastName}%0ACédula: ${idCard}%0ATeléfono: ${phone}%0A%0A${deliveryText}%0A%0A*Pedido:*%0A${itemsText}${discountText}${notesText}%0A%0A*Total:* $${total.toFixed(2)} (Bs. ${totalBs})%0A*Método de Pago:* ${paymentMethod.replace('_', ' ').toUpperCase()}`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
    
    // Reset after order
    setCart([]);
    setIsCartOpen(false);
    setStep('cart');
    setOrderNotes('');
    setDiscountCode('');
    setAppliedDiscount(0);
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
                <div className="space-y-6">
                  {cart.map(item => (
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
                  ))}

                  {/* Notes & Discount */}
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notas del Pedido</label>
                      <textarea 
                        value={orderNotes}
                        onChange={e => setOrderNotes(e.target.value)}
                        placeholder="Ej. Envolver para regalo..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all resize-none h-20 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cupón de Descuento</label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="text" 
                            value={discountCode}
                            onChange={e => setDiscountCode(e.target.value)}
                            placeholder="Ej. PROMO20"
                            className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all uppercase text-sm"
                          />
                        </div>
                        <button 
                          onClick={handleApplyDiscount}
                          className="px-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                      {appliedDiscount > 0 && (
                        <p className="text-green-600 text-xs font-bold mt-2 flex items-center">
                          <CheckCircle2 size={12} className="mr-1" /> Cupón aplicado: -{appliedDiscount}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Método de Entrega</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${deliveryMethod === 'pickup' ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                  >
                    <Store size={24} className={`mb-2 ${deliveryMethod === 'pickup' ? 'text-black' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${deliveryMethod === 'pickup' ? 'text-gray-900' : 'text-gray-500'}`}>Retiro en Tienda</span>
                    <span className="text-xs text-gray-400 mt-1">Gratis</span>
                  </button>
                  <button
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${deliveryMethod === 'delivery' ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                  >
                    <Truck size={24} className={`mb-2 ${deliveryMethod === 'delivery' ? 'text-black' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${deliveryMethod === 'delivery' ? 'text-gray-900' : 'text-gray-500'}`}>Delivery</span>
                    <span className="text-xs text-gray-400 mt-1">+$3.00</span>
                  </button>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dirección de Entrega</label>
                      <textarea 
                        value={deliveryAddress} 
                        onChange={e => setDeliveryAddress(e.target.value)} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all resize-none h-20" 
                        placeholder="Ej. Urb. La Viña, Calle 1, Casa #45" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Punto de Referencia</label>
                      <input 
                        type="text" 
                        value={deliveryReference} 
                        onChange={e => setDeliveryReference(e.target.value)} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all" 
                        placeholder="Ej. Frente a la panadería" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 pb-28 bg-white border-t border-gray-100">
              <button 
                disabled={!firstName || !lastName || !idCard || !phone || (deliveryMethod === 'delivery' && (!deliveryAddress || !deliveryReference))}
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

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Descuento ({appliedDiscount}%)</span>
                      <span className="font-bold">-${discountAmountValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Entrega ({deliveryMethod === 'delivery' ? 'Delivery' : 'Retiro'})</span>
                    <span className="font-bold text-gray-900">{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'Gratis'}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total USD</span>
                    <span className="text-2xl font-black text-gray-900">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-gray-500">Total VES (Tasa: {exchangeRate})</span>
                    <span className="text-lg font-bold text-gray-500">Bs. {(total * exchangeRate).toFixed(2)}</span>
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
        <div 
          className="relative overflow-hidden h-32 touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndHandler}
        >
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

        {/* Search Bar & Controls */}
        <div className="px-6 mt-4 space-y-4">
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
          
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <SlidersHorizontal size={14} className="text-gray-500" />
              </div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full appearance-none bg-gray-50 border border-gray-100 text-gray-700 py-2 pl-9 pr-8 rounded-full text-xs font-bold outline-none focus:ring-2 focus:ring-pink-200 transition-all"
              >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight size={14} className="text-gray-400 rotate-90" />
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedCategory(selectedCategory === 'favorites' ? null : 'favorites')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedCategory === 'favorites' ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
            >
              <Heart size={14} className={selectedCategory === 'favorites' ? 'fill-current' : ''} />
              <span>Favoritos ({favorites.length})</span>
            </button>
          </div>
        </div>

        {/* Categories (Pills) */}
        <div className="px-6 mt-5 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-2 pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === null ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === category ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {category}
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
            {filteredProducts.map(product => {
              const badge = getProductBadge(product);
              const isFavorite = favorites.includes(product.id);
              
              return (
                <div key={product.id} className="group flex flex-col cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-4">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {/* Badges */}
                    {badge && product.stock > 0 && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className={`${badge.color} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm`}>
                          {badge.text}
                        </span>
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button 
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-pink-500 transition-colors"
                    >
                      <Heart size={16} className={isFavorite ? 'fill-pink-500 text-pink-500' : ''} />
                    </button>

                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
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
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-800 transition-colors active:scale-95"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-10 pb-12 px-6 mt-4">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-gray-900 tracking-tight mb-3">Stely Beauty</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Tu belleza, nuestra pasión. Productos de maquillaje y cuidado facial de la más alta calidad para resaltar tu brillo natural.
          </p>
          
          <div className="flex justify-center items-center space-x-5 mb-8">
            <a href="#" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors shadow-sm">
              <Instagram size={22} />
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors shadow-sm">
              {/* TikTok Custom SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors shadow-sm">
              <Facebook size={22} />
            </a>
          </div>
          
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 font-medium">
              © {new Date().getFullYear()} Stely Beauty. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedProduct(null)} />
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col relative animate-in slide-in-from-bottom sm:zoom-in duration-300 shadow-2xl overflow-hidden">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm hover:bg-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex-1 overflow-y-auto">
              <div className="h-64 sm:h-80 w-full bg-gray-100 relative shrink-0">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                {getProductBadge(selectedProduct) && selectedProduct.stock > 0 && (
                  <div className="absolute top-4 left-4">
                    <span className={`${getProductBadge(selectedProduct)?.color} text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md`}>
                      {getProductBadge(selectedProduct)?.text}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-pink-500 uppercase tracking-wider">{selectedProduct.category}</span>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 leading-tight mt-1">{selectedProduct.name}</h2>
                  </div>
                  <button 
                    onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors shrink-0"
                  >
                    <Heart size={24} className={favorites.includes(selectedProduct.id) ? 'fill-pink-500 text-pink-500' : ''} />
                  </button>
                </div>
                
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-black text-gray-900">${selectedProduct.price.toFixed(2)}</span>
                  {selectedProduct.price < 10 && (
                    <span className="text-lg text-gray-400 line-through mb-1">${(selectedProduct.price * 1.2).toFixed(2)}</span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                    <Info size={16} className="mr-2 text-pink-500" />
                    Descripción
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedProduct.description || `Este hermoso producto de la categoría ${selectedProduct.category.toLowerCase()} es perfecto para resaltar tu belleza natural. Formulado con ingredientes de alta calidad para un acabado profesional y duradero.`}
                  </p>
                </div>

                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-3">Tonos Disponibles</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map((v, i) => (
                        <div key={i} className="px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-700 bg-gray-50">
                          {v.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 pb-8 sm:pb-6">
              <button 
                disabled={selectedProduct.stock === 0}
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                  setIsCartOpen(true);
                }}
                className="w-full bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition-colors flex items-center justify-center shadow-lg shadow-black/10"
              >
                <ShoppingBag size={20} className="mr-2" />
                {selectedProduct.stock === 0 ? 'Agotado' : 'Agregar a la Bolsa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
