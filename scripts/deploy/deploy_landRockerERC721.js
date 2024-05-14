const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRockerERC721() {
  console.log("Deploying LandRockerERC721 contract...");

  const LandRockerERC721 = await ethers.getContractFactory("LandRockerERC721");
  const landRockerERC721Instance = await LandRockerERC721.deploy();//"0x87BB4b82842d008280521d79fC2889bc5D277853");
  await landRockerERC721Instance.deployed();

  console.log(
    "LandRockerERC721 Contract deployed to:",
    landRockerERC721Instance.address
  );

  console.log(
    "---------------------------------------------------------",
  );   

  return landRockerERC721Instance;
}
module.exports = deploy_landRockerERC721;
