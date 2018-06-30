import React from 'react';
import { connect } from 'react-redux';
import './toolbar.css';
import { toast } from 'react-toastify';
import config from '../config';

class Toolbar extends React.Component {
    constructor(props) {
        super(props);
        this.download = this.download.bind(this);
        this.upload = this.upload.bind(this);
    }

    componentDidMount(){
        // Load button uses a Button instead of the file input so that it can link can be styled properly.
        // Handle the Load (for workspace) link:
        let visibleButton = document.getElementById('visibleFileElem'),
            fileInputButton = document.getElementById('fileElem');

        visibleButton.addEventListener('click', function (e) {
            if (fileInputButton) {
                fileInputButton.click();
            }
            e.preventDefault(); // prevent navigation to "#"
        }, false);
    }
    upload(e) {
        const {dispatch} = this.props;
        let file = e.target.files[0];

        let reader = new FileReader();
        reader.onload = function (e) {
            let ormData = JSON.parse(e.target.result);
            dispatch({
                type: 'IMPORT_NOVEL',
                import: {data: ormData}
            });
        };
        reader.onerror = function (e) {
            toast(e.message || e);
        };
        if (file) {
            reader.readAsText(file);
        }
    }
    download() {
        const exportData = {
            orm: this.props.ormData,
            rootModelId: config.rootModelId
        };
        let blob = new Blob([JSON.stringify(exportData, null, 4)], { type: 'text/plain;charset=utf-8' });
        let a = document.createElement('a');
        let url = URL.createObjectURL(blob);
        a.href = url;
        a.download = 'novel.json';
        document.body.appendChild(a);
        a.click();
        /* istanbul ignore next */
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
    clickFileInput() {

    }
    render() {
        const { download, upload, clickFileInput } = this;
        return (
            <div className="toolbar">
                <button className="toolbar-button" onClick={download}>
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
                <button id="visibleFileElem" className="toolbar-button" >
                    <i className="material-icons">cloud_upload</i>
                </button>
            </div>
        );
    }
}

function mapStateToProps(state, ownProps) {
    let ormData = state.orm;
    return { ormData };
}

export default connect(mapStateToProps)(Toolbar);
