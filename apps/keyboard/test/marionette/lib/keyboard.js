'use strict';
/**
 * Abstraction around keyboard app.
 * constructor
 * param {Marionette.Client} client for operations.
 */
function Keyboard(client) {
  this.client = client;
  this.keyboardFrame = null;
}

// Keyboard.URL = 'app://Keyboard.gaiamobile.org';

Keyboard.Selectors = {
  'languageKeyLocator': '.keyboard-row button[data-keycode="-3"]',
  'dotcomKeyLocator': '.keyboard-row button[data-compositekey=".com"]'
};

Keyboard.specificKeyCode = {
  'numericSignKey': -2,
  'alphaKey': -1,
  'backspaceKey': 8,
  'enterKey': 13,
  'altKey': 18,
  'upperCaseKey': 20,
  'spaceKey': 32
};
/**
 * private
 * param {Marionette.Client} client for selector.
 * param {String} name of selector [its a key in Keyboard.Selectors].
 */
function findElement(client, name) {
  return client.findElement(Keyboard.Selectors[name]);
}

Keyboard.prototype = {

  get languageKey() {
    return findElement(this.client, 'languageKeyLocator');
  },

  get dotcomKey() {
    return findElement(this.client, 'dotcomKeyLocator');
  },

  switchToNumericSign: function() {
    this.tapKey(Keyboard.specificKeyCode.numericSignKey);
    this.client.helper.waitForElement(
      '[data-active="true"] button.keyboard-key[data-keycode="' +
                            Keyboard.specificKeyCode.alphaKey + '"]');
  },

  switchToAlphaKey: function() {
    this.tapKey(Keyboard.specificKeyCode.alphaKey);
    this.client.helper.waitForElement(
      '[data-active="true"] button.keyboard-key[data-keycode="' +
                            Keyboard.specificKeyCode.numericSignKey + '"]');
  },

  switchToKeyboard: function(launchPatch) {
    // switch to system
    // switch to specific keyboard frame
    var iframeSelectors =
              '#keyboards iframe[data-frame-path="/' + launchPatch + '"]';
    this.keyboardFrame = this.client.findElement(iframeSelectors);
    var self = this;
    this.client.waitFor(function waiting() {
      return self.keyboardFrame.displayed();
    });

    this.client.switchToFrame(this.keyboardFrame);
    var keyboard = this.client.findElement('div#keyboard');
    this.client.waitFor(function waiting() {
      return keyboard.getAttribute('data-hidden') !== 'true';
    });
  },

  tapKey: function(keycode, isUpper) {
    //find the botton and type it
    console.log('keycode:' + keycode);
    var qButton;
    if (isUpper) {
      qButton = this.client.findElement(
              '[data-active="true"] button.keyboard-key[data-keycode-upper="' +
                                                                keycode + '"]');
    } else {
      qButton = this.client.findElement(
                    '[data-active="true"] button.keyboard-key[data-keycode="' +
                                                                keycode + '"]');
    }
    qButton.click();
  },

  tap: function(keys) {
    var upperExp = /^[A-Z]+$/;
    var alphaExp = /^[A-z]+$/;
    for (var i in keys) {
      if (!keys[i].match(alphaExp)) {
        // switchToNumericSign panel
        this.switchToNumericSign();
        this.tapKey(keys.charCodeAt(i));
        this.switchToAlphaKey();
      } else {
        if (keys[i].match(upperExp)) {
          // switch uppercase mode
          this.tapKey(Keyboard.specificKeyCode.upperCaseKey);
          this.tapKey(keys.charCodeAt(i), true);
        } else {
          // type lowercase
          this.tapKey(keys.charCodeAt(i));
        }
      }
    }
  }
};

module.exports = Keyboard;
