// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IContinuousClearingAuctionFactory } from "./interfaces/IContinuousClearingAuctionFactory.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { IDistributionAuction } from "./interfaces/IDistributionAuction.sol";

contract BeRealRegistry {
    // -------- Errors --------
    error ZeroAddress();
    error AuctionExists();
    error AuctionUnknown();
    error InvalidFactory();
    error NotAuthorized();
    error TransferFailed();

    // -------- Events --------
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    event AuctionRecorded(
        address indexed auction,
        address indexed token,
        uint256 amount,
        bytes32 configHash,
        address indexed creator,
        uint64 createdAt
    );

    // -------- Storage --------
    struct AuctionRecord {
        address auction;
        address token;
        uint256 amount;
        bytes32 configHash;
        address creator;
        uint64 createdAt;
        bool active;
    }

    address public owner;
    address public auctionFactory;

    mapping(address => AuctionRecord) public auctions;
    address[] public auctionIndex;

    // -------- Modifiers --------
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    // -------- Constructor --------
    constructor(address auctionFactory_) {
        if (auctionFactory_ == address(0)) revert InvalidFactory();
        owner = msg.sender;
        auctionFactory = auctionFactory_;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // -------- Admin --------
    function setAuctionFactory(address factory_) external onlyOwner {
        if (factory_ == address(0)) revert InvalidFactory();
        auctionFactory = factory_;
    }

    // ============================================================
    // 🚀 CREATE AUCTION (REQUIRES PRIOR APPROVAL)
    // ============================================================

    function createAuctionWithApproval(
        address token,
        uint256 amount,
        bytes calldata configData,
        bytes32 salt
    ) external returns (address auction) {
        if (token == address(0)) revert ZeroAddress();

        // 1. Create auction
        auction = IContinuousClearingAuctionFactory(auctionFactory)
            .initializeDistribution(token, amount, configData, salt);

        if (auction == address(0)) revert AuctionUnknown();
        if (auctions[auction].auction != address(0)) revert AuctionExists();

        // 2. Pull tokens from user (requires approve)
        if (!IERC20(token).transferFrom(msg.sender, auction, amount)) {
            revert TransferFailed();
        }

        // 3. Notify auction
        IDistributionAuction(auction).onTokensReceived();

        // 4. Record
        _recordAuction(
            auction,
            token,
            amount,
            keccak256(configData),
            msg.sender
        );
    }

    // -------- Internal --------
    function _recordAuction(
        address auction,
        address token,
        uint256 amount,
        bytes32 configHash,
        address creator
    ) internal {
        auctions[auction] = AuctionRecord({
            auction: auction,
            token: token,
            amount: amount,
            configHash: configHash,
            creator: creator,
            createdAt: uint64(block.timestamp),
            active: true
        });

        auctionIndex.push(auction);

        emit AuctionRecorded(
            auction,
            token,
            amount,
            configHash,
            creator,
            uint64(block.timestamp)
        );
    }
}
