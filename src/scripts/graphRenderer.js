module.exports = function (graph) {
//  graph = Viva.Graph.generator().path(3);
  graph.addEventListener = graph.on;
  graph.removeEventListener = graph.off;
  var layout = Viva.Graph.Layout.forceDirected(graph, {
      springLength : 30,
      springCoeff : 0.0004,
      dragCoeff : 0.009,
      gravity : -10.2,
      theta : 0.8
  });
  //layout.pinNode(graph.getNode(1), true);

  var graphics = Viva.Graph.View.webglGraphics();
  var links = [];
  graphics.node(function(node){
      return Viva.Graph.View.webglSquare(20, 0xfa0100ff);
    })
    .link(function(link) {
      var linkUI = Viva.Graph.View.webglLine(0xaec7e8ff);
      links.push(linkUI);
      return linkUI;
    });

  updateLinksColor();

  var renderer = Viva.Graph.View.renderer(graph, {
          layout     : layout,
          graphics   : graphics,
          renderLinks : true,
          container : document.getElementById('graphVisualization')
      });
  renderer.run();

  function updateLinksColor() {
    requestAnimationFrame(updateLinksColor);
    if (!links.length) return;

    // first calculate avg link length:
    var minLength = Number.POSITIVE_INFINITY, maxLength = 0;
    var link;
    var avgDistance = 0;
    for (var i = 0; i < links.length; ++i) {
      link = links[i];
      var from = link.pos.from;
      var to = link.pos.to;
      link.distance = Math.sqrt((from.x - to.x) * (from.x - to.x) + (from.y - to.y) * (from.y - to.y));
      avgDistance += link.distance;

      if (link.distance < minLength) minLength = link.distance;
      if (link.distance > maxLength) maxLength = link.distance;
    }

    avgDistance /= links.length;

    for (i = 0; i < links.length; ++i) {
      link = links[i];
      var dt = link.distance - avgDistance;
      var hue = 90 * (dt * 4/(avgDistance) + 1);
      hue = Math.min(Math.max(hue, 0), 180);
      link.color = hsbToRgb(hue, 100, 100);
    }
  }
};

function hsbToRgb(h, s, b){
  var r, g;
  var br = Math.round(b / 100 * 255);
  if (s === 0){
    r = br; g =  br; b = br;
  } else {
    var hue = h % 360;
    var f = hue % 60;
    var p = Math.round((b * (100 - s)) / 10000 * 255);
    var q = Math.round((b * (6000 - s * f)) / 600000 * 255);
    var t = Math.round((b * (6000 - s * (60 - f))) / 600000 * 255);
    switch(Math.floor(hue / 60)){
      case 0: r = br; g = t; b = p; break;
      case 1: r = q; g = br; b = p; break;
      case 2: r = p; g = br; b = t; break;
      case 3: r = p; g =  q; b = br; break;
      case 4: r = t; g = p; b = br; break;
      case 5: r = br; g =  p; b = q; break;
    }
  }
  return (r << 24) + (g << 16) + (b << 8) + 0xff;
}
