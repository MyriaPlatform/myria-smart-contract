const { ethers } = require("hardhat");

const OWNER_ACCOUNT_ADDRESS = process.env.PUBLIC_KEY;
const STARKEX_ADDRESS = process.env.STARKEX_ADDRESS;

async function main() {
  const contractFactory = await ethers.getContractFactory("MyriaMintableERC20Token");

  const myriaMintableERC20 = await contractFactory.deploy(
    OWNER_ACCOUNT_ADDRESS,
    "MyriaMintableERC20Token",
    "MMERC20",
    STARKEX_ADDRESS
  );
  await myriaMintableERC20.deployed();
  console.log("Contract deployed to address:", myriaMintableERC20.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
