// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {BeRealRegistry} from "../src/BeRealRegistry.sol";

contract BeRealRegistryScript is Script {
    BeRealRegistry public beRealRegistry;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        beRealRegistry = new BeRealRegistry(0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5);

        vm.stopBroadcast();
    }
}
