import React from 'react';
import ReactModal from 'react-modal';
import './fileSelector.css';

export default class FileSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.highlight = this.highlight.bind(this);
    }
    highlight(selectedFile) {
        this.setState({selectedFile});
    }
    render() {
        const {highlight} = this;
        const {selectedFile} = this.state;
        const { files, selectFile, cancelFileSelection } = this.props;
        return (
            <ReactModal className="toolbarModal" ariaHideApp={false} isOpen={!!files}>
                <h2 style={{margin: '.5em'}}> Select a file </h2>
                <div className="modalFileList">
                    {files &&
                        files.map(file => {
                            let className = selectedFile === file ? 'modalFileHighlighted modalFile' : 'modalFile';
                            return (
                                <div onClick={() => highlight(file)}
                                    className={className}
                                    key={file.id}>
                                    {file.thumbnailLink && <img src={file.thumbnailLink}/>}
                                    <span className="fileText">{file.title}</span>
                                </div>
                            );
                        })}
                    {files && files.length === 0 && <h1>No files found</h1>}
                </div>
                <div className="modalButtons">
                    <button className="modalButton" onClick={cancelFileSelection}>
                        Cancel
                    </button>
                    <button
                        className="modalButton"
                        onClick={() => selectFile(this.state.selectedFile)}
                    >
                        Select
                    </button>
                </div>
            </ReactModal>
        );
    }
}
