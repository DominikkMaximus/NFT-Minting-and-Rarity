const Web3 = require("web3");
const axios = require("axios");
const projectid = "";
const web3 = new Web3("https://mainnet.infura.io/v3/" + projectid);

const ABI = require("./abi.json");
/*
const isPausedFunctionState = 'false'//current status of the read value that represents if minting is open
const mint_value_name = 'paused'//name of the read value that represents if minting is open
const mintfunction = 'mint' //name of minting function

const ABI = require("./ABI.json")
const ETHEREUM_ADDRESS = ''//wallet address
const ETHEREUM_PRIVATE_KEY = ''//private wallet key
const ETHEREUM_CONTRACT_ADDRESS = '0xde2942B52e75c327AD4ddD6C7Db7c398fED6199F'
const ETHEREUM_GAS_LIMIT = 500000//gas limit
const AMOUNT_TO_MINT = 1
const PRICE = 0.05//in eth, number data type
*/
//const contract = new web3.eth.Contract(ABI, ETHEREUM_CONTRACT_ADDRESS);

class mintingFunctions {
  static async mint(amount, publicKey, privateKey, contractAddress, abi, price, gasLimit, mintfunction, mode, baseFee, priorityFee) {
    try {
      let nonce = await web3.eth.getTransactionCount(publicKey, "pending");
      const contract = new web3.eth.Contract(abi, contractAddress);
      let contractFunction = contract.methods[mintfunction](amount).encodeABI();
      let gasPrice = {
        maxFeePerGas: baseFee,
        maxPriorityFeePerGas: priorityFee,
      };

      if (mode == "auto") {
        let gass = await axios.get("https://api.blocknative.com/gasprices/blockprices", {
          headers: {
            Authorization: "c02fb181-87c4-",
          },
        });
        gasPrice = gass.data.blockPrices[0].estimatedPrices[0];
      }

      console.log(gasPrice);
      const eip1559Transaction = {
        to: contractAddress,
        type: 2,
        maxFeePerGas: (Math.ceil(gasPrice.maxFeePerGas) * 1000000000).toString(), //ethers.BigNumber.from(gasPrice).add(maxBaseFeeInFutureBlock),
        maxPriorityFeePerGas: (Math.ceil(gasPrice.maxPriorityFeePerGas) * 1000000000).toString(),
        gasLimit: gasLimit,
        data: contractFunction,
        nonce: nonce,
        value: web3.utils.toWei((amount * price).toString()),
        chainId: 1, //mainnet : 1, rinkeby : 4, but best to get data from rpc
      };
      console.log(JSON.stringify(eip1559Transaction));
      console.log("SingingTransaction");
      const tx = await web3.eth.accounts.signTransaction(eip1559Transaction, privateKey);
      console.log("TransactionSigned");
      console.log(JSON.stringify(tx));
      const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction); //it works now
      console.log("TransactionSent");
      console.log(receipt);
      //console.log(await receipt.receipts());
      //console.log(await receipt.simulate());
    } catch (e) {
      console.log(e);
    }
  }
}

class contractMonitor {
  static async openMint(isPausedFunctionState, mint_value_name, abi, contractAddress, delay) {
    const contract = new web3.eth.Contract(abi, contractAddress);
    contract.methods[mint_value_name]()
      .call()
      .then(async function (result) {
        console.log(result);
        console.log(isPausedFunctionState.toLowerCase());
        if (result.toString().toLowerCase() != isPausedFunctionState.toLowerCase()) {
          //check if minting is open
          console.log("Minting is open");
          //mintingFunctions.mint(AMOUNT_TO_MINT, ETHEREUM_ADDRESS, ETHEREUM_PRIVATE_KEY, contractAddress, abi, PRICE, ETHEREUM_GAS_LIMIT);//parameters need to be passed in or somethjing at the tasks logic
          //mint, should add to mint with all wallets added to the task, when task logic is made
        } else {
          console.log("Minting is closed");
          console.log(result);
          await contractMonitor.sleep(delay);
          contractMonitor.openMint();
        }
      });
  }

  static sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
const wallets = [{ publicKey: "0x5dCf92a", privateKey: "30d75dfc4", mode: "manual", baseFee: 100, priorityFee: 60 }];
const contract = "0x5E6d4682Caf7E62A64CFdd0b3476B60Fa2D2397A";
const mintPrice = 0; //ether
const amountPerWallet = 1;
const mintFunction = "pulicMint";
for (let i = 0; i < wallets.length; i++) {
  try {
    mintingFunctions.mint(
      amountPerWallet,
      wallets[i].publicKey,
      wallets[i].privateKey,
      contract,
      ABI,
      mintPrice,
      3000000,
      mintFunction,
      wallets[i].mode,
      wallets[i].baseFee,
      wallets[i].priorityFee
    );
  } catch (error) {
    console.log(error);
  }
}
module.exports = contractMonitor;
module.exports = mintingFunctions;
