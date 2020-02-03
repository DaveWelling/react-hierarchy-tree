const cuid = require('cuid');

module.exports = class Repository {
    constructor(collection) {
        this._privates = {
            collection,
            listenersById: {},
            listenersByParentId: {}
        };

        this.publishChange = this.publishChange.bind(this);

        collection.on('update', this.publishChange);
        collection.on('insert', this.publishChange);
    }

    onParentChange(parentId, callback) {
        const listeners = this._privates.listenersByParentId[parentId];
        if (listeners) {
            listeners.push(callback);
        } else {
            this._privates.listenersByParentId[parentId] = [callback];
        }
        // Return an unsubscribe function
        return ()=>{
            const listenersAtUnsubscribe = this._privates.listenersByParentId[parentId];
            const callbackIndex = listenersAtUnsubscribe.indexOf(callback);
            if (listenersAtUnsubscribe.length > 1 && callbackIndex >= 0) {
                listenersAtUnsubscribe.splice(callbackIndex, 1);
            } else {
                delete this._privates.listenersByParentId[parentId];
            }
        };
    }

    onChange(_id, callback) {
        const listeners = this._privates.listenersById[_id];
        if (listeners) {
            listeners.push(callback);
        } else {
            this._privates.listenersById[_id] = [callback];
        }
        // Return an unsubscribe function
        return ()=>{
            const listenersAtUnsubscribe = this._privates.listenersById[_id];
            const callbackIndex = listenersAtUnsubscribe.indexOf(callback);
            if (listenersAtUnsubscribe.length > 1 && callbackIndex >= 0) {
                listenersAtUnsubscribe.splice(callbackIndex, 1);
            } else {
                delete this._privates.listenersById[_id];
            }
        };
    }

    publishChange(model, oldModel){
        let cbs = this._privates.listenersById[model._id];
        if (cbs) cbs.forEach(cb=>cb(model));
        // parent has changed
        if (model.parentId && (!oldModel || (oldModel.parentId !==model.parentId))) {
            cbs = this._privates.listenersByParentId[model.parentId];
            if (cbs) cbs.forEach(cb=>cb(model, true));
            if (oldModel && oldModel.parentId) {
                cbs = this._privates.listenersByParentId[oldModel.parentId];
                if (cbs) cbs.forEach(cb=>cb(model, false));
            }
        }
    }

    /**
     * Update the model in the database
     * @param {any} _idOrModel This can either be an _id or the whole model to update
     * @param {string} propertyName If an id is passed to _idOrModel, then this is the property to update for that id
     * @param {any} value If an id is passed to _idOrModel, then this is the value to set the property to for that id
     */
    update(_idOrModel, propertyName, value, upsert=false) {
        return new Promise((resolve, reject)=>{
            try {
                let updateDoc, _id = _idOrModel;
                if (typeof _idOrModel === 'object') {
                    updateDoc = _idOrModel;
                    _id = _idOrModel._id;
                }
                let existingDoc = this._privates.collection.by('_id', _id);
                if (!existingDoc) {
                    if (!upsert) throw new Error('Cannot find a document with _id = ' + _id);
                    else return this.create(updateDoc ? updateDoc : {[propertyName]: value});
                }
                let newDoc;
                if (updateDoc) {
                    newDoc = {
                        ...existingDoc,
                        ...updateDoc
                    };
                } else {
                    newDoc = {
                        ...existingDoc,
                        [propertyName]: value
                    };
                }
                this._privates.collection.update(newDoc);
                resolve(newDoc);
            } catch (err) {
                reject(err);
            }
        });
    }
    create(data) {
        return new Promise((resolve, reject)=>{
            try {
                if (!data._id) {
                    data._id = cuid();
                }
                resolve(this._privates.collection.insert(data));
            } catch (err) {
                reject(err);
            }
        });
    }
    get(_id) {
        return new Promise((resolve, reject)=>{
            try {
                resolve(this._privates.collection.by('_id', _id));
            } catch (err) {
                reject(err);
            }
        });
    }
    find(query) {
        return new Promise((resolve, reject)=>{
            try {
                resolve(this._privates.collection.find(query));
            } catch (err) {
                reject(err);
            }
        });
    }
    remove(_id) {
        return this.get(_id).then(doc=>this._privates.collection.remove(doc));
    }
};
