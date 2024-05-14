// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const {
//   loadFixture,
//   time,
// } = require("@nomicfoundation/hardhat-network-helpers");
// const {
//   AccessErrorMsg,
//   LRMessage,
//   GameErrorMsg,
//   PlanetStakeErrorMsg,
// } = require("./messages");
// const { gameFixture } = require("./fixture/game.fixture");
// const Helper = require("./helper");

// function getRandomInt(max) {
//   return Math.floor(Math.random() * max);
// }

// function getRandomWords() {
//   const words = [
//     "supercalifragilisticexpialidocious",
//     "pneumonoultramicroscopicsilicovolcanoconiosis",
//     "hippopotomonstrosesquippedaliophobia",
//     "sesquipedalian",
//     "honorificabilitudinitatibus",
//     "floccinaucinihilipilification",
//     "antidisestablishmentarianism",
//     "pseudopseudohypoparathyroidism",
//     "methionylthreonylthreonylglutaminylarginyl",
//     "isopropylthioxanthenones",
//     "acetylseryltyrosylserylisoleucylthreonyl",
//     "trimethylaminuria",
//   ];

//   const randomWords = [];

//   for (let i = 0; i < 12; i++) {
//     const randomIndex = Math.floor(Math.random() * words.length);
//     randomWords.push(words[randomIndex]);
//   }

//   return randomWords;
// }

// function hashWords(words) {
//   let hashString = "";

//   for (let i = 0; i < words.length; i++) {
//     hashString += words[i];
//   }

//   const hashed = ethers.utils.solidityKeccak256(["string"], [hashString]);

//   return hashed;
// }

// describe(" P2W Game contract", function () {
//   let lrtInstance,
//     gameInstance,
//     arInstance,
//     owner,
//     admin,
//     distributor,
//     wert,
//     approvedContract,
//     script,
//     addr1,
//     addr2,
//     treasury;
//   const zeroAddress = "0x0000000000000000000000000000000000000000";

//   beforeEach(async function () {
//     ({
//       lrtInstance,
//       gameInstance,
//       arInstance,
//       owner,
//       admin,
//       distributor,
//       wert,
//       approvedContract,
//       script,
//       addr1,
//       addr2,
//       treasury,
//     } = await loadFixture(gameFixture));
//   });

//   describe("add planet to game", function () {
//     it("should allow adding planet", async function () {
//       const tokenId = 0;
//       const totalBlocks = 500;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;
//       const tx = await gameInstance
//         .connect(script)
//         .addPlanet(
//           tokenId,
//           totalBlocks,
//           userBlockLimit,
//           planetCapacity,
//           rewardCountLimit,
//           rewardAmount,
//           rewardType,
//           staker
//         );
//       await expect(tx)
//         .to.emit(gameInstance, "PlanetAddedToGame")
//         .withArgs(
//           0,
//           tokenId,
//           totalBlocks,
//           userBlockLimit,
//           planetCapacity,
//           rewardCountLimit,
//           rewardAmount,
//           rewardType,
//           staker
//         );
//       const planet = await gameInstance.connect(admin).planets(0);
//       expect(planet.totalBlocks).to.equal(500);
//       expect(planet.userBlockLimit).to.equal(20);
//       expect(planet.planetCapacity).to.equal(5);
//       expect(planet.rewardAmount).to.equal(100);
//       expect(planet.rewardType).to.equal(lrtInstance.address);
//       expect(planet.staker).to.equal(addr1.address);
//     });
//     it("should not allow adding planet if caller is not script", async function () {
//       const tokenId = 0;
//       const totalBlocks = 500;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       await expect(
//         gameInstance
//           .connect(addr2)
//           .addPlanet(
//             tokenId,
//             totalBlocks,
//             userBlockLimit,
//             planetCapacity,
//             rewardCountLimit,
//             rewardAmount,
//             rewardType,
//             staker
//           )
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
//     });
//     it("should not allow adding planet if the staker claimed all the planets before", async function () {
//       const tokenId = 0;
//       const totalBlocks = 500;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr2.address;

//       await expect(
//         gameInstance
//           .connect(script)
//           .addPlanet(
//             tokenId,
//             totalBlocks,
//             userBlockLimit,
//             planetCapacity,
//             rewardCountLimit,
//             rewardAmount,
//             rewardType,
//             staker
//           )
//       ).to.be.revertedWith(GameErrorMsg.NOT_STAKED);
//     });

//     it("should not allow adding planet if total blocks is less than user blocks limit", async function () {
//       const tokenId = 0;
//       const totalBlocks = 5;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       await expect(
//         gameInstance
//           .connect(script)
//           .addPlanet(
//             tokenId,
//             totalBlocks,
//             userBlockLimit,
//             planetCapacity,
//             rewardCountLimit,
//             rewardAmount,
//             rewardType,
//             staker
//           )
//       ).to.be.revertedWith(GameErrorMsg.USER_BLOCK_LIMIT_INVALID);
//     });

//     it("should not allow adding planet if rewardType is zero address", async function () {
//       const tokenId = 0;
//       const totalBlocks = 5;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = zeroAddress;
//       const staker = addr1.address;

//       await expect(
//         gameInstance
//           .connect(script)
//           .addPlanet(
//             tokenId,
//             totalBlocks,
//             userBlockLimit,
//             planetCapacity,
//             rewardCountLimit,
//             rewardAmount,
//             rewardType,
//             staker
//           )
//       ).to.be.revertedWith(GameErrorMsg.GAME_INVALID_ADDRESS);
//     });

//     it("should not allow adding planet if staker is zero address", async function () {
//       const tokenId = 0;
//       const totalBlocks = 5;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = zeroAddress;

//       await expect(
//         gameInstance
//           .connect(script)
//           .addPlanet(
//             tokenId,
//             totalBlocks,
//             userBlockLimit,
//             planetCapacity,
//             rewardCountLimit,
//             rewardAmount,
//             rewardType,
//             staker
//           )
//       ).to.be.revertedWith(GameErrorMsg.GAME_INVALID_ADDRESS);
//     });

//     it("should not allow adding planet if planet data is invalid", async function () {
//       const tokenId = 0;
//       const totalBlocks = 0;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       await expect(
//         gameInstance
//           .connect(script)
//           .addPlanet(
//             tokenId,
//             totalBlocks,
//             userBlockLimit,
//             planetCapacity,
//             rewardCountLimit,
//             rewardAmount,
//             rewardType,
//             staker
//           )
//       ).to.be.revertedWith(GameErrorMsg.INVALID_GAME_DATA);
//     });

//     it("should not allow adding planet if planet data is invalid", async function () {
//       const tokenId = 0;
//       const totalBlocks = 300;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 0;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       await expect(
//         gameInstance
//           .connect(script)
//           .addPlanet(
//             tokenId,
//             totalBlocks,
//             userBlockLimit,
//             planetCapacity,
//             rewardCountLimit,
//             rewardAmount,
//             rewardType,
//             staker
//           )
//       ).to.be.revertedWith(GameErrorMsg.INVALID_GAME_DATA);
//     });
//   });
//   describe("set mining permission", function () {
//     it("should allow setting mining permission", async function () {
//       const miner = addr1.address;
//       const planetId = 0;
//       const mission = 0;
//       const miningPermission = true;

//       const tokenId = 0;
//       const totalBlocks = 500;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       //add planet
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           tokenId,
//           totalBlocks,
//           userBlockLimit,
//           planetCapacity,
//           rewardCountLimit,
//           rewardAmount,
//           rewardType,
//           staker
//         );

//       const tx = await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, planetId, mission, miningPermission);

//       const planet = await gameInstance.connect(admin).planets(0);

//       await expect(tx)
//         .to.emit(gameInstance, "MiningPermissionUpdated")
//         .withArgs(
//           miner,
//           planetId,
//           mission,
//           planet.totalBlocks,
//           miningPermission
//         );

//       const currentMiner = await gameInstance
//         .connect(admin)
//         .miners(addr1.address, 0, 0);

//       expect(currentMiner.miningPermission).to.equal(true);
//       expect(currentMiner.unMinedBlocks).to.equal(planet.totalBlocks);
//     });

//     it("should not allow setting mining permission if caller is not script", async function () {
//       const miner = addr1.address;
//       const planetId = 0;
//       const mission = 0;
//       const miningPermission = true;

//       const tokenId = 0;
//       const totalBlocks = 500;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       //add planet
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           tokenId,
//           totalBlocks,
//           userBlockLimit,
//           planetCapacity,
//           rewardCountLimit,
//           rewardAmount,
//           rewardType,
//           staker
//         );

//       await expect(
//         gameInstance
//           .connect(addr2)
//           .setMiningPermission(miner, planetId, mission, miningPermission)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
//     });

//     it("should not allow setting mining permission if miner is not a valid address", async function () {
//       const planetId = 0;
//       const mission = 0;
//       const miningPermission = true;

//       const tokenId = 0;
//       const totalBlocks = 500;
//       const userBlockLimit = 20;
//       const planetCapacity = 5;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       //add planet
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           tokenId,
//           totalBlocks,
//           userBlockLimit,
//           planetCapacity,
//           rewardCountLimit,
//           rewardAmount,
//           rewardType,
//           staker
//         );

//       await expect(
//         gameInstance
//           .connect(addr2)
//           .setMiningPermission(zeroAddress, planetId, mission, miningPermission)
//       ).to.be.revertedWith(GameErrorMsg.GAME_INVALID_ADDRESS);
//     });

//     it("should not allow setting mining permission if planet is not exist", async function () {
//       const miner = addr1.address;
//       const planetId = 3;
//       const mission = 0;
//       const miningPermission = true;

//       await expect(
//         gameInstance
//           .connect(script)
//           .setMiningPermission(miner, planetId, mission, miningPermission)
//       ).to.be.revertedWith(GameErrorMsg.PLANET_NOT_EXIST);
//     });

//     // it("should not allow setting mining permission if planet is not exist", async function () {
//     //   const miner = addr1.address;
//     //   const mission = 0;
//     //   const miningPermission = true;

//     //   const tokenId = 0;
//     //   const totalBlocks = 500;
//     //   const userBlockLimit = 20;
//     //   const planetCapacity = 5;
//     //   const rewardCountLimit = 0;
//     //   const rewardAmount = 100;
//     //   const rewardType = lrtInstance.address;
//     //   const staker = addr1.address;

//     //   //add planet
//     //   await gameInstance
//     //     .connect(script)
//     //     .addPlanet(
//     //       tokenId,
//     //       totalBlocks,
//     //       userBlockLimit,
//     //       planetCapacity,
//     //       rewardCountLimit,
//     //       rewardAmount,
//     //       rewardType,
//     //       staker
//     //     );

//     //   const planetId = 0;

//     //   await expect(
//     //     gameInstance
//     //       .connect(script)
//     //       .setMiningPermission(miner, planetId, mission, miningPermission)
//     //   ).to.be.revertedWith(GameErrorMsg.PLANET_NOT_EXIST);
//     // });

//     it("should not allow setting mining permission if the limitation of the user planet capacity reached", async function () {
//       const miner = addr1.address;
//       const mission = 0;
//       const miningPermission = true;

//       const tokenId = 0;
//       const totalBlocks = 500;
//       const userBlockLimit = 20;
//       const planetCapacity = 1;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       //add planet
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           tokenId,
//           totalBlocks,
//           userBlockLimit,
//           planetCapacity,
//           rewardCountLimit,
//           rewardAmount,
//           rewardType,
//           staker
//         );

//       //mine
//       const words = getRandomWords();
//       const minedBlock = 10;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const usedFuel = 1000;

//       gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, miningPermission);

//       const hashes = hashWords(words);
//       await gameInstance
//         .connect(script)
//         .mine(0, minedBlock, usedFuel, timeSpent, mission, miner, hashes);

//       await expect(
//         gameInstance
//           .connect(script)
//           .setMiningPermission(miner, 0, mission, miningPermission)
//       ).to.be.revertedWith(GameErrorMsg.PLANET_BURNT);
//     });

//     it("should not allow setting mining permission if the limitation of the planet's user mining block reached", async function () {
//       const miner = addr1.address;
//       const mission = 0;
//       const miningPermission = true;

//       const tokenId = 0;
//       const totalBlocks = 500;
//       const userBlockLimit = 1;
//       const planetCapacity = 10;
//       const rewardCountLimit = 20;
//       const rewardAmount = 100;
//       const rewardType = lrtInstance.address;
//       const staker = addr1.address;

//       //add planet
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           tokenId,
//           totalBlocks,
//           userBlockLimit,
//           planetCapacity,
//           rewardCountLimit,
//           rewardAmount,
//           rewardType,
//           staker
//         );

//       //mine
//       const words = getRandomWords();
//       const minedBlock = 1;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const usedFuel = 1000;

//       gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, miningPermission);

//       const hashes = hashWords(words);
//       await gameInstance
//         .connect(script)
//         .mine(0, minedBlock, usedFuel, timeSpent, mission, miner, hashes);

//       await expect(
//         gameInstance
//           .connect(script)
//           .setMiningPermission(miner, 0, mission, true)
//       ).to.be.revertedWith(GameErrorMsg.MAXIMUM_LIMIT);
//     });
//   });

//   describe("rover mining", function () {
//     it("should handle mine function-winner", async function () {
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           0,
//           10,
//           10,
//           400,
//           20,
//           ethers.utils.parseUnits("5"),
//           lrtInstance.address,
//           addr1.address
//         );
//       const words = getRandomWords();
//       const minedBlock = 10;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;
//       const hashes = hashWords(words);
//       const miner = ethers.Wallet.createRandom().address;
//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, true);
//       //won
//       const tx = await gameInstance
//         .connect(script)
//         .mine(0, minedBlock, usedFuel, timeSpent, mission, miner, hashes);
//       // await expect(tx)
//       //   .to.emit(gameInstance, "MinerWon")
//       //   .withArgs(
//       //     miner,
//       //     0,
//       //     planet.rewardAmount,
//       //     mission,
//       //     winIndex,
//       //     planet.rewardAmount
//       //   );
//       const planet = await gameInstance.connect(admin).planets(0);
//       const currentMiner = await gameInstance
//         .connect(admin)
//         .miners(miner, 0, 0);
//       expect(currentMiner.isWinner).to.equal(true);
//       expect(currentMiner.miningPermission).to.equal(false);
//       expect(currentMiner.unMinedBlocks).to.equal(
//         planet.totalBlocks.sub(minedBlock)
//       );
//       expect(currentMiner.minedBlocks).to.equal(minedBlock);
//       expect(planet.userMiningCount).to.equal(1);
//       //finish
//       await expect(tx)
//         .to.emit(gameInstance, "MiningFinished")
//         .withArgs(
//           miner,
//           0,
//           planet.tokenId,
//           mission,
//           minedBlock,
//           usedFuel,
//           timeSpent,
//           hashes
//         );
//     });
//     it("should handle mine function-loser", async function () {
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           0,
//           10000000000,
//           10000000,
//           400,
//           20,
//           ethers.utils.parseUnits("5"),
//           lrtInstance.address,
//           addr1.address
//         );

//       const words = getRandomWords();
//       const minedBlock = 1;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;

//       const hashes = hashWords(words);
//       const miner = ethers.Wallet.createRandom().address;

//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, true);

//       //lose
//       const tx = await gameInstance
//         .connect(script)
//         .mine(0, minedBlock, usedFuel, timeSpent, mission, miner, hashes);

//       const currentMiner = await gameInstance
//         .connect(admin)
//         .miners(miner, 0, 0);

//       const planet = await gameInstance.connect(admin).planets(0);

//       await expect(tx)
//         .to.emit(gameInstance, "MinerLose")
//         .withArgs(miner, 0, planet.tokenId, mission);

//       expect(currentMiner.unMinedBlocks).to.equal(
//         planet.totalBlocks.sub(minedBlock)
//       );
//       expect(currentMiner.minedBlocks).to.equal(minedBlock);
//       expect(planet.userMiningCount).to.equal(1);

//       //finish
//       await expect(tx)
//         .to.emit(gameInstance, "MiningFinished")
//         .withArgs(
//           miner,
//           0,
//           planet.tokenId,
//           mission,
//           minedBlock,
//           usedFuel,
//           timeSpent,
//           hashes
//         );
//     });
//     it("mine function when the limitation of the planet's user mining count reached", async function () {
//       await gameInstance.connect(script).addPlanet(
//         0,
//         30000,
//         5000,
//         1, //planetCapacity
//         20,
//         ethers.utils.parseUnits("5"),
//         lrtInstance.address,
//         addr1.address
//       );

//       const words = getRandomWords();
//       const minedBlock = 500;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;

//       const hashes = hashWords(words);
//       const miner1 = ethers.Wallet.createRandom().address;
//       const miner2 = ethers.Wallet.createRandom().address;

//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner1, 0, mission, true);

//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner2, 0, mission, true);

//       const tx = await gameInstance.connect(script).mine(
//         0, // planetId
//         minedBlock,
//         usedFuel,
//         timeSpent,
//         mission,
//         miner1,
//         hashes
//       );

//       await expect(
//         gameInstance.connect(script).mine(
//           0, // planetId
//           minedBlock,
//           usedFuel,
//           timeSpent,
//           mission,
//           miner2,
//           hashes
//         )
//       ).to.be.revertedWith(GameErrorMsg.PLANET_BURNT);
//     });

//     it("mine function when the limitation of the planet's user block reached", async function () {
//       await gameInstance.connect(script).addPlanet(
//         0,
//         30000,
//         5000,
//         400, //planetCapacity
//         20,
//         ethers.utils.parseUnits("5"),
//         lrtInstance.address,
//         addr1.address
//       );

//       const words = getRandomWords();
//       const minedBlock = 5000;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;

//       const hashes = hashWords(words);
//       const miner = ethers.Wallet.createRandom().address;

//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, true);

//       const tx = await gameInstance.connect(script).mine(
//         0, // planetId
//         minedBlock,
//         usedFuel,
//         timeSpent,
//         mission,
//         miner,
//         hashes
//       );

//       const currentMiner = await gameInstance
//         .connect(admin)
//         .callStatic.miners(miner, 0, 0);

//       await expect(tx)
//         .to.emit(gameInstance, "MinerMiningLimitReached")
//         .withArgs(miner, 0, mission, false);

//       expect(currentMiner.miningPermission).to.equal(false);
//     });

//     it("mine function when the limitation of the user planet capacity reached", async function () {
//       await gameInstance.connect(script).addPlanet(
//         0,
//         30000,
//         5000,
//         1, //planetCapacity
//         20,
//         ethers.utils.parseUnits("5"),
//         lrtInstance.address,
//         addr1.address
//       );

//       const words = getRandomWords();
//       const minedBlock = 5000;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;

//       const hashes = hashWords(words);
//       const miner = ethers.Wallet.createRandom().address;

//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, true);

//       const tx = await gameInstance.connect(script).mine(
//         0, // planetId
//         minedBlock,
//         usedFuel,
//         timeSpent,
//         mission,
//         miner,
//         hashes
//       );

//       const currentMiner = await gameInstance
//         .connect(admin)
//         .callStatic.miners(miner, 0, 0);

//       await expect(tx)
//         .to.emit(gameInstance, "PlanetCapacityReached")
//         .withArgs(miner, 0, mission, false);

//       expect(currentMiner.miningPermission).to.equal(false);
//     });

//     it("should not allow mining if miner has not permission", async function () {
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           0,
//           10,
//           10,
//           400,
//           20,
//           ethers.utils.parseUnits("5"),
//           lrtInstance.address,
//           addr1.address
//         );
//       const words = getRandomWords();
//       const minedBlocks = 10;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;
//       const hashes = hashWords(words);
//       const miner = ethers.Wallet.createRandom().address;
//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, false);

//       await expect(
//         gameInstance
//           .connect(script)
//           .mine(0, minedBlocks, usedFuel, timeSpent, mission, miner, hashes)
//       ).to.be.revertedWith(GameErrorMsg.MINING_NOT_ALLOWED);
//     });

//     it("should not allow mining if planet dose not exist", async function () {
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           0,
//           10,
//           10,
//           400,
//           20,
//           ethers.utils.parseUnits("5"),
//           lrtInstance.address,
//           addr1.address
//         );
//       const words = getRandomWords();
//       const minedBlock = 10;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;
//       const hashes = hashWords(words);
//       const miner = ethers.Wallet.createRandom().address;
//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, true);

//       await expect(
//         gameInstance
//           .connect(script)
//           .mine(200, minedBlock, usedFuel, timeSpent, mission, miner, hashes)
//       ).to.be.revertedWith(GameErrorMsg.PLANET_NOT_EXIST);
//     });

//     it("should not allow mining if contract has not sufficient balance", async function () {
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           0,
//           10,
//           10,
//           400,
//           20,
//           ethers.utils.parseUnits("3000"),
//           lrtInstance.address,
//           addr1.address
//         );
//       const words = getRandomWords();
//       const minedBlock = 10;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;
//       const hashes = hashWords(words);
//       const miner = ethers.Wallet.createRandom().address;
//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, true);

//       await expect(
//         gameInstance
//           .connect(script)
//           .mine(0, minedBlock, usedFuel, timeSpent, mission, miner, hashes)
//       ).to.be.revertedWith(GameErrorMsg.INSUFFICIENT_CONTRACT_BALANCE);
//     });

//     // it("should not allow mining if planet dose not staked before", async function () {
//     //   await gameInstance
//     //     .connect(script)
//     //     .addPlanet(
//     //       0,
//     //       1000,
//     //       100,
//     //       10,
//     //       20,
//     //       ethers.utils.parseUnits("5"),
//     //       lrtInstance.address,
//     //       addr1.address
//     //     );
//     //   const words = getRandomWords();
//     //   const minedBlock = 1;
//     //   const timeSpent = await Helper.convertToSeconds("minutes", 20);
//     //   const mission = 0;
//     //   const usedFuel = 1000;
//     //   const hashes = hashWords(words);
//     //   const miner = ethers.Wallet.createRandom().address;
//     //   await gameInstance
//     //     .connect(script)
//     //     .setMiningPermission(miner, 0, mission, true);

//     //     for(let i=0;i<10;i++) {
//     //       await gameInstance.connect(script).mine(
//     //         0,
//     //         minedBlock,
//     //         usedFuel,
//     //         timeSpent,
//     //         mission,
//     //         miner,
//     //         hashes
//     //       );
//     //     }

//     //   await expect(
//     //     gameInstance
//     //       .connect(script)
//     //       .mine(0, minedBlock, usedFuel, timeSpent, mission, miner, hashes)
//     //   ).to.be.revertedWith(GameErrorMsg.NOT_STAKED);
//     // });

//     it("should not allow mining if miner mined exceeded blocks", async function () {
//       await gameInstance
//         .connect(script)
//         .addPlanet(
//           0,
//           10,
//           10,
//           400,
//           20,
//           ethers.utils.parseUnits("5"),
//           lrtInstance.address,
//           addr1.address
//         );
//       const minedBlocks = 11;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);
//       const mission = 0;
//       const usedFuel = 1000;
//       const miner = ethers.Wallet.createRandom().address;
//       await gameInstance
//         .connect(script)
//         .setMiningPermission(miner, 0, mission, true);

//       const words = getRandomWords();
//       const hashes = hashWords(words);
//       const nullifier = hashes;

//       await expect(
//         gameInstance
//           .connect(script)
//           .mine(0, minedBlocks, usedFuel, timeSpent, mission, miner, nullifier)
//       ).to.be.revertedWith(GameErrorMsg.MAXIMUM_LIMIT);
//     });

//     it("should not allow mining if caller is not script", async function () {
//       const miner = addr1.address;
//       const planetId = 0;
//       const minedBlocks = 20;
//       const usedFuel = 100;
//       const mission = 0;
//       const timeSpent = await Helper.convertToSeconds("minutes", 20);

//       const words = getRandomWords();
//       const hashes = hashWords(words);
//       const nullifier = hashes;

//       await expect(
//         gameInstance
//           .connect(addr2)
//           .mine(
//             planetId,
//             minedBlocks,
//             usedFuel,
//             timeSpent,
//             mission,
//             miner,
//             nullifier
//           )
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
//     });

//     // it("should not allow mining if the miner is already winner in this mission", async function () {
//     //   await gameInstance
//     //     .connect(script)
//     //     .addPlanet(
//     //       0,
//     //       20,
//     //       20,
//     //       400,
//     //       20,
//     //       ethers.utils.parseUnits("5"),
//     //       lrtInstance.address,
//     //       addr1.address
//     //     );

//     //   const words = getRandomWords();
//     //   const minedBlock = 19;
//     //   const timeSpent = await Helper.convertToSeconds("minutes", 20);
//     //   const mission = 0;
//     //   const usedFuel = 1000;

//     //   const hashes = hashWords(words);
//     //   const miner = ethers.Wallet.createRandom().address;

//     //   await gameInstance
//     //     .connect(script)
//     //     .setMiningPermission(miner, 0, mission, true);

//     //   //won
//     //   console.log("second round");
//     //   await gameInstance
//     //     .connect(script)
//     //     .mine(0, minedBlock, usedFuel, timeSpent, mission, miner, hashes);

//     //   const planet = await gameInstance.connect(admin).planets(0);
//     //   console.log(Number(planet.userBlockLimit), "planet.userBlockLimit");

//     //   await gameInstance
//     //     .connect(script)
//     //     .setMiningPermission(miner, 0, mission, true);

//     //   await expect(
//     //     gameInstance
//     //       .connect(script)
//     //       .mine(0, 1, usedFuel, timeSpent, mission, miner, hashes)
//     //   ).to.be.revertedWith(GameErrorMsg.ALREADY_WON);
//     // });
//   });
// });
