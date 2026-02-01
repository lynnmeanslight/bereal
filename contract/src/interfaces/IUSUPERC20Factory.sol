// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUSUPERC20Factory {
    function createToken(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 totalSupply,
        address recipient,
        bytes calldata data,
        bytes32 salt
    ) external returns (address token);
}
