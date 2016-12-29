import {createService} from './express';

export const startServiceLocator = ()=>{
    const svc =  createService('serviceLocator',6969);
    svc.start();
}
