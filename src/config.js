const config = {
    defaultCollectionName: 'treenode',
    defaultModelType: 'event',
    dataTypes:[
        {title:'chapter', prettyName:'Chapter', view: 'FullTextView'},
        {title:'event', prettyName:'Event', view: 'EventView'},
        {title:'summary', prettyName: 'Summary', view: 'FullTextView'},
        {title:'drawing', prettyName: 'Drawing', view: 'DrawingView'},
        {title:'dumbList', prettyName: 'Dumb List', view: 'DumbList'},
        {title:'reactiveList', prettyName: 'Reactive List', view: 'ReactiveList'}
    ],
    googleClientId:'1022071479227-5vtgjfkt5dcvg1ltpenug70s52g4eqef.apps.googleusercontent.com',
    googleScope: 'https://www.googleapis.com/auth/drive',
    googleAppId: '1022071479227'
};

module.exports = config;