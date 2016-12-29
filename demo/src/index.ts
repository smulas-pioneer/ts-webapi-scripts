import * as app from 'ts-webapi-scripts';

function test(args: { name: string }) {
    if (args.name == 'error') throw Error('forced error');
    return Promise.resolve(args.name + ' ok');
}

app.registerPost(test);
app.startServiceLocator();
app.start(5001);



