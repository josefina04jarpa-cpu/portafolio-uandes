const xlsx=require('xlsx');
const wb=xlsx.utils.book_new();

// sheet Proyectos table
const data1=[['PROY_ID','PROY_NombreProyecto'],['TRATXX15TE01','Tratamiento'],['OTRO_PROJ','Otro']];
const ws1=xlsx.utils.aoa_to_sheet(data1);
ws1['!ref']='A1:B3';
ws1['!tables']=[{name:'Proyectos',ref:'A1:B3',headerRow:1}];
xlsx.utils.book_append_sheet(wb,ws1,'Proyectos');

// sheet Tecnologias table
const data2=[['TECN_ID','TECN_NombreTecnologia'],['T1','Tech1'],['T2','Tech2']];
const ws2=xlsx.utils.aoa_to_sheet(data2);
ws2['!ref']='A1:B3';
ws2['!tables']=[{name:'Tecnologias',ref:'A1:B3',headerRow:1}];
xlsx.utils.book_append_sheet(wb,ws2,'Tecnologias');

const path='data/sample.xlsx';
xlsx.writeFile(wb,path);
console.log('created sample workbook at',path);
