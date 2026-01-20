import { Router } from "express";
import * as db from "../db.js";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId)) {
      return res.status(400).send("ID de imagem inválido");
    }

    // Buscar imagem usando SQL puro para evitar erros de compatibilidade do Drizzle no Vercel
    const pool = db.getPool();
    const [rows] = await pool.execute("SELECT imageUrl FROM generated_images WHERE id = ? LIMIT 1", [imageId]);
    const imageData = (rows as any[])[0];
    
    if (!imageData || !imageData.imageUrl) {
      return res.status(404).send("Imagem não encontrada");
    }

    const imageUrl = imageData.imageUrl;

    if (imageUrl.startsWith("data:image/")) {
      // Extrair o base64
      const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).send("Formato de imagem inválido");
      }

      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000");
      return res.send(buffer);
    } else {
      // Se for uma URL externa (S3), redirecionar
      return res.redirect(imageUrl);
    }
  } catch (error) {
    console.error("[Image View Error]", error);
    res.status(500).send("Erro interno ao processar imagem");
  }
});

export { router as imageViewRouter };
