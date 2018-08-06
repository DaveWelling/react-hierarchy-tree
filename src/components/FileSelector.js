import React from 'react';
import ReactModal from 'react-modal';
import './fileSelector.css';
import Dropzone from 'react-dropzone';

export default class FileSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.highlight = this.highlight.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }
    highlight(selectedFile) {
        this.setState({ selectedFile });
    }
    handleDrop(acceptedFiles) {
        this.setState({
            newImage: acceptedFiles[0],
            selectedFile: acceptedFiles[0]
        });
    }

    render() {
        const { highlight } = this;
        const { selectedFile, image, newImage } = this.state;
        const { files, selectFile, cancelFileSelection } = this.props;
        const showImage = newImage;
        const showImagePlaceholder = !newImage;
        return (
            <ReactModal className="toolbarModal" ariaHideApp={false} isOpen={!!files}>
                <h2 style={{ margin: '.5em' }}> Select a file </h2>
                <div className="modalFileList">
                    {files &&
                        files.map(file => {
                            let className = selectedFile === file ? 'modalFileHighlighted modalFile' : 'modalFile';
                            return (
                                <div onClick={() => highlight(file)} className={className} key={file.id}>
                                    {file.thumbnailLink && <img src={file.thumbnailLink} />}
                                    <span className="fileText">{file.title}</span>
                                </div>
                            );
                        })}
                    {files && files.length === 0 && <h1>No files found</h1>}
                    <div onClick={() => highlight(newImage)} className={(selectedFile && selectedFile === newImage) ? 'modalFileHighlighted modalFile' : 'modalFile'} >
                        <Dropzone onDrop={this.handleDrop} multiple={false} className="imageComponent">
                            <img
                                id={'imgView'}
                                className={showImage ? 'imageHNode imageSize' : 'hiddenImage'}
                                src={newImage ? newImage.preview : undefined}
                            />
                            <div
                                id={'imgPlaceholder'}
                                className={showImagePlaceholder ? 'imageSize imagePreviewPlaceholder' : 'hiddenImage'}
                            >
                                <i className="material-icons">add_a_photo</i>
                                <span className="imageTitle">drop your file here or click for dialog.</span>
                            </div>
                        </Dropzone>
                        {newImage && <span className="fileText">{newImage.name}</span>}
                    </div>
                </div>
                <div className="modalButtons">
                    <button className="modalButton" onClick={cancelFileSelection}>
                        Cancel
                    </button>
                    <button className="modalButton" onClick={() => selectFile(this.state.selectedFile)}>
                        Select
                    </button>
                </div>
            </ReactModal>
        );
    }
}
