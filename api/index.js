import { app } from "../backend/dist/app.js";
import { connectDatabase } from "../backend/dist/database/mongoose.js";

export default async function handler(request, response) {
  await connectDatabase();
  return app(request, response);
}
