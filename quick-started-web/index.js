const http = require('http');
const path = require('path');
const G = require('ginkgoch-map').default.all;

// register native graphics and it is the most important one
require('ginkgoch-map/native/node').init();

const port = 5500;
function serve() {
    const server = http.createServer(async (req, res) => {
        let handled = false;
        // handle the route handlers in a loop.
        let routeHandlers = [handleTileRoute, handleIdentifyRoute]; // new route handlers will be added in this array later
        for (let routeHandler of routeHandlers) {
            handled = await routeHandler(req, res);
            if (handled) {
                break;
            }
        }

        if (!handled) {
            console.debug(`URL not handled: ${req.url}`);
        }
    });

    server.listen(port, () => {
        console.log(`Server is served at http://localhost:${port}`);
    });
}

async function getTileImage(x, y, z) {
    let mapEngine = getMap();
    let mapImage = await mapEngine.xyz(x, y, z);
    return mapImage.toBuffer();
}

// extract a function to get the `MapEngine` instance.
function getMap() {
    let sourcePath = path.resolve(__dirname, `../data/cntry02.shp`);
    let source = new G.ShapefileFeatureSource(sourcePath);
    let layer = new G.FeatureLayer(source);
    layer.styles.push(new G.FillStyle('#f0f0f0', '#636363', 1));
    let mapEngine = new G.MapEngine(256, 256);
    mapEngine.pushLayer(layer);
    return mapEngine;
}

// extract a function for serving XYZ tile service.
async function handleTileRoute(req, res) {
    let handled = false;

    // parse the route: /maps/default/{z}/{x}/{y}
    if (req.url.match(/maps\/default(\/\d+){3}/ig)) {
        // parse x, y, z from url
        let segments = req.url.split('/');
        let [z, x, y] = segments.slice(segments.length - 3);

        // draw tile image
        let tileImage = await getTileImage(x, y, z);

        // write respond
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(tileImage);
        handled = true;
    }

    return handled;
}

// handle the identify route
async function handleIdentifyRoute(req, res) {
    let handled = false;

    // parse the route: /maps/default/{layerName}/query
    if (req.url.match(/maps\/default\/\w+\/query/ig)) {
        let parameters = parseIdentifyParameters(req);
        let features = await getIdentifyFeatures(parameters);
        let featureCollection = new G.FeatureCollection(features);
        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
        res.end(JSON.stringify(featureCollection.toJSON()));
        handled = true;
    }

    return handled;
}

async function getIdentifyFeatures(parameters) {
    let projection = new G.Projection('WGS84', 'EPSG:3857');
    let clickedPoint = new G.Point(parameters.lng, parameters.lat);
    clickedPoint = projection.forward(clickedPoint);

    let mapEngine = getMap();
    let layer = mapEngine.layer('cntry02');
    if (layer === undefined) {
        return [];
    }

    await layer.open();
    let features = await layer.source.query('intersection', clickedPoint);
    features.forEach(f => f.geometry = projection.inverse(f.geometry));
    return features;
}

function parseIdentifyParameters(req) {
    let queryStringStarts = req.url.lastIndexOf('?');
    let lat = undefined, lng = undefined, zoom = undefined;
    if (queryStringStarts !== -1) {
        let queryString = req.url.slice(queryStringStarts + 1);
        queryString.split('&').map(s => s.split('=')).forEach(s => {
            switch (s[0].toLowerCase()) {
                case 'lat': lat = parseFloat(s[1]); break;
                case 'lng': lng = parseFloat(s[1]); break;
                case 'zoom': zoom = parseInt(s[1]); break;
            }
        });
    }

    let url = req.url.slice(0, queryStringStarts);
    let segments = url.split('/');
    let layer = segments[segments.length - 2];

    return { layer, lat, lng, zoom };
}

serve();