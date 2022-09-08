const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  const { PUBLIC_KEY, STARKEX_ADDRESS } = process.env;

  const testNFT = await ethers.getContractFactory("MyriaAsset");
  const nftResult = await testNFT.deploy(PUBLIC_KEY, "Myria", "MRY", STARKEX_ADDRESS);
  console.log('Deploying..');

  await nftResult.deployed();
  console.log("Deployed contract address: ", nftResult.address);
  console.log("Transaction hash: ", nftResult.deployTransaction.hash)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  })