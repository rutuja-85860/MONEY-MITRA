import cron from "node-cron";
import User from "../models/User.js";
import FinancialConfig from "../models/FinancialConfig.js"; // ✅ Added
import { runFinancialEngine } from "./FinancialEngine.js";
import { generateWeeklySummaryGroq } from "./AISummaryService.js";
import { sendEmail } from "../utils/emailClient.js";

// --- Scheduled Task (Feature F-12) ---
export function startWeeklySummaryJob() {
  // Schedule the task to run every Monday at 9:00 AM (0 9 * * 1)
  // NOTE: For testing, you can change this to run every minute: '* * * * *'
  cron.schedule(
    "0 9 * * 1",
    async () => {
      console.log("🤖 Running Weekly Financial Summary Job...");

      try {
        // ✅ Find all users who have completed onboarding
        const configs = await FinancialConfig.find({});
        console.log(`Found ${configs.length} users with financial configs`);

        for (const config of configs) {
          try {
            // Get user details
            const user = await User.findById(config.userId);
            if (!user) {
              console.log(`⚠️ User not found for config: ${config.userId}`);
              continue;
            }

            // 1. Recalculate and fetch the latest summary data
            const summary = await runFinancialEngine(config.userId);

            // 2. Generate the personalized AI summary text
            const summaryText = await generateWeeklySummaryGroq(summary);

            // 3. Prepare and send the email
            const emailSubject = `Weekly AI Financial Summary for ${user.email}`;
            const emailHtml = `
              <h2>Hello ${user.email.split("@")[0]},</h2>
              <p>Here is your personalized summary and score for the past week:</p>
              <div style="background:#f0f4ff; padding:15px; border-radius:10px; border-left: 5px solid #4f46e5;">
                <p style="font-weight:bold; color:#4f46e5;">Score: ${
                  summary.financialHealthScore
                }/100</p>
                <p>${summaryText}</p>
                <p style="margin-top:10px;">Your Safe-to-Spend limit for this week is: ₹${Math.round(
                  summary.safeToSpendData.safeToSpendWeekly
                ).toLocaleString()}.</p>
              </div>
              <p>Log into CoachAI to see your full cashflow forecast!</p>
            `;

            await sendEmail(user.email, emailSubject, emailHtml);
            console.log(`✅ Weekly summary sent to ${user.email}`);
          } catch (error) {
            console.error(
              `❌ Failed to process weekly summary for user ${config.userId}:`,
              error.message
            );
          }
        }

        console.log("✅ Weekly summary job completed");
      } catch (error) {
        console.error("❌ Weekly summary job failed:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("📅 Weekly summary job scheduled (Mondays at 9 AM IST)");
}
