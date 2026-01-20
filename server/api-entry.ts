import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth.js";
import { appRouter } from "./routers.js";
import { createContext } from "./_core/context.js";
import { mercadopagoWebhookRouter } from "./routes/mercadopago-webhook.js";
import { imageViewRouter } from "./routes/image-view.js";

const app = express();

// Content Security Policy to allow base64 images
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:;"
  );
  next();
});

// Configure cookie parser
app.use(cookieParser());

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Webhook do Mercado Pago
app.use("/api/mercadopago/webhook", mercadopagoWebhookRouter);

// Rota de visualização de imagem
app.use("/api/images/view", imageViewRouter);

// OAuth callback
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Export app for Vercel
export default app;
