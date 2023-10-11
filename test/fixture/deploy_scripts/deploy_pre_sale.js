const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_pre_sale(lrtVestingInstance,arInstance) {

  //deploy private sale contract
  const LRTPreSale = await ethers.getContractFactory("LRTPreSale");
  const lrtPreSaleInstance = await LRTPreSale.deploy(
    lrtVestingInstance.address,
    arInstance.address
  );
  await lrtPreSaleInstance.deployed();

  return lrtPreSaleInstance;
}
module.exports = deploy_lrt_pre_sale;
