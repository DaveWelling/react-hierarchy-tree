import './App.css';
import './TreeNode.css';
import React, { Component } from 'react';
import TreeView from './TreeView';
import EditView from './EditView';
import Split from 'split.js';


const id = 'app';
class App extends Component {
    componentDidMount() {
        this.split = Split(['#splitLeft-' + id, '#splitRight-' + id], {
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
            }
        });
    }
    render() {

        return (
            <div className="App">
              <div id={'splitLeft-'+id} className="fullHeight leftSplit">
                <TreeView />
              </div>
              <div id={'splitRight-'+id} className="fullHeight">
                <EditView />
              </div>
            </div>
        );
    }
}

export default App;
