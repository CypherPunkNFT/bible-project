"""Persist actual implementation-agent judgments on the inspected located packet."""
from .inputs import OUT,read
from ..build import dump,now

def main():
 packet=read(OUT/'content-review-packet.json');decisions=[]
 for item in packet:
  r=item['data'];kind=item['kind'];useful=True
  if kind=='historical' and r['scope_id']=='citation:BA-001':
   note='Useful as a located institutional summary of an Israel mention. It is not a direct inspection of the inscription or original publication; the retained no-Exodus/plate-verification limits matter.'
  elif kind=='historical' and r['scope_id']=='citation:BA-002':
   useful=False;note='Partial support only. The quoted museum passage supports its reported House of David attestation and ninth-century BCE description. It does not establish the inherited claim that a royal victory account differs from Kings in attribution. Preserve the source annotation and require specialist/primary-edition review before using that comparison.'
  elif kind=='lexicon':
   note='Useful source-authored lexical mapping in the same entry. Hebrew/Aramaic and definition-versus-usage distinctions are explicit; the glossary is not a verse or running prose translation, and no translator identity is supplied.'
  elif kind=='oracc-lexical-annotation':
   note='Useful located editorial token gloss with original project, text and token reference. It provides no independent canonical person resolution, and the gloss is not a running translation or historical claim certification.'
  else:
   note='Useful as the explicit edition translation group for native lines 1-prime through 10-prime. Source restorations, alternative readings, lacunae and literal contributor/lemmatizer statements survive. Semantic accuracy and word-level correspondence remain unreviewed; reserved positive group evidence is absent.'
  decisions.append({'fact_id':r['id'],'scope_id':r['scope_id'],'kind':kind,'source_witness':r.get('witness_id',r.get('source_witness')),'target_witness':r.get('target_witness'),'useful_within_declared_scope':useful,'decision':'limited-inherited-claim-support' if not useful else 'useful-located-source-annotation','notes':note})
 result={'time':now(),'reviewer_type':'model-assisted implementation-agent','reviewer':'Codex implementation agent; not human or independent specialist','selection':'Small convenience sample of actual located historical, lexicon, token and translation queries; not a population or held-out semantic estimate','external_model_calls':0,'reviewed_cases':len(decisions),'useful_within_declared_scope':sum(d['useful_within_declared_scope'] for d in decisions),'limited_or_failed_cases':sum(not d['useful_within_declared_scope'] for d in decisions),'decisions':decisions,'additional_population_failure_class':'Numeric/placeholder ORACC guidewords remain literal annotations and have no useful standalone English meaning; counted separately in coverage.json','global_promotion':False}
 dump(OUT/'content-review.json',result);print({k:v for k,v in result.items() if k!='decisions'})
if __name__=='__main__':main()
