import React from 'react';
import './editView.css';
import Quill from 'quill';
import {debounce} from 'lodash'
import './quill-editor.css';

const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],

    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction

    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],

    ['clean']                                         // remove formatting button
  ];

class FullTextView extends React.Component {
    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onChange = debounce(this.onChange, 1000);
    }
    componentDidMount(){
        const text = this.props.model ? this.props.model.text : undefined;
        const quill = this.quill = new Quill(`#fullTextView_${this.props.model._id}`, {
            modules: {
                history: {
                  delay: 2000,
                  maxStack: 500,
                  userOnly: true
                },
              },
            theme: 'snow'
        });
        quill.setContents(text, 'silent');
        const {onChange} = this;
        quill.on('text-change', function() {
            onChange(quill);
        });
    }
    componentDidUpdate(prevProps){
        const {text} = this.props.model;
        if (prevProps.model.text !== text) {
            this.quill.setContents(text);
        }
    }
    onChange(quill) {
        this.props.onChange({
            text: quill.getContents()
        })
    }
    render() {
        return <div className='fullHeight'>
            <div id={'fullTextView_' + this.props.model._id} />
        </div>
    }
}

export default FullTextView;