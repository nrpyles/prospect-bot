export function isAllowedOwner(user:{clerkId:string;verifiedEmail:string|null}, config:{ownerClerkId?:string;ownerEmail?:string}):boolean {
 const id=config.ownerClerkId?.trim();
 if(id) return user.clerkId===id;
 const email=config.ownerEmail?.trim().toLowerCase();
 return Boolean(email && user.verifiedEmail?.trim().toLowerCase()===email);
}
