import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboardLinksForRole,dashboardPathForRole,dashboardRoutes} from './roleAccess.js';

test('public users have no dashboard access and land on the home page',()=>{
 assert.equal(dashboardPathForRole('user'),'/');
 assert.deepEqual(dashboardLinksForRole('user'),[]);
});

test('elevated roles redirect to their own dashboard',()=>{
 for(const role of ['member','team','owner','admin']){
  assert.equal(dashboardPathForRole(role),`/dashboard/${role}`);
 }
});

test('higher privilege roles see only dashboards allowed by the backend matrix',()=>{
 assert.deepEqual(dashboardLinksForRole('member'),[['Member Dashboard','/dashboard/member']]);
 assert.deepEqual(dashboardLinksForRole('team'),[['Team Dashboard','/dashboard/team']]);
 assert.deepEqual(dashboardLinksForRole('owner'),[
  ['Member Dashboard','/dashboard/member'],
  ['Team Dashboard','/dashboard/team'],
  ['Owner Dashboard','/dashboard/owner'],
 ]);
 assert.deepEqual(dashboardLinksForRole('admin'),[
  ['Member Dashboard','/dashboard/member'],
  ['Team Dashboard','/dashboard/team'],
  ['Owner Dashboard','/dashboard/owner'],
  ['Admin Dashboard','/dashboard/admin'],
 ]);
});

test('each dashboard uses its protected API and exact access matrix',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(dashboardRoutes).map(([key,route])=>[
  key,{path:route.path,api:route.api,allowedRoles:route.allowedRoles},
 ])),{
  member:{path:'/dashboard/member',api:'/api/dashboard/member',allowedRoles:['member','owner','admin']},
  team:{path:'/dashboard/team',api:'/api/dashboard/team',allowedRoles:['team','owner','admin']},
  owner:{path:'/dashboard/owner',api:'/api/dashboard/owner',allowedRoles:['owner','admin']},
  admin:{path:'/dashboard/admin',api:'/api/dashboard/admin',allowedRoles:['admin']},
 });
});
