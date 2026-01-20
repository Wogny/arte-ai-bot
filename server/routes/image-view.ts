import { Router } from "express";
import * as db from "../db.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId)) {
      return res.status(400).send("ID de imagem inválido");
    }

    // Buscar imagem no banco (usando uma query direta para ser mais rápido)
    const dbInstance = await db.getDb();
    if (!dbInstance) return res.status(500).send("Erro ao conectar ao banco");

    const image = await db.getImageById(imageId, 1); // Temporariamente usando ID 1 ou buscando do contexto se possível
    // Nota: Em produção, idealmente verificaríamos a sessão do usuário aqui
    
    if (!image || !image.imageUrl) {
      return res.status(404).send("Imagem não encontrada");
    }

    if (image.imageUrl.startsWith("data:image/")) {
      // Extrair o base64
      const matches = image.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
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
      return res.redirect(image.imageUrl);
    }
  } catch (error) {
    console.error("[Image View Error]", error);
    res.status(500).send("Erro interno ao processar imagem");
  }
});

export { router as imageViewRouter };
