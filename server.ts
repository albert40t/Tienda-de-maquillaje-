import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for images
  app.use(express.json({ limit: '10mb' }));

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
