require("dotenv").config();
const { ethers } = require("hardhat");
const BN = require("bn.js");
const encUtils = require("enc-utils");
const sha3 = require("js-sha3");
const assert = require("assert");
const ethersjs = require("ethers");
const StarkExAPI = require("@starkware-industries/starkex-js/dist/node");

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
  const starkExAbi = [
    "event LogDeposit(address, uint, uint, uint, uint, uint)",
    "function registerToken(uint, bytes)",
  ];
  const provider = new ethersjs.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/6d769814495d4de68630c1b0216f5f69"
  );
  const contract = new ethersjs.Contract(STARKEX_ADDRESS, starkExAbi, provider);
  const nonce = await provider.getTransactionCount(PUBLIC_KEY);
  const wallet = new ethersjs.Wallet(PRIVATE_KEY, provider);

  // const contract = new web3.eth.Contract(starkExABI, STARKEX_ADDRESS);
  // const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest");

  const assetDict = {
    type: "MINTABLE_ERC721",
    data: {
      quantum: "1",
      tokenAddress: address,
    },
  };

  const assetType = getAssetType(assetDict);
  const assetInfo = getAssetInfo(assetDict);

  const transaction = {
    from: PUBLIC_KEY,
    to: STARKEX_ADDRESS,
    nonce: nonce,
    gasLimit: 500000,
    data: contract.interface.encodeFunctionData("registerToken", [
      assetType,
      assetInfo.toBuffer(),
    ]),
  };
  wallet
    .sendTransaction(transaction)
    .then((response) => {
      console.log("Success:", response);
    })
    .catch((err) => {
      console.log("Promise failed:", err);
    });
}

async function withdrawAndMint(address, assetDict) {
  const starkExAbi = ["function withdrawAndMint(uint, uint, bytes)"];
  const provider = new ethersjs.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/6d769814495d4de68630c1b0216f5f69"
  );
  const contract = new ethersjs.Contract(STARKEX_ADDRESS, starkExAbi, provider);
  const nonce = await provider.getTransactionCount(PUBLIC_KEY);
  const wallet = new ethersjs.Wallet(PRIVATE_KEY, provider);

  const assetType =
    "0x01156fe31e31ce74ef59fb9134eb6349bd3750ee8fa0c0ceb4192e071264e928";
  // getAssetType(assetDict);

  const transaction = {
    from: PUBLIC_KEY,
    to: STARKEX_ADDRESS,
    nonce: nonce,
    gasLimit: 500000,
    data: contract.interface.encodeFunctionData("withdrawAndMint", [
      address,
      assetType,
      ethers.utils.toUtf8Bytes(""),
    ]),
  };
  wallet
    .sendTransaction(transaction)
    .then((response) => {
      console.log("Success:", response);
    })
    .catch((err) => {
      console.log("Promise failed:", err);
    });

  // const contract = new web3.eth.Contract(starkExABI, STARKEX_ADDRESS);
  // const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest");

  // const assetType = getAssetType(assetDict);

  // const mintingBlobByte = ethers.utils.toUtf8Bytes(assetDict.data.blob);
  // const test = contract.methods
  //   .withdrawAndMint(address, assetType, mintingBlobByte)
  //   .encodeABI();
  // console.log(test);
  // const tx = {
  //   from: PUBLIC_KEY,
  //   to: STARKEX_ADDRESS,
  //   nonce: nonce,
  //   gas: 500000,
  //   data: contract.methods
  //     .withdrawAndMint(address, assetType, mintingBlobByte)
  //     .encodeABI(),
  // };
  // console.log(`assetType ${assetType}`);
  // const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
  // signPromise
  //   .then((signedTx) => {
  //     web3.eth.sendSignedTransaction(
  //       signedTx.rawTransaction,
  //       function (err, hash) {
  //         if (!err) {
  //           console.log(
  //             "The hash of your transaction is: ",
  //             hash,
  //             "\nCheck Alchemy's Mempool to view the status of your transaction!"
  //           );
  //         } else {
  //           console.log(
  //             "Something went wrong when submitting your transaction:",
  //             err
  //           );
  //         }
  //       }
  //     );
  //   })
  //   .catch((err) => {
  //     console.log("Promise failed:", err);
  //   });
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

async function isContract(address) {
  const result = await web3.eth.getCode(address);
  console.log(result);
}

async function getContractInfo(address) {
  const provider = new ethersjs.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/6d769814495d4de68630c1b0216f5f69"
  );

  const contract = new ethersjs.Contract(
    address,
    [
      "function myria() public view returns (address)",
      "function owner() public view returns (address)",
    ],
    provider
  );

  const myriaAddress = await contract.myria();
  const owner = await contract.owner();

  console.log(`Myria address: ${myriaAddress}`);
  console.log(`${typeof owner}`);
  console.log(`Owner address: ${owner}`);
}

async function mint(starkKey, vaultId, assetDict) {
  const assetId = getAssetId(assetDict);
  console.log(`mint starkKey = ${starkKey}`);
  console.log(`mint assetId = ${assetId}`);
  console.log(`mint vaultId = ${vaultId}`);

  const starkExAPI = new StarkExAPI({
    endpoint: "https://gw.playground-v2.starkex.co",
  });

  const txId = await starkExAPI.gateway.getFirstUnusedTxId();
  const request = {
    txId: txId,
    amount: 1,
    starkKey: starkKey,
    tokenId: assetId,
    vaultId: vaultId,
  };
  const response = await starkExAPI.gateway.mint(request);
  console.log(response);
}

async function getLastBatchId() {
  const starkExAPI = new StarkExAPI({
    endpoint: "https://gw.playground-v2.starkex.co",
  });
  const lastBatchId = await starkExAPI.feederGateway.getLastBatchId();
  console.log(`Last batch id: ${lastBatchId}`);
  return lastBatchId;
}

async function getBatchInfo(batchId) {
  const starkExAPI = new StarkExAPI({
    endpoint: "https://gw.playground-v2.starkex.co",
  });
  console.log(`Getting batch info for #: ${batchId}`);
  const batchInfo = await starkExAPI.feederGateway.getBatchInfo(batchId);
  console.log(`Batch info: ${JSON.stringify(batchInfo)}`);
}

async function getLastBatchInfo() {
  const lastBatchId = await getLastBatchId();
  getBatchInfo(lastBatchId);
}

async function withdraw(vaultId, starkKey, assetDict) {
  const starkExAPI = new StarkExAPI({
    endpoint: "https://gw.playground-v2.starkex.co",
  });
  const assetId = getAssetId(assetDict);
  console.log(`Withdraw starkKey = ${starkKey}`);
  console.log(`Withdraw assetId = ${assetId}`);
  console.log(`Withdraw vaultId = ${vaultId}`);
  const txId = await starkExAPI.gateway.getFirstUnusedTxId();
  const request = {
    txId: txId,
    amount: 1,
    starkKey: starkKey,
    tokenId: assetId,
    vaultId: vaultId,
  };
  const response = await starkExAPI.gateway.withdrawal(request);
  console.log(response);
}

const tokenAddress = "0x4EC5aF52445Dc403E175b7b380f8bCA840F51119";
const starkKey =
  "0x1de86d858998f37f37a71eb111267adeea3bbf6e370f450fb08456aeecb7b06";
const vaultId = 22109123;
const tokenId = 1;
const blueprint = "buffalo";
const mintingBlob = `{${tokenId}}:{${blueprint}}`;
const assetDict = {
  type: "MINTABLE_ERC721",
  data: {
    quantum: "1",
    tokenAddress: "0x0A4f7AE1f8227ce533628aF3E596bE5C50b68DE2",
    blob: mintingBlob,
  },
};

async function getWithdrawalBalance(starkKey, assetId) {
  const provider = new ethersjs.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/6d769814495d4de68630c1b0216f5f69"
  );

  const contract = new ethersjs.Contract(
    STARKEX_ADDRESS,
    ["function getWithdrawalBalance(uint, uint) public view returns (address)"],
    provider
  );

  const balance = await contract.getWithdrawalBalance(starkKey, assetId);

  const readableBalance = ethers.BigNumber.from(balance).toNumber();
  console.log(`readableBalance: ${readableBalance}`);
}

// getLastBatchInfo();
// getBatchInfo(1319);
// mint(starkKey, vaultId, assetDict);
// withdraw(vaultId, starkKey, assetDict);
// getContractInfo("0x539E04652385A048E920FD98503afAf880A00f6C");
// isContract("0x4EC5aF52445Dc403E175b7b380f8bCA840F51119");
// registerToken("0x4EC5aF52445Dc403E175b7b380f8bCA840F51119");
// withdrawAndMint(
//   "0x1de86d858998f37f37a71eb111267adeea3bbf6e370f450fb08456aeecb7b06",
//   assetDict
// );
getWithdrawalBalance(starkKey, "0x0400f44cf3086251c23183bb652712f1432bebca1f053508294212e55d2324f9");
// allowWithdrawal("0x4EC5aF52445Dc403E175b7b380f8bCA840F51119", 2);

/// Summary 22:49:
// mint starkKey = 0x1de86d858998f37f37a71eb111267adeea3bbf6e370f450fb08456aeecb7b06
// mint assetId = 0x04007642346ccfc392488f31665def6b4f653e4c973f74bda429a102205a8b71
// mint vaultId = 22109123
// Withdraw starkKey = 0x1de86d858998f37f37a71eb111267adeea3bbf6e370f450fb08456aeecb7b06
// Withdraw assetId = 0x04007642346ccfc392488f31665def6b4f653e4c973f74bda429a102205a8b71
// Withdraw vaultId = 22109123
// { txId: 17600, code: 'TRANSACTION_PENDING' }
// 0xb4bb1f5279fc1bf17cbd205abd95a1a88fe1cd164fa68b99f4037cb60e2f8e20
