const http = require('http');
const path = require('path');
const G = require('ginkgoch-map').default.all;

// register native graphics and it is the most important one
require('ginkgoch-map/native/node').init();

const port = 5500;
function serve() {
    const server = http.createServer(async (req, res) => {
        // parse the route: /maps/default/{z}/{x}/{y}
        if (req.url.match(/maps\/default(\/\d+){3}/)) {
            // parse x, y, z from url
            let segments = req.url.split('/');
            let [z, x, y] = segments.slice(segments.length - 3);

            // draw tile image
            let tileImage = await getTileImage(x, y, z);

            // write respond
            res.writeHead(200, {'Content-Type': 'image/png'});
            res.end(tileImage);
        } 
        else {
            console.debug(`URL not handled: ${req.url}`);
        }
    });

    server.listen(port, () => {
        console.log(`Server is served at http://localhost:${port}`);
    });
}

async function getTileImage(x, y, z) {
    let sourcePath = path.resolve(__dirname, `../data/cntry02.shp`);
    let source = new G.ShapefileFeatureSource(sourcePath);
    let layer = new G.FeatureLayer(source);
    layer.styles.push(new G.FillStyle('#f0f0f0', '#636363', 1));
    let mapEngine = new G.MapEngine(256, 256);
    mapEngine.pushLayer(layer);

    let mapImage = await mapEngine.xyz(x, y, z);
    return mapImage.toBuffer();
}

serve();