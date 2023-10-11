const { getMessage } = require("eip-712");
const { ecsign } = require("ethereumjs-util");

async function createMsgWithSig(
  assetMarketplaceInstance,
  privateKey,
  orderIdHash,
  status,
  assetType,
  expireDate,
  price,
  quantity
) {
  const msgParams = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      fullFillOrder: [
        { name: "orderIdHash", type: "bytes32" },
        { name: "status", type: "uint32" },
        { name: "assetType", type: "uint8" },
        { name: "expireDate", type: "uint64" },
        { name: "price", type: "uint256" },
        { name: "quantity", type: "uint256" },
      ],
    },
    //make sure to replace verifyingContract with address of deployed contract
    primaryType: "fullFillOrder",
    domain: {
      name: "AssetMarketplace",
      version: "1",
      chainId: 31337,
      verifyingContract: assetMarketplaceInstance.address,
    },
    message: {
      orderIdHash: orderIdHash,
      status: status,
      assetType: assetType,
      expireDate: expireDate,
      price: price,
      quantity: quantity,
    },
  };

  const message = getMessage(msgParams, true);

  const { r, s, v } = ecsign(Buffer.from(message), privateKey);

  return { r, s, v };
}

module.exports = {
  createMsgWithSig,
};
