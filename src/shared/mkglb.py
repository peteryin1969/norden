# a small test GLB: a closed box with a slot in its lid, and a blade inside lying across the slot (metres)
import struct,json,sys
def box(x0,x1,y0,y1,z0,z1):
    P=[];N=[];I=[]
    F=[((1,0,0),[(x1,y0,z0),(x1,y1,z0),(x1,y1,z1),(x1,y0,z1)]),((-1,0,0),[(x0,y0,z1),(x0,y1,z1),(x0,y1,z0),(x0,y0,z0)]),((0,1,0),[(x0,y1,z0),(x0,y1,z1),(x1,y1,z1),(x1,y1,z0)]),((0,-1,0),[(x0,y0,z1),(x0,y0,z0),(x1,y0,z0),(x1,y0,z1)]),((0,0,1),[(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]),((0,0,-1),[(x1,y0,z0),(x0,y0,z0),(x0,y1,z0),(x1,y1,z0)])]
    for n,q in F:
        b=len(P);P+=q;N+=[n]*4;I+=[b,b+1,b+2,b,b+2,b+3]
    return P,N,I
def merge(L):
    P=[];N=[];I=[]
    for a in L:
        p,n,i=box(*[v/100 for v in a]);b=len(P);P+=p;N+=n;I+=[x+b for x in i]
    return P,N,I
meshes=[('Box',merge([(-8,8,-5,-3.5,-8,8),(-8,-6.5,-3.5,0,-8,8),(6.5,8,-3.5,0,-8,8),(-6.5,6.5,-3.5,0,-8,-6.5),(-6.5,6.5,-3.5,0,6.5,8),(-8,8,0,1.5,-8,-.6),(-8,8,0,1.5,.6,8),(-8,-3,0,1.5,-.6,.6),(3,8,0,1.5,-.6,.6)])),('Blade',merge([(-.4,.4,-2.4,-1.6,-2.5,2.5)]))]
buf=b'';views=[];acc=[];ms=[];nodes=[]
for name,(P,N,I) in meshes:
    def add(data,target):
        global buf
        while len(buf)%4:buf+=b'\0'
        views.append({'buffer':0,'byteOffset':len(buf),'byteLength':len(data),'target':target});buf+=data;return len(views)-1
    vp=add(b''.join(struct.pack('<3f',*p) for p in P),34962);vn=add(b''.join(struct.pack('<3f',*n) for n in N),34962);vi=add(b''.join(struct.pack('<H',i) for i in I),34963)
    mn=[min(p[k] for p in P) for k in range(3)];mx=[max(p[k] for p in P) for k in range(3)]
    acc+=[{'bufferView':vp,'componentType':5126,'count':len(P),'type':'VEC3','min':mn,'max':mx},{'bufferView':vn,'componentType':5126,'count':len(N),'type':'VEC3'},{'bufferView':vi,'componentType':5123,'count':len(I),'type':'SCALAR'}]
    ms.append({'name':name,'primitives':[{'attributes':{'POSITION':len(acc)-3,'NORMAL':len(acc)-2},'indices':len(acc)-1,'material':0}]});nodes.append({'name':name,'mesh':len(ms)-1})
while len(buf)%4:buf+=b'\0'
J={'asset':{'version':'2.0','generator':'test'},'scene':0,'scenes':[{'nodes':[len(nodes)]}],'nodes':nodes+[{'name':'Root','children':[0,len(nodes)+1]},{'name':'ASM Inner','children':[1]}],'meshes':ms,'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[.8,.8,.8,1]}}],'accessors':acc,'bufferViews':views,'buffers':[{'byteLength':len(buf)}]}
js=json.dumps(J).encode();js+=b' '*((4-len(js)%4)%4)
open(sys.argv[1],'wb').write(b'glTF'+struct.pack('<II',2,12+8+len(js)+8+len(buf))+struct.pack('<I',len(js))+b'JSON'+js+struct.pack('<I',len(buf))+b'BIN\0'+buf)
