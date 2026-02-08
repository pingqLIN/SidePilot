"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopilotService = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const COPILOT_COMPLETIONS_URL = "https://copilot-proxy.githubusercontent.com/v1/engines/copilot-codex/completions";
class CopilotService {
    constructor(token) {
        this.token = token;
    }
    async createCompletion(prompt, stream = false) {
        var _a;
        const machineId = (0, uuid_1.v4)(); // Generate a random machine ID or persist one if needed
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
            "X-Request-Id": (0, uuid_1.v4)(),
            "Machine-Id": machineId,
            "User-Agent": "GitHubCopilotChat/0.12.0",
            "Editor-Version": "Cursor-IDE/1.0.0",
            "Editor-Plugin-Version": "copilot-cursor/1.0.0",
            "Openai-Organization": "github-copilot",
            "Openai-Intent": "copilot-ghost",
        };
        const data = {
            prompt: prompt,
            max_tokens: 500,
            temperature: 0.7,
            top_p: 1,
            n: 1,
            stream: stream,
            stop: ["\n\n"],
            extra: {
                language: "typescript", // We might want to make this dynamic later
                next_indent: 0,
                trim_by_indentation: true,
            },
        };
        try {
            const response = await axios_1.default.post(COPILOT_COMPLETIONS_URL, data, {
                headers: headers,
                responseType: stream ? "stream" : "json",
            });
            return response.data;
        }
        catch (error) {
            console.error("Error calling Copilot API:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw error;
        }
    }
}
exports.CopilotService = CopilotService;
