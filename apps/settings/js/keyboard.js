/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/* We will get this const definition from shared/js/keyboard_helper.js
const TYPE_GROUP = {
  'text': true,
  'number': true,
  'option': true
}

const SETTINGS_KEY = 'keyboard.enabled-layouts';
*/

var Observable = function(obj) {
  var _eventHandlers = {};
  var _observable = {
    observe: function o_observe(p, handler) {
      var handlers = _eventHandlers[p];
      if (handlers) {
        handlers.push(handler);
      }
    }
  };

  var _getFunc = function(p) {
    return function() {
      return _observable['_' + p];
    };
  };

  var _setFunc = function(p) {
    return function(value) {
      var oldValue = _observable['_' + p];
      if (oldValue !== value) {
        _observable['_' + p] = value;
        var handlers = _eventHandlers[p];
        if (handlers) {
          handlers.forEach(function(handler) {
            handler(value, oldValue);
          });
        }
      }
     };
  };

  for (var p in obj) {
    _eventHandlers[p] = [];

    Object.defineProperty(_observable, '_' + p, {
      value: obj[p],
      writable: true
    });

    Object.defineProperty(_observable, p, {
      enumerable: true,
      get: _getFunc(p),
      set: _setFunc(p)
    });
  }

  return _observable;
};

var ObservableArray = function(array) {
  var _array = array || [];
  var _eventHandlers = {
    'insert': [],
    'remove': [],
    'replace': [],
    'reset': []
  };

  var _notify = function(eventType, data) {
    var handlers = _eventHandlers[eventType];
    handlers.forEach(function(handler) {
      handler({
        type: eventType,
        data: data
      });
    });
  };

  return {
    get length() {
      return _array.length;
    },

    get array() {
      return _array;
    },

    forEach: function oa_foreach(func) {
      _array.forEach(func);
    },

    observe: function oa_observe(eventType, handler) {
      var handlers = _eventHandlers[eventType];
      if (handlers) {
        handlers.push(handler);
      }
    },

    push: function oa_push(item) {
      _array.push(item);

      _notify('insert', {
        index: _array.length - 1,
        count: 1,
        items: [item]
      });
    },

    pop: function oa_pop() {
      var item = _array.pop();

      _notify('remove', {
        index: _array.length,
        count: 1
      });

      return item;
    },

    splice: function oa_splice(index, count) {
      if (arguments.length < 2)
        return;

      var addedItems = Array.prototype.slice.call(arguments, 2);
      _array.splice(_array, arguments);

      _notify('remove', {
        index: index,
        count: count
      });

      _notify('insert', {
        index: index,
        count: addedItems.length,
        items: addedItems
      });
    },

    set: function oa_set(index, value) {
      if (index < 0 || index >= _array.length)
        return;

      var oldValue = _array[index];
      _array[index] = value;
      _notify('replace', {
        index: index,
        oldValue: oldValue,
        newValue: value
      });
    },

    get: function oa_get(index) {
      return _array[index];
    },

    reset: function oa_reset(array) {
      _array = array;
      _notify('reset', {
        items: _array
      });
    }
  };
};

var ListView = function(root, observableArray, templateFunc) {
  var _observableArray = null;
  var _root = root;
  var _templateFunc = templateFunc;

  var _handleEvent = function(event) {
    var data = event.data;
    switch (event.type) {
      case 'insert':
        _insert(data.index, data.items);
        break;
      case 'remove':
        _remove(data.index, data.count);
        break;
      case 'replace':
        _replace(data.index, data.newValue);
        break;
      case 'reset':
        _reset(data.items || []);
      default:
        break;
    }
  };

  var _insert = function(index, items) {
    // add DOM elements
    if (items.length > 0) {
      var nextElement =
        _root.querySelector('li:nth-child(' + (index + 1) + ')');
      for (var i = items.length - 1; i >= 0; i--) {
        var curElement = _templateFunc(items[i]);
        _root.insertBefore(curElement, nextElement);
        nextElement = curElement;
      }
    }
  };

  var _remove = function(index, count) {
    if (count === 0)
      return;

    // remove DOM elements
    if (count === _root.childElementCount) {
      // clear all
      while (_root.firstElementChild) {
        _root.removeChild(_root.firstElementChild);
      }
    } else {
      var nextElement =
        _root.querySelector('li:nth-child(' + (index + 1) + ')');
      for (var i = 0; i < count; i++) {
        if (nextElement) {
          var temp = nextElement.nextElementSibling;
          _root.removeChild(nextElement);
          nextElement = temp;
        }
      }
    }
  };

  var _replace = function(index, value) {
    var element = _root.querySelector('li:nth-child(' + (index + 1) + ')');
    if (element) {
      _templateFunc(value, element);
    }
  };

  var _reset = function(items) {
    var itemCount = items.length;
    var elementCount = _root.childElementCount;

    if (itemCount == 0) {
      _remove(0, elementCount);
    } else if (itemCount <= elementCount) {
      items.forEach(function(item, index) {
        _replace(index, item);
      });
      // remove extra elements
      _remove(itemCount, elementCount - itemCount);
    } else {
      var slicedItems = items.slice(0, elementCount);
      var remainingItems = items.slice(elementCount);

      slicedItems.forEach(function(item, index) {
        _replace(index, item);
      });
      // add extra elements
      _insert(elementCount, remainingItems);
    }
  };

  var view = {
    set: function lv_set(observableArray) {
      // clear all existing items
      if (_observableArray) {
        _remove(0, _observableArray.length);
      }

      _observableArray = observableArray;
      if (_observableArray) {
        _observableArray.observe('insert', _handleEvent);
        _observableArray.observe('remove', _handleEvent);
        _observableArray.observe('replace', _handleEvent);
        _observableArray.observe('reset', _handleEvent);

        _insert(0, _observableArray.array);
      }
    }
  };

  view.set(observableArray);
  return view;
};

var KeyboardContext = (function() {
  var SETTINGS_KEY = 'keyboard.enabled-layouts';
  var _layoutSetting = null;
  var _keyboardDict = null; // stores layouts indexed by appName

  var _keyboards = ObservableArray([]);
  var _enabledLayouts = ObservableArray([]);

  var _isReady = false;
  var _callbacks = [];

  var Keyboard = function(name, description, launchPath, layouts) {
    return {
      name: name,
      description: description,
      launchPath: launchPath,
      layouts: layouts
    };
  };

  var Layout = function(name, appName, description, types, index, enabled) {
    var _observable = Observable({
      name: name,
      appName: appName,
      description: description,
      types: types,
      index: index,
      enabled: enabled
    });

    // Layout enabled changed. write the change to mozSettings.
    _observable.observe('enabled', function(newValue, oldValue) {
      Settings.getSettings(function(result) {
        var enabledLayouts = _JSON2Obj(result[SETTINGS_KEY]);
        if (enabledLayouts) {
          types.forEach(function(type) {
            if (enabledLayouts[type]) {
              enabledLayouts[type][index].enabled = newValue;
            }
          });
          var obj = {};
          obj[SETTINGS_KEY] = JSON.stringify(enabledLayouts);
          Settings.mozSettings.createLock().set(obj);
        }
      });
    });

    return _observable;
  };

  var _JSON2Obj = function(jsonStr) {
    if (jsonStr) {
      return JSON.parse(jsonStr);
    } else {
      return null;
    }
  };

  var _refreshKeyboardDict = function() {
    if (!_layoutSetting)
      return;

    var layoutTypeDict = {}; // stores types indexed by appName and name
    var layoutMap = {};
    _keyboardDict = {};

    for (var type in TYPE_GROUP) {
      var rawLayouts = _layoutSetting[type];
      if (rawLayouts) {
        rawLayouts.forEach(function(rawLayout) {
          // add to layoutTypeDict
          var appInfo = layoutTypeDict[rawLayout.appName];
          if (!appInfo) {
            appInfo = layoutTypeDict[rawLayout.appName] = {};
          }
          var layoutTypes = appInfo[rawLayout.name];
          if (!layoutTypes) {
            layoutTypes = appInfo[rawLayout.name] = [];
          }
          layoutTypes.push(type);

          // add to keyboardDict
          var keyboard = _keyboardDict[rawLayout.appName];
          if (!keyboard) {
            keyboard = _keyboardDict[rawLayout.appName] = ObservableArray([]);
          }
          var layout = layoutMap[rawLayout.name];
          if (layout) {
            layout.types.push(type);
          } else {
            var newLayout = Layout(rawLayout.name, rawLayout.appName,
                                   rawLayout.description,
                                   [type], rawLayout.index,
                                   rawLayout.enabled);
            layoutMap[rawLayout.name] = newLayout;
            keyboard.push(newLayout);
          }
        });
      }
    }

    _refreshEnabledLayout();
  };

  var _refreshEnabledLayout = function() {
    KeyboardHelper.getInstalledKeyboards(function(allKeyboards) {
      var enabledLayouts = [];
      allKeyboards.forEach(function(rawKeyboard) {
        var layouts = _keyboardDict[rawKeyboard.manifest.name];
        if (layouts) {
          layouts.forEach(function(layout) {
            if (layout.enabled) {
              enabledLayouts.push(layout);
            }
          });
        }
      });

      _enabledLayouts.reset(enabledLayouts);
    });
  };

  var _initInstalledKeyboards = function(callback) {
    KeyboardHelper.getInstalledKeyboards(function(allKeyboards) {
      allKeyboards.forEach(function(rawKeyboard) {
        var manifest = rawKeyboard.manifest;
        _keyboards.push(Keyboard(manifest.name,
                                 manifest.description,
                                 manifest.launch_path,
                                 _keyboardDict[manifest.name]));
      });

      callback();
    });
  };

  var _init = function(callback) {
    Settings.mozSettings.addObserver(SETTINGS_KEY,
      function(event) {
        _layoutSetting = _JSON2Obj(event.settingValue);
        _refreshKeyboardDict();
    });

    Settings.getSettings(function(result) {
      var setting = result[SETTINGS_KEY];
      if (setting) {
        _layoutSetting = _JSON2Obj(setting);
        _refreshKeyboardDict();
        _initInstalledKeyboards(callback);
      }
    });
  };

  var _ready = function(callback) {
    if (callback) {
      if (_isReady) {
        callback();
      } else {
        _callbacks.push(callback);
      }
    }
  };

  _init(function() {
    _isReady = true;
    _callbacks.forEach(function(callback) {
      callback();
    });
  });

  return {
    keyboards: function(callback) {
      _ready(function() {
        callback(_keyboards);
      });
    },
    enabledLayouts: function(callback) {
      _ready(function() {
        callback(_enabledLayouts);
      });
    }
  };
})();

var KeyboardPanel = (function() {
  var _keyboardTemplate = function kl_keyboardTemplate(keyboard, recycled) {
    var container = null;
    var link;
    if (recycled) {
      container = recycled;
      link = container.querySelector('a');
    } else {
      container = document.createElement('li');
      link = document.createElement('a');
      container.appendChild(link);
    }

    link.textContent = keyboard.name;
    return container;
  };

  return {
    init: function kl_init() {
      this.initAllKeyboardListView();
    },

    initAllKeyboardListView: function kl_initKeyboardLV() {
      KeyboardContext.keyboards((function(keyboards) {
        var ul = document.getElementById('allKeyboardList');
        ul.hidden = (keyboards.length == 0);
        ListView(ul, keyboards, _keyboardTemplate);
      }).bind(this));
    }
  };
})();

var KeyboardSelectionPanel = (function() {
  var _layoutTemplate = function ks_layoutTemplate(layout, recycled) {
    var container = null;
    var span;
    if (recycled) {
      container = recycled;
      span = container.querySelector('span');
    } else {
      container = document.createElement('li');
      span = document.createElement('span');
      container.appendChild(span);
    }

    span.textContent = layout.appName + ': ' + layout.name;
    return container;
  };

  return {
    init: function ks_init() {
      this.initEnabledLayoutListView();
    },

    initEnabledLayoutListView: function ks_initEnabledLayoutListView() {
      KeyboardContext.enabledLayouts(function(enabledLayouts) {
        var ul = document.getElementById('enabledKeyboardList');
        ListView(ul, enabledLayouts, _layoutTemplate);
      });
    }
  };
})();

var KeyboardSelectionAddMorePanel = (function() {
  var _layoutTemplate = function ksa_layoutTemplate(layout, recycled) {
    var container = null;
    var layoutName, checkbox;
    if (recycled) {
      container = recycled;
      checkbox = container.querySelector('input');
      span = container.querySelector('span');
    } else {
      container = document.createElement('li');
      checkbox = document.createElement('input');
      layoutName = document.createElement('a');
      var label = document.createElement('label');
      var span = document.createElement('span');

      label.className = 'pack-checkbox';
      checkbox.type = 'checkbox';

      label.appendChild(checkbox);
      label.appendChild(span);

      container.appendChild(label);
      container.appendChild(layoutName);

      // event handlers
      checkbox.addEventListener('change', function() {
        layout.enabled = this.checked;
      });
    }

    //XXX we should display an unique name here, not just layout name.
    layoutName.textContent = layout.name;
    checkbox.checked = layout.enabled;

    return container;
  };

  return {
    init: function ksa_init() {
      this.initAllLayoutListView();
    },

    initAllLayoutListView: function ksa_initAllLayoutListView() {
      KeyboardContext.keyboards(function(keyboards) {
        var container = document.getElementById('keyboardAppContainer');
        keyboards.forEach(function(keyboard) {
          var ul = document.createElement('ul');
          container.appendChild(ul);
          var listView = ListView(ul, keyboard.layouts,
            _layoutTemplate);
        });
      });
    }
  };
})();

navigator.mozL10n.ready(function keyboard_init() {
  KeyboardPanel.init();
  KeyboardSelectionPanel.init();
  KeyboardSelectionAddMorePanel.init();
});
