import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  // ============================================
  // BASIC FINANCIAL INFORMATION (ONBOARDING)
  // ============================================
  incomeAmount: { 
    type: Number, 
    required: true,
    min: 0,
  },
  
  incomeType: {
    type: String,
    enum: ["monthly", "weekly", "irregular"],
    default: "monthly",
  },

  // FIX #1: GROUND TRUTH BALANCE (CRITICAL)
  // This is the real balance source - set during onboarding or bank sync
  currentBalance: {
    type: Number,
    default: null,
    min: 0,
  },

  fixedExpenses: { 
    type: Number, 
    default: 0,
    min: 0,
  },

  loansAmount: { 
    type: Number, 
    default: 0,
    min: 0,
  },

  monthlySavings: { 
    type: Number, 
    default: 0,
    min: 0,
  },

  primaryGoal: { 
    type: String, 
    default: "Save Money",
  },

  // ============================================
  // CALCULATED FINANCIAL METRICS
  // ============================================
  
  // Weekly flexible budget (after fixed expenses)
  weeklyFlexBudget: { 
    type: Number, 
    default: 0,
  },

  // Safe-to-Spend amounts (calculated by SafeToSpendService)
  safeToSpendWeekly: { 
    type: Number, 
    default: 0,
  },

  safeToSpendDaily: { 
    type: Number, 
    default: 0,
  },

  // Financial health score (0-100)
  financialHealthScore: { 
    type: Number, 
    default: 50,
    min: 0,
    max: 100,
  },

  // ============================================
  // SAFE-TO-SPEND DATA (COMPLETE OBJECT)
  // ============================================
  // Stores the complete Safe-to-Spend calculation result
  safeToSpendData: {
    safeToSpendWeekly: { type: Number, default: 0 },
    safeToSpendDaily: { type: Number, default: 0 },
    spentThisWeek: { type: Number, default: 0 },
    remainingThisWeek: { type: Number, default: 0 },
    daysRemainingInWeek: { type: Number, default: 7 },
    confidence: { 
      type: String, 
      enum: ["SAFE", "CAUTION", "RISK"],
      default: "SAFE" 
    },
    riskScore: { type: Number, default: 0 },
    reason: { type: String, default: "" },
    explanation: { type: String, default: "" },
    
    // Detailed breakdown
    breakdown: {
      currentBalance: { type: Number, default: 0 },
      balanceSource: { type: String, default: "" },
      isEstimated: { type: Boolean, default: true },
      bufferAmount: { type: Number, default: 0 },
      bufferPercentage: { type: Number, default: 0 },
      upcomingExpenses: { type: Number, default: 0 },
      recurringExpenses: { type: Number, default: 0 },
      recurringCount: { type: Number, default: 0 },
      disposableAmount: { type: Number, default: 0 },
      spendingVelocity: { type: Number, default: 0 },
      isOverspending: { type: Boolean, default: false },
      highVelocityCount: { type: Number, default: 0 },
      daysRemainingInCycle: { type: Number, default: 30 },
    },

    // Upcoming recurring expenses
    upcomingRecurring: { type: Array, default: [] },
    
    lastCalculated: { type: Date, default: Date.now },
  },

  // ============================================
  // SPENDING PATTERN ANALYSIS
  // ============================================
  
  // Average weekly essential spending (calculated from transactions)
  actualWeeklyEssentials: { 
    type: Number, 
    default: 0,
  },

  // Ratio of non-essential to total spending (0-1)
  nonEssentialRatio: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 1,
  },

  // ============================================
  // CASHFLOW FORECAST
  // ============================================
  
  // 7-day projected balance forecast
  cashflowForecast: [
    {
      date: { type: Date },
      projectedBalance: { type: Number },
      pressureEvent: { type: String },
    }
  ],

  // Risk indicators
  lowBalanceRisk: { 
    type: String,
    enum: ["Low", "High"],
    default: "Low",
  },

  spendingPressure: { 
    type: String, 
    default: "Medium",
  },

  // ============================================
  // AI NUDGES & INSIGHTS
  // ============================================
  
  // Last generated personalized nudge
  lastNudge: {
    type: String,
    default: "",
  },

  lastNudgeDate: {
    type: Date,
    default: null,
  },

  // Last AI coach insight
  lastCoachInsight: {
    type: String,
    default: "",
  },

  // ============================================
  // METADATA
  // ============================================
  
  createdAt: { 
    type: Date, 
    default: Date.now,
  },

  updatedAt: { 
    type: Date, 
    default: Date.now,
  },
});

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================
profileSchema.index({ userId: 1 });
profileSchema.index({ updatedAt: -1 });

// ============================================
// METHODS
// ============================================

// Update balance (manual or from bank sync)
profileSchema.methods.updateBalance = function(newBalance) {
  this.currentBalance = newBalance;
  this.updatedAt = new Date();
  return this.save();
};

// Check if profile has valid balance source
profileSchema.methods.hasValidBalance = function() {
  return this.currentBalance !== null && this.currentBalance !== undefined;
};

// Get income cycle days remaining
profileSchema.methods.getDaysRemainingInCycle = function() {
  const now = new Date();
  
  if (this.incomeType === "weekly") {
    const daysUntilNextSunday = 7 - now.getDay();
    return daysUntilNextSunday === 0 ? 7 : daysUntilNextSunday;
  } else if (this.incomeType === "monthly") {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
  } else {
    return 30; // Irregular
  }
};

// Calculate monthly burden
profileSchema.methods.getMonthlyBurden = function() {
  return (this.fixedExpenses || 0) + (this.loansAmount || 0) + (this.monthlySavings || 0);
};

// Calculate disposable income
profileSchema.methods.getDisposableIncome = function() {
  return Math.max(0, (this.incomeAmount || 0) - this.getMonthlyBurden());
};

// Check if user needs warning
profileSchema.methods.shouldWarnUser = function() {
  if (!this.safeToSpendData) return false;
  
  return (
    this.safeToSpendData.confidence === "RISK" ||
    this.safeToSpendData.remainingThisWeek < this.safeToSpendData.safeToSpendWeekly * 0.1
  );
};

// ============================================
// STATICS
// ============================================

// Find profiles that need Safe-to-Spend recalculation
profileSchema.statics.findStaleProfiles = function(hoursOld = 24) {
  const staleDate = new Date();
  staleDate.setHours(staleDate.getHours() - hoursOld);
  
  return this.find({
    $or: [
      { "safeToSpendData.lastCalculated": { $lt: staleDate } },
      { "safeToSpendData.lastCalculated": null },
    ]
  });
};

// ============================================
// PRE-SAVE HOOK
// ============================================
profileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================================
// VIRTUAL FIELDS
// ============================================

// Check if balance is healthy
profileSchema.virtual('isBalanceHealthy').get(function() {
  if (!this.currentBalance) return null;
  const monthlyBurden = this.getMonthlyBurden();
  return this.currentBalance > monthlyBurden;
});

// Get formatted current balance
profileSchema.virtual('formattedBalance').get(function() {
  if (this.currentBalance === null || this.currentBalance === undefined) {
    return "Not set";
  }
  return `₹${this.currentBalance.toLocaleString('en-IN')}`;
});

// ============================================
// EXPORT
// ============================================
export default mongoose.model("Profile", profileSchema);
