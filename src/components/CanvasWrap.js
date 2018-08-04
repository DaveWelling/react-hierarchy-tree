import React from 'react';
import Atrament from 'atrament';

export default class CanvasWrap extends React.Component {
    constructor(props) {
        super(props);
        this.onResize = this.onResize.bind(this);
        this.onChange = this.onChange.bind(this);
        this.clear = this.clear.bind(this);
    }

    componentDidMount() {
        const canvas = this.canvas = document.querySelector(`#drawingView_${this.props.id}`);
        const resizeObserver = new ResizeObserver(event => this.onResize(event));
        resizeObserver.observe(canvas);
        this.onResize();
    }

    componentDidUpdate(prevProps) {
        const {drawing, canvasSettings} = this.props;
        Object.keys(canvasSettings).forEach(key=>{
            if (prevProps.canvasSettings[key] !== canvasSettings[key]){
                this.atrament[key] = canvasSettings[key];
            }
        });
        if (prevProps.drawing !== drawing) {
            this.writeToCanvas(this.canvas, drawing);
        }
    }

    clear(){
        if (this.atrament) this.atrament.clear();
        if (this.canvas) {
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    writeToCanvas(canvas, drawing, clear=true, cors=false) {
        if (drawing === undefined) {
            this.clear();
            return;
        }

        var ctx = canvas.getContext('2d');
        const image = new Image();
        if (cors){
            image.crossOrigin = "use-credentials";
        }
        image.onload = function() {
            if (clear) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            ctx.mozImageSmoothingEnabled = true;
            ctx.webkitImageSmoothingEnabled = true;
            ctx.msImageSmoothingEnabled = true;
            ctx.imageSmoothingEnabled = true
            ctx.drawImage(image, 0, 0); // draw the new image to the screen
        };
        image.src = drawing;
    }
    onResize() {
        const {drawing} = this.props;
        const rect = this.canvas.parentNode.getBoundingClientRect();
        this.canvas.height = rect.height - 44;
        this.canvas.width = rect.width;
        this.atrament = new Atrament(this.canvas, this.canvas.width, this.canvas.height);
        Object.keys(this.props.canvasSettings).forEach(key=>{
            this.atrament[key] = this.props.canvasSettings[key];
        });
        this.writeToCanvas(this.canvas, drawing);
    }
    onChange(){
        const drawing = this.atrament.toImage();
        this.props.onChange(drawing);
    }
    render(){
        return <canvas
                    id={'drawingView_' + this.props.id}
                    onTouchEnd={this.onChange}
                    onMouseUp={this.onChange}
                />;
    }
}