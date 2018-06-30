import cuid from 'cuid';
const config = {
    defaultModelType: 'event',
    dataTypes:[
        {title:'chapter', prettyName:'Chapter'},
        {title:'event', prettyName:'Event'},
        {title:'summary', prettyName: 'Summary'}
    ],
    rootModelId: cuid()
};

export default config;