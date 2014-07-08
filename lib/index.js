'use strict';

// inspired by: https://coderwall.com/p/lb7unq

var fs = require('fs'),
  async = require('async'),
  bt = require('buffertools');


function compare(file1, file2, cb) {
  var chunkSize = 10000, offset = 0,
    end = function(err, res, fd1, fd2) {
      async.parallel([
        function(next) {
          fs.close(fd1, function(err) {
            next(err);
          });
        },
        function(next) {
          fs.close(fd2, function(err) {
            next(err);
          });
        }
      ], function(err2) {
        if(err2) {
          cb(err2);
        } else {
          cb(err, res);
        }
      });
    };

  function readChunks(fd1, fd2) {
    async.parallel({
      chunk1 : function(next) {
        var bf = new Buffer(chunkSize);
        fs.read(fd1, bf, 0, chunkSize, offset, function(err, bytyesRead, buffer) {
          next(err, bytyesRead > 0 ? buffer : null);
        });
      },
      chunk2 : function(next) {
        var bf = new Buffer(chunkSize);
        fs.read(fd2, bf, 0, chunkSize, offset, function(err, bytyesRead, buffer) {
          next(err, bytyesRead > 0 ? buffer : null);
        });
      }
    }, function(err, chunks) {
      if(err) {
        cb(err, null, fd1, fd2);
      }
      
      if(chunks.chunk1 === null && chunks.chunk2 === null) {
        end(null, 0, fd1, fd2);
      } else if(chunks.chunk1 === null) {
        end(null, 1, fd1, fd2);
      } else if(chunks.chunk2 === null) {
        end(null, -1, fd1, fd2);
      } else {
        var cmp = bt.compare(chunks.chunk1, chunks.chunk2);
        if(cmp === 0) {
          offset += chunkSize;
          readChunks(fd1, fd2);
        } else {
          end(null, cmp, fd1, fd2);
        }
      }

    });
  }

  async.parallel({
    fd1 : function(next) {
      fs.open(file1, 'r', function(err, fd) {
        next(err, fd);
      });
    },
    fd2 : function(next) {
      fs.open(file2, 'r', function(err, fd) {
        next(err, fd);
      });
    },
  }, function(err, results) {
    if(err) {
        cb(err, null);
    } else {
        readChunks(results.fd1, results.fd2);
    }
  });

}

module.exports = compare;
