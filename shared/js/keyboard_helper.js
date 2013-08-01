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

  getKeyboardSettings: [],

  _debugMode: false,

  _debug: function kh_debug(string) {
    if (this._debugMode)
      console.log('[keyboard_helper]' + string);
  },

  getAllLayouts: function kh_getAllLayouts(callback) {
    var self = this;
    var settings = window.navigator.mozSettings;
    var request = settings.createLock().get(SETTINGS_KEY);
    request.onsuccess = function(e) {
      var value = request.result[SETTINGS_KEY];
      if (!value) {
        self.getInstalledLayouts(function(apps) {
          //XXX write settings back, this shouldn't happen.
          var allLayouts = self.keyboardLayoutsByType;
          self.getKeyboardSettings = [];
          apps.forEach(function(app) {
            var entryPoints = app.manifest.entry_points;
            for (var name in entryPoints) {
              var launchPath = entryPoints[name].launch_path;
              if (!entryPoints[name].types) {
                console.warn('the keyboard app did not declare type.');
                continue;
              }
              // for settings
              self.getKeyboardSettings.push({
                'name': name,
                'appName': app.manifest.name,
                'origin': app.origin,
                'enabled': false
              });
            }
          });

          // init settings and keyboard layout
          for (var type in allLayouts) {
            var layoutOrigin = allLayouts[type][0].origin;
            var layoutName = allLayouts[type][0].name;
            //XXX default enable should be get from locals form.
            allLayouts[type][0].enabled = true;

            for (var i in self.getKeyboardSettings) {
              if (self.getKeyboardSettings[i].name == layoutName &&
                  self.getKeyboardSettings[i].origin == layoutOrigin) {
                self.getKeyboardSettings[i].enabled = true;
                break;
              }
            }
          }
          // XXX settings will trigger again so ...
          // callback(allLayouts);
          self.saveToSettings();
        });
      } else {
        self.getKeyboardSettings = JSON.parse(value);
        self.getInstalledLayouts(function(apps) {
          //self.keyboardLayoutsByType = allLayouts;
          for (var i in self.getKeyboardSettings) {
            var origin = self.getKeyboardSettings[i].origin;
            var name = self.getKeyboardSettings[i].name;
            var layoutEnabled = self.getKeyboardSettings[i].enabled;
            if (!layoutEnabled)
              continue;
            self.setLayoutEnable(origin, name, layoutEnabled);
          }
          callback(self.keyboardLayoutsByType);
        });
      }
    };
  },

  saveToSettings: function ke_saveToSettings() {
    var settings = window.navigator.mozSettings;
    var obj = {};
    obj[SETTINGS_KEY] = JSON.stringify(this.getKeyboardSettings);
    settings.createLock().set(obj);
  },

  setLayoutEnable: function kh_setLayoutEnable(origin, name, layoutEnabled,
    callback) {
    for (var type in this.keyboardLayoutsByType) {
      for (var i in this.keyboardLayoutsByType[type]) {
        if (origin === this.keyboardLayoutsByType[type][i].origin &&
          name === this.keyboardLayoutsByType[type][i].name) {
          this.keyboardLayoutsByType[type][i].enabled = layoutEnabled;
          break;
        }
      }
    }

    if (callback)
      callback();
    //this._debug(JSON.stringify(this.keyboardLayoutsByType));
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

