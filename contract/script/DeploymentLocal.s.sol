//SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import {Script} from "forge-std/Script.sol";
import {BombGame} from "../src/BombGame.sol";

contract DeploymentLocal is Script {

    uint256 public anvil_pk_0 = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    address public anvil_0 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // owner
    address public anvil_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // house

    BombGame public game;

    function run() public {
        vm.startBroadcast(anvil_pk_0);
        game = new BombGame{value: 1 ether}(anvil_0, anvil_1);
        vm.stopBroadcast();
    }
}