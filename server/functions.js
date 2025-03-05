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
			if (err.code === 'ENOENT') {
				resolve("{}")
			} else {
				reject(err);
			}
		});
	});
}

function update_file(file_path, new_data, remove) {

	// Read stored data
	read_file(file_path)
	.then((data) => JSON.parse(data))		
	.then((data_object) => {

		if (remove) {

			// Use indicies from new_data to remove items
			const indicies = Object.keys(data_object).filter((index) => Object.keys(new_data).includes(index))
			data_object = remove_key(data_object, indicies)

		} else {

			// Update with the new data if not set to remove
			for (const key in new_data) {
				data_object[key] = new_data[key];
			}
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
