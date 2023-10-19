# Overview

Myria smart contract for B2B clients and internal gaming platform.

## Setup

### 1. Clone the repository

```
git clone https://github.com/MyriaPlatform/myria-smart-contract.git
```

### 2. Install dependencies
```
yarn
```

### 3. Provide environmental variables

Rename `.env.example` file into `.env` and provide the required configuration values:

```
API_URL=            <Infura/Alchemy RPC url>
PUBLIC_KEY=         <Public key of the owner's Ethereum wallet>
PRIVATE_KEY=        <Private key of the owner's Ethereum wallet>
STARKEX_ADDRESS=    <StarkEx Myria contract>
```

`STARKEX_ADDRESS` should have one of the following values:
- Goerli Testnet (staging): `0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9` (Be deprecated soon)
- Sepolia Testnet (staging): `0xe99aFF31AD367Dcc45c60b237a2Ef096507d6095` (Recommended)
- Ethereum Mainnet (production): `0x3071BE11F9e92A9eb28F305e1Fa033cD102714e7`

## Running the app

```
yarn deploy-erc721
```