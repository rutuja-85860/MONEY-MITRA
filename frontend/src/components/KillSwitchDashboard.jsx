import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Shield,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
} from "lucide-react";

const API = "http://localhost:5000/api";

export default function KillSwitchDashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKillSwitchStatus();
    const interval = setInterval(loadKillSwitchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadKillSwitchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/kill-switch/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(res.data.data);
    } catch (error) {
      console.error("Kill-switch status error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading financial control status...</div>;
  }

  if (!status) {
    return <div className="text-red-400">Failed to load kill-switch status</div>;
  }

  const { safeToSpend, risk, killSwitch } = status;

  const levelConfig = {
    GREEN: {
      color: "text-green-400",
      bg: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/40",
      icon: CheckCircle,
      title: "All Systems Clear",
    },
    YELLOW: {
      color: "text-yellow-400",
      bg: "from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-500/40",
      icon: AlertTriangle,
      title: "Elevated Risk",
    },
    ORANGE: {
      color: "text-orange-400",
      bg: "from-orange-500/20 to-red-500/20",
      border: "border-orange-500/40",
      icon: AlertCircle,
      title: "High Risk - Restrictions Active",
    },
    RED: {
      color: "text-red-400",
      bg: "from-red-500/20 to-rose-500/20",
      border: "border-red-500/40",
      icon: AlertCircle,
      title: "CRITICAL - Spending Blocked",
    },
  };

  const config = levelConfig[killSwitch.level];
  const LevelIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Kill-Switch Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative bg-gradient-to-br ${config.bg} backdrop-blur-xl rounded-3xl p-8 border-2 ${config.border} shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border}`}>
              <Shield className={`h-8 w-8 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{config.title}</h3>
              <p className="text-sm text-gray-400">Financial Kill-Switch</p>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${config.bg} border-2 ${config.border}`}
          >
            <span className={`text-2xl font-black ${config.color}`}>
              {killSwitch.level}
            </span>
          </motion.div>
        </div>

        {/* Risk Score */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-300 uppercase">Risk Score</span>
            <span className={`text-xl font-black ${config.color}`}>
              {risk.riskScore}/100
            </span>
          </div>
          <div className="relative w-full h-4 bg-gray-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${risk.riskScore}%` }}
              className={`h-full bg-gradient-to-r ${config.bg}`}
            />
          </div>
        </div>

        {/* Risk Explanation */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white uppercase">Risk Factors:</h4>
          {risk.explanation.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
              <AlertCircle className="w-4 h-4 mt-0.5 text-orange-400" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Safe-to-Spend Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          icon={DollarSign}
          title="Safe-to-Spend Remaining"
          value={`₹${Math.round(safeToSpend.remainingSafeToSpend).toLocaleString()}`}
          subtitle={`Daily: ₹${Math.round(safeToSpend.dailyAllowance)}`}
        />
        <MetricCard
          icon={Calendar}
          title="Days Until Exhaustion"
          value={safeToSpend.exhaustionDate.daysUntilExhaustion}
          subtitle={safeToSpend.exhaustionDate.status}
        />
        <MetricCard
          icon={Target}
          title="Current Balance"
          value={`₹${Math.round(safeToSpend.currentBalance).toLocaleString()}`}
          subtitle={`Buffer: ₹${Math.round(safeToSpend.emergencyBuffer)}`}
        />
      </div>

      {/* Blocked Categories */}
      {killSwitch.blockedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6"
        >
          <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Blocked Categories
          </h4>
          <div className="flex flex-wrap gap-2">
            {killSwitch.blockedCategories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm font-semibold"
              >
                {cat}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, subtitle }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-6 h-6 text-purple-400" />
        <span className="text-xs text-gray-400 uppercase font-bold">{title}</span>
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </motion.div>
  );
}
