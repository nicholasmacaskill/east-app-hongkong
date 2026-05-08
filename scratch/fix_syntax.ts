import fs from 'fs';

['app/components/modals/CreateDrillModal.tsx', 'app/components/modals/DrillDetailsModal.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\\`/g, '`');
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(file, content);
});
console.log("Fixed backticks and dollar signs!");
