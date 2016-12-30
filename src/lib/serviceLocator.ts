import {createService,IService} from './serviceCreator';
import {Response} from 'node-fetch';

export const startServiceLocator = ()=>{
    const svc =  createService('serviceLocator',6969);
    return svc.start();
}
