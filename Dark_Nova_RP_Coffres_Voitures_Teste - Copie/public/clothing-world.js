export const clothingShop={name:'NOVA STYLE · VÊTEMENTS',x:1650,y:647,radius:80};
export const clothingCatalog=[
 {id:'original',name:'Ma tenue d’origine',price:0,outfit:null},
 {id:'hoodie-night',name:'Capuche · Noir urbain',price:100,outfit:{style:'hoodie',color:'#4b5266',pants:'#263143',shoes:'#eceee8'}},
 {id:'hoodie-rose',name:'Capuche · Rose pastel',price:100,outfit:{style:'hoodie',color:'#e29fc0',pants:'#43536a',shoes:'#edf0e9'}},
 {id:'polo-ocean',name:'Polo · Bleu océan',price:75,outfit:{style:'polo',color:'#619fc6',pants:'#c0a784',shoes:'#f0eee6'}},
 {id:'tee-summer',name:'T-shirt · Été',price:60,outfit:{style:'tshirt',color:'#eed78b',pants:'#51718c',shoes:'#f0eee6'}},
 {id:'jacket-forest',name:'Veste · Vert forêt',price:150,outfit:{style:'jacket',color:'#50816d',pants:'#283c51',shoes:'#272c36'}},
 {id:'suit-elegant',name:'Costume · Élégant',price:250,outfit:{style:'suit',color:'#354660',pants:'#354660',shoes:'#20262d'}}
];
export const nearClothing=p=>!!(p&&!p.interior&&!p.vehicleId&&Math.hypot(p.x-clothingShop.x,p.y-clothingShop.y)<=clothingShop.radius);
