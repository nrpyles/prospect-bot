import test from 'node:test';
import assert from 'node:assert/strict';
const setup=await import('../../src/lib/workspace-setup.ts').catch(()=>({}));

test('setup distinguishes absent database configuration from rejected login',()=>{
 assert.equal(typeof setup.classifyWorkspaceFailure,'function');
 assert.equal(setup.classifyWorkspaceFailure(new Error('DATABASE_URL is not set'),false),'database_missing');
});

test('nested database failures identify schema credentials and network separately',()=>{
 assert.equal(typeof setup.classifyWorkspaceFailure,'function');
 for(const [code,expected] of [['42P01','schema_missing'],['42703','schema_missing'],['28P01','database_credentials'],['42501','database_permissions'],['CONNECT_TIMEOUT','database_connection'],['ENOTFOUND','database_connection'],['23505','workspace_conflict']]){
  assert.equal(setup.classifyWorkspaceFailure({cause:{cause:{code}}},true),expected);
 }
 assert.equal(setup.classifyWorkspaceFailure(new Error('unknown'),true),'workspace_unknown');
});

test('setup output never repeats credentials SQL or provider error messages',()=>{
 assert.equal(typeof setup.WorkspaceSetupError,'function');
 const error={code:'28P01',message:'postgres://private:secret@host/db SELECT private_data'};
 const result=new setup.WorkspaceSetupError(setup.classifyWorkspaceFailure(error,true));
 assert.equal(result.code,'database_credentials');
 assert.ok(!JSON.stringify(result).includes('secret'));
 assert.ok(!result.message.includes('SELECT'));
});
