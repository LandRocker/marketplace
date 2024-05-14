const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrtStaking(arInstance, lrtInstance) {
  console.log("Deploying LRTStaking contract...");

  const LRTStaking = await ethers.getContractFactory("LRTStaking");
  const lrtStakingInstance = await upgrades.deployProxy(
    LRTStaking,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17",
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A",
    ],
    {
      kind: "uups",
      initializer: "initializeLRTStake",
    }
  );

  await lrtStakingInstance.deployed();

  console.log("LRTStaking Contract deployed to:", lrtStakingInstance.address);

  console.log("---------------------------------------------------------");

  return lrtStakingInstance;
}
module.exports = deploy_lrtStaking;
