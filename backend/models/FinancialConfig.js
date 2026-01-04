import mongoose from "mongoose";

const FinancialConfigSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  monthlyIncome: { type: Number, required: true },
  fixedObligations: [
    {
      name: { type: String, required: true },
      amount: { type: Number, required: true },
      dueDate: { type: Number, default: 1 },
    }
  ],
  emergencyBufferPercent: { type: Number, default: 15 },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("FinancialConfig", FinancialConfigSchema);