"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyNote, VerifyResponse, truncateAddress } from "@/lib/api";
import {
  ShieldCheckIcon,
  XCircleIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  }, []);

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await verifyNote(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const POLY_SCAN = "https://amoy.polygonscan.com/tx/";

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldCheckIcon className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Verify a Note</h1>
          <p className="text-white/50 max-w-sm mx-auto">Upload any file and we&apos;ll check its SHA-256 hash against our blockchain record to confirm authenticity.</p>
        </motion.div>

        <div className="space-y-5">
          {/* Drop zone */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            role="button"
            tabIndex={0}
            onClick={() => document.getElementById("verify-file-input")?.click()}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("verify-file-input")?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`glass-card p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-brand-500/60 bg-brand-500/10" : "hover:border-white/20"}`}
          >
            <input id="verify-file-input" type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <DocumentIcon className="w-8 h-8 text-brand-400" />
                <div className="text-left">
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-white/40 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to verify</p>
                </div>
              </div>
            ) : (
              <>
                <CloudArrowUpIcon className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-white/60 font-medium mb-1">Drop the file you want to verify</p>
                <p className="text-white/30 text-sm">PDF, DOC, DOCX, PNG, JPG</p>
              </>
            )}
          </motion.div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={!file || loading}
            className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Checking blockchain...
              </span>
            ) : (
              "Verify Authenticity"
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`glass-card p-8 text-center border-2 ${result.verified ? "border-green-500/30" : "border-red-500/30"}`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, delay: 0.1 }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${result.verified ? "bg-green-500/20" : "bg-red-500/20"}`}
                >
                  {result.verified ? (
                    <ShieldCheckIcon className="w-10 h-10 text-green-400" />
                  ) : (
                    <XCircleIcon className="w-10 h-10 text-red-400" />
                  )}
                </motion.div>

                <h2 className={`text-2xl font-bold mb-1 ${result.verified ? "text-green-300" : "text-red-300"}`}>
                  {result.verified ? "Verified ✅" : "Not Verified ❌"}
                </h2>
                <p className="text-white/50 text-sm mb-6">
                  {result.verified
                    ? "This file matches a registered note on our platform."
                    : "No matching record found. This file may have been tampered with or was never uploaded."}
                </p>

                {/* Hash */}
                <div className="text-left space-y-3">
                  <div className="glass-card p-4">
                    <p className="text-xs text-white/40 mb-1">SHA-256 Hash</p>
                    <p className="text-xs font-mono text-brand-300 break-all">{result.fileHash}</p>
                  </div>

                  {result.verified && (
                    <div className="glass-card p-4 space-y-2">
                      <p className="text-xs text-white/40">Verification Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {result.inDatabase && <span className="badge bg-blue-500/20 text-blue-300">✓ Database</span>}
                        {result.onChain && <span className="badge bg-purple-500/20 text-purple-300">✓ Blockchain</span>}
                      </div>
                    </div>
                  )}

                  {result.note && (
                    <div className="glass-card p-4 space-y-2">
                      <p className="text-xs text-white/40 mb-1">Registered Note</p>
                      <p className="text-sm font-medium text-white">{(result.note as any).title}</p>
                      {(result.note as any).uploader_wallet && (
                        <p className="text-xs text-white/50">Uploader: {truncateAddress((result.note as any).uploader_wallet)}</p>
                      )}
                      {(result.note as any).tx_hash && !(result.note as any).tx_hash.startsWith("0xmock") && (
                        <a
                          href={`${POLY_SCAN}${(result.note as any).tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 transition-colors mt-1"
                        >
                          View on PolygonScan <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <button onClick={() => { setFile(null); setResult(null); }} className="btn-ghost mt-6 w-full">
                  Verify Another File
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
