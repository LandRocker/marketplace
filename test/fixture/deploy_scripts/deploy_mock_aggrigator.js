const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_aggregator() {
  //deploy private sale contract
  const PriceFeed = await ethers.getContractFactory(
    "MockAggregatorV3Interface"
  );
  const aggregatorInstance = await PriceFeed.deploy();
  await aggregatorInstance.deployed();

  return aggregatorInstance;
}
module.exports = deploy_aggregator;
