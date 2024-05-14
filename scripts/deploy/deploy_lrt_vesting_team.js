const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_vesting_team() {
  console.log("Deploying the LRT Vesting team contract...");

  //deploy LRTVesting
  const LRTVestingTeam = await ethers.getContractFactory("LRTVestingTeam");
  const lrtVestingTeamInstance = await LRTVestingTeam.deploy(
    "0xF5f05Fdb5C163F3Ef46ab11149AefF124C5DB1a2", //lrtDistributor,
    "0xf81787851069F394dFC744496BBaE29388502f17", //accessRestrictionAddress
    0,
    0
  );

  await lrtVestingTeamInstance.deployed();

  console.log(
    "LRT Vesting team Contract deployed to:",
    lrtVestingTeamInstance.address
  );
  console.log("---------------------------------------------------------");
  // await hre.run("laika-sync", {
  //   contract: "LRTVesting",
  //   address: lrtVestingInstance.address,
  // });
  return lrtVestingTeamInstance.address;
}
module.exports = deploy_lrt_vesting_team;
