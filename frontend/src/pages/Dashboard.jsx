import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Zap,
  Sun,
  Clock,
  Heart,
  Loader2,
  RefreshCcw,
  LogOut,
  Home,
  UploadCloud,
  Settings,
  Menu,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Shield,
  TrendingDown,
  Calendar,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Import Components
import TransactionManager from "../components/TransactionManager";
import SpendingHeatmap from "../components/SpendingHeatmap";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import VoiceAssistant from "../components/VoiceAssistant";

const API = "http://localhost:5000/api";

// Initial state
const initialDashboardData = {
  smartWeeklyBudget: 0,
  safeToSpendWeekly: 0,
  safeToSpendDaily: 0,
  weeklyEssentials: 0,
  financialHealthScore: 0,
  cashflowForecast: {
    forecast: [],
    lowBalanceRisk: "Unknown",
    spendingPressure: "N/A",
    upcomingBalance: 0,
  },
  safeToSpendData: {
    safeToSpendWeekly: 0,
    safeToSpendDaily: 0,
    spentThisWeek: 0,
    remainingThisWeek: 0,
    daysRemainingInWeek: 7,
    confidence: "SAFE",
    riskScore: 0,
    reason: "",
    explanation: "",
    breakdown: {
      currentBalance: 0,
      isEstimated: false,
      bufferAmount: 0,
      bufferPercentage: 0,
      upcomingExpenses: 0,
      disposableAmount: 0,
      spendingVelocity: 100,
      isOverspending: false,
      daysRemainingInCycle: 30,
    },
  },
  aiCoachInsight: "Loading personalized insights...",
  personalizedNudge: "Checking your patterns...",
};

// Stat Card Component
const StatCard = ({
  icon: Icon,
  title,
  value,
  unit = "₹",
  colorClass = "text-purple-600",
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/[0.05] backdrop-blur-xl rounded-2xl p-6 shadow-lg transition-all duration-300 border border-white/10 hover:border-purple-400/40 hover:shadow-[0_20px_60px_rgba(168,85,247,0.2)] group"
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
      <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-110 transition-transform">
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
    </div>
    <p className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 text-transparent bg-clip-text">
      {unit}
      {Math.round(value).toLocaleString("en-IN")}
    </p>
  </motion.div>
);

// Forecast Card Component
const ForecastCard = ({ title, value, description, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/[0.05] backdrop-blur-xl rounded-2xl p-6 shadow-lg border-t-4 border border-white/10 hover:border-purple-400/40 transition-all duration-300"
    style={{ borderTopColor: color }}
  >
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p
      className={`text-3xl font-extrabold mb-2 ${
        color === "#10B981"
          ? "text-green-400"
          : color === "#F59E0B"
          ? "text-yellow-400"
          : "text-red-400"
      }`}
    >
      {value}
    </p>
    <p className="text-sm text-gray-400">{description}</p>
  </motion.div>
);
// Enhanced Safe-to-Spend Card Component
const SafeToSpendCard = ({ data }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const {
    safeToSpendWeekly,
    spentThisWeek,
    remainingThisWeek,
    confidence,
    explanation,
    safeToSpendDaily,
    daysRemainingInWeek,
    riskScore,
    breakdown,
  } = data;

  const progressPercentage =
    safeToSpendWeekly > 0 ? (spentThisWeek / safeToSpendWeekly) * 100 : 0;

  const confidenceConfig = {
    SAFE: {
      bg: "from-emerald-500/10 via-green-500/5 to-teal-500/10",
      cardBg: "from-emerald-500/5 to-green-500/5",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      icon: CheckCircle,
      gradient: "from-emerald-400 via-green-400 to-teal-400",
      glow: "shadow-emerald-500/20",
      badgeBg: "from-emerald-500/20 to-green-500/20",
    },
    CAUTION: {
      bg: "from-amber-500/10 via-yellow-500/5 to-orange-500/10",
      cardBg: "from-amber-500/5 to-yellow-500/5",
      text: "text-amber-400",
      border: "border-amber-500/30",
      icon: AlertTriangle,
      gradient: "from-amber-400 via-yellow-400 to-orange-400",
      glow: "shadow-amber-500/20",
      badgeBg: "from-amber-500/20 to-yellow-500/20",
    },
    RISK: {
      bg: "from-red-500/10 via-rose-500/5 to-pink-500/10",
      cardBg: "from-red-500/5 to-rose-500/5",
      text: "text-red-400",
      border: "border-red-500/30",
      icon: AlertCircle,
      gradient: "from-red-400 via-rose-400 to-pink-400",
      glow: "shadow-red-500/20",
      badgeBg: "from-red-500/20 to-rose-500/20",
    },
  };

  const config = confidenceConfig[confidence] || confidenceConfig.SAFE;
  const StatusIcon = config.icon;

  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      {/* Animated Glow Background */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 bg-gradient-to-br ${config.bg} blur-3xl`}
        />
      </div>

      {/* Main Card */}
      <div className={`relative bg-gradient-to-br ${config.cardBg} backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-2xl border ${config.border} ${config.glow}`}>
        {/* Decorative Corner Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
          <div className={`absolute top-4 right-4 w-20 h-20 bg-gradient-to-br ${config.gradient} rounded-full blur-2xl`} />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 opacity-20">
          <div className={`absolute bottom-4 left-4 w-20 h-20 bg-gradient-to-br ${config.gradient} rounded-full blur-2xl`} />
        </div>

        {/* Header Section */}
        <div className="relative z-10 flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Animated Icon Container */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`relative p-4 rounded-2xl bg-gradient-to-br ${config.badgeBg} border ${config.border} shadow-lg ${config.glow}`}
            >
              <Sun className={`h-7 w-7 ${config.text}`} />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-20`}
              />
            </motion.div>

            <div>
              <h3 className="text-3xl font-extrabold text-white mb-1 tracking-tight">
                Safe-to-Spend
              </h3>
              <p className="text-sm text-gray-400 font-medium">
                AI-Powered Financial Safety Engine
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${config.badgeBg} border ${config.border} shadow-lg backdrop-blur-xl`}
          >
            <StatusIcon className={`h-5 w-5 ${config.text}`} />
            <span className={`font-bold text-sm ${config.text} uppercase tracking-wide`}>
              {confidence}
            </span>
          </motion.div>
        </div>

        {/* Risk Score Indicator */}
        <div className="relative mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              Risk Score
            </span>
            <span className={`text-lg font-bold ${config.text}`}>
              {riskScore}/100
            </span>
          </div>
          <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(riskScore, 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${config.gradient} relative`}
            >
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>
        </div>

        {/* Main Spending Progress */}
        <div className="relative mb-8 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
                Weekly Spending
              </p>
              <p className="text-2xl font-bold text-white">
                ₹{spentThisWeek.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
                Budget Limit
              </p>
              <p className="text-2xl font-bold text-white">
                ₹{safeToSpendWeekly.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="relative w-full h-5 bg-white/10 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              className={`h-full bg-gradient-to-r ${config.gradient} relative shadow-lg`}
            >
              {progressPercentage > 10 && (
                <span className="absolute right-3 top-0.5 text-xs font-black text-white drop-shadow-lg">
                  {Math.round(progressPercentage)}%
                </span>
              )}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
            </motion.div>
          </div>

          <div className="mt-3 text-center">
            <span className={`text-sm font-semibold ${config.text}`}>
              {progressPercentage < 50
                ? "On track! 🎯"
                : progressPercentage < 80
                ? "Watch spending 👀"
                : "Budget alert! ⚠️"}
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Remaining This Week */}
          <motion.div
            whileHover={{ scale: 1.03, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 group-hover:border-purple-400/40 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <DollarSign className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Remaining This Week
                </p>
              </div>
              <p className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                ₹{remainingThisWeek.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${remainingThisWeek > safeToSpendWeekly * 0.5 ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`} />
                <span className="text-xs text-gray-400">
                  {Math.round((remainingThisWeek / safeToSpendWeekly) * 100)}% available
                </span>
              </div>
            </div>
          </motion.div>

          {/* Daily Average */}
          <motion.div
            whileHover={{ scale: 1.03, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 group-hover:border-cyan-400/40 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <Clock className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Daily Average
                </p>
              </div>
              <p className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">
                ₹{safeToSpendDaily.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {daysRemainingInWeek} days remaining
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Explanation Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`relative mb-6 p-5 rounded-2xl bg-gradient-to-br ${config.cardBg} border ${config.border} backdrop-blur-xl overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 flex-shrink-0"
            >
              <Zap className="h-5 w-5 text-yellow-400" />
            </motion.div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">
                AI Insight
              </p>
              <p className="text-sm text-gray-200 leading-relaxed font-medium">
                {explanation || "Keep up the great work managing your finances!"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* "Why This Amount?" Expandable Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="font-bold text-white text-lg">Why This Amount?</span>
            </div>
            <motion.div
              animate={{ rotate: showBreakdown ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-6 w-6 text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="border-t border-white/10"
              >
                <div className="p-6 space-y-4">
                  {/* Current Balance */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                        <DollarSign className="h-4 w-4 text-green-400" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">
                        Current Balance
                      </span>
                      {breakdown.isEstimated && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold border border-amber-500/30">
                          Estimated
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-white text-lg">
                      ₹{breakdown.currentBalance?.toLocaleString()}
                    </span>
                  </motion.div>

                  {/* Safety Buffer */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                        <Shield className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">
                        Safety Buffer ({breakdown.bufferPercentage}%)
                      </span>
                    </div>
                    <span className="font-bold text-red-400 text-lg">
                      -₹{breakdown.bufferAmount?.toLocaleString()}
                    </span>
                  </motion.div>

                  {/* Upcoming Expenses */}
                  {breakdown.upcomingExpenses > 0 && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                          <Calendar className="h-4 w-4 text-orange-400" />
                        </div>
                        <span className="text-sm text-gray-300 font-medium">
                          Upcoming Expenses
                        </span>
                      </div>
                      <span className="font-bold text-red-400 text-lg">
                        -₹{breakdown.upcomingExpenses?.toLocaleString()}
                      </span>
                    </motion.div>
                  )}

                  {/* Spending Velocity */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <Activity className="h-4 w-4 text-purple-400" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">
                        Spending Velocity
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-lg ${
                          breakdown.isOverspending ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {breakdown.spendingVelocity}%
                      </span>
                      {breakdown.isOverspending && (
                        <TrendingDown className="h-5 w-5 text-red-400 animate-bounce" />
                      )}
                    </div>
                  </motion.div>

                  {/* Days Remaining */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                        <Clock className="h-4 w-4 text-indigo-400" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">
                        Days Until Next Income
                      </span>
                    </div>
                    <span className="font-bold text-white text-lg">
                      {breakdown.daysRemainingInCycle} days
                    </span>
                  </motion.div>

                  {/* Final Disposable Amount */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className={`flex justify-between items-center p-5 rounded-xl bg-gradient-to-r ${config.badgeBg} border ${config.border} shadow-lg`}
                  >
                    <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                      Available to Spend
                    </span>
                    <span className={`text-2xl font-black ${config.text}`}>
                      ₹{breakdown.disposableAmount?.toLocaleString()}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

/// Navbar Component - UPDATED WITH NEW ITEM
const TransparentNavbar = ({ onNavigate, activeSection, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Overview", icon: Home, section: "overview" },
    { name: "Safe-to-Spend", icon: Sun, section: "safe-to-spend" },
    { name: "Transactions", icon: UploadCloud, section: "transactions" },
    { name: "Income & Expenses", icon: DollarSign, section: "income-expense" }, // ✅ NEW
    { name: "Trends", icon: TrendingUp, section: "trends" },
    { name: "Settings", icon: Settings, section: "settings" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/[0.03] backdrop-blur-2xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-300 text-transparent bg-clip-text">
              CoachAI
            </span>
          </motion.div>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <motion.button
                key={item.section}
                onClick={() => {
                  onNavigate(item.section);
                  setMobileMenuOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300
                  ${
                    activeSection === item.section
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 space-y-2 overflow-hidden"
            >
              {navItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => {
                    onNavigate(item.section);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all duration-300
                    ${
                      activeSection === item.section
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                        : "text-gray-300 hover:bg-white/10"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              ))}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// Chart Component
const IntegratedDashboardChart = ({ forecastData }) => {
  console.log("📈 Forecast data received:", forecastData); // DEBUG

  if (!forecastData || forecastData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white/5 rounded-2xl">
        <TrendingUp className="w-8 h-8 mb-2" />
        <p>No forecast data available</p>
      </div>
    );
  }

  const chartData = forecastData.map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
    "Projected Balance": Math.round(day.projectedBalance),
  }));

  const minBalance = Math.min(...chartData.map((d) => d["Projected Balance"]));
  const isRisk = minBalance < 2000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/10"
    >
      <h3 className="text-xl font-bold text-white mb-4">7-Day Projected Cashflow</h3>
      <p className={`text-sm font-semibold mb-4 ${isRisk ? "text-red-400" : "text-green-400"}`}>
        {isRisk ? "⚠️ Risk: Low balance detected!" : "✅ Status: Stable flow projected."}
      </p>
      
      {/* FIXED: Added fixed height container */}
      <div style={{ width: '100%', height: '320px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff20" />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af" }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [`₹${value.toLocaleString()}`, "Balance"]}
              labelFormatter={(label) => `Day: ${label}`}
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #ffffff20",
                borderRadius: "12px",
                color: "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Projected Balance"
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ fill: "#a855f7", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};


// Main Dashboard Component
export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  const loadDashboard = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.dashboardData;
      setDashboardData({
        ...data,
        cashflowForecast: data.cashflowForecast || initialDashboardData.cashflowForecast,
        safeToSpendData: data.safeToSpendData || initialDashboardData.safeToSpendData,
      });
    } catch (err) {
      console.error("Dashboard Load Failed:", err.response?.data || err);
      if (err.response?.status === 404) {
        navigate("/onboarding");
      } else if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleDashboardRefresh = () => {
    setLoading(true);
    loadDashboard();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("onboarding_done");
    navigate("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#0f0b1f] via-[#0a0a0f] to-[#050208]">
        <Loader2 className="h-10 w-10 text-purple-400 animate-spin mr-3" />
        <p className="text-xl text-purple-300">Running Financial Engine...</p>
      </div>
    );

  const scoreHex =
    dashboardData.financialHealthScore >= 70
      ? "#10B981"
      : dashboardData.financialHealthScore >= 40
      ? "#F59E0B"
      : "#EF4444";

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <motion.section
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              Overview & Scores
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={TrendingUp}
                title="Total Weekly Budget"
                value={dashboardData.smartWeeklyBudget + dashboardData.weeklyEssentials}
                colorClass="text-purple-400"
              />
              <StatCard
                icon={DollarSign}
                title="Flexible Spend"
                value={dashboardData.smartWeeklyBudget}
                colorClass="text-pink-400"
              />
              <StatCard
                icon={Sun}
                title="Safe-to-Spend (Today)"
                value={dashboardData.safeToSpendDaily}
                colorClass="text-green-400"
              />
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white/[0.05] backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 hover:border-purple-400/40 transition-all duration-300 flex items-center justify-between group"
              >
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Health Score
                  </h3>
                  <p className="text-4xl font-extrabold" style={{ color: scoreHex }}>
                    {dashboardData.financialHealthScore}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-110 transition-transform">
                  <Heart className="h-8 w-8" style={{ color: scoreHex }} />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-purple-400/30 mb-8"
            >
              <div className="flex items-start mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 mr-4">
                  <Zap className="h-8 w-8 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mt-2">AI Coach Insights</h2>
              </div>
              <motion.p
                whileHover={{ scale: 1.01 }}
                className="text-lg font-semibold bg-blue-500/20 text-blue-300 p-4 rounded-xl border border-blue-400/30 mb-6"
              >
                🚨 {dashboardData.personalizedNudge}
              </motion.p>
              <p className="text-gray-300 leading-relaxed">{dashboardData.aiCoachInsight}</p>
            </motion.div>
          </motion.section>
        );

      case "safe-to-spend":
        return (
          <motion.section
            key="safe-to-spend"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
              Safe-to-Spend Intelligence
            </h2>

            <SafeToSpendCard data={dashboardData.safeToSpendData} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <ForecastCard
                title="7-Day Forecast"
                value={`₹${Math.round(
                  dashboardData.cashflowForecast.upcomingBalance
                ).toLocaleString()}`}
                description={`Risk: ${dashboardData.cashflowForecast.lowBalanceRisk}`}
                color={dashboardData.cashflowForecast.lowBalanceRisk === "High" ? "#EF4444" : "#10B981"}
              />
              <ForecastCard
                title="Spending Pressure"
                value={dashboardData.cashflowForecast.spendingPressure}
                description="Budget pressure level"
                color={
                  dashboardData.cashflowForecast.spendingPressure.includes("High")
                    ? "#F59E0B"
                    : "#10B981"
                }
              />
              <StatCard
                icon={Clock}
                title="Weekly Essentials"
                value={dashboardData.weeklyEssentials}
                colorClass="text-blue-400"
              />
            </div>
          </motion.section>
        );

      case "transactions":
        return (
          <motion.section
            key="transactions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
              Transaction Manager
            </h2>
            <TransactionManager onEngineRecalculate={handleDashboardRefresh} />
          </motion.section>
        );
  case "income-expense":
  return (
    <motion.section
      key="income-expense"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
        <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-red-500 rounded-full" />
        Income & Expense Analytics
      </h2>
      <IncomeExpenseChart />
    </motion.section>
  );



      case "trends":
  return (
    <motion.section
      key="trends"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
        <div className="w-2 h-8 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
        Trends & Analytics
      </h2>
      
      {/* 7-Day Cashflow Forecast */}
      {dashboardData.cashflowForecast?.forecast && dashboardData.cashflowForecast.forecast.length > 0 ? (
        <IntegratedDashboardChart forecastData={dashboardData.cashflowForecast.forecast} />
      ) : (
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 text-center mb-8">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No cashflow forecast available</p>
          <p className="text-gray-500 text-sm mt-2">
            Add more transactions to generate predictions
          </p>
        </div>
      )}
      
      {/* Spending Trends Heatmap */}
      <div className="mt-8">
        <SpendingHeatmap />
      </div>
    </motion.section>
  );

      case "settings":
        return (
          <motion.section
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
              Profile Settings
            </h2>
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white/[0.05] backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-white/10"
            >
              <p className="text-gray-300 text-lg">
                Update your financial profile, income, expenses, and goals here.
              </p>
            </motion.div>
          </motion.section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0b1f] via-[#0a0a0f] to-[#050208] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.15, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]"
        />
      </div>

      <TransparentNavbar
        onNavigate={setActiveSection}
        activeSection={activeSection}
        onLogout={handleLogout}
      />

      <main className="relative z-10 pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-300 text-transparent bg-clip-text mb-2">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace("-", " ")}
            </h1>
            <p className="text-gray-400">Real-time financial intelligence</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDashboardRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/30 text-purple-300 rounded-xl font-semibold transition-all"
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </motion.header>

        <AnimatePresence mode="wait">{renderSection()}</AnimatePresence>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-6 text-center text-gray-500 text-sm border-t border-white/10"
        >
          CoachAI | Production-Grade Financial Safety Engine with Multilingual Voice Advisory
        </motion.footer>
      </main>

      {/* ✅ VOICE ASSISTANT - ONLY NEW ADDITION */}
      <VoiceAssistant />
    </div>
  );
}
