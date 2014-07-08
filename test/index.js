'use strict';

var fc = require('../lib/index.js');

fc(__dirname + '/a.txt', __dirname + '/b.txt', function(err, res) {
  if(err) {
    throw err;
  }
  console.log(res);
});
