const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_nft1155Pool() {
  console.log("Deploying NFT1155Pool contract...");

  const NFT1155Pool = await ethers.getContractFactory("NFT1155Pool");
  const nft1155PoolInstance = await upgrades.deployProxy(
    NFT1155Pool,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
    ],
    {
      kind: "uups",
      initializer: "initializeNFT1155Pool",
    }
  );

  await nft1155PoolInstance.deployed();
  console.log("NFT1155Pool Contract deployed to:", nft1155PoolInstance.address);
  console.log("---------------------------------------------------------");

  return nft1155PoolInstance.address;
}
module.exports = deploy_nft1155Pool;
