// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./MintableERC20.sol";

//----------------------------------------
//----------------------------------------
//------------- NOT AUDITED --------------
//----------------------------------------
//----------------------------------------

contract MyriaMintableERC20Token is ERC20, MintableERC20 {
    constructor(
        address _owner,
        string memory _name,
        string memory _symbol,
        address _myria
    ) ERC20(_name, _symbol) MintableERC20(_owner, _myria) {}

    function mint(address user, uint256 amount) external {
        _mint(user, amount);
    }

    function _mintFor(address user, uint256 amount) internal override {
        _mint(user, amount);
    }
}
