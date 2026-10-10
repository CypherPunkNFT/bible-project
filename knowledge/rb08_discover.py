import json,re
import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB08'
c=b.Client(attempts=1,timeout=20)
urls={
 'aomin-posts-001.json':'https://www.aomin.org/aoblog/wp-json/wp/v2/posts?per_page=100&page=1',
 'aomin-categories.json':'https://www.aomin.org/aoblog/wp-json/wp/v2/categories?per_page=100',
 'aomin-users.json':'https://www.aomin.org/aoblog/wp-json/wp/v2/users?per_page=100',
 'kruger-posts-001.json':'https://michaeljkruger.com/wp-json/wp/v2/posts?per_page=100&page=1',
 'kruger-users.json':'https://michaeljkruger.com/wp-json/wp/v2/users?per_page=100',
 'dg-article-example.html':'https://www.desiringgod.org/articles/raw-passion-and-messy-missiology',
 'dg-message-index.html':'https://www.desiringgod.org/authors/john-piper/messages',
 'dg-books-index.html':'https://www.desiringgod.org/authors/john-piper/books',
 'dg-permissions.html':'https://www.desiringgod.org/permissions',
 'warfield-oxford.html':'https://www.monergism.com/revelation-and-inspiration'}
for name,url in urls.items():
 try:
  body=c.cached('rb08-'+name,url);print(name,len(body),flush=True)
 except Exception as e:print(name,'FAILED',str(e),flush=True)
