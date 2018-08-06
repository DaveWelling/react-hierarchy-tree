import React from 'react';
import { fabric } from 'fabric';
import { throttle } from 'lodash';
import { getImageUrl } from '../../googleDrive';
import { toast } from 'react-toastify';
import {subscribe} from '../../store/eventSink';

export default class CanvasWrap extends React.Component {
    constructor(props) {
        super(props);
        this.onResize = this.onResize.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onChange = throttle(this.onChange, 1000);
        this.loadBackgroundImage = this.loadBackgroundImage.bind(this);
    }

    componentDidMount() {
        const originalCanvas = document.querySelector(`#drawingView_${this.props.id}`);
        const parentElement = originalCanvas.parentElement;
        const { canvasSettings, backgroundImage } = this.props;
        const canvas = (this.canvas = new fabric.Canvas(originalCanvas, {
            isDrawingMode: canvasSettings.mode === 'draw'
        }));
        if (backgroundImage) {
            this.loadBackgroundImage(backgroundImage);
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

        const resizeObserver = (this.resizeObserver = new ResizeObserver(event => this.onResize(event)));
        resizeObserver.observe(parentElement);
        this.onResize([{ target: parentElement }]); // Set the initial size to match parent interior;

        if (this.props.drawing) {
            canvas.loadFromJSON(this.props.drawing);
        }
        this.splitUnsubscribe = subscribe('drag_split_end', action=>{
            canvas.setWidth(action.rightSize * (action.sizes[1]/100));
        })
    }

    componentWillUnmount() {
        this.canvas.dispose();
        this.canvas.disposed = true;
        this.resizeObserver.disconnect();
        this.splitUnsubscribe();

    }

    componentDidUpdate(prevProps) {
        const { drawing, canvasSettings, backgroundImage } = this.props;
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
        if (prevProps.drawing !== drawing) {
            if (drawing === undefined) {
                this.canvas.clear();
            } else {
                this.canvas.loadFromJSON(drawing);
            }
        }
        if (backgroundImage) {
            this.loadBackgroundImage(backgroundImage);
        } else {
            if (this.canvas.backgroundImage) {
                this.canvas.setBackgroundImage(undefined,this.canvas.renderAll.bind(this.canvas));
            }
        }
    }
    loadBackgroundImage(imageFile) {
        const { canvas } = this;

        getImageUrl(imageFile.id)
            .then(dataUrl => {
                if (this.canvas.disposed) return; // in case callback returns after unmount
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
                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                        excludeFromExport: true,
                        // Needed to position backgroundImage at 0/0
                        originX: 'left',
                        originY: 'top'
                    });
                });
            })
            .catch(err => {
                toast('An error occurred while getting the file from google drive.');
                console.error(err.stack || err.message || JSON.stringify(err, null, 3));
            });
    }

    onResize(e) {
        if (e.length > 1) throw new Error('Invalid resize event parameters on CanvasWrap');
        const rect = e[0].target.getBoundingClientRect();
        this.canvas.setWidth(rect.width);
        this.canvas.setHeight(rect.height - 44);
        this.canvas.calcOffset();
    }

    onChange(e) {
        this.props.onChange(this.canvas.toObject());
    }

    render() {
        return <canvas id={'drawingView_' + this.props.id} />;
    }
}
