// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {MockTestingERC20} from "../src/MockTestingERC20.sol";

contract MockTestingERC20Script is Script {
    MockTestingERC20 public mockTestingERC20;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        mockTestingERC20 = new MockTestingERC20(0x3766C6dDF41a590bB68FB925594Dc8b24663C765,1301);

        vm.stopBroadcast();
    }
}
