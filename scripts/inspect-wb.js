const xlsx=require('xlsx');
const wb=xlsx.readFile(process.argv[2]);
console.log('keys',Object.keys(wb));
console.log('Workbook props', wb.Workbook ? Object.keys(wb.Workbook) : 'none');
console.log('Tables field', wb.Workbook && wb.Workbook.Tables);
console.log('Names field', wb.Workbook && wb.Workbook.Names);
