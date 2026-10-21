export type WorkspaceFailureCode = 'database_missing' | 'schema_missing' | 'database_credentials' | 'database_permissions' | 'database_connection' | 'workspace_conflict' | 'workspace_unknown';

export function classifyWorkspaceFailure(error:unknown,databaseConfigured:boolean):WorkspaceFailureCode {
 if(!databaseConfigured)return 'database_missing';
 let cause=error;
 const seen=new Set<unknown>();
 while(cause&&typeof cause==='object'&&!seen.has(cause)){
  seen.add(cause);
  const record=cause as {code?:unknown;cause?:unknown};
  const code=typeof record.code==='string'?record.code:'';
  if(['42P01','42703','42704'].includes(code))return 'schema_missing';
  if(['28P01','28000'].includes(code))return 'database_credentials';
  if(code==='42501')return 'database_permissions';
  if(code==='23505')return 'workspace_conflict';
  if(code.startsWith('08')||['ECONNREFUSED','ENOTFOUND','EAI_AGAIN','ETIMEDOUT','ECONNRESET','CONNECT_TIMEOUT','CONNECTION_CLOSED'].includes(code))return 'database_connection';
  cause=record.cause;
 }
 return 'workspace_unknown';
}

const messages:Record<WorkspaceFailureCode,string>={
 database_missing:'Your owner email is verified. This deployment has no DATABASE_URL configured.',
 schema_missing:'Your owner email is verified. The connected database is missing required CRM tables or columns.',
 database_credentials:'Your owner email is verified. The database rejected the connection credentials.',
 database_permissions:'Your owner email is verified. The database account lacks permission to create or read the workspace.',
 database_connection:'Your owner email is verified. The server could not reach the configured database.',
 workspace_conflict:'Your owner email is verified. A stored workspace record conflicts with account setup.',
 workspace_unknown:'Your owner email is verified. The server could not initialize the workspace. Check this deployment’s server logs.',
};

// Constructed only after the verified owner gate, and never carries raw SQL,
// connection strings or provider messages into the rendered setup screen.
export class WorkspaceSetupError extends Error {
 code:WorkspaceFailureCode;
 constructor(code:WorkspaceFailureCode){super(messages[code]);this.name='WorkspaceSetupError';this.code=code;}
}

export function workspaceSetupAction(code:WorkspaceFailureCode):string {
 if(code==='database_missing')return 'In Vercel, open the prospect-bot project, then Settings → Environment Variables. Add the existing Postgres DATABASE_URL to Preview for this branch, then redeploy. Keep its value private.';
 if(code==='schema_missing')return 'Back up the connected database and apply the recorded CRM migrations using the setup instructions. Refresh after the migration succeeds.';
 if(code==='database_credentials')return 'Correct the existing database connection value in this deployment’s Vercel environment variables, then redeploy.';
 if(code==='database_connection')return 'Check that the existing Postgres database is running and reachable from this deployment.';
 if(code==='database_permissions')return 'Check the database role’s permissions on the existing workspace schema. Do not replace or erase existing data.';
 return 'Check the server logs for this deployment. The code below identifies the failing setup stage without displaying private credentials.';
}
