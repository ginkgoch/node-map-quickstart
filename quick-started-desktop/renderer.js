const L = require('leaflet');
const path = require('path');
const G = require('ginkgoch-map').default.all;
require('ginkgoch-leaflet-extensions');

function main() {
    let map = L.map('mapApp').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    addWorldLayer(map);
}

function addWorldLayer(map) {
    let featureSource = new G.ShapefileFeatureSource(path.resolve(__dirname, '../data/cntry02.shp'));
    let featureLayer = new G.FeatureLayer(featureSource);
    featureLayer.styles.push(new G.FillStyle('rgba(255, 153, 128, 0.3)', 'black', 1));
    
    const worldLayer = L.gridLayer.features();
    worldLayer.pushLayer(featureLayer);
    worldLayer.addTo(map);
}

main();