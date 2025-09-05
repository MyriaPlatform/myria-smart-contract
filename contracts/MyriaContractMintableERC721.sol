// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC721/MintableERC721.sol";

/**
 * @title MyriaContractMintableERC721
 * @dev Implementation of MintableERC721 for the Myria platform
 */
contract MyriaContractMintableERC721 is MintableERC721 {
    /**
     * @dev Constructor that sets up the NFT collection with name, symbol, owner and Myria address
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param owner The address that will own the contract
     * @param myriaAddress The address of the Myria contract that can mint tokens
     */
    constructor(
        string memory name,
        string memory symbol,
        address owner,
        address myriaAddress
    ) MintableERC721(name, symbol, owner, myriaAddress) {}

    /**
     * @dev Internal function to mint a new token
     * @param user The address that will receive the minted token
     * @param id The ID of the token to be minted
     */
    function _mintFor(
        address user,
        uint256 id,
        bytes memory /* blueprint */
    ) internal override {
        _safeMint(user, id);
    }
}