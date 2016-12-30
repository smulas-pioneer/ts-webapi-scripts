require('mocha');
import * as expect from 'expect'
import { createService, startServiceLocator, IService } from '../src/index';

/* create testSvc */
const testSvc = createService('test-svc', 5001);

function api1(args) {
    if (args.arg1 == 'error') throw Error('forced error');
    return Promise.resolve(args.arg1 + ' ok');
}

function api2(args) {
    return testSvc.call('test-svc')('api1')({ arg1: 'arg1-value' });
}

testSvc.registerPost([api1, api2]);

const startEnv = () => {
    console.log('\nStart Enviroment');
    return startServiceLocator().then(locatorSvc => {
        return testSvc.start().then(testSvc=>{
            return { locatorSvc,testSvc }
        });
    });
}

describe('api testing', () => {
     it('api1', () => {
         return startEnv().then(c => {
             expect (c.locatorSvc.server).toExist('locatorSvc server does not exist');
             expect (c.testSvc.server).toExist('testSvc server does not exist');

             return c.locatorSvc.call('serviceLocator')('services')({}).then(res=>{
                 console.log(res);
                 return ('ok');
             });
           /* console.log(c.locatorSvc.server);
            expect(c.locatorSvc.server).toEqual(null);
            return 1;
            /*
            console.log('env started');
            c.testSvc.call('test-svc')('api1')('xxx').then(r => {
                console.log(r);
                expect(r).toBe('xxxy');
                c.testSvc.stop();
                c.locatorSvc.stop();
            });
            */
        });
    });
});