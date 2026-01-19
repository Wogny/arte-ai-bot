import React, { useState } from "react";
import { Webhook, Key, Slack, Zap, Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export default function IntegrationsPage() {
  const [copied, setCopied] = useState(false);
  const workspaceId = 1;

  const webhooks = trpc.integrations.listWebhooks.useQuery({ workspaceId });
  const generateKey = trpc.integrations.generateApiKey.useMutation({
    onSuccess: () => alert("Nova API Key gerada!"),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Integrações</h1>
        <p className="text-gray-500">Conecte o Arte AI Bot com suas ferramentas favoritas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> API Pública
            </CardTitle>
            <CardDescription>Use sua API Key para integrar o sistema programaticamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value="ak_********************************" readOnly className="font-mono" />
              <Button variant="outline" onClick={() => copyToClipboard("ak_exemplo_123")}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button className="w-full" variant="secondary" onClick={() => generateKey.mutate({ workspaceId })}>
              Gerar Nova API Key
            </Button>
          </CardContent>
        </Card>

        {/* Zapier / Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" /> Zapier & Make
            </CardTitle>
            <CardDescription>Automatize fluxos enviando dados para o Zapier via Webhooks.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Envie eventos de postagem publicada, falhas ou novas artes geradas para mais de 5.000 apps.
            </p>
            <Button className="w-full">Configurar no Zapier</Button>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks de Saída */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" /> Webhooks de Saída
            </CardTitle>
            <CardDescription>Configure URLs para receber notificações em tempo real.</CardDescription>
          </div>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Novo Webhook</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.data?.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{wh.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{wh.url}</div>
                  <div className="flex gap-1 mt-2">
                    {(wh.events as string[]).map(e => (
                      <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
                    ))}
                  </div>
                </div>
                <Badge variant={wh.isActive ? "default" : "outline"}>
                  {wh.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            ))}
            {!webhooks.data?.length && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                Nenhum webhook configurado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slack / Discord */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-l-4 border-l-[#4A154B]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Slack className="h-5 w-5" /> Slack
            </CardTitle>
            <CardDescription>Receba alertas de aprovação e status no Slack.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Conectar Slack</Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#5865F2]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" /> Discord
            </CardTitle>
            <CardDescription>Integre notificações com seu servidor do Discord.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Conectar Discord</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
