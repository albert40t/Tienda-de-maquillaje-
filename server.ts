import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import webpush from "web-push";

// OneSignal configuration
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for images
  app.use(express.json({ limit: '10mb' }));

  // --- NOTIFICATION API (OneSignal) ---
  
  app.post("/api/notifications/notify-admins", async (req, res) => {
    try {
      const { payload } = req.body;
      
      if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
        console.error("OneSignal keys are missing in environment variables");
        return res.status(500).json({ error: "Configuración de notificaciones incompleta en el servidor" });
      }

      // We send to all subscribed users (admins) 
      // Targeted notifications would use 'include_external_user_ids' or 'include_player_ids'
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          included_segments: ["Total Subscriptions"], // Or "Admins" if segments are set
          contents: { 
            en: payload.body || "Se ha realizado una nueva venta.",
            es: payload.body || "Se ha realizado una nueva venta."
          },
          headings: {
            en: payload.title || "Nueva Venta",
            es: payload.title || "Nueva Venta"
          },
          data: payload.data || {}
        })
      });

      const result = await response.json();
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("Error sending OneSignal notifications:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Keep compatibility for public key endpoint although not used by OneSignal
  app.get("/api/notifications/vapid-public-key", (req, res) => {
    res.json({ publicKey: "ONESIGNAL_MODE" });
  });

  // API to save branding assets
  app.post("/api/branding/icons", (req, res) => {
    try {
      const { icon192, icon512, appleTouch, favicon } = req.body;
      const publicPath = path.join(process.cwd(), 'public');

      if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath);
      }

      const saveImage = (filename: string, base64Data: string) => {
        if (!base64Data) return;
        const base64Image = base64Data.split(';base64,').pop();
        if (base64Image) {
          fs.writeFileSync(path.join(publicPath, filename), base64Image, { encoding: 'base64' });
        }
      };

      saveImage('icon-192.png', icon192);
      saveImage('icon-512.png', icon512);
      saveImage('apple-touch-icon.png', appleTouch);
      saveImage('favicon.ico', favicon);

      res.json({ success: true, message: "Iconos actualizados correctamente." });
    } catch (error) {
      console.error("Error saving icons:", error);
      res.status(500).json({ success: false, error: "Error al guardar los iconos." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
