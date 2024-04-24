const Web3 = require('web3');
const axios = require('axios');
const fs = require('fs');
const projectid = ''
const web3 = new Web3('https://mainnet.infura.io/v3/' + projectid)

const ABI = require("./ABI.json")
const ETHEREUM_CONTRACT_ADDRESS = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'
const token_uri_checker_function = "tokenURI";
const totalNum = 100;
const ratio = 0.97;

let instance = new web3.eth.Contract(ABI, ETHEREUM_CONTRACT_ADDRESS)

const resolveLink = (url) => {
    if (!url || !url.includes("ipfs://")) return url;
    return url.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");//get faster gateway
};

let asset_url_arr = [];

function generate_asset_url(arr) {
    for (let i = 0; i < arr.length && i < 100; i++) {
        asset_url = "https://opensea.io/assets/" + ETHEREUM_CONTRACT_ADDRESS + "/" + arr[i];
        if (asset_url_arr.indexOf(asset_url) === -1) {
            asset_url_arr.push(asset_url);
            console.log(asset_url);
        }
    }
}

console.time();

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

let allNFTs = [];

getData();

async function getData() {
    for (let i = 1; i < totalNum; i++) {
        instance.methods[token_uri_checker_function](i).call().then(async function (result) {
            console.log(result)
            axios.get(resolveLink(result))
                .then(async function (response) {
                    console.log("Received data " + i);
                    console.timeLog();
                    console.log("");
                    const NFTs = response.data;
                    allNFTs = allNFTs.concat(NFTs);
                }).catch(function (error) {
                    console.log(error);
                });
        });
        await sleep(10);
    }
    waitforData();
    console.log(JSON.stringify(allNFTs));//needs to continue when all promises are met
}

async function waitforData() {
    console.log("waiting for data");
    while (allNFTs.length <= totalNum * ratio || allNFTs.length === undefined) {
        console.log(allNFTs.length);
        await sleep(10);
    }
    console.log("data received");
    console.log(allNFTs);
    let tmp = [];
    for (let i = 0; i < allNFTs.length; i++)
        if (allNFTs[i].attributes !== undefined)
            tmp.push(allNFTs[i]);
    console.log(allNFTs);//SOME ARE UNDEFINED (WHY?)
    allNFTs = tmp;
    for (let i = 0; i < allNFTs.length; i++)
        console.log(JSON.stringify(allNFTs[i]));
    generateRarity(allNFTs)
        .then((result) => {
            let raretokens = [];
            for (let i = 0; i < result.length; i++) {
                raretokens.push(result[i].token_id);
                //listeditem = getOrder(raretokens[i]);
                //console.log(listeditem[1]+" is listed for "+listeditem[0]/(Math.pow(10,18))+" ETH");
            }
            //console.log(raretokens);
            generate_asset_url(raretokens);
        })
        .catch((error) => {
            console.log(error); console.log(JSON.stringify(error));
        })
}

async function generateRarity(allNFTs) {

    let metadata = allNFTs.map((e) => JSON.parse(e.metadata).attributes);
    console.log(JSON.stringify(metadata));

    let tally = { TraitCount: {} };

    for (let j = 0; j < metadata.length; j++) {
        let nftTraits = metadata[j].map((e) => e.trait_type);
        let nftValues = metadata[j].map((e) => e.value);

        let numOfTraits = nftTraits.length;

        if (tally.TraitCount[numOfTraits]) {
            tally.TraitCount[numOfTraits]++;
        } else {
            tally.TraitCount[numOfTraits] = 1;
        }

        for (let i = 0; i < nftTraits.length; i++) {
            let current = nftTraits[i];
            if (tally[current]) {
                tally[current].occurences++;
            } else {
                tally[current] = { occurences: 1 };
            }

            let currentValue = nftValues[i];
            if (tally[current][currentValue]) {
                tally[current][currentValue]++;
            } else {
                tally[current][currentValue] = 1;
            }
        }
    }

    const collectionAttributes = Object.keys(tally);
    let nftArr = [];
    for (let j = 0; j < metadata.length; j++) {
        let current = metadata[j];
        let totalRarity = 0;
        for (let i = 0; i < current.length; i++) {
            let rarityScore =
                1 / (tally[current[i].trait_type][current[i].value] / totalNum);
            current[i].rarityScore = rarityScore;
            totalRarity += rarityScore;
        }

        let rarityScoreNumTraits =
            8 * (1 / (tally.TraitCount[Object.keys(current).length] / totalNum));
        current.push({
            trait_type: "TraitCount",
            value: Object.keys(current).length,
            rarityScore: rarityScoreNumTraits,
        });
        totalRarity += rarityScoreNumTraits;

        if (current.length < collectionAttributes.length) {
            let nftAttributes = current.map((e) => e.trait_type);
            let absent = collectionAttributes.filter(
                (e) => !nftAttributes.includes(e)
            );

            absent.forEach((type) => {
                let rarityScoreNull =
                    1 / ((totalNum - tally[type].occurences) / totalNum);
                current.push({
                    trait_type: type,
                    value: null,
                    rarityScore: rarityScoreNull,
                });
                totalRarity += rarityScoreNull;
            });
        }

        if (allNFTs[j].metadata) {
            allNFTs[j].metadata = JSON.parse(allNFTs[j].metadata);
            allNFTs[j].image = resolveLink(allNFTs[j].metadata.image);
        } else if (allNFTs[j].token_uri) {
            try {
                await fetch(allNFTs[j].token_uri)
                    .then((response) => response.json())
                    .then((data) => {
                        allNFTs[j].image = resolveLink(data.image);
                    });
            } catch (error) {
                console.log(error);
            }
        }

        nftArr.push({
            Attributes: current,
            Rarity: totalRarity,
            token_id: allNFTs[j].token_id,
            image: allNFTs[j].image,
        });
    }

    nftArr.sort((a, b) => b.Rarity - a.Rarity);

    //console.log(JSON.stringify(nftArr));
    fs.writeFileSync(`BAYC.json`, JSON.stringify(nftArr));


    return nftArr;
}
/*
async function getOrder(id) {//ERROR, needs OS api key....-
    await sleep(100);
    const response = await Moralis.Plugins.opensea.getOrders({
        network: "mainnet",
        tokenAddress: ETHEREUM_CONTRACT_ADDRESS,
        tokenId: id,
        orderSide: 1, // 0 is for buy orders, 1 is for sell orders
        page: 1, // pagination shows 20 orders each page
    });
    console.log(JSON.stringify(response));
    if (response.count > 0) {
        let listeditem = [response.result[0].currentPrice, "https://opensea.io/assets/" + ETHEREUM_CONTRACT_ADDRESS + "/" + id];
        return listeditem;
    }
};
*/
