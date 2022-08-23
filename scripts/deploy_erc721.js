require("dotenv").config();
const { ethers } = require("hardhat");

const PUBLIC_KEY_WALLET = '0x724f337bF0Fa934dB9aa3ec6dEa49B03c54AD3cc';
const STARKEX_ADDRESS = '0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9';

async function main() {
  
  const testNFT = await ethers.getContractFactory("MyriaAsset");

  const nftResult = await testNFT.deploy(PUBLIC_KEY_WALLET, "MyriaNFT", "MyriaNFTSymb", STARKEX_ADDRESS);
  console.log('Smart contract for NFT ERC721 is deploying');
  await nftResult.deployed();
  console.log("Your new NFT smart contract ERC721 deployed to address: ", nftResult.address);
  console.log("Deploy transaction hash: " ,nftResult.deployTransaction.hash)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  })