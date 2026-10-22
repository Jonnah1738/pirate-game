# Portrait before/after screenshots for the visual restyle. usage: shots_restyle.py <url> <prefix>
import sys,json
from playwright.sync_api import sync_playwright
URL=sys.argv[1];PF=sys.argv[2];OUT='/workspace/pirate-game/screenshots-restyle/'
SAVE={"gold":4200,"crew":30,"tutDone":True,"seen":True,"bal":2,"infamy":1500,"ship":"brig","xp":3000,"clvl":10,"xpv":2,"tips":{"ammo":1,"board":1,"codex":1,"craft":1,"crew":1,"dive":1,"event":1,"fish":1,"fog":1,"fort":1,"grapple":1,"layup":1,"legend":1,"mats":1,"merchant":1,"mp":1,"night":1,"onl":1,"ram":1,"republic":1,"sail":1,"shark":1,"storm":1,"story":1,"upkeep":1,"vault":1,"wanted":1,"war":1,"navy":1,"pirate":1},"boostTip":True,"fleet":[]}
def E(pg,js):return pg.evaluate(js)
def sim(pg,s):E(pg,f"(()=>{{for(let i=0;i<{int(s*30)};i++)__game.step(1/30)}})()")
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);pg=c.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("if(!localStorage.getItem('inj')){localStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify(%s));}"%json.dumps(SAVE))
    pg.goto(URL);pg.wait_for_timeout(900);pg.screenshot(path=OUT+PF+'_1_title.png')
    E(pg,"document.getElementById('startBtn').click()");pg.wait_for_timeout(300);E(pg,"document.querySelectorAll('#toast,#tip').forEach(e=>e.style.visibility='hidden')")
    E(pg,"(()=>{const g=__game;g.P.x+=60;g.P.y+=420;g.P.h=-1.2;g.enemies.length=0;g.P.throttle=0.6;})()");pg.wait_for_timeout(1500)
    pg.screenshot(path=OUT+PF+'_2_port_island.png')
    E(pg,"(()=>{const g=__game;g.P.x=12000;g.P.y=9500;g.P.h=0.4;g.enemies.length=0;const k=['merchant','pirate','navy'];for(let i=0;i<3;i++){const e=g.makeEnemy(k[i],g.P.x+Math.cos(i*2.1)*170,g.P.y+Math.sin(i*2.1)*230,5);if(e){e.h=i;g.enemies.push(e);}}})()")
    pg.wait_for_timeout(1200);E(pg,"__game.fire(1)");pg.wait_for_timeout(350);pg.screenshot(path=OUT+PF+'_3_sea_battle.png')
    E(pg,"(()=>{const g=__game,f=g.HARD.FORTS[0];g.P.x=f.x+260;g.P.y=f.y+200;g.enemies.length=0;})()");pg.wait_for_timeout(1200);pg.screenshot(path=OUT+PF+'_4_fort.png')
    E(pg,"__game.dock(0)");pg.wait_for_timeout(400);pg.screenshot(path=OUT+PF+'_5_port_screen.png')
    E(pg,"document.getElementById('pLeave').click()");pg.wait_for_timeout(200)
    E(pg,"__game.openMenu()");pg.wait_for_timeout(300);pg.screenshot(path=OUT+PF+'_6_menu.png');E(pg,"[...document.querySelectorAll('#menu button')].find(b=>/Resume/.test(b.textContent)).click()");pg.wait_for_timeout(200)
    pg.keyboard.press('m');pg.wait_for_timeout(600);pg.screenshot(path=OUT+PF+'_7_map.png')
    print('state',E(pg,'__game.state'));print('errs',errs[:3]);b.close()
