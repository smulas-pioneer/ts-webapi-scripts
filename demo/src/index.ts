import * as app from 'ts-webapi-scripts';

function test(args: { name: string }) {
    if (args.name == 'error') throw Error('forced error');
    return Promise.resolve(args.name + ' ok');
}

function testCall (args:any) {
    app.logger('testCall');
    return app.call('demo')('test')({name:'test'});
}

app.registerPost([test,testCall]);

app.startServiceLocator();
app.start('demo',5001);



