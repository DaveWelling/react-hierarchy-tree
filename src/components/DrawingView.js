import React from 'react';
import { throttle } from 'lodash';
import './drawingView.css';
import {getAllPicturesInFolder, getImageUrl} from '../googleDrive';
import FileSelector from './FileSelector';
import CanvasWrap from './CanvasWrap';
import { toast } from 'react-toastify';

class DrawingView extends React.Component {
    constructor(props) {
        super(props);
        this.onClear = this.onClear.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onChange = throttle(this.onChange, 1000);
        this.onSettingsChange = this.onSettingsChange.bind(this);
        this.setBackground = this.setBackground.bind(this);
        this.openFile = this.openFile.bind(this);
        this.cancelOpen = this.cancelOpen.bind(this);
        this.state = {
            canvasSettings: {
                weight: .05,
                smoothing: false,
                adaptiveStroke: true,
                mode: 'draw',
                color: '#ffffff',
                opacity: 1
            }
        }
    }
    onChange(drawing) {
        this.props.onChange({
            drawing
        });
    }
    onClear(){
        this.props.onChange({
            drawing: undefined
        });
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
        this.setState({
            canvasSettings: {
                ...this.state.canvasSettings,
                [e.target.name] : value
            }
        })
    }
    setBackground(){
        getAllPicturesInFolder(this.props.projectName).then(pictures=>{
            this.setState({
                files: pictures
            });
        })
    }
    openFile(file){
        this.setState({files: undefined}); // remove files to close dialog
        getImageUrl(file.id).then(dataUrl=>{
            this.writeToCanvas(this.canvas, dataUrl, false);
        }).catch(err=>{
            toast('An error occurred while getting the file from google drive.');
            console.error(err.stack || err.message || JSON.stringify(err, null, 3));
        });

    }
    cancelOpen(){
        // remove files to close dialog
        this.setState({files: undefined});
    }
    render() {
        const that = this;
        const { files, canvasSettings } = this.state;
        const {onSettingsChange, onClear, setBackground, openFile, cancelOpen, onChange} = this;
        return (
            <div id='canvasContainer' className="fullHeight drawingView">
                <CanvasWrap id={this.props.model._id} onChange={onChange} canvasSettings={canvasSettings} drawing={this.props.model.drawing} />
                <div className="canvasToolbar">
                    <button className="canvasButton" onClick={onClear}>
                        <i className="material-icons">delete</i>
                    </button>
                    <button className="canvasButton" onClick={setBackground}>
                        <i className="material-icons">add_photo_alternate</i>
                    </button>
                    <label>Thickness</label>
                    <input
                        name="weight"
                        type="range"
                        min=".05"
                        max="40"
                        onChange={onSettingsChange}
                        value={that.state.canvasSettings.weight}
                        step="0.05"
                        autoComplete="off"
                    />
                    {/* <label>Smoothing</label>
                    <input
                        name="smoothing"
                        type="checkbox"
                        onChange={onSettingsChange}
                        checked={this.state.canvasSettings.smoothing}
                        autoComplete="off"
                    />
                    <label>Adaptive stroke</label>
                    <input
                        name="adaptiveStroke"
                        type="checkbox"
                        onChange={onSettingsChange}
                        checked={this.state.canvasSettings.adaptiveStroke}
                        autoComplete="off"
                    /> */}
                    <label>Mode</label>

                    <div className="select-container">
                        <select name="mode" value={this.state.canvasSettings.mode} onChange={onSettingsChange}>
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
                        value={this.state.canvasSettings.color}
                        autoComplete="off"
                    />
                    <FileSelector files={files} selectFile={openFile} cancelFileSelection={cancelOpen}/>
                    {/* <label>Opacity</label>
                    <input
                        name="opacity"
                        type="range"
                        min="0"
                        max="1"
                        onChange={onSettingsChange}
                        value={this.state.canvasSettings.opacity}
                        step="0.05"
                        autoComplete="off"
                    /> */}
                </div>
            </div>
        );
    }
}

export default DrawingView;
