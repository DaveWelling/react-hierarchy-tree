import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './drawingView.css';
import { getAllPicturesInFolder, saveNewImage, getImageUrl } from '../../googleDrive';
import FileSelector from '../FileSelector';
import CanvasWrap from './CanvasWrap';
import logging from '../../logging';
import useUndo from '../useUndo';
import { toast } from 'react-toastify';

export default function DrawingView({ subModel, projectName, update }) {
    const [canvasSettings, setCanvasSettings] = useState({
        weight: 1,
        mode: 'draw',
        color: '#ffffff'
    });
    // Default drawingModel with undefined drawing
    const [drawingModel, setDrawingModel] = useState({ content: {}, ...subModel });
    const [backgroundImage, setBackgroundImage] = useState();
    // picture file listing
    const [files, setFiles] = useState();
    const [
        drawingState,
        { set: setDrawing, reset: resetDrawing, undo: undoDrawing, redo: redoDrawing, canUndo, canRedo }
    ] = useUndo(subModel.content.drawing);

    useEffect(()=>{
        if (drawingModel.content.backgroundImage) {
            openFile(drawingModel.content.backgroundImage);
        }
    }, [drawingModel.content.backgroundImage]);

    /**
     * Fires when a database change is necessary.
     * @param {string} drawing JSON string
     * @param {boolean} bumpVersion true will tell the CanvasWrap to override contents
     */
    function onChange(drawing, bumpVersion = false, updateUndoStack = true) {
        const oldSubModel = drawingModel;
        const version = oldSubModel.content.version || 0;
        removeRasters(drawing);
        const newSubModel = {
            ...oldSubModel,
            content: {
                ...oldSubModel.content,
                drawing,
                version: bumpVersion ? version + 1 : version
            }
        };
        if (updateUndoStack) {
            setDrawing(drawing);
        }
        setDrawingModel(newSubModel);
        update(newSubModel);
    }

    function removeRasters(drawing) {
        const layer = drawing[0][1];
        for (let i = layer.children.length - 1; i >= 0 ; i--) {
            const child = layer.children[i];
            if (child[0] === 'Raster') {
                layer.children.splice(i, 1);
            }
        }
    }

    function onClear() {
        onChange({
            drawing: undefined
        }, true);
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
        function saveId(fileId) {
            update({...drawingModel, content: {...drawingModel.content, backgroundImage: fileId}});
        }

        function loadFromId(fileId) {
            return getImageUrl(fileId)
            .then(setBackgroundImage)
            .catch(err => {
                toast('An error occurred while getting the file from google drive.');
                logging.error(err.stack || err.message || JSON.stringify(err, null, 3));
            });
        }

        setFiles(undefined); // remove files to close dialog

        if (typeof file === 'string') {
            return loadFromId(file);
        } else {
            if (file) {
                if (file instanceof Blob) {
                    return saveNewImage(file, projectName).then(googleFile => {
                        saveId(googleFile.id);
                        loadFromId(googleFile.id);
                    });
                } else {
                    saveId(file.id);
                    return loadFromId(file.id);
                }
            }
        }
    }

    function cancelOpen() {
        // remove files to close dialog
        setFiles(undefined);
    }

    function onUndo() {
        if (canUndo) {
            undoDrawing();
            onChange(drawingState.past[drawingState.past.length - 1], true, false);
        }
    }

    function onRedo() {
        if (canRedo) {
            redoDrawing();
            onChange(drawingState.future[0], true, false);
        }
    }

    return (
        <div id="canvasContainer" className="fullHeight drawingView">
            <CanvasWrap
                id={drawingModel._id}
                version={drawingModel.content.version || 0}
                onChange={onChange}
                backgroundImage={backgroundImage}
                canvasSettings={canvasSettings}
                drawing={drawingModel.content.drawing}
            />
            <div className="canvasToolbar">
                <button className="canvasButton" onClick={onClear}>
                    <i className="material-icons">delete</i>
                </button>
                <button className="canvasButton" onClick={setBackground}>
                    <i className="material-icons">add_photo_alternate</i>
                </button>
                <button className="canvasButton" disabled={!canUndo} onClick={onUndo}>
                    <i className="material-icons">undo</i>
                </button>
                <button className="canvasButton" disabled={!canRedo} onClick={onRedo}>
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
            </div>
        </div>
    );
}

DrawingView.propTypes = {
    subModel: PropTypes.object.isRequired,
    projectName: PropTypes.string.isRequired,
    update: PropTypes.func.isRequired
};
