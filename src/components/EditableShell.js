import React from 'react';
import ReactDOM from 'react-dom';
import propTypes from 'prop-types';
import escapeHTML from 'escape-html';

let saveSelection, restoreSelection;
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
    }

    shouldComponentUpdate(nextProps) {
        var el = ReactDOM.findDOMNode(this);
        if (nextProps.value !== el.innerHTML) {
            return true;
        }
        return false;
    }

    componentWillReceiveProps(nextProps) {
        if (this.contentIsEmpty(nextProps.value) && this.props.value !== nextProps.value) {
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
            restoreSelection(this.domElementRef, this.selection);
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
        restoreSelection(this.domElementRef, {selectionStart, selectionEnd});
    }
    onInput(e) {
        this._supportsInput = true;
        var val = e.target.innerHTML;
        var text = e.target.textContent.trim();
        if (!text && text !== this.props.value) {
            this.props.onChange({
                target: {
                    value: ''
                }
            });
            return;
        }
        const newValue = escapeHTML(e.target.textContent);
        if (newValue !== this.props.value) {
            this.props.onChange({
                target: { value: newValue }
            });
        }
    }
    onKeyDown(e){
        const currentSelection= saveSelection(this.domElementRef);
        e.target.selectionStart = currentSelection.selectionStart;
        e.target.selectionEnd = currentSelection.selectionEnd;
        this.props.onKeyDown(e);
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
        if (newValue !== this.props.value) {
            this.props.onChange({
                target: { value: newValue }
            });
        }
    }
    render() {
        const { onInput, onPaste, onKeyDown } = this;
        const { value, className } = this.props;
        const winningClassName = className || 'editable-text';
        if (this.domElementRef) {
            // dangerouslySetInnerHTML removes existing selections.
            // They must be restored in componentDidUpdate
            this.selection = saveSelection(this.domElementRef);
        }
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
                onPaste={onPaste}
                dangerouslySetInnerHTML={{
                    __html: this.props.value
                }}
            />
        );
    }
}

EditableShell.propTypes = {
    onKeyDown: propTypes.func,
    onChange: propTypes.func,
    value: propTypes.string,
    className: propTypes.string
};



if (window.getSelection && document.createRange) {
    saveSelection = function(containerEl) {
        let winSelection = window.getSelection();
        if (winSelection.length) {
            var range = window.getSelection().getRangeAt(0);
            var preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(containerEl);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            var start = preSelectionRange.toString().length;

            return {
                selectionStart: start,
                selectionEnd: start + range.toString().length
            };
        } else {
            return {
                selectionStart: 0, selectionEnd: 0
            };
        }
    };

    restoreSelection = function(containerEl, savedSel) {
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
    saveSelection = function(containerEl) {
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

    restoreSelection = function(containerEl, savedSel) {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(containerEl);
        textRange.collapse(true);
        textRange.moveEnd("character", savedSel.selectionEnd);
        textRange.moveStart("character", savedSel.selectionStart);
        textRange.select();
    };
}
