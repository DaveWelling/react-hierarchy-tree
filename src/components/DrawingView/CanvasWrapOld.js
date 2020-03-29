import React from 'react';
//import { fabric } from 'fabric';
import { throttle } from 'lodash';
import { getImageUrl } from '../../googleDrive';
import { toast } from 'react-toastify';
import {subscribe} from '../../eventSink';
import * as logging from '../../logging';
// import {debug} from 'util';

const fabric = {}; // to avoid compiler errors while in transition
export default class CanvasWrap extends React.Component {
    constructor(props) {
        super(props);
        this.onResize = this.onResize.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onChange = throttle(this.onChange, 1000);
        this.loadBackgroundImageFromGoogleFile = this.loadBackgroundImageFromGoogleFile.bind(this);
        this.loadBackgroundImageFromDataUrl = this.loadBackgroundImageFromDataUrl.bind(this);
    }

    componentDidMount() {
        const originalCanvas = document.querySelector(`#drawingView_${this.props.id}`);
        const parentElement = originalCanvas.parentElement;
        const { canvasSettings, backgroundImage } = this.props;
        const canvas = (this.canvas = new fabric.Canvas(originalCanvas, {
            isDrawingMode: canvasSettings.mode === 'draw'
        }));
        if (backgroundImage) {
            this.loadBackgroundImageFromGoogleFile(backgroundImage);
        } else {
            if (canvas.backgroundImage) {
                canvas.setBackgroundImage(undefined);
            }
        }
        canvas.freeDrawingBrush.width = parseInt(canvasSettings.width, 10) || 1;
        canvas.freeDrawingBrush.color = canvasSettings.color;
        canvas.on('object:modified', this.onChange);
        canvas.on('object:removed', this.onChange);
        canvas.on('object:added', this.onChange);
        canvas.on('mouse:down:before', function(opt) {
            const evt = opt.e;
            if (evt.shiftKey) {
                this.isDrawingMode = false;
            }
        });
        canvas.on('mouse:down', function(opt) {
            var evt = opt.e;
            if (evt.shiftKey === true) {
                this.isDragging = true;
                this.selection = false;
                this.lastPosX = evt.clientX;
                this.lastPosY = evt.clientY;
            }
        });
        canvas.on('mouse:move', function(opt) {
            if (this.isDragging) {
                var e = opt.e;
                this.viewportTransform[4] += e.clientX - this.lastPosX;
                this.viewportTransform[5] += e.clientY - this.lastPosY;
                this.requestRenderAll();
                this.lastPosX = e.clientX;
                this.lastPosY = e.clientY;
            }
        });
        canvas.on('mouse:up', function(opt) {
            this.isDrawingMode = canvasSettings.mode === 'draw';
            this.isDragging = false;
            this.selection = true;
        });
        canvas.on('mouse:wheel', function(opt) {
            var delta = opt.e.deltaY;
            var pointer = canvas.getPointer(opt.e);
            var zoom = canvas.getZoom();
            zoom = zoom + delta / 500;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
        try {
        const resizeObserver = (this.resizeObserver = new window.ResizeObserver(event => this.onResize(event)));
        resizeObserver.observe(parentElement);
        this.onResize([{ target: parentElement }]); // Set the initial size to match parent interior;
        } catch (err) {
            console.error(err.message);
        }

        if (this.props.drawing) {
            canvas.loadFromJSON(this.props.drawing);
        }
        this.splitUnsubscribe = subscribe('drag_split_end', action=>{
            canvas.setWidth(action.rightSize * (action.sizes[1]/100));
        });
    }

    componentDidUpdate(prevProps) {
        const { drawing, canvasSettings, backgroundImage, id, undoId } = this.props;
        Object.keys(canvasSettings).forEach(key => {
            if (prevProps.canvasSettings[key] !== canvasSettings[key]) {
                switch (key) {
                    case 'weight':
                        this.canvas.freeDrawingBrush.width = parseInt(canvasSettings[key], 10) || 1;
                        break;
                    case 'mode':
                        this.canvas.isDrawingMode = canvasSettings[key] === 'draw';
                        break;
                    case 'color':
                        this.canvas.freeDrawingBrush.color = canvasSettings[key];
                        break;
                    default:
                        break;
                }
            }
        });

        if (drawing === undefined) {
            this.canvas.clear();
        }
        if (prevProps.id !== id || prevProps.undoId !== undoId) {
            if (drawing !== undefined) {
                this.suspendChangeReporting = true;
                this.canvas.loadFromJSON(drawing);
                this.suspendChangeReporting = false;
            }
        }

        if (!backgroundImage) {
            if (this.canvas.backgroundImage) {
                this.canvas.setBackgroundImage(undefined,this.canvas.renderAll.bind(this.canvas));
            }
        } else if (!prevProps.backgroundImage || backgroundImage.id !== prevProps.backgroundImage.id){
            this.loadBackgroundImageFromGoogleFile(backgroundImage);
        }
    }

    componentWillUnmount() {
        this.canvas.dispose();
        this.canvas.disposed = true;
        this.resizeObserver.disconnect();
        this.splitUnsubscribe();

    }

    loadBackgroundImageFromGoogleFile(imageFile) {
        const { canvas, loadBackgroundImageFromDataUrl } = this;

        getImageUrl(imageFile.id)
            .then(dataUrl => {
                if (canvas.disposed) return; // in case callback returns after unmount
                loadBackgroundImageFromDataUrl(dataUrl);
            })
            .catch(err => {
                toast('An error occurred while getting the file from google drive.');
                logging.error(err.stack || err.message || JSON.stringify(err, null, 3));
            });
    }
    loadBackgroundImageFromDataUrl(dataUrl){
        const { canvas } = this;
        const that = this;
        fabric.Image.fromURL(dataUrl, function(img) {
            const iWidth = img.width;
            const iHeight = img.height;
            const cWidth = canvas.width;
            const cHeight = canvas.height;
            if (cWidth * iHeight > iWidth * cHeight) {
                img.scaleToHeight(cHeight);
            } else {
                img.scaleToWidth(cWidth);
            }
            that.suspendChangeReporting = true;
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                excludeFromExport: true,
                // Needed to position backgroundImage at 0/0
                originX: 'left',
                originY: 'top'
            });
            that.suspendChangeReporting = false;
        });
    }

    onResize(e) {
        if (e.length > 1) throw new Error('Invalid resize event parameters on CanvasWrap');
        const rect = e[0].target.getBoundingClientRect();
        this.canvas.setWidth(rect.width);
        this.canvas.setHeight(rect.height - 44);
        this.canvas.calcOffset();
    }

    onChange() {
        if (this.suspendChangeReporting) return;
        if (this.props.undoId) return;
        this.props.onChange({ drawing: this.canvas.toObject() });
    }

    render() {
        return <canvas id={'drawingView_' + this.props.id} />;
    }
}
