import sys,re,json
sys.path.insert(0,'knowledge');import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB12';R.mkdir(exist_ok=True)
known=[]
for p in (b.SITE/'content/library/reports/reformed-baptist-overnight').glob('RB*/failed-downloads.json'):
 d=b.read(p,{})
 for x in d.get('items',[])+d.get('previouslyFailed',[])+d.get('previouslyFailedSkipped',[]):
  if isinstance(x,dict) and x.get('source') in ['tcp','ia','ccel'] and x.get('sourceId'):known.append(x)
known=list({(x['source'],x['sourceId']):x for x in known}.values())
auth=r'Kiffin, William|Knollys, Hanserd|Keach, Benjamin|Collins, Hercules|Collins, William, 1647|Backus, Isaac|Ivimey, Joseph|Benedict, David|Cathcart, William, 1825|Rippon, John|Crosby, Thomas, 1683|Spilsb(?:ury|ery), John|John Spilsbery|Coxe, Nehemiah|Cox, Benjamin|Booth, Abraham|Denne, Henry|Danvers, Henry|Norcott, John|Stennett, Joseph|Jessey, Henry|Purnell, Robert|Richardson, Samuel|Warren Association|Philadelphia Baptist|Charleston Baptist'
tcp=[x for x in b.read(b.CACHE/'tcp.json') if re.search(auth,x['author'],re.I) or x['sourceId'] in ['A80328','A80329','A37357','A92937','A92938','A82070','B09175']]
b.save(b.CACHE/'rb12-tcp-screened.json',tcp)
common={'approvedCollection':True,'deferHardDownloads':True,'downloadWorkers':4}
b.save(R/'tcp-filter.json',common|{'cataloguePath':str(b.CACHE/'rb12-tcp-screened.json'),'skipIds':[x['sourceId'] for x in known if x['source']=='tcp']})
b.save(R/'ccel-filter.json',{'authors':['Kiffin, William','Knollys, Hanserd','Keach, Benjamin','Collins, Hercules','Collins, William (1647','Ivimey, Joseph','Backus, Isaac','Benedict, David','Cathcart, William','Rippon, John','Crosby, Thomas (1683'],'deferHardDownloads':True,'skipIds':[x['sourceId'] for x in known if x['source']=='ccel']})
query='mediatype:texts AND date:[* TO 1930-12-31] AND NOT access-restricted-item:true AND ((creator:"Crosby, Thomas" OR creator:"Ivimey, Joseph" OR creator:"Backus, Isaac" OR creator:"Benedict, David" OR creator:"Cathcart, William" OR creator:"Rippon, John" OR creator:"Kiffin, William" OR creator:"Knollys, Hanserd" OR creator:"Keach, Benjamin" OR creator:"Collins, Hercules") OR ((title:minutes OR title:proceedings OR title:letters OR title:register OR title:records OR title:history OR title:confession OR title:churchbook) AND (title:baptist OR creator:baptist OR publisher:baptist)))'
b.save(R/'ia-discovery-filter.json',{'iaQuery':query,'deferHardDownloads':True})
b.save(R/'mission-config.json',{'mission':'RB12','title':'Baptist history and primary records','filters':{'tcp':'tcp-filter.json','ccel':'ccel-filter.json','ia':'ia-filter.json'},'previouslyFailed':known,'scope':'TCP Particular Baptist author and church-record corpus; named historical Baptist historians, Baptist annual registers, and historical association minutes and church records from Internet Archive institutional collections. Source credits retained.'})
print('TCP screened items',len(tcp),'prior failed IDs',len(known))
