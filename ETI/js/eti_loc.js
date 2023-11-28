
//Variables
var device, eti_svc, dis_svc, bas_svc;
var Sensor1Data, CommandAndNotification, Sensor1Settings, TrimSettings, InstumentSettings;
var EDText, EDSettings1, EDSettings2, BASValue;
var Sensor1Temp, Units, MeasurmentInterval, AutoOffInterval;
var EDPFAutoTest = false;
var EDOnOff = 0, PFStatus = 0, LoDisable, LoLimit, HiDisable, HiLimit, EDMyText, lastPFStatus = 0;
//Check List objects
var CLArray = [], CLindex;

//Commands and Notifications 
var eti_notification = {
    0x0000: "Init",
    0x0001: "Button pressed",
    0x0002: "Shutdown",
    0x0003: "Invalid Setting",
    0x0004: "Invalid Command",
    0x0005: "Request Refresh",
    0x0100: "Security Key Rejection",
    0x0200: "Cal Pass",
    0x0300: "Cal Fail",
    0x0400: "Configured OK",
    0x0500: "Not Configured",
    0x0F0F: "ACK",
    0x0F01: "Firmware Info",
    0x0F02: "Error / Successful"
};

//Toogle form Dark to light
document.getElementById('btnSwitch').addEventListener('click',()=>{
    if (document.documentElement.getAttribute('data-bs-theme') == 'dark') {
        document.documentElement.setAttribute('data-bs-theme','light')
    }
    else {
        document.documentElement.setAttribute('data-bs-theme','dark')
    }
})
//Disconnect Function events
function dbtn() 
{
    if (device.gatt.connected) {
        // log('Disconnecting from Bluetooth Device...');
        device.gatt.disconnect();
        document.getElementById("AdvName").innerHTML = "Nill";
    } else {
        // log(device.name + '> Bluetooth Device is already disconnected');
    }
}
function onDisconnected(event) 
{
    // Object event.target is Bluetooth Device getting disconnected.
    // log('> Bluetooth Device auto disconnected...!');
    document.getElementById("scan_btn").innerHTML = "Scan"; 
    document.querySelector('#scan_btn').disabled = false;    
}
//Scan and filter
async function scan_btn()
{
    try
    {
        device = await navigator.bluetooth.requestDevice({
            filters: [{ manufacturerData: [{"companyIdentifier":886}] }],
            optionalServices:['battery_service', 'device_information', '45544942-4c55-4554-4845-524db87ad700'], 
            // acceptAllDevices: true            
        });

        device.addEventListener('gattserverdisconnected', onDisconnected);

        const server = await device.gatt.connect();
        document.getElementById("scan_btn").innerHTML = "Connecting..."; 
        document.querySelector('#scan_btn').disabled = true;
        document.getElementById("AdvName").innerHTML = device.name;
        console.log(device.name);

        //BAS Services
        bas_svc = await server.getPrimaryService('0000180f-0000-1000-8000-00805f9b34fb');
        BASValue = await bas_svc.getCharacteristic('00002a19-0000-1000-8000-00805f9b34fb');
        BASValue.addEventListener('characteristicvaluechanged', handleBatChanged);
        await BASValue.readValue();
        await BASValue.startNotifications();

        //DIS Services
        dis_svc = await server.getPrimaryService('0000180a-0000-1000-8000-00805f9b34fb');
        const characteristics = await dis_svc.getCharacteristics();
        document.getElementById("dis_data").innerHTML = "Device Information Characteristics" + '<br>';
        const decoder = new TextDecoder('utf-8');
        for (const characteristic of characteristics) {
            switch (characteristic.uuid) {

                case BluetoothUUID.getCharacteristic('manufacturer_name_string'):
                await characteristic.readValue().then(value => {
                    document.getElementById("dis_data").innerHTML += '> Manufacturer Name String: ' + decoder.decode(value) + '<br>';
                });
                break;

                case BluetoothUUID.getCharacteristic('model_number_string'):
                await characteristic.readValue().then(value => {
                    document.getElementById("dis_data").innerHTML += '> Model Number String: ' + decoder.decode(value) + '<br>';
                });
                break;

                case BluetoothUUID.getCharacteristic('hardware_revision_string'):
                await characteristic.readValue().then(value => {
                    document.getElementById("dis_data").innerHTML += '> Hardware Revision String: ' + decoder.decode(value) + '<br>';
                });
                break;

                case BluetoothUUID.getCharacteristic('firmware_revision_string'):
                await characteristic.readValue().then(value => {
                    document.getElementById("dis_data").innerHTML += '> Firmware Revision String: ' + decoder.decode(value) + '<br>';
                });
                break;

                case BluetoothUUID.getCharacteristic('software_revision_string'):
                await characteristic.readValue().then(value => {
                    document.getElementById("dis_data").innerHTML += '> Software Revision String: ' + decoder.decode(value) + '<br>';
                });
                break;

                default: console.log("> Unknown Characteristic: ", characteristic.uuid);
            }
        }

        //ETI Services
        eti_svc = await server.getPrimaryService('45544942-4c55-4554-4845-524db87ad700');

        Sensor1Data = await eti_svc.getCharacteristic('45544942-4c55-4554-4845-524db87ad701');
        Sensor1Data.addEventListener('characteristicvaluechanged', handleSensor1Changed);
        await Sensor1Data.readValue();
        await Sensor1Data.startNotifications();

        CommandAndNotification = await eti_svc.getCharacteristic('45544942-4c55-4554-4845-524db87ad705');
        CommandAndNotification.addEventListener('characteristicvaluechanged', handelCommandNotification);
        await CommandAndNotification.readValue();
        await CommandAndNotification.startNotifications();

        Sensor1Settings = await eti_svc.getCharacteristic('45544942-4c55-4554-4845-524db87ad707');
        
        InstumentSettings = await eti_svc.getCharacteristic('45544942-4c55-4554-4845-524db87ad709');
        InstumentSettings.addEventListener('characteristicvaluechanged', handelInstumentSettings);
        await InstumentSettings.readValue();

        //EDSettings1 Volatile which stores Bat level, Disp birgtness, etc.,
        EDSettings1 = await eti_svc.getCharacteristic('45544942-4c55-4554-4845-524db87ad70b');
        //EDSettings2 non-Volatile which comm ED Hi/Lo and Pass/Fail
        EDSettings2 = await eti_svc.getCharacteristic('45544942-4c55-4554-4845-524db87ad70c');            
        EDText = await eti_svc.getCharacteristic('45544942-4c55-4554-4845-524db87ad70d');

    document.getElementById("scan_btn").innerHTML = "Connected"; 
    }
    catch(error)
    {
        console.log(error);
    }
}

function handleBatChanged(event)
{
    let batteryLevel = event.target.value.getUint8();
    document.getElementById("bat").innerHTML = batteryLevel + '%';
}

function handleSensor1Changed(event)
{
    Sensor1Temp = event.target.value.getFloat32(0, true);
    if(Units) Sensor1Temp = (Sensor1Temp *(9/5)) + 32;
    document.getElementById("s1d_full").innerHTML = Sensor1Temp;
    document.getElementById("s1d_display").innerHTML = Number((Sensor1Temp).toFixed(1));
    if(EDOnOff)
    {
        document.getElementById("edtext").innerHTML = EDMyText;
        if((HiDisable != true) && (LoDisable != true))
        {
            if(Sensor1Temp <= HiLimit && Sensor1Temp >= LoLimit) PFStatus = 1; //Pass
            else PFStatus = 2; //Fail
            document.getElementById("edhi").innerHTML = HiLimit;
            document.getElementById("edlo").innerHTML = LoLimit;
        }
        else if(HiDisable != true)
        {
            if(Sensor1Temp <= HiLimit) PFStatus = 1; //Pass
            else PFStatus = 2; //Fail
            document.getElementById("edhi").innerHTML = HiLimit;
            document.getElementById("edlo").innerHTML = "LoLimit";
        }
        else if(LoDisable != true)
        {
            if(Sensor1Temp >= LoLimit) PFStatus = 1; //Pass
            else PFStatus = 2; //Fail
            document.getElementById("edlo").innerHTML = LoLimit;
            document.getElementById("edhi").innerHTML = "HiLimit";
        }
        else 
        {
            document.getElementById("edhi").innerHTML = "HiLimit";
            document.getElementById("edlo").innerHTML = "LoLimit";
            PFStatus = 0; //Clear
        }
        if(PFStatus != 0)
        {
            if(PFStatus == 1)
            {
                document.getElementById("pfstatus").innerHTML = "Pass"; // Display Pass
                document.getElementById("pfstatus").classList.remove("bg-danger");
                document.getElementById("pfstatus").classList.add("bg-success");
            }
            else 
            {
                document.getElementById("pfstatus").innerHTML = "Fail"; // Display Fail
                document.getElementById("pfstatus").classList.remove("bg-success");
                document.getElementById("pfstatus").classList.add("bg-danger");
            }
        }
        else 
        {
            document.getElementById("pfstatus").innerHTML = ""; // Clear Pass/Fail
            document.getElementById("pfstatus").classList.remove("bg-success");
            document.getElementById("pfstatus").classList.remove("bg-danger");
        }
        if(lastPFStatus != PFStatus)
        {
            lastPFStatus = PFStatus;
            EDSettings2wite();
        }
    }
    else
    {
        document.getElementById("edtext").innerHTML = "EDMyText";
        document.getElementById("edhi").innerHTML = "HiLimit";
        document.getElementById("edlo").innerHTML = "LoLimit";
        document.getElementById("pfstatus").innerHTML = ""; // Clear Pass/Fail
    }

}

function handelCommandNotification(event)
{
    var currentdate = new Date();
    let cmData = event.target.value.getUint16(0, true);
    document.getElementById("notification").innerHTML = eti_notification[cmData];
    document.getElementById("ntimestamp").innerHTML = "Last Notification: " 
                                                        + currentdate.getHours() + ":" 
                                                        + currentdate.getMinutes() + ":" 
                                                        + currentdate.getSeconds() + ":"
                                                        + currentdate.getMilliseconds();
    if(EDPFAutoTest)
    {
        if(eti_notification[cmData] == "Button pressed")CLAutoTest();
    }
}
function handelInstumentSettings(event)
{
    Units = event.target.value.getUint8(0);
    MeasurmentInterval = event.target.value.getUint16(1, true);
    AutoOffInterval = event.target.value.getUint16(3, true);
    if(Units) document.getElementById("units").innerHTML = "°F";
    else document.getElementById("units").innerHTML = "°C";
}

async function EDSettings2wite()
{
    if(!EDSettings2) return;
    
    const MyBuffer = new ArrayBuffer(20);
    const MyView = new DataView(MyBuffer);
    
    MyView.setUint8(0, EDOnOff);
    MyView.setUint8(1, PFStatus);

    if(HiDisable)for(let i=2; i<6; i++)MyView.setUint8(i, 0xFF);
    else MyView.setFloat32(2, HiLimit, true); // Max temperature

    if(LoDisable)for(let i=6; i<10; i++)MyView.setUint8(i, 0xFF);
    else MyView.setFloat32(6, LoLimit, true); // Max temperature

    EDSettings2.writeValueWithoutResponse(MyView);
}
async function EDTextwite()
{
    if(!EDText) return;
    const MyBuffer = new ArrayBuffer(20);    
    const MyTextBuff = new DataView(MyBuffer);
    var txtEncoder = new TextEncoder();
    var writeTex = txtEncoder.encode(EDMyText);
    for(var i=0; i<=writeTex.length; i++)MyTextBuff.setUint8(i, writeTex[i]);
    EDText.writeValueWithoutResponse(MyTextBuff);
}
async function CommandWrite(value)
{
    const MyBuffer = new ArrayBuffer(2);
    const MyView = new DataView(MyBuffer);

    MyView.setUint16(0, parseInt(value, 16), true);
    console.log(MyView);
    CommandAndNotification.writeValueWithoutResponse(MyView);
}

function Q42023Bug01(value)
{
    var my_txt = " ";    

    switch(value)
    {
        case "dis":            
            my_txt = " ";
            EDOnOff = 0; //Disable ED
            PFStatus = 0; //Clear Pass/Fail
            LoDisable = true;
            HiDisable = true;
            break;
        case "low":            
            my_txt = "Only Low Limit";
            EDOnOff = 1; //Enable ED
            PFStatus = 0; //Clear Pass/Fail
            LoDisable = false;
            LoLimit = 20.5;
            HiDisable = true;
            HiLimit = 100.0;
            break;
        case "hig":            
            my_txt = "Only High Limit";
            EDOnOff = 1; //Enable ED
            PFStatus = 0; //Clear Pass/Fail
            LoDisable = true;
            LoLimit = 0.0;
            HiDisable = false;
            HiLimit = 30.1;                       
            break;
        case "rng":            
            my_txt = "Range Limit";
            EDOnOff = 1; //Enable ED
            PFStatus = 0; //Clear Pass/Fail
            LoDisable = false;
            LoLimit = 16.6;
            HiDisable = false;
            HiLimit = 22.9;           
            break;
        case "pln":            
            my_txt = "Plain Text";
            EDOnOff = 1; //Enable ED
            PFStatus = 0; //Clear Pass/Fail
            LoDisable = true;
            LoLimit = 16.6;
            HiDisable = true;
            HiLimit = 22.9;           
            break;      
    }
    lastPFStatus = 0;    
    EDMyText = my_txt;
    if(value != "dis")EDTextwite();    
    EDSettings2wite();
    console.log(value);    
}

async function RunEDFontTest()
{
    var my_txt = "Test";
    // if(!EDSettings1) return;
    if(!EDSettings2) return;
    if(!EDText) return;
    const MyBuffer = new ArrayBuffer(20);
    const MyView = new DataView(MyBuffer);
    MyView.setUint8(0, 1); //Enable ED
    MyView.setUint8(1, 0); //Clear Pass/Fail
    for(let i=2; i<=9; i++)MyView.setUint8(i, 0xFF);
    // MyView.setFloat32(2, 10.0, true); // Max temperature
    // MyView.setFloat32(6, 10.0, true); // Min temperature

    EDSettings2.writeValueWithoutResponse(MyView);

    for(let i =0x20; i < 0xff; i++)
    {        
        my_txt = "Write: ";
        MyView.setUint8(0, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(1, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(2, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(3, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(4, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(5, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(6, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(7, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(8, i);
        my_txt += i.toString(16) + ',';i++;
        MyView.setUint8(9, i);
        my_txt += i.toString(16);
        
        if (confirm(my_txt.toUpperCase())) 
        {
            // txt = "You pressed OK!";
            console.log("Displaying -> "+ my_txt.toUpperCase());            
            EDText.writeValueWithoutResponse(MyView);            
        } 
        else 
        {
            // txt = "You pressed Cancel!";
            break;
        }     
    }
    // document.getElementById("w_msg1").innerHTML = "LAST " + my_txt.toUpperCase();
    if(confirm("Finish..!"))
    MyView.setUint8(0, 0); //Disable ED
    MyView.setUint8(1, 0); //Clear Pass/Fail
    MyView.setFloat32(2, 100.0, true); // Max temperature
    MyView.setFloat32(6, 10.0, true); // Min temperature

    EDSettings2.writeValueWithoutResponse(MyView);

}

function handleFile() {
    const fileInput = document.getElementById('fileInput');
    CLArray = [];
    CLindex = 0;
    // Check if a file is selected
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = function (e) {
        const csvContent = e.target.result;
        const rows = csvContent.split('\n');        
        document.getElementById("listLength").innerHTML = "Total Recods: ";
        document.getElementById("listLength").innerHTML += rows.length;
        // Loop through CSV rows and add them to the array
        for (let i = 0; i < rows.length; i++) {
          const columns = rows[i].split(',');
          if (columns.length === 4) {
            var rowObject = {
              EDText: columns[0],
              EDHi: columns[1],
              EDLo: columns[2],
              PFStatus: columns[3],
            };
            CLArray.push(rowObject);
          }
        }

        // Log the array to the console (you can perform other actions with the array here)
        console.log(CLArray);
      };

      // Read the file as text
      reader.readAsText(file);
    } else {
      alert('Please choose a CSV file.');
    }
  }

function startHACCP()
{
    if(CLindex < CLArray.length)
    {
        EDPFAutoTest = true;
        EDMyText = CLArray[CLindex].EDText;
        EDOnOff = 1; //Enable ED
        PFStatus = 0; //Clear Pass/Fail
        
        if(CLArray[CLindex].EDLo != " ")
        {
            LoDisable = false;
            LoLimit = CLArray[CLindex].EDLo;
        }
        else LoDisable = true;
        if(CLArray[CLindex].EDHi != " ")
        {
            HiDisable = false;
            HiLimit = CLArray[CLindex].EDHi;
        }
        else HiDisable = true;
        lastPFStatus = 0;
        EDTextwite();    
        EDSettings2wite(); 
    }
    else
    {
        EDPFAutoTest = false;
        EDMyText = " ";
        EDOnOff = 0; //Enable Classic
        PFStatus = 0; //Clear Pass/Fail
        LoDisable = true;
        HiDisable = true;
        lastPFStatus = 0;
        EDTextwite();    
        EDSettings2wite();
        exportTableToCSV("dataTable", ",");
    }       

}

function CLAutoTest()
{
    var dataTable = document.getElementById('dataTable');
    // Clear existing table rows
    if(CLindex == 0)dataTable.innerHTML = '<tr><th>EDText</th><th>EDHi</th><th>HDLo</th><th>PFStatus</th><th>Measured</th></tr>';
    
    const newRow = dataTable.insertRow(-1);
    newRow.insertCell(0).innerHTML = CLArray[CLindex].EDText;
    newRow.insertCell(1).innerHTML = CLArray[CLindex].EDHi
    newRow.insertCell(2).innerHTML = CLArray[CLindex].EDLo;
    if(PFStatus == 1) CLArray[CLindex].PFStatus = "Pass";
    if(PFStatus == 2) CLArray[CLindex].PFStatus = "Fail";
    newRow.insertCell(3).innerHTML = CLArray[CLindex].PFStatus;
    newRow.insertCell(4).innerHTML = Sensor1Temp;
    
    CLindex++;
    startHACCP();    
}

// Define a function that takes the table id and a separator as parameters
function exportTableToCSV(tableId, separator) {
    // Select the table element by id
    var table = document.getElementById(tableId);
    // Initialize an empty string to store the CSV data
    var csv = "";
    // Loop through each row of the table
    for (var i = 0; i < table.rows.length; i++) {
      // Loop through each cell of the row
      for (var j = 0; j < table.rows[i].cells.length; j++) {
        // Get the cell value and escape any double quotes
        var cellValue = table.rows[i].cells[j].innerText.replace(/"/g, '""');
        // Add the cell value to the CSV string, enclosed by double quotes and separated by the separator
        csv += '"' + cellValue + '"' + separator;
      }
      // Remove the last separator and add a newline character at the end of each row
      csv = csv.slice(0, -1) + "\n";
    }
    // Create a hidden link element with the CSV data as the href attribute
    var link = document.createElement("a");
    link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    // Set the download attribute to the filename with the current date and time
    link.setAttribute("download", "table_" + new Date().toLocaleString() + ".csv");
    // Set the style attribute to hide the link element
    link.setAttribute("style", "display: none");
    // Append the link element to the document body
    document.body.appendChild(link);
    // Click the link element to download the CSV file
    link.click();
  }