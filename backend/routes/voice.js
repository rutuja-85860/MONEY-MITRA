const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Multilingual translations
const translations = {
  en: {
    greeting: "Hello! Here is your financial advisory.",
    safeToSpend: "Your safe to spend amount today is",
    rupees: "rupees",
    spending: "You have spent",
    thisWeek: "this week",
    remaining: "You have",
    remainingText: "remaining for this week",
    healthScore: "Your financial health score is",
    advice: {
      good: "You are doing great! Keep up the good work.",
      warning: "Please be cautious with your spending.",
      critical: "Alert! You are overspending. Please reduce expenses immediately.",
    },
  },
  hi: {
    greeting: "नमस्ते! यह आपकी वित्तीय सलाह है।",
    safeToSpend: "आज आपकी सुरक्षित खर्च राशि है",
    rupees: "रुपये",
    spending: "आपने इस हफ्ते",
    thisWeek: "खर्च किया है",
    remaining: "आपके पास",
    remainingText: "इस हफ्ते के लिए शेष है",
    healthScore: "आपका वित्तीय स्वास्थ्य स्कोर है",
    advice: {
      good: "आप बहुत अच्छा कर रहे हैं! यही करते रहें।",
      warning: "कृपया अपने खर्च के साथ सावधान रहें।",
      critical: "चेतावनी! आप अधिक खर्च कर रहे हैं। कृपया तुरंत खर्च कम करें।",
    },
  },
  mr: {
    greeting: "नमस्कार! ही तुमची आर्थिक सल्ला आहे।",
    safeToSpend: "आज तुमची सुरक्षित खर्च रक्कम आहे",
    rupees: "रुपये",
    spending: "तुम्ही या आठवड्यात",
    thisWeek: "खर्च केले आहेत",
    remaining: "तुमच्याकडे",
    remainingText: "या आठवड्यासाठी शिल्लक आहे",
    healthScore: "तुमचा आर्थिक आरोग्य स्कोअर आहे",
    advice: {
      good: "तुम्ही छान करत आहात! असेच चालू ठेवा।",
      warning: "कृपया तुमच्या खर्चाबाबत सावध रहा।",
      critical: "सावधान! तुम्ही जास्त खर्च करत आहात. कृपया ताबडतोब खर्च कमी करा।",
    },
  },
};

// Helper function
const t = (lang, key, subkey = null) => {
  const langData = translations[lang] || translations.en;
  if (subkey) {
    return langData[key]?.[subkey] || translations.en[key]?.[subkey] || "";
  }
  return langData[key] || translations.en[key] || "";
};

// GET /api/voice/advisory
router.get("/advisory", auth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const user = await User.findById(req.user.id);

    if (!user || !user.onboardingDone) {
      return res.status(404).json({ msg: "User profile not found" });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekTransactions = await Transaction.find({
      user: req.user.id,
      date: { $gte: startOfWeek },
      type: "expense",
    });

    const spentThisWeek = weekTransactions.reduce((sum, t) => sum + t.amount, 0);
    const safeToSpendWeekly = user.smartWeeklyBudget || 0;
    const safeToSpendDaily = Math.round(safeToSpendWeekly / 7);
    const remaining = Math.max(0, safeToSpendWeekly - spentThisWeek);
    const healthScore = user.financialHealthScore || 50;

    let severity = "INFO";
    let adviceKey = "good";
    if (remaining < safeToSpendWeekly * 0.2) {
      severity = "CRITICAL";
      adviceKey = "critical";
    } else if (remaining < safeToSpendWeekly * 0.5) {
      severity = "WARNING";
      adviceKey = "warning";
    }

    const sections = [
      {
        type: "GREETING",
        severity: "INFO",
        text: t(lang, "greeting"),
      },
      {
        type: "SAFE_TO_SPEND",
        severity: "INFO",
        text: `${t(lang, "safeToSpend")} ${safeToSpendDaily} ${t(lang, "rupees")}.`,
      },
      {
        type: "SPENDING_STATUS",
        severity: spentThisWeek > safeToSpendWeekly * 0.8 ? "WARNING" : "INFO",
        text: `${t(lang, "spending")} ${Math.round(spentThisWeek)} ${t(lang, "rupees")} ${t(lang, "thisWeek")}.`,
      },
      {
        type: "REMAINING_BUDGET",
        severity,
        text: `${t(lang, "remaining")} ${Math.round(remaining)} ${t(lang, "rupees")} ${t(lang, "remainingText")}.`,
      },
      {
        type: "HEALTH_SCORE",
        severity: healthScore < 40 ? "WARNING" : "INFO",
        text: `${t(lang, "healthScore")} ${healthScore}.`,
      },
      {
        type: "ADVICE",
        severity,
        text: t(lang, "advice", adviceKey),
      },
    ];

    res.json({ sections, lang });
  } catch (error) {
    console.error("Voice advisory error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// GET /api/voice/query
router.get("/query", auth, async (req, res) => {
  try {
    const { lang = "en", query } = req.query;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const lowerQuery = query.toLowerCase();
    let response = "";

    if (lowerQuery.includes("spend") || lowerQuery.includes("today")) {
      const safeToSpendDaily = Math.round((user.smartWeeklyBudget || 0) / 7);
      response = `${t(lang, "safeToSpend")} ${safeToSpendDaily} ${t(lang, "rupees")}.`;
    } else if (lowerQuery.includes("health") || lowerQuery.includes("score")) {
      const healthScore = user.financialHealthScore || 50;
      response = `${t(lang, "healthScore")} ${healthScore}.`;
    } else if (lowerQuery.includes("balance") || lowerQuery.includes("remaining")) {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const weekTransactions = await Transaction.find({
        user: req.user.id,
        date: { $gte: startOfWeek },
        type: "expense",
      });

      const spentThisWeek = weekTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = Math.max(0, (user.smartWeeklyBudget || 0) - spentThisWeek);
      response = `${t(lang, "remaining")} ${Math.round(remaining)} ${t(lang, "rupees")} ${t(lang, "remainingText")}.`;
    } else {
      response =
        lang === "hi"
          ? "मुझे खेद है, मैं यह समझ नहीं पाया। कृपया फिर से पूछें।"
          : lang === "mr"
          ? "मला माफ करा, मला ते समजले नाही. कृपया पुन्हा विचारा."
          : "I'm sorry, I didn't understand that. Please ask again.";
    }

    res.json({ response, lang });
  } catch (error) {
    console.error("Voice query error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

module.exports = router;

