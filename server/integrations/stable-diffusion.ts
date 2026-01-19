/**
 * Serviço de integração com Stable Diffusion via Replicate
 */

import { apiConfigs } from './apis-config';

interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

interface GenerateImageResponse {
  imageUrl: string;
  seed: number;
  processingTime: number;
}

/**
 * Gera uma imagem usando Stable Diffusion via Replicate
 */
export async function generateImageWithStableDiffusion(
  params: GenerateImageParams
): Promise<GenerateImageResponse> {
  if (!apiConfigs.stableDiffusion.isConfigured()) {
    throw new Error(
      'Stable Diffusion não está configurado. Adicione REPLICATE_API_TOKEN em Settings → Secrets'
    );
  }

  const token = apiConfigs.stableDiffusion.replicateToken;
  if (!token) {
    throw new Error('Token do Replicate não encontrado');
  }

  const startTime = Date.now();

  try {
    // Criar predição no Replicate
    const predictionResponse = await fetch(
      `${apiConfigs.stableDiffusion.baseUrl}/predictions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'db21e45d3f7023abc9e46f5955f7572bc3f72684e4dd280ac9072424f97b32eb',
          input: {
            prompt: params.prompt,
            negative_prompt: params.negativePrompt || '',
            width: params.width || 512,
            height: params.height || 512,
            num_inference_steps: params.numInferenceSteps || 50,
            guidance_scale: params.guidanceScale || 7.5,
          },
        }),
      }
    );

    if (!predictionResponse.ok) {
      throw new Error(
        `Replicate API error: ${predictionResponse.status} ${predictionResponse.statusText}`
      );
    }

    const prediction = await predictionResponse.json();
    const predictionId = prediction.id;

    // Aguardar conclusão da predição
    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutos com polling a cada 5 segundos

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Aguardar 5 segundos

      const statusResponse = await fetch(
        `${apiConfigs.stableDiffusion.baseUrl}/predictions/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.statusText}`);
      }

      const status = await statusResponse.json();

      if (status.status === 'succeeded') {
        completed = true;
        const processingTime = Date.now() - startTime;

        return {
          imageUrl: status.output[0],
          seed: status.input.seed || 0,
          processingTime,
        };
      } else if (status.status === 'failed') {
        throw new Error(`Image generation failed: ${status.error}`);
      }

      attempts++;
    }

    throw new Error('Image generation timeout after 10 minutes');
  } catch (error) {
    console.error('Stable Diffusion error:', error);
    throw error;
  }
}

/**
 * Valida se a API está disponível
 */
export async function validateStableDiffusionConnection(): Promise<boolean> {
  try {
    if (!apiConfigs.stableDiffusion.isConfigured()) {
      return false;
    }

    // Tentar fazer uma predição simples para validar
    const result = await generateImageWithStableDiffusion({
      prompt: 'test',
      width: 256,
      height: 256,
      numInferenceSteps: 1,
    });

    return !!result.imageUrl;
  } catch (error) {
    console.error('Stable Diffusion validation error:', error);
    return false;
  }
}
