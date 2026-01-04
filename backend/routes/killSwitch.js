const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const SafeToSpendEngine = require("../services/SafeToSpendEngine");
const RiskEngine = require("../services/RiskEngine");
const KillSwitchEngine = require("../services/KillSwitchEngine");
const Transaction = require("../models/Transaction");

/**
 * GET /api/kill-switch/status
 * Returns current financial control status
 */
router.get("/status", auth, async (req, res) => {
  try {
    // 1. Calculate Safe-to-Spend
    const safeToSpend = await SafeToSpendEngine.calculate(req.user.id);

    // 2. Calculate Risk Score
    const riskData = await RiskEngine.calculateRiskScore(req.user.id, safeToSpend);

    // 3. Determine Kill-Switch Level
    const killSwitchLevel = KillSwitchEngine.getKillSwitchLevel(riskData.riskScore);

    // 4. Get blocked categories
    const blockedCategories = killSwitchLevel === "RED" || killSwitchLevel === "ORANGE"
      ? ["Entertainment", "Shopping", "Dining", "Travel"]
      : [];

    res.json({
      success: true,
      data: {
        safeToSpend,
        risk: riskData,
        killSwitch: {
          level: killSwitchLevel,
          blockedCategories,
          active: killSwitchLevel !== "GREEN",
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Kill-Switch status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/kill-switch/validate
 * Validate transaction before saving
 */
router.post("/validate", auth, async (req, res) => {
  try {
    const { amount, category, type, description } = req.body;

    // 1. Get current status
    const safeToSpend = await SafeToSpendEngine.calculate(req.user.id);
    const riskData = await RiskEngine.calculateRiskScore(req.user.id, safeToSpend);

    // 2. Validate transaction
    const validation = await KillSwitchEngine.validateTransaction(
      req.user.id,
      { amount, category, type, description },
      safeToSpend,
      riskData.riskScore
    );

    res.json({
      success: true,
      validation,
      canProceed: validation.allowed,
    });
  } catch (error) {
    console.error("Transaction validation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/kill-switch/simulate-recovery
 * Simulate recovery scenarios
 */
router.post("/simulate-recovery", auth, async (req, res) => {
  try {
    const safeToSpend = await SafeToSpendEngine.calculate(req.user.id);
    const riskData = await RiskEngine.calculateRiskScore(req.user.id, safeToSpend);

    const recovery = await KillSwitchEngine.simulateRecovery(
      req.user.id,
      safeToSpend,
      riskData.riskScore
    );

    res.json({
      success: true,
      recovery,
      currentRisk: riskData.riskScore,
      killSwitchLevel: KillSwitchEngine.getKillSwitchLevel(riskData.riskScore),
    });
  } catch (error) {
    console.error("Recovery simulation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
