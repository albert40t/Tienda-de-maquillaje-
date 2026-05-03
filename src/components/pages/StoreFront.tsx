import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LayoutGrid, ShoppingBag, ArrowLeft, Plus, Minus, X, CheckCircle2, ChevronRight, CreditCard, Smartphone, Wallet, Landmark, Search, ChevronUp, Heart, Store, Truck, Tag, SlidersHorizontal, Info, Percent, Instagram, Facebook, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, CartItem, BusinessInfo, Banner, Category } from '../../types';
import { formatBs, formatUSD } from '../../lib/formatUtils';
import ProductDetails from './ProductDetails';

interface StoreFrontProps {
  products: Product[];
  categories?: Category[];
  exchangeRate: number;
  onBack: () => void;
  businessInfo: BusinessInfo;
  banners: Banner[];
  isLoading?: boolean;
}

type CheckoutStep = 'cart' | 'details' | 'payment' | 'summary';

export default function StoreFront({ products, categories = [], exchangeRate, onBack, businessInfo, banners, isLoading = false }: StoreFrontProps) {
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // New Store Features State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [shippingAgency, setShippingAgency] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [orderNotes, setOrderNotes] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // percentage
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [cartAnimation, setCartAnimation] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const carouselItems = banners.length > 0 
    ? banners.filter(b => b.active)
    : [
        { title: "Descubre tu belleza", subtitle: "Los mejores productos de maquillaje seleccionados para ti.", bg_color: "bg-pink-50/90", image: "" },
        { title: "20% de Descuento", subtitle: "En toda la línea de cuidado facial por este mes.", bg_color: "bg-rose-50/90", image: "" },
        { title: "Nuevos Labiales", subtitle: "Tonos mate de larga duración que te encantarán.", bg_color: "bg-fuchsia-50/90", image: "" }
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

  const productCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) {
        // Keep the original case of the first one encountered or just use a standard one
        // Better: Find the most frequent case or just use uppercase for consistency in pills
        set.add(p.category.trim().toUpperCase());
      }
    });
    return Array.from(set);
  }, [products]);

  const availableBrands = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'favorites') return [];
    const brands = products
      .filter(p => p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase() && p.brand)
      .map(p => p.brand?.trim().toUpperCase() as string);
    return Array.from(new Set(brands)).filter(Boolean);
  }, [products, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const selectedCategoryObj = categories.find(c => c.name.toUpperCase() === selectedCategory);
    
    return products.filter(p => {
      const pName = p.name.toLowerCase();
      const pCategory = p.category.toLowerCase().trim();
      const q = debouncedSearchQuery.toLowerCase().trim();
      
      const matchesSearch = pName.includes(q) || pCategory.includes(q);
      const matchesCategory = selectedCategory === 'favorites' 
        ? favorites.includes(p.id)
        : selectedCategoryObj 
          ? (p.category.trim().toLowerCase() === selectedCategoryObj.id.trim().toLowerCase() ||
             p.category.trim().toLowerCase() === selectedCategoryObj.name.trim().toLowerCase()) 
          : selectedCategory ? p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase() : true;
      const matchesBrand = selectedBrand ? p.brand?.trim().toUpperCase() === selectedBrand : true;
      return matchesSearch && matchesCategory && matchesBrand;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0; // 'newest' - assuming original array order is newest
    });
  }, [products, debouncedSearchQuery, selectedCategory, selectedBrand, favorites, sortBy, categories]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

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
    if (product.stock > 0 && product.stock <= 5 && product.showLowStockBadge !== false) return { text: 'ÚLTIMOS', color: 'bg-rose-500 text-white' };
    if (product.price < 10) return { text: 'OFERTA', color: 'bg-[#D4AF37] text-white' }; // Gold
    if (product.id.charCodeAt(0) % 3 === 0) return { text: 'POPULAR', color: 'bg-black text-white' };
    return null;
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    
    // Trigger cart animation
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 300);
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
    const itemsText = cart.map(item => `• *${item.quantity}x* ${item.name} ($${formatUSD(item.price * item.quantity)})`).join('%0A');
    const totalBs = formatBs(total * exchangeRate);
    
    let deliveryText = deliveryMethod === 'delivery' 
      ? `%0A🚚 *DATOS DE ENVÍO* 📦%0A━━━━━━━━━━━━━━━━━━%0A🤵🏻‍♀️ *Recibe:* ${firstName} ${lastName}%0A🪪 *Cédula:* ${idCard}%0A📲 *Teléfono:* ${phone}%0A🏫 *Agencia:* ${shippingAgency}%0A📍 *Dirección:* ${deliveryAddress}%0A🔍 *Referencia:* ${deliveryReference}`
      : `%0A🏪 *ENTREGA:* Retiro en Tienda%0A━━━━━━━━━━━━━━━━━━%0A👤 *Cliente:* ${firstName} ${lastName}`;

    let notesText = orderNotes ? `%0A%0A📝 *NOTAS:*%0A${orderNotes}` : '';
    let discountText = appliedDiscount > 0 ? `%0A✨ *DESCUENTO:* -${appliedDiscount}% (-$${formatUSD(discountAmountValue)})` : '';
    
    const message = `🛍️ *NUEVO PEDIDO - ${businessInfo.name.toUpperCase()}*%0A━━━━━━━━━━━━━━━━━━%0A¡Hola! 👋 Quiero realizar el siguiente pedido: 💖%0A${deliveryText}%0A%0A🛒 *DETALLE DEL PEDIDO:*%0A${itemsText}${discountText}${notesText}%0A%0A━━━━━━━━━━━━━━━━━━%0A💰 *TOTAL A PAGAR:*%0A💵 *USD:* $${formatUSD(total)}%0A💸 *BS:* ${totalBs}%0A💳 *MÉTODO:* ${paymentMethod.replace('_', ' ').toUpperCase()}%0A━━━━━━━━━━━━━━━━━━`;
    
    // Clean business phone number for WhatsApp URL
    const cleanPhone = businessInfo.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}/?text=${message}`, '_blank');
    
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
                          <p className="text-sm text-gray-500 mt-1">${formatUSD(item.price)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:text-black"><Minus size={14} /></button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:text-black"><Plus size={14} /></button>
                          </div>
                          <span className="font-bold text-gray-900">${formatUSD(item.price * item.quantity)}</span>
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
                  <span className="text-2xl font-bold text-gray-900">${formatUSD(subtotal)}</span>
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
                    <span className={`text-sm font-bold ${deliveryMethod === 'delivery' ? 'text-gray-900' : 'text-gray-500'}`}>Envío Nacional</span>
                    <span className="text-xs text-gray-400 mt-1">Cobro en Destino</span>
                  </button>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                      <p className="text-[10px] font-bold text-blue-800 uppercase mb-2 flex items-center">
                        <Info size={12} className="mr-1" /> Referencias Costo Envio (Por Kilo)
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-[9px] font-medium text-blue-700">
                        <div className="bg-white/50 p-2 rounded-lg text-center"><span className="block font-bold">MRW</span> $3.8 USD</div>
                        <div className="bg-white/50 p-2 rounded-lg text-center"><span className="block font-bold">Zoom</span> $7.5 USD</div>
                        <div className="bg-white/50 p-2 rounded-lg text-center"><span className="block font-bold">Tealca</span> $8 USD</div>
                      </div>
                      <p className="text-[8px] text-blue-600 mt-2 italic">*Tasas pueden variar según el peso y destino final.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Selecciona tu Agencia de Envio</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['MRW', 'ZOOM', 'TEALCA'].map(agency => (
                          <button
                            key={agency}
                            type="button"
                            onClick={() => setShippingAgency(agency)}
                            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${shippingAgency === agency ? 'border-black bg-gray-50 text-black' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                          >
                            {agency}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dirección Exacta de Agencia</label>
                      <textarea 
                        value={deliveryAddress} 
                        onChange={e => setDeliveryAddress(e.target.value)} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all resize-none h-20" 
                        placeholder="Ej. Av. Bolívar, C.C. Los Jarales, Local 5" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Punto de Referencia</label>
                      <input 
                        type="text" 
                        value={deliveryReference} 
                        onChange={e => setDeliveryReference(e.target.value)} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all" 
                        placeholder="Ej. Al lado del banco Bicentenario" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 pb-28 bg-white border-t border-gray-100">
              <button 
                disabled={!firstName || !lastName || !idCard || !phone || (deliveryMethod === 'delivery' && (!deliveryAddress || !deliveryReference || !shippingAgency))}
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
                    <div className="flex-1 text-left">
                      <span className="block font-bold text-gray-900">{method.name}</span>
                      {paymentMethod === method.id && (
                        <div className="mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                          {method.id === 'pago_movil' && businessInfo.paymentConfig?.pagoMovil && (
                            <p className="text-[10px] text-gray-500 leading-tight">
                              {businessInfo.paymentConfig.pagoMovil.banco} • {businessInfo.paymentConfig.pagoMovil.telf} • {businessInfo.paymentConfig.pagoMovil.ci}
                            </p>
                          )}
                          {method.id === 'zelle' && businessInfo.paymentConfig?.zelle && (
                            <p className="text-[10px] text-gray-500 leading-tight">
                              {businessInfo.paymentConfig.zelle.email} • {businessInfo.paymentConfig.zelle.nombre}
                            </p>
                          )}
                          {method.id === 'paypal' && businessInfo.paymentConfig?.paypal && (
                            <p className="text-[10px] text-gray-500 leading-tight">
                              {businessInfo.paymentConfig.paypal.email}
                            </p>
                          )}
                          {method.id === 'usdt_binance' && businessInfo.paymentConfig?.binance && (
                            <p className="text-[10px] text-gray-500 leading-tight">
                              {businessInfo.paymentConfig.binance.email}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
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
                  {paymentMethod === 'pago_movil' && businessInfo.paymentConfig?.pagoMovil && (
                    <p className="text-[11px] bg-white p-2 rounded-lg mt-1 border border-gray-100 italic">
                      {businessInfo.paymentConfig.pagoMovil.banco} | {businessInfo.paymentConfig.pagoMovil.telf} | {businessInfo.paymentConfig.pagoMovil.ci}
                    </p>
                  )}
                  {paymentMethod === 'zelle' && businessInfo.paymentConfig?.zelle && (
                    <p className="text-[11px] bg-white p-2 rounded-lg mt-1 border border-gray-100 italic">
                      {businessInfo.paymentConfig.zelle.email} | {businessInfo.paymentConfig.zelle.nombre}
                    </p>
                  )}
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
                    <span className="text-gray-500">Entrega ({deliveryMethod === 'delivery' ? 'Envío' : 'Retiro'})</span>
                    <span className="font-bold text-gray-900">{deliveryMethod === 'delivery' ? 'Cobro en Destino' : 'Gratis'}</span>
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
        <div className="w-10"></div> {/* Spacer to center title if needed or just remove onBack */}
        <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">{businessInfo.name}</h1>
        <button 
          onClick={() => { setIsCartOpen(true); setStep('cart'); }} 
          className={`p-2 -mr-2 relative hover:opacity-70 transition-all duration-300 ${cartAnimation ? 'scale-125 text-pink-500' : 'text-gray-900 scale-100'}`}
        >
          <ShoppingBag size={24} />
          {itemCount > 0 && (
            <span className={`absolute top-0 right-0 w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white transition-transform duration-300 ${cartAnimation ? 'scale-125' : 'scale-100'}`}>
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
        {/* Carousel Banner */}
        <div 
          className="relative overflow-hidden h-40 touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndHandler}
        >
          {carouselItems.map((item: any, index) => (
            <div 
              key={index}
              className={`absolute inset-0 flex flex-col justify-center transition-opacity duration-1000 ${item.bg_color || item.bg || 'bg-pink-50/90'} ${index === carouselIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear ${(!item.title && !item.subtitle) ? 'opacity-100' : 'opacity-20 mix-blend-multiply'}`} 
                style={{ 
                  backgroundImage: item.image ? `url(${item.image})` : 'none',
                  transform: index === carouselIndex ? 'scale(1.1)' : 'scale(1)' 
                }}
              ></div>
              {(item.title || item.subtitle) && (
                <div className="relative z-10 px-6">
                  {item.title && <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">{item.title}</h2>}
                  {item.subtitle && <p className="text-gray-800 text-sm font-medium max-w-[80%]">{item.subtitle}</p>
}
                </div>
              )}
            </div>
          ))}
          {/* Carousel Indicators */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1.5 z-20">
            {carouselItems.map((_, idx) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'w-4 bg-gray-900' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
        </div>

        {/* Social Proof: Trending Section */}
        {products.length > 0 && !selectedCategory && !searchQuery && (
          <div className="py-8 bg-white overflow-hidden border-b border-gray-50">
            <div className="px-6 flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 shadow-sm shadow-pink-100/50">
                  <TrendingUp size={16} strokeWidth={3} />
                </div>
                <h3 className="font-bold text-gray-900 tracking-tight">Más Vendidos</h3>
              </div>
              <div className="flex items-center space-x-1.5 py-1 px-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-full border border-pink-100 animate-pulse">
                <Zap size={11} className="text-pink-500 fill-pink-500" />
                <span className="text-[9px] font-black text-pink-600 uppercase tracking-wider">Tendencia</span>
              </div>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto px-6 hide-scrollbar pb-4 -mb-4">
              {(businessInfo.top10 && businessInfo.top10.length > 0 ? businessInfo.top10.map(id => products.find(p => p.id === id)).filter((p): p is Product => !!p) : products.slice(0, 8)).map((product, idx) => (
                <div 
                  key={`trending-${product.id}`}
                  onClick={() => setSelectedProduct(product)}
                  className="shrink-0 w-36 group cursor-pointer relative"
                >
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden mb-3 relative bg-gray-50 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-pink-900/5 group-hover:-translate-y-1">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 rounded-md text-[7px] font-bold uppercase tracking-wider flex items-center shadow-sm backdrop-blur-sm">
                      <div className="w-1 h-1 bg-pink-500 rounded-full mr-1 animate-ping"></div>
                      POPULAR
                    </div>
                    {/* Position Number Label */}
                    <div className="absolute bottom-0 left-0 w-10 h-10 bg-black/90 text-white flex items-center justify-center font-black text-lg rounded-tr-3xl italic">
                      {idx + 1}
                    </div>
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-pink-600 transition-colors uppercase tracking-tight">{product.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-black text-gray-900">${formatUSD(product.price)}</p>
                    <div className="bg-pink-50 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity transform -rotate-12">
                      <Plus size={12} className="text-pink-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Trust Badges (Social Proof) */}
        {!selectedCategory && !searchQuery && (
          <div className="px-6 py-6 bg-pink-50/30 grid grid-cols-3 gap-2 border-b border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-pink-500 shadow-sm mb-2">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[9px] font-bold text-gray-900 uppercase">Calidad</span>
              <span className="text-[8px] text-gray-500 leading-tight">Garantizada</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-pink-500 shadow-sm mb-2">
                <Truck size={18} />
              </div>
              <span className="text-[9px] font-bold text-gray-900 uppercase">Envíos</span>
              <span className="text-[8px] text-gray-500 leading-tight">Nacionales</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-pink-500 shadow-sm mb-2">
                <ShieldCheck size={18} />
              </div>
              <span className="text-[9px] font-bold text-gray-900 uppercase">Pago</span>
              <span className="text-[8px] text-gray-500 leading-tight">100% Seguro</span>
            </div>
          </div>
        )}

        {/* Search & Categories */}
        <div className="pt-4 pb-2">
          {/* Search Bar & Controls */}
          <div className="px-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar maquillaje, brochas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-2xl text-sm focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all shadow-sm"
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
                  className="w-full appearance-none bg-white/50 border border-gray-200/50 text-gray-700 py-2 pl-9 pr-8 rounded-full text-xs font-bold outline-none focus:ring-2 focus:ring-primary-200 transition-all shadow-sm"
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
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm ${selectedCategory === 'favorites' ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white/50 border-gray-200/50 text-gray-600 hover:bg-white'}`}
              >
                <Heart size={14} className={selectedCategory === 'favorites' ? 'fill-current' : ''} />
                <span>Favoritos ({favorites.length})</span>
              </button>
            </div>
          </div>

          {/* Categories Grid/Row */}
          <div className="px-6 mt-6 overflow-x-auto hide-scrollbar pb-2">
            <div className="flex space-x-6">
              <div 
                className="flex flex-col items-center text-center cursor-pointer group"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedBrand(null);
                }}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-2 transition-all ${selectedCategory === null ? 'bg-black text-white border-none scale-105' : 'bg-white text-gray-400 group-hover:text-pink-500 border border-gray-100'}`}>
                  <LayoutGrid size={20} />
                </div>
                <span className={`text-[9px] font-bold uppercase transition-colors ${selectedCategory === null ? 'text-black' : 'text-gray-500 group-hover:text-gray-900'}`}>Todos</span>
              </div>
              
              {categories.map(category => {
                const isSelected = selectedCategory === category.name.toUpperCase();
                return (
                  <div 
                    key={category.id}
                    className="flex flex-col items-center text-center cursor-pointer group shrink-0"
                    onClick={() => {
                      setSelectedCategory(category.name.toUpperCase());
                      setSelectedBrand(null);
                    }}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-2 transition-all overflow-hidden bg-white border ${isSelected ? 'border-pink-500 p-[2px] scale-105' : 'border-gray-100 p-1 group-hover:border-pink-200'}`}>
                      <div className="w-full h-full rounded-[12px] bg-gray-50 flex items-center justify-center overflow-hidden">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300">N/A</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase leading-tight transition-colors px-1 text-center ${isSelected ? 'text-pink-600' : 'text-gray-500 group-hover:text-gray-900'}`}>
                      {category.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brands (Pills) - Only show if a category is selected and has brands */}
          {selectedCategory && selectedCategory !== 'favorites' && availableBrands.length > 0 && (
            <div className="px-6 mt-2 overflow-x-auto hide-scrollbar">
              <div className="flex space-x-2 pb-2">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedBrand === null ? 'bg-primary-100 text-primary-700 shadow-sm border border-primary-200' : 'bg-white/40 border border-gray-200/40 text-gray-500 hover:bg-white/60'}`}
                >
                  Todas las Marcas
                </button>
                {availableBrands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedBrand === brand ? 'bg-primary-100 text-primary-700 shadow-sm border border-primary-200' : 'bg-white/40 border border-gray-200/40 text-gray-500 hover:bg-white/60'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="px-6 py-6">
        {isLoading && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-gray-100 rounded-2xl mb-3"></div>
                <div className="h-3 bg-gray-100 rounded-full w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded-full w-full mb-2"></div>
                <div className="h-3 bg-gray-100 rounded-full w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No se encontraron productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10">
            {displayedProducts.map(product => {
              const badge = getProductBadge(product);
              const isFavorite = favorites.includes(product.id);
              
              return (
                <div key={product.id} className="group flex flex-col cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-pink-50/30 mb-3 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.1)] border border-pink-100/50">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    
                    {/* Badges */}
                    {badge && product.stock > 0 && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className={`${badge.color} text-[7px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm backdrop-blur-sm`}>
                          {badge.text}
                        </span>
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button 
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-500 hover:text-pink-500 transition-colors shadow-sm"
                    >
                      <Heart size={16} className={isFavorite ? 'fill-pink-500 text-pink-500 animate-heart-burst' : ''} />
                    </button>

                    {product.gender && (
                      <div className="absolute top-2.5 left-2.5 flex flex-col space-y-1">
                        {!badge && (
                          <span className={`text-[7px] font-bold px-2 py-0.5 rounded-md border shadow-sm uppercase tracking-wider backdrop-blur-sm ${
                            product.gender === 'Mujer' ? 'bg-pink-50/90 border-pink-100 text-pink-600' : 
                            product.gender === 'Hombre' ? 'bg-blue-50/90 border-blue-100 text-blue-600' : 
                            'bg-purple-50/90 border-purple-100 text-purple-600'
                          }`}>
                            {product.gender}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Glassmorphism Add Button */}
                    {product.stock > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="absolute bottom-2 right-2 z-10 w-10 h-10 bg-white/90 border border-white text-gray-900 rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all shadow-md group-hover:shadow-lg"
                      >
                        <Plus size={20} />
                      </button>
                    )}

                    {/* Soft gradient overlay at bottom for contrast */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                        <span className="bg-black text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">Agotado</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 px-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-bold text-pink-500 uppercase tracking-widest">{product.category}</span>
                      <div className="flex items-center text-[10px] text-gray-500 font-medium">
                        <span className="text-[#D4AF37] mr-0.5">★</span>
                        <span>4.8</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-serif font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</h3>
                    <span className="text-sm font-medium text-gray-900">${formatUSD(product.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Load More Button */}
        {!isLoading && filteredProducts.length > visibleCount && (
          <div className="mt-10 px-6 flex justify-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="py-3 px-8 bg-black text-white rounded-full font-bold text-sm shadow-md hover:bg-gray-800 transition-colors"
            >
              Mostrar más
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-10 pb-12 px-6 mt-4">
        <div className="text-center">
          <Link to="/login" className="inline-block">
            <h2 className="font-serif text-2xl font-bold text-gray-900 tracking-tight mb-3 hover:text-primary-600 transition-colors uppercase tracking-widest">{businessInfo.name}</h2>
          </Link>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Tu belleza, nuestra pasión. Productos de maquillaje y cuidado facial de la más alta calidad para resaltar tu brillo natural.
          </p>
          
          <div className="flex justify-center items-center space-x-5 mb-8">
            {businessInfo.instagram && (
              <a href={businessInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors shadow-sm">
                <Instagram size={22} />
              </a>
            )}
            {businessInfo.tiktok && (
              <a href={businessInfo.tiktok} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors shadow-sm">
                {/* TikTok Custom SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            )}
            {businessInfo.facebook && (
              <a href={businessInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors shadow-sm">
                <Facebook size={22} />
              </a>
            )}
          </div>
          
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 font-medium">
              © {new Date().getFullYear()} {businessInfo.name}. Todos los derechos reservados.
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
        <div className="fixed inset-0 z-[60] bg-white animate-in slide-in-from-bottom duration-300">
          <ProductDetails 
            product={selectedProduct}
            exchangeRate={exchangeRate}
            onBack={() => setSelectedProduct(null)}
            isCustomer={true}
            onAddToCart={(quantity) => {
              addToCart(selectedProduct, quantity);
              setSelectedProduct(null);
              setIsCartOpen(true);
            }}
          />
        </div>
      )}
    </div>
  );
}
