/* ==========================================================================
   CHOP CAMPUS MARKETPLACE — Application Logic
   Single-file build: persistent data layer (localStorage), client routing,
   live search, and a fully functional moderated admin console.
   ========================================================================== */
'use strict';

// ---------- helpers ----------
const $  = (s, el) => (el||document).querySelector(s);
const $$ = (s, el) => Array.from((el||document).querySelectorAll(s));
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtMoney = n => '₵' + Number(n||0).toLocaleString('en-GH');
const digits = s => String(s||'').replace(/\D/g,'');
const intlNumber = s => { let d = digits(s); if (d.startsWith('0')) d = '233' + d.slice(1); if (d && !d.startsWith('233') && d.length <= 10) d = '233' + d; return d; };
const timeAgo = ts => { const s = (Date.now()-ts)/1000; if (s<60) return 'just now'; const m=s/60; if (m<60) return Math.floor(m)+'m ago'; const h=m/60; if (h<24) return Math.floor(h)+'h ago'; const d=h/24; if (d<30) return Math.floor(d)+'d ago'; return new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short'}); };
const initials = n => String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
const H = 36e5, D = 864e5, FALLBACK_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80';
const ONERR = 'this.onerror=null;this.src=\''+FALLBACK_IMG+'\'';

// Global image fallback — swaps any broken image to the campus market image once.
document.addEventListener('error', e => { const t=e.target; if (t.tagName==='IMG' && !t.dataset.fb){ t.dataset.fb='1'; t.src=FALLBACK_IMG; } }, true);

// ---------- icon library ----------
const ICON_LIBRARY = {
  utensils:'<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="6"/><line x1="10" y1="2" x2="10" y2="6"/><line x1="14" y1="2" x2="14" y2="6"/>',
  shirt:'<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.46a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  phone:'<rect x="7" y="2" width="10" height="20" rx="2.2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  sparkle:'<path d="M12 3l1.9 4.9 5.1.2-3.9 3.1 1.3 4.9L12 14l-4.4 3.1 1.3-4.9-3.9-3.1 5.1-.2L12 3z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  printer:'<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  video:'<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  droplet:'<path d="M12 2.7l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  cap:'<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.55 2.9 3.5 6 3.5s6-1.95 6-3.5v-5"/>',
  bed:'<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M2 17h20M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>',
  car:'<path d="M5 17H3v-4l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M9.3 17h5.4"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><rect x="5" y="12" width="14" height="9" rx="1"/><path d="M12 8v13M12 8s-1.6-4.3-4.7-4.3S4.8 7.5 7 8.5 12 8 12 8zM12 8s1.6-4.3 4.7-4.3 2.5 3.8.3 4.8S12 8 12 8z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
};
const categoryIcon = (key, size) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (size?' width="'+size+'" height="'+size+'"':'') + '>' + (ICON_LIBRARY[key]||ICON_LIBRARY.grid) + '</svg>';

const HEART = '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 4.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
const WA_SVG = '<svg viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.1.55 4.14 1.6 5.95L2.05 22l4.33-1.13c1.75.95 3.72 1.46 5.66 1.46h.01c5.46 0 9.9-4.45 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg>';
const VERIFIED = '<span class="verified-badge" title="Verified by Chop Campus admin"><svg viewBox="0 0 24 24"><path d="M12 1.8l2.5 2.5 3.4-.3 1.4 3.1 3.1 1.4-.3 3.4L24 14.4l-2.5 2.5.3 3.4-3.1 1.4-1.4 3.1-3.4-.3L12 29z" transform="scale(.82) translate(2.6 2.6)"/><polyline points="9 12.4 11.3 14.7 15.3 10" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

const DEFAULT_CATEGORIES = [
  {id:'c1',name:'Food & Drinks',icon:'utensils'},{id:'c2',name:'Fashion',icon:'shirt'},
  {id:'c3',name:'Electronics',icon:'phone'},{id:'c4',name:'Beauty',icon:'sparkle'},
  {id:'c5',name:'Books & Stationery',icon:'book'},{id:'c6',name:'Printing & Graphic Design',icon:'printer'},
  {id:'c7',name:'Photography',icon:'camera'},{id:'c8',name:'Videography',icon:'video'},
  {id:'c9',name:'Hair & Barbering',icon:'scissors'},{id:'c10',name:'Repairs',icon:'wrench'},
  {id:'c11',name:'Laundry',icon:'droplet'},{id:'c12',name:'Tutoring',icon:'cap'},
  {id:'c13',name:'Accommodation Essentials',icon:'bed'},{id:'c14',name:'Transport',icon:'car'},
  {id:'c15',name:'Handmade Products',icon:'gift'},{id:'c16',name:'Other Services',icon:'grid'}
];
const U = (id,w) => 'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w='+(w||900)+'&q=80';

// ---------- seed data ----------
function seedAll(){
  const now = Date.now();
  const sellers = [
    {id:'s1',name:'Ama Serwaa',role:'Student seller',business:"Ama's Kitchen",phone:'+233 244 712 903',wa:'233244712903',joined:'Sep 2025',verified:true,suspended:false,bio:'Business IT student cooking fresh daily on campus for two years.'},
    {id:'s2',name:'Kwame Mensah',role:'Independent seller',business:'Mensah Gadgets',phone:'+233 552 318 847',wa:'233552318847',joined:'Oct 2025',verified:false,suspended:false,bio:'Pre-owned phones and laptops at student-friendly prices at Kotokuraba.'},
    {id:'s3',name:'Efua Boateng',role:'Student seller',business:"Efua's Braids & More",phone:'+233 207 654 321',wa:'233207654321',joined:'Nov 2025',verified:false,suspended:false,bio:'Braids, twists and cornrows from my hostel room. Book on WhatsApp.'},
    {id:'s4',name:'Kojo Asante',role:'Independent provider',business:'Asante Tech Hub',phone:'+233 266 120 094',wa:'233266120094',joined:'Aug 2025',verified:false,suspended:false,bio:'Phone and laptop repairs. Free diagnostics, honest quotes.'},
    {id:'s5',name:'Abena Osei',role:'Student seller',business:"Abena's Closet",phone:'+233 248 891 762',wa:'233248891762',joined:'Dec 2025',verified:false,suspended:false,bio:'Thrift fashion, skincare and room essentials every week.'},
    {id:'s6',name:'Kwesi Darko',role:'Independent provider',business:'PrintZone CCTU',phone:'+233 559 007 312',wa:'233559007312',joined:'Jul 2025',verified:false,suspended:false,bio:'Printing, binding, design and passport photos at the Ayensuado junction.'},
    {id:'s7',name:'Adwoa Frimpong',role:'Student seller',business:'',phone:'+233 244 556 781',wa:'233244556781',joined:'Jan 2026',verified:false,suspended:false,bio:'Accounting student. Textbooks, hoodies, laundry and evening tutoring.'},
    {id:'s8',name:'Yaw Owusu',role:'Independent provider',business:'Lens & Light Studio',phone:'+233 209 884 455',wa:'233209884455',joined:'Jun 2025',verified:false,suspended:false,bio:'Photography, videography and campus shuttle runs.'},
    {id:'s9',name:'Bismark Tetteh',role:'Student barber',business:'',phone:'+233 267 733 445',wa:'233267733445',joined:'Nov 2025',verified:false,suspended:false,bio:'Fresh cuts and shaves behind the main gate. Walk-ins welcome.'}
  ];
  const listings = [
    {id:'p1',type:'product',name:'Jollof Rice & Chicken Combo',cat:'Food & Drinks',price:35,priceType:'fixed',desc:'Smoky party jollof made fresh every afternoon, served with grilled chicken, house salad and extra shito on the side.\n\nPickup from the Ayensuado main gate or delivery anywhere on campus for ₵5.',sellerId:'s1',loc:'Ayensuado — Main Gate',campus:'Ayensuado · CCTU',avail:'available',cond:'New',tags:['jollof','lunch','chicken','shito','delivery'],img:U('1512058564366-18510be2db19'),gallery:[U('1512058564366-18510be2db19'),U('1504674900247-0877df9cc836'),U('1555939594-58d7cb561ad1')],featured:true,student:true,status:'published',views:412,createdAt:now-3*H},
    {id:'p2',type:'product',name:'Waakye Pack — Rice, Beans, Stew & Shito',cat:'Food & Drinks',price:25,priceType:'fixed',desc:'Classic waakye packed with your choice of stew. Available Monday to Saturday from 7am till sold out.',sellerId:'s1',loc:'Ayensuado — Main Gate',campus:'Ayensuado · CCTU',avail:'available',cond:'New',tags:['waakye','breakfast','rice','beans'],img:U('1504674900247-0877df9cc836'),featured:false,student:true,status:'published',views:384,createdAt:now-9*H},
    {id:'p3',type:'product',name:'Grilled Chicken & Chips',cat:'Food & Drinks',price:45,priceType:'fixed',desc:'Quarter chicken grilled to order with crispy chips and pepper sauce. Ready in 10 minutes.',sellerId:'s1',loc:'Ayensuado — Main Gate',campus:'Ayensuado · CCTU',avail:'available',cond:'New',tags:['chicken','chips','grilled'],img:U('1555939594-58d7cb561ad1'),featured:false,student:true,status:'published',views:203,createdAt:now-70*H},
    {id:'p4',type:'product',name:"Students' Breakfast Pack — Tea, Bread & Eggs",cat:'Food & Drinks',price:18,priceType:'fixed',desc:'Hot Lipton, two slices of bread and two eggs — starts at 6:30am daily. Perfect before 8am lectures.',sellerId:'s1',loc:'Ayensuado — Main Gate',campus:'Ayensuado · CCTU',avail:'available',cond:'New',tags:['breakfast','tea','eggs','morning'],img:U('1482049016688-2d3e1b311543'),featured:false,student:true,status:'published',views:98,createdAt:now-5*H},
    {id:'p5',type:'product',name:'Samsung Galaxy A54 — 8GB RAM / 128GB',cat:'Electronics',price:1800,priceType:'negotiable',cond:'Used — Excellent',desc:'Used for 8 months, always in a case with a screen protector. Battery health 94%. Includes box, charger and 3 months warranty from me.',sellerId:'s2',loc:'Kotokuraba Market, Stall 14',campus:'Ayensuado · CCTU',avail:'available',tags:['samsung','galaxy','a54','phone','smartphone'],img:U('1511707171634-5f897ff02aa9'),featured:true,student:false,status:'published',views:356,createdAt:now-30*H},
    {id:'p6',type:'product',name:'Wireless Earbuds — Noise Cancelling',cat:'Electronics',price:120,priceType:'fixed',cond:'New',desc:'Brand new TWS earbuds with ANC, 36-hour total battery with the case, Bluetooth 5.3. Sealed in box with receipt.',sellerId:'s2',loc:'Kotokuraba Market, Stall 14',campus:'Ayensuado · CCTU',avail:'available',tags:['earbuds','tws','bluetooth','audio'],img:U('1590658268037-6bf12165a41',700),featured:false,student:false,status:'published',views:289,createdAt:now-50*H},
    {id:'p7',type:'product',name:'MacBook Pro 2019 — 13” i5 / 8GB / 256GB SSD',cat:'Electronics',price:4500,priceType:'negotiable',cond:'Used — Good',desc:'2019 MacBook Pro 13-inch, Intel i5, 8GB RAM, 256GB SSD. Battery cycle count 340. Minor keyboard wear — otherwise flawless. Charger included.',sellerId:'s2',loc:'Kotokuraba Market, Stall 14',campus:'Ayensuado · CCTU',avail:'available',tags:['macbook','apple','laptop','pro'],img:U('1496181133206-c80f41f14745'),featured:false,student:false,status:'published',views:174,createdAt:now-95*H},
    {id:'p8',type:'product',name:'Portable Bluetooth Speaker — Flip 6 Class',cat:'Electronics',price:650,priceType:'negotiable',cond:'New',desc:'Loud, bass-heavy portable speaker. 12-hour battery, IPX7 waterproof, aux + Bluetooth. Great for hostel vibes and study sessions.',sellerId:'s2',loc:'Kotokuraba Market, Stall 14',campus:'Ayensuado · CCTU',avail:'available',tags:['speaker','bluetooth','jbl','music'],img:U('1545454675-3531b543be5d',700),featured:false,student:false,status:'published',views:140,createdAt:now-90*H},
    {id:'p9',type:'product',name:'CCTU Campus Hoodie — Unisex, Baggy Fit',cat:'Fashion',price:95,priceType:'fixed',cond:'New',desc:'The official-style campus hoodie. Heavyweight fleece, embroidered CCTU crest. Sizes S, M, L, XL, XXL. Pre-order takes 3 days; ready stock for M and L.',sellerId:'s7',loc:'Lecture Block 3, Room 12',campus:'Ayensuado · CCTU',avail:'available',tags:['hoodie','cctu','campus','fashion','unisex'],img:U('1556821840-3a63f95609a7'),featured:true,student:true,status:'published',views:324,createdAt:now-8*H},
    {id:'p10',type:'product',name:'Oversized White Tee — Cotton',cat:'Fashion',price:60,priceType:'fixed',cond:'New',desc:'Oversized heavyweight cotton tee, true to size. White, black and sand available.',sellerId:'s5',loc:'Ayensuado Hostels, Block A',campus:'Ayensuado · CCTU',avail:'available',tags:['tshirt','tee','oversized','white'],img:U('1521572163474-6864f9cf17ab'),featured:false,student:true,status:'published',views:98,createdAt:now-140*H},
    {id:'p11',type:'product',name:'Ankara Fabric — 6 Yards',cat:'Fashion',price:220,priceType:'fixed',cond:'New',desc:'Premium ankara, 6 yards. Multiple prints available — message on WhatsApp with your preferred colour family.',sellerId:'s5',loc:'Ayensuado Hostels, Block A',campus:'Ayensuado · CCTU',avail:'available',tags:['ankara','fabric','african','print'],img:U('1539109136881-3be0616acf4b'),featured:false,student:true,status:'published',views:132,createdAt:now-150*H},
    {id:'p12',type:'product',name:'White Leather Sneakers — Unisex',cat:'Fashion',price:180,priceType:'negotiable',cond:'New',desc:'Clean white leather sneakers, sizes 39–45. Box included. Perfect campus everyday shoe.',sellerId:'s5',loc:'Ayensuado Hostels, Block A',campus:'Ayensuado · CCTU',avail:'available',tags:['sneakers','shoes','white','leather'],img:U('1525966222134-fcfa99b8ae77'),featured:false,student:true,status:'published',views:260,createdAt:now-65*H},
    {id:'p13',type:'product',name:'Engineering Graphics Set — Complete',cat:'Books & Stationery',price:85,priceType:'fixed',cond:'New',desc:'Full graphics set: T-square, compass, dividers, set squares, mini drafter, pencils and eraser. Everything first-years need for EGN 121.',sellerId:'s7',loc:'Lecture Block 3, Room 12',campus:'Ayensuado · CCTU',avail:'available',tags:['engineering','graphics','stationery','drafter'],img:U('1456735190827-d1262f71b8a3',700),featured:false,student:true,status:'published',views:87,createdAt:now-60*H},
    {id:'p14',type:'product',name:'Business School Textbooks Bundle — 4 Books',cat:'Books & Stationery',price:40,priceType:'fixed',cond:'Used — Good',desc:'Introduction to Business (3rd ed.), Financial Accounting, Principles of Economics and Business Mathematics. Highlighting is light.',sellerId:'s7',loc:'Lecture Block 3, Room 12',campus:'Ayensuado · CCTU',avail:'available',tags:['textbooks','accounting','economics','business'],img:U('1544947950-fa07a98d237f'),featured:false,student:true,status:'published',views:76,createdAt:now-80*H},
    {id:'p15',type:'product',name:'Accounting Past Questions + Lecture Notes',cat:'Books & Stationery',price:25,priceType:'fixed',cond:'New',desc:'10 years of CCTU Financial Accounting past questions with worked solutions, plus my complete Level 200 handwritten notes (PDF and print).',sellerId:'s7',loc:'Lecture Block 3, Room 12',campus:'Ayensuado · CCTU',avail:'available',tags:['past questions','accounting','notes','cctu'],img:U('1481627834876-b7833e8f5570'),featured:false,student:true,status:'published',views:151,createdAt:now-100*H},
    {id:'p16',type:'product',name:'Black Soap & Shea Skincare Bundle',cat:'Beauty',price:60,priceType:'fixed',cond:'New',desc:'Handmade black soap (x2), raw shea butter, shea body oil and a neem oil face serum. Great gift bundle for your roommate too.',sellerId:'s5',loc:'Ayensuado Hostels, Block A',campus:'Ayensuado · CCTU',avail:'available',tags:['skincare','black soap','shea butter','natural'],img:U('1571781926291-c477ebfd024b',700),featured:false,student:true,status:'published',views:190,createdAt:now-75*H},
    {id:'p17',type:'product',name:'All-Natural Shea Butter — 500ml Jar',cat:'Beauty',price:45,priceType:'fixed',cond:'New',desc:'Raw, unrefined shea butterdirect from Northern Ghana. Great for skin, hair and lips.',sellerId:'s5',loc:'Ayensuado Hostels, Block A',campus:'Ayensuado · CCTU',avail:'available',tags:['shea butter','natural','hair','skin'],img:U('1608248543803-ba4f8c70ae0b',700),featured:false,student:true,status:'published',views:165,createdAt:now-85*H},
    {id:'p18',type:'product',name:'Handmade Beaded Bracelet Set — 3 Pieces',cat:'Handmade Products',price:45,priceType:'fixed',cond:'New',desc:'Three handmade beaded bracelets in earthy tones. Adjustable, gold-plated charms. Made to order in 2 days.',sellerId:'s5',loc:'Ayensuado Hostels, Block A',campus:'Ayensuado · CCTU',avail:'sold',tags:['bracelets','beads','handmade','jewelry'],img:U('1535632066927-ab7c9ab60908',700),featured:false,student:true,status:'published',views:121,createdAt:now-110*H},
    {id:'p19',type:'product',name:'Hostel Starter Bundle — Bucket, Plates, Cutlery, Lamp & Kettle',cat:'Accommodation Essentials',price:350,priceType:'fixed',cond:'New',desc:'Everything a fresher needs for the room: bucket with lid, 2 plates, 2 bowls, cutlery set, rechargeable LED lamp and an electric kettle.',sellerId:'s2',loc:'Kotokuraba Market, Stall 14',campus:'Ayensuado · CCTU',avail:'available',tags:['hostel','bundle','fresher','room','essentials'],img:U('1560448204-e02f11c3d0e2'),featured:true,student:false,status:'published',views:233,createdAt:now-48*H},
    {id:'p20',type:'service',name:'Printing & Photocopying — from ₵1 per page',cat:'Printing & Graphic Design',price:1,priceType:'starting',desc:'Black & white or colour printing straight from your phone or USB. Spiral binding, laminating, passport photos, and soft copies of long assignments.\n\nBulk discounts for departments — bring your project to PrintZone.',sellerId:'s6',loc:'Ayensuado Junction — next to Main Gate',campus:'Ayensuado · CCTU',avail:'available',tags:['printing','photocopy','binding','passport photos','assignments'],img:U('1486312338219-ce68d2c6f44d',800),featured:true,student:false,status:'published',views:405,createdAt:now-12*H},
    {id:'p21',type:'service',name:'Graphic Design — Flyers, Logos, Posters & More',cat:'Printing & Graphic Design',price:0,priceType:'quote',desc:'Flyers, funeral and wedding programmes, logos, business cards, social media creatives and event posters. Same-day delivery for urgent work.\n\nSend your reference on WhatsApp and I will quote within the hour.',sellerId:'s6',loc:'Ayensuado Junction — next to Main Gate',campus:'Ayensuado · CCTU',avail:'available',tags:['design','graphic','flyer','logo','poster','branding'],img:U('1561070791-2526d30994b5',800),featured:false,student:false,status:'published',views:342,createdAt:now-26*H},
    {id:'p22',type:'service',name:'Box Braids & Twists — Fresh Set',cat:'Hair & Barbering',price:150,priceType:'starting',desc:'Fresh box braids, twists and cornrows by appointment. Includes wash and blow-dry. Bring your own hair or buy braiding hair directly from me.\n\nWeekend slots fill fast — book at least 2 days ahead on WhatsApp.',sellerId:'s3',loc:'Ayensuado Hostels, Block C — Room 42',campus:'Ayensuado · CCTU',avail:'available',tags:['braids','twists','hair','salon','box braids'],img:U('1522337660859-02fbefca4702'),featured:true,student:true,status:'published',views:298,createdAt:now-26*H},
    {id:'p23',type:'service',name:'Fresh Cuts & Shaves — Walk-Ins Welcome',cat:'Hair & Barbering',price:30,priceType:'fixed',desc:'Skin fades, line-ups, beard trims and hot towel shaves. Walk-ins welcome; peak hours are 6–9pm. Behind the main gate, blue container.',sellerId:'s9',loc:'Behind CCTU Main Gate — Blue Container',campus:'Ayensuado · CCTU',avail:'available',tags:['barber','haircut','fade','shave','beard'],img:U('1503951914875-452162b4141d'),featured:false,student:true,status:'published',views:271,createdAt:now-55*H},
    {id:'p24',type:'service',name:'Phone & Laptop Repairs — Free Diagnostics',cat:'Repairs',price:0,priceType:'quote',desc:'Screen replacements, charging ports, battery swaps, motherboard-level repair, software flashing and data recovery.\n\nDiagnostics are always free. If I cannot fix it, you pay nothing.',sellerId:'s4',loc:'Ayensuado Junction',campus:'Ayensuado · CCTU',avail:'available',tags:['repair','phone','laptop','screen','battery','flashing'],img:U('1621905251189-08b45e6a269e'),featured:false,student:false,status:'published',views:258,createdAt:now-32*H},
    {id:'p25',type:'service',name:'Laundry — Wash, Dry & Fold (per basket)',cat:'Laundry',price:40,priceType:'fixed',desc:'Drop your laundry any day before 6pm and pick up fresh, folded and smelling like heaven within 48 hours. Detergent included.\n\nWeekly customers get a small discount.',sellerId:'s7',loc:'Ayensuado Hostels, Block B',campus:'Ayensuado · CCTU',avail:'available',tags:['laundry','wash','fold','hostel'],img:U('1582735689369-4fe89db7114c'),featured:false,student:true,status:'published',views:149,createdAt:now-70*H},
    {id:'p26',type:'service',name:'Maths & Accounting Tutoring — Per Hour',cat:'Tutoring',price:60,priceType:'fixed',desc:'Private and group tutoring: Core & Elective Maths, Financial Accounting, Cost Accounting, past-question drills.\n\nWASSCE preparation and university-level (Level 100–300). Evening and weekend slots. Online available.',sellerId:'s7',loc:'Tutoring at your hostel or online',campus:'Ayensuado · CCTU',avail:'available',tags:['tutoring','maths','accounting','lessons','past questions'],img:U('1522202176988-66273c2fd55f'),featured:false,student:true,status:'published',views:187,createdAt:now-58*H},
    {id:'p27',type:'service',name:'Event Photography — Birthdays, Dinners & Campus Events',cat:'Photography',price:500,priceType:'starting',desc:'Full-service event coverage with edited digital delivery within 72 hours. Albums and framed prints available at extra cost.\n\nAvailable weekends and evenings. Graduation shoots a specialty.',sellerId:'s8',loc:'Available anywhere in Cape Coast',campus:'Ayensuado · CCTU',avail:'available',tags:['photography','events','birthday','graduation','coverage'],img:U('1516035069371-29a1b244cc32'),featured:true,student:false,status:'published',views:214,createdAt:now-36*H},
    {id:'p28',type:'service',name:'Event Videography & Edits',cat:'Videography',price:0,priceType:'quote',desc:'Videography for hall dinners, chapel services, class nights and campus events. Highlight reels for social media and full edits for YouTube.\n\nDrone shots available for outdoor events. Tell me your date and venue for a quote.',sellerId:'s8',loc:'Available anywhere in Cape Coast',campus:'Ayensuado · CCTU',avail:'available',tags:['videography','video','editing','events','drone'],img:U('1485846234645-a62644f84728'),featured:false,student:false,status:'published',views:133,createdAt:now-45*H},
    {id:'p29',type:'service',name:'Campus Shuttle & City Runs — Town, Accra Weekends',cat:'Transport',price:20,priceType:'starting',desc:'Campus-to-town shuttle every hour from 6am to 10pm for ₵20. Weekend runs to Accra (₵80) and Kumasi (₵100) — safe, reliable and on time.\n\nBook your seat on WhatsApp a day before.',sellerId:'s8',loc:'Ayensuado — Main Gate (pickup point)',campus:'Ayensuado · CCTU',avail:'available',tags:['transport','shuttle','ride','accra','kumasi','town'],img:U('1449965408869-eaa3f722e40'),featured:false,student:false,status:'published',views:176,createdAt:now-80*H},
    {id:'p30',type:'service',name:'Hostel Room Deep Clean',cat:'Other Services',price:50,priceType:'fixed',desc:'Full room reset: sweeping, mopping, dusting, window wiping and bin emptying. Bring your own supplies or use mine for ₵10 extra. Weekends available.',sellerId:'s5',loc:'Ayensuado Hostels',campus:'Ayensuado · CCTU',avail:'available',tags:['cleaning','room','deep clean','hostel'],img:U('1581578731548-c64695cc6952'),featured:false,student:true,status:'published',views:84,createdAt:now-95*H},
    {id:'b31',type:'business',name:"Ama's Kitchen",cat:'Food & Drinks',price:0,priceType:'na',hours:'Mon–Sat · 11:00–21:00',desc:'Campus kitchen serving freshly cooked jollof, waakye, banku and grilled tilapia daily. Made to order with local ingredients — order ahead on WhatsApp.',sellerId:'s1',loc:'Ayensuado — Main Gate',campus:'Ayensuado · CCTU',avail:'available',tags:['restaurant','food','jollof','waakye','kitchen'],img:U('1556910103-1c02745aae4d'),gallery:[U('1556910103-1c02745aae4d'),U('1512058564366-18510be2db19'),U('1555939594-58d7cb561ad1')],featured:true,student:true,status:'published',views:520,createdAt:now-200*H},
    {id:'b32',type:'business',name:'PrintZone CCTU',cat:'Printing & Graphic Design',price:0,priceType:'na',hours:'Mon–Sat · 08:00–19:00',desc:'One-stop print shop: printing, photocopying, spiral binding, passport photos, laminating and professional graphic design. Trusted by departments across campus.',sellerId:'s6',loc:'Ayensuado Junction — next to Main Gate',campus:'Ayensuado · CCTU',avail:'available',tags:['printing','print shop','binding','design','passport photos'],img:U('1561070791-2526d30994b5'),gallery:[U('1561070791-2526d30994b5'),U('1486312338219-ce68d2c6f44d')],featured:true,student:false,status:'published',views:388,createdAt:now-210*H},
    {id:'b33',type:'business',name:'Lens & Light Studio',cat:'Photography',price:0,priceType:'na',hours:'By appointment · weekends + evenings',desc:'Studio and on-location photography and videography. Campus portraits, graduation shoots, event coverage and same-week edits.',sellerId:'s8',loc:'Ayensuado Hostels',campus:'Ayensuado · CCTU',avail:'available',tags:['photography','videography','studio','events','graduation'],img:U('1516035069371-29a1b244cc32'),featured:true,student:false,status:'published',views:247,createdAt:now-260*H},
    {id:'b34',type:'business',name:'Mensah Gadgets',cat:'Electronics',price:0,priceType:'na',hours:'Mon–Sat · 09:00–18:00',desc:'New and quality pre-owned phones, laptops, earbuds and accessories at student-friendly prices. MoMo payment accepted, receipts issued. Warranty on selected refurbs.',sellerId:'s2',loc:'Kotokuraba Market, Stall 14',campus:'Ayensuado · CCTU',avail:'available',tags:['phones','laptops','gadgets','earbuds','electronics'],img:U('1531297484001-80022131f5a1'),gallery:[U('1531297484001-80022131f5a1'),U('1496181133206-c80f41f14745'),U('1511707171634-5f897ff02aa9')],featured:true,student:false,status:'published',views:301,createdAt:now-170*H},
    {id:'b35',type:'business',name:"Efua's Braids & More",cat:'Hair & Barbering',price:0,priceType:'na',hours:'Tue–Sun · 09:00–20:00',desc:'Braids, twists, cornrows and wash treatments from the hostels. Walk-ins when slots allow; weekend booking recommended.',sellerId:'s3',loc:'Ayensuado Hostels, Block C — Room 42',campus:'Ayensuado · CCTU',avail:'available',tags:['braids','hair','salon','twists'],img:U('1522337660859-02fbefca4702'),featured:false,student:true,status:'published',views:226,createdAt:now-120*H},
    {id:'b36',type:'business',name:'Asante Tech Hub',cat:'Repairs',price:0,priceType:'na',hours:'Mon–Sat · 09:00–19:00',desc:'Phone and laptop repairs, screen replacements, software flashing, unlocking and accessories. Free diagnostics, honest quotes, most jobs done same-day.',sellerId:'s4',loc:'Ayensuado Junction',campus:'Ayensuado · CCTU',avail:'available',tags:['repair','phone','laptop','unlocking','flashing'],img:U('1621905251189-08b45e6a269e'),featured:false,student:false,status:'published',views:269,createdAt:now-300*H},
    {id:'b37',type:'business',name:"Abena's Closet",cat:'Fashion',price:0,priceType:'na',hours:'Daily · 17:00–21:00',desc:'Thrift and pre-loved fashion: hoodies, denim, sneakers and ankara pieces. New arrivals every Friday evening at the hostels.',sellerId:'s5',loc:'Ayensuado Hostels, Block A',campus:'Ayensuado · CCTU',avail:'available',tags:['fashion','thrift','clothing','ankara','sneakers'],img:U('1490481651871-ab68de25d43d'),featured:false,student:true,status:'published',views:158,createdAt:now-140*H},
    // pending seller submissions (admin review queue)
    {id:'sub1',type:'product',name:'Homemade Chin Chin — 1kg Bag',cat:'Food & Drinks',price:30,priceType:'fixed',cond:'New',desc:'Crunchy homemade chin chin fried fresh every weekend. 1kg bag; family-size bags available on request. Pickup at Ayensuado Hostels, Block D.',sellerId:null,sellerName:'Selorm Nutakor',sellerPhone:'+233 201 127 788',loc:'Ayensuado Hostels, Block D',campus:'Ayensuado · CCTU',avail:'available',tags:['chin chin','snacks','homemade'],img:U('1604328698692-f76ea9498e76'),gallery:[],featured:false,student:true,status:'pending',views:0,createdAt:now-6*H},
    {id:'sub2',type:'service',name:'Bridal & Party Makeup — Full Glam',cat:'Beauty',price:200,priceType:'starting',cond:'—',desc:'Full glam for weddings, dinners and photoshoots — bridal trials available. Travel within Cape Coast for a small fee.',sellerId:null,sellerName:'Naa Adoley Mensah',sellerPhone:'+233 245 678 899',loc:'Cape Coast Metro',campus:'Ayensuado · CCTU',avail:'available',tags:['makeup','bridal','glam','wedding'],img:U('1487412947147-5cebf100ffc2',800),gallery:[],featured:false,student:false,status:'pending',views:0,createdAt:now-30*H},
    {id:'sub3',type:'product',name:'LED Desk Lamp — Rechargeable, 3 Levels',cat:'Electronics',price:90,priceType:'fixed',cond:'New',desc:'Rechargeable LED desk lamp with 3 brightness levels and a USB charging port. Perfect for hostel reading and late-night assignments.',sellerId:null,sellerName:'Daniel Attoh',sellerPhone:'+233 559 081 123',loc:'Kotokuraba Market',campus:'Ayensuado · CCTU',avail:'available',tags:['lamp','led','rechargeable','desk'],img:U('1534787238916-9ba6764efd4f',800),gallery:[],featured:false,student:false,status:'pending',views:0,createdAt:now-50*H}
  ];
  const reports = [
    {id:'r1',listingId:'p8',reason:'Misleading information',details:'Advertised as new, but the seller could not confirm where it was purchased. Possible replica sold as original.',reporter:'Anonymous student',status:'open',createdAt:now-20*H},
    {id:'r2',listingId:'p7',reason:'Suspect pricing / too good to be true',details:'Price seems too good for the stated specs. Want it confirmed before arranging pickup.',reporter:'Kwabena, Level 300',status:'open',createdAt:now-60*H}
  ];
  const activity = [
    {id:'a1',icon:'flag',text:'Report filed on “Portable Bluetooth Speaker — Flip 6 Class”',time:now-20*H},
    {id:'a2',icon:'inbox',text:'Selorm Nutakor submitted “Homemade Chin Chin — 1kg Bag” for review',time:now-6*H},
    {id:'a3',icon:'check',text:'“CCTU Campus Hoodie” approved and published',time:now-8*H}
  ];
  return {sellers, listings, reports, activity, categories:JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)), v:3};
}

// ---------- persistent store ----------
const DBKEY = 'chop_campus_db_v3';
const store = {
  db:null,
  load(){
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DBKEY)); } catch(e){ d = null; }
    if (!d || !Array.isArray(d.listings)) {
      d = seedAll();
      try { localStorage.setItem(DBKEY, JSON.stringify(d)); } catch(e){}
    }
    this.db = d;
  },
  save(){
    try { localStorage.setItem(DBKEY, JSON.stringify(this.db)); }
    catch(e){ toast('Storage is full — try removing very large uploaded images.', 'warn'); }
  }
};
const getSeller = id => store.db.sellers.find(s => s.id === id) || null;
function sellerOf(l){
  if (l.sellerId){ const s = getSeller(l.sellerId); if (s) return s; }
  const ph = l.sellerPhone || '', d = intlNumber(ph);
  return {id:null, name:l.sellerName || 'Independent seller', role:'Seller', phone:ph, wa:d, joined:'2026', verified:false, suspended:false, bio:''};
}
const sellerSuspended = l => { const s = l.sellerId ? getSeller(l.sellerId) : null; return !!(s && s.suspended); };
const publishedListings = () => store.db.listings.filter(l => l.status === 'published' && !sellerSuspended(l));
const listingById = id => store.db.listings.find(l => l.id === id) || null;
const catCount = name => publishedListings().filter(l => l.cat === name).length;

// ---------- favourites ----------
let favs = new Set();
function loadFavs(){ try { favs = new Set(JSON.parse(localStorage.getItem('chop_favs')||'[]')); } catch(e){ favs = new Set(); } }
function saveFavs(){ try { localStorage.setItem('chop_favs', JSON.stringify([...favs])); } catch(e){} updateFavBadge(); }
function updateFavBadge(){ const b = $('#favBadge'); if (b) b.textContent = favs.size; }
function toggleFav(id, ev){
  if (ev) ev.stopPropagation();
  if (favs.has(id)) { favs.delete(id); toast('Removed from favourites'); } else { favs.add(id); toast('Saved to favourites'); }
  saveFavs();
  $$('.fav-toggle[data-fav-id]').forEach(btn => btn.classList.toggle('active', favs.has(btn.dataset.favId)));
  if (currentView() === 'favourites') renderFavourites();
}

// ---------- toast ----------
function toast(msg, type){
  const el = $('#toast'), m = $('#toastMsg');
  m.textContent = msg;
  el.classList.toggle('warn', type === 'warn');
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3600);
}

// ---------- modal helpers ----------
function openModal(sel){ const m = $(sel); if (m){ m.classList.add('open'); document.body.style.overflow='hidden'; } }
function closeModal(sel){ const m = $(sel); if (m){ m.classList.remove('open'); document.body.style.overflow=''; } }
document.addEventListener('click', e => {
  const closer = e.target.closest('[data-close-modal]');
  if (closer){ closeModal(closer.getAttribute('data-close-modal')); return; }
  if (e.target.classList && e.target.classList.contains('overlay')){ e.target.classList.remove('open'); document.body.style.overflow=''; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ $$('.overlay.open').forEach(o => o.classList.remove('open')); document.body.style.overflow=''; closeDrawer(); closeCampusMenu(); $('#filterPanel').classList.remove('open'); $('#filterBackdrop').classList.remove('open'); }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||''))){ e.preventDefault(); const t = window.innerWidth > 1024 ? $('#headerSearchInput') : $('#mobileSearchInput'); if (t) t.focus(); }
});

// generic confirm
let confirmCb = null;
function askConfirm(title, msg, yesLabel, cb){ $('#confirmTitle').textContent = title; $('#confirmMsg').textContent = msg; $('#confirmYesBtn').textContent = yesLabel || 'Confirm'; confirmCb = cb; openModal('#confirmModal'); }
$('#confirmYesBtn').addEventListener('click', () => { closeModal('#confirmModal'); if (confirmCb) confirmCb(); confirmCb = null; });

// generic prompt
let promptCb = null;
function askPrompt(title, label, placeholder, yesLabel, cb){ $('#promptTitle').textContent = title; $('#promptLabel').textContent = label; const inp = $('#promptInput'); inp.value=''; inp.placeholder = placeholder||''; $('#promptYesBtn').textContent = yesLabel||'Save'; promptCb = cb; openModal('#promptModal'); setTimeout(()=>inp.focus(),80); }
$('#promptYesBtn').addEventListener('click', () => { const v = $('#promptInput').value.trim(); closeModal('#promptModal'); if (promptCb) promptCb(v); promptCb = null; });

// ---------- image compression (uploads) ----------
function compressImageFile(file, cb){
  if (!file) return cb(null);
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200, scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      try { cb(c.toDataURL('image/jpeg', 0.82)); } catch(e){ cb(ev.target.result); }
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ---------- price rendering ----------
function priceHTML(l){
  if (l.type === 'business' || l.priceType === 'na') return '';
  switch (l.priceType){
    case 'negotiable': return '<span class="price">'+fmtMoney(l.price)+'</span><span class="tag tag-nego">Negotiable</span>';
    case 'starting':   return '<span class="price"><small>FROM</small> '+fmtMoney(l.price)+'</span>';
    case 'quote':      return '<span class="tag tag-quote" style="font-size:12px;padding:5px 12px">Quote on request</span>';
    default:           return '<span class="price">'+fmtMoney(l.price)+'</span>';
  }
}

function waLinkFor(s, l){
  const d = intlNumber(s.wa || s.phone);
  const first = String(s.name||'').split(' ')[0];
  const msg = 'Hi ' + first + '! I found \u201C' + l.name + '\u201D on Chop Campus Marketplace. Is it still available?';
  return 'https://wa.me/' + d + '?text=' + encodeURIComponent(msg);
}
function telLinkFor(s){ return 'tel:+' + intlNumber(s.phone || s.wa); }

// ---------- card templates ----------
const typeLabel = l => l.type === 'product' ? 'Product' : l.type === 'service' ? 'Service' : 'Business';
function cardHTML(l){
  const s = sellerOf(l);
  const isFav = favs.has(l.id);
  const sold = l.avail !== 'available';
  return '<article class="card" data-id="'+l.id+'">'
    + '<div class="card-media">'
    +   '<img src="'+esc(l.img)+'" alt="'+esc(l.name)+'" loading="lazy" decoding="async" onerror="'+ONERR+'">'
    +   (l.featured ? '<span class="badge-feat">'+STAR+'Featured</span>' : '')
    +   (sold ? '<span class="badge-avail">'+(l.avail==='sold'?'Sold out':'Unavailable')+'</span>' : '')
    +   '<button class="fav-toggle'+(isFav?' active':'')+'" data-fav-id="'+l.id+'" onclick="toggleFav(\''+l.id+'\',event)" aria-label="Save to favourites" aria-pressed="'+isFav+'">'+HEART+'</button>'
    + '</div>'
    + '<div class="card-body">'
    +   '<span class="card-cat"><i>'+typeLabel(l)+'</i> · '+esc(l.cat)+'</span>'
    +   '<h3 class="card-title"><a href="#/listing/'+l.id+'">'+esc(l.name)+'</a></h3>'
    +   '<div class="card-price">'+priceHTML(l)+(l.student?'<span class="tag tag-student">Student-owned</span>':'')+'</div>'
    +   '<div class="card-meta">'+PIN+'<span>'+esc(l.loc)+'</span></div>'
    +   '<div class="card-foot"><span class="seller-mini"><span class="mini-av">'+initials(s.name)+'</span><span>'+esc(s.name)+'</span></span>'
    +     '<a class="mini-wa" href="'+waLinkFor(s,l)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+WA_SVG+'WhatsApp</a>'
    +   '</div>'
    + '</div></article>';
}
const BIZ_COLORS = ['#9A3B0F','#166534','#1E3A5F','#5B21B6','#7C2D12','#0F5257'];
function bizColor(id){ let h=0; for(let i=0;i<id.length;i++) h=(h*31 + id.charCodeAt(i))>>>0; return BIZ_COLORS[h % BIZ_COLORS.length]; }
function bizCardHTML(b){
  const s = sellerOf(b);
  const hours = b.hours || '';
  return '<article class="biz-card">'
    + '<div class="biz-top"><div class="biz-logo" style="background:'+bizColor(b.id)+'">'+initials(b.name)+'</div>'
    +   '<div><h3 class="biz-name">'+esc(b.name)+(s.verified?VERIFIED:'')+'</h3><div class="biz-cat-line">'+esc(b.cat).toUpperCase()+(b.student?' · STUDENT-OWNED':' · INDEPENDENT')+'</div></div>'
    + '</div>'
    + '<p class="biz-desc">'+esc(b.desc)+'</p>'
    + '<div class="biz-meta"><span>'+PIN+esc(b.loc)+'</span>'+(hours?'<span><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" style="stroke:#A8A19A"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>'+esc(hours)+'</span>':'')+'</div>'
    + '<div class="biz-actions"><a class="btn btn-dark btn-sm" href="#/listing/'+b.id+'" style="flex:1">View business</a><a class="btn btn-wa btn-sm" href="'+waLinkFor(s,b)+'" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">'+WA_SVG+'</a></div>'
    + '</article>';
}
const cardsFor = arr => arr.map(cardHTML).join('');
const bizCardsFor = arr => arr.map(bizCardHTML).join('');

// ---------- rails ----------
function fillRail(id, html){ const el = document.getElementById(id); if (el) el.innerHTML = html || '<p style="color:var(--muted);font-size:13px;padding:30px 10px">Nothing here yet — check back soon.</p>'; }
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-rail]');
  if (btn){ const rail = document.getElementById(btn.dataset.rail); if (rail) rail.scrollBy({left:(+btn.dataset.dir)*480, behavior:'smooth'}); }
});

// ---------- category UI ----------
function refreshCategoryUI(){
  const cats = store.db.categories;
  // header quick nav (desktop)
  $('#catNavLinks').innerHTML = cats.slice(0,9).map(c => '<a href="#/browse?cat='+encodeURIComponent(c.name)+'">'+esc(c.name)+'</a>').join('') + '<a href="#/browse" class="all">All categories →</a>';
  // drawer grid
  $('#drawerCats').innerHTML = cats.map(c => '<a class="drawer-cat" href="#/browse?cat='+encodeURIComponent(c.name)+'">'+categoryIcon(c.icon)+esc(c.name)+'</a>').join('');
  // home grid
  $('#catGrid').innerHTML = cats.map(c => {
    const n = catCount(c.name);
    return '<a class="cat-item" href="#/browse?cat='+encodeURIComponent(c.name)+'"><span class="cat-ic">'+categoryIcon(c.icon)+'</span><b>'+esc(c.name)+'</b><small>'+n+' listing'+(n===1?'':'s')+'</small></a>';
  }).join('');
  // browse sidebar
  $('#fCatList').innerHTML = '<button class="f-cat-item'+(browseState.cat===''?' active':'')+'" data-cat="">All categories<small>'+publishedListings().length+'</small></button>'
    + cats.map(c => '<button class="f-cat-item'+(browseState.cat===c.name?' active':'')+'" data-cat="'+esc(c.name)+'">'+esc(c.name)+'<small>'+catCount(c.name)+'</small></button>').join('');
  // sell + admin form selects
  ['#sellCategory','#alCat'].forEach(sel => { const el = $(sel); if (el) el.innerHTML = cats.map(c => '<option value="'+esc(c.name)+'">'+esc(c.name)+'</option>').join(''); });
  // admin category icon select
  const iconSel = $('#newCatIcon');
  if (iconSel && !iconSel.options.length) iconSel.innerHTML = Object.keys(ICON_LIBRARY).map(k => '<option value="'+k+'">'+k.charAt(0).toUpperCase()+k.slice(1)+' icon</option>').join('');
}

// ---------- HOME render ----------
function renderHome(){
  refreshCategoryUI();
  const pub = publishedListings();
  const featuredBiz = pub.filter(l => l.type==='business' && l.featured);
  const bizPool = featuredBiz.length >= 3 ? featuredBiz : pub.filter(l => l.type==='business');
  fillRail('railFeatured', bizCardsFor(bizPool.slice(0,8)));
  fillRail('railPopular', cardsFor([...pub].sort((a,b)=>b.views-a.views).slice(0,12)));
  fillRail('railProducts', cardsFor(pub.filter(l=>l.type==='product').sort((a,b)=>b.createdAt-a.createdAt).slice(0,12)));
  fillRail('railServices', cardsFor(pub.filter(l=>l.type==='service').sort((a,b)=>b.createdAt-a.createdAt).slice(0,12)));
  fillRail('railStudent', cardsFor(pub.filter(l=>l.student).sort((a,b)=>b.views-a.views).slice(0,12)));
  fillRail('railRecent', cardsFor([...pub].sort((a,b)=>b.createdAt-a.createdAt).slice(0,12)));
}

// ---------- SEARCH / suggestions ----------
function searchIndex(){
  const pub = publishedListings();
  const cats = store.db.categories;
  return {pub, cats};
}
function suggestionItems(q){
  const {pub, cats} = searchIndex();
  const ql = q.trim().toLowerCase();
  const out = [];
  if (!ql){
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('chop_recent')||'[]'); } catch(e){}
    recent.slice(0,5).forEach(r => out.push({kind:'recent', label:r, sub:'Recent search', go:'#/browse?q='+encodeURIComponent(r)}));
    if (out.length) return out;
    ['waakye','printing','hoodie','braiding','laundry'].forEach(r => out.push({kind:'popular', label:r, sub:'Popular search', go:'#/browse?q='+encodeURIComponent(r)}));
    return out;
  }
  cats.filter(c => c.name.toLowerCase().includes(ql)).slice(0,2).forEach(c => out.push({kind:'category', label:c.name, sub:'Category', icon:categoryIcon(c.icon), go:'#/browse?cat='+encodeURIComponent(c.name)}));
  pub.filter(l => l.name.toLowerCase().includes(ql) || (l.tags||[]).some(t=>t.includes(ql))).sort((a,b)=>b.views-a.views).slice(0,5).forEach(l => out.push({kind:'listing', label:l.name, sub:typeLabel(l)+' · '+fmtMoney(l.price)+(l.priceType==='quote'?'Quote':''), go:'#/listing/'+l.id}));
  return out.slice(0,8);
}
function renderSuggestPanel(panel, q){
  const items = suggestionItems(q);
  if (!items.length){ panel.classList.remove('open'); return; }
  const head = q.trim() ? '' : '<div class="suggest-head"><span>'+(localStorage.getItem('chop_recent') && JSON.parse(localStorage.getItem('chop_recent')).length ? 'Recent searches' : 'Popular searches')+'</span><button type="button" data-clear-recent>Clear</button></div>';
  panel.innerHTML = head + items.map(it => '<button class="suggest-item" data-go="'+esc(it.go)+'"><span class="si-ic">'+(it.icon || '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>')+'</span><span>'+esc(it.label)+'<small>'+esc(it.sub||'Listing')+'</small></span><em>Enter ↵</em></button>').join('');
  panel.classList.add('open');
}
function bindSearch(formSel, inputSel, panelSel){
  const form = $(formSel), input = $(inputSel), panel = $(panelSel);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    try {
      let recent = JSON.parse(localStorage.getItem('chop_recent')||'[]').filter(r => r.toLowerCase() !== q.toLowerCase());
      if (q) recent.unshift(q);
      localStorage.setItem('chop_recent', JSON.stringify(recent.slice(0,6)));
    } catch(e2){}
    panel.classList.remove('open');
    input.blur();
    location.hash = '#/browse?q=' + encodeURIComponent(q);
  });
  input.addEventListener('focus', () => renderSuggestPanel(panel, input.value));
  input.addEventListener('input', () => renderSuggestPanel(panel, input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Escape') panel.classList.remove('open'); });
  panel.addEventListener('click', e => {
    const clear = e.target.closest('[data-clear-recent]');
    if (clear){ try{ localStorage.removeItem('chop_recent'); }catch(e2){} renderSuggestPanel(panel, ''); return; }
    const item = e.target.closest('[data-go]');
    if (item){ panel.classList.remove('open'); location.hash = item.getAttribute('data-go'); }
  });
  document.addEventListener('click', e => { if (!panel.contains(e.target) && e.target !== input) panel.classList.remove('open'); });
}
function navigateBrowse(q){ location.hash = '#/browse?q=' + encodeURIComponent(q); }

// ---------- BROWSE logic ----------
const browseState = {q:'',cat:'',type:'',min:'',max:'',nego:false,availOnly:false,featuredOnly:false,studentOnly:false,sort:'relevant',shown:12};
const PAGE = 12;

function applyBrowseFromHash(qs){
  const p = new URLSearchParams(qs||'');
  browseState.q = p.get('q') || '';
  browseState.cat = p.get('cat') || '';
  browseState.type = p.get('type') || '';
  browseState.sort = p.get('sort') || 'relevant';
  browseState.studentOnly = p.get('student') === '1';
  browseState.featuredOnly = p.get('featured') === '1';
  browseState.min = ''; browseState.max = ''; browseState.nego = false; browseState.availOnly = false; browseState.shown = PAGE;
  $('#sortSelect').value = browseState.sort;
  $('#priceMin').value = ''; $('#priceMax').value = ''; $('#negoOnly').checked = false; $('#availOnly').checked = false; $('#featuredOnly').checked = browseState.featuredOnly;
  $$('#typeRadios input[name=listingType]').forEach(r => { r.checked = r.value === browseState.type; });
  refreshCategoryUI();
  renderBrowse();
}
function filteredListings(){
  let arr = publishedListings();
  const q = browseState.q.trim().toLowerCase();
  if (q){
    const tokens = q.split(/\s+/).filter(Boolean);
    arr = arr.filter(l => {
      const s = sellerOf(l);
      const hay = [l.name, l.desc, l.cat, l.loc, (l.tags||[]).join(' '), s.name, s.business||''].join(' ').toLowerCase();
      return tokens.every(t => hay.includes(t));
    });
  }
  if (browseState.cat) arr = arr.filter(l => l.cat === browseState.cat);
  if (browseState.type) arr = arr.filter(l => l.type === browseState.type);
  if (browseState.min !== '' && !isNaN(+browseState.min)) arr = arr.filter(l => l.priceType!=='quote' && l.priceType!=='na' && l.price >= +browseState.min);
  if (browseState.max !== '' && !isNaN(+browseState.max)) arr = arr.filter(l => l.priceType!=='quote' && l.priceType!=='na' && l.price <= +browseState.max);
  if (browseState.nego) arr = arr.filter(l => l.priceType === 'negotiable');
  if (browseState.availOnly) arr = arr.filter(l => l.avail === 'available');
  if (browseState.featuredOnly) arr = arr.filter(l => l.featured);
  if (browseState.studentOnly) arr = arr.filter(l => l.student);
  switch (browseState.sort){
    case 'newest': arr.sort((a,b)=>b.createdAt-a.createdAt); break;
    case 'popular': arr.sort((a,b)=>b.views-a.views); break;
    case 'priceAsc': arr.sort((a,b)=>((a.priceType==='quote'||a.priceType==='na')?Infinity:a.price)-((b.priceType==='quote'||b.priceType==='na')?Infinity:b.price)); break;
    case 'priceDesc': arr.sort((a,b)=>((b.priceType==='quote'||b.priceType==='na')?-1:b.price)-((a.priceType==='quote'||a.priceType==='na')?-1:a.price)); break;
    default: arr.sort((a,b)=>((b.featured?1:0)-(a.featured?1:0)) || b.views-a.views);
  }
  return arr;
}
function renderBrowse(){
  const all = filteredListings();
  const grid = $('#resultsGrid'), empty = $('#browseEmpty');
  const slice = all.slice(0, browseState.shown);
  grid.innerHTML = cardsFor(slice.filter(l=>l.type!=='business')) + bizCardsFor(slice.filter(l=>l.type==='business'));
  grid.style.display = slice.length ? 'grid' : 'none';
  empty.hidden = slice.length !== 0;
  $('#emptyQuery').textContent = browseState.q || browseState.cat || 'that filter';
  $('#resultsTitle').textContent = browseState.q ? 'Results for \u201C'+browseState.q+'\u201D' : (browseState.cat || (browseState.type==='product'?'Products':browseState.type==='service'?'Services':browseState.type==='business'?'Businesses':'All listings'));
  $('#resultsMeta').textContent = all.length === 0 ? 'No listings found' : 'Showing 1–'+slice.length+' of '+all.length+' listing'+(all.length===1?'':'s')+' on Ayensuado Campus';
  $('#loadMoreBtn').parentElement.style.display = all.length > slice.length ? 'block' : 'none';
  refreshCategoryUI();
}
$('#sortSelect').addEventListener('change', e => { browseState.sort = e.target.value; browseState.shown = PAGE; renderBrowse(); });
$('#loadMoreBtn').addEventListener('click', () => { browseState.shown += PAGE; renderBrowse(); });
$('#fCatList').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; browseState.cat = b.getAttribute('data-cat'); browseState.shown = PAGE; renderBrowse(); });
$('#typeRadios').addEventListener('change', e => { browseState.type = e.target.value; browseState.shown = PAGE; renderBrowse(); });
$('#priceApplyBtn').addEventListener('click', () => { browseState.min = $('#priceMin').value; browseState.max = $('#priceMax').value; browseState.shown = PAGE; renderBrowse(); });
['#negoOnly','#availOnly','#featuredOnly'].forEach(sel => $(sel).addEventListener('change', () => { browseState.nego = $('#negoOnly').checked; browseState.availOnly = $('#availOnly').checked; browseState.featuredOnly = $('#featuredOnly').checked; browseState.shown = PAGE; renderBrowse(); }));
function resetBrowse(){ browseState.q='';browseState.cat='';browseState.type='';browseState.min='';browseState.max='';browseState.nego=false;browseState.availOnly=false;browseState.featuredOnly=false;browseState.studentOnly=false;browseState.sort='relevant';browseState.shown=PAGE; }
$('#clearFiltersBtn').addEventListener('click', () => { resetBrowse(); location.hash = '#/browse'; renderBrowse(); $('#sortSelect').value='relevant'; });
$('#emptyClearBtn').addEventListener('click', () => { resetBrowse(); location.hash = '#/browse'; });
$('#filterMobileBtn').addEventListener('click', () => { $('#filterPanel').classList.add('open'); $('#filterBackdrop').classList.add('open'); });
$('#filterCloseBtn').addEventListener('click', () => { $('#filterPanel').classList.remove('open'); $('#filterBackdrop').classList.remove('open'); });
$('#filterBackdrop').addEventListener('click', () => { $('#filterPanel').classList.remove('open'); $('#filterBackdrop').classList.remove('open'); });
$('#filterApplyMobile').addEventListener('click', () => { $('#filterPanel').classList.remove('open'); $('#filterBackdrop').classList.remove('open'); });
$$('.qchip[data-q]').forEach(c => c.addEventListener('click', () => navigateBrowse(c.getAttribute('data-q'))));

// ---------- DETAIL ----------
let currentReportId = null;
function renderDetail(id){
  const wrap = $('#listingDetail');
  const l = listingById(id);
  if (!l){ wrap.innerHTML = '<div class="empty-panel"><h3>Listing not found</h3><p>This listing may have been removed or archived by its seller or our team.</p><a class="btn btn-dark" href="#/browse">Browse other listings</a></div>'; return; }
  if (l.status !== 'published' || sellerSuspended(l)){ wrap.innerHTML = '<div class="empty-panel"><h3>Currently unavailable</h3><p>This listing has been taken down. It may return once the seller updates it.</p><a class="btn btn-dark" href="#/browse">Browse available listings</a></div>'; return; }
  l.views++; store.save();
  const s = sellerOf(l);
  const sellerListings = publishedListings().filter(x => x.sellerId === l.sellerId && x.id !== l.id).length;
  const gallery = (l.gallery && l.gallery.length ? l.gallery : [l.img]);
  const wa = waLinkFor(s,l), tel = telLinkFor(s);
  const related = publishedListings().filter(x => x.id !== l.id && x.cat === l.cat).slice(0,4);
  const isFav = favs.has(l.id);
  const specs = [];
  if (l.cond && l.cond !== '—') specs.push(['Condition', l.cond]);
  specs.push(['Listing type', typeLabel(l)]);
  specs.push(['Category', l.cat]);
  specs.push(['Availability', l.avail === 'available' ? 'Available' : l.avail === 'sold' ? 'Sold out' : 'Unavailable']);
  if (l.hours) specs.push(['Opening hours', l.hours]);
  specs.push(['Campus', 'Ayensuado · CCTU']);

  wrap.innerHTML =
    '<nav class="breadcrumb"><a href="#/home">Home</a><span>›</span><a href="#/browse?cat='+encodeURIComponent(l.cat)+'">'+esc(l.cat)+'</a><span>›</span><span style="color:var(--ink);font-weight:600">'+esc(l.name.length>52 ? l.name.slice(0,52)+'…' : l.name)+'</span></nav>'
    + '<div class="detail-grid">'
    +   '<div>'
    +     '<div class="gallery-main"><img id="detailMainImg" src="'+esc(gallery[0])+'" alt="'+esc(l.name)+'" onerror="'+ONERR+'"></div>'
    +     (gallery.length > 1 ? '<div class="gallery-thumbs">'+gallery.map((g,i) => '<button class="gthumb'+(i===0?' active':'')+'" data-src="'+esc(g)+'"><img src="'+esc(g)+'" alt="'+esc(l.name)+' photo '+(i+1)+'" loading="lazy" onerror="'+ONERR+'"></button>').join('')+'</div>' : '')
    +     '<div class="detail-foot-row"><button class="link-btn save fav-toggle-detail'+(isFav?' active':'')+'" data-fav-id="'+l.id+'">'+HEART+'Save to favourites</button>'
    +       '<button class="link-btn" id="shareListingBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" style="width:17px;height:17px"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>Share listing</button>'
    +       '<button class="link-btn" id="reportListingBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>Report</button>'
    +     '</div>'
    +   '</div>'
    +   '<div>'
    +     '<div class="detail-type-line"><span class="detail-cat">'+typeLabel(l)+(l.student?' · STUDENT-OWNED':'')+'</span>'+(l.avail!=='available'?'<span class="badge-avail" style="position:static">'+(l.avail==='sold'?'Sold out':'Unavailable')+'</span>':'')+'</div>'
    +     '<h1 class="detail-title">'+esc(l.name)+'</h1>'
    +     '<div class="detail-price-row"><span class="detail-price">'+(l.type==='business'||l.priceType==='na'?'—':(l.priceType==='quote'?'':(l.priceType==='starting'?'<small style="font-size:12px;color:var(--muted);font-family:var(--font-body);font-weight:600">FROM </small>':'')+fmtMoney(l.price)))+'</span>'
    +       (l.priceType==='negotiable'?'<span class="tag tag-nego">Negotiable</span>':'')+(l.priceType==='quote'?'<span class="tag tag-quote">Quote on request</span>':'')+(l.priceType==='starting'?'<span class="tag tag-start">Starting price</span>':'')+(l.priceType==='fixed'?'<span class="tag tag-cat">Fixed price</span>':'')+'</div>'
    +     '<div class="detail-meta-line"><span>'+PIN+esc(l.loc)+'</span><span><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>Listed '+timeAgo(l.createdAt)+'</span><span><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>'+l.views+' views</span></div>'
    +     '<p class="detail-desc">'+esc(l.desc)+'</p>'
    +     '<div class="spec-grid">'+specs.map(sp => '<div class="spec"><small>'+esc(sp[0])+'</small><b>'+esc(sp[1])+'</b></div>').join('')+'</div>'
    +     '<div class="seller-card">'
    +       '<div class="seller-card-top"><div class="seller-av">'+initials(s.name)+'</div><div><div class="seller-name">'+esc(s.business && l.type==='business' ? s.business : s.name)+(s.verified?VERIFIED:'')+'</div><div class="seller-role">'+esc(s.role)+' · On Chop since '+esc(s.joined||'2026')+'</div></div></div>'
    +       '<div class="seller-stats"><div class="seller-stat"><b>'+(sellerListings+1)+'</b><small>Active listing'+((sellerListings+1)===1?'':'s')+'</small></div><div class="seller-stat"><b>'+esc(l.cat)+'</b><small>Category</small></div><div class="seller-stat"><b>'+esc(l.loc.split('—')[0].split(',')[0].trim())+'</b><small>Pickup / service area</small></div></div>'
    +       '<div class="contact-grid"><a class="btn btn-wa btn-lg" href="'+wa+'" target="_blank" rel="noopener">'+WA_SVG+'WhatsApp seller</a><a class="btn btn-outline btn-lg" href="'+tel+'"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:19px;height:19px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l3.27-1.27a2 2 0 0 1 2.11.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call seller</a></div>'
    +       '<p class="contact-note"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="12" x2="12" y2="10.5"/><line x1="12" y1="7.5" x2="12.01" y2="7.5"/></svg><span>Only the seller&rsquo;s published contact is shown, shared with their permission. Arrange price, payment, collection and delivery directly — Chop never handles your money.</span></p>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + (related.length ? '<div class="related-wrap"><div class="section-head" style="margin-bottom:14px"><div><div class="eyebrow">Keep exploring</div><h2 style="font-size:1.4rem">More in '+esc(l.cat)+'</h2></div><a class="see-all" href="#/browse?cat='+encodeURIComponent(l.cat)+'">View all<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg></a></div><div class="related-grid">'+cardsFor(related)+'</div></div>' : '');

  // gallery wiring
  $$('.gthumb', wrap).forEach(btn => btn.addEventListener('click', () => { $('#detailMainImg').src = btn.dataset.src; $$('.gthumb', wrap).forEach(b => b.classList.toggle('active', b === btn)); }));
  // favourite toggle
  const favBtn = $('.fav-toggle-detail', wrap);
  if (favBtn) favBtn.addEventListener('click', () => { toggleFav(l.id); favBtn.classList.toggle('active', favs.has(l.id)); favBtn.lastChild.textContent = favs.has(l.id) ? 'Saved to favourites' : 'Save to favourites'; });
  // share
  $('#shareListingBtn').addEventListener('click', async () => {
    const url = window.location.href;
    const data = {title: l.name + ' — Chop Campus', text: 'Found this on Chop Campus Marketplace: ' + l.name, url: url};
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(url); toast('Link copied to clipboard'); } } catch(e){ try { await navigator.clipboard.writeText(url); toast('Link copied to clipboard'); } catch(e2){ toast('Could not copy link', 'warn'); } }
  });
  // report
  $('#reportListingBtn').addEventListener('click', () => { currentReportId = l.id; $('#reportListingName').textContent = l.name; $('#reportDetails').value=''; $('#reportError').style.display='none'; openModal('#reportModal'); });
}
$('#reportSubmitBtn').addEventListener('click', () => {
  const details = $('#reportDetails').value.trim();
  if (details.length < 8){ $('#reportError').style.display = 'block'; return; }
  store.db.reports.unshift({id:'r'+Date.now(), listingId:currentReportId, reason:$('#reportReason').value, details:details, reporter:'Anonymous student', status:'open', createdAt:Date.now()});
  logActivity('flag', 'Report filed on \u201C'+((listingById(currentReportId)||{}).name||'listing')+'\u201D');
  store.save(); closeModal('#reportModal'); toast('Report received — our campus team will review it shortly.');
});

// ---------- FAVOURITES ----------
function renderFavourites(){
  const grid = $('#favGrid'), empty = $('#favEmpty');
  const items = store.db.listings.filter(l => favs.has(l.id) && l.status === 'published' && !sellerSuspended(l));
  grid.innerHTML = cardsFor(items);
  empty.hidden = items.length !== 0;
  grid.style.display = items.length ? 'grid' : 'none';
}

// ---------- SELL form ----------
let sellImageData = null;
function updateSellPriceUI(){
  const t = $('#sellPriceType').value;
  const priceWrap = $('#sellPriceWrap'), condWrap = $('#sellConditionWrap');
  const isProduct = $('#sellTypeProduct').checked;
  condWrap.style.display = isProduct ? 'block' : 'none';
  if (t === 'quote'){ $('#sellPrice').disabled = true; $('#sellPriceReq').style.display='none'; $('#sellPriceHint').textContent = 'You will quote price when buyers enquire.'; }
  else { $('#sellPrice').disabled = false; $('#sellPriceReq').style.display='inline'; $('#sellPriceHint').textContent = t==='negotiable' ? 'Buyers can negotiate from this price.' : t==='starting' ? 'Shown as a starting price.' : 'Fixed price buyers will pay.'; }
}
$$('input[name=sellType]').forEach(r => r.addEventListener('change', updateSellPriceUI));
$('#sellPriceType').addEventListener('change', updateSellPriceUI);
$('#sellImageBtn').addEventListener('click', () => $('#sellImageFile').click());
$('#sellImageFile').addEventListener('change', e => { compressImageFile(e.target.files[0], data => { if (data){ sellImageData = data; const prev = $('#sellImagePreview'); prev.src = data; prev.hidden = false; } }); });
$('#sellForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#sellName').value.trim(), phone = $('#sellPhone').value.trim();
  const lname = $('#sellListingName').value.trim(), loc = $('#sellLocation').value.trim(), desc = $('#sellDesc').value.trim();
  const priceType = $('#sellPriceType').value, price = parseFloat($('#sellPrice').value);
  let ok = true;
  const mark = (el, bad) => { el.classList.toggle('error', bad); if (bad) ok = false; };
  mark($('#sellName'), name.length < 2);
  mark($('#sellPhone'), digits(phone).length < 9);
  mark($('#sellListingName'), lname.length < 3);
  mark($('#sellLocation'), loc.length < 2);
  mark($('#sellDesc'), desc.length < 20);
  mark($('#sellPrice'), priceType !== 'quote' && (isNaN(price) || price < 0));
  if (!ok){ toast('Please complete the highlighted fields (description needs 20+ characters).', 'warn'); return; }
  const type = $('#sellTypeProduct').checked ? 'product' : 'service';
  const tags = $('#sellTags').value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const img = sellImageData || $('#sellImageUrl').value.trim() || FALLBACK_IMG;
  const listing = {id:'sub'+Date.now(), type:type, name:lname, cat:$('#sellCategory').value, price:priceType==='quote'?0:(price||0), priceType:priceType, cond:type==='product'?$('#sellCondition').value:'—', desc:desc, sellerId:null, sellerName:name, sellerPhone:phone, sellerRole:$('#sellStudent').value==='yes'?'Student seller':'Independent seller', loc:loc, campus:'Ayensuado · CCTU', avail:'available', tags:tags, img:img, gallery:[img], featured:false, student:$('#sellStudent').value!=='no', status:'pending', views:0, createdAt:Date.now()};
  store.db.listings.unshift(listing);
  logActivity('inbox', name + ' submitted \u201C' + lname + '\u201D for review');
  store.save();
  $('#sellSuccessName').textContent = '\u201C' + lname + '\u201D';
  $('#sellSuccessRef').textContent = 'CHP-' + String(Date.now()).slice(-6);
  $('#sellForm').hidden = true; $('#sellSuccess').hidden = false;
  window.scrollTo({top:0, behavior:'smooth'});
  toast('Listing submitted for review');
});
$('#sellAnotherBtn').addEventListener('click', () => { $('#sellForm').reset(); sellImageData = null; $('#sellImagePreview').hidden = true; $('#sellForm').hidden = false; $('#sellSuccess').hidden = true; updateSellPriceUI(); });

// ---------- ADMIN ----------
const ADMIN_CRED = {email:'admin@chopcampus.com', pass:'chop2026'};
const isAdmin = () => sessionStorage.getItem('chop_admin') === '1';
function updateAuthUI(){ $('#signinBtn').textContent = isAdmin() ? 'Dashboard' : 'Sign in'; }
function logActivity(icon, text){ store.db.activity.unshift({id:'a'+Date.now()+Math.random().toString(36).slice(2,6), icon:icon, text:text, time:Date.now()}); store.db.activity = store.db.activity.slice(0,30); }

function openAdminTab(name){
  $$('.admin-nav-btn[data-admin-tab]').forEach(b => b.classList.toggle('active', b.getAttribute('data-admin-tab') === name));
  $$('.admin-panel').forEach(p => p.classList.remove('active'));
  const panel = $('#adminPanel-' + name); if (panel) panel.classList.add('active');
  if (name === 'overview') renderAdminOverview();
  if (name === 'listings') renderListingsTable();
  if (name === 'submissions') renderSubmissions();
  if (name === 'sellers') renderSellersAdmin();
  if (name === 'reports') renderReportsAdmin();
  if (name === 'categories') renderCategoriesAdmin();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-admin-tab]'); if (b) openAdminTab(b.getAttribute('data-admin-tab')); });

function renderAdmin(){
  $('#adminGate').style.display = isAdmin() ? 'none' : 'block';
  $('#adminApp').hidden = !isAdmin();
  updateAuthUI();
  if (!isAdmin()) return;
  $('#adminGreet').textContent = 'Good ' + (new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening') + ', Admin — ' + new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) + ' · Ayensuado Campus';
  updateAdminBadges();
  openAdminTab($('.admin-nav-btn.active[data-admin-tab]') ? $('.admin-nav-btn.active[data-admin-tab]').getAttribute('data-admin-tab') : 'overview');
}
function updateAdminBadges(){
  const pend = store.db.listings.filter(l => l.status === 'pending').length;
  const open = store.db.reports.filter(r => r.status === 'open').length;
  $('#submissionBadge').textContent = pend; $('#reportsBadge').textContent = open;
}
function renderAdminOverview(){
  const pub = publishedListings();
  const products = pub.filter(l=>l.type==='product').length, services = pub.filter(l=>l.type==='service').length, biz = pub.filter(l=>l.type==='business').length;
  const sold = pub.filter(l=>l.avail==='sold').length;
  const views = pub.reduce((a,l)=>a+(+l.views||0),0);
  const openReports = store.db.reports.filter(r=>r.status==='open').length;
  const studentCount = pub.filter(l=>l.student).length;
  const stats = [
    ['Published', pub.length, 'live listings', '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'],
    ['Pending', store.db.listings.filter(l=>l.status==='pending').length, 'awaiting review', '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>'],
    ['Views', views.toLocaleString(), 'on live listings', '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'],
    ['Sold out', sold, 'products marked sold', '<polyline points="20 6 9 17 4 10"/>'],
    ['Open reports', openReports, 'need attention', '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>'],
    ['Student-owned', studentCount, 'listings by students', '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.55 2.9 3.5 6 3.5s6-1.95 6-3.5v-5"/>']
  ];
  $('#statGrid').innerHTML = stats.map(s => '<div class="stat-card"><small><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s[3]+'</svg>'+s[0]+'</small><b>'+s[1]+'</b><span>'+s[2]+'</span></div>').join('');
  // distribution
  const counts = {};
  pub.forEach(l => counts[l.cat] = (counts[l.cat]||0)+1);
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const max = sorted.length ? sorted[0][1] : 1;
  $('#distBars').innerHTML = sorted.map(([cat,n]) => '<div class="bar-row"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(cat)+'">'+esc(cat)+'</span><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(n/max*100)+'%"></div></div><span class="bar-count">'+n+'</span></div>').join('') + '<p style="font-size:10.5px;color:var(--muted);margin-top:10px">Products: '+products+' · Services: '+services+' · Businesses: '+biz+'</p>';
  // activity
  $('#activityFeed').innerHTML = store.db.activity.slice(0,8).map(a => '<div class="activity-item"><span class="act-ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(a.icon==='flag'?'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>':a.icon==='inbox'?'<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>':a.icon==='trash'?'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>':'<polyline points="20 6 9 17 4 10"/>')+'</svg></span><span>'+esc(a.text)+'<small>'+timeAgo(a.time)+'</small></span></div>').join('') || '<p style="color:var(--muted);font-size:12px">No activity yet.</p>';
  updateAdminBadges();
}
function adminPriceCell(l){ if (l.type==='business'||l.priceType==='na') return '—'; if (l.priceType==='quote') return 'Quote'; return fmtMoney(l.price) + (l.priceType==='negotiable'?' <span style="color:var(--amber);font-size:10px;font-weight:700">NEG</span>':l.priceType==='starting'?'<small style="color:var(--muted)"> from</small>':''); }
function renderListingsTable(){
  const q = ($('#adminListingsSearch').value||'').toLowerCase().trim();
  const sf = $('#adminStatusFilter').value, tf = $('#adminTypeFilter').value;
  let arr = store.db.listings.filter(l => l.status !== 'pending');
  if (sf === 'sold') arr = arr.filter(l => l.avail !== 'available');
  else if (sf) arr = arr.filter(l => l.status === sf);
  if (tf) arr = arr.filter(l => l.type === tf);
  if (q) arr = arr.filter(l => { const s = sellerOf(l); return [l.name, s.name, l.loc, l.cat, (l.tags||[]).join(' ')].join(' ').toLowerCase().includes(q); });
  arr.sort((a,b) => b.createdAt - a.createdAt);
  $('#listingsCount').textContent = arr.length + ' listing' + (arr.length===1?'':'s') + ' shown (pending items live under Submissions)';
  $('#adminListingsTbody').innerHTML = arr.map(l => {
    const s = sellerOf(l);
    const statusPill = l.status==='archived' ? '<span class="st st-archived">Archived</span>' : l.avail!=='available' ? '<span class="st st-sold">'+(l.avail==='sold'?'Sold':'Unavailable')+'</span>' : '<span class="st st-published">Published</span>';
    return '<tr data-id="'+l.id+'"><td><div class="tcell-main"><img src="'+esc(l.img)+'" alt="" loading="lazy" onerror="'+ONERR+'"><span><b title="'+esc(l.name)+'">'+esc(l.name)+'</b><small>'+esc(s.name)+'</small></span></div></td>'
      + '<td>'+esc(l.cat)+'</td><td style="white-space:nowrap;font-weight:700">'+adminPriceCell(l)+'</td><td>'+statusPill+'</td><td>'+l.views+'</td>'
      + '<td><button class="icon-btn sm" data-action="feature" title="'+(l.featured?'Remove from featured':'Feature on homepage')+'" style="'+(l.featured?'color:var(--orange-dk)':'')+'"><svg viewBox="0 0 24 24" fill="'+(l.featured?'#E8590C':'none')+'" stroke-width="2" stroke-linejoin="round" style="stroke:'+(l.featured?'#E8590C':'currentColor')+'"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button></td>'
      + '<td><div class="row-actions">'
      +   '<button class="icon-btn sm" data-action="toggle-publish" title="'+(l.status==='archived'?'Publish':'Unpublish / archive')+'">'+(l.status==='archived'?'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>')+'</button>'
      +   '<button class="icon-btn sm" data-action="toggle-sold" title="'+(l.avail==='available'?'Mark as sold / unavailable':'Mark as available')+'"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3H5a2 2 0 0 0-2 2v4.59A2 2 0 0 0 3.83 11l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.36a2 2 0 0 0 0-2.82z"/></svg></button>'
      +   '<button class="icon-btn sm" data-action="edit" title="Edit listing"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>'
      +   '<button class="icon-btn sm danger" data-action="delete" title="Delete permanently"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
      + '</div></td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:34px">No listings match these filters.</td></tr>';
}
['#adminListingsSearch','#adminStatusFilter','#adminTypeFilter'].forEach(sel => $(sel).addEventListener('input', renderListingsTable));
$('#adminListingsTbody').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]'); if (!btn) return;
  const tr = btn.closest('tr'); const id = tr.getAttribute('data-id');
  const l = listingById(id); if (!l) return;
  const action = btn.getAttribute('data-action');
  if (action === 'feature'){ l.featured = !l.featured; logActivity('check', (l.featured?'Featured':'Unfeatured') + ' \u201C' + l.name + '\u201D'); store.save(); renderListingsTable(); toast(l.featured ? 'Listing featured on homepage' : 'Removed from featured'); }
  else if (action === 'toggle-publish'){ l.status = l.status === 'archived' ? 'published' : 'archived'; logActivity('check', (l.status==='published'?'Published':'Archived') + ' \u201C' + l.name + '\u201D'); store.save(); renderListingsTable(); updateAdminBadges(); toast(l.status==='published' ? 'Listing is live' : 'Listing archived'); }
  else if (action === 'toggle-sold'){ l.avail = l.avail === 'available' ? 'sold' : 'available'; logActivity('check', '\u201C' + l.name + '\u201D marked ' + (l.avail==='sold'?'sold':'available')); store.save(); renderListingsTable(); toast(l.avail==='sold' ? 'Marked as sold / unavailable' : 'Marked as available'); }
  else if (action === 'edit'){ openAdminListingModal(l); }
  else if (action === 'delete'){ askConfirm('Delete listing', 'Permanently delete \u201C' + l.name + '\u201D? This cannot be undone.', 'Delete', () => { store.db.listings = store.db.listings.filter(x => x.id !== id); logActivity('trash', 'Deleted \u201C' + l.name + '\u201D'); store.save(); renderListingsTable(); updateAdminBadges(); renderAdminOverview(); toast('Listing deleted'); }); }
});
function renderSubmissions(){
  const subs = store.db.listings.filter(l => l.status === 'pending').sort((a,b) => a.createdAt - b.createdAt);
  $('#submissionsList').innerHTML = subs.length ? subs.map(l => {
    const s = sellerOf(l);
    return '<div class="sub-card" data-id="'+l.id+'"><img src="'+esc(l.img)+'" alt="'+esc(l.name)+'" onerror="'+ONERR+'"><div class="sub-body">'
      + '<span class="st st-pending">Pending review</span>'
      + '<h3 style="margin-top:8px">'+esc(l.name)+'</h3>'
      + '<div style="font-size:11.5px;color:var(--muted)">'+typeLabel(l)+' · '+esc(l.cat)+' · <b style="color:var(--ink)">'+(l.priceType==='quote'?'Quote on request':fmtMoney(l.price)+(l.priceType==='negotiable'?' (negotiable)':l.priceType==='starting'?' (from)':''))+'</b> · Submitted '+timeAgo(l.createdAt)+'</div>'
      + '<p>'+esc(l.desc)+'</p>'
      + '<div style="font-size:12px;color:var(--ink-2)"><b>'+esc(s.name)+'</b> · '+esc(s.phone)+' · '+esc(l.loc)+(l.student?' · <span class="tag tag-student" style="margin-left:4px">Student</span>':'')+'</div>'
      + '<div class="sub-foot"><button class="btn btn-primary btn-sm" data-sub-action="approve">Approve &amp; publish</button><button class="btn btn-outline btn-sm" data-sub-action="reject">Reject with reason</button><a class="btn btn-ghost btn-sm" href="'+waLinkFor(s,l)+'" target="_blank" rel="noopener">'+WA_SVG+'Message seller</a></div>'
      + '</div></div>';
  }).join('') : '<div class="empty-panel" style="margin-top:0"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 10"/></svg><h3>Review queue is clear</h3><p>Every submission has been reviewed. New seller listings will appear here automatically.</p></div>';
  updateAdminBadges();
}
$('#submissionsList').addEventListener('click', e => {
  const btn = e.target.closest('[data-sub-action]'); if (!btn) return;
  const card = btn.closest('.sub-card'); const id = card.getAttribute('data-id');
  const l = listingById(id); if (!l) return;
  if (btn.getAttribute('data-sub-action') === 'approve'){
    // create/find seller by phone
    const ph = l.sellerPhone || ''; const d = intlNumber(ph);
    let seller = store.db.sellers.find(s => intlNumber(s.phone) === d);
    if (!seller){
      seller = {id:'s'+Date.now(), name:l.sellerName || 'Seller', role:l.sellerRole || 'Independent seller', business:'', phone:ph, wa:d, joined:new Date().toLocaleDateString('en-GB',{month:'short',year:'numeric'}), verified:false, suspended:false, bio:''};
      store.db.sellers.push(seller);
    }
    l.sellerId = seller.id; l.status = 'published'; l.views = 0;
    logActivity('check', 'Approved \u201C' + l.name + '\u201D from ' + seller.name);
    store.save(); renderSubmissions(); renderAdminOverview(); refreshCategoryUI();
    toast('Published \u201C' + l.name + '\u201D — it is now live.');
  } else {
    askPrompt('Reject submission', 'Tell the seller why it was rejected (they will see this via WhatsApp):', 'e.g. Please add a clearer photo and exact pickup location.', 'Reject', reason => {
      l.status = 'archived'; l.rejectReason = reason || 'No reason given';
      logActivity('trash', 'Rejected \u201C' + l.name + '\u201D');
      store.save(); renderSubmissions();
      toast('Submission rejected. The seller has been notified.');
    });
  }
});
function renderSellersAdmin(){
  $('#sellersGrid').innerHTML = store.db.sellers.map(s => {
    const count = store.db.listings.filter(l => l.sellerId === s.id && l.status === 'published').length;
    return '<div class="seller-admin-card'+(s.suspended?' suspended':'')+'" data-id="'+s.id+'">'
      + '<div style="display:flex;align-items:center;gap:12px"><div class="seller-av" style="width:52px;height:52px;font-size:17px;border-radius:14px">'+initials(s.name)+'</div><div><b style="font-size:14px;display:flex;align-items:center;gap:6px">'+esc(s.name)+(s.verified?VERIFIED:'')+'</b><div style="font-size:11px;color:var(--muted)">'+esc(s.role)+' · since '+esc(s.joined||'2026')+'</div></div></div>'
      + '<div style="font-size:12px;margin:6px 0 2px"><b>'+esc(s.phone)+'</b> · '+count+' active listing'+(count===1?'':'s')+'</div>'
      + (s.business ? '<div style="font-size:11px;color:var(--muted)">Business: '+esc(s.business)+'</div>' : '')
      + '<div style="display:flex;justify-content:space-between;gap:10px;margin-top:10px;border-top:1px solid var(--line);padding-top:12px;flex-wrap:wrap">'
      +   '<label class="switch" title="Grant genuine verification"><input type="checkbox" data-seller-action="verify" '+(s.verified?'checked':'')+'><span class="track"></span>Verified</label>'
      +   '<label class="switch" title="Hide all this seller\u2019s listings"><input type="checkbox" data-seller-action="suspend" '+(s.suspended?'checked':'')+'><span class="track" style="'+(s.suspended?'background:var(--red)':'')+'"></span>Suspended</label>'
      + '</div></div>';
  }).join('');
}
$('#sellersGrid').addEventListener('change', e => {
  const inp = e.target.closest('[data-seller-action]'); if (!inp) return;
  const card = inp.closest('.seller-admin-card'); const s = store.db.sellers.find(x => x.id === card.getAttribute('data-id')); if (!s) return;
  if (inp.getAttribute('data-seller-action') === 'verify'){ s.verified = inp.checked; logActivity('check', (s.verified?'Verified':'Removed verification for') + ' ' + s.name); toast(s.verified ? s.name + ' is now verified' : 'Verification removed'); }
  else { s.suspended = inp.checked; logActivity('flag', (s.suspended?'Suspended':'Reinstated') + ' account: ' + s.name); toast(s.suspended ? s.name + ' suspended — listings hidden' : s.name + ' reinstated'); }
  store.save(); renderSellersAdmin(); refreshCategoryUI();
});
function renderReportsAdmin(){
  const reports = [...store.db.reports].sort((a,b) => (a.status===b.status ? b.createdAt-a.createdAt : a.status==='open'?-1:1));
  $('#reportsList').innerHTML = reports.length ? reports.map(r => {
    const l = listingById(r.listingId);
    return '<div class="report-card'+(r.status==='resolved'?' resolved':'')+'" data-id="'+r.id+'">'
      + '<div class="report-head"><span class="tag '+(r.status==='open'?'tag-nego':'tag-cat')+'" style="'+(r.status==='open'?'':'background:var(--green-soft);color:var(--green);border-color:#CBE8D2')+'">'+(r.status==='open'?'OPEN REPORT':'RESOLVED')+'</span><span style="font-size:11px;color:var(--muted)">'+timeAgo(r.createdAt)+' · '+esc(r.reporter)+'</span></div>'
      + '<b style="font-size:13px">'+esc(r.reason)+'</b>'
      + '<p style="font-size:12.5px;color:var(--ink-2);margin:6px 0">'+esc(r.details)+'</p>'
      + '<p style="font-size:12px;color:var(--muted)">Listing: '+(l ? '<a href="#/listing/'+l.id+'" style="color:var(--orange-dk);font-weight:700;text-decoration:none">'+esc(l.name)+'</a>' : '<em>Listing already removed</em>')+'</p>'
      + (r.status==='open' ? '<div class="sub-foot"><button class="btn btn-outline btn-sm" data-report-action="resolve">Mark resolved</button>'+(l?'<button class="btn btn-sm" data-report-action="remove" style="background:var(--red-soft);color:var(--red);border:1px solid #F3C6C0">Remove listing</button>':'')+'</div>' : '')
      + '</div>';
  }).join('') : '<div class="empty-panel" style="margin-top:0"><h3>No reports</h3><p>When students report a listing, it will appear here for review.</p></div>';
  updateAdminBadges();
}
$('#reportsList').addEventListener('click', e => {
  const btn = e.target.closest('[data-report-action]'); if (!btn) return;
  const card = btn.closest('.report-card'); const r = store.db.reports.find(x => x.id === card.getAttribute('data-id')); if (!r) return;
  if (btn.getAttribute('data-report-action') === 'resolve'){ r.status = 'resolved'; logActivity('check', 'Resolved report on listing'); store.save(); renderReportsAdmin(); renderAdminOverview(); toast('Report marked as resolved'); }
  else { askConfirm('Remove listing', 'This archives the reported listing and resolves the report. Continue?', 'Remove listing', () => { const l = listingById(r.listingId); if (l) l.status = 'archived'; r.status = 'resolved'; logActivity('trash', 'Removed listing \u201C' + (l?l.name:'') + '\u201D after report'); store.save(); renderReportsAdmin(); renderAdminOverview(); toast('Listing removed and report resolved'); }); }
});
function renderCategoriesAdmin(){
  const pub = store.db.listings;
  $('#categoryAdminList').innerHTML = store.db.categories.map(c => {
    const n = pub.filter(l => l.cat === c.name).length;
    return '<div class="cat-admin-row" data-id="'+c.id+'"><span class="cat-ic">'+categoryIcon(c.icon)+'</span><b>'+esc(c.name)+'</b><span class="cat-count">'+n+' listing'+(n===1?'':'s')+'</span>'
      + '<button class="icon-btn sm" data-cat-action="rename" title="Rename category"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>'
      + '<button class="icon-btn sm danger" data-cat-action="delete" title="Delete category"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
      + '</div>';
  }).join('');
}
$('#addCategoryForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#newCatName').value.trim(); if (!name) return;
  if (store.db.categories.some(c => c.name.toLowerCase() === name.toLowerCase())){ toast('That category already exists.', 'warn'); return; }
  store.db.categories.push({id:'c'+Date.now(), name:name, icon:$('#newCatIcon').value});
  logActivity('check', 'Added category \u201C' + name + '\u201D');
  store.save(); $('#newCatName').value = '';
  renderCategoriesAdmin(); refreshCategoryUI(); toast('Category \u201C' + name + '\u201D added');
});
$('#categoryAdminList').addEventListener('click', e => {
  const btn = e.target.closest('[data-cat-action]'); if (!btn) return;
  const row = btn.closest('.cat-admin-row'); const c = store.db.categories.find(x => x.id === row.getAttribute('data-id')); if (!c) return;
  if (btn.getAttribute('data-cat-action') === 'rename'){
    askPrompt('Rename category', 'Renaming \u201C' + c.name + '\u201D — all listings in it will move automatically:', c.name, 'Rename', newName => {
      newName = (newName||'').trim(); if (!newName || newName === c.name) return;
      store.db.listings.forEach(l => { if (l.cat === c.name) l.cat = newName; });
      logActivity('check', 'Renamed category \u201C' + c.name + '\u201D to \u201C' + newName + '\u201D');
      c.name = newName; store.save(); renderCategoriesAdmin(); refreshCategoryUI(); toast('Category renamed');
    });
  } else {
    const n = store.db.listings.filter(l => l.cat === c.name).length;
    if (n > 0){ toast('\u201C' + c.name + '\u201D is used by ' + n + ' listing' + (n===1?'':'s') + '. Reassign or archive them first.', 'warn'); return; }
    askConfirm('Delete category', 'Delete \u201C' + c.name + '\u201D? This cannot be undone.', 'Delete', () => { store.db.categories = store.db.categories.filter(x => x.id !== c.id); logActivity('trash', 'Deleted category \u201C' + c.name + '\u201D'); store.save(); renderCategoriesAdmin(); refreshCategoryUI(); toast('Category deleted'); });
  }
});
// admin listing modal
let editingListingId = null, alImageData = null;
function openAdminListingModal(l){
  editingListingId = l ? l.id : null; alImageData = null;
  $('#alModalTitle').textContent = l ? 'Edit listing' : 'Add listing';
  $('#alSubmitBtn').textContent = l ? 'Save changes' : 'Publish listing';
  $('#alType').value = l ? l.type : 'product';
  refreshCategoryUI();
  $('#alCat').value = l ? l.cat : (store.db.categories[0]||{}).name;
  $('#alName').value = l ? l.name : '';
  $('#alPriceType').value = l ? l.priceType : 'fixed';
  $('#alPrice').value = l && l.price ? l.price : '';
  $('#alCond').value = l && l.cond ? l.cond : 'New';
  $('#alHours').value = l && l.hours ? l.hours : '';
  $('#alLoc').value = l ? l.loc : '';
  $('#alAvail').value = l ? l.avail : 'available';
  $('#alDesc').value = l ? l.desc : '';
  $('#alImageUrl').value = l ? l.img : '';
  $('#alImagePreview').src = l ? l.img : ''; $('#alImagePreview').style.display = l ? 'block' : 'none';
  const s = l && l.sellerId ? getSeller(l.sellerId) : null;
  $('#alSellerName').value = l ? (s ? s.name : (l.sellerName||'')) : '';
  $('#alSellerPhone').value = l ? (s ? s.phone : (l.sellerPhone||'')) : '';
  $('#alTags').value = l && l.tags ? l.tags.join(', ') : '';
  $('#alStatus').value = l ? l.status : 'published';
  $('#alFeatured').checked = l ? !!l.featured : false;
  $('#alStudent').checked = l ? !!l.student : true;
  toggleAdminModalTypeUI();
  openModal('#adminListingModal');
}
function toggleAdminModalTypeUI(){
  const t = $('#alType').value;
  $('#alCondWrap').style.display = t === 'product' ? 'block' : 'none';
  $('#alHoursWrap').hidden = t !== 'business';
  const pt = $('#alPriceType').value;
  $('#alPriceWrap').style.opacity = (pt === 'quote' || pt === 'na') ? '.45' : '1';
  $('#alPrice').disabled = (pt === 'quote' || pt === 'na');
  if (t === 'business'){ $('#alPriceType').value = 'na'; $('#alPrice').disabled = true; $('#alPriceWrap').style.opacity = '.45'; }
}
$('#alType').addEventListener('change', toggleAdminModalTypeUI);
$('#alPriceType').addEventListener('change', toggleAdminModalTypeUI);
$('#alImageBtn').addEventListener('click', () => $('#alImageFile').click());
$('#alImageFile').addEventListener('change', e => { compressImageFile(e.target.files[0], data => { if (data){ alImageData = data; const p = $('#alImagePreview'); p.src = data; p.style.display = 'block'; } }); });
$('#adminListingForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#alName').value.trim(), desc = $('#alDesc').value.trim();
  if (name.length < 3 || desc.length < 10){ toast('Name and description are required (description 10+ characters).', 'warn'); return; }
  const type = $('#alType').value, priceType = $('#alPriceType').value;
  const price = parseFloat($('#alPrice').value) || 0;
  const img = alImageData || $('#alImageUrl').value.trim() || FALLBACK_IMG;
  const tags = $('#alTags').value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const sellerName = $('#alSellerName').value.trim(), sellerPhone = $('#alSellerPhone').value.trim();
  let sellerId = null;
  if (sellerPhone && digits(sellerPhone).length >= 9){
    const d = intlNumber(sellerPhone);
    let s = store.db.sellers.find(x => intlNumber(x.phone) === d);
    if (!s && sellerName){ s = {id:'s'+Date.now(), name:sellerName, role: type==='business'?'Independent business':'Independent seller', business: type==='business'?name:'', phone:sellerPhone, wa:d, joined:new Date().toLocaleDateString('en-GB',{month:'short',year:'numeric'}), verified:false, suspended:false, bio:''}; store.db.sellers.push(s); }
    if (s){ sellerId = s.id; if (sellerName) s.name = sellerName; }
  }
  if (editingListingId){
    const l = listingById(editingListingId);
    Object.assign(l, {type:type, name:name, cat:$('#alCat').value, price:priceType==='quote'||priceType==='na'?0:price, priceType:priceType, cond:$('#alCond').value, hours:$('#alHours').value.trim(), desc:desc, loc:$('#alLoc').value.trim(), avail:$('#alAvail').value, img:img, gallery:[img], tags:tags, status:$('#alStatus').value, featured:$('#alFeatured').checked, student:$('#alStudent').checked});
    if (sellerId) l.sellerId = sellerId; else { l.sellerId = null; l.sellerName = sellerName; l.sellerPhone = sellerPhone; }
    logActivity('check', 'Updated \u201C' + name + '\u201D');
    toast('Listing updated');
  } else {
    store.db.listings.unshift({id:'l'+Date.now(), type:type, name:name, cat:$('#alCat').value, price:priceType==='quote'||priceType==='na'?0:price, priceType:priceType, cond:$('#alCond').value, hours:$('#alHours').value.trim(), desc:desc, sellerId:sellerId, sellerName:sellerId?undefined:sellerName, sellerPhone:sellerId?undefined:sellerPhone, loc:$('#alLoc').value.trim()||'Ayensuado Campus', campus:'Ayensuado · CCTU', avail:$('#alAvail').value, tags:tags, img:img, gallery:[img], featured:$('#alFeatured').checked, student:$('#alStudent').checked, status:$('#alStatus').value, views:0, createdAt:Date.now()});
    logActivity('check', 'Created \u201C' + name + '\u201D');
    toast('Listing created');
  }
  store.save(); closeModal('#adminListingModal'); renderListingsTable(); renderAdminOverview(); refreshCategoryUI();
});
$('#listingsAddBtn').addEventListener('click', () => openAdminListingModal(null));
$('#overviewAddBtn').addEventListener('click', () => openAdminListingModal(null));
$('#gateSigninBtn').addEventListener('click', () => openModal('#authModal'));
$('#signOutBtn').addEventListener('click', () => { sessionStorage.removeItem('chop_admin'); updateAuthUI(); renderAdmin(); toast('Signed out'); });
$('#signinBtn').addEventListener('click', () => { if (isAdmin()) location.hash = '#/admin'; else openModal('#authModal'); });
$('#fillDemoBtn').addEventListener('click', () => { $('#adminEmailInput').value = ADMIN_CRED.email; $('#adminPasswordInput').value = ADMIN_CRED.pass; });
$('#adminLoginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#adminEmailInput').value.trim().toLowerCase(), pass = $('#adminPasswordInput').value;
  if (email === ADMIN_CRED.email && pass === ADMIN_CRED.pass){
    sessionStorage.setItem('chop_admin','1');
    $('#adminLoginError').style.display = 'none';
    closeModal('#authModal'); updateAuthUI();
    if ((location.hash||'').indexOf('#/admin') === 0) renderAdmin(); else location.hash = '#/admin';
    toast('Welcome back, Admin');
  } else { $('#adminLoginError').style.display = 'block'; }
});

// ---------- CAMPUS SELECTOR ----------
const campusWrap = $('#campusWrap');
$('#campusBtn').addEventListener('click', e => { e.stopPropagation(); campusWrap.classList.toggle('open'); $('#campusBtn').setAttribute('aria-expanded', campusWrap.classList.contains('open')); });
function closeCampusMenu(){ campusWrap.classList.remove('open'); }
document.addEventListener('click', e => { if (!campusWrap.contains(e.target)) closeCampusMenu(); });
$$('.campus-opt:not(.disabled)').forEach(btn => btn.addEventListener('click', () => { $('#campusLabel').textContent = btn.getAttribute('data-campus'); $$('.campus-opt').forEach(o => o.classList.remove('active')); btn.classList.add('active'); closeCampusMenu(); try{localStorage.setItem('chop_campus', btn.getAttribute('data-campus'));}catch(e){} toast('Campus set to CCTU — Ayensuado'); }));

// ---------- DRAWER ----------
const drawer = $('#mobileDrawer'), drawerBackdrop = $('#drawerBackdrop');
function openDrawer(){ drawer.classList.add('open'); drawerBackdrop.classList.add('open'); document.body.style.overflow='hidden'; $('#drawerBtn').setAttribute('aria-expanded','true'); }
function closeDrawer(){ drawer.classList.remove('open'); drawerBackdrop.classList.remove('open'); document.body.style.overflow=''; $('#drawerBtn').setAttribute('aria-expanded','false'); }
$('#drawerBtn').addEventListener('click', openDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);
drawer.addEventListener('click', e => { if (e.target.closest('a')) closeDrawer(); });

// ---------- SEARCH BINDINGS ----------
bindSearch('#heroSearchForm', '#heroSearchInput', '#heroPanel');
bindSearch('#headerSearchForm', '#headerSearchInput', '#headerPanel');
bindSearch('#mobileSearchForm', '#mobileSearchInput', '#mobilePanel');
$('#headerFavBtn').addEventListener('click', () => { location.hash = '#/favourites'; });

// ---------- ROUTER ----------
function currentView(){ const m = (location.hash||'#/home').match(/^#\/([a-z]+)/); return m ? m[1] : 'home'; }
function route(){
  const raw = (location.hash || '#/home').slice(2);
  const qIdx = raw.indexOf('?');
  const path = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const qs = qIdx >= 0 ? raw.slice(qIdx + 1) : '';
  const parts = path.split('/').filter(Boolean);
  $$('.view').forEach(v => v.classList.remove('active'));
  closeDrawer();
  let view = 'home';
  if (parts[0] === 'browse'){ view = 'browse'; $('#view-browse').classList.add('active'); applyBrowseFromHash(qs); }
  else if (parts[0] === 'listing'){ view = 'listing'; $('#view-listing').classList.add('active'); renderDetail(decodeURIComponent(parts[1]||'')); }
  else if (parts[0] === 'favourites'){ view = 'favourites'; $('#view-favourites').classList.add('active'); renderFavourites(); }
  else if (parts[0] === 'sell'){ view = 'sell'; $('#view-sell').classList.add('active'); updateSellPriceUI(); }
  else if (parts[0] === 'admin'){ view = 'admin'; $('#view-admin').classList.add('active'); renderAdmin(); }
  else { $('#view-home').classList.add('active'); renderHome(); }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

// ---------- INIT ----------
store.load();
loadFavs();
$('#footerYear').textContent = new Date().getFullYear();
updateFavBadge();
updateAuthUI();
try {
  const savedCampus = localStorage.getItem('chop_campus');
  if (savedCampus) $('#campusLabel').textContent = savedCampus;
} catch(e){}
route();
