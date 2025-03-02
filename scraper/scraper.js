const playwright = require('playwright');

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

async function compare_values(url, path, stored_value) {
  const page_value = await get_value(url, path)
  const change = {};

  // Run one comparison if the values are numbers
  if (!isNaN(page_value) && !isNaN(stored_value)){

    // Calculate the percentage difference
    const difference = stored_value - page_value;
    const fractal_change = difference / stored_value;
    const percentage_change = Math.round(fractal_change * 1000) / 10;
    
    // Store the raw and calculated change
    change["raw-change"] = difference;
    change["percentage-change"] = percentage_change;

    return change

  // If values are text run another comparison
  } else {
    
  }
}
