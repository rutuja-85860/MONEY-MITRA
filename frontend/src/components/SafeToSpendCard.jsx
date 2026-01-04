import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

const API = "http://localhost:5000/api";

export default function SafeToSpendCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/safe-to-spend/calculate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (error) {
        console.error("Safe-to-Spend fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) {
    return <div className="p-6 bg-white/5 rounded-2xl">Loading...</div>;
  }

  if (!data) return null;

  const trendConfig = {
    IMPROVING: {
      bg: "from-green-500/20 to-emerald-500/20",
      text: "text-green-300",
      icon: CheckCircle,
    },
    STABLE: {
      bg: "from-yellow-500/20 to-orange-500/20",
      text: "text-yellow-300",
      icon: Info,
    },
    DETERIORATING: {
      bg: "from-red-500/20 to-pink-500/20",
      text: "text-red-300",
      icon: AlertTriangle,
    },
  };

  const config = trendConfig[data.trendStatus] || trendConfig.STABLE;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/3 backdrop-blur-2xl p-8 rounded-3xl border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Safe-to-Spend</h3>
            <p className="text-sm text-gray-400">Deterministic Engine</p>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-full bg-gradient-to-r ${config.bg} flex items-center gap-2`}
        >
          <Icon className={`w-4 h-4 ${config.text}`} />
          <span className={`font-bold text-sm ${config.text}`}>
            {data.trendStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase mb-2">Daily Limit</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 text-transparent bg-clip-text">
            ₹{data.dailySafeToSpend.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase mb-2">Monthly Limit</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 text-transparent bg-clip-text">
            ₹{data.monthlySafeToSpend.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Current Balance</span>
          <span className="font-bold text-white">
            ₹{data.currentBalance.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Emergency Buffer</span>
          <span className="font-bold text-red-400">
            -₹{data.emergencyBuffer.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Upcoming Bills</span>
          <span className="font-bold text-red-400">
            -₹{data.upcomingExpenses.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm border-t border-white/10 pt-3">
          <span className="text-gray-400 font-bold">Available Pool</span>
          <span className="font-bold text-green-400">
            ₹{data.availablePool.toLocaleString()}
          </span>
        </div>
      </div>

      {data.reasons && data.reasons.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">
            Why This Amount?
          </p>
          <div className="space-y-2">
            {data.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
                <p className="text-sm text-gray-300">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {data.remainingDays} days remaining
        </span>
        <span className="text-xs text-gray-500">
          Risk Score: {data.riskScore}/100
        </span>
      </div>
    </motion.div>
  );
}
