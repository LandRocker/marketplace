// const { expect, util } = require("chai");
// const {
//   time,
//   loadFixture,
// } = require("@nomicfoundation/hardhat-network-helpers");

// const {
//   MarketplaceErrorMsg,
//   PlanetStakeErrorMsg,
//   AccessErrorMsg,
//   LRTVestingErrorMsg,
// } = require("./messages");
// const { ethers } = require("hardhat");

// const Math = require("./helper/math");
// const { stakeFixture } = require("./fixture/planetStake.fixture");
// const Helper = require("./helper");

// const nativeCoinAddress = "0x0000000000000000000000000000000000000001";
// const zeroAddress = "0x0000000000000000000000000000000000000000";
// describe("PlanetStake", function () {
//   let planetStakeInstance,
//     landRockerERC1155Instance,
//     lrtDistributorInstance,
//     lrtInstance,
//     arInstance,
//     approvedContract,
//     admin,
//     distributor,
//     script,
//     addr1,
//     addr2;

//   before(async function () {
//     ({
//       planetStakeInstance,
//       landRockerERC1155Instance,
//       lrtDistributorInstance,
//       lrtInstance,
//       arInstance,
//       approvedContract,
//       admin,
//       distributor,
//       script,
//       addr1,
//       addr2,
//     } = await loadFixture(stakeFixture));
//   });

//   describe("test adding Planet to whitelist", function () {
//     it("should allow adding planet to whitelist", async function () {
//       // Assuming tokenType 0 is ERC721 and 1 is ERC1155
//       const tx = await planetStakeInstance
//         .connect(admin)
//         .addPlanet(0, ethers.utils.parseUnits("10"));
//       await expect(tx)
//         .to.emit(planetStakeInstance, "PlanetWhiteListAdded")
//         .withArgs(0, ethers.utils.parseUnits("10"));
//       const planet = await planetStakeInstance.planets(0);
//       // Add token ID 2 to ERC1155 whitelist
//       expect(planet.rewardAmount).to.equal(ethers.utils.parseUnits("10"));
//     });

//     it("should not allow adding planet to whitelist if caller is not admin", async function () {
//       await expect(
//         planetStakeInstance
//           .connect(addr2)
//           .addPlanet(0, ethers.utils.parseUnits("10"))
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
//     });

//     it("should not allow adding planet to whitelist  if rewardAmount is not valid", async function () {
//       await expect(
//         planetStakeInstance
//           .connect(admin)
//           .addPlanet(0, ethers.utils.parseUnits("0"))
//       ).to.be.revertedWith(PlanetStakeErrorMsg.INVALID_REWARD_AMOUNT);
//     });
//   });

//   describe("test stake", function () {
//     it("should allow staking one ERC1155 token", async function () {
//       await landRockerERC1155Instance
//         .connect(addr2)
//         .setApprovalForAll(planetStakeInstance.address, true);

//       const tx = await planetStakeInstance.connect(addr2).stake(0, 1);

//       const stakeHistory = await planetStakeInstance.userStakes(
//         addr2.address,
//         0
//       );

//       await expect(tx)
//         .to.emit(planetStakeInstance, "Staked")
//         .withArgs(addr2.address, 0, 1);

//       expect(
//         await landRockerERC1155Instance.balanceOf(
//           planetStakeInstance.address,
//           0
//         )
//       ).to.equal(1);

//       expect(stakeHistory.quantity).to.equal(1);
//       expect(stakeHistory.tokenId).to.equal(0);
//       expect(stakeHistory.staker).to.equal(addr2.address);
//     });

//     it("should not allow staking when tokenId is not white listed", async function () {
//       await landRockerERC1155Instance
//         .connect(addr2)
//         .setApprovalForAll(planetStakeInstance.address, true);

//       await expect(
//         planetStakeInstance.connect(addr2).stake(5, 1)
//       ).to.be.revertedWith(PlanetStakeErrorMsg.IS_NOT_WHITE_LISTED);
//     });

//     it("should not allow staking when tokenId is not approved to transfer", async function () {
//       await landRockerERC1155Instance
//         .connect(addr2)
//         .setApprovalForAll(planetStakeInstance.address, false);

//       await expect(
//         planetStakeInstance.connect(addr2).stake(0, 1)
//       ).to.be.revertedWith(PlanetStakeErrorMsg.APPROVED_ERROR);
//     });

//     it("should not allow staking when user has not sufficient balance", async function () {
//       await landRockerERC1155Instance
//         .connect(addr1)
//         .setApprovalForAll(planetStakeInstance.address, true);

//       await expect(
//         planetStakeInstance.connect(addr1).stake(0, 1)
//       ).to.be.revertedWith(PlanetStakeErrorMsg.INSUFFICIENT_BALANCE);
//     });
//   });

//   describe("test claim", function () {
//     beforeEach(async function () {
//       const tx = await planetStakeInstance
//         .connect(admin)
//         .addPlanet(0, ethers.utils.parseUnits("10"));

//       await landRockerERC1155Instance
//         .connect(addr2)
//         .setApprovalForAll(planetStakeInstance.address, true);

//       await planetStakeInstance.connect(addr2).stake(0, 1);
//     });

//     it("should allow claiming reward", async function () {
//       const oldStakingContractBalance =
//         await landRockerERC1155Instance.balanceOf(
//           planetStakeInstance.address,
//           0
//         );

//       const txx = await planetStakeInstance
//         .connect(approvedContract)
//         .makeRewardsClaimable(addr2.address, 0);

//       const stakeHistory = await planetStakeInstance.userStakes(
//         addr2.address,
//         0
//       );

//       await expect(txx)
//         .to.emit(planetStakeInstance, "ClaimableRewardsUpdated")
//         .withArgs(addr2.address, 0);

//       const oldUserStakeAmount = stakeHistory.quantity;
//       const oldUserClaimableAmount = stakeHistory.claimable;
//       const oldUserClaimablePlanetAmount = stakeHistory.claimedPlanets;
//       console.log(Number(oldUserClaimableAmount), "oldUserClaimableAmount");
//       const tx = await planetStakeInstance.connect(addr2).claim(0);

//       const stakeHistory2 = await planetStakeInstance.userStakes(
//         addr2.address,
//         0
//       );

//       const newUserStakeAmount = stakeHistory2.quantity;
//       const newUserClaimableAmount = stakeHistory2.claimable;
//       const newUserClaimablePlanetAmount = stakeHistory2.claimedPlanets;
//       console.log(Number(newUserClaimableAmount), "newUserClaimableAmount");
//       const newStakingContractBalance =
//         await landRockerERC1155Instance.balanceOf(
//           planetStakeInstance.address,
//           0
//         );

//       await expect(tx)
//         .to.emit(planetStakeInstance, "Claimed")
//         .withArgs(addr2.address, 0, ethers.utils.parseUnits("10"));

//       expect(newStakingContractBalance).to.equal(
//         oldStakingContractBalance.sub(1)
//       );
//       expect(newUserStakeAmount).to.equal(oldUserStakeAmount.sub(1));
//       expect(newUserClaimableAmount).to.equal(oldUserClaimableAmount.sub(1));
//       expect(newUserClaimablePlanetAmount).to.equal(
//         oldUserClaimablePlanetAmount.add(1)
//       );
//       expect(stakeHistory.tokenId).to.equal(0);
//       expect(stakeHistory.staker).to.equal(addr2.address);
//       const stakerBalance = await lrtInstance.balanceOf(addr2.address);
//       expect(stakerBalance).to.equal(ethers.utils.parseUnits("10"));
//     });

//     it("should allow not claiming reward when there is any token to claim", async function () {
//       await expect(
//         planetStakeInstance.connect(addr2).claim(0)
//       ).to.be.revertedWith(PlanetStakeErrorMsg.AMOUNT_EXCEED);
//     });

//     it("should allow not claiming reward if staker is not valid", async function () {
//       await planetStakeInstance
//         .connect(approvedContract)
//         .makeRewardsClaimable(addr2.address, 0);

//       await expect(
//         planetStakeInstance.connect(addr1).claim(0)
//       ).to.be.revertedWith(PlanetStakeErrorMsg.INVALID_STAKER);
//     });

//     it("should allow not claiming reward if contract has not enough balance", async function () {
//       await expect(
//         planetStakeInstance.connect(addr1).claim(0)
//       ).to.be.revertedWith(PlanetStakeErrorMsg.INVALID_STAKER);
//     });
//   });

//   ////////////////////////////
//   describe("test makeRewardsClaimable", function () {
//     beforeEach(async function () {
//       // await landRockerERC1155Instance
//       //   .connect(addr2)
//       //   .setApprovalForAll(planetStakeInstance.address, true);
//       // await planetStakeInstance.connect(addr2).stake(0, 1);
//     });

//     it("should allow to make rewards claimable", async function () {
//       const stakeHistory = await planetStakeInstance.userStakes(
//         addr2.address,
//         0
//       );

//       const oldUserClaimableAmount = stakeHistory.claimable;

//       const tx = await planetStakeInstance
//         .connect(approvedContract)
//         .makeRewardsClaimable(addr2.address, 0);

//       const stakeHistory2 = await planetStakeInstance.userStakes(
//         addr2.address,
//         0
//       );

//       const newUserClaimableAmount = stakeHistory2.claimable;

//       await expect(tx)
//         .to.emit(planetStakeInstance, "ClaimableRewardsUpdated")
//         .withArgs(addr2.address, 0);

//       expect(newUserClaimableAmount).to.equal(oldUserClaimableAmount.add(1));

//       expect(stakeHistory.tokenId).to.equal(0);
//     });

//     it("should allow not claiming reward when if caller is not approvedContract", async function () {
//       await expect(
//         planetStakeInstance
//           .connect(addr2)
//           .makeRewardsClaimable(addr2.address, 0)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
//     });

//     it("should allow not claiming reward when if staker is not valid address", async function () {
//       await expect(
//         planetStakeInstance
//           .connect(approvedContract)
//           .makeRewardsClaimable(zeroAddress, 0)
//       ).to.be.revertedWith(LRTVestingErrorMsg.NOT_VALID_ADDRESS);
//     });

//     it("should allow not claiming reward when if claimable amount  is more than starker's token quantity", async function () {
//       const tx = await planetStakeInstance
//         .connect(admin)
//         .addPlanet(1, ethers.utils.parseUnits("10"));

//       await landRockerERC1155Instance
//         .connect(addr1)
//         .setApprovalForAll(planetStakeInstance.address, true);

//       await planetStakeInstance.connect(addr1).stake(1, 1);
//       const oldStakingContractBalance =
//         await landRockerERC1155Instance.balanceOf(
//           planetStakeInstance.address,
//           0
//         );

//       const txx = await planetStakeInstance
//         .connect(approvedContract)
//         .makeRewardsClaimable(addr1.address, 1);

//       const stakeHistory = await planetStakeInstance.userStakes(
//         addr1.address,
//         1
//       );

//       await expect(
//         planetStakeInstance
//           .connect(approvedContract)
//           .makeRewardsClaimable(addr1.address, 1)
//       ).to.be.revertedWith(PlanetStakeErrorMsg.INVALID_CLAIMABLE_AMOUNT);
//     });

//     it("should allow not claiming reward when user has not enough quantity", async function () {
//       await expect(
//         planetStakeInstance
//           .connect(approvedContract)
//           .makeRewardsClaimable(addr1.address, 0)
//       ).to.be.revertedWith(PlanetStakeErrorMsg.USER_INSUFFICIENT_BALANCE);
//     });

//     //   await planetStakeInstance
//     //     .connect(approvedContract)
//     //     .makeRewardsClaimable(addr2.address, 0);

//     //   await expect(
//     //     planetStakeInstance.connect(addr1).claim(0)
//     //   ).to.be.revertedWith(PlanetStakeErrorMsg.INVALID_STAKER);
//     // });

//     // it("should allow not claiming reward if contract has not enough balance", async function () {
//     //   await planetStakeInstance
//     //     .connect(approvedContract)
//     //     .makeRewardsClaimable(addr2.address, 0);

//     //   await expect(
//     //     planetStakeInstance.connect(addr1).claim(0)
//     //   ).to.be.revertedWith(PlanetStakeErrorMsg.INVALID_STAKER);
//     // });
//   });

//   describe("onERC1155BatchReceived", function () {
//     it("should handle ERC1155 batch transfers correctly", async () => {
//       const tokenIds = [1, 2, 3];
//       const amounts = [10, 20, 30];
//       const data = "0x12345678";
//       const tokenOwner = admin.address;
//       const receiver = addr2.address;
//       const selector = "0xbc197c81";

//       await lrtInstance
//         .connect(distributor)
//         .transferToken(tokenOwner, ethers.utils.parseUnits("500"));

//       await lrtInstance
//         .connect(admin)
//         .approve(receiver, ethers.utils.parseUnits("500"));

//       // Mint some tokens to the owner
//       await landRockerERC1155Instance
//         .connect(admin)
//         .mintBatch(tokenOwner, tokenIds, amounts, data);

//       // Get the balance of the owner for each token
//       const ownerBalancesBefore = await Promise.all(
//         tokenIds.map((tokenId) =>
//           landRockerERC1155Instance.balanceOf(tokenOwner, tokenId)
//         )
//       );

//       // Prepare the data for the onERC1155BatchReceived function
//       const onERC1155BatchReceivedData =
//         planetStakeInstance.interface.encodeFunctionData(
//           "onERC1155BatchReceived",
//           [tokenOwner, receiver, tokenIds, amounts, data]
//         );

//       // Call the onERC1155BatchReceived function on the contract

//       await landRockerERC1155Instance
//         .connect(admin)
//         .safeBatchTransferFrom(
//           tokenOwner,
//           receiver,
//           tokenIds,
//           amounts,
//           onERC1155BatchReceivedData
//         );

//       const onERC1155BatchReceivedselector =
//         await planetStakeInstance.callStatic.onERC1155BatchReceived(
//           tokenOwner,
//           receiver,
//           tokenIds,
//           amounts,
//           onERC1155BatchReceivedData
//         );

//       expect(onERC1155BatchReceivedselector).to.equal(selector);

//       //  console.log(selector1,"selector");

//       // Check that the balances of the owner and receiver have been updated correctly
//       const ownerBalancesAfter = await Promise.all(
//         tokenIds.map((tokenId) =>
//           landRockerERC1155Instance.balanceOf(tokenOwner, tokenId)
//         )
//       );
//       const receiverBalancesAfter = await Promise.all(
//         tokenIds.map((tokenId) =>
//           landRockerERC1155Instance.balanceOf(receiver, tokenId)
//         )
//       );

//       for (let i = 0; i < tokenIds.length; i++) {
//         // console.log(i, "i");
//         // console.log(amounts[i], "amounts[i]");
//         // console.log(ownerBalancesBefore[i].toNumber(), "ownerBalancesBefore[i].toNumber()");
//         // console.log(ownerBalancesAfter[i].toNumber(), "ownerBalancesAfter[i].toNumber()");
//         expect(
//           ownerBalancesBefore[i].toNumber() - ownerBalancesAfter[i].toNumber()
//         ).to.equal(amounts[i]); // Owner balance should decrease by the transfer amount
//         expect(receiverBalancesAfter[i].toNumber()).to.equal(amounts[i]); // Receiver balance should increase by the transfer amount
//       }
//     });
//   });

//   describe("supports interface", function () {
//     it("should support the specified interface", async function () {
//       // let someInterfaceId = '0x01ffc9a7'; // Replace with the actual interface ID 0x01ffc9a7(EIP165 interface)
//       let someInterfaceId = "0x4e2312e0"; // Replace with the actual interface ID 0x01ffc9a7(EIP1155 interface)
//       // Check if the contract supports the specified interface
//       const supportsInterface = await planetStakeInstance.supportsInterface(
//         someInterfaceId
//       );

//       expect(supportsInterface).to.be.true;
//     });

//     it("should not support an unsupported interface", async function () {
//       // Use an interface ID that the contract does not support
//       const unsupportedInterfaceId = "0xffffffff"; // Replace with a non-supported interface ID

//       // Check if the contract supports the unsupported interface
//       const supportsInterface = await planetStakeInstance.supportsInterface(
//         unsupportedInterfaceId
//       );

//       expect(supportsInterface).to.be.false;
//     });
//   });

//   //Upgradeability testing
//   describe("Contract Version 1 test", function () {
//     it("Should return the greeting after deployment", async function () {
//       const PlanetStake = await ethers.getContractFactory("PlanetStake");

//       const contract = await upgrades.deployProxy(
//         PlanetStake,
//         [
//           landRockerERC1155Instance.address,
//           arInstance.address,
//           lrtInstance.address,
//         ],
//         { initializer: "initializePlanetStake", kind: "uups" }
//       );
//       await contract.deployed();
//     });
//   });

//   // Upgradeability testing
//   describe("Contract Version 2 test", function () {
//     let oldContract, upgradedContract, owner, addr1;
//     beforeEach(async function () {
//       const PlanetStake = await ethers.getContractFactory("PlanetStake");
//       const PlanetStakeUpgraded = await ethers.getContractFactory(
//         "PlanetStakeUpgraded"
//       );
//       oldContract = await upgrades.deployProxy(
//         PlanetStake,
//         [
//           landRockerERC1155Instance.address,
//           arInstance.address,
//           lrtInstance.address,
//         ],
//         { initializer: "initializePlanetStake", kind: "uups" }
//       );

//       await oldContract.deployed();
//       upgradedContract = await upgrades.upgradeProxy(
//         oldContract,
//         PlanetStakeUpgraded,
//         {
//           call: {
//             fn: "initializePlanetStake",
//             args: [
//               landRockerERC1155Instance.address,
//               arInstance.address,
//               lrtInstance.address,
//               "hi i am upgraded",
//             ],
//           },
//         }
//       );
//     });

//     it("Old contract should return old greeting", async function () {
//       expect(await upgradedContract.greeting()).to.equal("hi i am upgraded");
//     });

//     it("Old contract cannot mint NFTs", async function () {
//       try {
//         oldContract.greetingNew();
//       } catch (error) {
//         expect(error.message === "oldContract.greetingNew is not a function");
//       }
//     });

//     it("New Contract Should return the old & new greeting and token name after deployment", async function () {
//       expect(await upgradedContract.greeting()).to.equal("hi i am upgraded");
//     });
//   });
// });
