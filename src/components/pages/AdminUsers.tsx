import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
      <div className="space-y-3">
        {users.map((user, index) => (
          <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {user.role === 'admin' ? 'Administrador' : 'Trabajador'}
              </span>
            </div>
            {user.email !== 'admin@tienda.com' && (
              <button 
                onClick={() => handleDeleteUser(user.email)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
