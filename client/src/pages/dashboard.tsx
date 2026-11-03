import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "../components/ui/table.tsx";
import type {Actor, UserDto} from "@/src/api/Api.ts";
import {api} from "@/src/client.ts";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    CreateUserDialog,
    DeleteUserDialog,
    type EditableUser,
    UpdateUserDialog,
    type UserFormValues
} from "@/src/components/dialogs.tsx";
import {useAuth} from "@/src/components/authProvider.tsx";
import {assignableRoles, canModify} from "@/src/RolesEnum.ts";

export function DashboardView() {

    const navigate = useNavigate();
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<EditableUser | null>(null);
    const [deleting, setDeleting] = useState<UserDto | null>(null);
    const { user, loading, refresh, logout } = useAuth();
    const [users, setUsers] = useState<UserDto[]>([]);


    const handleLogout = async () => {
        try {
            await api.api.authLogoutCreate();
        } catch (err) {
            console.error(err);
        }
        finally {
            await refresh();
        }

        navigate("/", { replace: true });
    };

    useEffect(() => {
        api.api.usersList().then(setUsers).catch((err) => console.log(err));
    }, []);

    const handleCreate = async (values: UserFormValues) => {
        await api.api.usersCreate({username: values.username, password: values.password, role: values.role}).catch((err) => console.log(err));
        window.location.reload();
    }

    const handleUpdate = async (id: number, values: UserFormValues) => {
        await api.api.usersUpdate({id: id}, {username: values.username, password: values.password, role: values.role}).catch((err) => console.log(err));
        window.location.reload();
    }

    const handleDelete = async (id: number) => {
        await api.api.usersDelete({id: id}).catch((err) => console.log(err));
        window.location.reload();
    }

    return (
        <div className="flex justify-center items-center w-full h-full gap-12 overflow-y-auto">
            <UserTable user={user} users={users} setEditing={setEditing} setDeleting={setDeleting}/>
            <p>Logged in as <b>{users.find(u => u.id === user?.id)?.username}</b> ({user?.role})</p>
            {assignableRoles(user).length > 0 && (
                <button onClick={() => setCreateOpen(true)} className="flex items-center justify-center w-25 h-10 border rounded-xl bg-black text-white">Add User</button>

            )}
            <button onClick={handleLogout} className="flex items-center justify-center w-25 h-10 border rounded-xl bg-black text-white">Log out</button>
            <CreateUserDialog roles={assignableRoles(user)} open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate}/>
            <UpdateUserDialog open={editing !== null} roles={assignableRoles(user)} onOpenChange={(open) => {if (!open) setEditing(null)}} user={editing} onUpdate={handleUpdate}/>
            <DeleteUserDialog
                open={deleting !== null}
                onOpenChange={(open) => { if (!open) setDeleting(null); }}
                user={deleting}
                onDelete={handleDelete}
            />
        </div>
    );
}

function UserTable({user, users, setEditing, setDeleting}: {user: Actor | null, users: UserDto[], setEditing: (editing: EditableUser | null) => void, setDeleting: (deleting: UserDto | null) => void}) {

    return (
        <div className="p-2 border rounded-xl">
            <Table className="w-100">
                <TableCaption>A list of active users.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-bold">Username</TableHead>
                        {user?.role !== "user" && <TableHead className="font-bold">Role</TableHead>}
                        <TableHead/>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(u =>
                        <TableRow key={u.id} className="group">
                            <TableCell>{u.username}</TableCell>
                            {user?.role !== "user" && <TableCell>{u.role}</TableCell>}
                            <TableCell>
                                {canModify(user, u.role!) && <div className="flex justify-end gap-4 invisible group-hover:visible">
                                    <button onClick={() => setEditing({username: u.username!, id: u.id!, role: u.role!})}>Edit</button>
                                    <button onClick={() => setDeleting({ id: u.id, username: u.username, role: u.role })}>Delete</button>
                                </div>}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

}