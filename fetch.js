
const fetchEndpoints = [
    "http://172.16.1.101/Get_Alarms.cgi?Acknowledge=0",
    "http://172.16.1.102/Get_Alarms.cgi?Acknowledge=0",
    "http://172.16.1.103/Get_Alarms.cgi?Acknowledge=0"
    //"http://172.16.1.104/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.105/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.106/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.107/Get_Alarms.cgi?Acknowledge=0"
    //add any missing ips here 
];

const ipAddresses = {
    '172.16.1.101': false,
    '172.16.1.102': false,
    '172.16.1.103': false,
    '172.16.1.104': false,
    '172.16.1.105': false,
    '172.16.1.106': false,
    '172.16.1.107': false
};

const retryDelay = 3000;
let currentServerIndex = 0;
const ipAddressByEndpoint = {};

// Function to extract the IP address from a fetchEndpoint
function getIpAddressFromEndpoint(endpoint) {
    const url = new URL(endpoint);
    return url.hostname;
}

// Loop through the fetchEndpoints and store the IP address for each
fetchEndpoints.forEach(endpoint => {
    const ipAddress = getIpAddressFromEndpoint(endpoint);
    ipAddressByEndpoint[endpoint] = ipAddress;
});

const isFetching = Array.from({ length: fetchEndpoints.length }, () => false);
let currentFetchIndex = 0;
let retryCount = 0;

//fetches data and moves between indexes of sources
// Inside fetchData function
async function fetchData(index) {
    try {
        if (isFetching[index]) {
            return;
        }

        isFetching[index] = true;
        const scriptElement = document.createElement("script");
        const ipAddress = ipAddressByEndpoint[fetchEndpoints[index]];

        let requestCompleted = false; // Flag to track if the request has completed
        const timeoutDuration = 5000; // Set a timeout of 5 seconds 

        const timeoutId = setTimeout(function () {
            if (!requestCompleted) {
                // If the request is still pending after the timeout, handle it as an error
                scriptElement.onerror();
            }
        }, timeoutDuration);

        scriptElement.src = `${fetchEndpoints[index]}&IPAddress=${ipAddress}`;
        scriptElement.onerror = function () {
            clearTimeout(timeoutId); // Clear the timeout
            isFetching[index] = false;
            addTrainDownAlarm(ipAddress);

            if (retryCount < 3) {
                // Retry fetching from the same source immediately
                fetchData(index);
                retryCount++;
            } else {
                console.error("Max retry count reached. No more retries.");
                retryCount = 0; // Reset the retry count if needed
            }
        };

        scriptElement.onload = function () {
            clearTimeout(timeoutId); // Clear the timeout
            requestCompleted = true; // Mark the request as completed
            isFetching[index] = false;
            checkIfTrainAlarmNeedsToBeRemoved(ipAddress);
            fetchData(index); // Fetch from the same source immediately after success
        };

        const existingScript = document.getElementById("dataScript");
        if (existingScript) {
            existingScript.remove();
        }
        scriptElement.id = "dataScript";
        document.body.appendChild(scriptElement);
    } catch (error) {
        console.error("An error occurred:", error);
        addTrainDownAlarm(ipAddress);
        fetchData(index); // Retry immediately on error
    }
}

function parseResponse(jsonData) {
    try {
        updateGraphic(jsonData);
        checkStopAlarm();
        checkInactiveAlarms();
    } catch (error) {
        console.error("Error while updating graphic:", error);
    }
}

function getTrainFromIP(ipAddress) {
    if (ipAddress === "172.16.1.101") {
        return 1;
    } else if (ipAddress === "172.16.1.102") {
        return 2;
    } else if (ipAddress === "172.16.1.103") {
        return 3;
    }
    else if (ipaddress === "172.16.1.104") {
        return 4;
    }
    else if (ipaddress === "172.16.1.105") {
        return 5;
    }
    else if (ipaddress === "172.16.1.106") {
        return 6;
    }
    else if (ipaddress === "172.16.1.107") {
        return 7;
    }
    else {
        return error; // returns an error if message 
    }
}

//if communication is lost post a message to the screen
function addTrainDownAlarm(ipAddress) {
    var currentDate = new Date();
    var formattedDate = formatDateToCustomString(currentDate);

    // Check if an alarm with the same characteristics already exists
    const existingAlarmIndex = dataArray.findIndex((alarm) => {
        return (
            alarm.Train === getTrainFromIP(ipAddress) &&
            alarm.Code === 78 &&
            alarm.Msg_Data === "New Alarm Data" &&
            alarm.Desc === "New Alarm Description" &&
            alarm.Dev_Num === "" &&
            alarm.Message === "Train Communication Lost" &&
            alarm.ip === ipAddress
        );
    });

    if (existingAlarmIndex === -1) {
        // Create a new alarm if it doesn't exist
        const newAlarm = {
            "Train": getTrainFromIP(ipAddress),
            "DateTime": formattedDate,
            "Code": 78,
            "Msg_Data": "New Alarm Data",
            "Desc": "New Alarm Description",
            "Dev_Num": "",
            "Acknowledged": false,
            "stopAlarm": false,
            "Message": "Train Communication Lost",
            "ip": ipAddress,
            "active": true
        };
        // Add the new alarm to the dataArray
        dataArray.push(newAlarm);

        // Update the display with the new alarm
        updateDisplay();
    }

}