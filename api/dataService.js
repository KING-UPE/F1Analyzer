import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
let racesData = [];

export let appConfig = {
    maxResponseLimit: 500
};

export const updateConfig = (newConfig) => {
    appConfig = { ...appConfig, ...newConfig };
};

export const flushCache = async () => {
    racesData = [];
    await loadData();
};

export const loadData = async () => {
    console.log('Loading JSON data into memory...');
    console.time('DataLoad');
    
    try {
        const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
        console.log(`Found ${files.length} data files.`);

        let totalRaces = 0;
        
        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            racesData = racesData.concat(data);
            totalRaces += data.length;
        }

        console.timeEnd('DataLoad');
        console.log(`Successfully loaded ${totalRaces} races into memory.`);
    } catch (err) {
        console.error('Error reading data files:', err);
        throw err;
    }
};

export const getRacesData = () => {
    return racesData;
};
