"""Read-only table adapter for a later local service integration."""
import json
from collections import deque
from .core import readonly


class Tables:
    def __init__(self, path, run, release=None):
        self.db = readonly(path); self.run = run; self.release = release
        self.stale = False

    def close(self):
        self.db.close()

    def _table(self, sql, params=(), limit=50):
        limit = max(1, min(int(limit), 200))
        rows = self.db.execute(sql+' LIMIT ?', (*params, limit+1)).fetchall()
        return {'columns': list(rows[0].keys()) if rows else [], 'rows': [dict(r) for r in rows[:limit]],
                'truncated': len(rows)>limit, 'runId': self.run, 'releaseId': self.release,
                'staleAgainstCurrentCorpus': self.stale,
                'scope': 'PRIVATE retained evidence; topic matches are candidates, mentions are not endorsements'}

    def evidence(self, assertion, limit=50):
        return self._table('''SELECT o.id observationId,o.document_id documentId,o.chunk_id chunkId,o.literal,o.source,
                         o.source_hash sourceSha256,o.start,o.end,o.locator,o.method,o.rule_version ruleVersion,o.snapshot_id snapshotId
                         FROM assertion_evidence e JOIN observations o ON o.id=e.observation_id
                         JOIN run_observations r ON r.observation_id=o.id AND r.run_id=?
                         WHERE e.assertion_id=? ORDER BY o.id''', (self.run, assertion), limit)

    def _rows(self, where, params, limit, subject_index=False):
        return self._table('''SELECT a.id assertionId,a.relation,a.basis,a.subject,a.object,a.qualifiers,a.review_state reviewState,a.attribution,
                         cr.edition referenceEdition,cr.numbering referenceNumbering,
                         COALESCE(c.document_id,CASE WHEN s.kind='document' THEN substr(a.subject,10) END) documentId,c.chunk_id chunkId,d.work_id workId,d.edition_id editionId,d.genre,d.language,
                         d.metadata sourceMetadata,COALESCE(sv.label,s.label) subjectLabel,COALESCE(tv.label,t.label) objectLabel
                         FROM run_assertions r JOIN assertions a '''+('INDEXED BY assertions_from' if subject_index else '')+''' ON a.id=r.assertion_id
                         JOIN entities s ON s.id=a.subject JOIN entities t ON t.id=a.object
                         LEFT JOIN entity_versions sv ON sv.entity_id=s.id AND sv.run_id=r.run_id
                         LEFT JOIN entity_versions tv ON tv.entity_id=t.id AND tv.run_id=r.run_id
                         LEFT JOIN citation_refs cr ON cr.entity_id=a.object
                         LEFT JOIN chunk_map c ON c.run_id=r.run_id AND c.chunk_id=substr(a.subject,7)
                         LEFT JOIN document_map d ON d.run_id=r.run_id AND d.document_id=COALESCE(c.document_id,substr(a.subject,10))
                         WHERE r.run_id=? AND '''+where+" ORDER BY CASE a.relation WHEN 'cites_reference' THEN 0 WHEN 'recorded_reference' THEN 1 ELSE 2 END,a.id", (self.run,*params), limit)

    def passage(self, book, chapter, verse=None, limit=50):
        start = int(chapter)*1000+(int(verse) if verse else 1)
        end = start if verse else int(chapter)*1000+999
        return self._rows("a.relation IN ('cites_reference','recorded_reference') AND a.object IN (SELECT entity_id FROM citation_refs WHERE book=? AND start<=? AND end>=?)",
                          (book.lower(),end,start), limit)

    def topic(self, topic, limit=50):
        return self._rows("a.relation='topic_match' AND a.object=?", ('topic:'+topic.removeprefix('topic:'),), limit)

    def entity(self, entity, limit=50):
        return self._rows("a.relation='mentions_entity' AND a.object=?", (entity,), limit)

    def author(self, author, limit=50):
        return self._rows("""a.relation='cites_reference' AND a.subject IN
                          (SELECT 'chunk:'||cm.chunk_id FROM document_map dm
                           JOIN chunk_map cm ON cm.run_id=dm.run_id AND cm.document_id=dm.document_id
                           WHERE dm.run_id=? AND dm.work_id IN
                           (SELECT x.subject FROM assertions x JOIN run_assertions z ON z.assertion_id=x.id
                            WHERE z.run_id=? AND x.relation='authored_by' AND x.object=?))""",
                          (self.run,self.run,author), limit, subject_index=True)

    def neighbours(self, entity, limit=50):
        return self._rows('(a.subject=? OR a.object=?)', (entity,entity), limit)

    def candidates(self, reason=None, limit=50):
        return self._table('SELECT id candidateId,reason,metadata FROM candidates WHERE run_id=?'+(' AND reason=?' if reason else '')+' ORDER BY id',
                           (self.run,reason) if reason else (self.run,),limit)

    def directory(self, kind='topic', limit=50):
        if kind not in ('topic','historical_person','organization','work','edition','acquisition_source'):
            raise ValueError('Unsupported directory type')
        return self._table('SELECT e.id,e.kind,COALESCE(v.label,e.label) label,COALESCE(v.metadata,e.metadata) metadata FROM entities e JOIN run_entities r ON r.entity_id=e.id LEFT JOIN entity_versions v ON v.entity_id=e.id AND v.run_id=r.run_id WHERE r.run_id=? AND e.kind=? ORDER BY label,e.id',(self.run,kind),limit)

    def bibliography(self, author, limit=50):
        return self._table('''SELECT w.id workId,w.label title,a.id authorshipAssertion,e.id editionId,e.label editionTitle,
                             d.document_id documentId,d.genre,d.language,d.metadata sourceMetadata
                             FROM run_assertions r JOIN assertions a ON a.id=r.assertion_id AND a.relation='authored_by'
                             JOIN entities w ON w.id=a.subject LEFT JOIN assertions x ON x.object=w.id AND x.relation='edition_of'
                             LEFT JOIN run_assertions y ON y.assertion_id=x.id AND y.run_id=r.run_id
                             LEFT JOIN entities e ON e.id=CASE WHEN y.run_id IS NOT NULL THEN x.subject END
                             LEFT JOIN document_map d ON d.run_id=r.run_id AND d.work_id=w.id
                             WHERE r.run_id=? AND a.object=? ORDER BY w.id,e.id,d.document_id''', (self.run,author), limit)

    def shared(self, left, right, limit=50, section=None, other_section=None):
        # Sparse reference-key join, also works for pairs omitted by association bounds.
        def select(id, section):
            id=id.removeprefix('document:')
            docs=[r[0] for r in self.db.execute('SELECT document_id FROM document_map WHERE run_id=? AND eligible=1 AND (document_id=? OR work_id=?)',(self.run,id,id))]
            if not docs: docs=[id]
            placeholders=','.join('?' for _ in docs)
            extra=''; params=list(docs)
            if section:
                escaped=section.replace('\\','\\\\').replace('%','\\%').replace('_','\\_')
                extra=" AND (locator=? OR locator LIKE ? ESCAPE '\\')"; params += [section,escaped+' · part %']
            return 'doc IN ('+placeholders+')'+extra,params
        left_where,left_params=select(left,section); right_where,right_params=select(right,other_section)
        return self._table('''WITH refs AS NOT MATERIALIZED (
                    SELECT a.object ref,c.document_id doc,a.id assertionId,n.label locator
                    FROM chunk_map c INDEXED BY chunks_document
                    JOIN assertions a INDEXED BY assertions_from ON a.subject='chunk:'||c.chunk_id AND a.relation='cites_reference'
                    JOIN run_assertions r ON r.assertion_id=a.id AND r.run_id=c.run_id
                    JOIN entities n ON n.id=a.subject WHERE c.run_id=?),
                    l AS (SELECT ref,min(assertionId) assertionId FROM refs WHERE '''+left_where+''' GROUP BY ref),
                    r AS (SELECT ref,min(assertionId) assertionId FROM refs WHERE '''+right_where+''' GROUP BY ref)
                    SELECT l.ref referenceId,n.label,l.assertionId leftEvidence,r.assertionId rightEvidence
                    FROM l JOIN r ON r.ref=l.ref JOIN entities n ON n.id=l.ref ORDER BY l.ref''',
                           (self.run,*left_params,*right_params), limit)

    def paths(self, source, target, depth=3, branches=20, nodes=500):
        depth = max(1,min(int(depth),4)); branches=max(1,min(branches,30)); nodes=max(1,min(nodes,1000))
        queue=deque([(source,[])]); seen={source}; skipped=0
        while queue and len(seen)<=nodes:
            current, path=queue.popleft()
            if current==target:
                return dict(columns=['assertionId','from','relation','to','direction','basis'],rows=path,
                            runId=self.run,bounds=dict(depth=depth,branches=branches,nodes=nodes),skippedBranches=skipped,
                            meaning='explained association path; no implied causation or doctrinal agreement')
            if len(path)>=depth: continue
            rows=self.db.execute('''SELECT a.id,a.subject,a.relation,a.object,a.basis FROM assertions a
                                   JOIN run_assertions r ON r.assertion_id=a.id WHERE r.run_id=?
                                   AND (a.subject=? OR a.object=?) ORDER BY a.id LIMIT ?''',
                                  (self.run,current,current,branches+1)).fetchall()
            skipped+=max(0,len(rows)-branches)
            for edge in rows[:branches]:
                other=edge['object'] if edge['subject']==current else edge['subject']
                if other not in seen:
                    seen.add(other); queue.append((other,path+[dict(assertionId=edge['id'],**{'from':current,'to':other},
                        relation=edge['relation'],direction='forward' if current==edge['subject'] else 'reverse',basis=edge['basis'])]))
        return dict(columns=[],rows=[],runId=self.run,bounded=True,visited=len(seen),skippedBranches=skipped)


def open_tables(config, pilot=False):
    root=config['state_dir']/'graph-development'
    pointer=root/('latest-pilot.json' if pilot else 'current-release.json')
    if not pointer.exists():
        raise RuntimeError('No validated private release; use --pilot only for development queries')
    value=json.loads(pointer.read_text('utf-8'))
    tables=Tables(value['graphPath'],value['runId'],value.get('releaseId'))
    status=config['state_dir']/'embedding-progress.json'
    if status.exists():
        tables.stale=json.loads(status.read_text('utf-8')).get('corpus_build')!=value.get('corpusBuild',value.get('manifest',{}).get('corpusBuild'))
    return tables


def supplement(config, ordinary_results, kind, limit=20, **parameters):
    """Later service hook: retain ordinary retrieval on absent/stale graph support."""
    try:
        tables=open_tables(config)
        try:
            if tables.stale: return {'ordinary':ordinary_results,'graph':None,'fallback':'graph snapshot is stale'}
            if kind not in ('passage','topic','entity','author','shared'): raise ValueError('Unsupported bounded supplement')
            evidence=getattr(tables,kind)(limit=max(1,min(limit,50)),**parameters)
            return {'ordinary':ordinary_results,'graph':evidence if evidence['rows'] else None,'fallback':None if evidence['rows'] else 'no supported graph connection'}
        finally: tables.close()
    except (OSError,RuntimeError):
        return {'ordinary':ordinary_results,'graph':None,'fallback':'private graph unavailable'}
