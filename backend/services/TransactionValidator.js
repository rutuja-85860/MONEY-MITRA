import SafeToSpendEngine from "./SafeToSpendEngine.js";
import FinancialConfig from "../models/FinancialConfig.js";
import Transaction from "../models/Transaction.js";

class TransactionValidator {
  /**
   * Validate transaction before saving
   */
  static async validate(userId, amount, category, classification) {
    if (classification === "Income") {
      return {
        allowTransaction: true,
        warningLevel: "NONE",
        reason: "Income transactions are always allowed.",
        suggestedMaxAmount: null,
      };
    }

    const transactionAmount = Math.abs(amount);

    // Get Safe-to-Spend data
    const safeToSpend = await SafeToSpendEngine.calculate(userId);

    // Check 1: Daily limit
    if (transactionAmount > safeToSpend.dailySafeToSpend) {
      return {
        allowTransaction: false,
        warningLevel: "CRITICAL",
        reason: `This transaction (₹${transactionAmount}) exceeds your daily Safe-to-Spend limit (₹${safeToSpend.dailySafeToSpend}).`,
        suggestedMaxAmount: safeToSpend.dailySafeToSpend,
      };
    }

    // Check 2: Category overspend
    const config = await FinancialConfig.findOne({ userId });
    const categoryLimit = config?.categoryLimits?.get(category) || 40;

    // Get current month spending for this category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const categoryTransactions = await Transaction.find({
      userId,
      category,
      date: { $gte: startOfMonth },
    });

    const categorySpent = categoryTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    const totalMonthSpent = await Transaction.find({
      userId,
      date: { $gte: startOfMonth },
      aiClassification: { $ne: "Income" },
    }).then((txs) => txs.reduce((sum, t) => sum + Math.abs(t.amount), 0));

    const newCategoryTotal = categorySpent + transactionAmount;
    const newTotalSpent = totalMonthSpent + transactionAmount;
    const categoryShare = (newCategoryTotal / newTotalSpent) * 100;

    if (categoryShare > categoryLimit) {
      return {
        allowTransaction: true, // Warning but allow
        warningLevel: "WARNING",
        reason: `Adding this will push ${category} to ${Math.round(categoryShare)}% of spending (limit: ${categoryLimit}%).`,
        suggestedMaxAmount: null,
      };
    }

    // Check 3: Large transaction warning
    if (transactionAmount > safeToSpend.dailySafeToSpend * 2) {
      return {
        allowTransaction: true,
        warningLevel: "WARNING",
        reason: `This is ${Math.round(transactionAmount / safeToSpend.dailySafeToSpend)}x your daily safe limit. Proceed with caution.`,
        suggestedMaxAmount: null,
      };
    }

    // All good
    return {
      allowTransaction: true,
      warningLevel: "NONE",
      reason: "Transaction is within safe limits.",
      suggestedMaxAmount: null,
    };
  }
}

export default TransactionValidator;
