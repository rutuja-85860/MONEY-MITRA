import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  DollarSign,
  Zap,
} from "lucide-react";

const API = "http://localhost:5000/api";

export default function SpendingHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await axios.get(`${API}/trends/heatmap`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("📊 Heatmap response:", res.data);
        setData(res.data);
      } catch (error) {
        console.error("Heatmap fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
        <p className="text-gray-400">Loading trends...</p>
      </div>
    );
  }

  if (!data || !data.heatmap || data.heatmap.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-300 text-lg">No trend data available yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Add transactions to see spending patterns. Need at least 1 month of transaction data.
        </p>
      </div>
    );
  }

  const trendConfig = {
    IMPROVING: {
      bg: "from-green-500/20 to-emerald-500/20",
      text: "text-green-400",
      icon: CheckCircle,
      border: "border-green-500/30",
    },
    STABLE: {
      bg: "from-yellow-500/20 to-orange-500/20",
      text: "text-yellow-400",
      icon: Activity,
      border: "border-yellow-500/30",
    },
    DETERIORATING: {
      bg: "from-red-500/20 to-pink-500/20",
      text: "text-red-400",
      icon: AlertCircle,
      border: "border-red-500/30",
    },
  };

  const config = trendConfig[data.trendStatus || "STABLE"] || trendConfig.STABLE;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Trend Status Banner */}
      {data.trendStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${config.bg} backdrop-blur-xl p-6 rounded-2xl border ${config.border}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${config.bg}`}>
                <StatusIcon className={`w-6 h-6 ${config.text}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Spending Trend</h3>
                <p className={`text-sm ${config.text} font-semibold`}>
                  {data.trendStatus}
                </p>
              </div>
            </div>
            {data.trendPenaltyFactor !== undefined && (
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase">Penalty Factor</p>
                <p className={`text-2xl font-bold ${config.text}`}>
                  {((data.trendPenaltyFactor || 0) * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>

          {/* Insights */}
          {data.insights && data.insights.length > 0 && (
            <div className="space-y-2">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2" />
                  <p className="text-sm text-gray-200">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Month-over-Month Change */}
        {data.moMChange && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-400 uppercase">
                Month-over-Month
              </h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Total Spending</span>
                <span
                  className={`font-bold ${
                    data.moMChange.total > 0 ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {data.moMChange.total > 0 ? "+" : ""}
                  {data.moMChange.total.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Essential</span>
                <span
                  className={`font-bold ${
                    data.moMChange.essential > 0
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {data.moMChange.essential > 0 ? "+" : ""}
                  {data.moMChange.essential.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Non-Essential</span>
                <span
                  className={`font-bold ${
                    data.moMChange.nonEssential > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {data.moMChange.nonEssential > 0 ? "+" : ""}
                  {data.moMChange.nonEssential.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Daily Velocity */}
        {data.dailyVelocity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-400 uppercase">
                Daily Velocity
              </h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Current Month</span>
                <span className="font-bold text-white">
                  ₹{(data.dailyVelocity.current || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Last Month</span>
                <span className="font-bold text-gray-400">
                  ₹{(data.dailyVelocity.previous || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Change</span>
                <span
                  className={`font-bold ${
                    (data.dailyVelocity.changePercent || 0) > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {(data.dailyVelocity.changePercent || 0) > 0 ? "+" : ""}
                  {(data.dailyVelocity.changePercent || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Category */}
        {data.topCategory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <DollarSign className="w-5 h-5 text-orange-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-400 uppercase">
                Top Category
              </h4>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-white">
                  {data.topCategory.name}
                </p>
                <p className="text-sm text-gray-400">
                  ₹{(data.topCategory.amount || 0).toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Share of Spending</span>
                <span className="font-bold text-orange-400">
                  {data.topCategory.share || 0}%
                </span>
              </div>
              {data.topCategory.changeFromLastMonth !== null && 
               data.topCategory.changeFromLastMonth !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">vs Last Month</span>
                  <span
                    className={`font-bold ${
                      data.topCategory.changeFromLastMonth > 0
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {data.topCategory.changeFromLastMonth > 0 ? "+" : ""}
                    {data.topCategory.changeFromLastMonth}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

     {/* Heatmap Chart - FIXED */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10"
>
  <h3 className="text-xl font-bold text-white mb-6">
    {data.metadata?.monthsAnalyzed || 3}-Month Spending Breakdown
  </h3>
  
  {/* FIXED: Wrapped in div with fixed dimensions */}
  <div style={{ width: '100%', height: '320px', position: 'relative' }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.heatmap}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
        <XAxis
          dataKey="monthKey"
          stroke="#9ca3af"
          tick={{ fill: "#9ca3af" }}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: "#9ca3af" }}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a2e",
            border: "1px solid #ffffff20",
            borderRadius: "12px",
            color: "#fff",
          }}
          formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
        />
        <Legend />
        <Bar dataKey="Essential" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
        <Bar
          dataKey="NonEssential"
          stackId="a"
          fill="#f59e0b"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* Metadata */}
  {data.metadata && (
    <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-xs text-gray-500">
      <span>
        {data.metadata.monthsAnalyzed || 0} months •{" "}
        {data.metadata.totalTransactions || 0} transactions
      </span>
      {data.metadata.dateRange && (
        <span>
          {data.metadata.dateRange.from} to {data.metadata.dateRange.to}
        </span>
      )}
    </div>
  )}
</motion.div>


      {/* Expense-to-Income Ratio */}
      {data.expenseIncomeRatio !== null && data.expenseIncomeRatio !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10"
        >
          <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">
            Expense-to-Income Ratio
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                {Math.round((data.expenseIncomeRatio || 0) * 100)}%
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {data.expenseIncomeRatio < 0.7
                  ? "Healthy"
                  : data.expenseIncomeRatio < 0.85
                  ? "Moderate"
                  : "High Risk"}
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((data.expenseIncomeRatio || 0) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full ${
                    data.expenseIncomeRatio < 0.7
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : data.expenseIncomeRatio < 0.85
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                      : "bg-gradient-to-r from-red-500 to-pink-500"
                  }`}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
