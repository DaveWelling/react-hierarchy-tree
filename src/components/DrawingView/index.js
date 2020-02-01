import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './drawingView.css';
import { getAllPicturesInFolder, saveNewImage } from '../../googleDrive';
import FileSelector from '../FileSelector';
import CanvasWrap from './CanvasWrap';
import * as logging from '../../logging';
import { getRepository } from '../../database';
import cuid from 'cuid';

export default function DrawingView({ model, projectName }) {
    const [loading, setLoading] = useState('true');
    const [canvasSettings, setCanvasSettings] = useState({
        weight: 1,
        mode: 'draw',
        color: '#ffffff'
    });
    // Default drawingModel with undefined drawing
    const [drawingModel, setDrawingModel] = useState({
        _id: cuid(),
        modelId: model._id,
        drawing: undefined
    });
    // picture file listing
    const [files, setFiles] = useState();
    const canvasRef = useRef();

    useEffect(() => {
        loadStateForModel(model);
    }, [model]);

    function loadStateForModel(model) {
        getRepository(model.type).then(repository => {
            repository
                .find({ modelId: model._id })
                .then(drawingModels => {
                    if (drawingModels.length > 1)
                        throw new Error(`There are (somehow) two ${model.type} records for ${model.title}`);
                    if (drawingModels.length === 0) {
                        // None found - create default drawing model in database.
                        return repository.create(drawingModel).then(() => {
                            setDrawingModel(drawingModel);
                            setLoading(false);
                        });
                    } else {
                        let newDrawingModel = drawingModels[0];
                        setDrawingModel(newDrawingModel);
                        setLoading(false);
                    }
                })
                .catch(err => logging.error(err));
        });
    }

    function onChange(change) {
        let oldModel = drawingModel;
        let newModel = { ...oldModel, ...change };
        setDrawingModel(newModel);
        getRepository(model.type).then(repository => repository.update(newModel));
    }

    function onClear() {
        onChange({
            drawing: undefined
        });
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
            canvasSettings: {
                ...canvasSettings,
                [e.target.name]: value
            }
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

    if (loading) {
        return <h1>Loading...</h1>;
    }
    return (
        <div id="canvasContainer" className="fullHeight drawingView">
            <CanvasWrap
                id={drawingModel._id}
                ref={canvasRef}
                onChange={onChange}
                backgroundImage={drawingModel.backgroundImage}
                canvasSettings={canvasSettings}
                drawing={drawingModel.drawing}
            />
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
    model: PropTypes.object.isRequired,
    projectName: PropTypes.string.isRequired
};
