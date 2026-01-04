import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Languages,
  Mic,
  MicOff,
  Loader2,
  X,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const API = "http://localhost:5000/api";

export default function VoiceAssistant() {
  const [enabled, setEnabled] = useState(false);
  const [language, setLanguage] = useState("en");
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const token = localStorage.getItem("token");
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);

  const languages = {
    en: "English",
    hi: "हिंदी (Hindi)",
    mr: "मराठी (Marathi)",
  };

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice input detected:", transcript);
        handleVoiceQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setListening(false);
        if (event.error === "no-speech") {
          setError("No speech detected. Please try again.");
        } else if (event.error === "not-allowed") {
          setError("Microphone access denied. Please enable it in settings.");
        } else {
          setError(`Recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError("Speech recognition not supported in this browser");
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      const langCode = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
      recognitionRef.current.lang = langCode;
    }
  }, [language]);

  const speak = (text, lang = "en", callback = null) => {
    if (!text || !enabled) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    let selectedVoice = null;

    if (lang === "hi") {
      selectedVoice = voices.find((v) => v.lang === "hi-IN") || voices.find((v) => v.lang.startsWith("hi"));
    } else if (lang === "mr") {
      selectedVoice = voices.find((v) => v.lang === "mr-IN") || voices.find((v) => v.lang.startsWith("mr"));
    } else {
      selectedVoice = voices.find((v) => v.lang === "en-IN") || voices.find((v) => v.lang.startsWith("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setSpeaking(true);
      setLastMessage(text);
      setError(null);
    };

    utterance.onend = () => {
      setSpeaking(false);
      if (callback) callback();
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setSpeaking(false);
      setError("Speech failed. Please try again.");
    };

    synthRef.current.speak(utterance);
  };

  const speakAdvisory = async () => {
    if (!enabled || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API}/voice/advisory`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { lang: language },
      });

      const advisoryData = res.data;
      setAdvisory(advisoryData);

      const fullMessage = advisoryData.sections.map((s) => s.text).join(". ");

      if (fullMessage) {
        speak(fullMessage, language);
      } else {
        setError("No advisory data available");
      }
    } catch (error) {
      console.error("Failed to fetch advisory:", error);
      setError(error.response?.data?.msg || "Failed to load advisory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceQuery = async (query) => {
    if (!enabled || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API}/voice/query`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { lang: language, query },
      });

      const response = res.data.response;
      if (response) {
        speak(response, language);
      } else {
        setError("No response available");
      }
    } catch (error) {
      console.error("Failed to process query:", error);
      setError("Failed to process your query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Voice recognition not supported in this browser");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (error) {
        console.error("Failed to start recognition:", error);
        setError("Failed to start listening. Please try again.");
      }
    }
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setSpeaking(false);
  };

  const toggleEnabled = () => {
    if (enabled) {
      stopSpeaking();
      setExpanded(false);
    }
    setEnabled(!enabled);
    setError(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-purple-800/95 backdrop-blur-2xl rounded-3xl border border-purple-400/30 shadow-2xl shadow-purple-500/20 overflow-hidden"
            style={{ width: expanded ? "380px" : "320px" }}
          >
            <div className="bg-gradient-to-r from-purple-600/40 to-indigo-600/40 p-4 border-b border-purple-400/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      scale: speaking ? [1, 1.2, 1] : 1,
                      rotate: speaking ? [0, 10, -10, 0] : 0,
                    }}
                    transition={{ duration: 0.8, repeat: speaking ? Infinity : 0 }}
                    className="p-2 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30"
                  >
                    {speaking ? (
                      <Volume2 className="w-5 h-5 text-purple-300" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                  </motion.div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Voice Advisory</h3>
                    <p className="text-purple-300 text-xs">
                      {speaking ? "Speaking..." : listening ? "Listening..." : "Ready"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <X className="w-4 h-4 text-gray-300" />
                  </motion.div>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-purple-300" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={speaking || listening}
                  className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code} className="bg-gray-900">
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 p-3 bg-red-500/20 border border-red-400/30 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{error}</p>
                </motion.div>
              )}

              {speaking && lastMessage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-3 p-4 bg-purple-500/20 border border-purple-400/30 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300" />
                    <p className="text-xs text-purple-300 font-semibold uppercase">Currently Speaking</p>
                  </div>
                  <p className="text-sm text-white line-clamp-3 leading-relaxed">{lastMessage}</p>
                </motion.div>
              )}

              {loading && (
                <div className="mb-3 flex items-center justify-center gap-2 p-4">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <p className="text-sm text-purple-300">Loading advisory...</p>
                </div>
              )}

              {listening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-3 p-4 bg-cyan-500/20 border border-cyan-400/30 rounded-xl text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex justify-center mb-2"
                  >
                    <Mic className="w-6 h-6 text-cyan-400" />
                  </motion.div>
                  <p className="text-sm text-cyan-300 font-semibold">Listening... Speak now</p>
                </motion.div>
              )}

              {expanded && advisory && advisory.sections && (
                <div className="mb-3 max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {advisory.sections.map((section, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-purple-400/30 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            section.severity === "CRITICAL" ? "bg-red-400" : section.severity === "WARNING" ? "bg-yellow-400" : "bg-green-400"
                          }`}
                        />
                        <p className="text-xs text-gray-400 uppercase font-semibold">{section.type.replace(/_/g, " ")}</p>
                      </div>
                      <p className="text-sm text-gray-200">{section.text}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={speakAdvisory}
                  disabled={speaking || listening || loading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-lg"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>Play</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleListening}
                  disabled={speaking || loading}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                    listening
                      ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 animate-pulse"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  } disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white`}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{listening ? "Stop" : "Ask"}</span>
                </motion.button>
              </div>

              {speaking && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopSpeaking}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg"
                >
                  <Pause className="w-4 h-4" />
                  <span>Stop Speaking</span>
                </motion.button>
              )}
            </div>

            <div className="px-4 py-2 bg-purple-950/50 border-t border-purple-400/20">
              <p className="text-xs text-purple-300 text-center">Multilingual Voice Advisory System</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleEnabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          enabled ? "bg-gradient-to-br from-purple-600 to-pink-600 shadow-purple-500/50" : "bg-gradient-to-br from-gray-700 to-gray-800 shadow-gray-800/50"
        }`}
      >
        <motion.div animate={{ rotate: enabled ? 360 : 0, scale: enabled ? [1, 1.1, 1] : 1 }} transition={{ duration: 0.5 }}>
          {enabled ? <Volume2 className="w-7 h-7 text-white" /> : <VolumeX className="w-7 h-7 text-gray-400" />}
        </motion.div>

        {enabled && speaking && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"
          />
        )}
      </motion.button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
}
