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
        this.fileSelected = this.fileSelected.bind(this);
        this.remove = this.remove.bind(this);
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
    fileSelected(){
        const {selectedFile} = this.state;
        this.setState({newImage: undefined, selectedFile: undefined});
        this.props.selectFile(selectedFile);
    }
    remove(file) {
        this.props.removeFile(file);
    }

    render() {
        const { highlight, fileSelected, remove } = this;
        const { selectedFile, newImage } = this.state;
        const { files, cancelFileSelection } = this.props;
        const showImage = newImage;
        const showImagePlaceholder = !newImage;
        return (
            <ReactModal className="toolbarModal" ariaHideApp={false} isOpen={!!files}>
                <h2 style={{ margin: '.5em' }}> Select a file </h2>
                <div className="modalFileList">
                    <div onClick={() => highlight(newImage)} className={(selectedFile && selectedFile === newImage) ? 'modalFileHighlighted dropFile' : 'dropFile'} >
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
                    {files &&
                        files.map(file => {
                            let className = selectedFile === file ? 'modalFile modalFileHighlighted' : 'modalFile';
                            return (
                                <div  key={file.id} className="fileRow">
                                    <div className="rowBackground">
                                        <div onClick={() => highlight(file)} className={className}>
                                            {file.thumbnailLink && <img src={file.thumbnailLink} />}
                                            <span className="fileText">{file.title}</span>
                                        </div>
                                        <span className="removeButton" type="button" onClick={()=>remove(file)} text="Delete this file" >
                                            <i className="material-icons">delete</i>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    {files && files.length === 0 && <h1>No files found</h1>}
                </div>
                <div className="modalButtons">
                    <button className="modalButton" onClick={cancelFileSelection}>
                        Cancel
                    </button>
                    <button className="modalButton" onClick={() => fileSelected()}>
                        Select
                    </button>
                </div>
            </ReactModal>
        );
    }
}
