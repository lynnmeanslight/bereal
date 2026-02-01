export const AuctionABI = [
  {
    inputs: [],
    name: "tickSpacing",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "floorPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    type: "constructor",
    inputs: [
      { name: "_token", type: "address" },
      { name: "_totalSupply", type: "uint128" },
      {
        name: "_parameters",
        type: "tuple",
        components: [
          { name: "auctionStepsData", type: "bytes" },
          { name: "startBlock", type: "uint64" },
          { name: "endBlock", type: "uint64" },
          { name: "claimBlock", type: "uint64" },
          { name: "currency", type: "address" },
          { name: "tokensRecipient", type: "address" },
          { name: "fundsRecipient", type: "address" },
          { name: "requiredCurrencyRaised", type: "uint256" },
          { name: "tickSpacing", type: "uint256" },
          { name: "floorPrice", type: "uint256" },
          { name: "validationHook", type: "address" },
        ],
      },
    ],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "onTokensReceived",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "lbpInitializationParams",
    inputs: [],
    outputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "initialPriceX96", type: "uint256" },
          { name: "tokensSold", type: "uint256" },
          { name: "currencyRaised", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "supportsInterface",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "pure",
  },

  {
    type: "function",
    name: "clearingPrice",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "isGraduated",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "currencyRaised",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "checkpoint",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "clearingPrice", type: "uint256" },
          { name: "cumulativeMps", type: "uint256" },
          { name: "cumulativeMpsPerPrice", type: "uint256" },
          { name: "currencyRaisedAtClearingPriceQ96_X7", type: "uint256" },
          { name: "next", type: "uint64" },
          { name: "prev", type: "uint64" },
        ],
      },
    ],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "forceIterateOverTicks",
    inputs: [{ name: "_untilTickPrice", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "submitBid",
    inputs: [
      { name: "_maxPrice", type: "uint256" },
      { name: "_amount", type: "uint128" },
      { name: "_owner", type: "address" },
      { name: "_prevTickPrice", type: "uint256" },
      { name: "_hookData", type: "bytes" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
  },

  {
    type: "function",
    name: "submitBid",
    inputs: [
      { name: "_maxPrice", type: "uint256" },
      { name: "_amount", type: "uint128" },
      { name: "_owner", type: "address" },
      { name: "_hookData", type: "bytes" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
  },

  {
    type: "function",
    name: "exitBid",
    inputs: [{ name: "_bidId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "exitPartiallyFilledBid",
    inputs: [
      { name: "_bidId", type: "uint256" },
      { name: "_lastFullyFilledCheckpointBlock", type: "uint64" },
      { name: "_outbidBlock", type: "uint64" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "claimTokens",
    inputs: [{ name: "_bidId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "claimTokensBatch",
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_bidIds", type: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "sweepCurrency",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "sweepUnsoldTokens",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "currency",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "token",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "tokensRecipient",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "fundsRecipient",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "startBlock",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "endBlock",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "claimBlock",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "validationHook",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "currencyRaisedQ96_X7",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "sumCurrencyDemandAboveClearingQ96",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "totalClearedQ96_X7",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "totalCleared",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
];
