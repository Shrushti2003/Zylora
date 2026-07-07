import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./database/mongoose.js";

async function bootstrap() {
  await connectDatabase();

  const server = createServer(app);

  server.listen(env.PORT, () => {
    console.info(`Zylora API listening on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start Zylora API", error);
  process.exit(1);
});
