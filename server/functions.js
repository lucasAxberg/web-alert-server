const fs = require("node:fs");

function read_file(file_path) {
	return new Promise((resolve, reject) => {

		// Create read-stream
		const stream = fs.createReadStream(file_path, "utf-8");

		// Adds the recieved data chunks to an array
		const chunks = [];
		stream.on("data", (data) => {
			chunks.push(data);
		});

		// 'Returns' the chunks array joined to a single string
		stream.on("end", () => {
			resolve(chunks.join(""));
		});

		// Reject the promise on error
		stream.on("error", (err) => {
			reject(err);
		});
	});
}

function update_file(file_path, new_data) {
	// Check if the file exists and save it to a variable
	let exists = fs.existsSync(file_path);

	// Update data if file exists
	new Promise((resolve, reject) => {
		if (exists) {
			read_file(file_path)
			.then((data) => {
				// Returned the stored data
				resolve(JSON.parse(data))		
			});
		} else {
			// Return an ampty object if file didnt exist
			resolve({})
		}
	
	}).then((data_object) => {

		// Update with the new data
		for (const key in new_data) {
			data_object[key] = new_data[key];
		}
		
		// Create writestream
		const writeStream = fs.createWriteStream(file_path);

		// Add error callback
		writeStream.on("error", (err) => {
			console.error(`Error writing to file ${file_path}:`, err);
		});

		// Write the updated json object to the file
		writeStream.write(JSON.stringify(data_object), "utf8");
		writeStream.end();
	})
}

module.exports = {
  read_file,
  update_file  
}
