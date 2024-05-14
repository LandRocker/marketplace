const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRockerERC1155Factory() {
  console.log("Deploying LandRockerERC1155Factory contract...");

  const LandRockerERC1155Factory = await ethers.getContractFactory(
    "LandRockerERC1155Factory"
  );
  const landRockerERC1155FactoryInstance =
    await LandRockerERC1155Factory.deploy(
      "0xf81787851069F394dFC744496BBaE29388502f17"
    ); //arInstance
  await landRockerERC1155FactoryInstance.deployed();

  console.log(
    "LandRockerERC1155Factory Contract deployed to:",
    landRockerERC1155FactoryInstance.address
  );

  console.log("---------------------------------------------------------");

  return landRockerERC1155FactoryInstance;
}
module.exports = deploy_landRockerERC1155Factory;
