import copy,json,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from pixel_review import inspect,samples_for
from pixel_events import resolve,compile_events

def node(id,role,x,y,w,h,**kw):return dict(id=id,role=role,box=dict(x=x,y=y,width=w,height=h),**kw)
class ContractTest(unittest.TestCase):
    def test_required_control_clipped_by_parent(self):
        n=node('input','control',20,100,1900,600,required=True,clips=[dict(x=24,y=94,width=1864,height=832)])
        self.assertIn('clipped-subject',[f['code'] for f in inspect(dict(width=1920,height=1080,nodes=[n]))])
        n['box'].update(x=30,width=1800)
        self.assertEqual([],inspect(dict(width=1920,height=1080,nodes=[n])))
    def test_intentional_overlay_and_decorative_crop(self):
        nodes=[node('input','control',24,100,1872,920,required=True),node('caption','subtitle',500,980,900,80)]
        self.assertIn('chrome-collision',[x['code'] for x in inspect(dict(width=1920,height=1080,nodes=nodes))])
        nodes[0]['allowOverlay']=True
        self.assertEqual([],inspect(dict(width=1920,height=1080,nodes=nodes)))
    def test_missing_coverage_is_not_pass(self):
        self.assertEqual(inspect(dict(width=1920,height=1080,nodes=[]))[0]['code'],'no-subject-coverage')
    def test_before_middle_settled(self):
        frames=[s['frame'] for s in samples_for({'scenes':[{'id':'s','from':0,'to':100,'transitions':[{'at':40,'duration':20}]}]})]
        self.assertTrue({39,40,50,60}.issubset(frames));self.assertNotIn(100,frames)
    def test_event_resolution_and_invalid_contact(self):
        source={'events':[{'id':'fall','chapter':'ch3','at':{'beatId':21,'offsetFrames':255},'kind':'fall','heartDelta':-1,'sound':{'name':'pixel_splash','peakDbfs':-22}}]}
        cues=[{'id':21,'chapter':'ch3','startFrame':500}];chapters=[{'id':'ch3','startFrame':500,'endFrame':1000}]
        result=resolve(source,cues,chapters)['ch3'][0]
        self.assertEqual((result['frame'],result['absoluteFrame']),(255,755))
        bad=copy.deepcopy(source);bad['events'][0]['heartDelta']=1
        with self.assertRaises(ValueError):resolve(bad,cues,chapters)

        bad=copy.deepcopy(source);bad['events'][0]['at']['offsetFrames']=501
        with self.assertRaises(ValueError):resolve(bad,cues,chapters)
        bad=copy.deepcopy(source);bad['events'][0].pop('sound')
        with self.assertRaises(ValueError):resolve(bad,cues,chapters)

    def test_compile_preserves_other_sounds_and_is_idempotent(self):
        # Use a temporary directory next to the suite, never another episode's sound plan.
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as folder:
            root=Path(folder);(root/'build').mkdir();(root/'assets/references').mkdir(parents=True)
            def save(name,obj):(root/name).write_text(json.dumps(obj))
            save('build/cues.json',[{'id':1,'chapter':'ch1','startFrame':100}])
            save('build/chapters.json',[{'id':'ch1','startFrame':100,'endFrame':200}])
            save('assets/references/pixel-actions.json',{'events':[{'id':'splash','chapter':'ch1','at':{'beatId':1,'offsetFrames':20},'kind':'fall','heartDelta':-1,'sound':{'name':'pixel_splash','peakDbfs':-21}}]})
            legacy={'beatId':1,'offsetFrames':0,'sound':'tick','peakDbfs':-30}
            save('assets/references/sound-plan.json',{'events':[legacy]})
            compile_events(root)
            first=(root/'assets/references/sound-plan.json').read_bytes()
            compile_events(root)
            self.assertEqual(first,(root/'assets/references/sound-plan.json').read_bytes())
            self.assertEqual(json.loads(first)['events'][0],legacy)

if __name__=='__main__':unittest.main()
