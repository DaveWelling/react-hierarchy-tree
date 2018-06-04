import React from 'react';
import './treeText.css';
class TreeText extends React.Component {
    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.addSibling = this.addSibling.bind(this);
        this.state = {
            value: props.value
        }
    }
    onChange(e) {
        this.setState({
            value: e.target.value
        });
    }
    onKeyDown(e) {
        const {makeChildOfPreviousSibling} = this.props;
        switch(e.keyCode){
            case 9: // Tab
                setImmediate(makeChildOfPreviousSibling);
                e.preventDefault();
            default:
                break;
        }
    }
    onKeyPress(e){
        const {addSibling} = this;
        const offset = e.target.selectionStart;
        switch (e.charCode) {
            case 13: // Enter
                setImmediate(function(){addSibling(offset);});
                e.preventDefault();
            default:
                break;
        }
    }
    addSibling(cursorPosition){
        const newValue = this.state.value.substr(0, cursorPosition);
        const siblingValue = this.state.value.substr(cursorPosition);
        this.setState({
            value: newValue
        });
        this.props.addSibling(siblingValue);
    }
    render() {
        const {onChange, onKeyPress, onKeyDown} = this;
        return <input type='textbox' className='tree-text' value={this.state.value} onKeyPress={onKeyPress} onKeyDown={onKeyDown} onChange={onChange}/>;
    }
}

export default TreeText;