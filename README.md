## Flat file database module

Sample usage:

	var db = require('./lib/db');

	db.connect('');

	db.connection.on('error', function (err) {
		console.log(err);
	});

	db.connection.on('open', function (db) {
		var task = db.model('Tasks');

		task.insert({ entry : "Learn javascript" }, function (err, entry) {
			if (err) console.log(err);
			else console.log(entry);
		});
	});

Sample usage with express: 
	- See express_app.js file