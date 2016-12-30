import {createService} from './serviceCreator';
import {Response} from 'node-fetch';

export const startServiceLocator = (cb?:()=>void)=>{
    const svc =  createService('serviceLocator',6969);
    svc.start(cb);
    return svc;
}
