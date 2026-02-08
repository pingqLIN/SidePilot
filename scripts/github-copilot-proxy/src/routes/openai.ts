import express from "express";
import { CopilotService } from "../services/copilot";
import {
  convertMessagesToCopilotPrompt,
  convertCopilotResponseToOpenAI,
  convertCopilotStreamChunkToOpenAI,
} from "../utils/converter";

const router = express.Router();

router.post("/chat/completions", async (req, res) => {
  try {
    const { messages, stream, model } = req.body;

    // Extract token from Authorization header or env
    let token = process.env.COPILOT_TOKEN;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Missing GitHub Copilot Token" });
    }

    const copilotService = new CopilotService(token);
    const prompt = convertMessagesToCopilotPrompt(messages);

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const copilotStream = await copilotService.createCompletion(prompt, true);

      copilotStream.on("data", (chunk: Buffer) => {
        const lines = chunk
          .toString()
          .split("\n")
          .filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.includes("[DONE]")) {
            res.write("data: [DONE]\n\n");
            continue;
          }

          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              // In stream, copilot sends data.choices[0].text
              const text = data.choices[0].text;
              const finishReason = data.choices[0].finish_reason;

              const openAiChunk = convertCopilotStreamChunkToOpenAI(
                text,
                finishReason,
                model,
              );
              res.write(`data: ${JSON.stringify(openAiChunk)}\n\n`);
            } catch (e) {
              console.error("Error parsing stream chunk:", e);
            }
          }
        }
      });

      copilotStream.on("end", () => {
        res.end();
      });
    } else {
      const completion = await copilotService.createCompletion(prompt, false);
      const response = convertCopilotResponseToOpenAI(completion, model);
      res.json(response);
    }
  } catch (error: any) {
    console.error("Error in chat/completions:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

export default router;
