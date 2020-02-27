const fs = require('fs');
const G = require('ginkgoch-map').default.all;

function main() {
    // make sure shapefile is specified
    if (process.argv.length < 3) {
        console.info('Specified a shapefile path parameter');
        return;
    }

    // make sure the shapefile does exist
    let filePath = process.argv[2];
    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} doesn't exist`);
        return;
    }

    // create a shapefile instance
    let source = new G.Shapefile(filePath);
    source.open();
    
    // get shapefile header and print it
    let header = source.header();
    for(let key of Object.keys(header)) {
        console.log(`${key}: ${header[key]}`);
    }
}

main();