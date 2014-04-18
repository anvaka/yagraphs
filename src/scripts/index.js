require('./appController');

var ngApp = angular.module('yagraphs', []);

require('an').flush(ngApp);

angular.bootstrap(document, [ngApp.name]);

module.exports = ngApp;
