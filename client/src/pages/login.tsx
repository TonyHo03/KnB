import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/src/components/ui/card.tsx";
import {Input} from "../components/ui/input";

export function LoginView() {
    return (
        <Card className="w-125">
            <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>Enter your email and password below</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <h1>Email:</h1>
                    <Input/>
                </div>
                <div className="flex flex-col gap-4">
                    <h1>Password:</h1>
                    <Input/>
                </div>
                <div/>
            </CardContent>
            <CardFooter className="flex justify-center items-center">
                <button className="flex justify-center items-center w-full h-10 bg-black text-white rounded-lg">Login</button>
            </CardFooter>
        </Card>
    );
}