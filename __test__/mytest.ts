import 'mocha';
import * as expect from 'expect';
import * as sl from '../src/lib/service-locator';



describe('test', ()=>{
    it('test',()=>{
        sl.selfRegister('test',100);

   });
});