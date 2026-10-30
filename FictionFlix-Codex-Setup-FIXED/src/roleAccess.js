export const dashboardRoutes = {
 member:{path:'/dashboard/member',api:'/api/dashboard/member',title:'Member Dashboard',allowedRoles:['member','owner','admin']},
 team:{path:'/dashboard/team',api:'/api/dashboard/team',title:'Team Dashboard',allowedRoles:['team','owner','admin']},
 owner:{path:'/dashboard/owner',api:'/api/dashboard/owner',title:'Owner Dashboard',allowedRoles:['owner','admin']},
 admin:{path:'/dashboard/admin',api:'/api/dashboard/admin',title:'Admin Dashboard',allowedRoles:['admin']},
};

const roleDashboard = {
 member:'/dashboard/member',
 team:'/dashboard/team',
 owner:'/dashboard/owner',
 admin:'/dashboard/admin',
};

export function dashboardPathForRole(role){
 return roleDashboard[role]||'/';
}

export function dashboardLinksForRole(role){
 const roleLinks={
  user:[],
  member:[['Member Dashboard','/dashboard/member']],
  team:[['Team Dashboard','/dashboard/team']],
  owner:[['Member Dashboard','/dashboard/member'],['Team Dashboard','/dashboard/team'],['Owner Dashboard','/dashboard/owner']],
  admin:[['Member Dashboard','/dashboard/member'],['Team Dashboard','/dashboard/team'],['Owner Dashboard','/dashboard/owner'],['Admin Dashboard','/dashboard/admin']],
 };
 return roleLinks[role]||[];
}
