import {ClerkProvider} from "@clerk/nextjs";
import {auth} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import {getUserContext} from "@/lib/server-context";
import {PrivateShell} from "@/components/crm/PrivateShell";
import {WorkspaceSetupError,workspaceSetupAction} from "@/lib/workspace-setup";
export const dynamic="force-dynamic";
export default async function AppLayout({children}:{children:React.ReactNode}){
 const {userId}=await auth();if(!userId)redirect("/sign-in");
 let allowed=false;let problem="This private workspace requires the verified email nrpyles@gmail.com on your signed in account.";let issue:WorkspaceSetupError|null=null;
 try{allowed=Boolean(await getUserContext());}catch(error){
  if(error instanceof WorkspaceSetupError){issue=error;problem=error.message;}
  else problem="The sign in service could not load your account. Refresh, or check the Clerk configuration for this deployment.";
 }
 return <ClerkProvider appearance={{variables:{colorPrimary:"#ff773d",colorBackground:"#11151c",colorText:"#f2f4f8",borderRadius:"0.75rem"}}}><PrivateShell>{allowed?children:<section className="crm-card crm-access-message"><p className="crm-eyebrow">PRIVATE WORKSPACE</p><h1>{issue?'Your login worked. Workspace setup needs attention.':'Let’s get your workspace ready.'}</h1><p>{problem}</p>{issue&&<><p className="crm-muted">{workspaceSetupAction(issue.code)}</p><p>Setup code: <code>{issue.code}</code></p><a className="crm-button crm-button-secondary" href="/app">Try again</a></>}<p className="crm-muted">Setup instructions are included in the build.</p></section>}</PrivateShell></ClerkProvider>;
}
