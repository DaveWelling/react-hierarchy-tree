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
export default function PrintButton({editor, icon}) {
    /**
     * When a mark button is clicked, toggle the current mark.
     *
     * @param {Event} event
     * @param {String} type
     */
    function onClickPrint(event) {
        event.preventDefault();
        printDiv('slateEditor', 'Curator');
    }

    const isActive = editor;

    return (
        <Button active={isActive} onMouseDown={event => onClickPrint(event)}>
            <Icon>{icon}</Icon>
        </Button>
    );
}

PrintButton.propTypes = {
    editor: PropTypes.object,
    'editor.value': PropTypes.object,
    type: PropTypes.string,
    icon: PropTypes.string
};

function printDiv(divId, title) {
    let mywindow = window.open('', 'PRINT', 'height=650,width=900,top=100,left=150');

    mywindow.document.write(`<html><head><title>${title}</title>`);
    mywindow.document.write('</head><body >');
    mywindow.document.write(document.getElementById(divId).innerHTML);
    mywindow.document.write('</body></html>');

    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10*/

    mywindow.print();
    //mywindow.close();

    return true;
  }