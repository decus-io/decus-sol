module.exports = {
    env: {
        es2021: true,
        node: true,
        mocha: true,
    },
    extends: ["standard", "prettier"],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
    },
    globals: {
        web3: "readonly",
        artifacts: "readonly",
        contract: "readonly",
    },
    rules: {},
};
