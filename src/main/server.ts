import { env } from "@/main/config/env";
import { makePgConnection } from "@/main/factories/infra/repos/postgres";
import { errorHandler } from "@/main/middlewares/error-handler";

// Connect to database and start server
makePgConnection()
    .connect()
    .then(async () => {
        console.log("Database connected successfully");

        const { app } = await import("@/main/config/app");

        // IMPORTANT!: Should be the last middleware after all routes
        // @see https://medium.com/%40sylneyshii/express-error-handling-revised-f2f387519be0
        app.use(errorHandler);

        app.listen(env.port, () => {
            console.log(
                `Server running on http://localhost:${env.port} (env=${
                    process.env.NODE_ENV ?? "development"
                })`,
            );
        });
    })
    .catch((error: Error) => {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    });
