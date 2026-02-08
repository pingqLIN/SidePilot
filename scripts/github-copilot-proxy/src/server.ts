import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import openaiRoutes from "./routes/openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/v1", openaiRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "github-copilot-proxy" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Copilot Token configured: ${process.env.COPILOT_TOKEN ? "Yes" : "No"}`,
  );
});
