import React from 'react';
import { throttle } from 'lodash';
import Atrament from 'atrament';
import './drawingView.css';

class DrawingView extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onChange = throttle(this.onChange, 1000);
        this.onResize = this.onResize.bind(this);
        this.onSettingsChange = this.onSettingsChange.bind(this);
        this.state = {
            weight: .1,
            smoothing: false,
            adaptiveStroke: true,
            mode: 'draw',
            color: '#ffffff',
            opacity: 1
        }
    }
    componentDidMount() {
        const canvas = this.canvas = document.querySelector(`#drawingView_${this.props.model._id}`);
        const resizeObserver = new ResizeObserver(event => this.onResize(event));
        resizeObserver.observe(canvas);
        this.onResize();
    }
    onResize() {
        const drawing = this.props.model ? this.props.model.drawing : undefined;
        const rect = this.canvas.parentNode.getBoundingClientRect();
        this.canvas.height = rect.height - 44;
        this.canvas.width = rect.width;
        this.atrament = new Atrament(this.canvas, this.canvas.width, this.canvas.height);
        this.atrament.smoothing = false;
        this.atrament.color = '#ffffff';
        this.atrament.weight = .1;
        this.writeToCanvas(this.canvas, drawing);
    }
    writeToCanvas(canvas, drawing) {
        var ctx = canvas.getContext('2d');
        const image = new Image();
        image.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.mozImageSmoothingEnabled = true;
            ctx.webkitImageSmoothingEnabled = true;
            ctx.msImageSmoothingEnabled = true;
            ctx.imageSmoothingEnabled = true
            ctx.drawImage(image, 0, 0); // draw the new image to the screen
        };
        image.src = drawing;
    }
    componentDidUpdate(prevProps) {
        const { drawing } = this.props.model;
        if (prevProps.model.drawing !== drawing) {
            this.writeToCanvas(this.canvas, drawing);
        }
    }
    onChange() {
        console.log('onchange fired');
        const drawing = this.atrament.toImage();
        this.props.onChange({
            drawing
        });
    }
    onClear(){
        this.atrament.clear();
        this.props.onChange
    }
    onSettingsChange(e){
        let value;
        switch (e.target.name) {
            case 'weight':
            case 'opacity':
                value = parseFloat(e.target.value);
                break;
            case "smoothing":
            case "adaptiveStroke":
                value = e.target.checked;
                break;
            default:
                value = e.target.value;
                break;
        }
        this.atrament[e.target.name] = value;
        this.setState({
            [e.target.name] : value
        })

    }
    render() {
        const that = this;
        const {onSettingsChange} = this;
        return (
            <div id='canvasContainer' className="fullHeight drawingView">
                <canvas
                    id={'drawingView_' + this.props.model._id}
                    onTouchEnd={this.onChange}
                    onMouseUp={this.onChange}
                />
                <div className="canvasToolbar">
                    <button id="clear" onClick={()=>{that.atrament.clear();}}>
                        <i className="material-icons">delete</i>
                    </button>
                    <label>Thickness</label>
                    <input
                        name="weight"
                        type="range"
                        min=".1"
                        max="40"
                        onChange={onSettingsChange}
                        value={that.state.weight}
                        step="0.1"
                        autoComplete="off"
                    />
                    {/* <label>Smoothing</label>
                    <input
                        name="smoothing"
                        type="checkbox"
                        onChange={onSettingsChange}
                        checked={this.state.smoothing}
                        autoComplete="off"
                    />
                    <label>Adaptive stroke</label>
                    <input
                        name="adaptiveStroke"
                        type="checkbox"
                        onChange={onSettingsChange}
                        checked={this.state.adaptiveStroke}
                        autoComplete="off"
                    /> */}
                    <label>Mode</label>

                    <div className="select-container">
                        <select name="mode" value={this.state.mode} onChange={onSettingsChange}>
                            <option value="draw" default>
                                Draw
                            </option>
                            <option value="fill" default>
                                Fill
                            </option>
                            <option value="erase" default>
                                Erase
                            </option>
                    </select>
                    </div>
                    <label>Color</label>
                    <input
                        name="color"
                        type="color"
                        onChange={onSettingsChange}
                        value={this.state.color}
                        autoComplete="off"
                    />
                    {/* <label>Opacity</label>
                    <input
                        name="opacity"
                        type="range"
                        min="0"
                        max="1"
                        onChange={onSettingsChange}
                        value={this.state.opacity}
                        step="0.05"
                        autoComplete="off"
                    /> */}
                </div>
            </div>
        );
    }
}

export default DrawingView;
