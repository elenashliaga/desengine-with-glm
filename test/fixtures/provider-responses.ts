const geminiJsonSuccessResponse = {
  candidates: [
    {
      content: {
        parts: [{ text: "{\"ok\":true}" }],
      },
      finishReason: "STOP",
    },
  ],
  usageMetadata: {
    promptTokenCount: 11,
    candidatesTokenCount: 7,
    totalTokenCount: 18,
  },
}

const geminiSafetyBlockResponse = {
  promptFeedback: {
    blockReason: "SAFETY",
  },
}

const openAiJsonSuccessResponse = {
  choices: [
    {
      message: {
        content: "{\"ok\":true}",
      },
    },
  ],
  usage: {
    prompt_tokens: 11,
    completion_tokens: 7,
    total_tokens: 18,
  },
}

const deepSeekJsonSuccessResponse = {
  choices: [
    {
      message: {
        content: "{\"ok\":true}",
      },
    },
  ],
  usage: {
    prompt_tokens: 9,
    completion_tokens: 6,
    total_tokens: 15,
  },
}

export {
  deepSeekJsonSuccessResponse,
  geminiJsonSuccessResponse,
  geminiSafetyBlockResponse,
  openAiJsonSuccessResponse,
}
