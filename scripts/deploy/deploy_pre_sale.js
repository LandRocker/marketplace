const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_pre_sale() {
  console.log("Deploying LRT Pre sale contracts...");

  //deploy private sale contract
  const LRTPreSale = await ethers.getContractFactory("LRTPreSale");
  const lrtPreSaleInstance = await LRTPreSale.deploy(
    "0x51Cf5aEbB04d04e2ee6F92B513FCB0c2f1Dff0cd", //lrtVestingAddress
    "0xf81787851069F394dFC744496BBaE29388502f17" //accessRestrictionAddress
  );
  await lrtPreSaleInstance.deployed();

  console.log("LRT preSale Contract deployed to:", lrtPreSaleInstance.address);

  console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return lrtPreSaleInstance.address;
}
module.exports = deploy_lrt_pre_sale;
