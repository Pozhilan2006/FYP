const sessions = new Map();

const getSession = (sessionId) => {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            action: null,
            asset: null, 
            swap: {
                from: null,
                to: null,
                amount: null
            },
            amount: null,
            to_address: null,
            chain: 'ethereum',
            estimated_output: null,
            step: 'collecting', // collecting, confirming, complete
        });
    }
    return sessions.get(sessionId);
};

const updateSession = (sessionId, updates) => {
    const session = getSession(sessionId);
    const newSession = { ...session, ...updates };
    sessions.set(sessionId, newSession);
    return newSession;
};

const clearSession = (sessionId) => {
    sessions.delete(sessionId);
};

module.exports = {
    getSession,
    updateSession,
    clearSession
};
