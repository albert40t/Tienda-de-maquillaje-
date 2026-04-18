import { useEffect } from 'react';
import { BusinessInfo } from '../types';

interface PWAManagerProps {
  businessInfo: BusinessInfo;
}

export default function PWAManager({ businessInfo }: PWAManagerProps) {
  useEffect(() => {
    if (!businessInfo) return;

    const pwaConfig = businessInfo.paymentConfig?.branding;
    const themeColor = "#D4AF37"; // Custom or from businessInfo
    
    // 1. Update Manifest
    const manifest = {
      name: businessInfo.name || "Stefy Beauty POS",
      short_name: businessInfo.name?.split(' ')[0] || "Stefy",
      description: businessInfo.address || "Sistema de Punto de Venta",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: themeColor,
      icons: pwaConfig ? [
        {
          src: pwaConfig.icon192,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: pwaConfig.icon512,
          sizes: "512x512",
          type: "image/png"
        }
      ] : [
        // Fallback or current icons
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    };

    // Update document title
    if (businessInfo.name) {
      document.title = businessInfo.name;
    }

    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: 'application/manifest+json'});
    const manifestURL = URL.createObjectURL(blob);
    
    const link = document.querySelector('link[rel="manifest"]') || document.createElement('link');
    link.setAttribute('rel', 'manifest');
    link.setAttribute('href', manifestURL);
    if (!document.querySelector('link[rel="manifest"]')) {
      document.head.appendChild(link);
    }

    // 2. Update Apple Touch Icon
    if (pwaConfig?.appleTouch) {
      const appleLink = document.querySelector('link[rel="apple-touch-icon"]') || document.createElement('link');
      appleLink.setAttribute('rel', 'apple-touch-icon');
      appleLink.setAttribute('href', pwaConfig.appleTouch);
      if (!document.querySelector('link[rel="apple-touch-icon"]')) {
        document.head.appendChild(appleLink);
      }
    }

    // 3. Update Favicon
    if (pwaConfig?.favicon) {
      const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement('link');
      faviconLink.setAttribute('rel', 'icon');
      faviconLink.setAttribute('href', pwaConfig.favicon);
      if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(faviconLink);
      }
    }

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, [businessInfo]);

  return null;
}
