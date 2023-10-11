const hre = require("hardhat");
const { ethers } = require("hardhat");
const tokens = [

   {
    name: "wmatic",
    symbol: "WMATIC",
    contract: "Wmatic",
    decimal: 18,
  },
];
async function main() {
  // deploy contracts
  for (let i = 0; i < tokens.length; i++) {
    const Token = await ethers.getContractFactory(tokens[i].contract);
    const tokenInstance = await Token.deploy(tokens[i].name, tokens[i].symbol);
    await tokenInstance.deployed();
    // setup data
    await tokenInstance.setMint(
      "",
      ethers.utils.parseUnits("300", tokens[i].decimal)
    );

    await tokenInstance.setMint(
      "",
      ethers.utils.parseUnits("300", tokens[i].decimal)
    );

    console.log(`${tokens[i].symbol} address:`, tokenInstance.address);
    console.log("---------------------------------------------------------");
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
