import React, { useState } from 'react';
import { User, Store, Bell, Shield, CircleHelp, LogOut, ChevronRight, ArrowLeft, Save, Camera, Upload, Loader2, X, CreditCard, Banknote, Smartphone, Globe, Layout, MonitorSmartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BusinessInfo, Page } from '../../types';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../lib/imageUtils';

interface SettingsProps {
  businessInfo: BusinessInfo;
  setBusinessInfo: React.Dispatch<React.SetStateAction<BusinessInfo>>;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
}

export default function Settings({ businessInfo, setBusinessInfo, onNavigate, onSignOut }: SettingsProps) {
  const [activeView, setActiveView] = useState<'main' | 'business' | 'payments' | 'branding'>('main');
  const [formData, setFormData] = useState<BusinessInfo>(businessInfo);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [brandingFile, setBrandingFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

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
      const icons = await generateIcons(brandingFile);
      
      const response = await fetch('/api/branding/icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(icons)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        // Refresh page after a short delay to see changes?
        // Or just notify
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error applying branding:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
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
          payment_config: formData.paymentConfig
        });

      if (error) throw error;

      setBusinessInfo(formData);
      toast.success('Información del negocio guardada exitosamente');
      setActiveView('main');
    } catch (error: any) {
      console.error('Error saving business info:', error);
      toast.error(`Error al guardar: ${error.message || 'Error de conexión'}`);
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

  const sections = [
    {
      title: 'Cuenta',
      items: [
        { id: 'profile', icon: User, label: 'Perfil de Usuario', color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'business', icon: Store, label: 'Información del Negocio', color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'branding', icon: Layout, label: 'Branding y PWA', color: 'text-pink-500', bg: 'bg-pink-50' },
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
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="Ej. Banesco"
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
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                    placeholder="0412..."
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
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                    placeholder="V-0000..."
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
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="zelle@ejemplo.com"
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
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="Nombre completo"
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
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="paypal@ejemplo.com"
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
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="Email o Pay ID"
                />
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
            {isSaving ? 'Guardando...' : 'Guardar Métodos de Pago'}
          </button>
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
          <p className="text-sm text-gray-500">Administrador</p>
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
                    onClick={() => {
                      if (item.id === 'business') setActiveView('business');
                      if (item.id === 'branding') setActiveView('branding');
                      if (item.id === 'payments') setActiveView('payments');
                      if (item.id === 'notifications') onNavigate('activity-logs');
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
