import {apiRequest} from './apiClient.js';

export const SHOWS_KEY='fictionflix.cms.shows.v1';
export const CATEGORIES_KEY='fictionflix.cms.categories.v1';
export const CONTENT_VERSION_KEY='fictionflix.cms.contentVersion';
export const CMS_CHANGE_EVENT='fictionflix:contentchange';

export const baseStories=[
 {id:1,title:'रहस्यमयी हवेली',genre:'Horror · Mystery',category:'Horror',subcategory:'Mystery',beats:84,tag:'ORIGINAL',poster:'/assets/story-rahasyamayi-haveli.png',hero:'/assets/hero-rahasyamayi-haveli.png',detail:null,accent:'crimson',featured:true,description:'एक पुरानी हवेली, एक बंद दरवाज़ा और लौटती हुई आवाज़ें।'},
 {id:2,title:'अधूरी मोहब्बत',genre:'Romance · Drama',category:'Romance',subcategory:'Drama',beats:62,tag:'NEW',poster:'/assets/story-adhuri-mohabbat.png',hero:'/assets/hero-adhuri-mohabbat.png',detail:null,accent:'rose',featured:true,description:'समय और दूरी से आगे बढ़ती एक मोहब्बत।'},
 {id:3,title:'काला सच',genre:'Thriller · Crime',category:'Thriller',subcategory:'Crime',beats:71,tag:'TRENDING',poster:'/assets/story-kala-sach.png',hero:'/assets/hero-kala-sach.png',detail:'/assets/detail-kala-sach.png',accent:'violet',featured:true,description:'हर जवाब एक नया राज़ खोलता है।'},
 {id:4,title:'नागलोक',genre:'Mythology · Fantasy',category:'Mythology',subcategory:'Fantasy',beats:55,tag:'ORIGINAL',poster:'/assets/story-naglok.png',hero:'/assets/hero-naglok.png',detail:'/assets/detail-naglok.png',accent:'teal',featured:true,description:'पुरानी कथाओं का एक नया संसार।'},
 {id:5,title:'वापसी',genre:'Supernatural · Horror',category:'Horror',subcategory:'Supernatural',beats:48,tag:'NEW',poster:'/assets/story-wapasi.png',hero:null,detail:null,accent:'ember',featured:false,description:'कुछ कहानियाँ लौटकर फिर दरवाज़ा खटखटाती हैं।'},
 {id:6,title:'वीरगाथा',genre:'Historical · War Romance',category:'Historical',subcategory:'War Romance',beats:76,tag:'ORIGINAL',poster:'/assets/story-veergatha.png',hero:null,detail:null,accent:'gold',featured:false,description:'इतिहास, साहस और एक अमर प्रेम की कहानी।'},
 {id:7,title:'खोया खज़ाना',genre:'Adventure · Mystery',category:'Adventure',subcategory:'Mystery',beats:68,tag:'TRENDING',poster:'/assets/story-khoya-khazana.png',hero:'/assets/hero-khoya-khazana.png',detail:'/assets/detail-khoya-khazana.png',accent:'amber',featured:true,description:'नक्शे के आख़िरी निशान से शुरू होता सफ़र।'},
 {id:8,title:'गुमनाम',genre:'Mystery · Thriller',category:'Mystery',subcategory:'Thriller',beats:59,tag:'NEW',poster:'/assets/story-gumnaam.png',hero:null,detail:null,accent:'indigo',featured:false,description:'हर सुराग किसी अनजान चेहरे तक ले जाता है।'},
 {id:9,title:'सांध्य रहस्य',genre:'Himalayan · Spiritual Mystery',category:'Spiritual',subcategory:'Himalayan Mystery',beats:64,tag:'ORIGINAL',poster:'/assets/story-sandhya-rahasya.png',hero:null,detail:null,accent:'ice',featured:false,description:'हिमालय की ख़ामोशी में छिपा एक प्राचीन रहस्य।'},
 {id:10,title:'अनंत',genre:'Sci-Fi · Dystopian Thriller',category:'Sci-Fi',subcategory:'Dystopian Thriller',beats:93,tag:'TRENDING',poster:'/assets/story-anant.png',hero:null,detail:null,accent:'blue',featured:false,description:'भविष्य की आख़िरी उम्मीद एक कहानी में छिपी है।'},
];

export const baseCategories=[
 {id:'category-horror',name:'Horror',description:'रात के बाद भी कहानी खत्म नहीं होती।',children:['Mystery','Supernatural']},
 {id:'category-romance',name:'Romance',description:'कुछ रिश्ते समय से बाहर होते हैं।',children:['Drama']},
 {id:'category-thriller',name:'Thriller',description:'हर जवाब एक नया सवाल खोलता है।',children:['Crime']},
 {id:'category-mythology',name:'Mythology',description:'पुरानी कथाएँ, नया cinematic अनुभव।',children:['Fantasy']},
 {id:'category-adventure',name:'Adventure',description:'जहाँ नक्शे खत्म होते हैं, कहानी शुरू होती है।',children:['Mystery']},
 {id:'category-historical',name:'Historical',description:'बीते दौर की अनकही दास्तानें।',children:['War Romance']},
 {id:'category-mystery',name:'Mystery',description:'हर सुराग एक नई दुनिया खोलता है।',children:['Thriller']},
 {id:'category-spiritual',name:'Spiritual',description:'रहस्य और आस्था के बीच की कहानियाँ।',children:['Himalayan Mystery']},
 {id:'category-scifi',name:'Sci-Fi',description:'कल की दुनिया से आई कहानियाँ।',children:['Dystopian Thriller']},
];

const readArray=(key)=>{try{const value=JSON.parse(localStorage.getItem(key));return Array.isArray(value)?value:null}catch{return null}};
const writeRaw=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
const toManagedShow=(story)=>({...story,id:`show-${story.id}`,format:story.title==='अधूरी मोहब्बत'?'Audio drama':story.title==='नागलोक'?'Book':'Vertical drama',status:'Published',updatedAt:'2026-09-28',youtubeUrl:'',youtubeUrls:[],poster:story.poster||'',hero:story.hero||'',featured:Boolean(story.featured)});
const defaultShows=baseStories.map(toManagedShow);

function migrateLegacyContent(){
 let version=0;
 try{version=Number(localStorage.getItem(CONTENT_VERSION_KEY)||0)}catch{return}
 if(version>=3)return;
 const savedShows=readArray(SHOWS_KEY);
 if(savedShows){
  const savedByTitle=new Map(savedShows.map(show=>[show.title,show]));
  const merged=defaultShows.map(seed=>{const saved=savedByTitle.get(seed.title);return saved?{...seed,...saved,status:saved.id===seed.id?seed.status:saved.status,youtubeUrls:saved.youtubeUrls?.length?saved.youtubeUrls:saved.youtubeUrl?[saved.youtubeUrl]:[],hero:saved.hero||seed.hero,featured:saved.featured??seed.featured,poster:saved.poster||seed.poster}:seed});
  const knownTitles=new Set(defaultShows.map(show=>show.title));
  merged.push(...savedShows.filter(show=>!knownTitles.has(show.title)));
  writeRaw(SHOWS_KEY,merged);
 }
 const savedCategories=readArray(CATEGORIES_KEY);
 if(savedCategories){
  const savedByName=new Map(savedCategories.map(category=>[category.name.toLowerCase(),category]));
  const merged=baseCategories.map(seed=>{const saved=savedByName.get(seed.name.toLowerCase());return saved?{...seed,...saved,children:[...new Set([...seed.children,...(saved.children||[])])]}:seed});
  const knownNames=new Set(baseCategories.map(category=>category.name.toLowerCase()));
  merged.push(...savedCategories.filter(category=>!knownNames.has(category.name.toLowerCase())));
  writeRaw(CATEGORIES_KEY,merged);
 }
 try{localStorage.setItem(CONTENT_VERSION_KEY,'3')}catch{}
}

export function loadManagedShows(){migrateLegacyContent();return readArray(SHOWS_KEY)||defaultShows}
export function loadManagedCategories(){migrateLegacyContent();return readArray(CATEGORIES_KEY)||baseCategories}
export function loadPublicCategories(){return loadManagedCategories().filter(category=>category.active!==false)}
export function loadPublicStories(){
 migrateLegacyContent();
 const managedShows=readArray(SHOWS_KEY);
 if(!managedShows)return baseStories;
 return managedShows.filter(show=>show.status==='Published').map(show=>{
  const fallback=baseStories.find(story=>story.title===show.title)||{};
  const category=show.category||fallback.category||'';
  const subcategory=show.subcategory||'';
  return {...fallback,...show,genre:subcategory?`${category} · ${subcategory}`:category,hero:show.hero||fallback.hero||show.poster||null,detail:show.detail||fallback.detail||null,poster:show.poster||fallback.poster||'',beats:Number(show.beats||fallback.beats||1),tag:show.tag||fallback.tag||'ORIGINAL',youtubeUrls:show.youtubeUrls?.length?show.youtubeUrls:show.youtubeUrl?[show.youtubeUrl]:[],featured:Boolean(show.featured)};
 });
}
export function getYouTubeId(value){try{const url=new URL(value);if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be'].includes(url.hostname))return '';if(url.hostname.includes('youtu.be'))return url.pathname.split('/').filter(Boolean)[0]||'';if(url.pathname==='/watch')return url.searchParams.get('v')||'';const match=url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);return match?.[1]||''}catch{return ''}}
export function getYouTubeEmbedUrl(value){const videoId=getYouTubeId(value);if(videoId)return `https://www.youtube-nocookie.com/embed/${videoId}`;try{const url=new URL(value);if(!['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname))return '';const listId=url.searchParams.get('list');return listId&&/^[\w-]+$/.test(listId)?`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(listId)}`:''}catch{return ''}}
export function getShowVideoUrls(show){return Array.isArray(show.youtubeUrls)&&show.youtubeUrls.length?show.youtubeUrls.filter(Boolean):show.youtubeUrl?[show.youtubeUrl]:[]}
export function saveContent(key,value){try{localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event(CMS_CHANGE_EVENT))}catch{}}

export async function fetchManagedContent(){
 const {shows,categories}=await apiRequest('/api/content/managed');
 return {shows:shows||[],categories:categories||[]};
}

export async function fetchPublishedContent(){
 const {stories:shows,categories}=await apiRequest('/api/content/public');
 const stories=(shows||[]).map(show=>{
  const fallback=baseStories.find(story=>story.title===show.title)||{};
  const category=show.category||fallback.category||'';const subcategory=show.subcategory||'';
  return {...fallback,...show,genre:subcategory?`${category} · ${subcategory}`:category,hero:show.hero||fallback.hero||show.poster||null,detail:show.detail||fallback.detail||null,poster:show.poster||fallback.poster||'',beats:Number(show.beats||fallback.beats||1),tag:show.tag||fallback.tag||'ORIGINAL',youtubeUrls:show.youtubeUrls?.length?show.youtubeUrls:show.youtubeUrl?[show.youtubeUrl]:[],featured:Boolean(show.featured)};
 });
 return {stories:stories.length?stories:baseStories,categories:categories?.length?categories:baseCategories};
}

export async function upsertManagedRows(table,rows){
 const collection=table==='shows'?'shows':table==='categories'?'categories':null;
 if(!collection)throw new Error('Unknown content collection.');
 await apiRequest(`/api/content/managed/${collection}`,{
  method:'PUT',
  body:JSON.stringify({items:rows}),
 });
}