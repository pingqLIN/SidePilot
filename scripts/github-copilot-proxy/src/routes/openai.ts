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

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: "Invalid request: 'messages' must be a non-empty array" 
      });
    }

    if (!model) {
      return res.status(400).json({ 
        error: "Invalid request: 'model' is required" 
      });
    }

    // Validate message format
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || typeof msg !== 'object') {
        return res.status(400).json({
          error: `Invalid request: message at index ${i} is not a valid object`
        });
      }
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        return res.status(400).json({
          error: `Invalid request: message at index ${i} has invalid role (must be 'user', 'assistant', or 'system')`
        });
      }
      if (!msg.content || typeof msg.content !== 'string') {
        return res.status(400).json({
          error: `Invalid request: message at index ${i} must have a 'content' string field`
        });
      }
    }

    // Extract token from Authorization header or env
    let token = process.env.COPILOT_TOKEN;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Missing GitHub Copilot Token" });
    }

    const copilotService = new CopilotService(token);
    
    // Convert messages with error handling
    let prompt: string;
    try {
      prompt = convertMessagesToCopilotPrompt(messages);
    } catch (err: any) {
      return res.status(400).json({ 
        error: `Invalid message format: ${err.message}` 
      });
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let copilotStream: any;
       try {
         copilotStream = await copilotService.createCompletion(prompt, true);
       } catch (err: any) {
         return classifyAndRespond(res, err);
       }

      copilotStream.on("data", (chunk: Buffer) => {
        try {
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
                const data = JSON.parse(line.slice(6)) as any;
                const text = data.choices?.[0]?.text;
                const finishReason = data.choices?.[0]?.finish_reason;

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
        } catch (e) {
          console.error("Error processing stream data:", e);
        }
      });

      copilotStream.on("end", () => {
        res.end();
      });

      copilotStream.on("error", (err: any) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(503).json({ error: "Stream error" });
        } else {
          res.end();
        }
      });
    } else {
       let completion: any;
       try {
         completion = await copilotService.createCompletion(prompt, false);
       } catch (err: any) {
         return classifyAndRespond(res, err);
       }

      const response = convertCopilotResponseToOpenAI(completion, model);
      res.json(response);
    }
  } catch (error: any) {
    console.error("Error in chat/completions:", error);
    return classifyAndRespond(res, error);
  }
});

// Classify API errors and respond with appropriate HTTP status codes
function classifyAndRespond(res: any, err: any): any {
  const message = err?.message || '';
  
  // 401 - Unauthorized (invalid token)
  if (message.includes('401') || message.includes('Unauthorized') || message.includes('token')) {
    res.status(401).json({ error: 'Unauthorized: Invalid GitHub Copilot Token' });
    return;
  }
  
  // 429 - Rate limit exceeded
  if (message.includes('429') || message.includes('rate limit') || message.includes('Too Many Requests')) {
    res.status(429).json({ 
      error: 'Too Many Requests: Copilot API rate limit exceeded',
      retryAfter: 60
    });
    return;
  }
  
  // 422 - Unprocessable entity (invalid Copilot response or model)
  if (message.includes('422') || message.includes('Unprocessable') || message.includes('model')) {
    res.status(422).json({ 
      error: 'Unprocessable Entity: Invalid model or Copilot response format' 
    });
    return;
  }
  
  // 500 - Internal server error (default)
  res.status(500).json({ error: 'Internal Server Error' });
}

export default router;
