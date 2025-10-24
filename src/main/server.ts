import express from "express";
import applyMiddlewares from "./config/middlewares";

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (env=${process.env.NODE_ENV ?? "development"})`);
});

