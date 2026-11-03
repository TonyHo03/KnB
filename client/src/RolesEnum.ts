import type {UserDto} from "@/src/api/Api.ts";

export type Roles = "admin" | "superuser" | "user";

const ROLES: Roles[] = ["admin", "superuser", "user"]

export type Actor = { id: number; role: string };

export function canModify(actor: UserDto | null, targetRole: string): boolean {
    if (!actor) return false;
    if (actor.role === "admin") return true;                  // admins manage everyone
    if (actor.role === "superuser") return targetRole === "user"; // superusers only manage plain users
    return false;
}

export function assignableRoles(actor: UserDto | null): Roles[] {
    if (!actor) return [];
    if (actor.role === "admin") return [...ROLES];       // admins can assign any role
    if (actor.role === "superuser") return ["user"];     // superusers can only assign "user"
    return [];
}