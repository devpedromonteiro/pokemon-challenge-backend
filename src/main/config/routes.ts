// biome-ignore-all lint: false positive, dynamic route loading requires runtime import
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { type Express, Router } from "express";

export const setupRoutes = (app: Express): void => {
    const router = Router();
    const routesPath = join(__dirname, "../routes");

    // Synchronous imports to avoid race conditions
    const files = readdirSync(routesPath).filter((file) => !file.endsWith(".map"));

    for (const file of files) {
        // Using require for synchronous loading in CommonJS
        const route = require(`../routes/${file}`);
        route.default(router);
    }

    app.use(router);
};
