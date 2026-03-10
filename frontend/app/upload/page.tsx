"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { uploadNote, SUBJECTS, UploadResponse } from "@/lib/api";
import { UploadProgress } from "@/components/UploadProgress";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

type Step = "connect" | "form" | "uploading" | "success";

const FIELD_CLASS = "input-field";

export default function UploadPage() {
  const { walletAddress, username, isWalletConnected, isPasswordSession, isGhostSession } = useAuth();
  const isAuthed = isWalletConnected || isPasswordSession || isGhostSession;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [step, setStep] = useState<Step>("connect");

  useEffect(() => {
    if (isAuthed && step === "connect") setStep("form");
    else if (!isAuthed) setStep("connect");
  }, [isAuthed, step]);

  const [progressStep, setProgressStep] = useState(-1);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    subject: SUBJECTS[0],
    chapter_name: "",
    topic_name: "",
    chapter_number: "",
    uploader_name: username ?? "",
  });
  const [file, setFile] = useState<File | null>(null);

  const POLY_SCAN = "https://amoy.polygonscan.com/tx/";

  const validateFile = (f: File): boolean => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Only PDF files are accepted.");
      return false;
    }
    if (f.size > 30 * 1024 * 1024) {
      setFileError("File must be under 30 MB.");
      return false;
    }
    setFileError(null);
    return true;
  };

  const onFile = (f: File) => {
    if (validateFile(f)) setFile(f);
    else setFile(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !walletAddress) return;
    const walletAddr = walletAddress;
    setStep("uploading");
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", form.title);
      fd.append("subject", form.subject);
      fd.append("chapter_name", form.chapter_name);
      fd.append("topic_name", form.topic_name);
      fd.append("chapter_number", form.chapter_number);
      fd.append("uploader_name", form.uploader_name);
      fd.append("uploader_wallet", walletAddr);

      setProgressStep(0);
      await new Promise((r) => setTimeout(r, 600));
      setProgressStep(1);
      await new Promise((r) => setTimeout(r, 400));
      setProgressStep(2);

      const data = await uploadNote(fd);

      setProgressStep(3);
      await new Promise((r) => setTimeout(r, 300));
      setProgressStep(4);
      setResult(data);
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStep("form");
    }
  };

  const resetForm = () => {
    setStep("form");
    setFile(null);
    setResult(null);
    setFileError(null);
    setForm({ title: "", subject: SUBJECTS[0], chapter_name: "", topic_name: "", chapter_number: "", uploader_name: "" });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Upload a Note</h1>
          <p className="text-white/50">Share your PDF — stored on IPFS with its hash registered on-chain.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Sign In ── */}
          {step === "connect" && (
            <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-6 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto mb-6">
                <UserCircleIcon className="w-8 h-8 text-brand-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Sign In to Upload</h2>
              <p className="text-white/50 mb-8 text-sm">Create an account or connect your wallet to upload and register notes on-chain.</p>
              <div className="flex justify-center">
                <button onClick={() => setShowAuthModal(true)} className="btn-primary flex items-center gap-2">
                  <UserCircleIcon className="w-4 h-4" />
                  Connect / Sign In
                </button>
              </div>
              {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            </motion.div>
          )}

          {/* ── Step 2: Form ── */}
          {step === "form" && (
            <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="glass-card p-6 space-y-5">
                {/* Uploader Name */}
                <div>
                  <label className="block text-sm text-white/70 mb-1.5 font-medium">Your Name *</label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="e.g. Rahul Singh"
                    value={form.uploader_name}
                    onChange={(e) => setForm((f) => ({ ...f, uploader_name: e.target.value }))}
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm text-white/70 mb-1.5 font-medium">Note Title *</label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="e.g. Integration Techniques Summary"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    minLength={3}
                    maxLength={200}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm text-white/70 mb-1.5 font-medium">Subject *</label>
                  <select
                    className={FIELD_CLASS}
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    required
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-surface-DEFAULT">{s}</option>
                    ))}
                  </select>
                </div>

                {/* Chapter Number + Chapter Name (side by side) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Chapter No. *</label>
                    <input
                      className={FIELD_CLASS}
                      type="number"
                      min={1}
                      max={999}
                      placeholder="e.g. 3"
                      value={form.chapter_number}
                      onChange={(e) => setForm((f) => ({ ...f, chapter_number: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Chapter Name *</label>
                    <input
                      className={FIELD_CLASS}
                      placeholder="e.g. Calculus III"
                      value={form.chapter_name}
                      onChange={(e) => setForm((f) => ({ ...f, chapter_name: e.target.value }))}
                      required
                      maxLength={120}
                    />
                  </div>
                </div>

                {/* Topic Name */}
                <div>
                  <label className="block text-sm text-white/70 mb-1.5 font-medium">Topic Name *</label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="e.g. Integration by Parts"
                    value={form.topic_name}
                    onChange={(e) => setForm((f) => ({ ...f, topic_name: e.target.value }))}
                    required
                    maxLength={120}
                  />
                </div>
              </div>

              {/* PDF Drop Zone */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`glass-card p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-brand-500/60 bg-brand-500/10" : "hover:border-white/20"} ${fileError ? "border-red-500/40" : ""}`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <DocumentIcon className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium text-sm">{file.name}</p>
                      <p className="text-white/40 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(null); }}
                      className="ml-auto text-white/30 hover:text-white/60 text-lg leading-none transition-colors"
                    >✕</button>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-10 h-10 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60 font-medium mb-1">Drop your PDF here or click to browse</p>
                    <p className="text-white/30 text-xs">PDF only · Max 30 MB</p>
                    {fileError && (
                      <p className="text-red-400 text-xs mt-3 flex items-center justify-center gap-1">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                        {fileError}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Auth identity badge */}
              {isAuthed && (
                <div className="glass-card p-4 flex items-center justify-between">
                  <span className="text-white/50 text-sm">Uploading as</span>
                  <div className="text-right">
                    {username && <p className="text-brand-200 text-sm font-medium">{username}</p>}
                    {walletAddress && <p className="text-white/30 text-xs font-mono">{walletAddress.slice(0, 8)}…</p>}
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-4 text-base" disabled={!file}>
                Upload &amp; Register On-Chain
              </button>
            </motion.form>
          )}

          {/* ── Step 3: Uploading ── */}
          {step === "uploading" && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-8">
              <h2 className="text-xl font-semibold text-white mb-6 text-center">Processing Your Note...</h2>
              <UploadProgress currentStep={progressStep} />
            </motion.div>
          )}

          {/* ── Step 4: Success ── */}
          {step === "success" && result && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-9 h-9 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Note Registered!</h2>
              <p className="text-white/50 mb-8 text-sm">Your note is now on IPFS and its hash is recorded on the blockchain.</p>

              <div className="space-y-3 text-left mb-8">
                <div className="glass-card p-4">
                  <p className="text-xs text-white/40 mb-1">Note ID</p>
                  <p className="text-sm font-mono text-white/80 break-all">{result.noteId}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-white/40 mb-1">SHA-256 Hash</p>
                  <p className="text-sm font-mono text-brand-300 break-all">{result.fileHash}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-white/40 mb-1">Transaction Hash</p>
                  <a href={`${POLY_SCAN}${result.txHash}`} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-purple-300 break-all hover:text-purple-200 inline-flex items-center gap-1">
                    {result.txHash.slice(0, 30)}...
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={resetForm} className="btn-ghost flex-1">Upload Another</button>
                <a href={`/notes/${result.noteId}`} className="btn-primary flex-1 text-center">View Note</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
