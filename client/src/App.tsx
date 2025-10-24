import "./App.css";
import Router from "./Router";
import { RouterProvider } from "react-router/dom";
import { AuthProvider } from "./contexts/AuthContext";

function App(){
  return(
    <AuthProvider>
      <RouterProvider router={Router} />
    </AuthProvider>
  );
}

export default App;