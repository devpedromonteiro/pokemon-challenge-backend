// biome-ignore-all lint: false positive

declare namespace Express {
    interface Request {
        locals?: any;
    }
}
