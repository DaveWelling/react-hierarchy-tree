import React from 'react';
import { object, string, func, bool } from 'prop-types';
import TreeText from './TreeText';
import { connect } from 'react-redux';
import { childrenForParentId, isCollapsed } from '../orm/selector/modelSelectors';
import './TreeNode.css';
import interact from 'interactjs';
import { get } from 'lodash';
import {makeNextSiblingOfModel, focus} from '../actions/modelActions';
import config from '../config';

class TreeNode extends React.Component {
    constructor(props) {
        super(props);

        this.handleArrowClick = this.handleArrowClick.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.tryChildCollapse = this.tryChildCollapse.bind(this);
        this.tryCollapse = this.tryCollapse.bind(this);
        this.tryExpand = this.tryExpand.bind(this);
        this.tryChildExpand = this.tryChildExpand.bind(this);
        this.childrenTryCollapses = [];
        this.childrenTryExpands = [];
        this.onTypeChange = this.onTypeChange.bind(this);
    }

    componentDidMount() {
        let that = this; // need to get fresh props;
        let { dispatch } = this.props;
        // target elements with the "draggable" class
        interact('#drag_' + this.props.data._id).draggable({
            dragDataId: this.props.data._id,
            manualStart: true,
            allowFrom: '.drag-handle',
            // enable inertial throwing
            inertia: true,
            // keep the element within the area of it's parent
            restrict: {
                restriction: document.querySelector('.TreeView'),
                endOnly: true,
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
            // enable autoScroll
            autoScroll: true,

            // call this function on every dragmove event
            onmove: this.dragMoveListener,
            // call this function on every dragend event
            onend: function() {
                dispatch({
                    type: 'drag_project_model_end',
                    drag: {
                        model: that.props.data
                    }
                });
            },
            onstart: function(e) {
                dispatch({
                    type: 'drag_project_model_start',
                    drag: {
                        model: that.props.data
                    }
                });
            }
        })
        .on('move', function (e) {
          var interaction = e.interaction;

          // if the pointer was moved while being held down
          // and an interaction hasn't started yet
          if (interaction.pointerIsDown && !interaction.interacting()) {
            let original = e.currentTarget;
            if (!e.srcElement.classList.contains('tree-node-grab')) return;
                // create a clone of the currentTarget element
            let clone = e.currentTarget.cloneNode(true);
            clone.id = 'imAClone';
            clone.classList.add('treeNodeClone');
            // insert the clone to the page
            document.body.appendChild(clone);
            clone.style.position = 'fixed';
            clone.style.left = (e.x - e.offsetX)+'px';
            clone.style.top = (e.y - e.offsetY)+'px';
            //console.log('start position: ', clone.id, ' x: ', clone.style.left, ' y: ', clone.style.top);

            // start a drag interaction targeting the clone
            interaction.start({ name: 'drag' },
                              e.interactable,
                              clone);
            e.interactable.on('dragend', ()=>clone.remove());
          }
        });

        interact('#dropZone_' + that.props.data._id).dropzone({
            // only accept elements matching this CSS selector
            accept: '.draggable',
            // Require a 75% element overlap for a drop to be possible
            overlap: 0.005,

            // listen for drop related events:

            // ondropactivate: function (event) {
            //   // add active dropzone feedback
            //   event.target.classList.add('drop-active');
            // },
            ondragenter: function (e) {
              // feedback the possibility of a drop
              let dropzoneElement = e.target;
              dropzoneElement.classList.add('can-drop');

            },
            ondragleave: function (e) {
              // remove the drop feedback style
              let dropzoneElement = e.target;
              dropzoneElement.classList.remove('can-drop');
            },
            ondrop: function (e) {
                let dropzoneElement = e.target;
                dropzoneElement.classList.remove('can-drop');
                let draggedModelId = e.draggable.target.split('_')[1];
                dispatch(makeNextSiblingOfModel(draggedModelId, that.props.data));
            }
            // ondropdeactivate: function (event) {
            //   // remove active dropzone feedback
            //   event.target.classList.remove('drop-active');
            //   event.target.classList.remove('drop-target');
            // }
          });
    }

    dragMoveListener(e) {
        let target = e.target,
            // keep the dragged position in the data-x/data-y attributes
            x = (parseFloat(target.getAttribute('data-x')) || 0) + e.dx,
            y = (parseFloat(target.getAttribute('data-y')) || 0) + e.dy;
        // translate the element
        //console.log('id: ', e.target.id, ' x: ', x, ' y: ', y);
        target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        // update the posiion attributes
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }

    nodeClicked(e, node) {
        if (this.props.onClick) {
            this.props.onClick(node);
        }
        this.toggleCollapse();
    }

    toggleCollapse() {
        this.props.dispatch({
            type: 'toggleCollapse_project_model',
            toggleCollapse: {
                _id: this.props.data._id
            }
        });
    }

    handleArrowClick() {
        this.toggleCollapse();
    }

    // React Synth event: https://developer.mozilla.org/en-US/docs/Web/Events/wheel
    handleWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            this.tryCollapse();
        } else if (e.deltaY > 0) {
            this.tryExpand();
        }
    }

    tryExpand() {
        // To expand, must be collapsed and have something (other than _meta) inside
        if (this.props.collapsed && Object.keys(this.props.childrenData).length > 1) {
            this.props.dispatch({
                type: 'expand_project_model',
                expand: {
                    _id: this.props.data._id
                }
            });
            return true;
        } else {
            return !!this.tryChildExpand();
        }
    }
    tryCollapse() {
        if (this.props.collapsed) {
            return false;
        } else {
            if (!this.tryChildCollapse()) {
                this.props.dispatch({
                    type: 'collapse_project_model',
                    collapse: {
                        _id: this.props.data._id
                    }
                });
            }
            return true;
        }
    }

    tryChildExpand() {
        for (let i = 0; i < this.childrenTryExpands.length; i++) {
            if (this.childrenTryExpands[i] && this.childrenTryExpands[i]()) {
                return true;
            }
        }
        return false;
    }
    tryChildCollapse() {
        for (let i = this.childrenTryCollapses.length - 1; i >= 0; i--) {
            if (this.childrenTryCollapses[i] && this.childrenTryCollapses[i]()) {
                return true;
            }
        }
        return false;
    }
    onTypeChange(newType) {
        const {
            dispatch,
            data: { _id }
        } = this.props;
        dispatch({
            type: 'update_project_model',
            update: {
                _id,
                changes: {
                    type: newType.target.value
                }
            }
        });
        dispatch(focus({
            ...this.props.data,
            type: newType.target.value
        }));
    }
    render() {
        let that = this;
        const { onTypeChange } = this;
        that.childrenTryCollapses = []; //remove previous tryCollapse pointers
        that.childrenTryExpands = [];
        let { nextSequence, label, useIcons, onClick, childrenData, data, value, collapsed, dragging } = this.props;
        const dropZoneClass = dragging && dragging._id !== data._id ? 'drop-zone-dragging' : 'drop-zone';
        let containerClassName = 'tree-view_children';
        if (collapsed) {
            containerClassName += ' tree-view_children-collapsed';
        }

        const ArrowRight = <div onClick={this.handleArrowClick} ><i className="material-icons tree-view_arrow">arrow_right</i></div>;
        const ArrowDown = <div onClick={this.handleArrowClick} ><i className="material-icons tree-view_arrow">arrow_drop_down</i></div>;
        let iconClass = getIconClass(data);
        const getChildCollapseFunctions = function(child) {
            if (child === null) return; // ignore detach of ref
            that.childrenTryCollapses.push(child.tryCollapse);
            that.childrenTryExpands.push(child.tryExpand);
        };
        return (
            <div
                id={'tvi' + data._id}
                className="tree-view-item"
                onClick={e => e.stopPropagation}
                onWheel={this.handleWheel}
            >
                <div id={'drag_' + data._id} className="tree-view-item-top draggable">
                    {childrenData && !!childrenData.length && collapsed && ArrowRight}
                    {childrenData && !!childrenData.length && !collapsed && ArrowDown}
                    {(!childrenData || !childrenData.length) && <span className="tree-view_spacer" />}
                    {useIcons && <span className={'tree-node-icon ' + iconClass} />}
                    <div className="drag-handle">
                        <i className="material-icons tree-node-grab">drag_indicator</i>
                    </div>
                    <div title={label} className="tree-view-text">
                        <TreeText
                            _id={data._id}
                            value={value}
                            nextSequence={nextSequence /* Saves a nasty lookup later*/}
                        />
                        <div className="select-container">
                            <select value={data.type} onChange={onTypeChange}>
                                {config.dataTypes.map(type=>{
                                    return <option key={type.title} value={type.title}>{type.prettyName}</option>
                                })}
                            </select>
                        </div>
                    </div>
                </div>
                <div className={containerClassName}>
                    {!collapsed &&
                        childrenData &&
                        childrenData.map((child, index) => {
                            // Saves a nasty lookup later
                            let nextSequence = childrenData[index + 1] ? childrenData[index + 1].sequence : undefined;
                            return (
                                <TreeNodeConnected
                                    key={child._id || child}
                                    name={child.title}
                                    label={child.prettyName || child.title}
                                    value={child.title}
                                    data={child}
                                    ref={getChildCollapseFunctions}
                                    useIcons={useIcons}
                                    onClick={onClick}
                                    nextSequence={nextSequence}
                                />
                            );
                        })}
                </div>
                <div id={'dropZone_' + data._id} className={dropZoneClass} />
            </div>
        );
    }
}

TreeNode.propTypes = {
    data: object,
    name: string,
    label: string,
    onClick: func,
    useIcons: bool
};

function mapStateToProps(state, ownProps) {
    // Get children of this node and sort by sequence property
    const childrenData = childrenForParentId(state, ownProps.data._id).sort((a, b) => a.sequence - b.sequence);
    const collapsed = isCollapsed(state, ownProps.data._id);
    const dragging = get(state, 'project_model.dragging', false);
    return {
        childrenData,
        collapsed,
        dragging
    };
}
const TreeNodeConnected = connect(
    mapStateToProps,
    null,
    null, {
        forwardRef: true
    }
)(TreeNode);
export default TreeNodeConnected;

function getIconClass() {
    return 'list-icon';
}
