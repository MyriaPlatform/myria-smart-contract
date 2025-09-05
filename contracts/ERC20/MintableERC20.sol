// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../@openzeppelin/contracts/access/Ownable.sol";
import "./IMintableERC20.sol";

/**
 * @title MintableERC20
 * @dev Implementation of ERC20 token with minting capabilities controlled by owner and Myria contract.
 * Extends OpenZeppelin's ERC20 implementation and adds controlled minting functionality.
 */
abstract contract MintableERC20 is ERC20, Ownable, IMintableERC20 {
    address internal immutable _myria;

    event MintExecuted(address indexed to, uint256 amount);

    /**
     * @dev Constructor that sets up the token with name, symbol, owner and Myria address
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     * @param owner_ The address that will own the contract
     * @param myria_ The address of the Myria contract that can mint tokens
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        address myria_
    ) ERC20(name_, symbol_) {
        require(owner_ != address(0), "Owner cannot be zero address");
        require(myria_ != address(0), "Myria address cannot be zero address");
        _myria = myria_;
        _transferOwnership(owner_);
    }

    /**
     * @dev Modifier that allows a function to be called only by owner or Myria contract
     */
    modifier onlyOwnerOrMyria() {
        require(
            msg.sender == _myria || msg.sender == owner(),
            "Caller is not owner or Myria"
        );
        _;
    }

    /**
     * @dev Implementation of the mintFor function from IMintableERC20
     * Only owner or Myria contract can call this function
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mintFor(address to, uint256 amount) external override onlyOwnerOrMyria {
        _mint(to, amount);
        emit MintExecuted(to, amount);
    }

    /**
     * @dev Returns the address of the Myria contract
     */
    function myria() public view returns (address) {
        return _myria;
    }
}