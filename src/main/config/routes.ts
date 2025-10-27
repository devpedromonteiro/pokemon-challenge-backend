import { readdirSync } from "node:fs";
import { join } from "node:path";
import { type Express, Router } from "express";

export const setupRoutes = (app: Express): void => {
    const router = Router();

    readdirSync(join(__dirname, "../routes"))
        .filter((file) => !file.endsWith(".map"))
        .map(async (file) => {
            (await import(`../routes/${file}`)).default(router);
        });

    app.use(router);
};
