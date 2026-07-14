require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",

  networks: {
    besu: {
      url: process.env.BESU_RPC_URL || "http://127.0.0.1:8545",
      chainId: 1337,
      gasPrice: 0,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
