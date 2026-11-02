import { Routes,Route,Navigate } from "react-router-dom";
import { useEffect,useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectBoard from "./pages/ProjectBoard";
import Notifications from "./pages/Notifications";
const socketUrl=import.meta.env.VITE_SOCKET_URL||"http://localhost:5000";
function LiveConnection(){const {user}=useAuth();const [live,setLive]=useState(false);useEffect(()=>{if(!user)return;const socket=io(socketUrl);socket.on("connect",()=>{setLive(true);socket.emit("join",user.id)});socket.on("disconnect",()=>setLive(false));socket.on("notification",()=>window.dispatchEvent(new Event("taskflow-notification")));return()=>socket.disconnect()},[user]);return null;}
export default function App(){return <><LiveConnection/><Routes><Route path="/login" element={<Auth mode="login"/>}/><Route path="/register" element={<Auth mode="register"/>}/><Route path="/" element={<ProtectedRoute><Layout/></ProtectedRoute>}><Route index element={<Dashboard/>}/><Route path="projects" element={<Projects/>}/><Route path="projects/:id" element={<ProjectBoard/>}/><Route path="notifications" element={<Notifications/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></>}
