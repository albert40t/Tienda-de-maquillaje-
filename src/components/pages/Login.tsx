import React from 'react';

interface LoginProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  authError: string;
  onAuth: (e: React.FormEvent) => void;
  isLoading: boolean;
  businessName: string;
}

export default function Login({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  authError, 
  onAuth, 
  isLoading,
  businessName
}: LoginProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50 items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-primary-800 mb-2">{businessName}</h1>
          <p className="text-gray-500 text-sm">Ingresa para gestionar tu tienda</p>
        </div>

        {authError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
            {authError}
          </div>
        )}

        <form onSubmit={onAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 mt-6"
          >
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
