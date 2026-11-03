import { useEffect, useState, type FormEvent } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import type {Roles} from "@/src/RolesEnum.ts";
import type {UserDto} from "@/src/api/Api.ts";
import {
    AlertDialog, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "../components/ui/alert-dialog.tsx";

export type UserFormValues = {
    username: string;
    password: string;
    role: string;
};

/** Adjust to match your API's user shape. */
export type EditableUser = {
    id: number;
    username: string;
    role: string;
};


const ROLES: Roles[] = ["admin", "superuser", "user"] as const;

// Shared black & white styling
const contentClass = "border-2 border-black bg-white text-black sm:max-w-md";
const inputClass =
    "border-black bg-white text-black placeholder:text-neutral-500 focus-visible:ring-black";
const primaryButtonClass = "bg-black text-white hover:bg-neutral-800";
const secondaryButtonClass =
    "border border-black bg-white text-black hover:bg-neutral-100";

type UserFormProps = {
    initial: UserFormValues;
    roles: Roles[];
    /** When true, the password may be left empty (keeps the current one). */
    passwordOptional: boolean;
    submitLabel: string;
    onCancel: () => void;
    onSubmit: (values: UserFormValues) => Promise<void> | void;
};

function UserForm({initial, roles, passwordOptional, submitLabel, onCancel, onSubmit}: UserFormProps) {
    const [values, setValues] = useState<UserFormValues>(initial);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
        setValues((v) => ({ ...v, [key]: value }));
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!values.username.trim()) {
            setError("Email is required.");
            return;
        }
        if (!passwordOptional && values.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (passwordOptional && values.password && values.password.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }

        try {
            setLoading(true);
            await onSubmit({ ...values, username: values.username.trim() });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
                <div role="alert" className="border border-black px-3 py-2 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="user-username">Username</Label>
                <Input id="user-username" autoComplete="off" value={values.username} onChange={(e) => set("username", e.target.value)} placeholder="user123" className={inputClass}/>
            </div>

            <div className="space-y-1.5">
            <Label htmlFor="user-password">
                Password
                {passwordOptional && (
                    <span className="ml-1 font-normal text-neutral-500">
                        (leave empty to keep current)
                    </span>
                )}
                </Label>
                <Input id="user-password" type="password" autoComplete="new-password" value={values.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" className={inputClass}/>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="user-role">Role</Label>
                <select id="user-role" value={values.role} onChange={(e) => set("role", e.target.value)} className="h-9 w-full rounded-md border border-black bg-white px-3 text-sm text-black outline-none focus-visible:ring-2 focus-visible:ring-black">
                    {roles.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>

            <DialogFooter className="gap-2 pt-2">
                <Button type="button" onClick={onCancel} disabled={loading} className={secondaryButtonClass}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className={primaryButtonClass}>{loading ? "Saving..." : submitLabel}</Button>
            </DialogFooter>
        </form>
    );
}

type CreateUserDialogProps = {
    open: boolean;
    roles: Roles[];
    onOpenChange: (open: boolean) => void;
    onCreate: (values: UserFormValues) => Promise<void> | void;
};

export function CreateUserDialog({
                                     open,
                                     roles,
                                     onOpenChange,
                                     onCreate,
                                 }: CreateUserDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={contentClass}>
        <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
    <DialogDescription className="text-neutral-600">
        Add a new user and choose their role.
    </DialogDescription>
    </DialogHeader>

    {open && (
        <UserForm
            initial={{ username: "", password: "", role: "user" }}
            roles={roles}
        passwordOptional={false}
        submitLabel="Create"
        onCancel={() => onOpenChange(false)}
        onSubmit={async (values) => {
        await onCreate(values);
        onOpenChange(false);
    }}
        />
    )}
    </DialogContent>
    </Dialog>
);
}

type UpdateUserDialogProps = {
    open: boolean;
    roles: Roles[];
    onOpenChange: (open: boolean) => void;
    user: EditableUser | null;
    onUpdate: (id: number, values: UserFormValues) => Promise<void> | void;
};

export function UpdateUserDialog({open, roles, onOpenChange, user, onUpdate}: UpdateUserDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={contentClass}>
                <DialogHeader>
                    <DialogTitle>Update user</DialogTitle>
                    <DialogDescription className="text-neutral-600"> Change the users details. Leave the password empty to keep it. </DialogDescription>
                </DialogHeader>
                {open && user && (
                    <UserForm key={user.id} initial={{ username: user.username, password: "", role: user.role }} roles={roles} passwordOptional submitLabel="Save changes" onCancel={() => onOpenChange(false)} onSubmit={async (values) => { await onUpdate(user.id, values); onOpenChange(false);}}/>
                )}
            </DialogContent>
        </Dialog>
    );
}


type DeleteUserDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserDto | null;
    /** Call your delete endpoint. Throw to show an error and keep the dialog open. */
    onDelete: (id: number) => Promise<void> | void;
};

export function DeleteUserDialog({
                                     open,
                                     onOpenChange,
                                     user,
                                     onDelete,
                                 }: DeleteUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpenChange(next: boolean) {
        if (loading) return;
        if (!next) setError(null);
        onOpenChange(next);
    }

    async function handleConfirm() {
        if (!user) return;
        setError(null);
        try {
            setLoading(true);
            await onDelete(user.id!);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="border-2 border-black bg-white text-black sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete user?</AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-600">
                        This will permanently delete{" "}
                        <span className="font-semibold text-black">
              {user?.username ?? "this user"}
            </span>
                        . This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {error && (
                    <div
                        role="alert"
                        className="border border-black px-3 py-2 text-sm font-medium"
                    >
                        {error}
                    </div>
                )}

                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel
                        disabled={loading}
                        className="border border-black bg-white text-black hover:bg-neutral-100" variant={undefined}
                        size={undefined}                    >
                        Cancel
                    </AlertDialogCancel>

                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-black text-white hover:bg-neutral-800"
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
