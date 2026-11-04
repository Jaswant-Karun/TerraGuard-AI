"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Radio } from "lucide-react";

export function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("Calibrating Urban Radar Mesh...");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStepText("Synchronizing Meteorological & Air Telemetry...");
    }, 350);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setStepText("Arming Gemini Vision Sentinel...");
    }, 750);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStepText("TerraGuard AI Command Engine Active.");
    }, 1100);

    const timer4 = setTimeout(() => {
      setIsDone(true);
      if (onComplete) onComplete();
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B132B] text-white select-none px-6"
        >
          {/* Subtle Radar Ring Effect */}
          <div className="relative flex items-center justify-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.8, 2.4], opacity: [0.6, 0.2, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
              className="absolute w-24 h-24 rounded-full border border-[#06B6D4]/40"
            />
            <motion.div
              animate={{ scale: [1, 1.4, 1.8], opacity: [0.8, 0.3, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: "easeOut" }}
              className="absolute w-24 h-24 rounded-full border border-[#0284C7]/30"
            />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#06B6D4] flex items-center justify-center shadow-glow">
              <ShieldAlert className="w-10 h-10 text-white drop-shadow-md" />
            </div>
          </div>

          {/* Title & Tagline */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              TerraGuard <span className="text-[#06B6D4]">AI</span>
            </h1>
            <p className="text-xs font-mono tracking-widest uppercase text-slate-400">
              Predict. Prevent. Protect.
            </p>
          </div>

          {/* Progress Bar & Status Text */}
          <div className="w-full max-w-xs space-y-2.5">
            <div className="h-1.5 w-full bg-[#1C2541] rounded-full overflow-hidden p-0.5 border border-[#273456]">
              <motion.div
                className="h-full bg-gradient-to-r from-[#0284C7] to-[#06B6D4] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 truncate">
                <Radio className="w-3 h-3 text-[#06B6D4] animate-pulse" />
                {stepText}
              </span>
              <span className="text-[#06B6D4] font-semibold">{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
