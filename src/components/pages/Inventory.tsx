import { useState, useEffect } from 'react';
import { Search, Package, MoreVertical, Edit2, X, Camera, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../lib/imageUtils';

interface Category {
  id: string;
  name: string;
  image: string;
}

const DEFAULT_CATEGORIES: Category[] = [
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

interface InventoryProps {
  onSelectCategory: (category: string) => void;
  products: Product[];
}

export default function Inventory({ onSelectCategory, products }: InventoryProps) {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('app_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_categories', JSON.stringify(categories));
  }, [categories]);

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData(category);
    setActiveMenuId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const compressedBlob = await compressImage(file, 800, 0.8);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
        type: 'image/webp'
      });

      const fileName = `cat_${Date.now()}_${compressedFile.name}`;
      const { error } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        toast.error(`Error de Supabase: ${error.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image: publicUrl }));
      toast.success('Imagen subida exitosamente');
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error(`Error: ${error.message || 'Desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !formData.name) return;

    setCategories(prev => prev.map(c => {
      if (c.id === editingCategory.id) {
        // Only updates the name and image. If ID needs to change, it's more complex, 
        // so we'll just update display name and image to avoid breaking product relations.
        return { ...c, name: formData.name!, image: formData.image || c.image };
      }
      return c;
    }));

    toast.success('Categoría actualizada exitosamente');
    setEditingCategory(null);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300 relative">
      {/* Edit Modal */}
      {editingCategory && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCategory(null)} />
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Editar Categoría</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Imagen de Portada</label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200">
                    {formData.image && <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center w-full bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      {isUploading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Camera size={18} className="mr-2" />}
                      <span>{isUploading ? 'Subiendo...' : 'Cambiar Imagen'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUploading || !formData.name}
                  className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div key={category.id} className="relative group">
              <button
                onClick={() => onSelectCategory(category.id)}
                className="w-full h-48 bg-gray-100 rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-all text-left block relative"
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

              {/* Three dots menu */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === category.id ? null : category.id);
                  }}
                  className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
                >
                  <MoreVertical size={20} />
                </button>

                {activeMenuId === category.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setActiveMenuId(null)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1 animate-in zoom-in-95 duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(category);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium"
                      >
                        <Edit2 size={16} className="text-gray-400" />
                        <span>Editar Categoría</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
