"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMessagesToCopilotPrompt = convertMessagesToCopilotPrompt;
exports.convertCopilotResponseToOpenAI = convertCopilotResponseToOpenAI;
exports.convertCopilotStreamChunkToOpenAI = convertCopilotStreamChunkToOpenAI;
const uuid_1 = require("uuid");
function convertMessagesToCopilotPrompt(messages) {
    var _a;
    let prompt = "";
    for (const message of messages) {
        if (!message.content)
            continue;
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
    const lastRole = (_a = messages[messages.length - 1]) === null || _a === void 0 ? void 0 : _a.role;
    if (lastRole === "user") {
        prompt += "Assistant: ";
    }
    return prompt;
}
function convertCopilotResponseToOpenAI(copilotData, model = "gpt-4") {
    return {
        id: `chatcmpl-${(0, uuid_1.v4)()}`,
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
function convertCopilotStreamChunkToOpenAI(text, finishReason, model = "gpt-4") {
    return {
        id: `chatcmpl-${(0, uuid_1.v4)()}`,
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
