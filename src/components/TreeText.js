import React from 'react';
import PropTypes from 'prop-types';
import {
    makeChildOfPreviousSibling,
    addSibling,
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
import TreeViewContext from './TreeViewContext';

export default class TreeText extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.focusIfNecessary = this.focusIfNecessary.bind(this);
        this.unsubscribe = subscribe('focus_project_model', this.focusIfNecessary);
    }

    componentWillUnmount() {
        if (this.unsubscribe) this.unsubscribe();
    }

    focusIfNecessary(actionData) {
        setImmediate(() => {
            //if (actionData.model.sequence > 0) debugger;
            //console.debug('inputRef exists: ', !!this.inputRef);
            if (!this.inputRef) return;
            //console.debug('actionData: ', JSON.stringify(actionData, undefined, 3));
            if (actionData._id === this.props.model._id && document.activeElement !== this.inputRef.domElementRef) {
                this.inputRef.focus();
                // setImmediate(()=>{
                //     if (document.activeElement !== this.inputRef.domElementRef) {
                //         this.inputRef.focus();
                //     }
                // });
                let { selectionStart, selectionEnd } = actionData;
                if (typeof selectionStart !== 'undefined') {
                    selectionEnd = selectionEnd || selectionStart;
                    this.inputRef.setSelectionRange(selectionStart, selectionEnd);
                }
                this.context.setActiveTreeTextId(this.props._id);
                // I can't figure out why the up arrow doesn't (completely) work the first time
                // The down arrow does and it is pretty much the same code.
                this.focusIfNecessary(actionData);
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
                const { model } = this.props;
                const offset = e.target.selectionStart;
                setImmediate(function() {
                    // setImmediate is necessary.  Key event must finish before dispatch.
                    addSibling(model, offset);
                });
                e.preventDefault();
                break;
            }
            case 38: {
                // Arrow up
                let { model, tryCollapse } = this.props;
                if (e.ctrlKey) {
                    tryCollapse();
                } else {
                    moveFocusToPrevious(model);
                }
                e.preventDefault();
                break;
            }
            case 40: {
                // Arrow down
                let { model, tryExpand } = this.props;
                if (e.ctrlKey) {
                    tryExpand();
                } else {
                    moveToNext(model);
                }
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

    onFocus(e) {
        this.context.setActiveTreeTextId(this.props._id);
        focus(e.target.value, e.target.selectionStart, e.target.selectionEnd);
    }

    render() {
        const {
            onChange,
            onKeyDown,
            onFocus,
            context: { activeTreeTextId },
            props: { _id, model }
        } = this;
        let className = activeTreeTextId === _id ? 'tree-text tree-text-focused' : 'tree-text';
        return (
            <EditableShell
                ref={input => {
                    this.inputRef = input;
                }}
                id={_id}
                type="textbox"
                className={className}
                model={model}
                onKeyDown={onKeyDown}
                onChange={onChange}
                onFocus={onFocus}
                placeholder="Enter a node name"
            />
        );
    }
}
TreeText.propTypes = {
    model: PropTypes.object,
    value: PropTypes.string,
    _id: PropTypes.string
};

TreeText.contextType = TreeViewContext;
