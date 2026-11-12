/* rules that turn a sentence into workshop actions */
const V=require('./mvoice.js');let ok=0,n=0;const T=(s,want)=>{const r=V.parse(s),got=r?JSON.stringify(r.acts[0]):'null',w=want===null?'null':JSON.stringify(want);n++;if(got===w)ok++;else console.log('FAIL',s,'→',got,'want',w)};
T('把这个往左移五厘米',{k:'move',d:[-5,0,0]});T('往右挪 2.5 厘米',{k:'move',d:[2.5,0,0]});T('抬高一点',{k:'move',d:[0,1,0]});T('往后移二十毫米',{k:'move',d:[0,0,-2]});T('再低一点点',{k:'move',d:[0,-0.5,0]});T('向前移十二公分',{k:'move',d:[0,0,12]});T('往上移半厘米',{k:'move',d:[0,.5,0]});T('左移两厘米',{k:'move',d:[-2,0,0]});T('把它往下降三点五厘米',{k:'move',d:[0,-3.5,0]});
T('这个转九十度',{k:'turn',axis:'y',deg:90});T('向右转',{k:'turn',axis:'y',deg:-90});T('翻过来',{k:'turn',axis:'x',deg:180});T('旋转45度',{k:'turn',axis:'y',deg:45});T('往左翻',{k:'turn',axis:'z',deg:90});T('掉头',{k:'turn',axis:'y',deg:180});
T('放到这里',{k:'place'});T('把它挪到这儿',{k:'place'});T('固定到这个上',{k:'attach'});T('装在这块板上面',{k:'attach'});
T('用锤子敲这个',{k:'tool',type:'hammer'});T('用十字螺丝刀拧这个',{k:'tool',type:'phillips'});T('拿内六角扳手',{k:'tool',type:'hex'});T('用一字螺丝刀',{k:'tool',type:'flat'});T('敲一下这个',{k:'tool',type:'hammer'});
T('再拿一个',{k:'take'});T('删除这个',{k:'del'});T('把这个去掉',{k:'del'});
T('加一块板，长六十宽三十厚一点八',{k:'board',l:60,w:30,t:1.8});T('新建一块板 长 45 厘米 宽 200 毫米 厚 18 毫米',{k:'board',l:45,w:20,t:1.8});T('来一根木销，直径 0.8 长 3',{k:'cyl',d:.8,len:3});
T('下一步',{k:'step',to:'next'});T('上一步',{k:'step',to:'prev'});T('到第五步',{k:'step',to:'5'});T('第11步',{k:'step',to:'11'});T('播放',{k:'play',op:'play'});T('暂停',{k:'play',op:'pause'});T('从头再放一遍',{k:'play',op:'replay'});
T('从左边看',{k:'view',to:'left'});T('俯视',{k:'view',to:'top'});T('原镜头',{k:'view',to:'reset'});T('放大',{k:'zoom',f:.75});T('拉远一点',{k:'zoom',f:1.33});T('从后面看',{k:'view',to:'back'});
T('开始录制',{k:'rec',op:'start'});T('录完了',{k:'rec',op:'done'});T('取消录制',{k:'rec',op:'cancel'});T('提前一点',{k:'retime',d:-.1});T('推后一点',{k:'retime',d:.1});
T('撤销',{k:'undo'});T('重做',{k:'redo'});T('保存',{k:'save'});T('确认',{k:'yes'});T('好的',{k:'yes'});T('不用了',{k:'no'});T('取消',{k:'no'});
T('选中垫块',{k:'find',q:'垫块'});T('找117494',{k:'find',q:'117494'});T('就这个',{k:'pick'});T('能说什么',{k:'help'});
T('今天天气怎么样',null);T('把加固板做成圆角',null);T('',null);
console.log(V.cn('二十五'),V.cn('一百二十'),V.cn('三点五'),V.cn('两'),V.cn('十'));
console.log('PASS',ok+'/'+n);
