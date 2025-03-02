const playwright = require('playwright');
const diff  = require('diff')

async function get_value(url, path) {    // Example: get_value("https://www.webhallen.com/", '//div[@class="footer-wrapperi"]')
  // Launch a non-headless browser
  const browser = await playwright.chromium.launch({headless: true});
  const context = await browser.newContext();

  // Go to the url and get the elements matching the path
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector(path)
  const element = await page.locator(path).all();

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

function compare_values(value_1, value_2) {
  const change_object = {};

  // Run one comparison if the values are numbers
  if (!isNaN(value_1) && !isNaN(value_2)){

    // Calculate the percentage difference
    const difference = value_1 - value_2;
    const fractal_change = difference / value_1;
    const percentage_change = Math.round(fractal_change * 1000) / 10;
    
    // Store the raw and calculated change
    change_object["raw-change"] = difference;
    change_object["percentage-change"] = percentage_change;

    return change_object

  // If values are text run another comparison
  } else {

    // Define negating words
    const negating_words = [ "don't", "can't", "no", "not" ]
    
    // Check the difference of the 2 strings and get all aditions and removals
    const difference = diff.diffWords(value_1, value_2, {ignoreCase: true});
    const modifications = difference.filter((element) => element.added || element.removed)
    
    // Loop through all modifications
    for (const mod_obj in modifications) {

      // Check if the words contain a negating word and set "new_meaning" accordingly
      const words = mod_obj["value"]
      if (words.some(word => negating_words.includes(word))){
        change_object["new-meaning"] = true;
      }
    }
    
    return change_object
  }
}


