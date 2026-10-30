import {apiRequest} from './apiClient.js';

const imageTypes=new Set(['image/avif','image/jpeg','image/png','image/webp']);
const maxImageBytes=8*1024*1024;

export async function uploadStudioImage(file,kind){
 if(!['poster','hero'].includes(kind))throw new Error('Choose a valid artwork type.');
 if(!imageTypes.has(file.type))throw new Error('Use a PNG, JPG, WebP, or AVIF image.');
 if(file.size>maxImageBytes)throw new Error('Images must be 8 MB or smaller.');
 const form=new FormData();
 form.append('file',file);
 form.append('kind',kind);
 const result=await apiRequest('/api/studio/uploads',{method:'POST',body:form});
 return result.url;
}
