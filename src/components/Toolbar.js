import React from 'react';
import './toolbar.css';
import { toast } from 'react-toastify';
import { saveGoogleDriveFile, openGoogleDriveFile, getAllJsonInFolder } from '../googleDrive';
import FileSelector from './FileSelector';
import projectContext from '../projectContext';
import {serializeDatabase, loadDatabase} from '../database';
const log = require('../logging');

export default class Toolbar extends React.Component {
    constructor(props) {
        super(props);
        this.download = this.download.bind(this);
        this.upload = this.upload.bind(this);
        this.save = this.save.bind(this);
        this.open = this.open.bind(this);
        this.openFile = this.openFile.bind(this);
        this.cancelOpen = this.cancelOpen.bind(this);
        this.state = {};
    }

    componentDidMount() {
        // Load button uses a Button instead of the file input so that it can link can be styled properly.
        // Handle the Load (for workspace) link:
        let visibleButton = document.getElementById('visibleFileElem'),
            fileInputButton = document.getElementById('fileElem');

        visibleButton.addEventListener(
            'click',
            function(e) {
                if (fileInputButton) {
                    fileInputButton.click();
                }
                e.preventDefault(); // prevent navigation to "#"
            },
            false
        );
    }
    upload(e) {
        let file = e.target.files[0];

        let reader = new FileReader();
        reader.onload = function(e) {
            loadDatabase(e.target.result.data);
        };
        reader.onerror = function(e) {
            toast(e.message || e);
        };
        if (file) {
            reader.readAsText(file);
        }
    }
    download() {
        return serializeDatabase().then(data=>{
            const exportData = {
                data,
                projectName: this.context.projectName
            };
            let blob = new Blob([JSON.stringify(exportData, null, 4)], { type: 'text/plain;charset=utf-8' });
            let a = document.createElement('a');
            let url = URL.createObjectURL(blob);
            a.href = url;
            a.download = this.context.projectName + '.json';
            document.body.appendChild(a);
            a.click();
            /* istanbul ignore next */
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        });
    }
    save() {
        return serializeDatabase().then(data=>{
            const exportData = {
                data,
                projectName: this.context.projectName
            };
            saveGoogleDriveFile(exportData, this.context.projectName);
        });
    }
    open() {
        getAllJsonInFolder().then(files => {
            this.setState({
                files
            });
        });
    }
    openFile(file) {
        this.setState({files: undefined}); // remove files to close dialog
        return openGoogleDriveFile(file.title).then(driveFile => {
            return loadDatabase(driveFile.data);
        }).catch(err=>{
            log.error(err);
        });
    }
    cancelOpen() {
        // remove files to close dialog
        this.setState({files: undefined});
    }
    render() {
        const { download, upload, save, open, openFile, cancelOpen } = this;
        const { files } = this.state;
        return (
            <div className="toolbar">
                <button title="Download Project" className="toolbar-button" onClick={download}>
                    <i className="material-icons">save_alt</i>
                </button>
                <input
                    className="toolbar-button"
                    type="file"
                    id="fileElem"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={upload}
                />
                <button title="Upload Project" id="visibleFileElem" className="toolbar-button">
                    <i className="material-icons">open_in_browser</i>
                </button>
                <button title="Save to Google Drive" className="toolbar-button" onClick={save}>
                    <i className="material-icons">cloud_upload</i>
                </button>
                <button title="Open from Google Drive" className="toolbar-button" onClick={open}>
                    <i className="material-icons">cloud_download</i>
                </button>
                <FileSelector files={files} selectFile={openFile} cancelFileSelection={cancelOpen}/>
            </div>
        );
    }
}
Toolbar.contextType = projectContext;