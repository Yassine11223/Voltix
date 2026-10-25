(function (window)  {
  'use strict';
    const KEYS= {
  products:'voltix_products',suppliers:'voltix_suppliers',sales:'voltix_sales',users:'voltix_users',session:'voltix_session',movements:'voltix_stock_movements'
  };
    const now=()=>new Date().toISOString();
    const safeArray=(value)=>Array.isArray(value)?value:[];
    const normalizeSku=(value)=>String(value??'').trim().replace(/\s+/g,' ').toUpperCase();
    const normalizeProduct=(product)=>({id:String(product?.id||''),sku:normalizeSku(product?.sku),name:String(product?.name||'Unnamed product'),category:String(product?.category||'Uncategorized'),price:Number(product?.price)||0,stock:Number.isInteger(Number(product?.stock))&&Number(product?.stock)>=0?Number(product.stock):0,supplier:product?.supplier||'',cost:Number(product?.cost)||0,lowStockThreshold:Number.isInteger(Number(product?.lowStockThreshold))&&Number(product?.lowStockThreshold)>=0?Number(product.lowStockThreshold):5,description:String(product?.description||''),status:product?.status==='archived'?'archived':'active',createdAt:product?.createdAt||now(),updatedAt:product?.updatedAt||now()});
    const normalizeSupplier=(supplier)=>({id:String(supplier?.id||''),name:String(supplier?.name||'Unnamed supplier'),contactPerson:String(supplier?.contactPerson||''),phone:String(supplier?.phone||''),email:String(supplier?.email||''),address:String(supplier?.address||''),status:supplier?.status==='inactive'?'inactive':'active',createdAt:supplier?.createdAt||now()});
    const seedAllowed=(key)=>{try{const raw=localStorage.getItem(key);if(raw===null)return true;const parsed=JSON.parse(raw);return Array.isArray(parsed)&&parsed.length===0}catch(error){return false}};
    function read(key,fallback=[]) {
  try {
    const raw=localStorage.getItem(key);
      return raw?JSON.parse(raw):fallback
    }catch(e) {
    return fallback
    }
  }

  function write(key,value) {
  try {
    localStorage.setItem(key,JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('voltix:data-changed', {
      detail: {
        key
        }
      }));
      return true
    }catch(e) {
    return false
    }
  }

  function generateId(prefix) {
  const list=safeArray(prefix==='P'?read(KEYS.products):prefix==='S'?read(KEYS.suppliers):read(KEYS.movements));
    let n=list.length+1;
    let id;
    do {
    id=`${prefix}-${String(n).padStart(4,'0')}`;
      n++
    }while(list.some(x=>x.id===id));
    return id
  }  const categories=['Smartphones','Laptops','Tablets','Accessories','Audio','Gaming','Smart Home','Cameras','Storage','Networking'];
    function seedDataIfEmpty() {
      if(!roleCan('product:write'))return;
      if(seedAllowed(KEYS.suppliers)) {
    const names=[['TechSource Ltd','Maya Hassan','+20 100 555 0101','maya@techsource.example'],['Nova Distribution','Omar Adel','+20 100 555 0102','sales@nova.example'],['Circuit Hub','Lina Samir','+20 100 555 0103','hello@circuithub.example'],['Pixel Partners','Karim Nabil','+20 100 555 0104','orders@pixel.example'],['Orbit Wholesale','Sara Youssef','+20 100 555 0105','team@orbit.example']];
      write(KEYS.suppliers,names.map((x,i)=>( {
      id:`S-${String(i+1).padStart(3,'0')}`,name:x[0],contactPerson:x[1],phone:x[2],email:x[3],address:'Cairo, Egypt',status:'active',createdAt:now()
      })))
    }    if(seedAllowed(KEYS.products)) {
    const specs=[['iPhone 15 128GB','APL-IP15-128','Smartphones',799.99,650,24,5,0],['Galaxy S24','SAM-S24-256','Smartphones',749.99,590,18,5,1],['Pixel 8 Pro','GOO-P8P-128','Smartphones',699.99,530,4,6,3],['MacBook Air M3','APL-MBA-M3','Laptops',1199.99,920,7,3,0],['ThinkPad X1 Carbon','LEN-X1C-G12','Laptops',1399.99,1080,10,3,1],['Surface Pro 10','MS-SURF-P10','Tablets',999.99,760,3,5,2],['iPad Air 11','APL-IPAD-AIR','Tablets',599.99,420,16,4,0],['USB-C Hub 8-in-1','ANK-HUB-8IN1','Accessories',49.99,22,42,10,2],['65W GaN Charger','UGR-GAN-65W','Accessories',39.99,18,8,10,3],['AirPods Pro 2','APL-APP-2','Audio',249.99,175,21,5,0],['WH-1000XM5','SNY-WH1000XM5','Audio',349.99,260,2,4,2],['Nintendo Switch OLED','NIN-SW-OLED','Gaming',349.99,280,8,3,1],['DualSense Wireless','SNY-DS5-WHT','Gaming',69.99,45,35,8,2],['PS5 Slim Disc','SNY-PS5-SLIM','Gaming',499.99,410,0,3,3],['Echo Dot 5th Gen','AMZ-ECHO-DOT5','Smart Home',49.99,28,14,4,4],['Nest Hub 2nd Gen','GOO-NEST-HUB2','Smart Home',99.99,65,5,5,2],['EOS R50 Body','CAN-EOS-R50','Cameras',679.99,530,6,2,3],['GoPro HERO12','GPR-HERO12','Cameras',399.99,300,9,3,4],['SanDisk SSD 1TB','SDK-SSD-1TB','Storage',89.99,55,27,8,0],['Samsung T7 Shield 2TB','SAM-T7-2TB','Storage',179.99,125,3,4,1],['WD Blue 2TB HDD','WDC-BLUE-2TB','Storage',59.99,35,12,4,2],['TP-Link AX3000 Router','TPL-AX3000','Networking',89.99,58,19,5,1],['UniFi Express','UBQ-UNIFI-EXP','Networking',149.99,105,2,3,2],['Cat6 Cable 10m','NET-CAT6-10M','Networking',12.99,6,80,20,0],['Wireless Charging Pad','BEL-WCHG-PAD','Accessories',29.99,15,0,5,3]];
      const products=specs.map((x,i)=>( {
      id:`P-${1001+i}`,sku:x[1],name:x[0],category:x[2],price:x[3],cost:x[4],stock:x[5],lowStockThreshold:x[6],supplier:`S-${String(x[7]+1).padStart(3,'0')}`,description:'',status:'active',createdAt:now(),updatedAt:now()
      }));
      if(!saveProductList(products))return;
      if(seedAllowed(KEYS.movements))write(KEYS.movements,products.map(p=>( {
      id:`M-${String(p.id.slice(2)).padStart(4,'0')}`,productId:p.id,productName:p.name,sku:p.sku,type:'initial',change:p.stock,stockBefore:0,stockAfter:p.stock,reason:'Seed inventory',reference:'',user:'System',date:p.createdAt
      })))
    }
    if(seedAllowed(KEYS.movements)) {
      const products=getProducts();
      if(products.length)write(KEYS.movements,products.map((product,index)=>({
        id:`M-SEED-${String(index+1).padStart(4,'0')}`,productId:product.id,productName:product.name,sku:product.sku,type:'initial',change:product.stock,stockBefore:0,stockAfter:product.stock,reason:'Seed inventory',reference:'',user:'System',date:product.createdAt
      })))
    }
  }

  /** Return normalized products with safe defaults for optional fields. */
  function getProducts() {
  return safeArray(read(KEYS.products)).map(normalizeProduct).filter((product)=>product.id)
  }

  /** Return one normalized product by id. */
  function getProductById(id) {
  return getProducts().find(p=>p.id===id)
  }

  /** Persist the product list without changing shared storage keys. */
  function hasDuplicateSku(list) {
  const seen=new Map();
    for(const product of safeArray(list)) {
    const sku=normalizeSku(product?.sku);
      if(!sku)continue;
      const existing=seen.get(sku);
      if(existing)return {sku,first:existing,second:product};
      seen.set(sku,product)
    }
    return null
  }

  function getSkuConflicts() {
  const groups=new Map();
    getProducts().forEach((product)=>{if(!product.sku)return;const group=groups.get(product.sku)||[];group.push(product);groups.set(product.sku,group)});
    return Array.from(groups,([sku,products])=>({sku,products})).filter((group)=>group.products.length>1)
  }

  function validateSku(sku,id='') {
  const normalized=normalizeSku(sku);
    if(!normalized)return'SKU is required.';
    const conflict=getProducts().find((product)=>product.id!==id&&normalizeSku(product.sku)===normalized);
    return conflict?`SKU '${normalized}' is already used by product ${conflict.id} (${conflict.name}).`:null
  }

  function saveProductList(list) {
  if(!roleCan('product:write'))return false;
    if(!Array.isArray(list))return false;
    const normalized=list.map(normalizeProduct);
    if(hasDuplicateSku(normalized))return false;
    return write(KEYS.products,normalized)
  }

  /** Public compatibility wrapper; all product-list writes still pass the SKU guard. */
  function saveProducts(list) {
    return saveProductList(list)
  }

  /** Return normalized suppliers with safe defaults. */
  function getSuppliers() {
  return safeArray(read(KEYS.suppliers)).map(normalizeSupplier).filter((supplier)=>supplier.id)
  }

  function validateProduct(data,id) {
  const d=data|| {

    };
    if(!String(d.name||'').trim())return'Product name is required.';
    const skuError=validateSku(d.sku,id);
    if(skuError)return skuError;
    if(!(Number(d.price)>0))return'Price must be greater than zero.';
    if(Number(d.cost)<0||!Number.isFinite(Number(d.cost)))return'Cost must be zero or greater.';
    if(!Number.isInteger(Number(d.stock))||Number(d.stock)<0)return'Stock must be a whole number.';
    if(!Number.isInteger(Number(d.lowStockThreshold))||Number(d.lowStockThreshold)<0)return'Threshold must be a whole number.';
    return null
  }

  /** Add a product and its initial movement; returns { ok, error, data }. */
  function addProduct(data) {
  if(!roleCan('product:write'))return {ok:false,error:'You do not have permission to manage products.'};
    const error=validateProduct(data);
    if(error)return {
    ok:false,error
    };
    const product= {
    ...data,id:generateId('P'),sku:normalizeSku(data.sku),price:Number(data.price),cost:Number(data.cost||0),stock:Number(data.stock||0),lowStockThreshold:Number(data.lowStockThreshold||0),status:'active',createdAt:now(),updatedAt:now()
    };
    const list=getProducts();
    list.push(product);
    if(!saveProducts(list))return {ok:false,error:'Product could not be saved.'};
    const movements=safeArray(read(KEYS.movements));
    movements.push( {
    id:generateId('M'),productId:product.id,productName:product.name,sku:product.sku,type:'initial',change:product.stock,stockBefore:0,stockAfter:product.stock,reason:'Initial stock',reference:'',user:getCurrentUser().name,date:now()
    });
    write(KEYS.movements,movements);
    return {
    ok:true,data:product
    }
  }

  /** Update product metadata while preserving current stock. */
  function updateProduct(id,data) {
  if(!roleCan('product:write'))return {ok:false,error:'You do not have permission to manage products.'};
    const old=getProductById(id);
    if(!old)return {
    ok:false,error:'Product not found.'
    };
    const error=validateProduct(data,id);
    if(error)return {
    ok:false,error
    };
    const product= {
    ...old,...data,id,sku:normalizeSku(data.sku),price:Number(data.price),cost:Number(data.cost||0),stock:old.stock,lowStockThreshold:Number(data.lowStockThreshold||0),updatedAt:now()
    };
    const list=getProducts().map(p=>p.id===id?product:p);
    if(!saveProducts(list))return {ok:false,error:'Product could not be saved.'};
    return {
    ok:true,data:product
    }
  }

  /** Toggle a product between active and archived. */
  function archiveProduct(id) {
  if(!roleCan('product:write'))return {ok:false,error:'You do not have permission to archive products.'};
    const p=getProductById(id);
    if(!p)return {
    ok:false,error:'Product not found.'
    };
    return updateRaw(id, {
    status:p.status==='archived'?'active':'archived'
    })
  }

  function updateRaw(id,data) {
  const list=getProducts().map(p=>p.id===id? {
    ...p,...data,updatedAt:now()
    }:p);
    if(!saveProducts(list))return {ok:false,error:'Product could not be saved.'};
    return {
    ok:true,data:getProductById(id)
    }
  }

  /** Delete a product when the current role is allowed to do so. */
  function deleteProduct(id) {
  if(!roleCan('product:delete'))return {ok:false,error:'Only an admin can delete products.'};
    const p=getProductById(id);
    if(!p)return {
    ok:false,error:'Product not found.'
    };
    const movements=safeArray(read(KEYS.movements));
    const date=now();
    const finalMovement={id:generateId('M'),productId:p.id,productName:p.name,sku:p.sku,type:'delete',change:0,stockBefore:p.stock,stockAfter:p.stock,reason:'Product deleted',reference:p.id,user:getCurrentUser().name,date};
    const previous=getProducts();
    if(!saveProducts(previous.filter(x=>x.id!==id)))return {ok:false,error:'Product could not be deleted.'};
    if(!write(KEYS.movements,[...movements,finalMovement])) {
      write(KEYS.products,previous);
      return {ok:false,error:'Product could not be deleted.'};
    }
    return {
    ok:true,data:p
    }
  }

  function addSupplier(data) {
  if(!roleCan('supplier:write'))return {ok:false,error:'You do not have permission to manage suppliers.'};
    const name=String(data.name||'').trim();
    if(!name)return {
    ok:false,error:'Supplier name is required.'
    };
    if(getSuppliers().some(s=>s.name.toLowerCase()===name.toLowerCase()))return {
    ok:false,error:'Supplier name must be unique.'
    };
    const s= {
    ...data,id:generateId('S'),name,status:'active',createdAt:now()
    };
    const list=getSuppliers();
    list.push(s);
    if(!write(KEYS.suppliers,list))return {ok:false,error:'Supplier could not be saved.'};
    return {
    ok:true,data:s
    }
  }

  function updateSupplier(id,data) {
  if(!roleCan('supplier:write'))return {ok:false,error:'You do not have permission to manage suppliers.'};
    const old=getSuppliers().find(s=>s.id===id);
    if(!old)return {
    ok:false,error:'Supplier not found.'
    };
    const s= {
    ...old,...data
    };
    const name=String(s.name||'').trim();
    if(!name)return {
    ok:false,error:'Supplier name is required.'
    };
    if(getSuppliers().some(x=>x.id!==id&&x.name.toLowerCase()===name.toLowerCase()))return {
    ok:false,error:'Supplier name must be unique.'
    };
    s.name=name;
    write(KEYS.suppliers,getSuppliers().map(x=>x.id===id?s:x));
    return {
    ok:true,data:s
    }
  }

  function deleteSupplier(id) {
  if(!roleCan('supplier:delete'))return {ok:false,error:'Only an admin can delete suppliers.'};
    if(getProducts().some(p=>p.supplier===id))return {
    ok:false,error:'Products reference this supplier. Deactivate it instead.'
    };
    write(KEYS.suppliers,getSuppliers().filter(s=>s.id!==id));
    return {
    ok:true
    }
  }

  function getCurrentUser() {
    // KEYS.session is retained for compatibility with existing localStorage data;
    // identity comes only from the shared demo login, rechecked on every action.
    try {
      const session=JSON.parse(window.sessionStorage.getItem('voltix.session'));
      if(!session||!['admin','staff'].includes(session.role))return null;
      if(!['id','name','email'].every((key)=>typeof session[key]==='string'&&session[key].trim()))return null;
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.email))return null;
      return {id:session.id,name:session.name,email:session.email,role:session.role};
    }catch(error){return null}
  }

  function roleCan(action) {
    const user=getCurrentUser();
    if(!user)return false;
    const readActions=['view','product:read','inventory:read','movement:read'];
    const adminActions=['product:write','product:delete','supplier:read','supplier:write','supplier:delete','inventory:supervise','inventory:write','stock:mutate'];
    if(readActions.includes(action))return true;
    // Preserve the existing sale/return helpers for authorized transaction callers.
    if(action==='pos:stock-mutation'||action==='returns:stock-mutation')return true;
    return user.role==='admin'&&adminActions.includes(action)
  }

  /** Apply one stock delta and append one movement record. */
  function adjustStock(productId,change,reason,type='adjust',reference='') {
    if(!roleCan('stock:mutate'))return {ok:false,error:'You do not have permission to change stock.'};
    return applyStockChange(productId,change,reason,type,reference)
  }

  function applyStockChange(productId,change,reason,type,reference) {
    const user=getCurrentUser();
    if(!user)return {ok:false,error:'A valid session is required.'};
    const p=getProductById(productId),delta=Number(change);
    if(!p)return {
    ok:false,error:'Product not found.'
    };
    if(!Number.isInteger(delta)||p.stock+delta<0)return {
    ok:false,error:'Stock cannot fall below zero.'
    };
    const before=p.stock;
    const nextProducts=getProducts().map((product)=>product.id===productId?{...product,stock:before+delta,updatedAt:now()}:product);
    if(!write(KEYS.products,nextProducts))return {ok:false,error:'Stock could not be saved.'};
    const movement= {
    id:generateId('M'),productId,productName:p.name,sku:p.sku,type,change:delta,stockBefore:before,stockAfter:before+delta,reason:reason||'',reference:reference||'',user:user.name,date:now()
    };
    const list=safeArray(read(KEYS.movements));
    list.push(movement);
    write(KEYS.movements,list);
    return {
    ok:true,data:movement
    }
  }

  /** Reduce stock for POS checkout; both Phase 1 roles can complete sales. */
  function reduceStock(id,qty,ref) {
  const quantity=Number(qty);
    if(!Number.isInteger(quantity)||quantity<1)return {ok:false,error:'Sale quantity must be a whole number greater than zero.'};
    if(!roleCan('pos:stock-mutation'))return {ok:false,error:'A valid session is required.'};
    return applyStockChange(id,-quantity,'POS sale','sale',ref)
  }

  /** Increase stock for a return; duplicate return references are rejected. */
  function increaseStock(id,qty,ref) {
  const quantity=Number(qty);
    if(!Number.isInteger(quantity)||quantity<1)return {ok:false,error:'Return quantity must be a whole number greater than zero.'};
    if(ref&&safeArray(read(KEYS.movements)).some((movement)=>movement.type==='return'&&movement.reference===ref))return {ok:false,error:'This return reference was already applied.'};
    if(!roleCan('returns:stock-mutation'))return {ok:false,error:'A valid session is required.'};
    return applyStockChange(id,quantity,'Stock return','return',ref)
  }

  /** Validate and apply a multi-line delivery as one application operation. */
  function receiveDelivery(lines,supplierId,reference,date=new Date().toISOString()) {
  if(!roleCan('inventory:write'))return {ok:false,error:'You do not have permission to receive deliveries.'};
    if(!supplierId||!getSuppliers().some((supplier)=>supplier.id===supplierId))return {ok:false,error:'A valid supplier is required.'};
    if(!Array.isArray(lines)||!lines.length)return {ok:false,error:'At least one delivery line is required.'};
    const ids=lines.map((line)=>line.productId);
    if(new Set(ids).size!==ids.length)return {ok:false,error:'A product may appear only once per delivery.'};
    const products=getProducts();
    const movements=safeArray(read(KEYS.movements));
    const updates=[];
    for(const line of lines){const quantity=Number(line.quantity);const product=products.find((item)=>item.id===line.productId);if(!product||!Number.isInteger(quantity)||quantity<1)return {ok:false,error:'Every delivery line needs a valid product and whole-number quantity.'};updates.push({product,before:product.stock,after:product.stock+quantity,quantity});}
    const nextProducts=products.map((product)=>{const update=updates.find((item)=>item.product.id===product.id);return update?{...product,stock:update.after,updatedAt:now()}:product;});
    const nextMovements=updates.map((update)=>({id:generateId('M'),productId:update.product.id,productName:update.product.name,sku:update.product.sku,type:'receive',change:update.quantity,stockBefore:update.before,stockAfter:update.after,reason:'Delivery received',reference:reference||'',user:getCurrentUser().name,date}));
    if(!write(KEYS.products,nextProducts)||!write(KEYS.movements,[...movements,...nextMovements]))return {ok:false,error:'The delivery could not be saved.'};
    return {ok:true,data:nextMovements}
  }

  function getStockStatus(p) {
  const product=normalizeProduct(p);
    return product.stock===0?'out':product.stock<=product.lowStockThreshold?'low':'in-stock'
  }

  function getLowStockProducts() {
  return getProducts().filter(p=>p.status==='active'&&getStockStatus(p)!=='in-stock')
  }

  function getMovements(filter= {

  }) {
  filter=filter||{};
  const products=getProducts();
  const productById=new Map(products.map((product)=>[product.id,product]));
  const raw=safeArray(read(KEYS.movements));
  let changed=false;
  const enriched=raw.map((movement)=>{
  const product=productById.get(movement.productId);
    if(!movement.productName&&product){movement={...movement,productName:product.name};changed=true}
    if(!movement.sku&&product){movement={...movement,sku:product.sku};changed=true}
    if(!movement.productName&&!product)movement={...movement,productName:`Deleted product (${movement.productId})`,productDeleted:true};
    return movement
  });
    if(changed)try{localStorage.setItem(KEYS.movements,JSON.stringify(enriched))}catch(error){}
  return enriched.filter(m=>!filter.productId||m.productId===filter.productId).filter(m=>!filter.type||m.type===filter.type).filter(m=>!filter.user||String(m.user||'').toLowerCase().includes(String(filter.user).toLowerCase())).sort((a,b)=>new Date(b.date)-new Date(a.date))
  }

  /** Return dashboard totals for active inventory. */
  function getInventorySummary() {
  const products=getProducts().filter((product)=>product.status==='active');
    return {totalProducts:products.filter((product)=>product.status==='active').length,totalUnits:products.reduce((sum,product)=>sum+product.stock,0),lowStockCount:products.filter((product)=>getStockStatus(product)==='low').length,outOfStockCount:products.filter((product)=>getStockStatus(product)==='out').length,inventoryValue:products.reduce((sum,product)=>sum+product.stock*product.cost,0)}
  }

  /** Return stock and value totals grouped by category. */
  function getStockByCategory() {
  const groups={};
    getProducts().filter((product)=>product.status==='active').forEach((product)=>{const category=product.category;groups[category]??={category,products:0,units:0,value:0};groups[category].products+=1;groups[category].units+=product.stock;groups[category].value+=product.stock*product.cost;});
    return Object.values(groups)
  }

  /** Return product counts grouped by supplier id. */
  function getSupplierProductCounts() {
  const counts={};
    getProducts().forEach((product)=>{const key=product.supplier||'unassigned';counts[key]=(counts[key]||0)+1;});
    return counts
  }

  function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', {
    style:'currency',currency:'USD'
    }).format(Number(n)||0)
  }

  function can(action) {
    return roleCan(action)
  }  seedDataIfEmpty();
  window.addEventListener('storage',()=>window.dispatchEvent(new CustomEvent('voltix:data-changed')));
  window.VoltixInventory= {
  getProducts,getProductById,saveProducts,addProduct,updateProduct,archiveProduct,deleteProduct,getSuppliers,addSupplier,updateSupplier,deleteSupplier,adjustStock,reduceStock,increaseStock,receiveDelivery,getLowStockProducts,getStockStatus,getMovements,getInventorySummary,getStockByCategory,getSupplierProductCounts,getSkuConflicts,validateSku,normalizeSku,generateId,seedDataIfEmpty,formatCurrency,can,getCurrentUser,KEYS
  };

})(window);
