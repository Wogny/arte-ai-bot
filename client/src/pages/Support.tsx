import React, { useState } from "react";
import { HelpCircle, MessageSquare, Book, Search, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export default function SupportPage() {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const tickets = trpc.support.listMyTickets.useQuery();
  const faq = trpc.support.listFaq.useQuery();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Suporte & Ajuda</h1>
          <p className="text-gray-500">Como podemos ajudar você hoje?</p>
        </div>
        <Button onClick={() => setShowTicketForm(!showTicketForm)}>
          <Plus className="h-4 w-4 mr-2" /> {showTicketForm ? "Ver Meus Tickets" : "Novo Ticket"}
        </Button>
      </div>

      {showTicketForm ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Abrir Novo Ticket</CardTitle>
            <CardDescription>Descreva seu problema ou dúvida e nossa equipe responderá em até 24h.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto</label>
              <Input placeholder="Ex: Problema com agendamento no Instagram" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição Detalhada</label>
              <Textarea placeholder="Conte-nos o que está acontecendo..." className="min-h-[150px]" />
            </div>
            <Button className="w-full">Enviar Ticket</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ & Base de Conhecimento */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-10" placeholder="Pesquisar na base de conhecimento..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:border-primary cursor-pointer transition-colors">
                <CardContent className="pt-6 flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Book className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-bold">Guia de Início Rápido</h3>
                    <p className="text-xs text-gray-500">Aprenda o básico em 5 minutos.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:border-primary cursor-pointer transition-colors">
                <CardContent className="pt-6 flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><HelpCircle className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-bold">Perguntas Frequentes</h3>
                    <p className="text-xs text-gray-500">Respostas para as dúvidas comuns.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Book className="h-5 w-5" /> Artigos Populares
              </h2>
              <div className="space-y-2">
                {["Como conectar sua conta do Instagram Business", "Configurando Webhooks para o Zapier", "Entendendo os limites de geração de IA"].map((item) => (
                  <div key={item} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm font-medium">{item}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meus Tickets */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Meus Tickets
            </h2>
            <div className="space-y-4">
              {tickets.data?.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm">{ticket.subject}</h4>
                      <Badge variant={ticket.status === "open" ? "default" : "secondary"}>{ticket.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{ticket.description}</p>
                    <div className="text-[10px] text-gray-400 pt-2 border-t">
                      Criado em {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!tickets.data?.length && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg text-sm">
                  Você não tem tickets abertos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
