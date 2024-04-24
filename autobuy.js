const MoralisProvider =require("react-moralis");

const getOrder = async () => {
    const res = await Moralis.Plugins.opensea.getOrders({
        network: "testnet",
        tokenAddress: values.tokenAddress,
        tokenId: values.tokenId,
        orderSide: 1, // 0 is for buy orders, 1 is for sell orders
        page: 1, // pagination shows 20 orders each page
    });
    console.log(res);
};