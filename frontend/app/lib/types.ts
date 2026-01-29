export type AuctionParameters = {
  /** token to raise funds in. Use address(0) for ETH */
  currency: string;

  /** address to receive leftover tokens */
  tokensRecipient: string;

  /** address to receive all raised funds */
  fundsRecipient: string;

  /** Block which the first step starts */
  startBlock: bigint;

  /** When the auction finishes */
  endBlock: bigint;

  /** Block when the auction can be claimed */
  claimBlock: bigint;

  /** Fixed granularity for prices */
  tickSpacing: bigint;

  /** Optional hook called before a bid */
  validationHook: string;

  /** Starting floor price for the auction */
  floorPrice: bigint;

  /** Amount of currency required to be raised for the auction to graduate */
  requiredCurrencyRaised: bigint;

  /** Packed bytes describing token issuance schedule */
  auctionStepsData: `0x${string}`;
};
