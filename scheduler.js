// Import the scraping logic from the file
const { scrapePrice } = require('./scraper')
const cron = require('node-cron')

// Define the daily schedule using cron syntax:
// '0 1 * * *' means: At minute 0, hour 1 (1:00 AM), every day of the month, every month, every day of the week.
const DAILY_CRON_SCHEDULE = '* * * * *';

console.error("Starting Daily Playwright Scheduler using node-cron pattern...");

// Schedule the scrapePrice function to run daily
cron.schedule(DAILY_CRON_SCHEDULE, async () => {
    console.error(`\n--- Running Daily Scrape Job at ${new Date().toLocaleTimeString()} ---`);
    await scrapePrice();
    console.error(`--- Job Finished ---`);
});

console.error(`Scraping task is configured to run daily at 1:00 AM (cron: ${DAILY_CRON_SCHEDULE}).`);

// To prevent the Node.js process from exiting after the initial task completes, 
// we must ensure the event loop stays active. A real node-cron instance handles this,
// but for demonstration or in simplified environments, a dummy interval works.
console.error("The process is now running indefinitely to maintain the cron job queue.");
setInterval(() => {
    // This empty function keeps the Node.js event loop alive.
    // The cron job will continue to fire based on its internal timing.
}, 1000 * 60 * 60); // Check every hour
