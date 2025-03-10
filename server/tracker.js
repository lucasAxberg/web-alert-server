// Import required modules
const playwright = require('playwright');
const diff  = require('diff')

// Import functions and variables
const {read_file, update_file} = require("./functions.js")
const {data_path, local_check_interval} = require("../data/config.js")

// Time settings
const web_check_interval = 1000 * 60

async function get_value(url, path) {
  // Launch a headless browser
  const browser = await playwright.chromium.launch({headless: true});
  const context = await browser.newContext();

  // Go to the url and get the elements matching the path
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector("xpath=" + path)
  const element = await page.locator("xpath=" + path).all();

  // Make sure there only is one element
  if (element.length === 0 || element.length > 1){
    console.log("Path may be broken after page update, consider updating the path")
    await browser.close();
    return ""
  }

  // Return the value of the only item in the array
  const return_value = await element[0].innerHTML()
  await browser.close();
  return return_value
}

function compare_values(old_value, new_value) {
  const change_object = {};

  // Run one comparison if the values are numbers
  if (!isNaN(old_value) && !isNaN(new_value)){

    // Calculate the percentage difference
    const difference = new_value - old_value;
    const fractal_change = difference / old_value;
    const percentage_change = Math.round(fractal_change * 1000) / 10;
    
    change_object["type"] = "number";
    change_object["new-value"] = new_value;
    
    // Store the raw and calculated change
    change_object["numerical-change"] = difference;
    change_object["percentage-change"] = percentage_change;

    return change_object

  // If values are text run another comparison
  } else {

    // Define negating words
    const negating_words = [ "don't", "can't", "no", "not" ]
    
    // Check the difference of the 2 strings and get all aditions and removals
    const difference = diff.diffWords(old_value, new_value, {ignoreCase: true});
    const modifications = difference.filter((element) => element.added || element.removed)

    // Set default values
    change_object["new-meaning"] = false;
    change_object["numerical-change"] = 0;
    change_object["type"] = "text";
    change_object["new-value"] = new_value;
    
    // Loop through all modifications
    modifications.forEach((mod_obj) => {

      // Increment 'change_lenght' by the length of the change
      change_object["numerical-change"] += mod_obj["value"].length
      
      // Check if the words contain a negating word and set "new_meaning" accordingly
      const words = mod_obj["value"].split(" ")
      if (words.some(word => negating_words.includes(word))){
        change_object["new-meaning"] = true;
      }
    })

    // Calculate how much the text has changed in percent
    const percentage_change = Math.round((change_object["numerical-change"] / old_value.length) * 1000) / 10;
    change_object["percentage-change"] = percentage_change
    
    return change_object
  }
}

async function check_value() {

	// Restart the loop until the minimum time has passed
	const current_time = Date.now()
	console.log("Checking. Current time:", current_time)

	// Loop thorugh all the stored trackers
	const text_data = await read_file(data_path)
	const data = JSON.parse(text_data);
	for (const key in data) {
		
		// Skip item if the interval has not passes
		if (current_time - data[key]["checked"] < data[key]["interval"]) continue;
		
		// Get the new value from the web and check the difference
		const web_value = await get_value(data[key]["url"], data[key]["path"])
		const change_object = compare_values(data[key]["value"], web_value)

		// Update the checked time and add change object
		data[key]["checked"] = current_time;
		data[key]["change"] = change_object;
		const obj = {}
		obj[key] = data[key]
		update_file(data_path, obj, false)

		if (change_object["type"] == "number") console.log("Number");
		if (change_object["type"] == "text") console.log("Text");

	}
	setTimeout(check_value, local_check_interval)
}

setTimeout(check_value, local_check_interval)
