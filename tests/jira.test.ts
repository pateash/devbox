import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JiraService } from '../src/main/jira'
import { DevBoxStore } from '../src/main/storage'

const stores:DevBoxStore[]=[]
const store=():DevBoxStore=>{const value=new DevBoxStore(join(mkdtempSync(join(tmpdir(),'devbox-jira-')),'test.sqlite'));stores.push(value);return value}
const response=(value:unknown,status=200):Response=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}})
const vault={encrypt:(value:string)=>Buffer.from(value),decrypt:(value:Buffer)=>value.toString()}
afterEach(()=>{stores.splice(0).forEach((item)=>item.close());vi.unstubAllGlobals()})

describe('Jira Cloud and Data Center sync',()=>{
  it('uses Cloud basic authentication and stores only assigned non-terminal issues',async()=>{const db=store();const workspace=db.createWorkspace('Acme');const calls:Array<{url:string;auth:string|null}>=[];vi.stubGlobal('fetch',vi.fn(async(input:string,init?:RequestInit)=>{calls.push({url:input,auth:new Headers(init?.headers).get('authorization')});const path=new URL(input).pathname;if(path.endsWith('/myself'))return response({displayName:'Ada'});if(path.endsWith('/project'))return response([{key:'APP',name:'App'}]);if(path.endsWith('/search'))return response({total:2,issues:[{key:'APP-1',fields:{summary:'Fix login',updated:'2026-01-01T00:00:00Z',status:{name:'In Progress',statusCategory:{key:'indeterminate'}},priority:{name:'High'}}},{key:'APP-2',fields:{summary:'Done work',status:{name:'Done',statusCategory:{key:'done'}},priority:{name:'Highest'}}}]});return response({},404)}));const jira=new JiraService(db,vault);const result=await jira.connect({workspaceId:workspace.id,deployment:'cloud',baseUrl:'https://acme.atlassian.net/',email:'ada@example.com',token:'api-token'});db.setJiraProjects(workspace.id,result.projects);await jira.refresh(workspace.id);expect(calls[0]?.auth).toBe(`Basic ${Buffer.from('ada@example.com:api-token').toString('base64')}`);expect(db.jiraWorkItems(workspace.id).map((item)=>[item.title,item.reason,item.status])).toEqual([['APP-1 · Fix login','Assigned to you','In Progress']])})

  it('uses a Data Center bearer token and preserves cached work when authentication expires',async()=>{const db=store();const workspace=db.createWorkspace('Acme');let failing=false;vi.stubGlobal('fetch',vi.fn(async(input:string,init?:RequestInit)=>{const path=new URL(input).pathname;if(failing&&path.endsWith('/search'))return response({errorMessages:['expired']},401);if(path.endsWith('/myself')){expect(new Headers(init?.headers).get('authorization')).toBe('Bearer dc-token');return response({displayName:'Ada'})}if(path.endsWith('/project'))return response([{key:'OPS',name:'Operations'}]);if(path.endsWith('/search'))return response({total:1,issues:[{key:'OPS-9',fields:{summary:'Rotate key',updated:'2026-01-01T00:00:00Z',status:{name:'Open',statusCategory:{key:'new'}}}}]});return response({},404)}));const jira=new JiraService(db,vault);const result=await jira.connect({workspaceId:workspace.id,deployment:'data-center',baseUrl:'https://jira.internal.example',token:'dc-token'});db.setJiraProjects(workspace.id,result.projects);await jira.refresh(workspace.id);failing=true;await expect(jira.refresh(workspace.id)).rejects.toThrow('Jira API 401');expect(db.jiraWorkItems(workspace.id).map((item)=>item.title)).toEqual(['OPS-9 · Rotate key']);expect(db.jiraIntegration(workspace.id)?.state).toBe('needs_reauth')})
})
