export function isAllowedOwner(user:{clerkId:string;verifiedEmail:string|null}, config:{ownerClerkId?:string;ownerEmail?:string}):boolean {
 const id=config.ownerClerkId?.trim();
 if(id) return user.clerkId===id;
 const email=config.ownerEmail?.trim().toLowerCase();
 return Boolean(email && user.verifiedEmail?.trim().toLowerCase()===email);
}

// Explicit owner requested for this private app. Only the identity provider's
// verified addresses may be supplied here, never form or request parameters.
export const PRIMARY_OWNER_EMAIL = 'nrpyles@gmail.com';
export function isPrimaryOwner(user:{clerkId:string;verifiedEmails:readonly string[]}):boolean {
 return Boolean(user.clerkId.trim()) && user.verifiedEmails.some(email=>email.trim().toLowerCase()===PRIMARY_OWNER_EMAIL);
}
