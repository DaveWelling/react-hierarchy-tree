import {ORM} from 'redux-orm';
import Event from './model/EventModel';

export const orm = new ORM();
orm.register(Event);

export default orm;