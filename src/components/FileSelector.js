import React from 'react';
import ReactModal from 'react-modal';

export default class FileSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.highlight = this.highlight.bind(this);
    }
    highlight(selectedFileName) {
        this.setState({selectedFileName});
    }
    render() {
        const {highlight} = this;
        const {selectedFileName} = this.state;
        const { files, selectFile, cancelFileSelection } = this.props;
        return (
            <ReactModal className="toolbarModal" ariaHideApp={false} isOpen={!!files}>
                <h2 style={{margin: '.5em'}}> Select a file </h2>
                <div className="modalFileList">
                    {files &&
                        files.map(file => {
                            let className = selectedFileName === file.title ? 'modalFileHighlighted modalFile' : 'modalFile';
                            return (
                                <div onClick={() => highlight(file.title)}
                                    className={className}
                                    key={file.id}>
                                    {file.title}
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
                        onClick={() => selectFile(this.state.selectedFileName)}
                    >
                        Select
                    </button>
                </div>
            </ReactModal>
        );
    }
}
