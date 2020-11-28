// Dependencies
const fs = require('fs');
const axios = require('axios');
const { parse, valid } = require('node-html-parser');

// Constants
const TARGET_WEBPAGE = 'http://speedgaming.org/alttprleague/crew/';
const OUTPUT_FILENAME = 'schedule.txt';

const targetRow = (process.argv.length > 2 && process.argv[2].match(/^\d+$/)) ? parseInt(process.argv[2], 10) : 1;

axios.get(TARGET_WEBPAGE).then((response) => {
    // If HTML is not valid, there's no point operating on it
    if (!valid(response.data)) {
        console.error("Invalid HTML received from schedule page.");
        return;
    }

    // Parse HTML
    const html = parse(response.data);
    const table = html.querySelector('table');
    const rows = table.querySelectorAll('tr');

    if (targetRow > rows.length) {
        return console.error(`There are only ${rows.length} rows in the table. You asked for row ${targetRow}.\n`);
    }

    // Get table headers from the first row of the table
    const headers = [];
    for (let td of rows[0].querySelectorAll('td')) {
        let text = td.text;
        headers.push(text.replaceAll(/\s{2,}/g, ' ').trim());
    }

    // Get data from desired table row
    const data = [];
    for (let td of rows[targetRow].querySelectorAll('td')) {
        let text = td.text;
        data.push(text.replaceAll(/\s{2,}/g, '').trim())
    }

    // Assert equal numbers of headers and columns
    if (headers.length !== data.length) {
        console.error("Retrieved data has inconsistent number of headers and columns.");
        return;
    }

    const outputFile = fs.createWriteStream(OUTPUT_FILENAME);
    for (let i=0; i < headers.length; ++i) {
        // Remove unwanted text from data fields
        data[i] = data[i].replaceAll(/\[SIGN UP]\s?/g, '');
        data[i] = data[i].replaceAll(/\d [Ss]ubmitted$/g,'');

        // Specially format the Players / Category column
        if (headers[i] === 'Players / Category') {
            // Format player matches
            const teams = data[i].match(/((.*\))?_(.*\))?)?(.*) vs (.*)/);
            if (teams) {
                outputFile.write(`Team 1: ${teams[2] ? teams[2] : 'No Team'}\n`);
                outputFile.write(`Player 1: ${teams[4]}\n`);
                outputFile.write(`Team 2: ${teams[3] ? teams[3] : 'No Team'}\n`);
                outputFile.write(`Player 2: ${teams[5]}\n`);
                continue;
            }

            // Format category matches
            outputFile.write(`Category: ${data[i]}\n`);
            continue;
        }

        outputFile.write(`${headers[i]}: ${data[i]}\n`);
    }

    // Watermark
    outputFile.write("\n\nCoded by LegendaryLinux (Farrak Kilhn)\n");
    outputFile.write("Find the code at: https://github.com/LegendaryLinux/league-schedule-grabber\n");
    outputFile.close();

}).catch((error) => {
    const errorFile = fs.createWriteStream('schedule-error.txt');
    errorFile.write(error.message);
    errorFile.close();
    console.error(error);
});