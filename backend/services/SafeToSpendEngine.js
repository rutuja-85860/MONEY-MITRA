const Transaction = require("../models/Transaction");
const moment = require("moment");

class SafeToSpendEngine {
  /**
   * Calculate Safe-to-Spend from first principles
   * NO dependency on Trends engine
   */
  static async calculate(userId, config = {}) {
    const {
      emergencyBufferPercent = 20,
      fixedObligations = 0,
    } = config;

    // 1. Get current balance from transactions
    const balance = await this.getCurrentBalance(userId);

    // 2. Calculate remaining days in month
    const now = moment();
    const endOfMonth = moment().endOf("month");
    const remainingDays = Math.max(1, endOfMonth.diff(now, "days") + 1);

    // 3. Get upcoming fixed expenses
    const upcomingFixed = await this.getUpcomingFixedExpenses(userId);

    // 4. Calculate emergency buffer
    const emergencyBuffer = balance * (emergencyBufferPercent / 100);

    // 5. Base Safe-to-Spend calculation
    const baseSafeToSpend = Math.max(
      0,
      balance - upcomingFixed - emergencyBuffer
    );

    // 6. Get trend penalty (read-only signal)
    const trendPenalty = await this.getTrendPenalty(userId);

    // 7. Final Safe-to-Spend with penalty
    const finalSafeToSpend = baseSafeToSpend * (1 - trendPenalty);

    // 8. Daily allowance
    const dailyAllowance = finalSafeToSpend / remainingDays;

    // 9. Get current spending this month
    const monthlySpending = await this.getMonthlySpending(userId);

    // 10. Calculate remaining
    const remainingSafeToSpend = Math.max(0, finalSafeToSpend - monthlySpending.discretionary);

    // 11. Predict exhaustion date
    const exhaustionDate = await this.predictExhaustion(
      userId,
      remainingSafeToSpend,
      dailyAllowance
    );

    return {
      currentBalance: balance,
      emergencyBuffer,
      upcomingFixedExpenses: upcomingFixed,
      baseSafeToSpend,
      trendPenalty,
      finalSafeToSpend,
      remainingSafeToSpend,
      dailyAllowance,
      remainingDays,
      monthlySpending,
      exhaustionDate,
      isHealthy: remainingSafeToSpend > 0 && dailyAllowance > 0,
    };
  }

  static async getCurrentBalance(userId) {
    const transactions = await Transaction.find({ userId });
    let balance = 0;
    
    transactions.forEach((t) => {
      if (t.type === "income") balance += t.amount;
      else if (t.type === "expense") balance -= t.amount;
    });

    return balance;
  }

  static async getUpcomingFixedExpenses(userId) {
    // Get fixed expenses that repeat monthly
    const fixedCategories = ["Rent", "EMI", "Insurance", "Utilities"];
    const lastMonth = await Transaction.find({
      userId,
      type: "expense",
      category: { $in: fixedCategories },
      date: {
        $gte: moment().subtract(1, "month").startOf("month").toDate(),
        $lte: moment().subtract(1, "month").endOf("month").toDate(),
      },
    });

    let total = 0;
    lastMonth.forEach((t) => (total += t.amount));
    return total;
  }

  static async getTrendPenalty(userId) {
    // Read-only signal from Trends (if available)
    // Returns penalty factor 0.0 to 0.5
    const recentExpenses = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: moment().subtract(7, "days").toDate() },
    });

    const avgDailySpend = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / 7;
    
    // If spending velocity is high, apply penalty
    if (avgDailySpend > 1500) return 0.3; // 30% penalty
    if (avgDailySpend > 1000) return 0.15; // 15% penalty
    return 0;
  }

  static async getMonthlySpending(userId) {
    const monthStart = moment().startOf("month").toDate();
    const expenses = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: monthStart },
    });

    let essential = 0;
    let discretionary = 0;

    const essentialCategories = ["Rent", "Utilities", "Insurance", "EMI", "Groceries"];

    expenses.forEach((t) => {
      if (essentialCategories.includes(t.category)) {
        essential += t.amount;
      } else {
        discretionary += t.amount;
      }
    });

    return {
      total: essential + discretionary,
      essential,
      discretionary,
    };
  }

  static async predictExhaustion(userId, remainingSafeToSpend, dailyAllowance) {
    if (remainingSafeToSpend <= 0) {
      return {
        daysUntilExhaustion: 0,
        exhaustionDate: new Date(),
        status: "EXHAUSTED",
      };
    }

    if (dailyAllowance <= 0) {
      return {
        daysUntilExhaustion: 0,
        exhaustionDate: new Date(),
        status: "CRITICAL",
      };
    }

    // Get average daily spending
    const recentExpenses = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: moment().subtract(7, "days").toDate() },
    });

    const avgDailySpend = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / 7;

    if (avgDailySpend === 0) {
      return {
        daysUntilExhaustion: 999,
        exhaustionDate: moment().add(999, "days").toDate(),
        status: "SAFE",
      };
    }

    const daysUntilExhaustion = Math.floor(remainingSafeToSpend / avgDailySpend);
    const exhaustionDate = moment().add(daysUntilExhaustion, "days").toDate();

    return {
      daysUntilExhaustion,
      exhaustionDate,
      avgDailySpend,
      status: daysUntilExhaustion < 7 ? "WARNING" : "SAFE",
    };
  }
}

module.exports = SafeToSpendEngine;
