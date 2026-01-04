import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";

const API = "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API}/auth/register`, {
        email: email.trim().toLowerCase(),
        password,
      });

      console.log("Registered Successfully. Redirecting to login.");
      navigate("/login");
    } catch (err) {
      console.error("Registration failed:", err);
      setErrorMsg(
        err.response?.data?.msg || "User already exists or server error."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0f0b1f] flex items-center justify-center overflow-hidden font-sans py-12">
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://wallpaperaccess.com/full/732220.jpg')`,
            filter: 'brightness(0.5) contrast(1.1)'
          }}
        />
        
        {/* Lighter overlay for better image visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0b1f]/40 via-[#0f0b1f]/50 to-[#050208]/60" />
      </div>

      {/* ANIMATED OVERLAY EFFECTS */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {/* Purple gradient overlays for theme consistency */}
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-purple-700/10 rounded-full blur-[200px] animate-pulse" 
          style={{ animationDuration: '8s' }}
        />
        
        <div className="absolute top-[-15%] right-[-10%] w-[800px] h-[800px] bg-purple-600/8 rounded-full blur-[180px]" />
        
        <motion.div
          animate={{ 
            opacity: [0.08, 0.2, 0.08],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] bg-purple-500/8 rounded-full blur-[130px]"
        />

        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: "110vh",
              x: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.4, 0],
              y: "-10vh",
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              delay: Math.random() * 20,
              ease: "linear",
            }}
            className="absolute w-[1px] h-[1px] bg-purple-300/60 rounded-full shadow-[0_0_6px_rgba(168,85,247,0.6)]"
          />
        ))}
      </div>

      {/* FOREGROUND - Centered Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative bg-black/20 backdrop-blur-2xl border border-white/[0.2] p-8 md:p-10 rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.4)] hover:border-purple-400/50 hover:shadow-[0_40px_140px_rgba(168,85,247,0.3)] transition-all duration-500 group"
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.12] via-transparent to-pink-500/[0.12] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] pointer-events-none" />
          
          {/* Inner glow effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-purple-500/30 via-transparent to-pink-500/30 rounded-[2.5rem] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />

          <div className="relative z-10">
            {/* Header Section */}
            <div className="mb-8 text-center">
              <h1 className="text-purple-400 text-xs md:text-sm font-bold tracking-[0.4em] mb-5 uppercase drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]">
                MONEY MITRA
              </h1>
              <h2 className="text-white text-3xl md:text-4xl font-light mb-3 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                Create your{" "}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 via-pink-300 to-purple-300 text-transparent bg-clip-text drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]">
                  strategy profile
                </span>
              </h2>
              <p className="text-gray-200 text-xs md:text-sm leading-relaxed mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                Unlock your autonomous financial workspace in under a minute.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-400/30 text-red-300 p-3 rounded-xl mb-5 text-center text-xs font-medium backdrop-blur-sm"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Work email"
                  className="w-full bg-white/[0.12] border border-white/[0.25] rounded-2xl px-5 py-3.5 text-white text-sm focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.15] transition-all outline-none placeholder:text-gray-300 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  placeholder="Create a strong password"
                  className="w-full bg-white/[0.12] border border-white/[0.25] rounded-2xl px-5 py-3.5 text-white text-sm focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.15] transition-all outline-none placeholder:text-gray-300 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full bg-white/[0.12] border border-white/[0.25] rounded-2xl px-5 py-3.5 text-white text-sm focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.15] transition-all outline-none placeholder:text-gray-300 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-600 hover:to-purple-500 text-white py-3.5 rounded-2xl font-bold text-base md:text-lg transition-all shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_rgba(168,85,247,0.7)] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-purple-400/40 overflow-hidden mt-2"
              >
                <span className="relative z-10">
                  {isLoading ? "Creating workspace..." : "Create Account"}
                </span>
                {/* Button shine effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </motion.button>
            </form>

            {/* Terms and Privacy */}
            <p className="text-[10px] text-gray-300 mt-4 text-center leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              By continuing you agree to our{" "}
              <span className="text-purple-300 hover:text-purple-200 cursor-pointer transition-colors">
                Terms
              </span>{" "}
              and{" "}
              <span className="text-purple-300 hover:text-purple-200 cursor-pointer transition-colors">
                Privacy Policy
              </span>
            </p>

            {/* Divider */}
            <div className="my-7 flex items-center">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="mx-4 text-gray-300 text-[10px] tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                or sign up with
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>

            {/* Social Login Icons */}
            <div className="flex justify-center gap-5 mb-6">
              <SocialIcon icon={<FaGoogle />} />
              <SocialIcon icon={<FaFacebook />} />
              <SocialIcon icon={<FaApple />} />
            </div>

            {/* Login Link */}
            <div className="text-center text-xs text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span>Already have an account? </span>
              <Link
                to="/login"
                className="text-purple-300 hover:text-purple-200 transition-colors font-semibold"
              >
                Log in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SocialIcon({ icon }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="text-gray-200 text-lg hover:text-purple-300 transition-all bg-white/[0.12] p-3.5 rounded-full border border-white/[0.25] hover:border-purple-400/60 hover:bg-white/[0.18] hover:shadow-[0_0_24px_rgba(168,85,247,0.4)] backdrop-blur-xl"
    >
      {icon}
    </motion.button>
  );
}
