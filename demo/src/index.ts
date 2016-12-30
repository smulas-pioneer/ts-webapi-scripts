import {createService,startServiceLocator} from 'ts-webapi-scripts';
var app = createService('demo',5001);

function test(args: { name: string }) {
    if (args.name == 'error') throw Error('forced error');
    return Promise.resolve(args.name + ' ok');
}

function testCall (args:any) {
    return app.call('demo')('test')({name:'test'});
}

app.registerPost([test,testCall]);

startServiceLocator();
app.start();



