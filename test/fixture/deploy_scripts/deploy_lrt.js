const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt(arInstance) {
  //deploy LRT token
  const LRT = await ethers.getContractFactory("LRT");
  const lrtInstance = await LRT.deploy(arInstance.address);
  await lrtInstance.deployed();

  return lrtInstance;
}
module.exports = deploy_lrt;
