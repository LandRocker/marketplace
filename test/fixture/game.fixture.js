const { ethers } = require("hardhat");
const deploy_game = require("./deploy_scripts/deploy_Game");
const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");
const deploy_landRockerERC1155 = require("./deploy_scripts/deploy_landRockerERC1155");
const deploy_planetStake = require("./deploy_scripts/deploy_planetStake");

let ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));

let APPROVED_CONTRACT_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("APPROVED_CONTRACT_ROLE")
);
let SCRIPT_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("SCRIPT_ROLE")
);

let DISTRIBUTOR_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("DISTRIBUTOR_ROLE")
);

let WERT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WERT_ROLE"));
async function gameFixture() {
  const [
    owner,
    admin,
    distributor,
    wert,
    approvedContract,
    royaltyRecipient,
    script,
    addr1,
    addr2,
    treasury,
  ] = await ethers.getSigners();

  const arInstance = await deploy_access_restriction(owner);
  const lrtInstance = await deploy_lrt(arInstance);

  await arInstance.grantRole(ADMIN_ROLE, admin.address);
  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
  await arInstance.grantRole(WERT_ROLE, wert.address);
  await arInstance.grantRole(SCRIPT_ROLE, script.address);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);

  const landRockerERC1155Instance = await deploy_landRockerERC1155(
    arInstance,
    royaltyRecipient
  );
  const planetStakeInstance = await deploy_planetStake(
    landRockerERC1155Instance,
    arInstance,
    lrtInstance
  );

  // Deploy weth
  const Weth = await ethers.getContractFactory("Weth");
  const wethInstance = await Weth.deploy("wrapped eth", "WETH");
  await wethInstance.deployed();

  // Deploy weth
  const Wbtc = await ethers.getContractFactory("Wbtc");
  const wbtcInstance = await Wbtc.deploy("wrapped btc", "WBTC");
  await wbtcInstance.deployed();

  const gameInstance = await deploy_game(arInstance, planetStakeInstance);

  const tokenId = await landRockerERC1155Instance
    .connect(approvedContract)
    .callStatic.safeMint(addr1.address, 10);

  await landRockerERC1155Instance
    .connect(approvedContract)
    .safeMint(addr1.address, 10);

  await planetStakeInstance
    .connect(admin)
    .addPlanet(0, ethers.utils.parseUnits("10"));
  await planetStakeInstance
    .connect(admin)
    .addPlanet(1, ethers.utils.parseUnits("10"));

  await lrtInstance
    .connect(distributor)
    .transferToken(planetStakeInstance.address, ethers.utils.parseUnits("500"));

  await landRockerERC1155Instance
    .connect(addr1)
    .setApprovalForAll(planetStakeInstance.address, true);

  await planetStakeInstance.connect(addr1).stake(0, 10);

  // const stakedData = await planetStakeInstance.userStakes(addr1.address, 0);


  await lrtInstance
    .connect(distributor)
    .transferToken(gameInstance.address, ethers.utils.parseUnits("1000"));

  await wethInstance
    .connect(admin)
    .setMint(gameInstance.address, ethers.utils.parseUnits("1000", 18));

  await wbtcInstance
    .connect(admin)
    .setMint(gameInstance.address, ethers.utils.parseUnits("1000", 8));

  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, gameInstance.address);

  // console.log(stakedData, "stakedData");

  return {
    lrtInstance,
    gameInstance,
    arInstance,
    owner,
    admin,
    distributor,
    wert,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
  };
}

module.exports = {
  gameFixture,
};
