const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'data', 'db.json');
const HTML_FILE = path.join(ROOT, 'secure-net.html');

function ensureDb() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ cases: [], docs: [], audit: [], users: [] }, null, 2));
  }
}
function readDb() { ensureDb(); return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(db) { ensureDb(); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function send(res, status, data, type='application/json') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control':'no-store'});
  res.end(type === 'application/json' ? JSON.stringify(data) : data);
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw=''; req.on('data', c => { raw += c; if(raw.length > 2_000_000) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}
const sessions = new Map();
function auth(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  return sessions.get(h.slice(7)) || null;
}
function audit(db, user, action, target, result='Success') {
  db.audit.unshift({ time:new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}), user, action, target, result });
  db.audit = db.audit.slice(0, 200);
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res,200,{ok:true,service:'Secure.Net API',time:new Date().toISOString()});

  if (req.method === 'POST' && url.pathname === '/api/login') {
    const b = await body(req);
    if (b.id === 'admin' && b.password === 'admin') {
      const token = crypto.randomBytes(24).toString('hex');
      const session = { id:'admin', role:b.role === 'Investigating Officer' ? 'Investigating Officer' : 'Admin' };
      sessions.set(token, session);
      const db = readDb(); audit(db, session.id, 'Signed in', 'System'); writeDb(db);
      return send(res,200,{ok:true,token,user:session});
    }
    return send(res,401,{ok:false,error:'Invalid credentials. Demo login is admin / admin.'});
  }

  const user = auth(req);
  if (url.pathname.startsWith('/api/') && !user) return send(res,401,{ok:false,error:'Authentication required'});

  if (req.method === 'GET' && url.pathname === '/api/state') return send(res,200,{ok:true,data:readDb()});
  if (req.method === 'PUT' && url.pathname === '/api/state') {
    const incoming = await body(req);
    const db = readDb();
    const next = { cases:incoming.cases||db.cases, docs:incoming.docs||db.docs, audit:incoming.audit||db.audit, users:incoming.users||db.users };
    writeDb(next); return send(res,200,{ok:true});
  }
  if (req.method === 'POST' && url.pathname === '/api/audit') {
    const b = await body(req); const db = readDb(); audit(db,user.id,b.action||'Action',b.target||'System',b.result||'Success'); writeDb(db); return send(res,200,{ok:true});
  }
  if (req.method === 'POST' && url.pathname === '/api/logout') { sessions.delete((req.headers.authorization||'').slice(7)); return send(res,200,{ok:true}); }
  return send(res,404,{ok:false,error:'Not found'});
}

const server = http.createServer(async (req,res)=>{
  try {
    if (req.url.startsWith('/api/')) return await route(req,res);
    if (req.method === 'GET' && (req.url === '/' || req.url === '/secure-net.html')) {
      const html=fs.readFileSync(HTML_FILE); res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); return res.end(html);
    }
    send(res,404,'Not found','text/plain');
  } catch(e) { console.error(e); send(res,500,{ok:false,error:'Server error'}); }
});

ensureDb();
server.listen(PORT,()=>console.log(`Secure.Net running at http://localhost:${PORT}`));
