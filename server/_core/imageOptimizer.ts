import sharp from "sharp";

/**
 * Otimiza imagens para web antes de salvar no S3/CDN
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    console.log(`[IMAGE-OPTIMIZER] Otimizando imagem. Tamanho original: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    const optimized = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 }) // Converte para WebP para melhor compressão
      .toBuffer();

    console.log(`[IMAGE-OPTIMIZER] Otimização concluída. Novo tamanho: ${(optimized.length / 1024).toFixed(2)} KB`);
    return optimized;
  } catch (error) {
    console.error("[IMAGE-OPTIMIZER] Erro ao otimizar imagem:", error);
    return buffer; // Retorna original em caso de erro
  }
}

/**
 * Gera um thumbnail rápido para a interface
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(200, 200, { fit: "cover" })
    .webp({ quality: 60 })
    .toBuffer();
}
