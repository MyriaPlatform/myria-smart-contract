// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMintable.sol";
import "./utils/Minting.sol";

//----------------------------------------
//----------------------------------------
//------------- NOT AUDITED --------------
//----------------------------------------
//----------------------------------------

abstract contract MintableERC20 is Ownable, IMintable {
    address public myria;
    mapping(uint256 => bytes) public blueprints;

    event AssetMinted(address to, uint256 amount);

    constructor(address _owner, address _myria) {
        myria = _myria;
        require(_owner != address(0), "Owner must not be empty");
        transferOwnership(_owner);
    }

    modifier onlyOwnerOrMyria() {
        require(
            msg.sender == myria || msg.sender == owner(),
            "Function can only be called by owner or myria"
        );
        _;
    }

    function mintFor(
        address user,
        uint256 amount,
        bytes calldata mintingBlob
    ) external override onlyOwnerOrMyria {
        _mintFor(user, amount);
        emit AssetMinted(user, amount);
    }

    function _mintFor(address user, uint256 amount) internal virtual;
}
