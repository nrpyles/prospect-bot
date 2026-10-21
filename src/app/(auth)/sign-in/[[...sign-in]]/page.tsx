import {SignIn} from "@clerk/nextjs";
import {PRIMARY_OWNER_EMAIL} from "@/lib/private-access";
export default function SignInPage(){return <div><p className="mb-4 text-center text-sm">Private CRM access for {PRIMARY_OWNER_EMAIL}</p><SignIn appearance={{elements:{footerAction:"hidden"}}}/></div>;}
