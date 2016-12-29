import * as app from 'ts-webapi-scripts';

function test(args: { name: string }) {
    if (args.name == 'error') throw Error('forced error');
    return Promise.resolve(args.name + ' ok');
}

function testCall () {
    return app.call('demo')('test')({name:'test'});
}


app.registerPost(test);
app.registerPost(testCall);

app.startServiceLocator();
app.start('demo',5001);



