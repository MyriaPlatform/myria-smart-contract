// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./Myria.sol";

contract Registration {
    Myria public myria;

    constructor(Myria _myria) {
        myria = _myria;
    }

    function registerAndDeposit(
        address ethKey,
        uint256 starkKey,
        bytes calldata signature,
        uint256 assetType,
        uint256 vaultId
    ) external payable {
        myria.registerUser(ethKey, starkKey, signature);
        // the standard way to write this is: myria.deposit.value(msg.value)(starkKey, assetType, vaultId);
        // but the Solidity compiler hates the overloading of deposit + the use of .value()
        (bool success, ) = address(myria).call{value: msg.value}(
            abi.encodeWithSignature(
                "deposit(uint256,uint256,uint256)",
                starkKey,
                assetType,
                vaultId
            )
        );
        require(success, "Deposit Failed");
    }

    function registerAndDeposit(
        address ethKey,
        uint256 starkKey,
        bytes calldata signature,
        uint256 assetType,
        uint256 vaultId,
        uint256 quantizedAmount
    ) external {
        myria.registerUser(ethKey, starkKey, signature);
        myria.deposit(starkKey, assetType, vaultId, quantizedAmount);
    }

    function registerAndDepositNft(
        address ethKey,
        uint256 starkKey,
        bytes calldata signature,
        uint256 assetType,
        uint256 vaultId,
        uint256 tokenId
    ) external {
        myria.registerUser(ethKey, starkKey, signature);
        myria.depositNft(starkKey, assetType, vaultId, tokenId);
    }

    function registerAndWithdraw(
        address ethKey,
        uint256 starkKey,
        bytes calldata signature,
        uint256 assetType
    ) external {
        myria.registerUser(ethKey, starkKey, signature);
        myria.withdraw(starkKey, assetType);
    }

    function registerAndWithdrawTo(
        address ethKey,
        uint256 starkKey,
        bytes calldata signature,
        uint256 assetType,
        address recipient
    ) external {
        myria.registerUser(ethKey, starkKey, signature);
        myria.withdrawTo(starkKey, assetType, recipient);
    }

    function registerAndWithdrawNft(
        address ethKey,
        uint256 starkKey,
        bytes calldata signature,
        uint256 assetType,
        uint256 tokenId
    ) external {
        myria.registerUser(ethKey, starkKey, signature);
        myria.withdrawNft(starkKey, assetType, tokenId);
    }

    function registerAndWithdrawNftTo(
        address ethKey,
        uint256 starkKey,
        bytes calldata signature,
        uint256 assetType,
        uint256 tokenId,
        address recipient
    ) external {
        myria.registerUser(ethKey, starkKey, signature);
        myria.withdrawNftTo(starkKey, assetType, tokenId, recipient);
    }

    function regsiterAndWithdrawAndMint(
        address ethKey,
        uint256 starkKey,
        bytes calldata signature,
        uint256 assetType,
        bytes calldata mintingBlob
    ) external {
        myria.registerUser(ethKey, starkKey, signature);
        myria.withdrawAndMint(starkKey, assetType, mintingBlob);
    }

    function isRegistered(uint256 starkKey) public view returns (bool) {
        return myria.getEthKey(starkKey) != address(0);
    }
}
