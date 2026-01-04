const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const multer = require("multer");
const SafeToSpendEngine = require("../services/SafeToSpendEngine");
const RiskEngine = require("../services/RiskEngine");
const KillSwitchEngine = require("../services/KillSwitchEngine");

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET /api/transactions - Get all transactions for user
router.get("/", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/transactions - Create new transaction with KILL-SWITCH ENFORCEMENT
router.post("/", auth, async (req, res) => {
  try {
    const { amount, description, category, date, direction, aiClassification, type } = req.body;
    
    // Determine direction from type if provided
    const txDirection = direction || (type === 'income' ? 'CREDIT' : 'DEBIT');
    const txAmount = parseFloat(amount);
    const txCategory = category || "Uncategorized";
    const txClassification = aiClassification || "Non-Essential";

    // ===================================
    // 🔥 KILL-SWITCH ENFORCEMENT START
    // ===================================
    
    // ONLY enforce on DEBIT (expenses)
    if (txDirection === 'DEBIT') {
      console.log("🛡️ Kill-Switch: Validating transaction...");

      try {
        // Step 1: Calculate Safe-to-Spend
        const safeToSpendData = await SafeToSpendEngine.calculate(req.user.id);

        // Step 2: Calculate Risk Score
        const riskData = await RiskEngine.calculateRiskScore(req.user.id, safeToSpendData);

        // Step 3: Validate with Kill-Switch
        const validation = await KillSwitchEngine.validateTransaction(
          req.user.id,
          {
            amount: txAmount,
            category: txCategory,
            type: txDirection === 'CREDIT' ? 'income' : 'expense',
            aiClassification: txClassification,
          },
          safeToSpendData,
          riskData.riskScore
        );

        console.log("🛡️ Kill-Switch Validation Result:", validation.status);

        // BLOCK if not allowed
        if (!validation.allowed) {
          console.log("🚫 Transaction BLOCKED by Kill-Switch");
          return res.status(403).json({
            success: false,
            blocked: true,
            validation,
            killSwitch: {
              level: validation.level,
              reason: validation.reason,
              severity: validation.severity,
              recovery: validation.recovery,
            },
            message: "Transaction blocked by financial kill-switch",
          });
        }

        // If WARNING, attach to response but allow
        if (validation.status === "WARNING") {
          req.killSwitchWarning = validation;
          console.log("⚠️ Transaction ALLOWED with WARNING");
        }

      } catch (killSwitchError) {
        console.error("❌ Kill-Switch Error:", killSwitchError);
        // Don't block transaction if kill-switch fails, but log it
        console.log("⚠️ Kill-Switch validation failed, proceeding with transaction");
      }
    } else {
      console.log("✅ Income transaction - Kill-Switch bypassed");
    }

    // ===================================
    // 🔥 KILL-SWITCH ENFORCEMENT END
    // ===================================

    // Create transaction (only if not blocked)
    const transaction = new Transaction({
      userId: req.user.id,
      amount: txAmount,
      description,
      category: txCategory,
      date: date || new Date(),
      direction: txDirection,
      aiClassification: txClassification,
      source: "Manual",
      confidenceScore: 100,
    });

    await transaction.save();
    console.log("✅ Transaction saved:", transaction._id);

    // Generate AI nudge
    const user = await User.findById(req.user.id);
    let nudge = txDirection === 'DEBIT' 
      ? `Great tracking! You have ₹${user.smartWeeklyBudget || 0} weekly budget remaining.`
      : `Income recorded! Your financial health is improving.`;

    // Override nudge if kill-switch warning exists
    if (req.killSwitchWarning) {
      nudge = req.killSwitchWarning.reason;
    }

    res.json({ 
      success: true,
      transaction,
      nudge,
      killSwitchWarning: req.killSwitchWarning || null,
    });

  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Server error", 
      error: error.message 
    });
  }
});

// POST /api/transactions/ocr - OCR Upload with Kill-Switch
router.post("/ocr", auth, upload.single('receipt'), async (req, res) => {
  try {
    console.log("📸 OCR Upload received");
    
    if (!req.file) {
      return res.status(400).json({ msg: "No receipt image uploaded" });
    }

    console.log("✅ File received:", req.file.originalname, req.file.size, "bytes");

    // MOCK OCR PROCESSING
    const mockAmount = Math.floor(Math.random() * 500) + 50;
    const mockCategories = ['Groceries', 'Food', 'Transport', 'Shopping', 'Entertainment'];
    const mockCategory = mockCategories[Math.floor(Math.random() * mockCategories.length)];
    const mockDescription = `${mockCategory} purchase from receipt`;
    const mockClassification = mockCategory === 'Groceries' ? "Essential" : "Non-Essential";

    console.log("🤖 Mock OCR Result:", { mockAmount, mockCategory, mockDescription });

    // ===================================
    // 🔥 KILL-SWITCH ENFORCEMENT FOR OCR
    // ===================================
    
    try {
      const safeToSpendData = await SafeToSpendEngine.calculate(req.user.id);
      const riskData = await RiskEngine.calculateRiskScore(req.user.id, safeToSpendData);

      const validation = await KillSwitchEngine.validateTransaction(
        req.user.id,
        {
          amount: mockAmount,
          category: mockCategory,
          type: 'expense',
          aiClassification: mockClassification,
        },
        safeToSpendData,
        riskData.riskScore
      );

      if (!validation.allowed) {
        console.log("🚫 OCR Transaction BLOCKED");
        return res.status(403).json({
          success: false,
          blocked: true,
          validation,
          msg: "Receipt transaction blocked by financial kill-switch",
          ocrData: {
            amount: mockAmount,
            category: mockCategory,
            description: mockDescription,
          },
        });
      }

      if (validation.status === "WARNING") {
        req.ocrWarning = validation;
      }

    } catch (killSwitchError) {
      console.error("❌ Kill-Switch Error (OCR):", killSwitchError);
    }

    // Create transaction
    const transaction = new Transaction({
      userId: req.user.id,
      amount: mockAmount,
      description: mockDescription,
      category: mockCategory,
      date: new Date(),
      direction: "DEBIT",
      aiClassification: mockClassification,
      source: "OCR",
      confidenceScore: 85,
    });

    await transaction.save();
    console.log("✅ OCR Transaction saved:", transaction._id);

    // Generate nudge
    const user = await User.findById(req.user.id);
    const weeklyRemaining = (user.smartWeeklyBudget || 0) - mockAmount;
    
    let nudge = weeklyRemaining > 0 
      ? `Receipt processed! You have ₹${weeklyRemaining.toLocaleString()} safe to spend this week.`
      : `Alert! You've exceeded your weekly budget. Consider reviewing your spending.`;

    if (req.ocrWarning) {
      nudge = req.ocrWarning.reason;
    }

    res.json({
      success: true,
      msg: "Receipt processed successfully",
      transaction: {
        _id: transaction._id,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
      },
      nudge,
      ocrConfidence: 85,
      killSwitchWarning: req.ocrWarning || null,
    });

  } catch (error) {
    console.error("❌ OCR Error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Failed to process receipt",
      error: error.message 
    });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete("/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    console.log("🗑️ Transaction deleted:", req.params.id);
    res.json({ msg: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// PUT /api/transactions/:id - Update transaction with Kill-Switch
router.put("/:id", auth, async (req, res) => {
  try {
    const { amount, description, category, date, direction } = req.body;
    
    const transaction = await Transaction.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    const newAmount = amount ? parseFloat(amount) : transaction.amount;
    const newCategory = category || transaction.category;
    const newDirection = direction || transaction.direction;

    // ===================================
    // 🔥 KILL-SWITCH for UPDATES
    // ===================================
    
    // If increasing expense amount, validate
    if (newDirection === 'DEBIT' && newAmount > transaction.amount) {
      try {
        const amountIncrease = newAmount - transaction.amount;
        
        const safeToSpendData = await SafeToSpendEngine.calculate(req.user.id);
        const riskData = await RiskEngine.calculateRiskScore(req.user.id, safeToSpendData);

        const validation = await KillSwitchEngine.validateTransaction(
          req.user.id,
          {
            amount: amountIncrease,
            category: newCategory,
            type: 'expense',
            aiClassification: transaction.aiClassification,
          },
          safeToSpendData,
          riskData.riskScore
        );

        if (!validation.allowed) {
          return res.status(403).json({
            success: false,
            blocked: true,
            validation,
            msg: "Transaction update blocked - amount increase exceeds safe limits",
          });
        }

        if (validation.status === "WARNING") {
          req.updateWarning = validation;
        }

      } catch (killSwitchError) {
        console.error("❌ Kill-Switch Error (Update):", killSwitchError);
      }
    }

    // Update transaction
    transaction.amount = newAmount;
    transaction.description = description || transaction.description;
    transaction.category = newCategory;
    transaction.date = date || transaction.date;
    transaction.direction = newDirection;
    transaction.updatedAt = new Date();

    await transaction.save();
    console.log("✏️ Transaction updated:", transaction._id);

    res.json({
      success: true,
      transaction,
      killSwitchWarning: req.updateWarning || null,
    });

  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/transactions/stats - Get transaction statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });
    
    const totalExpenses = transactions
      .filter(t => t.direction === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = transactions
      .filter(t => t.direction === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categoryBreakdown = transactions.reduce((acc, t) => {
      if (t.direction === "DEBIT") {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});

    res.json({
      totalExpenses,
      totalIncome,
      balance: totalIncome - totalExpenses,
      categoryBreakdown,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ===================================
// 🔥 NEW KILL-SWITCH ENDPOINTS
// ===================================

// POST /api/transactions/validate - Pre-validate before UI submission
router.post("/validate", auth, async (req, res) => {
  try {
    const { amount, category, type, aiClassification } = req.body;

    // Only validate expenses
    if (type !== 'expense') {
      return res.json({
        success: true,
        allowed: true,
        status: "ALLOWED",
        reason: "Income transactions are always allowed",
      });
    }

    const safeToSpendData = await SafeToSpendEngine.calculate(req.user.id);
    const riskData = await RiskEngine.calculateRiskScore(req.user.id, safeToSpendData);

    const validation = await KillSwitchEngine.validateTransaction(
      req.user.id,
      {
        amount: parseFloat(amount),
        category: category || "Uncategorized",
        type,
        aiClassification: aiClassification || "Non-Essential",
      },
      safeToSpendData,
      riskData.riskScore
    );

    res.json({
      success: true,
      validation,
      allowed: validation.allowed,
      killSwitchLevel: validation.level,
    });

  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Validation failed",
      error: error.message 
    });
  }
});

// GET /api/transactions/kill-switch-status - Get current kill-switch status
router.get("/kill-switch-status", auth, async (req, res) => {
  try {
    const safeToSpendData = await SafeToSpendEngine.calculate(req.user.id);
    const riskData = await RiskEngine.calculateRiskScore(req.user.id, safeToSpendData);
    const killSwitchLevel = KillSwitchEngine.getKillSwitchLevel(riskData.riskScore);

    res.json({
      success: true,
      killSwitch: {
        level: killSwitchLevel,
        active: killSwitchLevel !== "GREEN",
        riskScore: riskData.riskScore,
      },
      safeToSpend: {
        dailyAllowance: safeToSpendData.dailyAllowance,
        remainingSafeToSpend: safeToSpendData.remainingSafeToSpend,
        currentDailySpend: safeToSpendData.currentDailySpend,
      },
      alerts: safeToSpendData.alerts || [],
    });

  } catch (error) {
    console.error("Kill-switch status error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Failed to get kill-switch status",
      error: error.message 
    });
  }
});

module.exports = router;
