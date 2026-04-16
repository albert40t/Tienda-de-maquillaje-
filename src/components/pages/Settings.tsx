import React, { useState } from 'react';
import { User, Store, Bell, Shield, CircleHelp, LogOut, ChevronRight, ArrowLeft, Save } from 'lucide-react';
import { BusinessInfo } from '../../types';
import { Page } from '../../App';

interface SettingsProps {
  businessInfo: BusinessInfo;
  setBusinessInfo: React.Dispatch<React.SetStateAction<BusinessInfo>>;
  onNavigate: (page: Page) => void;
}

export default function Settings({ businessInfo, setBusinessInfo, onNavigate }: SettingsProps) {
  const [activeView, setActiveView] = useState<'main' | 'business'>('main');
  const [formData, setFormData] = useState<BusinessInfo>(businessInfo);

  const handleSave = () => {
    setBusinessInfo(formData);
    setActiveView('main');
  };

  const sections = [
    {
      title: 'Cuenta',
      items: [
        { id: 'profile', icon: User, label: 'Perfil de Usuario', color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'business', icon: Store, label: 'Información del Negocio', color: 'text-purple-500', bg: 'bg-purple-50' },
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
            className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:bg-primary-700 transition-colors flex items-center justify-center"
          >
            <Save size={18} className="mr-2" />
            Guardar Cambios
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

      <button className="w-full bg-red-50 text-red-600 font-semibold rounded-2xl p-4 flex items-center justify-center space-x-2 hover:bg-red-100 transition-colors">
        <LogOut size={18} />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  );
}
