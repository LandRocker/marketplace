const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrtStaking(arInstance, lrtInstance) {

  //deploy AssetMarketplace
  const LRTStaking = await ethers.getContractFactory("LRTStaking");
  const lrtStakingInstance = await upgrades.deployProxy(LRTStaking,
    [arInstance.address, lrtInstance.address]
  ,
    {
      kind: "uups",
      initializer: "initializeLRTStake",
    }
  );

  await lrtStakingInstance.deployed();

  return lrtStakingInstance;
}
module.exports = deploy_lrtStaking;
 