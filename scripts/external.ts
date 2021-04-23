type Addr = {
  [key: string]: string;
};

const WBTC: Addr = {
  mainnet: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  kovan: "0x659cE2eF1EC7864f62dA3281DCe729C027773c0C",
  ropsten: "0x3448EbBE3ef7d21e4F6bB00EaC27965F9c34c676",
};
const AUCTION: Addr = {
  mainnet: "0x",
  kovan: "0x06E56c880c8a558225A9c74491069a16a8EcE261",
  ropsten: "0x7d9eF1e92BFAacA0AdC945960e291906d3BD91B9",
};

export function getWbtcAddress(network: keyof typeof WBTC): string {
  return WBTC[network];
}

export function getAuctionAddress(network: keyof typeof AUCTION): string {
  return AUCTION[network];
}
