// blank values to be filled out by code before submitting.
var json = {
    "schemaId": "AzureVmManagerPlugin",
    "data": {
        "context": {
            "resourceGroupName": "",
            "resourceName": "",
            "resourceType": "Microsoft.Compute/virtualMachines"
        },
        "target_state": ""
    }
}
var options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}
status_elem = document.getElementById("azure-plugin-status");


function log(msg) {
    // status_elem.innerText = status_elem.innerText + "\n" + msg;
    // console.log(msg);
}


/*
* Make the HTTP request. Set the update as we progress.
*/
function doRequest(payload) {
    url = document.getElementById('azure-plugin-url').value;
    // log("url: " + url);
    // log("payload: " + payload);

    // Prepare and send request
    var _request = new XMLHttpRequest();
    _request.open(options['method'], url, false);  // false: synchronous request. Deprecated but async requires rewrite.
    for (const [k, v] in Object.entries(options['headers'])) {
        _request.setRequestHeader(k, v);
    }
    _request.send(JSON.stringify(payload));
    // TODO: We don't catch network errors yet.

    //  Make response text safe for display. Remove \r, \n and replace double by single quotes.
    response_text = _request.responseText;
    response_text = response_text.replace(/\r/g, '')
        .replace(/\n/g, '')
        .replace(/\"/g, '\'');
    if (_request.status >= 200 & _request.status < 300) {
        status_elem.innerText  = "Request succeeded. It may take a few minutes for the machine to switch states. Showing the current state of the machine is unfortunately not possible."
    }
    else {
        status_elem.innerText  = "Request probably did not succeed.\n Status code: " + _request.status + " \n " + response_text;
    }
}


function setSettingValue(varKey, value) {
    document.getElementById(varKey).value = value;
}

function loadConfig() {
    var gettingAllStorageItems = browser.storage.local.get(null);
    gettingAllStorageItems.then((results) => {
        log(results);
        var varKeys = Object.keys(results);
        for (let varKey of varKeys) {
            setSettingValue(varKey, results[varKey]);
        }
    }, reportExecuteScriptError);
}

function listenForInputChanges() {
    function setConfig(varKey, value) {
        // log("Storing value: " + varKey + ": " + value);
        browser.storage.local.set({ [varKey]: value });
    }

    document.addEventListener("input", (e) => {
        if (e.target.classList.contains("azure-plugin-config")) {
            setConfig(e.target.id, e.target.value);
        }
    });
}

function listenForClicks() {
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("start")) {
            req = json;
            req['data']['context']['resourceName'] = document.getElementById('azure-plugin-name').value;
            req['data']['context']['resourceGroupName'] = document.getElementById('azure-plugin-rgn').value;
            req['data']['target_state'] = 'VM running';
            doRequest(req);
        }
        else if (e.target.classList.contains("stop")) {
            req = json;
            req['data']['context']['resourceName'] = document.getElementById('azure-plugin-name').value;
            req['data']['context']['resourceGroupName'] = document.getElementById('azure-plugin-rgn').value;
            req['data']['target_state'] = 'VM deallocated';
            doRequest(req);
        }
    });
}

function reportExecuteScriptError(error) {
    log(error.message);
    console.error(`Failed to execute content script: ${error.message}`);
}

loadConfig();
listenForClicks();
listenForInputChanges();
