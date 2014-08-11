// var path = require('path');
var Onion = require('../').Onion;


// var B = Onion.extend({
//   name: 'Test-bclass',
//   eventable: true
// });

// var Bc = B.extend({
//   name: "Test-under-bclass",
//   init: function (options) {
//     // console.log('init in SubClass', options)
//   }
// });
// console.log('Bc.prototype',Bc.prototype,'Bc.super_' ,Bc.super_)
// var C = Onion.extend({
//   name: "Test-cclass",
//   eventable: false
// });


// var a = new Onion({test:1});
// var b = new B;

// var bc = new Bc;
// var c = new C;

// // a.push(function (argument) {
  
// // });

// b.on('a', function () {
//   console.log('a');
// });
// b.emit('a');

// console.log(a.__proto__, bc.__proto__.init);
// // c.on('a', function () {
// //   console.log('c')
// // });
// // c.emit('a')


// var Onion = require('tiny-onion').Onion;
var MyOnion = Onion.extend({
  "name": "My-onion"
});
var myOnion = new MyOnion({
  initOpt: "this is a init options"
});
myOnion.use(function(arg0, next) {
  // console.log('arg0 is ',arg0);
  next({
    pushArg: 'this is a push arg'
  })
}).use(function (pushArg, arg0, next) {
  console.log(pushArg, arg0);
  next();
}).handle({
  "opt":"this is your options"
})({arg0:'this is arg0'});

var MyEvtOnion = MyOnion.extend({
  "name": "My-evt-onion",
  "eventable": true
});
var myEvtOnion = new MyEvtOnion;
myEvtOnion.on("start", function(){
  console.log('now system start');
});
myEvtOnion.use(function (next) {
  myEvtOnion.emit('start');
  next();
}).use(function (next) {
  console.log('finished');
}).handle()();