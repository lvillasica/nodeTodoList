var db = require('./lib/db');

db.connect('');

db.connection.on('error', function(err) {
	console.log(err);
});

db.connection.on('open', function (db) {
	var task = db.model('Task');

	task.insert({ entry: 'Learn nodejs' }, function (err, data) {
		console.log(data);
	});

	task.read({ '_id': 0 }, function (err, data) {
		console.log(data)
	});

	task.read(function (err, docs) {
		console.log(docs);
	});
});