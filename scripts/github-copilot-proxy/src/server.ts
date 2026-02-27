import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import openaiRoutes from "./routes/openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Structured logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    const level = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(JSON.stringify({
      timestamp,
      level,
      requestId,
      method: req.method,
      path: req.url,
      statusCode: res.statusCode,
      durationMs: duration
    }));
  });
  
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
