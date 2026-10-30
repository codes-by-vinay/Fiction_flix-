import React,{useState} from 'react';
import {ArrowLeft,LoaderCircle,X} from 'lucide-react';
import {apiRequest} from './apiClient.js';
import {validateAuthInput} from './authValidation.js';

export default function AuthDialog({type,onClose,onSuccess}){
 const [mode,setMode]=useState(type==='signup'?'signup':type==='update'?'update':'login');
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [verificationEmail,setVerificationEmail]=useState('');
 const resetToken=new URLSearchParams(window.location.search).get('token');
 const submit=async(event)=>{
  event.preventDefault();setError('');setMessage('');setBusy(true);
  const form=new FormData(event.currentTarget);
  const email=String(form.get('email')||'').trim();
  const password=String(form.get('password')||'');
  if(mode==='login'||mode==='signup'){
   const validationError=validateAuthInput(email,password,mode,String(form.get('name')||''));
   if(validationError){setError(validationError.message);setBusy(false);return}
  }
  try{
   if(mode==='signup'){
    const result=await apiRequest('/api/auth/signup',{method:'POST',body:JSON.stringify({name:String(form.get('name')||''),email,password,ownerSetupToken:String(form.get('ownerSetupToken')||'')})});
    setVerificationEmail(email);setMessage(result.message);setMode('login');
   }else if(mode==='reset'){
    const result=await apiRequest('/api/auth/reset-password',{method:'POST',body:JSON.stringify({email})});
    setMessage(result.message);
   }else if(mode==='update'){
    const result=await apiRequest('/api/auth/reset-password/confirm',{method:'POST',body:JSON.stringify({token:resetToken,password})});
    if(result.status==='success'){setMessage('Your password has been updated. You can sign in with the new password.');setMode('login')}
   }else{
    const result=await apiRequest('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});
    onSuccess?.(result.user);onClose();
   }
  }catch(requestError){setError(requestError.message||'Authentication failed. Please try again.');if(requestError.code==='email_not_verified'||requestError.code==='verification_email_unavailable'||requestError.code==='verification_email_failed')setVerificationEmail(email)}
  finally{setBusy(false)}
 };
 const resendVerification=async()=>{setError('');setMessage('');setBusy(true);try{const result=await apiRequest('/api/auth/verify-email/resend',{method:'POST',body:JSON.stringify({email:verificationEmail})});setMessage(result.message)}catch(requestError){setError(requestError.message||'Could not resend the verification email.')}finally{setBusy(false)}};
 const title=mode==='signup'?'Create your account':mode==='reset'?'Reset your password':mode==='update'?'Choose a new password':'Welcome back';
 return <div className="modalBackdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><div className="authModal" role="dialog" aria-modal="true" aria-labelledby="authTitle"><button className="close" onClick={onClose} aria-label="Close sign in"><X/></button><img src="/assets/fictionflix-logo.png" alt="FictionFlix"/><span className="sectionKicker">FICTIONFLIX</span><h2 id="authTitle">{title}</h2><form className="authForm" noValidate={mode==='login'||mode==='signup'} onSubmit={submit}>{mode==='signup'&&<><label><span>Full name</span><input name="name" type="text" autoComplete="name" maxLength="80" required/></label><label><span>Owner setup token <small>ONLY FOR THE SITE OWNER</small></span><input name="ownerSetupToken" type="password" autoComplete="off" placeholder="Leave blank for a regular account"/></label></>}{mode!=='update'&&<label><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength="254" required/></label>}{mode!=='reset'&&<label><span>Password</span><input name="password" type="password" autoComplete={mode==='signup'||mode==='update'?'new-password':'current-password'} minLength="8" maxLength="128" placeholder={mode==='signup'?'8–128 characters':'At least 8 characters'} required/>{mode==='signup'&&<small className="authPasswordHint">Use 8–128 characters. Letters, numbers, symbols and spaces are allowed.</small>}</label>}{error&&<p className="authMessage error" role="alert">{error}</p>}{message&&<p className="authMessage" role="status">{message}</p>}<button className="red" disabled={busy||(mode==='update'&&!resetToken)}>{busy?<LoaderCircle size={16} className="authSpinner"/>:null}{mode==='signup'?'Create account':mode==='reset'?'Send reset link':mode==='update'?'Update password':'Sign in'}</button></form>{verificationEmail&&<button className="red" type="button" disabled={busy} onClick={resendVerification}>Resend verification email</button>}<div className="authLinks">{mode==='login'?<><button onClick={()=>{setMode('reset');setError('');setMessage('')}}>Forgot password?</button><span>New to FictionFlix?</span><button onClick={()=>{setMode('signup');setError('');setMessage('')}}>Create account</button></>:<button onClick={()=>{setMode('login');setError('');setMessage('')}}><ArrowLeft size={13}/> Back to sign in</button>}</div></div></div>
}
