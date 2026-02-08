import { v4 as uuidv4 } from "uuid";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string | null;
  name?: string;
  function_call?: any;
}

export interface CopilotCompletionResponse {
  id: string;
  created: number;
  choices: Array<{
    text: string;
    index: number;
    finish_reason: string | null;
  }>;
}

export function convertMessagesToCopilotPrompt(
  messages: OpenAIMessage[],
): string {
  let prompt = "";

  for (const message of messages) {
    if (!message.content) continue;

    switch (message.role) {
      case "system":
        prompt += `${message.content}\n\n`;
        break;
      case "user":
        prompt += `User: ${message.content}\n\n`;
        break;
      case "assistant":
        prompt += `Assistant: ${message.content}\n\n`;
        break;
    }
  }

  // Ensure the prompt ends expecting an assistant response logic mostly handled by the fact we append Assistant: at the end if the last wasn't assistant?
  // The spec says:
  // const lastMessage = messages[messages.length - 1];
  // const needsAssistantPrompt = lastMessage.role !== 'user';
  // actually usually we want to append "Assistant: " if the last message was User so Copilot knows to complete.

  const lastRole = messages[messages.length - 1]?.role;
  if (lastRole === "user") {
    prompt += "Assistant: ";
  }

  return prompt;
}

export function convertCopilotResponseToOpenAI(
  copilotData: CopilotCompletionResponse,
  model: string = "gpt-4",
) {
  return {
    id: `chatcmpl-${uuidv4()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: copilotData.choices.map((c) => ({
      index: c.index,
      message: {
        role: "assistant",
        content: c.text,
      },
      finish_reason: c.finish_reason || "stop",
    })),
    usage: {
      prompt_tokens: 0, // Placeholder
      completion_tokens: 0, // Placeholder
      total_tokens: 0,
    },
  };
}

export function convertCopilotStreamChunkToOpenAI(
  text: string,
  finishReason: string | null,
  model: string = "gpt-4",
) {
  return {
    id: `chatcmpl-${uuidv4()}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [
      {
        index: 0,
        delta: {
          content: text,
        },
        finish_reason: finishReason,
      },
    ],
  };
}
