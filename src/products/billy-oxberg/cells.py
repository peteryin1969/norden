import json
from PIL import Image,ImageChops
C=[('118331','连接件','nb',(100,745,168,1032)),('101351','木销','nb',(250,778,314,1036)),('151705','圆帽','nb',(362,855,464,1036)),('151706','塞子','nb',(516,866,602,1036)),('119081','大锁扣','nb',(642,908,756,1036)),('131372','搁板销','nb',(812,918,938,1036)),('109041','短木螺丝','nb',(998,923,1062,1026)),('100823','垫圈','nb',(1112,978,1232,1036)),('106989','书柜墙面支架','nb',(708,515,1292,872)),
('114667','长螺丝','ox',(83,86,142,324)),('113287','底板螺丝','ox',(308,190,390,324)),('100349','铰链螺丝','ox',(541,208,600,320)),('131386','旋钮','ox',(688,146,802,324)),('102384','缓冲垫','ox',(986,190,1222,324)),('109221','底板','ox',(80,470,324,844)),('109336','铰链','ox',(453,543,1214,847)),('122576','门墙面支架','ox',(83,1013,657,1372)),('121043','盖片','ox',(763,1178,1160,1372))]
out=[]
for n,(code,name,src,b) in enumerate(C,1):
    i=Image.open('p/nb-07.png' if src=='nb' else 'p/ox-06.png').convert('L');c=i.crop(b);bx=ImageChops.invert(c).point(lambda v:255 if v>40 else 0).getbbox();c=c.crop(bx);c.thumbnail((260,260));c.quantize(16).save(f'img/c/{n}.png',optimize=True);out.append({'n':n,'code':code,'name':name})
json.dump(out,open('cells.json','w',encoding='utf8'),ensure_ascii=False)
s=Image.new('L',(1300,800),255)
for n in range(18):
    t=Image.open(f'img/c/{n+1}.png').convert('L');t.thumbnail((200,190));s.paste(t,((n%6)*215,(n//6)*260))
s.save('cellz.png')
