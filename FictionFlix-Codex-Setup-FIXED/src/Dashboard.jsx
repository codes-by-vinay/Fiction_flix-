import React,{useEffect,useState} from 'react';
import {ArrowLeft,BookOpen,Clapperboard,ShieldCheck,Users} from 'lucide-react';
import {apiRequest} from './apiClient.js';
import {dashboardRoutes} from './roleAccess.js';
import './dashboard.css';

export default function Dashboard(){
 const route=Object.values(dashboardRoutes).find(item=>item.path===window.location.pathname);
 if(!route)return <main className="dashboardShell"><p>Dashboard not found.</p><a href="/">Back to FictionFlix</a></main>;
 return <ProtectedRoute route={route}/>;
}

function ProtectedRoute({route}){
 const [state,setState]=useState({status:'loading',data:null,error:''});
 useEffect(()=>{
  let active=true;
  apiRequest(route.api).then(data=>{
   if(!active)return;
   if(!route.allowedRoles.includes(data.user?.role)){
    setState({status:'denied',data:null,error:'Your account does not have access to this dashboard.'});
    return;
   }
   setState({status:'ready',data,error:''});
  }).catch(error=>{
   if(!active)return;
   if(error.status===401){window.location.replace('/login');return}
   setState({status:error.status===403?'denied':'error',data:null,error:error.message||'Could not verify dashboard access.'});
  });
  return()=>{active=false};
 },[route]);

 if(state.status==='loading')return <main className="dashboardShell"><p role="status">Verifying dashboard access…</p></main>;
 if(state.status!=='ready')return <main className="dashboardShell"><a className="dashboardBack" href="/"><ArrowLeft size={16}/> FictionFlix home</a><section className="dashboardPanel"><ShieldCheck/><h1>{state.status==='denied'?'Access denied':'Dashboard unavailable'}</h1><p role="alert">{state.error}</p></section></main>;
 return <DashboardContent route={route} user={state.data.user}/>;
}

function DashboardContent({route,user}){
 const sections={
  member:{icon:BookOpen,kicker:'YOUR FICTIONFLIX',description:'Pick up your stories, discover new worlds and keep your reading journey in one place.',actions:[['Browse stories','/'],['My profile','/User.html']]},
  team:{icon:Users,kicker:'TEAM WORKSPACE',description:'Open the FictionFlix Studio to create, organize and publish stories.',actions:[['Open Studio','/admin'],['Browse published stories','/']]},
  owner:{icon:Clapperboard,kicker:'OWNER CONTROL',description:'Manage your content workspace and assign account access to the FictionFlix team.',actions:[['Manage Studio','/admin'],['View site','/']]},
  admin:{icon:ShieldCheck,kicker:'PLATFORM ADMINISTRATION',description:'Manage platform roles and access the content workspace.',actions:[['Manage accounts','/dashboard/admin#accounts'],['Open Studio','/admin']]},
 };
 const section=sections[route.title.split(' ')[0].toLowerCase()];
 const Icon=section.icon;
 return <main className="dashboardShell">
  <aside className="dashboardSidebar">
   <a className="dashboardBrand" href="/"><img src="/assets/fictionflix-logo.png" alt="FictionFlix"/></a>
   <span className="dashboardRole">{user.role} account</span>
   {Object.values(dashboardRoutes).filter(item=>item.allowedRoles.includes(user.role)).map(item=><a key={item.path} className={item.path===route.path?'active':''} href={item.path}>{item.title}</a>)}
   {['team','owner','admin'].includes(user.role)&&<a href="/admin">Studio</a>}
   <a className="dashboardHome" href="/">Back to FictionFlix</a>
  </aside>
  <div className="dashboardMain">
   <header className="dashboardTopbar"><span>{user.name||user.email}</span><a href="/User.html">My profile</a></header>
   <section className="dashboardWelcome"><span className="dashboardKicker">{section.kicker}</span><Icon size={28}/><h1>{route.title}</h1><p>{section.description}</p><div className="dashboardActions">{section.actions.map(([label,href])=><a key={href} href={href}>{label}</a>)}</div></section>
   {user.role==='admin'&&route.title==='Admin Dashboard'&&<AdminRoleManagement/>}
   {user.role==='owner'&&route.title==='Owner Dashboard'&&<section className="dashboardPanel"><h2>Account access</h2><p>Use the Studio team page to grant or remove member, team and admin roles.</p><a href="/admin">Open Studio access management</a></section>}
  </div>
 </main>;
}

function AdminRoleManagement(){
 const [users,setUsers]=useState([]);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  apiRequest('/api/studio/users').then(({users:accounts})=>{if(active)setUsers(accounts||[])}).catch(requestError=>{if(active)setError(requestError.message||'Could not load accounts.')}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 const changeRole=async(email,role)=>{
  setError('');setMessage('');
  try{
   await apiRequest('/api/admin/update-role',{method:'PUT',body:JSON.stringify({email,role})});
   setUsers(current=>current.map(account=>account.email===email?{...account,role}:account));
   setMessage(`Updated ${email} to ${role}.`);
  }catch(requestError){setError(requestError.message||'Could not update this account role.')}
 };
 return <section className="dashboardPanel" id="accounts"><h2>Account roles</h2><p>Role changes are enforced by the server on every protected request.</p>{loading?<p>Loading accounts…</p>:<div className="dashboardTableWrap"><table><thead><tr><th>Account</th><th>Email</th><th>Role</th></tr></thead><tbody>{users.map(account=><tr key={account.id}><td>{account.name}</td><td>{account.email}</td><td><select value={account.role} onChange={event=>changeRole(account.email,event.target.value)} aria-label={`Role for ${account.email}`}>{['user','member','team','owner','admin'].map(role=><option key={role} value={role}>{role}</option>)}</select></td></tr>)}</tbody></table></div>}{message&&<p className="dashboardSuccess" role="status">{message}</p>}{error&&<p className="dashboardError" role="alert">{error}</p>}</section>;
}
