import './App.css';
import './components/TreeNode.css';
import React, { Component } from 'react';
import TreeView from './components/TreeView';
import EditView from './components/EditView';
import Split from 'split.js';
import Toolbar from './components/Toolbar';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import {publish} from './eventSink';
import {throttle} from 'lodash';
import ProjectContext from './projectContext';

const id = 'app';
class App extends Component {
    constructor(props){
        super(props);
        this.throttledPublish = throttle(publish, 200);
        this.setProjectName = projectName =>{
            this.setState({projectName});
        };
        this.state = {
            projectName: '',
            setProjectName: this.setProjectName
        };
    }
    componentDidMount() {
        const {throttledPublish} = this;
        const leftSide = document.querySelector('#splitLeft-'+id);
        const rightSide = document.querySelector('#splitRight-'+id);
        const split = this.split = Split(['#splitLeft-' + id, '#splitRight-' + id], {
            sizes: [40, 60],
            elementStyle: function(dimension, size, gutterSize) {
                return {
                    'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'
                };
            },
            gutterStyle: function(dimension, gutterSize) {
                return {
                    'flex-basis': gutterSize + 'px'
                };
            },
            gutter: function(index, direction) {
                // Prevent duplicate gutters by finding if one has
                // already been created for this Layout
                const gutterId = 'gutter-' + id;
                let gutter = document.querySelector(`#${gutterId}`);
                if (!gutter) {
                    gutter = document.createElement('div');
                    gutter.id = gutterId;
                    gutter.className = `gutter gutter-${direction}`;
                }
                return gutter;
            },
            onDragEnd: (e=>throttledPublish({
                type: 'drag_split_end',
                drag: {
                    sizes: split.getSizes(),
                    leftSize: leftSide.clientWidth,
                    rightSize: rightSide.clientWidth
                }
            }))
        });
    }
    render() {
        return (
            <ProjectContext.Provider value={this.state} >
                <div className="App">
                <div id={'splitLeft-'+id} className="fullHeight leftSplit">
                    <div className="fullHeight innerLeftSplit">
                        <TreeView />
                        <Toolbar />
                    </div>
                </div>
                <div id={'splitRight-'+id} className="fullHeight">
                    <EditView />
                    <ToastContainer/>
                </div>
                </div>
            </ProjectContext.Provider>
        );
    }
}

export default App;
