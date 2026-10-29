import "./index.css";
import {Route, Routes} from "react-router-dom";
import {LoginView} from "./pages/login";
import {DashboardView} from "./pages/dashboard.tsx";

export function App() {
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
