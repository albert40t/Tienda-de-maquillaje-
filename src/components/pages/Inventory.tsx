import { Search, Package } from 'lucide-react';
import { Product } from '../../types';

interface InventoryProps {
  onSelectCategory: (category: string) => void;
  products: Product[];
}

export default function Inventory({ onSelectCategory, products }: InventoryProps) {
  const categories = [
    {
      id: 'Maquillaje',
      name: 'Maquillaje',
      image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 'Perfumes',
      name: 'Perfumes',
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 'Joyería',
      name: 'Joyería',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 'Relojes',
      name: 'Relojes',
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 'Ropa',
      name: 'Ropa',
      image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800',
    }
  ];

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Categorías</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar categoría..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 gap-4 overflow-y-auto pb-24">
        {categories.map((category) => {
          const categoryStock = products
            .filter(p => p.category === category.id)
            .reduce((total, p) => total + p.stock, 0);

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="group relative w-full h-48 bg-gray-100 rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-all text-left block"
            >
              <img 
                src={category.image} 
                alt={category.name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white font-bold text-2xl tracking-wide mb-1">{category.name}</h3>
                <div className="flex items-center text-white/90 text-sm font-medium">
                  <Package size={16} className="mr-1.5 opacity-80" />
                  <span>{categoryStock} en stock</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
