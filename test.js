const Web3 = require('web3')

const projectid = ''
const web3 = new Web3('https://mainnet.infura.io/v3/' + projectid)

const ABI = require("./ABI.json")
const ETHEREUM_CONTRACT_ADDRESS = '0xde2942B52e75c327AD4ddD6C7Db7c398fED6199F'
const token_uri_checker_function = "tokenURI";

let instance = new web3.eth.Contract(ABI, ETHEREUM_CONTRACT_ADDRESS)

main();
async function main() {
  instance.methods[token_uri_checker_function](5).call().then(async function (result) {
    console.log(result)
    resolveLink(result);




  })
}


const resolveLink = (url) => {
  if (!url || !url.includes("ipfs://")) return url;
  return url.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");
};