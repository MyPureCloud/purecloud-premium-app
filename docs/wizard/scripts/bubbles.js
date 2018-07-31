/**
 * Bubble canvas to emulate the banner @ https://appfoundry.genesys.com/
 */

(function(){
    
$(document).ready(() =>{
    window.requestAnimationFrame(draw);
});


class GenesysShape{
    /**
     * All shape entities
     * @param {CanvasRenderingContext2D} shape    "circle" or "oblong"
     * @param {int} x  starting X position
     * @param {int} y  starting y position
     * @param {float}   speed   speed of floating upwards.
     * @param {float}   direction x-value displacement every frame
     */ 
    constructor(shape, x, y, speed, direction){
        this.shape = shape;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.direction = direction;
        this.onScreen = true;
    }

    /**
     * Draws the shape to the canvas
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx){
        ctx.drawImage(this.shape, this.x, this.y);
    }

    /**
     * Draws the shape but also moves the position afterwards
     * @param {CanvasRenderingContext2D} ctx 
     */
    float(ctx){
        this.draw(ctx);
        this.y -= this.speed;
        this.x += this.direction;
        if((this.x > ctx.canvas.width + this.shape.width) ||
                (this.x < 0 - this.shape.width) ||
                (this.y < -this.shape.height)){
            this.onScreen = false;
        }
    }   

    /**
     * Class method to float all GenesysShapes
     * @param {CanvasRenderingContext2D} ctx 
     */
    static floatAll(ctx){
        GenesysShape.shapes.forEach((shape, index, object) => {
            shape.float(ctx);
            if(!shape.onScreen)
                object.splice(index, 1);
        });
    }

    /**
     * Class method. Add genesys shapes to the array when others are 
     * already out of screen
     * @param {CanvasRenderingContext2D} ctx 
     */
    static addShapes(ctx){
        if(GenesysShape.shapes.length < 50){
            GenesysShape.primitives.forEach((prim) => {
                GenesysShape.shapes.push(
                    new GenesysShape(prim,
                            Math.random() * (ctx.canvas.width + (prim.width * 2) - prim.width),
                            (ctx.canvas.height + prim.height), 
                            0.1 + (Math.random() * 0.5),
                            (Math.random() * 0.5) - 0.25
                        )
                );
            });
        }
        //console.log(GenesysShape.shapes.length);
        setTimeout(GenesysShape.addShapes, 2000, ctx);
    }
    
    /**
     * Called at the start in order to fill canvas and array
     * with shapes in random positions.
     */
    static initialShapes(){
        GenesysShape.primitives.forEach((prim) => {
            GenesysShape.shapes.push(
                new GenesysShape(prim,
                        Math.random() * (ctx.canvas.width + (prim.width * 2) - prim.width),
                        Math.random() * (ctx.canvas.height + prim.height), 
                        0.1 + (Math.random() * 0.5),
                        (Math.random() * 0.5) - 0.25
                    )
            );
        });
        
        //console.log(GenesysShape.shapes.length);
        setTimeout(GenesysShape.addShapes, 1000, ctx);
    }

    /**
     * Creates hidden canvasses that will contain the different shapes 
     * More efficient than drawing everything "on the fly"
     * @returns {Array} primitives  Contains the canvases.
     */
    static createPrimitives(){
        let primitives = [];
        let shapes = ["circle", "oblong"];
        let sizes = [20, 30, 40, 60];
        let blurLevels = [0, 1, 2, 3];

        shapes.forEach((shape) => {
            sizes.forEach((size) => {
                blurLevels.forEach((blur) => {
                    let opacity_multipier = 4;
                    let t_canv = document.createElement('canvas');
                    
                    let t_cnxt = t_canv.getContext('2d');

                    switch(shape){
                        case "circle":
                            t_canv.width = size;
                            t_canv.height = size;
                            GenesysShape.drawShape(t_cnxt, shape, size * 0.83, size * 0.5, size, 
                                        1.0 / (blur + opacity_multipier), blur);
                            break;
                        case "oblong":
                            t_canv.width = size * 2;
                            t_canv.height = size * 0.8;
                            GenesysShape.drawShape(t_cnxt, shape, size * 0.4, size * 0.15, size, 
                                        1.0 / (blur + opacity_multipier), blur);
                            break;
                    }
                    // t_cnxt.fillStyle = "rgba(0,0,0,0.1)";
                    // t_cnxt.fillRect(0, 0, t_canv.width, t_canv.height);
                    primitives.push(t_canv);
                })
            })
        })

        return primitives;
    }

    /**
     * Helper function for createPrimitives(). Will draw the speciied shape
     * into the canvas.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {string} shape    "oblong" or "circle"
     * @param {number} x      
     * @param {number} y 
     * @param {number} size 
     * @param {number} opacity 
     * @param {number} blur 
     */
    static drawShape(ctx, shape, x, y, size, opacity, blur){
        ctx.save();
        ctx.filter = "blur(" + blur + "px)";
        //opacity = Math.floor(255 * opacity);
        //console.log(opacity);
        ctx.strokeStyle = "rgba(244, 87, 30, " + opacity + " )";
        let radius = 0;

        switch(shape){
            case "oblong":
                ctx.beginPath();
                radius = size / 4;
                ctx.lineWidth =  size * 0.13;

                ctx.moveTo(x, y);
                ctx.lineTo(x + size, y);
                ctx.arc(x + size, y + radius, radius, Math.PI * 3 / 2, Math.PI / 2, false);
                ctx.lineTo(x, y + radius * 2);
                ctx.arc(x, y + radius, radius, Math.PI / 2, Math.PI * 3 / 2, false);
                
                ctx.stroke();
                break;
            case "circle":
                ctx.beginPath();
                radius = size / 3;
                ctx.lineWidth =  size * 0.2;
                ctx.moveTo(x, y);
                ctx.arc(x - radius, y, radius, 0, Math.PI * 2, false);
                ctx.stroke();
            default:
                break;
        }
        
        ctx.restore();
    }
}
GenesysShape.shapes = [];
GenesysShape.primitives = GenesysShape.createPrimitives();


var ctx = document.getElementById('bubbly-layer').getContext('2d');

ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;

GenesysShape.initialShapes(ctx);
function draw(){
    var ctx = document.getElementById('bubbly-layer').getContext('2d');

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    GenesysShape.floatAll(ctx);
    
    window.requestAnimationFrame(draw);
}

})();