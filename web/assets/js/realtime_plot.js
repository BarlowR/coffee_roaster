const c = document.getElementById("plotCanvas");
const ctx = c.getContext("2d"); 

//Pull in css colors (this is so we can make it fancy looking later)
//I hate this- will fix it later.

var color_title = document.getElementById("color_title")
color_title = window.getComputedStyle(color_title).color.toString()

var color_axes = document.getElementById("color_axes")
color_axes = window.getComputedStyle(color_axes).color.toString()

var color_temp = document.getElementById("color_temp")
color_temp = window.getComputedStyle(color_temp).color.toString()
color_temp = color_temp.replace(')', ', 0.4)').replace('rgb', 'rgba');

var color_heater = document.getElementById("color_heater")
color_heater = window.getComputedStyle(color_heater).color.toString()
color_heater = color_heater.replace(')', ', 0.4)').replace('rgb', 'rgba');

var color_fan = document.getElementById("color_fan")
color_fan = window.getComputedStyle(color_fan).color.toString()
color_fan = color_fan.replace(')', ', 0.4)').replace('rgb', 'rgba');


color_ref = {"temp" : color_temp, "fan" : color_fan, "heater" : color_heater}

console.log(color_ref);

const file_upload = document.getElementById('upload_profile');
const load = document.getElementById('load');

const start = document.getElementById('start');

const notes_div = document.getElementById('notes');



//set our canvas sizing. Everything drawn on the canvas will be in relation to this coordinate frame
c.width = 1600;
c.height = 900;


//setup the actual plot coordinates and the max values for temp and time
var internal_plot = [[50, 1450], [80, 850]];
var temp_max = 500
var time_max = 1000

var temp_nodes = [];
var heater_nodes = [];
var fan_nodes = [];

var time = 0;
var temps = {};
var state = {};

var old_time = 0;
var old_temps = {};
var old_state = {};

var updating = false;

var loaded = false;

const api_ip = "http://192.168.0.24:5000";


function scaleWindow()
{
    //scale the canvas to our window width, maintaining a 16:9 aspect ratio
    var scaling_factor = .96 * Math.min(window.innerWidth/1600, window.innerHeight/1200);
    var scaled_width = 1600 * scaling_factor;
    var scaled_height = 900 * scaling_factor;

    c.style.width = scaled_width.toString() +"px";
    c.style.height = scaled_height.toString() +"px";
}

//draw the axes of the graph
function drawAxes(ctx, color_main, color_accent, color_fan, color_heater)
{
    ctx.lineWidth = 2;
    ctx.strokeStyle = color_main;
    ctx.fillStyle = color_main;

    //time axis
    ctx.font = '30px serif';
    ctx.fillText("Time (s)", 60, 880);
    ctx.beginPath();
    ctx.moveTo(10, internal_plot[1][1]);
    ctx.lineTo(1590, internal_plot[1][1]);
    ctx.stroke();
    ctx.font = '20px serif';
    axesTicks(ctx, 0, 16, internal_plot[0][1] - internal_plot[0][0], time_max, 
        [internal_plot[0][0], internal_plot[1][1]], 16, 10, 1);

    //temp axis
    ctx.font = '30px serif';
    ctx.fillText("Temp (°C)", 10, 40);
    ctx.beginPath();
    ctx.moveTo(internal_plot[0][0], 60);
    ctx.lineTo(internal_plot[0][0], 890);
    ctx.stroke();
    axesTicks(ctx, 1, 10, internal_plot[1][0] - internal_plot[1][1], temp_max,
        [internal_plot[0][0], internal_plot[1][1]], 16, 10, 1);

    //fan/heater axis
    
    ctx.beginPath();
    ctx.strokeStyle = color_accent;
    ctx.fillStyle = color_accent;

    ctx.moveTo(internal_plot[0][1], 80);
    ctx.lineTo(internal_plot[0][1], 850);
    ctx.stroke();
    axesTicks(ctx, 1, 10, internal_plot[1][0] - internal_plot[1][1], 100,
        [internal_plot[0][1], internal_plot[1][1]], 16, 10, 1);

    ctx.beginPath();
    ctx.fillStyle = color_fan;
    ctx.fillText("Fan /", 1370, 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = color_heater;
    ctx.fillText("Heater (%)", 1440, 40);
    ctx.stroke();
}


//clear the canvas and redraw everything
function refresh(context, node_arrays)
{   
    context.beginPath();
    context.fillStyle = "White";
    context.fillRect(0,0,c.width,c.height);
    context.stroke();
    drawAxes(context, color_axes, color_axes, color_fan, color_heater);
    
    console.log(node_arrays.length);
    if (node_arrays.length > 0)
    {
        for (node_array of node_arrays)
        {
            connectTheDots(context, node_array);
            for (node of node_array)
            {
                node.draw();
            }
        }
    }
    
}

function mouseDownCanvas(evt)
{
}

function mouseMoveCanvas(evt)
{
    
}

function mouseDblClick(evt)
{

}



function loadProfile(evt)
{
    fileList = this.files;
    //console.log(fileList);
    
    var reader = new FileReader();
    reader.onload = function(event){
        nodes_and_note = StateNode.rcode_string_in(event.target.result, color_ref);
        nodes = nodes_and_note[0]
        note = nodes_and_note[1]
        for (const node_list of nodes){
            for (const node of node_list){
                node.updateCanvasPos(internal_plot)
            }
        }
        notes_div.innerHTML = note;

        temp_nodes = nodes[0];
        fan_nodes = nodes[1];
        heater_nodes = nodes[2];

        loaded = true;
        load.innerText = fileList[0].name;
        refresh(ctx, [temp_nodes, heater_nodes, fan_nodes]);

    }
    reader.readAsText(fileList[0]);
}



function updateState(callbackFunc){
    fetch(api_ip + "/get_state")
        .then(response => response.json())
        .then(data => {

            callbackFunc(data);
            if (updating)
            {
                setTimeout(()=>{updateState(callbackFunc);}, 100);
            }
        });  
}

function continuoutUpdateState(){

}


function startRoasting(evt)
{
    updateState((d) => {
        time = d.time;
        temps = d.temp;
        state = d.state;

        const start_time = time;

        updateState(function(data){
            updating = true;
            
            old_time = time;
            old_temps = temps;
            old_state = state;
            //console.log(data)
            time = data.time;
            temps = data.temp;
            state = data.state;

            if (time-start_time > 100000)
            {
                updating = false;
            }

            draw_state_lines(ctx, start_time);
        });
        
    });   
}

function draw_state_lines(context, start_time)
{
    

    for (const name of Object.keys(temps)) {
        context.beginPath();
        context.moveTo(timeToCanvas((old_time-start_time)/1000, internal_plot), tempToCanvas(old_temps[name], internal_plot));
        context.lineTo(timeToCanvas((time-start_time)/1000, internal_plot), tempToCanvas(temps[name], internal_plot));
        context.stroke();

    }
    context.beginPath();
    context.moveTo(timeToCanvas((old_time-start_time)/1000, internal_plot), percentToCanvas(old_state["heater"]*100, internal_plot));
    context.lineTo(timeToCanvas((time-start_time)/1000, internal_plot), percentToCanvas(state["heater"]*100, internal_plot));
    context.stroke();

    context.beginPath();
    context.moveTo(timeToCanvas((old_time-start_time)/1000, internal_plot), percentToCanvas(old_state["fan"]*100, internal_plot));
    context.lineTo(timeToCanvas((time-start_time)/1000, internal_plot), percentToCanvas(state["fan"]*100, internal_plot));
    context.stroke();

}

file_upload.addEventListener("change", loadProfile, false);
load.addEventListener('click', (evt) => file_upload.click(), false);

start.addEventListener('click', startRoasting, false)

window.addEventListener('resize', function(event) {
    scaleWindow();
}, true);



nodes = []
refresh(ctx, nodes);

scaleWindow();