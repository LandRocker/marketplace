const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_access_restriction() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying the Access Restriction contract...");

  // Deploy AccessRestriction
  const accessRestiction = await ethers.getContractFactory("AccessRestriction");
  const arInstance = await accessRestiction.deploy(deployer.address);
  await arInstance.deployed();

  console.log("Access Restriction Contract deployed to:", arInstance.address);
  console.log("---------------------------------------------------------");
  return arInstance.address;
}

module.exports = deploy_access_restriction;
