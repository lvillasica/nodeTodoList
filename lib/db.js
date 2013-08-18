var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;

exports.connect = connect;
var connection = exports.connection = new EventEmitter();

function connect (location, callback) {
  var file = 'db.data';
  var dbInfo = 'db.info';

  exports.location = path.join(location, file);
  exports.infoLocation = path.join(location, dbInfo);

  var writeFile = function (file) {
    var exists = fs.existsSync(file);
    if (!exists) {
      try {
        fs.writeFileSync(file, JSON.stringify({}));
      } catch (err) {
        if (callback && _.isFunction(callback)) {
          callback(err);
        }
        return exports.connection.emit('error', err);
      }
    }
  };

  process.nextTick(function () {
    writeFile(exports.location);
    writeFile(exports.infoLocation);

    if (callback && _.isFunction(callback)) {
      callback(null);
    }
    connection.emit('open', exports);
  });
}

function model(modelName) {
  var model = new Model(modelName);
  return model;
}

exports.model = model;

function Model(modelName) {
  this.name = modelName;
  this.dbname = modelName.toLowerCase();
  this.file = exports.location;
  this.infoLocation = exports.infoLocation;
  this.parsedJSON = function (data) {
      try {
        data = JSON.parse(data);
      } catch(err) {
        return callback('JSON parse: ' + err);
      }

      return data;
    };
}

Model.prototype.getNextID = function(callback) {
    var _this = this;
    var dbData = null;
    var dbInfo = null;
    var lastIndex = 0;

    fs.readFile(this.infoLocation, {encoding: 'utf8'}, function (err, data) {
      if (err) return callback(err);

      dbInfo = _this.parsedJSON(data);

      if (!dbInfo[_this.dbname]) {
        dbInfo[_this.dbname] = {lastIndex: lastIndex};

        fs.readFile(_this.file, {encoding: 'utf8'}, function (err, data) {
          if (err) return callback(err);

          dbData = _this.parsedJSON(data);

          if (!dbData[_this.dbname]) {
            dbData[_this.dbname] = [];
          } else {
            var dataLen = dbData[_this.dbname].length;
            if (dataLen > 0) {
              try {
                lastIndex = dbData[_this.dbname][dataLen - 1]._id;
              } catch (err) {
                return callback('getNextID Error: ' + err);
              }
            } else {
              lastIndex = 0;
            }
          }

          dbInfo[_this.dbname].lastIndex = lastIndex;
          return callback(null, lastIndex + 1);
        });
      } else {
        return callback(null, dbInfo[_this.dbname].lastIndex + 1);
      }
    });
};

Model.prototype.insert = function(object, callback) {
  var _this = this;

  this.getNextID(function (err, id) {

    if (err) return callback(err);

    fs.readFile(_this.file, {encoding: 'utf8'}, function (err, data) {
      if (err) return callback(err);

      try {
        data = JSON.parse(data);
      } catch (err) {
        return callback('JSON.parse at insert: ' + err);
      }

      object['_id'] = id;

      if (!data[_this.dbname]) {
        data[_this.dbname] = [];
        data[_this.dbname].push(object);
      } else {
        data[_this.dbname].push(object);
      }

      fs.writeFile(_this.file, JSON.stringify(data), function (err) {
          if (err) return callback(err);

          _this.updateInfo(object, callback);
      });
    });
  });
};

Model.prototype.updateInfo = function (object, callback) {
  var info = {};
  info[this.dbname] = {lastIndex: object._id};
  fs.writeFile(this.infoLocation, JSON.stringify(info), function (err) {
    if (err) return callback(err);

    return callback(null, object);
  });
}

Model.prototype.update = function(object, callback) {
  var _this = this;
  var thedata = null;
  var result = false;

  fs.readFile(_this.file, {encoding: 'utf8'}, function (err, data) {
    if (err) return callback(err);

    thedata = _this.parsedJSON(data);
    if (!thedata[_this.dbname]) return callback('Model ' + _this.dbname + ' not found.');

    _.each(thedata[_this.dbname], function(obj, idx) {
      if (obj._id == object._id) {
        thedata[_this.dbname][idx] = object;

        fs.writeFile(_this.file, JSON.stringify(thedata), function (err) {
          if (err) return callback(err);
        });

        result = JSON.stringify(object);
      }
    });
    
    return callback(null, result);
  });
};

Model.prototype.destroy = function(id, callback) {
  var _this = this;
  var thedata = null;

  fs.readFile(_this.file, {encoding: 'utf8'}, function (err, data) {
    if (err) return callback(err);

    thedata = _this.parsedJSON(data);
    if (!thedata[_this.dbname]) return callback('Model ' + _this.dbname + ' not found.');

    data = _.reject(thedata[_this.dbname], function(obj) {
      return parseInt(obj._id) == parseInt(id);
    });

    if (thedata[_this.dbname].length != data.length) {
      thedata[_this.dbname] = data;

      fs.writeFile(_this.file, JSON.stringify(thedata), function (err) {
        if (err) return callback(err);

        return callback(null, true);
      });
    } else {
      return callback(null, false);
    }
  });
};

Model.prototype.read = function(query, callback) {
  // body...

  if (_.isFunction(query)) {
    callback = query;
    this.getDocs(callback);
  } else {
    this.getDoc(query, callback);
  }
};

Model.prototype.getDocs = function(callback) {
  // body...

  var _this = this;
  fs.readFile(this.file, {encoding: 'utf8'}, function(err, data) {
    if (err) return callback(err);

    try {
      data = JSON.parse(data);
    } catch(err) {
      callback('JSON.parse at getDocs ' + err);
    }

    callback(null, data[_this.dbname]);
  });

};

Model.prototype.getDoc = function(query, callback) {
  // body...
  var _this = this;
  fs.readFile(this.file, {encoding: 'utf8'}, function (err, data) {

    if (err) return callback(err);

    try {
      data = JSON.parse(data);
    } catch(err) {
      return callback('JSON.parse at getDoc: ' + err);
    }

    var entry = _.findWhere(data[_this.dbname], query);

    callback(null, entry);
  })
};