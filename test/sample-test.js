const { expect } = require("chai");
const { ethers } = require("hardhat");
const BN = require("bn.js");

describe("MyriaAsset test", function () {
  let accounts;
  before(async function () {
    accounts = await hre.ethers.getSigners();
  });

  it("Should mint nft", async function () {
    const TestNFT = await ethers.getContractFactory("MyriaAsset");
    const testNFT = await TestNFT.deploy(
      accounts[1].address,
      "MYRIA",
      "MYR",
      accounts[0].address
    );

    testNFT.mintFor(
      accounts[1].address,
      1,
      ethers.utils.toUtf8Bytes("{1}:{blue,green,bumblebee}")
    );
    const balance = (await testNFT.balanceOf(accounts[1].address)).toString();
    expect(balance).to.equal('1');
  });
});
