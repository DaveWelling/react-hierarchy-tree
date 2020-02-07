import React from 'react';
import PropTypes from 'prop-types';
import {
    makeChildOfPreviousSibling,
    addChild,
    valueChange,
    makeSiblingOfParent,
    mergeWithPreviousSibling,
    moveFocusToPrevious,
    moveToNext,
    focus
} from '../actions/modelActions';
import EditableShell from './EditableShell';
import { subscribe } from '../eventSink';

import './treeText.css';

export default class TreeText extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.addSibling = this.addSibling.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.focusIfNecessary = this.focusIfNecessary.bind(this);
        this.unsubscribe = subscribe('focus_project_model', this.focusIfNecessary);
    }

    componentWillUnmount() {
        if (this.unsubscribe) this.unsubscribe();
    }

    focusIfNecessary(actionData) {
        setImmediate(()=>{
            if (!this.inputRef) return;
            if (actionData._id === this.props.model._id && document.activeElement !== this.inputRef.domElementRef) {
                this.inputRef.focus();
                let { selectionStart, selectionEnd } = actionData;
                if (typeof selectionStart !== 'undefined') {
                    selectionEnd = selectionEnd || selectionStart;
                    this.inputRef.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        });
    }

    onChange(e) {
        valueChange(this.props.model._id, 'title', e.target.value);
    }

    onKeyDown(e) {
        switch (e.keyCode) {
            case 13: {
                // Enter
                const { addSibling } = this;
                const offset = e.target.selectionStart;
                setImmediate(function() {
                    // setImmediate is necessary.  Event must finish before dispatch.
                    addSibling(offset);
                });
                e.preventDefault();
                break;
            }
            case 38: {
                // Arrow up
                let { model } = this.props;
                moveFocusToPrevious(model);
                e.preventDefault();
                break;
            }
            case 40: {
                // Arrow down
                let { model } = this.props;
                moveToNext(model);
                e.preventDefault();
                break;
            }
            case 8: // Backspace
                if (e.target.selectionStart === 0) {
                    let { model } = this.props;
                    mergeWithPreviousSibling(model);
                    e.preventDefault();
                }
                break;
            case 9: {
                // Tab
                let { _id, model } = this.props;
                // Save model values because they are unavailable later.
                const { selectionStart, selectionEnd } = e.target;
                const shiftKeyOn = e.shiftKey;
                setImmediate(() => {
                    // setImmediate is necessary.  Event must finish before dispatch.
                    if (shiftKeyOn) {
                        makeSiblingOfParent(model, selectionStart, selectionEnd);
                    } else {
                        makeChildOfPreviousSibling(_id, selectionStart, selectionEnd);
                    }
                });
                e.preventDefault();
                break;
            }
            default:
                break;
        }
    }

    addSibling(cursorPosition) {
        const { value, model, nextSequence } = this.props;
        const newValue = value.substr(0, cursorPosition);
        const siblingValue = value.substr(cursorPosition).trim();
        valueChange(model._id, 'title', newValue);
        addChild(model, siblingValue, nextSequence, model.type);
    }

    onFocus(e) {
        focus(e.target.value);
    }

    render() {
        const { onChange, onKeyDown, onFocus } = this;
        return (
            <EditableShell
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
            />
        );
    }
}
TreeText.propTypes = {
    model: PropTypes.object
};