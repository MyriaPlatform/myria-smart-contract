require("dotenv").config();
const { ethers } = require("hardhat");

const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(API_URL);

const contract = require("../artifacts/contracts/MyriaAsset.sol/MyriaAsset.json");
const contractAddress = "0x4EC5aF52445Dc403E175b7b380f8bCA840F51119";
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

async function mintNFT(tokenURI) {
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest");

  // const tokenId = "1";
  // const mintingBlob = `${tokenId}:${tokenURI}`;
  // const mintingBlobBytes = web3.utils.asciiToHex(mintingBlob);
  const testData = ethers.utils.toUtf8Bytes("{1}:{blue,green,bumblebee}")
  const tx = {
    from: PUBLIC_KEY,
    to: contractAddress,
    nonce: nonce,
    gas: 500000,
    data: nftContract.methods
      .mintFor("0xC774461219003a11cb3f8bef7D9AF705E42d692C", "1", testData)
      .encodeABI(),
  };

  const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
  signPromise
    .then((signedTx) => {
      web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
        function (err, hash) {
          if (!err) {
            console.log(
              "The hash of your transaction is: ",
              hash,
              "\nCheck Alchemy's Mempool to view the status of your transaction!"
            );
          } else {
            console.log(
              "Something went wrong when submitting your transaction:",
              err
            );
          }
        }
      );
    })
    .catch((err) => {
      console.log("Promise failed:", err);
    });
}

mintNFT("Qmeih2ANTWiz6XgbWAWGf965RJK6BUwo1GHTrLXx31JUva");
// console.log(`data: ${web3.utils.hexToAscii("0x313a516d65696832414e5457697a365867625741574766393635524a4b364255776f31474854724c587833314a557661")}`);
