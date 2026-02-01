// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IContinuousClearingAuctionFactory {
    function initializeDistribution(
        address token,
        uint256 amount,
        bytes calldata configData,
        bytes32 salt
    ) external returns (address distributionContract);

    event AuctionCreated(
        address indexed auction,
        address indexed token,
        uint256 amount,
        bytes configData
    );
}
