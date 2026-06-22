const axios = require('axios');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const https = require('https');
const path = require('path');

async function getFlagDescription(url) {
  const currentDate = new Date();
  const cutoffDate = new Date('2025-08-15');
  const httpsAgent = new https.Agent({
    rejectUnauthorized: currentDate > cutoffDate
  });

  const response = await axios.get(url, { httpsAgent });
  const dom = new JSDOM(response.data);
  const flagStatusElement = dom.window.document.querySelector('.flag-status');

  if (!flagStatusElement) {
    throw new Error('No flag description found in the flag status text that was retrieved.');
  }

  const statusText = flagStatusElement.textContent.toLowerCase();
  let flagStatusDescription = '';

  if (statusText.includes('medium') || statusText.includes('yellow')) {
    flagStatusDescription = 'yellow. This color indicates medium hazard, moderate surf and/or strong currents.';
  } else if (statusText.includes('low') || statusText.includes('green')) {
    flagStatusDescription = 'green. This color indicates generally low hazard with calm conditions.';
  } else if (statusText.includes('closed') || statusText.includes('double red') || statusText.includes('high hazard')) {
    flagStatusDescription = 'double red. The water is closed to the public.';
  } else if (statusText.includes('strong') || statusText.includes('red') || statusText.includes('high')) {
    flagStatusDescription = 'red. This color indicates strong surf and/or currents, and you should not enter the water above knee level.';
  }

  if (statusText.includes('marine') || statusText.includes('purple')) {
    flagStatusDescription += ' Purple flags are also flying on the beach, indicating dangerous marine life such as jellyfish are present.';
  }

  if (!flagStatusDescription) {
    throw new Error('The script could not determine the current flag color from the retrieved text.');
  }

  return `The beach safety flags in Walton County are ${flagStatusDescription}`;
}

async function main() {
  const url = 'https://www.swfd.org/';
  const result = await getFlagDescription(url);
  console.log(result);

  const outputFilePath = path.join(__dirname, '..', '..', 'flag-status', 'south-walton.txt');
  fs.writeFile(outputFilePath, result, (err) => {
    if (err) {
      console.error(err);
      process.exitCode = 1;
    } else {
      console.log('The flag status has been saved to the file:', outputFilePath);
    }
  });
}

main();
