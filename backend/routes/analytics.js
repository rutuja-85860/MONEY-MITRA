const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");

// GET /api/analytics/income-expense
router.get("/income-expense", auth, async (req, res) => {
  try {
    const { timeframe = "month" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Calculate totals
    const income = transactions.filter((t) => t.direction === "CREDIT");
    const expenses = transactions.filter((t) => t.direction === "DEBIT");

    const totalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    // Monthly breakdown
    const monthlyData = {};
    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expenses: 0 };
      }
      if (t.direction === "CREDIT") {
        monthlyData[month].income += Math.abs(t.amount);
      } else {
        monthlyData[month].expenses += Math.abs(t.amount);
      }
    });

    const monthlyDataArray = Object.values(monthlyData);

    // Category breakdown
    const categoryMap = {};
    expenses.forEach((t) => {
      const category = t.category || "Uncategorized";
      categoryMap[category] = (categoryMap[category] || 0) + Math.abs(t.amount);
    });

    const categoryBreakdown = Object.keys(categoryMap).map((name) => ({
      name,
      value: categoryMap[name],
    }));

    res.json({
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netSavings: Math.round(netSavings),
      savingsRate: parseFloat(savingsRate),
      incomeCount: income.length,
      expenseCount: expenses.length,
      monthlyData: monthlyDataArray,
      categoryBreakdown,
    });
  } catch (error) {
    console.error("❌ Analytics error:", error);
    res.status(500).json({ msg: "Error fetching analytics", error: error.message });
  }
});

module.exports = router;
