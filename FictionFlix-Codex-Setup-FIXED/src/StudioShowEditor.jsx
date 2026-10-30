import React,{useState} from 'react';
import {Check,Play,X} from 'lucide-react';
import {getYouTubeEmbedUrl} from './contentStore.js';
import './studioUploads.css';

export default function StudioShowEditor({show,categories,onClose,onSave,isSaving=false}){
 const initialUrls=Array.isArray(show.youtubeUrls)&&show.youtubeUrls.length?show.youtubeUrls:show.youtubeUrl?[show.youtubeUrl]:[];
 const [youtubeUrls,setYoutubeUrls]=useState(initialUrls.join('\n'));
 const [category,setCategory]=useState(show.category||categories[0]?.name||'');
 const [subcategory,setSubcategory]=useState(show.subcategory||'');
 const lines=youtubeUrls.split(/\r?\n/).map(url=>url.trim()).filter(Boolean);
 const embeds=lines.map(getYouTubeEmbedUrl);
 const invalid=embeds.some(url=>!url);
 const preview=embeds.find(Boolean);
 const subcategories=categories.find(item=>item.name===category)?.children||[];

 return <div className="cmsModalBackdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!isSaving)onClose()}}>
  <section className="showEditor" role="dialog" aria-modal="true" aria-labelledby="editorTitle">
   <header>
    <div><span className="cmsEyebrow">{show.id?'EDIT SHOW':'NEW STORY'}</span><h2 id="editorTitle">{show.id?'Shape the next chapter':'Create a show'}</h2></div>
    <button className="editorClose" onClick={onClose} aria-label="Close editor" disabled={isSaving}><X size={19}/></button>
   </header>
   <form onSubmit={onSave}>
    <div className="editorFields">
     <label className="fieldWide"><span>SHOW TITLE <i>*</i></span><input name="title" defaultValue={show.title} placeholder="Give your story a name" required maxLength="90" autoFocus/></label>
     <label><span>FORMAT</span><select name="format" defaultValue={show.format}><option>Vertical drama</option><option>Audio drama</option><option>Book</option><option>Multi-format</option></select></label>
     <label><span>CATEGORY</span><select name="category" value={category} onChange={event=>{setCategory(event.target.value);setSubcategory('')}} required><option value="">Choose category</option>{categories.map(item=><option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
     <label><span>SUBCATEGORY</span><select name="subcategory" value={subcategory} onChange={event=>setSubcategory(event.target.value)}><option value="">Choose subcategory</option>{subcategories.map(option=><option key={option} value={option}>{option}</option>)}</select></label>
     <label><span>STORYBEATS</span><input name="beats" type="number" min="1" max="100000" defaultValue={show.beats||1}/></label>
     <label className="fieldWide"><span>SHORT SYNOPSIS</span><textarea name="description" defaultValue={show.description} rows="3" placeholder="What makes this story unforgettable?" maxLength="260"/></label>
     <label className="fieldWide assetField"><span>POSTER ARTWORK</span><input name="poster" defaultValue={show.poster} placeholder="Paste an image URL or upload a file"/><input name="posterFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif"/><small>PNG, JPG, WebP or AVIF · max 8 MB. A selected file replaces the URL.</small></label>
     <label className="fieldWide assetField"><span>HERO ARTWORK</span><input name="hero" defaultValue={show.hero} placeholder="Paste an image URL or upload a file"/><input name="heroFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif"/><small>PNG, JPG, WebP or AVIF · max 8 MB. A selected file replaces the URL.</small></label>
     <label className="fieldWide"><span>FULL BOOK STORY <small>OPTIONAL · SEPARATE PARAGRAPHS WITH A BLANK LINE</small></span><textarea className="bookContentInput" name="bookContent" defaultValue={show.bookContent||''} rows="9" placeholder="Paste or write the complete story here. It will appear in the reader after publishing."/></label>
     <label className="fieldWide"><span>YOUTUBE VIDEOS <small>ONE VIDEO OR PLAYLIST URL PER LINE</small></span><div className="videoUrlList"><Play size={17}/><textarea name="youtubeUrls" value={youtubeUrls} onChange={event=>setYoutubeUrls(event.target.value)} rows="4" placeholder={'https://youtube.com/watch?v=...\nhttps://youtu.be/...\nhttps://youtube.com/playlist?list=...'}/></div><small className="videoUrlHelp">Add as many individual video links as needed, or add a YouTube playlist URL.</small></label>
    </div>
    {lines.length>0&&<div className={`embedPreview ${invalid?'invalid':''}`}>{preview?<><iframe src={preview} title="YouTube video preview" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><span><Check size={14}/> {lines.length} {lines.length===1?'video':'videos'} · Preview ready</span></>:<span>Check each URL. Use YouTube video, shorts, live, embed, or playlist links.</span>}</div>}
    <footer><span><i/> {lines.length} VIDEO{lines.length===1?'':'S'} · {isSaving?'SAVING...':'DRAFT UNTIL PUBLISHED'}</span><div><button type="button" className="cmsCancel" onClick={onClose} disabled={isSaving}>Cancel</button><button className="cmsPrimary" disabled={isSaving||invalid}><Check size={16}/>{isSaving?'Uploading...':show.id?'Save changes':'Create draft'}</button></div></footer>
   </form>
  </section>
 </div>;
}