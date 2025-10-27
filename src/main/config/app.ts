import express from "express";
import { applyMiddlewares } from "@/main/config/middlewares";
import { setupRoutes } from "@/main/config/routes";

const app = express();
applyMiddlewares(app);
setupRoutes(app);
export { app };
