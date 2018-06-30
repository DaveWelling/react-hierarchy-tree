import {ORM} from 'redux-orm';
import Model from './model/NovelModel';
import Chapter from './model/NovelChapter';
import Event from './model/NovelEvent';
import Summary from './model/NovelSummary';

export const orm = new ORM();

orm.register(Model, Chapter, Event, Summary);

export default orm;