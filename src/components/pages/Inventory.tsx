import React, { useState, useEffect } from 'react';
import { Search, Package, MoreVertical, Edit2, X, Camera, Loader2, Plus, Trash2, RefreshCcw, FileDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product, Category, BusinessInfo } from '../../types';
import { supabase } from '../../lib/supabase';
import { offlineManager } from '../../lib/offlineManager';
import { generateCatalogPDF } from '../../lib/pdfGenerator';
import { compressImage } from '../../lib/imageUtils';

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
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  isOnline: boolean;
  businessInfo: BusinessInfo;
}

export default function Inventory({ onSelectCategory, products, categories, setCategories, isOnline, businessInfo }: InventoryProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [isUploading, setIsUploading] = useState(false);

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData(category);
    setIsCreating(false);
    setActiveMenuId(null);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditingCategory({ id: '', name: '', image: 'https://images.unsplash.com/photo-1512438248448-99d87593da18?auto=format&fit=crop&q=80&w=800' });
    setFormData({ name: '', image: 'https://images.unsplash.com/photo-1512438248448-99d87593da18?auto=format&fit=crop&q=80&w=800' });
    setActiveMenuId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOnline) {
      toast.error('La subida de imágenes requiere conexión a internet');
      return;
    }

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
        .from('productos')
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
        .from('productos')
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

  const handleSaveCategory = async () => {
    if (!formData.name) return;

    const categoryId = isCreating ? formData.name.trim().replace(/\s+/g, '-') : (editingCategory?.id || '');
    
    const categoryData = { 
      id: categoryId,
      name: formData.name.trim(), 
      image: formData.image || 'https://images.unsplash.com/photo-1512438248448-99d87593da18?auto=format&fit=crop&q=80&w=800'
    };

    // Optimistic update
    if (isCreating) {
      setCategories(prev => [...prev, categoryData]);
    } else {
      setCategories(prev => prev.map(c => c.id === categoryId ? categoryData : c));
    }
    
    setEditingCategory(null);
    setIsCreating(false);

    // Supabase update/upsert with offline support
    if (isOnline) {
      try {
        const { error } = await supabase
          .from('categorias')
          .upsert(categoryData);
        if (error) throw error;
        toast.success(`Categoría ${isCreating ? 'creada' : 'actualizada'} exitosamente`);
      } catch (error) {
        console.error('Error saving category online, queueing...', error);
        offlineManager.addAction('UPSERT_CATEGORY', categoryData);
      }
    } else {
      offlineManager.addAction('UPSERT_CATEGORY', categoryData);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    // Compare by name/id case-insensitively
    const hasProducts = products.some(p => 
      p.category.trim().toLowerCase() === category.id.trim().toLowerCase() ||
      p.category.trim().toLowerCase() === category.name.trim().toLowerCase()
    );
    
    if (hasProducts) {
      toast.error('No se puede eliminar una categoría con productos asociados');
      setActiveMenuId(null);
      return;
    }

    if (!window.confirm(`¿Estás segura de que deseas eliminar la categoría "${category.name}"?`)) {
      setActiveMenuId(null);
      return;
    }

    // Optimistic update
    setCategories(prev => prev.filter(c => c.id !== category.id));
    setActiveMenuId(null);

    if (isOnline) {
      try {
        const { error } = await supabase
          .from('categorias')
          .delete()
          .eq('id', category.id);
        if (error) throw error;
        toast.success('Categoría eliminada');
      } catch (error) {
        console.error('Error deleting category online, queueing...', error);
        offlineManager.addAction('DELETE_CATEGORY', { id: category.id });
      }
    } else {
      offlineManager.addAction('DELETE_CATEGORY', { id: category.id });
    }
  };

  const handleExportPDF = async () => {
    if (products.length === 0) {
      toast.error('No hay productos para exportar');
      return;
    }
    
    const id = toast.loading('Generando catálogo PDF...');
    try {
      await generateCatalogPDF(products, businessInfo);
      toast.success('Catálogo generado con éxito', { id });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF', { id });
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300 relative">
      {/* Edit/Create Modal */}
      {editingCategory && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCategory(null)} />
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {isCreating ? 'Nueva Categoría' : 'Editar Categoría'}
            </h3>
            
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
                  placeholder="Ej: Accesorios"
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
                  onClick={handleSaveCategory}
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

      <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Categorías</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => window.location.reload()}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCcw size={18} />
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center space-x-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
              title="Exportar Catálogo PDF"
            >
              <FileDown size={16} className="text-primary-600" />
              <span>Catálogo</span>
            </button>
            <button 
              onClick={openCreate}
              className="flex items-center space-x-1.5 bg-primary-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-primary-700 transition-all active:scale-95 shadow-md shadow-primary-200"
            >
              <Plus size={16} />
              <span>Añadir</span>
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar categoría..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 gap-4 overflow-y-auto pb-24">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <Package size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="font-medium text-gray-400">No hay categorías registradas.</p>
            <button 
              onClick={openCreate}
              className="mt-4 text-primary-600 font-bold text-sm hover:underline"
            >
              Crea la primera ahora
            </button>
          </div>
        ) : (
          categories.map((category) => {
            const categoryStock = products
              .filter(p => 
                p.category.trim().toLowerCase() === category.id.trim().toLowerCase() ||
                p.category.trim().toLowerCase() === category.name.trim().toLowerCase()
              )
              .reduce((total, p) => total + p.stock, 0);

            return (
              <div key={category.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className="w-full h-48 bg-gray-100 rounded-3xl overflow-hidden shadow-md border border-white hover:shadow-xl transition-all text-left block relative group"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                    <h3 className="text-white font-bold text-2xl tracking-wide mb-1 drop-shadow-sm">{category.name}</h3>
                    <div className="flex items-center text-white/90 text-sm font-medium bg-black/20 self-start px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <Package size={14} className="mr-1.5 opacity-80" />
                      <span>{categoryStock} en stock</span>
                    </div>
                  </div>
                </button>

                {/* Three dots menu */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === category.id ? null : category.id);
                    }}
                    className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all hover:scale-110 active:scale-90"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {activeMenuId === category.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-1.5 animate-in zoom-in-95 duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(category);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left font-semibold"
                        >
                          <Edit2 size={16} className="text-primary-500" />
                          <span>Editar</span>
                        </button>
                        <div className="h-px bg-gray-100 mx-2" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                        >
                          <Trash2 size={16} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
