var item = '{"vidList":[' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-05 at 5.43.00 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-05 at 5.43.37 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-21 at 5.54.06 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-22 at 6.12.37 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-23 at 6.59.31 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-23 at 6.59.32 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-23 at 6.59.33 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-25 at 7.32.15 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-25 at 7.33.43 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-25 at 7.34.25 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-26 at 7.09.43 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-04-27 at 7.21.28 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-01 at 6.07.23 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-01 at 6.07.24 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-01 at 6.07.56 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-02 at 7.19.38 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-02 at 7.20.51 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-06 at 10.34.18 AM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-06 at 11.10.36 AM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-08 at 10.55.33 AM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-08 at 10.56.35 AM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-10 at 6.06.18 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-10 at 6.07.16 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-10 at 6.08.05 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-13 at 6.23.57 PM.mp4" },' +
'{"title":"Saran","file":"WhatsApp Video 2020-05-13 at 6.37.18 PM.mp4" }' +
']}';

obj = JSON.parse(item);
var count = Object.keys(obj.vidList).length;
//console.log(count);
vidIndx = 0;
function nxtVideo() {
	if (vidIndx > count-2) {
		vidIndx = 0; 
	}
	else {vidIndx += 1;}
	addsrc(vidIndx);	
}
function preVideo() {
	if (vidIndx < 0) {
		vidIndx = count-2; 
	}
	else {vidIndx -= 1;}
	addsrc(vidIndx);
}
function addsrc(objid){
	document.getElementById("cvid").src = obj.vidList[objid].file;
}




	
