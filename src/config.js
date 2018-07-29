const config = {
    defaultModelType: 'event',
    dataTypes:[
        {title:'chapter', prettyName:'Chapter', view: 'FullTextView'},
        {title:'event', prettyName:'Event', view: 'EventView'},
        {title:'summary', prettyName: 'Summary', view: 'FullTextView'}
    ],
    googleClientId:'1022071479227-5vtgjfkt5dcvg1ltpenug70s52g4eqef.apps.googleusercontent.com',
    googleScope: 'https://www.googleapis.com/auth/drive'
};

export default config;