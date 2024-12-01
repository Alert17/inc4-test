// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingRewards is Ownable {
    IERC20 public POOL_TOKEN;
    IERC20 public REWARD_TOKEN;

    struct Staker {
        uint256 stake;
        uint256 reward;
    }

    mapping(address => Staker) public stakers;

    uint256 public totalStaked;

    event RewardsDistributed(uint256 totalReward, address[] stakers);
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);

    modifier amountGreaterThanZero(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    constructor(address tokenA, address tokenB){
        POOL_TOKEN = IERC20(tokenA);
        REWARD_TOKEN = IERC20(tokenB);
    }

    function deposit(uint256 amount) external amountGreaterThanZero(amount) {
        POOL_TOKEN.transferFrom(msg.sender, address(this), amount);
        stakers[msg.sender].stake += amount;
        totalStaked += amount;

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external amountGreaterThanZero(amount) {
        require(stakers[msg.sender].stake >= amount, "Insufficient staked balance");

        stakers[msg.sender].stake -= amount;
        totalStaked -= amount;

        POOL_TOKEN.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function depositReward(uint256 amount) external onlyOwner amountGreaterThanZero(amount) {
        REWARD_TOKEN.transferFrom(msg.sender, address(this), amount);
    }

    function distributeRewards(address[] calldata stakersArray, uint256 totalReward) external onlyOwner amountGreaterThanZero(totalReward) {
        uint256 _totalStaked = totalStaked;
        require(_totalStaked > 0, "No stakes available");
        require(totalReward <= REWARD_TOKEN.balanceOf(address(this)), "Insufficient rewards in the contract");
        require(stakersArray.length > 0, "No stakers provided");

        for (uint256 i = 0; i < stakersArray.length; i++) {
            address staker = stakersArray[i];
            uint256 stakerStake = stakers[staker].stake;
            if (stakerStake > 0) {
                uint256 reward = (stakerStake * totalReward) / _totalStaked;
                stakers[staker].reward += reward;
            }
        }

        emit RewardsDistributed(totalReward, stakersArray);
    }

    function claimReward(uint256 amount) external amountGreaterThanZero(amount) {
        uint256 reward = stakers[msg.sender].reward;
        require(amount <= reward, "Insufficient reward balance");

        REWARD_TOKEN.transfer(msg.sender, amount);
        stakers[msg.sender].reward -= amount;

        emit RewardClaimed(msg.sender, amount);
    }

    function getRewardBalance(address user) external view returns (uint256) {
        return stakers[user].reward;
    }

    function getStakeBalance(address user) external view returns (uint256) {
        return stakers[user].stake;
    }
}
