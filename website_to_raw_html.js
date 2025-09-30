import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const puppeteerParams = {
  executablePath: "/usr/bin/chromium",
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--blink-settings=imagesEnabled=false",
  ],
};

// params
const url = "https://www.sharesansar.com/today-share-price";
const dir = "raw_html";
const sector = "1";
const startDate = "2025-10-01";
const endDate = "2025-10-02";

// ensure output dir
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// helpers
function getDateRange(startDate, endDate) {
  const dates = [];
  const s = new Date(startDate);
  const e = new Date(endDate);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// set input value robustly (dispatch input/change)
async function setDateValue(page, selector, value) {
  await page.evaluate(
    (sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    selector,
    value,
  );
}

async function scrapeSingleDate(page, date) {
  const filePath = path.join(dir, `${date}.html`);

  // set sector and date
  await page.select("#sector", sector);
  await setDateValue(page, "#fromdate", date);

  console.log(`Scraping Date: ${date} ...`);

  // take a snapshot of current HTML (for diagnostics only)
  const previousHtml = await page
    .$eval("#headFixed", (el) => el.innerHTML)
    .catch(() => "");

  // click submit and then wait exactly 3 seconds (your constraint)
  await page.click("#btn_todayshareprice_submit");
  await delay(3000);

  // read the table HTML (fast: innerHTML)
  const rawHtml = await page
    .$eval("#headFixed", (el) => el.innerHTML)
    .catch(() => "");

  // handle cases
  if (!rawHtml || rawHtml.trim() === "") {
    // nothing found — write a minimal placeholder so you know it ran
    await fs.promises.writeFile(filePath, "NO_DATA", "utf8");
    console.log(`No HTML content for ${date} → wrote NO_DATA`);
    return;
  }

  // check explicit "No Record Found."
  if (rawHtml.includes("No Record Found.")) {
    await fs.promises.writeFile(filePath, "NO_DATA", "utf8");
    console.log(`No Record Found for ${date} → wrote NO_DATA`);
    return;
  }

  // if the HTML is identical to previous snapshot, still save (optional)
  if (rawHtml === previousHtml) {
    // optional: warn, but still save so you have a file for this date
    console.warn(`Warning: table HTML unchanged for ${date} (saving anyway)`);
  }

  // save actual table HTML
  await fs.promises.writeFile(filePath, rawHtml, "utf8");
  console.log(`HTML saved to ${filePath}`);
}

async function scrapeAllDates(startDate, endDate) {
  const dates = getDateRange(startDate, endDate);
  const browser = await puppeteer.launch(puppeteerParams);
  const page = await browser.newPage();

  // load page once and wait for controls
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#sector");
  await page.waitForSelector("#fromdate");
  await page.waitForSelector("#btn_todayshareprice_submit");

  for (const date of dates) {
    try {
      await scrapeSingleDate(page, date);
    } catch (err) {
      console.error(`Failed to scrape ${date}:`, err);
      // write marker so you can retry only failed dates later
      await fs.promises
        .writeFile(path.join(dir, `${date}.err`), String(err), "utf8")
        .catch(() => {});
    }
  }

  await browser.close();
  console.log("Scraping completed for all dates!");
}

// run
scrapeAllDates(startDate, endDate).catch(console.error);
