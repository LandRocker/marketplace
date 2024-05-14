const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRockerERC1155Factory(arInstance) {
  //deploy LandRockerERC1155Factory
  const LandRockerERC1155Factory = await ethers.getContractFactory(
    "LandRockerERC1155Factory"
  );
  const landRockerERC1155FactoryInstance =
    await LandRockerERC1155Factory.deploy(arInstance.address);
  await landRockerERC1155FactoryInstance.deployed();
  return landRockerERC1155FactoryInstance;
}

module.exports = deploy_landRockerERC1155Factory;
