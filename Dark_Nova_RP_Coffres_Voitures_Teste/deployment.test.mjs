import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
for(const folder of ['.','../nova-rp'])test('Railway : HTTPS autorisé, origine externe refusée et données persistantes '+folder,async()=>{
 const {deploymentConfig,allowedRequestOrigin}=await import(folder+'/deployment.mjs'),{createGameServer}=await import(folder+'/server.mjs');const dir=await mkdtemp(join(tmpdir(),'nova-deploy-'));const deployment=deploymentConfig({DATA_DIR:dir,RAILWAY_PUBLIC_DOMAIN:'dark-nova-test.up.railway.app'});assert.equal(deployment.dataFile,join(dir,'accounts.json'));assert.equal(deployment.moderatorsFile,join(dir,'moderators.json'));
 assert.equal(deploymentConfig({RAILWAY_VOLUME_MOUNT_PATH:dir}).dataDir,dir);assert.equal(deploymentConfig({PUBLIC_ORIGIN:'https://jeu.example.com'}).publicOrigin,'https://jeu.example.com');
 assert.equal(allowedRequestOrigin({headers:{host:'local:3000',origin:'https://evil.example','x-forwarded-proto':'https'},socket:{}},null),false);
 let server,base;const start=async()=>{server=createGameServer({deployment,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async(path,body,origin=deployment.publicOrigin,extra={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Origin:origin,...extra},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 try{await start();assert.deepEqual(await(await fetch(base+'/health')).json(),{ok:true,game:'Dark Nova RP'});const credentials={name:'DeployTest',password:'Deployment-test-password-42',email:'deploy@example.test'};
 assert.equal((await post('register',credentials,'https://evil.example')).status,403);assert.equal((await post('register',credentials,deployment.publicOrigin,{'sec-fetch-site':'cross-site'})).status,403);assert.equal((await post('register',credentials)).status,200);await stop();const stored=JSON.parse(await readFile(deployment.dataFile,'utf8'));assert.equal(stored.length,1);await start();assert.equal((await post('login',credentials)).status,200);
 }finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});
for(const folder of ['.','../nova-rp'])test('Migration privée : amorçage unique, données validées et aucun écrasement '+folder,async()=>{
 const {deploymentConfig,seedPersistentData}=await import(folder+'/deployment.mjs');const dir=await mkdtemp(join(tmpdir(),'nova-seed-')),config=deploymentConfig({DATA_DIR:dir});const data=[{key:'test',id:'id',hash:'existing-hash'}],env={MIGRATION_ACCOUNTS_B64:Buffer.from(JSON.stringify(data)).toString('base64'),MIGRATION_MODERATORS_B64:Buffer.from('["id"]').toString('base64')};
 try{assert.equal(seedPersistentData(config,env),2);assert.deepEqual(JSON.parse(await readFile(config.dataFile,'utf8')),data);assert.equal(seedPersistentData(config,{...env,MIGRATION_ACCOUNTS_B64:Buffer.from('[]').toString('base64')}),0);assert.deepEqual(JSON.parse(await readFile(config.dataFile,'utf8')),data);const other=deploymentConfig({DATA_DIR:join(dir,'invalid')});assert.throws(()=>seedPersistentData(other,{MIGRATION_ACCOUNTS_B64:Buffer.from('{}').toString('base64')}),/invalides/);}finally{await rm(dir,{recursive:true,force:true});}
});
