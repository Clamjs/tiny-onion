var EventEmitter = require('events').EventEmitter;
var util = require('./util.js');
var debug = require('debug')('TinyOnion');

function noop () {}

function Onion (options) {
  this.stack_ = [];
  this.config(options);
  return this;
}
Onion.prototype = {
  constructor: Onion,
  name: "Onion",
  options: {},
  config: function (options) {
    if (this.options === options) {return this}
    // need deep
    this.options = util.mix(true, this.options, options || {});
    return this;
  },
  use: function (handle) {
    util.isFunction(handle) && this.stack_.push(handle);
    return this;
  },
  handle: function (options) {
    var self = this;
    self.config(options);
    debug('Now start %s\'s handle ', self.name);
    return function () {
      var context = this;
      var args = util.makeArray(arguments);
      var next = args.slice(-1)[0];
      var stack = self.stack_;
      var vernier = -1;
      var handle;
      var _args;
      var _sendData = 0;
      var _next = function (data) {
        vernier += 1;
        // first runtime
        if (!_args) {
          // understand the parent onion base
          if (util.isFunction(next)) {
            debug('With parent next');
            // got the next
            next = args.pop();
          } else {
            // only self
            debug('Single mode next');
            next = null;
          }
          // clone the arguments;
          _args = args.slice();
          // make the last argument is current `next`
          _args.push(_next);
        }

        // send some data to the next step before;
        // reset the senddata and shift the data
        // and then if has a data to send
        // continue send the data
        if (_sendData) {
            _sendData = false;
            _args.shift();
        }

        // now have a data to send
        // set the tag true and push the data at first place;
        if (typeof data != "undefined") {
            _sendData = true;
            _args.unshift(data);
        }
        debug('Go to %s\'s step %s', self.name, vernier);
        // debug('Handle is \n\r%s ', (stack[vernier]||'').toString())
        // has a handle at the token
        if (util.isFunction(handle = stack[vernier])) {
          debug('Get handle . Run handle now!');
          return handle.apply(context, _args);
        }

        // don't have a handle but haven't finished.
        if (vernier < stack.length) {
          debug('\x1B[33mThe handle `%o` is not a function in handle stacks[%s]!\x1B[39m', handle, vernier);
          return _next(data);
        }
        // while the loop finished but got the parent mode;
        // send all data to parent;
        debug('\x1B[33mOut of %s\'s range.\x1B[39m', self.name);
        if (next) {
          debug('\x1B[33mFind the parent next,run parent next!\x1B[39m');
          return next(data);
        }
      };
      return _next();
    }
  }
};
Onion.extend = function extend (properties, members) {
  var fnName = properties.name = util.camelCase(properties.name);
  var SupClass = this;
  var SubClass = new Function([
    'return function ' + fnName + '(options) {',
      'this.stack_ = [];',
      'this.super_ = new ' + fnName + '.super_;',
      'this.super_.config.call(this, options);',
      'return this;',
    '}'
  ].join('\r\n'))();
  if (properties.eventable) {
    util.mix(SubClass.prototype, EventEmitter.prototype);
  }
  util.mix(SubClass.prototype, SupClass.prototype, properties);
  util.mix(SubClass, SupClass, members);
  SubClass.super_ = SupClass;
  return SubClass;
};
exports.Onion = Onion;
exports.Util = util;