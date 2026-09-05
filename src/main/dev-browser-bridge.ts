import { createServer, type Server } from 'node:http'
import { DevBoxStore } from './storage'

const githubSummary = (store: DevBoxStore): unknown => {
  const integration=store.globalGitHub()
  return integration ? {...integration,provider:'github',repositories:integration.repositories.map((fullName)=>({fullName,selected:true}))}:null
}

export function startDevBrowserBridge(store: DevBoxStore): Server | null {
  if (!process.env.ELECTRON_RENDERER_URL) return null
  const server=createServer((request,response):void=>{ response.setHeader('content-type','application/json'); const origin=process.env.ELECTRON_RENDERER_URL; if(origin) response.setHeader('access-control-allow-origin',origin); const url=new URL(request.url??'/', 'http://127.0.0.1'); const path=url.pathname.replace(/^\/devbox-api/,'')||'/'; const finish=(value:unknown):void=>{response.end(JSON.stringify(value))}; if(request.headers.origin&&request.headers.origin!==origin){response.writeHead(403);finish({error:'Forbidden'});return} if(path==='/workspaces'&&request.method==='GET'){finish(store.listWorkspaces());return} if(path==='/workspaces/current'){finish(store.currentWorkspace());return} if(path==='/github/global'){finish(githubSummary(store));return} const workspaceId=url.searchParams.get('workspaceId'); if(path==='/github/assigned'&&workspaceId){finish(store.assignedRepositories(workspaceId));return} if(path==='/github/work-items'&&workspaceId){finish(store.workItems(workspaceId));return} if(path==='/dashboard'&&workspaceId){const workspace=store.getWorkspace(workspaceId); if(!workspace) { response.writeHead(404); finish({error:'Workspace not found.'}); return } finish({workspace,fixtureMode:false,message:'Connect GitHub or Jira to start seeing actionable work.',fixtureItems:[]});return} let raw=''; request.on('data',(chunk)=>{raw+=chunk}); request.on('end',()=>{try{const input=raw?JSON.parse(raw) as {name?:string;id?:string}:{}; if(path==='/workspaces'&&request.method==='POST'){finish(store.createWorkspace(input.name??''));return} if(path==='/workspaces/select'){finish(store.selectWorkspace(input.id??''));return} if(path==='/workspaces/archive'){store.archiveWorkspace(input.id??'');finish({});return} throw new Error('Not found')}catch(error){response.writeHead(400);finish({error:error instanceof Error?error.message:'Request failed'})}}) }); server.listen(4317,'127.0.0.1'); return server
}
