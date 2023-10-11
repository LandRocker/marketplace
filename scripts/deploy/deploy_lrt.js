const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt() {
  console.log("Deploying the LRT contract...");

  //deploy LRT token
  const LRT = await ethers.getContractFactory("LRT");
  const lrtInstance = await LRT.deploy("");
  await lrtInstance.deployed();

  console.log("LRT Token Contract deployed to:", lrtInstance.address);
  console.log(
    "---------------------------------------------------------",
  );

  return lrtInstance.address;
}
module.exports = deploy_lrt;
