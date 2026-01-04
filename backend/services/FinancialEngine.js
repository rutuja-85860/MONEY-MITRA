import FinancialConfig from "../models/FinancialConfig.js";
import Transaction from "../models/Transaction.js";
import { callGroq } from "../utils/groqClient.js";
import SafeToSpendService from "./SafeToSpendService.js";

// Constants
const WEEKS_IN_MONTH = 4.33;
const DAYS_IN_WEEK = 7;
const FORECAST_DAYS = 7;
const LOOKBACK_DAYS = 30;
const LOW_BALANCE_THRESHOLD = 2000;

/**
 * Executes the core financial calculations
 * Now integrated with Safe-to-Spend Service
 */
export async function runFinancialEngine(userId) {
  console.log("🚀 Running Financial Engine for userId:", userId);

  // ✅ Changed from Profile to FinancialConfig
  const config = await FinancialConfig.findOne({ userId });

  if (!config) {
    throw new Error("Financial config not found. Please complete onboarding first.");
  }

  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - LOOKBACK_DAYS);

  const transactions = await Transaction.find({
    userId,
    date: { $gte: lookbackDate },
  });

  // ✅ Extract values from FinancialConfig
  const P_INC = config.monthlyIncome || 0;
  const totalFixedObligations = config.fixedObligations.reduce(
    (sum, ob) => sum + ob.amount,
    0
  );
  const P_FIX = totalFixedObligations || 0;
  const P_LOAN = config.fixedObligations.find(ob => ob.name.includes("Loan"))?.amount || 0;
  const P_SAV = 0; // Can be added to config if needed

  // --- Spending Pattern Detection ---
  let totalEssentialSpending = 0;
  let totalNonEssentialSpending = 0;
  let totalSpending = 0;

  transactions.forEach((t) => {
    const amount = Math.abs(t.amount);
    if (t.aiClassification === "Essential") {
      totalEssentialSpending += amount;
    } else if (t.aiClassification === "Non-Essential") {
      totalNonEssentialSpending += amount;
    }
  });
  totalSpending = totalEssentialSpending + totalNonEssentialSpending;

  const actualWeeklyEssentialAverage =
    totalEssentialSpending / (LOOKBACK_DAYS / DAYS_IN_WEEK);
  const nonEssentialRatio =
    totalSpending > 0 ? totalNonEssentialSpending / totalSpending : 0;

  // --- Smart Weekly Budget ---
  const monthlyBurden = P_FIX + P_LOAN + P_SAV;
  const monthlyFlexIncome = P_INC - monthlyBurden;
  const weeklyFlexIncomeBaseline = Math.max(0, monthlyFlexIncome / WEEKS_IN_MONTH);
  const smartWeeklyFlexBudget = Math.max(
    0,
    weeklyFlexIncomeBaseline - actualWeeklyEssentialAverage
  );

  // --- PRODUCTION-GRADE SAFE-TO-SPEND CALCULATION ---
  const safeToSpendData = await SafeToSpendService.calculate(userId);

  // Generate AI explanation
  try {
    const explanation = await generateSafeToSpendExplanation(safeToSpendData, config);
    safeToSpendData.explanation = explanation;
  } catch (err) {
    console.error("Failed to generate Safe-to-Spend explanation:", err);
    safeToSpendData.explanation = safeToSpendData.reason;
  }

  // --- Cashflow Forecast ---
  let currentBalance = monthlyFlexIncome / WEEKS_IN_MONTH;
  const lastWeekNet = transactions
    .filter((t) => t.date >= new Date(Date.now() - DAYS_IN_WEEK * 24 * 60 * 60 * 1000))
    .reduce((net, t) => net - Math.abs(t.amount), 0);

  currentBalance = Math.max(0, currentBalance + lastWeekNet);

  const cashflowForecast = [];
  let lowestBalance = currentBalance;
  let lowBalanceRisk = "Low";
  let spendingPressure = "Medium";
  let projectedBalance = currentBalance;

  for (let i = 0; i < FORECAST_DAYS; i++) {
    const date = new Date(Date.now());
    date.setDate(date.getDate() + i);

    let netChange = 0;
    let pressureEvent = null;

    if (date.getDate() === 1) {
      netChange += P_INC;
      netChange -= monthlyBurden;
      pressureEvent = "Income/Fixed Expenses Day";
    }

    netChange -= actualWeeklyEssentialAverage / DAYS_IN_WEEK;
    projectedBalance += netChange;

    cashflowForecast.push({
      date: date,
      projectedBalance: Math.round(projectedBalance),
      pressureEvent: pressureEvent,
    });

    lowestBalance = Math.min(lowestBalance, projectedBalance);
  }

  if (lowestBalance < LOW_BALANCE_THRESHOLD) {
    lowBalanceRisk = "High";
    spendingPressure = "High (Low Cash Buffer)";
  } else if (nonEssentialRatio > 0.4) {
    spendingPressure = "High (High Non-Essential Spending)";
  }

  // --- Financial Health Score ---
  let score = 100;
  if (P_LOAN > P_INC * 0.3) score -= 30;
  score -= Math.round(nonEssentialRatio * 30);
  if (lowBalanceRisk === "High") score -= 20;
  if (safeToSpendData.riskScore > 50) score -= 15;

  const financialHealthScore = Math.min(100, Math.max(10, score));

  console.log("✅ Financial Engine completed");
  console.log("  Financial Health Score:", financialHealthScore);
  console.log("  Safe-to-Spend Weekly:", safeToSpendData.safeToSpendWeekly);

  return {
    config, // ✅ Return config instead of profile
    smartWeeklyBudget: Math.round(smartWeeklyFlexBudget),
    safeToSpendData,
    financialHealthScore,
    cashflowForecast,
    lowBalanceRisk,
    spendingPressure,
    actualWeeklyEssentialAverage: Math.round(actualWeeklyEssentialAverage),
    nonEssentialRatio: Math.round(nonEssentialRatio * 100),
  };
}

/**
 * Generate AI explanation (AI ONLY for text)
 */
async function generateSafeToSpendExplanation(safeToSpendData, config) {
  const { confidence, breakdown, reason } = safeToSpendData;

  const prompt = `You are a financial coach. Explain why the user's Safe-to-Spend is set at this level.

Status: ${confidence}
Balance: ₹${breakdown.currentBalance} ${breakdown.isEstimated ? "(estimated)" : ""}
Buffer Applied: ${breakdown.bufferPercentage}%
Spending Velocity: ${breakdown.spendingVelocity}%
Upcoming Expenses: ₹${breakdown.upcomingExpenses}

Generate a clear, reassuring explanation (max 35 words). Use ₹ symbol.`;

  try {
    const explanation = await callGroq(prompt, { max_tokens: 70 });
    return explanation;
  } catch (e) {
    return reason;
  }
}

/**
 * Generate nudge after transaction
 */
export async function generateTransactionNudge(transaction, safeToSpendData) {
  const { remainingThisWeek, confidence } = safeToSpendData;

  const prompt = `User spent ₹${transaction.amount} on "${transaction.description}". 
Remaining: ₹${remainingThisWeek}
Status: ${confidence}

Generate a 15-word nudge. Be encouraging if SAFE, cautionary if CAUTION, urgent if RISK.`;

  try {
    const nudge = await callGroq(prompt, { max_tokens: 40 });
    return nudge;
  } catch (e) {
    return `You spent ₹${transaction.amount}. Remaining this week: ₹${remainingThisWeek}.`;
  }
}

export async function generateNudges(summaryData) {
  const {
    smartWeeklyBudget,
    actualWeeklyEssentialAverage,
    lowBalanceRisk,
    spendingPressure,
    config, // ✅ Changed from profile
    safeToSpendData,
  } = summaryData;

  const goal = "save_more"; // Default goal, can be added to config if needed

  const prompt = `Generate a financial nudge for a user with:
Weekly Budget: ₹${Math.round(smartWeeklyBudget)}
Goal: ${goal}
Risk: ${lowBalanceRisk}
Pressure: ${spendingPressure}
Safe-to-Spend Status: ${safeToSpendData.confidence}

Generate one actionable sentence (max 25 words). Use ₹ symbol.`;

  try {
    const nudge = await callGroq(prompt, { max_tokens: 60 });
    return nudge;
  } catch (e) {
    return "Stay on track with your spending! Check your Safe-to-Spend daily.";
  }
}
