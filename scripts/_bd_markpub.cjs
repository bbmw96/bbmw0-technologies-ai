const fs=require('fs');const [slug,id,link,at]=process.argv.slice(2);const f=`daily/2026-11-25/blankdiscussions/${slug}.meta.json`;const m=JSON.parse(fs.readFileSync(f,'utf8'));m.status='published';
m.published={mediaId:id,permalink:link,publishedAt:at,hostingUrls:m.slides.map((_,i)=>`https://raw.githubusercontent.com/bbmw96/bbmw0-technologies-ai/main/daily/2026-11-25/blankdiscussions/renders/${slug}-slide-0${i+1}.png`),publishedVia:'Composio INSTAGRAM_CREATE_CAROUSEL_CONTAINER + PUBLISH, account instagram_willed-pried'};
fs.writeFileSync(f,JSON.stringify(m,null,2),'utf8');
