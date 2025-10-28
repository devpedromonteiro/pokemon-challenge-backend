import { makePgConnection } from "@/main/factories/infra/repos/postgres";

const connection = makePgConnection();

beforeAll(async () => {
    await connection.connect();
}, 30000);

// Note: afterAll with disconnect causes timeout issues with open handles
// Using forceExit in jest config to clean up instead
