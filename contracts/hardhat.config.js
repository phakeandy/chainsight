const config = {
  networks: {
    hardhatMainnet: {
      url: "http://hardhat:8545",
      chainId: 31337,
      type: "http",
      accounts: {
        count: 20,
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
