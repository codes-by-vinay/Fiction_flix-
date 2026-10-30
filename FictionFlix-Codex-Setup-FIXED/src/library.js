const libraryKey=userId=>`fictionflix.library.${userId||'guest'}.v1`;

export function loadLibrary(userId='guest'){
 try{
  const value=JSON.parse(localStorage.getItem(libraryKey(userId))||'[]');
  return Array.isArray(value)?value:[];
 }catch{
  return [];
 }
}

export function storeLibrary(userId,items){
 try{
  localStorage.setItem(libraryKey(userId),JSON.stringify(items));
 }catch(error){
  console.error('Could not cache the FictionFlix library on this device.',error);
 }
}

export function mergeLibraryEntry(items,story,changes){
 const storyId=String(story.id);
 const previous=items.find(item=>String(item.storyId)===storyId);
 const entry={
  storyId,
  title:story.title,
  poster:story.poster||'',
  genre:story.genre||'',
  mode:changes.mode??previous?.mode??'',
  beat:changes.beat??previous?.beat??1,
  saved:changes.saved??previous?.saved??false,
  updatedAt:new Date().toISOString(),
 };
 const rest=items.filter(item=>String(item.storyId)!==storyId);
 return entry.saved||entry.mode?[entry,...rest]:rest;
}
