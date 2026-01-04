import { Groq } from "groq-sdk";
import fs from "fs";

// Initialize Groq Client
const groq = new Groq({
  apiKey: "",
});

/**
 * Cleans currency strings (e.g., "₹1,060.00") into a clean number (e.g., 1060.00).
 * @param {string} value 
 * @returns {number} 
 */
function cleanAmount(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  // Remove currency symbols, commas, and ensure consistent decimal format
  const cleanedString = value.replace(/[₹$,]/g, "").trim();
  const numberValue = parseFloat(cleanedString);

  // Return 0 if conversion results in NaN
  return isNaN(numberValue) ? 0 : numberValue;
}

export async function analyzeReceiptImage(imagePath) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API Key is missing.");
  }
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");
  const mimeType = "image/jpeg";

  const jsonSchema = {
    type: "object",
    properties: {
      // Requesting it as a STRING to preserve currency symbols and commas for cleaning
      total_amount: {
        type: "string",
        description:
          "The final total amount paid, including currency symbols and commas.",
      },
      date: {
        type: "string",
        description:
          "The date of the transaction in YYYY-MM-DD format (must be present).",
      },
      description: {
        type: "string",
        description:
          "A brief, concise merchant name or purchase summary (must be present).",
      },
      category_suggestion: {
        type: "string",
        enum: [
          "Groceries",
          "Dining/Takeout",
          "Transport",
          "Entertainment",
          "Shopping",
          "Subscription",
        ],
        description:
          "Pick ONE category from the enum ONLY. No new categories allowed.",
      },
    },
    // IMPORTANT: Tell the AI which fields are mandatory
    required: ["total_amount", "date", "description", "category_suggestion"],
  };

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this receipt. Extract the total amount *exactly as seen* (including currency/commas), transaction date, a concise description, and a category suggestion. Only output the requested JSON object.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    response_format: { type: "json_object", schema: jsonSchema },
    temperature: 0.1,
  });

  const jsonString = completion.choices[0].message.content.trim();

  // Return the extracted data and the cleaning utility
  return {
    ...JSON.parse(jsonString),
    cleanAmount: cleanAmount, // Expose the cleaning utility
  };
}
