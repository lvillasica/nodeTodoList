var express = require('express'),
	  app = express(),
	  path = require('path');

var db = require('./lib/db');

db.connect('');
db.connection.on('open', function (db) {
	console.log('Connection established to database.');
});

db.connection.on('error', function(err) {
	console.log('Error on connection: ', err);
});

app.configure(function () {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.static(path.join(__dirname, 'public')));
});

var task = db.model('Task');

// curl localhost:9090
app.get('/', function (req, res) {
	task.read(function (err, docs) {
		if (err) {
			res.statusCode = 500;
			res.end('Something went wrong');
		}
		
		res.format({
		  'text/html': function(){
		    res.render('index');
		  },
		  
		  'application/json': function(){
		    res.send({ docs: docs });
		  }
		});
	});
});

// curl -X POST -d "entry=Learn javascript" localhost:9090
app.post('/', function (req, res) {
	task.insert(req.body, function (err, entry) {
		if (err) {
			res.statusCode = 505;
			res.end('Something went wrong.');
		}
		res.end('Ok \n');
	})
});

// curl -X DELETE localhost:9090/1
app.delete('/:id', function (req, res) {
	// you can access the :id through req.params.id
	task.destroy(req.params.id, function (err, result) {
		if (err) {
			res.statusCode = 505;
			res.end('Something went wrong.');
		}

		res.send(result + '\n');
	})
});

// curl -X PUT -d "entry=Javascript is awesome" localhost:9090/0
app.put('/:id', function (req, res) {
	var object = {};
	object._id = req.params.id;
	object.entry = req.body.entry;

	task.update(object, function (err, result) {
		if (err) {
			res.statusCode = 505;
			res.end('Something went wrong.');
		}

		res.send(result + '\n');
	})
});

app.listen(9090, function () {
	console.log('App listening on localhost:9090');
});