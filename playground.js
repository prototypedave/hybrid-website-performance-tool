import { createBrowser, createReportWithBrowser } from "./lighthouse-util.js";
import fs from "fs";
import Assert from "assert";

(async () => {
  
  const browser = await createBrowser();
  
  const result = await createReportWithBrowser(
    browser,
    "https://example.com",
    {
        output: "html"  
    }
  );

  Assert(result.report, "No report returned");

  console.log(result.report);
  
  await browser.close();
})()
    // Catch anything that went wrong!
    .catch(console.error)
    .then(() => {
       console.log("Finished!");
});