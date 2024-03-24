//SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract BombGame is Ownable {

    error BombGame__InvalidEntryFee(uint256 entryFee);
    error BombGame__AlreadyPlaying();
    error BombGame__PlayerNotActive();
    error BombGame__NoWinnings();
    error BombGame__AlreadyClaimed();
    error BombGame__InsufficientBalance();
    error BombGame__TransferFailed();
    error BombGame__OnlyHouse();
    error BombGame__NoHouseTake();

    uint256 public constant ENTRY_FEE = 0.00069 ether;
    
    /**
     * @notice accounting expressed in basis points - i.e. upon winning:
     * winner take 69.420% of prize pool
     * house takes 10% or prize pool
     * 20.58% remains in prize pool
     */
    uint256 public constant WIN_PERCENTAGE = 6942; 
    uint256 public constant HOUSE_CUT = 1000;
    uint256 public constant PRECISION = 10000; // all percentages expressed in basis points

    uint256 public prizePool;
    uint256 public houseTake;
    address public immutable house;

    /**
     * @notice incremented each time a player wins
     */
    uint256 public gameNonce; 

    mapping(address => bool) public isPlaying;
    mapping(uint256 => mapping(address => uint256)) public playerWinnings; // game nonce => player => amount
    mapping(uint256 => bool) public hasClaimed; 

    event Entered(address indexed player);
    event Lose(address indexed player);
    event Win(address indexed winner, uint256 indexed amount, uint256 indexed nonce);
    event WinningsClaimed(address indexed winner, uint256 indexed amount, uint256 indexed nonce);
    event PoolFunded(uint256 amount);
    event HouseTakeWithdrawn(address indexed recipient, uint256 amount);

    constructor(address _owner, address _house) Ownable(_owner) payable {
        house = _house;
        prizePool = msg.value;
    }

    /**
     * @notice enters a new player
     * @notice only one game at a time per address
     */
    function play() external payable {
        if (msg.value != ENTRY_FEE) revert BombGame__InvalidEntryFee(ENTRY_FEE);
        if (isPlaying[msg.sender]) revert BombGame__AlreadyPlaying();
        isPlaying[msg.sender] = true;
        prizePool += msg.value;
        emit Entered(msg.sender);
    }

    function endGame(address _player, bool _isWinner) external onlyOwner {
        if (!isPlaying[_player]) revert BombGame__PlayerNotActive();
        isPlaying[_player] = false;
        if (!_isWinner) {
            emit Lose(_player);
            return;
        } else { 
            uint256 winningNonce = gameNonce;
            ++gameNonce;
            uint256 winnings = (prizePool * WIN_PERCENTAGE) / PRECISION;
            uint256 houseCut = (prizePool * HOUSE_CUT) / PRECISION;
            prizePool = prizePool - winnings - houseCut;
            houseTake += houseCut;
            playerWinnings[winningNonce][_player] = winnings;
            emit Win(_player, winnings, winningNonce);
        }
    }

    function claimWinnings(uint256 _gameNonce) external {
        if (hasClaimed[_gameNonce]) revert BombGame__AlreadyClaimed();
        uint256 winnings = playerWinnings[_gameNonce][msg.sender];
        if (winnings == 0) revert BombGame__NoWinnings();
        hasClaimed[_gameNonce] = true;
        emit WinningsClaimed(msg.sender, winnings, _gameNonce);
        if (address(this).balance < winnings) revert BombGame__InsufficientBalance();
        (bool success, ) = msg.sender.call{value: winnings}("");
        if (!success) revert BombGame__TransferFailed();
    }

    function fundPool() external payable {
        prizePool += msg.value;
        emit PoolFunded(msg.value);
    }

    function withdrawHouseTake(address _recipient) external {
        if (msg.sender != house) revert BombGame__OnlyHouse();
        if (houseTake == 0) revert BombGame__NoHouseTake();
        uint256 amount = houseTake;
        houseTake = 0;
        emit HouseTakeWithdrawn(_recipient, amount);
        (bool success, ) = _recipient.call{value: amount}("");
        if (!success) revert BombGame__TransferFailed();
    }

    function isPlayerEntered(address _player) external view returns (bool) {
        return isPlaying[_player];
    }

    function getNonce() external view returns (uint256) {
        return gameNonce;
    }

}