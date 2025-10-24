import express from "express";
import { applyMiddlewares } from "./config/middlewares";
import { errorHandler } from "./middlewares/error-handler";

const app = express();
applyMiddlewares(app);

const PORT = Number(process.env.PORT ?? 3000);

// Rota de health check
app.get("/healthz", (_req, res) => {
    res.status(200).json({
        status: "ok",
        uptimeSeconds: Number(process.uptime().toFixed(2)),
        version: "1.0.0",
    });
});

// IMPORTANT!: Should be the last middleware after all routes
// @see https://medium.com/%40sylneyshii/express-error-handling-revised-f2f387519be0
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (env=${process.env.NODE_ENV ?? "development"})`);
});

