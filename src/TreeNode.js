import React from 'react';
import { object, string, func, bool } from 'prop-types';
import TreeText from './TreeText';
import { connect } from 'react-redux';
import { childrenForParentId, isCollapsed } from './orm/selector/eventSelectors';
import './TreeNode.css';
class TreeNode extends React.Component {
    constructor(props) {
        super(props);


        this.handleClick = this.handleClick.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.tryChildCollapse = this.tryChildCollapse.bind(this);
        this.tryCollapse = this.tryCollapse.bind(this);
        this.tryExpand = this.tryExpand.bind(this);
        this.tryChildExpand = this.tryChildExpand.bind(this);
        this.nodeClicked = this.nodeClicked.bind(this);
        this.childrenTryCollapses = [];
        this.childrenTryExpands = [];
        this.onValueChange = this.onValueChange.bind(this);
    }


    nodeClicked(e, node) {
        if (this.props.onClick) {
            this.props.onClick(node);
        }
        this.toggleCollapse();
    }

    toggleCollapse() {
        this.props.dispatch({
            type: 'toggleCollapse_novel_event',
            toggleCollapse: {
                _id: this.props.data._id
            }
        })
    }

    handleClick() {
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
                type: 'expand_novel_event',
                expand: {
                    _id: this.props.data._id
                }
            })
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
                    type: 'collapse_novel_event',
                    collapse: {
                        _id: this.props.data._id
                    }
                })
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
    onValueChange(newValue) {
        const {
            dispatch,
            data: { _id }
        } = this.props;
        dispatch({
            type: 'UPDATE_NOVEL_EVENT',
            update: {
                _id,
                changes: {
                    title: newValue
                }
            }
        });
    }
    render() {
        let that = this;
        const { nodeClicked, onValueChange } = this;
        that.childrenTryCollapses = []; //remove previous tryCollapse pointers
        that.childrenTryExpands = [];
        let {
            nextSequence,
            label,
            useIcons,
            onClick,
            childrenData,
            data,
            value,
            collapsed
        } = this.props;

        let arrowClassName = 'tree-view_arrow';
        let containerClassName = 'tree-view_children';
        if (collapsed) {
            arrowClassName += ' tree-view_arrow-collapsed';
            containerClassName += ' tree-view_children-collapsed';
        }

        const Arrow = <div className={arrowClassName} onClick={this.handleClick} />;
        let iconClass = getIconClass(data);
        const getChildCollapseFunctions = function(connectedChild) {
            if (connectedChild === null) return; // ignore detach of ref
            const child = connectedChild.getWrappedInstance();
            that.childrenTryCollapses.push(child.tryCollapse);
            that.childrenTryExpands.push(child.tryExpand);
        };
        return (
            <div id={'tvi'+data._id} className={'tree-view-item'} onWheel={this.handleWheel}>
                <div className='tree-view-item-top' >
                    {childrenData && !!childrenData.length && Arrow}
                    {(!childrenData || !childrenData.length) && <span className="tree-view_spacer" />}
                    {useIcons && <span className={'tree-node-icon ' + iconClass} />}
                    <div title={label} className={'tree-view-text'}>
                        <TreeText
                            _id={data._id}
                            value={value}
                            onValueChange={onValueChange}
                            nextSequence={nextSequence /* Saves a nasty lookup later*/ }
                        />
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
    return {
        childrenData,
        collapsed
    };
}
const TreeNodeConnected = connect(mapStateToProps, null, null, {withRef:true})(TreeNode);
export default TreeNodeConnected;

function getIconClass() {
    return 'list-icon';
}
