import paper from 'paper/dist/paper-core';
import React, {useRef, useEffect, useState} from 'react';
import {debounce} from 'lodash';
import {subscribe} from '../../eventSink';

// TODO: consider https://www.npmjs.com/package/pinch-zoom-canvas
// TODO: hook up undo/redo
// TODO: Fill mode
// TODO: Background Image

export default function CanvasWrap({id, version, drawing, passThrough, onChange, canvasSettings, backgroundImage}) {
    const canvasRef = useRef();
    const path = useRef();
    const settings = useRef(canvasSettings);
    const isPaperSetup = useRef(false);
    settings.current = canvasSettings;
    if (settings.current.mode === 'fill') {
        throw new Error('not implemented');
    }

    /**
     * Save changes if there are no new ones for 1 second.
     */
    const change = debounce(function() {
        onChange(paper.project.exportJSON({asString: false}));
    }, 1000);

    /**
     * Zoom and re-centering
     * @param {MouseEvent} e
     */
    function mouseWheel(e) {
        if (e.shiftKey) {
            const delta = e.deltaY * -1;
            const {x,y} = e;
            const factor = delta / 500;
            let zoom = paper.view.zoom;
            let center = paper.view.center;
            let newCenter = new paper.Point(center.x + ((x - center.x) * factor), center.y + ((y - center.y) * factor));

            zoom = zoom + factor;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            paper.view.center = newCenter;
            paper.view.zoom = zoom;
            return false;
        }
    }

    /**
     * Mostly beginning a new stroke Path.
     * @param {MouseEvent} e
     */
    function onMouseDown(e) {
        // Remove previous path reference
        if (path.current) {
            path.current = undefined;
        }

        if (e.event.shiftKey) return;
        if (settings.current.mode === 'erase') return;
        if (passThrough) return;

        path.current = new paper.Path();
        //path.current.onMouseEnter = onMouseEnter;
        path.current.strokeColor = settings.current.color;
        path.current.strokeWidth = parseInt(settings.current.weight, 10) || 1;
        path.current.add(e.point);
    }

    /**
     * If holding shift key, move the view around.
     * If in erase mode, look for a collision and delete any strokes
     * the cursor hits.
     * Otherwise, add points to the current path
     * @param {MouseEvent} e
     */
    function onMouseDrag(e) {
        if (passThrough) return;
        if (e.event.shiftKey) {
            paper.view.translate(new paper.Point(e.event.movementX, e.event.movementY));
        } else {
            if (settings.current.mode === 'erase') {
                const hit = paper.project.hitTest(e.point, {stroke: true});
                if (hit) {
                    hit.item.remove();
                    change();
                }
            }
            if (path.current) path.current.add(e.point);
        }
    }

    /**
     * Finish drawing a path
     */
    function onMouseUp() {
        if (passThrough) return;
        if (settings.current.mode === 'erase') return;
        // Remove shakiness from path and simultaneously remove excess points
        // which is nice for reducing storage.
        path.current.simplify(1.5);
        change();
    }


    function onResize(e) {

    }

    function onSplitResize(action) {
        const {sizes: [, rightPct], leftSize, rightSize} = action;
        const newWidth = (leftSize+rightSize) * (rightPct/100);
        paper.view.viewSize = new paper.Size(newWidth, paper.view.size.height);
    }
    function onSplitResizeEnd(action) {
        const {rightSize} = action;
        if (paper.view.viewSize.width < rightSize) {
            paper.view.viewSize = new paper.Size(rightSize, paper.view.viewSize.height);
        }
    }

    /**
     * Connect paper.js to the canvas and add mouse events.
     */
    useEffect(()=>{
        const canvas = canvasRef.current;
        //install(window);
        paper.setup(canvas);
        if (drawing) {
            paper.project.importJSON(drawing);
        }
        if (backgroundImage) {
            const raster = new paper.Raster(backgroundImage);
            raster.on('load', ()=>{
                raster.fitBounds(paper.view.bounds);
            });
        }
        // Hook up all mouse events.
        const mouseEvents = new paper.Tool();
        mouseEvents.onMouseDown = onMouseDown;
        mouseEvents.onMouseDrag = onMouseDrag;
        mouseEvents.onMouseUp = onMouseUp;
        canvas.addEventListener('mousewheel', mouseWheel);
        paper.view.onResize = onResize;
        const unsubscribes = [];
        unsubscribes.push(subscribe('drag_split', onSplitResize));
        unsubscribes.push(subscribe('drag_split_end', onSplitResizeEnd));
        isPaperSetup.current = true;
        // Cleanup
        return ()=>{
            unsubscribes.forEach(unsubscribe=>unsubscribe());
            isPaperSetup.current = false;
            canvas.removeEventListener('mousewheel', mouseWheel);
            canvas.removeEventListener('resize', onResize);
            mouseEvents.onMouseDown = undefined;
            mouseEvents.onMouseDrag = undefined;
            mouseEvents.onMouseUp = undefined;
        };
    },[]);

    useEffect(()=>{
        if (isPaperSetup.current, drawing) {
            paper.project.clear();
            paper.project.importJSON(drawing);
        }
    },[id, version]);

    useEffect(()=>{
        if (backgroundImage) {
            const raster = new paper.Raster(backgroundImage);
            raster.on('load', ()=>{
                raster.fitBounds(paper.view.bounds);
            });
        }
    }, [backgroundImage]);


    return <canvas id="canvas" ref={canvasRef}/>;
}
