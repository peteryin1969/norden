/* Voice view control, shared by every product engine: smooth rotate, tilt, zoom, pan, reset, fullscreen, labels, look and playback. */
let VZ=null;const VTW={};
function vTween(key,ms,f){const id=VTW[key]=(VTW[key]||0)+1,t0=performance.now();const go=()=>{if(VTW[key]!==id)return;const k=Math.min(1,(performance.now()-t0)/ms);f(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2);if(k<1)requestAnimationFrame(go)};requestAnimationFrame(go)}
function vRot(da,de,ms=700){const a0=az,e0=el,a1=a0+da,e1=clamp(e0+de,-.6,.8);vTween('r',ms,k=>{az=a0+(a1-a0)*k;el=e0+(e1-e0)*k})}
function vRotTo(a1,e1,ms=800){const a0=az,e0=el,d=Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0));vTween('r',ms,k=>{az=a0+d*k;el=e0+(clamp(e1,-.6,.8)-e0)*k})}
function vZoom(f){if(!VZ)return false;const z0=VZ.get()[0],z1=clamp(z0*f,1,8);if(Math.abs(z1-z0)<.01)return false;vTween('z',500,k=>VZ.zoomAt(VZ.w()/2,VZ.h()/2,z0*Math.pow(z1/z0,k)));return true}
function vPan(dx,dy){if(!VZ)return;const[z,x0,y0]=VZ.get(),w=VZ.w()/z*.25,h=VZ.h()/z*.25;vTween('p',450,k=>{const[zz]=VZ.get();VZ.set(zz,x0+dx*w*k,y0+dy*h*k)})}
function vState(){const z=VZ?VZ.get():[1,0,0];return{azimuth:Math.round(az*180/Math.PI),tilt:Math.round(el*180/Math.PI),zoom:+z[0].toFixed(2),pan:[Math.round(z[1]),Math.round(z[2])],full,labels:showLbl,real:realLook,playing}}
function view(a,amt){const n=+amt||0,R=Math.PI/180,btn=id=>document.getElementById(id),click=id=>{const b=btn(id);if(b)b.click()};let note=null;
  switch(String(a)){
  case 'left':vRot(-(n||35)*R,0);break;case 'right':case 'rotate':vRot((n||35)*R,0);break;
  case 'up':vRot(0,(n||17)*R);break;case 'down':vRot(0,-(n||17)*R);break;
  case 'back':vRotTo(az+Math.PI,el,1100);break;case 'front':vRotTo(0,0);break;case 'top':vRotTo(az,.8);break;case 'bottom':vRotTo(az,-.6);break;
  case 'side_left':vRotTo(-Math.PI/2,el,900);break;case 'side_right':vRotTo(Math.PI/2,el,900);break;
  case 'zoom_in':if(!vZoom(n>1?n:1.6))note='已经放到最大了';break;
  case 'zoom_out':if(!vZoom(1/(n>1?n:1.6))){if(typeof unfocus==='function'&&typeof FOC!=='undefined'&&FOC)unfocus();else note='已经是最小了'}break;
  case 'pan_left':vPan(-1,0);break;case 'pan_right':vPan(1,0);break;case 'pan_up':vPan(0,-1);break;case 'pan_down':vPan(0,1);break;
  case 'reset':case 'all':if(typeof unfocus==='function')unfocus();vRotTo(0,0,600);if(VZ){const[z0,x0,y0]=VZ.get();vTween('z',500,k=>VZ.set(z0+(1-z0)*k,x0*(1-k),y0*(1-k)))}if(a==='all'&&fitMode==='detail')click('fMode');break;
  case 'full_on':if(!full)setFull(true);break;case 'full_off':if(full)setFull(false);break;
  case 'labels_on':case 'labels_off':if(showLbl!==(a==='labels_on'))click('animLbl');break;
  case 'real_on':case 'real_off':if(realLook!==(a==='real_on'))setLook(a==='real_on');break;
  case 'play':if(!playing)click('animPlay');break;case 'pause':if(playing)click('animPlay');break;case 'replay':click('animRe');break;
  case 'slow':if(speed===1)click('animSlow');break;case 'normal':if(speed!==1)click('animSlow');break;case 'continuous':if(!auto)click('animAuto');break;
  default:throw new Error('不支持的画面操作 '+a)}
  return{ok:!note,note,...vState()}}
