import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, TrendingDown } from "lucide-react";

const API = "http://localhost:5000/api";

export default function ExhaustionForecast() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await axios.get(`${API}/safe-to-spend/forecast/exhaustion`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForecast(res.data);
      } catch (error) {
        console.error("Forecast fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [token]);

  if (loading) return null;
  if (!forecast) return null;
  if (forecast.severity === "SAFE") return null; // Don't show if safe

  const severityConfig = {
    CRITICAL: {
      bg: "from-red-500/20 to-pink-500/20",
      border: "border-red-500/30",
      text: "text-red-300",
    },
    WARNING: {
      bg: "from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-500/30",
      text: "text-yellow-300",
    },
    CAUTION: {
      bg: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
      text: "text-blue-300",
    },
  };

  const config = severityConfig[forecast.severity] || severityConfig.WARNING;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${config.bg} backdrop-blur-xl p-6 rounded-2xl border ${config.border} mb-8`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${config.bg}`}>
          <AlertTriangle className={`w-6 h-6 ${config.text}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-xl font-bold ${config.text}`}>
              Cash-Flow Alert
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${config.text} bg-white/10`}
            >
              {forecast.severity}
            </span>
          </div>
          <p className="text-gray-200 mb-4">{forecast.reason}</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Current Balance</p>
              <p className="font-bold text-white">
                ₹{forecast.currentBalance.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Daily Avg Spending</p>
              <p className="font-bold text-white">
                ₹{forecast.avgDailySpending.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Days Remaining</p>
              <p className={`font-bold ${config.text}`}>
                {forecast.daysUntilExhaustion} days
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
