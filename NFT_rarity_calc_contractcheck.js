const axios = require('axios');
const axiosRetry = require('axios-retry');
const Web3 = require('web3');
const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.time();

const projectid = ''
const web3 = new Web3('https://mainnet.infura.io/v3/' + projectid)

const ABI = require("./ABI.json")
const ETHEREUM_CONTRACT_ADDRESS = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'
const token_uri_checker_function = "tokenURI";
const totalNum = 10;
let ratio = 0.975;
let include_attributes_count = true;

let instance = new web3.eth.Contract(ABI, ETHEREUM_CONTRACT_ADDRESS)

const resolveLink = (url) => {
    if (!url || !url.includes("ipfs://")) return url;
    return url.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");//get faster gateway
};

let request_arr = [], data_arr = [], one_of_one_arr = [], attributes_value = [], rarity_arr = [], score_arr = [], attributes_counts_arr = [],  id_arr = [];

let info, value1 = 0, calculated_count = 0, attributes_count = 0;

let listings_url = "https://api.opensea.io/wyvern/v1/orders?asset_contract_address=";

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

axiosRetry(axios, {// if request fails rety 3 times
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
        console.log(`retry attempt: ${retryCount}`);
        return retryCount * (Math.random() * 2000); // time interval between retries
    },
});
const agent = new https.Agent({
    rejectUnauthorized: false,
    requestCert: true,
})
/*
function generate_asset_url(arr) {
    for (let i = 0; i < arr.length && i < 100; i++) {
        asset_url = "https://opensea.io/assets/" + asset_contract_address + "/" + arr[i];
        if (asset_url_arr.indexOf(asset_url) === -1) {
            asset_url_arr.push(asset_url);
            console.log(asset_url);
        }
    }
}
*/
async function main_code() { //get data from ipfs
    for (let i = 1; i < totalNum + 1; i++) {
        console.log(i);
        await sleep(30);//wait for
        instance.methods[token_uri_checker_function](i).call().then(async function (result) {
            console.log(result)
            axios.get(resolveLink(result), agent)
                .then(function (response) {
                    //console.log(url);

                    // push data and ID to array
                    request_arr.push(i);//push ID
                    id_arr.push(i);//push ID
                    info = response.data;
                    request_arr.push(info.attributes);//only push attributes (data) to request array
                    for (let o = 0; o < info.attributes.length; o++) {//count number of attributes
                        if (info.attributes[o].value != "None" && info.attributes[o].value != "" && info.attributes[o].value != "none" && info.attributes[o].value != "NONE" && info.attributes[o].value != "Null" && info.attributes[o].value != "null")
                            attributes_count += 1;
                    }
                    request_arr.push(attributes_count);//push number of attributes != none
                    if (attributes_count < 2) {//one of one
                        one_of_one_arr.push(i);
                        console.log("one_of_one_arr " + one_of_one_arr);
                    }
                    attributes_count = 0;//reset attributes count
                    data_arr.push(request_arr); //push request array to data array
                    attributes_value.push(info.attributes);//only attributes are pushed in array
                    attributes_value = attributes_value.flat();//flatten array
                    request_arr = [];//clear request array
                    if (data_arr.length % 200 == 0 || data_arr.length == Math.ceil(totalNum * ratio)) {
                        console.log("data_arr.length " + data_arr.length + " Last received request: " + i); console.timeLog(); console.log("");
                    }

                    if (data_arr.length == Math.ceil(totalNum * ratio)) {//wait for all responses are received
                        calculated_count = 1;
                        let counts = {}, attributes_counts = {}, value, atrib_count;
                        for (let j = 0; j < attributes_value.length; j++) {// count occurrences of distinct elements
                            value = attributes_value[j].value;
                            trait_type = attributes_value[j].trait_type;
                            //check object equality
                            if (typeof counts[trait_type + " " + value] === "undefined") {
                                counts[trait_type + " " + value] = 1;
                            } else {
                                counts[trait_type + " " + value]++;
                            }
                        }

                        attributes_counts_arr = Object.entries(attributes_counts);
                        counts_arr = Object.entries(counts);//convert object to array
                        for (let k = 0; k < counts_arr.length; k++) { //calculate rarity
                            counts_arr[k][1] = 1 / (counts_arr[k][1] / totalNum);
                        }
                        if (include_attributes_count) {//if include attributes count
                            for (let g = 0; g < data_arr.length; g++) {// count occurrences of attribute lengths
                                atrib_count = data_arr[g][2];
                                //check object equality
                                if (typeof (attributes_counts[atrib_count]) === "undefined") {
                                    attributes_counts[atrib_count] = 1;
                                } else {
                                    attributes_counts[atrib_count]++;
                                }
                            }
                            for (let m = 0; m < attributes_counts_arr.length; m++) {//calculate rarity for attributes count
                                attributes_counts_arr[m] = 1 / (attributes_counts_arr[m][1] / totalNum);
                            }
                        }
                        counts = Object.fromEntries(counts_arr); //convert counts_arr to object
                        console.log("counts: " + JSON.stringify(counts)); console.log(""); console.log("attributes_counts: " + JSON.stringify(attributes_counts));
                        //assign rarity value to data_arr elements
                        for (let j = 0; j < data_arr.length; j++) {//calculate rarity
                            for (let k = 0; k < data_arr[j][1].length; k++) {
                                data_arr[j][1][k].rarity = counts[data_arr[j][1][k].trait_type + " " + data_arr[j][1][k].value];//assign rarity value to attributes
                                data_arr[j][1][k].rarity_attributes = attributes_counts[data_arr[j][2]];//assign rarity value to attributes count
                                value1 += data_arr[j][1][k].rarity;//calculate total rarity
                            }
                            if (include_attributes_count)
                                value1 += data_arr[j][1][0].rarity_attributes;
                            if (calculated_count == 0)
                                data_arr[j].push(value1.toPrecision(4));//add total rarity to data_arr
                            else
                                data_arr[j][3] = (value1.toPrecision(4));//add total rarity to data_arr
                            value1 = 0;//reset total rarity
                        }
                        console.log(""); console.log("data_arr: " + JSON.stringify(data_arr));
                        //attributes are not used aster this line

                        //sort data_arr by fourth elements (total rarity)
                        data_arr.sort(function (a, b) {
                            return b[3] - a[3];
                        });

                        for (let l = 0; l < data_arr.length; l++) {//make rarity arr and score arr
                            rarity_arr.push(data_arr[l][0]);
                            score_arr.push(data_arr[l][3]);
                        }
                        console.log(""); console.log(id_arr.sort()); console.log(""); console.log("Score " + score_arr); console.log(""); console.timeLog(); console.log(""); console.log("Rarity (IDs): " + rarity_arr); console.log("One of one: " + one_of_one_arr);                    }
                })
                .catch(function (error) {
                    // handle error
                    console.log(error + " " + "i=" + i);
                })
        });
    }
}

main_code();
//check_listings(rarity_arr, one_of_one_arr);

console.log(data_arr);