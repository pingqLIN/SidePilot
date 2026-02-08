import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const COPILOT_COMPLETIONS_URL =
  "https://copilot-proxy.githubusercontent.com/v1/engines/copilot-codex/completions";

export class CopilotService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async createCompletion(prompt: string, stream: boolean = false) {
    const machineId = uuidv4(); // Generate a random machine ID or persist one if needed

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      "X-Request-Id": uuidv4(),
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
      const response = await axios.post(COPILOT_COMPLETIONS_URL, data, {
        headers: headers,
        responseType: stream ? "stream" : "json",
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "Error calling Copilot API:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
