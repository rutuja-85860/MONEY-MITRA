import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Camera,
  RefreshCcw,
  FileText,
  Loader2,
  XCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Tag,
  PlusCircle,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Repeat,
  Zap,
  Info,
  CheckCircle,
} from "lucide-react";

const API = "http://localhost:5000/api";

// Intelligence Badge Component
const IntelligenceBadge = ({ transaction }) => {
  if (!transaction) return null;

  const badges = [];

  if (transaction.spendingVelocityImpact === "HIGH") {
    badges.push({
      icon: Zap,
      text: "High Velocity",
      color: "bg-red-100/10 text-red-400 border-red-500/30",
    });
  } else if (transaction.spendingVelocityImpact === "MEDIUM") {
    badges.push({
      icon: TrendingUp,
      text: "Medium Velocity",
      color: "bg-yellow-100/10 text-yellow-400 border-yellow-500/30",
    });
  }

  if (transaction.isRecurringDetected) {
    badges.push({
      icon: Repeat,
      text: `Recurring (${
        transaction.recurringMetadata?.frequency || "detected"
      })`,
      color: "bg-blue-100/10 text-blue-400 border-blue-500/30",
    });
  }

  if (transaction.safeToSpendImpact > 20) {
    badges.push({
      icon: AlertCircle,
      text: `${Math.round(transaction.safeToSpendImpact)}% impact`,
      color: "bg-purple-100/10 text-purple-400 border-purple-500/30",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges.map((badge, idx) => (
        <span
          key={idx}
          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${badge.color} backdrop-blur-sm`}
        >
          <badge.icon className="w-3 h-3 mr-1" />
          {badge.text}
        </span>
      ))}
    </div>
  );
};

// Transaction Row with Tooltip
const TransactionRow = ({ transaction, formatDate }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Use direction field to determine if income or expense
  const isExpense = transaction.direction === "DEBIT";
  const isEssential = transaction.aiClassification === "Essential";

  return (
    <tr className="hover:bg-white/5 transition-all duration-200 relative border-b border-white/5">
      <td className="px-4 py-4 text-sm font-medium text-white/90">
        <div className="flex items-center gap-2">
          <span className="truncate max-w-xs">{transaction.description}</span>
          {transaction.balanceSnapshot !== null &&
            transaction.balanceSnapshot !== undefined && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip && (
                  <div className="absolute z-50 left-0 top-6 w-64 p-3 bg-gray-900/95 backdrop-blur-xl text-white text-xs rounded-xl shadow-2xl border border-purple-500/20">
                    <p className="font-semibold mb-2 text-purple-300">
                      Transaction Intelligence
                    </p>
                    <div className="space-y-1">
                      <p>
                        Balance Before: ₹
                        {transaction.balanceSnapshot?.toLocaleString()}
                      </p>
                      <p>
                        Balance After: ₹
                        {(
                          transaction.balanceSnapshot -
                          (isExpense ? transaction.amount : -transaction.amount)
                        )?.toLocaleString()}
                      </p>
                      {transaction.safeToSpendImpact > 0 && (
                        <p className="text-yellow-400">
                          Reduced weekly budget by{" "}
                          {Math.round(transaction.safeToSpendImpact)}%
                        </p>
                      )}
                      {transaction.isRecurringDetected && (
                        <p className="text-blue-400">
                          Detected as recurring{" "}
                          {transaction.recurringMetadata?.frequency} expense
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
        <IntelligenceBadge transaction={transaction} />
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm">
        <div
          className={`flex items-center font-bold ${
            isExpense ? "text-red-400" : "text-green-400"
          }`}
        >
          {isExpense ? (
            <ArrowDown className="w-4 h-4 mr-1" />
          ) : (
            <ArrowUp className="w-4 h-4 mr-1" />
          )}
          ₹
          {Math.abs(transaction.amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
        <div className="flex items-center">
          <Tag className="w-4 h-4 mr-1 text-purple-400" />
          {transaction.category}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${
              isEssential
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
            }`}
        >
          {transaction.aiClassification}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1 text-gray-500" />
          {formatDate(transaction.date)}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
        <div className="flex items-center gap-1">
          {transaction.source}
          {transaction.confidenceScore < 90 && (
            <span className="text-xs text-amber-400">
              ({transaction.confidenceScore}%)
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

// Transaction List Display Component
function TransactionListDisplay({ data, loading, error, onRefresh }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="ml-3 text-purple-300">Fetching transactions...</p>
      </div>
    );

  if (error)
    return (
      <p className="text-center py-8 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
        Error loading history: {error}
      </p>
    );

  const { transactions = [], upcomingRecurring = [], stats = {} } = data;

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 bg-white/3 backdrop-blur-2xl rounded-3xl border border-white/10">
        <PlusCircle className="w-12 h-12 mx-auto mb-4 text-purple-400" />
        <p className="text-gray-300 text-lg">
          No transactions recorded yet.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Upload a receipt or add one manually to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Intelligence Summary - FIXED: Now updates in real-time */}
      <div className="bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-indigo-600/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
        <h4 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          Transaction Intelligence Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group-item">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Total Transactions
            </p>
            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-purple-200 text-transparent bg-clip-text">
              {stats.total || 0}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group-item">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Recurring Detected
            </p>
            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 text-transparent bg-clip-text">
              {stats.recurring || 0}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group-item">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              High Velocity
            </p>
            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-300 text-transparent bg-clip-text">
              {stats.highVelocity || 0}
            </p>
          </div>
        </div>

        {/* Upcoming Recurring Expenses */}
        {upcomingRecurring.length > 0 && (
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
            <h5 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-yellow-400" />
              Upcoming Recurring Expenses (Next 30 Days)
            </h5>
            <div className="space-y-3">
              {upcomingRecurring.map((expense, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors"
                >
                  <span className="text-gray-300">
                    {expense.description} ({expense.category})
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">
                      ₹{expense.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full">
                      {expense.daysUntil} days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decorative Glow */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Transaction List */}
      <div className="bg-white/3 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 md:p-6 hover:border-purple-500/30 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 text-transparent bg-clip-text">
            Recent Spending History
          </h3>
          <button
            onClick={onRefresh}
            className="flex items-center text-sm text-purple-400 hover:text-purple-300 font-semibold gap-2 px-4 py-2 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 transition-all border border-purple-500/20"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5 backdrop-blur-sm border-b border-white/10">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <TransactionRow
                  key={t._id}
                  transaction={t}
                  formatDate={formatDate}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function TransactionManager({ onEngineRecalculate }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [errorUpload, setErrorUpload] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [nudgeMsg, setNudgeMsg] = useState("");

  const [transactionData, setTransactionData] = useState({
    transactions: [],
    upcomingRecurring: [],
    stats: {},
  });
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState(null);

  const [manualForm, setManualForm] = useState({
    amount: "",
    description: "",
    category: "Groceries",
    type: "expense",
    date: new Date().toISOString().substring(0, 10),
  });
  const [loadingManual, setLoadingManual] = useState(false);

  const token = localStorage.getItem("token");

  const fetchTransactions = useCallback(async () => {
    setLoadingList(true);
    setErrorList(null);
    try {
      const res = await axios.get(`${API}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) {
        setTransactionData({
          transactions: res.data,
          upcomingRecurring: [],
          stats: {
            total: res.data.length,
            recurring: res.data.filter((t) => t.isRecurringDetected).length,
            highVelocity: res.data.filter(
              (t) => t.spendingVelocityImpact === "HIGH"
            ).length,
          },
        });
      } else {
        setTransactionData(res.data);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err.response?.data || err);
      setErrorList("Failed to load transactions history.");
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setErrorUpload(null);
      setSuccessMsg("");
      setNudgeMsg("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorUpload("Please select an image of a receipt first.");
      return;
    }

    setLoadingUpload(true);
    setErrorUpload(null);
    setSuccessMsg("");
    setNudgeMsg("");

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const res = await axios.post(`${API}/transactions/ocr`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg(
        `Success! Saved transaction: ₹${res.data.transaction.amount.toFixed(
          2
        )} for ${res.data.transaction.description}`
      );
      setNudgeMsg(res.data.nudge);

      await fetchTransactions();
      if (onEngineRecalculate) {
        onEngineRecalculate();
      }

      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("OCR Upload Failed:", err.response?.data || err);
      setErrorUpload(
        err.response?.data?.error ||
          err.response?.data?.msg ||
          "Failed to process receipt. Try a clearer image."
      );
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoadingManual(true);
    setErrorUpload(null);
    setSuccessMsg("");
    setNudgeMsg("");

    if (!manualForm.amount || !manualForm.description || !manualForm.date) {
      setErrorUpload("All manual fields are required.");
      setLoadingManual(false);
      return;
    }

    try {
      const res = await axios.post(`${API}/transactions`, manualForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMsg(
        `Manual entry saved: ₹${res.data.transaction.amount.toFixed(2)} for ${
          res.data.transaction.description
        }`
      );
      setNudgeMsg(res.data.nudge);

      await fetchTransactions();
      if (onEngineRecalculate) {
        onEngineRecalculate();
      }

      setManualForm({
        amount: "",
        description: "",
        category: "Groceries",
        type: "expense",
        date: new Date().toISOString().substring(0, 10),
      });
    } catch (err) {
      console.error("Manual Entry Failed:", err);
      setErrorUpload(
        err.response?.data?.msg || "Failed to save manual transaction."
      );
    } finally {
      setLoadingManual(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* OCR UPLOADER SECTION - Matching Landing Page Theme */}
      <div className="bg-white/3 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
            <Camera className="h-5 w-5 text-white" />
          </div>
          OCR Transaction Capture
        </h3>

        <div className="space-y-4 relative z-10">
          <input
            type="file"
            id="receipt-upload"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="receipt-upload"
            className="flex items-center justify-center gap-3 cursor-pointer bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 text-purple-300 font-semibold py-4 px-6 rounded-xl transition-all border border-purple-500/30 hover:border-purple-500/50 backdrop-blur-sm"
          >
            {file ? (
              <FileText className="h-5 w-5" />
            ) : (
              <RefreshCcw className="h-5 w-5" />
            )}
            {file ? "Change File" : "Choose Receipt Image"}
          </label>

          {file && (
            <div className="text-sm text-gray-300 text-center bg-white/5 py-2 px-4 rounded-xl border border-white/10">
              Selected: <strong className="text-purple-300">{file.name}</strong>
            </div>
          )}

          {previewUrl && (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Receipt Preview"
                className="max-h-64 max-w-full rounded-2xl object-contain border border-purple-500/30"
                onLoad={() => URL.revokeObjectURL(previewUrl)}
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loadingUpload}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25 border border-purple-400/30"
          >
            {loadingUpload ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Analyze & Save Transaction
              </>
            )}
          </button>
        </div>
      </div>

      {/* MANUAL ENTRY SECTION - Matching Landing Page Theme */}
      <div className="bg-white/3 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-3">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          Manual Transaction Entry
        </h3>

        <form
          onSubmit={handleManualSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10"
        >
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Type
            </label>
            <select
              name="type"
              value={manualForm.type}
              onChange={handleManualChange}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
            >
              <option value="expense" className="bg-gray-900">
                💸 Expense
              </option>
              <option value="income" className="bg-gray-900">
                💰 Income
              </option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={manualForm.amount}
              onChange={handleManualChange}
              required
              step="0.01"
              min="0"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
              placeholder="Enter amount"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={manualForm.date}
              onChange={handleManualChange}
              required
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={manualForm.description}
              onChange={handleManualChange}
              required
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
              placeholder="What did you spend on?"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Category
            </label>
            <select
              name="category"
              value={manualForm.category}
              onChange={handleManualChange}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
            >
              <option value="Groceries" className="bg-gray-900">
                Groceries
              </option>
              <option value="Food" className="bg-gray-900">
                Dining/Takeout
              </option>
              <option value="Transport" className="bg-gray-900">
                Transport
              </option>
              <option value="Entertainment" className="bg-gray-900">
                Entertainment
              </option>
              <option value="Shopping" className="bg-gray-900">
                Shopping
              </option>
              <option value="Subscription" className="bg-gray-900">
                Subscription
              </option>
              <option value="Salary" className="bg-gray-900">
                Salary
              </option>
              <option value="Other" className="bg-gray-900">
                Other
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loadingManual}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25 border border-purple-400/30"
            >
              {loadingManual ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Add Manual Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* STATUS MESSAGES - Matching Landing Page Theme */}
      {(errorUpload || successMsg || nudgeMsg) && (
        <div className="space-y-3">
          {(errorUpload || successMsg) && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 border backdrop-blur-2xl ${
                errorUpload
                  ? "bg-red-500/10 text-red-300 border-red-500/30"
                  : "bg-green-500/10 text-green-300 border-green-500/30"
              }`}
            >
              {errorUpload ? (
                <XCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="flex-1">{errorUpload || successMsg}</span>
            </div>
          )}
          {nudgeMsg && (
            <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-white backdrop-blur-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-1 text-purple-200">
                    AI Insight
                  </p>
                  <p className="text-sm text-gray-300">{nudgeMsg}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRANSACTION LIST SECTION */}
      <TransactionListDisplay
        data={transactionData}
        loading={loadingList}
        error={errorList}
        onRefresh={fetchTransactions}
      />
    </div>
  );
}
