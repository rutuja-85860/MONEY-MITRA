import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";

const API = "http://localhost:5000/api";

const carouselContent = [
  {
    title: "Your Autonomous Financial Coach",
    desc: "AI-driven strategies that evolve with your wealth. Experience proactive guidance that never sleeps.",
  },
  {
    title: "Market Intelligence in Real-Time",
    desc: "Let AI surface high-yield opportunities and risk signals from millions of data points in seconds.",
  },
  {
    title: "Compliance Built Into Every Trade",
    desc: "SEC and FINRA standards aren't afterthoughts. They are the foundation of our autonomous engine.",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % carouselContent.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });
      localStorage.setItem("token", res.data.token);
      window.location.href = res.data.hasProfile
        ? "/dashboard"
        : "/onboarding";
    } catch (err) {
      setErrorMsg("Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#0f0b1f] flex items-center justify-center overflow-hidden font-sans">
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0">
        {/* Background Image - Brighter for visibility through transparent form */}
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

        {/* Floating particles - Reduced for cleaner look */}
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

      {/* FOREGROUND - Highly Transparent Containers */}
      <div className="relative z-10 container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        {/* LEFT: LOGIN CARD - Ultra Transparent Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative bg-black/20 backdrop-blur-2xl border border-white/[0.2] p-10 rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.4)] max-w-lg w-full hover:border-purple-400/50 hover:shadow-[0_40px_140px_rgba(168,85,247,0.3)] transition-all duration-500 group"
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.12] via-transparent to-pink-500/[0.12] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] pointer-events-none" />
          
          {/* Inner glow effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-purple-500/30 via-transparent to-pink-500/30 rounded-[2.5rem] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />

          <div className="relative z-10">
            <div className="mb-10">
              <h1 className="text-purple-400 text-sm font-bold tracking-[0.4em] mb-6 uppercase drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]">
                MONEY MITRA
              </h1>
              <h2 className="text-white text-5xl font-light mb-4 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                Welcome Back, <br />
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 via-pink-300 to-purple-300 text-transparent bg-clip-text drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]">
                  Strategist.
                </span>
              </h2>
              <p className="text-gray-200 text-sm leading-relaxed max-w-xs drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                Autonomous insights are ready. Your daily financial streams have
                been synthesized into strategy.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <input
                  type="email"
                  className="w-full bg-white/[0.12] border border-white/[0.25] rounded-2xl px-6 py-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.15] transition-all outline-none placeholder:text-gray-300 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  placeholder="Username or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-white/[0.12] border border-white/[0.25] rounded-2xl px-6 py-4 text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.15] transition-all outline-none placeholder:text-gray-300 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {errorMsg && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-300 text-xs font-medium bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2 backdrop-blur-sm"
                >
                  {errorMsg}
                </motion.p>
              )}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-600 hover:to-purple-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_rgba(168,85,247,0.7)] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-purple-400/40 overflow-hidden"
              >
                <span className="relative z-10">
                  {isLoading ? "Analyzing..." : "Log In"}
                </span>
                {/* Button shine effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </motion.button>
            </form>

            <div className="my-8 flex items-center">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="mx-4 text-gray-300 text-[10px] tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                or connect
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>

            <div className="flex justify-center gap-6 mb-10">
              <SocialIcon icon={<FaGoogle />} />
              <SocialIcon icon={<FaFacebook />} />
              <SocialIcon icon={<FaApple />} />
            </div>

            <div className="flex justify-between text-xs font-medium">
              <p className="text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                New here?{" "}
                <Link
                  to="/register"
                  className="text-purple-300 hover:text-purple-200 transition-colors font-semibold"
                >
                  Register
                </Link>
              </p>
              <button
                type="button"
                className="text-gray-300 hover:text-purple-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                Contact Support
              </button>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: PARALLAX HERO + CAROUSEL - Transparent Container */}
        <motion.div
          className="hidden lg:block relative"
          initial={{ opacity: 0, x: 40 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            y: [0, -10, 0]
          }}
          transition={{ 
            opacity: { duration: 0.8 },
            x: { duration: 0.8 },
            y: { duration: 18, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* Glow behind typography - Purple theme */}
          <div
            className="pointer-events-none absolute -inset-32
            bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.25)_0%,transparent_60%)]
            blur-[120px] opacity-80"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
              className="relative"
            >
              <h2 className="text-white text-7xl font-extralight leading-[1.05] mb-8 tracking-tight drop-shadow-[0_6px_24px_rgba(0,0,0,0.9)]">
                {carouselContent[index].title
                  .split(" ")
                  .map((word, i, arr) => (
                    <span
                      key={i}
                      className={
                        i >= arr.length - 3
                          ? "font-semibold bg-gradient-to-r from-purple-400 via-pink-300 to-purple-300 text-transparent bg-clip-text drop-shadow-[0_4px_16px_rgba(168,85,247,0.9)]"
                          : ""
                      }
                    >
                      {word}{" "}
                    </span>
                  ))}
              </h2>
              <p className="text-gray-100 text-2xl font-light leading-relaxed max-w-lg drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {carouselContent[index].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress indicators */}
          <div className="flex gap-4 mt-16">
            {carouselContent.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === index ? 60 : 14,
                  backgroundColor:
                    i === index ? "#a855f7" : "rgba(168,85,247,0.3)",
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-[3px] rounded-full shadow-[0_0_16px_rgba(168,85,247,0.8)] cursor-pointer hover:shadow-[0_0_24px_rgba(168,85,247,1)]"
                onClick={() => setIndex(i)}
              />
            ))}
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
      className="text-gray-200 text-xl hover:text-purple-300 transition-all bg-white/[0.12] p-4 rounded-full border border-white/[0.25] hover:border-purple-400/60 hover:bg-white/[0.18] hover:shadow-[0_0_24px_rgba(168,85,247,0.4)] backdrop-blur-xl"
    >
      {icon}
    </motion.button>
  );
}
