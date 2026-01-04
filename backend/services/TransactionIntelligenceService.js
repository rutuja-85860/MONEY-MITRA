import Transaction from "../models/Transaction.js";
import Profile from "../models/Profile.js";

/**
 * TRANSACTION INTELLIGENCE SERVICE
 * Provides financial context for each transaction
 */
class TransactionIntelligenceService {
  
  /**
   * Calculate balance snapshot from transaction history
   */
  static async calculateBalanceSnapshot(userId, currentTransactionDate) {
    const profile = await Profile.findOne({ userId });
    if (!profile) return 0;

    // Get last known balance or start from income
    const previousTransactions = await Transaction.find({
      userId,
      date: { $lt: currentTransactionDate },
    }).sort({ date: -1 });

    let balance = profile.incomeAmount || 0;

    // Calculate balance from transaction history
    previousTransactions.forEach((t) => {
      if (t.direction === "CREDIT") {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
    });

    return Math.max(0, balance);
  }

  /**
   * Analyze spending velocity (last 7-14 days)
   */
  static async analyzeSpendingVelocity(userId, currentAmount) {
    const lookbackDays = 14;
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    const recentTransactions = await Transaction.find({
      userId,
      date: { $gte: lookbackDate },
      direction: "DEBIT",
    });

    if (recentTransactions.length < 3) {
      return { impact: "LOW", averageDaily: 0, acceleration: 1 };
    }

    // Calculate daily average
    const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averageDaily = totalSpent / lookbackDays;

    // Calculate recent 7-day average vs full 14-day average
    const last7DaysDate = new Date();
    last7DaysDate.setDate(last7DaysDate.getDate() - 7);
    
    const last7DaysTransactions = recentTransactions.filter(
      (t) => t.date >= last7DaysDate
    );
    const last7DaysSpent = last7DaysTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const last7DaysAverage = last7DaysSpent / 7;

    // Acceleration factor
    const acceleration = averageDaily > 0 ? last7DaysAverage / averageDaily : 1;

    // Determine impact
    let impact = "LOW";
    if (currentAmount > averageDaily * 2) {
      impact = "HIGH"; // Spending more than 2x daily average
    } else if (currentAmount > averageDaily * 1.5 || acceleration > 1.3) {
      impact = "MEDIUM";
    }

    return {
      impact,
      averageDaily: Math.round(averageDaily),
      acceleration: Math.round(acceleration * 100) / 100,
      isAccelerating: acceleration > 1.2,
    };
  }

  /**
   * Detect recurring transaction patterns
   */
  static async detectRecurringPattern(userId, transaction) {
    const { amount, category, description } = transaction;

    // Look for similar transactions in the past 90 days
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - 90);

    const similarTransactions = await Transaction.find({
      userId,
      category,
      date: { $gte: lookbackDate, $ne: transaction.date },
      amount: {
        $gte: amount * 0.9, // Within 10% of amount
        $lte: amount * 1.1,
      },
    });

    if (similarTransactions.length === 0) {
      return {
        isRecurring: false,
        frequency: "",
        matchCount: 0,
      };
    }

    // Check date patterns
    const dates = similarTransactions.map((t) => t.date);
    dates.push(transaction.date);
    dates.sort((a, b) => a - b);

    // Calculate average days between transactions
    let totalDaysBetween = 0;
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = Math.abs(
        (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)
      );
      totalDaysBetween += daysDiff;
    }

    const avgDaysBetween = totalDaysBetween / (dates.length - 1);

    // Determine frequency
    let frequency = "";
    let isRecurring = false;

    if (avgDaysBetween >= 6 && avgDaysBetween <= 8) {
      frequency = "weekly";
      isRecurring = true;
    } else if (avgDaysBetween >= 28 && avgDaysBetween <= 32) {
      frequency = "monthly";
      isRecurring = true;
    } else if (avgDaysBetween >= 88 && avgDaysBetween <= 95) {
      frequency = "quarterly";
      isRecurring = true;
    }

    return {
      isRecurring: isRecurring && similarTransactions.length >= 2,
      frequency,
      matchCount: similarTransactions.length,
      lastDetectedDate: new Date(),
    };
  }

  /**
   * Calculate Safe-to-Spend impact of this transaction
   */
  static async calculateSafeToSpendImpact(userId, transaction) {
    const profile = await Profile.findOne({ userId });
    if (!profile || !profile.safeToSpendData) return 0;

    const { safeToSpendWeekly } = profile.safeToSpendData;
    
    if (safeToSpendWeekly === 0) return 0;

    // Calculate percentage impact
    const impactPercentage = (transaction.amount / safeToSpendWeekly) * 100;
    
    return Math.round(impactPercentage * 10) / 10; // Round to 1 decimal
  }

  /**
   * MAIN ENRICHMENT FUNCTION
   * Add intelligence to a transaction before saving
   */
  static async enrichTransaction(userId, transactionData) {
    // Determine direction
    const direction = transactionData.amount < 0 ? "CREDIT" : "DEBIT";

    // Calculate balance snapshot
    const balanceSnapshot = await this.calculateBalanceSnapshot(
      userId,
      transactionData.date || new Date()
    );

    // Analyze spending velocity (only for debits)
    let velocityData = { impact: "LOW", averageDaily: 0, acceleration: 1 };
    if (direction === "DEBIT") {
      velocityData = await this.analyzeSpendingVelocity(
        userId,
        Math.abs(transactionData.amount)
      );
    }

    // Detect recurring patterns
    const recurringData = await this.detectRecurringPattern(
      userId,
      transactionData
    );

    return {
      ...transactionData,
      direction,
      balanceSnapshot,
      spendingVelocityImpact: velocityData.impact,
      isRecurringDetected: recurringData.isRecurring,
      recurringMetadata: {
        frequency: recurringData.frequency,
        lastDetectedDate: recurringData.lastDetectedDate,
        matchCount: recurringData.matchCount,
      },
    };
  }

  /**
   * Generate enhanced transaction nudge with intelligence
   */
  static async generateIntelligentNudge(transaction, safeToSpendData) {
    const velocityContext = transaction.spendingVelocityImpact;
    const isRecurring = transaction.isRecurringDetected;
    const impact = transaction.safeToSpendImpact;

    let contextualInfo = [];

    // Add velocity warning
    if (velocityContext === "HIGH") {
      contextualInfo.push("⚡ You're spending faster than usual");
    } else if (velocityContext === "MEDIUM") {
      contextualInfo.push("👀 Spending rate is elevated");
    }

    // Add recurring detection
    if (isRecurring) {
      contextualInfo.push(
        `🔄 Recurring ${transaction.recurringMetadata.frequency} expense detected`
      );
    }

    // Add impact info
    if (impact > 20) {
      contextualInfo.push(
        `📉 This reduced your weekly safe budget by ${Math.round(impact)}%`
      );
    }

    const baseMessage = `You spent ₹${transaction.amount.toLocaleString()}. Remaining this week: ₹${safeToSpendData.remainingThisWeek.toLocaleString()}.`;

    if (contextualInfo.length > 0) {
      return `${baseMessage} ${contextualInfo.join(". ")}.`;
    }

    return baseMessage;
  }

  /**
   * Get upcoming recurring expenses (for Safe-to-Spend forecasting)
   */
  static async getUpcomingRecurringExpenses(userId, daysAhead = 30) {
    const recurringTransactions = await Transaction.find({
      userId,
      isRecurringDetected: true,
      "recurringMetadata.frequency": { $ne: "" },
    }).sort({ date: -1 });

    const upcomingExpenses = [];
    const today = new Date();

    recurringTransactions.forEach((t) => {
      const frequency = t.recurringMetadata.frequency;
      let nextDate = new Date(t.date);

      // Calculate next occurrence
      if (frequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (frequency === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (frequency === "quarterly") {
        nextDate.setMonth(nextDate.getMonth() + 3);
      }

      // If next occurrence is within forecast window
      const daysUntil = Math.ceil(
        (nextDate - today) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil > 0 && daysUntil <= daysAhead) {
        upcomingExpenses.push({
          amount: t.amount,
          description: t.description,
          category: t.category,
          daysUntil,
          nextDate,
        });
      }
    });

    return upcomingExpenses;
  }
}

export default TransactionIntelligenceService;
