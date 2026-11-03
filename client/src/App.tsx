import "./index.css";
import {Route, Routes} from "react-router-dom";
import {LoginView} from "./pages/login";
import {DashboardView} from "./pages/dashboard.tsx";
import {useState} from "react";
import type {Actor, UserDto} from "./api/Api.ts";
import type {Roles} from "./RolesEnum.ts";

export function App() {

    const [user, setUser] = useState<Actor | null>();

    return (
        <div className="flex w-full h-screen items-center justify-center">
            <Routes>
                <Route path={"/"} element={<LoginView/>}/>
                <Route path={"/dashboard"} element={<DashboardView/>}/>
            </Routes>
        </div>
    );
}

export default App;
