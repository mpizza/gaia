define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:SoftkeyController');
// var ControlsView = require('views/controls');
var bindAll = require('lib/bind-all');

/**
 * Exports
 */

module.exports = function(app) { return new SoftkeyController(app); };
module.exports.SoftkeyController = SoftkeyController;

/**
 * Initialize a new `SoftkeyController`
 *
 * @param {App} app
 */
function SoftkeyController(app) {
  bindAll(this);
  this.app = app;
  // this.createView();
  this.bindEvents();
  this.table = {
                  picture: {
                    accept: {events: 'settings:toggle', title:'options'},
                    escape: {events: 'escape', title:'picture'},
                    enter: {events: 'keydown:capture', title:'camera'},
                    arrowup: {events:'keydown:modechanged'},
                    arrowdown: {events:'keydown:modechanged'}
                  },
                  video: {
                    accept: {events: 'settings:toggle', title:'options'},
                    escape: {events: 'escape', title:'video'},
                    enter: {events: 'keydown:capture', title:'video'},
                    arrowup: {events:'keydown:modechanged'},
                    arrowdown: {events:'keydown:modechanged'}
                  }};
  debug('initialized');
}
/**
 * Event bindings.
 *x`
 * @private
 */
SoftkeyController.prototype.bindEvents = function() {
  this.app.on('softkey', this.onSoftKey);
  debug('events bound');
};

SoftkeyController.prototype.onSoftKey = function(e) {
  var key = e.key.toLowerCase();
  var type = this.getRule(key);
  if (type) {
    this.app.emit(type, e);
  }
};
/**
 * Create and configure the view.
 *
 * @private
 */
SoftkeyController.prototype.getRule = function(key) {
  var mode = this.app.camera.mode;
  var action = this.table[mode];

  if (typeof action[key]!== 'object') {
    return false;
  }

  return action[key].events;
};

});
