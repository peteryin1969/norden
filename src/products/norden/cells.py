import json,os
from PIL import Image,ImageChops
os.makedirs('img/c',exist_ok=True)
C=[('110733','短螺丝',3,(570,500,610,595)),('116546','抽屉螺栓',3,(190,430,250,595)),('101352','木销',3,(328,420,370,595)),('117494','木螺丝',3,(450,475,490,595)),('121121','横销',3,(678,425,725,595)),('105330','长螺栓',3,(55,195,115,595)),('10083377','内六角扳手',3,(278,50,395,190)),('107271','脚垫',3,(140,100,250,190)),('156508','止动垫',3,(150,245,305,345)),('120139','钢条',3,(365,220,765,385)),('10005601','铰链',3,(415,50,780,225))]
out=[]
for n,(code,name,p,b) in enumerate(C,1):
    i=Image.open(f'hi/p-{p:02d}.png').convert('L');s=i.width/827
    c=i.crop(tuple(int(v*s) for v in b));bx=ImageChops.invert(c).point(lambda v:255 if v>40 else 0).getbbox();c=c.crop(bx);c.thumbnail((260,260));c.quantize(16).save(f'img/c/{n}.png',optimize=True)
    out.append({'n':n,'code':code,'name':name})
json.dump(out,open('cells.json','w',encoding='utf8'),ensure_ascii=False)
