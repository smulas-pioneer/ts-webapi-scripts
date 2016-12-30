import 'mocha';
import * as expect from 'expect';
import { createService, startServiceLocator } from '../src/index';

/* create testSvc */
const testSvc = createService('test-svc', 5001);

function api1(args: { arg1: string }) {
    if (args.arg1 == 'error') throw Error('forced error');
    return Promise.resolve(args.arg1 + ' ok');
}

function api2(args: any) {
    return testSvc.call('test-svc')('api1')({ arg1: 'arg1-value' });
}

testSvc.registerPost([api1, api2]);

const startEnv = () => {
    return new Promise<any>((resolve, reject) => {
        const locatorSvc = startServiceLocator(() => {
            testSvc.start(() => {
                resolve ({testSvc,locatorSvc});
            });
        });
    });
}



describe('api', () => {
    it('api1', () => {
        startEnv().then(c=>{
            c.testSvc.call ('test-svc')('api1')('xxx').then (r=>{
                expect(r).toBe('xxx');
                r.testSvc.stop();
            });
        });
    });
});