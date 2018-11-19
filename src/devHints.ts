import fetch from 'node-fetch';
import * as fs from "fs";
import * as path from "path";

/**
 * Class that handles all DevHints related logic, like Fetching cheat sheets information.
 */
export default class DevHints {

    static readonly INDEX_CACHE_TTL = 3600; // Cache for 1h
    
    baseUrl: string;

    cacheDir: string;

    cacheFilePath: string

    /**
     * Class constructor
     * @param baseUrl The devHints base url.
     * @param cacheDir The cache dir where to store index. NOT used for now.
     */
    constructor(baseUrl: string, cacheDir: string) {
        this.baseUrl = baseUrl;
        this.cacheDir = cacheDir;
        this.cacheFilePath = path.join(this.cacheDir, 'devhints_index_cache.json');
    }

    /**
     * Sets the "baseUrl" property.
     * @param baseUrl The new base url
     */
    setBaseUrl(baseUrl : string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Returns a list of available cheat sheets.
     */
    async getCheatSheets() : Promise<Array<string>> {

        // If we have cached results, and they have not expired, load from Cache.
        if (fs.existsSync(this.cacheFilePath)) {
            let stats = fs.statSync(this.cacheFilePath);
  
            // Loads data from cache.
            let cacheFileLastModifiedSeconds = (new Date().getTime() - new Date(stats.mtime).getTime()) / 1000;
            
            if (cacheFileLastModifiedSeconds < DevHints.INDEX_CACHE_TTL) {
                console.log("Loading from cache");
                let cachedData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
                return cachedData.map(item => item.title);
            }  
        }
      
        let indexData = await fetch(`${this.baseUrl}/data/search-index.json`).then(res => res.json());

        indexData = indexData.filter(item => item.title !== null); // A few cheat sheets dont have title for some reason. Ignore them!

        let labels : string[] = [];
        let data: any[] = [];
        indexData.forEach((item => {
            labels.push(item.title.toString());
            data.push({
                title: item.title.toString(),
                uri: item.url
            })
        }));

        // write index into cache.
        fs.writeFileSync(this.cacheFilePath, JSON.stringify(data), 'utf-8')
    
        return labels;
    }

    /**
     * Returns the HTML contents of a cheatsheet.
     * @param cheatName The cheatsheet name
     */
    getCheatContent(cheatName : string): string {
        return `
            <style>
                html, body{ height: 100%; !important }          
            </style>
            <iframe style="position:relative; width: 100%; height: 100%; border: 0" src="${this.getCheatUrl(cheatName)}"></iframe>
        `;
    }

    /**
     * Constructs the cheatsheet url on devhints website.
     * @param cheatName The cheatsheet name
     */
    getCheatUrl(cheatName: string): string {
        let indexedData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));

        let cheatData = indexedData.find(item => item.title == cheatName);

        return `${this.baseUrl}${cheatData.uri}`;
    }

    /**
     * Removes the cached DevHints pages.
     */
    clearCache(): boolean {
        if (fs.existsSync(this.cacheFilePath)) {
            fs.unlinkSync(this.cacheFilePath);
        }

        return true;
    }
}
