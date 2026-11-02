const PEDIDOS = 'PEDIDOS_MOSTRADOR';
const HISTORIAL = 'HISTORIAL_OPERACIONES';
const TZ = 'America/Argentina/Buenos_Aires';
const HEADERS = ['ID','NUMERO_ORDEN','NOMBRE','APELLIDO','RESUMEN','IMPORTE','OBSERVACIONES','ESTADO','CREADO_POR','FECHA_CREACION','HORA_CREACION','MODIFICADO_POR','FECHA_MODIFICACION','HORA_MODIFICACION','COBRADO_POR','FECHA_COBRO','HORA_COBRO','MEDIO_PAGO'];
const AUDIT_HEADERS = ['ID_OPERACION','ID_PEDIDO','NUMERO_ORDEN','ACCION','USUARIO','FECHA','HORA'];

function doGet(e){return route_(e.parameter.action||'getPedidos',{});}
function doPost(e){const body=JSON.parse(e.postData.contents||'{}');return route_(body.action||e.parameter.action,body);}
function configurarHojas(){setup_();}

function route_(action,body){
  try{
    setup_();let data;
    if(action==='getPedidos')data=getPedidos_();
    else if(action==='getHistorial')data=getPedidos_().filter(p=>p.estado==='COBRADO');
    else if(action==='crearPedido')data=crear_(body);
    else if(action==='actualizarPedido')data=actualizar_(body);
    else if(action==='cobrarPedido')data=cobrar_(body);
    else if(action==='borrarHistorial')data=borrarHistorial_(body);
    else throw new Error('Acción no válida.');
    return json_({ok:true,data:data});
  }catch(err){return json_({ok:false,error:String(err.message||err)});}
}

function setup_(){
  const ss=SpreadsheetApp.getActive();
  let pedidos=ss.getSheetByName(PEDIDOS);
  if(!pedidos)pedidos=ss.insertSheet(PEDIDOS);
  pedidos.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  let historial=ss.getSheetByName(HISTORIAL);
  if(!historial)historial=ss.insertSheet(HISTORIAL);
  historial.getRange(1,1,1,AUDIT_HEADERS.length).setValues([AUDIT_HEADERS]);
}

function getPedidos_(){const sheet=SpreadsheetApp.getActive().getSheetByName(PEDIDOS);if(sheet.getLastRow()<2)return[];return sheet.getRange(2,1,sheet.getLastRow()-1,HEADERS.length).getValues().filter(row=>row[0]).map(rowToPedido_);}

function crear_(body){
  const p=body.pedido;if(!p.nombre||!p.apellido||Number(p.importe)<=0)throw new Error('Faltan campos obligatorios.');
  const numero=String(p.numeroOrden||'').trim();
  if(numero&&getPedidos_().some(x=>String(x.numeroOrden).toLowerCase()===numero.toLowerCase()))throw new Error('La orden #'+numero+' ya existe.');
  const stamp=stamp_(),id=Utilities.getUuid();
  SpreadsheetApp.getActive().getSheetByName(PEDIDOS).appendRow([id,numero,p.nombre,p.apellido,p.resumen||'',Number(p.importe),p.observaciones||'','PENDIENTE',body.puesto,stamp.fecha,stamp.hora,'','','','','','','']);
  audit_(id,numero,'CREACION',body.puesto,stamp);return{id:id};
}

function actualizar_(body){
  const found=find_(body.id),p=body.pedido,numero=String(p.numeroOrden||'').trim();
  if(!p.nombre||!p.apellido||Number(p.importe)<=0)throw new Error('Faltan campos obligatorios.');
  if(numero&&getPedidos_().some(x=>x.id!==body.id&&String(x.numeroOrden).toLowerCase()===numero.toLowerCase()))throw new Error('La orden #'+numero+' ya existe.');
  const stamp=stamp_(),old=found.values;
  found.sheet.getRange(found.row,1,1,HEADERS.length).setValues([[old[0],numero,p.nombre,p.apellido,p.resumen||'',Number(p.importe),p.observaciones||'',old[7],old[8],old[9],old[10],body.puesto,stamp.fecha,stamp.hora,old[14],old[15],old[16],old[17]||'']]);
  audit_(body.id,numero,'EDICION',body.puesto,stamp);return{id:body.id};
}

function cobrar_(body){
  const medio=String(body.medioPago||'').toUpperCase();
  if(medio!=='EFECTIVO'&&medio!=='TRANSFERENCIA')throw new Error('Seleccioná efectivo o transferencia.');
  const found=find_(body.id),stamp=stamp_();
  found.sheet.getRange(found.row,8).setValue('COBRADO');
  found.sheet.getRange(found.row,15,1,4).setValues([[body.puesto,stamp.fecha,stamp.hora,medio]]);
  audit_(body.id,found.values[1],'COBRO',body.puesto,stamp);return{id:body.id};
}

function borrarHistorial_(body){const sheet=SpreadsheetApp.getActive().getSheetByName(PEDIDOS);if(sheet.getLastRow()<2)return{eliminados:0};const estados=sheet.getRange(2,8,sheet.getLastRow()-1,1).getValues();let total=0;for(let i=estados.length-1;i>=0;i--)if(String(estados[i][0])==='COBRADO'){sheet.deleteRow(i+2);total++;}audit_('','','BORRADO_HISTORIAL ('+total+')',body.puesto||'Sistema',stamp_());return{eliminados:total};}
function find_(id){const sheet=SpreadsheetApp.getActive().getSheetByName(PEDIDOS),values=sheet.getDataRange().getValues();for(let i=1;i<values.length;i++)if(String(values[i][0])===String(id))return{sheet:sheet,row:i+1,values:values[i]};throw new Error('Pedido no encontrado.');}
function audit_(id,orden,accion,usuario,stamp){SpreadsheetApp.getActive().getSheetByName(HISTORIAL).appendRow([Utilities.getUuid(),id,orden,accion,usuario,stamp.fecha,stamp.hora]);}
function stamp_(){const now=new Date();return{fecha:Utilities.formatDate(now,TZ,'dd/MM/yyyy'),hora:Utilities.formatDate(now,TZ,'HH:mm')};}
function toIso_(fecha,hora){if(!fecha)return'';const fd=Object.prototype.toString.call(fecha)==='[object Date]'?Utilities.formatDate(fecha,TZ,'dd/MM/yyyy'):String(fecha).trim();const ht=hora?(Object.prototype.toString.call(hora)==='[object Date]'?Utilities.formatDate(hora,TZ,'HH:mm'):String(hora).trim()):'00:00';const parts=fd.split('/');if(parts.length!==3)return String(fecha);return new Date(parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0')+'T'+ht+':00-03:00').toISOString();}
function rowToPedido_(r){return{id:String(r[0]),numeroOrden:String(r[1]||''),nombre:String(r[2]),apellido:String(r[3]),resumen:String(r[4]||''),importe:Number(r[5]),observaciones:String(r[6]||''),estado:String(r[7]),creadoPor:String(r[8]),creadoEn:toIso_(r[9],r[10]),modificadoPor:String(r[11]||''),modificadoEn:toIso_(r[12],r[13]),cobradoPor:String(r[14]||''),cobradoEn:toIso_(r[15],r[16]),medioPago:String(r[17]||'')};}
function json_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}

