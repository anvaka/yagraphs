module.exports = function (graph) {
//  graph = Viva.Graph.generator().path(3);
  graph.addEventListener = graph.on;
  graph.removeEventListener = graph.off;
  var layout = Viva.Graph.Layout.forceDirected(graph, {
      springLength : 20,
      springCoeff : 0.0004,
      dragCoeff : 0.009,
      gravity : -9.2,
      theta : 0.8,
      timeStep: 2,
      stableThreshold: 0.0002
  });

  var graphics = Viva.Graph.View.svgGraphics();
  var links = [];
  graphics.node(function(node){
    return Viva.Graph.svg('circle')
                     .attr('r', 12)
                     .attr('fill', '#00adef');
    }).placeNode(function(nodeUI, pos) {
        nodeUI.attr('transform', 'translate(' + (pos.x) + ',' + (pos.y) + ')');
    }).link(function(link){
        var linkUI = Viva.Graph.svg('path')
                    .attr('stroke', 'red')
                    .attr('stroke-width', '4px');
        var pos = layout.getLinkPosition(link);
        links.push({
          from: pos.from,
          to: pos.to,
          stroke: linkUI.attributes.getNamedItem('stroke')
        });
        return linkUI;
    }).placeLink(function(linkUI, fromPos, toPos) {
        var data = 'M' + fromPos.x + ',' + fromPos.y +
                    'L' + toPos.x + ',' + toPos.y;

        linkUI.attr("d", data);
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
      var from = link.from;
      var to = link.to;
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
      link.stroke.value = hsbToRgb(hue, 100, 100);
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
  return 'rgb(' + r + ', ' + g + ',' + b + ')';
}
