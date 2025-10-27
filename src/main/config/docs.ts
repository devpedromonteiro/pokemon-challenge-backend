import path from "node:path";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

/**
 * Configures OpenAPI/Swagger UI documentation at the /docs route
 *
 * @param app - Express application instance
 */
export const setupDocs = (app: Express): void => {
    const openapiPath = path.resolve(process.cwd(), "docs", "openapi.yaml");
    const openapiDocument = YAML.load(openapiPath);

    // Serve Swagger UI assets and documentation
    app.use("/docs", swaggerUi.serve);
    app.get("/docs", swaggerUi.setup(openapiDocument));
};
