import React, { useState } from 'react';
import { ArrowLeft, Search, MoreVertical, Plus, Minus, PackagePlus, X, Tag, Edit2, Trash2, Save, Image as ImageIcon, Camera, Upload, Link as LinkIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../lib/imageUtils';

interface CategoryInventoryProps {
  category: string;
  onBack: () => void;
  exchangeRate: number;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

type ModalMode = 'none' | 'details' | 'edit' | 'add' | 'stock' | 'delete';

export default function CategoryInventory({ category, onBack, exchangeRate, products, setProducts }: CategoryInventoryProps) {
  const [search, setSearch] = useState('');
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const filteredProducts = products.filter(p => 
    p.category === category && 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openDetails = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('details');
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setModalMode('edit');
    setActiveMenuId(null);
  };

  const openAdd = () => {
    setSelectedProduct(null);
    setFormData({ category, stock: 0, price: 0 });
    setModalMode('add');
    setIsFabOpen(false);
  };

  const openStock = (action: 'add' | 'remove') => {
    setStockAction(action);
    setStockAmount(0);
    // If a product is already selected (e.g. from details), keep it. Otherwise null.
    setSelectedProduct(null); 
    setModalMode('stock');
    setIsFabOpen(false);
  };

  const openDelete = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('delete');
    setActiveMenuId(null);
  };

  const confirmDelete = async () => {
    if (selectedProduct) {
      // Optimistic update
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setModalMode('none');
      
      // Supabase delete
      const { error } = await supabase.from('productos').delete().eq('id', selectedProduct.id);
      
      if (error) {
        console.error("Delete error:", error);
        toast.error('Error al eliminar el producto');
        // Rollback optimistic update
        setProducts(prev => [...prev, selectedProduct]);
      } else {
        toast.success('Producto eliminado exitosamente');
      }
      
      setSelectedProduct(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // 1. Compress the image
      const compressedBlob = await compressImage(file, 1024, 0.8);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
        type: 'image/webp'
      });

      // 2. Upload to Supabase Storage
      const fileName = `${Date.now()}_${compressedFile.name}`;
      const { data, error } = await supabase.storage
        .from('productos')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        alert(`Error de Supabase: ${error.message}`);
        return;
      }

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName);

      // 4. Update form data
      setFormData(prev => ({ ...prev, image: publicUrl }));
    } catch (error: any) {
      console.error('Error compressing/uploading:', error);
      alert(`Error al procesar la imagen: ${error.message || 'Desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      alert('Por favor, completa los campos requeridos (Nombre y Precio).');
      return;
    }

    if (modalMode === 'add') {
      const newProduct: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        category: formData.category || category,
        brand: formData.brand || '',
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        barcode: formData.barcode || '',
        stock: Number(formData.stock) || 0,
        image: formData.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800',
        description: formData.description || '',
      };
      
      // Optimistic update
      setProducts(prev => [...prev, newProduct]);
      
      // Supabase insert
      const { error } = await supabase.from('productos').insert({
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        brand: newProduct.brand,
        price: newProduct.price,
        cost_price: newProduct.costPrice,
        barcode: newProduct.barcode,
        stock: newProduct.stock,
        image: newProduct.image,
        description: newProduct.description
      });
      
      if (error) {
        console.error("Insert error:", error);
        toast.error('Error al crear el producto');
        // Rollback optimistic update
        setProducts(prev => prev.filter(p => p.id !== newProduct.id));
      } else {
        toast.success('Producto creado exitosamente');
      }
      
    } else if (modalMode === 'edit' && selectedProduct) {
      const updatedProduct = { 
        ...selectedProduct, 
        ...formData, 
        price: Number(formData.price), 
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        stock: Number(formData.stock) 
      } as Product;
      
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p));
      
      // Supabase update
      const { error } = await supabase.from('productos').update({
        name: updatedProduct.name,
        category: updatedProduct.category,
        brand: updatedProduct.brand,
        price: updatedProduct.price,
        cost_price: updatedProduct.costPrice,
        barcode: updatedProduct.barcode,
        stock: updatedProduct.stock,
        image: updatedProduct.image,
        description: updatedProduct.description
      }).eq('id', updatedProduct.id);

      if (error) {
        console.error("Update error:", error);
        toast.error('Error al actualizar el producto');
        // Rollback optimistic update
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? selectedProduct : p));
      } else {
        toast.success('Producto actualizado exitosamente');
      }
    }
    
    setModalMode('none');
  };

  const handleSaveStock = async () => {
    if (!selectedProduct || stockAmount <= 0) return;
    
    const newStock = stockAction === 'add' ? selectedProduct.stock + stockAmount : Math.max(0, selectedProduct.stock - stockAmount);
    
    // Optimistic update
    setProducts(prev => prev.map(p => {
      if (p.id === selectedProduct.id) {
        return { ...p, stock: newStock };
      }
      return p;
    }));
    
    // Supabase update
    await supabase.from('productos').update({ stock: newStock }).eq('id', selectedProduct.id);
    
    setModalMode('none');
  };

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative">
      <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-2">
          <button 
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Inventario: {category}</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={`Buscar en ${category.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto pb-32">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => openDetails(product)}
              className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-gray-50" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-1">{product.brand || product.category}</p>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  <span className="text-xs font-medium text-gray-500">Bs. {(product.price * exchangeRate).toFixed(2)}</span>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    product.stock > 20 ? 'bg-green-50 text-green-600' : 
                    product.stock > 0 ? 'bg-orange-50 text-orange-600' : 
                    'bg-red-50 text-red-600'
                  }`}>
                    {product.stock} en stock
                  </span>
                </div>
              </div>
              <div className="relative">
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === product.id ? null : product.id);
                  }}
                >
                  <MoreVertical size={18} />
                </button>
                
                {activeMenuId === product.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        onClick={(e) => { e.stopPropagation(); openEdit(product); }}
                      >
                        <Edit2 size={16} />
                        <span>Editar</span>
                      </button>
                      <button 
                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-50"
                        onClick={(e) => { e.stopPropagation(); openDelete(product); }}
                      >
                        <Trash2 size={16} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No hay productos en esta categoría.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end z-30">
        {isFabOpen && (
          <div className="flex flex-col items-end space-y-3 mb-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
            <button 
              className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              onClick={openAdd}
            >
              <span className="text-sm font-semibold text-gray-700">Nuevo Producto</span>
              <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                <PackagePlus size={18} />
              </div>
            </button>
            <button 
              className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              onClick={() => openStock('remove')}
            >
              <span className="text-sm font-semibold text-gray-700">Retirar Stock</span>
              <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                <Minus size={18} />
              </div>
            </button>
            <button 
              className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              onClick={() => openStock('add')}
            >
              <span className="text-sm font-semibold text-gray-700">Ingresar Stock</span>
              <div className="bg-green-100 text-green-600 p-2 rounded-full">
                <Plus size={18} />
              </div>
            </button>
          </div>
        )}

        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`bg-primary-600 text-white p-4 rounded-full shadow-xl hover:bg-primary-700 transition-all duration-300 ${
            isFabOpen ? 'rotate-45 bg-gray-800 hover:bg-gray-900' : ''
          }`}
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Backdrop when FAB is open */}
      {isFabOpen && (
        <div 
          className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 animate-in fade-in duration-200"
          onClick={() => setIsFabOpen(false)}
        />
      )}

      {/* Modals */}
      {modalMode !== 'none' && (
        <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setModalMode('none')} 
          />
          
          <div className={`bg-white rounded-t-3xl flex flex-col relative animate-in slide-in-from-bottom-full duration-300 overflow-hidden shadow-2xl ${
            modalMode === 'details' ? 'h-[85%]' : 
            modalMode === 'delete' ? 'h-auto' : 'h-[90%]'
          }`}>
            
            {/* Modal Header/Image */}
            {modalMode === 'details' && selectedProduct ? (
              <div className="relative h-56 sm:h-64 bg-gray-100 shrink-0">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />
                <button 
                  onClick={() => setModalMode('none')} 
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold mb-2 inline-block shadow-sm">
                    {selectedProduct.brand || 'Marca Genérica'}
                  </span>
                  <h2 className="text-3xl font-serif font-bold text-white leading-tight drop-shadow-md">{selectedProduct.name}</h2>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                  {modalMode === 'edit' ? 'Editar Producto' : 
                   modalMode === 'add' ? 'Nuevo Producto' : 
                   modalMode === 'delete' ? 'Eliminar Producto' :
                   stockAction === 'add' ? 'Ingresar Stock' : 'Retirar Stock'}
                </h2>
                <button onClick={() => setModalMode('none')} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
                  <X size={20} />
                </button>
              </div>
            )}
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 pb-safe">
              
              {/* DETAILS MODE */}
              {modalMode === 'details' && selectedProduct && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Tag size={12} className="mr-1" /> {selectedProduct.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedProduct.stock > 20 ? 'bg-green-50 text-green-600' : 
                      selectedProduct.stock > 0 ? 'bg-orange-50 text-orange-600' : 
                      'bg-red-50 text-red-600'
                    }`}>
                      {selectedProduct.stock} en stock
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 p-4 rounded-2xl border border-primary-100/50">
                    <h3 className="text-xs font-bold text-primary-600/80 uppercase tracking-wider mb-1">Precio de Venta</h3>
                    <div className="flex items-end space-x-3">
                      <span className="text-3xl font-bold text-primary-900">${selectedProduct.price.toFixed(2)}</span>
                      <span className="text-base font-medium text-primary-700/70 mb-1">Bs. {(selectedProduct.price * exchangeRate).toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-2"></span>
                      Descripción del Producto
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-2xl">
                      {selectedProduct.description || 'No hay descripción disponible para este producto. Puedes agregar una editando el producto.'}
                    </p>
                  </div>
                </div>
              )}

              {/* EDIT / ADD MODE */}
              {(modalMode === 'edit' || modalMode === 'add') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre del Producto</label>
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                      placeholder="Ej. Base Líquida Matte"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Marca</label>
                      <input 
                        type="text" 
                        value={formData.brand || ''}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                        placeholder="Ej. Maybelline"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Categoría</label>
                      <input 
                        type="text" 
                        value={formData.category || ''}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Precio Venta ($)</label>
                      <input 
                        type="number" 
                        value={formData.price || ''}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Costo ($)</label>
                      <input 
                        type="number" 
                        value={formData.costPrice || ''}
                        onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock Inicial</label>
                      <input 
                        type="number" 
                        value={formData.stock || ''}
                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                        placeholder="0"
                        disabled={modalMode === 'edit'} // Don't edit stock directly here, use stock action
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Código de Barras</label>
                      <input 
                        type="text" 
                        value={formData.barcode || ''}
                        onChange={e => setFormData({...formData, barcode: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Imagen del Producto</label>
                    
                    {formData.image && (
                      <div className="mb-3 relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, image: ''})}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    {isUploading && (
                      <div className="mb-3 flex items-center justify-center p-4 bg-primary-50 text-primary-600 rounded-xl border border-primary-100">
                        <Loader2 size={20} className="animate-spin mr-2" />
                        <span className="text-sm font-medium">Optimizando y subiendo imagen...</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <label className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <Camera size={20} className="text-gray-500 mb-1.5" />
                        <span className="text-[10px] font-medium text-gray-600">Cámara</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                      </label>
                      
                      <label className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <Upload size={20} className="text-gray-500 mb-1.5" />
                        <span className="text-[10px] font-medium text-gray-600">Galería</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>

                      <button 
                        type="button"
                        onClick={() => {
                          const url = prompt('Ingresa la URL de la imagen:');
                          if (url) setFormData({...formData, image: url});
                        }}
                        className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <LinkIcon size={20} className="text-gray-500 mb-1.5" />
                        <span className="text-[10px] font-medium text-gray-600">URL</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
                    <textarea 
                      value={formData.description || ''}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none min-h-[100px]"
                      placeholder="Detalles del producto..."
                    />
                  </div>
                </div>
              )}

              {/* DELETE MODE */}
              {modalMode === 'delete' && selectedProduct && (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar producto?</h3>
                  <p className="text-gray-500 mb-8">
                    Estás a punto de eliminar <strong>{selectedProduct.name}</strong>. Esta acción no se puede deshacer.
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

              {/* STOCK MODE */}
              {modalMode === 'stock' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Seleccionar Producto</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                      value={selectedProduct?.id || ''}
                      onChange={(e) => setSelectedProduct(filteredProducts.find(p => p.id === e.target.value) || null)}
                    >
                      <option value="" disabled>Elige un producto...</option>
                      {filteredProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock actual: {p.stock})</option>
                      ))}
                    </select>
                  </div>

                  {selectedProduct && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Cantidad a {stockAction === 'add' ? 'Ingresar' : 'Retirar'}
                      </label>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => setStockAmount(Math.max(0, stockAmount - 1))}
                          className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                        >
                          <Minus size={20} />
                        </button>
                        <input 
                          type="number" 
                          value={stockAmount}
                          onChange={(e) => setStockAmount(Math.max(0, Number(e.target.value)))}
                          className="flex-1 text-center text-2xl font-bold bg-transparent outline-none"
                        />
                        <button 
                          onClick={() => setStockAmount(stockAmount + 1)}
                          className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
            
            {/* Action Buttons for Forms */}
            {(modalMode === 'edit' || modalMode === 'add') && (
              <div className="p-4 bg-white border-t border-gray-100 pb-safe">
                <button 
                  className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:bg-primary-700 transition-colors flex items-center justify-center"
                  onClick={handleSaveProduct}
                >
                  <Save size={18} className="mr-2" />
                  Guardar Producto
                </button>
              </div>
            )}

            {modalMode === 'stock' && (
              <div className="p-4 bg-white border-t border-gray-100 pb-safe">
                <button 
                  disabled={!selectedProduct || stockAmount <= 0}
                  className={`w-full font-semibold py-3.5 rounded-2xl shadow-sm transition-colors flex items-center justify-center ${
                    !selectedProduct || stockAmount <= 0 
                      ? 'bg-gray-200 text-gray-400' 
                      : stockAction === 'add' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                  onClick={handleSaveStock}
                >
                  {stockAction === 'add' ? <Plus size={18} className="mr-2" /> : <Minus size={18} className="mr-2" />}
                  Confirmar {stockAction === 'add' ? 'Ingreso' : 'Retiro'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
