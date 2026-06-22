const { ApifyClient } = require('apify-client');
const fs = require('fs');
const path = require('path');

async function getDetailedFlagDescription(flag_status) {
    const text = flag_status.toLowerCase();
    let description = "the current flag status could not be determined from the latest post.";
    
    if (text.includes("double red") || text.includes("water closed")) {
        description = "double red. The water is closed to the public";
    } else if (text.includes("red")) {
        description = "red. This color indicates strong surf and/or currents, and you should not enter the water above knee level";
    } else if (text.includes("yellow")) {
        description = "yellow. This color indicates medium hazard, moderate surf and/or strong currents";
    } else if (text.includes("green")) {
        description = "green. This color indicates generally low hazard with calm conditions";
    }

    if (text.includes("marine") || text.includes("jellyfish") || text.includes("purple")) {
        description += ". Purple flags are also flying on the beach, indicating dangerous marine life such as jellyfish are present";
    }

    return `The beach safety flags in Destin are ${description}.`;
}

async function getFlagStatus() {
    const API_TOKEN = process.env.APIFY_TOKEN;

    if (!API_TOKEN) {
        console.error("Error: APIFY_TOKEN environment variable is missing.");
        process.exit(1);
    }

    // Initialize the ApifyClient with your API token
    const client = new ApifyClient({ token: API_TOKEN });

    try {
        console.log("Triggering Apify Facebook Scraper...");
        
        // Define the input for the Apify Actor
        const input = {
            startUrls: [{ url: "https://www.facebook.com/destinbeachsafety/" }],
            resultsLimit: 3 // We only need the most recent posts
        };

        // Run the Actor and wait for it to finish
        const run = await client.actor("apify/facebook-posts-scraper").call(input);

        console.log(`Apify run finished. Fetching results...`);

        // Fetch the results from the run's dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (!items || items.length === 0) {
            throw new Error("Apify returned no posts.");
        }

        // Get the text of the most recent post
        const latestPostText = items[0].text || "";
        
        console.log("--- DEBUG: Extracted Post Text ---");
        console.log(latestPostText);
        console.log("----------------------------------");

        const result = await getDetailedFlagDescription(latestPostText);
        
        const outputFilePath = path.join(__dirname, '..', '..', 'flag-status', 'destin.txt');
        if (!fs.existsSync(path.dirname(outputFilePath))) {
            fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
        }
        
        fs.writeFileSync(outputFilePath, result);
        console.log("File saved successfully.");

    } catch (error) {
        console.error("Failed to retrieve flag status via Apify:");
        console.error(error.message);
        process.exit(1);
    }
}

getFlagStatus();
