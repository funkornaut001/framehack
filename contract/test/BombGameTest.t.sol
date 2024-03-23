//SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { Test, console2 } from "forge-std/Test.sol";
import { BombGame } from "../src/BombGame.sol";


contract BombGameTest is Test {

    BombGame public game;

    address public owner = makeAddr("owner");
    address public house = makeAddr("house");
    address public admin = makeAddr("admin");
    uint256 public INITIAL_POOL = 10 ether;

    address public bob = makeAddr("bob");
    address public alice = makeAddr("blice");
    address public carlos = makeAddr("carlos");
    address[] public players = [alice, bob, carlos];
    uint256 playerStartingBalance = 1 ether;

    uint256 public entryFee;

    event Entered(address indexed player);
    event Lose(address indexed player);
    event Win(address indexed winner, uint256 indexed amount, uint256 indexed nonce);
    event WinningsClaimed(address indexed winner, uint256 indexed amount, uint256 indexed nonce);
    event PoolFunded(uint256 amount);
    event HouseTakeWithdrawn(address indexed recipient, uint256 amount);

    function setUp() public {
        vm.deal(owner, INITIAL_POOL);
        for(uint i; i < players.length; ++i) {
            vm.deal(players[i], playerStartingBalance);
        }

        vm.prank(owner);
        game = new BombGame{value: INITIAL_POOL}(owner, house);
        entryFee = game.ENTRY_FEE();
    }

    modifier threePlayersEntered() {
        for(uint i; i < players.length; ++i) {
            vm.prank(players[i]);
            game.play{value: entryFee}();
        }
        _;
    }

    function test_deployment() public view {
        assertEq(game.owner(), owner);
        assertEq(address(game).balance, INITIAL_POOL);
        assertEq(game.prizePool(), INITIAL_POOL);
    }

    function test_play() public {
        uint256 playerBalBefore = alice.balance;
        uint256 contractBalBefore = address(game).balance;
        uint256 poolBalBefore = game.prizePool();

        assertEq(game.isPlaying(alice), false);

        vm.expectEmit(address(game));
        emit Entered(alice);
        vm.prank(alice);
        game.play{value: entryFee}();

        assertEq(game.isPlaying(alice), true);
        assertEq(game.prizePool(), poolBalBefore + entryFee);
        assertEq(alice.balance, playerBalBefore - entryFee);
        assertEq(address(game).balance, contractBalBefore + entryFee);
    }

    function test_play_revertConditions() public {

        // invalid fee
        vm.expectRevert(abi.encodeWithSelector(BombGame.BombGame__InvalidEntryFee.selector, entryFee));
        vm.prank(alice);
        game.play{value: entryFee - 1}();

        // already playing
        vm.prank(alice);
        game.play{value: entryFee}();
        vm.expectRevert(BombGame.BombGame__AlreadyPlaying.selector);
        vm.prank(alice);
        game.play{value: entryFee}();
    }

    function test_endGame_lose() public threePlayersEntered {
        uint256 nonceBefore = game.gameNonce();
        assertEq(game.isPlaying(alice), true);

        vm.expectEmit(address(game));
        emit Lose(alice);
        vm.prank(owner);
        game.endGame(alice, false);

        assertEq(game.isPlaying(alice), false); // alice no longer playing
        assertEq(game.gameNonce(), nonceBefore); // nonce NOT incremented
    }
    
    function test_endGame_win() public threePlayersEntered {
        uint256 nonceBefore = game.gameNonce();
        assertEq(game.isPlaying(alice), true);
        assertEq(game.playerWinnings(nonceBefore, alice), 0);
        uint256 poolBefore = game.prizePool();
        uint256 houseTakeBefore = game.houseTake();
        uint256 expectedWinnings = (game.prizePool() * game.WIN_PERCENTAGE()) / game.PRECISION();
        uint256 expectedHouseTake = (game.prizePool() * game.HOUSE_CUT()) / game.PRECISION();
        uint256 expectedRemainder = (game.prizePool() - expectedWinnings - expectedHouseTake);

        vm.expectEmit(address(game));
        emit Win(alice, expectedWinnings, nonceBefore);
        vm.prank(owner);
        game.endGame(alice, true);

        assertEq(game.isPlaying(alice), false); // alice no longer playing
        assertEq(game.gameNonce(), nonceBefore + 1); // nonce incremented
        assertEq(game.houseTake(), houseTakeBefore + expectedHouseTake); // house take updated
        assertEq(game.playerWinnings(nonceBefore, alice), expectedWinnings); // winnings updated
        assertEq(game.prizePool(), expectedRemainder); // prizePool updated
    }

    function test_endGame_revert_winnerNotCurrentlyPlaying() public {
        test_endGame_win();
        assertEq(game.isPlaying(alice), false);

        vm.expectRevert(BombGame.BombGame__PlayerNotActive.selector);
        vm.prank(owner);
        game.endGame(alice, true);
    }

    function test_multiple_wins() public {
        test_endGame_win();
        // bob & carlos still playing
        assertEq(game.isPlaying(bob), true);
        assertEq(game.isPlaying(carlos), true);
        uint256 nonceBefore = game.gameNonce();
        uint256 houseTakeBefore = game.houseTake();
        uint256 expectedWinnings = (game.prizePool() * game.WIN_PERCENTAGE()) / game.PRECISION();
        uint256 expectedHouseTake = (game.prizePool() * game.HOUSE_CUT()) / game.PRECISION();
        uint256 expectedRemainder = (game.prizePool() - expectedWinnings - expectedHouseTake);

        vm.expectEmit(address(game));
        emit Win(bob, expectedWinnings, nonceBefore);
        vm.prank(owner);
        game.endGame(bob, true);

        assertEq(game.isPlaying(bob), false); // bob no longer playing
        assertEq(game.gameNonce(), nonceBefore + 1); // nonce incremented
        assertEq(game.houseTake(), houseTakeBefore + expectedHouseTake); // house take updated
        assertEq(game.playerWinnings(nonceBefore, bob), expectedWinnings); // winnings updated
        assertEq(game.prizePool(), expectedRemainder); // prizePool updated
    }
    
    function test_claimWinnings() public threePlayersEntered {
        uint256 contractBalBefore = address(game).balance;
        uint256 winnerBalBefore = alice.balance;
        uint256 expectedWinnings = (game.prizePool() * game.WIN_PERCENTAGE()) / game.PRECISION();
        uint256 winningNonce = game.gameNonce();

        vm.prank(owner);
        game.endGame(alice, true);
        assertEq(game.hasClaimed(winningNonce), false);

        vm.expectEmit(address(game));
        emit WinningsClaimed(alice, expectedWinnings, winningNonce);
        vm.prank(alice);
        game.claimWinnings(winningNonce);

        assertEq(address(game).balance, contractBalBefore - expectedWinnings); // balance transferred
        assertEq(alice.balance, winnerBalBefore + expectedWinnings);
        assertEq(game.hasClaimed(winningNonce), true); // mappings updated
    }

    function test_claimWinnings_revertConditions() public threePlayersEntered {
        uint256 winningNonce = game.gameNonce();
        vm.prank(owner);
        game.endGame(alice, true);

        // not winner 
        assertEq(game.playerWinnings(winningNonce, bob), 0);
        vm.expectRevert(BombGame.BombGame__NoWinnings.selector);
        vm.prank(bob);
        game.claimWinnings(winningNonce);

        // already claimed
        vm.prank(alice);
        game.claimWinnings(winningNonce);
        vm.expectRevert(BombGame.BombGame__AlreadyClaimed.selector);
        vm.prank(alice);
        game.claimWinnings(winningNonce);

        // always reverts after claim
        vm.expectRevert(BombGame.BombGame__AlreadyClaimed.selector);
        vm.prank(bob);
        game.claimWinnings(winningNonce);
    }

    function test_fundPool() public {
        uint256 contractBalBefore = address(game).balance;
        uint256 poolBefore = game.prizePool();
        uint256 fundAmount = 1 ether;
        vm.deal(owner, fundAmount);

        vm.expectEmit(address(game));
        emit PoolFunded(fundAmount);
        vm.prank(owner);
        game.fundPool{value: fundAmount}();

        assertEq(address(game).balance, contractBalBefore + fundAmount);
        assertEq(game.prizePool(), poolBefore + fundAmount);
    }

    function test_withdrawHouseTake() public threePlayersEntered {
        vm.prank(owner);
        game.endGame(alice, true);

        uint256 contractBalBefore = address(game).balance;
        uint256 houseTakeBefore = game.houseTake();
        uint256 recipientBalBefore = admin.balance;

        vm.expectEmit(address(game));
        emit HouseTakeWithdrawn(admin, houseTakeBefore);
        vm.prank(house);
        game.withdrawHouseTake(admin);

        assertEq(address(game).balance, contractBalBefore - houseTakeBefore);
        assertEq(admin.balance, recipientBalBefore + houseTakeBefore);
        assertEq(game.houseTake(), 0);
    }

    function test_withdrawHouseTake_revertConditions() public threePlayersEntered {
        
        vm.prank(owner);
        game.endGame(alice, true);

        // not house
        vm.expectRevert(BombGame.BombGame__OnlyHouse.selector);
        vm.prank(owner);
        game.withdrawHouseTake(admin);

        // no house take
        vm.prank(house);
        game.withdrawHouseTake(admin);
        assertEq(game.houseTake(), 0);

        vm.expectRevert(BombGame.BombGame__NoHouseTake.selector);
        vm.prank(house);
        game.withdrawHouseTake(admin);

    }

}