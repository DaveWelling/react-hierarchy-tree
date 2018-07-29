import React from 'react';
import { connect } from 'react-redux';
import './toolbar.css';
import { toast } from 'react-toastify';
import { get } from 'lodash';
import { persistor } from '../store';
import { saveGoogleDriveFile, openGoogleDriveFile, getAllJsonInFolder } from '../googleDrive';
import { clearState } from '../actions/globalActions';
import FileSelector from './FileSelector';

class Toolbar extends React.Component {
    constructor(props) {
        super(props);
        this.download = this.download.bind(this);
        this.upload = this.upload.bind(this);
        this.clear = this.clear.bind(this);
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
        const { dispatch } = this.props;
        let file = e.target.files[0];

        let reader = new FileReader();
        reader.onload = function(e) {
            let ormData = JSON.parse(e.target.result);
            persistor.purge();
            dispatch({
                type: 'import_app',
                import: { data: ormData }
            });
        };
        reader.onerror = function(e) {
            toast(e.message || e);
        };
        if (file) {
            reader.readAsText(file);
        }
    }
    download() {
        const exportData = {
            orm: this.props.ormData,
            rootModelId: this.props.rootModelId,
            projectName: this.props.projectName
        };
        let blob = new Blob([JSON.stringify(exportData, null, 4)], { type: 'text/plain;charset=utf-8' });
        let a = document.createElement('a');
        let url = URL.createObjectURL(blob);
        a.href = url;
        a.download = this.props.projectName + '.json';
        document.body.appendChild(a);
        a.click();
        /* istanbul ignore next */
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
    clear() {
        this.props.dispatch(clearState());
    }
    save() {
        const exportData = {
            orm: this.props.ormData,
            rootModelId: this.props.rootModelId,
            projectName: this.props.projectName
        };
        saveGoogleDriveFile(exportData, this.props.projectName);
    }
    open() {
        getAllJsonInFolder().then(files => {
            this.setState({
                files
            });
        });
    }
    openFile(fileName) {
        this.setState({files: undefined}); // remove files to close dialog
        return openGoogleDriveFile(fileName).then(data => {
            persistor.purge();
            this.props.dispatch({
                type: 'import_app',
                import: { data }
            });
        });
    }
    cancelOpen() {
        // remove files to close dialog
        this.setState({files: undefined});
    }
    render() {
        const { download, upload, clear, save, open, openFile, cancelOpen } = this;
        const { files } = this.state;
        return (
            <div className="toolbar">
                <button title="Download" className="toolbar-button" onClick={download}>
                    <i className="material-icons">cloud_download</i>
                </button>
                <input
                    className="toolbar-button"
                    type="file"
                    id="fileElem"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={upload}
                />
                <button title="Upload" id="visibleFileElem" className="toolbar-button">
                    <i className="material-icons">cloud_upload</i>
                </button>
                <button title="Clear" className="toolbar-button" onClick={clear}>
                    <i className="material-icons">clear</i>
                </button>
                <button title="Save to Google Drive" className="toolbar-button" onClick={save}>
                    <i className="material-icons">save_alt</i>
                </button>
                <button title="Open from Google Drive" className="toolbar-button" onClick={open}>
                    <i className="material-icons">open_in_browser</i>
                </button>
                <FileSelector files={files} selectFile={openFile} cancelFileSelection={cancelOpen}/>
            </div>
        );
    }
}

function mapStateToProps(state, ownProps) {
    const ormData = state.orm;
    const rootModelId = get(state, 'project_model.rootModelId');
    const projectName = get(state, 'project_model.name');
    return { ormData, rootModelId, projectName };
}

export default connect(mapStateToProps)(Toolbar);
