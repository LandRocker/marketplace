const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_vesting() {
  console.log("Deploying the LRT Vesting contract...");
  // Access Restriction: 0xB21bb1Ab0012236E3CF889FCcE00a4F3d9aF55c4
  // LRT Token : 0xcA498643614310935da320b0C1104305084DB4C7
  //deploy LRTVesting
  const LRTVesting = await ethers.getContractFactory("LRTVesting");
  const lrtVestingInstance = await LRTVesting.deploy(
    "0xF5f05Fdb5C163F3Ef46ab11149AefF124C5DB1a2", //lrtDistributor
    "0xf81787851069F394dFC744496BBaE29388502f17" //accessRestrictionAddress
  );

  await lrtVestingInstance.deployed();

  console.log("LRT Vesting Contract deployed to:", lrtVestingInstance.address);
  console.log("---------------------------------------------------------");
  // await hre.run("laika-sync", {
  //   contract: "LRTVesting",
  //   address: lrtVestingInstance.address,
  // });
  return lrtVestingInstance.address;
}
module.exports = deploy_lrt_vesting;
