# Myria Smart Contract
Myria smart contract for B2B clients and internal gaming platform


## Getting started

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/myriaworld/myrianet/blockchain/myria-smart-contract.git
git branch -M main
git push -uf origin main
```

## Setting up

Set up the project.
```
cd existing_repo
yarn 
```


## Test and Deploy Smart contract

1. Create your new `env` file following the `.env.example` and make sure to fullfiled following configurable variable.

+ API_URL: infura/alchemy URL with your project depend on your setup.
+ PRIVATE_KEY: Private key of your metamask wallet.
+ PUBLIC_KEY: Public key of your metamask wallet - metamask wallet address.
+ STARKEX_ADDRESS: keep exactly the same with value in example.

2. Open the scripts `scripts/deploy_erc721.js` file and make sure to input your wallet address as PUBLIC_KEY_WALLET.

3. Run the scripts deploy.

+ Deploy ERC-721 smart contract
```
yarn deploy-erc721
```

+ Deploy ERC-20 smart contract
```
yarn deploy-erc20
```


***

