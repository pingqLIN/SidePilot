"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const copilot_1 = require("../services/copilot");
const converter_1 = require("../utils/converter");
const router = express_1.default.Router();
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
        const copilotService = new copilot_1.CopilotService(token);
        const prompt = (0, converter_1.convertMessagesToCopilotPrompt)(messages);
        if (stream) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            const copilotStream = await copilotService.createCompletion(prompt, true);
            copilotStream.on("data", (chunk) => {
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
                            const openAiChunk = (0, converter_1.convertCopilotStreamChunkToOpenAI)(text, finishReason, model);
                            res.write(`data: ${JSON.stringify(openAiChunk)}\n\n`);
                        }
                        catch (e) {
                            console.error("Error parsing stream chunk:", e);
                        }
                    }
                }
            });
            copilotStream.on("end", () => {
                res.end();
            });
        }
        else {
            const completion = await copilotService.createCompletion(prompt, false);
            const response = (0, converter_1.convertCopilotResponseToOpenAI)(completion, model);
            res.json(response);
        }
    }
    catch (error) {
        console.error("Error in chat/completions:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});
exports.default = router;
