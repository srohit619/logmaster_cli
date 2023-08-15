const path = require("path");
const fs = require("fs");

//these are colors for console output
const reset = "\x1b[0m";
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const frames = ["|", "/", "-", "\\"];


let currentFrameIndex = 0;

const animateLoading = async(msg) => {
    for (let i = 0; i < 10; i++) {
        process.stdout.write("\x1b[2K");
        process.stdout.write("\x1b[0G");
        process.stdout.write(`${yellow}${frames[currentFrameIndex]} Loading...${reset}`);

        currentFrameIndex = (currentFrameIndex + 1) % frames.length;

        await delay(100); // this is delay 
    }

    process.stdout.write("\x1b[2K");
    process.stdout.write("\x1b[0G");
    console.log(`${msg}`);
};

//reads the data from config file
const configData = require('./config.json')

let logFolders;

// fetch the folders structure based on the inUse parameter from config.js file
if (configData.inUse == 'ideal6') {
    logFolders = configData.ideal6.logFolders
} else if (configData.inUse == 'iwf6') {
    logFolders = configData.iwf6.logFolders
}

const getlogs = path.join(__dirname + "\\getlogs");

// Function to count log files from specified log folders
function getLogFilesCount() {
    let totalLogFiles = 0;
    for (const logFolder of logFolders) {
        try {
            const files = fs.readdirSync(logFolder[1]);
            totalLogFiles += files.length;
        } catch (err) {
            console.error(`${red}Error reading log folder ${err}${reset}`);
        }
    }
    return totalLogFiles;
}

// Function to calculate the total log size from different log folders
function getTotalLogSize() {
    let totalSizeBytes = 0;
    for (const logFolder of logFolders) {
        try {

            const files = fs.readdirSync(logFolder[1]);
            for (const file of files) {
                const filePath = path.join(logFolder[1], file);
                const stats = fs.statSync(filePath);
                totalSizeBytes += stats.size;
            }
        } catch (err) {
            // console.error(`Error reading log folder ${logFolder[1]}: ${err}`);
            console.error(`${red}Error reading log folder ${err}${reset}`);
        }
    }
    const totalSizeGB = formatSize(totalSizeBytes); //(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2);
    return totalSizeGB;
}

// Function to get log folder details with service name, path, and size
function getLogFolderDetails() {
    const logFolderDetails = [];
    for (const logFolder of logFolders) {
        try {
            const logFolderPathRelative = logFolder[1]; // Use the provided relative path
            const logFolderPath = path.resolve(__dirname, logFolderPathRelative); // Convert to absolute path

            const serviceName = logFolder[0];
            const files = fs.readdirSync(logFolder[1]);
            let totalSizeBytes = 0;
            for (const file of files) {
                const filePath = path.join(logFolder[1], file);
                const stats = fs.statSync(filePath);
                totalSizeBytes += stats.size;
            }
            const logFolderSizeGB = formatSize(totalSizeBytes); //(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2);
            logFolderDetails.push({
                serviceName,
                logFolderPath: logFolderPath, //logFolder[1],
                logFolderSize: logFolderSizeGB,
            });
        } catch (err) {
            // console.error(`Error reading log folder ${logFolder}: ${err}`);
            console.error(`${red}Error reading log folder ${err}${reset}`);
        }
    }
    return logFolderDetails;
}

function formatSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}



function extractAndCopyLatestLogs(logFolders) {
    for (const logFolder of logFolders) {
        try {
            const serviceName = logFolder.serviceName;
            const logFolderPathRelative = logFolder.logFolderPath; // Use the provided relative path

            const logFolderPath = path.resolve(__dirname, logFolderPathRelative); // Convert to absolute path


            const files = fs.readdirSync(logFolderPath);

            // For pm2-logs service, copy all files
            if (serviceName === "pm2-logs") {
                // Create the destination directory if it doesn't exist
                const destinationPath = path.join("getlogs", serviceName);
                if (!fs.existsSync(destinationPath)) {
                    fs.mkdirSync(destinationPath, { recursive: true });
                }

                // Copy all log files to the destination directory
                for (const file of files) {
                    const sourceFilePath = path.join(logFolderPath, file);
                    const destinationFilePath = path.join(destinationPath, file);
                    // console.log('destinationFilePath----> ' + destinationFilePath)
                    fs.copyFileSync(sourceFilePath, destinationFilePath);
                }
            } // For wildfly service, copy the latest 5 log files
            if (serviceName === "standalone") {
                // Create the destination directory if it doesn't exist
                const destinationPath = path.join("getlogs", serviceName);
                if (!fs.existsSync(destinationPath)) {
                    fs.mkdirSync(destinationPath, { recursive: true });
                }

                // Sort files based on modification time in descending order
                files.sort((file1, file2) => {
                    const file1Path = path.join(logFolderPath, file1);
                    const file2Path = path.join(logFolderPath, file2);
                    const file1Stats = fs.statSync(file1Path);
                    const file2Stats = fs.statSync(file2Path);
                    return file2Stats.mtime - file1Stats.mtime;
                });

                // Copy the latest 5 log files to the destination directory
                for (let i = 0; i < Math.min(5, files.length); i++) {
                    const file = files[i];
                    const sourceFilePath = path.join(logFolderPath, file);
                    const destinationFilePath = path.join(destinationPath, file);
                    fs.copyFileSync(sourceFilePath, destinationFilePath);
                }
            } else {
                // For other services, find and copy the latest log file
                const latestLogFile = files.reduce((latest, file) => {
                    const filePath = path.join(logFolderPath, file);
                    const stats = fs.statSync(filePath);
                    if (stats.isFile() && (!latest || stats.mtime > latest.stats.mtime)) {
                        return { file, stats };
                    }
                    return latest;
                }, null);

                if (latestLogFile) {
                    // Create the destination directory if it doesn't exist
                    const destinationPath = path.join("getlogs", serviceName);
                    if (!fs.existsSync(destinationPath)) {
                        fs.mkdirSync(destinationPath, { recursive: true });
                    }

                    // Copy the latest log file to the destination directory
                    const sourceFilePath = path.join(logFolderPath, latestLogFile.file);
                    const destinationFilePath = path.join(
                        destinationPath,
                        latestLogFile.file
                    );
                    fs.copyFileSync(sourceFilePath, destinationFilePath);
                }
            }
        } catch (err) {
            console.error(
                `${red}Error extracting/copying log files from ${logFolder[1]}: ${err}${reset}`
            );
        }
    }
}





if (process.argv[2] === "logscount") {
    // console.log(`${green}Total Number of Logs on the server --> ${getLogFilesCount()}${reset}`);
    animateLoading(`${green}Total Number of Logs on the server --> ${getLogFilesCount()}${reset}`);
} else if (process.argv[2] === "logsize") {
    animateLoading(`${green}Total Log Size on the server --> ${getTotalLogSize()}${reset}`);
    // console.log(`Total Log Size on the server --> ${getTotalLogSize()}`);
} else if (process.argv[2] === "logdetails") {
    animateLoading(`${green}${JSON.stringify(getLogFolderDetails(), null, 2)}${reset}`);

    // console.log(getLogFolderDetails());
} else if (process.argv[2] === "getlogs") {
    // Call your existing function to get log folder details
    const allLogFolders = getLogFolderDetails();
    extractAndCopyLatestLogs(allLogFolders);
    // console.log(`Logs copied to ${getlogs} folder`);
    animateLoading(`${green}Logs copied to ${getlogs} folder${reset}`);
} else {
    console.log(`
${red}Command Not Found${reset}
Please use any one of these commands: 
        
        1. ${blue}logscount${reset}  :- Example Code: ${yellow}node log logscount${reset}
        2. ${blue}logsize${reset}    :- Example Code: ${yellow}node log logsize${reset}
        3. ${blue}logdetails${reset} :- Example Code: ${yellow}node log logdetails${reset}
        3. ${blue}getlogs${reset}    :- Example Code: ${yellow}node log getlogs${reset}
        `);
}