import React,{useState} from 'react';
import {BookOpen,ChevronLeft,ChevronRight,Headphones,Maximize2} from 'lucide-react';
import {getShowVideoUrls,getYouTubeEmbedUrl} from './contentStore.js';

export default function EpisodeVideo({story,onSwitch}){
 const [pip,setPip]=useState(false);
 const [activeIndex,setActiveIndex]=useState(0);
 const urls=getShowVideoUrls(story);
 const hasYouTube=urls.length>0;
 const activeUrl=urls[Math.min(activeIndex,urls.length-1)]||'';
 const embedUrl=getYouTubeEmbedUrl(activeUrl);
 const playerUrl=embedUrl?`${embedUrl}${embedUrl.includes('?')?'&':'?'}playsinline=1&rel=0`:'';
 return <div className="experience videoExp">
  {(!hasYouTube||urls.length>1)&&<div className="videoTop"><button onClick={()=>onSwitch('book')} aria-label="Read this story"><BookOpen/></button><button onClick={()=>onSwitch('audio')} aria-label="Listen to this story"><Headphones/></button>{!hasYouTube&&<><button onClick={()=>setPip(!pip)} aria-label="Picture in picture">▣</button><button aria-label="Fullscreen"><Maximize2/></button></>}</div>}
  <div className={`videoFrame ${hasYouTube?'youtubeFrame':''}`}>
   {hasYouTube?<iframe key={`${story.id}-${activeIndex}`} title={`${story.title} video ${activeIndex+1}`} src={playerUrl} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen style={{width:'100%',height:'100%',position:'absolute',inset:0,border:0,background:'#000'}}/>:<><div className="videoArt"><img src="/assets/experience-vertical.png" alt="Vertical Drama"/></div><div className="videoShade"/><div className="videoMeta"><span>MICRO DRAMA · 1:1 · STORYBEAT {story.beats}</span><h2>{story.title}</h2><p>Episode 01 · Scene 21</p><input type="range" min="0" max="100" defaultValue="34"/></div></>}
  </div>
  {hasYouTube&&urls.length>1&&<div className="episodeSwitch"><button onClick={()=>setActiveIndex(index=>(index-1+urls.length)%urls.length)} aria-label="Previous episode"><ChevronLeft size={16}/></button><span>VIDEO {activeIndex+1} <i/> {urls.length}</span><button onClick={()=>setActiveIndex(index=>(index+1)%urls.length)} aria-label="Next episode"><ChevronRight size={16}/></button></div>}
  {pip&&!hasYouTube&&<div className="pip"><button onClick={()=>setPip(false)}>×</button><img src="/assets/experience-vertical.png" alt="Vertical Drama"/><span>Picture-in-Picture · StoryBeat {story.beats}</span></div>}
 </div>
}