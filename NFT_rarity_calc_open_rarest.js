const axios = require('axios');
const axiosRetry = require('axios-retry');
const puppeteer = require('puppeteer-extra');
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

console.time();
let url = "https://gateway.ipfs.io/ipfs/bafybeic26wp7ck2bsjhjm5pcdigxqebnthqrmugsygxj5fov2r2qwhxyqu/"; //test url (vampires)
let asset_contract_address = "0x219b8ab790decc32444a6600971c7c3718252539";//vampires
//let url = "https://api.partydegenerates.com/degenerates/"; //party degenerates
let collection_size = 8888;
let ratio = 0.98;

let include_attributes_count = true;

let request_arr = [], data_arr = [], one_of_one_arr = [], attributes_value = [], rarity_arr = [], score_arr = [], attributes_counts_arr = [], asset_url_arr = [];

let info, value1 = 0, calculated_count = 0, attributes_count = 0;

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

axiosRetry(axios, {// if request fails rety 3 times
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
        console.log(`retry attempt: ${retryCount}`);
        return retryCount * 2000; // time interval between retries
    },
});

async function initBrowser() {
    const browser = await puppeteer.launch({
        executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", args: ['--no-sandbox', '--disable-extensions-except=C:\\Users\\domin\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Extensions\\nkbihfbeogaeaoehlefnkodbefgpgknn\\10.7.1_0',
            '--load-extension=C:\\Users\\domin\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Extensions\\nkbihfbeogaeaoehlefnkodbefgpgknn\\10.7.1_0', '--enable-remote-extensions'], headless: false
    });
    return browser;
}

function generate_asset_url(arr) {
    for (let i = 0; i < arr.length && i < 100; i++) {
        asset_url = "https://opensea.io/assets/" + asset_contract_address + "/" + arr[i];
        if (asset_url_arr.indexOf(asset_url) === -1) {
            asset_url_arr.push(asset_url);
        }
    }
    console.log(asset_url_arr);
}

async function open_asset_url(browser, one_of_one_arr, rarity_arr) {
    generate_asset_url(one_of_one_arr);
    generate_asset_url(rarity_arr);
    for (let i = 0; i < asset_url_arr.length; i++) {
        const page = await browser.newPage();
        await page.goto(asset_url_arr[i]);
        console.log("Opening asset with rarity..." + i);
    }
}

async function main_code() { //get data from ipfs
    console.log("Initializing browser..."); console.timeLog();
    const browser = await initBrowser();
    const page = await browser.newPage();
    console.log("Opening new page..."); console.timeLog(); console.log(""); console.log("Gathering info..."); console.log("");

    for (let i = 1; i < collection_size + 1; i++) {
        await sleep(15);//wait for 
        axios.get(url + i)
            .then(function (response) {
                // push data and ID to array
                request_arr.push(i);//push ID
                info = response.data;
                request_arr.push(info.attributes);//only push attributes (data) to request array
                for (let o = 0; o < info.attributes.length; o++) {//count number of attributes
                    if (info.attributes[o].value != "None" && info.attributes[o].value != "" && info.attributes[o].value != "none" && info.attributes[o].value != "NONE" && info.attributes[o].value != "Null" && info.attributes[o].value != "null")
                        attributes_count += 1;
                }
                request_arr.push(attributes_count);//push number of attributes != none
                if (attributes_count < 2) {//one of one
                    one_of_one_arr.push(i);
                    oneofone_asset_url = "https://opensea.io/assets/" + asset_contract_address + "/" + i;
                    if (page.url() == "about:blank") {
                        page.goto(oneofone_asset_url);
                    }
                    console.log("one_of_one_arr " + one_of_one_arr);
                }
                attributes_count = 0;//reset attributes count
                data_arr.push(request_arr); //push request array to data array
                attributes_value.push(info.attributes);//only attributes are pushed in array
                attributes_value = attributes_value.flat();//flatten array
                request_arr = [];//clear request array
                if (data_arr.length % 200 == 0 || data_arr.length == Math.ceil(collection_size * ratio)) {
                    console.log("data_arr.length " + data_arr.length + " Last received request: " + i); console.timeLog(); console.log("");
                }

                if (data_arr.length == Math.ceil(collection_size * ratio)) {//wait for all responses are received
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
                        counts_arr[k][1] = 1 / (counts_arr[k][1] / collection_size);
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
                            attributes_counts_arr[m] = 1 / (attributes_counts_arr[m][1] / collection_size);
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
                    console.log(""); console.log("Rarity (IDs): " + rarity_arr); console.log(""); console.log("Score " + score_arr); console.log(""); console.timeLog(); console.log(""); console.log("One of one: " + one_of_one_arr);

                    open_asset_url(browser, one_of_one_arr, rarity_arr);

                }
            })
            .catch(function (error) {
                // handle error
                console.log(error + " " + "i=" + i);
            })
    }
}

main_code();