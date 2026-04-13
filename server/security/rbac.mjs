export const ROLES = ["owner", "collaborator", "viewer"];

const PERMISSIONS = {
  chat:                 ["owner", "collaborator"],
  typing:               ["owner", "collaborator"],
  "context:update":     ["owner", "collaborator"],
  "ai:ask":             ["owner", "collaborator"],
  "invite:create":      ["owner"],
  "membership:remove":  ["owner"],
  "membership:update":  ["owner"],
  ping:                 ["owner", "collaborator", "viewer"],
};

export function canPerform(role, action) {
  const allowed = PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

export const MEMBER_ROLES = ["collaborator", "viewer"];
