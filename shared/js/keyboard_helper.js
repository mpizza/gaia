/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Helper object to find all installed keyboard apps and layouts.
 * (Need mozApps.mgmt permission)
 */

const TYPE_GROUP = {
  'text': true,
  'url': true,
  'email': true,
  'password': true,
  'number': true,
  'option': true
};

const SETTINGS_KEY = 'keyboard.enabled-layouts';

var KeyboardHelper = {
  keyboardLayoutsByType: {},

  keyboardSettings: [],

  _debugMode: false,

  _debug: function kh_debug(string) {
    if (this._debugMode)
      console.log('[keyboard_helper]' + string);
  },

  getAllLayouts: function kh_getAllLayouts(callback) {
    this._debug('getAllLayouts');
    var self = this;
    self.getKeyboardSettings(function() {
      self.getInstalledLayouts(function(apps) {
        for (var i in self.keyboardSettings) {
          var origin = self.keyboardSettings[i].appOrigin;
          var name = self.keyboardSettings[i].layoutName;
          var layoutEnabled = self.keyboardSettings[i].enabled;
          if (!layoutEnabled)
            continue;
          self.setLayoutEnable(origin, name, layoutEnabled);
        }
        callback(self.keyboardLayoutsByType);
      });
    });
  },

  setLayoutEnabled: function kh_setLayoutEnabled(appOrigin, layoutName,
  enabled) {
    var self = this;
    self.getKeyboardSettings(function() {
      for (var i = 0; i < self.keyboardSettings.length; i++) {
        if (self.keyboardSettings[i].appOrigin === appOrigin &&
          self.keyboardSettings[i].layoutName === layoutName) {
          self.keyboardSettings[i].enabled = enabled;
          self.saveToSettings();
          break;
        }
      }
    });
  },

  getLayoutEnabled: function kh_getLayoutEnabled(appOrigin, layoutName,
    callback) {
    var self = this;
    self.getKeyboardSettings(function() {
      for (var i = 0; i < self.keyboardSettings.length; i++) {
        if (self.keyboardSettings[i].appOrigin == appOrigin &&
          self.keyboardSettings[i].layoutName == layoutName) {
          getValue = self.keyboardSettings[i].enabled;
          callback(getValue);
          break;
        }
      }
    });
  },

  updateKeyboardSettings: function kh_updateKeyboardSettings() {
    var self = this;
    self.getKeyboardSettings(function() {
      var temSettings = self.keyboardSettings;
      self.getInstalledLayouts(function(apps) {
        // generate new settings
        self.keyboardSettings = [];
        apps.forEach(function(app) {
          var entryPoints = app.manifest.entry_points;
          for (var name in entryPoints) {
            var launchPath = entryPoints[name].launch_path;
            if (!entryPoints[name].types) {
              console.warn('the keyboard app did not declare type.');
              continue;
            }
            // for settings
            self.keyboardSettings.push({
              'layoutName': name,
              'appOrigin': app.origin,
              'enabled': false
            });
          }
        });

        for (var i in temSettings) {
          if (!temSettings[i].enabled)
            continue;
          var layoutName = temSettings[i].layoutName;
          var layoutOrigin = temSettings[i].appOrigin;
          for (var j in self.keyboardSettings) {
            if (self.keyboardSettings[j].layoutName === layoutName &&
              self.keyboardSettings[j].appOrigin === layoutOrigin) {
              self.keyboardSettings[j].enabled = true;
            }
          }
        }
        self.saveToSettings();

      });
    });
  },

  getKeyboardSettings: function kh_getKeyboardSettings(callback) {
    var self = this;
    var settings = window.navigator.mozSettings;
    var request = settings.createLock().get(SETTINGS_KEY);
    request.onsuccess = function(e) {
      var value = request.result[SETTINGS_KEY];
      if (!value) {
        //XXX write settings back, this shouldn't happen.
        self.getInstalledLayouts(function(apps) {
          self.keyboardSettings = [];
          apps.forEach(function(app) {
            var entryPoints = app.manifest.entry_points;
            for (var name in entryPoints) {
              var launchPath = entryPoints[name].launch_path;
              if (!entryPoints[name].types) {
                console.warn('the keyboard app did not declare type.');
                continue;
              }
              // for settings
              self.keyboardSettings.push({
                'layoutName': name,
                'appOrigin': app.origin,
                'enabled': false
              });
            }
          });

          // init settings and keyboard layout
          var allLayouts = self.keyboardLayoutsByType;
          for (var type in allLayouts) {
            var layoutOrigin = allLayouts[type][0].origin;
            var layoutName = allLayouts[type][0].name;
            //XXX default enable should be get from locals form.
            allLayouts[type][0].enabled = true;
            for (var i in self.keyboardSettings) {
              if (self.keyboardSettings[i].layoutName == layoutName &&
                  self.keyboardSettings[i].appOrigin == layoutOrigin) {
                self.keyboardSettings[i].enabled = true;
                break;
              }
            }
          }
          self.saveToSettings();
        });
      } else {
        self.keyboardSettings = JSON.parse(value);
      }

      if (callback)
        callback();
    };
  },

  saveToSettings: function ke_saveToSettings() {
    var settings = window.navigator.mozSettings;
    var obj = {};
    obj[SETTINGS_KEY] = JSON.stringify(this.keyboardSettings);
    settings.createLock().set(obj);
  },

  setLayoutEnable: function kh_setLayoutEnable(origin, name, layoutEnabled) {
    for (var type in this.keyboardLayoutsByType) {
      for (var i in this.keyboardLayoutsByType[type]) {
        if (origin === this.keyboardLayoutsByType[type][i].origin &&
          name === this.keyboardLayoutsByType[type][i].name) {
          this.keyboardLayoutsByType[type][i].enabled = layoutEnabled;
          break;
        }
      }
    }
  },

  getInstalledKeyboards: function kh_getInstalledKeyboards(callback) {
    if (!navigator.mozApps || !navigator.mozApps.mgmt)
      return;

    navigator.mozApps.mgmt.getAll().onsuccess = function onsuccess(event) {
      var apps = event.target.result;
      var keyboardApps = [];
      apps.forEach(function eachApp(app) {
        // keyboard apps will request keyboard API permission
        if (!(app.manifest.permissions && 'keyboard' === app.manifest.role))
          return;
        //XXX remove this hard code check if one day system app no longer
        //    use mozKeyboard API
        if (app.origin === 'app://system.gaiamobile.org')
          return;
        // all keyboard apps should define its layout(s) in entry_points section
        if (!app.manifest.entry_points)
          return;
        keyboardApps.push(app);
      });

      if (keyboardApps.length > 0 && callback)
        callback(keyboardApps);
    };
  },

  getInstalledLayouts: function kh_getInstalledLayouts(callback) {
    var self = this;
    self.getInstalledKeyboards(function parseLayouts(apps) {
      self.keyboardLayoutsByType = {};
      apps.forEach(function(app) {
        var entryPoints = app.manifest.entry_points;
        for (var name in entryPoints) {
          var launchPath = entryPoints[name].launch_path;
          if (!entryPoints[name].types) {
            console.warn('the keyboard app did not declare type.');
            continue;
          }
          var supportTypes = entryPoints[name].types;
          supportTypes.forEach(function(type) {
            if (!type || !(type in TYPE_GROUP))
              return;

            if (!self.keyboardLayoutsByType[type])
              self.keyboardLayoutsByType[type] = [];

            self.keyboardLayoutsByType[type].push({
              'name': name,
              'appName': app.manifest.name,
              'origin': app.origin,
              'path': launchPath,
              'index': self.keyboardLayoutsByType[type].length,
              'enabled': false
            });
          });
        }
      });
      if (callback)
        callback(apps);
    });
  }
};
