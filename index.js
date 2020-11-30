// Dependencies
const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const { parse, valid } = require('node-html-parser');

// Constants
const TARGET_WEBPAGE = 'http://speedgaming.org/alttprleague/crew/';

const createTextFile = (filename, content) => {
    content = content.replace(/\n/g, '');
    content = content.replace(/\[SIGN UP]\s?/g, '');
    content = content.replace(/\d [Ss]ubmitted$/g,'');

    const file = fs.createWriteStream(filename);
    file.write(content);
    file.close();
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Which row number of the schedule do you want? Press enter for the first row: ', (targetRow) => {
    targetRow = (!targetRow || isNaN(parseInt(targetRow, 10))) ? 1 : parseInt(targetRow, 10);
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

        // Get data from desired table row
        const data = [];
        for (let td of rows[targetRow].querySelectorAll('td')) {
            let text = td.text;
            data.push(text.replace(/\s{2,}/g, '').trim())
        }

        // Create a file for each data set
        createTextFile('time.txt', data[0]);
        createTextFile('channel.txt', data[2]);
        createTextFile('commentators.txt', data[3])
        createTextFile('trackers.txt', data[4]);
        createTextFile('notes.txt', data[5]);

        // Create individual files for players and teams, and for category. They come from the same column,
        // so this is as minimally janky as I can make it
        data[1] = data[1].trim().replace(/\n/g, '');
        let teamData = data[1].match(/((.*\))_(.*\)))?\s?(.*)((\s?vs\s)|(\svs\s)|(\svs\s?))(.*)/i);

        createTextFile('team1.txt', teamData ? (teamData[2] ? teamData[2] : 'No Team') : 'See Category File');
        createTextFile('team2.txt', teamData ? (teamData[3] ? teamData[3] : 'No Team') : 'See Category File');
        createTextFile('player1.txt', teamData ? teamData[4] : 'See Category File');
        createTextFile('player2.txt', teamData ? teamData[9] : 'See Category File');
        createTextFile('category.txt', teamData ? 'See Team / Player Files' : data[1]);

        rl.question(`Download complete, files created.\nPress enter to close.`, () => {
            rl.close();
        });

    }).catch((error) => {
        const errorFile = fs.createWriteStream('schedule-error.txt');
        errorFile.write(error.message);
        errorFile.close();
        console.error(error);
    });
});
