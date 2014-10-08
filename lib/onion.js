var EventEmitter = require('events').EventEmitter;
var util = require('mace');
var debug = util.debug('Onion');

function Onion (options) {
  if (!(this instanceof Onion)) {return new Onion(options);}
  this.initial(options);
  return this;
}
Onion.prototype = {
  constructor: Onion,
  name: "Onion",
  initial: function (options) {
    this.options = {};
    this.stack_ = [];
    this.config(options);
  },
  config: function (options) {
    if (this.options === options) {return this}
    // need deep
    this.options = util.merge(true, this.options, options || {});
    return this;
  },
  use: function (handle) {
    util.isFunction(handle) && this.stack_.push(handle);
    return this;
  },
  handle: function (options) {
    var self = this;
    self.config(options);
    // debug('Now start %s\'s handle ', self.name);
    return function () {
      var context = this;
      var args = util.makeArray(arguments);
      var next = args.slice(-1)[0];
      var stack = self.stack_;
      var vernier = -1;
      var handle;
      if (util.isFunction(next)) {
        next = args.pop();
        args.push(_next);
      } else {
        next = null;
        args.push(_next);
      }
      function _next() {
        vernier += 1;
        var data = util.makeArray(arguments);
        var _args = args.concat(data);
        if (next) {
          _args.push(next);
        }
        // debug('Go to %s\'s step %s', self.name, vernier);
        // debug('Handle is \n\r%s ', (stack[vernier]||'').toString())
        // has a handle at the token
        if (util.isFunction(handle = stack[vernier])) {
          // debug('Get handle . Run handle now!');
          return handle.apply(context, _args);
        }

        // don't have a handle but haven't finished.
        if (vernier < stack.length) {
          // debug('\x1B[33mThe handle `%o` is not a function in handle stacks[%s]!\x1B[39m', handle, vernier);
          return _next.apply(this, data);
        }
        // while the loop finished but got the parent mode;
        // send all data to parent;
        // debug('\x1B[33mOut of %s\'s range.\x1B[39m', self.name);
        if (next) {
          // debug('\x1B[33mFind the parent next,run parent next!\x1B[39m');
          return next.apply(this, data);
        }
      };
      return _next();
    }
  }
};
Onion.extend = function extend (properties, members) {
  var fnName = properties.name = util.camelCase('-' + properties.name || 'onion');
  var SupClass = this;
  var SubClass = new Function('Super', [
    'return function ' + fnName + '(options) {',
      'if (!(this instanceof ' + fnName + ')) {return new ' + fnName + '(options)}',
      'this.super_ = new Super(options);',
      'this.initial(options);',
      'return this;',
    '}'
  ].join('\r\n'))(SupClass);
  if (properties.eventable) {
    util.merge(SubClass.prototype, EventEmitter.prototype);
  }
  util.merge(SubClass.prototype, SupClass.prototype, properties);
  util.merge(SubClass, SupClass, members);
  return SubClass;
};
exports = module.exports = Onion;