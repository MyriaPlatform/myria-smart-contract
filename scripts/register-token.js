require("dotenv").config();
const { ethers } = require("hardhat");
const BN = require("bn.js");
const encUtils = require("enc-utils");
const sha3 = require("js-sha3");
const assert = require("assert");

// Generate BN of 1.
const oneBn = new BN("1", 16);
let globalAssetInfo = undefined;
// Used to mask the 251 least signifcant bits given by Keccack256 to produce the final asset ID.
const mask = new BN(
  "3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  16
);

// Used to mask the 240 least signifcant bits given by Keccack256 to produce the final asset ID
// (for mintable assets).
const mask240 = new BN(
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  16
);
const maskMintabilityBit = new BN(
  "400000000000000000000000000000000000000000000000000000000000000",
  16
);

function getAssetInfo(assetDict) {
  const assetSelector = getAssetSelector(assetDict.type);

  // Expected length is maintained to fix the length of the resulting asset info string in case of
  // leading zeroes (which might be omitted by the BN object).
  let expectedLen = encUtils.removeHexPrefix(assetSelector).length;

  // The asset info hex string is a packed message containing the hexadecimal representation of
  // the asset data.
  let assetInfo = new BN(encUtils.removeHexPrefix(assetSelector), 16);

  if (assetDict.data.tokenAddress !== undefined) {
    // In the case there is a valid tokenAddress in the data, we append that to the asset info
    // (before the quantum).
    const tokenAddress = new BN(
      encUtils.removeHexPrefix(assetDict.data.tokenAddress),
      16
    );
    assetInfo = assetInfo.ushln(256).add(tokenAddress);
    // console.log(`assetInfo before quantum = ${assetInfo}`);
    expectedLen += 64;
    return assetInfo;
  }
}

function getAssetType(assetDict) {
  const assetSelector = getAssetSelector(assetDict.type);

  // Expected length is maintained to fix the length of the resulting asset info string in case of
  // leading zeroes (which might be omitted by the BN object).
  let expectedLen = encUtils.removeHexPrefix(assetSelector).length;

  // The asset info hex string is a packed message containing the hexadecimal representation of
  // the asset data.
  let assetInfo = new BN(encUtils.removeHexPrefix(assetSelector), 16);

  if (assetDict.data.tokenAddress !== undefined) {
    // In the case there is a valid tokenAddress in the data, we append that to the asset info
    // (before the quantum).
    const tokenAddress = new BN(
      encUtils.removeHexPrefix(assetDict.data.tokenAddress),
      16
    );
    assetInfo = assetInfo.ushln(256).add(tokenAddress);
    // console.log(`assetInfo before quantum = ${assetInfo}`);
    globalAssetInfo = assetInfo;
    // console.log(`set assetInfo = ${globalAssetInfo}`);
    expectedLen += 64;
  }

  // Default quantum is 1 (for assets which don't specify quantum explicitly).
  const quantInfo = assetDict.data.quantum;
  const quantum = quantInfo === undefined ? oneBn : new BN(quantInfo, 10);

  assetInfo = assetInfo.ushln(256).add(quantum);
  expectedLen += 64;
  // console.log(`assetInfo = ${assetInfo}`);
  // console.log(`assetInfo to json= ${assetInfo.toJSON()}`);
  // console.log(`Test = ${addLeadingZeroes(assetInfo.toJSON(), expectedLen)}`);
  // console.log(
  //   `hexTobuffer=${encUtils.hexToBuffer(
  //     addLeadingZeroes(assetInfo.toJSON(), expectedLen)
  //   )}`
  // );

  let assetType = sha3.keccak_256(
    encUtils.hexToBuffer(addLeadingZeroes(assetInfo.toJSON(), expectedLen))
  );
  assetType = new BN(assetType, 16);
  assetType = assetType.and(mask);

  return "0x" + assetType.toJSON();
}

/*
 Computes the hash representing the encoded asset ID for a given asset.
 asset is a dictionary containing the type and data of the asset to parse. the asset type is
 represented by a string describing the associated asset while the data is a dictionary
 containing further information to distinguish between assets of a given type (such as the
 address of the smart contract of an ERC20 asset).
 The function returns the computed asset ID as a hex-string.

 For example:

    assetDict = {
        type: 'ERC20',
        data: { quantum: '10000', tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7' }
    }

 Will produce an the following asset ID:

    '0x352386d5b7c781d47ecd404765307d74edc4d43b0490b8e03c71ac7a7429653'.
*/
function getAssetId(assetDict) {
  const assetType = new BN(
    encUtils.removeHexPrefix(getAssetType(assetDict)),
    16
  );
  // For ETH and ERC20, the asset ID is simply the asset type.
  let assetId = assetType;
  if (assetDict.type === "ERC721") {
    // ERC721 assets require a slightly different construction for asset info.
    let assetInfo = new BN(encUtils.utf8ToBuffer("NFT:"), 16);
    // ExpectedLen is equal to the length (in hex characters) of the appended strings:
    //   'NFT:' (8 characters), 'assetType' (64 characters), 'tokenId' (64 characters).
    // Where assetType and tokenId are each padded with 0's to account for 64 hex characters
    // each.
    // We use this in order to pad the final assetInfo string with leading zeros in case the
    // calculation discarded them in the process.
    const expectedLen = 8 + 64 + 64;
    assetInfo = assetInfo.ushln(256).add(assetType);
    assetInfo = assetInfo
      .ushln(256)
      .add(new BN(parseInt(assetDict.data.tokenId), 16));
    assetId = sha3.keccak_256(
      encUtils.hexToBuffer(addLeadingZeroes(assetInfo.toJSON(), expectedLen))
    );
    assetId = new BN(assetId, 16);
    assetId = assetId.and(mask);
  } else if (
    assetDict.type === "MINTABLE_ERC721" ||
    assetDict.type === "MINTABLE_ERC20"
  ) {
    let assetInfo = new BN(encUtils.utf8ToBuffer("MINTABLE:"), 16);
    // ExpectedLen is equal to the length (in hex characters) of the appended strings:
    //   'MINTABLE:' (18 characters), 'assetType' (64 characters), 'blobHash' (64 characters).
    // Where assetType and blobHash are each padded with 0's to account for 64 hex characters
    // each.
    // We use this in order to pad the final assetInfo string with leading zeros in case the
    // calculation discarded them in the process.
    const expectedLen = 18 + 64 + 64;
    assetInfo = assetInfo.ushln(256).add(assetType);
    const blobHash = blobToBlobHash(assetDict.data.blob);
    assetInfo = assetInfo
      .ushln(256)
      .add(new BN(encUtils.removeHexPrefix(blobHash), 16));
    assetId = sha3.keccak_256(
      encUtils.hexToBuffer(addLeadingZeroes(assetInfo.toJSON(), expectedLen))
    );
    assetId = new BN(assetId, 16);
    assetId = assetId.and(mask240);
    assetId = assetId.or(maskMintabilityBit);
  }

  return "0x" + assetId.toJSON();
}

/*
 Computes the given asset's unique selector based on its type.
*/
function getAssetSelector(assetDictType) {
  let seed = "";
  switch (assetDictType.toUpperCase()) {
    case "ETH":
      seed = "ETH()";
      break;
    case "ERC20":
      seed = "ERC20Token(address)";
      break;
    case "ERC721":
      seed = "ERC721Token(address,uint256)";
      break;
    case "MINTABLE_ERC20":
      seed = "MintableERC20Token(address)";
      break;
    case "MINTABLE_ERC721":
      seed = "MintableERC721Token(address,uint256)";
      break;
    default:
      throw new Error(`Unknown token type: ${assetDictType}`);
  }
  return encUtils.sanitizeHex(sha3.keccak_256(seed).slice(0, 8));
}

/*
 Adds leading zeroes to the input hex-string to complement the expected length.
*/
function addLeadingZeroes(hexStr, expectedLen) {
  let res = hexStr;
  assert(res.length <= expectedLen);
  while (res.length < expectedLen) {
    res = "0" + res;
  }
  return res;
}

function blobToBlobHash(blob) {
  return "0x" + sha3.keccak_256(blob);
}

const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const STARKEX_ADDRESS = process.env.STARKEX_ADDRESS;

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const web3 = createAlchemyWeb3(API_URL);

const starkExABI = [
  {
    constant: false,
    inputs: [
      {
        name: "assetType",
        type: "uint256",
      },
      {
        name: "assetInfo",
        type: "bytes",
      },
    ],
    name: "registerToken",
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "ownerKey",
        type: "uint256",
      },
      {
        name: "assetId",
        type: "uint256",
      },
      {
        name: "quantizedAmount",
        type: "uint256",
      },
    ],
    name: "allowWithdrawal",
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "ownerKey",
        type: "uint256",
      },
      {
        name: "assetType",
        type: "uint256",
      },
      {
        name: "mintingBlob",
        type: "bytes",
      },
    ],
    name: "withdrawAndMint",
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function registerToken(address) {
  const contract = new web3.eth.Contract(starkExABI, STARKEX_ADDRESS);
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest");

  const assetDict = {
    type: "MINTABLE_ERC721",
    data: {
      quantum: "1",
      tokenAddress: "0x4EC5aF52445Dc403E175b7b380f8bCA840F51119",
    },
  };

  const assetType = getAssetType(assetDict);
  const assetInfo = getAssetInfo(assetDict).toBuffer();
  console.log(`assetType is ${typeof assetType}`);
  const tx = {
    from: PUBLIC_KEY,
    to: STARKEX_ADDRESS,
    nonce: nonce,
    gas: 500000,
    data: contract.methods.registerToken(assetType, assetInfo).encodeABI(),
  };
}

async function withdrawAndMint(address, tokenId) {
  const contract = new web3.eth.Contract(starkExABI, STARKEX_ADDRESS);
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest");

  const assetDict = {
    type: "MINTABLE_ERC721",
    data: {
      quantum: "1",
      tokenAddress: "0x4EC5aF52445Dc403E175b7b380f8bCA840F51119",
    },
  };

  const assetType = getAssetType(assetDict);
  // const assetInfo = getAssetInfo(assetDict).toBuffer();
  const testData = ethers.utils.toUtf8Bytes(
    `{${tokenId}}:{blue,green,bumblebee}`
  );

  const tx = {
    from: PUBLIC_KEY,
    to: STARKEX_ADDRESS,
    nonce: nonce,
    gas: 500000,
    data: contract.methods
      .withdrawAndMint(address, assetType, testData)
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

async function allowWithdrawal(address, tokenId) {
  const contract = new web3.eth.Contract(starkExABI, STARKEX_ADDRESS);
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest");
  const testData = ethers.utils.toUtf8Bytes(
    `{${tokenId}}:{blue,green,bumblebee}`
  );

  const assetDict = {
    type: "MINTABLE_ERC721",
    data: {
      quantum: "1",
      tokenAddress: "0x4EC5aF52445Dc403E175b7b380f8bCA840F51119",
      blob: testData,
    },
  };

  const assetId = getAssetId(assetDict);

  const tx = {
    from: PUBLIC_KEY,
    to: STARKEX_ADDRESS,
    nonce: nonce,
    gas: 500000,
    data: contract.methods.allowWithdrawal(address, assetId, 1).encodeABI(),
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

registerToken("0x4EC5aF52445Dc403E175b7b380f8bCA840F51119");
// withdrawAndMint("0x4EC5aF52445Dc403E175b7b380f8bCA840F51119", 2);
// allowWithdrawal("0x4EC5aF52445Dc403E175b7b380f8bCA840F51119", 2);
