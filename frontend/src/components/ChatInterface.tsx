"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { parseIntent, IntentResponse } from '@/lib/api';
import TransactionModal from './TransactionModal';
import { Send, Bot, User, AlertCircle, Sparkles, Command, ArrowRight, ShieldCheck } from 'lucide-react';
import { ethers } from 'ethers';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    intentData?: IntentResponse['data'];
    timestamp: number;
    error?: boolean;
};

export default function ChatInterface() {
    const { address, signer } = useWallet();
    const [sessionId] = useState<string>(() => Date.now().toString() + Math.random().toString(36).substring(7));
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'system-init',
            role: 'assistant',
            content: 'Hello! I am your Nexus Web3 Assistant. How can I help you today?',
            timestamp: Date.now(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentIntentData, setCurrentIntentData] = useState<IntentResponse['data'] | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [isProcessingTx, setIsProcessingTx] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !address) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Cinematic delay

            const response = await parseIntent(userMsg.content, sessionId, address);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.message,
                intentData: response.data,
                timestamp: Date.now(),
                error: response.next_step === 'error',
            };

            setMessages((prev) => [...prev, aiMsg]);

            if (response.next_step === 'confirm' && response.data) {
                setCurrentIntentData(response.data);
                setModalOpen(true);
                setTxHash(null);
            }

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'System Error: Unable to process request. Please retry.',
                timestamp: Date.now(),
                error: true,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const executeTransaction = async () => {
        if (!currentIntentData) return;

        if (!signer) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Error: Wallet not connected or signer unavailable.',
                timestamp: Date.now()
            }]);
            return;
        }

        setIsProcessingTx(true);
        try {
            // Optional Chain Switching Logic
            if (currentIntentData.chain) {
                const chainIdMap: Record<string, string> = {
                    ethereum: '0x1',
                    polygon: '0x89',
                    arbitrum: '0xa4b1'
                };
                const targetChainId = chainIdMap[currentIntentData.chain.toLowerCase()];
                if (targetChainId && window.ethereum) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: targetChainId }],
                        });
                    } catch (switchError: any) {
                        console.log("Could not switch chain automatically:", switchError);
                    }
                }
            }

            let tx: ethers.TransactionRequest;

            if (currentIntentData.action === 'swap' && currentIntentData.txData && currentIntentData.routerAddress) {
                // Execute swap via Router Proxy
                tx = {
                    to: currentIntentData.routerAddress,
                    data: currentIntentData.txData,
                    value: currentIntentData.from_asset === 'ETH' ? ethers.parseEther(currentIntentData.amount || '0') : 0n,
                };
            } else if (currentIntentData.action === 'transfer' && currentIntentData.tokenAddress) {
                // Mock ERC20 Transfer
                const erc20Interface = new ethers.Interface(["function transfer(address to, uint256 amount) returns (bool)"]);
                tx = {
                    to: currentIntentData.tokenAddress,
                    data: erc20Interface.encodeFunctionData("transfer", [currentIntentData.to_address, ethers.parseUnits(currentIntentData.amount || '0', 18)]),
                    value: 0n,
                };
            } else {
                // Standard Native Transfer
                tx = {
                    to: currentIntentData.to_address || '',
                    value: ethers.parseEther(currentIntentData.amount || '0'),
                };
            }

            const transactionResponse = await signer.sendTransaction(tx);
            setTxHash(transactionResponse.hash);

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Transaction broadcast successfully on ${currentIntentData.chain || 'Ethereum'}. Hash: ${transactionResponse.hash}`,
                    timestamp: Date.now(),
                },
            ]);
        } catch (error: any) {
            console.error("Transaction Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Transaction Failed: ${error.message || 'User rejected request or insufficient funds.'}`,
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setIsProcessingTx(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative bg-gray-50/5 dark:bg-black/20 backdrop-blur-md items-center w-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth w-full max-w-4xl" ref={scrollRef}>
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={cn(
                                "max-w-[85%] md:max-w-[70%] rounded-2xl p-5 relative overflow-hidden group transition-all duration-300",
                                msg.role === 'user'
                                    ? "bg-violet-600/10 border border-violet-500/20 text-gray-800 dark:text-white shadow-lg shadow-violet-500/5 backdrop-blur-md"
                                    : "bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-200 shadow-xl backdrop-blur-xl",
                                msg.error && "border-red-500/30 bg-red-500/5"
                            )}>
                                {/* Glow effects */}
                                {msg.role === 'assistant' && !msg.error && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-transparent opacity-50" />
                                )}
                                {msg.error && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-transparent opacity-50" />
                                )}

                                <div className="flex items-center gap-3 mb-3 opacity-60">
                                    {msg.role === 'user' ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-semibold tracking-wide text-violet-600 dark:text-violet-300">USER</span>
                                            <User size={14} className="text-violet-500" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Bot size={14} className={msg.error ? "text-red-400" : "text-violet-500"} />
                                            <span className={cn(
                                                "text-[11px] font-semibold tracking-wide",
                                                msg.error ? "text-red-400" : "text-gray-500 dark:text-gray-400"
                                            )}>ASSISTANT</span>
                                        </div>
                                    )}
                                </div>

                                <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-light tracking-wide">
                                    {msg.content}
                                </p>

                                {/* Risk Flags Inline */}
                                {msg.intentData && msg.intentData.risk_flags && msg.intentData.risk_flags.length > 0 && (
                                    <div className="mt-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                                        <AlertCircle size={16} className="text-orange-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">NOTICE</p>
                                            <p className="text-xs text-orange-700 dark:text-orange-300/80">
                                                {msg.intentData.risk_flags.join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-ping absolute" />
                                <div className="w-2 h-2 rounded-full bg-violet-500 relative" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">Thinking...</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 relative z-20 w-full max-w-4xl bg-gray-50/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/5">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl opacity-10 group-focus-within:opacity-20 transition-opacity blur duration-500" />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl flex items-center p-2 border border-gray-300 dark:border-white/10 group-focus-within:border-violet-500/50 transition-colors shadow-sm"
                    >
                        <div className="pl-4 pr-3 text-gray-400">
                            <Sparkles size={18} className="text-violet-500" />
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message Web3 Assistant..."
                            className="flex-1 bg-transparent border-none text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 py-3 text-[15px] font-light"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group-focus-within:bg-violet-600 group-focus-within:hover:bg-violet-500"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div className="flex items-center justify-center mt-3 px-1">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-500" /> Secure enclave active. AI will never request your private key.
                        </p>
                    </div>
                </div>
            </div>

            <TransactionModal
                isOpen={modalOpen}
                intent={currentIntentData}
                onClose={() => setModalOpen(false)}
                onConfirm={executeTransaction}
                isProcessing={isProcessingTx}
                txHash={txHash}
            />
        </div>
    );
}
