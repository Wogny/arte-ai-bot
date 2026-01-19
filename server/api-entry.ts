import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth.js";
import { appRouter } from "./routers.js";
import { createContext } from "./_core/context.js";
import { mercadopagoWebhookRouter } from "./routes/mercadopago-webhook.js";

const app = express();

// Configure cookie parser
app.use(cookieParser());

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Webhook do Mercado Pago
app.use("/api/mercadopago/webhook", mercadopagoWebhookRouter);

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
