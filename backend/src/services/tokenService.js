const TOKENS = {
    ethereum: {
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
    polygon: {
        USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    },
    arbitrum: {
        USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    }
};

const getTokenAddress = (chainName, ticker) => {
    if (!chainName || !ticker) return null;
    const chainTokens = TOKENS[chainName.toLowerCase()];
    if (!chainTokens) return null;
    return chainTokens[ticker.toUpperCase()] || null;
};

// Standard ERC20 ABI required for core interactions
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint amount) returns (boolean)"
];

module.exports = {
    TOKENS,
    getTokenAddress,
    ERC20_ABI
};
