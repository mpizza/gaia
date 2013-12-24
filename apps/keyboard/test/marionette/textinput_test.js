'use strict';

var Keyboard = require('./lib/keyboard'),
    FakeForm = require('./lib/fake_form'),
    assert = require('assert');

var FAKE_FORM_ORIGIN = 'fakeform.gaiamobile.org';


marionette('Keyboard APP', function() {
  var apps = {};
  apps[FAKE_FORM_ORIGIN] = __dirname + '/fakeform';
  var client = marionette.client({
    apps: apps,
    prefs: {
      'focusmanager.testmode': true
    }
  });
  var keyboard;
  var form;

  setup(function() {
    keyboard = new Keyboard(client);
    form = new FakeForm(client, 'app://' + FAKE_FORM_ORIGIN);
    form.launch();
    client.helper.waitForElement('body.loaded');
    client.setSearchTimeout(10000);
  });

  suite('input type is text', function() {

    setup(function() {
      form.textInputElement.click();
    });

    test('type string on input', function() {
      var text = 'pizza';
      var layout = 'index.html#en';
      client.helper.waitForElement('input#text_input');

      // switch to keyboard app
      client.switchToFrame();
      keyboard.switchToKeyboard(layout);
 
      keyboard.tap(text);
      form.backToApp();
      var tabsBadge = client.findElement('input#text_input');
      assert.equal(tabsBadge.getAttribute('value'), text);
    });

  });

});
