const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

async function initializeStorage() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }

    const files = ['users.json', 'sounds.json', 'comments.json', 'reports.json'];
    
    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify([]));
        }
    }
}

async function readData(filename) {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

async function writeData(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

module.exports = { initializeStorage, readData, writeData };