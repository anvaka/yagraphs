(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var directive = require('./lib/directive');
var controller = require('./lib/controller');
var filter = require('./lib/filter');

module.exports = {
  directive: directive.register,
  controller: controller.register,
  filter: filter.register,

  flush: function (module) {
    if (!module) {
      module = createModule();
    }

    controller.flush(module);
    directive.flush(module);
    filter.flush(module);

    return module;
  },

  run: function () {
    var module = this.flush();
    angular.bootstrap(document.body, [module.name]);
    return module;
  }
};

function createModule() {
  return angular.module('anModule', []);
}

},{"./lib/controller":2,"./lib/directive":3,"./lib/filter":4}],2:[function(require,module,exports){
var registered = {};

exports.register = function (ctrl, name) {
  name = name || require('./functionName')(ctrl);
  if (!name) {
    throw new Error('Anonymous functions cannot be registered as controllers. Please provide named function or pass second argument as controlelr name');
  }

  registered[name] = ctrl;

  return ctrl;
};

exports.flush = function (ngModule) {
  Object.keys(registered).forEach(function (ctrlName) {
    ngModule.controller(ctrlName, registered[ctrlName]);
  });
};

},{"./functionName":5}],3:[function(require,module,exports){
var registered = {};

exports.register = function (directive, name) {
  name = name || require('./functionName')(directive);
  if (!name) {
    throw new Error('Anonymous functions cannot be registered as directives. Please provide named function or pass second argument as directive name');
  }

  registered[name] = directive;

  return directive;
};

exports.flush = function (ngModule) {
  Object.keys(registered).forEach(function (dirName) {
    ngModule.directive(dirName, registered[dirName]);
  });
};

},{"./functionName":5}],4:[function(require,module,exports){
var registered = {};

exports.register = function (filter, name) {
  name = name || require('./functionName')(filter);
  if (!name) {
    throw new Error('Anonymous functions cannot be registered as filters. Please provide named function or pass second argument as filter name');
  }

  registered[name] = filter;

  return filter;
};

exports.flush = function (ngModule) {
  Object.keys(registered).forEach(function (filterName) {
    ngModule.filter(filterName, registered[filterName]);
  });
};

},{"./functionName":5}],5:[function(require,module,exports){
module.exports = function (fun) {
  var funBody = fun.toString();
  var nameMatch = funBody.match(/function\s+(\w+)/);
  return nameMatch && nameMatch[1];
};

},{}],6:[function(require,module,exports){
/**
 * # Matrix Market storage
 *
 * [Matrix market format](http://math.nist.gov/MatrixMarket/formats.html) is a
 * format suitable for representing general sparse matrices. Only nonzero entries
 * are provided, and the coordinates of each nonzero entry is given explicitly.
 *
 * Most notably this format is used to store [University of Florida Sparse Matrix
 * Collection](http://www.cise.ufl.edu/research/sparse/matrices/index.html)
 */

module.exports = {
  load: load,
  createLineParser: createLineParser,
  saveToObject: saveToObject,
  loadFromObject: loadFromObject
};


/**
 * If you have *.mtx file loaded in memory, pass it to this function to parse
 * it into graph object;
 *
 * Example:
 * ```
 *   fs.readFile(filename, 'ascii', function(err, mtxFileContent) {
 *    if (err) throw err;
 *
 *    var mtx = require('ngraph.serialization/mtx');
 *    var graph = mtx.load(mtxFileContent);
 *    // Now you have graph object.
 *  });
 * ```
 */
function load (mtxText) {
  // This is not very efficient, but hey, let me know if you are using this
  // I'll make it better.
  var mtxLines = mtxText.split('\n'),
      mtxParser = createLineParser();

  mtxLines.forEach(function (line) {
    mtxParser.parse(line);
  });

  var graph = mtxParser.getGraph();
  graph.description = mtxParser.getDescription();

  return graph;
}

/**
 * If you want streaming parsing, you can create MTX line parser, and
 * feed MTX file line by line. Call parser.getGraph() at the end to get actual graph
 *
 * Example:
 *
 * ```
 *  // We use `lazy` (https://github.com/pkrumins/node-lazy) module to read file
 *  // line by line:
 *  var mtxParser = require('ngraph.serialization/mtx').createLineParser(),
 *      mtxFileStream = fs.createReadStream(mtxFileName)
 *          .on('end', function () {
 *            // Your graph is ready:
 *            var graph = mtxParser.getGraph();
 *          }),
 *      lazy = require('lazy');
 *  lazy(mtxFileStream).lines.forEach(function (line) {
 *    mtxParser.parse(line.toString());
 *  });
 * ```
 */
function createLineParser() {
  var createMtxParser = require('./mtxParser');
  return createMtxParser();
}

/**
 * This function saves graph into object with the following fields:
 *  `edges` - array of edges written in a row.
 *  `dimension` - number of elements in `edges` array per edge
 *
 * Each edge record in the array includes `from` and `to` ids (which are numbers)
 * If `includeData` is truthy then each record will also include data associated
 * with link
 */
function saveToObject (graph, includeData) {
  if (!graph) {
    throw new Error('Graph is required to saveArray method');
  }
  includeData = (includeData === undefined) || !!includeData;
  var links = [],
      savedObject = {
        recordsPerEdge: includeData ? 3 : 2,
        links: links
      },
      canChangeIncludeData = true;

  graph.forEachLink(function (link) {
    if (typeof link.fromId !== 'number' || typeof link.toId !== 'number') {
      throw new Error('saveToObject can only work with numbers as node ids.');
    }
    links.push(link.fromId);
    links.push(link.toId);
    if (includeData) {
      if (typeof link.data !== 'number') {
        if (canChangeIncludeData) {
          includeData = false;
          // we actually don't have any data associated with links.
          // change our mind:
          savedObject.recordsPerEdge = 2;
          return;
        } else {
          throw new Error('Some links are missing data');
        }
      }
      // we can only change includeData once:
      canChangeIncludeData = false;
      links.push(link.data);
    }
  });

  return savedObject;
}

/**
 * This function creates a graph structure from mtx object. An mtx object
 * is a return value from saveToObject() method, described above.
 *
 * @returns {ngraph.graph}
 */
function loadFromObject (mtxObject) {
  var mtxObjectIsValid = mtxObject && typeof mtxObject.recordsPerEdge === 'number'
                         && mtxObject.links !== undefined;
  if (!mtxObjectIsValid) {
    throw new Error('Unexpected mtxObject passed to loadFromObject() method');
  }
  var recordsPerEdge = mtxObject.recordsPerEdge,
      links = mtxObject.links;

  if (links.length % recordsPerEdge !== 0) {
    throw new Error('Number of edges is not valid for this object');
  }

  var createGraph = require('ngraph.graph'),
      graph = createGraph(),
      from, to, data;

  for (var i = 0; i < links.length; i += recordsPerEdge) {
    from = links[i];
    to = links[i + 1];
    if (recordsPerEdge === 3) {
      data = links[i + 2];
    }
    graph.addLink(from, to , data);
  }
  graph.description = mtxObject.description;

  return graph;
}

},{"./mtxParser":7,"ngraph.graph":8}],7:[function(require,module,exports){
/**
 * # MTX Parser
 *
 * This is very naive implementation of [Matrix Market format](http://math.nist.gov/MatrixMarket/formats.html)
 * parser;
 *
 * _NOTE_: Current implementation intentionally treats loops as node associated data.
 *
 * Example of Matrix market fomrat:
 *
 * ```
 * %%MatrixMarket matrix coordinate real general
 * %=================================================================================
 * %
 * % This ASCII file represents a sparse MxN matrix with L
 * % nonzeros in the following Matrix Market format:
 * %
 * % +----------------------------------------------+
 * % |%%MatrixMarket matrix coordinate real general | <--- header line
 * % |%                                             | <--+
 * % |% comments                                    |    |-- 0 or more comment lines
 * % |%                                             | <--+
 * % |    M  N  L                                   | <--- rows, columns, entries
 * % |    I1  J1  A(I1, J1)                         | <--+
 * % |    I2  J2  A(I2, J2)                         |    |
 * % |    I3  J3  A(I3, J3)                         |    |-- L lines
 * % |        . . .                                 |    |
 * % |    IL JL  A(IL, JL)                          | <--+
 * % +----------------------------------------------+
 * %
 * % Indices are 1-based, i.e. A(1,1) is the first element.
 * %
 * %=================================================================================
 *   5  5  8
 *     1     1   1.000e+00
 *     2     2   1.050e+01
 *     3     3   1.500e-02
 *     1     4   6.000e+00
 *     4     2   2.505e+02
 *     4     4  -2.800e+02
 *     4     5   3.332e+01
 *     5     5   1.200e+01
 * ```
 */
module.exports = mtxParser;

var createGraph = require('ngraph.graph'),
    dataSeparator = /\s+/,
// Parser has only two states:
    WAIT_ROW_COLUMNS_ENTRIES = 0,
    READ_DATA = 1;

function mtxParser() {
  var graph = createGraph(),
      description = [],
      stats = { rows: 0, columns: 0, nonZero: 0 },
      state = WAIT_ROW_COLUMNS_ENTRIES;

  return {
    getGraph: function () {
      return graph;
    },
    getDescription: function () {
      return description && description.join('\n');
    },
    parse: parse
  };

  function parse(line) {
    if (!line) {
      return; // forgive empty lines
    }
    if (line[0] === '%') {
      // We are reading description of a file:
      description.push(line.slice(1));
      return;
    }
    var data = getLineData(line);
    if (state === READ_DATA) {
      // Node ids represent columns and rows, thus they are always integers:
      var from = parseInt(data[0], 10),
          to = parseInt(data[1], 10),
          value = data[2] !== undefined ? parseFloat(data[2]) : undefined;

      // Currently we do not support loops. Treat this as simple node
      if (from === to) {
        graph.addNode(from, value);
      } else {
        graph.addLink(from, to, value);
      }
    } else if (state === WAIT_ROW_COLUMNS_ENTRIES) {
      // Now we know how many rows/columns we should expect
      stats.rows = parseInt(data[0], 10);
      stats.columns = parseInt(data[1], 10);
      stats.nonZero = parseInt(data[2], 10);

      // From now on we should wait only data
      state = READ_DATA;
    }
  }
}

var trailingWhitespaces = /^\s+|\s+$/;

function getLineData(line) {
  return line.replace(trailingWhitespaces, '').split(dataSeparator);
}

},{"ngraph.graph":8}],8:[function(require,module,exports){
/**
 * @fileOverview Contains definition of the core graph object.
 */


/**
 * @example
 *  var graph = require('ngraph.graph')();
 *  graph.addNode(1);     // graph has one node.
 *  graph.addLink(2, 3);  // now graph contains three nodes and one link.
 *
 */
module.exports = function () {
    // Graph structure is maintained as dictionary of nodes
    // and array of links. Each node has 'links' property which
    // hold all links related to that node. And general links
    // array is used to speed up all links enumeration. This is inefficient
    // in terms of memory, but simplifies coding.

    var nodes = typeof Object.create === 'function' ? Object.create(null) : {},
        links = [],
        // Hash of multi-edges. Used to track ids of edges between same nodes
        multiEdges = {},
        nodesCount = 0,
        suspendEvents = 0,

        // Accumlates all changes made during graph updates.
        // Each change element contains:
        //  changeType - one of the strings: 'add', 'remove' or 'update';
        //  node - if change is related to node this property is set to changed graph's node;
        //  link - if change is related to link this property is set to changed graph's link;
        changes = [],

        fireGraphChanged = function (graph) {
            graph.fire('changed', changes);
        },

        // Enter, Exit Mofidication allows bulk graph updates without firing events.
        enterModification = function () {
            suspendEvents += 1;
        },

        exitModification = function (graph) {
            suspendEvents -= 1;
            if (suspendEvents === 0 && changes.length > 0) {
                fireGraphChanged(graph);
                changes.length = 0;
            }
        },

        recordNodeChange = function (node, changeType) {
            changes.push({node : node, changeType : changeType});
        },

        recordLinkChange = function (link, changeType) {
            changes.push({link : link, changeType : changeType});
        },
        linkConnectionSymbol = '👉 ';

    var graphPart = {

        /**
         * Adds node to the graph. If node with given id already exists in the graph
         * its data is extended with whatever comes in 'data' argument.
         *
         * @param nodeId the node's identifier. A string or number is preferred.
         *   note: Node id should not contain 'linkConnectionSymbol'. This will break link identifiers
         * @param [data] additional data for the node being added. If node already
         *   exists its data object is augmented with the new one.
         *
         * @return {node} The newly added node or node with given id if it already exists.
         */
        addNode : function (nodeId, data) {
            if (typeof nodeId === 'undefined') {
                throw new Error('Invalid node identifier');
            }

            enterModification();

            var node = this.getNode(nodeId);
            if (!node) {
                // TODO: Should I check for linkConnectionSymbol here?
                node = new Node(nodeId);
                nodesCount++;

                recordNodeChange(node, 'add');
            } else {
                recordNodeChange(node, 'update');
            }

            node.data = data;

            nodes[nodeId] = node;

            exitModification(this);
            return node;
        },

        /**
         * Adds a link to the graph. The function always create a new
         * link between two nodes. If one of the nodes does not exists
         * a new node is created.
         *
         * @param fromId link start node id;
         * @param toId link end node id;
         * @param [data] additional data to be set on the new link;
         *
         * @return {link} The newly created link
         */
        addLink : function (fromId, toId, data) {
            enterModification();

            var fromNode = this.getNode(fromId) || this.addNode(fromId);
            var toNode = this.getNode(toId) || this.addNode(toId);

            var linkId = fromId.toString() + linkConnectionSymbol + toId.toString();
            var isMultiEdge = multiEdges.hasOwnProperty(linkId);
            if (isMultiEdge || this.hasLink(fromId, toId)) {
                if (!isMultiEdge) {
                    multiEdges[linkId] = 0;
                }
                linkId += '@' + (++multiEdges[linkId]);
            }

            var link = new Link(fromId, toId, data, linkId);

            links.push(link);

            // TODO: this is not cool. On large graphs potentially would consume more memory.
            fromNode.links.push(link);
            toNode.links.push(link);

            recordLinkChange(link, 'add');

            exitModification(this);

            return link;
        },

        /**
         * Removes link from the graph. If link does not exist does nothing.
         *
         * @param link - object returned by addLink() or getLinks() methods.
         *
         * @returns true if link was removed; false otherwise.
         */
        removeLink : function (link) {
            if (!link) { return false; }
            var idx = indexOfElementInArray(link, links);
            if (idx < 0) { return false; }

            enterModification();

            links.splice(idx, 1);

            var fromNode = this.getNode(link.fromId);
            var toNode = this.getNode(link.toId);

            if (fromNode) {
                idx = indexOfElementInArray(link, fromNode.links);
                if (idx >= 0) {
                    fromNode.links.splice(idx, 1);
                }
            }

            if (toNode) {
                idx = indexOfElementInArray(link, toNode.links);
                if (idx >= 0) {
                    toNode.links.splice(idx, 1);
                }
            }

            recordLinkChange(link, 'remove');

            exitModification(this);

            return true;
        },

        /**
         * Removes node with given id from the graph. If node does not exist in the graph
         * does nothing.
         *
         * @param nodeId node's identifier passed to addNode() function.
         *
         * @returns true if node was removed; false otherwise.
         */
        removeNode: function (nodeId) {
            var node = this.getNode(nodeId);
            if (!node) { return false; }

            enterModification();

            while (node.links.length) {
                var link = node.links[0];
                this.removeLink(link);
            }

            delete nodes[nodeId];
            nodesCount--;

            recordNodeChange(node, 'remove');

            exitModification(this);

            return true;
        },

        /**
         * Gets node with given identifier. If node does not exist undefined value is returned.
         *
         * @param nodeId requested node identifier;
         *
         * @return {node} in with requested identifier or undefined if no such node exists.
         */
        getNode : function (nodeId) {
            return nodes[nodeId];
        },

        /**
         * Gets number of nodes in this graph.
         *
         * @return number of nodes in the graph.
         */
        getNodesCount : function () {
            return nodesCount;
        },

        /**
         * Gets total number of links in the graph.
         */
        getLinksCount : function () {
            return links.length;
        },

        /**
         * Gets all links (inbound and outbound) from the node with given id.
         * If node with given id is not found null is returned.
         *
         * @param nodeId requested node identifier.
         *
         * @return Array of links from and to requested node if such node exists;
         *   otherwise null is returned.
         */
        getLinks : function (nodeId) {
            var node = this.getNode(nodeId);
            return node ? node.links : null;
        },

        /**
         * Invokes callback on each node of the graph.
         *
         * @param {Function(node)} callback Function to be invoked. The function
         *   is passed one argument: visited node.
         */
        forEachNode : function (callback) {
            if (typeof callback !== 'function') {
                return;
            }
            var node;

            for (node in nodes) {
                if (callback(nodes[node])) {
                    return; // client doesn't want to proceed. return.
                }
            }
        },

        /**
         * Invokes callback on every linked (adjacent) node to the given one.
         *
         * @param nodeId Identifier of the requested node.
         * @param {Function(node, link)} callback Function to be called on all linked nodes.
         *   The function is passed two parameters: adjacent node and link object itself.
         * @param oriented if true graph treated as oriented.
         */
        forEachLinkedNode : function (nodeId, callback, oriented) {
            var node = this.getNode(nodeId),
                i,
                link,
                linkedNodeId;

            if (node && node.links && typeof callback === 'function') {
                // Extraced orientation check out of the loop to increase performance
                if (oriented) {
                    for (i = 0; i < node.links.length; ++i) {
                        link = node.links[i];
                        if (link.fromId === nodeId) {
                            callback(nodes[link.toId], link);
                        }
                    }
                } else {
                    for (i = 0; i < node.links.length; ++i) {
                        link = node.links[i];
                        linkedNodeId = link.fromId === nodeId ? link.toId : link.fromId;

                        callback(nodes[linkedNodeId], link);
                    }
                }
            }
        },

        /**
         * Enumerates all links in the graph
         *
         * @param {Function(link)} callback Function to be called on all links in the graph.
         *   The function is passed one parameter: graph's link object.
         *
         * Link object contains at least the following fields:
         *  fromId - node id where link starts;
         *  toId - node id where link ends,
         *  data - additional data passed to graph.addLink() method.
         */
        forEachLink : function (callback) {
            var i, length;
            if (typeof callback === 'function') {
                for (i = 0, length = links.length; i < length; ++i) {
                    callback(links[i]);
                }
            }
        },

        /**
         * Suspend all notifications about graph changes until
         * endUpdate is called.
         */
        beginUpdate : function () {
            enterModification();
        },

        /**
         * Resumes all notifications about graph changes and fires
         * graph 'changed' event in case there are any pending changes.
         */
        endUpdate : function () {
            exitModification(this);
        },

        /**
         * Removes all nodes and links from the graph.
         */
        clear : function () {
            var that = this;
            that.beginUpdate();
            that.forEachNode(function (node) { that.removeNode(node.id); });
            that.endUpdate();
        },

        /**
         * Detects whether there is a link between two nodes.
         * Operation complexity is O(n) where n - number of links of a node.
         *
         * @returns link if there is one. null otherwise.
         */
        hasLink : function (fromNodeId, toNodeId) {
            // TODO: Use adjacency matrix to speed up this operation.
            var node = this.getNode(fromNodeId),
                i;
            if (!node) {
                return null;
            }

            for (i = 0; i < node.links.length; ++i) {
                var link = node.links[i];
                if (link.fromId === fromNodeId && link.toId === toNodeId) {
                    return link;
                }
            }

            return null; // no link.
        }
    };

    // Let graph fire events before we return it to the caller.
    var eventify = require('ngraph.events');
    eventify(graphPart);

    return graphPart;
};

// need this for old browsers. Should this be a separate module?
function indexOfElementInArray(element, array) {
    if (array.indexOf) {
        return array.indexOf(element);
    }

    var len = array.length,
        i;

    for (i = 0; i < len; i += 1) {
        if (array[i] === element) {
            return i;
        }
    }

    return -1;
}

/**
 * Internal structure to represent node;
 */
function Node(id) {
    this.id = id;
    this.links = [];
    this.data = null;
}


/**
 * Internal structure to represent links;
 */
function Link(fromId, toId, data, id) {
    this.fromId = fromId;
    this.toId = toId;
    this.data = data;
    this.id = id;
}

},{"ngraph.events":9}],9:[function(require,module,exports){
module.exports = function(subject) {
  validateSubject(subject);

  var eventsStorage = createEventsStorage(subject);
  subject.on = eventsStorage.on;
  subject.off = eventsStorage.off;
  subject.fire = eventsStorage.fire;
  return subject;
};

function createEventsStorage(subject) {
  // Store all event listeners to this hash. Key is event name, value is array
  // of callback records.
  //
  // A callback record consists of callback function and its optional context:
  // { 'eventName' => [{callback: function, ctx: object}] }
  var registeredEvents = {};

  return {
    on: function (eventName, callback, ctx) {
      if (typeof callback !== 'function') {
        throw new Error('callback is expected to be a function');
      }
      if (!registeredEvents.hasOwnProperty(eventName)) {
        registeredEvents[eventName] = [];
      }
      registeredEvents[eventName].push({callback: callback, ctx: ctx});

      return subject;
    },

    off: function (eventName, callback) {
      var wantToRemoveAll = (typeof eventName === 'undefined');
      if (wantToRemoveAll) {
        // Killing old events storage should be enough in this case:
        registeredEvents = {};
        return subject;
      }

      if (registeredEvents.hasOwnProperty(eventName)) {
        var deleteAllCallbacksForEvent = (typeof callback !== 'function');
        if (deleteAllCallbacksForEvent) {
          delete registeredEvents[eventName];
        } else {
          var callbacks = registeredEvents[eventName];
          for (var i = 0; i < callbacks.length; ++i) {
            if (callbacks[i].callback === callback) {
              callbacks.splice(i, 1);
            }
          }
        }
      }

      return subject;
    },

    fire: function (eventName) {
      var noEventsToFire = !registeredEvents.hasOwnProperty(eventName);
      if (noEventsToFire) {
        return subject; 
      }

      var callbacks = registeredEvents[eventName];
      var fireArguments = Array.prototype.splice.call(arguments, 1);
      for(var i = 0; i < callbacks.length; ++i) {
        var callbackInfo = callbacks[i];
        callbackInfo.callback.apply(callbackInfo.ctx, fireArguments);
      }

      return subject;
    }
  };
}

function validateSubject(subject) {
  if (!subject) {
    throw new Error('Eventify cannot use falsy object as events subject');
  }
  var reservedWords = ['on', 'fire', 'off'];
  for (var i = 0; i < reservedWords.length; ++i) {
    if (subject.hasOwnProperty(reservedWords[i])) {
      throw new Error("Subject cannot be eventified, since it already has property '" + reservedWords[i] + "'");
    }
  }
}

},{}],10:[function(require,module,exports){
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

},{"./graphRenderer":11,"an":1,"ngraph.serialization/mtx":6}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
require('./appController');

var ngApp = angular.module('yagraphs', []);

require('an').flush(ngApp);

angular.bootstrap(document, [ngApp.name]);

module.exports = ngApp;

},{"./appController":10,"an":1}]},{},[12])