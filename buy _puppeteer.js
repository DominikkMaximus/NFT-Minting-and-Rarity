const puppeteer = require('puppeteer-extra');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
let asset_url_arr = [];
let asset_contract_address = "0x219b8ab790decc32444a6600971c7c3718252539";
let one_of_one_arr = [604, 2173, 3044];
let rarity_arr = [2976, 604, 2173, 3044, 3468, 4015, 5304, 6750, 7086, 4122, 8349, 8372, 6935, 8200, 7200, 5170, 3653, 3850, 8674, 6135, 8150, 6422, 4630, 8068, 4017, 1183, 591, 2191, 5571, 6313, 684, 3693, 4187, 5868, 8065, 8078, 7491, 8429, 1981, 7187, 8656];
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

async function open_asset_url() {
    const browser = await initBrowser();
    generate_asset_url(one_of_one_arr);
    generate_asset_url(rarity_arr);
    for (let i = 0; i < asset_url_arr.length; i++) {
        const page = await browser.newPage();
        await page.goto(asset_url_arr[i]);
    }
}

open_asset_url();