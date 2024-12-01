"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    rpcUrl: process.env.RPC_URL,
    contractAddress: process.env.CONTRACT_ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
});
