let eBay = require('ebay-node-api')
const util = require('util')
require('dotenv').config()

let ebay = new eBay({
    clientID: process.env.EBAY_CLIENT_ID,
    env: 'PRODUCTION', // optional default = 'PRODUCTION',
    countryCode: "EBAY-GB",
    headers:{ // optional
        // 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB', // For Great Britain https://www.ebay.co.uk
        // 'X-EBAY-SOA-GLOBAL-ID': 'EBAY-GB',
    }
})

const log = (obj) => {
    console.log(util.inspect(obj, {showHidden: false, depth: null}))
}

ebay.findCompletedItems({
    keywords: 'EDGE Magazine 201',
    categoryId: 280,
    sortOrder: 'CountryAscending', //https://developer.ebay.com/devzone/finding/callref/extra/fndcmpltditms.rqst.srtordr.html
    pageNumber: 1,
    soldItemsOnly: false,
    entriesPerPage: 100,
}).then((data) => {
    //log(data);
    processResults(data)
}, (error) => {
    log(error);
}).catch(error => {
    console.log("error happened!")
});

const processResults = (searchDataResponse) => {
    const items = searchDataResponse[0].searchResult[0].item
    items.forEach( item => {
        const price = item.sellingStatus[0].currentPrice[0]
        console.log(`${price['@currencyId']} ${price['__value__']} > ${item.sellingStatus[0].sellingState} > ${item.title}  >  ${item.listingInfo[0].endTime} > ${item.sellingStatus[0].bidCount}`)
    })
}