import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:5000/api";

export default function Onboarding() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const [form, setForm] = useState({
    incomeType: "monthly",
    incomeAmount: "",
    fixedExpenses: "",
    weeklyEssentials: "",
    monthlySavings: "",
    hasLoans: false,
    loansAmount: "",
    primaryGoal: "save_more",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(`${API}/onboarding`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.profile) {
        setAiMessage(res.data.profile.groqWelcome);
        localStorage.setItem("onboarding_done", "1");

        // Run Financial Engine
        await axios.get(`${API}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTimeout(() => navigate("/dashboard"), 3000);
      }
    } catch (err) {
      console.error(err.response?.data || err);
      setAiMessage("Strategist, we encountered a synchronization error. Please retry.");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex justify-center items-center bg-[#0f0b1f] text-white font-sans overflow-hidden p-6">
      
      {/* --- BACKGROUND LAYER - Matching Landing Page --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Main gradient background matching landing page */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0f0b1f] to-[#050208]" />
        
        {/* Large purple glow - top left */}
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-purple-700/25 rounded-full blur-[200px] animate-pulse" 
          style={{ animationDuration: '8s' }}
        />
        
        {/* Purple glow - top right */}
        <div className="absolute top-[-15%] right-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[180px]" />
        
        {/* Center glow for depth */}
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px]" />
        
        {/* Bottom glow */}
        <motion.div
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-1/3 w-[700px] h-[700px] bg-purple-500/15 rounded-full blur-[130px]"
        />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Floating particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: "110vh",
              x: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.5, 0],
              y: "-10vh",
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              delay: Math.random() * 20,
              ease: "linear",
            }}
            className="absolute w-[1.5px] h-[1.5px] bg-purple-300/70 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
          />
        ))}
      </div>

      {/* --- MAIN CONTENT --- */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.15] rounded-[2.5rem] shadow-[0_40px_120px_rgba(124,58,237,0.3)] p-8 md:p-12 hover:border-purple-400/40 transition-all duration-500 group"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.08] via-transparent to-pink-500/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] pointer-events-none" />
        
        {/* Inner glow effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />

        <div className="relative z-10">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <h1 className="text-purple-400 text-xs md:text-sm font-bold tracking-[0.3em] mb-4 uppercase drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]">
              Profile Initialization
            </h1>
            <h2 className="text-3xl md:text-5xl font-light mb-4 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              Calibrate Your{" "}
              <span className="font-semibold italic bg-gradient-to-r from-purple-400 via-pink-300 to-purple-300 text-transparent bg-clip-text drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]">
                Financial Engine
              </span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed text-sm md:text-base drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              Your Autonomous Coach requires these data streams to synthesize your personalized wealth strategy.
            </p>
          </div>

          {/* Form */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={submit}>
            
            {/* Income Source */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Income Source
              </label>
              <select
                name="incomeType"
                value={form.incomeType}
                onChange={handleChange}
                className="w-full bg-white/[0.08] border border-white/[0.2] rounded-2xl p-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.12] outline-none transition-all appearance-none cursor-pointer backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              >
                <option className="bg-[#1a0f2e]" value="monthly">Monthly Salary</option>
                <option className="bg-[#1a0f2e]" value="weekly">Weekly / Gig</option>
                <option className="bg-[#1a0f2e]" value="irregular">Irregular</option>
              </select>
            </div>

            {/* Income Amount */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Income Amount ($)
              </label>
              <input
                type="number"
                name="incomeAmount"
                placeholder="e.g. 5000"
                value={form.incomeAmount}
                onChange={handleChange}
                className="w-full bg-white/[0.08] border border-white/[0.2] rounded-2xl p-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.12] outline-none transition-all placeholder:text-gray-500 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                required
              />
            </div>

            {/* Fixed Monthly Expenses */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Fixed Monthly Expenses
              </label>
              <input
                type="number"
                name="fixedExpenses"
                placeholder="Rent, Bills, Subscriptions"
                value={form.fixedExpenses}
                onChange={handleChange}
                className="w-full bg-white/[0.08] border border-white/[0.2] rounded-2xl p-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.12] outline-none transition-all placeholder:text-gray-500 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                required
              />
            </div>

            {/* Weekly Essentials */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Weekly Essentials
              </label>
              <input
                type="number"
                name="weeklyEssentials"
                placeholder="Food, Transit, Leisure"
                value={form.weeklyEssentials}
                onChange={handleChange}
                className="w-full bg-white/[0.08] border border-white/[0.2] rounded-2xl p-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.12] outline-none transition-all placeholder:text-gray-500 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                required
              />
            </div>

            {/* Savings Contribution Goal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Savings Contribution Goal
              </label>
              <input
                type="number"
                name="monthlySavings"
                placeholder="Monthly Target"
                value={form.monthlySavings}
                onChange={handleChange}
                className="w-full bg-white/[0.08] border border-white/[0.2] rounded-2xl p-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.12] outline-none transition-all placeholder:text-gray-500 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              />
            </div>

            {/* Primary Objective */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Primary Objective
              </label>
              <select
                name="primaryGoal"
                value={form.primaryGoal}
                onChange={handleChange}
                className="w-full bg-white/[0.08] border border-white/[0.2] rounded-2xl p-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.12] outline-none transition-all appearance-none cursor-pointer backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              >
                <option className="bg-[#1a0f2e]" value="save_more">Maximize Monthly Savings</option>
                <option className="bg-[#1a0f2e]" value="reduce_spending">Mitigate Overspending</option>
                <option className="bg-[#1a0f2e]" value="emergency_fund">Initialize Emergency Fund</option>
                <option className="bg-[#1a0f2e]" value="plan_budget">Advanced Budget Planning</option>
              </select>
            </div>

            {/* Loan Checkbox */}
            <div className="md:col-span-2 flex items-center gap-4 bg-white/[0.06] p-4 rounded-2xl border border-white/[0.15] backdrop-blur-xl">
              <input
                type="checkbox"
                name="hasLoans"
                id="hasLoans"
                checked={form.hasLoans}
                onChange={handleChange}
                className="h-5 w-5 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="hasLoans" className="text-sm text-gray-300 font-medium cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                I have active Loan/EMI obligations
              </label>
            </div>

            {/* Loan Amount (Conditional) */}
            <AnimatePresence>
              {form.hasLoans && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:col-span-2 space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Total Monthly EMI Amount
                  </label>
                  <input
                    type="number"
                    name="loansAmount"
                    placeholder="Enter total EMI"
                    value={form.loansAmount}
                    onChange={handleChange}
                    className="w-full bg-white/[0.08] border border-white/[0.2] rounded-2xl p-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.12] outline-none transition-all placeholder:text-gray-500 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="md:col-span-2 pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-600 hover:to-purple-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_rgba(168,85,247,0.7)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-purple-400/40 overflow-hidden"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="relative z-10">Synthesizing Strategy...</span>
                  </>
                ) : (
                  <span className="relative z-10">Initialize Financial Coach</span>
                )}
                {/* Button shine effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </motion.button>
            </div>
          </form>

          {/* AI Response Message */}
          <AnimatePresence>
            {aiMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 bg-purple-500/10 border border-purple-400/30 p-6 rounded-3xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🤖</span>
                  <p className="font-bold text-purple-300 text-sm uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(168,85,247,0.8)]">
                    Autonomous Coach Response
                  </p>
                </div>
                <p className="text-gray-200 leading-relaxed italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                  "{aiMessage}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
