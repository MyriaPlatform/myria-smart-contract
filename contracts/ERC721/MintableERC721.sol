// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../../@openzeppelin/contracts/access/Ownable.sol";
import "./IMintableERC721.sol";
import "../utils/Minting.sol";

/**
 * @title MintableERC721
 * @dev Implementation of ERC721 token with minting capabilities controlled by owner and Myria contract.
 * Extends OpenZeppelin's ERC721 implementation and adds controlled minting functionality.
 */
abstract contract MintableERC721 is ERC721, Ownable, IMintableERC721 {
    address internal immutable _myria;
    
    // Mapping from token ID to its blueprint data
    mapping(uint256 => bytes) public blueprints;

    event AssetMinted(address indexed to, uint256 indexed tokenId, bytes blueprint);

    /**
     * @dev Constructor that sets up the token with name, symbol, owner and Myria address
     * @param name_ The name of the token collection
     * @param symbol_ The symbol of the token collection
     * @param owner_ The address that will own the contract
     * @param myria_ The address of the Myria contract that can mint tokens
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        address myria_
    ) ERC721(name_, symbol_) {
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
     * @dev Implementation of the mintFor function from IMintableERC721
     * Only owner or Myria contract can call this function
     * @param to The address that will receive the minted token
     * @param quantity Must be 1 as this is for non-fungible tokens
     * @param mintingBlob Encoded data containing token ID and blueprint
     */
    function mintFor(
        address to,
        uint256 quantity,
        bytes calldata mintingBlob
    ) external override onlyOwnerOrMyria {
        require(quantity == 1, "MintableERC721: can only mint 1 token at a time");
        require(to != address(0), "MintableERC721: mint to the zero address");

        (uint256 tokenId, bytes memory blueprint) = Minting.split(mintingBlob);
        
        // Check if token ID already exists
        require(!_exists(tokenId), "MintableERC721: token already exists");
        
        _mintFor(to, tokenId, blueprint);
        blueprints[tokenId] = blueprint;
        
        emit AssetMinted(to, tokenId, blueprint);
    }

    /**
     * @dev Internal function to be implemented by derived contracts to perform the actual minting
     * @param to The address that will receive the minted token
     * @param tokenId The ID of the token to be minted
     * @param blueprint Additional data associated with the token
     */
    function _mintFor(
        address to,
        uint256 tokenId,
        bytes memory blueprint
    ) internal virtual;

    /**
     * @dev Returns the address of the Myria contract
     */
    function myria() public view returns (address) {
        return _myria;
    }

    /**
     * @dev Returns the blueprint data for a given token ID
     * @param tokenId The ID of the token
     */
    function getBlueprint(uint256 tokenId) public view returns (bytes memory) {
        require(_exists(tokenId), "MintableERC721: blueprint query for nonexistent token");
        return blueprints[tokenId];
    }
}