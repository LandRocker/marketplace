const { ethers } = require("hardhat");
const Helper = require("../helper");

const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");
const deploy_lrt_vesting = require("./deploy_scripts/deploy_lrt_vesting");
const deploy_lrt_pre_sale = require("./deploy_scripts/deploy_pre_sale");
const deploy_aggregator = require("./deploy_scripts/deploy_mock_aggrigator");

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

async function preSaleFixture() {
  const [
    owner,
    admin,
    distributor,
    wert,
    vesting_manager,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
    royaltyRecipient,
    factory,
  ] = await ethers.getSigners();

  const arInstance = await deploy_access_restriction(owner);

  await arInstance.grantRole(ADMIN_ROLE, admin.address);
  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
  await arInstance.grantRole(WERT_ROLE, wert.address);
  await arInstance.grantRole(SCRIPT_ROLE, script.address);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);

  const lrtInstance = await deploy_lrt(arInstance);
  const lrtDistributorInstance = await deploy_lrt_distributor(
    arInstance,
    lrtInstance
  );
  const lrtVestingInstance = await deploy_lrt_vesting(
    lrtDistributorInstance,
    arInstance
  );

  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    lrtVestingInstance.address
  );

  await arInstance.grantRole(DISTRIBUTOR_ROLE, lrtDistributorInstance.address);

  const lrtPreSaleInstance = await deploy_lrt_pre_sale(
    lrtVestingInstance,
    arInstance
  );
  // Deploy MockERC20 contract for paying with stable coin
  //deploy DAI
  const Dai = await ethers.getContractFactory("Dai");
  const daiInstance = await Dai.deploy("dai", "DAI");
  await daiInstance.deployed();

  const Usdc = await ethers.getContractFactory("Usdc");
  const usdcInstance = await Usdc.deploy("usdc", "USDC");
  await usdcInstance.deployed();

  const Usdt = await ethers.getContractFactory("Usdt");
  const usdtInstance = await Usdt.deploy("usdt", "USDT");
  await usdtInstance.deployed();

  // Deploy weth
  const Weth = await ethers.getContractFactory("Weth");
  const wethInstance = await Weth.deploy("wrapped eth", "WETH");
  await wethInstance.deployed();

  // Deploy weth
  const Wbtc = await ethers.getContractFactory("Wbtc");
  const wbtcInstance = await Wbtc.deploy("wrapped btc", "WBTC");
  await wbtcInstance.deployed();

  const Wmatic = await ethers.getContractFactory("Wmatic");
  const wmaticInstance = await Wmatic.deploy("wrapped matic", "WMATIC");
  await wmaticInstance.deployed();

  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    lrtPreSaleInstance.address
  );
  await arInstance.grantRole(WERT_ROLE, addr1.address);
  await arInstance.grantRole(WERT_ROLE, addr2.address);


  // mint erc20 tokens
  await daiInstance
    .connect(admin)
    .setMint(addr1.address, ethers.utils.parseUnits("300000", 18));

  await daiInstance
    .connect(admin)
    .setMint(addr2.address, ethers.utils.parseUnits("300000", 18));

  await usdcInstance
    .connect(admin)
    .setMint(addr1.address, ethers.utils.parseUnits("300000", 6));
  await usdcInstance
    .connect(admin)
    .setMint(addr2.address, ethers.utils.parseUnits("300000", 6));

  await usdtInstance
    .connect(admin)
    .setMint(addr1.address, ethers.utils.parseUnits("300000", 6));
  await usdtInstance
    .connect(admin)
    .setMint(addr2.address, ethers.utils.parseUnits("300000", 6));

  await wethInstance
    .connect(admin)
    .setMint(addr1.address, ethers.utils.parseUnits("300000", 18));

  await wethInstance
    .connect(admin)
    .setMint(addr2.address, ethers.utils.parseUnits("300000", 18));

  await wbtcInstance
    .connect(admin)
    .setMint(addr1.address, ethers.utils.parseUnits("300000", 8));

  await wbtcInstance
    .connect(admin)
    .setMint(addr2.address, ethers.utils.parseUnits("300000", 8));

  await wmaticInstance
    .connect(admin)
    .setMint(addr1.address, ethers.utils.parseUnits("300000", 18));

  await wmaticInstance
    .connect(admin)
    .setMint(addr2.address, ethers.utils.parseUnits("300000", 18));

  //set payments tokens
  await lrtPreSaleInstance
    .connect(admin)
    .setPaymentTokens(Helper.stringToBytes16("DAI"), daiInstance.address);

  await lrtPreSaleInstance
    .connect(admin)
    .setPaymentTokens(Helper.stringToBytes16("WETH"), wethInstance.address);

  await lrtPreSaleInstance
    .connect(admin)
    .setPaymentTokens(Helper.stringToBytes16("WBTC"), wbtcInstance.address);

  await lrtPreSaleInstance
    .connect(admin)
    .setPaymentTokens(Helper.stringToBytes16("WMATIC"), wmaticInstance.address);

  await lrtPreSaleInstance
    .connect(admin)
    .setPaymentTokens(Helper.stringToBytes16("USDC"), usdcInstance.address);

  await lrtPreSaleInstance
    .connect(admin)
    .setPaymentTokens(Helper.stringToBytes16("USDT"), usdtInstance.address);

  await lrtPreSaleInstance.connect(admin).addToWhiteList(addr1.address);
  await lrtPreSaleInstance.connect(admin).addToWhiteList(addr2.address);
  await lrtPreSaleInstance.connect(admin).setSaleDiscount(2000);
  
  const MockReentrant = await ethers.getContractFactory("MockReentrant");
  const mockReentrantInstance = await MockReentrant.deploy();
  await mockReentrantInstance.deployed();

  const aggregatorInstance = await deploy_aggregator();
  await lrtPreSaleInstance
    .connect(admin)
    .setAggregator(Helper.stringToBytes16("MATIC"), aggregatorInstance.address);

  await lrtPreSaleInstance
    .connect(admin)
    .setAggregator(Helper.stringToBytes16("WETH"), aggregatorInstance.address);

  await lrtPreSaleInstance
    .connect(admin)
    .setAggregator(Helper.stringToBytes16("WBTC"), aggregatorInstance.address);

  return {
    lrtPreSaleInstance,
    lrtVestingInstance,
    arInstance,
    aggregatorInstance,
    mockReentrantInstance,
    daiInstance,
    wethInstance,
    wbtcInstance,
    wmaticInstance,
    usdcInstance,
    usdtInstance,
    owner,
    admin,
    script,
    wert,
    addr1,
    addr2,
    treasury,
    royaltyRecipient,
    factory,
  };
}

module.exports = {
  preSaleFixture,
};
