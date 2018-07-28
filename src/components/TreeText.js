import React from 'react';
import { connect } from 'react-redux';
import { getModelRef } from '../orm/selector/modelSelectors';
import { makeChildOfPreviousSibling, addChild, makeSiblingOfParent, mergeWithPreviousSibling, moveToPrevious, moveToNext, focus } from '../actions/modelActions';
import {get} from 'lodash';
import EditableShell from './EditableShell';

import './treeText.css';
class TreeText extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.addSibling = this.addSibling.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.focusIfNecessary = this.focusIfNecessary.bind(this);
    }

    componentDidMount() {
        this.focusIfNecessary();
    }
    componentDidUpdate() {
        this.focusIfNecessary();
    }

    focusIfNecessary() {
        if (!this.inputRef) return;
        let {isSelected, model: {ui: {selectionStart, selectionEnd}}} = this.props;
        if (isSelected &&  document.activeElement !== this.inputRef.domElementRef) {
            this.inputRef.focus();
            if (typeof selectionStart !== 'undefined') {
                selectionEnd = selectionEnd || selectionStart;
                this.inputRef.setSelectionRange(selectionStart, selectionEnd);
            }
        }
    }

    onChange(e) {
        this.props.onValueChange(e.target.value);
    }

    onKeyDown(e) {
        switch (e.keyCode) {
            case 13: // Enter
                const { addSibling } = this;
                const offset = e.target.selectionStart;
                setImmediate(function() { // setImmediate is necessary.  Event must finish before dispatch.
                    addSibling(offset);
                });
                e.preventDefault();
            case 38: { // Arrow up
                let {model, dispatch} = this.props;
                dispatch(moveToPrevious(model));
                e.preventDefault();
                break;
            }
            case 40: { // Arrow down
                let {model, dispatch} = this.props;
                dispatch(moveToNext(model));
                e.preventDefault();
                break;
            }
            case 8: // Backspace
                if (e.target.selectionStart === 0) {
                    let {model, dispatch} = this.props;
                    dispatch(mergeWithPreviousSibling(model));
                    e.preventDefault();
                }
                break;
            case 9: // Tab
                let {_id, model, dispatch} = this.props;
                // Save model values because they are unavailable later.
                const { selectionStart, selectionEnd } = e.target;
                const shiftKeyOn = e.shiftKey;
                setImmediate(() => { // setImmediate is necessary.  Event must finish before dispatch.
                    if (shiftKeyOn) {
                        dispatch(makeSiblingOfParent(model, selectionStart, selectionEnd));
                    } else {
                        dispatch(makeChildOfPreviousSibling(_id, selectionStart, selectionEnd));
                    }
                });
                e.preventDefault();
                break;
            default:
                break;
        }
    }


    addSibling(cursorPosition) {
        const {value, model, nextSequence, onValueChange, dispatch} = this.props;
        const newValue = value.substr(0, cursorPosition);
        const siblingValue = value.substr(cursorPosition);
        onValueChange(newValue);
        dispatch(addChild(model, siblingValue, nextSequence, model.type));
    }

    onFocus(e) {
        this.props.dispatch(focus(e.target.value));
    }

    render() {
        const { onChange, onKeyDown, onFocus } = this;
        return <EditableShell
                    ref={input => {
                        this.inputRef = input;
                    }}
                    id={this.props.id}
                    type="textbox"
                    className="tree-text"
                    model={this.props.model}
                    onKeyDown={onKeyDown}
                    onChange={onChange}
                    onFocus={onFocus}
                />;
    }
}

function mapStateToProps(state, props) {
    const {_id} = props;
    const model = getModelRef(state, _id);
    const id = 'text' + _id;
    const selectedId = get(state, 'project_model.selectedId');
    const isSelected = (selectedId === _id);


    return { id, model, isSelected };
}

export default connect(
    mapStateToProps,
    null,
    null,
    { withRef: true }
)(TreeText);
