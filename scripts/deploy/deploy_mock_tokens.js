const hre = require("hardhat");
const { ethers } = require("hardhat");
const tokens = [
  // {
  //   name: "dai",
  //   symbol: "DAI",
  //   contract: "Dai",
  //   decimal: 18,
  // },
  // {
  //   name: "usdc",
  //   symbol: "USDC",
  //   contract: "Usdc",
  //   decimal: 6,
  // },
  // {
  //   name: "usdt",
  //   symbol: "USDT",
  //   contract: "Usdt",
  //   decimal: 18,
  // },
  // {
  //   name: "weth",
  //   symbol: "WETH",
  //   contract: "Weth",
  //   decimal: 18,
  // },
  // {
  //   name: "wbtc",
  //   symbol: "WBTC",
  //   contract: "Wbtc",
  //   decimal: 8,
  // },

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
      "0x54ACAB2Fc5a8BFd24C06402B1FE8D1b31F82bcc3",
      ethers.utils.parseUnits("300", tokens[i].decimal)
    );

    await tokenInstance.setMint(
      "0x811a53Ae18cfbda20AE918faE58AE8dd8d252355",
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
