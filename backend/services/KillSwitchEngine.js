class KillSwitchEngine {
  /**
   * Determine Kill-Switch level based on risk score
   */
  static getKillSwitchLevel(riskScore) {
    if (riskScore >= 75) return "RED";
    if (riskScore >= 50) return "ORANGE";
    if (riskScore >= 25) return "YELLOW";
    return "GREEN";
  }

  /**
   * Check if transaction should be allowed
   */
  static async validateTransaction(userId, transactionData, safeToSpendData, riskScore) {
    const level = this.getKillSwitchLevel(riskScore);
    const { category, amount, type } = transactionData;

    // Always allow income
    if (type === "income") {
      return {
        allowed: true,
        status: "ALLOWED",
        level,
        reason: "Income transactions are always allowed",
      };
    }

    // Always allow essentials
    if (this.isEssential(category)) {
      return {
        allowed: true,
        status: "ALLOWED",
        level,
        reason: "Essential expenses are never blocked",
      };
    }

    // GREEN: No restrictions
    if (level === "GREEN") {
      return {
        allowed: true,
        status: "ALLOWED",
        level,
        reason: "Financial health is good",
      };
    }

    // YELLOW: Warn only
    if (level === "YELLOW") {
      return {
        allowed: true,
        status: "WARNING",
        level,
        reason: "Spending velocity is elevated. Consider reducing non-essential expenses.",
        severity: "MEDIUM",
      };
    }

    // ORANGE: Block non-essentials if over daily limit
    if (level === "ORANGE") {
      const todaySpending = await this.getTodaySpending(userId);
      const projectedTotal = todaySpending + amount;

      if (projectedTotal > safeToSpendData.dailyAllowance) {
        const recovery = await this.simulateRecovery(userId, safeToSpendData, riskScore);
        return {
          allowed: false,
          status: "BLOCKED",
          level,
          reason: `Daily spending limit (₹${Math.round(safeToSpendData.dailyAllowance)}) would be exceeded`,
          severity: "HIGH",
          currentDailySpend: todaySpending,
          attemptedTotal: projectedTotal,
          dailyLimit: safeToSpendData.dailyAllowance,
          recovery,
        };
      }

      return {
        allowed: true,
        status: "WARNING",
        level,
        reason: "Spending is high but within daily limit. Proceed with caution.",
        severity: "MEDIUM",
      };
    }

    // RED: Hard block all discretionary
    if (level === "RED") {
      const recovery = await this.simulateRecovery(userId, safeToSpendData, riskScore);
      return {
        allowed: false,
        status: "BLOCKED",
        level,
        reason: "Critical financial risk detected. Non-essential spending is blocked.",
        severity: "CRITICAL",
        recovery,
      };
    }
  }

  static async getTodaySpending(userId) {
    const Transaction = require("../models/Transaction");
    const moment = require("moment");

    const today = await Transaction.find({
      userId,
      type: "expense",
      date: {
        $gte: moment().startOf("day").toDate(),
        $lte: moment().endOf("day").toDate(),
      },
    });

    return today.reduce((sum, t) => sum + t.amount, 0);
  }

  static isEssential(category) {
    const essentials = ["Rent", "Utilities", "Insurance", "EMI", "Groceries", "Healthcare"];
    return essentials.includes(category);
  }

  static async simulateRecovery(userId, safeToSpendData, riskScore) {
    const scenarios = [];

    // Scenario 1: Reduce daily spending
    const requiredDailySpend = safeToSpendData.dailyAllowance * 0.7;
    const daysToUnlock = Math.ceil(15 - (75 - riskScore) / 5);

    scenarios.push({
      action: "REDUCE_SPENDING",
      description: `Reduce daily spending to ₹${Math.round(requiredDailySpend)}`,
      impact: `Unlock in ${daysToUnlock} days`,
      daysRequired: daysToUnlock,
      targetDailySpend: requiredDailySpend,
    });

    // Scenario 2: Pause non-essentials
    const pauseDays = Math.ceil(10 - (75 - riskScore) / 10);
    scenarios.push({
      action: "PAUSE_DISCRETIONARY",
      description: "Pause all non-essential spending",
      impact: `Unlock in ${pauseDays} days`,
      daysRequired: pauseDays,
    });

    // Scenario 3: Add income
    const incomeNeeded = Math.round(safeToSpendData.emergencyBuffer * 0.5);
    scenarios.push({
      action: "ADD_INCOME",
      description: `Add income of ₹${incomeNeeded}`,
      impact: "Unlock immediately",
      amountRequired: incomeNeeded,
    });

    return {
      scenarios,
      recommendation: scenarios[1], // Pause discretionary is usually best
    };
  }
}

module.exports = KillSwitchEngine;

