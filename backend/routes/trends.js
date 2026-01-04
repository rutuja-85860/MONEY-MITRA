const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");

// GET /api/trends/heatmap - Get spending trends
router.get("/heatmap", auth, async (req, res) => {
  try {
    console.log("📊 Fetching heatmap for user:", req.user.id);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setDate(1);
    threeMonthsAgo.setHours(0, 0, 0, 0);

    console.log("📅 Query date range: From", threeMonthsAgo.toISOString(), "to now");

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: threeMonthsAgo },
    }).sort({ date: 1 });

    console.log(`✅ Found ${transactions.length} transactions`);

    // 🔍 DEBUG: Show all transaction dates
    if (transactions.length > 0) {
      console.log("📅 Transaction dates found:");
      transactions.forEach((t, idx) => {
        console.log(`  ${idx + 1}. ${new Date(t.date).toISOString()} - ${t.category} - ₹${t.amount} - ${t.aiClassification}`);
      });
    } else {
      console.log("⚠️ No transactions found in date range");
    }

    if (transactions.length === 0) {
      return res.json({
        heatmap: [],
        moMChange: null,
        dailyVelocity: null,
        expenseIncomeRatio: null,
        topCategory: null,
        metadata: {
          monthsAnalyzed: 0,
          totalTransactions: 0,
        },
      });
    }

    // Build monthly data
    const monthlyData = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          totalSpending: 0,
          essentialSpending: 0,
          nonEssentialSpending: 0,
          income: 0,
          categorySpending: {},
          daysInMonth: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
        };
      }

      const amount = Math.abs(t.amount);

      if (t.direction === "CREDIT" || t.aiClassification === "Income") {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].totalSpending += amount;

        if (t.aiClassification === "Essential") {
          monthlyData[monthKey].essentialSpending += amount;
        } else if (t.aiClassification === "Non-Essential") {
          monthlyData[monthKey].nonEssentialSpending += amount;
        } else {
          // Default to non-essential if classification is missing
          monthlyData[monthKey].nonEssentialSpending += amount;
        }

        const category = t.category || "Uncategorized";
        monthlyData[monthKey].categorySpending[category] =
          (monthlyData[monthKey].categorySpending[category] || 0) + amount;
      }
    });

    const months = Object.keys(monthlyData).sort();
    
    // 🔍 DEBUG: Show monthly breakdown
    console.log(`📊 Months with data: ${months.length} months`);
    months.forEach((month) => {
      console.log(`  ${month}:`);
      console.log(`    Total Spending: ₹${monthlyData[month].totalSpending}`);
      console.log(`    Essential: ₹${monthlyData[month].essentialSpending}`);
      console.log(`    Non-Essential: ₹${monthlyData[month].nonEssentialSpending}`);
      console.log(`    Income: ₹${monthlyData[month].income}`);
    });

    const heatmapArray = months.map((key) => ({
      monthKey: key,
      Essential: Math.round(monthlyData[key].essentialSpending),
      NonEssential: Math.round(monthlyData[key].nonEssentialSpending),
      Income: Math.round(monthlyData[key].income),
      totalSpending: Math.round(monthlyData[key].totalSpending),
    }));

    // Calculate MoM change
    let moMChange = null;
    if (months.length >= 2) {
      const current = monthlyData[months[months.length - 1]];
      const previous = monthlyData[months[months.length - 2]];

      const calcChange = (curr, prev) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      moMChange = {
        total: parseFloat(calcChange(current.totalSpending, previous.totalSpending).toFixed(1)),
        essential: parseFloat(calcChange(current.essentialSpending, previous.essentialSpending).toFixed(1)),
        nonEssential: parseFloat(calcChange(current.nonEssentialSpending, previous.nonEssentialSpending).toFixed(1)),
        income: parseFloat(calcChange(current.income, previous.income).toFixed(1)),
      };

      console.log("✅ MoM Change calculated:", moMChange);
    } else {
      console.log(`⚠️ Not enough months for MoM comparison. Need 2+, found: ${months.length}`);
    }

    // Daily velocity
    let dailyVelocity = null;
    if (months.length >= 2) {
      const current = monthlyData[months[months.length - 1]];
      const previous = monthlyData[months[months.length - 2]];

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysElapsed = Math.max(1, Math.ceil((now - currentMonthStart) / (1000 * 60 * 60 * 24)));

      dailyVelocity = {
        current: Math.round(current.totalSpending / daysElapsed),
        previous: Math.round(previous.totalSpending / previous.daysInMonth),
        changePercent: parseFloat(
          (((current.totalSpending / daysElapsed - previous.totalSpending / previous.daysInMonth) /
            (previous.totalSpending / previous.daysInMonth)) * 100).toFixed(1)
        ),
      };

      console.log("✅ Daily velocity calculated:", dailyVelocity);
    } else {
      console.log(`⚠️ Not enough months for velocity. Need 2+, found: ${months.length}`);
    }

    // Expense-to-income ratio
    let expenseIncomeRatio = null;
    const currentMonthData = monthlyData[months[months.length - 1]];
    if (currentMonthData && currentMonthData.income > 0) {
      expenseIncomeRatio = parseFloat((currentMonthData.totalSpending / currentMonthData.income).toFixed(2));
    }

    // Top category
    let topCategory = null;
    if (currentMonthData && currentMonthData.totalSpending > 0) {
      const categories = currentMonthData.categorySpending;
      if (Object.keys(categories).length > 0) {
        const topCategoryName = Object.keys(categories).reduce((a, b) =>
          categories[a] > categories[b] ? a : b
        );
        const topCategoryAmount = categories[topCategoryName];

        topCategory = {
          name: topCategoryName,
          amount: Math.round(topCategoryAmount),
          share: Math.round((topCategoryAmount / currentMonthData.totalSpending) * 100),
        };
      }
    }

    console.log("✅ Heatmap data prepared successfully");

    res.json({
      heatmap: heatmapArray,
      moMChange,
      dailyVelocity,
      expenseIncomeRatio,
      topCategory,
      metadata: {
        monthsAnalyzed: months.length,
        totalTransactions: transactions.length,
        dateRange: {
          from: threeMonthsAgo.toISOString().split("T")[0],
          to: new Date().toISOString().split("T")[0],
        },
      },
    });
  } catch (error) {
    console.error("❌ Trends error:", error);
    res.status(500).json({ msg: "Error calculating trends", error: error.message });
  }
});

module.exports = router;
