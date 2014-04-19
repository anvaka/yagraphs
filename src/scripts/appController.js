require('an').controller(AppController);

var render = require('./graphRenderer');

function AppController($http) {
 $http.get('http://s3.amazonaws.com/yasiv_uf/out/Meszaros/p0040/index.js').then(renderGraph);
}

function renderGraph(res) {
  var mtx = require('ngraph.serialization/mtx');
  var graph = mtx.loadFromObject(res.data);
  render(graph);
}
