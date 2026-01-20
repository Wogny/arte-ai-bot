import { useState } from 'react';
import { Sparkles, Upload, Image as ImageIcon, Send, Loader2, Copy, Download } from 'lucide-react';
import { trpc } from '../lib/trpc';

type ImageStyle = 'realistic' | 'anime' | 'cartoon' | 'oil_painting' | 'watercolor' | 'digital_art' | '3d_render' | 'photography';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: ImageStyle;
}

export default function CreatePost() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('realistic');
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateImageMutation = trpc.imageGeneration.generate.useMutation();
  const publishMutation = trpc.socialPublishing.publish.useMutation();

  const styles: { value: ImageStyle; label: string }[] = [
    { value: 'realistic', label: 'Realista' },
    { value: 'anime', label: 'Anime' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'oil_painting', label: 'Óleo' },
    { value: 'watercolor', label: 'Aquarela' },
    { value: 'digital_art', label: 'Digital' },
    { value: '3d_render', label: '3D' },
    { value: 'photography', label: 'Fotografia' },
  ];

  const platforms = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'tiktok', label: 'TikTok' },
  ];

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Digite um prompt para gerar a imagem');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await generateImageMutation.mutateAsync({
        prompt,
        style: selectedStyle,
      });

      if (result.success && result.image) {
        const newImage: GeneratedImage = {
          id: result.image.id.toString(),
          url: result.image.imageUrl,
          prompt,
          style: selectedStyle,
        };
        setGeneratedImages([newImage, ...generatedImages]);
        setSelectedImageId(newImage.id);
      } else {
        setError('Erro ao gerar imagem. Tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar imagem');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedImageId) {
      setError('Selecione uma imagem');
      return;
    }

    if (!caption.trim()) {
      setError('Escreva uma legenda');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Selecione pelo menos uma plataforma');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const selectedImage = generatedImages.find(img => img.id === selectedImageId);
      if (!selectedImage) {
        setError('Imagem não encontrada');
        return;
      }

      const result = await publishMutation.mutateAsync({
        imageUrl: selectedImage.url,
        caption,
        platforms: selectedPlatforms as any,
        hashtags: [],
      });

      if (result.success) {
        // Reset form
        setPrompt('');
        setCaption('');
        setGeneratedImages([]);
        setSelectedImageId(null);
        setError('');
        alert('Post publicado com sucesso!');
      } else {
        setError('Erro ao publicar. Tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar');
    } finally {
      setLoading(false);
    }
  };

  const selectedImage = generatedImages.find(img => img.id === selectedImageId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            Criar Post com IA
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Gere imagens incríveis e publique em suas redes sociais</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Panel - Generator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Generator Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Gerador de Imagens</h2>

              {/* Prompt Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Descreva a imagem que deseja
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Mulher fazendo yoga ao pôr do sol na praia..."
                  className="w-full h-24 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition resize-none"
                />
              </div>

              {/* Style Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">Estilo</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {styles.map(style => (
                    <button
                      key={style.value}
                      onClick={() => setSelectedStyle(style.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedStyle === style.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateImage}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Gerar Imagem
                  </>
                )}
              </button>
            </div>

            {/* Caption Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Legenda do Post</h2>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escreva uma legenda atrativa para seu post..."
                className="w-full h-32 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition resize-none mb-4"
              />

              {/* Character Count */}
              <div className="text-sm text-gray-400">
                {caption.length} caracteres
              </div>
            </div>

            {/* Platforms Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Plataformas</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {platforms.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => {
                      if (selectedPlatforms.includes(platform.id)) {
                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                      } else {
                        setSelectedPlatforms([...selectedPlatforms, platform.id]);
                      }
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      selectedPlatforms.includes(platform.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {platform.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            {/* Image Preview */}
            {selectedImage ? (
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>

                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.url}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                </div>

                <div className="space-y-2 text-sm text-gray-300">
                  <p>
                    <strong>Estilo:</strong> {styles.find(s => s.value === selectedImage.style)?.label}
                  </p>
                  <p>
                    <strong>Prompt:</strong> {selectedImage.prompt}
                  </p>
                </div>

                <button
                  onClick={() => window.open(selectedImage.url, '_blank')}
                  className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </button>
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Gere uma imagem para visualizar</p>
              </div>
            )}

            {/* Generated Images List */}
            {generatedImages.length > 0 && (
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Imagens Geradas</h2>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generatedImages.map(img => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageId(img.id)}
                      className={`w-full p-3 rounded-lg text-left text-sm transition ${
                        selectedImageId === img.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <div className="truncate">{img.prompt}</div>
                      <div className="text-xs opacity-75">{img.style}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={loading || !selectedImageId}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Publicar Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
