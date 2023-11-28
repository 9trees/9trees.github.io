//Global event listener for the page
//Write a event listener for dfu_file_1 input element to handle file selection
document.getElementById("dfu_file_1").addEventListener("change", handleFile_1);
//Write a event listener for dfu_file_2 input element to handle file selection
// document.getElementById("dfu_file_2").addEventListener("change", handleFile_2);

//Global variables
var dfu_file_1_data = [];
var dfu_file_1_data_length = 0;
var dfu_file_2_data = [];
var segmentData = [];
var segmentAddress = [];
var dfu_index = 0;
var dfu_file_1_crc = 0xFFFF;
var dfu_file_2_crc = 0xFFFF;
let writePacket;

//Write a ChromeSample extension for displaying log
var ChromeSample = {
    log: function () {
        var line = Array.prototype.slice.call(arguments).map(function (argument) {
            return typeof argument === 'string' ? argument : JSON.stringify(argument);
        }).join(' ');

        document.querySelector('#log').textContent += line + '\n';
    },

    clearLog: function () {
        document.querySelector('#log').textContent = '';
    },

    setStatus: function (status) {
        document.querySelector('#status').textContent = status;
    },

    setContent: function (newContent) {
        var content = document.querySelector('#content');
        while (content.hasChildNodes()) {
            content.removeChild(content.lastChild);
        }
        content.appendChild(newContent);
    }
};
log = ChromeSample.log;
clearLog = ChromeSample.clearLog;
let device;
const ServerUUID = '45544942-4c55-4554-4845-524db87ad700';
const characteristicUUID = '45544942-4c55-4554-4845-524db87ad705';
var eti_service, eti_characteristic;
var even = false;

//Write a function to clear the log onclick of clear button using clearLog() function
function clear_btn() {
    clearLog();
}


//Check if the browser supports Web Bluetooth API
function isWebBluetoothEnable() {
    if (navigator.bluetooth) {
        return true;
    } else {
        ChromeSample.setStatus('Web Bluetooth API is not available.\n' +
            'Please make sure the "Experimental Web Platform features" flag is enabled.');
        return false;
    }
}

//write a function to calculate crc16 of a given array of bytes
function crc_update(crc, byte){
    var x;
    x = ((crc >> 8) ^ byte) & 0xFF;
    x ^= x >> 4;
    return ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
}

//three_bytes function, convert a 2 byte address to a big endian 3 byte address
function three_bytes(address){
    //Convert a 2 byte address to a 3 byte address
    var address_3 = [];
    address_3[0] = address & 0xff;
    address_3[1] = (address >> 8) & 0xff;
    address_3[2] = (address >> 16) & 0xff;
    // console.log(address, address_3);
    return address_3;        
}

//write a function to togel the input variable true or false
function toggle(input) {
    return input ^= 1;
}
//write a function to save vale in element with id "log" in a txt file
//The fiel name is string of current date and time and download it to the local machine
function saveLog() {
    var date = new Date();
    var mydate = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2) + ("0" + date.getHours() ).slice(-2) + ("0" + date.getMinutes()).slice(-2) + ("0" + date.getSeconds()).slice(-2);
        
    var textToSave = document.getElementById("log").innerText;
    var textToSaveAsBlob = new Blob([textToSave], { type: "text/plain" });
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    var fileNameToSaveAs = "DFU_Report_" + mydate + ".txt";
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

function onDisconnected(event) {
    even = toggle(even);
    log('Device, ' + event.target.name + ' is disconnected.');
    saveLog();
    //Clear the log
    clearLog();
    //enable the connect button
    document.getElementById("dfu_btn").innerHTML  = "Connect";
    document.getElementById("dfu_btn").disabled = false;
    document.getElementById("audio").play();
}

//Connect to a device by name, this function connects to the devise with name
//given to it as a parameter
async function connectDeviceByName(device_name) {
    log('Requesting Bluetooth Device, '+ device_name + '.');
    
    try {
            device = await navigator.bluetooth.requestDevice({
                filters: [{ name: device_name }],
                optionalServices:[ServerUUID]
            });

            device.addEventListener('gattserverdisconnected', onDisconnected);
            log('Connecting To, GATT Server...');
            const  server = await device.gatt.connect();
            document.getElementById("dfu_btn").innerHTML  = "Connected";
            document.getElementById("dfu_btn").disabled = true;
            log('Connected to, ' + device_name);
            //Get the service
            eti_service = await server.getPrimaryService(ServerUUID);
            //Get the characteristic
            eti_characteristic = await eti_service.getCharacteristic(characteristicUUID);
            //Add event listener to characteristic
            eti_characteristic.addEventListener('characteristicvaluechanged', handleNotifications);
            //Turn on notifications
            await eti_characteristic.startNotifications();
            
        } catch (error) {
            log('Argh! ' + error);
        }
}

/*
Write a function to calculate time difference between current time and a old time in milliseconds
the function has to store the old time as a global variable and update it every time it is called with current time
it shuld return the time difference in milliseconds with current time
*/
var old_time = new Date();
function time_diff() {
    var current_time = new Date();
    var diff = current_time - old_time;
    old_time = current_time;
    return diff;
}

//write a function to return current time in hh:mm:ss:ms format
function get_time() {
    var current_time = new Date();
    var time = ("0" + current_time.getHours()).slice(-2) + ":" + ("0" + current_time.getMinutes()).slice(-2) + ":" + ("0" + current_time.getSeconds()).slice(-2) + ":" + ("0" + current_time.getMilliseconds()).slice(-3);
    return time;
}


function dfu_btn(){
    //Check if the file is selected in dfu_file_1
    if(!document.getElementById("dfu_file_1").files[0]){
        alert("Please select a file");
        return;
    }
    isWebBluetoothEnable();
    var device_name = document.getElementById("dfu_device_serial_number").value;
    //if device_name is empty
    if(device_name == ""){
        device_name =  "Thermapen";
    }
    else{
        device_name = device_name + " Thermapen";
    }
    log("Connecting To: " + device_name);
    connectDeviceByName(device_name);

}

function handleFile_1(event) {
    //Reset segmentData and segmentAddress
    segmentData = [];
    segmentAddress = [];
    var data = [];
    var file = event.target.files[0];
    // var file = document.getElementById("dfu_file_1").files[0];
    //validate the file and raise an alert if the file is not valid
    //then reset the file input
    if(!file){
        alert("No file selected");
            document.getElementById("dfu_file_1").value = "";
        return;
    }
    //Check if the file is .txt file, if not raise an alert
    if(!file.name.match(/\.txt$/)){
        alert("Invalid txt file type");
        document.getElementById("dfu_file_1").value = "";
        return;
    }

    var reader = new FileReader();

    reader.onload = function(event) {
        //Split the file into lines
        var lines = event.target.result.split('\n');
        //Compare the 1st element of lines array with "@4A00" and raise an alert if it is not equal
        if(lines[0].slice(0,5) != "@4A00"){
            console.log(lines[0].slice(0,5), lines[0].length);
            alert("Invalid start address file");
            document.getElementById("dfu_file_1").value = "";
            return;
        }
        //for each line in the file
        for(var line = 0; line < lines.length; line++){
            //split the line into words
            var words = lines[line].split(' ');
            //The words[0][0] can be eiter 'q'/'@',
            //if it is '@' then the words[0] is the address of the segment
            //if it is 'q' then the file ends here we need to break the loop
            //else its data
            if(words[0][0] == '@'){
                //Creat a address variable and push the words[0] sliced from
                //1st index and convert it to a heaxadecimal number
                var address = [];
                address.push(parseInt(words[0].slice(1), 16));
                //Push the address to segmentAddress array
                segmentAddress.push(address);
                //if data is not empty push the data to segmentData array
                //and empty the data array
                if(data.length != 0){
                    segmentData.push(data);
                    data = [];
                }
            }else if(words[0][0] == 'q'){
                //if the words[0][0] is 'q' then break the loop
                //if data is not empty push the data to segmentData array
                //and empty the data array
                if(data.length != 0){
                    segmentData.push(data);
                    data = [];
                }
                break;
            }else{
                //for each word in words array, convert it to a hexadecimal number
                //and push it to data array
                for(var word = 0; word < words.length; word++){
                    data.push(parseInt(words[word], 16));
                }
            }                
        }segmentsTodfu_file_data(1);
    };
    reader.readAsText(file);
}

function handleFile_2(event) {
    //Reset segmentData and segmentAddress
    segmentData = [];
    segmentAddress = [];
    var data = [];
    var file = event.target.files[0];
    //validate the file and raise an alert if the file is not valid
    if(!file){
        alert("No file selected");
        document.getElementById("dfu_file_2").value = "";
        return;
    }
    //Check if the file is .txt file, if not raise an alert
    if(!file.name.match(/\.txt$/)){
        alert("Invalid txt file type");
        document.getElementById("dfu_file_2").value = "";
        return;
    }
    var reader = new FileReader();

    reader.onload = function(event) {
        //Split the file into lines
        var lines = event.target.result.split('\n');
        //Compare the 1st element of lines array with "@4A00" and raise an alert if it is not equal
        if(lines[0].slice(0,5) != "@4A00"){
            alert("Invalid start address file");
            console.log(lines[0].slice(0,5), lines[0].length);
            document.getElementById("dfu_file_2").value = "";
            return;
        }
        //for each line in the file
        for(var line = 0; line < lines.length; line++){
            //split the line into words
            var words = lines[line].split(' ');
            //The words[0][0] can be eiter 'q'/'@',
            //if it is '@' then the words[0] is the address of the segment
            //if it is 'q' then the file ends here we need to break the loop
            //else its data
            if(words[0][0] == '@'){
                //Creat a address variable and push the words[0] sliced from
                //1st index and convert it to a heaxadecimal number
                var address = [];
                address.push(parseInt(words[0].slice(1), 16));
                //Push the address to segmentAddress array
                segmentAddress.push(address);
                //if data is not empty push the data to segmentData array
                //and empty the data array
                if(data.length != 0){
                    segmentData.push(data);
                    data = [];
                }
            }else if(words[0][0] == 'q'){
                //if the words[0][0] is 'q' then break the loop
                //if data is not empty push the data to segmentData array
                //and empty the data array
                if(data.length != 0){
                    segmentData.push(data);
                    data = [];
                }
                break;
            }else{
                //for each word in words array, convert it to a hexadecimal number
                //and push it to data array
                for(var word = 0; word < words.length; word++){
                    data.push(parseInt(words[word], 16));
                }
            }                
        }segmentsTodfu_file_data(2);
    };
    reader.readAsText(file);
}

function eti_data_write(data, file_number)
{
    let len = data[2].length;
    let crc = 0xFFFF;
    const buffer = new ArrayBuffer(8+len);
    const view = new DataView(buffer);
    view.setInt8(0, data[0][0]);
    view.setInt8(1, data[0][1]);
    view.setInt8(2, len);
    crc = crc_update(crc, len);
    for(let j = 0; j < 3; j++){
        view.setUint8(3+j, data[1][j]); 
        crc = crc_update(crc, data[1][j]);           
    }
    for(let i = 0; i < len; i++){
        view.setUint8(6 + i, data[2][i]);
        crc = crc_update(crc, data[2][i]);
        if(file_number == 1){
            dfu_file_1_crc = crc_update(dfu_file_1_crc, data[2][i]);
        }else if(file_number == 2){
            dfu_file_2_crc = crc_update(dfu_file_2_crc, data[2][i]);
        }
    }
    view.setUint16(len+6, crc, true);        
    return view;
}

function segmentsTodfu_file_data(file_number){

    //Reset the innerhtml of element id df1/df2 with DFU File 1-> /DFU File 2-> 
    if(file_number == 1){
        document.getElementById("df1").innerHTML = "DFU File 1-> ";
    }else if(file_number == 2){
        document.getElementById("df2").innerHTML = "DFU File 2-> ";
    }

    const buffer_F1 = new ArrayBuffer(4);
    const dataView_F1 = new DataView(buffer_F1);
    const buffer = new ArrayBuffer(4);
    const dataView = new DataView(buffer);
    //Clear the dfu_file_data array
    if(file_number == 1){
        dfu_file_1_data = [];
    }else if(file_number == 2){
        dfu_file_2_data = [];
    }
    //DFU Download area address in MSP430
    var downloadAreaAddress = 0x14500;
    //DFU start command Packet 0xF0F1 + 0xFEED
    dataView_F1.setUint16(0, 0xF0F1, true);
    dataView_F1.setUint16(2, 0xFEED, true);
    //Push the DFU start command packet to dfu_file_data array
    if(file_number == 1){
        dfu_file_1_data.push(dataView_F1);
    }else if(file_number == 2){
        dfu_file_2_data.push(dataView_F1);
    }

    //for each segment in segmentAddress array
    for(var segment = 0; segment < segmentAddress.length; segment++){
        //Creat a variable for segment data length
        var segmentDataLength = segmentData[segment].length;
        var startIndex = 0;
        var endIndex = 0;
        var packetLength = 0;

        //if integer valu of the segment address is less than (0x23F80 - 0x01)
        //then the segment address is equal to downloadAreaAddress
        if(Number(segmentAddress[segment]) < (0x23F80 - 0x01)){
            segmentAddress[segment] = downloadAreaAddress;
        }

        while(segmentDataLength > 0){

            if(segmentDataLength > 12){
                packetLength = 12;
            }else{
                packetLength = segmentDataLength;
            }
            //Creat a variable for packet data
            var packetData = [];
            //Push [0xF0, 0xF0] a packet start command to packetData array
            packetData.push([0xF0, 0xF0]);
            downloadAreaAddress = Number(segmentAddress[segment]) + startIndex;
            packetData.push(three_bytes(downloadAreaAddress));
            endIndex = startIndex + packetLength;
            packetData.push(segmentData[segment].slice(startIndex, endIndex));
            startIndex = endIndex;
            if(file_number == 1){
                dfu_file_1_data.push(eti_data_write(packetData, file_number));
            }else if(file_number == 2){
                dfu_file_2_data.push(eti_data_write(packetData, file_number));
            }
            segmentDataLength -= packetLength;            
        }
    }
    //DFU end command Packet 0xF0F2 + DFU file CRC
    dataView.setUint16(0, 0xF0F2, true);
    if(file_number == 1){
        dataView.setUint16(2, dfu_file_1_crc, true);
        dfu_file_1_data.push(dataView);
    }else if(file_number == 2){
        dataView.setUint16(2, dfu_file_2_crc, true);
        dfu_file_2_data.push(dataView);
    }
    //Append the innerhtml of element id df1/df2 with dfu_file1/2_data array length
    if(file_number == 1){
        dfu_file_1_data_length = dfu_file_1_data.length;
        document.getElementById("df1").innerHTML += dfu_file_1_data.length;
    }else if(file_number == 2){
        document.getElementById("df2").innerHTML += dfu_file_2_data.length;
    }

}

function moveWritePacket(){
    if(dfu_file_1_data.length != 0){
        writePacket = dfu_file_1_data.shift();
    }else if(dfu_file_2_data.length != 0){
        writePacket = dfu_file_2_data.shift();
    }
}

//write a function to update the progress bar and display progress persentage as per
//the number of packets written from dfu_file_1_data array
function updateProgressBar(){
    //select the progress bar element with querySelector .progress-bar
    var progressBar = document.querySelector(".progress-bar");
    //calculate the progress percentage
    progressBar.style.width = (100 - ((dfu_file_1_data.length/dfu_file_1_data_length)*100)) + "%";
    //display the progress percentage
    progressBar.innerHTML = (100 - ((dfu_file_1_data.length/dfu_file_1_data_length)*100)).toFixed(2) + "%";
}
    

//Write a async function to write command and notification 
async function writeCommandAndNotification(data){
    if(!eti_characteristic) return;
    try{
        //Write command to eti_characteristic with writeValueWithoutResponse
        await eti_characteristic.writeValueWithoutResponse(data);
        eti_characteristic.addEventListener('characteristicvaluechanged', handleNotifications); 
    }catch(error){
        console.log(error);
    }
}

function handleNotifications(event) {
    var time_difference = time_diff();
    //Get the notification data from event.target.value as getuint16 
    var notificationData = event.target.value.getUint16(0, true);
    //update the progress bar
    updateProgressBar();
    //write a switch case for 0x0000 then write a 1st packet
    switch(notificationData){
        case 0x0000:
            //log the time when the notification is received
            log("0x0000, ", get_time());
            moveWritePacket();
            writeCommandAndNotification(writePacket);
            break;
        //write a case for 0x0F0F then write next packet
        case 0x0F0F:
            //log the time when the notification is received
            // log("0x0F0F, ", get_time(), ", ", time_difference);
            moveWritePacket();
            writeCommandAndNotification(writePacket);
            break;
        //write a case for 0x0C0C then write the same packet again
        case 0x0C00:
            //log the time when the notification is received
            log("0x0C00, ", get_time(), ", ", time_difference);
            writeCommandAndNotification(writePacket);
            break;
        case 0x020F: //DFU Error            
            log("0x020F, "  + get_time() + ", DFU Error", time_difference);
            break;
        case 0x0500: //DFU Success
            log("0x0500, " + get_time() + ", DFU Success", time_difference);
            break;
        default:
            log("Default, ", notificationData , get_time(), ", ", time_difference);
            break;
    }
    //display time difference between the current notification and the previous notification
    document.getElementById("msp_dfu_status").innerHTML = time_difference;
}

