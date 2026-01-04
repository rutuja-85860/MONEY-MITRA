const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// GET /api/summary - Get dashboard summary
router.get("/", auth, async (req, res) => {
  try {
    console.log("📊 Summary endpoint hit for user:", req.user.id);

    const user = await User.findById(req.user.id);
    
    if (!user || !user.onboardingDone) {
      return res.status(404).json({ msg: "User not found or onboarding not completed" });
    }

    // Get current week transactions
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekTransactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: startOfWeek },
      direction: "DEBIT",
    });

    const spentThisWeek = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const safeToSpendWeekly = user.smartWeeklyBudget || 0;
    const remainingThisWeek = Math.max(0, safeToSpendWeekly - spentThisWeek);
    const daysRemainingInWeek = 7 - now.getDay();
    const safeToSpendDaily = daysRemainingInWeek > 0 
      ? Math.round(remainingThisWeek / daysRemainingInWeek) 
      : 0;

    // Calculate confidence level
    let confidence = "SAFE";
    let riskScore = 0;
    
    if (remainingThisWeek < safeToSpendWeekly * 0.2) {
      confidence = "RISK";
      riskScore = 80;
    } else if (remainingThisWeek < safeToSpendWeekly * 0.5) {
      confidence = "CAUTION";
      riskScore = 50;
    } else {
      riskScore = 20;
    }

    // ✨ GENERATE 7-DAY CASHFLOW FORECAST
    const generateForecast = async () => {
      // Get last 30 days spending to calculate average
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTransactions = await Transaction.find({
        userId: req.user.id,
        date: { $gte: thirtyDaysAgo },
        direction: "DEBIT",
      });

      const totalSpent = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const avgDailySpending = recentTransactions.length > 0 ? totalSpent / 30 : 200;

      console.log(`📈 Forecast calculation: ${recentTransactions.length} transactions, avg daily: ₹${avgDailySpending}`);

      // Start with current balance (estimated from monthly income)
      let currentBalance = user.monthlyIncome || 10000;
      
      // If we have recent credit transactions, use last known balance
      const recentCredits = await Transaction.find({
        userId: req.user.id,
        direction: "CREDIT",
      }).sort({ date: -1 }).limit(1);
      
      if (recentCredits.length > 0) {
        currentBalance = Math.abs(recentCredits[0].amount);
      }

      const forecast = [];
      let projectedBalance = currentBalance - spentThisWeek; // Subtract this week's spending

      for (let i = 1; i <= 7; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);

        // Decrease balance by average daily spending
        projectedBalance -= avgDailySpending;

        forecast.push({
          date: forecastDate.toISOString(),
          projectedBalance: Math.round(projectedBalance),
          day: i,
        });
      }

      // Determine risk level
      const minProjectedBalance = Math.min(...forecast.map(f => f.projectedBalance));
      let lowBalanceRisk = "Low";
      if (minProjectedBalance < 1000) lowBalanceRisk = "High";
      else if (minProjectedBalance < 3000) lowBalanceRisk = "Medium";

      // Determine spending pressure
      let spendingPressure = "Normal";
      if (avgDailySpending > safeToSpendDaily * 2) spendingPressure = "High Pressure";
      else if (avgDailySpending > safeToSpendDaily) spendingPressure = "Moderate";

      console.log(`✅ Forecast generated: ${forecast.length} days, risk: ${lowBalanceRisk}`);

      return {
        forecast,
        lowBalanceRisk,
        spendingPressure,
        upcomingBalance: forecast[6].projectedBalance, // 7th day balance
        avgDailySpending: Math.round(avgDailySpending),
      };
    };

    const cashflowForecast = await generateForecast();

    // Build dashboard data
    const dashboardData = {
      smartWeeklyBudget: user.smartWeeklyBudget,
      safeToSpendWeekly,
      safeToSpendDaily,
      weeklyEssentials: user.weeklyEssentials || 0,
      financialHealthScore: user.financialHealthScore || 75,
      
      cashflowForecast, // ✅ Now includes 7-day forecast array
      
      safeToSpendData: {
        safeToSpendWeekly,
        safeToSpendDaily,
        spentThisWeek,
        remainingThisWeek,
        daysRemainingInWeek,
        confidence,
        riskScore,
        reason: confidence === "SAFE" 
          ? "You're on track!" 
          : confidence === "CAUTION" 
          ? "Watch your spending" 
          : "Budget alert!",
        explanation: `You have ₹${Math.round(remainingThisWeek)} remaining for this week.`,
        breakdown: {
          currentBalance: user.monthlyIncome || 0,
          isEstimated: false,
          bufferAmount: Math.round(safeToSpendWeekly * 0.2),
          bufferPercentage: 20,
          upcomingExpenses: 0,
          disposableAmount: remainingThisWeek,
          spendingVelocity: safeToSpendWeekly > 0 
            ? Math.round((spentThisWeek / safeToSpendWeekly) * 100) 
            : 0,
          isOverspending: spentThisWeek > safeToSpendWeekly,
          daysRemainingInCycle: 30,
        },
      },
      
      aiCoachInsight: confidence === "SAFE"
        ? "Great job managing your finances! Keep up the good work."
        : confidence === "CAUTION"
        ? "You're spending faster than usual. Consider reviewing your expenses."
        : "Alert! You're over budget. Try to reduce non-essential spending.",
      
      personalizedNudge: `You have ₹${safeToSpendDaily} safe to spend today.`,
    };

    console.log("✅ Summary response prepared with forecast:", {
      forecastDays: cashflowForecast.forecast.length,
      riskLevel: cashflowForecast.lowBalanceRisk,
    });

    res.json({ dashboardData });
  } catch (error) {
    console.error("❌ Summary error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

module.exports = router;
