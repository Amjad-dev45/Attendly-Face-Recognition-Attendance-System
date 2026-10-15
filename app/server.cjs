const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {seed,mutate}=require('./store.cjs');
const root=path.resolve(__dirname,'..');
const dataFile=path.join(__dirname,'data','demo.json');
let db=fs.existsSync(dataFile)?JSON.parse(fs.readFileSync(dataFile,'utf8')):seed();
function save(){fs.mkdirSync(path.dirname(dataFile),{recursive:true});fs.writeFileSync(dataFile,JSON.stringify(db,null,2));}
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('X-Content-Type-Options','nosniff');
 const json=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
 if(url.pathname==='/api/state'&&req.method==='GET') return json(200,db);
 if(url.pathname.startsWith('/api/')&&req.method==='POST') {
  if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}`) return json(403,{error:'Cross-origin writes are not allowed.'});
  try {
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw Error('Request too large.');}
   const payload=JSON.parse(raw||'{}'); const next=structuredClone(db);
   const result=mutate(next,url.pathname.slice(5),payload); db=next;save();return json(200,result);
  }catch(e){return json(400,{error:e.message});}
 }
 if(req.method!=='GET')return json(405,{error:'Method not allowed.'});
 const base=url.pathname.startsWith('/camera/')?root:path.join(root,'ISD','build');
 let file=path.resolve(base,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(base+path.sep)&&file!==base)return json(403,{error:'Forbidden'});
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(base,'index.html');
 if(!fs.existsSync(file))return json(404,{error:'Build the application with npm run build first.'});
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
server.listen(process.env.PORT||4173,'127.0.0.1',()=>console.log('Attendly demo: http://localhost:'+(process.env.PORT||4173)));
