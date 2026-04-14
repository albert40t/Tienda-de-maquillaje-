import { Product, Customer, Sale } from '../types';

export const mockProducts: Product[] = [
  // Maquillaje
  {
    id: '1',
    name: 'Base Líquida Matte',
    category: 'Maquillaje',
    brand: 'Maybelline',
    price: 25.99,
    costPrice: 15.00,
    barcode: '750955284123',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1631214500115-598fc2cb8d2d?auto=format&fit=crop&q=80&w=500',
    description: 'Base de alta cobertura con acabado mate duradero.',
    variants: [
      { name: 'Tono 110', stock: 15 },
      { name: 'Tono 120', stock: 20 },
      { name: 'Tono 220', stock: 10 }
    ]
  },
  {
    id: '2',
    name: 'Paleta de Sombras Nude',
    category: 'Maquillaje',
    brand: 'Urban Decay',
    price: 35.50,
    costPrice: 20.00,
    barcode: '360597094211',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1512496115841-345028372221?auto=format&fit=crop&q=80&w=500',
    description: '12 tonos neutros altamente pigmentados.'
  },
  // Perfumes
  {
    id: '3',
    name: 'Eau de Parfum Floral',
    category: 'Perfumes',
    brand: 'Chanel',
    price: 85.00,
    costPrice: 50.00,
    barcode: '314589126520',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=500',
    description: 'Fragancia floral con notas de jazmín y rosa.'
  },
  {
    id: '4',
    name: 'Perfume Cítrico Intenso',
    category: 'Perfumes',
    brand: 'Dior',
    price: 70.00,
    costPrice: 42.00,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=500',
    description: 'Aroma fresco y duradero para el día a día.'
  },
  // Ropa
  {
    id: '5',
    name: 'Blusa de Seda Elegante',
    category: 'Ropa',
    brand: 'Zara',
    price: 45.00,
    costPrice: 22.00,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=500',
    description: 'Blusa de seda suave, ideal para eventos formales.',
    variants: [
      { name: 'S', stock: 10 },
      { name: 'M', stock: 15 },
      { name: 'L', stock: 5 }
    ]
  },
  // Relojes
  {
    id: '6',
    name: 'Reloj Clásico de Cuarzo',
    category: 'Relojes',
    brand: 'Casio',
    price: 120.00,
    costPrice: 75.00,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=500',
    description: 'Reloj elegante con correa de cuero genuino.'
  },
  // Joyería
  {
    id: '7',
    name: 'Collar de Perlas',
    category: 'Joyería',
    brand: 'Tiffany & Co.',
    price: 95.00,
    costPrice: 55.00,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1599643478524-fb66f70d00ea?auto=format&fit=crop&q=80&w=500',
    description: 'Collar clásico de perlas cultivadas.'
  },
  {
    id: '8',
    name: 'Anillos de Oro 18k',
    category: 'Joyería',
    brand: 'Cartier',
    price: 150.00,
    costPrice: 90.00,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b2548e?auto=format&fit=crop&q=80&w=500',
    description: 'Set de anillos minimalistas de oro.'
  }
];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'María González',
    phone: '+58 414-1234567',
    birthday: '1995-05-14',
    points: 150,
    totalPurchases: 3
  },
  {
    id: '2',
    name: 'Ana Pérez',
    phone: '+58 412-9876543',
    birthday: '1988-11-22',
    points: 45,
    totalPurchases: 1
  }
];

export const mockSales: Sale[] = [
  {
    id: 'SALE-001',
    date: new Date().toISOString(),
    items: [
      { ...mockProducts[0], quantity: 1, selectedVariant: 'Tono 120' }
    ],
    total: 25.99,
    discount: 0,
    paymentMethods: [{ method: 'zelle', amount: 25.99 }],
    customerId: '1',
    profit: 10.99
  },
  {
    id: 'SALE-002',
    date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    items: [
      { ...mockProducts[2], quantity: 1 },
      { ...mockProducts[1], quantity: 1 }
    ],
    total: 120.50,
    discount: 0,
    paymentMethods: [{ method: 'pago_movil', amount: 120.50 }],
    customerId: '1',
    profit: 50.50
  },
  {
    id: 'SALE-003',
    date: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    items: [
      { ...mockProducts[3], quantity: 2 }
    ],
    total: 50.00,
    discount: 10,
    paymentMethods: [{ method: 'cash_usd', amount: 45.00 }],
    customerId: '2',
    profit: 20.00
  }
];
