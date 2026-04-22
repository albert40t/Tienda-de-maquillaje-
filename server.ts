import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import webpush from "web-push";

// VAPID keys should be in environment variables in production
// For now using the ones generated in this session
const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY || "BHvAS8WcZyQ65Ja8V3TDeUT0i3MLcZeec4JsgoH6RK4ZU88qaxkWwsf3fhRact8tEQNvxesWpbVqiuf80nANCDI";
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY || "RoWwOviwAUH8Zqj4EP6DTxJA4oTw7d2OjoY-fyUiclM";

webpush.setVapidDetails(
  "mailto:albertocampos0121@gmail.com",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for images
  app.use(express.json({ limit: '10mb' }));

  // --- NOTIFICATION API ---
  
  app.get("/api/notifications/vapid-public-key", (req, res) => {
    res.json({ publicKey: PUBLIC_VAPID_KEY });
  });

  app.post("/api/notifications/notify-admins", async (req, res) => {
    try {
      const { subscriptions, payload } = req.body;
      
      if (!subscriptions || !Array.isArray(subscriptions)) {
        return res.status(400).json({ error: "No subscriptions provided" });
      }

      const notificationPayload = JSON.stringify({
        title: payload.title || "Nueva Venta",
        body: payload.body || "Se ha realizado una nueva venta en el sistema.",
        icon: payload.icon || "/icon-192.png",
        badge: "/icon-192.png",
        data: payload.data || {}
      });

      const results = await Promise.allSettled(
        subscriptions.map(sub => 
          webpush.sendNotification(sub, notificationPayload)
            .catch(err => {
              if (err.statusCode === 404 || err.statusCode === 410) {
                return { error: "Subscription expired", endpoint: sub.endpoint };
              }
              throw err;
            })
        )
      );

      res.json({ success: true, results });
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      res.status(500).json({ error: error.message });
    }
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
