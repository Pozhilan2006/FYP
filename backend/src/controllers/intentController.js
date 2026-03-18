const { parseUserIntent } = require('../services/llmService');
const { isValidAddress } = require('../services/web3Service');
const { getSession, updateSession } = require('../services/sessionStore');
const { getBalances } = require('../services/portfolioService');
const { fetchSwapQuote } = require('../services/swapService');
const { getTokenAddress, ERC20_ABI } = require('../services/tokenService');
const { getChainConfig } = require('../services/chainService');
// Optional: import ethers if we need to encode ERC20 transfers on backend, 
// but we can also just pass the token address back. We will just pass the address.

const handleChat = async (req, res) => {
    try {
        const { message, session_id, wallet_address } = req.body;

        if (!message || !session_id) {
            return res.status(400).json({ error: 'Missing message or session_id' });
        }

        const session = getSession(session_id);
        console.log(`Processing intent for session [${session_id}]: ${message.substring(0, 50)}...`);

        const extractedIntent = await parseUserIntent(message, session);

        if (extractedIntent.error) {
            return res.json({ next_step: "error", message: extractedIntent.error });
        }

        const updates = {};
        if (extractedIntent.action) updates.action = extractedIntent.action;
        if (extractedIntent.asset) updates.asset = extractedIntent.asset;
        if (extractedIntent.swap) {
            updates.swap = { ...session.swap };
            if (extractedIntent.swap.from) updates.swap.from = extractedIntent.swap.from;
            if (extractedIntent.swap.to) updates.swap.to = extractedIntent.swap.to;
            if (extractedIntent.swap.amount) updates.swap.amount = extractedIntent.swap.amount;
        }
        if (extractedIntent.amount) updates.amount = extractedIntent.amount;
        if (extractedIntent.to_address) updates.to_address = extractedIntent.to_address;
        if (extractedIntent.chain) updates.chain = extractedIntent.chain;
        
        const currentSession = updateSession(session_id, updates);
        const chainConfig = getChainConfig(currentSession.chain);

        // Fetch balances if wallet is provided
        let currentBalances = null;
        if (wallet_address) {
            currentBalances = await getBalances(wallet_address, currentSession.chain);
        }

        // 1. ACTION: BALANCE
        if (currentSession.action === 'balance') {
            if (!wallet_address) {
                return res.json({ next_step: "ask_user", message: "Please connect your wallet to view your portfolio." });
            }
            
            const balString = currentBalances.balances.map(b => `${b.amount} ${b.asset}`).join(', ');
            return res.json({ 
                next_step: "ask_user", 
                message: `Here is your portfolio on ${currentBalances.chain}: ${balString}.`
            });
        }

        // 2. ACTION: TRANSFER
        if (currentSession.action === 'transfer') {
            if (!currentSession.asset) return res.json({ next_step: "ask_user", message: "What asset would you like to send? (e.g. ETH, USDC)" });
            if (!currentSession.amount) return res.json({ next_step: "ask_user", message: `How much ${currentSession.asset} would you like to send?` });
            if (!currentSession.to_address) return res.json({ next_step: "ask_user", message: "Please provide the recipient's wallet address." });

            if (!isValidAddress(currentSession.to_address)) return res.json({ next_step: "error", message: "The provided recipient address is invalid." });
            
            const numAmount = parseFloat(currentSession.amount);
            if (isNaN(numAmount) || numAmount <= 0) return res.json({ next_step: "error", message: "The transfer amount must be greater than zero." });

            // Balance check mock
            if (currentBalances) {
                const holding = currentBalances.balances.find(b => b.asset === currentSession.asset);
                if (!holding || holding.amount < numAmount) {
                    return res.json({ next_step: "error", message: `Insufficient balance. You need ${numAmount} ${currentSession.asset}.` });
                }
            }

            const tokenAddress = getTokenAddress(currentSession.chain, currentSession.asset);
            
            const summary = `You are about to send ${currentSession.amount} ${currentSession.asset} to ${currentSession.to_address} on ${chainConfig.name}. Confirm?`;
            return res.json({
                next_step: "confirm",
                message: summary,
                data: {
                    action: currentSession.action,
                    asset: currentSession.asset,
                    amount: currentSession.amount,
                    to_address: currentSession.to_address,
                    chain: currentSession.chain,
                    tokenAddress: tokenAddress, // Null if native
                    confidence: extractedIntent.confidence || 1.0,
                    risk_flags: extractedIntent.risk_flags || [],
                }
            });
        }

        // 3. ACTION: SWAP
        if (currentSession.action === 'swap') {
            if (!currentSession.swap.from) return res.json({ next_step: "ask_user", message: "What token are you swapping from?" });
            if (!currentSession.swap.to) return res.json({ next_step: "ask_user", message: "What token do you want to receive?" });
            if (!currentSession.swap.amount) return res.json({ next_step: "ask_user", message: `How much ${currentSession.swap.from} do you want to swap?` });

            const numAmount = parseFloat(currentSession.swap.amount);
            if (isNaN(numAmount) || numAmount <= 0) return res.json({ next_step: "error", message: "The swap amount must be greater than zero." });

            // Balance check mock
            if (currentBalances) {
                const holding = currentBalances.balances.find(b => b.asset === currentSession.swap.from);
                if (!holding || holding.amount < numAmount) {
                    return res.json({ next_step: "error", message: `Insufficient balance. You need ${numAmount} ${currentSession.swap.from}.` });
                }
            }

            // Fetch quote
            const quote = await fetchSwapQuote(currentSession.chain, currentSession.swap.from, currentSession.swap.to, currentSession.swap.amount);
            updateSession(session_id, { estimated_output: quote.estimatedOutput });

            const summary = `You are about to swap ${currentSession.swap.amount} ${currentSession.swap.from} for approximately ${quote.estimatedOutput} ${currentSession.swap.to} on ${chainConfig.name}. Confirm?`;
            
            return res.json({
                next_step: "confirm",
                message: summary,
                data: {
                    action: currentSession.action,
                    from_asset: currentSession.swap.from,
                    to_asset: currentSession.swap.to,
                    amount: currentSession.swap.amount,
                    estimated_output: quote.estimatedOutput,
                    chain: currentSession.chain,
                    txData: quote.txData,
                    routerAddress: quote.routerAddress,
                    confidence: extractedIntent.confidence || 1.0,
                    risk_flags: extractedIntent.risk_flags || [],
                }
            });
        }

        // Fallback
        if (!extractedIntent.intent_detected) {
             return res.json({ next_step: "ask_user", message: extractedIntent.human_readable_summary || "I'm not sure what you want to do. Can you clarify?" });
        }

    } catch (error) {
        console.error('Intent Controller Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { handleChat };
