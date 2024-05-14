const AccessErrorMsg = {
  CALLER_NOT_OWNER: "AR::caller is not owner",
  CALLER_NOT_ADMIN: "AR::caller is not admin",
  CALLER_NOT_DISTRIBUTOR: "AR::caller is not distributor",
  CALLER_NOT_VESTING_MANAGER: "AR::caller is not vesting manager",

  CALLER_NOT_APPROVED_CONTRACT: "AR::caller is not approved contract",
  CALLER_NOT_SCRIPT: "AR::caller is not script",
  CALLER_NOT_WERT: "AR::caller is not wert",

  PAUSEABLE_PAUSED: "AR::Pausable: paused",
  PAUSEABLE_NOT_PAUSED: "AR::Pausable: not paused",

  CALLER_NOT_OWNER_OR_ADMIN: "AR::caller is not admin or owner",
  CALLER_NOT_ADMIN_OR_APPROVED_CONTRACT:
    "AR::caller is not admin or approved contract",
  CALLER_NOT_ADMIN_OR_SCRIPT: "AR::caller is not admin or script",
};

const LRTErrorMsg = {
  LRT_MAX_SUPPLY: "LRT::Max supply exceeded",
  LRT_BURN_LIMIT: "LRT::Burn amount exceeds balance",
  LRT_TOO_LOW_AMOUNT: "LRT::Insufficient amount:equal to zero",
  INSUFFICIENT_BALANCE: "LRT::Insufficient balance",
  INVALID_DEST: "LRT::LRT can't transfer to owner",
};

const LRTDistroErrorMsg = {
  POOL_INSUFFICIENT_BALANCE: "LRTDistributor::The pool has not enough balance",
  INVALID_ADDRESS: "LRTDistributor::Not valid address",
  NOT_VALID_DESTINATION: "LRTDistributor::LRT cannot transfer to distributor",
};

const LRTVestingTeamErrorMsg = {
  INVALID_AMOUNT: "LRTVestingTeam::Amount should be greater than 0",
  INVALID_LIST_DATE: "LRTVestingTeam::Listing date not set",
  INVALID_DURATION: "LRTVestingTeam::Duration not set",
  INVALID_VESTING_CREATION: "LRTVestingTeam::Vesting already created",
  INVALID_CLAIMABLE_AMOUNT: "LRTVestingTeam::Not claimable yet",
  REVOKED_BEFORE: "LRTVestingTeam::Your vesting is revoked",
};

const LRTVestingErrorMsg = {
  INVALID_CLIFF: "LRTVesting::Cliff priod is invalid",
  ZERO_DURATION: "LRTVesting::Duration is not seted",
  PLAN_IS_NOT_EXIST: "LRTVesting::Plan is not exist",
  LOW_AMOUNT: "LRTVesting::Amount is too low",
  REVOKED_BEFORE: "LRTVesting::Your vesting are revoked",

  INSUFFICIENT_BALANCE: "LRTVesting::Not sufficient tokens",
  INVALID_START_DATE: "LRTVesting::StartDate is not valid",
  INVALID_START_DATE_VESTING:
    "LRTVesting::createVesting:StartDate is not valid",

  LOW_DURATION: "LRTVesting::Duration is too low",
  START2: "LRTVesting::StartDate is not valid2",
  INVALID_UNLOCK_DATE: "LRTVesting::UnlockDate is not valid",
  ZERO_CLAIMABLE_AMOUNT: "LRTVesting::Not enough vested tokens",
  NO_VESTING: "LRTVesting::No vesting",
  NOT_REVOCABLE: "LRTVesting:Vesting is not revocable",
  NOT_VALID_ADDRESS: "LRTVesting::Not valid address",
  DEBT_LIMIT_EXCEED: "LRTVesting::Debt limit Exceeded",
  INSUFFICIENT_CONTRACT_BALANCE: "LRTVesting::Insufficient contract balance",
};

const SaleErrorMsg = {
  LIMIT_EXCEED: "PreSale::LRT limit Exceeded",
  TIME_EXCEED: "PreSale::Sale time is over",
  DAILY_LIMIT: "LRTPreSale::You've reached the daily buying limit",
  ELIGBLE_ADDRESS: "PreSale::You are not eligible",
  TOO_LOW_AMOUNT: "PreSale::Insufficient amount:Below minLrtPerUser",
  NOT_SUPPORTED_STABLE_COIN: "PreSale::Stable Coin is not Supported",
  NOT_VALID_ADDRESS: "PreSale::Not valid address",
  NOT_ELIGBLE_ADDRESS: "PreSale::Address is not eligible",
  PRICE_TOO_OLD: "PreSale::Price too old",
  NOT_ENABLED: "PreSale::Does not enable",
  NOT_VALID_STABLECOIN: "PreSale::_stableCoin address is not valid",
  VALID_AMOUNT: "PreSale::Insufficient amount:equal to zero",
  INSUFFICIENT_BALANCE: "PreSale::insufficient balance",
  ALLOWANCE_ERROR: "PreSale::allowance error",
  TOKEN_NOT_EXIST: "PreSale::payment token is not valid",
  USER_BALANCE_LIMIT: "PreSale::You've reached the max lrt amount",
  SALE_NOT_ACTIVE: "LRTPreSale::sale is not active",
};

const LRMessage = {
  INVALID_SYSTEM_FEE: "LandRocker::Invalid system fee",
  INVALID_Address: "LandRocker::Not valid address",
};

const LR721Message = {
  INVALID_URI: "LandRockerERC721::Base URI is invalid",
  NOTHING_SET: "LandRockerERC721::No default royalty set",
  INVALID_FEE: "LandRockerERC721::New default lower than previous",
  NOT_VALID_ADDRESS: "LandRockerERC721::Not valid address",
  IN_VALID_FEES: "LandRockerERC721::Royalty fee is invalid",
  DOUBLE_INITIALIZER_CALL: "Initializable:Contract is already initialized",
};

const LR1155Message = {
  INVALID_URI: "LandRockerERC1155::Base URI is invalid",
  INVALID_FEE: "LandRockerERC1155::Royalty fee is invalid",
  IN_VALID_FEE: "LandRockerERC1155::New default lower than previous",
  NOT_VALID_ADDRESS: "LandRockerERC1155::Not valid address",
  LOW_AMOUNT: "LandRockerERC1155::Insufficient amount, equal to zero",
  INSUFFICIENT_BALANCE: "LandRockerERC1155::Insufficient balance to burn",
};

const MarketplaceErrorMsg = {
  INVALID_ADDRESS: "Marketplace::Invalid address",
  INVALID_EXPIRE_DATE: "Marketplace::Expiration date is invalid",
  SALE_HAS_EXPIRED: "Marketplace::The sale has expired",

  //CANCEL
  CANCEL_ACTIVE: "Marketplace::Cannot cancel active offer",
  CANCEL_OFFER_NOT_OWNER: "Marketplace::You are not owner",
  //LIST NFT
  INVALID_TOKEN_TYPE: "Marketplace::Invalid tokenType",
  INVALID_URI: "Marketplace::Invalid URI",
  INVALID_NFT_ADDRESS: "Marketplace::nftAddress is invalid",
  INVALID_BATCH_AMOUNT: "Marketplace::At least one item to sell",
  INVALID_PAYMENT_TOKEN: "Marketplace::Invalid paymentToken",
  NOT_OWNER_LIST_NFT_721: "Marketplace::You are not owner",
  MARKETPLACE_LIST_NFT_PERMISSION_721:
    "Marketplace::Marketplace has not access",
  MARKETPLACE_LIST_NFT_PERMISSION_1155:
    "Marketplace::Marketplace has not access",
  NOT_ENOUGH_BALANCE_LIST_NFT_1155:
    "Marketplace::You do not have enough balance",

  //BUY ITEM BY TOKEN
  ALLOWANCE: "Marketplace::Allowance error",
  INSUFFICIENT_BALANCE: "Marketplace::Insufficient balance",
  UNSUCCESSFUL_TRANSFER_BUY_ITEM: "Marketplace::Unsuccessful transfer",

  //WITHDRAW BALANCE
  TOO_LOW_AMOUNT: "Marketplace::Insufficient amount, equal to zero",
  NO_BALANCE_WITHDRAW: "Marketplace::No balance to withdraw",
  INVALID_ADMIN_WALLET: "Marketplace::Invalid admin wallet",
  UNSUCCESSFUL_TRANSFER_WITHDRAW: "Marketplace::Unsuccessful transfer",

  //TRANSFER TO BUYER
  NOT_OWNER_TRANSFER_721: "Marketplace::You are not owner",
  MARKETPLACE_TRANSFER_PERMISSION_721:
    "Marketplace::Marketplace has not access",
  MARKETPLACE_TRANSFER_PERMISSION_1155:
    "Marketplace::Marketplace has not access",
  NOT_ENOUGH_BALANCE_TRANSFER_1155:
    "Marketplace::You do not have enough balance",

  // HANDLE BACK TOKEN
  NOT_REVOKED_721: "Marketplace::Marketplace approve are not revoked",
  NOT_REVOKED_1155: "Marketplace::Marketplace approve are not revoked",
};

const NFT1155PoolMsg = {
  NOT_VALID_COLLECTION: "NFT1155Pool::The collection is not valid",
  NOT_VALID_TOKEN: "NFT1155Pool::The start tokenId or end tokenId is not valid",
  INVALID_AMOUNT: "NFT1155Pool::The amount is not valid",
  INVALID_SUPPLY: "NFT1155Pool::The supply is not valid",
  INSUFFICIENT_BALANCE:
    "NFT1155Pool::The amount plus used supply should be less than actual supply",
  INVALID_ADDRESS: "NFT1155Pool::Not valid address",
};

const NonMinted1155ErrorMsg = {
  SELL_UNIT_IS_LARGER:
    "NonMinted1155Marketplace::Sell unit is larger than listed amount",
  INVALID_LISTED_AMOUNT:
    "NonMinted1155Marketplace::There are not any item to sell",
  INVALID_SELL_UNIT: "NonMinted1155Marketplace::At least one item to sell",
  SOLD_NFT: "NonMinted1155Marketplace::Sold listing NFT cannot be edit",
  EXCEED_SELL: "NonMinted1155Marketplace::Exceed sell limit",
  INVALID_STATUS_TO_SELL:
    "NonMinted1155Marketplace::Listed NFT has not valid status",
  ACTIVE_ORDER: "NonMinted1155Marketplace::Cannot cancel active offer",
  INSUFFICIENT_TOKEN_BALANCE:
    "NonMinted1155Marketplace::Insufficient token balance",
  NOT_COEFFICIENT_OF_SELL_UNIT:
    "NonMinted1155Marketplace::Listed amount is not a coefficient of sell unit",
  LOW_LISTED_AMOUNT:
    "NonMinted1155Marketplace::Listed amount is less than already listed amount",
  INVALID_SELL: "NonMinted1155Marketplace::The sell does not exist",
  INSUFFICIENT_VESTED_BALANCE:
    "NonMinted1155Marketplace::Insufficient vested balance",
  INVALID_TOKEN: "NonMinted1155Marketplace::Collection is not active",
  INVALID_FLOOR_PRICE: "NonMinted1155Marketplace::The floor Price is not valid",
  INVALID_Collection: "NonMinted1155Marketplace::The collection is not valid",
  INVALID_PRICE:
    "NonMinted1155Marketplace::Price should be greater than floor price",
  NOT_VALID_COLLECTION: "NonMinted1155Marketplace::The collection is not exist",
  NOT_VALID_ADDRESS: "NonMinted1155Marketplace::Not valid address",
  NOT_VALID_DISCOUNT: "NonMinted1155Marketplace::The discount is not valid",
  NOT_VALID_DISCOUNT_CAP:"NonMinted1155Marketplace::Invalid discount cap",
  NOT_VALID_DISCOUNT_USAGE_LIMIT:"NonMinted1155Marketplace::Invalid usage limit",
};

const Minted1155ErrorMsg = {
  INSUFFICIENT_BALANCE: "Minted1155Marketplace::You do not have enough balance",
  HAS_NOT_ACCESS: "Minted1155Marketplace::Marketplace has not access",
  INVALID_QUANTITY: "Minted1155Marketplace::At least one item to sell",
  NOT_NFT_OWNER: "Minted1155Marketplace::You are not owner",
  CAN_NOT_EDIT: "Minted1155Marketplace::listing NFT cannot be edit",
  EXCEED_SELL: "Minted1155Marketplace::Exceed sell limit",
  INVALID_STATUS_TO_SELL: "Minted1155Marketplace::Sell has invalid status",
  NOT_REVOKED: "Minted1155Marketplace::Marketplace approve are not revoked",
  NOT_OWNER_CANCEL: "Minted1155Marketplace::You are not owner",
  SOLD_SELL: "Minted1155Marketplace::Cannot cancel sold NFT",
  INSUFFICIENT_TOKEN_BALANCE:
    "Minted1155Marketplace::Insufficient token balance",
  UNSUCCESSFUL_TRANSFER: "Minted1155Marketplace::Unsuccessful transfer",
  INVALID_SELL: "Minted1155Marketplace::The sell does not exist",
  INVALID_PRICE: "Minted1155Marketplace::Invalid price",
};

const NFT721PoolMsg = {
  NOT_VALID_COLLECTION: "NFT721Pool::The collection is not valid",
  NOT_VALID_TOKEN: "NFT721Pool::The start tokenId or end tokenId is not valid",
  INVALID_SUPPLY: "NFT721Pool::The supply is not valid",
  INSUFFICIENT_BALANCE: "NFT721Pool::There is no supply for this token",
  INVALID_ADDRESS: "NFT721Pool::Not valid address",
};

const NonMinted721ErrorMsg = {
  INVALID_TOKEN: "NonMinted721Marketplace::Collection is not active",
  ACTIVE_ORDER: "NonMinted721Marketplace::Cannot cancel active offer",
  SOLD_NFT: "NonMinted721Marketplace::Sold NFT cannot be edit",
  INVALID_STATUS_TO_SELL:
    "NonMinted721Marketplace::Listed NFT has not valid status",
  UNSUCCESSFUL_TRANSFER: "NonMinted721Marketplace::Unsuccessful transfer",
  INVALID_SELL: "NonMinted721Marketplace::The sell does not exist",
  INSUFFICIENT_VESTED_BALANCE:
    "NonMinted721Marketplace::Insufficient vested balance",
  INVALID_PRICE:
    "NonMinted721Marketplace::Price should be greater than floor price",
  NOT_VALID_COLLECTION: "NonMinted721Marketplace::The collection is not exist",
  NOT_VALID_ADDRESS: "NonMinted721Marketplace::Not valid address",
  NOT_VALID_DISCOUNT: "NonMinted721Marketplace::The discount is not valid",
  NOT_VALID_DISCOUNT_CAP:"NonMinted721Marketplace::Invalid discount cap",
  NOT_VALID_DISCOUNT_USAGE_LIMIT:"NonMinted721Marketplace::Invalid usage limit",
  NOT_ACTIVE_COLLECTION:"NonMinted721Marketplace::Collection is not active"
};

const Minted721ErrorMsg = {
  NOT_VALID_ADDRESS: "Minted721Marketplace::Not valid address",
  INVALID_TOKEN: "Minted721Marketplace::Token contract is invalid",
  NOT_NFT_OWNER: "Minted721Marketplace::You are not owner",
  CAN_NOT_EDIT: "Minted721Marketplace::listing NFT cannot be edit",
  CANCEL_ACTIVE: "Minted721Marketplace::Cannot cancel active offer",
  NOT_REVOKED: "Minted721Marketplace::Marketplace approve are not revoked",
  HAS_NOT_ACCESS: "Minted721Marketplace::Marketplace has not access",
  SOLD_NFT: "Minted721Marketplace::Sold NFT cannot be edit",
  UNSUCCESSFUL_TRANSFER: "Minted721Marketplace::Unsuccessful transfer",
  SOLD_SELL: "Minted721Marketplace::Cannot cancel sold NFT",
  INVALID_STATUS_TO_SELL:
    "Minted721Marketplace::Listed NFT has not valid status",
  INVALID_SELL: "Minted721Marketplace::The sell does not exist",
  INVALID_PRICE: "Minted721Marketplace::Invalid price",
};

const AssetMarketplaceErrorMsg = {
  INVALID_EXPIRE_DATE: "AssetMarketplace::Expiration date is invalid",
  UNSUCCESSFUL_TRANSFER: "AssetMarketplace::Unsuccessful transfer",
  NO_BALANCE: "AssetMarketplace::No balance to withdraw",
  LOW_AMOUNT: "AssetMarketplace::Insufficient amount, equal to zero",
  ACTIVE_ORDER: "AssetMarketplace::Cannot cancel active offer",
  INVALID_STATUS: "AssetMarketplace::Listed asset has not valid status",
  SOLD_ASSET: "AssetMarketplace::Sold listing asset cannot be edit",
  ALLOWANCE: "AssetMarketplace::Allowance error",
  UNSUCCESSFUL_TRANSFER_BUY: "AssetMarketplace::Unsuccessful transfer",
  INSUFFICIENT_VESTED_BALANCE: "AssetMarketplace::Insufficient vested balance",
  HAS_EXPIRED: "AssetMarketplace::The sale has expired",
  FUEL_CANNOT_BE_SOLD: "AssetMarketplace::Fuel cannot be sold",
  INSUFFICIENT_LRT_BALANCE: "AssetMarketplace::Insufficient token balance",
  ORDER_ALREADY_FUL_FILLED: "AssetMarketplace::Order already fulfilled",
  SELL_UNIT_IS_LARGER:
    "AssetMarketplace::Sell unit is larger than listed amount",
  INVALID_LISTED_AMOUNT: "AssetMarketplace::There are not any item to sell",
  NOT_COEFFICIENT_OF_SELL_UNIT:
    "AssetMarketplace::Listed amount is not a coefficient of sell unit",
  INVALID_SELL_UNIT: "AssetMarketplace::At least one item to sell",
  EXCEED_SELL: "AssetMarketplace::Exceed sell limit",
};

const BlueprintMarketplaceErrorMsg = {
  INVALID_EXPIRE_DATE: "BlueprintMarketplace::Expiration date is invalid",
  UNSUCCESSFUL_TRANSFER: "BlueprintMarketplace::Unsuccessful transfer",
  NO_BALANCE: "BlueprintMarketplace::No balance to withdraw",
  LOW_AMOUNT: "BlueprintMarketplace::Insufficient amount, equal to zero",
  ACTIVE_ORDER: "BlueprintMarketplace::Cannot cancel active offer",
  INVALID_STATUS: "BlueprintMarketplace::Listed blueprint has not valid status",
  SOLD_ASSET: "BlueprintMarketplace::Sold listing blueprint cannot be edit",
  ALLOWANCE: "BlueprintMarketplace::Allowance error",
  UNSUCCESSFUL_TRANSFER_BUY: "BlueprintMarketplace::Unsuccessful transfer",
  INSUFFICIENT_VESTED_BALANCE:
    "BlueprintMarketplace::Insufficient vested balance",
  HAS_EXPIRED: "BlueprintMarketplace::The sale has expired",
  FUEL_CANNOT_BE_SOLD: "BlueprintMarketplace::Fuel cannot be sold",
  INSUFFICIENT_LRT_BALANCE: "BlueprintMarketplace::Insufficient token balance",
  ORDER_ALREADY_FUL_FILLED: "BlueprintMarketplace::Order already fulfilled",
  SELL_UNIT_IS_LARGER:
    "BlueprintMarketplace::Sell unit is larger than listed amount",
  INVALID_LISTED_AMOUNT: "BlueprintMarketplace::There are not any item to sell",
  NOT_COEFFICIENT_OF_SELL_UNIT:
    "BlueprintMarketplace::Listed amount is not a coefficient of sell unit",
  INVALID_SELL_UNIT: "BlueprintMarketplace::At least one item to sell",
  EXCEED_SELL: "BlueprintMarketplace::Exceed sell limit",
};

const PlanetStakeErrorMsg = {
  AMOUNT_EXCEED: "PlanetStake::There is not token to claim",
  IS_NOT_WHITE_LISTED: "PlanetStake::This token cannot be stake",
  APPROVED_ERROR: "PlanetStake::Stake has not access",
  INSUFFICIENT_BALANCE: "PlanetStake::You do not have enough balance",
  AMOUNT_TOO_LOW: "PlanetStake::Insufficient amount, equal to zero",
  INVALID_TOKEN_ADDRESS: "PlanetStake::NFT address is invalid",
  INVALID_REWARD_AMOUNT: "PlanetStake::Reward Amount is not valid",
  INVALID_STAKER: "PlanetStake::You are not staker",
  USER_INSUFFICIENT_BALANCE: "PlanetStake::User has not enough balance",
  INVALID_CLAIMABLE_AMOUNT:
    "PlanetStake::Claimable amount should not be more than user's quantity",
};

const PlanetCraftErrorMsg = {
  NOT_VALID_ADDRESS: "PlanetCraft::Not valid address",
  TOO_LOW_CRAFT_FEE: "PlanetCraft::Insufficient craft fee, equal to zero",
  UNSUCCESSFUL_TRANSFER: "PlanetCraft::Unsuccessful transfer",
  INSUFFICIENT_VESTED_BALANCE: "PlanetCraft::Insufficient vested balance",
  TOO_LOW_AMOUNT: "PlanetCraft::Insufficient amount, equal to zero",
  NO_BALANCE_WITHDRAW: "PlanetCraft::No balance to withdraw",
  INVALID_CRAFT: "PlanetCraft::The craft does not exist",
  ALLOWANCE_ERROR: "PlanetCraft::Allowance error",
  INVALID_COLLECTION: "PlanetCraft::Collection is not active",
};

const GameErrorMsg = {
  PLANET_NOT_EXIST: "Game::Planet is not exist",
  PLANET_ADDED_BEFORE: "Game::Planet is added before",
  MAXIMUM_LIMIT: "Game::Miner has reached to maximum limit",
  MINING_NOT_ALLOWED: "Game::Miner has not allow to mine",
  ALREADY_WON: "Game::Miner already won once",
  PLANET_BURNT: "Game::The planet has burnt",
  USER_BLOCK_LIMIT_INVALID:
    "Game::Total blocks should be more than user blocks limit",
  GAME_INVALID_ADDRESS: "Game::Not valid address",
  INVALID_GAME_DATA: "Game::Invalid planet data",
  NOT_STAKED: "Game::Insufficient staked planet balance",
  INSUFFICIENT_CONTRACT_BALANCE: "Game::Insufficient contract balance",
  UNSUCCESSFUL_TRANSFER: "Game::Unsuccessful transfer",
};

const LRTStakingErrorMsg = {
  INVALID_DURATION: "LRTStaking::Invalid duration",
  INVALID_AMOUNT: "LRTStaking::Amount must be greater than the threshold",
  EXCEED_CAPACITY: "LRTStaking::Stake exceed capacity",
  EXCEED_DURATION_LIMIT: "LRTStaking::Stake exceed duration limit",
  STAKING_NOT_FINISHED: "LRTStaking::Staking period not yet finished",
  NO_STAKING: "LRTStaking::You do not have any staking",
  INSUFFICIENT_CONTRACT_BALANCE: "LRTStaking::Contract has not enough balance",
  UNSUCCESSFUL_TRANSFER: "LRTStaking::Unsuccessful transfer",
  FULLY_CLAIMED: "LRTStaking::The staking schedule is fully claimed",
};

module.exports = {
  AccessErrorMsg,
  LRTErrorMsg,
  LRTVestingErrorMsg,
  SaleErrorMsg,
  LRMessage,
  LR721Message,
  LR1155Message,
  MarketplaceErrorMsg,
  NFT1155PoolMsg,
  NonMinted1155ErrorMsg,
  Minted1155ErrorMsg,
  NFT721PoolMsg,
  NonMinted721ErrorMsg,
  Minted721ErrorMsg,
  AssetMarketplaceErrorMsg,
  PlanetStakeErrorMsg,
  BlueprintMarketplaceErrorMsg,
  LRTDistroErrorMsg,
  PlanetCraftErrorMsg,
  GameErrorMsg,
  LRTVestingTeamErrorMsg,
  LRTStakingErrorMsg,
};
