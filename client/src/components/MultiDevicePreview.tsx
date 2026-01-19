import React, { useState } from "react";
import { Smartphone, Monitor, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MultiDevicePreview() {
  const [activeDevice, setActiveDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");

  const devices = {
    mobile: { width: 375, height: 667, name: "iPhone", icon: Smartphone },
    tablet: { width: 768, height: 1024, name: "iPad", icon: Tablet },
    desktop: { width: 1200, height: 800, name: "Desktop", icon: Monitor }
  };

  const mockContent = {
    title: "Promoção de Verão 🌞",
    description: "Aproveite 30% de desconto em toda a coleção de verão!",
    image: "🎨", // Placeholder
    hashtags: "#Verão #Promoção #Desconto"
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 to-purple-900/20 rounded-2xl p-8 border border-white/10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Preview em Tempo Real</h2>
        <p className="text-gray-400 mb-6">Veja como seu post ficará em cada dispositivo</p>

        {/* Device Selector */}
        <div className="flex gap-4 mb-8">
          {Object.entries(devices).map(([key, device]) => {
            const Icon = device.icon;
            return (
              <Button
                key={key}
                onClick={() => setActiveDevice(key as "mobile" | "tablet" | "desktop")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  activeDevice === key
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                {device.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex justify-center items-start bg-black/50 rounded-xl p-8 overflow-auto">
        <div
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: `${devices[activeDevice].width}px`,
            height: `${devices[activeDevice].height}px`,
            maxWidth: "100%"
          }}
        >
          {/* Mobile/Tablet Preview */}
          {(activeDevice === "mobile" || activeDevice === "tablet") && (
            <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
              {/* Status Bar */}
              <div className="bg-black text-white px-4 py-2 text-xs flex justify-between">
                <span>9:41</span>
                <div className="flex gap-1">📶 📡 🔋</div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-lg shadow-sm mb-4">
                  {/* Profile */}
                  <div className="flex items-center gap-3 p-4 border-b">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-bold text-sm">Sua Marca</p>
                      <p className="text-xs text-gray-500">Agora</p>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-6xl">
                    {mockContent.image}
                  </div>

                  {/* Caption */}
                  <div className="p-4">
                    <p className="font-bold text-sm mb-2">{mockContent.title}</p>
                    <p className="text-sm text-gray-700 mb-3">{mockContent.description}</p>
                    <p className="text-xs text-blue-600">{mockContent.hashtags}</p>
                  </div>

                  {/* Interactions */}
                  <div className="flex justify-between px-4 py-3 border-t text-sm text-gray-600">
                    <span>❤️ 1.2k</span>
                    <span>💬 234</span>
                    <span>↗️ 89</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Preview */}
          {activeDevice === "desktop" && (
            <div className="h-full flex flex-col bg-gray-50">
              {/* Header */}
              <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <p className="font-bold">Sua Marca</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Seguindo</span>
                  <span>⋯</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex p-6 gap-6">
                {/* Image */}
                <div className="flex-1 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg flex items-center justify-center text-9xl">
                  {mockContent.image}
                </div>

                {/* Info */}
                <div className="w-80">
                  <h2 className="text-2xl font-bold mb-4">{mockContent.title}</h2>
                  <p className="text-gray-700 mb-6">{mockContent.description}</p>
                  <p className="text-blue-600 text-sm mb-8">{mockContent.hashtags}</p>

                  <div className="flex gap-4 text-sm text-gray-600 mb-8">
                    <span>❤️ 1.2k curtidas</span>
                    <span>💬 234 comentários</span>
                  </div>

                  <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition">
                    Compartilhar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
        <p className="text-sm text-gray-400">
          ✨ <strong>Dica:</strong> O MKT Gerenciador adapta automaticamente o tamanho, proporção e formato para cada plataforma. Você não precisa se preocupar com isso!
        </p>
      </div>
    </div>
  );
}
