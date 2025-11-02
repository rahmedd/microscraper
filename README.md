# microscraper

## Todo:

✅ Scrape specific store pages on a schedule

❌ Store the price

❌ Alert based on threshold

❌ Alert price change

❌ Alert products of interest

## Setup
1. Copy and modify .env
2. Modify the products table and add your URLs and threshold

## To run
`pnpm run start`

## Architecture
- Hono REST API
- Scheduler
	- Scraper worker
- Slack (Notifications)

## Why SQlite/LibSQL?
- Artificial limitation