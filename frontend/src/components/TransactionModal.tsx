"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, ExternalLink, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { IntentResponse } from '@/lib/api';

interface TransactionModalProps {
    isOpen: boolean;
    intent: IntentResponse['data'] | null;
    onClose: () => void;
    onConfirm: () => void;
    isProcessing: boolean;
    txHash: string | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    intent,
    onClose,
    onConfirm,
    isProcessing,
    txHash,
}) => {
    return (
        <AnimatePresence>
            {isOpen && intent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-[#0c0c0c] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden"
                    >
                        {/* Decorational Gradient */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-amber-500 to-violet-600 opacity-80" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-[60px] pointer-events-none" />

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-900/30 flex items-center justify-center border border-violet-500/20">
                                    <ShieldCheck size={20} className="text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">Confirm Intent</h2>
                                    <p className="text-xs text-gray-500 font-mono">SECURE SIGNING REQUEST</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 relative z-10">
                            {!txHash ? (
                                <div className="space-y-6">

                                    {/* Main Action Card */}
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Action</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xl font-medium text-white capitalize">{intent.action}</p>
                                                    {intent.chain && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-gray-300 px-2 py-0.5 rounded-full border border-white/5">
                                                            {intent.chain}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {intent.action === 'swap' ? (
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Swap</p>
                                                        <div className="flex items-baseline gap-1 justify-end">
                                                            <span className="text-lg font-bold text-violet-300 tracking-tight">{intent.amount}</span>
                                                            <span className="text-sm font-bold text-gray-400">{intent.from_asset}</span>
                                                            <span className="text-gray-500 mx-1">→</span>
                                                            <span className="text-lg font-bold text-emerald-400 tracking-tight">~{intent.estimated_output}</span>
                                                            <span className="text-sm font-bold text-gray-400">{intent.to_asset}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Asset</p>
                                                        <div className="flex items-baseline gap-1 justify-end">
                                                            <span className="text-3xl font-bold text-violet-300 tracking-tight">{intent.amount}</span>
                                                            <span className="text-sm font-bold text-gray-400">{intent.asset}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/10 w-full my-4" />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Activity size={14} className="text-emerald-400" />
                                                <span className="text-xs text-emerald-400 font-bold tracking-wide">CONFIDENCE SCORE</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-white">{(intent.confidence * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recipient / Router Details */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                                                {intent.action === 'swap' ? 'Swap Router' : 'Recipient Address'}
                                            </label>
                                            <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                                                {intent.action === 'swap' ? 'DEX Proxy' : 'External Wallet'}
                                            </span>
                                        </div>
                                        <div className="bg-black/50 p-4 rounded-xl font-mono text-sm text-gray-300 break-all border border-white/10 flex items-center justify-between gap-4 group hover:border-violet-500/30 transition-colors">
                                            <span>{intent.action === 'swap' ? intent.routerAddress : intent.to_address}</span>
                                        </div>
                                    </div>

                                    {/* Risk Flags */}
                                    {intent.risk_flags.length > 0 && (
                                        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                                            <div className="flex items-center gap-2 text-red-400 mb-2">
                                                <AlertTriangle size={16} />
                                                <span className="text-sm font-bold uppercase tracking-wide">Risk Assessment detected flags</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {intent.risk_flags.map((flag, idx) => (
                                                    <li key={idx} className="text-xs text-red-300 pl-6 relative">
                                                        <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-red-400" />
                                                        {flag}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <button
                                            onClick={onClose}
                                            className="py-4 rounded-xl bg-transparent border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white transition uppercase text-xs tracking-widest"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={onConfirm}
                                            disabled={isProcessing}
                                            className="py-4 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase text-xs tracking-widest relative overflow-hidden group"
                                        >
                                            {isProcessing ? (
                                                <span className="animate-pulse">Signing...</span>
                                            ) : (
                                                <>
                                                    <span>Confirm & Sign</span>
                                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="flex justify-center mb-6">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 relative">
                                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                                            <CheckCircle size={40} className="text-emerald-400 relative z-10" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Broadcasting Transaction</h3>
                                    <p className="text-gray-400 mb-8 text-sm max-w-xs mx-auto">
                                        Your transaction has been signed and is being propagated to the network.
                                    </p>

                                    <a
                                        href={`https://etherscan.io/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm mb-8 font-mono bg-violet-500/5 px-4 py-2 rounded-lg border border-violet-500/10 hover:border-violet-500/30 transition-all"
                                    >
                                        View on Explorer <ExternalLink size={14} />
                                    </a>

                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition uppercase text-xs tracking-widest"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TransactionModal;
