import type { JiraProject, WorkItem } from '../shared/contracts'
import { DevBoxStore } from './storage'

type Vault = { encrypt(value:string):Buffer; decrypt(value:Buffer):string }
type JiraUser = { displayName?:string; emailAddress?:string; accountId?:string; name?:string }
type JiraIssue = { key:string; fields:{ summary?:string; updated?:string; status?:{name?:string;statusCategory?:{key?:string}}; priority?:{name?:string} } }

export class JiraApiError extends Error { constructor(readonly status:number, message:string){super(`Jira API ${status}: ${message}`)} }

export class JiraService {
  constructor(private readonly store:DevBoxStore, private readonly vault:Vault) {}
  async connect(input:{workspaceId:string;deployment:'cloud'|'data-center';baseUrl:string;email?:string;token:string}):Promise<{integration:ReturnType<DevBoxStore['jiraIntegration']>;projects:JiraProject[]}> {
    const baseUrl=normalizeBaseUrl(input.baseUrl)
    if(input.deployment==='cloud'&&!input.email?.trim()) throw new Error('Jira Cloud requires an account email.')
    const credential=input.deployment==='cloud' ? `${input.email!.trim()}:${input.token}` : input.token
    const auth=input.deployment==='cloud' ? `Basic ${Buffer.from(credential).toString('base64')}` : `Bearer ${credential}`
    const user=await this.request<JiraUser>(baseUrl,auth,'/rest/api/2/myself')
    const projects=await this.projects(baseUrl,auth)
    const displayName=user.displayName??user.emailAddress??user.name??'Jira account'
    this.store.createJiraIntegration(input.workspaceId,displayName,this.vault.encrypt(credential),{deployment:input.deployment,baseUrl,email:input.deployment==='cloud'?input.email!.trim():undefined,projects:[]})
    return {integration:this.store.jiraIntegration(input.workspaceId),projects}
  }
  async refresh(workspaceId:string):Promise<void> { const integration=this.store.jiraIntegration(workspaceId); if(!integration) throw new Error('Jira is not connected.'); if(!integration.projects.length) return; try { const credential=this.vault.decrypt(this.store.jiraToken(integration.id)); const auth=integration.deployment==='cloud' ? `Basic ${Buffer.from(credential).toString('base64')}` : `Bearer ${credential}`; const issues=await this.issues(integration.baseUrl,auth,integration.projects.map((project)=>project.key)); const items=issues.filter((issue)=>issue.fields.status?.statusCategory?.key!=='done').map((issue):Omit<WorkItem,'id'|'provider'>=>({repository:issue.key.split('-')[0]??'Jira',title:`${issue.key} · ${issue.fields.summary??'Untitled issue'}`,reason:'Assigned to you',priority:priority(issue.fields.priority?.name),url:`${integration.baseUrl}/browse/${encodeURIComponent(issue.key)}`,updatedAt:issue.fields.updated??new Date().toISOString(),kind:'jira-issue',status:issue.fields.status?.name})); this.store.replaceJiraWork(integration.id,items) } catch(error) { const message=error instanceof Error?error.message:'Jira sync failed.'; this.store.markJiraError(integration.id,error instanceof JiraApiError&&(error.status===401||error.status===403)?'needs_reauth':'error',message); throw error } }
  private async projects(baseUrl:string, auth:string):Promise<JiraProject[]> { const value=await this.request<Array<{key:string;name:string}>>(baseUrl,auth,'/rest/api/2/project'); return value.map((project)=>({key:project.key,name:project.name})).sort((a,b)=>a.name.localeCompare(b.name)) }
  private async issues(baseUrl:string,auth:string,projects:string[]):Promise<JiraIssue[]> { const quoted=projects.map((project)=>`"${project.replaceAll('"','\\"')}"`).join(','); const jql=`assignee = currentUser() AND project IN (${quoted}) AND statusCategory != Done ORDER BY updated DESC`; const values:JiraIssue[]=[]; for(let startAt=0;;){const params=new URLSearchParams({jql,startAt:String(startAt),maxResults:'100',fields:'summary,status,priority,updated'}); const page=await this.request<{issues:JiraIssue[];total:number}>(baseUrl,auth,`/rest/api/2/search?${params}`); values.push(...page.issues); startAt+=page.issues.length; if(!page.issues.length||startAt>=page.total) return values} }
  private async request<T>(baseUrl:string,auth:string,path:string):Promise<T> { const response=await fetch(baseUrl+path,{headers:{authorization:auth,accept:'application/json'}}); if(!response.ok){let message=response.statusText; try { const body=await response.json() as {errorMessages?:string[];errors?:Record<string,string>}; message=body.errorMessages?.join(', ')??Object.values(body.errors??{}).join(', ')??message } catch { /* retain status text */ } throw new JiraApiError(response.status,message) } return response.json() as Promise<T> }
}

export function normalizeBaseUrl(value:string):string { const url=new URL(value.trim()); if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash) throw new Error('Jira URL must be a clean HTTPS base URL.'); return url.toString().replace(/\/$/,'') }
function priority(value?:string):WorkItem['priority'] { return value==='Highest'||value==='High'?'high':'normal' }
