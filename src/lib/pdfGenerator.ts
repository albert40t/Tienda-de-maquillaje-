import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Product, BusinessInfo } from '../types';
import { formatUSD } from './formatUtils';

export async function generateCatalogPDF(products: Product[], businessInfo: BusinessInfo) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const primaryColor = [200, 121, 121]; // #c87979 from theme
  const textColor = [44, 42, 41]; // #2C2A29 from theme

  // --- Utility: Load Image as Base64 ---
  const getImageData = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Error loading image for PDF:', e);
      return null;
    }
  };

  // --- Header ---
  doc.setFillColor(253, 248, 247); // primary-50
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Logo placeholder or actual
  const logoData = businessInfo.logo ? await getImageData(businessInfo.logo) : null;
  let textStartX = margin;

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 10, 30, 30, undefined, 'FAST');
      textStartX = margin + 35;
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.text(businessInfo.name || 'Catálogo de Productos', textStartX, 25);
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(9);
  doc.setFont('inter', 'normal');
  doc.text(businessInfo.address || '', textStartX, 33);
  doc.text(businessInfo.phone || '', textStartX, 38);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - margin, 15, { align: 'right' });
  doc.text('CATÁLOGO DE PRODUCTOS', pageWidth - margin, 20, { align: 'right' }); 

  // Divider
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, 42, pageWidth - margin, 42);

  let currentY = 60;
  const colWidth = (pageWidth - (margin * 3)) / 2;
  const rowHeight = 85;

  // Sort products by category
  const categories = Array.from(new Set(products.map(p => p.category)));
  
  for (const category of categories) {
    const catProducts = products.filter(p => p.category === category);
    
    // Category Header
    if (currentY + 20 > pageHeight - margin) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, currentY, colWidth * 0.5, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(category.toUpperCase(), margin + 3, currentY + 5.5);
    
    currentY += 15;

    // Grid Layout (2 per row)
    for (let i = 0; i < catProducts.length; i += 2) {
      if (currentY + rowHeight > pageHeight - margin) {
        doc.addPage();
        currentY = 20;
      }

      const pair = [catProducts[i], catProducts[i + 1]];
      
      for (let j = 0; j < pair.length; j++) {
        const product = pair[j];
        if (!product) continue;
        
        const x = margin + (j * (colWidth + margin));
        
        // Card Border/Shadow effect (subtle)
        doc.setDrawColor(240, 240, 240);
        doc.setFillColor(252, 252, 252);
        doc.roundedRect(x, currentY, colWidth, rowHeight - 10, 5, 5, 'FD');

        // Image Placeholder/Actual
        const imgData = await getImageData(product.image);
        if (imgData) {
          try {
            // Add a light background for images that might have transparency or white edges
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(x + 5, currentY + 5, colWidth - 10, 45, 3, 3, 'F');
            doc.addImage(imgData, 'WEBP', x + 5, currentY + 5, colWidth - 10, 45, undefined, 'FAST');
          } catch (e) {
            // Fallback for non-webp or compression issues
            try {
              doc.addImage(imgData, 'JPEG', x + 5, currentY + 5, colWidth - 10, 45, undefined, 'FAST');
            } catch (e2) {}
          }
        }

        // Product Info
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(9);
        doc.setFont('inter', 'bold');
        const titleLines = doc.splitTextToSize(product.name, colWidth - 10);
        doc.text(titleLines.slice(0, 2), x + 5, currentY + 58);
        
        // Brand & Gender
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.setFont('inter', 'normal');
        let infoLine = product.brand || '';
        if (product.gender) {
          infoLine += (infoLine ? ' • ' : '') + product.gender;
        }
        doc.text(infoLine, x + 5, currentY + 63);

        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(12);
        doc.text(`$${formatUSD(product.price)}`, x + 5, currentY + 72);
      }
      
      currentY += rowHeight;
    }
    
    currentY += 10;
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount} | Generado por ${businessInfo.name}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`Catalogo_${businessInfo.name || 'Tienda'}_${new Date().toISOString().split('T')[0]}.pdf`);
}
