import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { ArrowLeft, Edit2, Package, Tag, Layers, Link as LinkIcon, DollarSign, Archive, Image as ImageIcon, Minus, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatUSD, formatBs } from '../../lib/formatUtils';

interface ProductDetailsProps {
  product: Product;
  exchangeRate: number;
  onBack: () => void;
  onEdit?: () => void;
  userRole?: string;
  isCustomer?: boolean;
  onAddToCart?: (quantity: number) => void;
}

export default function ProductDetails({ product, exchangeRate, onBack, onEdit, userRole, isCustomer = false, onAddToCart }: ProductDetailsProps) {
  const normalizedRole = userRole?.toLowerCase().trim();
  const isSalesperson = normalizedRole === 'vendedor' || normalizedRole === 'salesperson' || normalizedRole === 'worker';
  
  const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className={`flex flex-col bg-gray-50 z-50 ${isCustomer ? 'h-full animate-in slide-in-from-right-8 fade-in duration-300' : 'h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative'}`}>
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900 truncate">Detalles del Producto</h2>
        </div>
        {!isSalesperson && !isCustomer && onEdit && (
          <button 
            onClick={onEdit}
            className="p-2 -mr-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
          >
            <Edit2 size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-safe">
        {/* Product Image Header */}
        <div className="relative w-full aspect-square max-h-[400px] bg-gray-100 flex flex-col items-center justify-center overflow-hidden border-b border-gray-200">
          {images.length > 0 ? (
            <img 
              src={images[currentImageIndex]} 
              alt={product.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <ImageIcon size={64} className="mb-2 opacity-50" />
              <span className="text-sm font-medium">Sin imagen</span>
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex space-x-2">
            {!isCustomer && (
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                product.stock > 10 ? 'bg-green-500/90 text-white' : 
                product.stock > 0 ? 'bg-orange-500/90 text-white' : 'bg-red-500/90 text-white'
              }`}>
                {product.stock} en stock
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="bg-white px-4 py-3 border-b border-gray-100 flex space-x-2 overflow-x-auto hide-scrollbar">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-primary-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Product Info Content */}
        <div className="p-5 space-y-6 bg-white shrink-0">
          <div>
            <div className="flex items-center space-x-2 text-xs font-medium text-primary-600 mb-2">
              <Tag size={12} />
              <span>{product.category}</span>
              {product.brand && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">{product.brand}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {product.description}
              </p>
            )}
            {isCustomer && (
              <div className="flex items-end space-x-2 mt-4">
                <span className="text-3xl font-black text-gray-900">${product.price.toFixed(2)}</span>
                {product.price < 10 && (
                  <span className="text-lg text-gray-400 line-through mb-1">${(product.price * 1.2).toFixed(2)}</span>
                )}
              </div>
            )}
          </div>

          {!isCustomer && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Precio Unitario</p>
                <p className="text-xl font-bold text-primary-600">${formatUSD(product.price)}</p>
                <p className="text-xs font-medium text-gray-400">Bs. {formatBs(product.price * exchangeRate)}</p>
              </div>
              {!isSalesperson && product.costPrice && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Costo Neto</p>
                  <p className="text-xl font-bold text-gray-900">${formatUSD(product.costPrice)}</p>
                  <p className="text-xs font-medium text-gray-400">Bs. {formatBs(product.costPrice * exchangeRate)}</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-gray-100">
            {product.variants && product.variants.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Tonos/Variantes Disponibles</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, i) => (
                    <div key={i} className="px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-700 bg-gray-50 flex items-center shadow-sm">
                      {v.name}
                      <span className="ml-2 text-primary-500 font-bold">{v.stock}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <Layers size={16} className="mr-2 text-gray-400" />
              Características Adicionales
            </h3>
            
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {/* Product Code */}
              {!isCustomer && (
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-sm text-gray-500">Código interno</span>
                  <span className="text-sm font-medium text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {product.id.slice(0,8).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Gender */}
              <div className="flex items-center justify-between p-3.5">
                <span className="text-sm text-gray-500">Género</span>
                <span className="text-sm font-medium text-gray-900">
                  {product.gender || 'Unisex'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isCustomer && onAddToCart && (
        <div className="p-6 bg-white border-t border-gray-100 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl relative z-20">
          <div className="flex justify-between items-center space-x-4">
            {product.stock > 0 && (
              <div className="flex items-center bg-gray-100 rounded-full h-14 px-2 shrink-0">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-white rounded-full transition-colors"
                >
                  <Minus size={20} />
                </button>
                <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 flex items-center justify-center disabled:opacity-50 text-gray-700 hover:bg-white rounded-full transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
            <button 
              disabled={product.stock === 0}
              onClick={() => onAddToCart(quantity)}
              className="flex-1 h-14 bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full font-bold text-lg hover:bg-gray-900 transition-colors flex items-center justify-center shadow-lg shadow-black/10"
            >
              <Package size={20} className="mr-2" />
              {product.stock === 0 ? 'Agotado' : 'Agregar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
