import axios from "axios";

// ❗ Direct hardcoded API key and model
const GROQ_API_KEY = "";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // correct Groq chat model
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function callGroq(prompt, options = {}) {
  const payload = {
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    ...options,
  };

  try {
    const res = await axios.post(GROQ_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });

    const content = res.data?.choices?.[0]?.message?.content;
    if (content) return content;

    throw new Error("Invalid response structure from Groq API.");
  } catch (error) {
    console.error(
      "Groq API Request Failed:",
      error.response?.data || error.message
    );
    throw new Error("Failed to communicate with the Groq service.");
  }
}
