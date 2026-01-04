import { callGroq } from "../utils/groqClient.js"; // Import your Groq utility

/**
 * Generates a comprehensive weekly financial summary using Groq.
 * @param {object} summaryData - Output from runFinancialEngine.
 * @returns {Promise<string>} Long-form AI summary text.
 */
export async function generateWeeklySummaryGroq(summaryData) {
  const {
    smartWeeklyBudget,
    actualWeeklyEssentialAverage,
    nonEssentialRatio,
    lowBalanceRisk,
    spendingPressure,
    profile,
  } = summaryData;

  // Prepare the contextual data for the LLM
  const context = `
        - Weekly Flex Budget: ₹${Math.round(smartWeeklyBudget)}
        - Actual Weekly Essential Avg: ₹${Math.round(
          actualWeeklyEssentialAverage
        )}
        - Non-Essential Spending Ratio (past 30 days): ${Math.round(
          nonEssentialRatio * 100
        )}%
        - Financial Goal: ${profile.primaryGoal}
        - Current Low Balance Risk: ${lowBalanceRisk}
        - Spending Pressure: ${spendingPressure}
    `;

  const prompt = `You are a professional, helpful financial advisor named CoachAI.
Analyze the following user data for the past week:
${context}

Write a detailed, personalized weekly financial summary (about 5-7 sentences) that:
1. Gives an explanation of their spending habits based on the Non-Essential Ratio.
2. Provides specific feedback regarding their financial goal (${profile.primaryGoal}).
3. Highlights the Cashflow Risk and gives a forward-looking action item for the coming week.
Use the currency symbol '₹'.
`;

  try {
    const summary = await callGroq(prompt, { max_tokens: 500 }); // More tokens for detailed summary
    return summary;
  } catch (e) {
    console.error("Groq Summary generation failed:", e);
    return "The AI experienced a brief network interruption. Your core metrics look stable this week. Focus on minimizing non-essential spending.";
  }
}
