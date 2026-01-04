import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Shield, TrendingUp, CheckCircle } from "lucide-react";

const API = "http://localhost:5000/api";

export default function TransactionValidation({ transactionData, onProceed, onCancel }) {
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateTransaction = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/kill-switch/validate`,
        transactionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setValidation(res.data.validation);
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (transactionData) {
      validateTransaction();
    }
  }, [transactionData]);

  if (loading) {
    return <div className="text-white">Validating transaction...</div>;
  }

  if (!validation) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div
          className={`bg-gray-900 rounded-3xl p-8 max-w-2xl border-2 ${
            validation.allowed ? "border-green-500/40" : "border-red-500/40"
          }`}
        >
          <div className="flex items-center gap-4 mb-6">
            {validation.allowed ? (
              <CheckCircle className="w-10 h-10 text-green-400" />
            ) : (
              <Shield className="w-10 h-10 text-red-400" />
            )}
            <div>
              <h3 className="text-2xl font-black text-white">
                {validation.allowed ? "Transaction Approved" : "Transaction Blocked"}
              </h3>
              <p className={`text-sm ${validation.allowed ? "text-green-400" : "text-red-400"}`}>
                {validation.status}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-300 mb-4">{validation.reason}</p>
            
            {validation.currentDailySpend && (
              <div className="space-y-2 text-sm text-gray-400">
                <p>Current daily spend: ₹{validation.currentDailySpend}</p>
                <p>Attempted total: ₹{validation.attemptedTotal}</p>
                <p>Daily limit: ₹{Math.round(validation.dailyLimit)}</p>
              </div>
            )}
          </div>

          {/* Recovery Scenarios */}
          {validation.recovery && (
            <div className="mb-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
              <h4 className="text-lg font-bold text-blue-400 mb-4">Recovery Options:</h4>
              <div className="space-y-3">
                {validation.recovery.scenarios.map((scenario, idx) => (
                  <div key={idx} className="p-4 bg-gray-800/50 rounded-xl">
                    <p className="font-semibold text-white mb-1">{scenario.description}</p>
                    <p className="text-sm text-gray-400">{scenario.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {validation.allowed ? (
              <>
                <button
                  onClick={onProceed}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition"
                >
                  Proceed
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={onCancel}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition"
              >
                Understood
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
