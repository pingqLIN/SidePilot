import express from "express";
import { CopilotService } from "../services/copilot";

const router = express.Router();
const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

/**
 * Simple chat endpoint for SDK Client
 * POST /api/chat
 * Body: { id, type, content, timestamp }
 * Response: { id, type: 'response', content, success }
 */
router.post("/chat", async (req, res) => {
  try {
    const { id, type, content } = req.body;

    // Extract token from Authorization header or env
    let token = process.env.COPILOT_TOKEN;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        id,
        type: "error",
        content: "Missing GitHub Copilot Token",
        success: false,
      });
    }

    const copilotService = new CopilotService(token);

    // Simple prompt for now - just use content as-is
    const prompt = `User: ${content}\n\nAssistant: `;

    try {
      const completion = await copilotService.createCompletion(prompt, false);
      const responseText =
        completion.choices[0]?.text || "No response from Copilot";

      res.json({
        id,
        type: "response",
        content: responseText.trim(),
        success: true,
      });
    } catch (copilotError) {
      const copilotMessage = getErrorMessage(copilotError);
      console.error("Copilot API error:", copilotMessage);
      res.status(500).json({
        id,
        type: "error",
        content: `Copilot API error: ${copilotMessage}`,
        success: false,
      });
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Error in /api/chat:", errorMessage);
    res.status(500).json({
      id: req.body?.id,
      type: "error",
      content: errorMessage || "Internal Server Error",
      success: false,
    });
  }
});

export default router;
