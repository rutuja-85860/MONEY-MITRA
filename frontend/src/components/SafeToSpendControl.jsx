import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Calendar,
  Activity,
  Zap,
} from "lucide-react";

const API = "http://localhost:5000/api";

export default function SafeToSpendControl() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchControl = async () => {
      try {
        const res = await axios.get(`${API}/safe-to-spend`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (error) {
        console.error("SafeToSpend fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchControl();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
        <p className="text-gray-400">Loading control engine...</p>
      </div>
    );
  }

  if (!data) return null;

  // Determine severity colors
  const getSeverityConfig = () => {
    if (data.alerts.some((a) => a.severity === "CRITICAL")) {
      return {
        bg: "from-red-500/20 to-pink-500/20",
        text: "text-red-300",
        border: "border-red-500/30",
      };
    }
    if (data.alerts.some((a) => a.severity === "WARNING")) {
      return {
        bg: "from-yellow-500/20 to-orange-500/20",
        text: "text-yellow-300",
        border: "border-yellow-500/30",
      };
    }
    return {
      bg: "from-green-500/20 to-emerald-500/20",
      text: "text-green-300",
      border: "border-green-500/30",
    };
  };

  const config = getSeverityConfig();

  return (
    <div className="space-y-6">
      {/* CRITICAL ALERTS (ALWAYS VISIBLE) */}
      {data.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${config.bg} backdrop-blur-xl p-6 rounded-2xl border ${config.border}`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${config.bg}`}>
              <AlertTriangle className={`w-6 h-6 ${config.text}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${config.text} mb-2`}>
                Financial Control Alerts
              </h3>
              <div className="space-y-2">
                {data.alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${config.text} mt-2`} />
                    <p className="text-sm text-gray-200">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* PRIMARY CONTROL PANEL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/3 backdrop-blur-2xl p-8 rounded-3xl border border-white/10"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Safe-to-Spend Control</h2>
            <p className="text-sm text-gray-400">Financial Safety Authority</p>
          </div>
        </div>

        {/* PRIMARY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
            <p className="text-xs text-gray-400 uppercase mb-2">Daily Allowance</p>
            <p className="text-5xl font-black bg-gradient-to-r from-purple-300 to-pink-300 text-transparent bg-clip-text">
              ₹{data.dailyAllowance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {data.remainingDays} days remaining
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
            <p className="text-xs text-gray-400 uppercase mb-2">Current Daily Spend</p>
            <p
              className={`text-5xl font-black ${
                data.currentDailySpend > data.dailyAllowance
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              ₹{data.currentDailySpend.toLocaleString()}
            </p>
            <p
              className={`text-sm mt-2 ${
                data.currentDailySpend > data.dailyAllowance
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {data.currentDailySpend > data.dailyAllowance
                ? "EXCEEDS ALLOWANCE"
                : "Within limits"}
            </p>
          </div>
        </div>

        {/* EXHAUSTION PREDICTION */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Cash Exhaustion Forecast</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Days Until Exhaustion</p>
              <p
                className={`text-3xl font-bold ${
                  data.daysUntilExhaustion <= 7
                    ? "text-red-400"
                    : data.daysUntilExhaustion <= 15
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {data.daysUntilExhaustion} days
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Projected Date</p>
              <p className="text-lg font-bold text-white">
                {data.exhaustionDate
                  ? new Date(data.exhaustionDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* BREACH FLAGS */}
        {data.breachFlags.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white">Behavioral Breaches</h3>
            </div>
            <div className="space-y-2">
              {data.breachFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                  <p className="text-sm text-gray-300">{flag}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIONABLE ADVICE */}
        {data.advice.length > 0 && (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl p-6 rounded-2xl border border-purple-400/30">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Required Actions</h3>
            </div>
            <div className="space-y-3">
              {data.advice.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5" />
                  <p className="text-sm text-gray-200 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* METADATA */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-xs text-gray-500">
          <div>
            <span className="text-gray-400">Risk Status:</span>
            <span
              className={`ml-2 font-bold ${
                data.riskStatus === "DETERIORATING"
                  ? "text-red-400"
                  : data.riskStatus === "IMPROVING"
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {data.riskStatus}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Penalty Factor:</span>
            <span className="ml-2 font-bold text-white">
              {(data.penaltyFactor * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-gray-400">Income Coverage:</span>
            <span
              className={`ml-2 font-bold ${
                data.incomeCoverageRatio < 1.0
                  ? "text-red-400"
                  : data.incomeCoverageRatio < 1.2
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {data.incomeCoverageRatio.toFixed(2)}x
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
