const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  const { PUBLIC_KEY, MYRIA_ADDRESS } = process.env;

  if (!PUBLIC_KEY || !MYRIA_ADDRESS) {
    throw new Error("PUBLIC_KEY and MYRIA_ADDRESS must be set in environment variables");
  }

  console.log("Deploying MyriaContractMintableERC20 with the following parameters:");
  console.log("Owner Address:", PUBLIC_KEY);
  console.log("Myria Address:", MYRIA_ADDRESS);
  console.log("Token Name: Myria Token");
  console.log("Token Symbol: MYR");

  const MyriaContractMintableERC20 = await ethers.getContractFactory("MyriaContractMintableERC20");
  
  console.log("Deploying contract...");

  const contractName = 'Marip Token';
  const contractSymbol = 'MRO';

  const erc20Contract = await MyriaContractMintableERC20.deploy(
    PUBLIC_KEY,       // owner
    contractName,     // name
    contractSymbol,   // symbol
    MYRIA_ADDRESS     // myria address
  );

  await erc20Contract.waitForDeployment();
  
  const contractAddress = await erc20Contract.getAddress();
  const deploymentTx = erc20Contract.deploymentTransaction();

  console.log("Contract deployment successful!");
  console.log("Deployed contract address:", contractAddress);
  console.log("Transaction hash:", deploymentTx?.hash);
  console.log("\nContract verification:");
  console.log("To verify the contract, run:");
  console.log(`npx hardhat verify --network <network-name> ${contractAddress} ${PUBLIC_KEY} "${contractName}" "${contractSymbol}" ${MYRIA_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });