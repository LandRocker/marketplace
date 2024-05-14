const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_team_vesting(lrtDistributorInstance,arInstance) {

  //deploy LRTVesting
  const LRTVestingTeam = await ethers.getContractFactory("LRTVestingTeam");
  const lrtVestingTeamInstance = await LRTVestingTeam.deploy(
    lrtDistributorInstance.address,
    arInstance.address,
    0,
    0
  );

  await lrtVestingTeamInstance.deployed();

  return lrtVestingTeamInstance;
}
module.exports = deploy_lrt_team_vesting;

