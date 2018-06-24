import React from 'react';
import { connect } from 'react-redux';
import { getModelRef } from './orm/selector/modelSelectors';
import { makeChildOfPreviousSibling, addChild, makeSiblingOfParent, mergeWithPreviousSibling, moveToPrevious, moveToNext, focus } from './actions/modelActions';

import './treeText.css';
class TreeText extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.addSibling = this.addSibling.bind(this);
        this.focusIfNecessary = this.focusIfNecessary.bind(this);
        this.removeSelectionFromState = this.removeSelectionFromState.bind(this);
    }

    componentDidMount() {
        this.focusIfNecessary();
    }
    componentDidUpdate() {
        this.focusIfNecessary();
    }
    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    removeSelectionFromState() {
        this.props.dispatch({
            type: 'UPDATE_NOVEL_MODEL',
            update: {
                _id: this.props._id,
                changes: {
                    ui: {
                        ...this.props.model.ui,
                        selectionStart: undefined,
                        selectionEnd: undefined
                    }
                }
            }
        });
    }

    focusIfNecessary() {
        let {model: {ui: {selectionStart, selectionEnd}}} = this.props;
        if (typeof selectionStart !== 'undefined') {
            this.inputRef.focus();
            if (typeof selectionEnd === 'undefined') {
                selectionEnd = selectionStart;
            }
            this.inputRef.setSelectionRange(selectionStart, selectionEnd);
            this.removeSelectionFromState()
        }
    }

    onChange(e) {
        this.props.onValueChange(e.target.value);
    }
    onFocus(e) {
        this.props.dispatch(focus(this.props.model));
    }

    onKeyDown(e) {
        switch (e.keyCode) {
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
                }
                e.preventDefault();
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

    onKeyPress(e) {
        const { addSibling } = this;
        const offset = e.target.selectionStart;
        switch (e.charCode) {
            case 13: // Enter
                setImmediate(function() { // setImmediate is necessary.  Event must finish before dispatch.
                    addSibling(offset);
                });
                e.preventDefault();
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

    onSelect(e) {}

    render() {
        const { onChange, onKeyPress, onKeyDown, onFocus } = this;
        return (
            <input
                ref={input => {
                    this.inputRef = input;
                }}
                id={this.props.id}
                type="textbox"
                className="tree-text"
                value={this.props.model.title}
                onKeyPress={onKeyPress}
                onKeyDown={onKeyDown}
                onChange={onChange}
                onFocus={onFocus}
            />
        );
    }
}

function mapStateToProps(state, props) {
    const {_id} = props;
    const model = getModelRef(state, _id);
    const id = 'text' + _id;


    return { id, model };
}

export default connect(
    mapStateToProps,
    null,
    null,
    { withRef: true }
)(TreeText);
