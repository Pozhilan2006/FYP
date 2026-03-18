import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/chat'; 

export interface IntentResponse {
    next_step: 'ask_user' | 'confirm' | 'error';
    message: string;
    data?: {
        action: 'transfer' | 'balance' | 'swap' | 'explanation' | 'unknown';
        chain: string | null;
        asset?: string | null;          // for transfer
        from_asset?: string | null;     // for swap
        to_asset?: string | null;       // for swap
        amount: string | null;
        estimated_output?: string | null; // for swap
        to_address?: string | null;     // for transfer
        txData?: string | null;         // payload for execution
        tokenAddress?: string | null;   // smart contract address
        routerAddress?: string | null;  // swap router address
        confidence: number;
        risk_flags: string[];
    };
}

export const parseIntent = async (userMessage: string, sessionId: string, walletAddress?: string): Promise<IntentResponse> => {
    try {
        const response = await axios.post(`${API_BASE_URL}`, {
            message: userMessage,
            session_id: sessionId,
            wallet_address: walletAddress,
        });
        return response.data;
    } catch (error: any) {
        console.error('API Error:', error);
        return {
            next_step: 'error',
            message: 'Service is currently unavailable. Please try again later.',
        };
    }
};
