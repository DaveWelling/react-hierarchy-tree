import {ORM} from 'redux-orm';
import Model from './model/Model';

export const orm = new ORM();

orm.register(Model);

export default orm;