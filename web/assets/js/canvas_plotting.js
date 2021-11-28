class StateNode {
    constructor(context, type, time, val, color) 
    {

        this.click_margin_node = 15;
        this.click_margin_line = 10;

        this.size = 10;

        this.context = context
        this.type = type;
        this.val = val;
        this.time = time;
        this.color = color
        this.unit = "";
        this.valToCanvas;
        this.valFromCanvas;
        this.canvas_pos;


        var y = 0;

        switch (type){
            case "temp":
                this.valToCanvas = tempToCanvas;
                this.valFromCanvas = canvasToTemp;
                this.unit = "°C"
                break;

            case "fan":
                this.valToCanvas = percentToCanvas;
                this.valFromCanvas = canvasToPercent;
                this.unit = "%"
                break;

            case "heater":
                this.valToCanvas = percentToCanvas;
                this.valFromCanvas = canvasToPercent;
                this.unit = "%"
                break;
            }

    }

    draw()
    {
        this.context.beginPath();
        this.context.strokeStyle = this.color;
        this.context.fillStyle = "white"
        this.context.lineWidth = 8;
        this.context.arc(this.canvas_pos[0], this.canvas_pos[1], this.size, 0, 360);
        this.context.stroke();
        this.context.fill();
    }

    isMe(click_pos, margin) //square bounding box rn, probably doesn't need fixing
    {
        if (click_pos[0] > this.canvas_pos[0]-(this.size+margin) &&
            click_pos[0] < this.canvas_pos[0]+(this.size+margin) &&
            click_pos[1] > this.canvas_pos[1]-(this.size+margin) &&
            click_pos[1] < this.canvas_pos[1]+(this.size+margin))
        {
            return true;
        }
        else return false;
    }

    //move to position on plot and determine member variables from position
    moveToCanvas(pos, plot_pixel_bounds)
    {
        
        this.time = Math.max(Math.round(canvasToTime(pos[0], plot_pixel_bounds)), 0);
        this.val = Math.max(Math.round(this.valFromCanvas(pos[1], plot_pixel_bounds)), 0);
        this.updateCanvasPos(plot_pixel_bounds)
    }

    //update member variables to new values and move canvas position of node
    moveToVals(vals, plot_pixel_bounds)
    {
        this.time = Math.max(Math.round(vals[0]), 0);
        this.val = Math.max(Math.round(vals[1]), 0);
        this.updateCanvasPos(plot_pixel_bounds)
    }

    //set the canvas position based on a given bounds and the internal value/time
    updateCanvasPos(plot_pixel_bounds)
    {
        this.canvas_pos = [timeToCanvas(this.time, plot_pixel_bounds), this.valToCanvas(this.val, plot_pixel_bounds)];
    }

    static triple_node_comparison(a,b,c)
    {
        if (a.length > 0 && b.length > 0 && c.length > 0)
        {
            if (a[0].time <= b[0].time && a[0].time <= c[0].time){
                return a;
            }
            else if (b[0].time <= a[0].time && b[0].time <= c[0].time){
                return b;
            }
            else {
                return c;
            }
        }

        else if (a.length > 0 && b.length > 0)
        {
            if (a[0].time <= b[0].time){
                return a;
            }
            else{
                return b;
            }
        }

        else if (a.length > 0 && c.length > 0)
        {
            if (a[0].time <= c[0].time){
                return a;
            }
            else{
                return c;
            }
        }

        else if (b.length > 0 && c.length > 0)
        {
            if (b[0].time <= c[0].time){
                return b;
            }
            else{
                return c;
            }
        }
        else if (a.length > 0)
            return a;
        else if (b.length > 0)
            return b;
        else if (c.length > 0)
            return c;

        else{
            return false;
        }
    }

    static rcode_string_out(node_arrays)
    {
        var command_string = "B0\nH0\nF0\n";
        var node;
        var t_nodes = node_arrays[0].slice(0);
        var h_nodes = node_arrays[1].slice(0);
        var f_nodes = node_arrays[2].slice(0);

        t_nodes.sort((a,b) => a.time - b.time);
        f_nodes.sort((a,b) => a.time - b.time);
        h_nodes.sort((a,b) => a.time - b.time);

        while(1)
        {
            command_dict = {"temp" : "B", 
                            "fan" : "F",
                            "heater" : "H"};

            next_node_array = triple_node_comparison(t_nodes, f_nodes, h_nodes);


            if (next_node_array)
            {

                node = next_node_array.shift();

                if (next_node_array.length > 0)
                {
                    var next_node_time = next_node_array[0].time
                    var duration = next_node_time - node.time
                    var next_node_val = next_node_array[0].val
                    command_string += command_dict[node.type] +"2,"+next_node_val.toString()+","+(1000*duration).toString()+",0\n"
                }
                else
                {
                    command_string += command_dict[node.type] +"1,"+node.val.toString()+"\n"
                }
                    
            }
            else
            {
                return command_string + ";" + notes_box.value;
            }
        }
    }

    static rcode_string_in(text, colors)
    {
       
        var time = [0,0,0]; //temp, fan, heater
        var time_index = 0

        var t_nodes = [];
        var h_nodes = [];
        var f_nodes = [];
        var active_node_array;

        var command_note = text.split(";");
        var command_array = command_note[0].split("\n");

        for (var command of command_array)
        {
            var cmd_pieces = command.split(",");
            //console.log(cmd_pieces);
            
            var type = ""

            switch (cmd_pieces[0][0]) {
                case "B":
                    active_node_array = t_nodes;
                    type = "temp";
                    time_index = 0
                    break;
                case "F":
                    active_node_array = f_nodes;
                    type = "fan";
                    time_index = 1
                    break;
                case "H":
                    active_node_array = h_nodes;
                    type = "heater";
                    time_index = 2
                    break;
            }

            var new_node;
            switch (cmd_pieces[0][1]) {
                case "0":
                    new_node = new StateNode(ctx, type, time[time_index], 0, colors[type]);
                    break;
                case "1":
                    new_node = new StateNode(ctx, type, time[time_index], cmd_pieces[1], colors[type]);
                    break;
                case "2":
                    time[time_index] += cmd_pieces[2]/1000;
                    new_node = new StateNode(ctx, type, time[time_index], cmd_pieces[1], colors[type]);
                    break;

                default:
                    console.log(cmd_pieces[0][1], "not implemented");
            }
            active_node_array.push(new_node);
            //console.log(new_node);
            //console.log(active_node_array);
        }
        var note_return = "";
        if (command_note.length > 1)
        {
            note_return = command_note[1];
        }
        return ([[t_nodes, h_nodes, f_nodes], note_return]);
    }
}

class ImmovableStateNode extends StateNode {
    //this keeps the node from ever being clicked by the user
    isMe(click_pos, margin)
    {   
        return false;
    }

}




function tempToCanvas(temp, plot_pixel_bounds){
    var canvas_range = plot_pixel_bounds[1][1] - plot_pixel_bounds[1][0];
    return plot_pixel_bounds[1][1] - canvas_range * (temp/temp_max)
}


function timeToCanvas(time, plot_pixel_bounds){
    var canvas_range = plot_pixel_bounds[0][1] - plot_pixel_bounds[0][0];
    return plot_pixel_bounds[0][0] + canvas_range * (time/time_max)
}


function percentToCanvas(percent, plot_pixel_bounds){
    var canvas_range = plot_pixel_bounds[1][1] - plot_pixel_bounds[1][0];
    return plot_pixel_bounds[1][1] - canvas_range * (percent/100)
}


function canvasToTemp(y, plot_pixel_bounds){
    var canvas_range = plot_pixel_bounds[1][1] - plot_pixel_bounds[1][0];
    return temp_max * (plot_pixel_bounds[1][1] - y)/canvas_range
}


function canvasToPercent(y, plot_pixel_bounds){
    var canvas_range = plot_pixel_bounds[1][1] - plot_pixel_bounds[1][0];
    return 100 * (plot_pixel_bounds[1][1] - y)/canvas_range
}

function canvasToTime(x, plot_pixel_bounds){
    var canvas_range = plot_pixel_bounds[0][1] - plot_pixel_bounds[0][0];
    return time_max * (x - plot_pixel_bounds[0][0])/canvas_range
}




function axesTicks(ctx, vert, num, axis_len, scale_len, start_pos, big_width, small_width = -1, label = 0)
{
    var current_tick = vert ? start_pos[1] : start_pos[0]
    var scale_val = 0;
    var step = axis_len/num;
    var scale_step = scale_len/num;

    if (small_width == -1){
        small_width = big_width;
    }

    ctx.beginPath();

    for (let i = 1; i <= num; i++)
    {
        current_tick += step;
        scale_val += scale_step;

        var half_width = (i%2==0) ? big_width/2 : small_width/2;

        var start_pos_x = vert ? start_pos[0]-half_width : current_tick;
        var start_pos_y = vert ? current_tick : start_pos[1]-half_width;

        var end_pos_x = vert ? start_pos[0]+half_width : current_tick;
        var end_pos_y = vert ? current_tick : start_pos[1]+half_width;

        ctx.moveTo(start_pos_x, start_pos_y);
        ctx.lineTo(end_pos_x, end_pos_y);
        

        if (label && i%2==0)
        {
            ctx.fillText(scale_val, end_pos_x + (vert? 5 : -16), end_pos_y + (vert? 8 : 20))
        }
    }
    ctx.stroke();

}


//add lines between nodes
function connectTheDots(context, points)
{
    //sort points array by time
    points.sort((a,b) => a.time - b.time);

    context.strokeStyle = points[0].color;
    context.lineWidth = 2;

    context.moveTo(points[0].canvas_pos[0], points[0].canvas_pos[1]);

    for(var i = 1; i<points.length; i++){
        context.lineTo(points[i].canvas_pos[0], points[i].canvas_pos[1]);
    }
    context.stroke();
}


//calculate the distance from a line (defined by two points) to a third point)
function distanceLineToPoint(p1, p2, point)
{
    var twice_the_area = Math.abs((p2[0]-p1[0])*(p1[1]-point[1]) - (p1[0]-point[0])*(p2[1]-p1[1]));
    var b = Math.sqrt((p2[0]-p1[0])*(p2[0]-p1[0]) + (p2[1]-p1[1])*(p2[1]-p1[1]));

    var h = twice_the_area/b;

    return h;
}

function getMousePosCanvas(canvas, evt) 
{
    var rect = canvas.getBoundingClientRect();
    return [(evt.clientX - rect.left)/(rect.right-rect.left) * c.width,
        (evt.clientY - rect.top)/(rect.bottom-rect.top) * c.height];
}