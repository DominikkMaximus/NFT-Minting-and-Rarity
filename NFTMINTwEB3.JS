const Web3 = require('web3')
const axios = require('axios');
const projectid = ''
const web3 = new Web3('https://mainnet.infura.io/v3/' + projectid);

const { providers, Wallet, Signer } = require("ethers");
const provider = new providers.JsonRpcProvider({ url: 'https://mainnet.infura.io/v3/' }, 1)

const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

const paused = 'false'//current status of the read value that represents if minting is open
const mint_value_name = 'paused'//name of the read value that represents if minting is open
const mintfunction = 'mint' //name of minting function

const ABI = [];//require("./ABI.json")
const ETHEREUM_ADDRESS = ''//wallet address
const ETHEREUM_PRIVATE_KEY = ''//private wallet key
const ETHEREUM_CONTRACT_ADDRESS = '0xde2942B52e75c327AD4ddD6C7Db7c398fED6199F'
const ETHEREUM_GAS_LIMIT = 500000//gas limit
const AMOUNT_TO_MINT = 1
const price = 0.05//in eth, number data type

const contract = new web3.eth.Contract(ABI, ETHEREUM_CONTRACT_ADDRESS);

//define signer 


//main();
/*async function main() {//don't use recursion!!!!!!!!!!!!
    instance.methods[mint_value_name]().call().then(async function (result) {
        console.log(result)
        console.log(paused.toLowerCase())
        if (result.toString().toLowerCase() != paused.toLowerCase()) {//check if minting is open
            console.log('Minting is open')
            mint(AMOUNT_TO_MINT)
        }
        else {
            console.log('Minting is closed')
            console.log(result)
            await sleep(1000)
            return main();
        }
    })
}*/

async function mint(amount) {
    let nonce = await web3.eth.getTransactionCount(ETHEREUM_ADDRESS, 'pending');
    let contractFunction = contract.methods[mintfunction](amount).encodeABI();

    const targetBlockNumber = (await provider.getBlockNumber()) + 1
    const block = await provider.getBlock(targetBlockNumber - 1)

    const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 2)
    let gasPrice = await getGasPrice()

    const eip1559Transaction = {
        to: ETHEREUM_CONTRACT_ADDRESS,
        type: 2,
        maxFeePerGas: gasPrice.maxFeePerGas, //ethers.BigNumber.from(gasPrice).add(maxBaseFeeInFutureBlock),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
        gasLimit: ETHEREUM_GAS_LIMIT,
        data: contractFunction,
        nonce: nonce,
        value: web3.utils.toWei((amount * price).toString()),
        chainId: 1
    }
    const transaction = await Signer.sendTransaction(eip1559Transaction);


    // const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
    // const simulation = await flashbotsProvider.simulate(signedTransactions, targetBlockNumber)
    // console.log(JSON.stringify(simulation, null, 2))

    console.log(transaction)
    console.log(await transaction.receipts())
    console.log(await transaction.simulate())
}

async function getGasPrice() {
    axios.get("https://api.blocknative.com/gasprices/blockprices", {
        headers: {
            "Authorization": "c02fb181-87c4-4193-b607-6d3a0883e142"
        }
    })
        .then(function (response) {
            console.log(JSON.stringify(response.data.blockPrices[0].estimatedPrices[0]));
            return response.data.blockPrices[0].estimatedPrices[0];
        })
        .catch(function (error) {
            console.log(error);
        });
}


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}