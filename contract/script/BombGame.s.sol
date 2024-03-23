//SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {BombGame} from "../src/BombGame.sol";

contract BombGameScript is Script {

    function run() external {
        address owner = 0x3cA0d3109CA8A79F8BB5655df46abF9011575499; //raffie
        address house = 0x440aD326D0e8f7eB08107014a3838F79bEC384FE; //phat


        vm.startBroadcast();

        BombGame bombGame = new BombGame{value: 0.001 ether}(owner, house);

        console.log("MyToken deployed to:", address(bombGame));


        vm.stopBroadcast();
    }
}