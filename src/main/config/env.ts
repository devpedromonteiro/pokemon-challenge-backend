export const env = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    debug: process.env.DEBUG  === "true",
};
