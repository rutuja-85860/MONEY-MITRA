const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, default: "Uncategorized" },
  aiClassification: { type: String, enum: ["Essential", "Non-Essential"], default: "Non-Essential" },
  source: { type: String, enum: ["Manual", "OCR", "Bank"], default: "Manual" },
  direction: { type: String, enum: ["DEBIT", "CREDIT"], default: "DEBIT" },
  confidenceScore: { type: Number, min: 0, max: 100, default: 100 },
  isRecurringDetected: { type: Boolean, default: false },
  recurringMetadata: {
    frequency: { type: String, enum: ["weekly", "monthly", "quarterly", ""], default: "" },
    lastDetectedDate: { type: Date },
    matchCount: { type: Number, default: 0 },
  },
  spendingVelocityImpact: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "LOW" },
  balanceSnapshot: { type: Number, default: null },
  safeToSpendImpact: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, isRecurringDetected: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
