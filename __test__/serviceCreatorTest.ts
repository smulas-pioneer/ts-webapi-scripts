require('mocha');
import * as expect from 'expect'
import { createService, startServiceLocator, IService } from '../src/index';

/* create testSvc */
const testSvc = createService('test-svc', 5001);

function api1(args: { arg1: string }) {
    if (args.arg1 == 'error') throw Error('forced error');
    return Promise.resolve(args.arg1 + ' ok');
}

function api2(args: { arg1: string }) {
    return testSvc.call('test-svc')('api1')({ arg1: args.arg1 }).then(r=>r.data);
}

testSvc.post([api1, api2]);

const startEnv = () => {
    console.log('\nStart Enviroment');
    return startServiceLocator().then(locatorSvc => {
        const reg = (svc: IService) => locatorSvc.register(svc.name, `http://localhost:${svc.port}`);
        reg(locatorSvc);

        return testSvc.start().then(testSvc => {
            reg(testSvc);
            return {
                locatorSvc, testSvc, shutdown: () => {
                    testSvc.stop();
                    locatorSvc.stop();
                }
            }
        });
    });
}

describe('api testing', () => {
    it('api1', () => {
        return startEnv().then(c => {
            expect(c.locatorSvc.server).toExist('locatorSvc server does not exist');
            expect(c.testSvc.server).toExist('testSvc server does not exist');

            return c.testSvc.call(c.testSvc.name)('api1')({ arg1: 'test' }).then(res => {
                 c.shutdown();
                console.log('res', res.data);
                expect(res.data).toBe('test ok', 'expected result is != "test ok"');
            });

        });
    });
    it('api2', () => {
        return startEnv().then(c => {
            expect(c.locatorSvc.server).toExist('locatorSvc server does not exist');
            expect(c.testSvc.server).toExist('testSvc server does not exist');

            return c.testSvc.call(c.testSvc.name)('api2')({ arg1: 'test' }).then(res => {
                c.shutdown();
                console.log('res', res.data);
                expect(res.data).toBe('test ok', 'expected result is != "test ok"');
            });

        });
    });

});