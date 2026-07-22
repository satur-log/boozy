"use client";

import { motion } from "framer-motion";
import { BoosterTier } from "@/lib/booster";

export default function BoosterBadge({ tier }: { tier: BoosterTier }) {
  return (
    <motion.div
      key={tier.key}
      initial={{ scale: 0.8, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="flex items-center gap-2 rounded-full border px-4 py-2"
      style={{
        borderColor: tier.color,
        background: `linear-gradient(90deg, ${tier.glow}, transparent)`,
        boxShadow: `0 0 20px ${tier.glow}`,
      }}
    >
      <motion.span
        className="text-xl"
        animate={
          tier.key === "overheat"
            ? { rotate: [0, -12, 12, -12, 0] }
            : { rotate: 0 }
        }
        transition={{ repeat: Infinity, duration: 0.7 }}
      >
        {tier.emoji}
      </motion.span>
      <span className="text-sm font-bold" style={{ color: tier.color }}>
        {tier.label}
      </span>
    </motion.div>
  );
}
