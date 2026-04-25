/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0F1115]">
      {/* Dark Navy/Blue Blob */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] right-[10%] h-[400px] w-[400px] rounded-full bg-blue-900/20 blur-[100px]"
      />

      {/* Slate/Charcoal Blob */}
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, 60, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[5%] left-[10%] h-[300px] w-[300px] rounded-full bg-slate-700/20 blur-[80px]"
      />

      {/* Subtle Accent Blob */}
      <motion.div
        animate={{
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[30%] right-[20%] h-[300px] w-[300px] rounded-full bg-indigo-900/10 blur-[80px]"
      />
    </div>
  );
}
