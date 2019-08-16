import React from 'react';
import ReactDOM from 'react-dom';
import propTypes from 'prop-types';
import escapeHTML from 'escape-html';

let getSelection, setSelection;
// Implement editablecontent to return the necessary methods and properties
// for TreeText
export default class EditableShell extends React.Component {
    constructor(props) {
        super(props);
        this.focus = this.focus.bind(this);
        this.setSelectionRange = this.setSelectionRange.bind(this);
        this.onInput = this.onInput.bind(this);
        this.onPaste = this.onPaste.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.selection = {
            selectionStart: 0,
            selectionEnd: 0
        }
    }

    shouldComponentUpdate(nextProps) {
        var el = ReactDOM.findDOMNode(this);
        if (nextProps.model.title !== el.innerHTML) {
            return true;
        }
        return false;
    }

    componentWillReceiveProps(nextProps) {
        if (this.contentIsEmpty(nextProps.model.title) && this.props.model.title !== nextProps.model.title) {
            this.props.onChange({
                target: {
                    value: ''
                }
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // dangerouslySetInnerHTML removes existing selections.
        // They must be restored in here
        if (this.domElementRef && this.selection) {
            setSelection(this.domElementRef, this.selection);
        }
    }

    contentIsEmpty(content) {
        if (!content) {
            return true;
        }

        if (content === '<br />') {
            return true;
        }

        if (!content.trim().length) {
            return true;
        }

        return false;
    }

    focus() {
        if (!this.domElementRef) return;
        this.domElementRef.focus();
    }

    setSelectionRange(selectionStart, selectionEnd) {
        if (!this.domElementRef) return;
        this.selection = {selectionStart, selectionEnd};
        setSelection(this.domElementRef, {selectionStart, selectionEnd});
    }

    onInput(e) {
        this._supportsInput = true;
        var text = e.target.textContent.trim();
        this.selection= getSelection(this.domElementRef);
        if (!text && text !== this.props.model.title) {
            this.props.onChange({
                target: {
                    value: ''
                }
            });
            return;
        }
        const newValue = escapeHTML(e.target.textContent);
        if (newValue !== this.props.model.title) {
            this.props.onChange({
                target: {
                    value: newValue
                }
            });
        }
    }

    onKeyDown(e){
        this.selection= getSelection(this.domElementRef);
        e.target.selectionStart = this.selection.selectionStart;
        e.target.selectionEnd = this.selection.selectionEnd;
        this.props.onKeyDown(e);
    }

    onMouseUp(){
        this.selection= getSelection(this.domElementRef);
    }

    onKeyUp(e){
        // dangerouslySetInnerHTML removes existing selections.
        // They must be restored in componentDidUpdate
        this.selection= getSelection(this.domElementRef);
    }

    _replaceCurrentSelection(data) {
        var selection = window.getSelection();
        var range = selection.getRangeAt(0);
        range.deleteContents();
        var fragment = range.createContextualFragment('');
        fragment.textContent = data;
        var replacementEnd = fragment.lastChild;
        range.insertNode(fragment);
        // Set cursor at the end of the replaced content, just like browsers do.
        range.setStartAfter(replacementEnd);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    onPaste(e) {
        // handle paste manually to ensure we unset our placeholder
        e.preventDefault();
        var data = e.clipboardData.getData('text/plain');
        this._replaceCurrentSelection(data);
        var target = ReactDOM.findDOMNode(this);
        const newValue = escapeHTML(target.textContent);
        if (newValue !== this.props.model.title) {
            this.props.onChange({
                target: { value: newValue}
            });
        }
    }

    onFocus(e){
        this.selection = getSelection(this.domElementRef);
        this.props.onFocus({
            target: {
                value: this.props.model,
                selectionStart: this.selection.selectionStart,
                selectionEnd: this.selection.selectionEnd
            }
        });
    }

    render() {
        const { onInput, onPaste, onKeyDown, onKeyUp, onMouseUp, onFocus } = this;
        const { model: {title}, className } = this.props;
        const winningClassName = className || 'editable-text';

        return (
            <div
                className={winningClassName}
                ref={e => {
                    // Avoid (irrelevant) react warnings for contenteditable
                    // by setting the contentEditable property here.
                    if (e != null) {
                        e.contentEditable = true;
                        this.domElementRef = e;
                    }
                }}
                onInput={onInput}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
                onPaste={onPaste}
                onClick={onFocus}
                onMouseUp={onMouseUp}
                dangerouslySetInnerHTML={{
                    __html: title
                }}
            />
        );
    }
}

EditableShell.propTypes = {
    onKeyDown: propTypes.func,
    onChange: propTypes.func,
    onFocus: propTypes.func,
    model: propTypes.object,
    className: propTypes.string
};



if (window.getSelection && document.createRange) {
    getSelection = function(containerEl) {
        let winSelection = window.getSelection();
        if (winSelection.length){
            var range = window.getSelection().getRangeAt(0);
            var preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(containerEl);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            var start = preSelectionRange.toString().length;

            return {
                selectionStart: start,
                selectionEnd: start + range.toString().length
            };
        } if  (winSelection.type && winSelection.type === 'Caret') {
            return {
                selectionStart: winSelection.anchorOffset,
                selectionEnd: winSelection.focusOffset
            };
        } else {
            return {
                selectionStart: 0, selectionEnd: 0
            };
        }
    };

    setSelection = function(containerEl, savedSel) {
        var charIndex = 0, range = document.createRange();
        range.setStart(containerEl, 0);
        range.collapse(true);
        var nodeStack = [containerEl], node, foundStart = false, stop = false;

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType == 3) {
                var nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSel.selectionStart >= charIndex && savedSel.selectionStart <= nextCharIndex) {
                    range.setStart(node, savedSel.selectionStart - charIndex);
                    foundStart = true;
                }
                if (foundStart && savedSel.selectionEnd >= charIndex && savedSel.selectionEnd <= nextCharIndex) {
                    range.setEnd(node, savedSel.selectionEnd - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
} else if (document.selection && document.body.createTextRange) {
    getSelection = function(containerEl) {
        var selectedTextRange = document.selection.createRange();
        var preSelectionTextRange = document.body.createTextRange();
        preSelectionTextRange.moveToElementText(containerEl);
        preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
        var start = preSelectionTextRange.text.length;

        return {
            selectionStart: start,
            selectionEnd: start + selectedTextRange.text.length
        }
    };

    setSelection = function(containerEl, savedSel) {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(containerEl);
        textRange.collapse(true);
        textRange.moveEnd("character", savedSel.selectionEnd);
        textRange.moveStart("character", savedSel.selectionStart);
        textRange.select();
    };
}
