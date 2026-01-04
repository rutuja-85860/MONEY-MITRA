import express from "express";
import auth from "../middleware/auth.js";
import SafeToSpendEngine from "../services/SafeToSpendEngine.js";

const router = express.Router();

// PRIMARY CONTROL ENDPOINT
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const data = await SafeToSpendEngine.calculate(userId);
    res.json(data);
  } catch (error) {
    console.error("SafeToSpendEngine Error:", error);
    res.status(500).json({ msg: "Engine failure", error: error.message });
  }
});

// TRANSACTION VALIDATION ENDPOINT
router.post("/validate", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { amount, category, classification } = req.body;

    const validation = await SafeToSpendEngine.validateTransaction(
      userId,
      amount,
      category,
      classification
    );

    res.json(validation);
  } catch (error) {
    console.error("Validation Error:", error);
    res.status(500).json({ msg: "Validation failed", error: error.message });
  }
});

export default router;
