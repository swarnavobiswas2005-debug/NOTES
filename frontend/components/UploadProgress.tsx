"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export interface UploadStep {
  id: string;
  label: string;
  description: string;
}

export const UPLOAD_STEPS: UploadStep[] = [
  { id: "upload",     label: "Uploading to IPFS",    description: "Storing your file on IPFS via Pinata..." },
  { id: "hash",       label: "Generating Hash",       description: "Creating SHA-256 fingerprint of your file..." },
  { id: "blockchain", label: "Registering On-Chain",  description: "Submitting hash to NotesRegistry smart contract..." },
  { id: "save",       label: "Saving Metadata",       description: "Storing note details in our database..." },
];

interface Props {
  currentStep: number; // 0-indexed, -1 = not started, 4 = done
}

export function UploadProgress({ currentStep }: Props) {
  return (
    <div className="space-y-3">
      {UPLOAD_STEPS.map((step, i) => {
        const isDone = currentStep > i;
        const isActive = currentStep === i;
        const isPending = currentStep < i;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-400 ${
              isDone
                ? "border-green-500/30 bg-green-500/10"
                : isActive
                ? "border-brand-500/40 bg-brand-500/10"
                : "border-white/5 bg-white/[0.02] opacity-40"
            }`}
          >
            {/* Icon */}
            <div className="mt-0.5 flex-shrink-0">
              <AnimatePresence mode="wait">
                {isDone ? (
                  <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 text-green-400">
                    <CheckCircleIcon />
                  </motion.div>
                ) : isActive ? (
                  <motion.div key="active" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 text-brand-400">
                    <ArrowPathIcon />
                  </motion.div>
                ) : (
                  <div key="pending" className="w-5 h-5 rounded-full border-2 border-white/20" />
                )}
              </AnimatePresence>
            </div>

            <div>
              <p className={`text-sm font-medium ${isDone ? "text-green-300" : isActive ? "text-brand-300" : "text-white/40"}`}>
                {step.label}
              </p>
              {isActive && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-white/50 mt-0.5"
                >
                  {step.description}
                </motion.p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
