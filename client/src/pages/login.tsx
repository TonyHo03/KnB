import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/src/components/ui/card.tsx";
import {Input} from "../components/ui/input";
import {useEffect, useState} from "react";
import {api} from "@/src/client.ts";
import type {UserDto} from "@/src/api/Api.ts";
import type {Roles} from "@/src/RolesEnum.ts";
import type {Actor} from "../api/Api.ts";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../components/authProvider.tsx";

export function LoginView() {

    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const { user, loading, refresh, logout } = useAuth();
    const navigate = useNavigate()

    const handleLogin = async () => {
        try {
            await api.api.authLoginCreate({ username, password });
        } catch (err) {
            console.error(err);
            throw new Error("Invalid username or password.");
        }
        await refresh();
        navigate("/dashboard", { replace: true });
    };

    useEffect(() => {

        if (user != null) navigate("/dashboard", {replace: true});

    }, [user, navigate]);

    return (
        <Card className="w-125">
            <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>Enter your email and password below</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <h1>Email:</h1>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div className="flex flex-col gap-4">
                    <h1>Password:</h1>
                    <Input value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div/>
            </CardContent>
            <CardFooter className="flex justify-center items-center">
                <button onClick={handleLogin} className="flex justify-center items-center w-full h-10 bg-black text-white rounded-lg">Login</button>
            </CardFooter>
        </Card>
    );
}