const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_nft721Pool() {
  console.log("Deploying NFT721Pool contract...");

  const NFT721Pool = await ethers.getContractFactory("NFT721Pool");
  const nft721PoolInstance = await upgrades.deployProxy(
    NFT721Pool,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
    ],
    {
      kind: "uups",
      initializer: "initializeNFT721Pool",
    }
  );

  await nft721PoolInstance.deployed();
  console.log("NFT721Pool Contract deployed to:", nft721PoolInstance.address);
  console.log("---------------------------------------------------------");

  return nft721PoolInstance.address;
}
module.exports = deploy_nft721Pool;
