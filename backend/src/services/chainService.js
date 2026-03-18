const CHAINS = {
    ethereum: {
        id: 1,
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://eth.llamarpc.com',
        nativeToken: 'ETH',
        explorer: 'https://etherscan.io'
    },
    polygon: {
        id: 137,
        name: 'Polygon PoS',
        rpcUrl: 'https://polygon.llamarpc.com',
        nativeToken: 'MATIC',
        explorer: 'https://polygonscan.com'
    },
    arbitrum: {
        id: 42161,
        name: 'Arbitrum One',
        rpcUrl: 'https://arbitrum.llamarpc.com',
        nativeToken: 'ETH',
        explorer: 'https://arbiscan.io'
    }
};

const getChainConfig = (chainName) => {
    if (!chainName) return CHAINS.ethereum;
    const lowerName = chainName.toLowerCase();
    return CHAINS[lowerName] || CHAINS.ethereum;
};

module.exports = {
    CHAINS,
    getChainConfig
};
