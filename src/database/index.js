const RxDB = require('rxdb');
require('core-js/stable');
require('regenerator-runtime/runtime');
const Repository = require('./repository');

const config = require('../config');


let dbPromise = null;
const _create = async () => {

    const collections = [
        {
            name: 'chapter',
            schema: {
                title: 'chapterSchema',
                version: 0,
                type: 'object',
                properties: {
                    _id: {
                        type: 'string',
                        primary: true
                    },
                    text: {
                        type: 'object'
                    }
                },
                required: ['text']
            }
        }
    ];
    console.log('DatabaseService: creating database..');
    const db = await RxDB.create({ name: 'curator', adapter: 'idb' });
    console.log('DatabaseService: created database');
    window['db'] = db; // write to window for debugging

    // // show leadership in title
    // db.waitForLeadership().then(() => {
    //     console.log('isLeader now');
    //     document.title = '♛ ' + document.title;
    // });

    // create collections
    console.log('DatabaseService: create collections');
    await Promise.all(collections.map(colData => db.collection(colData)));

    // hooks
    // console.log('DatabaseService: add hooks');
    // db.collections.heroes.preInsert(docObj => {
    //     const { color } = docObj;
    //     return db.collections.heroes.findOne({color}).exec().then(has => {
    //         if (has != null) {
    //             alert('another hero already has the color ' + color);
    //             throw new Error('color already there');
    //         }
    //         return db;
    //     });
    // });

    return db;
};
const get = () => {
    if (!dbPromise) dbPromise = _create();
    return dbPromise;
};

module.exports = {
    getRepository,
    clear,
    get
};
RxDB.QueryChangeDetector.enableDebugging();

const defaultCollectionName = config.defaultCollectionName;
let adapter;
if (__TESTING__) {
    RxDB.plugin(require('pouchdb-adapter-memory'));
    adapter = 'memory';
} else {
    RxDB.plugin(require('pouchdb-adapter-idb'));
    adapter = 'idb';
}

const repositories = {};
function getRepository(collection=defaultCollectionName) {
    if (!repositories[collection]) {
        repositories[collection] = getCollection(collection).then(col=>{
            return new Repository(col);
        });
    }
    return repositories[collection];
}

const collections = {};
function getCollection(collectionName) {
    if (!collections[collectionName]) {
        collections[collectionName] = getDb().then(db=>{
            let schema = getSchema(collectionName);
            return db.collection({ name: collectionName, schema });
        });
    }
    return collections[collectionName];
}
async function clear(collectionName) {
    if (!repositories[collectionName]) return;
    const collection  = await collections[collectionName];
    await collection.remove();
    delete repositories[collectionName];
    delete collections[collectionName];
}

let db;
function getDb() {
    if (!db) {
        db = RxDB.create({ name: 'curator', adapter });
    }
    return db;
}

function createCollection(db, collection) {
    let schema = getSchema(collection);
    return db.collection({ name: collection, schema });
}

function getSchema(collectionName) {
    let schema = {
        title: `${collectionName}Schema`,
        version: 0,
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                primary: true
            }
        }
    };

    if (collectionName === 'test') {
        schema.properties['hi'] = {type: 'string'};
    }

    if (['test', defaultCollectionName].includes(collectionName)) {
        schema.properties['parentId'] = {type: 'string', index: true };
        schema.properties.sequence = {type: 'number'};
        schema.properties.type = {type: 'string'};
        schema.properties.value = {type: 'object'};
        schema.properties.title = {type: 'string'};
        schema.properties.ui = {
            type: 'object',
            properties: {
                collapsed: {
                    type: 'boolean'
                }
            }
        };
        schema.required = ['parentId', 'sequence'];
    }

    if (collectionName === defaultCollectionName) {
        schema.properties['text'] = { type: 'object'};
    }

    return schema;
}




