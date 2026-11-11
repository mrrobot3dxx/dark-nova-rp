import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
export function deploymentConfig(env=process.env){
 const dataDir=env.DATA_DIR||env.RAILWAY_VOLUME_MOUNT_PATH||fileURLToPath(new URL('./data',import.meta.url));
 const publicAddress=env.PUBLIC_ORIGIN||(env.RAILWAY_PUBLIC_DOMAIN?'https://'+env.RAILWAY_PUBLIC_DOMAIN:'');
 const publicOrigin=publicAddress?new URL(publicAddress).origin:null;
 return {dataDir,dataFile:join(dataDir,'accounts.json'),moderatorsFile:join(dataDir,'moderators.json'),publicOrigin};
}
export function allowedRequestOrigin(req,publicOrigin){
 if(req.headers['sec-fetch-site']==='cross-site')return false;
 const expected=publicOrigin||`${req.socket.encrypted?'https':'http'}://${req.headers.host}`;
 return !req.headers.origin||req.headers.origin===expected;
}

export function seedPersistentData(config,env=process.env){let count=0;for(const [variable,file,accounts] of [['MIGRATION_ACCOUNTS_B64',config.dataFile,true],['MIGRATION_MODERATORS_B64',config.moderatorsFile,false]]){if(!env[variable]||existsSync(file))continue;const raw=Buffer.from(env[variable],'base64').toString('utf8'),data=JSON.parse(raw);if(!Array.isArray(data)||accounts&&(!data.every(a=>a&&typeof a.key==='string'&&typeof a.id==='string'&&typeof a.hash==='string')||new Set(data.map(a=>a.key)).size!==data.length)||!accounts&&!data.every(id=>typeof id==='string'))throw Error('Données de migration invalides.');mkdirSync(config.dataDir,{recursive:true});writeFileSync(file,raw,{flag:'wx',mode:0o600});count++;}return count;}
