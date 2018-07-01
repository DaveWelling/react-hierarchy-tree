import cuid from 'cuid';
const config = {
    defaultModelType: 'event',
    dataTypes:[
        {title:'chapter', prettyName:'Chapter'},
        {title:'event', prettyName:'Event'},
        {title:'summary', prettyName: 'Summary'}
    ],
    googleClientId:'1022071479227-5vtgjfkt5dcvg1ltpenug70s52g4eqef.apps.googleusercontent.com',
    googleScope: 'https://www.googleapis.com/auth/drive'
};

export default config;