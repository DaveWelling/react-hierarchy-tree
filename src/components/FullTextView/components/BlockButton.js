/* eslint react/no-multi-comp: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from './copiedEmotionComponents';
/**
 * Define the default node type.
 *
 * @type {String}
 */
const DEFAULT_NODE = 'paragraph';
/**
 * Render a block-toggling toolbar button.
 *
 * @param {object} editor
 * @param {String} type
 * @param {String} icon
 * @return {Element}
 */
export default function BlockButton({editor, type, icon}) {
    /**
     * Check if the any of the currently selected blocks are of `type`.
     * @param {String} type
     * @return {Boolean}
     */
    function hasBlock() {
        const { value } = editor;
        return value.blocks.some(node => node.type === type);
    }

    /**
     * When a block button is clicked, toggle the block type.
     * @param {Event} event
     * @param {String} type
     */
    function onClickBlock(event, type) {
        event.preventDefault();

        const { value } = editor;
        const { document } = value;

        // Handle everything but list buttons.
        if (type !== 'bulleted-list' && type !== 'numbered-list') {
            const isActive = hasBlock(type);
            const isList = hasBlock('list-item');

            if (isList) {
                editor
                    .setBlocks(isActive ? DEFAULT_NODE : type)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            } else {
                editor.setBlocks(isActive ? DEFAULT_NODE : type);
            }
        } else {
            // Handle the extra wrapping required for list buttons.
            const isList = hasBlock('list-item');
            const isType = value.blocks.some(block => {
                return !!document.getClosest(block.key, parent => parent.type === type);
            });

            if (isList && isType) {
                editor
                    .setBlocks(DEFAULT_NODE)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            } else if (isList) {
                editor.unwrapBlock(type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list').wrapBlock(type);
            } else {
                editor.setBlocks('list-item').wrapBlock(type);
            }
        }
    }

    let isActive = editor && hasBlock();

    if (editor && ['numbered-list', 'bulleted-list'].includes(type)) {
        const {
            value: { document, blocks }
        } = editor;

        if (blocks.size > 0) {
            const parent = document.getParent(blocks.first().key);
            isActive = hasBlock('list-item') && parent && parent.type === type;
        }
    }

    return (
        <Button active={isActive} onMouseDown={event => onClickBlock(event, type)}>
            <Icon>{icon}</Icon>
        </Button>
    );
}

BlockButton.propTypes = {
    editor: PropTypes.object,
    'editor.value': PropTypes.object,
    type: PropTypes.string,
    icon: PropTypes.string
};

