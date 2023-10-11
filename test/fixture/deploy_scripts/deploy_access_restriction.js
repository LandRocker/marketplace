const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_access_restriction(deployer) {

  // Deploy AccessRestriction
  const accessRestriction = await ethers.getContractFactory("AccessRestriction");
  const arInstance = await accessRestriction.deploy(deployer.address);
  await arInstance.deployed();

  return arInstance;
}

module.exports = deploy_access_restriction;
