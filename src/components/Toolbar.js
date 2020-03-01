import React from 'react';
import './toolbar.css';
import { toast } from 'react-toastify';
import { saveGoogleDriveFile, openGoogleDriveFile, getAllJsonInFolder, removeGoogleDriveFile } from '../googleDrive';
import FileSelector from './FileSelector';
import projectContext from '../projectContext';
import {serializeDatabase, loadDatabase, purgeDatabase} from '../database';
const log = require('../logging');

export default class Toolbar extends React.Component {
    constructor(props) {
        super(props);
        this.download = this.download.bind(this);
        this.upload = this.upload.bind(this);
        this.save = this.save.bind(this);
        this.open = this.open.bind(this);
        this.openFile = this.openFile.bind(this);
        this.removeFile = this.removeFile.bind(this);
        this.cancelOpen = this.cancelOpen.bind(this);
        this.clearDatabase = this.clearDatabase.bind(this);
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
    removeFile(file) {
        const newFiles = [...this.state.files];
        const indexOfFile = newFiles.findIndex(f=>f.title === file.title);
        newFiles.splice(indexOfFile, 1);
        this.setState({files: newFiles});
        return removeGoogleDriveFile(file.title).catch(err=>log.error(err));
    }
    cancelOpen() {
        // remove files to close dialog
        this.setState({files: undefined});
    }
    clearDatabase() {
        purgeDatabase().then(()=>{
            log.info('Database cleared.');
        }).catch(err=>{
            log.error('Failed to clear the database.', err);
        });
    }
    render() {
        const { download, upload, save, open, openFile, removeFile, cancelOpen, clearDatabase } = this;
        const { files } = this.state;
        return (
            <div className="toolbar">
                <button title="Clear everything" className="toolbar-button" onClick={clearDatabase}>
                    <i className="material-icons clearButton">clear</i>
                </button>
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
                <FileSelector files={files} removeFile={removeFile} selectFile={openFile} cancelFileSelection={cancelOpen}/>
                <span className="appVersion">{__VERSION__}</span>
            </div>
        );
    }
}
Toolbar.contextType = projectContext;