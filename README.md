# LogMasterCLI


![Static Badge](https://img.shields.io/badge/version-v1-grey)
![Static Badge](https://img.shields.io/badge/javascript-%234298B8)


# LogMasterCLI: Mini CLI Script for Getting the logs (application server)

### Overview: this is a mini cli-based tool that will help the implementation team to gather logs in one location with 1 click action.

### Usage:

* Open the config.json file and set the folders from which you want to fetch the logs, Make sure to set the **inUse** parameter to the current folder structure.
* Copy the zip file and extract the same in your main source code 


**folder-structure**

```
Windows
├── source-folder/logmastercli/log.js

Linux
├── opt/source-folder/logmastercli/log.js
```

* Open the terminal and navigate to the tools folder and Fire: `node log [parameter]` in terminal




## Commands

### 1. Logs count

**Usage** : `node log logscount`

**Description** : Displays the count of logs available on the server.


---

### 2. Log size

**Usage** : `node log logsize`

**Description** : Displays the total size of the logs from the server.


---

### 3. Log details

**Usage** : `node log logdetails`

**Description** : Displays details of the logs, including folder name, total folder size, and serviceName.


---

### 4. Getlogs

**Usage** : `node log getlogs`

**Description** : Copies the latest logs from the logs folder (configured inside config.json file) to a new folder for easy access.




---




