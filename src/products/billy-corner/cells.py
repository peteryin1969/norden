import json
from PIL import Image,ImageChops
K=1406/1906*1.0
C=[('118331','连接件','ex',(80,120,135,410)),('101351','粗木销','ex',(212,160,275,415)),('101201','钉子','bk',(404,830,465,1025)),('119081','大锁扣','ex',(720,285,830,415)),('131372','搁板销','bk',(755,900,890,1025)),('109041','短木螺丝','ex',(1052,300,1115,412)),('100823','垫圈','ex',(1155,350,1272,412)),('106989','墙面支架','ex',(80,530,660,880)),('114667','长螺丝','ex',(328,175,405,415)),('101345','细木销','ex',(468,195,516,412)),('108001','短螺栓','ex',(590,210,645,412)),('103114','小锁扣','ex',(890,305,990,415)),('100362','宽头螺丝','cn',(280,1030,372,1195)),('115257','连接片','cn',(515,990,1120,1235)),('109534','沉头螺丝','cn',(290,1450,360,1582)),('102715','角码','cn',(515,1370,700,1585))]
out=[]
for n,(code,name,src,b) in enumerate(C,1):
    f={'ex':'p/ex-07.png','bk':'p/bk-06.png','cn':'p/cn-2.png'}[src];i=Image.open(f).convert('L');b=tuple(int(v*1.014)+d for v,d in zip(b,(-6,-6,6,6))) if src=='ex' else b;c=i.crop(b);bx=ImageChops.invert(c).point(lambda v:255 if v>40 else 0).getbbox();c=c.crop(bx);c.thumbnail((260,260));c.quantize(16).save(f'img/c/{n}.png',optimize=True);out.append({'n':n,'code':code,'name':name})
json.dump(out,open('cells.json','w',encoding='utf8'),ensure_ascii=False)
s=Image.new('L',(1040,1360),255)
for n in range(16):
    t=Image.open(f'img/c/{n+1}.png').convert('L');s.paste(t,((n%4)*260,(n//4)*340))
s.save('cellz.png')
