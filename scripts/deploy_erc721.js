const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  const { PUBLIC_KEY, MYRIA_ADDRESS } = process.env;

  if (!PUBLIC_KEY || !MYRIA_ADDRESS) {
    throw new Error("PUBLIC_KEY and MYRIA_ADDRESS must be set in environment variables");
  }

  console.log("Deploying MyriaContractMintableERC721 with the following parameters:");
  console.log("Owner Address:", PUBLIC_KEY);
  console.log("Myria Address:", MYRIA_ADDRESS);
  console.log("Collection Name: Myria NFT Collection");
  console.log("Collection Symbol: MNFT");

  const MyriaContractMintableERC721 = await ethers.getContractFactory("MyriaContractMintableERC721");
  
  console.log("Deploying contract...");

  const contractName = 'Myria NFT Collection';
  const contractSymbol = 'MNFT'

  const nftContract = await MyriaContractMintableERC721.deploy(
    contractName, // name
    contractSymbol,                 // symbol
    PUBLIC_KEY,            // owner
    MYRIA_ADDRESS         // myria address
  );

  await nftContract.waitForDeployment();
  
  const contractAddress = await nftContract.getAddress();
  const deploymentTx = nftContract.deploymentTransaction();

  console.log("Contract deployment successful!");
  console.log("Deployed contract address:", contractAddress);
  console.log("Transaction hash:", deploymentTx?.hash);
  console.log("\nContract verification:");
  console.log("To verify the contract, run:");
  console.log(`npx hardhat verify --network <network-name> ${contractAddress} "Myria NFT Collection" "MNFT" ${PUBLIC_KEY} ${MYRIA_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });