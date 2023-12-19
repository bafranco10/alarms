// finds communication alarm in dataArray and removes it from here
//once it is removed it moves the data to the historyArray where it can now be displayed in history
function moveCommunicationAlarmToHistory(trainData, alarmCode) {
    // Find the alarm in dataArray and move it to historyArray
    const indexToRemove = dataArray.findIndex(data => data.Code === alarmCode && data.Train === trainData);
    if (indexToRemove !== -1) {
        const removedAlarm = dataArray.splice(indexToRemove, 1)[0];
        // Update the display
        updateDisplay();
        // Remove the corresponding row from the table 
        deleteRow("row" + removedAlarm.Train + removedAlarm.Code + removedAlarm.Desc + removedAlarm.DateTime);
    }
}

function moveAlarmToHistory(indexToRemove) {
    // Use the provided index to remove the alarm from dataArray and move it to historyArray
    if (indexToRemove !== -1) {
        const alarmToRemove = dataArray[indexToRemove];
        // Check if the alarm is acknowledged before removing it
        if (alarmToRemove && alarmToRemove.Acknowledged) {
            const removedAlarm = dataArray.splice(indexToRemove, 1)[0];
            historyArray.push(removedAlarm);
            updateHistoryInCookies(historyArray);
            updateDisplay();
            deleteRow("row" + removedAlarm.Train + removedAlarm.Code + removedAlarm.Desc + removedAlarm.DateTime.trim());
    
            var currentTab = document.querySelector(".tablinks.active").textContent.trim();
            if (currentTab === "Alarm History") {
                updateHistory();
            }
            return true;
        } else {
            return false; 
        }
    }    
}

// takes in an input from search bar if it is a number it searches for an alarm code with a matching number
// if it is a string it searches for corresponding keyword in message field 
//if no matching result then it displays nothing
function search_code() {
    // Get the search input
    let input = document.getElementById('searchbar').value.trim().toLowerCase(); // Convert input to lowercase
    if (input !== "") {
        // Split the input into individual words
        const inputWords = input.split(' ');
        // Search by code or keyword
        const filteredHistory = historyArray.filter(alarmData => {
            const codeMatch = String(alarmData.Code).includes(input); // Check for partial code match
            if (codeMatch) {
                return true; // Return true if there's a code match
            }
            if (inputWords.length > 0 && alarmData.Message && typeof alarmData.Message === 'string') {
                // Check for partial message match for each word in the input
                const messageWords = alarmData.Message.toLowerCase().split(' ');
                return inputWords.every(word => messageWords.some(messageWord => messageWord.includes(word)));
            }
            return false; 
        });

        displayFilteredHistory(filteredHistory);
    } else {
        // If the input is empty, display the entire history array
        displayFilteredHistory(historyArray);
    }
}

// displays history based on the filters imposed by search bar or date picker
function displayFilteredHistory(filteredHistory) {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    filteredHistory.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.Code === 78) {
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            // Fetch and display the alarm message text
            fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                historyRow.insertCell().textContent = alarmDescription;
            });
        }

        historyRow.classList.add('table-success');
    });
}

function updateHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    displayAlarmHistory();
}

//gets history array and displays all data to table
function displayAlarmHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Sort the historyArray based on the DateTime property, from newest to oldest
    historyArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));

    // Ensure that historyArray contains at most 100 alarms
    if (historyArray.length > 100) {
        const elementsToRemove = historyArray.length - 100;
        historyArray.splice(0, elementsToRemove);
    }    

    //output all necessary fields for history
    historyArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.Code === 78) {
            //Display alarm.Message if Code is 78
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            // Display alarmDescription for other alarm codes
            fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                historyRow.insertCell().textContent = alarmDescription;
            });
        }
        historyRow.classList.add('table-success');
    });
}

// filters data based on the dates that are input it also adds 1 to the end date so that we do not compare midight on start date to midnight at end date. 
//Before this change we could not do same date searches 
function filterData() {
    const startDate = new Date(document.querySelector("#datepicker1").value);
    const endDate = new Date(document.querySelector("#datepicker2").value);
    if (isNaN(startDate) || isNaN(endDate)) {
        alert("Please select valid start and end dates.");
        return;
    }
    endDate.setDate(endDate.getDate() + 1);
    // Filter the data based on the selected date range
    const filteredData = historyArray.filter(entry => {
        const date = new Date(entry.DateTime);
        return date >= startDate && date <= endDate;
    });

    // Display the filtered data in the history table
    displayFilteredHistory(filteredData);
}

function clearDateRange() {
    // Clear the date range inputs
    document.querySelector("#datepicker1").value = "";
    document.querySelector("#datepicker2").value = "";
    // Clear the search input field
    document.getElementById("searchbar").value = "";

    // Display the entire historyArray
    displayFilteredHistory(historyArray);
}

//gets cookies so we can display data 
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.split('=');
        if (cookieName.trim() === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}

function updateHistoryInCookies(historyArray) {
    // Convert the historyArray to JSON and encodeURIComponent
    const cookieValue = encodeURIComponent(JSON.stringify(historyArray));

    // Always update the cookie with the current historyArray value
    document.cookie = `history=${cookieValue}; expires=Thu, 31 Dec 2099 23:59:59 UTC; path=/`;
}

//get history array from cookies on startup
function initializeHistoryFromCookies() {
    const historyData = getCookie("history");
    if (historyData !== null) {
        // Parse the history data from the cookie
        const parsedHistoryData = JSON.parse(historyData);
        // Append the parsed history data to the existing historyArray
        historyArray = historyArray.concat(parsedHistoryData);
    }
}
