import { createBrowser, createReportWithBrowser } from "./lighthouse-util.js";

(async () => {
  const urls = ["https://example.com", "https://youtube.com", "https://google.com"]; // Add your URLs here

  for (const url of urls) {
    const browser = await createBrowser(); // Create a new browser instance for each URL
    try {
      const metrics = await createReportWithBrowser(
        browser,
        url,
        {
          output: "html"  // Optionally save output type, but it's unused here
        }
      );

      // Log the metrics instead of report
      console.log(`Metrics for ${url}:`, metrics);

    } catch (error) {
      console.error(`Failed to create report for ${url}:`, error);
    } finally {
      await browser.close(); // Ensure the browser is closed for each instance
    }
  }

})()
  // Catch anything that went wrong!
  .catch(console.error)
  .then(() => {
     console.log("Finished!");
  });
