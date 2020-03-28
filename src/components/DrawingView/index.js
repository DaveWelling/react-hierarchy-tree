import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './drawingView.css';
import { getAllPicturesInFolder, saveNewImage } from '../../googleDrive';
import FileSelector from '../FileSelector';
import CanvasWrap from './CanvasWrap';
import cuid from 'cuid';
import logging from '../../logging';

export default function DrawingView({ subModel, projectName, update }) {
    const undoStack = useRef(new fixedSizeStack());
    const redoStack = useRef(new fixedSizeStack());
    const [canvasSettings, setCanvasSettings] = useState({
        weight: 1,
        mode: 'draw',
        color: '#ffffff'
    });
    // Default drawingModel with undefined drawing
    const [drawingModel, setDrawingModel] = useState({content:{}, ...subModel});
    // picture file listing
    const [files, setFiles] = useState();
    const canvasRef = useRef();


    function onChange(change) {
        const oldSubModel = drawingModel;
        const undoId = cuid();
        logging.debug(`onChange undoId: ${undoId}`);
        undoStack.current.push({...oldSubModel, content: {...oldSubModel.content, undoId}});
        const newSubModel = { ...oldSubModel, content: {...oldSubModel.content, ...change, undoId: undefined }};
        setDrawingModel(newSubModel);
        update(newSubModel);
    }

    function onClear() {
        onChange({
            drawing: undefined
        });
    }

    function onUndo() {
        if (undoStack.current.length()  === 0) return;
        const previous = undoStack.current.pop();
        redoStack.current.push(drawingModel);
        setDrawingModel(previous);
        // Remove undoId before sending to database (so reloaded models will not begin with an undoId)
        const toSave = {...previous, content: {...previous.content, undoId: undefined}};
        update(toSave);
    }

    function onRedo() {
        if (redoStack.current.length() === 0) return;
        const next = redoStack.current.pop();
        undoStack.current.push(drawingModel);
        setDrawingModel(next);
        update(next);
    }

    function onSettingsChange(e) {
        let value;
        switch (e.target.name) {
            case 'weight':
            case 'opacity':
                value = parseFloat(e.target.value);
                break;
            case 'smoothing':
            case 'adaptiveStroke':
                value = e.target.checked;
                break;
            default:
                value = e.target.value;
                break;
        }
        setCanvasSettings({
            ...canvasSettings,
            [e.target.name]: value
        });
    }

    function setBackground() {
        getAllPicturesInFolder(projectName).then(pictures => {
            setFiles(pictures);
        });
    }

    function openFile(file) {
        setFiles(undefined); // remove files to close dialog
        if (typeof file === 'string') {
            onChange({ backgroundImage: file });
        } else {
            if (file) {
                if (canvasRef) {
                    if (file instanceof Blob) {
                        saveNewImage(file, projectName).then(googleFile => {
                            onChange({ backgroundImage: googleFile });
                        });
                    } else {
                        onChange({ backgroundImage: file });
                    }
                }
            }
        }
    }

    function cancelOpen() {
        // remove files to close dialog
        setFiles(undefined);
    }

    return (
        <div id="canvasContainer" className="fullHeight drawingView">
            <CanvasWrap
                id={drawingModel._id}
                ref={canvasRef}
                onChange={onChange}
                backgroundImage={drawingModel.content.backgroundImage}
                canvasSettings={canvasSettings}
                drawing={drawingModel.content.drawing}
                undoId={drawingModel.content.undoId || 0}
            />
            <div className="canvasToolbar">
                <button className="canvasButton" onClick={onClear}>
                    <i className="material-icons">delete</i>
                </button>
                <button className="canvasButton" onClick={setBackground}>
                    <i className="material-icons">add_photo_alternate</i>
                </button>
                <button className="canvasButton" onClick={onUndo}>
                    <i className="material-icons">undo</i>
                </button>
                <button className="canvasButton" onClick={onRedo}>
                    <i className="material-icons">redo</i>
                </button>
                <label>Thickness</label>
                <input
                    name="weight"
                    type="range"
                    min="1"
                    max="40"
                    onChange={onSettingsChange}
                    value={canvasSettings.weight}
                    step="1"
                    autoComplete="off"
                />
                {/* <label>Smoothing</label>
                    <input
                        name="smoothing"
                        type="checkbox"
                        onChange={onSettingsChange}
                        checked={canvasSettings.smoothing}
                        autoComplete="off"
                    />
                    <label>Adaptive stroke</label>
                    <input
                        name="adaptiveStroke"
                        type="checkbox"
                        onChange={onSettingsChange}
                        checked={canvasSettings.adaptiveStroke}
                        autoComplete="off"
                    /> */}
                <label>Mode</label>

                <div className="select-container">
                    <select name="mode" value={canvasSettings.mode} onChange={onSettingsChange}>
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
                    value={canvasSettings.color}
                    autoComplete="off"
                />
                <FileSelector files={files} selectFile={openFile} cancelFileSelection={cancelOpen} />
                {/* <label>Opacity</label>
                    <input
                        name="opacity"
                        type="range"
                        min="0"
                        max="1"
                        onChange={onSettingsChange}
                        value={canvasSettings.opacity}
                        step="0.05"
                        autoComplete="off"
                    /> */}
            </div>
        </div>
    );
}

DrawingView.propTypes = {
    subModel: PropTypes.object.isRequired,
    projectName: PropTypes.string.isRequired,
    update: PropTypes.func.isRequired
};


function fixedSizeStack(_stackLimit=10) {
    const _stack = [];

    function length() {
        return _stack.length;
    }

    function push(any) {
        _stack.push(any);
        if (_stack.length > _stackLimit) {
            _stack.shift();
        }
    }

    function pop() {
        return _stack.pop();
    }

    function log(prefix) {
        logging.info(`${prefix} ${_stack.join('\n')}`);
    }
    return { push, pop, length, log };
}