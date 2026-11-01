# Single-frame jumps in the master: a frame whose difference to the previous one towers over its neighbours.
import subprocess, statistics as st
f='out/final/metacase-sff-stage-1080p60.mp4'; W,H=160,90
raw=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',f,'-vf',f'scale={W}:{H},format=gray','-an','-f','rawvideo','-'],capture_output=True).stdout
n=len(raw)//(W*H); d=[0.0]*n
for i in range(1,n):
    a=raw[(i-1)*W*H:i*W*H]; b=raw[i*W*H:(i+1)*W*H]
    d[i]=sum(abs(x-y) for x,y in zip(a[::4],b[::4]))/(len(a)/4)
pops=[]
for i in range(12,n-12):
    around=d[i-12:i-1]+d[i+2:i+13]
    if d[i]>6 and d[i]>5*max(st.median(around),.3): pops.append((round(i/60,2),round(d[i],1),round(st.median(around),2)))
print('frames',n,'peak diff',round(max(d),1),'at',round(d.index(max(d))/60,2))
print('single-frame jumps (t, diff, local median):',pops)
