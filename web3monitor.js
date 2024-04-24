const Web3 = require('web3')
const projectid = ''
const web3 = new Web3('https://mainnet.infura.io/v3/' + projectid);

const {mintingFunctions}= require("./")

const isPausedFunctionState = 'false'//current status of the read value that represents if minting is open
const mint_value_name = 'paused'//name of the read value that represents if minting is open

const ABI = require("./ABI.json")
const ETHEREUM_CONTRACT_ADDRESS = '0xde2942B52e75c327AD4ddD6C7Db7c398fED6199F'

class contractMonitor {
    static async openMint(isPausedFunctionState, mint_value_name, ABI, ETHEREUM_CONTRACT_ADDRESS, delay) {
        const contract = new web3.eth.Contract(ABI, ETHEREUM_CONTRACT_ADDRESS);
        contract.methods[mint_value_name]().call()
            .then(async function (result) {
                console.log(result)
                console.log(isPausedFunctionState.toLowerCase())
                if (result.toString().toLowerCase() != isPausedFunctionState.toLowerCase()) {//check if minting is open
                    console.log('Minting is open')
                    mintingFunctions.mint(AMOUNT_TO_MINT)
                }
                else {
                    console.log('Minting is closed')
                    console.log(result)
                    await contractMonitor.sleep(delay)
                    contractMonitor.openMint();
                }
            })
    }



    static sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

module.exports= contractMonitor;