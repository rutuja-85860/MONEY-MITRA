const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String,
    trim: true
  },
  onboardingDone: { 
    type: Boolean, 
    default: false 
  },
  monthlyIncome: { 
    type: Number,
    default: 0 
  },
  fixedExpenses: [
    {
      name: { type: String },
      amount: { type: Number },
      frequency: { type: String },
    }
  ],
  savingsGoal: { 
    type: Number,
    default: 0 
  },
  smartWeeklyBudget: { 
    type: Number, 
    default: 0 
  },
  weeklyEssentials: { 
    type: Number, 
    default: 0 
  },
  financialHealthScore: { 
    type: Number, 
    default: 50,
    min: 0,
    max: 100
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
