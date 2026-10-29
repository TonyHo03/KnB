import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "../components/ui/table.tsx";

export function DashboardView() {
    return (
        <div className="flex justify-center items-center w-full h-full gap-12 overflow-y-auto">
            <UserTable/>
            <button className="flex items-center justify-center w-25 h-10 border rounded-xl bg-black text-white">Add User</button>
        </div>
    );
}

function UserTable() {

    return (
        <div className="p-2 border rounded-xl">
            <Table className="w-100">
                <TableCaption>A list of active users.</TableCaption>
                <TableHeader className="">
                    <TableRow>
                        <TableHead className="font-bold">Username</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow className="group relative flex items-center">
                        <TableCell>Isma159</TableCell>
                        <div className="flex absolute right-1 gap-4 invisible group-hover:visible">
                            <button>Edit</button>
                            <button>Delete</button>
                        </div>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );

}