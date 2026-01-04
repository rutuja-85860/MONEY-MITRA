const Transaction = require("../models/Transaction");
const moment = require("moment");

class RiskEngine {
  /**
   * Calculate deterministic risk score
   * Range: 0-100
   */
  static async calculateRiskScore(userId, safeToSpendData) {
    let riskScore = 0;
    const signals = {
      velocityBreaches: 0,
      categoryWarnings: 0,
      bufferBreaches: 0,
      trendPenalty: 0,
      repeatedOverspending: 0,
    };

    // 1. Velocity Breaches
    const velocityBreaches = await this.checkVelocityBreaches(
      userId,
      safeToSpendData.dailyAllowance
    );
    signals.velocityBreaches = velocityBreaches;
    riskScore += velocityBreaches * 2;

    // 2. Category Overuse
    const categoryWarnings = await this.checkCategoryOveruse(userId);
    signals.categoryWarnings = categoryWarnings;
    riskScore += categoryWarnings * 1.5;

    // 3. Buffer Breaches
    const bufferBreaches = await this.checkBufferBreaches(
      userId,
      safeToSpendData.emergencyBuffer
    );
    signals.bufferBreaches = bufferBreaches;
    riskScore += bufferBreaches * 3;

    // 4. Trend Penalty (from SafeToSpend)
    signals.trendPenalty = safeToSpendData.trendPenalty * 10;
    riskScore += signals.trendPenalty;

    // 5. Repeated Overspending
    const repeatedOverspending = await this.checkRepeatedOverspending(userId);
    signals.repeatedOverspending = repeatedOverspending;
    riskScore += repeatedOverspending * 2.5;

    // Cap at 100
    riskScore = Math.min(100, Math.round(riskScore));

    return {
      riskScore,
      signals,
      explanation: this.explainRiskScore(signals),
    };
  }

  static async checkVelocityBreaches(userId, dailyAllowance) {
    const last7Days = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: moment().subtract(7, "days").toDate() },
    });

    // Group by day
    const dailySpending = {};
    last7Days.forEach((t) => {
      const day = moment(t.date).format("YYYY-MM-DD");
      dailySpending[day] = (dailySpending[day] || 0) + t.amount;
    });

    // Count breaches
    let breaches = 0;
    Object.values(dailySpending).forEach((amount) => {
      if (amount > dailyAllowance * 1.2) breaches++; // 20% tolerance
    });

    return breaches;
  }

  static async checkCategoryOveruse(userId) {
    const monthStart = moment().startOf("month").toDate();
    const expenses = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: monthStart },
    });

    const categoryTotals = {};
    let totalSpending = 0;

    expenses.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      totalSpending += t.amount;
    });

    let warnings = 0;
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      const percentage = (amount / totalSpending) * 100;
      if (percentage > 40 && !this.isEssential(category)) {
        warnings++;
      }
    });

    return warnings;
  }

  static async checkBufferBreaches(userId, emergencyBuffer) {
    const balance = await this.getCurrentBalance(userId);
    return balance < emergencyBuffer ? 1 : 0;
  }

  static async checkRepeatedOverspending(userId) {
    // Check last 4 weeks
    let overspendingWeeks = 0;

    for (let i = 0; i < 4; i++) {
      const weekStart = moment().subtract(i, "weeks").startOf("week").toDate();
      const weekEnd = moment().subtract(i, "weeks").endOf("week").toDate();

      const weekExpenses = await Transaction.find({
        userId,
        type: "expense",
        date: { $gte: weekStart, $lte: weekEnd },
      });

      const weekTotal = weekExpenses.reduce((sum, t) => sum + t.amount, 0);

      // Arbitrary threshold: ₹5000/week
      if (weekTotal > 5000) overspendingWeeks++;
    }

    return overspendingWeeks;
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

  static isEssential(category) {
    const essentials = ["Rent", "Utilities", "Insurance", "EMI", "Groceries", "Healthcare"];
    return essentials.includes(category);
  }

  static explainRiskScore(signals) {
    const reasons = [];

    if (signals.velocityBreaches > 0) {
      reasons.push(`Daily spending limit exceeded ${signals.velocityBreaches} times this week`);
    }

    if (signals.categoryWarnings > 0) {
      reasons.push(`${signals.categoryWarnings} categories consuming over 40% of budget`);
    }

    if (signals.bufferBreaches > 0) {
      reasons.push("Emergency buffer has been breached");
    }

    if (signals.trendPenalty > 0) {
      reasons.push("Recent spending trends indicate risk");
    }

    if (signals.repeatedOverspending > 0) {
      reasons.push(`Overspending detected in ${signals.repeatedOverspending} of last 4 weeks`);
    }

    return reasons.length > 0 ? reasons : ["No significant risk factors detected"];
  }
}

module.exports = RiskEngine;
