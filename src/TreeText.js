import React from 'react';
import {subscribe} from './eventSink';
import './treeText.css';
class TreeText extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.addSibling = this.addSibling.bind(this);
        this.focus = this.focus.bind(this);
    }


    componentDidMount(){
        const {focus, props:{id}} = this;
        subscribe('FOCUS_NOVEL_EVENT', function(payload){
            if (`text${payload._id}` === id) {
                focus();
            }
        });
    }

    focus(){
        this.inputRef.focus();
        this.inputRef.setSelectionRange(0,0);
    }
    onChange(e) {
        this.props.onValueChange(e.target.value);
    }
    onKeyDown(e) {
        const { makeChildOfPreviousSibling } = this.props;
        switch (e.keyCode) {
            case 9: // Tab
                setImmediate(makeChildOfPreviousSibling);
                e.preventDefault();
            default:
                break;
        }
    }
    onKeyPress(e) {
        const { addSibling } = this;
        const offset = e.target.selectionStart;
        switch (e.charCode) {
            case 13: // Enter
                setImmediate(function() {
                    addSibling(offset, true);
                });
                e.preventDefault();
            default:
                break;
        }
    }
    addSibling(cursorPosition) {
        const newValue = this.props.value.substr(0, cursorPosition);
        const siblingValue = this.props.value.substr(cursorPosition);
        this.props.onValueChange(newValue);
        this.props.addSibling(siblingValue, true);
    }
    render() {
        const { onChange, onKeyPress, onKeyDown } = this;
        return (
            <input
                ref={(input) => { this.inputRef = input; }}
                id={this.props.id}
                type="textbox"
                className="tree-text"
                value={this.props.value}
                onKeyPress={onKeyPress}
                onKeyDown={onKeyDown}
                onChange={onChange}
            />
        );
    }
}

export default TreeText;
