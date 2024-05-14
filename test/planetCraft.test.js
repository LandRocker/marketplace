// const { expect, util } = require("chai");
// const {
//   time,
//   loadFixture,
// } = require("@nomicfoundation/hardhat-network-helpers");

// const {
//   MarketplaceErrorMsg,
//   AccessErrorMsg,
//   PlanetCraftErrorMsg,
//   LR1155Message,
//   LR721Message,
// } = require("./messages");
// const { ethers, network } = require("hardhat");

// const Math = require("./helper/math");

// const { planetCraftFixture } = require("./fixture/planetCraft.fixture");
// const Helper = require("./helper");
// const { balance } = require("@openzeppelin/test-helpers");
// const address = require("ethers-utils/address");

// const zeroAddress = "0x0000000000000000000000000000000000000000";

// describe("PlanetCraft contract", function () {
//   let planetCraftInstance,
//     lrtVestingInstance,
//     landRockerInstance,
//     landRockerERC1155Instance,
//     landRockerERC721Instance,
//     lrtInstance,
//     lrtDistributorInstance,
//     arInstance,
//     owner,
//     admin,
//     distributor,
//     minter,
//     approvedContract,
//     script,
//     addr1,
//     addr2,
//     treasury,
//     royaltyRecipient,
//     collection721_one,
//     collection721_two,
//     collection1155_one,
//     collection1155_two;
//   let baseURI =
//     "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";
//   let baseURI2 =
//     "https://srvs20.landrocker.io/game_service/bc/get/token/data?token_id=";

//   beforeEach(async function () {
//     ({
//       planetCraftInstance,
//       landRockerInstance,
//       landRockerERC1155Instance,
//       landRockerERC721Instance,
//       lrtInstance,
//       lrtDistributorInstance,
//       arInstance,
//       owner,
//       admin,
//       distributor,
//       minter,
//       approvedContract,
//       script,
//       addr1,
//       addr2,
//       treasury,
//       royaltyRecipient,
//       lrtVestingInstance,
//       collection721_one,
//       collection721_two,
//       collection1155_one,
//       collection1155_two,
//     } = await loadFixture(planetCraftFixture));
//   });

//   describe("test setLandRocker1155Collection", function () {
//     it("should allow to set LandRocker1155Collection", async function () {
//       const tx = await planetCraftInstance
//         .connect(admin)
//         .setLandRocker1155Collection(collection1155_one, true);

//       await expect(tx)
//         .to.emit(planetCraftInstance, "Collection1155Added")
//         .withArgs(collection1155_one, true);

//       expect(
//         await planetCraftInstance
//           .connect(admin)
//           .landrocker1155Collections(collection1155_one)
//       ).to.be.true;
//     });

//     it("should not allow to set LandRocker1155Collection when caller is not admin", async function () {
//       await expect(
//         planetCraftInstance
//           .connect(addr2)
//           .setLandRocker1155Collection(collection1155_one, true)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
//     });

//     it("should not allow to set LandRocker1155Collection when collection is not valid", async function () {
//       await expect(
//         planetCraftInstance
//           .connect(admin)
//           .setLandRocker1155Collection(zeroAddress, true)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.NOT_VALID_ADDRESS);
//     });
//   });

//   describe("test setLandRocker721Collection", function () {
//     it("should allow to set LandRocker1155Collection", async function () {
//       const tx = await planetCraftInstance
//         .connect(admin)
//         .setLandRocker721Collection(collection1155_one, true);

//       await expect(tx)
//         .to.emit(planetCraftInstance, "Collection721Added")
//         .withArgs(collection1155_one, true);

//       expect(
//         await planetCraftInstance
//           .connect(admin)
//           .landrocker721Collections(collection1155_one)
//       ).to.be.true;
//     });

//     it("should not allow to set LandRocker721Collection when caller is not admin", async function () {
//       await expect(
//         planetCraftInstance
//           .connect(addr2)
//           .setLandRocker721Collection(collection721_one, true)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
//     });

//     it("should not allow to set LandRocker721Collection when collection is not valid", async function () {
//       await expect(
//         planetCraftInstance
//           .connect(admin)
//           .setLandRocker721Collection(zeroAddress, true)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.NOT_VALID_ADDRESS);
//     });
//   });

//   describe("test withdraw", function () {
//     beforeEach(async function () {
//       const fee = ethers.utils.parseUnits("200");

//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await lrtInstance
//         .connect(distributor)
//         .transferToken(addr2.address, ethers.utils.parseUnits("500"));

//       await lrtInstance
//         .connect(addr2)
//         .approve(planetCraftInstance.address, fee);

//       await planetCraftInstance.connect(addr2).preCraft(0);
//     });

//     it("should allow to withdraw contract balance", async function () {
//       const amount = ethers.utils.parseUnits("200");
//       const treasuryAddress = await landRockerInstance.treasury();
//       const oldTreasury = await lrtInstance.balanceOf(treasuryAddress);
//       const oldSystemBalance = await lrtInstance.balanceOf(
//         planetCraftInstance.address
//       );
//       //   console.log(ethers.utils.parseUnits("0.002", 18), "amount");
//       ethers.utils.formatUnits(
//         await lrtInstance.balanceOf(planetCraftInstance.address)
//       ),
//         "after buy";

//       const tx = await planetCraftInstance.connect(admin).withdraw(amount);

//       await expect(tx)
//         .to.emit(planetCraftInstance, "Withdrawn")
//         .withArgs(amount, treasuryAddress);

//       const newTreasury = await lrtInstance.balanceOf(treasuryAddress);
//       const newSystemBalance = await lrtInstance.balanceOf(
//         planetCraftInstance.address
//       );

//       expect(Number(newTreasury)).to.equal(
//         Number(Math.Big(oldTreasury).add(amount))
//       );
//       expect(Number(newSystemBalance)).to.equal(
//         Number(Math.Big(oldSystemBalance).sub(amount))
//       );
//     });

//     it("should not allow to withdraw sell if caller is not admin", async function () {
//       const amount = ethers.utils.parseUnits("0.002", 18);

//       await expect(
//         planetCraftInstance.connect(addr1).withdraw(amount)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
//     });

//     it("should not allow to withdraw sell if amount is too low", async function () {
//       const amount = ethers.utils.parseUnits("0", 18);

//       await expect(
//         planetCraftInstance.connect(admin).withdraw(amount)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.TOO_LOW_AMOUNT);
//     });

//     it("should not allow to withdraw sell if balance insufficient", async function () {
//       const amount = ethers.utils.parseUnits("1000", 18);

//       await expect(
//         planetCraftInstance.connect(admin).withdraw(amount)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.NO_BALANCE_WITHDRAW);
//     });
//   });

//   describe("test craft 1155 tokens", function () {
//     beforeEach(async function () {
//       await planetCraftInstance
//         .connect(admin)
//         .setLandRocker1155Collection(collection1155_one, true);
//     });

//     it("should not allow to craft when the craftId does not exist", async function () {
//       const amount = 5;

//       await expect(
//         planetCraftInstance
//           .connect(script)
//           .craft1155(0, addr2.address, collection1155_one, amount)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.INVALID_CRAFT);
//     });

//     it("should not allow to craft when collection is not valid", async function () {
//       const amount = 5;
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await expect(
//         planetCraftInstance
//           .connect(script)
//           .craft1155(0, addr2.address, collection1155_two, amount)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.INVALID_COLLECTION);
//     });

//     it("should not allow to craft when the recipient address is not valid", async function () {
//       const amount = 5;
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await expect(
//         planetCraftInstance
//           .connect(script)
//           .craft1155(0, zeroAddress, collection1155_one, amount)
//       ).to.be.revertedWith(LR1155Message.NOT_VALID_ADDRESS);
//     });

//     it("should not allow to craft when the amount is not valid", async function () {
//       const amount = 0;
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);
//       await expect(
//         planetCraftInstance
//           .connect(script)
//           .craft1155(0, addr2.address, collection1155_one, amount)
//       ).to.be.revertedWith(LR1155Message.LOW_AMOUNT);
//     });

//     it("should not allow to craft if caller is not script", async function () {
//       const amount = 5;
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await expect(
//         planetCraftInstance
//           .connect(addr1)
//           .craft1155(0, addr2.address, collection1155_one, amount)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
//     });

//     it("should allow to craft", async function () {
//       const amount = 5;
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       const tx = await planetCraftInstance
//         .connect(script)
//         .craft1155(0, addr2.address, collection1155_one, amount);

//       await expect(tx)
//         .to.emit(planetCraftInstance, "Crafted1155Tokens")
//         .withArgs(collection1155_one, 0, 0, addr2.address, amount);

//       const cloneContract = await ethers.getContractFactory(
//         "LandRockerERC1155"
//       );
//       const clone1 = cloneContract.attach(collection1155_one);

//       expect(
//         await clone1.connect(approvedContract).balanceOf(addr2.address, 0)
//       ).to.equal(amount);
//     });
//   });

//   describe("test craft 721 tokens", function () {
//     beforeEach(async function () {
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await planetCraftInstance
//         .connect(admin)
//         .setLandRocker721Collection(collection721_one, true);
//     });

//     it("should not allow to craft when the craftId does not exist", async function () {
//       await expect(
//         planetCraftInstance
//           .connect(script)
//           .craft721(3, addr2.address, collection721_one)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.INVALID_CRAFT);
//     });

//     it("should not allow to craft when collection is not valid", async function () {
//       const amount = 5;
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await expect(
//         planetCraftInstance
//           .connect(script)
//           .craft721(0, addr2.address, collection721_two)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.INVALID_COLLECTION);
//     });

//     it("should not allow to craft when the recipient address is not valid", async function () {
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await expect(
//         planetCraftInstance
//           .connect(script)
//           .craft721(0, zeroAddress, collection721_one)
//       ).to.be.revertedWith(LR721Message.NOT_VALID_ADDRESS);
//     });

//     it("should not allow to craft when the collection is not active", async function () {
//       await expect(
//         planetCraftInstance
//           .connect(script)
//           .craft721(0, addr2.address, collection721_two)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.INVALID_COLLECTION);
//     });

//     it("should not allow to craft if caller is not script", async function () {
//       await expect(
//         planetCraftInstance
//           .connect(addr1)
//           .craft721(0, addr2.address, collection721_one)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
//     });

//     it("should allow to craft", async function () {
//       const tx = await planetCraftInstance
//         .connect(script)
//         .craft721(0, addr2.address, collection721_one);

//       await expect(tx)
//         .to.emit(planetCraftInstance, "Crafted721Tokens")
//         .withArgs(collection721_one, 0, 0, addr2.address);
//     });
//   });

//   describe("test set crafts fee", function () {
//     it("should not allow to craft when the fee is not valid", async function () {
//       const fee = 0;

//       await expect(
//         planetCraftInstance.connect(script).setCraftFee(fee)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.TOO_LOW_CRAFT_FEE);
//     });

//     it("should not allow to set craft fee if caller is not admin", async function () {
//       const fee = 5;

//       await expect(
//         planetCraftInstance.connect(addr1).setCraftFee(fee)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
//     });

//     it("should allow to set craft fee", async function () {
//       const fee = 5;

//       const tx = await planetCraftInstance.connect(script).setCraftFee(fee);

//       await expect(tx)
//         .to.emit(planetCraftInstance, "CraftFeeSet")
//         .withArgs(0, fee);

//       expect(await planetCraftInstance.connect(admin).craftsFee(0)).to.equal(5);
//     });
//   });

//   describe("test edit craft's fee", function () {
//     beforeEach(async function () {
//       const fee = ethers.utils.parseUnits("200");
//       await planetCraftInstance.connect(script).setCraftFee(fee);
//     });

//     it("should not allow to update craft fee when the fee is not valid", async function () {
//       const fee = 0;

//       await expect(
//         planetCraftInstance.connect(admin).editCraftFee(0, fee)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.TOO_LOW_CRAFT_FEE);
//     });

//     it("should not allow to update craft fee when the craftId does not exist", async function () {
//       const fee = 5;

//       await expect(
//         planetCraftInstance.connect(admin).editCraftFee(3, fee)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.INVALID_CRAFT);
//     });

//     it("should not allow to update craft fee if caller is not admin", async function () {
//       const fee = 5;

//       await expect(
//         planetCraftInstance.connect(addr1).editCraftFee(0, fee)
//       ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
//     });

//     it("should allow to update craft fee", async function () {
//       const fee = 5;

//       const tx = await planetCraftInstance.connect(admin).editCraftFee(0, fee);

//       await expect(tx)
//         .to.emit(planetCraftInstance, "CraftFeeUpdated")
//         .withArgs(0, fee);

//       expect(await planetCraftInstance.connect(admin).craftsFee(0)).to.equal(5);
//     });
//   });

//   describe("test pre craft", function () {
//     it("should not allow to pay craft fee when the craft does not exist", async function () {
//       await lrtInstance
//         .connect(distributor)
//         .transferToken(addr2.address, ethers.utils.parseUnits("500"));

//       await lrtInstance
//         .connect(addr2)
//         .approve(planetCraftInstance.address, "500");

//       await expect(
//         planetCraftInstance.connect(addr2).preCraft(0)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.INVALID_CRAFT);
//     });

//     it("should not allow to pay craft fee when has allowance error", async function () {
//       const fee = ethers.utils.parseUnits("200");

//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await lrtInstance
//         .connect(distributor)
//         .transferToken(addr2.address, ethers.utils.parseUnits("500"));

//       await lrtInstance.connect(addr2).approve(planetCraftInstance.address, 0);

//       await expect(
//         planetCraftInstance.connect(addr2).preCraft(0)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.ALLOWANCE_ERROR);
//     });

//     it("should allow to pay craft fee", async function () {
//       const fee = ethers.utils.parseUnits("200");

//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await lrtInstance
//         .connect(distributor)
//         .transferToken(addr2.address, ethers.utils.parseUnits("500"));

//       await lrtInstance
//         .connect(addr2)
//         .approve(planetCraftInstance.address, ethers.utils.parseUnits("500"));

//       //before pay craft fee
//       const oldPayerBalance = await lrtInstance.balanceOf(addr2.address);
//       const oldSystemBalance = await lrtInstance.balanceOf(
//         planetCraftInstance.address
//       );

//       //   await planetCraftInstance.connect(addr2).preCraft(0);
//       const tx = await planetCraftInstance.connect(addr2).preCraft(0);

//       const newpayerBalance = await lrtInstance.balanceOf(addr2.address);
//       const newSystemBalance = await lrtInstance.balanceOf(
//         planetCraftInstance.address
//       );

//       //   await expect(tx)
//       //     .to.emit(planetCraftInstance, "PaidCraftFeeWithBalance")
//       //     .withArgs(0, addr2.address, fee);

//       expect(Number(newpayerBalance)).to.equal(
//         Number(Math.Big(oldPayerBalance).sub(fee))
//       );

//       expect(Number(newSystemBalance)).to.equal(
//         Number(Math.Big(oldSystemBalance).add(fee))
//       );
//     });

//     it("should not allow to pay craft fee when has not sufficient vesting balance", async function () {
//       const fee = ethers.utils.parseUnits("200");

//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await lrtInstance
//         .connect(distributor)
//         .transferToken(addr2.address, ethers.utils.parseUnits("100"));

//       await lrtInstance
//         .connect(addr2)
//         .approve(planetCraftInstance.address, ethers.utils.parseUnits("500"));

//       await expect(
//         planetCraftInstance.connect(addr2).preCraft(0)
//       ).to.be.revertedWith(PlanetCraftErrorMsg.INSUFFICIENT_VESTED_BALANCE);
//     });

//     it("should set debt to pay craft fee when user has not sufficient balance", async function () {
//       const treasury1155 = await landRockerInstance.treasury1155();
//       const fee = ethers.utils.parseUnits("200");

//       await planetCraftInstance.connect(script).setCraftFee(fee);

//       await lrtInstance
//         .connect(distributor)
//         .transferToken(addr2.address, ethers.utils.parseUnits("100"));

//       await lrtInstance
//         .connect(addr2)
//         .approve(planetCraftInstance.address, ethers.utils.parseUnits("500"));

//       // set up the vesting plan parameters
//       const startDate =
//         (await time.latest()) + (await Helper.convertToSeconds("days", 1));
//       const cliff = await Helper.convertToSeconds("days", 1); // 1 day cliff86400;
//       const duration = await Helper.convertToSeconds("weeks", 1); // 1 week vesting period
//       const revocable = true;
//       const poolName = ethers.utils.formatBytes32String("PreSale");
//       const initialReleasePercentage = 5000;

//       // create the vesting plan
//       const txVestingPlan = await lrtVestingInstance
//         .connect(admin)
//         .createVestingPlan(
//           startDate,
//           cliff,
//           duration,
//           revocable,
//           initialReleasePercentage,
//           poolName
//         );

//       //create vesting schedules addr2
//       const vestingAmount = ethers.utils.parseUnits("1000");
//       const planId = 0;

//       const vestingStartDate =
//         (await time.latest()) + (await Helper.convertToSeconds("days", 1)); // Start date 1 day from now
//       await lrtVestingInstance
//         .connect(admin)
//         .createVesting(addr2.address, vestingStartDate, vestingAmount, planId);

//       //   await lrtInstance
//       //     .connect(addr2)
//       //     .approve(planetCraftInstance.address, price);

//       //before pay craft fee
//       const oldPayerBalance = await lrtInstance.balanceOf(addr2.address);
//       const oldTreasury1155 = await lrtInstance.balanceOf(treasury1155);
//       const oldSystemBalance = await lrtInstance.balanceOf(
//         planetCraftInstance.address
//       );

//       //   await planetCraftInstance.connect(addr2).preCraft(0);
//       const tx = await planetCraftInstance.connect(addr2).preCraft(0);

//       const newpayerBalance = await lrtInstance.balanceOf(addr2.address);
//       const newTreasury1155 = await lrtInstance.balanceOf(treasury1155);
//       const newSystemBalance = await lrtInstance.balanceOf(
//         planetCraftInstance.address
//       );

//       await expect(tx)
//         .to.emit(planetCraftInstance, "PaidCraftFeeWithVesting")
//         .withArgs(0, addr2.address, fee);

//       expect(await lrtInstance.balanceOf(addr2.address)).to.equal(
//         ethers.utils.parseUnits("100")
//       );

//       expect(Number(newpayerBalance)).to.equal(
//         Number(Math.Big(oldPayerBalance))
//       );
//       expect(Number(newTreasury1155)).to.equal(
//         Number(Math.Big(oldTreasury1155))
//       );
//       expect(Number(newSystemBalance)).to.equal(
//         Number(Math.Big(oldSystemBalance))
//       );

//       const vestingStat = await lrtVestingInstance.holdersStat(addr2.address);
//       expect(vestingStat.claimedAmount).to.equal(fee);

//       await expect(tx)
//         .to.emit(lrtVestingInstance, "DebtCreated")
//         .withArgs(fee, addr2.address);
//     });
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
//         planetCraftInstance.interface.encodeFunctionData(
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
//         await planetCraftInstance.callStatic.onERC1155BatchReceived(
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
//       const supportsInterface = await planetCraftInstance.supportsInterface(
//         someInterfaceId
//       );

//       expect(supportsInterface).to.be.true;
//     });

//     it("should not support an unsupported interface", async function () {
//       // Use an interface ID that the contract does not support
//       const unsupportedInterfaceId = "0xffffffff"; // Replace with a non-supported interface ID

//       // Check if the contract supports the unsupported interface
//       const supportsInterface = await planetCraftInstance.supportsInterface(
//         unsupportedInterfaceId
//       );

//       expect(supportsInterface).to.be.false;
//     });
//   });

//   // Upgradeability testing
//   describe("Contract Version 2 test", function () {
//     let oldContract, upgradedContract, owner, addr1;
//     beforeEach(async function () {
//       const PlanetCraft = await ethers.getContractFactory("PlanetCraft");
//       const PlanetCraftUpgraded = await ethers.getContractFactory(
//         "PlanetCraftUpgraded"
//       );
//       oldContract = await upgrades.deployProxy(
//         PlanetCraft,
//         [
//           arInstance.address,
//           lrtInstance.address,
//           landRockerInstance.address,
//           lrtVestingInstance.address,
//         ],
//         { initializer: "initializePlanetCraft", kind: "uups" }
//       );

//       await oldContract.deployed();
//       upgradedContract = await upgrades.upgradeProxy(
//         oldContract,
//         PlanetCraftUpgraded,
//         {
//           call: {
//             fn: "initializePlanetCraft",
//             args: [
//               arInstance.address,
//               lrtInstance.address,
//               landRockerInstance.address,
//               lrtVestingInstance.address,
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
