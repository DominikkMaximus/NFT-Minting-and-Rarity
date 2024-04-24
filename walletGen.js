const Web3 = require("web3");
const fs = require('fs');
const projectid = "";//infura api key (user supplys his own free key?)
const web3 = new Web3('https://mainnet.infura.io/v3/' + projectid)

class walletGen {
    static generateWallet() {
        return web3.eth.accounts.create(); //returns object {address: string, privateKey: string}
    }
    static generateWallets(amount) {
        let r = Math.random();
        let wallets = [];
        for (let i = 0; i < amount; i++) {
            let str = walletGen.generateWallet();
            wallets.push(str)
        }
        fs.writeFileSync(`ETHwallets${r}.json`, JSON.stringify(wallets));
    }
}
//module.exports = walletGen;

walletGen.generateWallets(2000);

//walletGen.generateWallets(10);