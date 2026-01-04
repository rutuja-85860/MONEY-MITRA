const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// POST /api/onboarding - Complete user onboarding
router.post("/", auth, async (req, res) => {
  try {
    console.log("📝 Onboarding received");
    console.log("Body:", JSON.stringify(req.body, null, 2));

    // FRONTEND SENDS THESE NAMES
    let {
      incomeType,
      incomeAmount,        // ← Frontend name
      fixedExpenses,
      weeklyEssentials,
      monthlySavings,      // ← Frontend name
      hasLoans,
      loansAmount,
      primaryGoal,
    } = req.body;

    // Map frontend names to backend names
    const monthlyIncome = parseFloat(incomeAmount) || 0;
    const savingsGoal = parseFloat(monthlySavings) || 0;
    const fixedExpensesAmount = parseFloat(fixedExpenses) || 0;
    const weeklyEssentialsAmount = parseFloat(weeklyEssentials) || 0;
    const loansAmountValue = hasLoans ? parseFloat(loansAmount) || 0 : 0;

    console.log("💰 Parsed values:", {
      monthlyIncome,
      fixedExpensesAmount,
      weeklyEssentialsAmount,
      savingsGoal,
      loansAmountValue
    });

    // Validate income
    if (!monthlyIncome || monthlyIncome <= 0) {
      return res.status(400).json({ msg: "Valid monthly income is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Build fixed expenses array
    let expensesArray = [];
    
    if (fixedExpensesAmount > 0) {
      expensesArray.push({
        name: "Fixed Monthly Expenses",
        amount: fixedExpensesAmount,
        frequency: "monthly"
      });
    }

    if (loansAmountValue > 0) {
      expensesArray.push({
        name: "Loan/EMI",
        amount: loansAmountValue,
        frequency: "monthly"
      });
    }

    console.log("✅ Expenses array:", expensesArray);

    // Calculate totals
    const totalFixedExpenses = fixedExpensesAmount + loansAmountValue;
    const disposableIncome = Math.max(0, monthlyIncome - totalFixedExpenses);
    const savingsRate = savingsGoal && monthlyIncome > 0 
      ? (savingsGoal / monthlyIncome) * 100 
      : 0;
    
    console.log("💰 Calculations:", {
      monthlyIncome,
      totalFixedExpenses,
      disposableIncome,
      savingsRate: savingsRate.toFixed(2)
    });

    // Calculate health score
    let healthScore = 50;
    
    // Income vs expenses (max 30 points)
    if (disposableIncome > monthlyIncome * 0.5) {
      healthScore += 30;
    } else if (disposableIncome > monthlyIncome * 0.3) {
      healthScore += 20;
    } else if (disposableIncome > monthlyIncome * 0.1) {
      healthScore += 10;
    }
    
    // Savings rate (max 20 points)
    if (savingsRate >= 20) {
      healthScore += 20;
    } else if (savingsRate >= 10) {
      healthScore += 10;
    } else if (savingsRate >= 5) {
      healthScore += 5;
    }

    healthScore = Math.min(Math.max(Math.round(healthScore), 0), 100);
    console.log("📊 Health Score:", healthScore);

    // Calculate weekly budget
    const calculatedWeeklyBudget = Math.round(disposableIncome / 4);

    // Update user
    user.monthlyIncome = monthlyIncome;
    user.fixedExpenses = expensesArray;
    user.savingsGoal = savingsGoal;
    user.weeklyEssentials = weeklyEssentialsAmount;
    user.smartWeeklyBudget = calculatedWeeklyBudget;
    user.financialHealthScore = healthScore;
    user.onboardingDone = true;

    await user.save();
    console.log("✅ Saved successfully");

    // Create AI welcome message
    const groqWelcome = `Welcome, Strategist. Your financial profile has been initialized with a health score of ${healthScore}. You have ₹${calculatedWeeklyBudget.toLocaleString()} available weekly for flexible spending. Your ${primaryGoal.replace(/_/g, ' ')} objective is now active.`;

    res.json({
      msg: "Onboarding completed successfully",
      profile: {
        groqWelcome,
      },
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        onboardingDone: true,
        smartWeeklyBudget: user.smartWeeklyBudget,
        weeklyEssentials: user.weeklyEssentials,
        financialHealthScore: user.financialHealthScore,
        monthlyIncome: user.monthlyIncome,
        savingsGoal: user.savingsGoal,
      },
    });

  } catch (error) {
    console.error("❌ Onboarding error:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    res.status(500).json({ 
      msg: "Server error during onboarding", 
      error: error.message
    });
  }
});

// GET /api/onboarding/status
router.get("/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      onboardingDone: user.onboardingDone || false,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        onboardingDone: user.onboardingDone || false,
        smartWeeklyBudget: user.smartWeeklyBudget || 0,
        weeklyEssentials: user.weeklyEssentials || 0,
        financialHealthScore: user.financialHealthScore || 50,
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
