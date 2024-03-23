//SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract BombGame is Ownable {
    error SendMoreEthOrTokens();
    error InvalidToken();
    //use this if play is entering with eth
    address constant ETH_PLACEHOLDER_ADDR = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    uint256 public ownerCut; // bps 10_000 max
    uint256 public minWager = 0.0001 ether;

    uint256 public totalPendingEthRewards;
    uint256 public pendingEthRewardsForAdmin;
    
    mapping(address=>bool) public admins; // admin address
    mapping(address=>bool) public approvedToken; // "whitelisted" tokens
    mapping(address=>uint256) public minTokenWager; // min wager for tokens
    mapping(address=>bool) public playingForEthPot; // user playing for eth
    // user addr -> token addr -> bool
    mapping(address=>mapping(address=>bool)) public playingForTokenPot; //user playing for tokens
    mapping(address=>uint256) public userPendingTokenRewards; // pending token rewards per user
    mapping(address=>uint256) public userPendingEthRewards; // pending eth rewards per user 
    mapping(address=>uint256) public totalPendingTokenRewards; // total pending token rewards
    mapping(address=>uint256) public pendingTokenRewardsForAdmin; // pending token rewards for admin

    constructor(uint256 _ownersCut) Ownable(msg.sender){
        require(_ownersCut <= 10_000, "Invalid cut");
        ownerCut = _ownersCut;
    }

    // recieve native tokens
    receive() external payable {

    }

    modifier onlyOwnerOrAdmin() {
        require(msg.sender == owner() || admins[msg.sender]);
        _;
    }

    // function that allows users to play the game
    function foundTheBomb(uint256 _amount, address _token) external payable {
        
        // if they play with eth check msg.value and assign them to eth pot
        if(_token == ETH_PLACEHOLDER_ADDR){
            if(msg.value < minWager){
                revert SendMoreEthOrTokens();
            }

            playingForEthPot[msg.sender] = true;
            totalPendingEthRewards += msg.value;

        } else {
            // check minWager of token and assign user to token pot
            if(!approvedToken[_token]){
                revert InvalidToken();
            }
            if(_amount < minTokenWager[_token]){
                revert SendMoreEthOrTokens();
            }

            playingForTokenPot[msg.sender][_token] = true; 
            totalPendingTokenRewards[_token] += _amount;  
        }
    }

    // function called to distribute rewards to users 
    // "pull eth method"
    function bombDefused(address _winner, address _token) external onlyOwnerOrAdmin{
        // check if user if playing for eth pot
        if(playingForEthPot[_winner]){
            playingForEthPot[_winner] = false;

            // credit eth to admin
            uint256 adminFee = calculateFee(totalPendingEthRewards);
            pendingEthRewardsForAdmin += adminFee;
            totalPendingEthRewards -= adminFee;

            // credit eth to user
            uint256 ethWon = totalPendingEthRewards;
            userPendingEthRewards[_winner] += ethWon;
            totalPendingEthRewards -= ethWon;


        } else {
            playingForTokenPot[_winner][_token] = false;

            address admin = owner();

            // credit token to admin
            uint256 adminTokenFee = calculateFee(totalPendingTokenRewards[_token]);
            pendingTokenRewardsForAdmin[admin] += adminTokenFee;
            totalPendingTokenRewards[_token] -= adminTokenFee;

            // credit toke to user

            uint256 tokensWon = totalPendingTokenRewards[_token]; 
            userPendingTokenRewards[_winner] += tokensWon;
            totalPendingTokenRewards[_token] -= tokensWon;

        }

    }

    function withdrawEthRewards() external {}

    function witdrawEthRewards() external {}

    function calculateFee(uint256 _amount) internal view returns (uint256) {
        uint256 fee = (_amount * ownerCut) / 10000; 
        return fee;
    }


    //////////////////////////////
    /// Admin Setter Functions ///
    //////////////////////////////

    function setTokenApproved(address _token, bool _status) public onlyOwnerOrAdmin {
        approvedToken[_token] = _status;
    }

    function setMinWagerToken(address _token, uint256 _amount) external onlyOwnerOrAdmin{
        if(!approvedToken[_token]){
            revert InvalidToken();
        }

        minTokenWager[_token] = _amount;
    }

    function setAdminStatus(address _address, bool _status) public onlyOwner {
        admins[_address] = _status;
    }

    function changeMinWager(uint256 _amount) external onlyOwnerOrAdmin {
        minWager = _amount;
    }

}