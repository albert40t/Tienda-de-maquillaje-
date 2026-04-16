import { useState } from 'react';
import { Search, Plus, User, Phone, Gift, Star, ArrowLeft, ShoppingBag, Calendar, Edit2, Trash2, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Customer, Sale } from '../../types';
import { supabase } from '../../lib/supabase';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
}

type ModalMode = 'none' | 'add' | 'edit' | 'delete';

export default function Customers({ customers, sales }: CustomersProps) {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [formData, setFormData] = useState<Partial<Customer>>({});

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const getCustomerSales = (customerId: string) => sales.filter(s => s.customerId === customerId);
  const getCustomerTotalSpent = (customerId: string) => getCustomerSales(customerId).reduce((sum, s) => sum + s.total, 0);
  // 1 point per $1 spent
  const getCustomerPoints = (customerId: string) => Math.floor(getCustomerTotalSpent(customerId));

  const openAdd = () => {
    setFormData({ name: '', phone: '', birthday: '' });
    setModalMode('add');
  };

  const openEdit = (customer: Customer) => {
    setFormData(customer);
    setModalMode('edit');
  };

  const openDelete = (customer: Customer) => {
    setFormData(customer);
    setModalMode('delete');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Por favor, completa el nombre y teléfono.');
      return;
    }

    if (modalMode === 'add') {
      const newCustomer = {
        id: `CUST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        name: formData.name,
        phone: formData.phone,
        birthday: formData.birthday || null,
        points: 0,
        total_purchases: 0
      };

      const { error } = await supabase.from('clientes').insert(newCustomer);
      
      if (error) {
        toast.error('Error al crear la clienta');
      } else {
        toast.success('Clienta creada exitosamente');
        
        // Log activity
        const sessionStr = localStorage.getItem('app_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          await supabase.from('activity_logs').insert({
            user_email: session.email,
            action_type: 'CREATE_CUSTOMER',
            description: `Registró a la clienta ${newCustomer.name}`
          });
        }
      }
    } else if (modalMode === 'edit' && formData.id) {
      const { error } = await supabase.from('clientes').update({
        name: formData.name,
        phone: formData.phone,
        birthday: formData.birthday || null
      }).eq('id', formData.id);

      if (error) {
        toast.error('Error al actualizar la clienta');
      } else {
        toast.success('Clienta actualizada exitosamente');
        if (selectedCustomer && selectedCustomer.id === formData.id) {
          setSelectedCustomer({ ...selectedCustomer, ...formData } as Customer);
        }
      }
    }
    
    setModalMode('none');
  };

  const confirmDelete = async () => {
    if (formData.id) {
      const { error } = await supabase.from('clientes').delete().eq('id', formData.id);
      
      if (error) {
        toast.error('Error al eliminar la clienta');
      } else {
        toast.success('Clienta eliminada exitosamente');
        if (selectedCustomer && selectedCustomer.id === formData.id) {
          setSelectedCustomer(null);
        }
      }
    }
    setModalMode('none');
  };

  if (selectedCustomer && modalMode === 'none') {
    const customerSales = getCustomerSales(selectedCustomer.id);
    const totalSpent = getCustomerTotalSpent(selectedCustomer.id);
    const points = getCustomerPoints(selectedCustomer.id);

    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative bg-gray-50">
        <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center space-x-2">
          <button 
            onClick={() => setSelectedCustomer(null)}
            className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Perfil de Clienta</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {/* Header Profile */}
          <div className="bg-white p-6 flex flex-col items-center text-center border-b border-gray-100 relative">
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={() => openEdit(selectedCustomer)}
                className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => openDelete(selectedCustomer)}
                className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl mb-3 mt-2">
              {selectedCustomer.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{selectedCustomer.phone}</p>

            <div className="flex space-x-4 w-full">
              <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <div className="flex items-center justify-center text-amber-500 mb-1">
                  <Star size={18} className="fill-current" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Puntos</p>
                <p className="text-lg font-bold text-gray-900">{points}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <div className="flex items-center justify-center text-primary-500 mb-1">
                  <ShoppingBag size={18} />
                </div>
                <p className="text-xs text-gray-500 font-medium">Compras</p>
                <p className="text-lg font-bold text-gray-900">{customerSales.length}</p>
              </div>
            </div>
          </div>

          {/* Info */}
          {selectedCustomer.birthday && (
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Información Personal</h3>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center space-x-3">
                <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
                  <Gift size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Cumpleaños</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(selectedCustomer.birthday).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Purchase History */}
          <div className="p-4 pt-0">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Historial de Compras</h3>
            <div className="space-y-3">
              {customerSales.length > 0 ? (
                customerSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => (
                  <div key={sale.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">
                          {new Date(sale.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">${sale.total.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-400">{item.quantity}x</span>
                            <span className="text-sm text-gray-700 line-clamp-1">{item.name}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
                  <ShoppingBag size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No hay compras registradas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Directorio de Clientas</h2>
          <button 
            onClick={openAdd}
            className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto pb-24">
        {filteredCustomers.map((customer) => {
          const points = getCustomerPoints(customer.id);
          const salesCount = getCustomerSales(customer.id).length;
          
          return (
            <button 
              key={customer.id} 
              onClick={() => setSelectedCustomer(customer)}
              className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-primary-200 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-2">
                    <span className="flex items-center"><Phone size={12} className="mr-1" /> {customer.phone}</span>
                    {customer.birthday && (
                      <span className="flex items-center text-primary-600"><Gift size={12} className="mr-1" /> {new Date(customer.birthday).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded-lg mb-1">
                  <Star size={12} className="mr-1 fill-current" />
                  <span className="text-xs font-bold">{points} pts</span>
                </div>
                <span className="text-[10px] text-gray-400">{salesCount} compras</span>
              </div>
            </button>
          );
        })}
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <User size={32} />
            </div>
            <p className="text-gray-500 font-medium">No se encontraron clientas</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalMode !== 'none' && (
        <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setModalMode('none')} 
          />
          
          <div className={`bg-white rounded-t-3xl flex flex-col relative animate-in slide-in-from-bottom-full duration-300 overflow-hidden shadow-2xl ${
            modalMode === 'delete' ? 'h-auto' : 'h-[80%]'
          }`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'edit' ? 'Editar Clienta' : 
                 modalMode === 'add' ? 'Nueva Clienta' : 
                 'Eliminar Clienta'}
              </h2>
              <button onClick={() => setModalMode('none')} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 pb-safe">
              {(modalMode === 'edit' || modalMode === 'add') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                      placeholder="Ej. María Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                    <input 
                      type="tel" 
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                      placeholder="Ej. +58 412-0000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha de Nacimiento (Opcional)</label>
                    <input 
                      type="date" 
                      value={formData.birthday || ''}
                      onChange={e => setFormData({...formData, birthday: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                    />
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleSave}
                    className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 transition-colors mt-6"
                  >
                    Guardar Clienta
                  </button>
                </div>
              )}

              {modalMode === 'delete' && formData && (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar clienta?</h3>
                  <p className="text-gray-500 mb-8">
                    Estás a punto de eliminar a <strong>{formData.name}</strong>. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex space-x-3 w-full">
                    <button
                      onClick={() => setModalMode('none')}
                      className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 py-3.5 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
