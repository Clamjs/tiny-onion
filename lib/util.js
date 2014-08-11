var util = require('util');
var info = require(__dirname + '/../package.json');
var crypto = require('crypto');
var reCamelCase = /-([a-z])/gi;

function Util() {
}
Util.prototype = {
    constructor: Util,
    arequire: function (file) {
        file = require.resolve(file);
        require.cache[file] = null;
        delete require.cache[file];
        return require(file);
    },
    camelCase: function (name) {
        if (!name) {
            return 'OnionClass';
        }
        // Onion
        if (-1 === name.indexOf('-')) {
            return name;
        }
        // Onion-class ==> OnionClass
        //
        return name.replace(reCamelCase, function (a, s) {
            return s.toUpperCase();
        });
    },
    Klass: function (construc, prop, supper) {
        supper = supper || Object;
        // 继承
        util.inherits(construc, supper);
        prop && this.mix(construc.prototype, Object.create(prop));
        return construc;
    },
    hasBom: function (buffer) {
        return (
            buffer[0] === 0xEF &&
                buffer[1] === 0xBB &&
                buffer[2] === 0xBF
            );
    },
    isGzip: function (buffer) {
        return (
            buffer[0] === 0x1F &&
                buffer[1] === 0x8B &&
                buffer[2] === 0x08
            );
    },
    __proto__: util,
    version: info.version,
    name: info.name,
    type: function (o) {
        var s = this.toString.call(o);
        return s.substr(8, s.length - 9);
    },
    isFunction: function (o) {
        return this.type(o) === 'Function';
    },
    isArray: Array.isArray || function (o) {
        return this.type(o) === 'Array';
    },
    isSafeInteger: function (o) {
        if (Number.isSafeInteger) {
            return Number.isSafeInteger(o);
        }
        return (o | 0) === ~~o;
    },
    isLong: function (o) {
        return +o == o && ~~o && !this.isSafeInteger(o);
    },
    isFloat: function (o) {
        return o >= ~~o && o.indexOf('.') > 0;
    },
    isNaN: Number.isNaN,
    isFinity: Number.isFinity,
    isObject: function (o) {
        return this.type(o) === 'Object';
    },
    isNumber: function (o) {
        return o === 0 || o && this.type(o) === 'Number';
    },
    isBuffer: Buffer.isBuffer,
    mix: function () {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;

            // skip the boolean and the target
            target = arguments[ i ] || {};
            i++;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !this.isFunction(target)) {
            target = {};
        }

        // extend util itself if only one argument is passed
        if (i === length) {
            target = this;
            i--;
        }

        for (; i < length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[ i ]) != null) {
                // Extend the base object
                for (name in options) {
                    src = target[ name ];
                    copy = options[ name ];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && ( this.isObject(copy) || (copyIsArray = this.isArray(copy)) )) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && this.isArray(src) ? src : [];

                        } else {
                            clone = src && this.isObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[ name ] = this.mix(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[ name ] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    },
    makeArray: function (o, from, to) {
        return Array.prototype.slice.call(o, from, to);
    },
    forEach: function (o, fn, context) {
        if (o.forEach) {
            return o.forEach(fn, context);
        }
        for (var i in o) {
            o.hasOwnProperty(i) && fn.call(context || o[i], o[i], i, o);
        }
    },
    map: function (o, fn, context) {
        if (o.map) {
            return o.map(fn, context)
        }
        var ret = {};
        this.forEach(o, function (v, i) {
            ret[i] = fn.call(this, v, i, o);
        }, context);
        return ret;
    },
    some: function (o, fn, context) {
        if (o.some) {
            return o.some(fn, context)
        }
        for (var i in o) {
            if (o.hasOwnProperty(i) && fn.call(context || o[i], o[i], i, o)) {
                return true;
            }
        }
        return false;
    },
    every: function (o, fn, context) {
        if (o.every) {
            return o.every(fn, context)
        }
        for (var i in o) {
            if (o.hasOwnProperty(i) && !fn.call(context || o[i], o[i], i, o)) {
                return false;
            }
        }
        return true;
    },
    filter: function (o, fn, context) {
        if (o.filter) {
            return o.filter(fn, context)
        }
        var ret = {};
        for (var i in o) {
            if (o.hasOwnProperty(i) && fn.call(context || o[i], o[i], i, o)) {
                ret[i] = o[i];
            }
        }
        return ret;
    },
    joinBuffer: function (bufferStore) {
        var length = bufferStore.reduce(function (previous, current) {
            return previous + current.length;
        }, 0);

        var data = new Buffer(length);
        var startPos = 0;
        bufferStore.forEach(function (buffer) {
            buffer.copy(data, startPos);
            startPos += buffer.length;
        });
        //fix 80% situation bom problem.quick and dirty
        if (this.hasBom(data)) {
            data = data.slice(3, data.length);
        }
        return data;
    },
    random: function (min, max) {
        if (null == max) {
            max = min;
            min = 0;
        }
        return min + (max - min) * Math.random();
    },
    randomString: function (length) {
        var str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+=-`|/\\"[]{},.<>?|";:\'艺';
        var ret = '';
        while (--length > 0) {
            ret += str[this.random(0, str.length + 1) | 0];
        }
        return (ret + '艺').replace(/\"|\'/gm, '\\$&');
    },
    md5: function (str) {
        return crypto.createHash('md5').update(str).digest('hex');
    },
    trim: function (s) {
        if (s.trim) {
            return s.trim()
        }
        return String(s).replace(/^\s+|\s+$/g, '');
    },
    each: function () {
        this.forEach.apply(this, arguments);
    },
    escapeHTML: function (s) {
        // var reEscape = /(\&|\>|\<|\`|\/|\"|\')/gi;
        var reEscape = /(\&|\>|\<|\`|\"|\')/gi;
        var escapeEntry = {
            '"': "&quot;",
            '&': "&amp;",
            "'": "&#x27;",
            // '/': "&#x2F;",
            '<': "&lt;",
            '>': "&gt;",
            '`': "&#x60;"
        };
        return String(s).replace(reEscape, function (o, s) {
            return escapeEntry[s] || s;
        });
    },
    unescapeHTML: function (s) {
        // var reUnescape = /(&amp;|&gt;|&lt;|&#x60;|&#x2F;|&quot;|&#x27;)/gi;
        var reUnescape = /(&amp;|&gt;|&lt;|&#x60;|&quot;|&#x27;)/gi;
        var unescapeEntry = {
            '&amp;': '&',
            '&gt;': '>',
            '&lt;': '<',
            '&#x60;': '`',
            // '&#x2F;': '/',
            '&quot;': '"',
            '&#x27;': "'"
        };
        return String(s).replace(reUnescape, function (o, s) {
            return unescapeEntry[s] || s
        });
    },
    format: function (str, args) {
        return str.replace(/\%[a-z]+/img, function () {
            return args.shift();
        });
    },
    guid: function () {
        var guid = 1000000;
        return function (prefix, len) {
            return fixlen(prefix, (--guid).toString(16).toUpperCase(), len | 0 || 15);
        }
        function fixlen(prefix, s, l) {
            var _ = '_';
            var str = prefix + _ + s;
            var m = l - str.length;
            if (m <= 0) {
                return str;
            }
            return prefix + _ + new Array(m + 1).join(0) + s;
        }
    },
    uuid: function () {
        var seed = 0;
        return function () {
            var id = (new Date()).getTime() + '-' + (seed++).toString();
            seed %= 10000;
            return id;
        }
    }
};

exports = module.exports = new Util;