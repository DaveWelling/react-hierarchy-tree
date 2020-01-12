const {set} = require('lodash');
const expect = require('expect');
const {spyOn, restoreSpies } = expect;
const {getRepository, clear} = require('../../src/database');
const modelActions = require('../../src/actions/modelActions');
const eventSink = require('../../src/store/eventSink');

describe('modelActions', function(){
    let repo;
    describe('getChildren', function(){
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a1',  hi: 'a1', parentId: 'a0', sequence: 0 });
            await repo.create({_id: 'a2', hi: 'a2', parentId: 'a0', sequence: 1 });
        });
        it('returns existing children', async function(){
            const result = await modelActions.getChildren('a0', 'test');
            expect(result.length).toEqual(2);
        });
    });
    describe('getPreviousSibling', function(){
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'b1',  hi: 'b1', parentId: 'b0', sequence: 0 });
            await repo.create({_id: 'b2', hi: 'b2', parentId: 'b0', sequence: 1 });
        });
        afterEach(async function(){
            await clear('test');
        });
        describe('a previous sibling exists', function(){
            it('gets the sibling', async function(){
                const result = await modelActions.getPreviousSibling('b2', 'test');
                expect(result._id).toEqual('b1');
            });
        });
        describe('a previous sibling DOES NOT exist', function(){
            it('returns undefined', async function(){
                const result = await modelActions.getPreviousSibling('b1', 'test');
                expect(result).toNotExist();
            });
        });
    });

    describe('getNextSibling', function(){
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'b1',  hi: 'b1', parentId: 'b0', sequence: 0 });
            await repo.create({_id: 'b2', hi: 'b2', parentId: 'b0', sequence: 1 });
        });
        afterEach(async function(){
            await clear('test');
        });
        describe('a next sibling exists', function(){
            it('gets the sibling', async function(){
                const result = await modelActions.getNextSibling('b1', 'test');
                expect(result._id).toEqual('b2');
            });
        });
        describe('a next sibling DOES NOT exist', function(){
            it('returns undefined', async function(){
                const result = await modelActions.getNextSibling('b2', 'test');
                expect(result).toNotExist();
            });
        });
    });
    describe('resequenceProjectModel', function(){
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'b1',  hi: 'b1', parentId: 'b0', sequence: 0 });
            await repo.create({_id: 'b2', hi: 'b2', parentId: 'b0', sequence: 1 });
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'b0', sequence: 0 });
        });
        afterEach(async function(){
            await clear('test');
        });
        describe('new entry has wrong sequence', function(){
            it('moves new entry to end sequence', async function(){
                await modelActions.resequenceProjectModel('b3', 'b0', 'end', 'test');
                const record = await repo.get('b3');
                expect(record.sequence).toEqual(2);
            });

        });

    });
    describe('ensureExpandedProjectModel', function(){

        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            await repo.create({_id: 'b1',  hi: 'b1', parentId: 'a0', sequence: 0 });
            await repo.create({_id: 'b2', hi: 'b2', parentId: 'a0', sequence: 1 });
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
            await repo.create({_id: 'c1', hi: 'c1', parentId: 'b3', sequence: 0 });
        });
        afterEach(async function(){
            await clear('test');
        });
        it('expands all parents of given record', async function(){
            await modelActions.ensureExpandedProjectModel('c1', 'test');
            let b3 = await repo.get('b3');
            let root = await repo.get('a0');
            expect(b3.ui.collapsed).toBe(false);
            expect(root.ui.collapsed).toBe(false);
        });
        describe('parentId is same as _id', function(){
            it('throws an error to prevent infinite loop', async function(){
                try {
                    await repo.create({_id: 'd1', hi: 'd1', parentId: 'd1', sequence: 0 });
                    await modelActions.ensureExpandedProjectModel('d1', 'test');
                    expect(1).toBe(2, 'Expected an error');
                } catch (error) {
                    expect(error.message).toInclude('has a parentId with the same value');
                }
            });
        });
    });
    describe('makeChildOfPreviousSibling', function(){
        describe('a previous sibling exists', function(){
            let publishSpy;
            beforeEach(async function(){
                // Add some children to get
                repo = await getRepository('test');
                await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
                await repo.create({_id: 'b1',  hi: 'b1', parentId: 'a0', sequence: 0 });
                await repo.create({_id: 'b2', hi: 'b2', parentId: 'a0', sequence: 1 });
                await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
                await repo.create({_id: 'c1', hi: 'c1', parentId: 'b3', sequence: 0 });
                publishSpy = spyOn(eventSink, 'publish');

                await modelActions.makeChildOfPreviousSibling('b3', 0, 0, 'test');
            });
            afterEach(async function(){
                restoreSpies();
                await clear('test');
            });
            it('previous sibling receives the record as a child', async function(){
                const movedRecord = await repo.get('b3');
                expect(movedRecord.parentId).toEqual('b2');
            });
            it('sets the sequence to the end of the previous siblings children', async function(){
                const movedRecord = await repo.get('b3');
                expect(movedRecord.sequence).toEqual(0);
            });
            it('requests the moved record to be focused', function(){
                expect(publishSpy).toHaveBeenCalled();
                let arg = publishSpy.calls[0].arguments[0];
                expect(arg.type).toEqual('focus_project_model');
            });
            describe('the previous sibling is collapsed', function(){
                it('expands the previous sibling', async function(){
                    const previousSibling = await repo.get('b2');
                    expect(previousSibling.ui.collapsed).toBe(false);
                });
            });
        });
    });
    describe('makeSiblingOfParent', function(){
        let publishSpy;
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            await repo.create({_id: 'b1',  hi: 'b1', parentId: 'a0', sequence: 0 });
            await repo.create({_id: 'b2', hi: 'b2', parentId: 'a0', sequence: 1 });
            const c1 = await repo.create({_id: 'c1', hi: 'c1', parentId: 'b2', sequence: 0 });
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
            publishSpy = spyOn(eventSink, 'publish');

            await modelActions.makeSiblingOfParent(c1, 0, 0, 'test');
        });
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        it('parent of current parent receives record as child', async function(){
            const record = await repo.get('c1');
            expect(record.parentId).toEqual('a0');
        });
        it('sets sequence to next after previous parent', async function(){
            const record = await repo.get('c1');
            expect(record.sequence).toEqual(1.5);
        });
        it('requests the moved record to be focused', function(){
            expect(publishSpy).toHaveBeenCalled();
            let arg = publishSpy.calls[0].arguments[0];
            expect(arg.type).toEqual('focus_project_model');
        });
    });
    describe('makeNextSiblingOfModel', function(){
        let publishSpy;
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            await repo.create({_id: 'b1',  hi: 'b1', parentId: 'a0', sequence: 0 });
            await repo.create({_id: 'b2', hi: 'b2', parentId: 'a0', sequence: 1 });
            const c1 = await repo.create({_id: 'c1', hi: 'c1', parentId: 'b2', sequence: 0 });
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
            publishSpy = spyOn(eventSink, 'publish');

            await modelActions.makeNextSiblingOfModel('b3', c1, 'test');
        });
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        it('parent of new sibling receives record as child', async function(){
            const record = await repo.get('b3');
            expect(record.parentId).toEqual('b2');
        });
        it('sets sequence to next after new sibling', async function(){
            const record = await repo.get('b3');
            expect(record.sequence).toEqual(1);
        });
        it('requests the moved record to be focused', function(){
            expect(publishSpy).toHaveBeenCalled();
            let arg = publishSpy.calls[0].arguments[0];
            expect(arg.type).toEqual('focus_project_model');
        });
    });
    describe('addChild', function(){
        let publishSpy, newChild, b1;
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            b1 = await repo.create({_id: 'b1',  hi: 'b1', parentId: 'a0', sequence: 0 });
            await repo.create({_id: 'b2', hi: 'b2', parentId: 'a0', sequence: 1 });
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
            publishSpy = spyOn(eventSink, 'publish');

            newChild = await modelActions.addChild(b1, {title:'test'}, 1, undefined, 'test', 'test');
        });
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        it('creates a new child', async function(){
            let lookup = await repo.get(newChild._id);
            expect(lookup).toExist();
            expect(lookup.title).toEqual('test');
        });
        it('requests the new record to be focused', function(){
            expect(publishSpy).toHaveBeenCalled();
            let arg = publishSpy.calls[0].arguments[0];
            expect(arg.type).toEqual('focus_project_model');
        });
        describe('sequenceAfterPreviousChild is 1 greater than previousChildSequence', function(){
            it('new child has sequence .5 greater than previousChildSequence', async function(){
                let lookup = await repo.get(newChild._id);
                expect(lookup.sequence).toEqual(.5);
            });
        });
        describe('sequenceAfterPreviousChild is not provided', function(){
            it('new child has sequence 1 greater than previousChildSequence', async function(){
                newChild = await modelActions.addChild(b1, {title:'test'}, undefined, undefined, 'test', 'test');
                let lookup = await repo.get(newChild._id);
                expect(lookup.sequence).toEqual(1);
            });
        });
    });
    describe('moveChildrenToDifferentParent', function(){
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            const b1 = await repo.create({_id: 'b1',  hi: 'b1', parentId: 'a0', sequence: 0 });
            await repo.create({_id: 'b2', hi: 'b2', parentId: 'a0', sequence: 1 });
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
            const c1 = await repo.create({_id: 'c1', hi: 'c1', parentId: 'b2', sequence: 0 });
            const c2 = await repo.create({_id: 'c2', hi: 'c2', parentId: 'b2', sequence: 0 });

            await modelActions.moveChildrenToDifferentParent([c1, c2], b1._id, 'test');
        });
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        describe('children exist', function(){
            it('children are given new parent\'s parentId', async function(){
                const children = await repo.find({'parentId':'b1'});
                expect(children.length).toEqual(2);
            });
        });
    });
    describe('removeModel', function(){
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            await repo.create({_id: 'b1',  hi: 'b1', parentId: 'a0', sequence: 0 });
            await modelActions.removeModel('b1','test');
        });
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        it('removes a model', async function(){
            const removedModel = await repo.get('b1');
            expect(removedModel).toNotExist();
        });
    });
    describe('mergeWithPreviousSibling', function(){
        let publishSpy;
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            await repo.create({_id: 'b1',  title: 'b1', parentId: 'a0', sequence: 0 });
            const b2 = await repo.create({_id: 'b2', title: 'b2', parentId: 'a0', sequence: 1 });
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
            await repo.create({_id: 'c1', hi: 'c1', parentId: 'b2', sequence: 0 });
            await repo.create({_id: 'c2', hi: 'c2', parentId: 'b2', sequence: 0 });
            publishSpy = spyOn(eventSink, 'publish');

            await modelActions.mergeWithPreviousSibling(b2, 'test');
        });
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        it('concatenates the two titles and puts the result in the previous sibling', async function(){
            let previousSibling = await repo.get('b1');
            expect(previousSibling.title).toEqual('b1b2');
        });
        it('requests the moved record to be focused', function(){
            expect(publishSpy).toHaveBeenCalled();
            let arg = publishSpy.calls[0].arguments[0];
            expect(arg.type).toEqual('focus_project_model');
        });
        describe('the merging model has children', function(){
            it('children are given new parent\'s parentId', async function(){
                const children = await repo.find({'parentId':'b1'});
                expect(children.length).toEqual(2);
            });
        });
        it('removes the merging model', async function(){
            const removedModel = await repo.get('b2');
            expect(removedModel).toNotExist();
        });
    });
    describe('moveFocusToPrevious', function(){
        let publishSpy;
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            await repo.create({_id: 'b1',  title: 'b1', parentId: 'a0', sequence: 0 });
            const b2 = await repo.create({_id: 'b2', title: 'b2', parentId: 'a0', sequence: 1 });
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
            await repo.create({_id: 'c1', hi: 'c1', parentId: 'b2', sequence: 0 });
            await repo.create({_id: 'c2', hi: 'c2', parentId: 'b2', sequence: 0 });
            publishSpy = spyOn(eventSink, 'publish');

            await modelActions.mergeWithPreviousSibling(b2, 'test');
        });
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        it('requests the previous record to be focused', function(){
            expect(publishSpy).toHaveBeenCalled();
            let arg = publishSpy.calls[0].arguments[0];
            expect(arg.type).toEqual('focus_project_model');
            expect(arg.focus._id).toEqual('b1');
        });
    });
    describe('moveToNext', function(){
        let publishSpy, target;
        async function setupRepo(_id, update){
            // Add some children to get
            repo = await getRepository('test');
            await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0 });
            await repo.create({_id: 'b1',  title: 'b1', parentId: 'a0', sequence: 0 });
            await repo.create({_id: 'b2', title: 'b2', parentId: 'a0', sequence: 1});
            await repo.create({_id: 'b3', hi: 'b3', parentId: 'a0', sequence: 2 });
            await repo.create({_id: 'c1', hi: 'c1', parentId: 'b2', sequence: 0 });
            await repo.create({_id: 'c2', hi: 'c2', parentId: 'b2', sequence: 0 });
            if (update) {
                await repo.update(update);
            }
            target = await repo.get(_id);
            publishSpy = spyOn(eventSink, 'publish');
        }
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        describe('model is not collapsed and has children', function(){
            it('requests the first child record to be focused', async function(){
                await setupRepo('b2', { _id: 'b2', 'ui': {collapsed: false}});
                await modelActions.moveToNext(target, 'test');
                expect(publishSpy).toHaveBeenCalled();
                let arg = publishSpy.calls[0].arguments[0];
                expect(arg.type).toEqual('focus_project_model');
                expect(arg.focus._id).toEqual('c1');
            });
        });
        describe('model is collapsed and has a next sibling', function(){
            it('requests the next sibling to be focused', async function(){
                await setupRepo('b2');
                await modelActions.moveToNext(target, 'test');
                expect(publishSpy).toHaveBeenCalled();
                let arg = publishSpy.calls[0].arguments[0];
                expect(arg.type).toEqual('focus_project_model');
                expect(arg.focus._id).toEqual('b3');
            });
        });
        describe('model is collapsed does not have a next sibling', function(){
            it('requests the next parent to be focused', async function(){
                await setupRepo('c2');
                await modelActions.moveToNext(target, 'test');
                expect(publishSpy).toHaveBeenCalled();
                let arg = publishSpy.calls[0].arguments[0];
                expect(arg.type).toEqual('focus_project_model');
                expect(arg.focus._id).toEqual('b3');
            });
        });
    });
    describe('findBottomVisibleChild', function(){
        let root;
        beforeEach(async function(){
            // Add some children to get
            repo = await getRepository('test');
            root = await repo.create({_id: 'a0',  hi: 'a0', parentId: 'root', sequence: 0, ui: {collapsed: false} });
            await repo.create({_id: 'b1',  title: 'b1', parentId: 'a0', sequence: 0 });
            await repo.create({_id: 'b2', title: 'b2', parentId: 'a0', sequence: 1, ui: {collapsed: false}});
        });
        afterEach(async function(){
            restoreSpies();
            await clear('test');
        });
        describe('parent has two visible children', function(){
            it('returns the second child', async function(){
                const result = await modelActions.findBottomVisibleChild(root, 'test');
                expect(result._id).toEqual('b2');
            });
            describe('second visible child has two visible children', function(){
                beforeEach(async function(){
                    await repo.create({_id: 'c1', hi: 'c1', parentId: 'b2', sequence: 0 });
                    await repo.create({_id: 'c2', hi: 'c2', parentId: 'b2', sequence: 1 });
                });
                it('returns second grandchild', async function(){
                    const result = await modelActions.findBottomVisibleChild(root, 'test');
                    expect(result._id).toEqual('c2');
                });
            });
        });
        describe('parent is collapsed and has children', function(){
            it('returns the parent', async function(){
                const updatedParent = await repo.update({ _id: 'a0', ui: {collapsed: true}});
                const result = await modelActions.findBottomVisibleChild(updatedParent, 'test');
                expect(result._id).toEqual('a0');
            });
        });
    });
    describe('focus', function(){
        it('dispatches focus_project_model', function(){
            const publishSpy = spyOn(eventSink, 'publish');
            const model= { _id: 'b3' };
            modelActions.focus(model);
            let arg = publishSpy.calls[0].arguments[0];
            expect(arg.type).toEqual('focus_project_model');
            expect(arg.focus._id).toEqual('b3');
        });
    });
});