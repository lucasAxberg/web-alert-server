const {get_value, compare_values} = require('../scraper/scraper.js')
const {read_file} = require("./functions.js")

// Time settings
const local_check_interval = 1000 * 60
const web_check_interval = 1000 * 60
const start_time = Date.now()

console.log("Started Check loop")
while(true) {
	// Restart the loop until the minimum time has passed
	const current_time = Date.now()
	if (current_time - start_time < local_check_interval) continue;

	console.log("Checking. Current time:", current_time)

	// Loop thorugh all the stored trackers
	const text_data = await read_file(data_path)
	const data = JSON.parse(text_data);
	for (const key in data) {

			// Skip item if the interval has not passes
			if (current_time - data[key]["checked"] < web_check_interval) continue;

			// Get the new value from the web and check the difference
			const web_value = await get_value(data[key]["url"], data[key]["path"])
			const change_object = compare_values(data[key]["value"], web_value)

			if (change_object["type"] == "number") console.log("Number");
			if (change_object["type"] == "text") console.log("Text");

	}

}

