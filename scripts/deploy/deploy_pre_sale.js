const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_pre_sale() {
  console.log("Deploying LRT Pre sale contracts...");

  //deploy private sale contract
  const LRTPreSale = await ethers.getContractFactory("LRTPreSale");
  const lrtPreSaleInstance = await LRTPreSale.deploy(
    "",
    ""
  );
  await lrtPreSaleInstance.deployed();

  console.log(
    "LRT preSale Contract deployed to:",
    lrtPreSaleInstance.address
  );

  console.log(
    "---------------------------------------------------------",
  );

  return lrtPreSaleInstance.address;
}
module.exports = deploy_lrt_pre_sale;
