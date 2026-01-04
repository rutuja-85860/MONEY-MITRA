import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";

const API = "http://localhost:5000/api";

export default function IncomeExpenseChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month"); // month, 3months, year

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/analytics/income-expense?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (error) {
      console.error("Income/Expense fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 text-center">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex gap-3">
        {["month", "3months", "year"].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              timeframe === tf
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tf === "month" ? "This Month" : tf === "3months" ? "3 Months" : "This Year"}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl p-6 rounded-2xl border border-green-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase">Total Income</h4>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">₹{data.totalIncome.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">{data.incomeCount} transactions</p>
        </motion.div>

        {/* Total Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl p-6 rounded-2xl border border-red-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase">Total Expenses</h4>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">₹{data.totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">{data.expenseCount} transactions</p>
        </motion.div>

        {/* Net Savings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${
            data.netSavings >= 0
              ? "from-purple-500/10 to-purple-600/5 border-purple-500/20"
              : "from-orange-500/10 to-orange-600/5 border-orange-500/20"
          } backdrop-blur-xl p-6 rounded-2xl border`}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase">Net Savings</h4>
            <DollarSign
              className={`w-5 h-5 ${data.netSavings >= 0 ? "text-purple-400" : "text-orange-400"}`}
            />
          </div>
          <p
            className={`text-3xl font-bold ${
              data.netSavings >= 0 ? "text-purple-400" : "text-orange-400"
            }`}
          >
            ₹{Math.abs(data.netSavings).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {data.savingsRate}% savings rate
          </p>
        </motion.div>
      </div>

      {/* Income vs Expense Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-bold text-white mb-6">Income vs Expenses Trend</h3>
        <div style={{ width: "100%", height: "320px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
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
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Breakdown Pie Chart */}
      {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-xl font-bold text-white mb-6">Expense Categories</h3>
          <div style={{ width: "100%", height: "320px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #ffffff20",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
