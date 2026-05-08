import React, { useState, useEffect } from 'react';
import { User, Store, Bell, Shield, CircleHelp, LogOut, ChevronRight, ArrowLeft, Save, Camera, Upload, Loader2, X, CreditCard, Banknote, Smartphone, Globe, Layout, MonitorSmartphone, Image as ImageIcon, Plus, Trash2, Edit2, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BusinessInfo, Page, Banner } from '../../types';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../lib/imageUtils';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { offlineManager } from '../../lib/offlineManager';
import { notificationService } from '../../services/notificationService';
import { useTutorial } from '../TutorialProvider';

interface SettingsProps {
  businessInfo: BusinessInfo;
  setBusinessInfo: React.Dispatch<React.SetStateAction<BusinessInfo>>;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
  banners: Banner[];
  setBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
  userRole?: string;
}

export default function Settings({ businessInfo, setBusinessInfo, onNavigate, onSignOut, banners, setBanners, userRole }: SettingsProps) {
  const { startTutorial } = useTutorial();
  const normalizedRole = userRole?.toLowerCase().trim();
  const isSalesperson = normalizedRole === 'vendedor' || normalizedRole === 'salesperson' || normalizedRole === 'worker' || normalizedRole === 'worker_inventory';
  const { isOnline } = useOfflineSync();
  const [activeView, setActiveView] = useState<'main' | 'business' | 'payments' | 'branding' | 'banners' | 'notifications'>('main');
  const [formData, setFormData] = useState<BusinessInfo>(businessInfo);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  // Load push status
  React.useEffect(() => {
    notificationService.checkSubscription().then(setIsPushEnabled);
  }, []);

  const handleTogglePush = async () => {
    try {
      setIsSaving(true);
      if (isPushEnabled) {
        await notificationService.unsubscribeUser(businessInfo.email || 'admin');
        setIsPushEnabled(false);
        toast.success('Notificaciones desactivadas');
      } else {
        const sub = await notificationService.subscribeUser(businessInfo.email || 'admin');
        setIsPushEnabled(true);
        toast.success('¡Notificaciones activadas!');
      }
    } catch (error: any) {
      console.error('Push error:', error);
      toast.error(error.message || 'Error al configurar notificaciones');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!isPushEnabled) {
      toast.error('Primero debes activar las notificaciones');
      return;
    }

    setTestCountdown(10);
    const interval = setInterval(() => {
      setTestCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(async () => {
      try {
        await notificationService.sendTestNotification();
        toast.success('Notificación de prueba enviada');
      } catch (error) {
        toast.error('Error al enviar prueba');
      }
    }, 10000);
  };

  // Banner states
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerModal, setBannerModal] = useState(false);
  const [bannerFormData, setBannerFormData] = useState<Partial<Banner>>({
    title: '',
    subtitle: '',
    image: '',
    bg_color: 'bg-pink-50/90',
    active: true
  });
  const [brandingFile, setBrandingFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressedBlob = await compressImage(file, 1200, 0.7);
      const compressedFile = new File([compressedBlob], `banner_${Date.now()}.webp`, { type: 'image/webp' });

      const fileName = `banners/${compressedFile.name}`;
      const { error } = await supabase.storage.from('productos').upload(fileName, compressedFile);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
      setBannerFormData(prev => ({ ...prev, image: publicUrl }));
      toast.success('Imagen de banner subida');
    } catch (error: any) {
      toast.error('Error al subir imagen: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerFormData.image) {
      toast.error('La imagen es obligatoria');
      return;
    }

    try {
      setIsSaving(true);
      const bannerData = {
        title: bannerFormData.title || '',
        subtitle: bannerFormData.subtitle || '',
        image: bannerFormData.image,
        bg_color: bannerFormData.bg_color || 'bg-pink-50/90',
        active: bannerFormData.active
      };

      if (editingBanner) {
        const { error } = await supabase.from('banners').update(bannerData).eq('id', editingBanner.id);
        if (error) throw error;
        setBanners(prev => prev.map(b => b.id === editingBanner.id ? { ...b, ...bannerData } : b));
        toast.success('Banner actualizado');
      } else {
        const { data, error } = await supabase.from('banners').insert([bannerData]).select().single();
        if (error) throw error;
        setBanners(prev => [...prev, data]);
        toast.success('Banner creado');
      }
      setBannerModal(false);
      setEditingBanner(null);
      setBannerFormData({ title: '', subtitle: '', image: '', bg_color: 'bg-pink-50/90', active: true });
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success('Banner eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const generateIcons = async (file: File) => {
    const sizes = {
      icon192: 192,
      icon512: 512,
      appleTouch: 180,
      favicon: 64 // 64x64 is good for modern favicons
    };

    const result: { [key: string]: string } = {};

    const resize = (f: File, size: number): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Fill background for some icons if needed, but transparent is better for PNG
              ctx.clearRect(0, 0, size, size);
              ctx.drawImage(img, 0, 0, size, size);
              resolve(canvas.toDataURL('image/png'));
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(f);
      });
    };

    for (const [key, size] of Object.entries(sizes)) {
      result[key] = await resize(file, size);
    }

    return result;
  };

  const handleApplyBranding = async () => {
    if (!brandingFile) return;

    try {
      setIsSaving(true);
      toast.loading('Procesando y subiendo iconos...', { id: 'branding' });
      
      const icons = await generateIcons(brandingFile);
      const uploadedIcons: { [key: string]: string } = {};

      // Upload each generated icon to Supabase Storage
      for (const [key, base64] of Object.entries(icons)) {
        const res = await fetch(base64);
        const blob = await res.blob();
        const fileName = `pwa/${key}_${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(fileName, blob, { contentType: 'image/png', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('productos')
          .getPublicUrl(fileName);
        
        uploadedIcons[key] = publicUrl;
      }

      // Save the URLs in business_info merged with paymentConfig
      const updatedPaymentConfig = {
        ...formData.paymentConfig,
        branding: uploadedIcons
      };

      const { error: dbError } = await supabase
        .from('business_info')
        .upsert({
          id: 1,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          logo: formData.logo,
          instagram: formData.instagram,
          tiktok: formData.tiktok,
          facebook: formData.facebook,
          store_url: formData.storeUrl,
          payment_config: updatedPaymentConfig
        });

      if (dbError) throw dbError;

      setBusinessInfo(prev => ({ 
        ...prev, 
        ...formData, 
        paymentConfig: updatedPaymentConfig 
      }));
      toast.success('¡Branding aplicado globalmente! La app se actualizará en unos segundos.', { id: 'branding' });
      
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      console.error('Error applying branding:', error);
      toast.error(`Error: ${error.message || 'Error al conectar con Supabase'}`, { id: 'branding' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updateData = {
        id: 1,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        logo: formData.logo,
        instagram: formData.instagram,
        tiktok: formData.tiktok,
        facebook: formData.facebook,
        store_url: formData.storeUrl,
        payment_config: formData.paymentConfig
      };

      if (isOnline) {
        const { error } = await supabase
          .from('business_info')
          .upsert(updateData);

        if (error) throw error;
        toast.success('Información del negocio guardada exitosamente');
      } else {
        throw new Error('offline');
      }

      setBusinessInfo(formData);
      setActiveView('main');
    } catch (error: any) {
      if (error.message === 'offline' || error.message?.includes('fetch')) {
        offlineManager.addAction('UPDATE_BUSINESS_INFO', { id: 1, updates: { 
          name: formData.name, 
          address: formData.address, 
          phone: formData.phone, 
          email: formData.email,
          instagram: formData.instagram,
          tiktok: formData.tiktok,
          facebook: formData.facebook,
          store_url: formData.storeUrl,
          payment_config: formData.paymentConfig
        }});
        setBusinessInfo(formData);
        toast.success('Cambios guardados localmente (PWA offline)');
        setActiveView('main');
      } else {
        console.error('Error saving business info:', error);
        toast.error(`Error al guardar: ${error.message || 'Error de conexión'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const compressedBlob = await compressImage(file, 800, 0.8);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
        type: 'image/webp'
      });

      const fileName = `logo_${Date.now()}_${compressedFile.name}`;
      const { error } = await supabase.storage
        .from('productos')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading logo:', error);
        toast.error(`Error de Supabase: ${error.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo: publicUrl }));
      toast.success('Logo subido exitosamente');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(`Error: ${error.message || 'Desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const sections = isSalesperson ? [
    {
      title: 'Cuenta',
      items: [
        { id: 'payments', icon: CreditCard, label: 'Métodos de Pago', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      ]
    },
    {
      title: 'Soporte',
      items: [
        { id: 'tutorial', icon: CircleHelp, label: 'Guía Interactiva (Tutorial)', color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'help', icon: CircleHelp, label: 'Ayuda y Soporte', color: 'text-gray-500', bg: 'bg-gray-100' },
      ]
    }
  ] : [
    {
      title: 'Cuenta',
      items: [
        { id: 'profile', icon: User, label: 'Perfil de Usuario', color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'users', icon: User, label: 'Gestión de Empleados', color: 'text-rose-500', bg: 'bg-rose-50' },
        { id: 'business', icon: Store, label: 'Información del Negocio', color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'branding', icon: Layout, label: 'Branding y PWA', color: 'text-pink-500', bg: 'bg-pink-50' },
        { id: 'banners', icon: ImageIcon, label: 'Banners de la Tienda', color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 'payments', icon: CreditCard, label: 'Métodos de Pago', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      ]
    },
    {
      title: 'Preferencias',
      items: [
        { id: 'notifications', icon: Bell, label: 'Notificaciones', color: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 'privacy', icon: Shield, label: 'Privacidad y Seguridad', color: 'text-green-500', bg: 'bg-green-50' },
      ]
    },
    {
      title: 'Soporte',
      items: [
        { id: 'tutorial', icon: CircleHelp, label: 'Guía Interactiva (Tutorial)', color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'help', icon: CircleHelp, label: 'Ayuda y Soporte', color: 'text-gray-500', bg: 'bg-gray-100' },
      ]
    }
  ];

  if (activeView === 'payments') {
    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative bg-gray-50">
        <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center space-x-2">
          <button 
            onClick={() => setActiveView('main')}
            className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Métodos de Pago</h2>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          {/* Pago Móvil */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
              <Smartphone size={18} className="text-emerald-500" />
              <h3 className="font-bold text-gray-900">Pago Móvil</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Banco</label>
                <input 
                  type="text" 
                  value={formData.paymentConfig?.pagoMovil?.banco || ''}
                  onChange={e => setFormData({
                    ...formData, 
                    paymentConfig: {
                      ...formData.paymentConfig,
                      pagoMovil: { ...(formData.paymentConfig?.pagoMovil || { telf: '', ci: '' }), banco: e.target.value }
                    }
                  })}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-75 disabled:bg-gray-50"
                  placeholder="Ej. Banesco"
                  readOnly={isSalesperson}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                  <input 
                    type="tel" 
                    value={formData.paymentConfig?.pagoMovil?.telf || ''}
                    onChange={e => setFormData({
                      ...formData, 
                      paymentConfig: {
                        ...formData.paymentConfig,
                        pagoMovil: { ...(formData.paymentConfig?.pagoMovil || { banco: '', ci: '' }), telf: e.target.value }
                      }
                    })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-75 disabled:bg-gray-50"
                    placeholder="0412..."
                    readOnly={isSalesperson}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cédula</label>
                  <input 
                    type="text" 
                    value={formData.paymentConfig?.pagoMovil?.ci || ''}
                    onChange={e => setFormData({
                      ...formData, 
                      paymentConfig: {
                        ...formData.paymentConfig,
                        pagoMovil: { ...(formData.paymentConfig?.pagoMovil || { banco: '', telf: '' }), ci: e.target.value }
                      }
                    })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-75 disabled:bg-gray-50"
                    placeholder="V-0000..."
                    readOnly={isSalesperson}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Zelle */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
              <Globe size={18} className="text-blue-500" />
              <h3 className="font-bold text-gray-900">Zelle</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Correo Zelle</label>
                <input 
                  type="email" 
                  value={formData.paymentConfig?.zelle?.email || ''}
                  onChange={e => setFormData({
                    ...formData, 
                    paymentConfig: {
                      ...formData.paymentConfig,
                      zelle: { ...(formData.paymentConfig?.zelle || { nombre: '' }), email: e.target.value }
                    }
                  })}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-75 disabled:bg-gray-50"
                  placeholder="zelle@ejemplo.com"
                  readOnly={isSalesperson}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre del Titular</label>
                <input 
                  type="text" 
                  value={formData.paymentConfig?.zelle?.nombre || ''}
                  onChange={e => setFormData({
                    ...formData, 
                    paymentConfig: {
                      ...formData.paymentConfig,
                      zelle: { ...(formData.paymentConfig?.zelle || { email: '' }), nombre: e.target.value }
                    }
                  })}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-75 disabled:bg-gray-50"
                  placeholder="Nombre completo"
                  readOnly={isSalesperson}
                />
              </div>
            </div>
          </div>

          {/* PayPal / Binance */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
              <CreditCard size={18} className="text-indigo-500" />
              <h3 className="font-bold text-gray-900">Otros (PayPal / Binance)</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email PayPal</label>
                <input 
                  type="email" 
                  value={formData.paymentConfig?.paypal?.email || ''}
                  onChange={e => setFormData({
                    ...formData, 
                    paymentConfig: {
                      ...formData.paymentConfig,
                      paypal: { email: e.target.value }
                    }
                  })}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-75 disabled:bg-gray-50"
                  placeholder="paypal@ejemplo.com"
                  readOnly={isSalesperson}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Binance Email/ID</label>
                <input 
                  type="text" 
                  value={formData.paymentConfig?.binance?.email || ''}
                  onChange={e => setFormData({
                    ...formData, 
                    paymentConfig: {
                      ...formData.paymentConfig,
                      binance: { ...(formData.paymentConfig?.binance || { id: '' }), email: e.target.value }
                    }
                  })}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-75 disabled:bg-gray-50"
                  placeholder="Email o Pay ID"
                  readOnly={isSalesperson}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 pb-safe">
          {!isSalesperson && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Métodos de Pago'}
            </button>
          )}
          {isSalesperson && (
            <p className="text-center text-xs text-gray-400 py-2">Vista de solo lectura</p>
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'branding') {
    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative bg-gray-50">
        <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center space-x-2">
          <button 
            onClick={() => setActiveView('main')}
            className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Personalización PWA</h2>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                <MonitorSmartphone size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Iconos de Aplicación</h3>
                <p className="text-xs text-gray-500">Configura como se verá tu app en Android y iPhone.</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 text-center space-y-4">
              {brandingFile ? (
                <div className="space-y-4 w-full">
                  <div className="flex justify-center flex-wrap gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">iPhone (Apple Icon)</p>
                      <div className="w-20 h-20 bg-white rounded-[1.2rem] shadow-md border border-gray-100 overflow-hidden">
                        <img src={URL.createObjectURL(brandingFile)} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Android (Manifest)</p>
                      <div className="w-20 h-20 bg-white rounded-full shadow-md border border-gray-100 overflow-hidden">
                        <img src={URL.createObjectURL(brandingFile)} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setBrandingFile(null);
                      setPreviews({});
                    }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Quitar imagen
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 border border-gray-100 shadow-sm">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Sube tu logo principal</p>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] mx-auto">Recomendado: Imagen cuadrada de al menos 512x512px (PNG/JPG).</p>
                  </div>
                  <label className="bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-primary-700 transition-colors">
                    Seleccionar Archivo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setBrandingFile(file);
                      }} 
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 flex items-start space-x-3">
             <CircleHelp className="text-amber-500 shrink-0" size={18} />
             <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">Automatización Inteligente:</p>
                Al aplicar los cambios, el sistema generará automáticamente:
                <ul className="list-disc ml-4 mt-1 opacity-80">
                   <li>Iconos PWA (192, 512)</li>
                   <li>Apple Touch Icon (iOS)</li>
                   <li>Favicon para navegadores</li>
                </ul>
                <p className="mt-2 text-[10px] opacity-60">* Se recomienda usar una imagen con fondo para iOS.</p>
             </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 pb-safe">
          <button 
            onClick={handleApplyBranding}
            disabled={!brandingFile || isSaving}
            className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <MonitorSmartphone size={18} className="mr-2" />}
            {isSaving ? 'Procesando y Guardando...' : 'Aplicar Branding General'}
          </button>
        </div>
      </div>
    );
  }

  if (activeView === 'banners') {
    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative bg-gray-50">
        <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveView('main')}
              className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Banners de la Tienda</h2>
          </div>
          <button 
            onClick={() => {
              setEditingBanner(null);
              setBannerFormData({ title: '', subtitle: '', image: '', bg_color: 'bg-pink-50/90', active: true });
              setBannerModal(true);
            }}
            className="p-2 bg-primary-600 text-white rounded-xl shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
          <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl flex items-start space-x-3 text-sm mb-2 border border-blue-100">
            <Info size={20} className="shrink-0 mt-0.5 text-blue-500" />
            <p>
              <strong>Recomendación de dimensiones:</strong> Para que tus banners se vean perfectos tanto en celulares como en computadoras, te recomendamos usar imágenes horizontales (ej. <strong>1200x500 pixeles</strong>). Mantén cualquier texto o detalle importante en el centro de la imagen.
            </p>
          </div>
          {banners.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <ImageIcon className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500 text-sm">No hay banners configurados</p>
            </div>
          ) : (
            banners.map(banner => (
              <div key={banner.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
                <div className="relative h-32 bg-gray-100">
                  <img src={banner.image} className="w-full h-full object-cover" alt={banner.title} />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button 
                      onClick={() => {
                        setEditingBanner(banner);
                        setBannerFormData(banner);
                        setBannerModal(true);
                      }}
                      className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-blue-600 hover:bg-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-red-600 hover:bg-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{banner.title}</h4>
                    <p className="text-xs text-gray-500">{banner.subtitle}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${banner.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {banner.active ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Banner Editor Modal */}
        {bannerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBannerModal(false)} />
            <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">{editingBanner ? 'Editar Banner' : 'Nuevo Banner'}</h3>
                <button onClick={() => setBannerModal(false)} className="p-2 bg-gray-50 text-gray-400 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título (Opcional)</label>
                  <input 
                    type="text" 
                    value={bannerFormData.title}
                    onChange={e => setBannerFormData({...bannerFormData, title: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                    placeholder="Ej. Descubre tu belleza"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subtítulo (Opcional)</label>
                  <input 
                    type="text" 
                    value={bannerFormData.subtitle}
                    onChange={e => setBannerFormData({...bannerFormData, subtitle: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                    placeholder="Ej. Los mejores productos..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Imagen (URL o subir)</label>
                  <p className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded-lg mb-2">Recomendado: Imagen horizontal (ej. 1200x500px). El diseño se recorta automáticamente para adaptarse al dispositivo.</p>
                  <div className="space-y-2">
                    {bannerFormData.image && (
                      <div className="relative h-24 bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
                        <img src={bannerFormData.image} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setBannerFormData({...bannerFormData, image: ''})}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <label className="flex-1 flex items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-100 text-gray-600 text-xs font-bold">
                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} className="mr-2" />}
                        {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleBannerImageUpload} disabled={isUploading} />
                      </label>
                      <button 
                        onClick={() => {
                          const url = prompt('URL de la imagen:');
                          if (url) setBannerFormData({...bannerFormData, image: url});
                        }}
                        className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-600"
                      >
                        <Globe size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-bold text-gray-700">Banner Activo</span>
                  <button 
                    onClick={() => setBannerFormData({...bannerFormData, active: !bannerFormData.active})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${bannerFormData.active ? 'bg-primary-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${bannerFormData.active ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <button 
                  onClick={handleSaveBanner}
                  disabled={isSaving}
                  className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                  {editingBanner ? 'Actualizar Banner' : 'Guardar Banner'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'notifications') {
    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative bg-gray-50">
        <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center space-x-2">
          <button 
            onClick={() => setActiveView('main')}
            className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Notificaciones Push</h2>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl ${isPushEnabled ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Bell size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Alertas de Venta</h3>
                  <p className="text-xs text-gray-500">Recibe un aviso cada vez que se realice una venta.</p>
                </div>
              </div>
              <button 
                onClick={handleTogglePush}
                disabled={isSaving}
                className={`w-14 h-7 rounded-full transition-all relative ${isPushEnabled ? 'bg-orange-500' : 'bg-gray-300'} ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isPushEnabled ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                * Las notificaciones requieren permiso del navegador. Si no recibes alertas, verifica los ajustes del sitio en tu navegador o APK.
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
            <h4 className="text-sm font-bold text-blue-900 mb-2">¿Cómo funciona?</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              Al activar esta opción, vinculamos este dispositivo a tu cuenta de administrador. Cuando un trabajador registre una venta, el servidor enviará una señal cifrada que despertará tu teléfono o computadora para mostrarte el monto de la venta al instante.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleTestNotification}
              disabled={testCountdown !== null || !isPushEnabled}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all ${
                testCountdown !== null 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : isPushEnabled 
                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200' 
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
              }`}
            >
              {testCountdown !== null ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Enviando en {testCountdown}s...</span>
                </>
              ) : (
                <>
                  <Bell size={18} />
                  <span>Probar Notificación</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              Envía una notificación de prueba a todos los administradores suscritos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'business') {
    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative bg-gray-50">
        <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center space-x-2">
          <button 
            onClick={() => setActiveView('main')}
            className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Información del Negocio</h2>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            
            {/* Logo Upload Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Logo del Negocio</label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden relative">
                  {formData.logo ? (
                    <>
                      <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, logo: undefined }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <Store size={32} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    {isUploading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Camera size={18} className="mr-2" />}
                    <span>{isUploading ? 'Subiendo...' : 'Cambiar Logo'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      className="hidden" 
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Recomendado: 500x500px (JPG, PNG)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre del Negocio</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                placeholder="Ej. Stely Beauty"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dirección</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                placeholder="Dirección del local"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                placeholder="+58 412-0000000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Globe size={14} className="text-primary-500" />
                <span>URL de la Tienda Online</span>
              </label>
              <input 
                type="url" 
                value={formData.storeUrl || ''}
                onChange={e => setFormData({...formData, storeUrl: e.target.value})}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                placeholder="https://tulink.com"
              />
              <p className="text-[10px] text-gray-400 mt-1 italic">Este link se usará para compartir tu tienda y en el catálogo PDF.</p>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Redes Sociales</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instagram URL</label>
                  <input 
                    type="url" 
                    value={formData.instagram || ''}
                    onChange={e => setFormData({...formData, instagram: e.target.value})}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                    placeholder="https://instagram.com/tu_cuenta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">TikTok URL</label>
                  <input 
                    type="url" 
                    value={formData.tiktok || ''}
                    onChange={e => setFormData({...formData, tiktok: e.target.value})}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                    placeholder="https://tiktok.com/@tu_cuenta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Facebook URL</label>
                  <input 
                    type="url" 
                    value={formData.facebook || ''}
                    onChange={e => setFormData({...formData, facebook: e.target.value})}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                    placeholder="https://facebook.com/tu_pagina"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 pb-safe">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-xl font-bold">
          {businessInfo.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{businessInfo.name}</h2>
          <p className="text-sm text-gray-500 capitalize">{isSalesperson ? 'Vendedor' : 'Administrador'}</p>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{section.title}</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={itemIdx}
                    id={`setting-item-${item.id}`}
                    onClick={() => {
                      if (item.id === 'tutorial') startTutorial();
                      if (item.id === 'users') onNavigate('admin-users');
                      if (item.id === 'business') setActiveView('business');
                      if (item.id === 'branding') setActiveView('branding');
                      if (item.id === 'banners') setActiveView('banners');
                      if (item.id === 'payments') setActiveView('payments');
                      if (item.id === 'notifications') setActiveView('notifications');
                      if (item.id === 'privacy') onNavigate('activity-logs');
                    }}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                      itemIdx !== section.items.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                        <Icon size={18} />
                      </div>
                      <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={onSignOut}
        className="w-full bg-red-50 text-red-600 font-semibold rounded-2xl p-4 flex items-center justify-center space-x-2 hover:bg-red-100 transition-colors"
      >
        <LogOut size={18} />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  );
}
