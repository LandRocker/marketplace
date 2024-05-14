const hre = require("hardhat");
const { ethers } = require("hardhat");
const Helper = require("../../test/helper");

async function main() {
  // deploy contracts
  const Token = await ethers.getContractFactory("Token");
  const daiInstance = await Token.deploy("dai", "DAI");
  await daiInstance.deployed();
  // setup data
  await daiInstance.setMint(
    "0x54ACAB2Fc5a8BFd24C06402B1FE8D1b31F82bcc3",
    ethers.utils.parseUnits("300", 18)
  );

  await daiInstance.setMint(
    "0x811a53Ae18cfbda20AE918faE58AE8dd8d252355",
    ethers.utils.parseUnits("300", 18)
  );

  const LRTPrivateSaleContractAddress =
    "0x51Cf5aEbB04d04e2ee6F92B513FCB0c2f1Dff0cd";

  const lrtPrivateSaleContract = await ethers.getContractFactory(
    "LRTPrivateSale"
  );
  const lrtPrivateSaleInstance = await lrtPrivateSaleContract.attach(
    LRTPrivateSaleContractAddress
  );

  await lrtPrivateSaleInstance.setPaymentTokens(
    Helper.stringToBytes16("DAI"),
    daiInstance.address
  );

  console.log("DAI address:", daiInstance.address);
  console.log("---------------------------------------------------------");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
