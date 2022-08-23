def getErcMintable721AssetInfo(address):
   MINTABLE_ERC721_SELECTOR = '0xb8b86672'
   # 0xb8b86672 = bytes4(keccak256('MintableERC721Token(address,uint256)'))
   asset_info = MINTABLE_ERC721_SELECTOR + bytes.fromhex(address[2:]).rjust(32, b'\0')
   # For Mintable ERC721, asset_info is 36 bytes long.
   return asset_info

getErcMintable721AssetInfo("0x4EC5aF52445Dc403E175b7b380f8bCA840F51119")
