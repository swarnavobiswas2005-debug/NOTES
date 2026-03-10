import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { notesRouter } from "./routes/notes";
import { uploadLimiter } from "./utils/rateLimiter";
import { initDb } from "./models/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", uploadLimiter);
app.use("/api", notesRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

async function main() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🚀 NOTES backend running on http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.DATABASE_URL ? "PostgreSQL" : "In-Memory"}`);
    console.log(`   IPFS: ${process.env.PINATA_API_KEY ? "Pinata" : "Mock"}`);
    console.log(`   Chain: ${process.env.CONTRACT_ADDRESS ? "On-Chain" : "Mock TX"}`);
  });
}

main().catch((e) => {
  console.error("Failed to start:", e);
  process.exit(1);
});

export default app;
