let eBay = require('ebay-node-api')
const util = require('util')
require('dotenv').config()

const createCsvWriter = require('csv-writer').createObjectCsvWriter;


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

const searchFor = async (name, min, max) => {
    let arr = []
    for(var i=min; i<=max;i++) {
        arr.push(`${name} ${i}`)
    }
    const name_clean = name.toLowerCase().split(" ").join("_")
    const path = `output/search-${name_clean}-${min}-${max}.csv`
    console.log(path)
    const csvWriter = createCsvWriter({
        path: path,
        header: [
            {id: 'term', title: 'SEARCH'},
            {id: 'title', title: 'TITLE'},
            {id: 'subtitle', title: 'SUB TITLE'},
            {id: 'currency', title: 'CURRENCY'},
            {id: 'price', title: 'PRICE'},
            {id: 'state', title: 'SELLING STATE'},
            {id: 'time', title: 'END DATE'},
            {id: 'url', title: 'LINK'},
        ]
    });
    
    for(const term of arr){
        try {
            await searchForTerm(term, name, csvWriter)
        } catch (error) {
            console.log(error)
            // just do the next one...
        }
    }
}

const searchForTerm = (term, specific, csv) => {
    return new Promise( function(resolve, reject) {
        console.log(`search: ${term}`)
        ebay.findCompletedItems({
            keywords: term,
            categoryId: 280,
            sortOrder: 'CountryAscending', //https://developer.ebay.com/devzone/finding/callref/extra/fndcmpltditms.rqst.srtordr.html
            pageNumber: 1,
            soldItemsOnly: false,
            entriesPerPage: 100,
        }).then((data) => {
            return processResults(data, term, specific)
        }).then(records => {
            console.log(`        ${records.length} records`)
            return csv.writeRecords(records)
        }).then(() => {
            resolve()
        })
        .catch(error => {
            reject(error)
        });
    })
}

const processResults = (searchDataResponse, term, title_must_include) => {
    return new Promise( (resolve, reject) => {
        const match = title_must_include.toLowerCase()
        const items = searchDataResponse[0].searchResult[0].item
        if (items) {
            const records = items.map( item => {
                const price = item.sellingStatus[0].currentPrice[0]
                // filter out records that don't contain the original search term
                if (item.title.toString().toLowerCase().indexOf(match) == -1) return null
                return {
                    term: term,
                    title: item.title,
                    subtitle: item.subtitle,
                    currency: price['@currencyId'],
                    price: price['__value__'],
                    state: item.sellingStatus[0].sellingState,
                    time: item.listingInfo[0].endTime,
                    url: item.viewItemURL,
                }
            }).filter( item => item != null ) // remove the null records
            resolve(records)
        }
        resolve([])
    })
}
/*
searchForTerm('EDGE Magazine 201', csvWriter)
    .then(console.log('found search term'))
    .catch(error => {
        console.log('an error occurred', error)
    })
*/
searchFor('EDGE', 10, 345) // 345