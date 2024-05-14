const { ethers } = require("hardhat");

async function deploy_game() {
  //deploy LandRocker
  const Game = await ethers.getContractFactory("Game");
  const gameInstance = await upgrades.deployProxy(
    Game,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", // accessRestriction
      "0x916D6d8EA24500Bd037C2946983b92341b23AdbA", //planetStake
    ],
    {
      kind: "uups",
      initializer: "initializeGame",
    }
  );

  await gameInstance.deployed();

  console.log("game Contract deployed to:", gameInstance.address);

  console.log("---------------------------------------------------------");

  return gameInstance;
}

module.exports = deploy_game;
