const { accessRestrictionFixture } = require("./accessRestriction.fixture");
const { lrtFixture } = require("./lrt.fixture");
const { lrtDistributorFixture } = require("./lrtDistributor.fixture");
const { lrtVestingFixture } = require("./lrtVesting.fixture");
const { preSaleFixture } = require("./preSale.fixture");
const { minted1155MarketplaceFixture } = require("./minted1155Marketplace.fixture");
const { nonMinted1155MarketplaceFixture } = require("./nonMinted1155Marketplace.fixture");
const { assetMarketplaceFixture } = require("./assetMarketplace.fixture");

module.exports = {
  accessRestrictionFixture,
  lrtFixture,
  lrtVestingFixture,
  preSaleFixture,
  lrtDistributorFixture,
  minted1155MarketplaceFixture,
  nonMinted1155MarketplaceFixture,
  assetMarketplaceFixture
};
