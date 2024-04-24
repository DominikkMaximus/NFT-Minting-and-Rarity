import * as Web3 from 'web3';
import { OpenSeaPort, Network } from 'opensea-js';
import { OrderSide } from 'opensea-js/lib/types.js';

let token_idss = [2976, 604, 2173, 3044, 3468, 4015, 5304, 6750, 7086, 4122, 8349, 8372, 6935, 8200, 7200, 5170, 3653, 3850, 8674, 6135, 8150, 6422, 4630, 8068, 4017, 1183, 591, 2191, 5571, 6313, 684, 3693, 4187, 5868, 8065, 8078, 7491, 8429, 1981, 7187, 8656, 8489, 5547, 6827, 5654, 6765, 3820, 478, 6574, 7005, 4571, 8249, 282, 243, 5609, 1667, 3529, 3623];
let tokenAddress = "0x219b8ab790decc32444a6600971c7c3718252539";
// This example provider won't let you make transactions, only read-only calls:
const provider = new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/');

const seaport = new OpenSeaPort(provider, {
  networkName: Network.Main,
  //apiKey: YOUR_API_KEY
});

// Get offers (bids), a.k.a. orders where `side == 0`
const { orders, count } = await seaport.api.getOrders({
  asset_contract_address: tokenAddress,
  token_ids: token_idss,
  side: OrderSide.Buy
});

console.log("orders " + orders);
console.log("count" + count);


/*
// Get page 2 of all auctions, a.k.a. orders where `side == 1`
const { orders, count } = await seaport.api.getOrders({
  asset_contract_address: tokenAddress,
  token_id: token_id,
  side: OrderSide.Sell
}, 2)
*/