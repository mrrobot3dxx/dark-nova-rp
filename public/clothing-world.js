export const clothingShop={name:'NOVA STYLE · VÊTEMENTS',x:1650,y:647,radius:80};
export const clothingCatalog=[
 {id:'original',name:'Ma tenue d’origine',price:0,outfit:null},
 {id:'hoodie-night',name:'Capuche · Noir urbain',price:100,outfit:{style:'hoodie',color:'#4b5266',pants:'#263143',shoes:'#eceee8'}},
 {id:'hoodie-rose',name:'Capuche · Rose pastel',price:100,outfit:{style:'hoodie',color:'#e29fc0',pants:'#43536a',shoes:'#edf0e9'}},
 {id:'polo-ocean',name:'Polo · Bleu océan',price:75,outfit:{style:'polo',color:'#619fc6',pants:'#c0a784',shoes:'#f0eee6'}},
 {id:'tee-summer',name:'T-shirt · Été',price:60,outfit:{style:'tshirt',color:'#eed78b',pants:'#51718c',shoes:'#f0eee6'}},
 {id:'jacket-forest',name:'Veste · Vert forêt',price:150,outfit:{style:'jacket',color:'#50816d',pants:'#283c51',shoes:'#272c36'}},
 {id:'suit-elegant',name:'Costume · Élégant',price:250,outfit:{style:'suit',color:'#354660',pants:'#354660',shoes:'#20262d'}},
 // Collection hiver : tenues complètes avec accessoires visibles sur le personnage.
 {id:'winter-beanie-black',name:'Hiver · Bonnet noir et veste',price:120,outfit:{style:'jacket',color:'#303c4b',pants:'#242c3b',shoes:'#24242b',hat:'beanie',hatColor:'#181c27'}},
 {id:'winter-beanie-red',name:'Hiver · Bonnet rouge et écharpe',price:145,outfit:{style:'jacket',color:'#7d3543',pants:'#343e50',shoes:'#292c34',hat:'beanie',hatColor:'#b72e39',scarf:'#e4b4a0'}},
 {id:'winter-puffer-blue',name:'Hiver · Doudoune bleu glacier',price:190,outfit:{style:'puffer',color:'#568fb6',pants:'#263c53',shoes:'#202b37',hat:'beanie',hatColor:'#e7eef1',scarf:'#d9e7ed'}},
 {id:'winter-puffer-black',name:'Hiver · Doudoune noire',price:195,outfit:{style:'puffer',color:'#2c3442',pants:'#1d2530',shoes:'#161c23',hat:'beanie',hatColor:'#454c57'}},
 {id:'winter-parka-green',name:'Hiver · Parka vert sapin',price:220,outfit:{style:'parka',color:'#406956',pants:'#303c3c',shoes:'#303027',hat:'beanie',hatColor:'#c3ae8a',scarf:'#d9c7a6'}},
 {id:'winter-snow-white',name:'Hiver · Tenue neige blanche',price:240,outfit:{style:'puffer',color:'#e2e8ed',pants:'#bbcbd5',shoes:'#77899b',hat:'beanie',hatColor:'#f2f3f2',scarf:'#8da6bc'}},
 {id:'winter-coat-brown',name:'Hiver · Manteau brun et écharpe',price:210,outfit:{style:'coat',color:'#84604d',pants:'#2c3440',shoes:'#322922',hat:'beanie',hatColor:'#5c4138',scarf:'#d6b18b'}},
 {id:'winter-festive',name:'Hiver · Bonnet à pompon festif',price:165,outfit:{style:'jacket',color:'#aa4045',pants:'#374652',shoes:'#2c3238',hat:'pompon',hatColor:'#c33440',scarf:'#f2e5d0'}}
];
export const nearClothing=p=>!!(p&&!p.interior&&!p.vehicleId&&Math.hypot(p.x-clothingShop.x,p.y-clothingShop.y)<=clothingShop.radius);
