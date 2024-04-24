const Moralis = require("moralis/node");
const { timer } = require("rxjs");

const serverUrl = ""; //Moralis Server Url here
const appId = ""; //Moralis Server App ID here
Moralis.start({ serverUrl, appId });

const resolveLink = (url) => {
    if (!url || !url.includes("ipfs://")) return url;
    return url.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");
};

const collectionAddress = "0x69B9C98e8D715C25B330d0D4eB07e68CbB7F6CFC"; //Collection Address Here
let asset_url_arr = [];

function generate_asset_url(arr) {
    for (let i = 0; i < arr.length && i < 100; i++) {
        asset_url = "https://opensea.io/assets/" + collectionAddress + "/" + arr[i];
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

async function generateRarity() {
    const NFTs = await Moralis.Web3API.token.getAllTokenIds({
        address: collectionAddress,
    });

    const totalNum = NFTs.total;
    const pageSize = NFTs.page_size;
    console.log(totalNum);
    console.log(pageSize);
    let allNFTs = NFTs.result;

    console.log(JSON.stringify(allNFTs));
    
    /*
    for (let i = pageSize; i < totalNum; i = i + pageSize) {
        console.log("Received data " + i);
        console.timeLog();
        console.log("");
        const NFTs = await Moralis.Web3API.token.getAllTokenIds({
            address: collectionAddress,
            offset: i,
        });
        allNFTs = allNFTs.concat(NFTs.result);

        await sleep(1000);
    }*/

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

    return nftArr;
}

async function getOrder (id) {//ERROR, needs OS api key....-
    await sleep(100);
    const response = await Moralis.Plugins.opensea.getOrders({
        network: "mainnet",
        tokenAddress: collectionAddress,
        tokenId: id,
        orderSide: 1, // 0 is for buy orders, 1 is for sell orders
        page: 1, // pagination shows 20 orders each page
    });
    console.log(JSON.stringify(response));
    if(response.count>0){
        let listeditem =[response.result[0].currentPrice,"https://opensea.io/assets/" + collectionAddress + "/" + id];
        return listeditem;
    }
};

generateRarity()
    .then((result) => {
        let raretokens = [];
        for (let i = 0; i < result.length; i++) {
            raretokens.push(result[i].token_id);
            if (result[i].token_id==9039)
            console.log(""); console.log("9039 is ranked " + i+1); console.log("");
            //listeditem = getOrder(raretokens[i]);
            //console.log(listeditem[1]+" is listed for "+listeditem[0]/(Math.pow(10,18))+" ETH");
        }
        //console.log(raretokens);
        generate_asset_url(raretokens);
    })
    .catch((error) => { console.log(error); console.log(JSON.stringify(error));
     })