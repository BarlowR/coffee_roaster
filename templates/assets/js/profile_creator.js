const c = document.getElementById("profileCanvas");
const ctx = c.getContext("2d"); 

const save_button = document.getElementById('save');
const file_upload = document.getElementById('upload_profile');

var notes_box = document.getElementById("notes");



//Pull in css colors (this is so we can make it fancy looking later)
//I hate this- will fix it later.

var color_title = document.getElementById("color_title")
color_title = window.getComputedStyle(color_title).color.toString()

var color_axes = document.getElementById("color_axes")
color_axes = window.getComputedStyle(color_axes).color.toString()

var color_temp = document.getElementById("color_temp")
color_temp = window.getComputedStyle(color_temp).color.toString()

var color_heater = document.getElementById("color_heater")
color_heater = window.getComputedStyle(color_heater).color.toString()

var color_fan = document.getElementById("color_fan")
color_fan = window.getComputedStyle(color_fan).color.toString()


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

var active_node = null;

var loaded = false;


function scaleWindow()
{
    //scale the canvas to our window width, maintaining a 16:9 aspect ratio
    var scaling_factor = .96 * Math.min(window.innerWidth/1600, window.innerHeight/1200);
    var scaled_width = 1600 * scaling_factor;
    var scaled_height = 900 * scaling_factor;

    c.style.width = scaled_width.toString() +"px";
    c.style.height = scaled_height.toString() +"px";

    notes_box.style.width = scaled_width.toString() +"px";
    notes_box.style.height = (scaled_height*.2).toString() +"px";
    notes_box.style.fontSize = (scaled_height*.03).toString() +"px";
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
    
    for (node_array of node_arrays)
    {
        connectTheDots(context, node_array);
        for (node of node_array)
        {
            node.draw();
        }
    }
}

function mouseDownCanvas(evt)
{
    if (loaded)
    {
        var node_arrays = [temp_nodes, heater_nodes, fan_nodes];
        var mousePos = getMousePosCanvas(c, evt);
        for (node_array of node_arrays)
        {
            for (node of node_array)
            {
                if (node.isMe(mousePos, node.click_margin_node))
                {
                    active_node = node;
                }
            }
        }
    }
}

function mouseMoveCanvas(evt)
{
    if (loaded)
        {
        var node_arrays = [temp_nodes, heater_nodes, fan_nodes];
        refresh(ctx, node_arrays);
        var mousePos = getMousePosCanvas(c, evt);
        if (active_node)
        {   
            active_node.moveToCanvas(mousePos, internal_plot);
        }
        for (node_array of node_arrays)
        {
            for (node of node_array)
            {
                if (node.isMe(mousePos, node.click_margin_node))
                {
                    ctx.beginPath();
                    ctx.fillStyle = node.color;
                    ctx.font = "20px serif";
                    ctx.fillText((node.val.toString() + node.unit + " at " + node.time.toString() + " seconds"), node.canvas_pos[0], node.canvas_pos[1] - 20);
                    ctx.stroke();
                }
            }
        }
    }
}

function mouseDblClick(evt)
{
    if (loaded)
    {
        var node_arrays = [temp_nodes, heater_nodes, fan_nodes];
        var mousePos = getMousePosCanvas(c, evt);

        var isANode = false;
        for (node_array of node_arrays)
        {
            node_array.sort((a,b) => a.time - b.time);

            for (var i = 0; i < node_array.length; i++)
            {

                //if a node is doubleclicked, remove it
                if (node_array[i].isMe(mousePos, node.click_margin_node))
                {
                    node_array.splice(i,1);
                    refresh(ctx, node_arrays);
                    isANode = true;
                    return;
                }
            }
            // if the click is along a line, add a new node of the line type

            if (!isANode)
            {
                for (var i = 0; i < node_array.length-1; i++)
                {
                    {
                        if (mousePos[0] > node_array[i].canvas_pos[0] && mousePos[0] < node_array[i+1].canvas_pos[0])
                        {
                            dist = distanceLineToPoint(node_array[i].canvas_pos, node_array[i+1].canvas_pos, mousePos);

                            if (dist < 4)
                            {
                                //console.log("new StateNode");
                                new_node = new StateNode(ctx, node_array[i].type, 0, 0);
                                new_node.moveToCanvas(mousePos, internal_plot);
                                node_array.splice(i, 0, new_node);
                                refresh(ctx, node_arrays);
                                return;
                            }
                        }                     
                    }
                }
            }
        }
    }
}


function downloadText(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function loadProfile(evt)
{
    fileList = this.files;
    //console.log(fileList);
    
    var reader = new FileReader();
    reader.onload = function(event){
        nodes = StateNode.rcode_string_in(event.target.result);
        for (const node_list of nodes){
            for (const node of node_list){
                node.updateCanvasPos(internal_plot)
            }
        }

        temp_nodes = nodes[0];
        fan_nodes = nodes[1];
        heater_nodes = nodes[2];

        loaded = true;
        load.innerText = fileList[0].name;
        refresh(ctx, [temp_nodes, heater_nodes, fan_nodes]);

    }
    reader.readAsText(fileList[0]);
}

file_upload.addEventListener("change", loadProfile, false);
load.addEventListener('click', (evt) => file_upload.click(), false);

save_button.addEventListener('click', function(){
    var string_out = rcode_string_out([temp_nodes, heater_nodes, fan_nodes]);
    var filename = "rcode.txt";
    downloadText(string_out, filename, "text");
})
c.addEventListener('mousedown', mouseDownCanvas, false);
c.addEventListener('mousemove', mouseMoveCanvas, false);
c.addEventListener('mouseup', function (evt) 
{
    var node_arrays = [temp_nodes, heater_nodes, fan_nodes];
    active_node = null;
    refresh(ctx, node_arrays);
}, false);
c.addEventListener('dblclick', mouseDblClick, false);

window.addEventListener('resize', function(event) {
    scaleWindow();
}, true);

nodes = StateNode.rcode_string_in(`B0
H0
F0
B2,0,43000,0
H2,99,0,0
H2,100,112000,0
F2,100,68000,0
B2,90,69000,0
F2,100,302000,0
B2,90,48000,0
H2,0,1000,0
H2,0,247000,0
B2,200,60000,0
B2,336,59000,0
B2,300,61000,0
B2,301,91000,0
H2,0,110000,0
F2,0,80000,0
B2,0,12000,0
B2,0,557000,0
F2,0,550000,0
H2,0,530000,0
B2,0,0,0
B1,0
H2,0,0,0
H1,0
F2,0,0,0
F1,0
;Howdy!  This is a roasting profile creator tool for Rob's coffee roaster. 
Click and drag nodes to move them.
Double click a line to add a node, and double click a node to remove it.
This is a freeform text box, add your roasting notes here as you go.

                                v Click here to load a roast profile v`);

console.log(nodes);

for (const node_list of nodes){
    for (const node of node_list){
        node.updateCanvasPos(internal_plot)
    }
}
temp_nodes = nodes[0];
fan_nodes = nodes[1];
heater_nodes = nodes[2];
loaded = true;

refresh(ctx, nodes);

scaleWindow();