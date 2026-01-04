import FinancialConfig from "../models/FinancialConfig.js";
import Transaction from "../models/Transaction.js";

class SafeToSpendEngine {
  /**
   * ========================================
   * RESPONSIBILITY 1: REAL BALANCE AUTHORITY
   * ========================================
   */
  static async calculateRealBalance(userId) {
    const transactions = await Transaction.find({ userId });
    
    let balance = 0;
    transactions.forEach((t) => {
      if (t.aiClassification === "Income") {
        balance += Math.abs(t.amount);
      } else {
        balance -= Math.abs(t.amount);
      }
    });

    return Math.round(balance);
  }

  /**
   * ========================================
   * RESPONSIBILITY 2: MONTHLY INCOME INTELLIGENCE
   * ========================================
   */
  static async calculateIncomeIntelligence(userId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const incomeTransactions = await Transaction.find({
      userId,
      aiClassification: "Income",
      date: { $gte: threeMonthsAgo },
    });

    if (incomeTransactions.length === 0) {
      return {
        avgMonthlyIncome: 0,
        incomeVolatility: 0,
        incomeCoverageRatio: 0,
        incomeSeverity: "CRITICAL",
        incomeAlert: "No income detected in last 3 months",
      };
    }

    // Group by active income months only
    const monthlyIncomes = {};
    incomeTransactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${String(
        t.date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyIncomes[monthKey] = (monthlyIncomes[monthKey] || 0) + Math.abs(t.amount);
    });

    const incomeValues = Object.values(monthlyIncomes);
    const avgMonthlyIncome = Math.round(
      incomeValues.reduce((sum, val) => sum + val, 0) / incomeValues.length
    );

    // Calculate volatility
    const variance =
      incomeValues.reduce(
        (sum, val) => sum + Math.pow(val - avgMonthlyIncome, 2),
        0
      ) / incomeValues.length;
    const incomeVolatility = Math.round(
      (Math.sqrt(variance) / avgMonthlyIncome) * 100
    );

    return {
      avgMonthlyIncome,
      incomeVolatility,
      activeIncomeMonths: incomeValues.length,
    };
  }

  /**
   * ========================================
   * RESPONSIBILITY 3: INCOME COVERAGE RATIO
   * ========================================
   */
  static calculateIncomeCoverageRatio(config, avgMonthlyIncome) {
    const totalFixedObligations = config.fixedObligations.reduce(
      (sum, ob) => sum + ob.amount,
      0
    );

    if (avgMonthlyIncome === 0) {
      return {
        incomeCoverageRatio: 0,
        incomeSeverity: "CRITICAL",
        incomeAlert: "No income to cover fixed obligations",
      };
    }

    const ratio = avgMonthlyIncome / totalFixedObligations;

    let severity = "SAFE";
    let alert = null;

    if (ratio < 1.0) {
      severity = "CRITICAL";
      alert = `Income does NOT cover fixed obligations. Shortfall: ₹${Math.round(
        totalFixedObligations - avgMonthlyIncome
      ).toLocaleString()}`;
    } else if (ratio < 1.2) {
      severity = "WARNING";
      alert = `Income barely covers fixed obligations. Buffer: ₹${Math.round(
        avgMonthlyIncome - totalFixedObligations
      ).toLocaleString()}`;
    }

    return {
      incomeCoverageRatio: parseFloat(ratio.toFixed(2)),
      incomeSeverity: severity,
      incomeAlert: alert,
    };
  }

  /**
   * ========================================
   * RESPONSIBILITY 4: FUTURE CASH EXHAUSTION
   * ========================================
   */
  static async predictCashExhaustion(userId, currentBalance) {
    if (currentBalance <= 0) {
      return {
        daysUntilExhaustion: 0,
        exhaustionDate: new Date(),
        exhaustionSeverity: "CRITICAL",
        exhaustionAlert: "Balance is already at or below zero",
        requiredDailyReduction: null,
      };
    }

    // Get last 30 days spending
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = await Transaction.find({
      userId,
      date: { $gte: thirtyDaysAgo },
      aiClassification: { $ne: "Income" },
    });

    const totalSpent = recentExpenses.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    const avgDailySpending = totalSpent / 30;

    if (avgDailySpending === 0) {
      return {
        daysUntilExhaustion: Infinity,
        exhaustionDate: null,
        exhaustionSeverity: "SAFE",
        exhaustionAlert: null,
        requiredDailyReduction: 0,
      };
    }

    const daysUntilExhaustion = Math.floor(currentBalance / avgDailySpending);
    const exhaustionDate = new Date();
    exhaustionDate.setDate(exhaustionDate.getDate() + daysUntilExhaustion);

    let severity = "SAFE";
    let alert = null;
    let requiredReduction = 0;

    if (daysUntilExhaustion <= 7) {
      severity = "CRITICAL";
      const safeDaily = currentBalance / 30; // Extend to 30 days
      requiredReduction = Math.round(avgDailySpending - safeDaily);
      alert = `URGENT: Funds exhausted by ${exhaustionDate.toLocaleDateString()}. Daily spending must drop to ₹${Math.round(
        safeDaily
      )} (reduce by ₹${requiredReduction}).`;
    } else if (daysUntilExhaustion <= 15) {
      severity = "WARNING";
      alert = `WARNING: Balance will run out on ${exhaustionDate.toLocaleDateString()}. Reduce non-essential spending immediately.`;
    } else if (daysUntilExhaustion <= 30) {
      severity = "CAUTION";
      alert = `Your balance will last ${daysUntilExhaustion} days at current pace.`;
    }

    return {
      daysUntilExhaustion,
      exhaustionDate,
      exhaustionSeverity: severity,
      exhaustionAlert: alert,
      avgDailySpending: Math.round(avgDailySpending),
      requiredDailyReduction: requiredReduction,
    };
  }

  /**
   * ========================================
   * RESPONSIBILITY 5: SPENDING VELOCITY ENFORCEMENT
   * ========================================
   */
  static async detectSpendingVelocityBreach(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysElapsed = Math.max(
      1,
      Math.ceil((now - startOfMonth) / (1000 * 60 * 60 * 24))
    );

    const monthExpenses = await Transaction.find({
      userId,
      date: { $gte: startOfMonth },
      aiClassification: { $ne: "Income" },
    });

    const totalSpentThisMonth = monthExpenses.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    const currentDailySpend = totalSpentThisMonth / daysElapsed;

    return {
      currentDailySpend: Math.round(currentDailySpend),
      totalSpentThisMonth: Math.round(totalSpentThisMonth),
      daysElapsed,
    };
  }

  /**
   * ========================================
   * RESPONSIBILITY 6: BEHAVIORAL DRIFT DETECTION
   * ========================================
   * Uses trend signals as INPUT ONLY
   */
  static async detectBehavioralDrift(userId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: threeMonthsAgo },
    });

    if (transactions.length < 10) {
      return {
        riskStatus: "STABLE",
        penaltyFactor: 1.0,
        breachFlags: [],
        driftScore: 0,
      };
    }

    // Build monthly summaries
    const monthlyData = {};
    transactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${String(
        t.date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          income: 0,
          expenses: 0,
          nonEssential: 0,
        };
      }

      const amount = Math.abs(t.amount);
      if (t.aiClassification === "Income") {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
        if (t.aiClassification === "Non-Essential") {
          monthlyData[monthKey].nonEssential += amount;
        }
      }
    });

    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) {
      return {
        riskStatus: "STABLE",
        penaltyFactor: 1.0,
        breachFlags: [],
        driftScore: 0,
      };
    }

    const current = monthlyData[months[months.length - 1]];
    const previous = monthlyData[months[months.length - 2]];

    let driftScore = 0;
    const breachFlags = [];

    // FLAG 1: Non-essential spending surge
    if (previous.nonEssential > 0) {
      const nonEssentialGrowth =
        ((current.nonEssential - previous.nonEssential) /
          previous.nonEssential) *
        100;
      if (nonEssentialGrowth > 20) {
        driftScore += 35;
        breachFlags.push(
          `Non-essential spending surged ${Math.round(nonEssentialGrowth)}%`
        );
      }
    }

    // FLAG 2: Expense-to-income deterioration
    if (current.income > 0) {
      const expenseRatio = current.expenses / current.income;
      if (expenseRatio > 0.85) {
        driftScore += 30;
        breachFlags.push(
          `Spending ${Math.round(expenseRatio * 100)}% of income`
        );
      }
    }

    // FLAG 3: Overall spending acceleration
    if (previous.expenses > 0) {
      const totalGrowth =
        ((current.expenses - previous.expenses) / previous.expenses) * 100;
      if (totalGrowth > 15) {
        driftScore += 20;
        breachFlags.push(`Total spending increased ${Math.round(totalGrowth)}%`);
      }
    }

    // FLAG 4: Income decline + spending increase
    if (previous.income > 0) {
      const incomeChange = ((current.income - previous.income) / previous.income) * 100;
      const expenseChange =
        ((current.expenses - previous.expenses) / previous.expenses) * 100;
      if (incomeChange < -5 && expenseChange > 5) {
        driftScore += 25;
        breachFlags.push("Income decreased while spending increased");
      }
    }

    // Determine risk status and penalty
    let riskStatus = "STABLE";
    let penaltyFactor = 1.0;

    if (driftScore >= 60) {
      riskStatus = "DETERIORATING";
      penaltyFactor = 0.7; // 30% reduction
    } else if (driftScore >= 30) {
      riskStatus = "STABLE";
      penaltyFactor = 0.9; // 10% reduction
    } else {
      riskStatus = "IMPROVING";
      penaltyFactor = 1.0;
    }

    return {
      riskStatus,
      penaltyFactor,
      breachFlags,
      driftScore,
    };
  }

  /**
   * ========================================
   * RESPONSIBILITY 7: TIME-AWARE SAFE-TO-SPEND
   * ========================================
   */
  static calculateTimeAwareSafeToSpend(
    currentBalance,
    emergencyBuffer,
    upcomingExpenses,
    penaltyFactor
  ) {
    const now = new Date();
    const lastDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const remainingDays = Math.max(1, lastDayOfMonth - now.getDate() + 1);

    // Calculate available pool
    const availablePool = Math.max(
      0,
      currentBalance - emergencyBuffer - upcomingExpenses
    );

    // Apply behavioral penalty
    const adjustedPool = availablePool * penaltyFactor;

    // Calculate allowances
    const dailyAllowance = Math.round(adjustedPool / remainingDays);
    const monthlyRemaining = Math.round(adjustedPool);

    return {
      remainingSafeToSpend: monthlyRemaining,
      dailyAllowance,
      remainingDays,
      availablePool: Math.round(availablePool),
      adjustedPool: Math.round(adjustedPool),
    };
  }

  /**
   * ========================================
   * MAIN ENGINE: COMPLETE AUTHORITY
   * ========================================
   */
  static async calculate(userId) {
    console.log("🔥 SafeToSpendEngine: AUTHORITY MODE ACTIVATED");

    const config = await FinancialConfig.findOne({ userId });
    if (!config) {
      throw new Error("Financial config required. Complete onboarding.");
    }

    // STEP 1: Real Balance
    const currentBalance = await this.calculateRealBalance(userId);
    console.log("💰 Real Balance:", currentBalance);

    // STEP 2: Income Intelligence
    const incomeData = await this.calculateIncomeIntelligence(userId);
    console.log("📊 Avg Monthly Income:", incomeData.avgMonthlyIncome);

    // STEP 3: Income Coverage Ratio
    const incomeCoverage = this.calculateIncomeCoverageRatio(
      config,
      incomeData.avgMonthlyIncome
    );
    console.log("📈 Income Coverage:", incomeCoverage.incomeCoverageRatio);

    // STEP 4: Future Cash Exhaustion
    const exhaustion = await this.predictCashExhaustion(userId, currentBalance);
    console.log("⚠️ Days Until Exhaustion:", exhaustion.daysUntilExhaustion);

    // STEP 5: Spending Velocity
    const velocity = await this.detectSpendingVelocityBreach(userId);
    console.log("🚀 Current Daily Spend:", velocity.currentDailySpend);

    // STEP 6: Behavioral Drift
    const drift = await this.detectBehavioralDrift(userId);
    console.log("📉 Risk Status:", drift.riskStatus);

    // STEP 7: Calculate Emergency Buffer
    const emergencyBuffer =
      (incomeData.avgMonthlyIncome * config.emergencyBufferPercent) / 100;

    // STEP 8: Upcoming Expenses
    const today = new Date().getDate();
    const upcomingExpenses = config.fixedObligations
      .filter((ob) => ob.dueDate >= today)
      .reduce((sum, ob) => sum + ob.amount, 0);

    // STEP 9: Time-Aware Safe-to-Spend
    const safeToSpend = this.calculateTimeAwareSafeToSpend(
      currentBalance,
      emergencyBuffer,
      upcomingExpenses,
      drift.penaltyFactor
    );

    // STEP 10: Velocity Breach Detection
    const velocityBreach =
      velocity.currentDailySpend > safeToSpend.dailyAllowance;
    if (velocityBreach) {
      drift.breachFlags.push(
        `Daily spending (₹${velocity.currentDailySpend}) exceeds allowance (₹${safeToSpend.dailyAllowance})`
      );
    }

    // STEP 11: Compile All Alerts
    const alerts = [];

    if (incomeCoverage.incomeAlert) {
      alerts.push({
        severity: incomeCoverage.incomeSeverity,
        message: incomeCoverage.incomeAlert,
      });
    }

    if (exhaustion.exhaustionAlert) {
      alerts.push({
        severity: exhaustion.exhaustionSeverity,
        message: exhaustion.exhaustionAlert,
      });
    }

    if (velocityBreach) {
      alerts.push({
        severity: "WARNING",
        message: `Current daily spending (₹${velocity.currentDailySpend}) exceeds safe limit (₹${safeToSpend.dailyAllowance})`,
      });
    }

    // STEP 12: Actionable Advice
    const advice = [];

    if (exhaustion.requiredDailyReduction > 0) {
      advice.push(
        `Reduce daily spending by ₹${exhaustion.requiredDailyReduction} to extend balance to 30 days.`
      );
    }

    if (incomeCoverage.incomeCoverageRatio < 1.2) {
      advice.push(
        `Income does not adequately cover fixed expenses. Consider increasing income or reducing obligations.`
      );
    }

    if (drift.riskStatus === "DETERIORATING") {
      advice.push(
        `Spending patterns are deteriorating. Safe-to-Spend reduced by ${Math.round(
          (1 - drift.penaltyFactor) * 100
        )}% as protection.`
      );
    }

    console.log("✅ SafeToSpendEngine: COMPLETE");

    return {
      // PRIMARY OUTPUTS
      remainingSafeToSpend: safeToSpend.remainingSafeToSpend,
      dailyAllowance: safeToSpend.dailyAllowance,
      currentDailySpend: velocity.currentDailySpend,

      // PREDICTIONS
      daysUntilExhaustion: exhaustion.daysUntilExhaustion,
      exhaustionDate: exhaustion.exhaustionDate,

      // INCOME
      avgMonthlyIncome: incomeData.avgMonthlyIncome,
      incomeVolatility: incomeData.incomeVolatility,
      incomeCoverageRatio: incomeCoverage.incomeCoverageRatio,

      // RISK
      riskStatus: drift.riskStatus,
      breachFlags: drift.breachFlags,
      alerts,
      advice,

      // METADATA
      currentBalance,
      emergencyBuffer: Math.round(emergencyBuffer),
      upcomingExpenses: Math.round(upcomingExpenses),
      remainingDays: safeToSpend.remainingDays,
      penaltyFactor: drift.penaltyFactor,
      driftScore: drift.driftScore,
      calculatedAt: new Date(),
    };
  }

  /**
   * ========================================
   * RESPONSIBILITY 8: TRANSACTION VALIDATION
   * ========================================
   */
  static async validateTransaction(userId, amount, category, classification) {
    if (classification === "Income") {
      return {
        allowTransaction: true,
        warningLevel: "NONE",
        reason: "Income transactions are always allowed",
      };
    }

    const transactionAmount = Math.abs(amount);
    const engineData = await this.calculate(userId);

    // RULE 1: Exceeds daily allowance
    if (transactionAmount > engineData.dailyAllowance) {
      return {
        allowTransaction: false,
        warningLevel: "CRITICAL",
        reason: `Transaction (₹${transactionAmount}) exceeds daily allowance (₹${engineData.dailyAllowance})`,
        suggestedMaxAmount: engineData.dailyAllowance,
      };
    }

    // RULE 2: Would trigger exhaustion warning
    const newBalance = engineData.currentBalance - transactionAmount;
    const wouldTriggerExhaustion =
      newBalance / engineData.currentDailySpend <= 7;

    if (wouldTriggerExhaustion) {
      return {
        allowTransaction: true,
        warningLevel: "WARNING",
        reason: `This transaction will reduce your balance to ₹${Math.round(
          newBalance
        )}, triggering low balance warning`,
      };
    }

    // RULE 3: Large transaction relative to allowance
    if (transactionAmount > engineData.dailyAllowance * 2) {
      return {
        allowTransaction: true,
        warningLevel: "CAUTION",
        reason: `This is ${Math.round(
          transactionAmount / engineData.dailyAllowance
        )}x your daily allowance`,
      };
    }

    return {
      allowTransaction: true,
      warningLevel: "NONE",
      reason: "Transaction is within safe limits",
    };
  }
}

export default SafeToSpendEngine;
