const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function getDetailedFlagDescription(flag_status) {
    const text = flag_status.toLowerCase();
    
    // Default fallback
    let description = "the current flag status could not be determined from the latest post.";
    
    // 1. Identify Flag Color (Order is critical: check for complex/longer phrases first)
    if (text.includes("double red") || text.includes("water closed")) {
        description = "double red. The water is closed to the public";
    } else if (text.includes("red")) {
        // This catches "red flag", "a single red flag", or just "red"
        description = "red. This color indicates strong surf and/or currents, and you should not enter the water above knee level";
    } else if (text.includes("yellow")) {
        description = "yellow. This color indicates medium hazard, moderate surf and/or strong currents";
    } else if (text.includes("green")) {
        description = "green. This color indicates generally low hazard with calm conditions";
    }

    // 2. Identify Marine Life (Independent check)
    if (text.includes("marine") || text.includes("jellyfish") || text.includes("purple")) {
        description += ". Purple flags are also flying on the beach, indicating dangerous marine life such as jellyfish are present";
    }

    return `The beach safety flags in Destin are ${description}.`;
}

async function getFlagStatus() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log("Navigating to Facebook...");
        await page.goto('https://www.facebook.com/destinbeachsafety/', { waitUntil: 'domcontentloaded' });
        
        // Wait for the first post to be visible
        const postLocator = page.locator('div[role="article"]').first();
        await postLocator.waitFor({ state: 'visible', timeout: 15000 });
        
        const postContent = await postLocator.innerText();
        
        // DEBUG: Output raw content to GitHub Action logs to identify why it might fail
        console.log("--- DEBUG: Raw post content captured ---");
        console.log(postContent);
        console.log("-----------------------------------------");
        
        const result = await getDetailedFlagDescription(postContent);
        console.log("Parsed Result:", result);
        
        // Ensure directory exists
        const outputFilePath = path.join(__dirname, '..', '..', 'flag-status', 'destin.txt');
        const dir = path.dirname(outputFilePath);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(outputFilePath, result);
        console.log("File successfully saved to:", outputFilePath);
        
    } catch (error) {
        console.error("Scraping failed:", error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

getFlagStatus();
