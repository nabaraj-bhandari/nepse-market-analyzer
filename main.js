import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const puppeteerParams = {
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

// Parameters for scraping
const url = "https://www.sharesansar.com/today-share-price";
const dir = "rawHtml";
const sector = "1"; // 1 = Commercial Bank
const startDate = "2025-01-01";
const endDate = "2025-09-26";

// Ensure output directory exists
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Helper Functions
function getDateRange(startDate, endDate) {
  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    // Format as YYYY-MM-DD
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);

    current.setDate(current.getDate() + 1);
  }
  return dates;
}
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function scrapeSingleDate(page, date) {
  const filePath = path.join(dir, `${date}.html`);

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#sector");
  await page.waitForSelector("#fromdate");
  await page.waitForSelector("#btn_todayshareprice_submit");

  await page.select("#sector", sector);
  await page.$eval("#fromdate", (el, value) => (el.value = value), date);

  console.log(`Date: ${date}...`);

  await Promise.all([page.click("#btn_todayshareprice_submit"), delay(3000)]);
  const rawHtml = await page.$eval("#headFixed", (el) => el.innerHTML);

  // Save to file
  fs.writeFileSync(filePath, rawHtml, "utf8");
  console.log(`HTML saved to ${filePath}`);
}

async function scrapeAllDates(startDate, endDate) {
  const dates = getDateRange(startDate, endDate);
  const browser = await puppeteer.launch(puppeteerParams);
  const page = await browser.newPage();

  for (const date of dates) {
    try {
      await scrapeSingleDate(page, date);
    } catch (err) {
      console.error(`Failed to scrape ${date}:`, err);
    }
  }

  await browser.close();
  console.log("Scraping completed for all dates!");
}

// Run scraping for a date range
scrapeAllDates(startDate, endDate).catch(console.error);
