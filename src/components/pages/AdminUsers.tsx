import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, MoreVertical, Edit2, X, Lock, Mail, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface AdminUsersProps {
  onBack: () => void;
}

export default function AdminUsers({ onBack }: AdminUsersProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('worker');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeMenuEmail, setActiveMenuEmail] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ email: '', password: '', role: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err: any) {
      setError('Error al cargar usuarios. Asegúrate de haber creado la tabla "empleados" en Supabase.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newEmail || !newPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('empleados')
        .select('email')
        .eq('email', newEmail)
        .single();

      if (existing) {
        setError('Este correo ya está registrado');
        return;
      }

      // Insertar nuevo usuario
      const { error: insertError } = await supabase
        .from('empleados')
        .insert([{ email: newEmail, password: newPassword, role: newRole }]);

      if (insertError) throw insertError;

      setSuccess('Usuario creado exitosamente');
      setNewEmail('');
      setNewPassword('');
      loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al crear usuario: ' + err.message);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('empleados')
        .update({ 
          email: editFormData.email, 
          password: editFormData.password,
          role: editFormData.role 
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('Usuario actualizado correctamente');
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message);
    }
  };

  const handleDeleteUser = async (emailToDelete: string) => {
    if (emailToDelete === 'admin@tienda.com') {
      alert('No puedes eliminar al administrador principal');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar al usuario ${emailToDelete}?`)) {
      try {
        const { error } = await supabase
          .from('empleados')
          .delete()
          .eq('email', emailToDelete);

        if (error) throw error;
        
        loadUsers();
      } catch (err: any) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">Crear Nuevo Usuario</h3>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-4">{success}</div>}

        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 outline-none"
              placeholder="trabajador@tienda.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contraseña</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 outline-none"
              placeholder="Contraseña segura"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rol</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 outline-none"
            >
              <option value="worker">Trabajador (Ventas)</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-1" />
            Crear Usuario
          </button>
        </form>
      </div>

      <h3 className="font-bold text-gray-800 mb-3 px-1">Usuarios Registrados</h3>
      <div className="space-y-3 pb-24">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group relative">
            <div>
              <p className="font-bold text-gray-900">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {user.role === 'admin' ? 'Administrador' : 'Trabajador'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">ID: {user.id.substring(0, 5)}</span>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setActiveMenuEmail(activeMenuEmail === user.email ? null : user.email)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {activeMenuEmail === user.email && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenuEmail(null)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden py-1 animate-in zoom-in-95 duration-200">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setEditFormData({ email: user.email, password: user.password, role: user.role });
                        setActiveMenuEmail(null);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Edit2 size={16} className="text-blue-500" />
                      <span className="font-medium">Editar Usuario</span>
                    </button>
                    {user.email !== 'admin@tienda.com' && (
                      <button
                        onClick={() => {
                          handleDeleteUser(user.email);
                          setActiveMenuEmail(null);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-50"
                      >
                        <Trash2 size={16} />
                        <span className="font-medium">Eliminar Usuario</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setEditingUser(null)} />
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary-500" />
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900">Editar Perfil</h3>
              <button 
                onClick={() => setEditingUser(null)} 
                className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      disabled={editingUser.email === 'admin@tienda.com'}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-300 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-300 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Rol de Usuario</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      disabled={editingUser.email === 'admin@tienda.com'}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-300 outline-none transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="worker">Trabajador (Ventas)</option>
                      <option value="admin">Administrador Full</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Confirmar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
