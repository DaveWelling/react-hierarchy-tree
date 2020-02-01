/* eslint react/no-multi-comp: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from './copiedEmotionComponents';
/**
 * Render a mark-toggling toolbar button.
 *
 * @param {String} type
 * @param {String} icon
 * @return {Element}
 */
export default function MarkButton({editor, type, icon}) {
    /**
     * Check if the current selection has a mark with `type` in it.
     *
     * @return {Boolean}
     */
    function hasMark() {
        const { value } = editor;
        return value.activeMarks.some(mark => mark.type === type);
    }

    /**
     * When a mark button is clicked, toggle the current mark.
     *
     * @param {Event} event
     * @param {String} type
     */
    function onClickMark(event, type) {
        event.preventDefault();
        editor.toggleMark(type);
    }

    const isActive = editor && hasMark();

    return (
        <Button active={isActive} onMouseDown={event => onClickMark(event, type)}>
            <Icon>{icon}</Icon>
        </Button>
    );
}

MarkButton.propTypes = {
    editor: PropTypes.object,
    'editor.value': PropTypes.object,
    type: PropTypes.string,
    icon: PropTypes.string
};