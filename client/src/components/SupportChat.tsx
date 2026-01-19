import React, { useState } from "react";
import { MessageCircle, X, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "agent", text: "Olá! Como posso ajudar você hoje?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }]);
    setInput("");
    
    // Simulação de resposta automática
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "agent", 
        text: "Recebemos sua mensagem. Um especialista entrará em contato em breve!" 
      }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-lg animate-bounce"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-[350px] h-[450px] flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-10 duration-300">
          <CardHeader className="bg-primary text-white rounded-t-lg p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              Suporte Online
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-white rounded-br-none" 
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="p-4 border-t">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Digite sua mensagem..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <Button size="icon" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
