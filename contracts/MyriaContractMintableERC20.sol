// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ERC20/MintableERC20.sol";

/**
 * @title MyriaContractMintableERC20
 * @dev Implementation of a mintable ERC20 token for the Myria platform
 */
contract MyriaContractMintableERC20 is MintableERC20 {
    /**
     * @dev Constructor that sets up the token with name, symbol, owner and Myria address
     * @param owner_ The address that will own the contract
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     * @param myria_ The address of the Myria contract that can mint tokens
     */
    constructor(
        address owner_,
        string memory name_,
        string memory symbol_,
        address myria_
    ) MintableERC20(name_, symbol_, owner_, myria_) {}

    /**
     * @dev Public function to mint tokens, only callable by owner
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}