// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IDRXFaucet
 * @dev Faucet contract for distributing IDRX tokens on Base Sepolia testnet
 * Features:
 * - Rate limiting (24 hour cooldown per address)
 * - Configurable drip amount
 * - Admin controls for managing faucet
 * - Event logging for tracking claims
 */
contract IDRXFaucet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // IDRX token contract
    IERC20 public immutable idrxToken;

    // Drip amount per claim (default: 10,000 IDRX with 2 decimals)
    uint256 public dripAmount = 10_000 * 10 ** 2;

    // Cooldown period between claims (default: 30 minutes)
    uint256 public cooldownPeriod = 30 minutes;

    // Mapping of address to last claim timestamp
    mapping(address => uint256) public lastClaimTime;

    // Total tokens distributed
    uint256 public totalDistributed;

    // Total number of claims
    uint256 public totalClaims;

    // Events
    event TokensClaimed(
        address indexed claimer,
        uint256 amount,
        uint256 timestamp
    );
    event DripAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event CooldownPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event FaucetFunded(address indexed funder, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    // Errors
    error CooldownNotExpired(uint256 remainingTime);
    error InsufficientFaucetBalance();
    error ZeroAddress();
    error ZeroAmount();

    /**
     * @dev Constructor
     * @param _idrxToken Address of the IDRX token contract
     */
    constructor(address _idrxToken) Ownable(msg.sender) {
        if (_idrxToken == address(0)) revert ZeroAddress();
        idrxToken = IERC20(_idrxToken);
    }

    /**
     * @dev Claim IDRX tokens from the faucet
     * Can only be called once per cooldown period
     */
    function claim() external nonReentrant {
        // Check cooldown
        uint256 lastClaim = lastClaimTime[msg.sender];
        if (lastClaim != 0) {
            uint256 timeSinceLastClaim = block.timestamp - lastClaim;
            if (timeSinceLastClaim < cooldownPeriod) {
                revert CooldownNotExpired(cooldownPeriod - timeSinceLastClaim);
            }
        }

        // Check faucet balance
        uint256 faucetBalance = idrxToken.balanceOf(address(this));
        if (faucetBalance < dripAmount) {
            revert InsufficientFaucetBalance();
        }

        // Update state
        lastClaimTime[msg.sender] = block.timestamp;
        totalDistributed += dripAmount;
        totalClaims++;

        // Transfer tokens
        idrxToken.safeTransfer(msg.sender, dripAmount);

        emit TokensClaimed(msg.sender, dripAmount, block.timestamp);
    }

    /**
     * @dev Check if an address can claim tokens
     * @param user Address to check
     * @return canClaim Whether the user can claim
     * @return remainingCooldown Time remaining until next claim (0 if can claim)
     */
    function canClaim(
        address user
    ) external view returns (bool canClaim, uint256 remainingCooldown) {
        uint256 lastClaim = lastClaimTime[user];

        if (lastClaim == 0) {
            return (true, 0);
        }

        uint256 timeSinceLastClaim = block.timestamp - lastClaim;
        if (timeSinceLastClaim >= cooldownPeriod) {
            return (true, 0);
        }

        return (false, cooldownPeriod - timeSinceLastClaim);
    }

    /**
     * @dev Get faucet balance
     * @return Current IDRX balance of the faucet
     */
    function getFaucetBalance() external view returns (uint256) {
        return idrxToken.balanceOf(address(this));
    }

    /**
     * @dev Get number of claims remaining based on current balance
     * @return Number of claims that can be made
     */
    function getRemainingClaims() external view returns (uint256) {
        uint256 balance = idrxToken.balanceOf(address(this));
        return balance / dripAmount;
    }

    // ============ Admin Functions ============

    /**
     * @dev Update the drip amount
     * @param newAmount New amount to distribute per claim
     */
    function setDripAmount(uint256 newAmount) external onlyOwner {
        if (newAmount == 0) revert ZeroAmount();

        uint256 oldAmount = dripAmount;
        dripAmount = newAmount;

        emit DripAmountUpdated(oldAmount, newAmount);
    }

    /**
     * @dev Update the cooldown period
     * @param newPeriod New cooldown period in seconds
     */
    function setCooldownPeriod(uint256 newPeriod) external onlyOwner {
        uint256 oldPeriod = cooldownPeriod;
        cooldownPeriod = newPeriod;

        emit CooldownPeriodUpdated(oldPeriod, newPeriod);
    }

    /**
     * @dev Fund the faucet with IDRX tokens
     * @param amount Amount of tokens to add
     */
    function fundFaucet(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();

        idrxToken.safeTransferFrom(msg.sender, address(this), amount);

        emit FaucetFunded(msg.sender, amount);
    }

    /**
     * @dev Emergency withdraw all tokens (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = idrxToken.balanceOf(address(this));
        if (balance == 0) revert ZeroAmount();

        idrxToken.safeTransfer(owner(), balance);

        emit EmergencyWithdraw(owner(), balance);
    }

    /**
     * @dev Withdraw specific amount of tokens (owner only)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();

        uint256 balance = idrxToken.balanceOf(address(this));
        if (balance < amount) revert InsufficientFaucetBalance();

        idrxToken.safeTransfer(owner(), amount);
    }
}
