// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface for mintable ERC20 tokens that can be minted by authorized addresses
 */
interface IMintableERC20 {
    /**
     * @dev Mints tokens to a specified address
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mintFor(address to, uint256 amount) external;
}