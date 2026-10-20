import {ClerkProvider} from "@clerk/nextjs";
import {auth} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import {getUserContext} from "@/lib/server-context";
import {PrivateShell} from "@/components/crm/PrivateShell";
export const dynamic="force-dynamic";
export default async function AppLayout({children}:{children:React.ReactNode}){
 const {userId}=await auth();if(!userId)redirect("/sign-in");
 let allowed=false;let problem="This is a private workspace. Use the configured owner account to enter.";
 try{allowed=Boolean(await getUserContext());}catch{problem="The workspace needs setup. Check the database connection, owner configuration, and migrations.";}
 return <ClerkProvider appearance={{variables:{colorPrimary:"#ff773d",colorBackground:"#11151c",colorText:"#f2f4f8",borderRadius:"0.75rem"}}}><PrivateShell>{allowed?children:<section className="crm-card crm-access-message"><p className="crm-eyebrow">PRIVATE WORKSPACE</p><h1>Let’s get your workspace ready.</h1><p>{problem}</p><p className="crm-muted">You can switch accounts using the profile control. Setup instructions are included in the build.</p></section>}</PrivateShell></ClerkProvider>;
}
