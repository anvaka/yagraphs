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
require('an').controller(AppController);

function AppController($scope) {
  $scope.greeting = 'Stop wishing, start doing';
}

},{"an":1}],7:[function(require,module,exports){
require('./appController');

var ngApp = angular.module('yagraphs', []);

require('an').flush(ngApp);

angular.bootstrap(document, [ngApp.name]);

module.exports = ngApp;

},{"./appController":6,"an":1}]},{},[7])